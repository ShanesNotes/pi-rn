use std::collections::BTreeMap;

use crate::canonical::canonical_json;
use crate::claim::{ClaimError, ValidatedClaim, validate_claim as validate_kernel_claim};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

pub const CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION: &str =
    "clinical_truth.v1alpha1.vital_sign_fixture.2026-05-31";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ObjectFieldType {
    String,
    Number,
}

impl ObjectFieldType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::String => "string",
            Self::Number => "number",
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub enum PredicateError {
    Claim(ClaimError),
    DuplicatePredicateId(String),
    UnsupportedPredicateShape {
        predicate_id: String,
        shape: String,
    },
    UnregisteredPredicate(String),
    ShapeMismatch {
        predicate_id: String,
        expected_shape: String,
        actual_shape: String,
    },
    ExpectedObject {
        predicate_id: String,
    },
    MissingObjectField {
        predicate_id: String,
        field: String,
    },
    InvalidObjectField {
        predicate_id: String,
        field: String,
        expected: ObjectFieldType,
    },
}

impl From<ClaimError> for PredicateError {
    fn from(error: ClaimError) -> Self {
        Self::Claim(error)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct ObjectFieldRequirement {
    name: String,
    field_type: ObjectFieldType,
}

#[derive(Clone, Debug, Eq, PartialEq)]
enum ObjectRule {
    AnyObject,
    RequiredFields(Vec<ObjectFieldRequirement>),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredicateDefinition {
    id: String,
    shape: String,
    object_rule: ObjectRule,
}

impl PredicateDefinition {
    pub fn new_any_object(id: impl Into<String>, shape: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            shape: shape.into(),
            object_rule: ObjectRule::AnyObject,
        }
    }

    pub fn new_with_required_object_fields<I, S>(
        id: impl Into<String>,
        shape: impl Into<String>,
        fields: I,
    ) -> Self
    where
        I: IntoIterator<Item = (S, ObjectFieldType)>,
        S: Into<String>,
    {
        Self {
            id: id.into(),
            shape: shape.into(),
            object_rule: ObjectRule::RequiredFields(
                fields
                    .into_iter()
                    .map(|(name, field_type)| ObjectFieldRequirement {
                        name: name.into(),
                        field_type,
                    })
                    .collect(),
            ),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredicateRegistry {
    definitions: BTreeMap<String, PredicateDefinition>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredicateObjectFieldSummary {
    pub name: String,
    pub field_type: ObjectFieldType,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredicateSummary {
    pub id: String,
    pub shape: String,
    pub required_object_fields: Vec<PredicateObjectFieldSummary>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredicateRegistrySummary {
    pub version: String,
    pub content_hash: String,
    pub predicate_count: usize,
    pub predicates: Vec<PredicateSummary>,
}

impl PredicateRegistry {
    pub fn load<I>(definitions: I) -> Result<Self, PredicateError>
    where
        I: IntoIterator<Item = PredicateDefinition>,
    {
        let mut loaded = BTreeMap::new();
        for definition in definitions {
            if loaded.contains_key(&definition.id) {
                return Err(PredicateError::DuplicatePredicateId(definition.id));
            }
            if !is_supported_shape(&definition.shape) {
                return Err(PredicateError::UnsupportedPredicateShape {
                    predicate_id: definition.id,
                    shape: definition.shape,
                });
            }
            loaded.insert(definition.id.clone(), definition);
        }
        Ok(Self {
            definitions: loaded,
        })
    }

    pub fn len(&self) -> usize {
        self.definitions.len()
    }

    pub fn is_empty(&self) -> bool {
        self.definitions.is_empty()
    }

    pub fn contains(&self, predicate_id: &str) -> bool {
        self.definitions.contains_key(predicate_id)
    }

    pub fn summary(&self, version: impl Into<String>) -> Result<PredicateRegistrySummary, String> {
        let version = version.into();
        let predicates = self.predicate_summaries();
        let content_hash = registry_content_hash(&version, &predicates)?;
        Ok(PredicateRegistrySummary {
            version,
            content_hash,
            predicate_count: predicates.len(),
            predicates,
        })
    }

    pub fn predicate_summaries(&self) -> Vec<PredicateSummary> {
        self.definitions
            .values()
            .map(|definition| PredicateSummary {
                id: definition.id.clone(),
                shape: definition.shape.clone(),
                required_object_fields: match &definition.object_rule {
                    ObjectRule::AnyObject => Vec::new(),
                    ObjectRule::RequiredFields(fields) => fields
                        .iter()
                        .map(|field| PredicateObjectFieldSummary {
                            name: field.name.clone(),
                            field_type: field.field_type,
                        })
                        .collect(),
                },
            })
            .collect()
    }

    pub fn validate_claim(&self, claim: &Value) -> Result<(), PredicateError> {
        let claim = validate_kernel_claim(claim)?;
        self.validate_validated_claim(&claim)
    }

    pub fn validate_validated_claim(
        &self,
        claim: &ValidatedClaim<'_>,
    ) -> Result<(), PredicateError> {
        let predicate_id = claim.predicate();
        let definition = self
            .definitions
            .get(predicate_id)
            .ok_or_else(|| PredicateError::UnregisteredPredicate(predicate_id.to_string()))?;
        let actual_shape = claim.shape().as_str();
        if actual_shape != definition.shape {
            return Err(PredicateError::ShapeMismatch {
                predicate_id: predicate_id.to_string(),
                expected_shape: definition.shape.clone(),
                actual_shape: actual_shape.to_string(),
            });
        }
        validate_object(predicate_id, definition, claim.object())
    }
}

/// Loads the Phase 1 synthetic fixture registry.
///
/// This seed only covers generated kernel fixtures and their correction claim;
/// it is not a production clinical ontology.
pub fn phase1_registry() -> Result<PredicateRegistry, PredicateError> {
    PredicateRegistry::load([
        PredicateDefinition::new_with_required_object_fields(
            "encounter.context",
            "context",
            [("encounterId", ObjectFieldType::String)],
        ),
        PredicateDefinition::new_with_required_object_fields(
            "vital.sign",
            "observation",
            [
                ("code", ObjectFieldType::String),
                ("value", ObjectFieldType::Number),
                ("unit", ObjectFieldType::String),
            ],
        ),
        PredicateDefinition::new_with_required_object_fields(
            "clinical.interpretation",
            "interpretation",
            [("summary", ObjectFieldType::String)],
        ),
        PredicateDefinition::new_with_required_object_fields(
            "care.act",
            "act",
            [("description", ObjectFieldType::String)],
        ),
    ])
}

/// Loads the first clinical-truth service fixture registry.
///
/// This registry is deliberately narrow: it authorizes only the first
/// implementation slice's `vital.sign` observation fixture. It is executable
/// contract evidence for the service seam, not a production clinical ontology.
pub fn clinical_truth_v1alpha1_vital_sign_registry() -> Result<PredicateRegistry, PredicateError> {
    PredicateRegistry::load([PredicateDefinition::new_with_required_object_fields(
        "vital.sign",
        "observation",
        [
            ("code", ObjectFieldType::String),
            ("value", ObjectFieldType::Number),
            ("unit", ObjectFieldType::String),
            ("encounterId", ObjectFieldType::String),
        ],
    )])
}

pub fn clinical_truth_v1alpha1_vital_sign_registry_summary()
-> Result<PredicateRegistrySummary, String> {
    let registry =
        clinical_truth_v1alpha1_vital_sign_registry().map_err(|error| format!("{error:?}"))?;
    registry.summary(CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION)
}

fn is_supported_shape(shape: &str) -> bool {
    matches!(shape, "context" | "observation" | "interpretation" | "act")
}

fn validate_object(
    predicate_id: &str,
    definition: &PredicateDefinition,
    object: &Value,
) -> Result<(), PredicateError> {
    let object = object
        .as_object()
        .ok_or_else(|| PredicateError::ExpectedObject {
            predicate_id: predicate_id.to_string(),
        })?;
    match &definition.object_rule {
        ObjectRule::AnyObject => Ok(()),
        ObjectRule::RequiredFields(fields) => {
            for field in fields {
                let Some(value) = object.get(&field.name) else {
                    return Err(PredicateError::MissingObjectField {
                        predicate_id: predicate_id.to_string(),
                        field: field.name.clone(),
                    });
                };
                if !field.field_type.matches(value) {
                    return Err(PredicateError::InvalidObjectField {
                        predicate_id: predicate_id.to_string(),
                        field: field.name.clone(),
                        expected: field.field_type,
                    });
                }
            }
            Ok(())
        }
    }
}

fn registry_content_hash(version: &str, predicates: &[PredicateSummary]) -> Result<String, String> {
    let predicates: Vec<Value> = predicates
        .iter()
        .map(|predicate| {
            json!({
                "id": predicate.id,
                "shape": predicate.shape,
                "required_object_fields": predicate.required_object_fields.iter().map(|field| {
                    json!({
                        "name": field.name,
                        "type": field.field_type.as_str(),
                    })
                }).collect::<Vec<_>>(),
            })
        })
        .collect();
    let canonical = canonical_json(&json!({
        "version": version,
        "predicates": predicates,
    }))?;
    let digest = Sha256::digest(canonical.as_bytes());
    Ok(format!("sha256:{}", lower_hex(&digest)))
}

fn lower_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(HEX[(byte >> 4) as usize] as char);
        out.push(HEX[(byte & 0x0f) as usize] as char);
    }
    out
}

impl ObjectFieldType {
    fn matches(self, value: &Value) -> bool {
        match self {
            Self::String => value.is_string(),
            Self::Number => value.is_number(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::canonical::CANONICALIZATION_ID;
    use serde_json::{Value, json};

    #[test]
    fn t_k4_01_seed_registry_loads_without_duplicate_predicate_ids() {
        let registry = phase1_registry().unwrap();

        assert_eq!(registry.len(), 4);
        assert!(registry.contains("encounter.context"));
        assert!(registry.contains("vital.sign"));
        assert!(registry.contains("clinical.interpretation"));
        assert!(registry.contains("care.act"));
    }

    #[test]
    fn registry_rejects_duplicate_predicate_ids() {
        assert_eq!(
            PredicateRegistry::load([
                PredicateDefinition::new_any_object("vital.sign", "observation"),
                PredicateDefinition::new_any_object("vital.sign", "observation"),
            ])
            .unwrap_err(),
            PredicateError::DuplicatePredicateId("vital.sign".to_string())
        );
    }

    #[test]
    fn registry_rejects_predicate_definitions_with_unsupported_shape() {
        assert_eq!(
            PredicateRegistry::load([PredicateDefinition::new_any_object(
                "legacy.relation",
                "relation",
            )])
            .unwrap_err(),
            PredicateError::UnsupportedPredicateShape {
                predicate_id: "legacy.relation".to_string(),
                shape: "relation".to_string(),
            }
        );
    }

    #[test]
    fn t_neg_01_claim_with_fifth_shape_fails_predicate_validation() {
        let registry = phase1_registry().unwrap();
        let mut claim = minimal_observation_claim();
        claim["shape"] = json!("relation");

        assert!(matches!(
            registry.validate_claim(&claim),
            Err(PredicateError::Claim(ClaimError::UnsupportedShape(shape))) if shape == "relation"
        ));
    }

    #[test]
    fn t_k4_02_t_neg_02_claim_using_unregistered_predicate_fails_validation() {
        let registry = phase1_registry().unwrap();
        let mut claim = minimal_observation_claim();
        claim["predicate"] = json!("unregistered.synthetic");

        assert_eq!(
            registry.validate_claim(&claim).unwrap_err(),
            PredicateError::UnregisteredPredicate("unregistered.synthetic".to_string())
        );
    }

    #[test]
    fn t_k9_03_registry_validates_already_validated_claim_through_claim_field_authority() {
        let registry = phase1_registry().unwrap();
        let claim = minimal_observation_claim();
        let validated = validate_kernel_claim(&claim).unwrap();

        registry.validate_validated_claim(&validated).unwrap();
    }

    #[test]
    fn t_k9_03_registry_uses_validated_claim_predicate_shape_and_object_accessors() {
        let registry = phase1_registry().unwrap();
        let mut claim = minimal_observation_claim();
        claim["object"]["value"] = json!("eighty-eight");
        let validated = validate_kernel_claim(&claim).unwrap();

        assert_eq!(
            registry.validate_validated_claim(&validated).unwrap_err(),
            PredicateError::InvalidObjectField {
                predicate_id: "vital.sign".to_string(),
                field: "value".to_string(),
                expected: ObjectFieldType::Number,
            }
        );
    }

    #[test]
    fn t_k4_03_claim_shape_inconsistent_with_predicate_shape_fails_validation() {
        let registry = phase1_registry().unwrap();
        let mut claim = minimal_observation_claim();
        claim["shape"] = json!("context");

        assert_eq!(
            registry.validate_claim(&claim).unwrap_err(),
            PredicateError::ShapeMismatch {
                predicate_id: "vital.sign".to_string(),
                expected_shape: "observation".to_string(),
                actual_shape: "context".to_string(),
            }
        );
    }

    #[test]
    fn t_k4_04_t_neg_03_invalid_object_for_seeded_predicate_fails_validation() {
        let registry = phase1_registry().unwrap();
        let mut claim = minimal_observation_claim();
        claim["object"]["value"] = json!("eighty-eight");

        assert_eq!(
            registry.validate_claim(&claim).unwrap_err(),
            PredicateError::InvalidObjectField {
                predicate_id: "vital.sign".to_string(),
                field: "value".to_string(),
                expected: ObjectFieldType::Number,
            }
        );
    }

    #[test]
    fn seed_registry_accepts_phase1_correction_fixture_without_extra_predicates() {
        let registry = phase1_registry().unwrap();
        let mut correction = minimal_observation_claim();
        correction["id"] = json!("claim-v0-5-001-correction");
        correction["object"]["value"] = json!(90);
        correction["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": "claim-v0-5-001",
                "hash": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            }
        });

        registry.validate_claim(&correction).unwrap();
        assert_eq!(registry.len(), 4);
    }

    #[test]
    fn clinical_truth_vital_sign_registry_is_narrow_versioned_slice_policy() {
        let registry = clinical_truth_v1alpha1_vital_sign_registry().unwrap();
        let summary = clinical_truth_v1alpha1_vital_sign_registry_summary().unwrap();

        assert_eq!(registry.len(), 1);
        assert!(registry.contains("vital.sign"));
        assert_eq!(
            summary.version,
            CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION
        );
        assert_eq!(summary.predicate_count, 1);
        assert_eq!(
            summary.predicates,
            vec![PredicateSummary {
                id: "vital.sign".to_string(),
                shape: "observation".to_string(),
                required_object_fields: vec![
                    PredicateObjectFieldSummary {
                        name: "code".to_string(),
                        field_type: ObjectFieldType::String,
                    },
                    PredicateObjectFieldSummary {
                        name: "value".to_string(),
                        field_type: ObjectFieldType::Number,
                    },
                    PredicateObjectFieldSummary {
                        name: "unit".to_string(),
                        field_type: ObjectFieldType::String,
                    },
                    PredicateObjectFieldSummary {
                        name: "encounterId".to_string(),
                        field_type: ObjectFieldType::String,
                    },
                ],
            }]
        );
        assert_eq!(
            summary.content_hash,
            "sha256:d08fd55c937cca96c02d8a0f050e157d001e1539ac280aad344fbf029a0f0b46"
        );
    }

    #[test]
    fn clinical_truth_vital_sign_registry_hash_is_stable_and_version_sensitive() {
        let registry = clinical_truth_v1alpha1_vital_sign_registry().unwrap();
        let summary = registry
            .summary(CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION)
            .unwrap();
        let same_summary = registry
            .summary(CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION)
            .unwrap();
        let next_version_summary = registry
            .summary("clinical_truth.v1alpha1.vital_sign_fixture.next")
            .unwrap();

        assert_eq!(summary.content_hash, same_summary.content_hash);
        assert_ne!(summary.content_hash, next_version_summary.content_hash);
    }

    #[test]
    fn clinical_truth_vital_sign_registry_requires_encounter_id_for_first_slice() {
        let registry = clinical_truth_v1alpha1_vital_sign_registry().unwrap();
        let claim = clinical_truth_vital_sign_claim();

        registry.validate_claim(&claim).unwrap();

        let mut without_encounter = claim;
        without_encounter["object"]
            .as_object_mut()
            .unwrap()
            .remove("encounterId");
        assert_eq!(
            registry.validate_claim(&without_encounter).unwrap_err(),
            PredicateError::MissingObjectField {
                predicate_id: "vital.sign".to_string(),
                field: "encounterId".to_string(),
            }
        );
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

    fn clinical_truth_vital_sign_claim() -> Value {
        let mut claim = minimal_observation_claim();
        claim["object"]["encounterId"] = json!("encounter_kernel");
        claim
    }
}
