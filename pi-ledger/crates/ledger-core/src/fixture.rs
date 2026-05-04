use crate::admission::{AdmissionError, AppendAdmissibleClaim, RevisionAdmissibleClaim};
use crate::canonical::CANONICALIZATION_ID;
use crate::claim::{ClaimError, validate_claim};
use crate::ledger::{AppendLedger, LedgerError, StoreClock};
use crate::predicates::{PredicateError, PredicateRegistry, phase1_registry};
use serde_json::{Value, json};

pub const GENERATED_PATIENT_ID: &str = "generated-patient-kernel-001";
pub const GENERATED_ENCOUNTER_ID: &str = "generated-encounter-kernel-001";
pub const VALID_AT_FIXTURE_OBSERVATION: &str = "2026-05-03T12:15:00Z";
pub const KNOWN_AT_BEFORE_CORRECTION: &str = "2026-05-03T12:30:00Z";
pub const KNOWN_AT_AFTER_CORRECTION: &str = "2026-05-03T13:30:00Z";
pub const PACKAGE_RESEARCH_CITATIONS: [&str; 4] = [
    "pkg-018:plans/test-spec-018-kernel-predicate-bitemporal-ledger.md",
    "pkg-018:plans/prd-018a-claim-kernel-and-compat.md",
    "pkg-018:plans/prd-018b-predicate-registry-and-validation.md",
    "pkg-018:plans/prd-018c-bitemporal-ledger-and-integrity.md",
];

const ACCEPTED_TIMES: [&str; 5] = [
    "2026-05-03T12:00:10Z",
    "2026-05-03T12:00:20Z",
    "2026-05-03T12:00:30Z",
    "2026-05-03T12:00:40Z",
    "2026-05-03T13:00:10Z",
];

#[derive(Debug, Eq, PartialEq)]
pub enum FixtureError {
    Claim(ClaimError),
    Ledger(LedgerError),
    Predicate(PredicateError),
    Admission(AdmissionError),
}

impl From<ClaimError> for FixtureError {
    fn from(error: ClaimError) -> Self {
        Self::Claim(error)
    }
}

impl From<LedgerError> for FixtureError {
    fn from(error: LedgerError) -> Self {
        Self::Ledger(error)
    }
}

impl From<PredicateError> for FixtureError {
    fn from(error: PredicateError) -> Self {
        Self::Predicate(error)
    }
}

impl From<AdmissionError> for FixtureError {
    fn from(error: AdmissionError) -> Self {
        Self::Admission(error)
    }
}

#[derive(Debug)]
pub struct Phase1Fixture {
    patient_id: String,
    encounter_id: String,
    base_claims: Vec<Value>,
    correction_claim: Value,
    ledger: AppendLedger,
    registry: PredicateRegistry,
}

impl Phase1Fixture {
    pub fn patient_id(&self) -> &str {
        &self.patient_id
    }

    pub fn encounter_id(&self) -> &str {
        &self.encounter_id
    }

    pub fn base_claims(&self) -> &[Value] {
        &self.base_claims
    }

    pub fn correction_claim(&self) -> &Value {
        &self.correction_claim
    }

    pub fn ledger(&self) -> &AppendLedger {
        &self.ledger
    }

    pub fn registry(&self) -> &PredicateRegistry {
        &self.registry
    }

    pub fn claims(&self) -> Vec<&Value> {
        self.base_claims
            .iter()
            .chain(std::iter::once(&self.correction_claim))
            .collect()
    }
}

pub fn phase1_fixture() -> Result<Phase1Fixture, FixtureError> {
    let registry = phase1_registry()?;
    let mut ledger = AppendLedger::new(
        GENERATED_PATIENT_ID,
        StoreClock::deterministic(ACCEPTED_TIMES),
    );
    let base_claims = base_shape_claims();
    for claim in &base_claims {
        append_admitted_claim(&mut ledger, &registry, claim)?;
    }

    let original_observation_hash = ledger.entries()[1].record_hash.clone();
    let correction_claim = correction_claim(&original_observation_hash);
    append_revision_admitted_claim(&mut ledger, &registry, &correction_claim)?;

    Ok(Phase1Fixture {
        patient_id: GENERATED_PATIENT_ID.to_string(),
        encounter_id: GENERATED_ENCOUNTER_ID.to_string(),
        base_claims,
        correction_claim,
        ledger,
        registry,
    })
}

fn append_admitted_claim(
    ledger: &mut AppendLedger,
    registry: &PredicateRegistry,
    claim: &Value,
) -> Result<(), FixtureError> {
    let validated = validate_claim(claim)?;
    let admitted = AppendAdmissibleClaim::admit(&validated, ledger.patient_id(), registry)?;
    ledger.append_admissible(&admitted)?;
    Ok(())
}

