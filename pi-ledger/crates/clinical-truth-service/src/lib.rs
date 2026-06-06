//! Transport-agnostic private clinical-truth service semantics.
//!
//! This crate is intentionally not a public API server. It wraps
//! `ledger-core` lifecycle decisions in first-slice service contract types so
//! later gRPC/UDS transport work and `pi-chart` backend clients target the same
//! executable behavior without cloning canonicalization or hash authority.

// The service contract intentionally returns a structured, cloneable semantic
// error value. Boxing it would make this first-slice API noisier without
// reducing any production transport risk because transport mapping remains out
// of scope for this private core crate.
#![allow(clippy::result_large_err)]

use std::collections::BTreeMap;
use std::path::PathBuf;

use ledger_core::admission::{AdmissionError, AppendAdmissibleClaim, RevisionAdmissibleClaim};
use ledger_core::canonical::{CANONICALIZATION_ID, canonical_json};
use ledger_core::claim::{ClaimError, validate_claim};
use ledger_core::conformance::CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION;
use ledger_core::ledger::{AppendLedger, LedgerEntry, LedgerError, LedgerSnapshot, StoreClock};
use ledger_core::predicates::{
    PredicateError, PredicateRegistry, PredicateRegistrySummary,
    clinical_truth_v1alpha1_vital_sign_registry,
    clinical_truth_v1alpha1_vital_sign_registry_summary,
};
use ledger_core::query::{QueryError, point_read};
use serde_json::Value;

