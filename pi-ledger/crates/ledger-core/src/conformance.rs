use crate::admission::{AppendAdmissibleClaim, RevisionAdmissibleClaim};
use crate::canonical::{CANONICALIZATION_ID, canonical_json, record_hash};
use crate::claim::validate_claim;
use crate::ledger::{AppendLedger, LedgerEntry, StoreClock};
use crate::predicates::{
    clinical_truth_v1alpha1_vital_sign_registry,
    clinical_truth_v1alpha1_vital_sign_registry_summary,
};
use crate::query::point_read;
use serde_json::{Value, json};

pub const CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION: &str = "clinical_truth.v1alpha1";
pub const VITAL_SIGN_VECTOR_SUITE_ID: &str = "clinical_truth.v1alpha1.vital_sign.2026-05-31";

pub fn clinical_truth_v1alpha1_vital_sign_vectors() -> Result<Value, String> {
    let registry = clinical_truth_v1alpha1_vital_sign_registry().map_err(debug_error)?;
    let registry_summary = clinical_truth_v1alpha1_vital_sign_registry_summary()?;
    let base_claim = vital_sign_claim("claim-vital-hr-001", 88);
    let base_canonical = canonical_json(&base_claim)?;
    let base_record_hash = record_hash(&base_claim).map_err(debug_error)?;
    let mut revision_claim = vital_sign_claim("claim-vital-hr-001-correction", 92);
    revision_claim["revises"] = json!({
        "mode": "corrects",
        "target": {
            "id": "claim-vital-hr-001",
            "hash": base_record_hash.as_str()
        }
    });
    let revision_canonical = canonical_json(&revision_claim)?;
    let revision_record_hash = record_hash(&revision_claim).map_err(debug_error)?;

    let mut ledger = AppendLedger::new(
        "patient-vital-001",
        StoreClock::deterministic(["2026-05-03T12:00:10Z", "2026-05-03T12:05:10Z"]),
    );
    let base_validated = validate_claim(&base_claim).map_err(debug_error)?;
    let base_admitted =
        AppendAdmissibleClaim::admit(&base_validated, ledger.patient_id(), &registry)
            .map_err(debug_error)?;
    let base_entry = ledger
        .append_admissible(&base_admitted)
        .map_err(debug_error)?
        .clone();
    let revision_validated = validate_claim(&revision_claim).map_err(debug_error)?;
    let revision_append_admitted =
        AppendAdmissibleClaim::admit(&revision_validated, ledger.patient_id(), &registry)
            .map_err(debug_error)?;
    let revision_admitted =
        RevisionAdmissibleClaim::admit(&revision_append_admitted, ledger.entries())
            .map_err(debug_error)?;
    let revision_entry = ledger
        .append_revision_admissible(&revision_admitted)
        .map_err(debug_error)?
        .clone();
    let before_correction = point_read(
        ledger.entries(),
        "2026-05-03T12:00:00Z",
        "2026-05-03T12:00:10Z",
    )
    .map_err(debug_error)?;
    let after_correction = point_read(
        ledger.entries(),
        "2026-05-03T12:00:00Z",
        "2026-05-03T12:05:10Z",
    )
    .map_err(debug_error)?;

    Ok(json!({
        "suite_id": VITAL_SIGN_VECTOR_SUITE_ID,
        "contract_version": CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION,
        "registry": {
            "version": registry_summary.version,
            "content_hash": registry_summary.content_hash,
            "predicate_count": registry_summary.predicate_count,
            "predicates": registry_summary.predicates.iter().map(|predicate| {
                json!({
                    "id": predicate.id,
                    "shape": predicate.shape,
                    "required_object_fields": predicate.required_object_fields.iter().map(|field| {
                        json!({
                            "name": field.name,
                            "type": field.field_type.as_str(),
                        })
                    }).collect::<Vec<_>>(),
                })
            }).collect::<Vec<_>>(),
        },
        "canonicalization_id": CANONICALIZATION_ID,
        "patient_ledger_ref": {
            "patient_id": "patient-vital-001",
        },
        "positive_vectors": [
            {
                "id": "100-base-vital-sign-canonical-record-hash",
                "operation": "ValidateClaim",
                "claim": base_claim,
                "expected": {
                    "canonical_json": base_canonical,
                    "record_hash": base_record_hash.as_str(),
                    "claim_id": "claim-vital-hr-001",
                    "predicate": "vital.sign",
                    "shape": "observation",
                    "subject_patient_id": "patient-vital-001",
                    "valid_time": { "instant": "2026-05-03T12:00:00Z" },
                    "recorded_at": "2026-05-03T12:00:05Z"
                }
            },
            {
                "id": "110-base-vital-sign-append-result",
                "operation": "AppendClaim",
                "client_request_id": "req-vital-append-001",
                "claim": base_entry.record,
                "expected": accepted_entry_json(&base_entry)
            },
            {
                "id": "120-revision-vital-sign-canonical-record-hash",
                "operation": "ValidateClaim",
                "claim": revision_claim,
                "expected": {
                    "canonical_json": revision_canonical,
                    "record_hash": revision_record_hash.as_str(),
                    "revision_target": {
                        "id": "claim-vital-hr-001",
                        "hash": base_record_hash.as_str()
                    }
                }
            },
            {
                "id": "130-revision-vital-sign-append-result",
                "operation": "AppendRevisionClaim",
                "client_request_id": "req-vital-revision-001",
                "claim": revision_entry.record,
                "expected": accepted_entry_json(&revision_entry)
            },
            {
                "id": "140-point-read-before-and-after-correction",
                "operation": "PointRead",
                "queries": [
                    {
                        "valid_at": "2026-05-03T12:00:00Z",
                        "known_at": "2026-05-03T12:00:10Z",
                        "expected_claim_ids": entry_claim_ids(before_correction.entries())
                    },
                    {
                        "valid_at": "2026-05-03T12:00:00Z",
                        "known_at": "2026-05-03T12:05:10Z",
                        "expected_claim_ids": entry_claim_ids(after_correction.entries())
                    }
                ]
            }
        ],
        "negative_vectors": [
            {
                "id": "900-patient-mismatch",
                "operation": "AppendClaim",
                "patient_ledger_ref": { "patient_id": "patient-other" },
                "claim": base_claim,
                "expected_error": "PATIENT_MISMATCH"
            },
            {
                "id": "910-predicate-shape-mismatch",
                "operation": "ValidateClaim",
                "claim": mutated_claim(&vital_sign_claim("claim-vital-shape-mismatch", 88), |claim| {
                    claim["shape"] = json!("context");
                }),
                "expected_error": "PREDICATE_SHAPE_MISMATCH"
            },
            {
                "id": "920-non-canonical-recorded-time",
                "operation": "ValidateClaim",
                "claim": mutated_claim(&vital_sign_claim("claim-vital-noncanonical-time", 88), |claim| {
                    claim["time"]["recorded_at"] = json!("2026-05-03T12:00:05.000Z");
                }),
                "expected_error": "NON_CANONICAL_TIMESTAMP"
            },
            {
                "id": "930-caller-supplied-k3-store-metadata",
                "operation": "ValidateClaim",
                "claim": mutated_claim(&vital_sign_claim("claim-vital-k3-metadata", 88), |claim| {
                    claim["time"]["accepted_at"] = json!("2026-05-03T12:00:10Z");
                }),
                "expected_error": "CALLER_SUPPLIED_STORE_METADATA"
            },
            {
                "id": "940-revision-not-allowed-for-base-append",
                "operation": "AppendClaim",
                "claim": revision_entry.record,
                "expected_error": "REVISION_NOT_ALLOWED_FOR_APPEND"
            },
            {
                "id": "950-revision-target-not-found",
                "operation": "AppendRevisionClaim",
                "claim": mutated_claim(&revision_entry.record, |claim| {
                    claim["revises"]["target"]["id"] = json!("claim-vital-missing");
                }),
                "expected_error": "REVISION_TARGET_NOT_FOUND"
            },
            {
                "id": "960-stale-revision-target-hash",
                "operation": "AppendRevisionClaim",
                "claim": mutated_claim(&revision_entry.record, |claim| {
                    claim["revises"]["target"]["hash"] = json!("sha256:0000000000000000000000000000000000000000000000000000000000000000");
                }),
                "expected_error": "REVISION_TARGET_HASH_MISMATCH"
            },
            {
                "id": "970-idempotency-key-reused-with-different-payload",
                "operation": "AppendClaim",
                "client_request_id": "req-vital-append-001",
                "claim": vital_sign_claim("claim-vital-idempotency-conflict", 89),
                "expected_error": "IDEMPOTENCY_CONFLICT"
            }
        ]
    }))
}

