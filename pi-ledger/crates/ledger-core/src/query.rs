use std::collections::BTreeSet;

use crate::hash::RecordHash;
use crate::ledger::LedgerEntry;
use crate::time::{CanonicalTimestamp, TimeError, ValidTimeExpression};

#[derive(Debug, Eq, PartialEq)]
pub enum QueryError {
    InvalidQueryTime {
        field: &'static str,
        value: String,
    },
    MissingValidTime {
        claim_id: String,
    },
    InvalidValidTime {
        claim_id: String,
        value: String,
    },
    InvalidAcceptedTime {
        claim_id: String,
        value: String,
    },
    InvalidRecordHash {
        claim_id: String,
        field: &'static str,
        value: String,
    },
}

#[derive(Debug, PartialEq)]
pub struct PointReadView<'a> {
    entries: Vec<&'a LedgerEntry>,
}

impl<'a> PointReadView<'a> {
    pub fn entries(&self) -> &[&'a LedgerEntry] {
        &self.entries
    }
}

/// Recalculates a point-in-time view from already validated ledger entries.
///
/// K5 keeps this as a pure view function: callers must supply entries from a
/// validated patient ledger or snapshot. Query and entry timestamps must use the
/// canonical UTC form `YYYY-MM-DDTHH:MM:SSZ`; other timestamp strings are
/// rejected instead of being compared lexicographically.
pub fn point_read<'a>(
    entries: &'a [LedgerEntry],
    valid_at: &str,
    known_at: &str,
) -> Result<PointReadView<'a>, QueryError> {
    let valid_at = parse_query_time("validAt", valid_at)?;
    let known_at = parse_query_time("knownAt", known_at)?;
    let mut candidates = Vec::new();
    for entry in entries {
        if accepted_at(entry)? <= known_at && is_valid_at(entry, &valid_at)? {
            candidates.push(entry);
        }
    }

    let mut hidden_targets = BTreeSet::new();
    for entry in &candidates {
        if let Some(target) = revision_target(entry)? {
            hidden_targets.insert(target);
        }
    }
    let mut entries = Vec::new();
    for entry in candidates {
        let key = (claim_id(entry), entry_record_hash(entry)?);
        if !hidden_targets.contains(&key) {
            entries.push(entry);
        }
    }
    Ok(PointReadView { entries })
}

fn is_valid_at(entry: &LedgerEntry, valid_at: &CanonicalTimestamp) -> Result<bool, QueryError> {
    let claim_id = claim_id(entry);
    let valid =
        entry
            .record
            .pointer("/time/valid")
            .ok_or_else(|| QueryError::MissingValidTime {
                claim_id: claim_id.clone(),
            })?;
    let valid_time =
        ValidTimeExpression::parse(valid).map_err(|error| QueryError::InvalidValidTime {
            claim_id,
            value: invalid_valid_time_value(error),
        })?;
    Ok(valid_time.contains(valid_at))
}

fn parse_query_time(field: &'static str, value: &str) -> Result<CanonicalTimestamp, QueryError> {
    CanonicalTimestamp::parse(value).map_err(|_| QueryError::InvalidQueryTime {
        field,
        value: value.to_string(),
    })
}

fn accepted_at(entry: &LedgerEntry) -> Result<CanonicalTimestamp, QueryError> {
    CanonicalTimestamp::parse(&entry.accepted.accepted_at).map_err(|_| {
        QueryError::InvalidAcceptedTime {
            claim_id: claim_id(entry),
            value: entry.accepted.accepted_at.clone(),
        }
    })
}

fn invalid_valid_time_value(error: TimeError) -> String {
    match error {
        TimeError::InvalidTimestamp { value } => value,
        TimeError::MissingIntervalStart => "time.valid.interval.start".to_string(),
        TimeError::MissingIntervalEnd => "time.valid.interval.end".to_string(),
        TimeError::InvalidIntervalOrder { .. } => "time.valid.interval".to_string(),
        TimeError::ExpectedValidTimeObject
        | TimeError::InvalidValidTimeShape
        | TimeError::InvalidValidInstant
        | TimeError::ExpectedIntervalObject
        | TimeError::UnexpectedIntervalField(_) => "time.valid".to_string(),
    }
}