mod storage;
pub use storage::{FileWalPatientLedgerStore, StorageError, WalAppendRecordInfo, WalDurability};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PatientLedgerRef {
    pub patient_id: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ClaimPayload {
    pub claim_json: Value,
    pub client_request_id: String,
    /// Transport-side diagnostic context only.
    ///
    /// This field is intentionally not part of the accepted Claim record, WAL
    /// entry identity, or idempotency fingerprint. Durable provenance must be
    /// represented as explicit Claim/evidence facts before production transport.
    pub source_context: Option<Value>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ValidateClaimRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub payload: ClaimPayload,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PreviewAppendAdmissionRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub payload: ClaimPayload,
    pub expected_registry_version: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AppendClaimRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub payload: ClaimPayload,
    pub expected_registry_version: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AppendRevisionClaimRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub payload: ClaimPayload,
    pub expected_registry_version: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GetEntryRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub claim_id: Option<String>,
    pub record_hash: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PointReadRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub valid_at: String,
    pub known_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AdminContext {
    pub actor_id: String,
    pub purpose: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SnapshotLedgerRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub admin_context: AdminContext,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ValidateLedgerSnapshotRequest {
    pub contract_version: String,
    pub patient: PatientLedgerRef,
    pub admin_context: AdminContext,
    pub snapshot: LedgerSnapshot,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ErrorCode {
    InvalidContractVersion,
    InvalidJson,
    ClaimValidationFailed,
    NonCanonicalTimestamp,
    InvalidValidTimeExpression,
    CallerSuppliedStoreMetadata,
    PatientMismatch,
    PredicateNotFound,
    PredicateShapeMismatch,
    ObjectFieldMissing,
    ObjectFieldInvalid,
    RevisionNotAllowedForAppend,
    RevisionTargetNotFound,
    RevisionTargetHashMismatch,
    RegistryVersionMismatch,
    IdempotencyConflict,
    EntryNotFound,
    StorageUnavailable,
    AdminContextRequired,
    LedgerCorruptionDetected,
    InternalError,
}

impl ErrorCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::InvalidContractVersion => "INVALID_CONTRACT_VERSION",
            Self::InvalidJson => "INVALID_JSON",
            Self::ClaimValidationFailed => "CLAIM_VALIDATION_FAILED",
            Self::NonCanonicalTimestamp => "NON_CANONICAL_TIMESTAMP",
            Self::InvalidValidTimeExpression => "INVALID_VALID_TIME_EXPRESSION",
            Self::CallerSuppliedStoreMetadata => "CALLER_SUPPLIED_STORE_METADATA",
            Self::PatientMismatch => "PATIENT_MISMATCH",
            Self::PredicateNotFound => "PREDICATE_NOT_FOUND",
            Self::PredicateShapeMismatch => "PREDICATE_SHAPE_MISMATCH",
            Self::ObjectFieldMissing => "OBJECT_FIELD_MISSING",
            Self::ObjectFieldInvalid => "OBJECT_FIELD_INVALID",
            Self::RevisionNotAllowedForAppend => "REVISION_NOT_ALLOWED_FOR_APPEND",
            Self::RevisionTargetNotFound => "REVISION_TARGET_NOT_FOUND",
            Self::RevisionTargetHashMismatch => "REVISION_TARGET_HASH_MISMATCH",
            Self::RegistryVersionMismatch => "REGISTRY_VERSION_MISMATCH",
            Self::IdempotencyConflict => "IDEMPOTENCY_CONFLICT",
            Self::EntryNotFound => "ENTRY_NOT_FOUND",
            Self::StorageUnavailable => "STORAGE_UNAVAILABLE",
            Self::AdminContextRequired => "ADMIN_CONTEXT_REQUIRED",
            Self::LedgerCorruptionDetected => "LEDGER_CORRUPTION_DETECTED",
            Self::InternalError => "INTERNAL_ERROR",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ErrorDetail {
    pub code: ErrorCode,
    pub message: String,
    pub field_path: Option<String>,
    pub expected: Option<String>,
    pub actual: Option<String>,
    pub kernel_error: Option<String>,
    pub retryable: bool,
}

impl ErrorDetail {
    fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            field_path: None,
            expected: None,
            actual: None,
            kernel_error: None,
            retryable: false,
        }
    }

    fn with_field(mut self, field_path: impl Into<String>) -> Self {
        self.field_path = Some(field_path.into());
        self
    }

    fn with_expected_actual(
        mut self,
        expected: impl Into<String>,
        actual: impl Into<String>,
    ) -> Self {
        self.expected = Some(expected.into());
        self.actual = Some(actual.into());
        self
    }

    fn with_kernel_error(mut self, error: impl std::fmt::Debug) -> Self {
        self.kernel_error = Some(format!("{error:?}"));
        self
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ServiceInfo {
    pub contract_version: String,
    pub supported_contract_versions: Vec<String>,
    pub service_build: String,
    pub storage_mode: String,
    pub transport_mode: String,
    pub conformance_suite_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegistryInfo {
    pub contract_version: String,
    pub service_build: String,
    pub registry_version: String,
    pub registry_content_hash: String,
    pub predicate_count: usize,
    pub summary: PredicateRegistrySummary,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ValidateClaimResponse {
    pub contract_version: String,
    pub service_build: String,
    pub registry_version: String,
    pub validated: bool,
    pub claim_id: String,
    pub predicate: String,
    pub shape: String,
    pub subject_patient_id: String,
    pub valid_time: String,
    pub recorded_at: String,
    pub has_revision_target: bool,
    pub canonicalization_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PreviewAppendAdmissionResponse {
    pub contract_version: String,
    pub service_build: String,
    pub registry_version: String,
    pub registry_content_hash: String,
    pub claim_id: String,
    pub predicate: String,
    pub shape: String,
    pub subject_patient_id: String,
    pub target_patient_id: String,
    pub admissible: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AcceptedEntryView {
    pub claim_id: String,
    pub record_hash: String,
    pub entry_hash: String,
    pub seq: u64,
    pub accepted_at: String,
    pub batch_id: String,
    pub previous_entry_hash: Option<String>,
    pub head_hash: String,
    pub claim_json: Value,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AppendClaimResponse {
    pub contract_version: String,
    pub service_build: String,
    pub registry_version: String,
    pub entry: AcceptedEntryView,
    pub idempotent_replay: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AppendRevisionClaimResponse {
    pub contract_version: String,
    pub service_build: String,
    pub registry_version: String,
    pub entry: AcceptedEntryView,
    pub target_proof: RevisionTargetProof,
    pub idempotent_replay: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RevisionTargetProof {
    pub target_claim_id: String,
    pub target_record_hash: String,
    pub target_entry_hash: String,
    pub target_seq: u64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct GetEntryResponse {
    pub contract_version: String,
    pub service_build: String,
    pub entry: AcceptedEntryView,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PointReadResponse {
    pub contract_version: String,
    pub service_build: String,
    pub ledger_head_hash: Option<String>,
    pub entries: Vec<AcceptedEntryView>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct SnapshotLedgerResponse {
    pub contract_version: String,
    pub service_build: String,
    pub patient_id: String,
    pub entry_count: usize,
    pub head_hash: Option<String>,
    pub snapshot: LedgerSnapshot,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ValidateLedgerSnapshotResponse {
    pub contract_version: String,
    pub service_build: String,
    pub patient_id: String,
    pub valid: bool,
    pub entry_count: usize,
    pub rebuilt_head_hash: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
struct IdempotencyRecord {
    operation: &'static str,
    payload_fingerprint: String,
    entry: AcceptedEntryView,
    target_proof: Option<RevisionTargetProof>,
}

#[derive(Debug)]
pub struct ClinicalTruthService {
    registry: PredicateRegistry,
    registry_summary: PredicateRegistrySummary,
    service_build: String,
    ledgers: BTreeMap<String, AppendLedger>,
    idempotency: BTreeMap<(String, String), IdempotencyRecord>,
    storage: Option<FileWalPatientLedgerStore>,
}

impl ClinicalTruthService {
    pub fn vital_sign_fixture() -> Result<Self, ErrorDetail> {
        let registry =
            clinical_truth_v1alpha1_vital_sign_registry().map_err(map_predicate_error)?;
        let registry_summary =
            clinical_truth_v1alpha1_vital_sign_registry_summary().map_err(|error| {
                ErrorDetail::new(ErrorCode::InternalError, "registry summary failed")
                    .with_kernel_error(error)
            })?;
        Ok(Self {
            registry,
            registry_summary,
            service_build: "clinical-truth-service.core.v1alpha1.local".to_string(),
            ledgers: BTreeMap::new(),
            idempotency: BTreeMap::new(),
            storage: None,
        })
    }

    pub fn with_patient_ledger<I, S>(
        mut self,
        patient_id: impl Into<String>,
        accepted_times: I,
    ) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        let patient_id = patient_id.into();
        self.ledgers.insert(
            patient_id.clone(),
            AppendLedger::new(patient_id, StoreClock::deterministic(accepted_times)),
        );
        self
    }

    pub fn with_file_wal_storage(
        mut self,
        root_dir: impl Into<PathBuf>,
        durability: WalDurability,
    ) -> Result<Self, ErrorDetail> {
        self.storage =
            Some(FileWalPatientLedgerStore::open(root_dir, durability).map_err(map_storage_error)?);
        Ok(self)
    }

    pub fn with_patient_ledger_from_storage<I, S>(
        mut self,
        patient_id: impl Into<String>,
        accepted_times: I,
    ) -> Result<Self, ErrorDetail>
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        let patient_id = patient_id.into();
        let store_clock = StoreClock::deterministic(accepted_times);
        let ledger = match &self.storage {
            Some(storage) => {
                let idempotency_records = storage
                    .load_idempotency_records(&patient_id)
                    .map_err(map_storage_error)?;
                for (client_request_id, record) in idempotency_records {
                    self.idempotency
                        .insert((patient_id.clone(), client_request_id), record);
                }
                match storage
                    .load_snapshot(&patient_id)
                    .map_err(map_storage_error)?
                {
                    Some(snapshot) => AppendLedger::from_snapshot_with_clock(snapshot, store_clock)
                        .map_err(map_snapshot_error)?,
                    None => AppendLedger::new(patient_id.clone(), store_clock),
                }
            }
            None => AppendLedger::new(patient_id.clone(), store_clock),
        };
        self.ledgers.insert(patient_id, ledger);
        Ok(self)
    }

    pub fn replay_patient_wal_snapshot(
        &self,
        patient: PatientLedgerRef,
    ) -> Result<LedgerSnapshot, ErrorDetail> {
        let storage = self.storage.as_ref().ok_or_else(|| {
            ErrorDetail::new(
                ErrorCode::StorageUnavailable,
                "File/WAL storage is not configured for this service",
            )
        })?;
        storage
            .load_snapshot(&patient.patient_id)
            .map_err(map_storage_error)?
            .ok_or_else(|| {
                ErrorDetail::new(ErrorCode::EntryNotFound, "No WAL exists for patient ledger")
                    .with_field(patient.patient_id)
            })
    }

    pub fn get_service_info(&self) -> ServiceInfo {
        ServiceInfo {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            supported_contract_versions: vec![CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string()],
            service_build: self.service_build.clone(),
            storage_mode: self.storage_mode(),
            transport_mode: "transport_agnostic_core".to_string(),
            conformance_suite_id: ledger_core::conformance::VITAL_SIGN_VECTOR_SUITE_ID.to_string(),
        }
    }

    pub fn get_registry_info(&self) -> RegistryInfo {
        RegistryInfo {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            registry_version: self.registry_summary.version.clone(),
            registry_content_hash: self.registry_summary.content_hash.clone(),
            predicate_count: self.registry_summary.predicate_count,
            summary: self.registry_summary.clone(),
        }
    }

    pub fn validate_claim(
        &self,
        request: ValidateClaimRequest,
    ) -> Result<ValidateClaimResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        let validated = validate_claim(&request.payload.claim_json).map_err(map_claim_error)?;
        if validated.patient_id() != request.patient.patient_id {
            return Err(ErrorDetail::new(
                ErrorCode::PatientMismatch,
                "Claim subject patient does not match target patient ledger",
            )
            .with_expected_actual(request.patient.patient_id, validated.patient_id()));
        }
        self.registry
            .validate_validated_claim(&validated)
            .map_err(map_predicate_error)?;
        Ok(ValidateClaimResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            registry_version: self.registry_summary.version.clone(),
            validated: true,
            claim_id: validated.id().to_string(),
            predicate: validated.predicate().to_string(),
            shape: validated.shape().as_str().to_string(),
            subject_patient_id: validated.patient_id().to_string(),
            valid_time: format!("{:?}", validated.valid_time()),
            recorded_at: validated.recorded_at().as_str().to_string(),
            has_revision_target: validated.revision_target().is_some(),
            canonicalization_id: CANONICALIZATION_ID.to_string(),
        })
    }

    pub fn preview_append_admission(
        &self,
        request: PreviewAppendAdmissionRequest,
    ) -> Result<PreviewAppendAdmissionResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        if let Some(expected) = &request.expected_registry_version
            && expected != &self.registry_summary.version
        {
            return Err(ErrorDetail::new(
                ErrorCode::RegistryVersionMismatch,
                "Expected registry version does not match active registry",
            )
            .with_expected_actual(self.registry_summary.version.clone(), expected.clone()));
        }
        let validated = validate_claim(&request.payload.claim_json).map_err(map_claim_error)?;
        if validated.revision_target().is_some() {
            return Err(ErrorDetail::new(
                ErrorCode::RevisionNotAllowedForAppend,
                "Base append preview does not accept revision Claims",
            )
            .with_field("revises"));
        }
        let admitted =
            AppendAdmissibleClaim::admit(&validated, &request.patient.patient_id, &self.registry)
                .map_err(map_admission_error)?;
        Ok(PreviewAppendAdmissionResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            registry_version: self.registry_summary.version.clone(),
            registry_content_hash: self.registry_summary.content_hash.clone(),
            claim_id: admitted.id().to_string(),
            predicate: validated.predicate().to_string(),
            shape: validated.shape().as_str().to_string(),
            subject_patient_id: admitted.patient_id().to_string(),
            target_patient_id: admitted.target_patient_id().to_string(),
            admissible: true,
        })
    }

    pub fn append_claim(
        &mut self,
        request: AppendClaimRequest,
    ) -> Result<AppendClaimResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        self.ensure_registry(request.expected_registry_version.as_deref())?;
        let fingerprint = payload_fingerprint("AppendClaim", &request.payload.claim_json)?;
        if let Some(record) = self.idempotency_record(
            &request.patient.patient_id,
            &request.payload.client_request_id,
            "AppendClaim",
            &fingerprint,
        )? {
            return Ok(AppendClaimResponse {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                service_build: self.service_build.clone(),
                registry_version: self.registry_summary.version.clone(),
                entry: record.entry.clone(),
                idempotent_replay: true,
            });
        }

        let validated = validate_claim(&request.payload.claim_json).map_err(map_claim_error)?;
        if validated.revision_target().is_some() {
            return Err(ErrorDetail::new(
                ErrorCode::RevisionNotAllowedForAppend,
                "AppendClaim does not accept revision Claims",
            )
            .with_field("revises"));
        }
        let admitted =
            AppendAdmissibleClaim::admit(&validated, &request.patient.patient_id, &self.registry)
                .map_err(map_admission_error)?;
        let patient_id = request.patient.patient_id.clone();
        let mut staged_ledger = self.ledger(&patient_id)?.clone();
        let persisted_entry = staged_ledger
            .append_admissible(&admitted)
            .map_err(map_ledger_error)?
            .clone();
        self.persist_entry(
            &patient_id,
            &persisted_entry,
            "AppendClaim",
            &request.payload.client_request_id,
            &fingerprint,
            None,
        )?;
        self.ledgers.insert(patient_id.clone(), staged_ledger);
        let entry = accepted_entry_view(&persisted_entry);
        self.idempotency.insert(
            (
                request.patient.patient_id.clone(),
                request.payload.client_request_id.clone(),
            ),
            IdempotencyRecord {
                operation: "AppendClaim",
                payload_fingerprint: fingerprint,
                entry: entry.clone(),
                target_proof: None,
            },
        );
        Ok(AppendClaimResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            registry_version: self.registry_summary.version.clone(),
            entry,
            idempotent_replay: false,
        })
    }

    pub fn append_revision_claim(
        &mut self,
        request: AppendRevisionClaimRequest,
    ) -> Result<AppendRevisionClaimResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        self.ensure_registry(request.expected_registry_version.as_deref())?;
        let fingerprint = payload_fingerprint("AppendRevisionClaim", &request.payload.claim_json)?;
        if let Some(record) = self.idempotency_record(
            &request.patient.patient_id,
            &request.payload.client_request_id,
            "AppendRevisionClaim",
            &fingerprint,
        )? {
            return Ok(AppendRevisionClaimResponse {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                service_build: self.service_build.clone(),
                registry_version: self.registry_summary.version.clone(),
                entry: record.entry.clone(),
                target_proof: record.target_proof.clone().ok_or_else(|| {
                    ErrorDetail::new(ErrorCode::InternalError, "Missing idempotent target proof")
                })?,
                idempotent_replay: true,
            });
        }

        let validated = validate_claim(&request.payload.claim_json).map_err(map_claim_error)?;
        if validated.revision_target().is_none() {
            return Err(ErrorDetail::new(
                ErrorCode::ClaimValidationFailed,
                "AppendRevisionClaim requires a revision target",
            )
            .with_field("revises"));
        }
        let append_admitted =
            AppendAdmissibleClaim::admit(&validated, &request.patient.patient_id, &self.registry)
                .map_err(map_admission_error)?;
        let patient_id = request.patient.patient_id.clone();
        let mut staged_ledger = self.ledger(&patient_id)?.clone();
        let revision_admitted =
            RevisionAdmissibleClaim::admit(&append_admitted, staged_ledger.entries())
                .map_err(|error| map_revision_admission_error(error, staged_ledger.entries()))?;
        let target_proof =
            revision_target_proof(staged_ledger.entries(), &request.payload.claim_json)?;
        let persisted_entry = staged_ledger
            .append_revision_admissible(&revision_admitted)
            .map_err(map_ledger_error)?
            .clone();
        self.persist_entry(
            &patient_id,
            &persisted_entry,
            "AppendRevisionClaim",
            &request.payload.client_request_id,
            &fingerprint,
            Some(&target_proof),
        )?;
        self.ledgers.insert(patient_id.clone(), staged_ledger);
        let entry = accepted_entry_view(&persisted_entry);
        self.idempotency.insert(
            (
                request.patient.patient_id.clone(),
                request.payload.client_request_id.clone(),
            ),
            IdempotencyRecord {
                operation: "AppendRevisionClaim",
                payload_fingerprint: fingerprint,
                entry: entry.clone(),
                target_proof: Some(target_proof.clone()),
            },
        );
        Ok(AppendRevisionClaimResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            registry_version: self.registry_summary.version.clone(),
            entry,
            target_proof,
            idempotent_replay: false,
        })
    }

    pub fn get_entry(&self, request: GetEntryRequest) -> Result<GetEntryResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        if request.claim_id.is_none() && request.record_hash.is_none() {
            return Err(ErrorDetail::new(
                ErrorCode::ClaimValidationFailed,
                "GetEntry requires claim_id, record_hash, or both",
            )
            .with_field("claim_id|record_hash"));
        }
        let ledger = self.ledger(&request.patient.patient_id)?;
        let entry = ledger.entries().iter().find(|entry| {
            let claim_matches = request
                .claim_id
                .as_ref()
                .is_none_or(|id| claim_id(entry) == Some(id.as_str()));
            let hash_matches = request
                .record_hash
                .as_ref()
                .is_none_or(|hash| entry.record_hash == *hash);
            claim_matches && hash_matches
        });
        let entry = entry.ok_or_else(|| {
            ErrorDetail::new(
                ErrorCode::EntryNotFound,
                "No accepted entry matched the selector",
            )
        })?;
        Ok(GetEntryResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            entry: accepted_entry_view(entry),
        })
    }

    pub fn point_read(&self, request: PointReadRequest) -> Result<PointReadResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        let ledger = self.ledger(&request.patient.patient_id)?;
        let view = point_read(ledger.entries(), &request.valid_at, &request.known_at)
            .map_err(map_query_error)?;
        Ok(PointReadResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            ledger_head_hash: ledger.head_hash().map(str::to_string),
            entries: view
                .entries()
                .iter()
                .map(|entry| accepted_entry_view(entry))
                .collect(),
        })
    }

    pub fn snapshot_ledger(
        &self,
        request: SnapshotLedgerRequest,
    ) -> Result<SnapshotLedgerResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        ensure_admin_context(&request.admin_context)?;
        let ledger = self.ledger(&request.patient.patient_id)?;
        let snapshot = ledger.snapshot();
        Ok(SnapshotLedgerResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            patient_id: snapshot.patient_id.clone(),
            entry_count: snapshot.entries.len(),
            head_hash: snapshot.head_hash.clone(),
            snapshot,
        })
    }

    pub fn validate_ledger_snapshot(
        &self,
        request: ValidateLedgerSnapshotRequest,
    ) -> Result<ValidateLedgerSnapshotResponse, ErrorDetail> {
        ensure_contract(&request.contract_version)?;
        ensure_admin_context(&request.admin_context)?;
        if request.snapshot.patient_id != request.patient.patient_id {
            return Err(ErrorDetail::new(
                ErrorCode::PatientMismatch,
                "Snapshot patient does not match requested patient ledger",
            )
            .with_expected_actual(request.patient.patient_id, request.snapshot.patient_id));
        }
        let ledger = AppendLedger::from_snapshot(request.snapshot).map_err(map_snapshot_error)?;
        Ok(ValidateLedgerSnapshotResponse {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            service_build: self.service_build.clone(),
            patient_id: ledger.patient_id().to_string(),
            valid: true,
            entry_count: ledger.entries().len(),
            rebuilt_head_hash: ledger.head_hash().map(str::to_string),
        })
    }

    fn storage_mode(&self) -> String {
        match &self.storage {
            Some(storage) => format!(
                "file_wal_service_core_prototype:{}",
                storage.durability().as_str()
            ),
            None => "in_memory_service_core_scaffold".to_string(),
        }
    }

    fn persist_entry(
        &mut self,
        patient_id: &str,
        entry: &LedgerEntry,
        operation: &'static str,
        client_request_id: &str,
        payload_fingerprint: &str,
        target_proof: Option<&RevisionTargetProof>,
    ) -> Result<(), ErrorDetail> {
        if let Some(storage) = self.storage.as_mut() {
            storage
                .append_entry(
                    patient_id,
                    entry,
                    operation,
                    client_request_id,
                    payload_fingerprint,
                    target_proof,
                )
                .map_err(map_storage_error)?;
        }
        Ok(())
    }

    fn ensure_registry(&self, expected_registry_version: Option<&str>) -> Result<(), ErrorDetail> {
        if let Some(expected) = expected_registry_version
            && expected != self.registry_summary.version
        {
            return Err(ErrorDetail::new(
                ErrorCode::RegistryVersionMismatch,
                "Expected registry version does not match active registry",
            )
            .with_expected_actual(self.registry_summary.version.clone(), expected));
        }
        Ok(())
    }

    fn ledger(&self, patient_id: &str) -> Result<&AppendLedger, ErrorDetail> {
        self.ledgers.get(patient_id).ok_or_else(|| {
            ErrorDetail::new(
                ErrorCode::StorageUnavailable,
                "Patient ledger is not initialized in service-core scaffold",
            )
            .with_field(patient_id)
        })
    }

    fn idempotency_record(
        &self,
        patient_id: &str,
        client_request_id: &str,
        operation: &'static str,
        payload_fingerprint: &str,
    ) -> Result<Option<&IdempotencyRecord>, ErrorDetail> {
        let Some(record) = self
            .idempotency
            .get(&(patient_id.to_string(), client_request_id.to_string()))
        else {
            return Ok(None);
        };
        if record.operation == operation && record.payload_fingerprint == payload_fingerprint {
            Ok(Some(record))
        } else {
            Err(ErrorDetail::new(
                ErrorCode::IdempotencyConflict,
                "client_request_id was reused with a different operation or payload",
            )
            .with_field("client_request_id"))
        }
    }
}

