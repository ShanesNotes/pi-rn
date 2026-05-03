use serde_json::Value;

/// Owned timestamp accepted by the kernel for deterministic valid/known-time comparisons.
///
/// The only accepted representation is fixed-width UTC
/// `YYYY-MM-DDTHH:MM:SSZ`. Offsets, fractional seconds, local timestamps,
/// timezone names, leap seconds, and invalid calendar values are rejected
/// rather than normalized.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct CanonicalTimestamp(String);

impl CanonicalTimestamp {
    pub fn parse(value: impl Into<String>) -> Result<Self, TimeError> {
        let value = value.into();
        if is_canonical_utc_timestamp(&value) {
            Ok(Self(value))
        } else {
            Err(TimeError::InvalidTimestamp { value })
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl AsRef<str> for CanonicalTimestamp {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

impl std::str::FromStr for CanonicalTimestamp {
    type Err = TimeError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        Self::parse(value)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ValidTimeExpression {
    Instant(CanonicalTimestamp),
    Interval {
        start: CanonicalTimestamp,
        end: CanonicalTimestamp,
    },
}

impl ValidTimeExpression {
    pub fn parse(value: &Value) -> Result<Self, TimeError> {
        let object = value
            .as_object()
            .ok_or(TimeError::ExpectedValidTimeObject)?;
        let has_instant = object.contains_key("instant");
        let has_interval = object.contains_key("interval");
        if object.len() != 1 || has_instant == has_interval {
            return Err(TimeError::InvalidValidTimeShape);
        }

        if has_instant {
            let instant = object
                .get("instant")
                .and_then(Value::as_str)
                .ok_or(TimeError::InvalidValidInstant)?;
            return Ok(Self::Instant(CanonicalTimestamp::parse(instant)?));
        }

        let interval = object
            .get("interval")
            .and_then(Value::as_object)
            .ok_or(TimeError::ExpectedIntervalObject)?;
        let start = interval
            .get("start")
            .and_then(Value::as_str)
            .ok_or(TimeError::MissingIntervalStart)?;
        let end = interval
            .get("end")
            .and_then(Value::as_str)
            .ok_or(TimeError::MissingIntervalEnd)?;
        if interval.len() != 2 {
            let unexpected = interval
                .keys()
                .find(|field| !matches!(field.as_str(), "start" | "end"))
                .cloned()
                .unwrap_or_else(|| "time.valid.interval".to_string());
            return Err(TimeError::UnexpectedIntervalField(unexpected));
        }

        let start = CanonicalTimestamp::parse(start)?;
        let end = CanonicalTimestamp::parse(end)?;
        if end < start {
            return Err(TimeError::InvalidIntervalOrder {
                start: start.as_str().to_string(),
                end: end.as_str().to_string(),
            });
        }

        Ok(Self::Interval { start, end })
    }

    /// Returns whether a K5 point read should include a claim with this valid-time expression.
    ///
    /// Phase 1 preserves the existing K5 semantics: an instant claim is visible
    /// at that instant and after it; an interval claim is visible inclusively
    /// between `start` and `end`.
    pub fn contains(&self, point: &CanonicalTimestamp) -> bool {
        match self {
            Self::Instant(instant) => instant <= point,
            Self::Interval { start, end } => start <= point && point <= end,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TimeError {
    InvalidTimestamp { value: String },
    ExpectedValidTimeObject,
    InvalidValidTimeShape,
    InvalidValidInstant,
    ExpectedIntervalObject,
    MissingIntervalStart,
    MissingIntervalEnd,
    UnexpectedIntervalField(String),
    InvalidIntervalOrder { start: String, end: String },
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

    year >= 1
        && (1..=12).contains(&month)
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn t_k7_03_canonical_timestamp_accepts_fixed_utc_form_and_orders_chronologically() {
        let earlier = CanonicalTimestamp::parse("2026-05-03T12:00:00Z").unwrap();
        let later = CanonicalTimestamp::parse("2026-05-03T12:00:01Z").unwrap();

        assert_eq!(earlier.as_str(), "2026-05-03T12:00:00Z");
        assert!(earlier < later);
    }

    #[test]
    fn t_k7_03_canonical_timestamp_rejects_non_canonical_or_invalid_forms() {
        for value in [
            "2026-05-03T12:00:00+00:00",
            "2026-05-03T12:00:00.000Z",
            "2026-05-03T12:00:00",
            "2026-05-03T12:00:00UTC",
            "2026-13-03T12:00:00Z",
            "2026-02-29T12:00:00Z",
            "2024-02-30T12:00:00Z",
            "2026-05-03T24:00:00Z",
            "2026-05-03T12:60:00Z",
            "2026-05-03T12:00:60Z",
            "0000-05-03T12:00:00Z",
        ] {
            assert_eq!(
                CanonicalTimestamp::parse(value).unwrap_err(),
                TimeError::InvalidTimestamp {
                    value: value.to_string()
                }
            );
        }
    }

    #[test]
    fn t_k7_03_valid_time_expression_accepts_instant_and_interval_contains_points() {
        let point = CanonicalTimestamp::parse("2026-05-03T12:30:00Z").unwrap();
        let instant = ValidTimeExpression::parse(&json!({
            "instant": "2026-05-03T12:00:00Z"
        }))
        .unwrap();
        let interval = ValidTimeExpression::parse(&json!({
            "interval": {
                "start": "2026-05-03T12:00:00Z",
                "end": "2026-05-03T13:00:00Z"
            }
        }))
        .unwrap();

        assert!(instant.contains(&point));
        assert!(interval.contains(&point));
        assert!(!interval.contains(&CanonicalTimestamp::parse("2026-05-03T13:00:01Z").unwrap()));
    }

    #[test]
    fn t_k7_03_valid_time_expression_rejects_ambiguous_or_unordered_values() {
        assert_eq!(
            ValidTimeExpression::parse(&json!({
                "instant": "2026-05-03T12:00:00Z",
                "interval": {
                    "start": "2026-05-03T12:00:00Z",
                    "end": "2026-05-03T13:00:00Z"
                }
            }))
            .unwrap_err(),
            TimeError::InvalidValidTimeShape
        );
        assert_eq!(
            ValidTimeExpression::parse(&json!({
                "interval": {
                    "start": "2026-05-03T13:00:00Z",
                    "end": "2026-05-03T12:00:00Z"
                }
            }))
            .unwrap_err(),
            TimeError::InvalidIntervalOrder {
                start: "2026-05-03T13:00:00Z".to_string(),
                end: "2026-05-03T12:00:00Z".to_string()
            }
        );
    }
}
