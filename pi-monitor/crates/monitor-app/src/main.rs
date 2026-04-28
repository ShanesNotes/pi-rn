use anyhow::{Context, Result, bail};
use eframe::egui::{self, Align2, Color32, FontId, Pos2, Rect, Stroke, Vec2};
use monitor_core::{AlarmSeverity, DisplayModel, MonitorCore, SourceState, WaveformStripModel};
use monitor_ingest::{
    IngestEvent, IngestedFrame, MonotonicClock, ReceiptClock, WatchConfig, read_current_file,
    read_fixture, watch,
};
use monitor_ui::state_label;
use std::path::PathBuf;
use std::sync::mpsc::{self, Receiver};
use std::thread;
use std::time::Duration;

fn main() -> Result<()> {
    let opts = Opts::parse(std::env::args().skip(1).collect())?;
    if opts.help {
        usage();
        return Ok(());
    }
    let native_options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("pi-monitor · live simulation display")
            .with_inner_size([1200.0, 720.0])
            .with_fullscreen(opts.fullscreen),
        ..Default::default()
    };
    eframe::run_native(
        "pi-monitor",
        native_options,
        Box::new(|cc| Ok(Box::new(MonitorApp::new(cc, opts)))),
    )
    .map_err(|err| anyhow::anyhow!(err.to_string()))
}

#[derive(Debug, Clone)]
struct Opts {
    source: PathBuf,
    fullscreen: bool,
    fps: u64,
    fixture_replay: Vec<PathBuf>,
    help: bool,
}

impl Opts {
    fn parse(args: Vec<String>) -> Result<Self> {
        let mut source = PathBuf::from("../pi-sim/vitals/current.json");
        let mut fullscreen = false;
        let mut fps = 30;
        let mut fixture_replay = Vec::new();
        let mut help = false;
        let mut iter = args.into_iter();
        while let Some(arg) = iter.next() {
            match arg.as_str() {
                "--source" => source = iter.next().context("--source needs path")?.into(),
                "--fullscreen" => fullscreen = true,
                "--windowed" => fullscreen = false,
                "--fps" => fps = iter.next().context("--fps needs value")?.parse()?,
                "--fixture-replay" => {
                    fixture_replay.push(iter.next().context("--fixture-replay needs path")?.into())
                }
                "--help" | "-h" | "help" => help = true,
                other => bail!("unknown option {other}"),
            }
        }
        if fps == 0 || fps > 120 {
            bail!("--fps must be between 1 and 120");
        }
        Ok(Self {
            source,
            fullscreen,
            fps,
            fixture_replay,
            help,
        })
    }
}

struct MonitorApp {
    core: MonitorCore,
    rx: Receiver<IngestEvent>,
    clock: MonotonicClock,
    fps: u64,
}

impl MonitorApp {
    fn new(cc: &eframe::CreationContext<'_>, opts: Opts) -> Self {
        cc.egui_ctx.set_visuals(egui::Visuals::dark());
        let (tx, rx) = mpsc::channel();
        let clock = MonotonicClock::default();
        if opts.fixture_replay.is_empty() {
            let source = opts.source.clone();
            let tx_initial = tx.clone();
            let initial_clock = clock.clone();
            let _ = tx_initial.send(read_current_file(&source, &initial_clock));
            thread::spawn(move || {
                let mut config = WatchConfig::new(source);
                config.poll_interval = Duration::from_millis(250);
                config.debounce = Duration::from_millis(60);
                let _ = watch(config, |event| tx.send(event).is_ok());
            });
        } else {
            let fixtures = opts.fixture_replay.clone();
            let replay_clock = clock.clone();
            thread::spawn(move || {
                loop {
                    for fixture in &fixtures {
                        let event = match read_fixture(fixture) {
                            Ok(frame) => IngestEvent::Frame(IngestedFrame {
                                frame,
                                received_millis: replay_clock.now_millis(),
                            }),
                            Err(err) => IngestEvent::InvalidCandidate(err.to_string()),
                        };
                        if tx.send(event).is_err() {
                            return;
                        }
                        thread::sleep(Duration::from_millis(700));
                    }
                }
            });
        }
        Self {
            core: MonitorCore::new(),
            rx,
            clock,
            fps: opts.fps,
        }
    }

    fn drain_events(&mut self) {
        for event in self.rx.try_iter() {
            match event {
                IngestEvent::Frame(frame) => {
                    self.core.accept_frame(frame.frame, frame.received_millis)
                }
                IngestEvent::InvalidCandidate(message) => self.core.mark_invalid(message),
                IngestEvent::Offline(message) => self.core.mark_offline(message),
            }
        }
    }
}

impl eframe::App for MonitorApp {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        self.drain_events();
        let model = self.core.display_model(self.clock.now_millis());
        draw_monitor(ui, &model);
        ui.ctx()
            .request_repaint_after(Duration::from_millis(1_000 / self.fps));
    }
}

