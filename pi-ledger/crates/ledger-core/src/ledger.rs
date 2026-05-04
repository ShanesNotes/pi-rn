use crate::admission::{AdmissionError, AppendAdmissibleClaim, RevisionAdmissibleClaim};
use crate::canonical::{canonical_json, record_hash};
use crate::claim::{ClaimError, ValidatedClaim, validate_claim};
use crate::hash::{EntryHash, RecordHash};
use crate::time::CanonicalTimestamp;

use serde_json::{Value, json};
use sha2::{Digest, Sha256};

pub const ENTRY_VERSION: u32 = 1;
pub const RECORD_KIND_CLAIM: &str = "claim";

#[derive(Debug, Eq, PartialEq)]
pub enum LedgerError {
    Claim(ClaimError),
    Admission(AdmissionError),
    Canonical(String),
    InvalidRecordHash {
        seq: u64,
        field: &'static str,
        value: String,
    },
    InvalidEntryHash {
        seq: u64,
        field: &'static str,
        value: String,
    },
    InvalidHeadHash {
        value: String,
    },
    SequenceMismatch {
        expected: u64,
        actual: u64,
    },
    PreviousEntryHashMismatch {
        seq: u64,
        expected: Option<String>,
        actual: Option<String>,
    },
    RecordHashMismatch {
        seq: u64,
        expected: String,
        actual: String,
    },
    EntryHashMismatch {
        seq: u64,
        expected: String,
        actual: String,
    },
    UnsupportedRecordKind {
        seq: u64,
        kind: String,
    },
    UnsupportedEntryVersion {
        seq: u64,
        version: u32,
    },
    BatchIdMismatch {
        seq: u64,
        expected: String,
        actual: String,
    },
    PatientMismatch {
        ledger_patient_id: String,
        claim_patient_id: String,
    },
    RevisionAdmissionRequired {
        claim_id: String,
    },
    StoreClockExhausted,
    InvalidAcceptedTime {
        seq: u64,
        value: String,
    },
    HeadHashMismatch {
        expected: Option<String>,
        actual: Option<String>,
    },
}

