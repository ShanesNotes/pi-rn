use std::collections::BTreeMap;

use crate::claim::{ClaimError, ValidatedClaim, validate_claim as validate_kernel_claim};
use serde_json::Value;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ObjectFieldType {
    String,
    Number,
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
}
