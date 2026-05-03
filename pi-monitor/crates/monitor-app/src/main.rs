use anyhow::{Context, Result, bail};
use eframe::egui::{self, Align2, Color32, FontId, Pos2, Rect, Stroke, Vec2};
use monitor_core::{AlarmSeverity, DisplayModel, MonitorCore, SourceState, WaveformStripModel};
use monitor_ingest::{
    IngestEvent, IngestedFrame, MonotonicClock, ReceiptClock, WatchConfig, read_current_file,
    read_fixture, read_vitals_dir, watch, watch_live_tcp, watch_vitals_dir,
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
            .with_inner_size([1360.0, 768.0])
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
    source: Option<PathBuf>,
    source_dir: Option<PathBuf>,
    fullscreen: bool,
    fps: u64,
    fixture_replay: Vec<PathBuf>,
    fixture_dir_replay: Vec<PathBuf>,
    live_tcp: Option<String>,
    help: bool,
}

impl Opts {
    fn parse(args: Vec<String>) -> Result<Self> {
        let mut source = None;
        let mut source_dir = None;
        let mut fullscreen = false;
        let mut fps = 60;
        let mut fixture_replay = Vec::new();
        let mut fixture_dir_replay = Vec::new();
        let mut live_tcp = None;
        let mut help = false;
        let mut iter = args.into_iter();
        while let Some(arg) = iter.next() {
            match arg.as_str() {
                "--source" => source = Some(iter.next().context("--source needs path")?.into()),
                "--source-dir" => {
                    source_dir = Some(iter.next().context("--source-dir needs path")?.into())
                }
                "--fullscreen" => fullscreen = true,
                "--windowed" => fullscreen = false,
                "--fps" => fps = iter.next().context("--fps needs value")?.parse()?,
                "--fixture-replay" => {
                    fixture_replay.push(iter.next().context("--fixture-replay needs path")?.into())
                }
                "--fixture-dir-replay" => fixture_dir_replay.push(
                    iter.next()
                        .context("--fixture-dir-replay needs path")?
                        .into(),
                ),
                "--live-tcp" => live_tcp = Some(iter.next().context("--live-tcp needs host:port")?),
                "--help" | "-h" | "help" => help = true,
                other => bail!("unknown option {other}"),
            }
        }
        if fps == 0 || fps > 120 {
            bail!("--fps must be between 1 and 120");
        }
        let source_modes = [
            source.is_some(),
            source_dir.is_some(),
            !fixture_replay.is_empty(),
            !fixture_dir_replay.is_empty(),
            live_tcp.is_some(),
        ]
        .into_iter()
        .filter(|enabled| *enabled)
        .count();
        if source_modes > 1 {
            bail!(
                "choose only one of --source, --source-dir, --fixture-replay, --fixture-dir-replay, or --live-tcp"
            );
        }
        if source_modes == 0 {
            source = Some(PathBuf::from("../pi-sim/vitals/current.json"));
        }
        Ok(Self {
            source,
            source_dir,
            fullscreen,
            fps,
            fixture_replay,
            fixture_dir_replay,
            live_tcp,
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
        if let Some(addr) = opts.live_tcp.clone() {
            thread::spawn(move || {
                let result = watch_live_tcp(&addr, |event| tx.send(event).is_ok());
                if let Err(err) = result {
                    let _ = tx.send(IngestEvent::Offline(format!(
                        "live TCP unavailable at {addr}: {err}"
                    )));
                }
            });
        } else if let Some(source_dir) = opts.source_dir.clone() {
            let tx_initial = tx.clone();
            let initial_clock = clock.clone();
            let _ = tx_initial.send(read_vitals_dir(&source_dir, &initial_clock));
            thread::spawn(move || {
                let mut config = WatchConfig::new(source_dir);
                config.poll_interval = Duration::from_millis(250);
                config.debounce = Duration::from_millis(60);
                let _ = watch_vitals_dir(config, |event| tx.send(event).is_ok());
            });
        } else if !opts.fixture_dir_replay.is_empty() {
            let fixture_dirs = opts.fixture_dir_replay.clone();
            let replay_clock = clock.clone();
            thread::spawn(move || {
                loop {
                    for fixture_dir in &fixture_dirs {
                        let event = read_vitals_dir(fixture_dir, &replay_clock);
                        if tx.send(event).is_err() {
                            return;
                        }
                        thread::sleep(Duration::from_millis(700));
                    }
                }
            });
        } else if opts.fixture_replay.is_empty() {
            let source = opts
                .source
                .clone()
                .unwrap_or_else(|| PathBuf::from("../pi-sim/vitals/current.json"));
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
                            Ok(frame) => IngestEvent::Frame(Box::new(IngestedFrame {
                                frame,
                                received_millis: replay_clock.now_millis(),
                            })),
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
                IngestEvent::VitalsSnapshot(snapshot) => self
                    .core
                    .accept_frame(snapshot.snapshot.frame, snapshot.received_millis),
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
    let stage = ui.max_rect();
    let painter = ui.painter_at(stage);
    painter.rect_filled(stage, 0.0, warm_bg());

    let rect = stage.shrink(9.0);
    painter.rect_filled(rect, 5.0, Color32::from_rgb(251, 250, 246));
    painter.rect_stroke(
        rect,
        5.0,
        Stroke::new(1.0, Color32::from_rgb(210, 204, 193)),
        egui::StrokeKind::Outside,
    );

    let scale = rect.width() / 2020.0;
    let header_h = 60.0 * scale;
    let footer_h = 124.0 * scale;
    let header = Rect::from_min_max(rect.min, Pos2::new(rect.right(), rect.top() + header_h));
    let footer = Rect::from_min_max(Pos2::new(rect.left(), rect.bottom() - footer_h), rect.max);
    let main = Rect::from_min_max(
        Pos2::new(rect.left(), header.bottom()),
        Pos2::new(rect.right(), footer.top()),
    );
    let right_w = 522.0 * scale;
    let waves = Rect::from_min_max(main.min, Pos2::new(main.right() - right_w, main.bottom()));
    let numerics = Rect::from_min_max(Pos2::new(waves.right(), main.top()), main.max);

    draw_header(&painter, header, model, scale);
    draw_reference_waveforms(&painter, waves, model, scale);
    draw_reference_tiles(&painter, numerics, model, scale);
    draw_footer(&painter, footer, model, scale);
}

fn draw_header(painter: &egui::Painter, rect: Rect, model: &DisplayModel, scale: f32) {
    painter.rect_filled(rect, 0.0, Color32::from_rgb(252, 250, 246));
    line(painter, rect.left_bottom(), rect.right_bottom());
    let y = rect.center().y;
    let f = FontId::proportional(20.0 * scale);
    let dot = Pos2::new(rect.left() + 36.0 * scale, y);
    painter.circle_filled(dot, 8.0 * scale, state_dot_color(model.state));
    let mut x = rect.left() + 62.0 * scale;
    for text in [live_label(model.state), "SIM", "DEMO", "NOT CHARTED"] {
        painter.text(
            Pos2::new(x, y),
            Align2::LEFT_CENTER,
            text,
            f.clone(),
            text_color(),
        );
        x += text_width(text, 20.0 * scale) + 22.0 * scale;
        if text != "NOT CHARTED" {
            painter.line_segment(
                [
                    Pos2::new(x, y - 15.0 * scale),
                    Pos2::new(x, y + 15.0 * scale),
                ],
                Stroke::new(1.0, line_color()),
            );
            x += 22.0 * scale;
        }
    }
    painter.text(
        Pos2::new(rect.center().x - 40.0 * scale, y),
        Align2::RIGHT_CENTER,
        "SIM DEMO",
        f.clone(),
        text_color(),
    );
    painter.line_segment(
        [
            Pos2::new(rect.center().x - 12.0 * scale, y - 15.0 * scale),
            Pos2::new(rect.center().x - 12.0 * scale, y + 15.0 * scale),
        ],
        Stroke::new(1.0, line_color()),
    );
    painter.text(
        Pos2::new(rect.center().x + 18.0 * scale, y),
        Align2::LEFT_CENTER,
        "NO CHART ID",
        f.clone(),
        text_color(),
    );
    let time = model
        .wall_time
        .as_deref()
        .and_then(clock_time)
        .unwrap_or_else(|| "--:--:--".to_string());
    painter.text(
        Pos2::new(rect.right() - 28.0 * scale, y),
        Align2::RIGHT_CENTER,
        time,
        f.clone(),
        text_color(),
    );
    draw_battery(painter, Pos2::new(rect.right() - 145.0 * scale, y), scale);
    draw_signal(painter, Pos2::new(rect.right() - 205.0 * scale, y), scale);
    painter.text(
        Pos2::new(rect.right() - 235.0 * scale, y),
        Align2::RIGHT_CENTER,
        "WAVE NIBP",
        f,
        text_color(),
    );
}

fn draw_reference_waveforms(painter: &egui::Painter, rect: Rect, model: &DisplayModel, scale: f32) {
    painter.rect_filled(rect, 0.0, panel_bg());
    painter.rect_stroke(
        rect,
        0.0,
        Stroke::new(1.0, line_color()),
        egui::StrokeKind::Inside,
    );
    let specs = [
        WaveSpec::ecg(),
        WaveSpec::abp(),
        WaveSpec::pleth(),
        WaveSpec::resp(),
    ];
    let row_h = rect.height() / 4.0;
    for (idx, spec) in specs.iter().enumerate() {
        let row = Rect::from_min_max(
            Pos2::new(rect.left(), rect.top() + idx as f32 * row_h),
            Pos2::new(rect.right(), rect.top() + (idx as f32 + 1.0) * row_h),
        );
        if idx > 0 {
            line(painter, row.left_top(), row.right_top());
        }
        draw_wave_panel(painter, row, spec, find_strip(model, spec.signal), scale);
    }
}

fn draw_wave_panel(
    painter: &egui::Painter,
    rect: Rect,
    spec: &WaveSpec,
    strip: Option<&WaveformStripModel>,
    scale: f32,
) {
    painter.text(
        rect.left_top() + Vec2::new(24.0 * scale, 22.0 * scale),
        Align2::LEFT_TOP,
        spec.label,
        FontId::proportional(26.0 * scale),
        spec.color,
    );
    painter.text(
        rect.left_top() + Vec2::new(26.0 * scale, 60.0 * scale),
        Align2::LEFT_TOP,
        spec.unit,
        FontId::proportional(20.0 * scale),
        spec.color,
    );
    painter.text(
        rect.right_top() + Vec2::new(-32.0 * scale, 26.0 * scale),
        Align2::RIGHT_TOP,
        spec.right_label,
        FontId::proportional(22.0 * scale),
        spec.color,
    );
    let plot = Rect::from_min_max(
        rect.left_top() + Vec2::new(152.0 * scale, 22.0 * scale),
        rect.right_bottom()
            - Vec2::new(
                32.0 * scale,
                if spec.time_axis { 55.0 } else { 32.0 } * scale,
            ),
    );
    draw_reference_grid(painter, plot);
    let tick_top = plot.top();
    let tick_h = plot.height();
    let tick_count = (spec.ticks.len().saturating_sub(1).max(1)) as f32;
    for (idx, tick) in spec.ticks.iter().enumerate() {
        let y = tick_top + tick_h * idx as f32 / tick_count;
        painter.text(
            Pos2::new(rect.left() + 133.0 * scale, y),
            Align2::RIGHT_CENTER,
            *tick,
            FontId::proportional(19.0 * scale),
            spec.color,
        );
    }
    let axis_x = rect.left() + 136.0 * scale;
    painter.line_segment(
        [
            Pos2::new(axis_x, plot.top()),
            Pos2::new(axis_x, plot.bottom()),
        ],
        Stroke::new(1.0, Color32::from_rgb(201, 195, 184)),
    );
    if let Some(strip) = strip {
        if strip.available {
            draw_strip_polyline_fixed(painter, plot, strip, spec);
        } else {
            painter.text(
                plot.center(),
                Align2::CENTER_CENTER,
                &strip.message,
                FontId::proportional(18.0 * scale),
                Color32::from_rgb(135, 139, 139),
            );
        }
    } else {
        painter.text(
            plot.center(),
            Align2::CENTER_CENTER,
            format!("{} waveform feed unavailable", spec.label),
            FontId::proportional(18.0 * scale),
            Color32::from_rgb(135, 139, 139),
        );
    }
    if spec.time_axis {
        painter.line_segment(
            [
                Pos2::new(plot.left(), rect.bottom() - 28.0 * scale),
                Pos2::new(plot.right(), rect.bottom() - 28.0 * scale),
            ],
            Stroke::new(1.0, Color32::from_rgb(188, 182, 173)),
        );
        let window_s = strip
            .map(|strip| strip.visible_window_s as f32)
            .unwrap_or(12.0)
            .max(1.0);
        for frac in [0.0_f32, 0.2, 0.4, 0.6, 0.8, 1.0] {
            let label = time_axis_label(window_s, frac);
            painter.text(
                Pos2::new(
                    plot.left() + plot.width() * frac,
                    rect.bottom() - 10.0 * scale,
                ),
                Align2::CENTER_CENTER,
                label,
                FontId::proportional(19.0 * scale),
                Color32::from_rgb(83, 92, 98),
            );
        }
    }
}

fn draw_reference_grid(painter: &egui::Painter, rect: Rect) {
    let minor = Stroke::new(0.7, Color32::from_rgba_unmultiplied(233, 227, 217, 180));
    let major = Stroke::new(0.9, Color32::from_rgba_unmultiplied(226, 221, 212, 220));
    for idx in 0..=48 {
        let x = rect.left() + rect.width() * idx as f32 / 48.0;
        painter.line_segment(
            [Pos2::new(x, rect.top()), Pos2::new(x, rect.bottom())],
            if idx % 4 == 0 { major } else { minor },
        );
    }
    for idx in 0..=8 {
        let y = rect.top() + rect.height() * idx as f32 / 8.0;
        painter.line_segment(
            [Pos2::new(rect.left(), y), Pos2::new(rect.right(), y)],
            if idx % 2 == 0 { major } else { minor },
        );
    }
}

fn draw_strip_polyline_fixed(
    painter: &egui::Painter,
    rect: Rect,
    strip: &WaveformStripModel,
    spec: &WaveSpec,
) {
    let (min, max) = waveform_axis(strip, spec);
    let range = (max - min).abs().max(1e-9);
    let window_s = (strip.visible_window_s as f32).max(1.0);
    let cursor_phase = positive_mod(strip.sweep_now_s as f32, window_s) / window_s;
    let erase_half_width = 0.012_f32;
    let mut segment: Vec<Pos2> = Vec::new();
    let mut previous_x: Option<f32> = None;
    let mut previous_t: Option<f64> = None;
    let max_gap_s = if strip.sample_rate_hz > 0.0 {
        2.5 / strip.sample_rate_hz
    } else {
        f64::INFINITY
    };

    let draw_segment = |painter: &egui::Painter, segment: &mut Vec<Pos2>| {
        if segment.len() >= 2 {
            let points = std::mem::take(segment);
            painter.add(egui::Shape::line(
                points.clone(),
                Stroke::new(5.0, trace_glow(spec.color)),
            ));
            painter.add(egui::Shape::line(points, Stroke::new(2.0, spec.color)));
        } else {
            segment.clear();
        }
    };

    for (idx, value) in strip.values.iter().enumerate() {
        let t_s = strip
            .sample_times_s
            .get(idx)
            .copied()
            .unwrap_or(strip.t0_s + idx as f64 / strip.sample_rate_hz.max(1.0));
        if t_s < strip.sweep_now_s - strip.visible_window_s - 0.001
            || t_s > strip.sweep_now_s + 0.001
        {
            continue;
        }
        let phase = positive_mod(t_s as f32, window_s) / window_s;
        if circular_distance(phase, cursor_phase) < erase_half_width {
            draw_segment(painter, &mut segment);
            previous_x = None;
            previous_t = None;
            continue;
        }
        let x = rect.left() + phase * rect.width();
        let normalized = ((*value as f32 - min) / range).clamp(0.0, 1.0);
        let y = rect.bottom() - normalized * rect.height();
        if previous_x.map(|prev| x + 1.0 < prev).unwrap_or(false)
            || previous_t
                .map(|prev| t_s - prev > max_gap_s)
                .unwrap_or(false)
        {
            draw_segment(painter, &mut segment);
        }
        segment.push(Pos2::new(x, y));
        previous_x = Some(x);
        previous_t = Some(t_s);
    }
    draw_segment(painter, &mut segment);

    let cursor_x = rect.left() + cursor_phase * rect.width();
    let gap = 7.0;
    painter.rect_filled(
        Rect::from_min_max(
            Pos2::new(cursor_x - gap, rect.top()),
            Pos2::new(cursor_x + gap, rect.bottom()),
        ),
        0.0,
        Color32::from_rgba_unmultiplied(252, 251, 248, 210),
    );
    painter.line_segment(
        [
            Pos2::new(cursor_x, rect.top()),
            Pos2::new(cursor_x, rect.bottom()),
        ],
        Stroke::new(1.5, Color32::from_rgba_unmultiplied(45, 52, 56, 170)),
    );
}

fn draw_reference_tiles(painter: &egui::Painter, rect: Rect, model: &DisplayModel, scale: f32) {
    painter.rect_filled(rect, 0.0, panel_bg());
    let bp = tile_value(model, "BP/MAP").unwrap_or_else(|| "--- (--)".to_string());
    let (nibp, map) = split_bp_map(&bp);
    let rows = [174.0, 169.0, 156.0, 156.0, 142.0, 127.0];
    let mut y = rect.top();
    for (idx, raw_h) in rows.iter().enumerate() {
        let h = raw_h * scale;
        let card = Rect::from_min_max(
            Pos2::new(rect.left(), y),
            Pos2::new(
                rect.right(),
                if idx == rows.len() - 1 {
                    rect.bottom()
                } else {
                    y + h
                },
            ),
        );
        draw_tile_card(painter, card, idx, model, &nibp, &map, scale);
        y += h;
    }
}

fn draw_tile_card(
    painter: &egui::Painter,
    rect: Rect,
    idx: usize,
    model: &DisplayModel,
    nibp: &str,
    map: &str,
    scale: f32,
) {
    if idx > 0 {
        line(painter, rect.left_top(), rect.right_top());
    }
    match idx {
        0 => {
            draw_label_unit(painter, rect, "HR", "bpm", green(), scale);
            draw_big(
                painter,
                rect,
                tile_value(model, "HR").unwrap_or_else(unavailable_value),
                green(),
                96.0,
                Vec2::new(128.0, 52.0),
                scale,
            );
            draw_limits(
                painter,
                rect,
                ["120", "50"],
                122.0,
                86.0,
                text_color(),
                scale,
            );
            painter.text(
                rect.right_top() + Vec2::new(-31.0 * scale, 84.0 * scale),
                Align2::RIGHT_CENTER,
                "PVC\n--",
                FontId::proportional(19.0 * scale),
                green(),
            );
        }
        1 => {
            draw_label_unit(painter, rect, "NIBP", "mmHg", red(), scale);
            draw_big(
                painter,
                rect,
                nibp,
                red(),
                72.0,
                Vec2::new(67.0, 70.0),
                scale,
            );
            painter.text(
                rect.right_top() + Vec2::new(-145.0 * scale, 72.0 * scale),
                Align2::LEFT_CENTER,
                "MAP",
                FontId::proportional(25.0 * scale),
                red(),
            );
            painter.text(
                rect.right_top() + Vec2::new(-145.0 * scale, 112.0 * scale),
                Align2::LEFT_CENTER,
                map,
                FontId::proportional(48.0 * scale),
                red(),
            );
            painter.text(
                rect.left_bottom() + Vec2::new(25.0 * scale, -28.0 * scale),
                Align2::LEFT_CENTER,
                "not charted",
                FontId::proportional(18.0 * scale),
                text_color(),
            );
            draw_limits(
                painter,
                rect,
                ["120", "80"],
                31.0,
                104.0,
                text_color(),
                scale,
            );
        }
        2 => {
            draw_label_unit(painter, rect, "SpO₂", "%", teal(), scale);
            draw_big(
                painter,
                rect,
                tile_value(model, "SpO2").unwrap_or_else(unavailable_value),
                teal(),
                76.0,
                Vec2::new(138.0, 74.0),
                scale,
            );
            draw_limits(painter, rect, ["100", "90"], 129.0, 74.0, teal(), scale);
            draw_indicator(painter, rect, teal(), scale);
        }
        3 => {
            draw_label_unit(painter, rect, "RR", "br/min", amber(), scale);
            draw_big(
                painter,
                rect,
                tile_value(model, "RR").unwrap_or_else(unavailable_value),
                amber(),
                76.0,
                Vec2::new(138.0, 74.0),
                scale,
            );
            draw_limits(painter, rect, ["30", "8"], 129.0, 74.0, amber(), scale);
            draw_indicator(painter, rect, amber(), scale);
        }
        4 => {
            draw_label_unit(painter, rect, "TEMP", "°C", green(), scale);
            draw_big(
                painter,
                rect,
                tile_value(model, "TEMP").unwrap_or_else(unavailable_value),
                green(),
                72.0,
                Vec2::new(137.0, 65.0),
                scale,
            );
            draw_limits(painter, rect, ["38.0", "36.0"], 107.0, 52.0, green(), scale);
        }
        _ => {}
    }
}

fn draw_label_unit(
    painter: &egui::Painter,
    rect: Rect,
    label: &str,
    unit: &str,
    color: Color32,
    scale: f32,
) {
    painter.text(
        rect.left_top() + Vec2::new(25.0 * scale, 26.0 * scale),
        Align2::LEFT_CENTER,
        label,
        FontId::proportional(26.0 * scale),
        color,
    );
    painter.text(
        rect.left_top() + Vec2::new(92.0 * scale, 26.0 * scale),
        Align2::LEFT_CENTER,
        unit,
        FontId::proportional(18.0 * scale),
        muted(),
    );
}

fn draw_big(
    painter: &egui::Painter,
    rect: Rect,
    value: impl AsRef<str>,
    color: Color32,
    size: f32,
    offset: Vec2,
    scale: f32,
) {
    painter.text(
        rect.left_top() + offset * scale,
        Align2::LEFT_CENTER,
        value.as_ref(),
        FontId::proportional(size * scale),
        color,
    );
}

fn draw_limits(
    painter: &egui::Painter,
    rect: Rect,
    values: [&str; 2],
    right: f32,
    top: f32,
    color: Color32,
    scale: f32,
) {
    let x = rect.right() - right * scale;
    let y = rect.top() + top * scale;
    painter.text(
        Pos2::new(x, y),
        Align2::CENTER_CENTER,
        values[0],
        FontId::proportional(18.0 * scale),
        color,
    );
    painter.line_segment(
        [
            Pos2::new(x - 15.0 * scale, y + 18.0 * scale),
            Pos2::new(x + 15.0 * scale, y + 18.0 * scale),
        ],
        Stroke::new(1.0, Color32::from_rgb(189, 183, 172)),
    );
    painter.text(
        Pos2::new(x, y + 36.0 * scale),
        Align2::CENTER_CENTER,
        values[1],
        FontId::proportional(18.0 * scale),
        color,
    );
}

fn draw_indicator(painter: &egui::Painter, rect: Rect, color: Color32, scale: f32) {
    let bar = Rect::from_min_size(
        rect.right_top() + Vec2::new(-54.0 * scale, 43.0 * scale),
        Vec2::new(13.0 * scale, 76.0 * scale),
    );
    painter.rect_filled(bar, 0.0, Color32::from_rgb(217, 215, 208));
    painter.rect_filled(
        Rect::from_min_max(
            Pos2::new(bar.left(), bar.bottom() - 31.0 * scale),
            bar.right_bottom(),
        ),
        0.0,
        color,
    );
}

fn draw_footer(painter: &egui::Painter, rect: Rect, model: &DisplayModel, scale: f32) {
    painter.rect_filled(rect, 0.0, Color32::from_rgb(250, 248, 243));
    line(painter, rect.left_top(), rect.right_top());
    let widths = [330.0, 360.0, 335.0, 331.0, 331.0, 333.0];
    let mut x = rect.left();
    for (idx, w) in widths.iter().enumerate() {
        let section = Rect::from_min_max(
            Pos2::new(x, rect.top()),
            Pos2::new(
                if idx == widths.len() - 1 {
                    rect.right()
                } else {
                    x + w * scale
                },
                rect.bottom(),
            ),
        );
        draw_footer_section(painter, section, idx, model, scale);
        x += w * scale;
        if idx < widths.len() - 1 {
            painter.line_segment(
                [
                    Pos2::new(x, rect.top() + 25.0 * scale),
                    Pos2::new(x, rect.bottom() - 25.0 * scale),
                ],
                Stroke::new(1.0, line_color()),
            );
        }
    }
}

fn draw_footer_section(
    painter: &egui::Painter,
    rect: Rect,
    idx: usize,
    model: &DisplayModel,
    scale: f32,
) {
    match idx {
        0 => {
            painter.text(
                rect.left_center() + Vec2::new(52.0 * scale, 0.0),
                Align2::CENTER_CENTER,
                "△",
                FontId::proportional(34.0 * scale),
                amber(),
            );
            painter.text(
                rect.left_center() + Vec2::new(92.0 * scale, 0.0),
                Align2::LEFT_CENTER,
                alarm_footer_label(model),
                FontId::proportional(19.0 * scale),
                alarm_footer_color(model),
            );
            painter.text(
                rect.left_center() + Vec2::new(205.0 * scale, 0.0),
                Align2::LEFT_CENTER,
                alarm_footer_detail(model),
                FontId::proportional(22.0 * scale),
                alarm_footer_color(model),
            );
        }
        1 => {
            painter.text(
                rect.left_center() + Vec2::new(33.0 * scale, 0.0),
                Align2::LEFT_CENTER,
                "NIBP\nINTERVAL",
                FontId::proportional(19.0 * scale),
                text_color(),
            );
            painter.text(
                rect.left_center() + Vec2::new(145.0 * scale, 0.0),
                Align2::LEFT_CENTER,
                "--",
                FontId::proportional(22.0 * scale),
                dark(),
            );
        }
        2 => {
            painter.text(
                rect.left_center() + Vec2::new(33.0 * scale, 0.0),
                Align2::LEFT_CENTER,
                "PRIORITY\nUNSET",
                FontId::proportional(19.0 * scale),
                text_color(),
            );
        }
        3 => {
            painter.text(
                rect.center() + Vec2::new(-10.0 * scale, 0.0),
                Align2::CENTER_CENTER,
                "▧   TRENDS",
                FontId::proportional(19.0 * scale),
                text_color(),
            );
        }
        4 => {
            painter.text(
                rect.center(),
                Align2::CENTER_CENTER,
                "▤   EVENTS",
                FontId::proportional(19.0 * scale),
                text_color(),
            );
        }
        _ => {
            painter.text(
                rect.center(),
                Align2::CENTER_CENTER,
                "⚙   SETUP",
                FontId::proportional(19.0 * scale),
                text_color(),
            );
        }
    }
}

struct WaveSpec {
    signal: &'static str,
    label: &'static str,
    unit: &'static str,
    right_label: &'static str,
    ticks: &'static [&'static str],
    axis_min: f32,
    axis_max: f32,
    color: Color32,
    time_axis: bool,
}
impl WaveSpec {
    fn ecg() -> Self {
        Self {
            signal: "ECG_LeadII",
            label: "ECG II",
            unit: "1 mV",
            right_label: "HR",
            ticks: &["1", "0", "-1"],
            axis_min: -1.15,
            axis_max: 1.15,
            color: green(),
            time_axis: false,
        }
    }
    fn abp() -> Self {
        Self {
            signal: "ArterialPressure",
            label: "ABP",
            unit: "mmHg",
            right_label: "ART",
            ticks: &["150", "75", "0"],
            axis_min: 0.0,
            axis_max: 150.0,
            color: red(),
            time_axis: false,
        }
    }
    fn pleth() -> Self {
        Self {
            signal: "Pleth",
            label: "PLETH",
            unit: "%",
            right_label: "SpO₂",
            ticks: &["100", "0"],
            axis_min: 0.0,
            axis_max: 1.05,
            color: teal(),
            time_axis: false,
        }
    }
    fn resp() -> Self {
        Self {
            signal: "Respiration",
            label: "RESP",
            unit: "imp",
            right_label: "RR",
            ticks: &["1", "0", "-1"],
            axis_min: -1.05,
            axis_max: 1.05,
            color: amber(),
            time_axis: true,
        }
    }
}

fn alarm_footer_label(model: &DisplayModel) -> &'static str {
    if !model.alarm_feed_available {
        "ALARMS\nUNAVAIL"
    } else if model.alarms.is_empty() {
        "ALARMS\nNONE"
    } else {
        "ALARMS\nACTIVE"
    }
}

fn alarm_footer_detail(model: &DisplayModel) -> String {
    if !model.alarm_feed_available || model.alarms.is_empty() {
        return "--:--".to_string();
    }
    model
        .alarms
        .iter()
        .take(2)
        .map(|alarm| alarm.label.as_str())
        .collect::<Vec<_>>()
        .join(" ")
}

fn alarm_footer_color(model: &DisplayModel) -> Color32 {
    if model
        .alarms
        .iter()
        .any(|alarm| matches!(alarm.severity, AlarmSeverity::Critical))
    {
        red()
    } else if model.alarm_feed_available && !model.alarms.is_empty() {
        amber()
    } else {
        muted()
    }
}

fn time_axis_label(window_s: f32, frac: f32) -> String {
    if (frac - 1.0).abs() < f32::EPSILON {
        return "0".to_string();
    }
    let remaining = window_s * (1.0 - frac);
    if frac == 0.0 {
        format!("-{} sec", format_seconds_for_axis(remaining))
    } else {
        format!("-{}", format_seconds_for_axis(remaining))
    }
}

fn format_seconds_for_axis(seconds: f32) -> String {
    if (seconds.round() - seconds).abs() < 0.05 {
        format!("{:.0}", seconds)
    } else {
        format!("{:.1}", seconds)
    }
}

fn state_dot_color(state: SourceState) -> Color32 {
    match state {
        SourceState::Fresh => green(),
        SourceState::Stale | SourceState::Paused => amber(),
        SourceState::Offline | SourceState::Invalid => red(),
    }
}

fn positive_mod(value: f32, divisor: f32) -> f32 {
    ((value % divisor) + divisor) % divisor
}

fn circular_distance(a: f32, b: f32) -> f32 {
    let delta = (a - b).abs();
    delta.min(1.0 - delta)
}

fn waveform_axis(strip: &WaveformStripModel, spec: &WaveSpec) -> (f32, f32) {
    if spec.signal == "Pleth" && strip.max <= 2.0 {
        (0.0, 1.05)
    } else {
        (spec.axis_min, spec.axis_max)
    }
}

fn find_strip<'a>(model: &'a DisplayModel, signal: &str) -> Option<&'a WaveformStripModel> {
    model
        .waveform_strips
        .iter()
        .find(|strip| strip.signal == signal)
}