fn ensure_contract(contract_version: &str) -> Result<(), ErrorDetail> {
    if contract_version == CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION {
        Ok(())
    } else {
        Err(ErrorDetail::new(
            ErrorCode::InvalidContractVersion,
            "Unsupported clinical truth contract version",
        )
        .with_expected_actual(CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION, contract_version))
    }
}

fn ensure_admin_context(admin_context: &AdminContext) -> Result<(), ErrorDetail> {
    let allowed_purpose = matches!(
        admin_context.purpose.as_str(),
        "maintenance" | "diagnostic" | "backup"
    );
    if !admin_context.actor_id.trim().is_empty() && allowed_purpose {
        Ok(())
    } else {
        Err(ErrorDetail::new(
            ErrorCode::AdminContextRequired,
            "Snapshot operations require patient-scoped admin/maintenance context",
        )
        .with_field("admin_context"))
    }
}

pub(crate) fn accepted_entry_view(entry: &LedgerEntry) -> AcceptedEntryView {
    AcceptedEntryView {
        claim_id: claim_id(entry).unwrap_or("<unknown>").to_string(),
        record_hash: entry.record_hash.clone(),
        entry_hash: entry.entry_hash.clone(),
        seq: entry.accepted.seq,
        accepted_at: entry.accepted.accepted_at.clone(),
        batch_id: entry.accepted.batch_id.clone(),
        previous_entry_hash: entry.previous_entry_hash.clone(),
        head_hash: entry.entry_hash.clone(),
        claim_json: entry.record.clone(),
    }
}