impl From<ClaimError> for LedgerError {
    fn from(error: ClaimError) -> Self {
        Self::Claim(error)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AcceptedMetadata {
    pub accepted_at: String,
    pub seq: u64,
    pub batch_id: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct LedgerEntry {
    pub record: Value,
    pub record_hash: String,
    pub previous_entry_hash: Option<String>,
    pub entry_hash: String,
    pub record_kind: String,
    pub entry_version: u32,
    pub accepted: AcceptedMetadata,
}

#[derive(Clone, Debug, PartialEq)]
pub struct LedgerSnapshot {
    pub patient_id: String,
    pub entries: Vec<LedgerEntry>,
    pub head_hash: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecomputedEntryHashes {
    pub seq: u64,
    pub record_hash: String,
    pub entry_hash: String,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct StoreClock {
    accepted_times: Vec<String>,
    next_index: usize,
}

impl StoreClock {
    pub fn deterministic<I, S>(accepted_times: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        Self {
            accepted_times: accepted_times.into_iter().map(Into::into).collect(),
            next_index: 0,
        }
    }

    fn peek_next_accepted_at(&self) -> Result<&str, LedgerError> {
        self.accepted_times
            .get(self.next_index)
            .map(String::as_str)
            .ok_or(LedgerError::StoreClockExhausted)
    }

    fn consume_next_accepted_at(&mut self) {
        self.next_index += 1;
    }
}

#[derive(Debug)]
pub struct AppendLedger {
    patient_id: String,
    store_clock: StoreClock,
    entries: Vec<LedgerEntry>,
    head_hash: Option<String>,
}

impl AppendLedger {
    pub fn new(patient_id: impl Into<String>, store_clock: StoreClock) -> Self {
        Self {
            patient_id: patient_id.into(),
            store_clock,
            entries: Vec::new(),
            head_hash: None,
        }
    }

    pub fn from_snapshot(snapshot: LedgerSnapshot) -> Result<Self, LedgerError> {
        let ledger = Self {
            patient_id: snapshot.patient_id,
            store_clock: StoreClock::default(),
            entries: snapshot.entries,
            head_hash: snapshot.head_hash,
        };
        ledger.validate()?;
        Ok(ledger)
    }

    pub fn append_admissible(
        &mut self,
        claim: &AppendAdmissibleClaim<'_>,
    ) -> Result<&LedgerEntry, LedgerError> {
        if claim.target_patient_id() != self.patient_id {
            return Err(LedgerError::PatientMismatch {
                ledger_patient_id: self.patient_id.clone(),
                claim_patient_id: claim.patient_id().to_string(),
            });
        }
        if claim.revision_target().is_some() {
            return Err(LedgerError::RevisionAdmissionRequired {
                claim_id: claim.id().to_string(),
            });
        }
        self.append_record_without_predicate_or_revision_admission(claim.raw())
    }

    pub fn append_revision_admissible(
        &mut self,
        claim: &RevisionAdmissibleClaim<'_>,
    ) -> Result<&LedgerEntry, LedgerError> {
        if claim.target_patient_id() != self.patient_id {
            return Err(LedgerError::PatientMismatch {
                ledger_patient_id: self.patient_id.clone(),
                claim_patient_id: claim.patient_id().to_string(),
            });
        }
        claim
            .verify_against(&self.entries)
            .map_err(LedgerError::Admission)?;
        self.append_record_without_predicate_or_revision_admission(claim.raw())
    }

    pub fn append_without_predicate_or_revision_admission(
        &mut self,
        claim: &ValidatedClaim<'_>,
    ) -> Result<&LedgerEntry, LedgerError> {
        self.validate_claim_patient_scope(claim)?;
        self.append_record_without_predicate_or_revision_admission(claim.raw())
    }

    fn append_record_without_predicate_or_revision_admission(
        &mut self,
        claim: &Value,
    ) -> Result<&LedgerEntry, LedgerError> {
        let seq = self.entries.len() as u64 + 1;
        let accepted_at = self.store_clock.peek_next_accepted_at()?.to_string();
        validate_accepted_at(seq, &accepted_at)?;
        let record_hash = record_hash(claim).map_err(LedgerError::Canonical)?;
        let previous_entry_hash = self.head_hash.clone();
        let previous_entry_hash_typed = parse_head_hash(self.head_hash.as_deref())?;
        let accepted = AcceptedMetadata {
            accepted_at,
            seq,
            batch_id: batch_id_for_seq(seq),
        };
        let entry_hash = compute_entry_hash(
            claim,
            &record_hash,
            previous_entry_hash_typed.as_ref(),
            &accepted,
        )?;
        let entry = LedgerEntry {
            record: claim.clone(),
            record_hash: record_hash.into_string(),
            previous_entry_hash,
            entry_hash: entry_hash.into_string(),
            record_kind: RECORD_KIND_CLAIM.to_string(),
            entry_version: ENTRY_VERSION,
            accepted,
        };
        self.store_clock.consume_next_accepted_at();
        self.head_hash = Some(entry.entry_hash.clone());
        let entry_index = self.entries.len();
        self.entries.push(entry);
        Ok(&self.entries[entry_index])
    }

    pub fn patient_id(&self) -> &str {
        &self.patient_id
    }

    pub fn head_hash(&self) -> Option<&str> {
        self.head_hash.as_deref()
    }

    pub fn entries(&self) -> &[LedgerEntry] {
        &self.entries
    }

    pub fn snapshot(&self) -> LedgerSnapshot {
        LedgerSnapshot {
            patient_id: self.patient_id.clone(),
            entries: self.entries.clone(),
            head_hash: self.head_hash.clone(),
        }
    }

    pub fn recompute_hashes(&self) -> Result<Vec<RecomputedEntryHashes>, LedgerError> {
        let mut hashes = Vec::with_capacity(self.entries.len());
        let mut previous_entry_hash: Option<EntryHash> = None;
        for entry in &self.entries {
            let recomputed_record_hash =
                record_hash(&entry.record).map_err(LedgerError::Canonical)?;
            let recomputed_entry_hash = compute_entry_hash_from_parts(
                &entry.record,
                &recomputed_record_hash,
                previous_entry_hash.as_ref(),
                &entry.accepted,
                &entry.record_kind,
                entry.entry_version,
            )?;
            hashes.push(RecomputedEntryHashes {
                seq: entry.accepted.seq,
                record_hash: recomputed_record_hash.into_string(),
                entry_hash: recomputed_entry_hash.as_str().to_string(),
            });
            previous_entry_hash = Some(recomputed_entry_hash);
        }
        Ok(hashes)
    }

    pub fn validate(&self) -> Result<(), LedgerError> {
        let mut previous_entry_hash: Option<EntryHash> = None;
        for (index, entry) in self.entries.iter().enumerate() {
            let claim = validate_claim(&entry.record)?;
            self.validate_claim_patient_scope(&claim)?;
            let expected_seq = index as u64 + 1;
            if entry.record_kind != RECORD_KIND_CLAIM {
                return Err(LedgerError::UnsupportedRecordKind {
                    seq: entry.accepted.seq,
                    kind: entry.record_kind.clone(),
                });
            }
            if entry.entry_version != ENTRY_VERSION {
                return Err(LedgerError::UnsupportedEntryVersion {
                    seq: entry.accepted.seq,
                    version: entry.entry_version,
                });
            }
            if entry.accepted.seq != expected_seq {
                return Err(LedgerError::SequenceMismatch {
                    expected: expected_seq,
                    actual: entry.accepted.seq,
                });
            }
            validate_accepted_at(entry.accepted.seq, &entry.accepted.accepted_at)?;
            let expected_batch_id = batch_id_for_seq(entry.accepted.seq);
            if entry.accepted.batch_id != expected_batch_id {
                return Err(LedgerError::BatchIdMismatch {
                    seq: entry.accepted.seq,
                    expected: expected_batch_id,
                    actual: entry.accepted.batch_id.clone(),
                });
            }
            let actual_previous_entry_hash = parse_optional_entry_hash(
                entry.accepted.seq,
                "previous_entry_hash",
                entry.previous_entry_hash.as_deref(),
            )?;
            if actual_previous_entry_hash != previous_entry_hash {
                return Err(LedgerError::PreviousEntryHashMismatch {
                    seq: entry.accepted.seq,
                    expected: optional_entry_hash_string(&previous_entry_hash),
                    actual: optional_entry_hash_string(&actual_previous_entry_hash),
                });
            }
            let expected_record_hash =
                record_hash(&entry.record).map_err(LedgerError::Canonical)?;
            let actual_record_hash =
                parse_record_hash(entry.accepted.seq, "record_hash", &entry.record_hash)?;
            if actual_record_hash != expected_record_hash {
                return Err(LedgerError::RecordHashMismatch {
                    seq: entry.accepted.seq,
                    expected: expected_record_hash.as_str().to_string(),
                    actual: actual_record_hash.into_string(),
                });
            }
            let actual_entry_hash =
                parse_entry_hash(entry.accepted.seq, "entry_hash", &entry.entry_hash)?;
            let expected_entry_hash = compute_entry_hash_from_parts(
                &entry.record,
                &expected_record_hash,
                actual_previous_entry_hash.as_ref(),
                &entry.accepted,
                &entry.record_kind,
                entry.entry_version,
            )?;
            if actual_entry_hash != expected_entry_hash {
                return Err(LedgerError::EntryHashMismatch {
                    seq: entry.accepted.seq,
                    expected: expected_entry_hash.into_string(),
                    actual: actual_entry_hash.into_string(),
                });
            }
            previous_entry_hash = Some(actual_entry_hash);
        }
        let actual_head_hash = parse_head_hash(self.head_hash.as_deref())?;
        if actual_head_hash != previous_entry_hash {
            return Err(LedgerError::HeadHashMismatch {
                expected: optional_entry_hash_string(&previous_entry_hash),
                actual: self.head_hash.clone(),
            });
        }
        Ok(())
    }

    fn validate_claim_patient_scope(&self, claim: &ValidatedClaim<'_>) -> Result<(), LedgerError> {
        if claim.patient_id() == self.patient_id {
            Ok(())
        } else {
            Err(LedgerError::PatientMismatch {
                ledger_patient_id: self.patient_id.clone(),
                claim_patient_id: claim.patient_id().to_string(),
            })
        }
    }
}

fn batch_id_for_seq(seq: u64) -> String {
    format!("batch-{seq:012}")
}

fn validate_accepted_at(seq: u64, value: &str) -> Result<(), LedgerError> {
    CanonicalTimestamp::parse(value).map_err(|_| LedgerError::InvalidAcceptedTime {
        seq,
        value: value.to_string(),
    })?;
    Ok(())
}

fn parse_record_hash(
    seq: u64,
    field: &'static str,
    value: &str,
) -> Result<RecordHash, LedgerError> {
    RecordHash::parse(value).map_err(|_| LedgerError::InvalidRecordHash {
        seq,
        field,
        value: value.to_string(),
    })
}

fn parse_entry_hash(seq: u64, field: &'static str, value: &str) -> Result<EntryHash, LedgerError> {
    EntryHash::parse(value).map_err(|_| LedgerError::InvalidEntryHash {
        seq,
        field,
        value: value.to_string(),
    })
}

fn parse_optional_entry_hash(
    seq: u64,
    field: &'static str,
    value: Option<&str>,
) -> Result<Option<EntryHash>, LedgerError> {
    value
        .map(|hash| parse_entry_hash(seq, field, hash))
        .transpose()
}

fn parse_head_hash(value: Option<&str>) -> Result<Option<EntryHash>, LedgerError> {
    value
        .map(|hash| {
            EntryHash::parse(hash).map_err(|_| LedgerError::InvalidHeadHash {
                value: hash.to_string(),
            })
        })
        .transpose()
}

fn optional_entry_hash_string(value: &Option<EntryHash>) -> Option<String> {
    value.as_ref().map(|hash| hash.as_str().to_string())
}

fn compute_entry_hash(
    record: &Value,
    record_hash: &RecordHash,
    previous_entry_hash: Option<&EntryHash>,
    accepted: &AcceptedMetadata,
) -> Result<EntryHash, LedgerError> {
    compute_entry_hash_from_parts(
        record,
        record_hash,
        previous_entry_hash,
        accepted,
        RECORD_KIND_CLAIM,
        ENTRY_VERSION,
    )
}

fn compute_entry_hash_from_parts(
    record: &Value,
    record_hash: &RecordHash,
    previous_entry_hash: Option<&EntryHash>,
    accepted: &AcceptedMetadata,
    record_kind: &str,
    entry_version: u32,
) -> Result<EntryHash, LedgerError> {
    let previous_entry_hash = previous_entry_hash.map(EntryHash::as_str);
    let payload = json!({
        "accepted": {
            "accepted_at": accepted.accepted_at,
            "seq": accepted.seq,
            "batch_id": accepted.batch_id,
        },
        "entry_version": entry_version,
        "previous_entry_hash": previous_entry_hash,
        "record": record,
        "record_hash": record_hash.as_str(),
        "record_kind": record_kind,
    });
    let canonical = canonical_json(&payload).map_err(LedgerError::Canonical)?;
    let digest = Sha256::digest(canonical.as_bytes());
    Ok(EntryHash::from_sha256_digest(digest))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::admission::{AdmissionError, AppendAdmissibleClaim, RevisionAdmissibleClaim};
    use crate::canonical::{CANONICALIZATION_ID, record_hash};
    use crate::predicates::{
        ObjectFieldType, PredicateDefinition, PredicateError, PredicateRegistry, phase1_registry,
    };
    use serde_json::{Value, json};

    #[test]
    fn t_k3_01_append_assigns_accepted_metadata_and_hash_fields() {
        let claim = minimal_observation_claim();
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        let entry = append_admitted_for_test(&mut ledger, &claim);

        assert_eq!(entry.accepted.accepted_at, "2026-05-03T12:00:06Z");
        assert_eq!(entry.accepted.seq, 1);
        assert_eq!(entry.accepted.batch_id, "batch-000000000001");
        assert_eq!(entry.record_kind, "claim");
        assert_eq!(entry.entry_version, 1);
        assert_eq!(entry.previous_entry_hash, None);
        assert_eq!(entry.record_hash, record_hash(&claim).unwrap().as_str());
        assert!(is_sha256_hash(&entry.record_hash));
        assert!(is_sha256_hash(&entry.entry_hash));
        let entry_hash = entry.entry_hash.clone();
        assert_eq!(ledger.head_hash(), Some(entry_hash.as_str()));
    }

    #[test]
    fn t_k3_02_sequence_is_monotonic_and_previous_hash_links_to_prior_entry() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z", "2026-05-03T12:00:07Z"]);
        let first_claim = minimal_observation_claim();
        let first_hash = append_admitted_for_test(&mut ledger, &first_claim)
            .entry_hash
            .clone();
        let second_claim = second_observation_claim();
        let second = append_admitted_for_test(&mut ledger, &second_claim);

        assert_eq!(second.accepted.accepted_at, "2026-05-03T12:00:07Z");
        assert_eq!(second.accepted.seq, 2);
        assert_eq!(second.accepted.batch_id, "batch-000000000002");
        assert_eq!(second.previous_entry_hash, Some(first_hash));
    }

    #[test]
    fn append_admission_starts_from_the_k1_validated_claim_boundary() {
        let mut invalid_claim = minimal_observation_claim();
        invalid_claim["shape"] = json!("relation");
        let ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        assert!(matches!(
            validate_claim(&invalid_claim),
            Err(ClaimError::UnsupportedShape(shape)) if shape == "relation"
        ));
        assert!(ledger.entries().is_empty());
        assert_eq!(ledger.head_hash(), None);
    }

    #[test]
    fn claim_validation_rejects_caller_supplied_k3_metadata_before_admission() {
        for field in ["accepted_at", "seq", "batch_id"] {
            let mut claim = minimal_observation_claim();
            claim["time"][field] = json!("caller-supplied");
            let ledger = test_ledger(["2026-05-03T12:00:06Z"]);

            assert!(matches!(
                validate_claim(&claim),
                Err(ClaimError::K3OwnedTimeMetadata(_))
            ));
            assert!(ledger.entries().is_empty());
        }
    }

    #[test]
    fn admission_rejects_claims_outside_the_patient_scoped_ledger() {
        let mut claim = minimal_observation_claim();
        claim["subject"]["patientId"] = json!("patient_other");
        let validated = validate_claim(&claim).unwrap();
        let registry = phase1_registry().unwrap();
        let ledger = AppendLedger::new(
            "patient_kernel",
            StoreClock::deterministic(["2026-05-03T12:00:06Z"]),
        );

        assert_eq!(
            AppendAdmissibleClaim::admit(&validated, ledger.patient_id(), &registry).unwrap_err(),
            AdmissionError::PatientMismatch {
                target_patient_id: "patient_kernel".to_string(),
                claim_patient_id: "patient_other".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn t_k9_02_bypass_append_uses_claim_field_authority_for_patient_scope() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let claim = minimal_observation_claim();
        let validated = validate_claim(&claim).unwrap();

        let entry = ledger
            .append_without_predicate_or_revision_admission(&validated)
            .unwrap();

        assert_eq!(entry.record["id"], "claim-v0-5-001");
        assert_eq!(entry.record_hash, record_hash(&claim).unwrap().as_str());
        assert_eq!(ledger.entries().len(), 1);
    }

    #[test]
    fn t_k9_02_bypass_append_rejects_cross_patient_without_raw_patient_pointer_reread() {
        let mut claim = minimal_observation_claim();
        claim["subject"]["patientId"] = json!("patient_other");
        let validated = validate_claim(&claim).unwrap();
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        assert_eq!(
            ledger
                .append_without_predicate_or_revision_admission(&validated)
                .unwrap_err(),
            LedgerError::PatientMismatch {
                ledger_patient_id: "patient_kernel".to_string(),
                claim_patient_id: "patient_other".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn t_k10_01_admission_rejects_unregistered_predicate_that_explicit_bypass_can_append() {
        let mut claim = minimal_observation_claim();
        claim["predicate"] = json!("unregistered.synthetic");
        let validated = validate_claim(&claim).unwrap();
        let registry = phase1_registry().unwrap();

        assert_eq!(
            AppendAdmissibleClaim::admit(&validated, "patient_kernel", &registry).unwrap_err(),
            AdmissionError::Predicate(PredicateError::UnregisteredPredicate(
                "unregistered.synthetic".to_string()
            ))
        );

        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let entry = ledger
            .append_without_predicate_or_revision_admission(&validated)
            .unwrap();

        assert_eq!(entry.record["predicate"], "unregistered.synthetic");
        assert_eq!(ledger.entries().len(), 1);
    }

    #[test]
    fn t_k10_02_admission_rejects_patient_mismatch_before_store_clock_mutation() {
        let registry = phase1_registry().unwrap();
        let mut cross_patient_claim = minimal_observation_claim();
        cross_patient_claim["subject"]["patientId"] = json!("patient_other");
        let cross_patient = validate_claim(&cross_patient_claim).unwrap();

        assert_eq!(
            AppendAdmissibleClaim::admit(&cross_patient, "patient_kernel", &registry).unwrap_err(),
            AdmissionError::PatientMismatch {
                target_patient_id: "patient_kernel".to_string(),
                claim_patient_id: "patient_other".to_string(),
            }
        );

        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let claim = minimal_observation_claim();
        let admitted = admit_for_test(&claim);
        let entry = ledger.append_admissible(&admitted).unwrap();

        assert_eq!(entry.accepted.accepted_at, "2026-05-03T12:00:06Z");
        assert_eq!(entry.accepted.seq, 1);
    }

    #[test]
    fn t_k10_03_admission_wraps_predicate_shape_and_object_policy_failures() {
        let registry = phase1_registry().unwrap();
        let mut shape_mismatch_claim = minimal_observation_claim();
        shape_mismatch_claim["shape"] = json!("context");
        let shape_mismatch = validate_claim(&shape_mismatch_claim).unwrap();

        assert_eq!(
            AppendAdmissibleClaim::admit(&shape_mismatch, "patient_kernel", &registry).unwrap_err(),
            AdmissionError::Predicate(PredicateError::ShapeMismatch {
                predicate_id: "vital.sign".to_string(),
                expected_shape: "observation".to_string(),
                actual_shape: "context".to_string(),
            })
        );

        let mut invalid_object_claim = minimal_observation_claim();
        invalid_object_claim["object"]["value"] = json!("eighty-eight");
        let invalid_object = validate_claim(&invalid_object_claim).unwrap();

        assert_eq!(
            AppendAdmissibleClaim::admit(&invalid_object, "patient_kernel", &registry).unwrap_err(),
            AdmissionError::Predicate(PredicateError::InvalidObjectField {
                predicate_id: "vital.sign".to_string(),
                field: "value".to_string(),
                expected: ObjectFieldType::Number,
            })
        );
    }

    #[test]
    fn t_k10_04_append_admissible_preserves_k3_metadata_hash_and_head_behavior() {
        let claim = minimal_observation_claim();
        let admitted = admit_for_test(&claim);
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        let entry = ledger.append_admissible(&admitted).unwrap();

        assert_eq!(entry.accepted.accepted_at, "2026-05-03T12:00:06Z");
        assert_eq!(entry.accepted.seq, 1);
        assert_eq!(entry.accepted.batch_id, "batch-000000000001");
        assert_eq!(entry.record_kind, "claim");
        assert_eq!(entry.entry_version, 1);
        assert_eq!(entry.previous_entry_hash, None);
        assert_eq!(entry.record_hash, record_hash(&claim).unwrap().as_str());
        assert!(is_sha256_hash(&entry.record_hash));
        assert!(is_sha256_hash(&entry.entry_hash));
        let entry_hash = entry.entry_hash.clone();
        assert_eq!(ledger.head_hash(), Some(entry_hash.as_str()));
    }

    #[test]
    fn t_k10_05_snapshot_reread_remains_registry_independent() {
        let claim = minimal_observation_claim();
        let admitted = admit_for_test(&claim);
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        ledger.append_admissible(&admitted).unwrap();
        let snapshot = ledger.snapshot();
        let empty_registry = PredicateRegistry::load(Vec::<PredicateDefinition>::new()).unwrap();
        let stored_record = snapshot.entries[0].record.clone();
        let stored_claim = validate_claim(&stored_record).unwrap();

        assert!(matches!(
            AppendAdmissibleClaim::admit(&stored_claim, "patient_kernel", &empty_registry),
            Err(AdmissionError::Predicate(
                PredicateError::UnregisteredPredicate(predicate)
            )) if predicate == "vital.sign"
        ));

        let reread = AppendLedger::from_snapshot(snapshot).unwrap();
        assert_eq!(reread.entries().len(), 1);
        assert_eq!(reread.entries()[0].record["predicate"], "vital.sign");
    }

    #[test]
    fn t_k11_01_dangling_correction_requires_revision_admission_before_append() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let target_hash = synthetic_record_hash('a');
        let correction = correction_claim("claim-missing", target_hash.as_str());
        let admitted = admit_for_test(&correction);

        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, ledger.entries()).unwrap_err(),
            AdmissionError::CorrectionTargetNotFound {
                claim_id: "claim-v0-5-001-correction".to_string(),
                target_id: "claim-missing".to_string(),
                target_hash,
            }
        );
        assert_eq!(
            ledger.append_admissible(&admitted).unwrap_err(),
            LedgerError::RevisionAdmissionRequired {
                claim_id: "claim-v0-5-001-correction".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
        assert_eq!(ledger.head_hash(), None);

        let entry = append_admitted_for_test(&mut ledger, &minimal_observation_claim());
        assert_eq!(entry.accepted.accepted_at, "2026-05-03T12:00:06Z");
        assert_eq!(entry.accepted.seq, 1);
    }

    #[test]
    fn t_k11_02_right_target_id_with_wrong_record_hash_is_rejected_before_clock_mutation() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z", "2026-05-03T12:00:07Z"]);
        let base_claim = minimal_observation_claim();
        append_admitted_for_test(&mut ledger, &base_claim);
        let wrong_hash = synthetic_record_hash('f');
        let correction = correction_claim("claim-v0-5-001", wrong_hash.as_str());
        let admitted = admit_for_test(&correction);

        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, ledger.entries()).unwrap_err(),
            AdmissionError::CorrectionTargetNotFound {
                claim_id: "claim-v0-5-001-correction".to_string(),
                target_id: "claim-v0-5-001".to_string(),
                target_hash: wrong_hash,
            }
        );
        assert_eq!(
            ledger.append_admissible(&admitted).unwrap_err(),
            LedgerError::RevisionAdmissionRequired {
                claim_id: "claim-v0-5-001-correction".to_string(),
            }
        );

        let second_claim = second_observation_claim();
        let second = append_admitted_for_test(&mut ledger, &second_claim);
        assert_eq!(second.accepted.accepted_at, "2026-05-03T12:00:07Z");
        assert_eq!(second.accepted.seq, 2);
    }

    #[test]
    fn t_k11_03_revision_admission_rejects_base_claims_and_base_append_still_succeeds() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let base_claim = minimal_observation_claim();
        let admitted = admit_for_test(&base_claim);

        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, ledger.entries()).unwrap_err(),
            AdmissionError::ExpectedCorrectionClaim {
                claim_id: "claim-v0-5-001".to_string(),
            }
        );

        let entry = ledger.append_admissible(&admitted).unwrap();
        assert_eq!(entry.record["id"], "claim-v0-5-001");
        assert_eq!(entry.accepted.seq, 1);
    }

    #[test]
    fn t_k11_04_revision_admitted_correction_appends_with_k3_metadata_and_links() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z", "2026-05-03T12:00:07Z"]);
        let base_claim = minimal_observation_claim();
        let base_entry = append_admitted_for_test(&mut ledger, &base_claim);
        let target_record_hash = base_entry.record_hash.clone();
        let base_entry_hash = base_entry.entry_hash.clone();
        let correction = correction_claim("claim-v0-5-001", &target_record_hash);
        let admitted = admit_for_test(&correction);

        assert_eq!(
            ledger.append_admissible(&admitted).unwrap_err(),
            LedgerError::RevisionAdmissionRequired {
                claim_id: "claim-v0-5-001-correction".to_string(),
            }
        );
        let revision_admitted =
            RevisionAdmissibleClaim::admit(&admitted, ledger.entries()).unwrap();

        let correction_entry = ledger
            .append_revision_admissible(&revision_admitted)
            .unwrap();

        assert_eq!(correction_entry.record["id"], "claim-v0-5-001-correction");
        assert_eq!(
            correction_entry.accepted.accepted_at,
            "2026-05-03T12:00:07Z"
        );
        assert_eq!(correction_entry.accepted.seq, 2);
        assert_eq!(correction_entry.accepted.batch_id, "batch-000000000002");
        assert_eq!(correction_entry.previous_entry_hash, Some(base_entry_hash));
        assert_eq!(
            correction_entry.record_hash,
            record_hash(&correction).unwrap().as_str()
        );
        let correction_entry_hash = correction_entry.entry_hash.clone();
        assert_eq!(ledger.head_hash(), Some(correction_entry_hash.as_str()));
    }

    #[test]
    fn t_k11_05_revision_admission_rejects_corrupt_target_hash_storage() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let base_claim = minimal_observation_claim();
        let target_hash = append_admitted_for_test(&mut ledger, &base_claim)
            .record_hash
            .clone();
        let correction = correction_claim("claim-v0-5-001", &target_hash);
        let admitted = admit_for_test(&correction);

        let mut malformed_entries = ledger.snapshot().entries;
        malformed_entries[0].record_hash = "sha256:not-a-record-hash".to_string();
        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, &malformed_entries).unwrap_err(),
            AdmissionError::MalformedStoredTargetRecordHash {
                seq: 1,
                claim_id: "claim-v0-5-001".to_string(),
                value: "sha256:not-a-record-hash".to_string(),
            }
        );

        let mut mismatched_entries = ledger.snapshot().entries;
        let wrong_stored_hash = synthetic_record_hash('f');
        mismatched_entries[0].record_hash = wrong_stored_hash.as_str().to_string();
        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, &mismatched_entries).unwrap_err(),
            AdmissionError::StoredTargetRecordHashMismatch {
                seq: 1,
                claim_id: "claim-v0-5-001".to_string(),
                stored: wrong_stored_hash,
                recomputed: RecordHash::parse(&target_hash).unwrap(),
            }
        );
    }

    #[test]
    fn t_k11_06_revision_admission_validates_target_records_before_matching() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let base_claim = minimal_observation_claim();
        let target_hash = append_admitted_for_test(&mut ledger, &base_claim)
            .record_hash
            .clone();
        let correction = correction_claim("claim-v0-5-001", &target_hash);
        let admitted = admit_for_test(&correction);
        let mut entries = ledger.snapshot().entries;
        entries[0].record["shape"] = json!("relation");

        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, &entries).unwrap_err(),
            AdmissionError::InvalidTargetClaim {
                seq: 1,
                error: ClaimError::UnsupportedShape("relation".to_string()),
            }
        );
    }

    #[test]
    fn t_k11_07_revision_admission_rejects_cross_patient_target_entries() {
        let registry = phase1_registry().unwrap();
        let mut other_patient_claim = minimal_observation_claim();
        other_patient_claim["subject"]["patientId"] = json!("patient_other");
        let other_patient_validated = validate_claim(&other_patient_claim).unwrap();
        let other_patient_admitted =
            AppendAdmissibleClaim::admit(&other_patient_validated, "patient_other", &registry)
                .unwrap();
        let mut other_patient_ledger = AppendLedger::new(
            "patient_other",
            StoreClock::deterministic(["2026-05-03T12:00:06Z"]),
        );
        let cross_patient_target_hash = other_patient_ledger
            .append_admissible(&other_patient_admitted)
            .unwrap()
            .record_hash
            .clone();
        let correction = correction_claim("claim-v0-5-001", &cross_patient_target_hash);
        let admitted = admit_for_test(&correction);

        assert_eq!(
            RevisionAdmissibleClaim::admit(&admitted, other_patient_ledger.entries()).unwrap_err(),
            AdmissionError::CorrectionTargetNotFound {
                claim_id: "claim-v0-5-001-correction".to_string(),
                target_id: "claim-v0-5-001".to_string(),
                target_hash: RecordHash::parse(&cross_patient_target_hash).unwrap(),
            }
        );
    }

    #[test]
    fn t_k11_08_revision_admissible_proof_is_rechecked_against_receiving_ledger() {
        let mut proof_ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let base_claim = minimal_observation_claim();
        let target_hash = append_admitted_for_test(&mut proof_ledger, &base_claim)
            .record_hash
            .clone();
        let correction = correction_claim("claim-v0-5-001", &target_hash);
        let admitted = admit_for_test(&correction);
        let detached_revision_proof =
            RevisionAdmissibleClaim::admit(&admitted, proof_ledger.entries()).unwrap();
        let mut receiving_ledger = test_ledger(["2026-05-03T12:00:07Z", "2026-05-03T12:00:08Z"]);

        assert_eq!(
            receiving_ledger
                .append_revision_admissible(&detached_revision_proof)
                .unwrap_err(),
            LedgerError::Admission(AdmissionError::CorrectionTargetNotFound {
                claim_id: "claim-v0-5-001-correction".to_string(),
                target_id: "claim-v0-5-001".to_string(),
                target_hash: RecordHash::parse(&target_hash).unwrap(),
            })
        );
        assert!(receiving_ledger.entries().is_empty());
        assert_eq!(receiving_ledger.head_hash(), None);

        let entry = append_admitted_for_test(&mut receiving_ledger, &minimal_observation_claim());
        assert_eq!(entry.accepted.accepted_at, "2026-05-03T12:00:07Z");
        assert_eq!(entry.accepted.seq, 1);
    }

    #[test]
    fn append_reports_exhausted_store_clock_without_mutating_ledger() {
        let mut ledger = test_ledger([] as [&str; 0]);
        let claim = minimal_observation_claim();
        let admitted = admit_for_test(&claim);

        assert_eq!(
            ledger.append_admissible(&admitted).unwrap_err(),
            LedgerError::StoreClockExhausted
        );
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn t_k7_02_append_rejects_non_canonical_store_accepted_time_without_mutating_ledger() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06+00:00", "2026-05-03T12:00:06Z"]);
        let claim = minimal_observation_claim();
        let admitted = admit_for_test(&claim);

        assert_eq!(
            ledger.append_admissible(&admitted).unwrap_err(),
            LedgerError::InvalidAcceptedTime {
                seq: 1,
                value: "2026-05-03T12:00:06+00:00".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
        assert_eq!(ledger.head_hash(), None);
        assert!(matches!(
            ledger.append_admissible(&admitted),
            Err(LedgerError::InvalidAcceptedTime { seq: 1, .. })
        ));
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn t_k3_03_fresh_synthetic_ledger_validates_hash_chain_and_head() {
        let ledger = two_entry_ledger();

        ledger.validate().unwrap();
    }

    #[test]
    fn t_k3_04_mutating_an_older_entry_is_detected_on_reread() {
        let mut snapshot = two_entry_ledger().snapshot();
        snapshot.entries[0].record["object"]["value"] = json!(120);

        assert!(matches!(
            AppendLedger::from_snapshot(snapshot),
            Err(LedgerError::RecordHashMismatch { seq: 1, .. })
        ));
    }

    #[test]
    fn t_k3_05_changing_ledger_head_without_matching_entries_fails_validation() {
        let mut snapshot = two_entry_ledger().snapshot();
        snapshot.head_hash = Some(
            "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff".to_string(),
        );

        assert!(matches!(
            AppendLedger::from_snapshot(snapshot),
            Err(LedgerError::HeadHashMismatch { .. })
        ));
    }

    #[test]
    fn snapshot_persists_patient_scope_and_reread_rejects_scope_mismatch() {
        let mut snapshot = two_entry_ledger().snapshot();
        assert_eq!(snapshot.patient_id, "patient_kernel");
        snapshot.patient_id = "patient_other".to_string();

        assert_eq!(
            AppendLedger::from_snapshot(snapshot).unwrap_err(),
            LedgerError::PatientMismatch {
                ledger_patient_id: "patient_other".to_string(),
                claim_patient_id: "patient_kernel".to_string(),
            }
        );
    }

    #[test]
    fn validation_rejects_unsupported_record_kind_in_stored_entry() {
        let mut snapshot = two_entry_ledger().snapshot();
        snapshot.entries[0].record_kind = "event".to_string();

        assert!(matches!(
            AppendLedger::from_snapshot(snapshot),
            Err(LedgerError::UnsupportedRecordKind { seq: 1, .. })
        ));
    }

    #[test]
    fn validation_rejects_unsupported_entry_version_in_stored_entry() {
        let mut snapshot = two_entry_ledger().snapshot();
        snapshot.entries[0].entry_version = 2;

        assert!(matches!(
            AppendLedger::from_snapshot(snapshot),
            Err(LedgerError::UnsupportedEntryVersion { seq: 1, version: 2 })
        ));
    }

    #[test]
    fn validation_rejects_non_store_assigned_batch_id_in_stored_entry() {
        let mut snapshot = two_entry_ledger().snapshot();
        snapshot.entries[0].accepted.batch_id = "batch-caller".to_string();

        assert!(matches!(
            AppendLedger::from_snapshot(snapshot),
            Err(LedgerError::BatchIdMismatch { seq: 1, .. })
        ));
    }

    #[test]
    fn validation_rejects_non_canonical_accepted_time_in_stored_entry() {
        let mut snapshot = two_entry_ledger().snapshot();
        snapshot.entries[0].accepted.accepted_at = "2026-05-03T12:00:06+00:00".to_string();

        assert_eq!(
            AppendLedger::from_snapshot(snapshot).unwrap_err(),
            LedgerError::InvalidAcceptedTime {
                seq: 1,
                value: "2026-05-03T12:00:06+00:00".to_string(),
            }
        );
    }

    #[test]
    fn t_k8_04_validation_rejects_malformed_hash_strings_at_typed_boundaries() {
        let mut invalid_record_hash = two_entry_ledger().snapshot();
        invalid_record_hash.entries[0].record_hash =
            "sha256:0123456789abcdef0123456789ABCDEF0123456789abcdef0123456789abcdef".to_string();
        assert_eq!(
            AppendLedger::from_snapshot(invalid_record_hash).unwrap_err(),
            LedgerError::InvalidRecordHash {
                seq: 1,
                field: "record_hash",
                value: "sha256:0123456789abcdef0123456789ABCDEF0123456789abcdef0123456789abcdef"
                    .to_string(),
            }
        );

        let mut invalid_previous_entry_hash = two_entry_ledger().snapshot();
        invalid_previous_entry_hash.entries[1].previous_entry_hash =
            Some("sha256:short".to_string());
        assert_eq!(
            AppendLedger::from_snapshot(invalid_previous_entry_hash).unwrap_err(),
            LedgerError::InvalidEntryHash {
                seq: 2,
                field: "previous_entry_hash",
                value: "sha256:short".to_string(),
            }
        );

        let mut invalid_entry_hash = two_entry_ledger().snapshot();
        invalid_entry_hash.entries[0].entry_hash =
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string();
        assert_eq!(
            AppendLedger::from_snapshot(invalid_entry_hash).unwrap_err(),
            LedgerError::InvalidEntryHash {
                seq: 1,
                field: "entry_hash",
                value: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
                    .to_string(),
            }
        );

        let mut invalid_head_hash = two_entry_ledger().snapshot();
        invalid_head_hash.head_hash = Some(
            "sha256:0123456789abcdef0123456789abcdeg0123456789abcdef0123456789abcdef".to_string(),
        );
        assert_eq!(
            AppendLedger::from_snapshot(invalid_head_hash).unwrap_err(),
            LedgerError::InvalidHeadHash {
                value: "sha256:0123456789abcdef0123456789abcdeg0123456789abcdef0123456789abcdef"
                    .to_string(),
            }
        );
    }

    #[test]
    fn t_k8_04_recomputed_hashes_round_trip_through_distinct_typed_hashes() {
        let ledger = two_entry_ledger();

        let recomputed = ledger.recompute_hashes().unwrap();

        for hashes in recomputed {
            let record_hash = crate::hash::RecordHash::parse(&hashes.record_hash).unwrap();
            let entry_hash = crate::hash::EntryHash::parse(&hashes.entry_hash).unwrap();

            assert_eq!(record_hash.as_str(), hashes.record_hash.as_str());
            assert_eq!(entry_hash.as_str(), hashes.entry_hash.as_str());
        }
    }

    #[test]
    fn t_rebuild_01_rereading_ledger_is_deterministic() {
        let snapshot = two_entry_ledger().snapshot();

        let first_read = AppendLedger::from_snapshot(snapshot.clone()).unwrap();
        let second_read = AppendLedger::from_snapshot(snapshot).unwrap();

        assert_eq!(
            claim_ids(first_read.entries()),
            vec!["claim-v0-5-001", "claim-v0-5-002"]
        );
        assert_eq!(
            claim_ids(first_read.entries()),
            claim_ids(second_read.entries())
        );
        assert_eq!(first_read.head_hash(), second_read.head_hash());
    }

    #[test]
    fn t_rebuild_02_hashes_are_reproducible_from_stored_records() {
        let ledger = two_entry_ledger();

        let recomputed = ledger.recompute_hashes().unwrap();

        assert_eq!(recomputed.len(), ledger.entries().len());
        for (entry, hashes) in ledger.entries().iter().zip(recomputed) {
            assert_eq!(hashes.seq, entry.accepted.seq);
            assert_eq!(hashes.record_hash, entry.record_hash);
            assert_eq!(hashes.entry_hash, entry.entry_hash);
        }
    }

    #[test]
    fn entry_hash_recomputation_excludes_the_entrys_own_hash_field() {
        let original = two_entry_ledger();
        let original_first_hash = original.entries()[0].entry_hash.clone();
        let mut snapshot = original.snapshot();
        snapshot.entries[0].entry_hash =
            "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff".to_string();
        let tampered = AppendLedger {
            patient_id: snapshot.patient_id,
            store_clock: StoreClock::default(),
            entries: snapshot.entries,
            head_hash: snapshot.head_hash,
        };

        let recomputed = tampered.recompute_hashes().unwrap();

        assert_eq!(recomputed[0].entry_hash, original_first_hash);
    }

    #[test]
    fn rebuild_recomputes_entry_hash_from_record_content_not_stored_record_hash_field() {
        let original = two_entry_ledger();
        let original_first = original.entries()[0].clone();
        let mut snapshot = original.snapshot();
        snapshot.entries[0].record_hash =
            "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff".to_string();
        let tampered = AppendLedger {
            patient_id: snapshot.patient_id,
            store_clock: StoreClock::default(),
            entries: snapshot.entries,
            head_hash: snapshot.head_hash,
        };

        let recomputed = tampered.recompute_hashes().unwrap();

        assert_eq!(recomputed[0].record_hash, original_first.record_hash);
        assert_eq!(recomputed[0].entry_hash, original_first.entry_hash);
    }

    fn claim_ids(entries: &[LedgerEntry]) -> Vec<&str> {
        entries
            .iter()
            .map(|entry| entry.record["id"].as_str().unwrap())
            .collect()
    }

    fn is_sha256_hash(hash: &str) -> bool {
        crate::hash::EntryHash::parse(hash).is_ok()
    }

    fn two_entry_ledger() -> AppendLedger {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z", "2026-05-03T12:00:07Z"]);
        let first_claim = minimal_observation_claim();
        append_admitted_for_test(&mut ledger, &first_claim);
        let second_claim = second_observation_claim();
        append_admitted_for_test(&mut ledger, &second_claim);
        ledger
    }

    fn test_ledger<I, S>(accepted_times: I) -> AppendLedger
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        AppendLedger::new("patient_kernel", StoreClock::deterministic(accepted_times))
    }

    fn admit_for_test(claim: &Value) -> AppendAdmissibleClaim<'_> {
        let validated = validate_claim(claim).unwrap();
        let registry = phase1_registry().unwrap();
        AppendAdmissibleClaim::admit(&validated, "patient_kernel", &registry).unwrap()
    }

    fn append_admitted_for_test<'ledger>(
        ledger: &'ledger mut AppendLedger,
        claim: &Value,
    ) -> &'ledger LedgerEntry {
        let admitted = admit_for_test(claim);
        ledger.append_admissible(&admitted).unwrap()
    }

    fn synthetic_record_hash(hex_digit: char) -> RecordHash {
        let hex = std::iter::repeat_n(hex_digit, 64).collect::<String>();
        RecordHash::parse(format!("sha256:{hex}")).unwrap()
    }

    fn correction_claim(target_id: &str, target_hash: &str) -> Value {
        let mut claim = minimal_observation_claim();
        claim["id"] = json!("claim-v0-5-001-correction");
        claim["object"]["value"] = json!(90);
        claim["time"]["valid"]["instant"] = json!("2026-05-03T12:02:00Z");
        claim["time"]["recorded_at"] = json!("2026-05-03T12:02:05Z");
        claim["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": target_id,
                "hash": target_hash
            }
        });
        claim
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

    fn second_observation_claim() -> Value {
        let mut claim = minimal_observation_claim();
        claim["id"] = json!("claim-v0-5-002");
        claim["object"]["value"] = json!(89);
        claim["time"]["valid"]["instant"] = json!("2026-05-03T12:01:00Z");
        claim["time"]["recorded_at"] = json!("2026-05-03T12:01:05Z");
        claim
    }
}
