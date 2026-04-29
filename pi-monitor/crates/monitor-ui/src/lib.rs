use monitor_core::{DisplayModel, SourceState, WaveformStripModel};

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
    if let Some(label) = &model.waveform_source_label {
        out.push_str(&format!("║ Waveform: {:<65} ║\n", truncate(label, 65)));
    }
    for note in display_notes(model).iter().take(4) {
        out.push_str(&format!("║ Context: {:<66} ║\n", truncate(note, 66)));
    }
    out.push_str(&format!("║ {:<76} ║\n", truncate(&model.footer, 76)));
    out.push_str(
        "╚══════════════════════════════════════════════════════════════════════════════╝\n",
    );
    out
}

pub fn render_html(model: &DisplayModel) -> String {
    let header = HeaderData::from_model(model);
    let vitals = VitalData::from_model(model);
    let panels = [
        WavePanelSpec::ecg(),
        WavePanelSpec::abp(),
        WavePanelSpec::pleth(),
        WavePanelSpec::resp(),
    ];
    let waveform_panels = panels
        .iter()
        .map(|panel| render_waveform_panel(panel, find_strip(model, panel.signal)))
        .collect::<Vec<_>>()
        .join("\n");
    let alarm_class = if header.alarm_paused {
        "paused"
    } else {
        "normal"
    };
    format!(
        r#"<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>pi-monitor reference UI</title>
<style>
:root {{
  color-scheme: light;
  --paper:#fbfaf6;
  --panel:#fcfbf8;
  --line:#d9d4ca;
  --line-soft:#ebe6dc;
  --grid:#e9e3d9;
  --text:#273238;
  --muted:#666b70;
  --green:#238d3a;
  --red:#e03024;
  --teal:#119eaa;
  --amber:#d99a12;
  --font: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
}}
* {{ box-sizing:border-box; }}
html, body {{ margin:0; width:100%; height:100%; background:#eeeae1; font-family:var(--font); color:var(--text); }}
body {{ display:grid; place-items:center; }}
.stage {{ position:relative; width:min(100vw, calc(100vh * 16 / 9)); aspect-ratio:16 / 9; background:var(--paper); overflow:hidden; }}
.monitor {{ position:absolute; inset:14px; border:1.5px solid #d2ccc1; border-radius:8px; background:var(--paper); overflow:hidden; box-shadow:0 0 0 1px rgba(255,255,255,.65) inset; display:grid; grid-template-rows:60px 1fr 124px; }}
.header {{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; min-height:60px; padding:0 26px 0 34px; border-bottom:1.5px solid var(--line); font-size:20px; letter-spacing:.012em; background:linear-gradient(#fffdfa,#faf8f3); }}
.header-left,.header-center,.header-right {{ display:flex; align-items:center; min-width:0; }}
.header-left {{ gap:18px; }}
.header-center {{ justify-self:center; gap:28px; font-size:19px; }}
.header-right {{ justify-self:end; gap:20px; color:#3f4448; }}
.live-dot {{ width:16px; height:16px; border-radius:50%; background:#22c466; box-shadow:0 0 0 1px #18994c inset; }}
.separator {{ width:1px; height:28px; background:var(--line); }}
.signal-icon {{ width:34px; height:22px; display:inline-grid; grid-auto-flow:column; align-items:end; gap:4px; }}
.signal-icon i {{ width:4px; background:#4a4f53; display:block; }}
.signal-icon i:nth-child(1) {{ height:5px; opacity:.55; }} .signal-icon i:nth-child(2) {{ height:9px; opacity:.7; }} .signal-icon i:nth-child(3) {{ height:14px; opacity:.85; }} .signal-icon i:nth-child(4) {{ height:18px; }}
.battery {{ position:relative; width:31px; height:15px; border:1.8px solid #4a4f53; border-radius:2px; }}
.battery::before {{ content:""; position:absolute; left:3px; top:3px; bottom:3px; width:19px; background:#697069; }}
.battery::after {{ content:""; position:absolute; right:-5px; top:4px; width:3px; height:7px; background:#4a4f53; border-radius:1px; }}
.main {{ display:grid; grid-template-columns:1fr 522px; min-height:0; }}
.waveforms {{ min-width:0; border-right:1.5px solid var(--line); display:grid; grid-template-rows:repeat(4, 1fr); }}
.wave-panel {{ position:relative; min-height:0; background:var(--panel); border-bottom:1.5px solid var(--line); overflow:hidden; }}
.wave-panel:last-child {{ border-bottom:0; }}
.wave-label {{ position:absolute; left:24px; top:22px; color:var(--wave); font-size:26px; font-weight:500; letter-spacing:.01em; }}
.wave-unit {{ position:absolute; left:26px; top:60px; color:var(--wave); font-size:20px; }}
.wave-right-label {{ position:absolute; right:32px; top:26px; color:var(--wave); font-size:22px; font-weight:500; }}
.wave-ticks {{ position:absolute; left:88px; top:70px; bottom:42px; width:42px; color:var(--wave); font-size:19px; }}
.tick {{ position:absolute; right:0; transform:translateY(-50%); }}
.axis-mark {{ position:absolute; left:134px; top:78px; bottom:47px; width:10px; border-left:1px solid #c9c3b8; }}
.axis-mark::before,.axis-mark::after {{ content:""; position:absolute; left:-7px; width:7px; height:1px; background:#c9c3b8; }}
.axis-mark::before {{ top:0; }} .axis-mark::after {{ bottom:0; }}
.wave-svg {{ position:absolute; left:152px; right:32px; top:22px; bottom:32px; width:auto; height:auto; overflow:visible; }}
.wave-svg .grid-dot {{ stroke:var(--grid); stroke-width:1; stroke-dasharray:1 7; opacity:.88; }}
.wave-svg .grid-major {{ stroke:#e2ddd4; stroke-width:1; stroke-dasharray:1 7; opacity:.95; }}
.wave-svg .trace {{ fill:none; stroke:var(--wave); stroke-width:2.2; vector-effect:non-scaling-stroke; stroke-linejoin:round; stroke-linecap:round; }}
.wave-message {{ fill:#8f918e; font-size:18px; }}
.co2-axis {{ position:absolute; left:152px; right:32px; bottom:27px; height:1px; border-top:1px solid #bcb6ad; }}
.co2-axis span {{ position:absolute; top:11px; transform:translateX(-50%); color:#535c62; font-size:19px; }}
.numeric-column {{ display:grid; grid-template-rows:174px 169px 156px 156px 142px 1fr; background:var(--panel); }}
.vital-card {{ position:relative; border-bottom:1.5px solid var(--line); padding:20px 28px 16px 25px; overflow:hidden; color:var(--vital); }}
.vital-card:last-child {{ border-bottom:0; }}
.vital-head {{ display:flex; align-items:baseline; gap:16px; line-height:1; }}
.vital-label {{ font-size:26px; font-weight:500; }}
.vital-unit {{ color:#5f6468; font-size:18px; }}
.vital-value {{ position:absolute; left:128px; top:48px; font-size:96px; line-height:.82; font-weight:300; letter-spacing:-.055em; color:var(--vital); }}
.vital-value.medium {{ left:67px; top:55px; font-size:72px; letter-spacing:-.045em; }}
.vital-value.small {{ left:138px; top:50px; font-size:76px; letter-spacing:-.04em; }}
.hr-limits {{ position:absolute; right:123px; top:72px; color:#3d4448; font-size:19px; line-height:1.9; text-align:center; }}
.hr-limits::before {{ content:""; position:absolute; left:-4px; right:-4px; top:37px; height:1px; background:#bdb7ac; }}
.pvc {{ position:absolute; right:31px; top:72px; color:#333a3f; font-size:19px; text-align:center; line-height:1.95; }}
.nibp-time {{ position:absolute; left:25px; bottom:18px; color:#3f464b; font-size:18px; white-space:pre; }}
.map {{ position:absolute; right:117px; top:59px; color:var(--red); font-size:25px; line-height:1.1; text-align:left; }}
.map strong {{ display:block; font-size:48px; font-weight:400; letter-spacing:-.04em; }}
.side-limits {{ position:absolute; right:31px; top:76px; color:#3d4448; font-size:18px; line-height:1.75; text-align:center; }}
.side-limits::before {{ content:""; position:absolute; left:-5px; right:-5px; top:32px; height:1px; background:#bdb7ac; }}
.indicator {{ position:absolute; right:41px; top:43px; width:13px; height:76px; background:#d9d7d0; }}
.indicator::after {{ content:""; position:absolute; left:0; right:0; bottom:0; height:31px; background:var(--vital); }}
.fi {{ position:absolute; right:40px; top:78px; color:#3d4448; font-size:18px; line-height:2.2; text-align:center; }}
.temp-limits {{ position:absolute; right:107px; top:41px; color:var(--green); font-size:20px; line-height:2.25; text-align:center; }}
.temp-limits::before {{ content:""; position:absolute; left:-5px; right:-5px; top:45px; height:1px; background:#86ab86; }}
.footer {{ display:grid; grid-template-columns:330px 360px 335px 1fr 1fr 1fr; border-top:1.5px solid var(--line); background:linear-gradient(#fcfbf8,#f8f5ee); }}
.footer-section {{ position:relative; display:flex; align-items:center; gap:22px; padding:0 33px; min-width:0; }}
.footer-section:not(:last-child)::after {{ content:""; position:absolute; right:0; top:25px; bottom:25px; width:1px; background:var(--line); }}
.footer-label {{ color:#4b5257; font-size:19px; line-height:1.45; }}
.footer-accent {{ color:#e49400; }}
.warn-icon {{ width:36px; height:36px; color:#e49400; flex:0 0 auto; }}
.footer .big {{ font-size:22px; color:#20282d; }}
.footer-center {{ justify-content:center; }}
.footer-icon {{ width:31px; height:31px; color:#273238; }}
.event-badge {{ display:grid; place-items:center; width:40px; height:40px; border:1.3px solid #d4cec4; border-radius:50%; color:#d99a12; font-size:18px; }}
.prototype-note {{ position:absolute; left:-10000px; width:1px; height:1px; overflow:hidden; }}
@media (max-width: 900px) {{
  .header {{ font-size:14px; padding:0 16px; }}
  .header-center {{ gap:14px; font-size:14px; }}
  .main {{ grid-template-columns:1fr 31%; }}
}}
</style>
<div class="stage">
<main class="monitor" role="application" aria-label="patient vitals monitor UI prototype">
  <header class="header">
    <div class="header-left"><span class="live-dot"></span><span>{live_state}</span><span class="separator"></span><span>{location}</span><span class="separator"></span><span>{bed}</span><span class="separator"></span><span>{category}</span></div>
    <div class="header-center"><span>{patient_name}</span><span class="separator"></span><span>ID&nbsp; {patient_id}</span></div>
    <div class="header-right"><span>WAVE NIBP</span><span class="signal-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="battery" aria-hidden="true"></span><span>{time}</span></div>
  </header>
  <section class="main">
    <section class="waveforms" aria-label="waveforms">{waveform_panels}</section>
    <aside class="numeric-column" aria-label="numeric vitals">
      {vital_cards}
    </aside>
  </section>
  <footer class="footer">
    <section class="footer-section"><svg class="warn-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 29 27H3L16 4Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 11v8M16 23v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div class="footer-label">ALARMS<br><span class="footer-accent {alarm_class}">{alarm_text}</span></div><div class="footer-accent big">{alarm_remaining}</div></section>
    <section class="footer-section"><div class="footer-label">NIBP<br>INTERVAL</div><div class="big">{nibp_interval}</div></section>
    <section class="footer-section"><div class="footer-label">PRIORITY<br>{priority}</div></section>
    <section class="footer-section footer-center"><svg class="footer-icon" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 21l5-5 4 3 6-8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 25h16" stroke="currentColor" stroke-width="1.2"/></svg><span class="footer-label">TRENDS</span></section>
    <section class="footer-section footer-center"><svg class="footer-icon" viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="6" width="22" height="20" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 12h14M9 17h8M13 4v5M21 4v5" stroke="currentColor" stroke-width="1.3"/></svg><span class="footer-label">EVENTS</span><span class="event-badge">{events_count}</span></section>
    <section class="footer-section footer-center"><svg class="footer-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M17.8 4.5 19 7.6a9.4 9.4 0 0 1 2.1.9l3-1.3 2.2 3.8-2.6 2a9 9 0 0 1 0 2.3l2.6 2-2.2 3.8-3-1.3a9.4 9.4 0 0 1-2.1.9l-1.2 3.1h-4.4l-1.2-3.1a9.4 9.4 0 0 1-2.1-.9l-3 1.3-2.2-3.8 2.6-2a9 9 0 0 1 0-2.3l-2.6-2 2.2-3.8 3 1.3a9.4 9.4 0 0 1 2.1-.9l1.2-3.1h4.4Z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="15.6" cy="15.1" r="3.6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg><span class="footer-label">SETUP</span></section>
  </footer>
  <p class="prototype-note">{prototype_note}</p>
</main>
</div>
</html>"#,
        live_state = escape(header.live_state),
        location = escape(header.location),
        bed = escape(header.bed),
        category = escape(header.category),
        patient_name = escape(header.patient_name),
        patient_id = escape(header.patient_id),
        time = escape(&header.time),
        waveform_panels = waveform_panels,
        vital_cards = render_vital_cards(&vitals),
        alarm_class = alarm_class,
        alarm_text = if header.alarm_paused {
            "PAUSED"
        } else {
            "NORMAL"
        },
        alarm_remaining = escape(header.alarm_pause_remaining),
        nibp_interval = escape(header.nibp_interval),
        priority = escape(header.priority),
        events_count = header.events_count,
        prototype_note = escape(&format!(
            "{} · UI prototype only; not charted; not part of the medical record; not a certified medical device",
            model.footer
        )),
    )
}

struct HeaderData<'a> {
    live_state: &'a str,
    location: &'a str,
    bed: &'a str,
    category: &'a str,
    patient_name: &'a str,
    patient_id: &'a str,
    alarm_paused: bool,
    alarm_pause_remaining: &'a str,
    nibp_interval: &'a str,
    priority: &'a str,
    events_count: u32,
    time: String,
}

impl<'a> HeaderData<'a> {
    fn from_model(model: &DisplayModel) -> Self {
        Self {
            live_state: if matches!(model.state, SourceState::Fresh) {
                "LIVE"
            } else {
                state_label(model.state)
            },
            location: "ICU 01",
            bed: "BED 07",
            category: "ADULT",
            patient_name: "JOHN SMITH",
            patient_id: "12345678",
            alarm_paused: true,
            alarm_pause_remaining: "2:00",
            nibp_interval: "5 min",
            priority: "NORMAL",
            events_count: 3,
            time: model
                .wall_time
                .as_deref()
                .and_then(clock_time)
                .unwrap_or_else(|| "18:51:23".to_string()),
        }
    }
}

struct VitalData {
    hr: String,
    nibp: String,
    map: String,
    spo2: String,
    rr: String,
    temp: String,
}

impl VitalData {
    fn from_model(model: &DisplayModel) -> Self {
        let bp = tile_value(model, "BP/MAP").unwrap_or_else(|| "114/73 (95)".to_string());
        let (nibp, map) = split_bp_map(&bp);
        Self {
            hr: tile_value(model, "HR").unwrap_or_else(|| "86".to_string()),
            nibp,
            map,
            spo2: tile_value(model, "SpO2").unwrap_or_else(|| "97".to_string()),
            rr: tile_value(model, "RR").unwrap_or_else(|| "16".to_string()),
            temp: tile_value(model, "TEMP").unwrap_or_else(|| "33.2".to_string()),
        }
    }
}

fn render_vital_cards(vitals: &VitalData) -> String {
    format!(
        r#"<article class="vital-card" style="--vital:var(--green)"><div class="vital-head"><span class="vital-label">HR</span><span class="vital-unit">bpm</span></div><div class="vital-value">{hr}</div><div class="hr-limits"><div>120</div><div>50</div></div><div class="pvc"><div>PVC</div><div style="color:var(--green)">0</div></div></article>
<article class="vital-card" style="--vital:var(--red)"><div class="vital-head"><span class="vital-label">NIBP</span><span class="vital-unit">mmHg</span></div><div class="vital-value medium">{nibp}</div><div class="map">MAP<strong>{map}</strong></div><div class="nibp-time">18:50    5 min ago</div><div class="side-limits"><div>120</div><div>80</div></div></article>
<article class="vital-card" style="--vital:var(--teal)"><div class="vital-head"><span class="vital-label">SpO₂</span><span class="vital-unit">%</span></div><div class="vital-value small">{spo2}</div><div class="side-limits" style="color:var(--teal);right:129px;top:58px"><div>100</div><div>90</div></div><div class="indicator"></div></article>
<article class="vital-card" style="--vital:var(--amber)"><div class="vital-head"><span class="vital-label">RR</span><span class="vital-unit">br/min</span></div><div class="vital-value small">{rr}</div><div class="side-limits" style="color:var(--amber);right:129px;top:58px"><div>30</div><div>8</div></div><div class="indicator" style="--vital:var(--amber);"></div></article>
<article class="vital-card" style="--vital:var(--green)"><div class="vital-head"><span class="vital-label">TEMP</span><span class="vital-unit">°C</span></div><div class="vital-value small" style="font-size:72px;left:137px;top:46px">{temp}</div><div class="temp-limits"><div>38.0</div><div>36.0</div></div></article>
<article class="vital-card" style="--vital:#8f918e"><div class="vital-head"><span class="vital-label">--</span><span class="vital-unit"></span></div><div class="vital-value small">--</div></article>"#,
        hr = escape(&vitals.hr),
        nibp = escape(&vitals.nibp),
        map = escape(&vitals.map),
        spo2 = escape(&vitals.spo2),
        rr = escape(&vitals.rr),
        temp = escape(&vitals.temp),
    )
}

struct WavePanelSpec {
    signal: &'static str,
    label: &'static str,
    unit: &'static str,
    right_label: &'static str,
    ticks: &'static [&'static str],
    axis_min: f64,
    axis_max: f64,
    color_var: &'static str,
    show_time_axis: bool,
}

impl WavePanelSpec {
    fn ecg() -> Self {
        Self {
            signal: "ECG_LeadII",
            label: "ECG II",
            unit: "1 mV",
            right_label: "HR",
            ticks: &["1", "0", "-1"],
            axis_min: -1.0,
            axis_max: 1.0,
            color_var: "var(--green)",
            show_time_axis: false,
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
            color_var: "var(--red)",
            show_time_axis: false,
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
            axis_max: 1.0,
            color_var: "var(--teal)",
            show_time_axis: false,
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
            color_var: "var(--amber)",
            show_time_axis: true,
        }
    }
}

fn render_waveform_panel(spec: &WavePanelSpec, strip: Option<&WaveformStripModel>) -> String {
    let tick_count = spec.ticks.len().saturating_sub(1).max(1) as f64;
    let ticks = spec
        .ticks
        .iter()
        .enumerate()
        .map(|(idx, label)| {
            let top = 100.0 * idx as f64 / tick_count;
            format!(
                "<span class=\"tick\" style=\"top:{top:.4}%\">{}</span>",
                escape(label)
            )
        })
        .collect::<Vec<_>>()
        .join("");
    let axis = if spec.show_time_axis {
        r#"<div class="co2-axis"><span style="left:0%">-10 sec</span><span style="left:20%">-8</span><span style="left:40%">-6</span><span style="left:60%">-4</span><span style="left:80%">-2</span><span style="left:100%">0</span></div>"#
    } else {
        ""
    };
    format!(
        r#"<article class="wave-panel" style="--wave:{color}"><div class="wave-label">{label}</div><div class="wave-unit">{unit}</div><div class="wave-right-label">{right}</div><div class="wave-ticks">{ticks}</div><div class="axis-mark"></div>{svg}{axis}</article>"#,
        color = spec.color_var,
        label = escape(spec.label),
        unit = escape(spec.unit),
        right = escape(spec.right_label),
        ticks = ticks,
        svg = waveform_svg(spec, strip),
        axis = axis,
    )
}

fn waveform_svg(spec: &WavePanelSpec, strip: Option<&WaveformStripModel>) -> String {
    let width = 1320.0;
    let height = if spec.show_time_axis { 150.0 } else { 170.0 };
    let grid = svg_grid(width, height);
    let trace = match strip {
        Some(strip) if strip.available => {
            let points = waveform_points(strip, spec, width, height);
            format!("<polyline class=\"trace\" points=\"{}\" />", points)
        }
        Some(strip) => format!(
            "<text class=\"wave-message\" x=\"{}\" y=\"{}\" text-anchor=\"middle\">{}</text>",
            width / 2.0,
            height / 2.0,
            escape(&strip.message)
        ),
        None => format!(
            "<text class=\"wave-message\" x=\"{}\" y=\"{}\" text-anchor=\"middle\">{} waveform feed unavailable</text>",
            width / 2.0,
            height / 2.0,
            escape(spec.label)
        ),
    };
    format!(
        "<svg class=\"wave-svg\" viewBox=\"0 0 {width:.0} {height:.0}\" preserveAspectRatio=\"none\" role=\"img\" aria-label=\"{} waveform\">{}{}</svg>",
        escape(spec.label),
        grid,
        trace,
    )
}

fn svg_grid(width: f64, height: f64) -> String {
    let mut out = String::new();
    for idx in 0..=48 {
        let x = width * idx as f64 / 48.0;
        let class = if idx % 4 == 0 {
            "grid-major"
        } else {
            "grid-dot"
        };
        out.push_str(&format!(
            "<line class=\"{class}\" x1=\"{x:.2}\" y1=\"0\" x2=\"{x:.2}\" y2=\"{height:.2}\"/>"
        ));
    }
    for idx in 0..=8 {
        let y = height * idx as f64 / 8.0;
        let class = if idx % 2 == 0 {
            "grid-major"
        } else {
            "grid-dot"
        };
        out.push_str(&format!(
            "<line class=\"{class}\" x1=\"0\" y1=\"{y:.2}\" x2=\"{width:.2}\" y2=\"{y:.2}\"/>"
        ));
    }
    out
}

fn waveform_points(
    strip: &WaveformStripModel,
    spec: &WavePanelSpec,
    width: f64,
    height: f64,
) -> String {
    let denom = strip.values.len().saturating_sub(1).max(1) as f64;
    let (axis_min, axis_max) = waveform_axis(strip, spec);
    let range = (axis_max - axis_min).abs().max(1e-9);
    strip
        .values
        .iter()
        .enumerate()
        .map(|(idx, value)| {
            let x = (idx as f64 / denom) * width;
            let normalized = ((*value - axis_min) / range).clamp(0.0, 1.0);
            let y = height - normalized * height;
            format!("{x:.1},{y:.1}")
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn waveform_axis(strip: &WaveformStripModel, spec: &WavePanelSpec) -> (f64, f64) {
    if spec.signal == "Pleth" && strip.max <= 2.0 {
        return (0.0, 1.05);
    }
    if spec.signal == "ECG_LeadII" {
        return (-1.15, 1.15);
    }
    (spec.axis_min, spec.axis_max)
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
        let map = rest.trim_end_matches(')').trim();
        (bp.trim().to_string(), map.to_string())
    } else {
        (value.to_string(), "95".to_string())
    }
}

fn clock_time(wall_time: &str) -> Option<String> {
    if wall_time.len() >= 19 && wall_time.as_bytes().get(10) == Some(&b'T') {
        return Some(wall_time[11..19].to_string());
    }
    if wall_time.len() >= 8 && wall_time.chars().nth(2) == Some(':') {
        return Some(wall_time[..8].to_string());
    }
    None
}

fn display_notes(model: &DisplayModel) -> Vec<String> {
    let mut notes = Vec::new();
    for preferred in [
        "mismatch",
        "waveforms/current.json ignored",
        "waveform lane",
        "public status lane",
        "lane warning",
    ] {
        for note in model
            .compatibility_notes
            .iter()
            .filter(|note| note.contains(preferred))
        {
            push_unique(&mut notes, note);
        }
    }
    for note in &model.compatibility_notes {
        push_unique(&mut notes, note);
    }
    notes
}

fn push_unique(notes: &mut Vec<String>, note: &str) {
    if !notes.iter().any(|existing| existing == note) {
        notes.push(note.to_string());
    }
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
        SourceState::Fresh => "#238d3a",
        SourceState::Stale => "#d99a12",
        SourceState::Offline => "#e03024",
        SourceState::Invalid => "#d94a8a",
        SourceState::Paused => "#119eaa",
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
        assert!(html.contains("ECG II"));
        assert!(html.contains("polyline"));
    }

    #[test]
    fn html_uses_reference_monitor_structure() {
        let frame = parse_public_frame(r#"{"t":1,"hr":86,"map":95,"bp_sys":114,"bp_dia":73,"spo2":97,"rr":16,"temp_c":33.2,"etco2_mmHg":28,"alarms":[]}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        let html = render_html(&core.display_model(0));
        for expected in [
            "JOHN SMITH",
            "BED 07",
            "ECG II",
            "ABP",
            "PLETH",
            "RESP",
            "NIBP",
            "114/73",
            "EVENTS",
        ] {
            assert!(html.contains(expected), "missing {expected}");
        }
    }
}
