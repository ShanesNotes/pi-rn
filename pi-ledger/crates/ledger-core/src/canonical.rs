use std::cmp::Ordering;

use crate::hash::RecordHash;
use serde_json::Value;
use sha2::{Digest, Sha256};

pub const CANONICALIZATION_ID: &str = "jcs-rfc8785-pi-chart-v1";

const IJSON_MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;
const IJSON_MIN_SAFE_INTEGER: i64 = -IJSON_MAX_SAFE_INTEGER;

pub fn record_hash(value: &Value) -> Result<RecordHash, String> {
    let canonical = canonical_json_for_record_hash(value)?;
    let digest = Sha256::digest(canonical.as_bytes());
    Ok(RecordHash::from_sha256_digest(digest))
}

pub fn canonical_json(value: &Value) -> Result<String, String> {
    canonical_json_inner(value, ObjectContext::Root, false)
}

pub fn canonical_json_from_str(document: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(document)
        .map_err(|_| "Unsupported canonical JSON input".to_string())?;
    canonical_json(&value)
}

fn canonical_json_for_record_hash(value: &Value) -> Result<String, String> {
    canonical_json_inner(value, ObjectContext::Root, true)
}

#[derive(Clone, Copy, Eq, PartialEq)]
enum ObjectContext {
    Root,
    RootIntegrity,
    Other,
}

fn canonical_json_inner(
    value: &Value,
    context: ObjectContext,
    exclude_integrity_self_fields: bool,
) -> Result<String, String> {
    match value {
        Value::Null => Ok("null".to_string()),
        Value::Bool(value) => Ok(value.to_string()),
        Value::Number(value) => jcs_number(value),
        Value::String(value) => serde_json::to_string(value).map_err(|error| error.to_string()),
        Value::Array(items) => {
            let mut parts = Vec::with_capacity(items.len());
            for item in items {
                parts.push(canonical_json_inner(
                    item,
                    ObjectContext::Other,
                    exclude_integrity_self_fields,
                )?);
            }
            Ok(format!("[{}]", parts.join(",")))
        }
        Value::Object(map) => {
            let mut entries: Vec<_> = map
                .iter()
                .filter(|(key, _)| {
                    !(exclude_integrity_self_fields
                        && context == ObjectContext::RootIntegrity
                        && (*key == "hash" || *key == "signature"))
                })
                .collect();
            entries.sort_by(|(left, _), (right, _)| compare_utf16(left, right));
            let mut parts = Vec::with_capacity(entries.len());
            for (key, item) in entries {
                let encoded_key = serde_json::to_string(key).map_err(|error| error.to_string())?;
                let child_context = if context == ObjectContext::Root && key == "integrity" {
                    ObjectContext::RootIntegrity
                } else {
                    ObjectContext::Other
                };
                parts.push(format!(
                    "{}:{}",
                    encoded_key,
                    canonical_json_inner(item, child_context, exclude_integrity_self_fields)?
                ));
            }
            Ok(format!("{{{}}}", parts.join(",")))
        }
    }
}

fn compare_utf16(left: &str, right: &str) -> Ordering {
    let mut left_units = left.encode_utf16();
    let mut right_units = right.encode_utf16();
    loop {
        match (left_units.next(), right_units.next()) {
            (Some(left), Some(right)) => match left.cmp(&right) {
                Ordering::Equal => continue,
                ordering => return ordering,
            },
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
            (None, None) => return Ordering::Equal,
        }
    }
}

fn jcs_number(value: &serde_json::Number) -> Result<String, String> {
    if let Some(integer) = value.as_i64() {
        if !(IJSON_MIN_SAFE_INTEGER..=IJSON_MAX_SAFE_INTEGER).contains(&integer) {
            return Err(unsupported_canonical_input());
        }
        return Ok(integer.to_string());
    }
    if let Some(integer) = value.as_u64() {
        if integer > IJSON_MAX_SAFE_INTEGER as u64 {
            return Err(unsupported_canonical_input());
        }
        return Ok(integer.to_string());
    }

    let number = value.as_f64().ok_or_else(unsupported_canonical_input)?;
    if !number.is_finite() {
        return Err(unsupported_canonical_input());
    }
    if number == 0.0 {
        return Ok("0".to_string());
    }

    let raw = serde_json::Number::from_f64(number)
        .ok_or_else(unsupported_canonical_input)?
        .to_string();
    let abs = number.abs();
    if (1e-6..1e21).contains(&abs) {
        expand_exponent_to_decimal(&raw)
    } else {
        normalize_exponent(&raw)
    }
}

