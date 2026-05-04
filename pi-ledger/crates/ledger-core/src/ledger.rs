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
    MissingClaimPatientId,
    PatientMismatch {
        ledger_patient_id: String,
        claim_patient_id: String,
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

    pub fn append(&mut self, claim: &Value) -> Result<&LedgerEntry, LedgerError> {
        let claim = validate_claim(claim)?;
        self.append_validated(&claim)
    }

    pub fn append_validated(
        &mut self,
        claim: &ValidatedClaim<'_>,
    ) -> Result<&LedgerEntry, LedgerError> {
        self.validate_claim_patient_scope(claim)?;
        let seq = self.entries.len() as u64 + 1;
        let accepted_at = self.store_clock.peek_next_accepted_at()?.to_string();
        validate_accepted_at(seq, &accepted_at)?;
        let record_hash = record_hash(claim.raw()).map_err(LedgerError::Canonical)?;
        let previous_entry_hash = self.head_hash.clone();
        let previous_entry_hash_typed = parse_head_hash(self.head_hash.as_deref())?;
        let accepted = AcceptedMetadata {
            accepted_at,
            seq,
            batch_id: batch_id_for_seq(seq),
        };
        let entry_hash = compute_entry_hash(
            claim.raw(),
            &record_hash,
            previous_entry_hash_typed.as_ref(),
            &accepted,
        )?;
        let entry = LedgerEntry {
            record: claim.raw().clone(),
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
    use crate::canonical::{CANONICALIZATION_ID, record_hash};
    use serde_json::{Value, json};

    #[test]
    fn t_k3_01_append_assigns_accepted_metadata_and_hash_fields() {
        let claim = minimal_observation_claim();
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        let entry = ledger.append(&claim).unwrap();

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
        let first_hash = ledger
            .append(&minimal_observation_claim())
            .unwrap()
            .entry_hash
            .clone();
        let second = ledger.append(&second_observation_claim()).unwrap();

        assert_eq!(second.accepted.accepted_at, "2026-05-03T12:00:07Z");
        assert_eq!(second.accepted.seq, 2);
        assert_eq!(second.accepted.batch_id, "batch-000000000002");
        assert_eq!(second.previous_entry_hash, Some(first_hash));
    }

    #[test]
    fn append_accepts_only_claims_that_pass_k1_validation() {
        let mut invalid_claim = minimal_observation_claim();
        invalid_claim["shape"] = json!("relation");
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        assert!(matches!(
            ledger.append(&invalid_claim),
            Err(LedgerError::Claim(_))
        ));
        assert!(ledger.entries().is_empty());
        assert_eq!(ledger.head_hash(), None);
    }

    #[test]
    fn append_rejects_caller_supplied_k3_metadata_on_claim_input() {
        for field in ["accepted_at", "seq", "batch_id"] {
            let mut claim = minimal_observation_claim();
            claim["time"][field] = json!("caller-supplied");
            let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

            assert!(matches!(ledger.append(&claim), Err(LedgerError::Claim(_))));
            assert!(ledger.entries().is_empty());
        }
    }

    #[test]
    fn append_rejects_claims_outside_the_patient_scoped_ledger() {
        let mut claim = minimal_observation_claim();
        claim["subject"]["patientId"] = json!("patient_other");
        let mut ledger = AppendLedger::new(
            "patient_kernel",
            StoreClock::deterministic(["2026-05-03T12:00:06Z"]),
        );

        assert_eq!(
            ledger.append(&claim).unwrap_err(),
            LedgerError::PatientMismatch {
                ledger_patient_id: "patient_kernel".to_string(),
                claim_patient_id: "patient_other".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn t_k9_02_append_validated_claim_uses_claim_field_authority_for_patient_scope() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);
        let claim = minimal_observation_claim();
        let validated = validate_claim(&claim).unwrap();

        let entry = ledger.append_validated(&validated).unwrap();

        assert_eq!(entry.record["id"], "claim-v0-5-001");
        assert_eq!(entry.record_hash, record_hash(&claim).unwrap().as_str());
        assert_eq!(ledger.entries().len(), 1);
    }

    #[test]
    fn t_k9_02_append_validated_claim_rejects_cross_patient_without_raw_patient_pointer_reread() {
        let mut claim = minimal_observation_claim();
        claim["subject"]["patientId"] = json!("patient_other");
        let validated = validate_claim(&claim).unwrap();
        let mut ledger = test_ledger(["2026-05-03T12:00:06Z"]);

        assert_eq!(
            ledger.append_validated(&validated).unwrap_err(),
            LedgerError::PatientMismatch {
                ledger_patient_id: "patient_kernel".to_string(),
                claim_patient_id: "patient_other".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn append_reports_exhausted_store_clock_without_mutating_ledger() {
        let mut ledger = test_ledger([] as [&str; 0]);

        assert_eq!(
            ledger.append(&minimal_observation_claim()).unwrap_err(),
            LedgerError::StoreClockExhausted
        );
        assert!(ledger.entries().is_empty());
    }

    #[test]
    fn t_k7_02_append_rejects_non_canonical_store_accepted_time_without_mutating_ledger() {
        let mut ledger = test_ledger(["2026-05-03T12:00:06+00:00", "2026-05-03T12:00:06Z"]);

        assert_eq!(
            ledger.append(&minimal_observation_claim()).unwrap_err(),
            LedgerError::InvalidAcceptedTime {
                seq: 1,
                value: "2026-05-03T12:00:06+00:00".to_string(),
            }
        );
        assert!(ledger.entries().is_empty());
        assert_eq!(ledger.head_hash(), None);
        assert!(matches!(
            ledger.append(&minimal_observation_claim()),
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
        ledger.append(&minimal_observation_claim()).unwrap();
        ledger.append(&second_observation_claim()).unwrap();
        ledger
    }

    fn test_ledger<I, S>(accepted_times: I) -> AppendLedger
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        AppendLedger::new("patient_kernel", StoreClock::deterministic(accepted_times))
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
