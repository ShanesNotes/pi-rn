use crate::claim::ValidatedClaim;
use crate::predicates::{PredicateError, PredicateRegistry};
use serde_json::Value;

#[derive(Debug, Eq, PartialEq)]
pub enum AdmissionError {
    PatientMismatch {
        target_patient_id: String,
        claim_patient_id: String,
    },
    Predicate(PredicateError),
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
}