fn expand_exponent_to_decimal(raw: &str) -> Result<String, String> {
    let Some((mantissa, exponent)) = split_exponent(raw) else {
        return Ok(strip_fraction_zeros(raw.to_string()));
    };
    let exponent: i32 = exponent
        .parse()
        .map_err(|_| unsupported_canonical_input())?;
    let (sign, unsigned_mantissa) = mantissa
        .strip_prefix('-')
        .map_or(("", mantissa), |rest| ("-", rest));

    let mut digits = String::new();
    let mut fraction_digits = 0usize;
    let mut after_decimal = false;
    for character in unsigned_mantissa.chars() {
        if character == '.' {
            after_decimal = true;
        } else {
            digits.push(character);
            if after_decimal {
                fraction_digits += 1;
            }
        }
    }

    let integer_digits = digits.len() - fraction_digits;
    let decimal_position = integer_digits as i32 + exponent;
    let mut expanded = String::new();
    expanded.push_str(sign);
    if decimal_position <= 0 {
        expanded.push_str("0.");
        expanded.extend(std::iter::repeat_n('0', (-decimal_position) as usize));
        expanded.push_str(&digits);
    } else if decimal_position as usize >= digits.len() {
        expanded.push_str(&digits);
        expanded.extend(std::iter::repeat_n(
            '0',
            decimal_position as usize - digits.len(),
        ));
    } else {
        let decimal_position = decimal_position as usize;
        expanded.push_str(&digits[..decimal_position]);
        expanded.push('.');
        expanded.push_str(&digits[decimal_position..]);
    }

    Ok(strip_fraction_zeros(expanded))
}

fn normalize_exponent(raw: &str) -> Result<String, String> {
    let Some((mantissa, exponent)) = split_exponent(raw) else {
        return Ok(strip_fraction_zeros(raw.to_string()));
    };
    let exponent: i32 = exponent
        .parse()
        .map_err(|_| unsupported_canonical_input())?;
    let mantissa = strip_fraction_zeros(mantissa.to_string());
    if exponent >= 0 {
        Ok(format!("{mantissa}e+{exponent}"))
    } else {
        Ok(format!("{mantissa}e{exponent}"))
    }
}

fn split_exponent(raw: &str) -> Option<(&str, &str)> {
    raw.split_once('e').or_else(|| raw.split_once('E'))
}

fn strip_fraction_zeros(mut value: String) -> String {
    if value.contains('.') {
        while value.ends_with('0') {
            value.pop();
        }
        if value.ends_with('.') {
            value.pop();
        }
    }
    if value == "-0" {
        "0".to_string()
    } else {
        value
    }
}

