use crate::canonical::record_hash;
use crate::claim::{ClaimError, RevisionTarget, ValidatedClaim, validate_claim};
use crate::hash::RecordHash;
use crate::ledger::LedgerEntry;
use crate::predicates::{PredicateError, PredicateRegistry};
use serde_json::Value;

#[derive(Debug, Eq, PartialEq)]
pub enum AdmissionError {
    PatientMismatch {
        target_patient_id: String,
        claim_patient_id: String,
    },
    Predicate(PredicateError),
    ExpectedCorrectionClaim {
        claim_id: String,
    },
    CorrectionTargetNotFound {
        claim_id: String,
        target_id: String,
        target_hash: RecordHash,
    },
    InvalidTargetClaim {
        seq: u64,
        error: ClaimError,
    },
    MalformedStoredTargetRecordHash {
        seq: u64,
        claim_id: String,
        value: String,
    },
    StoredTargetRecordHashMismatch {
        seq: u64,
        claim_id: String,
        stored: RecordHash,
        recomputed: RecordHash,
    },
    Canonical(String),
}

impl From<PredicateError> for AdmissionError {
    fn from(error: PredicateError) -> Self {
        Self::Predicate(error)
    }
}

#[derive(Debug, Eq, PartialEq)]
pub struct AppendAdmissibleClaim<'a> {
    raw: &'a Value,
    id: &'a str,
    patient_id: &'a str,
    target_patient_id: String,
    revision_target: Option<RevisionTarget<'a>>,
}

impl<'a> AppendAdmissibleClaim<'a> {
    pub fn admit(
        claim: &ValidatedClaim<'a>,
        target_patient_id: &str,
        registry: &PredicateRegistry,
    ) -> Result<Self, AdmissionError> {
        if claim.patient_id() != target_patient_id {
            return Err(AdmissionError::PatientMismatch {
                target_patient_id: target_patient_id.to_string(),
                claim_patient_id: claim.patient_id().to_string(),
            });
        }
        registry.validate_validated_claim(claim)?;
        Ok(Self {
            raw: claim.raw(),
            id: claim.id(),
            patient_id: claim.patient_id(),
            target_patient_id: target_patient_id.to_string(),
            revision_target: claim.revision_target().cloned(),
        })
    }

    pub fn raw(&self) -> &'a Value {
        self.raw
    }

    pub fn id(&self) -> &'a str {
        self.id
    }

    pub fn patient_id(&self) -> &'a str {
        self.patient_id
    }

    pub fn target_patient_id(&self) -> &str {
        &self.target_patient_id
    }

    pub fn revision_target(&self) -> Option<&RevisionTarget<'a>> {
        self.revision_target.as_ref()
    }
}

#[derive(Debug, Eq, PartialEq)]
pub struct RevisionAdmissibleClaim<'a> {
    raw: &'a Value,
    id: &'a str,
    patient_id: &'a str,
    target_patient_id: String,
    revision_target: RevisionTarget<'a>,
}

impl<'a> RevisionAdmissibleClaim<'a> {
    pub fn admit(
        claim: &AppendAdmissibleClaim<'a>,
        entries: &[LedgerEntry],
    ) -> Result<Self, AdmissionError> {
        let revision_target = claim
            .revision_target()
            .ok_or_else(|| AdmissionError::ExpectedCorrectionClaim {
                claim_id: claim.id().to_string(),
            })?
            .clone();

        prove_revision_target(claim.id(), claim.patient_id(), &revision_target, entries)?;
        Ok(Self {
            raw: claim.raw(),
            id: claim.id(),
            patient_id: claim.patient_id(),
            target_patient_id: claim.target_patient_id().to_string(),
            revision_target,
        })
    }

    pub fn raw(&self) -> &'a Value {
        self.raw
    }

    pub fn id(&self) -> &'a str {
        self.id
    }

    pub fn patient_id(&self) -> &'a str {
        self.patient_id
    }

    pub fn target_patient_id(&self) -> &str {
        &self.target_patient_id
    }

    pub fn revision_target(&self) -> &RevisionTarget<'a> {
        &self.revision_target
    }

    pub(crate) fn verify_against(&self, entries: &[LedgerEntry]) -> Result<(), AdmissionError> {
        prove_revision_target(
            self.id(),
            self.patient_id(),
            self.revision_target(),
            entries,
        )
    }
}

fn prove_revision_target(
    claim_id: &str,
    claim_patient_id: &str,
    revision_target: &RevisionTarget<'_>,
    entries: &[LedgerEntry],
) -> Result<(), AdmissionError> {
    for entry in entries {
        let candidate =
            validate_claim(&entry.record).map_err(|error| AdmissionError::InvalidTargetClaim {
                seq: entry.accepted.seq,
                error,
            })?;
        let stored_hash = RecordHash::parse(&entry.record_hash).map_err(|_| {
            AdmissionError::MalformedStoredTargetRecordHash {
                seq: entry.accepted.seq,
                claim_id: candidate.id().to_string(),
                value: entry.record_hash.clone(),
            }
        })?;
        let recomputed_hash = record_hash(&entry.record).map_err(AdmissionError::Canonical)?;
        if stored_hash != recomputed_hash {
            return Err(AdmissionError::StoredTargetRecordHashMismatch {
                seq: entry.accepted.seq,
                claim_id: candidate.id().to_string(),
                stored: stored_hash,
                recomputed: recomputed_hash,
            });
        }
        if candidate.patient_id() == claim_patient_id
            && candidate.id() == revision_target.id()
            && &stored_hash == revision_target.hash()
        {
            return Ok(());
        }
    }

    Err(AdmissionError::CorrectionTargetNotFound {
        claim_id: claim_id.to_string(),
        target_id: revision_target.id().to_string(),
        target_hash: revision_target.hash().clone(),
    })
}