pub fn vital_sign_claim(id: &str, value: i64) -> Value {
    json!({
        "id": id,
        "shape": "observation",
        "predicate": "vital.sign",
        "subject": { "patientId": "patient-vital-001" },
        "object": {
            "code": "heart_rate",
            "value": value,
            "unit": "/min",
            "encounterId": "encounter-vital-001",
            "source": {
                "kind": "monitor_extension",
                "ref": "public-vitals-fixture"
            },
            "quality": "valid"
        },
        "time": {
            "valid": { "instant": "2026-05-03T12:00:00Z" },
            "recorded_at": "2026-05-03T12:00:05Z"
        },
        "actor": { "kind": "device", "id": "monitor-extension" },
        "integrity": { "canonicalization": CANONICALIZATION_ID }
    })
}

fn accepted_entry_json(entry: &LedgerEntry) -> Value {
    json!({
        "claim_id": entry.record["id"],
        "record_hash": entry.record_hash,
        "entry_hash": entry.entry_hash,
        "seq": entry.accepted.seq,
        "accepted_at": entry.accepted.accepted_at,
        "batch_id": entry.accepted.batch_id,
        "previous_entry_hash": entry.previous_entry_hash,
        "head_hash": entry.entry_hash,
        "claim_json": entry.record
    })
}

