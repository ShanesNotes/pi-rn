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

pub fn normalize_target(frame: TargetFrame) -> Result<PublicFrame, FrameError> {
    finite("simTime_s", frame.sim_time_s)?;
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
        compatibility_notes: notes,
    })
}

pub fn normalize_current_scalar(frame: CurrentScalarFrame) -> Result<PublicFrame, FrameError> {
    finite("t", frame.t)?;
    let mut vitals = BTreeMap::new();
    let mut notes = vec!["compatibility: parsed legacy lowercase scalar current.json".to_string()];
    insert_optional(&mut vitals, VitalKey::HeartRate, frame.hr, "1/min")?;
    insert_optional(
        &mut vitals,
        VitalKey::SystolicArterialPressure,
        frame.bp_sys,
        "mmHg",
    )?;
    insert_optional(
        &mut vitals,
        VitalKey::DiastolicArterialPressure,
        frame.bp_dia,
        "mmHg",
    )?;
    insert_optional(
        &mut vitals,
        VitalKey::MeanArterialPressure,
        frame.map,
        "mmHg",
    )?;
    insert_optional(&mut vitals, VitalKey::RespirationRate, frame.rr, "1/min")?;
    insert_optional(&mut vitals, VitalKey::CoreTemperature, frame.temp_c, "degC")?;
    insert_optional(
        &mut vitals,
        VitalKey::EndTidalCarbonDioxidePressure,
        frame.etco2_mmhg,
        "mmHg",
    )?;
    if let Some(mut spo2) = frame.spo2 {
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
    let alarms = match frame.alarms {
        Some(alarms) => AlarmFeed::Available(alarms),
        None => AlarmFeed::Unavailable,
    };
    Ok(PublicFrame {
        source: "pi-sim/current.json".to_string(),
        sequence: None,
        run_state: None,
        sim_time_s: frame.t,
        wall_time: frame.wall_time,
        vitals,
        alarms,
        heart_rhythm: None,
        waveforms: BTreeMap::new(),
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
        let frame = parse_public_frame(r#"{"schemaVersion":1,"source":"pi-sim/pulse","sequence":7,"runState":"running","simTime_s":2,"vitals":{"HeartRate":{"value":70,"unit":"1/min"},"PulseOximetry":{"value":0.98,"unit":"unitless"}},"events":["Tachycardia"],"heartRhythm":"NormalSinus","waveforms":{}}"#).unwrap();
        assert_eq!(frame.sequence, Some(7));
        assert_eq!(frame.alarms.values(), &["Tachycardia".to_string()]);
        assert_eq!(frame.heart_rhythm.as_deref(), Some("NormalSinus"));
    }
}
