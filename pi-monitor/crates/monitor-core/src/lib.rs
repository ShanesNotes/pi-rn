use pulse_public_frame::{PublicFrame, Quantity, VitalKey, Waveform, WaveformSourceDetails};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SourceState {
    Fresh,
    Stale,
    Offline,
    Invalid,
    Paused,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NumericTile {
    pub key: String,
    pub label: String,
    pub value: String,
    pub unit: String,
    pub available: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AlarmChip {
    pub label: String,
    pub severity: AlarmSeverity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AlarmSeverity {
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WaveformStripModel {
    pub signal: String,
    pub unit: String,
    pub sample_rate_hz: f64,
    pub t0_s: f64,
    pub values: Vec<f64>,
    pub sample_times_s: Vec<f64>,
    pub visible_window_s: f64,
    pub sweep_now_s: f64,
    pub min: f64,
    pub max: f64,
    pub available: bool,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DisplayModel {
    pub title: String,
    pub source: String,
    pub state: SourceState,
    pub sim_time: String,
    pub wall_time: Option<String>,
    pub numeric_tiles: Vec<NumericTile>,
    pub alarm_feed_available: bool,
    pub alarms: Vec<AlarmChip>,
    pub heart_rhythm: Option<String>,
    pub hr_tick_enabled: bool,
    pub waveform_source_label: Option<String>,
    pub waveform_message: String,
    pub waveform_strips: Vec<WaveformStripModel>,
    pub footer: String,
    pub compatibility_notes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct MonitorCore {
    last_valid: Option<AcceptedFrame>,
    waveform_buffers: BTreeMap<String, BufferedWaveform>,
    waveform_signature: Option<WaveformSignature>,
    last_waveform_sequence: Option<u64>,
    forced_state: Option<SourceState>,
    invalid_message: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AcceptedFrame {
    pub frame: PublicFrame,
    pub received_millis: u64,
}

#[derive(Debug, Clone, PartialEq)]
struct BufferedWaveform {
    unit: String,
    sample_rate_hz: f64,
    samples: Vec<WaveformSample>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct WaveformSample {
    t_s: f64,
    value: f64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct WaveformSignature {
    source: String,
    run_state: Option<String>,
    source_kind: Option<String>,
    fidelity: Option<String>,
    synthetic: Option<bool>,
}

const WAVEFORM_SWEEP_SECONDS: f64 = 12.0;

impl Default for MonitorCore {
    fn default() -> Self {
        Self::new()
    }
}

impl MonitorCore {
    pub fn new() -> Self {
        Self {
            last_valid: None,
            waveform_buffers: BTreeMap::new(),
            waveform_signature: None,
            last_waveform_sequence: None,
            forced_state: None,
            invalid_message: None,
        }
    }

    pub fn accept_frame(&mut self, frame: PublicFrame, received_millis: u64) {
        self.invalid_message = None;
        self.forced_state = None;
        self.accept_waveforms(&frame);
        self.last_valid = Some(AcceptedFrame {
            frame,
            received_millis,
        });
    }

    pub fn mark_invalid(&mut self, message: impl Into<String>) {
        self.reset_waveforms();
        self.invalid_message = Some(message.into());
        self.forced_state = Some(SourceState::Invalid);
    }

    pub fn mark_offline(&mut self, message: impl Into<String>) {
        self.reset_waveforms();
        self.invalid_message = Some(message.into());
        self.forced_state = Some(SourceState::Offline);
    }

    pub fn display_model(&self, now_millis: u64) -> DisplayModel {
        let Some(accepted) = &self.last_valid else {
            return empty_model(SourceState::Offline, "NO SIGNAL", false);
        };
        let age = Duration::from_millis(now_millis.saturating_sub(accepted.received_millis));
        let mut state = if let Some(forced) = self.forced_state {
            forced
        } else if accepted.frame.run_state.as_deref() == Some("unavailable") {
            SourceState::Offline
        } else if accepted.frame.run_state.as_deref() == Some("paused") {
            SourceState::Paused
        } else if age < Duration::from_secs(2) {
            SourceState::Fresh
        } else if age <= Duration::from_secs(10) {
            SourceState::Stale
        } else {
            SourceState::Offline
        };
        if state == SourceState::Paused && age > Duration::from_secs(10) {
            state = SourceState::Offline;
        }
        let numeric_tiles = build_tiles(&accepted.frame.vitals, state);
        let alarms = accepted
            .frame
            .alarms
            .values()
            .iter()
            .map(|label| AlarmChip {
                label: label.clone(),
                severity: severity_for(label),
            })
            .collect();
        let hr_tick_enabled = hr_tick_enabled(&accepted.frame, state);
        let buffered_waveforms = self.buffered_waveforms();
        let sweep_now_s = display_sweep_now_s(accepted, now_millis, state);
        let waveform_strips = build_waveform_strips(&buffered_waveforms, state, sweep_now_s);
        let waveform_message = waveform_summary(&waveform_strips, state);
        DisplayModel {
            title: "LIVE SIM MONITOR".to_string(),
            source: accepted.frame.source.clone(),
            state,
            sim_time: format_sim_time(accepted.frame.sim_time_s),
            wall_time: accepted.frame.wall_time.clone(),
            numeric_tiles,
            alarm_feed_available: accepted.frame.alarms.is_available(),
            alarms,
            heart_rhythm: accepted.frame.heart_rhythm.clone(),
            hr_tick_enabled,
            waveform_source_label: waveform_source_label(&accepted.frame.waveform_source),
            waveform_message,
            waveform_strips,
            footer: footer_with_notes(&accepted.frame.compatibility_notes),
            compatibility_notes: accepted.frame.compatibility_notes.clone(),
        }
    }

    fn accept_waveforms(&mut self, frame: &PublicFrame) {
        if frame.waveforms.is_empty() || matches!(frame.run_state.as_deref(), Some("unavailable")) {
            self.reset_waveforms();
            return;
        }

        let signature = WaveformSignature {
            source: frame.source.clone(),
            run_state: frame.run_state.clone(),
            source_kind: frame
                .waveform_source
                .as_ref()
                .map(|source| source.source_kind.clone()),
            fidelity: frame
                .waveform_source
                .as_ref()
                .map(|source| source.fidelity.clone()),
            synthetic: frame
                .waveform_source
                .as_ref()
                .map(|source| source.synthetic),
        };
        if self
            .waveform_signature
            .as_ref()
            .map(|existing| existing != &signature)
            .unwrap_or(false)
        {
            self.reset_waveforms();
        }
        if let (Some(previous), Some(next)) = (self.last_waveform_sequence, frame.sequence) {
            if next < previous {
                self.reset_waveforms();
            } else if next == previous {
                return;
            }
        }

        let active_signals = frame.waveforms.keys().cloned().collect::<Vec<_>>();
        self.waveform_buffers
            .retain(|signal, _| active_signals.iter().any(|active| active == signal));
        for (signal, waveform) in &frame.waveforms {
            append_waveform(&mut self.waveform_buffers, signal, waveform);
        }
        self.waveform_signature = Some(signature);
        self.last_waveform_sequence = frame.sequence;
    }

    fn reset_waveforms(&mut self) {
        self.waveform_buffers.clear();
        self.waveform_signature = None;
        self.last_waveform_sequence = None;
    }

    fn buffered_waveforms(&self) -> BTreeMap<String, BufferedWaveform> {
        self.waveform_buffers.clone()
    }
}

fn footer_with_notes(notes: &[String]) -> String {
    let _ = notes;
    "Live simulation display · not charted · not part of the medical record".to_string()
}

fn empty_model(state: SourceState, message: &str, alarm_feed_available: bool) -> DisplayModel {
    DisplayModel {
        title: "LIVE SIM MONITOR".to_string(),
        source: message.to_string(),
        state,
        sim_time: "--:--:--".to_string(),
        wall_time: None,
        numeric_tiles: build_tiles(&BTreeMap::new(), state),
        alarm_feed_available,
        alarms: Vec::new(),
        heart_rhythm: None,
        hr_tick_enabled: false,
        waveform_source_label: None,
        waveform_message: "waveform feed unavailable — no source frame".to_string(),
        waveform_strips: unavailable_strips("waveform feed unavailable — no source frame"),
        footer: "Live simulation display · not charted · not part of the medical record"
            .to_string(),
        compatibility_notes: Vec::new(),
    }
}

fn append_waveform(
    buffers: &mut BTreeMap<String, BufferedWaveform>,
    signal: &str,
    waveform: &Waveform,
) {
    let sample_interval_s = 1.0 / waveform.sample_rate_hz;
    let incoming_end_s =
        waveform.t0_s + (waveform.values.len().saturating_sub(1) as f64 * sample_interval_s);
    let reset = buffers
        .get(signal)
        .map(|existing| {
            existing.unit != waveform.unit
                || (existing.sample_rate_hz - waveform.sample_rate_hz).abs() > f64::EPSILON
                || incoming_end_s
                    < existing
                        .samples
                        .first()
                        .map(|sample| sample.t_s)
                        .unwrap_or(f64::INFINITY)
        })
        .unwrap_or(false);
    if reset {
        buffers.remove(signal);
    }
    let buffer = buffers
        .entry(signal.to_string())
        .or_insert_with(|| BufferedWaveform {
            unit: waveform.unit.clone(),
            sample_rate_hz: waveform.sample_rate_hz,
            samples: Vec::new(),
        });

    let last_time_s = buffer.samples.last().map(|sample| sample.t_s);
    let duplicate_epsilon_s = sample_interval_s * 0.5;
    for (idx, value) in waveform.values.iter().copied().enumerate() {
        let t_s = waveform.t0_s + idx as f64 * sample_interval_s;
        if last_time_s
            .map(|last| t_s <= last + duplicate_epsilon_s)
            .unwrap_or(false)
        {
            continue;
        }
        buffer.samples.push(WaveformSample { t_s, value });
    }

    if let Some(newest) = buffer.samples.last().map(|sample| sample.t_s) {
        let cutoff = newest - WAVEFORM_SWEEP_SECONDS;
        let first_keep = buffer
            .samples
            .iter()
            .position(|sample| sample.t_s >= cutoff)
            .unwrap_or(buffer.samples.len());
        if first_keep > 0 {
            buffer.samples.drain(0..first_keep);
        }
    }
}

fn waveform_source_label(source: &Option<WaveformSourceDetails>) -> Option<String> {
    source.as_ref().map(|source| {
        format!(
            "waveform sourceKind={} fidelity={} synthetic={}",
            source.source_kind, source.fidelity, source.synthetic
        )
    })
}

fn build_tiles(vitals: &BTreeMap<VitalKey, Quantity>, state: SourceState) -> Vec<NumericTile> {
    let offline = matches!(state, SourceState::Offline);
    let mut out = Vec::new();
    out.push(tile(
        vitals,
        VitalKey::HeartRate,
        "bpm",
        |v| format!("{:.0}", v),
        offline,
    ));
    let bp_value = if offline {
        "---".to_string()
    } else {
        match (
            vitals.get(&VitalKey::SystolicArterialPressure),
            vitals.get(&VitalKey::DiastolicArterialPressure),
            vitals.get(&VitalKey::MeanArterialPressure),
        ) {
            (Some(sys), Some(dia), Some(map)) => {
                format!("{:.0}/{:.0} ({:.0})", sys.value, dia.value, map.value)
            }
            (Some(sys), Some(dia), None) => format!("{:.0}/{:.0}", sys.value, dia.value),
            _ => "---".to_string(),
        }
    };
    out.push(NumericTile {
        key: "bp".to_string(),
        label: "BP/MAP".to_string(),
        value: bp_value,
        unit: "mmHg".to_string(),
        available: !offline
            && vitals.get(&VitalKey::SystolicArterialPressure).is_some()
            && vitals.get(&VitalKey::DiastolicArterialPressure).is_some(),
    });
    out.push(tile(
        vitals,
        VitalKey::PulseOximetry,
        "%",
        |v| format!("{:.0}", v * 100.0),
        offline,
    ));
    out.push(tile(
        vitals,
        VitalKey::RespirationRate,
        "/min",
        |v| format!("{:.0}", v),
        offline,
    ));
    out.push(tile(
        vitals,
        VitalKey::CoreTemperature,
        "°C",
        |v| format!("{:.1}", v),
        offline,
    ));
    out.push(tile(
        vitals,
        VitalKey::EndTidalCarbonDioxidePressure,
        "mmHg",
        |v| format!("{:.0}", v),
        offline,
    ));
    out
}

fn tile(
    vitals: &BTreeMap<VitalKey, Quantity>,
    key: VitalKey,
    unit: &str,
    fmt: impl Fn(f64) -> String,
    offline: bool,
) -> NumericTile {
    let value = vitals.get(&key).map(|q| fmt(q.value));
    NumericTile {
        key: key.pulse_name().to_string(),
        label: key.display_label().to_string(),
        value: if offline {
            "---".to_string()
        } else {
            value.clone().unwrap_or_else(|| "---".to_string())
        },
        unit: unit.to_string(),
        available: !offline && value.is_some(),
    }
}

fn display_sweep_now_s(accepted: &AcceptedFrame, now_millis: u64, state: SourceState) -> f64 {
    if accepted.frame.run_state.as_deref() == Some("running") && matches!(state, SourceState::Fresh)
    {
        let age_s = now_millis.saturating_sub(accepted.received_millis) as f64 / 1_000.0;
        return accepted.frame.sim_time_s + age_s.min(1.0);
    }
    accepted.frame.sim_time_s
}

fn build_waveform_strips(
    waveforms: &BTreeMap<String, BufferedWaveform>,
    state: SourceState,
    sweep_now_s: f64,
) -> Vec<WaveformStripModel> {
    if waveforms.is_empty() {
        return unavailable_strips("waveform feed unavailable — no synthetic ECG/pleth/capnogram");
    }
    let mut strips = Vec::new();
    for preferred in ["ECG_LeadII", "Pleth", "ArterialPressure", "CO2"] {
        if let Some(waveform) = waveforms.get(preferred) {
            strips.push(waveform_strip(preferred, waveform, state, sweep_now_s));
        }
    }
    for (name, waveform) in waveforms {
        if !strips.iter().any(|strip| strip.signal == *name) {
            strips.push(waveform_strip(name, waveform, state, sweep_now_s));
        }
    }
    strips
}

fn waveform_strip(
    name: &str,
    waveform: &BufferedWaveform,
    state: SourceState,
    sweep_now_s: f64,
) -> WaveformStripModel {
    let values = waveform
        .samples
        .iter()
        .map(|sample| sample.value)
        .collect::<Vec<_>>();
    let sample_times_s = waveform
        .samples
        .iter()
        .map(|sample| sample.t_s)
        .collect::<Vec<_>>();
    let (mut min, mut max) = values
        .iter()
        .fold((f64::INFINITY, f64::NEG_INFINITY), |(min, max), value| {
            (min.min(*value), max.max(*value))
        });
    if !min.is_finite() || !max.is_finite() || (max - min).abs() < f64::EPSILON {
        min = -1.0;
        max = 1.0;
    }
    let available = !matches!(state, SourceState::Offline | SourceState::Invalid)
        && !waveform.samples.is_empty();
    WaveformStripModel {
        signal: name.to_string(),
        unit: waveform.unit.clone(),
        sample_rate_hz: waveform.sample_rate_hz,
        t0_s: sample_times_s.first().copied().unwrap_or(0.0),
        values,
        sample_times_s,
        visible_window_s: WAVEFORM_SWEEP_SECONDS,
        sweep_now_s,
        min,
        max,
        available,
        message: if available {
            format!(
                "{} waveform feed available · {} samples @ {:.0} Hz · time sweep {:.0}s",
                display_signal_name(name),
                waveform.samples.len(),
                waveform.sample_rate_hz,
                WAVEFORM_SWEEP_SECONDS
            )
        } else {
            format!("{} waveform feed unavailable", display_signal_name(name))
        },
    }
}

fn unavailable_strips(message: &str) -> Vec<WaveformStripModel> {
    ["ECG", "Pleth", "ABP", "CO2"]
        .into_iter()
        .map(|signal| WaveformStripModel {
            signal: signal.to_string(),
            unit: String::new(),
            sample_rate_hz: 0.0,
            t0_s: 0.0,
            values: Vec::new(),
            sample_times_s: Vec::new(),
            visible_window_s: WAVEFORM_SWEEP_SECONDS,
            sweep_now_s: 0.0,
            min: -1.0,
            max: 1.0,
            available: false,
            message: if signal == "ECG" {
                message.to_string()
            } else {
                format!("{signal} waveform feed unavailable")
            },
        })
        .collect()
}

fn waveform_summary(strips: &[WaveformStripModel], state: SourceState) -> String {
    if matches!(state, SourceState::Offline | SourceState::Invalid) {
        return "waveform feed unavailable — source not live".to_string();
    }
    let available = strips.iter().filter(|strip| strip.available).count();
    if available == 0 {
        "waveform feed unavailable — no synthetic ECG/pleth/capnogram".to_string()
    } else {
        format!("waveform feed available — {available} frame-provided strip(s)")
    }
}

fn display_signal_name(name: &str) -> &str {
    match name {
        "ECG_LeadII" => "ECG Lead II",
        "ArterialPressure" => "ABP",
        other => other,
    }
}

fn severity_for(label: &str) -> AlarmSeverity {
    let normalized = label.to_ascii_uppercase();
    if matches!(
        label,
        "CardiacArrest"
            | "Asystole"
            | "CoarseVentricularFibrillation"
            | "FineVentricularFibrillation"
            | "PulselessVentricularTachycardia"
            | "HypovolemicShock"
            | "CardiogenicShock"
            | "CriticalBrainOxygenDeficit"
    ) || normalized.contains("CRITICAL")
        || normalized.contains("ARREST")
    {
        AlarmSeverity::Critical
    } else if matches!(
        label,
        "Tachycardia"
            | "Bradycardia"
            | "Tachypnea"
            | "Bradypnea"
            | "Hypoxia"
            | "Hypercapnia"
            | "Hyperthermia"
            | "Hypothermia"
    ) || normalized.ends_with("_LOW")
        || normalized.ends_with("_HIGH")
    {
        AlarmSeverity::Warning
    } else {
        AlarmSeverity::Info
    }
}

fn hr_tick_enabled(frame: &PublicFrame, state: SourceState) -> bool {
    if matches!(
        state,
        SourceState::Offline | SourceState::Stale | SourceState::Invalid
    ) {
        return false;
    }
    if matches!(
        frame.heart_rhythm.as_deref(),
        Some("Asystole" | "PulselessVentricularTachycardia")
    ) {
        return false;
    }
    frame
        .vitals
        .get(&VitalKey::HeartRate)
        .map(|hr| hr.value > 0.0 && hr.value.is_finite())
        .unwrap_or(false)
}

pub fn format_sim_time(seconds: f64) -> String {
    if !seconds.is_finite() || seconds < 0.0 {
        return "--:--:--".to_string();
    }
    let total = seconds.round() as u64;
    let h = total / 3600;
    let m = (total % 3600) / 60;
    let s = total % 60;
    format!("{h:02}:{m:02}:{s:02}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use pulse_public_frame::parse_public_frame;

    #[test]
    fn formats_sim_time() {
        assert_eq!(format_sim_time(842.04), "00:14:02");
    }

    #[test]
    fn renders_fresh_display_and_hr_tick() {
        let frame = parse_public_frame(r#"{"t":44,"hr":72,"map":95,"bp_sys":114,"bp_dia":73,"rr":12,"temp_c":37,"etco2_mmHg":36,"spo2":97,"alarms":[]}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 1_000);
        let model = core.display_model(1_500);
        assert_eq!(model.state, SourceState::Fresh);
        assert_eq!(model.sim_time, "00:00:44");
        assert!(model.hr_tick_enabled);
        assert!(model.footer.contains("not charted"));
        assert!(model.waveform_message.contains("unavailable"));
        assert!(model.waveform_strips.iter().all(|strip| !strip.available));
    }

    #[test]
    fn stale_offline_and_invalid_are_distinct() {
        let frame = parse_public_frame(r#"{"t":1,"hr":72,"alarms":[]}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        assert_eq!(core.display_model(2_000).state, SourceState::Stale);
        assert_eq!(core.display_model(11_000).state, SourceState::Offline);
        core.mark_invalid("bad json");
        assert_eq!(core.display_model(1_000).state, SourceState::Invalid);
        core.mark_offline("missing");
        assert_eq!(core.display_model(1_000).state, SourceState::Offline);
    }

    #[test]
    fn missing_alarm_feed_is_not_normal() {
        let frame = parse_public_frame(r#"{"t":1,"hr":72}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        assert!(!core.display_model(100).alarm_feed_available);
    }

    #[test]
    fn live_frame_update_changes_display_without_restart() {
        let first = parse_public_frame(
            r#"{"t":1,"hr":72,"map":95,"bp_sys":114,"bp_dia":73,"spo2":97,"alarms":[]}"#,
        )
        .unwrap();
        let second = parse_public_frame(r#"{"t":2,"hr":88,"map":82,"bp_sys":106,"bp_dia":64,"spo2":94,"alarms":["Tachycardia"]}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(first, 0);
        let first_model = core.display_model(100);
        core.accept_frame(second, 1_000);
        let second_model = core.display_model(1_100);
        assert!(
            first_model
                .numeric_tiles
                .iter()
                .any(|tile| tile.label == "HR" && tile.value == "72")
        );
        assert!(
            second_model
                .numeric_tiles
                .iter()
                .any(|tile| tile.label == "HR" && tile.value == "88")
        );
        assert_eq!(second_model.alarms[0].label, "Tachycardia");
    }

    #[test]
    fn suppresses_tick_for_asystole() {
        let frame = parse_public_frame(r#"{"schemaVersion":1,"source":"pi-sim/pulse","simTime_s":1,"vitals":{"HeartRate":{"value":40,"unit":"1/min"}},"events":[],"heartRhythm":"Asystole","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":0,"values":[0,0,0]}}}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        assert!(!core.display_model(100).hr_tick_enabled);
    }

    #[test]
    fn unavailable_run_state_is_offline_like() {
        let frame = parse_public_frame(
            r#"{"t":0,"monitor":{"schemaVersion":1,"source":"pi-sim-pulse","sequence":0,"runState":"unavailable","events":["PROVIDER_UNAVAILABLE"],"heartRhythm":"unavailable"}}"#,
        )
        .unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        assert_eq!(core.display_model(100).state, SourceState::Offline);
    }

    #[test]
    fn exposes_waveform_strip_models_when_samples_arrive() {
        let frame = parse_public_frame(r#"{"t":44,"hr":72,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-pulse","sequence":1,"runState":"running","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":43,"values":[-0.1,0.8,0.1]}}}}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(frame, 0);
        let model = core.display_model(100);
        assert!(model.waveform_message.contains("available"));
        let ecg = model
            .waveform_strips
            .iter()
            .find(|strip| strip.signal == "ECG_LeadII")
            .unwrap();
        assert!(ecg.available);
        assert_eq!(ecg.sample_rate_hz, 125.0);
        assert_eq!(ecg.values.len(), 3);
        assert!(ecg.max > ecg.min);
    }

    #[test]
    fn waveform_samples_update_with_frame_sequence() {
        let first = parse_public_frame(r#"{"t":1,"hr":72,"alarms":[],"monitor":{"schemaVersion":1,"sequence":1,"waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":0,"values":[0,1,0]}}}}"#).unwrap();
        let second = parse_public_frame(r#"{"t":2,"hr":73,"alarms":[],"monitor":{"schemaVersion":1,"sequence":2,"waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":1,"values":[0,-1,0]}}}}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(first, 0);
        let first_values = core.display_model(100).waveform_strips[0].values.clone();
        core.accept_frame(second, 1_000);
        let model = core.display_model(1_100);
        assert_eq!(first_values, vec![0.0, 1.0, 0.0]);
        assert_eq!(
            model.waveform_strips[0].values,
            vec![0.0, 1.0, 0.0, 0.0, -1.0, 0.0]
        );
        assert!(
            model
                .numeric_tiles
                .iter()
                .any(|tile| tile.label == "HR" && tile.value == "73")
        );
    }

    #[test]
    fn waveform_overlap_windows_are_deduped_by_sample_time() {
        let first = parse_public_frame(r#"{"t":0,"hr":72,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":1,"runState":"running","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":2,"t0_s":0,"values":[0,1]}}}}"#).unwrap();
        let overlapping = parse_public_frame(r#"{"t":0.5,"hr":72,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":2,"runState":"running","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":2,"t0_s":0,"values":[0,1,2]}}}}"#).unwrap();
        let mut core = MonitorCore::new();
        core.accept_frame(first, 0);
        core.accept_frame(overlapping, 500);
        let strip = core.display_model(600).waveform_strips[0].clone();
        assert_eq!(strip.values, vec![0.0, 1.0, 2.0]);
        assert_eq!(strip.sample_times_s, vec![0.0, 0.5, 1.0]);
        assert_eq!(strip.visible_window_s, WAVEFORM_SWEEP_SECONDS);
        assert!(strip.sweep_now_s >= 0.5);
    }

    #[test]
    fn waveform_buffers_trim_reset_and_show_source_label() {
        let mut first = parse_public_frame(r#"{"t":1,"hr":72,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":1,"runState":"running","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":1,"t0_s":0,"values":[1,2,3,4,5,6,7,8]}}}}"#).unwrap();
        first.waveform_source = Some(WaveformSourceDetails {
            source_kind: "demo".to_string(),
            fidelity: "demo".to_string(),
            synthetic: true,
        });
        let mut second = parse_public_frame(r#"{"t":13,"hr":73,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":2,"runState":"running","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":1,"t0_s":8,"values":[9,10,11,12,13,14,15,16]}}}}"#).unwrap();
        second.waveform_source = first.waveform_source.clone();
        let unavailable = parse_public_frame(r#"{"t":8,"hr":73,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":3,"runState":"unavailable","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":1,"t0_s":8,"values":[9]}}}}"#).unwrap();

        let mut core = MonitorCore::new();
        core.accept_frame(first, 0);
        core.accept_frame(second, 1_000);
        let model = core.display_model(1_100);
        let ecg = model
            .waveform_strips
            .iter()
            .find(|strip| strip.signal == "ECG_LeadII")
            .unwrap();
        assert_eq!(
            ecg.values,
            vec![
                4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0
            ]
        );
        assert_eq!(
            model.waveform_source_label.as_deref(),
            Some("waveform sourceKind=demo fidelity=demo synthetic=true")
        );

        core.accept_frame(unavailable, 2_000);
        let offline_model = core.display_model(2_100);
        assert!(
            offline_model
                .waveform_strips
                .iter()
                .all(|strip| !strip.available)
        );
    }
}
