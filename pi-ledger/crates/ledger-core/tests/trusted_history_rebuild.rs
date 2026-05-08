use ledger_core::admission::{AppendAdmissibleClaim, RevisionAdmissibleClaim};
use ledger_core::claim::validate_claim;
use ledger_core::fixture::{
    GENERATED_PATIENT_ID, VALID_AT_FIXTURE_OBSERVATION, fixture_correction_claim,
    fixture_observation_claim,
};
use ledger_core::ledger::{AppendLedger, LedgerError, StoreClock};
use ledger_core::predicates::phase1_registry;
use ledger_core::query::point_read;

#[test]
fn trusted_rebuild_docs_name_snapshot_seam_and_bypass_boundary() {
    let rebuild = include_str!("../../../docs/trusted-history-rebuild-seam.md");

    for required in [
        "New write path vs rebuild path",
        "Public trusted rebuild Interface",
        "AppendLedger::snapshot",
        "ledger::LedgerSnapshot",
        "AppendLedger::from_snapshot",
        "AppendLedger::validate",
        "AppendLedger::recompute_hashes",
        "AppendLedger::entries",
        "What `from_snapshot` validates",
        "does not rerun current Predicate registry policy",
        "Admission bypass remains test-only",
        "AppendLedger::append_without_predicate_or_revision_admission",
        "not part of the production public Interface",
        "Query after rebuild",
    ] {
        assert!(
            rebuild.contains(required),
            "trusted rebuild docs must mention `{required}`"
        );
    }

    for forbidden in [
        "pi-chart/src",
        "pi-chart/patients",
        "pi-sim/src",
        "pi-agent/",
    ] {
        assert!(
            !rebuild.contains(forbidden),
            "trusted rebuild docs must not couple to `{forbidden}`"
        );
    }
}

#[test]
fn public_rebuild_round_trips_snapshot_and_preserves_query_view() {
    let ledger = correction_ledger();
    let snapshot = ledger.snapshot();

    let rebuilt = AppendLedger::from_snapshot(snapshot).unwrap();
    let view = point_read(
        rebuilt.entries(),
        VALID_AT_FIXTURE_OBSERVATION,
        "2026-05-03T13:30:00Z",
    )
    .unwrap();

    assert_eq!(rebuilt.patient_id(), GENERATED_PATIENT_ID);
    assert_eq!(rebuilt.entries().len(), 2);
    assert_eq!(claim_ids(view.entries()), vec!["claim-hr-correction"]);
}

#[test]
fn public_rebuild_rejects_broken_previous_link_and_head() {
    let ledger = correction_ledger();

    let mut broken_previous_link = ledger.snapshot();
    broken_previous_link.entries[1].previous_entry_hash = Some(valid_but_wrong_hash('a'));
    assert!(matches!(
        AppendLedger::from_snapshot(broken_previous_link),
        Err(LedgerError::PreviousEntryHashMismatch { seq: 2, .. })
    ));

    let mut broken_head = ledger.snapshot();
    broken_head.head_hash = Some(valid_but_wrong_hash('b'));
    assert!(matches!(
        AppendLedger::from_snapshot(broken_head),
        Err(LedgerError::HeadHashMismatch { .. })
    ));
}

#[test]
fn snapshot_rebuild_does_not_reopen_public_admission_bypass() {
    let ledger_source = include_str!("../src/ledger.rs");

    assert!(ledger_source.contains("pub fn from_snapshot"));
    assert!(
        !ledger_source.contains("\n    pub fn append_without_predicate_or_revision_admission"),
        "trusted rebuild must not expose Admission bypass as a production public method"
    );
}

fn correction_ledger() -> AppendLedger {
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
    ledger.append_revision_admissible(&correction).unwrap();

    ledger
}

fn claim_ids(entries: &[&ledger_core::ledger::LedgerEntry]) -> Vec<String> {
    entries
        .iter()
        .map(|entry| entry.record["id"].as_str().unwrap().to_string())
        .collect()
}

fn valid_but_wrong_hash(digit: char) -> String {
    format!(
        "sha256:{}",
        std::iter::repeat_n(digit, 64).collect::<String>()
    )
}