fn payload_fingerprint(operation: &str, claim_json: &Value) -> Result<String, ErrorDetail> {
    canonical_json(&serde_json::json!({
        "operation": operation,
        "claim": claim_json,
    }))
    .map_err(|error| {
        ErrorDetail::new(
            ErrorCode::InvalidJson,
            "Claim payload is not canonicalizable for idempotency",
        )
        .with_kernel_error(error)
    })
}

pub(crate) fn claim_id(entry: &LedgerEntry) -> Option<&str> {
    entry.record.get("id").and_then(Value::as_str)
}

fn revision_target_proof(
    entries: &[LedgerEntry],
    claim_json: &Value,
) -> Result<RevisionTargetProof, ErrorDetail> {
    let target = claim_json
        .pointer("/revises/target")
        .and_then(Value::as_object)
        .ok_or_else(|| {
            ErrorDetail::new(
                ErrorCode::ClaimValidationFailed,
                "Revision Claim is missing target proof",
            )
            .with_field("revises.target")
        })?;
    let target_id = target.get("id").and_then(Value::as_str).ok_or_else(|| {
        ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Revision target is missing id",
        )
        .with_field("revises.target.id")
    })?;
    let target_hash = target.get("hash").and_then(Value::as_str).ok_or_else(|| {
        ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Revision target is missing Record hash",
        )
        .with_field("revises.target.hash")
    })?;
    let entry = entries
        .iter()
        .find(|entry| claim_id(entry) == Some(target_id) && entry.record_hash == target_hash)
        .ok_or_else(|| {
            ErrorDetail::new(
                ErrorCode::InternalError,
                "Revision target proof was admitted but not found",
            )
        })?;
    Ok(RevisionTargetProof {
        target_claim_id: target_id.to_string(),
        target_record_hash: entry.record_hash.clone(),
        target_entry_hash: entry.entry_hash.clone(),
        target_seq: entry.accepted.seq,
    })
}

fn map_revision_admission_error(error: AdmissionError, entries: &[LedgerEntry]) -> ErrorDetail {
    match error {
        AdmissionError::CorrectionTargetNotFound {
            claim_id,
            target_id,
            target_hash,
        } => {
            if let Some(existing) = entries
                .iter()
                .find(|entry| self::claim_id(entry) == Some(target_id.as_str()))
            {
                return ErrorDetail::new(
                    ErrorCode::RevisionTargetHashMismatch,
                    "Revision target id was found but Record hash did not match",
                )
                .with_field(format!("{claim_id}->{target_id}"))
                .with_expected_actual(target_hash.to_string(), existing.record_hash.clone());
            }
            ErrorDetail::new(
                ErrorCode::RevisionTargetNotFound,
                "Revision target was not found in the same patient ledger",
            )
            .with_field(format!("{claim_id}->{target_id}@{target_hash}"))
        }
        other => map_admission_error(other),
    }
}

