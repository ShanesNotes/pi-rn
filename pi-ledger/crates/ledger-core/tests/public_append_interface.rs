use ledger_core::admission::{AppendAdmissibleClaim, RevisionAdmissibleClaim};
use ledger_core::claim::validate_claim;
use ledger_core::fixture::{
    GENERATED_PATIENT_ID, fixture_correction_claim, fixture_observation_claim,
};
use ledger_core::ledger::{AppendLedger, StoreClock};
use ledger_core::predicates::phase1_registry;

#[test]
fn interface_inventory_docs_name_safe_paths_and_bypass_boundary() {
    let inventory = include_str!("../../../docs/ledger-core-public-interface.md");

    for required in [
        "Ledger-acceptable Claim",
        "Validated Claim",
        "Append-admissible Claim",
        "Revision-admissible Claim",
        "Append ledger",
        "Query point read",
        "AppendLedger::append_admissible",
        "AppendLedger::append_revision_admissible",
        "AppendLedger::from_snapshot",
        "AppendLedger::append_without_predicate_or_revision_admission",
        "fixture::fixture_observation_claim",
        "fixture::fixture_correction_claim",
        "clinical assertions",
        "accepted ledger history",
        "test-only",
        "not an Adapter contract",
    ] {
        assert!(
            inventory.contains(required),
            "public Interface inventory must mention `{required}`"
        );
    }

    for forbidden in [
        "pi-chart/src",
        "pi-chart/patients",
        "pi-sim/src",
        "pi-agent/",
    ] {
        assert!(
            !inventory.contains(forbidden),
            "public Interface inventory must not couple to `{forbidden}`"
        );
    }

    for overclaim in ["clinical facts", "clinical truth"] {
        assert!(
            !inventory.contains(overclaim),
            "public Interface inventory must not imply the ledger decides `{overclaim}`"
        );
    }
}

#[test]
fn admission_lifecycle_docs_explain_proof_steps_and_append_ledger_authority() {
    let lifecycle = include_str!("../../../docs/admission-proof-lifecycle.md");

    for required in [
        "Ledger-acceptable Claim",
        "Validated Claim",
        "Append-admissible Claim",
        "Revision-admissible Claim",
        "Why base Claims need Append admission",
        "Why correction Claims need Revision admission",
        "What remains Append ledger authority",
        "Known time",
        "sequence",
        "Record hash",
        "Entry hash",
        "previous-entry link",
        "ledger head",
        "Revision admission does not decide clinical conflict policy",
    ] {
        assert!(
            lifecycle.contains(required),
            "admission lifecycle docs must mention `{required}`"
        );
    }
}

#[test]
fn public_examples_use_fixture_helpers_instead_of_local_claim_json_builders() {
    let test_source = include_str!("public_append_interface.rs");

    assert!(test_source.contains("fixture_observation_claim"));
    assert!(test_source.contains("fixture_correction_claim"));
    for forbidden in [
        concat!("fn ", "observation_claim("),
        concat!("fn ", "correction_claim("),
        concat!("json!", "({"),
    ] {
        assert!(
            !test_source.contains(forbidden),
            "public Interface examples should use fixture helpers instead of `{forbidden}`"
        );
    }
}

#[test]
fn k12_public_source_guard_keeps_admission_bypass_out_of_production_interface() {
    let ledger_source = include_str!("../src/ledger.rs");

    assert!(
        !ledger_source.contains("\n    pub fn append_without_predicate_or_revision_admission"),
        "Admission bypass must not be exposed as a production public AppendLedger method"
    );
}

#[test]
fn k12_public_base_claim_moves_from_validated_to_append_admissible_before_append() {
    let registry = phase1_registry().unwrap();
    let mut ledger = AppendLedger::new(
        GENERATED_PATIENT_ID,
        StoreClock::deterministic(["2026-05-03T12:30:00Z"]),
    );
    let claim = fixture_observation_claim("claim-hr-original", 88);
    let validated = validate_claim(&claim).unwrap();
    let admitted =
        AppendAdmissibleClaim::admit(&validated, ledger.patient_id(), &registry).unwrap();

    let entry = ledger.append_admissible(&admitted).unwrap();

    assert_eq!(entry.record["id"], "claim-hr-original");
    assert_eq!(entry.accepted.seq, 1);
}

#[test]
fn k12_public_correction_claim_moves_from_append_admissible_to_revision_admissible_before_append() {
    let registry = phase1_registry().unwrap();
    let mut ledger = AppendLedger::new(
        GENERATED_PATIENT_ID,
        StoreClock::deterministic(["2026-05-03T12:30:00Z", "2026-05-03T13:30:00Z"]),
    );

    let original_claim = fixture_observation_claim("claim-hr-original", 88);
    let original = validate_claim(&original_claim).unwrap();
    let original = AppendAdmissibleClaim::admit(&original, ledger.patient_id(), &registry).unwrap();
    let original_hash = ledger
        .append_admissible(&original)
        .unwrap()
        .record_hash
        .clone();

    let correction_claim = fixture_correction_claim(
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