fn unsupported_canonical_input() -> String {
    "Unsupported canonical JSON input".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exposes_canonicalization_identifier() {
        assert_eq!(CANONICALIZATION_ID, "jcs-rfc8785-pi-chart-v1");
    }

    #[test]
    fn synthetic_claim_fixture_uses_k1_time_vocabulary() {
        let claim = minimal_observation_claim();

        assert!(claim.pointer("/time/valid/instant").is_some());
        assert!(claim.pointer("/time/recorded_at").is_some());
        assert!(claim.pointer("/time/validAt").is_none());
    }

    fn minimal_observation_claim() -> Value {
        serde_json::json!({
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

    fn reordered_minimal_observation_claim() -> Value {
        serde_json::json!({
            "integrity": { "canonicalization": CANONICALIZATION_ID },
            "actor": { "id": "rn-1", "kind": "clinician" },
            "time": {
                "recorded_at": "2026-05-03T12:00:05Z",
                "valid": { "instant": "2026-05-03T12:00:00Z" }
            },
            "object": { "unit": "/min", "value": 88, "code": "heart-rate" },
            "subject": { "patientId": "patient_kernel" },
            "predicate": "vital.sign",
            "shape": "observation",
            "id": "claim-v0-5-001"
        })
    }

    #[test]
    fn canonical_json_is_invariant_to_object_property_order() {
        let claim = minimal_observation_claim();
        let reordered = reordered_minimal_observation_claim();

        assert_eq!(
            canonical_json(&claim).unwrap(),
            canonical_json(&reordered).unwrap()
        );
        assert_eq!(
            record_hash(&claim).unwrap(),
            record_hash(&reordered).unwrap()
        );
    }

    #[test]
    fn object_keys_sort_by_utf16_code_units_for_jcs_compatibility() {
        let smile = "\u{1F600}";
        let private_use = "\u{E000}";
        let value = serde_json::json!({
            private_use: 1,
            smile: 2
        });

        assert_eq!(
            canonical_json(&value).unwrap(),
            format!("{{\"{smile}\":2,\"{private_use}\":1}}")
        );
    }

    #[test]
    fn record_hash_is_sha256_over_canonical_json_with_pi_ledger_encoding() {
        let claim = minimal_observation_claim();

        let hash = record_hash(&claim).unwrap();

        assert_eq!(
            hash.as_str(),
            "sha256:bec0a77fc23f6ca919e6922c2e2ff7d498d38b367048a5ff5f8e7968f6c01a27"
        );
        assert_eq!(record_hash(&claim).unwrap(), hash);
    }

    #[test]
    fn t_k8_02_record_hash_returns_typed_record_hash_with_existing_golden_vector() {
        let claim = minimal_observation_claim();

        let hash = record_hash(&claim).unwrap();

        assert_record_hash_type(&hash);
        assert_eq!(
            hash.as_str(),
            "sha256:bec0a77fc23f6ca919e6922c2e2ff7d498d38b367048a5ff5f8e7968f6c01a27"
        );
    }

    fn assert_record_hash_type(_: &crate::hash::RecordHash) {}

    #[test]
    fn record_hash_excludes_integrity_hash_and_signature_self_fields() {
        let mut claim = minimal_observation_claim();
        claim["integrity"]["hash"] = serde_json::json!(
            "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        );
        claim["integrity"]["signature"] = serde_json::json!("test-signature-a");
        let mut changed_self_fields = claim.clone();
        changed_self_fields["integrity"]["hash"] = serde_json::json!(
            "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        );
        changed_self_fields["integrity"]["signature"] = serde_json::json!("test-signature-b");

        assert_eq!(
            record_hash(&claim).unwrap(),
            record_hash(&changed_self_fields).unwrap()
        );
    }

    #[test]
    fn nested_payload_integrity_fields_remain_hash_sensitive() {
        let claim = serde_json::json!({
            "id": "claim-v0-5-001",
            "shape": "observation",
            "predicate": "device.self.check",
            "subject": { "patientId": "patient_kernel" },
            "object": {
                "device": {
                    "id": "monitor-1",
                    "integrity": {
                        "hash": "device-hash-a",
                        "signature": "device-signature-a"
                    }
                }
            },
            "time": {
                "valid": { "instant": "2026-05-03T12:00:00Z" },
                "recorded_at": "2026-05-03T12:00:05Z"
            },
            "actor": { "kind": "device", "id": "monitor-1" },
            "integrity": { "canonicalization": CANONICALIZATION_ID }
        });
        let changed_nested_payload = serde_json::json!({
            "id": "claim-v0-5-001",
            "shape": "observation",
            "predicate": "device.self.check",
            "subject": { "patientId": "patient_kernel" },
            "object": {
                "device": {
                    "id": "monitor-1",
                    "integrity": {
                        "hash": "device-hash-b",
                        "signature": "device-signature-b"
                    }
                }
            },
            "time": {
                "valid": { "instant": "2026-05-03T12:00:00Z" },
                "recorded_at": "2026-05-03T12:00:05Z"
            },
            "actor": { "kind": "device", "id": "monitor-1" },
            "integrity": { "canonicalization": CANONICALIZATION_ID }
        });

        assert_ne!(
            record_hash(&claim).unwrap(),
            record_hash(&changed_nested_payload).unwrap()
        );
    }

    #[test]
    fn record_hash_changes_when_clinical_payload_changes() {
        let mut claim = minimal_observation_claim();
        claim["provenance"] = serde_json::json!({ "source": "synthetic-kernel-test" });
        let base_hash = record_hash(&claim).unwrap();
        let mut object_changed = claim.clone();
        object_changed["object"]["value"] = serde_json::json!(89);
        let mut predicate_changed = claim.clone();
        predicate_changed["predicate"] = serde_json::json!("vital.sign.corrected");
        let mut subject_changed = claim.clone();
        subject_changed["subject"] = serde_json::json!({ "patientId": "patient_other" });
        let mut time_changed = claim.clone();
        time_changed["time"]["valid"]["instant"] = serde_json::json!("2026-05-03T12:01:00Z");
        let mut actor_changed = claim.clone();
        actor_changed["actor"] = serde_json::json!({ "kind": "clinician", "id": "rn-2" });
        let mut provenance_changed = claim.clone();
        provenance_changed["provenance"] = serde_json::json!({ "source": "manual-review" });
        let mutations = vec![
            object_changed,
            predicate_changed,
            subject_changed,
            time_changed,
            actor_changed,
            provenance_changed,
        ];

        for mutation in mutations {
            assert_ne!(record_hash(&mutation).unwrap(), base_hash);
        }
    }

    #[test]
    fn claim_id_and_record_hash_remain_separate_reference_parts() {
        let claim = minimal_observation_claim();

        let hash = record_hash(&claim).unwrap();
        let mut different_id = claim.clone();
        different_id["id"] = serde_json::json!("claim-v0-5-002");

        assert_eq!(claim["id"], "claim-v0-5-001");
        assert_ne!(hash.as_str(), "claim-v0-5-001");
        assert_ne!(record_hash(&different_id).unwrap(), hash);
    }

    #[test]
    fn unsupported_json_input_documents_fail_deterministically() {
        let unsupported_inputs = [
            r#"{"value":NaN}"#,
            r#"{"value":Infinity}"#,
            r#"{"value":-Infinity}"#,
            r#"{"value":undefined}"#,
            r#"{"value":function(){}}"#,
        ];

        for input in unsupported_inputs {
            assert_eq!(
                canonical_json_from_str(input).unwrap_err(),
                "Unsupported canonical JSON input"
            );
        }
    }

    #[test]
    fn canonical_json_uses_jcs_number_formatting_edges() {
        let values: Value = serde_json::from_str(
            "[-0.0,333333333.33333329,1e30,4.50,2e-3,1e-27,1e-6,1e-7,1e20,1e21]",
        )
        .unwrap();

        assert_eq!(
            canonical_json(&values).unwrap(),
            "[0,333333333.3333333,1e+30,4.5,0.002,1e-27,0.000001,1e-7,100000000000000000000,1e+21]"
        );
    }

    #[test]
    fn accepts_ijson_safe_integer_bounds() {
        let safe_bounds = serde_json::json!({
            "max": 9_007_199_254_740_991_i64,
            "min": -9_007_199_254_740_991_i64
        });

        assert_eq!(
            canonical_json(&safe_bounds).unwrap(),
            "{\"max\":9007199254740991,\"min\":-9007199254740991}"
        );
    }

    #[test]
    fn rejects_positive_integer_above_ijson_safe_range() {
        let unsafe_integers = [
            serde_json::json!({ "n": 9_007_199_254_740_992_i64 }),
            serde_json::json!({ "n": 9_007_199_254_740_993_i64 }),
        ];

        for unsafe_integer in unsafe_integers {
            assert_eq!(
                canonical_json(&unsafe_integer).unwrap_err(),
                "Unsupported canonical JSON input"
            );
        }
    }

    #[test]
    fn rejects_negative_integer_below_ijson_safe_range() {
        let unsafe_integers = [
            serde_json::json!({ "n": -9_007_199_254_740_992_i64 }),
            serde_json::json!({ "n": -9_007_199_254_740_993_i64 }),
        ];

        for unsafe_integer in unsafe_integers {
            assert_eq!(
                canonical_json(&unsafe_integer).unwrap_err(),
                "Unsupported canonical JSON input"
            );
        }
    }
}
