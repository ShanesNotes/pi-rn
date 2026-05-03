use std::collections::BTreeSet;

use crate::ledger::LedgerEntry;

#[derive(Debug, Eq, PartialEq)]
pub enum QueryError {
    InvalidQueryTime { field: &'static str, value: String },
    MissingValidTime { claim_id: String },
    InvalidValidTime { claim_id: String, value: String },
    InvalidAcceptedTime { claim_id: String, value: String },
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
        if accepted_at(entry)? <= known_at && is_valid_at(entry, valid_at)? {
            candidates.push(entry);
        }
    }

    let hidden_targets: BTreeSet<_> = candidates
        .iter()
        .filter_map(|entry| revision_target(entry))
        .collect();
    let entries = candidates
        .into_iter()
        .filter(|entry| !hidden_targets.contains(&(claim_id(entry), entry.record_hash.clone())))
        .collect();
    Ok(PointReadView { entries })
}

fn is_valid_at(entry: &LedgerEntry, valid_at: CanonicalTimestamp<'_>) -> Result<bool, QueryError> {
    let claim_id = claim_id(entry);
    let valid = entry
        .record
        .pointer("/time/valid")
        .and_then(serde_json::Value::as_object)
        .ok_or_else(|| QueryError::MissingValidTime {
            claim_id: claim_id.clone(),
        })?;
    if let Some(instant) = valid.get("instant").and_then(serde_json::Value::as_str) {
        return Ok(parse_claim_valid_time(&claim_id, instant)? <= valid_at);
    }
    if let Some(interval) = valid.get("interval").and_then(serde_json::Value::as_object) {
        let start = interval
            .get("start")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| QueryError::InvalidValidTime {
                claim_id: claim_id.clone(),
                value: "time.valid.interval.start".to_string(),
            })?;
        let end = interval
            .get("end")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| QueryError::InvalidValidTime {
                claim_id: claim_id.clone(),
                value: "time.valid.interval.end".to_string(),
            })?;
        let start = parse_claim_valid_time(&claim_id, start)?;
        let end = parse_claim_valid_time(&claim_id, end)?;
        if end < start {
            return Err(QueryError::InvalidValidTime {
                claim_id,
                value: "time.valid.interval".to_string(),
            });
        }
        return Ok(start <= valid_at && valid_at <= end);
    }
    Err(QueryError::InvalidValidTime {
        claim_id,
        value: "time.valid".to_string(),
    })
}

fn parse_query_time<'a>(
    field: &'static str,
    value: &'a str,
) -> Result<CanonicalTimestamp<'a>, QueryError> {
    CanonicalTimestamp::parse(value).ok_or_else(|| QueryError::InvalidQueryTime {
        field,
        value: value.to_string(),
    })
}

fn parse_claim_valid_time<'a>(
    claim_id: &str,
    value: &'a str,
) -> Result<CanonicalTimestamp<'a>, QueryError> {
    CanonicalTimestamp::parse(value).ok_or_else(|| QueryError::InvalidValidTime {
        claim_id: claim_id.to_string(),
        value: value.to_string(),
    })
}

fn accepted_at(entry: &LedgerEntry) -> Result<CanonicalTimestamp<'_>, QueryError> {
    CanonicalTimestamp::parse(&entry.accepted.accepted_at).ok_or_else(|| {
        QueryError::InvalidAcceptedTime {
            claim_id: claim_id(entry),
            value: entry.accepted.accepted_at.clone(),
        }
    })
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
struct CanonicalTimestamp<'a>(&'a str);

impl<'a> CanonicalTimestamp<'a> {
    fn parse(value: &'a str) -> Option<Self> {
        is_canonical_utc_timestamp(value).then_some(Self(value))
    }
}

fn is_canonical_utc_timestamp(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 20 {
        return false;
    }
    for index in [0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18] {
        if !bytes[index].is_ascii_digit() {
            return false;
        }
    }
    if bytes[4] != b'-'
        || bytes[7] != b'-'
        || bytes[10] != b'T'
        || bytes[13] != b':'
        || bytes[16] != b':'
        || bytes[19] != b'Z'
    {
        return false;
    }

    let year = parse_digits(bytes, 0, 4);
    let month = parse_digits(bytes, 5, 7);
    let day = parse_digits(bytes, 8, 10);
    let hour = parse_digits(bytes, 11, 13);
    let minute = parse_digits(bytes, 14, 16);
    let second = parse_digits(bytes, 17, 19);

    (1..=12).contains(&month)
        && (1..=days_in_month(year, month)).contains(&day)
        && hour <= 23
        && minute <= 59
        && second <= 59
}