fn entry_claim_ids(entries: &[&LedgerEntry]) -> Vec<String> {
    entries
        .iter()
        .filter_map(|entry| entry.record["id"].as_str().map(str::to_string))
        .collect()
}

fn mutated_claim(source: &Value, mutate: impl FnOnce(&mut Value)) -> Value {
    let mut claim = source.clone();
    mutate(&mut claim);
    claim
}

fn debug_error(error: impl std::fmt::Debug) -> String {
    format!("{error:?}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::predicates::CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION;

    #[test]
    fn vital_sign_vector_suite_is_deterministic_and_names_required_cases() {
        let suite = clinical_truth_v1alpha1_vital_sign_vectors().unwrap();
        let rendered = serde_json::to_string_pretty(&suite).unwrap();

        assert_eq!(suite["suite_id"], VITAL_SIGN_VECTOR_SUITE_ID);
        assert_eq!(
            suite["registry"]["version"],
            CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION
        );
        for expected in [
            "100-base-vital-sign-canonical-record-hash",
            "110-base-vital-sign-append-result",
            "120-revision-vital-sign-canonical-record-hash",
            "130-revision-vital-sign-append-result",
            "140-point-read-before-and-after-correction",
            "900-patient-mismatch",
            "910-predicate-shape-mismatch",
            "920-non-canonical-recorded-time",
            "930-caller-supplied-k3-store-metadata",
            "940-revision-not-allowed-for-base-append",
            "950-revision-target-not-found",
            "960-stale-revision-target-hash",
            "970-idempotency-key-reused-with-different-payload",
        ] {
            assert!(rendered.contains(expected), "missing vector {expected}");
        }
    }

    #[test]
    fn committed_vital_sign_vector_suite_matches_generator() {
        let generated =
            serde_json::to_string_pretty(&clinical_truth_v1alpha1_vital_sign_vectors().unwrap())
                .unwrap();
        let committed =
            include_str!("../../../conformance/clinical_truth/v1alpha1/vital_sign_vectors.json")
                .trim_end();

        assert_eq!(generated, committed);
    }
}
