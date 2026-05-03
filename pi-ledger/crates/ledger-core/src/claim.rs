use crate::canonical::canonical_json;

use serde_json::Value;

const REQUIRED_FIELDS: [&str; 8] = [
    "id",
    "shape",
    "predicate",
    "subject",
    "object",
    "time",
    "actor",
    "integrity",
];

#[derive(Debug, Eq, PartialEq)]
pub enum ClaimError {
    ExpectedObject,
    MissingField(&'static str),
    InvalidField(&'static str),
    UnsupportedShape(String),
    UnsupportedTimeField(String),
    K3OwnedTimeMetadata(&'static str),
    UnsupportedRevisionMode(String),
    InvalidRecordHash(&'static str),
    Canonical(String),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ClaimShape {
    Context,
    Observation,
    Interpretation,
    Act,
}

impl ClaimShape {
    fn parse(value: &str) -> Result<Self, ClaimError> {
        match value {
            "context" => Ok(Self::Context),
            "observation" => Ok(Self::Observation),
            "interpretation" => Ok(Self::Interpretation),
            "act" => Ok(Self::Act),
            unsupported => Err(ClaimError::UnsupportedShape(unsupported.to_string())),
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RecordHash<'a>(&'a str);

impl<'a> RecordHash<'a> {
    pub fn parse(value: &'a str) -> Result<Self, ClaimError> {
        Self::parse_from_field(value, "record_hash")
    }

    pub fn as_str(&self) -> &'a str {
        self.0
    }

    fn parse_from_field(value: &'a str, field: &'static str) -> Result<Self, ClaimError> {
        let Some(hex) = value.strip_prefix("sha256:") else {
            return Err(ClaimError::InvalidRecordHash(field));
        };
        if hex.len() != 64
            || !hex
                .bytes()
                .all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
        {
            return Err(ClaimError::InvalidRecordHash(field));
        }
        Ok(Self(value))
    }
}

#[derive(Debug)]
pub struct ValidatedClaim<'a> {
    raw: &'a Value,
    id: &'a str,
    shape: ClaimShape,
}

impl<'a> ValidatedClaim<'a> {
    pub fn raw(&self) -> &'a Value {
        self.raw
    }

    pub fn id(&self) -> &'a str {
        self.id
    }

    pub fn shape(&self) -> ClaimShape {
        self.shape
    }
}

pub fn validate_claim(value: &Value) -> Result<ValidatedClaim<'_>, ClaimError> {
    let object = value.as_object().ok_or(ClaimError::ExpectedObject)?;
    for required_field in REQUIRED_FIELDS {
        if !object.contains_key(required_field) {
            return Err(ClaimError::MissingField(required_field));
        }
    }

    let id = object
        .get("id")
        .and_then(Value::as_str)
        .ok_or(ClaimError::InvalidField("id"))?;
    let shape = object
        .get("shape")
        .and_then(Value::as_str)
        .ok_or(ClaimError::InvalidField("shape"))?;
    let shape = ClaimShape::parse(shape)?;
    let time = object
        .get("time")
        .and_then(Value::as_object)
        .ok_or(ClaimError::InvalidField("time"))?;
    validate_time(time)?;
    if let Some(revises) = object.get("revises") {
        validate_revises(revises)?;
    }
    canonical_json(value).map_err(ClaimError::Canonical)?;

    Ok(ValidatedClaim {
        raw: value,
        id,
        shape,
    })
}

fn validate_time(time: &serde_json::Map<String, Value>) -> Result<(), ClaimError> {
    for field in time.keys() {
        match field.as_str() {
            "valid" | "recorded_at" => {}
            "accepted_at" => return Err(ClaimError::K3OwnedTimeMetadata("time.accepted_at")),
            "seq" => return Err(ClaimError::K3OwnedTimeMetadata("time.seq")),
            "batch_id" => return Err(ClaimError::K3OwnedTimeMetadata("time.batch_id")),
            unsupported => return Err(ClaimError::UnsupportedTimeField(unsupported.to_string())),
        }
    }

    let valid = time
        .get("valid")
        .ok_or(ClaimError::MissingField("time.valid"))?
        .as_object()
        .ok_or(ClaimError::InvalidField("time.valid"))?;
    if !time.contains_key("recorded_at") {
        return Err(ClaimError::MissingField("time.recorded_at"));
    }
    if !time.get("recorded_at").is_some_and(Value::is_string) {
        return Err(ClaimError::InvalidField("time.recorded_at"));
    }

    let has_instant = valid.contains_key("instant");
    let has_interval = valid.contains_key("interval");
    if valid.len() != 1 || has_instant == has_interval {
        return Err(ClaimError::InvalidField("time.valid"));
    }
    if has_instant {
        validate_instant(valid.get("instant"))?;
    }
    if has_interval {
        validate_interval(valid.get("interval"))?;
    }
    Ok(())
}

fn validate_instant(value: Option<&Value>) -> Result<(), ClaimError> {
    if value.is_some_and(Value::is_string) {
        Ok(())
    } else {
        Err(ClaimError::InvalidField("time.valid"))
    }
}

fn validate_interval(value: Option<&Value>) -> Result<(), ClaimError> {
    let interval = value
        .and_then(Value::as_object)
        .ok_or(ClaimError::InvalidField("time.valid"))?;
    let has_start = interval.get("start").is_some_and(Value::is_string);
    let has_end = interval.get("end").is_some_and(Value::is_string);
    if interval.len() == 2 && has_start && has_end {
        Ok(())
    } else {
        Err(ClaimError::InvalidField("time.valid"))
    }
}

fn validate_revises(value: &Value) -> Result<(), ClaimError> {
    let revises = value
        .as_object()
        .ok_or(ClaimError::InvalidField("revises"))?;
    let mode = revises
        .get("mode")
        .and_then(Value::as_str)
        .ok_or(ClaimError::MissingField("revises.mode"))?;
    if mode != "corrects" {
        return Err(ClaimError::UnsupportedRevisionMode(mode.to_string()));
    }

    let target = revises
        .get("target")
        .and_then(Value::as_object)
        .ok_or(ClaimError::MissingField("revises.target"))?;
    target
        .get("id")
        .and_then(Value::as_str)
        .ok_or(ClaimError::MissingField("revises.target.id"))?;
    let hash = target
        .get("hash")
        .and_then(Value::as_str)
        .ok_or(ClaimError::MissingField("revises.target.hash"))?;
    RecordHash::parse_from_field(hash, "revises.target.hash")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::canonical::CANONICALIZATION_ID;
    use serde_json::{Value, json};

    #[test]
    fn t_k1_04_validates_plain_synthetic_claim_without_event_envelope_wrapper() {
        let claim = minimal_observation_claim();

        assert!(claim.pointer("/event").is_none());
        assert!(claim.pointer("/eventEnvelope").is_none());

        let validated = validate_claim(&claim).unwrap();

        assert_eq!(validated.id(), "claim-v0-5-001");
        assert_eq!(validated.raw(), &claim);
    }

    #[test]
    fn t_k1_01_accepts_only_the_four_claim_shapes() {
        for (shape, expected) in [
            ("context", ClaimShape::Context),
            ("observation", ClaimShape::Observation),
            ("interpretation", ClaimShape::Interpretation),
            ("act", ClaimShape::Act),
        ] {
            let mut claim = minimal_observation_claim();
            claim["shape"] = json!(shape);

            let validated = validate_claim(&claim).unwrap();

            assert_eq!(validated.shape(), expected);
        }

        let mut unsupported = minimal_observation_claim();
        unsupported["shape"] = json!("relation");

        assert!(matches!(
            validate_claim(&unsupported),
            Err(ClaimError::UnsupportedShape(shape)) if shape == "relation"
        ));
    }

    #[test]
    fn t_k1_02_requires_minimal_claim_fields() {
        for required_field in [
            "id",
            "shape",
            "predicate",
            "subject",
            "object",
            "time",
            "actor",
            "integrity",
        ] {
            let mut claim = minimal_observation_claim();
            claim.as_object_mut().unwrap().remove(required_field);

            assert_eq!(
                validate_claim(&claim).unwrap_err(),
                ClaimError::MissingField(required_field)
            );
        }
    }

    #[test]
    fn validates_only_k1_time_valid_and_recorded_at_fields() {
        let mut missing_valid = minimal_observation_claim();
        missing_valid["time"]
            .as_object_mut()
            .unwrap()
            .remove("valid");
        let mut missing_recorded_at = minimal_observation_claim();
        missing_recorded_at["time"]
            .as_object_mut()
            .unwrap()
            .remove("recorded_at");

        assert_eq!(
            validate_claim(&missing_valid).unwrap_err(),
            ClaimError::MissingField("time.valid")
        );
        assert_eq!(
            validate_claim(&missing_recorded_at).unwrap_err(),
            ClaimError::MissingField("time.recorded_at")
        );
    }

    #[test]
    fn validates_recorded_at_as_a_k1_time_string() {
        let mut claim = minimal_observation_claim();
        claim["time"]["recorded_at"] = json!(123);

        assert_eq!(
            validate_claim(&claim).unwrap_err(),
            ClaimError::InvalidField("time.recorded_at")
        );
    }

    #[test]
    fn validates_time_valid_as_exactly_one_instant_or_interval() {
        let mut interval = minimal_observation_claim();
        interval["time"]["valid"] = json!({
            "interval": {
                "start": "2026-05-03T12:00:00Z",
                "end": "2026-05-03T12:05:00Z"
            }
        });
        let mut missing_representation = minimal_observation_claim();
        missing_representation["time"]["valid"] = json!({});
        let mut both_representations = minimal_observation_claim();
        both_representations["time"]["valid"] = json!({
            "instant": "2026-05-03T12:00:00Z",
            "interval": {
                "start": "2026-05-03T12:00:00Z",
                "end": "2026-05-03T12:05:00Z"
            }
        });

        validate_claim(&interval).unwrap();
        assert_eq!(
            validate_claim(&missing_representation).unwrap_err(),
            ClaimError::InvalidField("time.valid")
        );
        assert_eq!(
            validate_claim(&both_representations).unwrap_err(),
            ClaimError::InvalidField("time.valid")
        );
    }

    #[test]
    fn validates_interval_as_exactly_start_and_end() {
        let mut claim = minimal_observation_claim();
        claim["time"]["valid"] = json!({
            "interval": {
                "start": "2026-05-03T12:00:00Z",
                "end": "2026-05-03T12:05:00Z",
                "precision": "minute"
            }
        });

        assert_eq!(
            validate_claim(&claim).unwrap_err(),
            ClaimError::InvalidField("time.valid")
        );
    }

    #[test]
    fn rejects_caller_supplied_k3_owned_time_metadata() {
        for (field, value, error_field) in [
            (
                "accepted_at",
                json!("2026-05-03T12:00:06Z"),
                "time.accepted_at",
            ),
            ("seq", json!(1), "time.seq"),
            ("batch_id", json!("batch-1"), "time.batch_id"),
        ] {
            let mut claim = minimal_observation_claim();
            claim["time"][field] = value;

            assert_eq!(
                validate_claim(&claim).unwrap_err(),
                ClaimError::K3OwnedTimeMetadata(error_field)
            );
        }
    }

    #[test]
    fn rejects_unsupported_time_fields_outside_k1_allowlist() {
        for field in ["validAt", "knownAt", "source_metadata"] {
            let mut claim = minimal_observation_claim();
            claim["time"][field] = json!("caller-supplied");

            assert_eq!(
                validate_claim(&claim).unwrap_err(),
                ClaimError::UnsupportedTimeField(field.to_string())
            );
        }
    }

    #[test]
    fn t_k1_03_rejects_revision_modes_beyond_corrects() {
        let mut claim = minimal_observation_claim();
        claim["revises"] = json!({
            "mode": "amends",
            "target": {
                "id": "claim-v0-5-000",
                "hash": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }
        });

        assert!(matches!(
            validate_claim(&claim),
            Err(ClaimError::UnsupportedRevisionMode(mode)) if mode == "amends"
        ));
    }

    #[test]
    fn t_k1_03_requires_corrects_target_id_and_hash() {
        let mut correction = minimal_observation_claim();
        correction["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": "claim-v0-5-000",
                "hash": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }
        });
        let mut missing_target_id = correction.clone();
        missing_target_id["revises"]["target"]
            .as_object_mut()
            .unwrap()
            .remove("id");
        let mut missing_target_hash = correction.clone();
        missing_target_hash["revises"]["target"]
            .as_object_mut()
            .unwrap()
            .remove("hash");

        validate_claim(&correction).unwrap();
        assert_eq!(
            validate_claim(&missing_target_id).unwrap_err(),
            ClaimError::MissingField("revises.target.id")
        );
        assert_eq!(
            validate_claim(&missing_target_hash).unwrap_err(),
            ClaimError::MissingField("revises.target.hash")
        );
    }