fn tile_value(model: &DisplayModel, label: &str) -> Option<String> {
    model
        .numeric_tiles
        .iter()
        .find(|tile| tile.label == label && tile.available)
        .map(|tile| tile.value.clone())
}

fn split_bp_map(value: &str) -> (String, String) {
    if let Some((bp, rest)) = value.split_once('(') {
        (
            bp.trim().to_string(),
            rest.trim_end_matches(')').trim().to_string(),
        )
    } else {
        (value.to_string(), "--".to_string())
    }
}

fn unavailable_value() -> String {
    "---".to_string()
}

fn clock_time(wall_time: &str) -> Option<String> {
    if wall_time.len() >= 19 && wall_time.as_bytes().get(10) == Some(&b'T') {
        Some(wall_time[11..19].to_string())
    } else if wall_time.len() >= 8 && wall_time.chars().nth(2) == Some(':') {
        Some(wall_time[..8].to_string())
    } else {
        None
    }
}

fn live_label(state: SourceState) -> &'static str {
    if matches!(state, SourceState::Fresh) {
        "LIVE"
    } else {
        state_label(state)
    }
}
fn text_width(text: &str, size: f32) -> f32 {
    text.chars().count() as f32 * size * 0.55
}
fn line(painter: &egui::Painter, a: Pos2, b: Pos2) {
    painter.line_segment([a, b], Stroke::new(1.0, line_color()));
}
fn draw_signal(painter: &egui::Painter, center: Pos2, scale: f32) {
    for (i, h) in [5.0, 9.0, 14.0, 18.0].iter().enumerate() {
        let x = center.x + (i as f32 - 1.5) * 7.0 * scale;
        painter.rect_filled(
            Rect::from_min_size(
                Pos2::new(x, center.y + 10.0 * scale - h * scale),
                Vec2::new(4.0 * scale, h * scale),
            ),
            0.0,
            muted(),
        );
    }
}
fn draw_battery(painter: &egui::Painter, center: Pos2, scale: f32) {
    let r = Rect::from_center_size(center, Vec2::new(31.0 * scale, 15.0 * scale));
    painter.rect_stroke(r, 2.0, Stroke::new(1.5, muted()), egui::StrokeKind::Inside);
    painter.rect_filled(
        Rect::from_min_size(
            r.left_top() + Vec2::new(4.0 * scale, 4.0 * scale),
            Vec2::new(19.0 * scale, 7.0 * scale),
        ),
        0.0,
        muted(),
    );
    painter.rect_filled(
        Rect::from_min_size(
            Pos2::new(r.right() + scale, center.y - 3.0 * scale),
            Vec2::new(3.0 * scale, 6.0 * scale),
        ),
        1.0,
        muted(),
    );
}
fn warm_bg() -> Color32 {
    Color32::from_rgb(238, 234, 225)
}
fn panel_bg() -> Color32 {
    Color32::from_rgb(252, 251, 248)
}
fn line_color() -> Color32 {
    Color32::from_rgb(217, 212, 202)
}
fn text_color() -> Color32 {
    Color32::from_rgb(39, 50, 56)
}
fn muted() -> Color32 {
    Color32::from_rgb(95, 100, 104)
}
fn green() -> Color32 {
    Color32::from_rgb(35, 141, 58)
}
fn red() -> Color32 {
    Color32::from_rgb(224, 48, 36)
}
fn teal() -> Color32 {
    Color32::from_rgb(17, 158, 170)
}
fn amber() -> Color32 {
    Color32::from_rgb(217, 154, 18)
}
fn trace_glow(color: Color32) -> Color32 {
    Color32::from_rgba_unmultiplied(color.r(), color.g(), color.b(), 55)
}
fn dark() -> Color32 {
    Color32::from_rgb(34, 48, 55)
}

fn usage() {
    eprintln!(
        "pi-monitor native kiosk\n\nOptions:\n  --source <current.json>\n  --source-dir <vitals-dir>\n  --live-tcp <127.0.0.1:port>\n  --fullscreen | --windowed\n  --fps <1-120>\n  --fixture-replay <fixture.json>  (repeatable)\n  --fixture-dir-replay <public-contract-case>  (repeatable)\n"
    );
}