fn map_claim_error(error: ClaimError) -> ErrorDetail {
    let detail = match &error {
        ClaimError::ExpectedObject => ErrorDetail::new(
            ErrorCode::InvalidJson,
            "Claim payload must be a JSON object",
        ),
        ClaimError::MissingField(field) => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Claim missing required field",
        )
        .with_field(*field),
        ClaimError::InvalidField(field) if field.starts_with("time.") => ErrorDetail::new(
            ErrorCode::NonCanonicalTimestamp,
            "Claim time field is not canonical",
        )
        .with_field(*field),
        ClaimError::InvalidField(field) => {
            ErrorDetail::new(ErrorCode::ClaimValidationFailed, "Claim field is invalid")
                .with_field(*field)
        }
        ClaimError::UnsupportedShape(shape) => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Claim shape is unsupported",
        )
        .with_field("shape")
        .with_expected_actual("context|observation|interpretation|act", shape),
        ClaimError::UnsupportedTimeField(field) => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Claim time field is unsupported",
        )
        .with_field(format!("time.{field}")),
        ClaimError::K3OwnedTimeMetadata(field) => ErrorDetail::new(
            ErrorCode::CallerSuppliedStoreMetadata,
            "Claim supplied store-owned metadata",
        )
        .with_field(*field),
        ClaimError::UnsupportedRevisionMode(mode) => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Claim revision mode is unsupported",
        )
        .with_field("revises.mode")
        .with_expected_actual("corrects", mode),
        ClaimError::InvalidRecordHash(field) => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Revision target hash is invalid",
        )
        .with_field(*field),
        ClaimError::Canonical(_) => ErrorDetail::new(
            ErrorCode::InvalidJson,
            "Claim payload is not canonicalizable JSON",
        ),
    };
    detail.with_kernel_error(error)
}

fn map_predicate_error(error: PredicateError) -> ErrorDetail {
    match error {
        PredicateError::Claim(error) => map_claim_error(error),
        PredicateError::DuplicatePredicateId(id) => ErrorDetail::new(
            ErrorCode::InternalError,
            "Registry contains duplicate predicate id",
        )
        .with_field(id),
        PredicateError::UnsupportedPredicateShape {
            predicate_id,
            shape,
        } => ErrorDetail::new(
            ErrorCode::InternalError,
            "Registry predicate shape is unsupported",
        )
        .with_field(predicate_id)
        .with_expected_actual("context|observation|interpretation|act", shape),
        PredicateError::UnregisteredPredicate(predicate) => {
            ErrorDetail::new(ErrorCode::PredicateNotFound, "Predicate is not registered")
                .with_field(predicate)
        }
        PredicateError::ShapeMismatch {
            predicate_id,
            expected_shape,
            actual_shape,
        } => ErrorDetail::new(
            ErrorCode::PredicateShapeMismatch,
            "Claim shape does not match predicate definition",
        )
        .with_field(predicate_id)
        .with_expected_actual(expected_shape, actual_shape),
        PredicateError::ExpectedObject { predicate_id } => ErrorDetail::new(
            ErrorCode::ObjectFieldInvalid,
            "Claim object must be a JSON object",
        )
        .with_field(predicate_id),
        PredicateError::MissingObjectField {
            predicate_id,
            field,
        } => ErrorDetail::new(
            ErrorCode::ObjectFieldMissing,
            "Claim object is missing a required predicate field",
        )
        .with_field(format!("{predicate_id}.{field}")),
        PredicateError::InvalidObjectField {
            predicate_id,
            field,
            expected,
        } => ErrorDetail::new(
            ErrorCode::ObjectFieldInvalid,
            "Claim object field has the wrong type",
        )
        .with_field(format!("{predicate_id}.{field}"))
        .with_expected_actual(expected.as_str(), "different type"),
    }
}

fn map_admission_error(error: AdmissionError) -> ErrorDetail {
    match error {
        AdmissionError::PatientMismatch {
            target_patient_id,
            claim_patient_id,
        } => ErrorDetail::new(
            ErrorCode::PatientMismatch,
            "Claim subject patient does not match target patient ledger",
        )
        .with_expected_actual(target_patient_id, claim_patient_id),
        AdmissionError::Predicate(error) => map_predicate_error(error),
        AdmissionError::ExpectedCorrectionClaim { claim_id } => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "AppendRevisionClaim requires a correction Claim",
        )
        .with_field(claim_id),
        AdmissionError::CorrectionTargetNotFound {
            claim_id,
            target_id,
            target_hash,
        } => ErrorDetail::new(
            ErrorCode::RevisionTargetNotFound,
            "Revision target was not found in the same patient ledger",
        )
        .with_field(format!("{claim_id}->{target_id}@{target_hash}")),
        AdmissionError::StoredTargetRecordHashMismatch {
            claim_id,
            stored,
            recomputed,
            ..
        } => ErrorDetail::new(
            ErrorCode::RevisionTargetHashMismatch,
            "Stored target Record hash does not match recomputed Record hash",
        )
        .with_field(claim_id)
        .with_expected_actual(recomputed.to_string(), stored.to_string()),
        other => ErrorDetail::new(
            ErrorCode::ClaimValidationFailed,
            "Claim is not append-admissible in preview",
        )
        .with_kernel_error(other),
    }
}

fn map_storage_error(error: StorageError) -> ErrorDetail {
    match error {
        StorageError::Io(message) => {
            let mut detail = ErrorDetail::new(
                ErrorCode::StorageUnavailable,
                "Patient WAL storage is unavailable",
            );
            detail.kernel_error = Some(message);
            detail.retryable = true;
            detail
        }
        StorageError::InvalidRecord { line, reason } => ErrorDetail::new(
            ErrorCode::LedgerCorruptionDetected,
            "Patient WAL record is invalid",
        )
        .with_field(format!("line:{line}"))
        .with_kernel_error(reason),
        StorageError::PatientMismatch { expected, actual } => ErrorDetail::new(
            ErrorCode::PatientMismatch,
            "Patient WAL record does not match requested patient",
        )
        .with_expected_actual(expected, actual),
        StorageError::CorruptLog { line, reason } => {
            let mut detail = ErrorDetail::new(
                ErrorCode::LedgerCorruptionDetected,
                "Patient WAL replay failed closed",
            )
            .with_kernel_error(reason);
            if let Some(line) = line {
                detail = detail.with_field(format!("line:{line}"));
            }
            detail
        }
    }
}

fn map_ledger_error(error: LedgerError) -> ErrorDetail {
    match error {
        LedgerError::Admission(error) => map_admission_error(error),
        LedgerError::PatientMismatch {
            ledger_patient_id,
            claim_patient_id,
        } => ErrorDetail::new(
            ErrorCode::PatientMismatch,
            "Claim patient does not match receiving ledger",
        )
        .with_expected_actual(ledger_patient_id, claim_patient_id),
        LedgerError::RevisionAdmissionRequired { claim_id } => ErrorDetail::new(
            ErrorCode::RevisionNotAllowedForAppend,
            "AppendClaim does not accept revision Claims",
        )
        .with_field(claim_id),
        LedgerError::StoreClockExhausted => ErrorDetail::new(
            ErrorCode::StorageUnavailable,
            "Patient ledger has no configured accepted_at clock values",
        ),
        other => ErrorDetail::new(ErrorCode::InternalError, "Ledger append failed")
            .with_kernel_error(other),
    }
}

fn map_snapshot_error(error: LedgerError) -> ErrorDetail {
    match error {
        LedgerError::PatientMismatch {
            ledger_patient_id,
            claim_patient_id,
        } => ErrorDetail::new(
            ErrorCode::PatientMismatch,
            "Snapshot entry patient does not match snapshot patient",
        )
        .with_expected_actual(ledger_patient_id, claim_patient_id),
        other => ErrorDetail::new(
            ErrorCode::LedgerCorruptionDetected,
            "Snapshot failed trusted history rebuild validation",
        )
        .with_kernel_error(other),
    }
}