    #[test]
    fn t_k1_03_rejects_malformed_correction_target_hash() {
        let mut correction = minimal_observation_claim();
        correction["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": "claim-v0-5-000",
                "hash": "sha256:not-lowercase-hex"
            }
        });

        assert_eq!(
            validate_claim(&correction).unwrap_err(),
            ClaimError::InvalidRecordHash("revises.target.hash")
        );
    }

    #[test]
    fn validated_claim_must_be_canonicalizable_and_hashable() {
        let mut claim = minimal_observation_claim();
        claim["object"]["unsafeInteger"] = json!(9_007_199_254_740_992_i64);

        assert_eq!(
            validate_claim(&claim).unwrap_err(),
            ClaimError::Canonical("Unsupported canonical JSON input".to_string())
        );
    }

    fn minimal_observation_claim() -> Value {
        json!({
            "id": "claim-v0-5-001",
            "shape": "observation",
            "predicate": "vital.sign",
            "subject": { "patientId": "patient_kernel" },
            "object": { "code": "heart-rate", "value": 88, "unit": "/min" },
            "time": {
                "valid": { "instant": "2026-05-03T12:00:00Z" },
                "recorded_at": "2026-05-03T12:00:05Z"
            },
            "actor": { "kind": "clinician", "id": "rn-1" },
            "integrity": { "canonicalization": CANONICALIZATION_ID }
        })
    }
}