fn append_revision_admitted_claim(
    ledger: &mut AppendLedger,
    registry: &PredicateRegistry,
    claim: &Value,
) -> Result<(), FixtureError> {
    let validated = validate_claim(claim)?;
    let append_admitted = AppendAdmissibleClaim::admit(&validated, ledger.patient_id(), registry)?;
    let revision_admitted = RevisionAdmissibleClaim::admit(&append_admitted, ledger.entries())?;
    ledger.append_revision_admissible(&revision_admitted)?;
    Ok(())
}

fn base_shape_claims() -> Vec<Value> {
    vec![
        context_claim(),
        observation_claim("claim-generated-observation-original", 88),
        interpretation_claim(),
        act_claim(),
    ]
}

fn common_subject() -> Value {
    json!({ "patientId": GENERATED_PATIENT_ID })
}

fn common_actor() -> Value {
    json!({ "kind": "clinician", "id": "generated-fixture-author" })
}

fn common_integrity() -> Value {
    json!({ "canonicalization": CANONICALIZATION_ID })
}

fn context_claim() -> Value {
    json!({
        "id": "claim-generated-context",
        "shape": "context",
        "predicate": "encounter.context",
        "subject": common_subject(),
        "object": { "encounterId": GENERATED_ENCOUNTER_ID },
        "time": {
            "valid": {
                "interval": {
                    "start": "2026-05-03T12:00:00Z",
                    "end": "2026-05-03T13:00:00Z"
                }
            },
            "recorded_at": "2026-05-03T12:00:05Z"
        },
        "actor": common_actor(),
        "integrity": common_integrity()
    })
}

fn observation_claim(id: &str, value: i64) -> Value {
    json!({
        "id": id,
        "shape": "observation",
        "predicate": "vital.sign",
        "subject": common_subject(),
        "object": { "code": "heart-rate", "value": value, "unit": "/min" },
        "time": {
            "valid": { "instant": VALID_AT_FIXTURE_OBSERVATION },
            "recorded_at": VALID_AT_FIXTURE_OBSERVATION
        },
        "actor": common_actor(),
        "integrity": common_integrity()
    })
}

fn interpretation_claim() -> Value {
    json!({
        "id": "claim-generated-interpretation",
        "shape": "interpretation",
        "predicate": "clinical.interpretation",
        "subject": common_subject(),
        "object": { "summary": "Generated fixture interpretation for kernel proof" },
        "time": {
            "valid": { "instant": VALID_AT_FIXTURE_OBSERVATION },
            "recorded_at": "2026-05-03T12:15:05Z"
        },
        "actor": common_actor(),
        "integrity": common_integrity()
    })
}

fn act_claim() -> Value {
    json!({
        "id": "claim-generated-act",
        "shape": "act",
        "predicate": "care.act",
        "subject": common_subject(),
        "object": { "description": "Generated fixture care action" },
        "time": {
            "valid": { "instant": VALID_AT_FIXTURE_OBSERVATION },
            "recorded_at": "2026-05-03T12:15:10Z"
        },
        "actor": common_actor(),
        "integrity": common_integrity()
    })
}