fn map_query_error(error: QueryError) -> ErrorDetail {
    match error {
        QueryError::InvalidQueryTime { field, value } => ErrorDetail::new(
            ErrorCode::NonCanonicalTimestamp,
            "PointRead query time is not canonical",
        )
        .with_field(field)
        .with_expected_actual("YYYY-MM-DDTHH:MM:SSZ", value),
        QueryError::MissingValidTime { claim_id } => ErrorDetail::new(
            ErrorCode::LedgerCorruptionDetected,
            "Accepted entry is missing valid time",
        )
        .with_field(claim_id),
        QueryError::InvalidValidTime { claim_id, value } => ErrorDetail::new(
            ErrorCode::InvalidValidTimeExpression,
            "Accepted entry has invalid valid-time expression",
        )
        .with_field(claim_id)
        .with_expected_actual("canonical valid time expression", value),
        other => ErrorDetail::new(
            ErrorCode::LedgerCorruptionDetected,
            "PointRead failed over accepted ledger entries",
        )
        .with_kernel_error(other),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ledger_core::conformance::vital_sign_claim;
    use ledger_core::predicates::CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION;
    use serde_json::json;

    #[test]
    fn service_info_and_registry_info_are_private_core_metadata() {
        let service = ClinicalTruthService::vital_sign_fixture().unwrap();

        let service_info = service.get_service_info();
        assert_eq!(
            service_info.contract_version,
            CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION
        );
        assert_eq!(service_info.transport_mode, "transport_agnostic_core");

        let registry = service.get_registry_info();
        assert_eq!(
            registry.registry_version,
            CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION
        );
        assert_eq!(registry.predicate_count, 1);
        assert_eq!(
            registry.registry_content_hash,
            "sha256:d08fd55c937cca96c02d8a0f050e157d001e1539ac280aad344fbf029a0f0b46"
        );
    }

    #[test]
    fn validate_claim_extracts_vital_sign_fields_without_appending() {
        let service = ClinicalTruthService::vital_sign_fixture().unwrap();
        let response = service
            .validate_claim(validate_request(vital_sign_claim("claim-vital-hr-001", 88)))
            .unwrap();

        assert!(response.validated);
        assert_eq!(response.claim_id, "claim-vital-hr-001");
        assert_eq!(response.predicate, "vital.sign");
        assert_eq!(response.shape, "observation");
        assert_eq!(response.subject_patient_id, "patient-vital-001");
        assert_eq!(response.recorded_at, "2026-05-03T12:00:05Z");
        assert!(!response.has_revision_target);
        assert_eq!(response.canonicalization_id, CANONICALIZATION_ID);
    }

    #[test]
    fn preview_append_admission_accepts_first_slice_vital_claim() {
        let service = ClinicalTruthService::vital_sign_fixture().unwrap();
        let response = service
            .preview_append_admission(preview_request(vital_sign_claim("claim-vital-hr-001", 88)))
            .unwrap();

        assert!(response.admissible);
        assert_eq!(response.claim_id, "claim-vital-hr-001");
        assert_eq!(response.target_patient_id, "patient-vital-001");
        assert_eq!(
            response.registry_version,
            CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION
        );
    }

    #[test]
    fn preview_maps_kernel_errors_to_v1alpha1_error_codes() {
        let service = ClinicalTruthService::vital_sign_fixture().unwrap();

        let patient_mismatch = PreviewAppendAdmissionRequest {
            patient: PatientLedgerRef {
                patient_id: "patient-other".to_string(),
            },
            ..preview_request(vital_sign_claim("claim-vital-hr-001", 88))
        };
        assert_eq!(
            service
                .preview_append_admission(patient_mismatch)
                .unwrap_err()
                .code,
            ErrorCode::PatientMismatch
        );

        let mut shape_mismatch = vital_sign_claim("claim-vital-shape", 88);
        shape_mismatch["shape"] = json!("context");
        assert_eq!(
            service
                .preview_append_admission(preview_request(shape_mismatch))
                .unwrap_err()
                .code,
            ErrorCode::PredicateShapeMismatch
        );

        let mut missing_field = vital_sign_claim("claim-vital-missing", 88);
        missing_field["object"]
            .as_object_mut()
            .unwrap()
            .remove("encounterId");
        assert_eq!(
            service
                .preview_append_admission(preview_request(missing_field))
                .unwrap_err()
                .code,
            ErrorCode::ObjectFieldMissing
        );

        let mut k3_metadata = vital_sign_claim("claim-vital-k3", 88);
        k3_metadata["time"]["accepted_at"] = json!("2026-05-03T12:00:10Z");
        assert_eq!(
            service
                .preview_append_admission(preview_request(k3_metadata))
                .unwrap_err()
                .code,
            ErrorCode::CallerSuppliedStoreMetadata
        );

        let mut noncanonical = vital_sign_claim("claim-vital-time", 88);
        noncanonical["time"]["recorded_at"] = json!("2026-05-03T12:00:05.000Z");
        assert_eq!(
            service
                .preview_append_admission(preview_request(noncanonical))
                .unwrap_err()
                .code,
            ErrorCode::NonCanonicalTimestamp
        );
    }

    #[test]
    fn preview_fails_closed_for_contract_and_registry_mismatch() {
        let service = ClinicalTruthService::vital_sign_fixture().unwrap();

        let wrong_contract = PreviewAppendAdmissionRequest {
            contract_version: "clinical_truth.v9".to_string(),
            ..preview_request(vital_sign_claim("claim-vital-hr-001", 88))
        };
        assert_eq!(
            service
                .preview_append_admission(wrong_contract)
                .unwrap_err()
                .code,
            ErrorCode::InvalidContractVersion
        );

        let wrong_registry = PreviewAppendAdmissionRequest {
            expected_registry_version: Some("other-registry".to_string()),
            ..preview_request(vital_sign_claim("claim-vital-hr-001", 88))
        };
        assert_eq!(
            service
                .preview_append_admission(wrong_registry)
                .unwrap_err()
                .code,
            ErrorCode::RegistryVersionMismatch
        );
    }

    #[test]
    fn append_claim_orders_patient_entries_and_replays_same_idempotency_key() {
        let mut service = test_service();
        let claim = vital_sign_claim("claim-vital-hr-001", 88);

        let first = service
            .append_claim(append_request("req-append-001", claim.clone()))
            .unwrap();
        assert!(!first.idempotent_replay);
        assert_eq!(first.entry.claim_id, "claim-vital-hr-001");
        assert_eq!(first.entry.seq, 1);
        assert_eq!(first.entry.accepted_at, "2026-05-03T12:00:10Z");
        assert_eq!(first.entry.previous_entry_hash, None);

        let replay = service
            .append_claim(append_request("req-append-001", claim))
            .unwrap();
        assert!(replay.idempotent_replay);
        assert_eq!(replay.entry, first.entry);

        let second = service
            .append_claim(append_request(
                "req-append-002",
                vital_sign_claim("claim-vital-rr-001", 18),
            ))
            .unwrap();
        assert_eq!(second.entry.seq, 2);
        assert_eq!(
            second.entry.previous_entry_hash,
            Some(first.entry.entry_hash.clone())
        );
    }

    #[test]
    fn append_claim_rejects_idempotency_key_reuse_with_different_payload() {
        let mut service = test_service();
        service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();

        let error = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-002", 89),
            ))
            .unwrap_err();

        assert_eq!(error.code, ErrorCode::IdempotencyConflict);
    }

    #[test]
    fn append_revision_claim_returns_target_proof_and_replays_idempotently() {
        let mut service = test_service();
        let base = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        let mut correction = vital_sign_claim("claim-vital-hr-001-correction", 92);
        correction["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": base.entry.claim_id,
                "hash": base.entry.record_hash,
            }
        });

        let first = service
            .append_revision_claim(append_revision_request(
                "req-revision-001",
                correction.clone(),
            ))
            .unwrap();
        assert!(!first.idempotent_replay);
        assert_eq!(first.entry.seq, 2);
        assert_eq!(
            first.target_proof.target_record_hash,
            base.entry.record_hash
        );
        assert_eq!(first.target_proof.target_seq, 1);

        let replay = service
            .append_revision_claim(append_revision_request("req-revision-001", correction))
            .unwrap();
        assert!(replay.idempotent_replay);
        assert_eq!(replay.entry, first.entry);
        assert_eq!(replay.target_proof, first.target_proof);
    }

    #[test]
    fn append_paths_fail_closed_for_wrong_operation_or_missing_target() {
        let mut service = test_service();
        let base = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        let mut correction = vital_sign_claim("claim-vital-hr-001-correction", 92);
        correction["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": base.entry.claim_id,
                "hash": base.entry.record_hash,
            }
        });

        assert_eq!(
            service
                .append_claim(append_request("req-wrong-op-001", correction.clone()))
                .unwrap_err()
                .code,
            ErrorCode::RevisionNotAllowedForAppend
        );

        correction["revises"]["target"]["hash"] =
            json!("sha256:0000000000000000000000000000000000000000000000000000000000000000");
        assert_eq!(
            service
                .append_revision_claim(append_revision_request(
                    "req-stale-target-hash",
                    correction.clone(),
                ))
                .unwrap_err()
                .code,
            ErrorCode::RevisionTargetHashMismatch
        );

        correction["revises"]["target"]["hash"] = json!(base.entry.record_hash);
        correction["revises"]["target"]["id"] = json!("claim-vital-missing");
        assert_eq!(
            service
                .append_revision_claim(append_revision_request("req-missing-target", correction))
                .unwrap_err()
                .code,
            ErrorCode::RevisionTargetNotFound
        );
    }

    #[test]
    fn get_entry_fetches_by_claim_id_record_hash_or_exact_pair() {
        let mut service = test_service();
        let appended = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();

        let by_claim = service.get_entry(GetEntryRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            claim_id: Some("claim-vital-hr-001".to_string()),
            record_hash: None,
        });
        assert_eq!(by_claim.unwrap().entry, appended.entry);

        let by_hash = service.get_entry(GetEntryRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            claim_id: None,
            record_hash: Some(appended.entry.record_hash.clone()),
        });
        assert_eq!(by_hash.unwrap().entry, appended.entry);

        let by_exact_pair = service.get_entry(GetEntryRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            claim_id: Some("claim-vital-hr-001".to_string()),
            record_hash: Some(appended.entry.record_hash.clone()),
        });
        assert_eq!(by_exact_pair.unwrap().entry, appended.entry);

        let stale_pair = service.get_entry(GetEntryRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            claim_id: Some("claim-vital-hr-001".to_string()),
            record_hash: Some(
                "sha256:0000000000000000000000000000000000000000000000000000000000000000"
                    .to_string(),
            ),
        });
        assert_eq!(stale_pair.unwrap_err().code, ErrorCode::EntryNotFound);
    }

    #[test]
    fn point_read_projects_before_and_after_revision_without_mutating_history() {
        let mut service = test_service();
        let base = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        let mut correction = vital_sign_claim("claim-vital-hr-001-correction", 92);
        correction["revises"] = json!({
            "mode": "corrects",
            "target": {
                "id": base.entry.claim_id,
                "hash": base.entry.record_hash,
            }
        });
        let correction = service
            .append_revision_claim(append_revision_request("req-revision-001", correction))
            .unwrap();

        let before = service
            .point_read(PointReadRequest {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                patient: patient_ref(),
                valid_at: "2026-05-03T12:00:00Z".to_string(),
                known_at: "2026-05-03T12:00:10Z".to_string(),
            })
            .unwrap();
        assert_eq!(claim_ids(&before.entries), vec!["claim-vital-hr-001"]);

        let after = service
            .point_read(PointReadRequest {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                patient: patient_ref(),
                valid_at: "2026-05-03T12:00:00Z".to_string(),
                known_at: "2026-05-03T12:05:10Z".to_string(),
            })
            .unwrap();
        assert_eq!(
            claim_ids(&after.entries),
            vec!["claim-vital-hr-001-correction"]
        );
        assert_eq!(after.ledger_head_hash, Some(correction.entry.entry_hash));
    }

    #[test]
    fn snapshot_and_validate_snapshot_require_admin_context_and_patient_scope() {
        let mut service = test_service();
        service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();

        let denied = service.snapshot_ledger(SnapshotLedgerRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            admin_context: AdminContext {
                actor_id: "".to_string(),
                purpose: "view".to_string(),
            },
        });
        assert_eq!(denied.unwrap_err().code, ErrorCode::AdminContextRequired);

        let snapshot = service
            .snapshot_ledger(SnapshotLedgerRequest {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                patient: patient_ref(),
                admin_context: admin_context(),
            })
            .unwrap();
        assert_eq!(snapshot.patient_id, "patient-vital-001");
        assert_eq!(snapshot.entry_count, 1);

        let validated = service
            .validate_ledger_snapshot(ValidateLedgerSnapshotRequest {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                patient: patient_ref(),
                admin_context: admin_context(),
                snapshot: snapshot.snapshot.clone(),
            })
            .unwrap();
        assert!(validated.valid);
        assert_eq!(validated.entry_count, 1);
        assert_eq!(validated.rebuilt_head_hash, snapshot.head_hash);

        let cross_patient = service.validate_ledger_snapshot(ValidateLedgerSnapshotRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: PatientLedgerRef {
                patient_id: "patient-other".to_string(),
            },
            admin_context: admin_context(),
            snapshot: snapshot.snapshot,
        });
        assert_eq!(cross_patient.unwrap_err().code, ErrorCode::PatientMismatch);
    }

    #[test]
    fn validate_snapshot_detects_corruption_and_does_not_import_entries() {
        let mut source = test_service();
        source
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        let mut snapshot = source
            .snapshot_ledger(SnapshotLedgerRequest {
                contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                patient: patient_ref(),
                admin_context: admin_context(),
            })
            .unwrap()
            .snapshot;
        snapshot.entries[0].entry_hash =
            "sha256:0000000000000000000000000000000000000000000000000000000000000000".to_string();

        let blank = ClinicalTruthService::vital_sign_fixture().unwrap();
        assert_eq!(
            blank
                .validate_ledger_snapshot(ValidateLedgerSnapshotRequest {
                    contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                    patient: patient_ref(),
                    admin_context: admin_context(),
                    snapshot,
                })
                .unwrap_err()
                .code,
            ErrorCode::LedgerCorruptionDetected
        );
        assert_eq!(
            blank
                .get_entry(GetEntryRequest {
                    contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                    patient: patient_ref(),
                    claim_id: Some("claim-vital-hr-001".to_string()),
                    record_hash: None,
                })
                .unwrap_err()
                .code,
            ErrorCode::StorageUnavailable
        );
    }

    #[test]
    fn file_wal_persists_replays_and_rehydrates_patient_ledger() {
        let dir = unique_temp_dir("clinical-truth-wal-replay");
        let mut service = ClinicalTruthService::vital_sign_fixture()
            .unwrap()
            .with_file_wal_storage(dir.clone(), WalDurability::TestModeNoFsync)
            .unwrap()
            .with_patient_ledger_from_storage(
                "patient-vital-001",
                ["2026-05-03T12:00:10Z", "2026-05-03T12:05:10Z"],
            )
            .unwrap();

        assert_eq!(
            service.get_service_info().storage_mode,
            "file_wal_service_core_prototype:test_mode_no_fsync"
        );
        let first = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        let second = service
            .append_claim(append_request(
                "req-append-002",
                vital_sign_claim("claim-vital-rr-001", 18),
            ))
            .unwrap();

        let snapshot = service.replay_patient_wal_snapshot(patient_ref()).unwrap();
        assert_eq!(snapshot.patient_id, "patient-vital-001");
        assert_eq!(snapshot.entries.len(), 2);
        assert_eq!(snapshot.head_hash, Some(second.entry.entry_hash.clone()));
        assert_eq!(
            snapshot.entries[1].previous_entry_hash,
            Some(first.entry.entry_hash.clone())
        );

        let log_path = service
            .storage
            .as_ref()
            .unwrap()
            .log_path_for_patient("patient-vital-001");
        let log = std::fs::read_to_string(&log_path).unwrap();
        assert_eq!(log.lines().count(), 2);
        assert!(log.contains("\"wal_record_version\":1"));
        assert!(log.contains("\"head_hash_after_append\""));

        let mut rehydrated = ClinicalTruthService::vital_sign_fixture()
            .unwrap()
            .with_file_wal_storage(dir.clone(), WalDurability::TestModeNoFsync)
            .unwrap()
            .with_patient_ledger_from_storage("patient-vital-001", ["2026-05-03T12:10:10Z"])
            .unwrap();
        let replay = rehydrated
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        assert!(replay.idempotent_replay);
        assert_eq!(replay.entry, first.entry);

        let conflict = rehydrated
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-conflict-001", 89),
            ))
            .unwrap_err();
        assert_eq!(conflict.code, ErrorCode::IdempotencyConflict);

        let third = rehydrated
            .append_claim(append_request(
                "req-append-003",
                vital_sign_claim("claim-vital-temp-001", 37),
            ))
            .unwrap();
        assert_eq!(third.entry.seq, 3);
        assert_eq!(third.entry.previous_entry_hash, snapshot.head_hash);

        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn file_wal_append_failure_does_not_mutate_ledger_or_consume_clock() {
        let dir = unique_temp_dir("clinical-truth-wal-append-fail");
        let mut service = ClinicalTruthService::vital_sign_fixture()
            .unwrap()
            .with_file_wal_storage(dir.clone(), WalDurability::TestModeNoFsync)
            .unwrap()
            .with_patient_ledger_from_storage(
                "patient-vital-001",
                ["2026-05-03T12:00:10Z", "2026-05-03T12:05:10Z"],
            )
            .unwrap();
        let log_path = service
            .storage
            .as_ref()
            .unwrap()
            .log_path_for_patient("patient-vital-001");
        std::fs::create_dir_all(&log_path).unwrap();

        let failed = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap_err();
        assert_eq!(failed.code, ErrorCode::StorageUnavailable);
        assert_eq!(
            service
                .get_entry(GetEntryRequest {
                    contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
                    patient: patient_ref(),
                    claim_id: Some("claim-vital-hr-001".to_string()),
                    record_hash: None,
                })
                .unwrap_err()
                .code,
            ErrorCode::EntryNotFound
        );

        std::fs::remove_dir_all(&log_path).unwrap();
        let retry = service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();
        assert_eq!(retry.entry.seq, 1);
        assert_eq!(retry.entry.accepted_at, "2026-05-03T12:00:10Z");

        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn file_wal_replay_rejects_entry_version_overflow() {
        let dir = unique_temp_dir("clinical-truth-wal-entry-version-overflow");
        let mut service = ClinicalTruthService::vital_sign_fixture()
            .unwrap()
            .with_file_wal_storage(dir.clone(), WalDurability::TestModeNoFsync)
            .unwrap()
            .with_patient_ledger_from_storage("patient-vital-001", ["2026-05-03T12:00:10Z"])
            .unwrap();
        service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();

        let log_path = service
            .storage
            .as_ref()
            .unwrap()
            .log_path_for_patient("patient-vital-001");
        let line = std::fs::read_to_string(&log_path).unwrap();
        let mut record: Value = serde_json::from_str(line.trim()).unwrap();
        record["entry"]["entry_version"] = json!(4_294_967_297_u64);
        std::fs::write(
            &log_path,
            format!("{}\n", serde_json::to_string(&record).unwrap()),
        )
        .unwrap();

        let error = service
            .replay_patient_wal_snapshot(patient_ref())
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::LedgerCorruptionDetected);

        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn file_wal_replay_fails_closed_on_corrupted_head() {
        let dir = unique_temp_dir("clinical-truth-wal-corrupt");
        let mut service = ClinicalTruthService::vital_sign_fixture()
            .unwrap()
            .with_file_wal_storage(dir.clone(), WalDurability::TestModeNoFsync)
            .unwrap()
            .with_patient_ledger_from_storage("patient-vital-001", ["2026-05-03T12:00:10Z"])
            .unwrap();
        service
            .append_claim(append_request(
                "req-append-001",
                vital_sign_claim("claim-vital-hr-001", 88),
            ))
            .unwrap();

        let log_path = service
            .storage
            .as_ref()
            .unwrap()
            .log_path_for_patient("patient-vital-001");
        let line = std::fs::read_to_string(&log_path).unwrap();
        let mut record: Value = serde_json::from_str(line.trim()).unwrap();
        record["head_hash_after_append"] =
            json!("sha256:0000000000000000000000000000000000000000000000000000000000000000");
        std::fs::write(
            &log_path,
            format!("{}\n", serde_json::to_string(&record).unwrap()),
        )
        .unwrap();

        let error = service
            .replay_patient_wal_snapshot(patient_ref())
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::LedgerCorruptionDetected);

        let _ = std::fs::remove_dir_all(dir);
    }

    fn validate_request(claim_json: Value) -> ValidateClaimRequest {
        ValidateClaimRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: PatientLedgerRef {
                patient_id: "patient-vital-001".to_string(),
            },
            payload: payload(claim_json),
        }
    }

    fn append_request(client_request_id: &str, claim_json: Value) -> AppendClaimRequest {
        AppendClaimRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            payload: payload_with_request_id(client_request_id, claim_json),
            expected_registry_version: Some(
                CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION.to_string(),
            ),
        }
    }

    fn append_revision_request(
        client_request_id: &str,
        claim_json: Value,
    ) -> AppendRevisionClaimRequest {
        AppendRevisionClaimRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            payload: payload_with_request_id(client_request_id, claim_json),
            expected_registry_version: Some(
                CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION.to_string(),
            ),
        }
    }

    fn preview_request(claim_json: Value) -> PreviewAppendAdmissionRequest {
        PreviewAppendAdmissionRequest {
            contract_version: CLINICAL_TRUTH_V1ALPHA1_CONTRACT_VERSION.to_string(),
            patient: patient_ref(),
            payload: payload(claim_json),
            expected_registry_version: Some(
                CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION.to_string(),
            ),
        }
    }

    fn patient_ref() -> PatientLedgerRef {
        PatientLedgerRef {
            patient_id: "patient-vital-001".to_string(),
        }
    }

    fn admin_context() -> AdminContext {
        AdminContext {
            actor_id: "service-admin".to_string(),
            purpose: "maintenance".to_string(),
        }
    }

    fn claim_ids(entries: &[AcceptedEntryView]) -> Vec<&str> {
        entries
            .iter()
            .map(|entry| entry.claim_id.as_str())
            .collect()
    }

    fn unique_temp_dir(label: &str) -> PathBuf {
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("pi-rn-{label}-{}-{nonce}", std::process::id()))
    }

    fn test_service() -> ClinicalTruthService {
        ClinicalTruthService::vital_sign_fixture()
            .unwrap()
            .with_patient_ledger(
                "patient-vital-001",
                [
                    "2026-05-03T12:00:10Z",
                    "2026-05-03T12:05:10Z",
                    "2026-05-03T12:10:10Z",
                ],
            )
    }

    fn payload(claim_json: Value) -> ClaimPayload {
        payload_with_request_id("req-vital-preview-001", claim_json)
    }

    fn payload_with_request_id(client_request_id: &str, claim_json: Value) -> ClaimPayload {
        ClaimPayload {
            claim_json,
            client_request_id: client_request_id.to_string(),
            source_context: None,
        }
    }
}