fn parse_digits(bytes: &[u8], start: usize, end: usize) -> u32 {
    bytes[start..end].iter().fold(0, |accumulator, byte| {
        accumulator * 10 + u32::from(byte - b'0')
    })
}

fn days_in_month(year: u32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if is_leap_year(year) => 29,
        2 => 28,
        _ => 0,
    }
}

fn is_leap_year(year: u32) -> bool {
    year.is_multiple_of(4) && !year.is_multiple_of(100) || year.is_multiple_of(400)
}

fn revision_target(entry: &LedgerEntry) -> Option<(String, String)> {
    let revises = entry.record.get("revises")?.as_object()?;
    if revises.get("mode")?.as_str()? != "corrects" {
        return None;
    }
    let target = revises.get("target")?.as_object()?;
    let id = target.get("id")?.as_str()?.to_string();
    let hash = target.get("hash")?.as_str()?.to_string();
    Some((id, hash))
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
        ledger.append(&encounter_context_claim()).unwrap();

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
        instant_ledger
            .append(&observation_claim(
                "claim-offset-valid",
                88,
                "2026-05-03T12:00:00+00:00",
            ))
            .unwrap();
        assert_eq!(
            point_read(
                instant_ledger.entries(),
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
        interval_ledger.append(&bad_interval_claim()).unwrap();
        assert_eq!(
            point_read(
                interval_ledger.entries(),
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
        let mut ledger = test_ledger(["2026-05-03T12:00:10+00:00"]);
        ledger
            .append(&observation_claim(
                "claim-bad-accepted",
                88,
                "2026-05-03T12:00:00Z",
            ))
            .unwrap();

        assert_eq!(
            point_read(
                ledger.entries(),
                "2026-05-03T12:30:00Z",
                "2026-05-03T12:30:01Z"
            )
            .unwrap_err(),
            QueryError::InvalidAcceptedTime {
                claim_id: "claim-bad-accepted".to_string(),
                value: "2026-05-03T12:00:10+00:00".to_string(),
            }
        );
    }

    #[test]
    fn t_k5_02_normal_future_accepted_claim_is_invisible_at_known_at() {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z", "2026-05-03T13:00:10Z"]);
        ledger
            .append(&observation_claim(
                "claim-known-now",
                88,
                "2026-05-03T12:00:00Z",
            ))
            .unwrap();
        ledger
            .append(&observation_claim(
                "claim-known-later",
                89,
                "2026-05-03T12:05:00Z",
            ))
            .unwrap();

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
        ledger
            .append(&observation_claim("claim-hr-1", 88, "2026-05-03T12:00:00Z"))
            .unwrap();
        ledger
            .append(&observation_claim("claim-hr-2", 90, "2026-05-03T13:00:00Z"))
            .unwrap();
        ledger
    }

    fn correction_ledger() -> AppendLedger {
        let mut ledger = test_ledger(["2026-05-03T12:00:10Z", "2026-05-03T13:00:10Z"]);
        let original_hash = ledger
            .append(&observation_claim(
                "claim-hr-original",
                88,
                "2026-05-03T12:00:00Z",
            ))
            .unwrap()
            .record_hash
            .clone();
        ledger
            .append(&correction_claim(
                "claim-hr-correction",
                90,
                "2026-05-03T12:00:00Z",
                "claim-hr-original",
                &original_hash,
            ))
            .unwrap();
        ledger
    }

    fn test_ledger<I, S>(accepted_times: I) -> AppendLedger
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        AppendLedger::new("patient_kernel", StoreClock::deterministic(accepted_times))
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

    fn bad_interval_claim() -> Value {
        let mut claim = encounter_context_claim();
        claim["id"] = json!("claim-bad-interval");
        claim["time"]["valid"]["interval"]["end"] = json!("2026-05-03T13:00:00+00:00");
        claim
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
