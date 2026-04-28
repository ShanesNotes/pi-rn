use monitor_core::{AlarmSeverity, DisplayModel, SourceState, WaveformStripModel};

pub fn render_terminal(model: &DisplayModel) -> String {
    let mut out = String::new();
    out.push_str("\x1b[2J\x1b[H");
    out.push_str(
        "╔══════════════════════════════════════════════════════════════════════════════╗\n",
    );
    out.push_str(&format!(
        "║ {:<30} SIM {}  STATE {:<10} ║\n",
        model.title,
        model.sim_time,
        state_label(model.state)
    ));
    out.push_str(&format!(
        "║ Source: {:<67} ║\n",
        truncate(&model.source, 67)
    ));
    out.push_str(
        "╠══════════════════════════════════════════════════════════════════════════════╣\n",
    );
    out.push_str(&format!("║ {:<44} │ {:<27} ║\n", "WAVEFORMS", "NUMERICS"));
    for idx in 0..6 {
        let wave = if idx == 0 {
            truncate(&model.waveform_message, 44)
        } else {
            waveform_line(model.waveform_strips.get(idx - 1))
        };
        let wave = if idx == 4 {
            if model.hr_tick_enabled {
                "♥ HR tick active".to_string()
            } else if wave.is_empty() {
                "heart tick suppressed".to_string()
            } else {
                wave
            }
        } else {
            wave
        };
        out.push_str(&format!(
            "║ {:<44} │ {:<27} ║\n",
            truncate(&wave, 44),
            numeric_line(model, idx)
        ));
    }
    out.push_str(
        "╠══════════════════════════════════════════════════════════════════════════════╣\n",
    );
    let alarms = if !model.alarm_feed_available {
        "ALARM FEED UNAVAILABLE".to_string()
    } else if model.alarms.is_empty() {
        "No active frame-provided alarms".to_string()
    } else {
        model
            .alarms
            .iter()
            .map(|chip| format!("{}:{:?}", chip.label, chip.severity))
            .collect::<Vec<_>>()
            .join("  ")
    };
    out.push_str(&format!("║ Alarms: {:<67} ║\n", truncate(&alarms, 67)));
    if let Some(rhythm) = &model.heart_rhythm {
        out.push_str(&format!("║ Rhythm: {:<67} ║\n", truncate(rhythm, 67)));
    }
    out.push_str(&format!("║ {:<76} ║\n", truncate(&model.footer, 76)));
    out.push_str(
        "╚══════════════════════════════════════════════════════════════════════════════╝\n",
    );
    out
}

