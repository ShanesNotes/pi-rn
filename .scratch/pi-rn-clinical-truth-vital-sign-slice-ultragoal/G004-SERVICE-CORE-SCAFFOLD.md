# G004 — Clinical-truth service-core scaffold

Date: 2026-05-31

## What changed

Added a transport-agnostic private service-core crate in `pi-ledger`:

- `pi-ledger/crates/clinical-truth-service/Cargo.toml`
- `pi-ledger/crates/clinical-truth-service/src/lib.rs`
- workspace membership in `pi-ledger/Cargo.toml`

The crate wraps `ledger-core` for service-contract semantics without adding gRPC/UDS, auth, or production storage yet.

## Implemented operations

- `GetServiceInfo`
- `GetRegistryInfo`
- `ValidateClaim`
- `PreviewAppendAdmission`

## Implemented contract types

- `PatientLedgerRef`
- `ClaimPayload`
- request/response structs for validate and preview
- `ErrorCode`
- `ErrorDetail`
- `ClinicalTruthService::vital_sign_fixture()`

## Error vocabulary covered now

The service-core scaffold maps kernel errors into v1alpha1-style codes for:

- `INVALID_CONTRACT_VERSION`
- `INVALID_JSON`
- `CLAIM_VALIDATION_FAILED`
- `NON_CANONICAL_TIMESTAMP`
- `CALLER_SUPPLIED_STORE_METADATA`
- `PATIENT_MISMATCH`
- `PREDICATE_NOT_FOUND`
- `PREDICATE_SHAPE_MISMATCH`
- `OBJECT_FIELD_MISSING`
- `OBJECT_FIELD_INVALID`
- `REVISION_NOT_ALLOWED_FOR_APPEND`
- `REGISTRY_VERSION_MISMATCH`
- `INTERNAL_ERROR`

## Boundary posture

This crate is private service semantics, not a browser/UI/agent API. It does not import `pi-chart`, patient directories, UI artifacts, or hidden simulator internals.

## Verification

Passed:

- `cd pi-ledger && cargo test -p clinical-truth-service` — 5/5
- `cd pi-ledger && cargo test` — workspace 138/138
- `git diff --check`

Evidence files:

- `evidence/g004-service-core-tests.txt`
- `evidence/g004-pi-ledger-workspace-test.txt`
