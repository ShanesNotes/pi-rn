use pulse_public_frame::{PublicFrame, Quantity, VitalKey, Waveform};
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
    pub waveform_message: String,
    pub waveform_strips: Vec<WaveformStripModel>,
    pub footer: String,
    pub compatibility_notes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct MonitorCore {
    last_valid: Option<AcceptedFrame>,
    forced_state: Option<SourceState>,
    invalid_message: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AcceptedFrame {
    pub frame: PublicFrame,
    pub received_millis: u64,
}

impl Default for MonitorCore {
    fn default() -> Self {
        Self::new()
    }
}

impl MonitorCore {
    pub fn new() -> Self {
        Self {
            last_valid: None,
            forced_state: None,
            invalid_message: None,
        }
    }

    pub fn accept_frame(&mut self, frame: PublicFrame, received_millis: u64) {
        self.invalid_message = None;
        self.forced_state = None;
        self.last_valid = Some(AcceptedFrame {
            frame,
            received_millis,
        });
    }

    pub fn mark_invalid(&mut self, message: impl Into<String>) {
        self.invalid_message = Some(message.into());
        self.forced_state = Some(SourceState::Invalid);
    }

    pub fn mark_offline(&mut self, message: impl Into<String>) {
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
        let waveform_strips = build_waveform_strips(&accepted.frame.waveforms, state);
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
            waveform_message,
            waveform_strips,
            footer: "Live simulation display · not charted · not part of the medical record"
                .to_string(),
            compatibility_notes: accepted.frame.compatibility_notes.clone(),
        }
    }
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
        waveform_message: "waveform feed unavailable — no source frame".to_string(),
        waveform_strips: unavailable_strips("waveform feed unavailable — no source frame"),
        footer: "Live simulation display · not charted · not part of the medical record"
            .to_string(),
        compatibility_notes: Vec::new(),
    }
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

fn build_waveform_strips(
    waveforms: &BTreeMap<String, Waveform>,
    state: SourceState,
) -> Vec<WaveformStripModel> {
    if waveforms.is_empty() {
        return unavailable_strips("waveform feed unavailable — no synthetic ECG/pleth/capnogram");
    }
    let mut strips = Vec::new();
    for preferred in ["ECG_LeadII", "Pleth", "ArterialPressure", "CO2"] {
        if let Some(waveform) = waveforms.get(preferred) {
            strips.push(waveform_strip(preferred, waveform, state));
        }
    }
    for (name, waveform) in waveforms {
        if !strips.iter().any(|strip| strip.signal == *name) {
            strips.push(waveform_strip(name, waveform, state));
        }
    }
    strips
}

fn waveform_strip(name: &str, waveform: &Waveform, state: SourceState) -> WaveformStripModel {
    let (mut min, mut max) = waveform
        .values
        .iter()
        .fold((f64::INFINITY, f64::NEG_INFINITY), |(min, max), value| {
            (min.min(*value), max.max(*value))
        });
    if !min.is_finite() || !max.is_finite() || (max - min).abs() < f64::EPSILON {
        min = -1.0;
        max = 1.0;
    }
    let available = !matches!(state, SourceState::Offline | SourceState::Invalid)
        && !waveform.values.is_empty();
    WaveformStripModel {
        signal: name.to_string(),
        unit: waveform.unit.clone(),
        sample_rate_hz: waveform.sample_rate_hz,
        t0_s: waveform.t0_s,
        values: waveform.values.clone(),
        min,
        max,
        available,
        message: if available {
            format!(
                "{} waveform feed available · {} samples @ {:.0} Hz",
                display_signal_name(name),
                waveform.values.len(),
                waveform.sample_rate_hz
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
        assert_ne!(first_values, model.waveform_strips[0].values);
        assert!(
            model
                .numeric_tiles
                .iter()
                .any(|tile| tile.label == "HR" && tile.value == "73")
        );
    }
}