fn revision_target(entry: &LedgerEntry) -> Result<Option<(String, RecordHash)>, QueryError> {
    let Some(revises) = entry
        .record
        .get("revises")
        .and_then(serde_json::Value::as_object)
    else {
        return Ok(None);
    };
    if revises.get("mode").and_then(serde_json::Value::as_str) != Some("corrects") {
        return Ok(None);
    }
    let Some(target) = revises.get("target").and_then(serde_json::Value::as_object) else {
        return Ok(None);
    };
    let Some(id) = target.get("id").and_then(serde_json::Value::as_str) else {
        return Ok(None);
    };
    let Some(hash) = target.get("hash").and_then(serde_json::Value::as_str) else {
        return Ok(None);
    };
    let hash = RecordHash::parse(hash).map_err(|_| QueryError::InvalidRecordHash {
        claim_id: claim_id(entry),
        field: "revises.target.hash",
        value: hash.to_string(),
    })?;
    Ok(Some((id.to_string(), hash)))
}

fn entry_record_hash(entry: &LedgerEntry) -> Result<RecordHash, QueryError> {
    RecordHash::parse(&entry.record_hash).map_err(|_| QueryError::InvalidRecordHash {
        claim_id: claim_id(entry),
        field: "record_hash",
        value: entry.record_hash.clone(),
    })
}

