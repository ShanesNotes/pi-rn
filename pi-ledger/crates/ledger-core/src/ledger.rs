use crate::canonical::{canonical_json, record_hash};
use crate::claim::{ClaimError, validate_claim};
use crate::time::CanonicalTimestamp;

use serde_json::{Value, json};
use sha2::{Digest, Sha256};

pub const ENTRY_VERSION: u32 = 1;
pub const RECORD_KIND_CLAIM: &str = "claim";

#[derive(Debug, Eq, PartialEq)]
pub enum LedgerError {
    Claim(ClaimError),
    Canonical(String),
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
        validate_claim(claim)?;
        self.validate_claim_patient_scope(claim)?;
        let seq = self.entries.len() as u64 + 1;
        let accepted_at = self.store_clock.peek_next_accepted_at()?.to_string();
        validate_accepted_at(seq, &accepted_at)?;
        let record_hash = record_hash(claim).map_err(LedgerError::Canonical)?;
        let previous_entry_hash = self.head_hash.clone();
        let accepted = AcceptedMetadata {
            accepted_at,
            seq,
            batch_id: batch_id_for_seq(seq),
        };
        let entry_hash = compute_entry_hash(
            claim,
            &record_hash,
            previous_entry_hash.as_deref(),
            &accepted,
        )?;
        let entry = LedgerEntry {
            record: claim.clone(),
            record_hash,
            previous_entry_hash,
            entry_hash,
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
        let mut previous_entry_hash: Option<String> = None;
        for entry in &self.entries {
            let recomputed_record_hash =
                record_hash(&entry.record).map_err(LedgerError::Canonical)?;
            let recomputed_entry_hash = compute_entry_hash_from_parts(
                &entry.record,
                &recomputed_record_hash,
                previous_entry_hash.as_deref(),
                &entry.accepted,
                &entry.record_kind,
                entry.entry_version,
            )?;
            hashes.push(RecomputedEntryHashes {
                seq: entry.accepted.seq,
                record_hash: recomputed_record_hash,
                entry_hash: recomputed_entry_hash.clone(),
            });
            previous_entry_hash = Some(recomputed_entry_hash);
        }
        Ok(hashes)
    }

    pub fn validate(&self) -> Result<(), LedgerError> {
        let mut previous_entry_hash: Option<String> = None;
        for (index, entry) in self.entries.iter().enumerate() {
            validate_claim(&entry.record)?;
            self.validate_claim_patient_scope(&entry.record)?;
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
            if entry.previous_entry_hash != previous_entry_hash {
                return Err(LedgerError::PreviousEntryHashMismatch {
                    seq: entry.accepted.seq,
                    expected: previous_entry_hash,
                    actual: entry.previous_entry_hash.clone(),
                });
            }
            let expected_record_hash =
                record_hash(&entry.record).map_err(LedgerError::Canonical)?;
            if entry.record_hash != expected_record_hash {
                return Err(LedgerError::RecordHashMismatch {
                    seq: entry.accepted.seq,
                    expected: expected_record_hash,
                    actual: entry.record_hash.clone(),
                });
            }
            let expected_entry_hash = compute_entry_hash_for_entry(entry)?;
            if entry.entry_hash != expected_entry_hash {
                return Err(LedgerError::EntryHashMismatch {
                    seq: entry.accepted.seq,
                    expected: expected_entry_hash,
                    actual: entry.entry_hash.clone(),
                });
            }
            previous_entry_hash = Some(entry.entry_hash.clone());
        }
        if self.head_hash != previous_entry_hash {
            return Err(LedgerError::HeadHashMismatch {
                expected: previous_entry_hash,
                actual: self.head_hash.clone(),
            });
        }
        Ok(())
    }

    fn validate_claim_patient_scope(&self, claim: &Value) -> Result<(), LedgerError> {
        let claim_patient_id = claim_patient_id(claim)?;
        if claim_patient_id == self.patient_id {
            Ok(())
        } else {
            Err(LedgerError::PatientMismatch {
                ledger_patient_id: self.patient_id.clone(),
                claim_patient_id: claim_patient_id.to_string(),
            })
        }
    }
}

fn claim_patient_id(claim: &Value) -> Result<&str, LedgerError> {
    claim
        .pointer("/subject/patientId")
        .and_then(Value::as_str)
        .ok_or(LedgerError::MissingClaimPatientId)
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

fn compute_entry_hash(
    record: &Value,
    record_hash: &str,
    previous_entry_hash: Option<&str>,
    accepted: &AcceptedMetadata,
) -> Result<String, LedgerError> {
    compute_entry_hash_from_parts(
        record,
        record_hash,
        previous_entry_hash,
        accepted,
        RECORD_KIND_CLAIM,
        ENTRY_VERSION,
    )
}

fn compute_entry_hash_for_entry(entry: &LedgerEntry) -> Result<String, LedgerError> {
    compute_entry_hash_from_parts(
        &entry.record,
        &entry.record_hash,
        entry.previous_entry_hash.as_deref(),
        &entry.accepted,
        &entry.record_kind,
        entry.entry_version,
    )
}

fn compute_entry_hash_from_parts(
    record: &Value,
    record_hash: &str,
    previous_entry_hash: Option<&str>,
    accepted: &AcceptedMetadata,
    record_kind: &str,
    entry_version: u32,
) -> Result<String, LedgerError> {
    let payload = json!({
        "accepted": {
            "accepted_at": accepted.accepted_at,
            "seq": accepted.seq,
            "batch_id": accepted.batch_id,
        },
        "entry_version": entry_version,
        "previous_entry_hash": previous_entry_hash,
        "record": record,
        "record_hash": record_hash,
        "record_kind": record_kind,
    });
    let canonical = canonical_json(&payload).map_err(LedgerError::Canonical)?;
    let digest = Sha256::digest(canonical.as_bytes());
    let mut hash = String::with_capacity("sha256:".len() + 64);
    hash.push_str("sha256:");
    for byte in digest {
        hash.push_str(&format!("{byte:02x}"));
    }
    Ok(hash)
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
        assert_eq!(entry.record_hash, record_hash(&claim).unwrap());
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
        let Some(hex) = hash.strip_prefix("sha256:") else {
            return false;
        };
        hex.len() == 64
            && hex
                .bytes()
                .all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
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