fn correction_claim(target_hash: &str) -> Value {
    let mut claim = observation_claim("claim-generated-observation-correction", 90);
    claim["revises"] = json!({
        "mode": "corrects",
        "target": {
            "id": "claim-generated-observation-original",
            "hash": target_hash
        }
    });
    claim
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::admission::{AppendAdmissibleClaim, RevisionAdmissibleClaim};
    use crate::query::point_read;
    use std::collections::BTreeSet;

    #[test]
    fn t_k6_01_fixture_inventory_is_tiny_and_generated() {
        let fixture = phase1_fixture().unwrap();

        assert_eq!(fixture.patient_id(), GENERATED_PATIENT_ID);
        assert_eq!(fixture.encounter_id(), GENERATED_ENCOUNTER_ID);
        assert_eq!(fixture.base_claims().len(), 4);
        assert_eq!(fixture.correction_claim()["revises"]["mode"], "corrects");
        assert_eq!(fixture.registry().len(), 4);
        assert_eq!(fixture.ledger().entries().len(), 5);
    }

    #[test]
    fn t_k6_01_fixture_claims_validate_through_k1_k4_and_append_through_k3() {
        let fixture = phase1_fixture().unwrap();

        for claim in fixture.claims() {
            validate_claim(claim).unwrap();
            fixture.registry().validate_claim(claim).unwrap();
        }
        fixture.ledger().validate().unwrap();
        assert_eq!(fixture.ledger().entries().len(), fixture.claims().len());
    }

    #[test]
    fn t_k10_06_fixture_claims_have_an_explicit_append_admission_path() {
        let fixture = phase1_fixture().unwrap();

        for claim in fixture.claims() {
            let validated = validate_claim(claim).unwrap();
            let admitted =
                AppendAdmissibleClaim::admit(&validated, fixture.patient_id(), fixture.registry())
                    .unwrap();

            assert_eq!(admitted.target_patient_id(), GENERATED_PATIENT_ID);
            assert_eq!(admitted.patient_id(), GENERATED_PATIENT_ID);
        }
    }

    #[test]
    fn t_k11_07_fixture_correction_has_an_explicit_revision_admission_path() {
        let fixture = phase1_fixture().unwrap();
        let validated = validate_claim(fixture.correction_claim()).unwrap();
        let append_admitted =
            AppendAdmissibleClaim::admit(&validated, fixture.patient_id(), fixture.registry())
                .unwrap();
        let base_entries = &fixture.ledger().entries()[..fixture.base_claims().len()];

        let revision_admitted =
            RevisionAdmissibleClaim::admit(&append_admitted, base_entries).unwrap();

        assert_eq!(
            revision_admitted.id(),
            "claim-generated-observation-correction"
        );
        assert_eq!(
            revision_admitted.revision_target().id(),
            "claim-generated-observation-original"
        );
    }

    #[test]
    fn t_k6_01_fixture_contains_four_base_shapes_and_no_fifth_shape() {
        let fixture = phase1_fixture().unwrap();
        let base_shapes = fixture
            .base_claims()
            .iter()
            .map(|claim| claim["shape"].as_str().unwrap())
            .collect::<BTreeSet<_>>();

        assert_eq!(base_shapes.len(), 4);
        assert_eq!(
            base_shapes,
            BTreeSet::from(["act", "context", "interpretation", "observation"])
        );
        assert_eq!(fixture.correction_claim()["shape"], "observation");
    }

    #[test]
    fn t_k6_01_fixture_contains_exactly_one_patient_and_one_encounter() {
        let fixture = phase1_fixture().unwrap();
        let patient_ids = fixture
            .claims()
            .into_iter()
            .map(|claim| claim["subject"]["patientId"].as_str().unwrap())
            .collect::<BTreeSet<_>>();
        let encounter_ids = fixture
            .base_claims()
            .iter()
            .filter_map(|claim| claim.pointer("/object/encounterId"))
            .map(|value| value.as_str().unwrap())
            .collect::<BTreeSet<_>>();

        assert_eq!(patient_ids, BTreeSet::from([GENERATED_PATIENT_ID]));
        assert_eq!(encounter_ids, BTreeSet::from([GENERATED_ENCOUNTER_ID]));
    }

    #[test]
    fn t_k6_01_fixture_generation_is_deterministic_across_calls() {
        let first = phase1_fixture().unwrap();
        let second = phase1_fixture().unwrap();
        let first_snapshot = first.ledger().snapshot();
        let second_snapshot = second.ledger().snapshot();

        assert_eq!(first_snapshot.patient_id, second_snapshot.patient_id);
        assert_eq!(first_snapshot.head_hash, second_snapshot.head_hash);
        assert_eq!(first_snapshot.entries, second_snapshot.entries);
        assert_eq!(
            first
                .ledger()
                .entries()
                .iter()
                .map(|entry| (
                    &entry.accepted.accepted_at,
                    entry.accepted.seq,
                    &entry.accepted.batch_id
                ))
                .collect::<Vec<_>>(),
            second
                .ledger()
                .entries()
                .iter()
                .map(|entry| (
                    &entry.accepted.accepted_at,
                    entry.accepted.seq,
                    &entry.accepted.batch_id
                ))
                .collect::<Vec<_>>()
        );
        assert_eq!(
            first
                .ledger()
                .entries()
                .iter()
                .map(|entry| entry.accepted.accepted_at.as_str())
                .collect::<Vec<_>>(),
            ACCEPTED_TIMES
        );
        assert_eq!(
            first
                .ledger()
                .entries()
                .iter()
                .map(|entry| (entry.accepted.seq, entry.accepted.batch_id.as_str()))
                .collect::<Vec<_>>(),
            vec![
                (1, "batch-000000000001"),
                (2, "batch-000000000002"),
                (3, "batch-000000000003"),
                (4, "batch-000000000004"),
                (5, "batch-000000000005"),
            ]
        );
    }

    #[test]
    fn t_k6_01_fixture_supports_k5_known_time_correction_behavior() {
        let fixture = phase1_fixture().unwrap();

        let before = point_read(
            fixture.ledger().entries(),
            VALID_AT_FIXTURE_OBSERVATION,
            KNOWN_AT_BEFORE_CORRECTION,
        )
        .unwrap();
        let after = point_read(
            fixture.ledger().entries(),
            VALID_AT_FIXTURE_OBSERVATION,
            KNOWN_AT_AFTER_CORRECTION,
        )
        .unwrap();

        let before_ids = entry_ids(before.entries());
        let after_ids = entry_ids(after.entries());
        assert!(before_ids.contains(&"claim-generated-observation-original".to_string()));
        assert!(!before_ids.contains(&"claim-generated-observation-correction".to_string()));
        assert!(!after_ids.contains(&"claim-generated-observation-original".to_string()));
        assert!(after_ids.contains(&"claim-generated-observation-correction".to_string()));
    }

    #[test]
    fn t_k6_02_fixture_avoids_current_patient_capture() {
        let fixture = phase1_fixture().unwrap();
        let text = fixture_boundary_text(&fixture);

        assert_forbidden_tokens_absent(
            &text,
            &[
                "patient_001",
                "patient_002",
                "patient_003",
                "patient_004",
                "patient_005",
                "patients/",
            ],
        );
    }

    #[test]
    fn t_k6_02_fixture_avoids_pi_chart_prototype_authority() {
        let fixture = phase1_fixture().unwrap();
        let text = fixture_boundary_text(&fixture);

        assert_forbidden_tokens_absent(
            &text,
            &[
                "pi-chart/src/claim-ledger",
                "EventEnvelope",
                "eventEnvelope",
                "cockpit",
                "Agent Canvas",
            ],
        );
    }

    #[test]
    fn t_neg_07_t_boundary_01_package_citations_do_not_leak_package_adr_authority() {
        for citation in PACKAGE_RESEARCH_CITATIONS {
            assert!(citation.starts_with("pkg-018:"));
            assert!(!citation.contains("ADR 018"));
            assert!(!citation.contains("ADR-018"));
        }
    }

    #[test]
    fn t_boundary_02_fixture_has_no_hidden_simulator_coupling() {
        let fixture = phase1_fixture().unwrap();
        let text = fixture_boundary_text(&fixture);

        assert_forbidden_tokens_absent(
            &text,
            &["pi-sim", "hidden simulator", "oracle", "vitals/current"],
        );
    }

    #[test]
    fn t_boundary_03_fixture_has_no_backend_or_phi_commitment() {
        let fixture = phase1_fixture().unwrap();
        let text = fixture_boundary_text(&fixture);

        assert_forbidden_tokens_absent(
            &text,
            &[
                "FHIR",
                "fhir",
                "openEHR",
                "openehr",
                "CAS",
                "database",
                "backend",
                "service framework",
                "non-local PHI",
                "real PHI",
            ],
        );
    }

    #[test]
    fn t_neg_09_t_boundary_04_fixture_has_no_access_plane_or_agent_write_shortcut() {
        let fixture = phase1_fixture().unwrap();
        let text = fixture_boundary_text(&fixture);

        assert_forbidden_tokens_absent(
            &text,
            &[
                "MCP",
                "mcp",
                "capture",
                "semantic search",
                "review queue",
                "agentAppendClaim",
                "agent append",
                "direct agent",
                "append tool",
                "orchestrator",
                "access plane",
                "access-plane",
                "runtime",
                "runtime transcript",
            ],
        );
    }

    #[test]
    fn t_neg_08_t_boundary_05_fixture_has_no_current_patient_migration_creep() {
        let fixture = phase1_fixture().unwrap();
        let text = fixture_boundary_text(&fixture);

        assert_forbidden_tokens_absent(
            &text,
            &[
                "migration",
                "migrate",
                "compatibility mapper",
                "timeline/",
                "pi-chart/patients",
                "patient directory",
            ],
        );
    }

    fn fixture_boundary_text(fixture: &Phase1Fixture) -> String {
        let claims = serde_json::to_string(&fixture.claims()).unwrap();
        format!(
            "{} {} {}",
            fixture.patient_id(),
            fixture.encounter_id(),
            claims
        )
    }

    fn assert_forbidden_tokens_absent(text: &str, forbidden_tokens: &[&str]) {
        for token in forbidden_tokens {
            assert!(
                !text.contains(token),
                "fixture boundary text unexpectedly contained {token:?}"
            );
        }
    }

    fn entry_ids(entries: &[&crate::ledger::LedgerEntry]) -> Vec<String> {
        entries
            .iter()
            .map(|entry| entry.record["id"].as_str().unwrap().to_string())
            .collect()
    }
}