fn claim_id(entry: &LedgerEntry) -> String {
    entry
        .record
        .get("id")
        .and_then(serde_json::Value::as_str)
        .unwrap_or("<unknown>")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::canonical::CANONICALIZATION_ID;
    use crate::claim::validate_claim;
    use crate::ledger::{AppendLedger, LedgerEntry, StoreClock};
    use serde_json::{Value, json};

    #[test]
    fn t_k5_01_valid_at_filters_by_clinical_valid_time() {
        let ledger = two_observation_ledger();

        let view = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T14:00:00Z",
        )
        .unwrap();

        assert_eq!(claim_ids(view.entries()), vec!["claim-hr-1".to_string()]);
    }

    #[test]
    fn t_k5_01_valid_at_filters_valid_intervals_at_the_requested_point() {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z"]);
        append_without_predicate_admission_for_query_test(&mut ledger, &encounter_context_claim());

        let during_encounter = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T12:30:01Z",
        )
        .unwrap();
        let after_encounter = point_read(
            ledger.entries(),
            "2026-05-03T14:00:00Z",
            "2026-05-03T14:00:01Z",
        )
        .unwrap();

        assert_eq!(
            claim_ids(during_encounter.entries()),
            vec!["claim-encounter".to_string()]
        );
        assert!(after_encounter.entries().is_empty());
    }

    #[test]
    fn t_k5_02_t_neg_06_known_at_before_acceptance_returns_no_claims() {
        let ledger = two_observation_ledger();

        let view = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T12:00:09Z",
        )
        .unwrap();

        assert!(view.entries().is_empty());
    }

    #[test]
    fn rejects_non_canonical_query_timestamps() {
        let ledger = two_observation_ledger();

        assert_eq!(
            point_read(
                ledger.entries(),
                "2026-05-03T12:30:00+00:00",
                "2026-05-03T14:00:00Z"
            )
            .unwrap_err(),
            QueryError::InvalidQueryTime {
                field: "validAt",
                value: "2026-05-03T12:30:00+00:00".to_string(),
            }
        );
        assert_eq!(
            point_read(
                ledger.entries(),
                "2026-05-03T12:30:00Z",
                "2026-05-03T14:00:00+00:00"
            )
            .unwrap_err(),
            QueryError::InvalidQueryTime {
                field: "knownAt",
                value: "2026-05-03T14:00:00+00:00".to_string(),
            }
        );
    }

    #[test]
    fn rejects_non_canonical_claim_valid_timestamps() {
        let mut instant_ledger = test_ledger(["2026-05-03T12:00:10Z"]);
        append_without_predicate_admission_for_query_test(
            &mut instant_ledger,
            &observation_claim("claim-offset-valid", 88, "2026-05-03T12:00:00Z"),
        );
        let mut instant_entries = instant_ledger.snapshot().entries;
        instant_entries[0].record["time"]["valid"]["instant"] = json!("2026-05-03T12:00:00+00:00");

        assert_eq!(
            point_read(
                &instant_entries,
                "2026-05-03T12:30:00Z",
                "2026-05-03T12:30:01Z"
            )
            .unwrap_err(),
            QueryError::InvalidValidTime {
                claim_id: "claim-offset-valid".to_string(),
                value: "2026-05-03T12:00:00+00:00".to_string(),
            }
        );

        let mut interval_ledger = test_ledger(["2026-05-03T12:00:10Z"]);
        let mut interval_claim = encounter_context_claim();
        interval_claim["id"] = json!("claim-bad-interval");
        append_without_predicate_admission_for_query_test(&mut interval_ledger, &interval_claim);
        let mut interval_entries = interval_ledger.snapshot().entries;
        interval_entries[0].record["time"]["valid"]["interval"]["end"] =
            json!("2026-05-03T13:00:00+00:00");

        assert_eq!(
            point_read(
                &interval_entries,
                "2026-05-03T12:30:00Z",
                "2026-05-03T12:30:01Z"
            )
            .unwrap_err(),
            QueryError::InvalidValidTime {
                claim_id: "claim-bad-interval".to_string(),
                value: "2026-05-03T13:00:00+00:00".to_string(),
            }
        );
    }

    #[test]
    fn rejects_non_canonical_accepted_times() {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z"]);
        append_without_predicate_admission_for_query_test(
            &mut ledger,
            &observation_claim("claim-bad-accepted", 88, "2026-05-03T12:00:00Z"),
        );
        let mut entries = ledger.snapshot().entries;
        entries[0].accepted.accepted_at = "2026-05-03T12:00:10+00:00".to_string();

        assert_eq!(
            point_read(&entries, "2026-05-03T12:30:00Z", "2026-05-03T12:30:01Z").unwrap_err(),
            QueryError::InvalidAcceptedTime {
                claim_id: "claim-bad-accepted".to_string(),
                value: "2026-05-03T12:00:10+00:00".to_string(),
            }
        );
    }

    #[test]
    fn t_k5_02_normal_future_accepted_claim_is_invisible_at_known_at() {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z", "2026-05-03T13:00:10Z"]);
        append_without_predicate_admission_for_query_test(
            &mut ledger,
            &observation_claim("claim-known-now", 88, "2026-05-03T12:00:00Z"),
        );
        append_without_predicate_admission_for_query_test(
            &mut ledger,
            &observation_claim("claim-known-later", 89, "2026-05-03T12:05:00Z"),
        );

        let view = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T12:30:00Z",
        )
        .unwrap();

        assert_eq!(
            claim_ids(view.entries()),
            vec!["claim-known-now".to_string()]
        );
    }

    #[test]
    fn t_k7_04_recorded_at_is_provenance_not_known_time_visibility() {
        let mut ledger = test_ledger(["2026-05-03T13:00:10Z"]);
        let mut claim =
            observation_claim("claim-recorded-before-known", 88, "2026-05-03T12:00:00Z");
        claim["time"]["recorded_at"] = json!("2026-05-03T11:00:00Z");
        append_without_predicate_admission_for_query_test(&mut ledger, &claim);

        let before_acceptance = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T12:30:00Z",
        )
        .unwrap();
        let after_acceptance = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T13:30:00Z",
        )
        .unwrap();

        assert!(before_acceptance.entries().is_empty());
        assert_eq!(
            claim_ids(after_acceptance.entries()),
            vec!["claim-recorded-before-known".to_string()]
        );
    }

    #[test]
    fn t_k5_03_backdated_correction_changes_view_only_after_acceptance() {
        let ledger = correction_ledger();

        let before_correction = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T12:30:00Z",
        )
        .unwrap();
        let after_correction = point_read(
            ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T13:30:00Z",
        )
        .unwrap();

        assert_eq!(
            claim_ids(before_correction.entries()),
            vec!["claim-hr-original".to_string()]
        );
        assert_eq!(
            claim_ids(after_correction.entries()),
            vec!["claim-hr-correction".to_string()]
        );
    }

    #[test]
    fn correction_hiding_requires_corrects_mode() {
        let mut snapshot = correction_ledger().snapshot();
        snapshot.entries[1].record["revises"]["mode"] = json!("amends");

        let view = point_read(
            &snapshot.entries,
            "2026-05-03T12:30:00Z",
            "2026-05-03T13:30:00Z",
        )
        .unwrap();

        assert_eq!(
            claim_ids(view.entries()),
            vec![
                "claim-hr-original".to_string(),
                "claim-hr-correction".to_string()
            ]
        );
    }

    #[test]
    fn t_k8_05_correction_hiding_requires_typed_record_hash_targets() {
        let mut snapshot = correction_ledger().snapshot();
        snapshot.entries[1].record["revises"]["target"]["hash"] =
            json!("sha256:not-a-valid-record-hash");

        assert_eq!(
            point_read(
                &snapshot.entries,
                "2026-05-03T12:30:00Z",
                "2026-05-03T13:30:00Z",
            )
            .unwrap_err(),
            QueryError::InvalidRecordHash {
                claim_id: "claim-hr-correction".to_string(),
                field: "revises.target.hash",
                value: "sha256:not-a-valid-record-hash".to_string(),
            }
        );
    }

    #[test]
    fn rejects_invalid_visible_entry_record_hash_during_correction_hiding() {
        let mut snapshot = correction_ledger().snapshot();
        snapshot.entries[0].record_hash = "sha256:not-a-valid-record-hash".to_string();

        assert_eq!(
            point_read(
                &snapshot.entries,
                "2026-05-03T12:30:00Z",
                "2026-05-03T13:30:00Z",
            )
            .unwrap_err(),
            QueryError::InvalidRecordHash {
                claim_id: "claim-hr-original".to_string(),
                field: "record_hash",
                value: "sha256:not-a-valid-record-hash".to_string(),
            }
        );
    }

    #[test]
    fn t_rebuild_03_known_time_view_is_recalculated_from_ledger_entries() {
        let snapshot = correction_ledger().snapshot();
        let rebuilt_ledger = AppendLedger::from_snapshot(snapshot.clone()).unwrap();

        let from_snapshot_entries = point_read(
            &snapshot.entries,
            "2026-05-03T12:30:00Z",
            "2026-05-03T13:30:00Z",
        )
        .unwrap();
        let from_rebuilt_ledger = point_read(
            rebuilt_ledger.entries(),
            "2026-05-03T12:30:00Z",
            "2026-05-03T13:30:00Z",
        )
        .unwrap();

        assert_eq!(
            claim_ids(from_snapshot_entries.entries()),
            vec!["claim-hr-correction".to_string()]
        );
        assert_eq!(
            claim_ids(from_snapshot_entries.entries()),
            claim_ids(from_rebuilt_ledger.entries())
        );
    }

    fn two_observation_ledger() -> AppendLedger {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z", "2026-05-03T13:00:10Z"]);
        append_without_predicate_admission_for_query_test(
            &mut ledger,
            &observation_claim("claim-hr-1", 88, "2026-05-03T12:00:00Z"),
        );
        append_without_predicate_admission_for_query_test(
            &mut ledger,
            &observation_claim("claim-hr-2", 90, "2026-05-03T13:00:00Z"),
        );
        ledger
    }

    fn correction_ledger() -> AppendLedger {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z", "2026-05-03T13:00:10Z"]);
        let original_hash = append_without_predicate_admission_for_query_test(
            &mut ledger,
            &observation_claim("claim-hr-original", 88, "2026-05-03T12:00:00Z"),
        )
        .record_hash
        .clone();
        append_without_predicate_admission_for_query_test(
            &mut ledger,
            &correction_claim(
                "claim-hr-correction",
                90,
                "2026-05-03T12:00:00Z",
                "claim-hr-original",
                &original_hash,
            ),
        );
        ledger
    }

    fn test_ledger<I, S>(accepted_times: I) -> AppendLedger
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        AppendLedger::new("patient_kernel", StoreClock::deterministic(accepted_times))
    }

    fn append_without_predicate_admission_for_query_test<'ledger>(
        ledger: &'ledger mut AppendLedger,
        claim: &Value,
    ) -> &'ledger LedgerEntry {
        let validated = validate_claim(claim).unwrap();
        ledger
            .append_without_predicate_admission(&validated)
            .unwrap()
    }

    fn observation_claim(id: &str, value: i64, valid_instant: &str) -> Value {
        json!({
            "id": id,
            "shape": "observation",
            "predicate": "vital.sign",
            "subject": { "patientId": "patient_kernel" },
            "object": { "code": "heart-rate", "value": value, "unit": "/min" },
            "time": {
                "valid": { "instant": valid_instant },
                "recorded_at": valid_instant
            },
            "actor": { "kind": "clinician", "id": "rn-1" },
            "integrity": { "canonicalization": CANONICALIZATION_ID }
        })
    }

    fn encounter_context_claim() -> Value {
        json!({
            "id": "claim-encounter",
            "shape": "context",
            "predicate": "encounter.context",
            "subject": { "patientId": "patient_kernel" },
            "object": { "encounterId": "encounter_kernel" },
            "time": {
                "valid": {
                    "interval": {
                        "start": "2026-05-03T12:00:00Z",
                        "end": "2026-05-03T13:00:00Z"
                    }
                },
                "recorded_at": "2026-05-03T12:00:05Z"
            },
            "actor": { "kind": "system", "id": "kernel-fixture" },
            "integrity": { "canonicalization": CANONICALIZATION_ID }
        })
    }

    fn correction_claim(
        id: &str,
        value: i64,
        valid_instant: &str,
        target_id: &str,
        target_hash: &str,
    ) -> Value {
        let mut claim = observation_claim(id, value, valid_instant);
        claim["revises"] = json!({
            "mode": "corrects",
            "target": { "id": target_id, "hash": target_hash }
        });
        claim
    }

    fn claim_ids(entries: &[&LedgerEntry]) -> Vec<String> {
        entries
            .iter()
            .map(|entry| entry.record["id"].as_str().unwrap().to_string())
            .collect()
    }
}