pub fn render_html(model: &DisplayModel) -> String {
    let tiles = model
        .numeric_tiles
        .iter()
        .map(|tile| {
            format!(
                "<article class=\"tile {}\"><div class=\"label\">{}</div><div class=\"value\">{}</div><div class=\"unit\">{}</div></article>",
                if tile.available { "" } else { "missing" },
                escape(&tile.label),
                escape(&tile.value),
                escape(&tile.unit)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let alarms = if !model.alarm_feed_available {
        "<span class=\"alarm unavailable\">ALARM FEED UNAVAILABLE</span>".to_string()
    } else if model.alarms.is_empty() {
        "<span class=\"alarm info\">No active frame-provided alarms</span>".to_string()
    } else {
        model
            .alarms
            .iter()
            .map(|chip| {
                format!(
                    "<span class=\"alarm {}\">{}</span>",
                    severity_class(chip.severity),
                    escape(&chip.label)
                )
            })
            .collect::<Vec<_>>()
            .join("\n")
    };
    let strips = render_html_strips(&model.waveform_strips);
    format!(
        r#"<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>LIVE SIM MONITOR</title>
<style>
:root {{ color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#05080a; color:#e7f7ff; }}
body {{ margin:0; min-height:100vh; display:grid; place-items:center; background:radial-gradient(circle at 30% 20%, #10202a, #020304 70%); }}
.monitor {{ width:min(1180px, 96vw); height:min(700px, 94vh); border:3px solid #2d4654; border-radius:22px; padding:22px; box-shadow:0 0 40px #000 inset, 0 0 80px #001b24; display:grid; grid-template-rows:auto 1fr auto auto; gap:16px; }}
header {{ display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid #28404a; padding-bottom:12px; }}
h1 {{ color:#8ffcff; letter-spacing:.12em; margin:0; }}
.state {{ color:{state_color}; font-size:1.5rem; }}
.grid {{ display:grid; grid-template-columns:1.5fr .9fr; gap:18px; }}
.waveforms {{ border:1px solid #19313b; border-radius:16px; padding:16px; color:#9fb6bf; display:grid; grid-template-rows:repeat(4, 1fr); gap:12px; }}
.strip {{ border-bottom:1px solid #31515e; display:grid; grid-template-columns:9rem 1fr; gap:12px; align-items:center; letter-spacing:.05em; }}
.strip svg {{ width:100%; height:82px; background:#020506; border-radius:8px; }}
.strip .unavailable {{ text-transform:uppercase; color:#7d919a; }}
.tiles {{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }}
.tile {{ border:1px solid #24424e; border-radius:16px; padding:14px; background:#071015; }}
.tile .label {{ color:#7ac8d8; font-size:1rem; }}
.tile .value {{ font-size:3rem; line-height:1; color:#75ff8b; }}
.tile.missing .value {{ color:#67777d; }}
.tile .unit {{ color:#b7cbd3; }}
.alarms {{ min-height:42px; }}
.alarm {{ display:inline-block; margin:4px 8px 4px 0; padding:8px 12px; border-radius:999px; background:#334; }}
.alarm.critical {{ background:#8a1010; color:#fff; }} .alarm.warning {{ background:#8a6a10; color:#fff; }} .alarm.info {{ background:#283745; }} .alarm.unavailable {{ background:#4d3140; color:#ffd6e8; }}
footer {{ color:#ffdf8f; border-top:1px solid #28404a; padding-top:12px; }}
</style>
<main class="monitor">
<header><h1>{title}</h1><div>SIM {sim_time} · <span class="state">{state}</span></div></header>
<section class="grid"><div class="waveforms">{strips}</div><div class="tiles">{tiles}</div></section>
<section class="alarms">{alarms}</section>
<footer>{footer}</footer>
</main>
</html>"#,
        state_color = state_color(model.state),
        title = escape(&model.title),
        sim_time = escape(&model.sim_time),
        state = state_label(model.state),
        strips = strips,
        tiles = tiles,
        alarms = alarms,
        footer = escape(&model.footer)
    )
}

fn render_html_strips(strips: &[WaveformStripModel]) -> String {
    strips
        .iter()
        .take(4)
        .map(|strip| {
            if strip.available {
                format!(
                    "<div class=\"strip\"><strong>{}</strong>{}</div>",
                    escape(&strip.signal),
                    waveform_svg(strip)
                )
            } else {
                format!(
                    "<div class=\"strip\"><strong>{}</strong><span class=\"unavailable\">{}</span></div>",
                    escape(&strip.signal),
                    escape(&strip.message)
                )
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn waveform_svg(strip: &WaveformStripModel) -> String {
    let width = 420.0;
    let height = 82.0;
    let range = (strip.max - strip.min).abs().max(1e-9);
    let denom = strip.values.len().saturating_sub(1).max(1) as f64;
    let points = strip
        .values
        .iter()
        .enumerate()
        .map(|(idx, value)| {
            let x = (idx as f64 / denom) * width;
            let y = height - (((*value - strip.min) / range).clamp(0.0, 1.0) * height);
            format!("{x:.1},{y:.1}")
        })
        .collect::<Vec<_>>()
        .join(" ");
    format!(
        "<svg viewBox=\"0 0 {width} {height}\" role=\"img\" aria-label=\"{} waveform\"><polyline points=\"{}\" fill=\"none\" stroke=\"{}\" stroke-width=\"2\"/></svg>",
        escape(&strip.signal),
        points,
        stroke_for(&strip.signal)
    )
}

fn waveform_line(strip: Option<&WaveformStripModel>) -> String {
    match strip {
        Some(strip) if strip.available => format!(
            "[{}] {} samples @ {:.0} Hz",
            strip.signal,
            strip.values.len(),
            strip.sample_rate_hz
        ),
        Some(strip) => format!("[{}] unavailable", strip.signal),
        None => String::new(),
    }
}

fn numeric_line(model: &DisplayModel, idx: usize) -> String {
    model
        .numeric_tiles
        .get(idx)
        .map(|tile| format!("{} {} {}", tile.label, tile.value, tile.unit))
        .unwrap_or_default()
}

pub fn state_label(state: SourceState) -> &'static str {
    match state {
        SourceState::Fresh => "FRESH",
        SourceState::Stale => "STALE",
        SourceState::Offline => "NO SIGNAL",
        SourceState::Invalid => "INVALID",
        SourceState::Paused => "PAUSED",
    }
}

pub fn state_color(state: SourceState) -> &'static str {
    match state {
        SourceState::Fresh => "#75ff8b",
        SourceState::Stale => "#ffd166",
        SourceState::Offline => "#ff5c5c",
        SourceState::Invalid => "#ff7ab6",
        SourceState::Paused => "#8ab4ff",
    }
}

fn severity_class(severity: AlarmSeverity) -> &'static str {
    match severity {
        AlarmSeverity::Critical => "critical",
        AlarmSeverity::Warning => "warning",
        AlarmSeverity::Info => "info",
    }
}

fn stroke_for(signal: &str) -> &'static str {
    match signal {
        "ECG_LeadII" | "ECG" => "#75ff8b",
        "Pleth" => "#51d1ff",
        "ArterialPressure" | "ABP" => "#ff5c5c",
        "CO2" => "#ffd166",
        _ => "#8ffcff",
    }
}

fn escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn truncate(value: &str, max: usize) -> String {
    if value.chars().count() <= max {
        value.to_string()
    } else {
        let mut out = value
            .chars()
            .take(max.saturating_sub(1))
            .collect::<String>();
        out.push('…');
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use monitor_core::MonitorCore;
    use pulse_public_frame::parse_public_frame;

    #[test]
    fn html_contains_not_chart_truth_and_no_save_affordance() {
        let frame = parse_public_frame(r#"{"t":1,"hr":72,"alarms":[]}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        let html = render_html(&core.display_model(0));
        assert!(html.contains("not charted"));
        assert!(!html.to_ascii_lowercase().contains("save"));
        assert!(!html.to_ascii_lowercase().contains("commit"));
        assert!(html.contains("waveform feed unavailable"));
    }

    #[test]
    fn html_renders_frame_provided_waveform_svg() {
        let frame = parse_public_frame(r#"{"t":1,"hr":72,"alarms":[],"monitor":{"schemaVersion":1,"waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":0,"values":[0,1,0]}}}}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        let html = render_html(&core.display_model(0));
        assert!(html.contains("<svg"));
        assert!(html.contains("ECG_LeadII"));
        assert!(html.contains("polyline"));
    }
}