fn draw_monitor(ui: &mut egui::Ui, model: &DisplayModel) {
    let rect = ui.max_rect().shrink(18.0);
    let painter = ui.painter_at(rect);
    painter.rect_filled(rect, 18.0, Color32::from_rgb(5, 12, 16));
    painter.rect_stroke(
        rect,
        18.0,
        Stroke::new(2.0, Color32::from_rgb(50, 85, 98)),
        egui::StrokeKind::Outside,
    );

    let header = Rect::from_min_size(
        rect.min + Vec2::new(20.0, 18.0),
        Vec2::new(rect.width() - 40.0, 56.0),
    );
    painter.text(
        header.left_top(),
        Align2::LEFT_TOP,
        &model.title,
        FontId::monospace(30.0),
        Color32::from_rgb(143, 252, 255),
    );
    painter.text(
        header.right_top(),
        Align2::RIGHT_TOP,
        format!("SIM {} · {}", model.sim_time, state_label(model.state)),
        FontId::monospace(24.0),
        state_color(model.state),
    );
    painter.text(
        header.left_bottom() + Vec2::new(0.0, -2.0),
        Align2::LEFT_BOTTOM,
        format!("Source: {}", model.source),
        FontId::monospace(13.0),
        Color32::from_rgb(150, 175, 185),
    );

    let body_top = header.bottom() + 20.0;
    let footer_h = 42.0;
    let alarms_h = 50.0;
    let body = Rect::from_min_max(
        Pos2::new(rect.left() + 20.0, body_top),
        Pos2::new(rect.right() - 20.0, rect.bottom() - footer_h - alarms_h),
    );
    let wave_rect = Rect::from_min_max(
        body.min,
        Pos2::new(body.left() + body.width() * 0.62, body.bottom()),
    );
    let tile_rect = Rect::from_min_max(Pos2::new(wave_rect.right() + 18.0, body.top()), body.max);
    draw_waveforms(&painter, wave_rect, model);
    draw_tiles(&painter, tile_rect, model);

    let alarms_rect = Rect::from_min_max(
        Pos2::new(rect.left() + 20.0, body.bottom() + 12.0),
        Pos2::new(rect.right() - 20.0, body.bottom() + 12.0 + alarms_h),
    );
    draw_alarms(&painter, alarms_rect, model);
    painter.text(
        Pos2::new(rect.left() + 20.0, rect.bottom() - 24.0),
        Align2::LEFT_CENTER,
        &model.footer,
        FontId::monospace(16.0),
        Color32::from_rgb(255, 223, 143),
    );
}

fn draw_waveforms(painter: &egui::Painter, rect: Rect, model: &DisplayModel) {
    painter.rect_stroke(
        rect,
        14.0,
        Stroke::new(1.0, Color32::from_rgb(25, 49, 59)),
        egui::StrokeKind::Inside,
    );
    let rows = model.waveform_strips.iter().take(4).collect::<Vec<_>>();
    let row_h = rect.height() / 4.0;
    for (idx, strip) in rows.iter().enumerate() {
        let row = Rect::from_min_max(
            Pos2::new(rect.left() + 12.0, rect.top() + (idx as f32 * row_h) + 8.0),
            Pos2::new(
                rect.right() - 12.0,
                rect.top() + ((idx + 1) as f32 * row_h) - 8.0,
            ),
        );
        painter.text(
            row.left_top(),
            Align2::LEFT_TOP,
            &strip.signal,
            FontId::monospace(14.0),
            stroke_for(&strip.signal),
        );
        let plot = row.shrink2(Vec2::new(0.0, 18.0));
        painter.line_segment(
            [
                Pos2::new(plot.left(), plot.center().y),
                Pos2::new(plot.right(), plot.center().y),
            ],
            Stroke::new(1.0, Color32::from_rgb(35, 65, 72)),
        );
        if strip.available {
            draw_strip_polyline(painter, plot, strip);
        } else {
            painter.text(
                plot.center(),
                Align2::CENTER_CENTER,
                &strip.message,
                FontId::monospace(15.0),
                Color32::from_rgb(125, 145, 154),
            );
        }
    }
    if rows.is_empty() {
        painter.text(
            rect.center(),
            Align2::CENTER_CENTER,
            &model.waveform_message,
            FontId::monospace(18.0),
            Color32::from_rgb(125, 145, 154),
        );
    }
}

