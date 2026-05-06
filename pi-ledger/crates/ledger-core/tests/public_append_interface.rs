use ledger_core::admission::{AppendAdmissibleClaim, RevisionAdmissibleClaim};
use ledger_core::claim::validate_claim;
use ledger_core::ledger::{AppendLedger, StoreClock};
use ledger_core::predicates::phase1_registry;
use serde_json::{Value, json};

#[test]
fn k12_public_source_guard_keeps_admission_bypass_out_of_production_interface() {
    let ledger_source = include_str!("../src/ledger.rs");

    assert!(
        !ledger_source.contains("\n    pub fn append_without_predicate_or_revision_admission"),
        "Admission bypass must not be exposed as a production public AppendLedger method"
    );
}

#[test]
fn k12_public_base_append_example_uses_append_admission() {
    let registry = phase1_registry().unwrap();
    let mut ledger = AppendLedger::new(
        "patient_kernel",
        StoreClock::deterministic(["2026-05-03T12:30:00Z"]),
    );
    let claim = observation_claim("claim-hr-original", 88);
    let validated = validate_claim(&claim).unwrap();
    let admitted =
        AppendAdmissibleClaim::admit(&validated, ledger.patient_id(), &registry).unwrap();

    let entry = ledger.append_admissible(&admitted).unwrap();

    assert_eq!(entry.record["id"], "claim-hr-original");
    assert_eq!(entry.accepted.seq, 1);
}

#[test]
fn k12_public_correction_append_example_uses_revision_admission() {
    let registry = phase1_registry().unwrap();
    let mut ledger = AppendLedger::new(
        "patient_kernel",
        StoreClock::deterministic(["2026-05-03T12:30:00Z", "2026-05-03T13:30:00Z"]),
    );

    let original_claim = observation_claim("claim-hr-original", 88);
    let original = validate_claim(&original_claim).unwrap();
    let original = AppendAdmissibleClaim::admit(&original, ledger.patient_id(), &registry).unwrap();
    let original_hash = ledger
        .append_admissible(&original)
        .unwrap()
        .record_hash
        .clone();

    let correction_claim = correction_claim(
        "claim-hr-correction",
        90,
        "claim-hr-original",
        &original_hash,
    );
    let correction = validate_claim(&correction_claim).unwrap();
    let correction =
        AppendAdmissibleClaim::admit(&correction, ledger.patient_id(), &registry).unwrap();
    let correction = RevisionAdmissibleClaim::admit(&correction, ledger.entries()).unwrap();

    let entry = ledger.append_revision_admissible(&correction).unwrap();

    assert_eq!(entry.record["id"], "claim-hr-correction");
    assert_eq!(entry.accepted.seq, 2);
}

fn observation_claim(id: &str, value: i64) -> Value {
    json!({
        "id": id,
        "shape": "observation",
        "predicate": "vital.sign",
        "subject": { "patientId": "patient_kernel" },
        "object": { "code": "heart-rate", "value": value, "unit": "/min" },
        "time": {
            "valid": { "instant": "2026-05-03T12:15:00Z" },
            "recorded_at": "2026-05-03T12:16:00Z"
        },
        "actor": { "type": "device", "id": "monitor-fixture" },
        "integrity": { "canonicalization": "jcs-rfc8785-pi-chart-v1" }
    })
}

fn correction_claim(id: &str, value: i64, target_id: &str, target_hash: &str) -> Value {
    let mut claim = observation_claim(id, value);
    claim["revises"] = json!({
        "mode": "corrects",
        "target": {
            "id": target_id,
            "hash": target_hash
        }
    });
    claim
}
