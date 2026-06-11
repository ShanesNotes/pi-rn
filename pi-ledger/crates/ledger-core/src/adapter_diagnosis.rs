//! Adapter-facing failure vocabulary for `ledger-core`.
//!
//! Module-local error enums retain ownership; this layer classifies failures for
//! diagnosis without flattening them into one generic ledger error.

use crate::admission::AdmissionError;
use crate::claim::ClaimError;
use crate::hash::HashError;
use crate::ledger::LedgerError;
use crate::predicates::PredicateError;
use crate::query::QueryError;
use crate::time::TimeError;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum FailureLayer {
    ClaimStructure,
    Canonicalization,
    CanonicalTime,
    HashParse,
    PredicatePolicy,
    PatientScopeAdmission,
    RevisionTargetAdmission,
    AppendChainIntegrity,
    TrustedEntryProjection,
}

impl FailureLayer {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ClaimStructure => "claim_structure",
            Self::Canonicalization => "canonicalization",
            Self::CanonicalTime => "canonical_time",
            Self::HashParse => "hash_parse",
            Self::PredicatePolicy => "predicate_policy",
            Self::PatientScopeAdmission => "patient_scope_admission",
            Self::RevisionTargetAdmission => "revision_target_admission",
            Self::AppendChainIntegrity => "append_chain_integrity",
            Self::TrustedEntryProjection => "trusted_entry_projection",
        }
    }
}

pub fn claim_error_layer(error: &ClaimError) -> FailureLayer {
    match error {
        ClaimError::Canonical(_) => FailureLayer::Canonicalization,
        ClaimError::InvalidRecordHash(_) => FailureLayer::HashParse,
        ClaimError::UnsupportedTimeField(_) | ClaimError::K3OwnedTimeMetadata(_) => {
            FailureLayer::CanonicalTime
        }
        _ => FailureLayer::ClaimStructure,
    }
}

pub fn time_error_layer(_error: &TimeError) -> FailureLayer {
    FailureLayer::CanonicalTime
}

pub fn hash_error_layer(_error: &HashError) -> FailureLayer {
    FailureLayer::HashParse
}

pub fn predicate_error_layer(error: &PredicateError) -> FailureLayer {
    match error {
        PredicateError::Claim(inner) => claim_error_layer(inner),
        _ => FailureLayer::PredicatePolicy,
    }
}

pub fn admission_error_layer(error: &AdmissionError) -> FailureLayer {
    match error {
        AdmissionError::PatientMismatch { .. } => FailureLayer::PatientScopeAdmission,
        AdmissionError::Predicate(inner) => predicate_error_layer(inner),
        AdmissionError::ExpectedCorrectionClaim { .. }
        | AdmissionError::CorrectionTargetNotFound { .. }
        | AdmissionError::InvalidTargetClaim { .. }
        | AdmissionError::MalformedStoredTargetRecordHash { .. }
        | AdmissionError::StoredTargetRecordHashMismatch { .. } => {
            FailureLayer::RevisionTargetAdmission
        }
        AdmissionError::Canonical(_) => FailureLayer::Canonicalization,
    }
}

pub fn ledger_error_layer(error: &LedgerError) -> FailureLayer {
    match error {
        LedgerError::Claim(inner) => claim_error_layer(inner),
        LedgerError::Admission(inner) => admission_error_layer(inner),
        LedgerError::Canonical(_) => FailureLayer::Canonicalization,
        LedgerError::InvalidRecordHash { .. }
        | LedgerError::InvalidEntryHash { .. }
        | LedgerError::InvalidHeadHash { .. } => FailureLayer::HashParse,
        LedgerError::PatientMismatch { .. } => FailureLayer::PatientScopeAdmission,
        LedgerError::RevisionAdmissionRequired { .. } => FailureLayer::RevisionTargetAdmission,
        LedgerError::InvalidAcceptedTime { .. } => FailureLayer::CanonicalTime,
        LedgerError::SequenceMismatch { .. }
        | LedgerError::PreviousEntryHashMismatch { .. }
        | LedgerError::RecordHashMismatch { .. }
        | LedgerError::EntryHashMismatch { .. }
        | LedgerError::UnsupportedRecordKind { .. }
        | LedgerError::UnsupportedEntryVersion { .. }
        | LedgerError::BatchIdMismatch { .. }
        | LedgerError::HeadHashMismatch { .. }
        | LedgerError::StoreClockExhausted => FailureLayer::AppendChainIntegrity,
    }
}

pub fn query_error_layer(error: &QueryError) -> FailureLayer {
    match error {
        QueryError::InvalidQueryTime { .. }
        | QueryError::MissingValidTime { .. }
        | QueryError::InvalidValidTime { .. }
        | QueryError::InvalidAcceptedTime { .. } => FailureLayer::CanonicalTime,
        QueryError::InvalidRecordHash { .. } => FailureLayer::HashParse,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hash::RecordHash;
    use crate::predicates::ObjectFieldType;

    #[test]
    fn classifies_claim_structure_failures() {
        assert_eq!(
            claim_error_layer(&ClaimError::MissingField("id")),
            FailureLayer::ClaimStructure
        );
    }

    #[test]
    fn classifies_predicate_policy_failures() {
        assert_eq!(
            predicate_error_layer(&PredicateError::UnregisteredPredicate(
                "vital.sign".to_string()
            )),
            FailureLayer::PredicatePolicy
        );
        assert_eq!(
            predicate_error_layer(&PredicateError::MissingObjectField {
                predicate_id: "vital.sign".to_string(),
                field: "value".to_string(),
            }),
            FailureLayer::PredicatePolicy
        );
    }

    #[test]
    fn classifies_revision_target_admission_failures() {
        let hash = RecordHash::parse(
            "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        )
        .unwrap();
        assert_eq!(
            admission_error_layer(&AdmissionError::CorrectionTargetNotFound {
                claim_id: "corr-1".to_string(),
                target_id: "obs-1".to_string(),
                target_hash: hash,
            }),
            FailureLayer::RevisionTargetAdmission
        );
    }

    #[test]
    fn classifies_append_chain_integrity_failures() {
        assert_eq!(
            ledger_error_layer(&LedgerError::SequenceMismatch {
                expected: 2,
                actual: 3,
            }),
            FailureLayer::AppendChainIntegrity
        );
    }

    #[test]
    fn classifies_query_projection_failures_without_string_matching() {
        assert_eq!(
            query_error_layer(&QueryError::MissingValidTime {
                claim_id: "claim-1".to_string(),
            }),
            FailureLayer::CanonicalTime
        );
        assert_eq!(
            query_error_layer(&QueryError::InvalidRecordHash {
                claim_id: "claim-1".to_string(),
                field: "record_hash",
                value: "bad".to_string(),
            }),
            FailureLayer::HashParse
        );
    }

    #[test]
    fn nested_predicate_claim_errors_keep_claim_layer() {
        assert_eq!(
            predicate_error_layer(&PredicateError::Claim(ClaimError::MissingField("object"))),
            FailureLayer::ClaimStructure
        );
        assert_eq!(
            predicate_error_layer(&PredicateError::InvalidObjectField {
                predicate_id: "vital.sign".to_string(),
                field: "value".to_string(),
                expected: ObjectFieldType::Number,
            }),
            FailureLayer::PredicatePolicy
        );
    }
}