fn draw_strip_polyline(painter: &egui::Painter, rect: Rect, strip: &WaveformStripModel) {
    let range = (strip.max - strip.min).abs().max(1e-9);
    let denom = strip.values.len().saturating_sub(1).max(1) as f32;
    let points = strip
        .values
        .iter()
        .enumerate()
        .map(|(idx, value)| {
            let x = rect.left() + ((idx as f32 / denom) * rect.width());
            let normalized = ((*value - strip.min) / range).clamp(0.0, 1.0) as f32;
            let y = rect.bottom() - (normalized * rect.height());
            Pos2::new(x, y)
        })
        .collect::<Vec<_>>();
    painter.add(egui::Shape::line(
        points,
        Stroke::new(2.0, stroke_for(&strip.signal)),
    ));
}

fn draw_tiles(painter: &egui::Painter, rect: Rect, model: &DisplayModel) {
    let cols = 2;
    let rows = 3;
    let gap = 12.0;
    let tile_w = (rect.width() - gap) / cols as f32;
    let tile_h = (rect.height() - (gap * (rows as f32 - 1.0))) / rows as f32;
    for (idx, tile) in model.numeric_tiles.iter().enumerate() {
        let col = idx % cols;
        let row = idx / cols;
        let tile_rect = Rect::from_min_size(
            Pos2::new(
                rect.left() + col as f32 * (tile_w + gap),
                rect.top() + row as f32 * (tile_h + gap),
            ),
            Vec2::new(tile_w, tile_h),
        );
        painter.rect_filled(tile_rect, 12.0, Color32::from_rgb(7, 16, 21));
        painter.rect_stroke(
            tile_rect,
            12.0,
            Stroke::new(1.0, Color32::from_rgb(36, 66, 78)),
            egui::StrokeKind::Inside,
        );
        painter.text(
            tile_rect.left_top() + Vec2::new(12.0, 10.0),
            Align2::LEFT_TOP,
            &tile.label,
            FontId::monospace(16.0),
            Color32::from_rgb(122, 200, 216),
        );
        painter.text(
            tile_rect.center(),
            Align2::CENTER_CENTER,
            &tile.value,
            FontId::monospace(42.0),
            if tile.available {
                Color32::from_rgb(117, 255, 139)
            } else {
                Color32::from_rgb(103, 119, 125)
            },
        );
        painter.text(
            tile_rect.right_bottom() - Vec2::new(12.0, 10.0),
            Align2::RIGHT_BOTTOM,
            &tile.unit,
            FontId::monospace(14.0),
            Color32::from_rgb(183, 203, 211),
        );
    }
}

fn draw_alarms(painter: &egui::Painter, rect: Rect, model: &DisplayModel) {
    let text = if !model.alarm_feed_available {
        "ALARM FEED UNAVAILABLE".to_string()
    } else if model.alarms.is_empty() {
        "No active frame-provided alarms".to_string()
    } else {
        model
            .alarms
            .iter()
            .map(|alarm| alarm.label.as_str())
            .collect::<Vec<_>>()
            .join("  ·  ")
    };
    let severity = model
        .alarms
        .iter()
        .map(|alarm| alarm.severity)
        .next()
        .unwrap_or(AlarmSeverity::Info);
    painter.rect_filled(
        rect,
        10.0,
        alarm_color(severity, model.alarm_feed_available),
    );
    painter.text(
        rect.center(),
        Align2::CENTER_CENTER,
        text,
        FontId::monospace(19.0),
        Color32::WHITE,
    );
}

fn state_color(state: SourceState) -> Color32 {
    match state {
        SourceState::Fresh => Color32::from_rgb(117, 255, 139),
        SourceState::Stale => Color32::from_rgb(255, 209, 102),
        SourceState::Offline => Color32::from_rgb(255, 92, 92),
        SourceState::Invalid => Color32::from_rgb(255, 122, 182),
        SourceState::Paused => Color32::from_rgb(138, 180, 255),
    }
}

fn stroke_for(signal: &str) -> Color32 {
    match signal {
        "ECG_LeadII" | "ECG" => Color32::from_rgb(117, 255, 139),
        "Pleth" => Color32::from_rgb(81, 209, 255),
        "ArterialPressure" | "ABP" => Color32::from_rgb(255, 92, 92),
        "CO2" => Color32::from_rgb(255, 209, 102),
        _ => Color32::from_rgb(143, 252, 255),
    }
}

fn alarm_color(severity: AlarmSeverity, available: bool) -> Color32 {
    if !available {
        return Color32::from_rgb(77, 49, 64);
    }
    match severity {
        AlarmSeverity::Critical => Color32::from_rgb(138, 16, 16),
        AlarmSeverity::Warning => Color32::from_rgb(138, 106, 16),
        AlarmSeverity::Info => Color32::from_rgb(40, 55, 69),
    }
}

fn usage() {
    eprintln!(
        "pi-monitor native kiosk\n\nOptions:\n  --source <current.json>\n  --fullscreen | --windowed\n  --fps <1-120>\n  --fixture-replay <fixture.json>  (repeatable)\n"
    );
}
