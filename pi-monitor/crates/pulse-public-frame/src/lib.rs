use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Quantity {
    pub value: f64,
    pub unit: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Waveform {
    pub unit: String,
    #[serde(rename = "sampleRate_Hz")]
    pub sample_rate_hz: f64,
    pub t0_s: f64,
    pub values: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TargetFrame {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub source: String,
    pub sequence: Option<u64>,
    #[serde(rename = "runState")]
    pub run_state: Option<String>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    pub vitals: BTreeMap<String, Quantity>,
    #[serde(default)]
    pub events: Option<Vec<String>>,
    #[serde(rename = "heartRhythm")]
    pub heart_rhythm: Option<String>,
    #[serde(default)]
    pub waveforms: BTreeMap<String, Waveform>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MonitorExtension {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub source: Option<String>,
    pub sequence: Option<u64>,
    #[serde(rename = "runState")]
    pub run_state: Option<String>,
    #[serde(default)]
    pub events: Option<Vec<String>>,
    #[serde(rename = "heartRhythm")]
    pub heart_rhythm: Option<String>,
    #[serde(default)]
    pub waveforms: BTreeMap<String, Waveform>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CurrentScalarFrame {
    pub t: f64,
    pub hr: Option<f64>,
    pub map: Option<f64>,
    pub bp_sys: Option<f64>,
    pub bp_dia: Option<f64>,
    pub rr: Option<f64>,
    pub temp_c: Option<f64>,
    #[serde(rename = "etco2_mmHg")]
    pub etco2_mmhg: Option<f64>,
    pub spo2: Option<f64>,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    #[serde(default)]
    pub alarms: Option<Vec<String>>,
    #[serde(default)]
    pub monitor: Option<MonitorExtension>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PublicLaneManifest {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub producer: String,
    #[serde(rename = "resetSemantics")]
    pub reset_semantics: String,
    pub lanes: Vec<PublicLaneSpec>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PublicLaneSpec {
    pub name: String,
    pub path: String,
    #[serde(rename = "artifactKind")]
    pub artifact_kind: String,
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "recordSchemaVersion")]
    pub record_schema_version: Option<u32>,
    #[serde(rename = "writeSemantics")]
    pub write_semantics: Vec<String>,
    #[serde(rename = "resetSemantics")]
    pub reset_semantics: String,
    pub producer: String,
    #[serde(rename = "preferredConsumerMode")]
    pub preferred_consumer_mode: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RunStatus {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub source: String,
    pub sequence: Option<u64>,
    #[serde(rename = "runState")]
    pub run_state: String,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PublicEventV2 {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "eventIndex")]
    pub event_index: u64,
    pub sequence: Option<u64>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    pub source: String,
    #[serde(rename = "runState")]
    pub run_state: String,
    pub kind: String,
    #[serde(default)]
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EncounterCurrent {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "patientId")]
    pub patient_id: String,
    #[serde(rename = "encounterId")]
    pub encounter_id: String,
    #[serde(rename = "visibleChartAsOf")]
    pub visible_chart_as_of: String,
    pub sequence: Option<u64>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    pub source: String,
    #[serde(rename = "runState")]
    pub run_state: String,
    pub phase: Option<String>,
    #[serde(default)]
    pub display: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AssessmentStatus {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub sequence: Option<u64>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    pub source: String,
    #[serde(rename = "runState")]
    pub run_state: String,
    pub available: bool,
    #[serde(rename = "lastRequestId")]
    pub last_request_id: Option<String>,
    #[serde(rename = "lastRevealSequence")]
    pub last_reveal_sequence: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AssessmentCurrent {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    #[serde(rename = "requestId")]
    pub request_id: String,
    #[serde(rename = "assessmentType")]
    pub assessment_type: String,
    pub visibility: String,
    pub sequence: Option<u64>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    pub source: String,
    #[serde(rename = "runState")]
    pub run_state: String,
    #[serde(default)]
    pub findings: Vec<serde_json::Value>,
    #[serde(rename = "bodySystem")]
    pub body_system: Option<String>,
    pub summary: Option<String>,
    #[serde(default)]
    pub evidence: Vec<serde_json::Value>,
    #[serde(rename = "envelopeDigest")]
    pub envelope_digest: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WaveformStatus {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub sequence: Option<u64>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    pub source: String,
    #[serde(rename = "runState")]
    pub run_state: String,
    pub available: bool,
    pub reason: Option<String>,
    #[serde(rename = "sourceKind")]
    pub source_kind: Option<String>,
    pub fidelity: Option<String>,
    pub synthetic: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WaveformCurrent {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub sequence: Option<u64>,
    #[serde(rename = "simTime_s")]
    pub sim_time_s: f64,
    #[serde(rename = "wallTime")]
    pub wall_time: Option<String>,
    pub source: String,
    #[serde(rename = "runState")]
    pub run_state: String,
    pub available: bool,
    #[serde(rename = "sourceKind")]
    pub source_kind: Option<String>,
    pub fidelity: Option<String>,
    pub synthetic: Option<bool>,
    #[serde(default)]
    pub windows: BTreeMap<String, Waveform>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct WaveformSourceDetails {
    pub source_kind: String,
    pub fidelity: String,
    pub synthetic: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FrameVariant {
    Target(TargetFrame),
    CurrentScalar(CurrentScalarFrame),
}

#[derive(Debug, Clone, PartialEq)]
pub struct PublicFrame {
    pub source: String,
    pub sequence: Option<u64>,
    pub run_state: Option<String>,
    pub sim_time_s: f64,
    pub wall_time: Option<String>,
    pub vitals: BTreeMap<VitalKey, Quantity>,
    pub alarms: AlarmFeed,
    pub heart_rhythm: Option<String>,
    pub waveforms: BTreeMap<String, Waveform>,
    pub waveform_source: Option<WaveformSourceDetails>,
    pub compatibility_notes: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum VitalKey {
    HeartRate,
    SystolicArterialPressure,
    DiastolicArterialPressure,
    MeanArterialPressure,
    PulseOximetry,
    RespirationRate,
    CoreTemperature,
    EndTidalCarbonDioxidePressure,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AlarmFeed {
    Unavailable,
    Available(Vec<String>),
}

impl AlarmFeed {
    pub fn is_available(&self) -> bool {
        matches!(self, AlarmFeed::Available(_))
    }

    pub fn values(&self) -> &[String] {
        match self {
            AlarmFeed::Unavailable => &[],
            AlarmFeed::Available(values) => values.as_slice(),
        }
    }
}

impl VitalKey {
    pub fn pulse_name(self) -> &'static str {
        match self {
            VitalKey::HeartRate => "HeartRate",
            VitalKey::SystolicArterialPressure => "SystolicArterialPressure",
            VitalKey::DiastolicArterialPressure => "DiastolicArterialPressure",
            VitalKey::MeanArterialPressure => "MeanArterialPressure",
            VitalKey::PulseOximetry => "PulseOximetry",
            VitalKey::RespirationRate => "RespirationRate",
            VitalKey::CoreTemperature => "CoreTemperature",
            VitalKey::EndTidalCarbonDioxidePressure => "EndTidalCarbonDioxidePressure",
        }
    }

    pub fn display_label(self) -> &'static str {
        match self {
            VitalKey::HeartRate => "HR",
            VitalKey::SystolicArterialPressure => "SYS",
            VitalKey::DiastolicArterialPressure => "DIA",
            VitalKey::MeanArterialPressure => "MAP",
            VitalKey::PulseOximetry => "SpO2",
            VitalKey::RespirationRate => "RR",
            VitalKey::CoreTemperature => "TEMP",
            VitalKey::EndTidalCarbonDioxidePressure => "EtCO2",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum FrameError {
    Json(String),
    UnsupportedShape,
    InvalidNumber {
        field: String,
        value: f64,
    },
    InvalidUnit {
        field: String,
        unit: String,
        expected: String,
    },
    MissingRequired(String),
}

impl std::fmt::Display for FrameError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FrameError::Json(message) => write!(f, "invalid JSON: {message}"),
            FrameError::UnsupportedShape => write!(f, "unsupported public frame shape"),
            FrameError::InvalidNumber { field, value } => {
                write!(f, "invalid numeric value for {field}: {value}")
            }
            FrameError::InvalidUnit {
                field,
                unit,
                expected,
            } => write!(
                f,
                "invalid unit for {field}: got {unit}, expected {expected}"
            ),
            FrameError::MissingRequired(field) => write!(f, "missing required field {field}"),
        }
    }
}

impl std::error::Error for FrameError {}

pub fn parse_public_frame(input: &str) -> Result<PublicFrame, FrameError> {
    let value: serde_json::Value =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    if value.get("schemaVersion").is_some()
        || value.get("schema_version").is_some()
        || value.get("vitals").is_some()
    {
        let frame: TargetFrame =
            serde_json::from_value(value).map_err(|err| FrameError::Json(err.to_string()))?;
        normalize_target(frame)
    } else if value.get("t").is_some() {
        let frame: CurrentScalarFrame =
            serde_json::from_value(value).map_err(|err| FrameError::Json(err.to_string()))?;
        normalize_current_scalar(frame)
    } else {
        Err(FrameError::UnsupportedShape)
    }
}

pub fn parse_lane_manifest(input: &str) -> Result<PublicLaneManifest, FrameError> {
    let manifest: PublicLaneManifest =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("manifest.schemaVersion", manifest.schema_version)?;
    if manifest.lanes.is_empty() {
        return Err(FrameError::MissingRequired("lanes".to_string()));
    }
    Ok(manifest)
}

pub fn parse_run_status(input: &str) -> Result<RunStatus, FrameError> {
    let status: RunStatus =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("status.schemaVersion", status.schema_version)?;
    finite("status.simTime_s", status.sim_time_s)?;
    if status.source.trim().is_empty() {
        return Err(FrameError::MissingRequired("status.source".to_string()));
    }
    if status.run_state.trim().is_empty() {
        return Err(FrameError::MissingRequired("status.runState".to_string()));
    }
    Ok(status)
}

pub fn parse_public_events_jsonl(input: &str) -> Result<Vec<PublicEventV2>, FrameError> {
    let mut events = Vec::new();
    let mut expected_index = 0;
    for (line_number, line) in input.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let event: PublicEventV2 =
            serde_json::from_str(line).map_err(|err| FrameError::Json(err.to_string()))?;
        if event.schema_version != 2 {
            return Err(FrameError::InvalidNumber {
                field: format!("events.jsonl:{} schemaVersion", line_number + 1),
                value: event.schema_version as f64,
            });
        }
        if event.event_index != expected_index {
            return Err(FrameError::InvalidNumber {
                field: format!("events.jsonl:{} eventIndex", line_number + 1),
                value: event.event_index as f64,
            });
        }
        finite("event.simTime_s", event.sim_time_s)?;
        if event.kind.trim().is_empty() {
            return Err(FrameError::MissingRequired("event.kind".to_string()));
        }
        expected_index += 1;
        events.push(event);
    }
    Ok(events)
}

pub fn parse_encounter_current(input: &str) -> Result<EncounterCurrent, FrameError> {
    let encounter: EncounterCurrent =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("encounter.schemaVersion", encounter.schema_version)?;
    finite("encounter.simTime_s", encounter.sim_time_s)?;
    Ok(encounter)
}

pub fn parse_assessment_status(input: &str) -> Result<AssessmentStatus, FrameError> {
    let status: AssessmentStatus =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("assessment.status.schemaVersion", status.schema_version)?;
    finite("assessment.status.simTime_s", status.sim_time_s)?;
    Ok(status)
}

pub fn parse_assessment_current(input: &str) -> Result<AssessmentCurrent, FrameError> {
    let current: AssessmentCurrent =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("assessment.current.schemaVersion", current.schema_version)?;
    finite("assessment.current.simTime_s", current.sim_time_s)?;
    Ok(current)
}

pub fn parse_waveform_status(input: &str) -> Result<WaveformStatus, FrameError> {
    let status: WaveformStatus =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("waveform.status.schemaVersion", status.schema_version)?;
    finite("waveform.status.simTime_s", status.sim_time_s)?;
    Ok(status)
}

pub fn parse_waveform_current(input: &str) -> Result<WaveformCurrent, FrameError> {
    let current: WaveformCurrent =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    validate_schema_version("waveform.current.schemaVersion", current.schema_version)?;
    finite("waveform.current.simTime_s", current.sim_time_s)?;
    if !current.available {
        return Err(FrameError::MissingRequired(
            "waveform.current.available true".to_string(),
        ));
    }
    validate_waveforms(&current.windows)?;
    Ok(current)
}

pub fn normalize_target(frame: TargetFrame) -> Result<PublicFrame, FrameError> {
    finite("simTime_s", frame.sim_time_s)?;
    validate_schema_version("schemaVersion", frame.schema_version)?;
    validate_waveforms(&frame.waveforms)?;
    let mut vitals = BTreeMap::new();
    let mut notes = Vec::new();
    for key in [
        VitalKey::HeartRate,
        VitalKey::SystolicArterialPressure,
        VitalKey::DiastolicArterialPressure,
        VitalKey::MeanArterialPressure,
        VitalKey::PulseOximetry,
        VitalKey::RespirationRate,
        VitalKey::CoreTemperature,
        VitalKey::EndTidalCarbonDioxidePressure,
    ] {
        if let Some(quantity) = frame.vitals.get(key.pulse_name()) {
            validate_quantity(key.pulse_name(), quantity, expected_unit(key))?;
            let mut q = quantity.clone();
            if key == VitalKey::PulseOximetry && q.value > 1.0 && q.value <= 100.0 {
                notes.push(
                    "PulseOximetry arrived percent-like; normalized to unitless 0-1".to_string(),
                );
                q.value /= 100.0;
            }
            vitals.insert(key, q);
        }
    }
    let alarms = match frame.events {
        Some(events) => AlarmFeed::Available(events),
        None => AlarmFeed::Unavailable,
    };
    Ok(PublicFrame {
        source: frame.source,
        sequence: frame.sequence,
        run_state: frame.run_state,
        sim_time_s: frame.sim_time_s,
        wall_time: None,
        vitals,
        alarms,
        heart_rhythm: frame.heart_rhythm,
        waveforms: frame.waveforms,
        waveform_source: None,
        compatibility_notes: notes,
    })
}

pub fn normalize_current_scalar(frame: CurrentScalarFrame) -> Result<PublicFrame, FrameError> {
    finite("t", frame.t)?;
    let CurrentScalarFrame {
        t,
        hr,
        map,
        bp_sys,
        bp_dia,
        rr,
        temp_c,
        etco2_mmhg,
        spo2,
        wall_time,
        alarms,
        monitor,
    } = frame;
    let mut vitals = BTreeMap::new();
    let mut notes = vec!["compatibility: parsed legacy lowercase scalar current.json".to_string()];
    insert_optional(&mut vitals, VitalKey::HeartRate, hr, "1/min")?;
    insert_optional(
        &mut vitals,
        VitalKey::SystolicArterialPressure,
        bp_sys,
        "mmHg",
    )?;
    insert_optional(
        &mut vitals,
        VitalKey::DiastolicArterialPressure,
        bp_dia,
        "mmHg",
    )?;
    insert_optional(&mut vitals, VitalKey::MeanArterialPressure, map, "mmHg")?;
    insert_optional(&mut vitals, VitalKey::RespirationRate, rr, "1/min")?;
    insert_optional(&mut vitals, VitalKey::CoreTemperature, temp_c, "degC")?;
    insert_optional(
        &mut vitals,
        VitalKey::EndTidalCarbonDioxidePressure,
        etco2_mmhg,
        "mmHg",
    )?;
    if let Some(mut spo2) = spo2 {
        finite("spo2", spo2)?;
        if spo2 > 1.0 && spo2 <= 100.0 {
            notes.push(
                "compatibility: legacy spo2 percent normalized to PulseOximetry unitless 0-1"
                    .to_string(),
            );
            spo2 /= 100.0;
        }
        if !(0.0..=1.0).contains(&spo2) {
            return Err(FrameError::InvalidNumber {
                field: "spo2".to_string(),
                value: spo2,
            });
        }
        vitals.insert(
            VitalKey::PulseOximetry,
            Quantity {
                value: spo2,
                unit: "unitless".to_string(),
            },
        );
    }

    let mut source = "pi-sim/current.json".to_string();
    let mut sequence = None;
    let mut run_state = None;
    let mut heart_rhythm = None;
    let mut waveforms = BTreeMap::new();
    let alarm_feed = match (monitor, alarms) {
        (Some(extension), legacy_alarms) => {
            validate_schema_version("monitor.schemaVersion", extension.schema_version)?;
            validate_waveforms(&extension.waveforms)?;
            source = extension
                .source
                .unwrap_or_else(|| "pi-sim/current.json#monitor".to_string());
            sequence = extension.sequence;
            run_state = extension.run_state;
            heart_rhythm = extension.heart_rhythm;
            waveforms = extension.waveforms;
            notes.push("compatibility: applied monitor extension from current.json".to_string());
            match extension.events.or(legacy_alarms) {
                Some(events) => AlarmFeed::Available(events),
                None => AlarmFeed::Unavailable,
            }
        }
        (None, Some(legacy_alarms)) => AlarmFeed::Available(legacy_alarms),
        (None, None) => AlarmFeed::Unavailable,
    };

    Ok(PublicFrame {
        source,
        sequence,
        run_state,
        sim_time_s: t,
        wall_time,
        vitals,
        alarms: alarm_feed,
        heart_rhythm,
        waveforms,
        waveform_source: None,
        compatibility_notes: notes,
    })
}

fn insert_optional(
    vitals: &mut BTreeMap<VitalKey, Quantity>,
    key: VitalKey,
    value: Option<f64>,
    unit: &str,
) -> Result<(), FrameError> {
    if let Some(value) = value {
        finite(key.pulse_name(), value)?;
        vitals.insert(
            key,
            Quantity {
                value,
                unit: unit.to_string(),
            },
        );
    }
    Ok(())
}

fn validate_quantity(field: &str, quantity: &Quantity, expected: &str) -> Result<(), FrameError> {
    finite(field, quantity.value)?;
    if quantity.unit != expected {
        return Err(FrameError::InvalidUnit {
            field: field.to_string(),
            unit: quantity.unit.clone(),
            expected: expected.to_string(),
        });
    }
    Ok(())
}

fn validate_schema_version(field: &str, value: u32) -> Result<(), FrameError> {
    if value == 0 {
        return Err(FrameError::InvalidNumber {
            field: field.to_string(),
            value: value as f64,
        });
    }
    Ok(())
}

fn validate_waveforms(waveforms: &BTreeMap<String, Waveform>) -> Result<(), FrameError> {
    for (name, waveform) in waveforms {
        if name.trim().is_empty() {
            return Err(FrameError::MissingRequired("waveform name".to_string()));
        }
        if waveform.unit.trim().is_empty() {
            return Err(FrameError::MissingRequired(format!("{name}.unit")));
        }
        finite(&format!("{name}.sampleRate_Hz"), waveform.sample_rate_hz)?;
        if waveform.sample_rate_hz <= 0.0 {
            return Err(FrameError::InvalidNumber {
                field: format!("{name}.sampleRate_Hz"),
                value: waveform.sample_rate_hz,
            });
        }
        finite(&format!("{name}.t0_s"), waveform.t0_s)?;
        if waveform.values.is_empty() {
            return Err(FrameError::MissingRequired(format!("{name}.values")));
        }
        for value in &waveform.values {
            finite(&format!("{name}.values"), *value)?;
        }
    }
    Ok(())
}

fn expected_unit(key: VitalKey) -> &'static str {
    match key {
        VitalKey::HeartRate | VitalKey::RespirationRate => "1/min",
        VitalKey::SystolicArterialPressure
        | VitalKey::DiastolicArterialPressure
        | VitalKey::MeanArterialPressure
        | VitalKey::EndTidalCarbonDioxidePressure => "mmHg",
        VitalKey::PulseOximetry => "unitless",
        VitalKey::CoreTemperature => "degC",
    }
}

fn finite(field: &str, value: f64) -> Result<(), FrameError> {
    if value.is_finite() {
        Ok(())
    } else {
        Err(FrameError::InvalidNumber {
            field: field.to_string(),
            value,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_legacy_current_and_normalizes_spo2_percent() {
        let frame = parse_public_frame(r#"{"t":44,"hr":72.0,"map":95,"bp_sys":114,"bp_dia":73,"rr":12,"temp_c":37.0,"etco2_mmHg":36,"spo2":97.4,"wallTime":"now","alarms":[]}"#).unwrap();
        assert_eq!(frame.sim_time_s, 44.0);
        assert!((frame.vitals[&VitalKey::PulseOximetry].value - 0.974).abs() < 1e-9);
        assert!(frame.alarms.is_available());
        assert!(
            frame
                .compatibility_notes
                .iter()
                .any(|note| note.contains("percent"))
        );
    }

    #[test]
    fn missing_alarms_means_unavailable() {
        let frame = parse_public_frame(r#"{"t":1,"hr":72}"#).unwrap();
        assert_eq!(frame.alarms, AlarmFeed::Unavailable);
    }

    #[test]
    fn rejects_impossible_spo2() {
        let err = parse_public_frame(r#"{"t":1,"spo2":120}"#).unwrap_err();
        assert!(format!("{err}").contains("spo2"));
    }

    #[test]
    fn parses_target_frame() {
        let frame = parse_public_frame(r#"{"schemaVersion":1,"source":"pi-sim/pulse","sequence":7,"runState":"running","simTime_s":2,"vitals":{"HeartRate":{"value":70,"unit":"1/min"},"PulseOximetry":{"value":0.98,"unit":"unitless"}},"events":["Tachycardia"],"heartRhythm":"NormalSinus","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":1,"values":[0,1,0]}}}"#).unwrap();
        assert_eq!(frame.sequence, Some(7));
        assert_eq!(frame.alarms.values(), &["Tachycardia".to_string()]);
        assert_eq!(frame.heart_rhythm.as_deref(), Some("NormalSinus"));
        assert_eq!(frame.waveforms["ECG_LeadII"].values.len(), 3);
    }

    #[test]
    fn parses_legacy_current_with_monitor_extension() {
        let frame = parse_public_frame(r#"{"t":44,"hr":72,"spo2":97,"alarms":["MAP_LOW"],"monitor":{"schemaVersion":1,"source":"pi-sim-pulse","sequence":42,"runState":"running","events":["Tachycardia"],"heartRhythm":"sinus","waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":42,"values":[0,0.8,-0.1]}}}}"#).unwrap();
        assert_eq!(frame.source, "pi-sim-pulse");
        assert_eq!(frame.sequence, Some(42));
        assert_eq!(frame.run_state.as_deref(), Some("running"));
        assert_eq!(frame.alarms.values(), &["Tachycardia".to_string()]);
        assert_eq!(frame.heart_rhythm.as_deref(), Some("sinus"));
        assert_eq!(frame.waveforms["ECG_LeadII"].sample_rate_hz, 125.0);
        assert!(
            frame
                .compatibility_notes
                .iter()
                .any(|note| note.contains("monitor extension"))
        );
    }

    #[test]
    fn rejects_malformed_monitor_waveform() {
        let err = parse_public_frame(r#"{"t":1,"hr":72,"monitor":{"schemaVersion":1,"waveforms":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":0,"t0_s":0,"values":[0]}}}}"#).unwrap_err();
        assert!(format!("{err}").contains("sampleRate"));
    }

    #[test]
    fn parses_public_lane_models_with_mixed_case_fields() {
        let status = parse_run_status(
            r#"{"schemaVersion":1,"source":"pi-sim-scripted","sequence":4,"runState":"ended","simTime_s":30,"updatedAt":"now"}"#,
        )
        .unwrap();
        assert_eq!(status.run_state, "ended");
        assert_eq!(status.updated_at.as_deref(), Some("now"));

        let events = parse_public_events_jsonl(
            r#"{"schemaVersion":2,"eventIndex":0,"sequence":0,"simTime_s":0,"wallTime":"now","source":"pi-sim-scripted","runState":"running","kind":"run_started","payload":{"provider":"fixture"}}
{"schemaVersion":2,"eventIndex":1,"sequence":1,"simTime_s":10,"wallTime":"later","source":"pi-sim-scripted","runState":"running","kind":"alarm_observed","payload":{"alarm":"MAP_LOW"}}"#,
        )
        .unwrap();
        assert_eq!(events[1].event_index, 1);
        assert_eq!(events[1].kind, "alarm_observed");

        let encounter = parse_encounter_current(
            r#"{"schemaVersion":1,"patientId":"p","encounterId":"e","visibleChartAsOf":"2026-04-19T06:45:00-05:00","sequence":1,"simTime_s":1,"wallTime":"now","source":"pi-sim-scripted","runState":"running","phase":"baseline","display":{"bed":"ICU 7"}}"#,
        )
        .unwrap();
        assert_eq!(encounter.visible_chart_as_of, "2026-04-19T06:45:00-05:00");
        assert_eq!(encounter.display["bed"], "ICU 7");

        let assessment = parse_assessment_status(
            r#"{"schemaVersion":1,"sequence":1,"simTime_s":1,"wallTime":"now","source":"pi-sim-scripted","runState":"running","available":true,"lastRequestId":"req","lastRevealSequence":1}"#,
        )
        .unwrap();
        assert_eq!(assessment.last_request_id.as_deref(), Some("req"));

        let waveform = parse_waveform_current(
            r#"{"schemaVersion":1,"sequence":1,"simTime_s":1,"wallTime":"now","source":"pi-sim-scripted","runState":"running","available":true,"sourceKind":"fixture","fidelity":"synthetic-test","synthetic":true,"windows":{"ECG_LeadII":{"unit":"mV","sampleRate_Hz":125,"t0_s":0,"values":[0,1,0]}}}"#,
        )
        .unwrap();
        assert_eq!(waveform.source_kind.as_deref(), Some("fixture"));
        assert!(waveform.synthetic.unwrap());
        assert_eq!(waveform.windows["ECG_LeadII"].values.len(), 3);
    }

    #[test]
    fn rejects_non_monotonic_event_index() {
        let err = parse_public_events_jsonl(
            r#"{"schemaVersion":2,"eventIndex":1,"sequence":0,"simTime_s":0,"source":"pi-sim-scripted","runState":"running","kind":"run_started","payload":{}}"#,
        )
        .unwrap_err();
        assert!(format!("{err}").contains("eventIndex"));
    }
}
