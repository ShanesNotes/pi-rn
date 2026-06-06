# PRD — Versioned clinical-truth service contract

Date: 2026-05-31
Ultragoal story: `G003-versioned-clinical-truth-service-contract-pr`
Status: planning artifact; no production implementation authorized by this document alone.

## Problem

`pi-ledger` now owns the reusable claim-ledger kernel and ADR 009 accepts a private/internal service around it. `pi-chart` ADR 021 accepts app/backend-mediated service consumption. The boundary is decided, but the versioned contract is not yet explicit. Without a contract, the next source-code work risks copying private Rust internals, reintroducing TypeScript canonicalization/admission, or making clinician entry points talk directly to ledger truth.

## Goal

Define the first private backend-to-service contract shape for accepted clinical truth operations, constrained to the safe `ledger-core` lifecycle paths and suitable for private/local gRPC over Unix-domain socket while remaining transport-agnostic at the semantic level.

## Non-goals

- Build the production service.
- Choose a full backend framework, auth provider, public API, vector/retrieval/OpenBrain architecture, or embedded database.
- Let browsers, EHR plugins, specialty UIs, or `pi-agent` call the clinical-truth service directly.
- Reimplement canonicalization, hashing, predicate admission, or revision admission in TypeScript.
- Ingest hidden `pi-sim` internals.

## Actors and trust boundary

| Actor | Contract posture |
| --- | --- |
| Clinical entry points | Call Pi-RN/pi-chart app/backend only. They never call this service directly. |
| Pi-RN/pi-chart app/backend | Sole first client of the private service. Owns auth/session/workflow/proposal mediation and submits accepted-write requests. |
| Clinical-truth service | Private/internal service around `ledger-core`; owns patient ledger storage, append order, admission, canonicalization/hashing, and bitemporal reads. |
| `ledger-core` | Kernel library used inside the service only; its safe lifecycle remains the implementation authority. |
| `pi-agent` | Future bounded runtime consumer of exposed chart/public surfaces; not a direct accepted-truth writer. |

## Versioning

First contract version: `clinical_truth.v1alpha1`.

Versioning rules:

- Every request carries `contract_version` or uses a transport-level equivalent.
- Every response carries `contract_version`, `service_build`, and `registry_version` where predicate policy is involved.
- Breaking changes require a new contract version; additive response fields are allowed if clients ignore unknown fields.
- Conformance vectors are versioned with the contract and registry.

## Canonical domain messages

These are semantic messages, not final protobuf syntax.

### `PatientLedgerRef`

- `patient_id: string` — service target ledger id; admission rejects Claims whose `subject.patientId` differs.
- `ledger_namespace?: string` — optional future partition; absent in v1alpha1 fixtures.

### `ClaimPayload`

- `claim_json: object` — JSON-compatible Claim candidate shaped to the kernel target, including `id`, `shape`, `predicate`, `subject`, `object`, `time`, `actor`, and `integrity` placeholder/metadata as the contract finalizes.
- `client_request_id: string` — idempotency/correlation key, not Claim identity.
- `source_context?: object` — app/backend correlation only; not trusted clinical truth unless encoded in the Claim payload.

### `AcceptedEntryView`

- `claim_id: string`
- `record_hash: string` in `sha256:<64 lowercase hex>` form
- `entry_hash: string` in `sha256:<64 lowercase hex>` form
- `seq: integer`
- `accepted_at: canonical UTC timestamp`
- `batch_id: string`
- `previous_entry_hash?: string`
- `head_hash: string`
- `claim_json: object` — accepted content as stored/canonicalized view

### `ErrorDetail`

- `code: enum`
- `message: string`
- `field_path?: string`
- `expected?: string`
- `actual?: string`
- `kernel_error?: string`
- `retryable: boolean`

## Operations

### `GetServiceInfo`

Purpose: discover contract support without exposing clinical truth.

Request: none or version probe.

Response:

- supported contract versions;
- service build;
- storage mode (`per_patient_wal_log` for first implementation);
- transport mode (e.g. `grpc_uds`, informational only);
- advertised conformance suite id.

### `GetRegistryInfo`

Purpose: let the backend know the active predicate registry policy before submitting accepted writes.

Response:

- `registry_version`;
- registry content hash;
- supported predicate ids and declared shapes, optionally summary-only;
- compatibility window for clients.

Boundary: registry authority is service-side. Client-side registry mirrors are optimization/UX aids only.

### `ValidateClaim`

Purpose: run structural Claim validation and canonicalizability checks without appending.

Kernel path: `claim::validate_claim` plus canonicalization checks.

Request:

- `PatientLedgerRef`;
- `ClaimPayload`.

Response:

- `validated: boolean`;
- extracted fields: claim id, predicate, shape, subject patient id, valid time, recorded time, optional revision target;
- canonicalization id;
- errors if invalid.

Boundary: validation success is not append authorization.

### `PreviewAppendAdmission`

Purpose: check whether a valid base Claim would be append-admissible against current patient/predicate policy, without assigning store metadata.

Kernel path: `validate_claim` -> `AppendAdmissibleClaim::admit`.

Request:

- `PatientLedgerRef`;
- `ClaimPayload`;
- optional expected `registry_version`.

Response:

- admission status;
- registry version/hash used;
- normalized/extracted field summary;
- errors for patient mismatch, predicate missing, shape mismatch, object field errors, invalid time, caller-supplied K3 metadata.

Boundary: preview may become stale before append. Production writes must re-run admission at append time.

### `AppendClaim`

Purpose: append a base non-revision Claim to the patient ledger.

Kernel path: `validate_claim` -> `AppendAdmissibleClaim::admit` -> `AppendLedger::append_admissible`.

Request:

- `PatientLedgerRef`;
- `ClaimPayload`;
- optional idempotency key;
- optional expected `registry_version`.

Response:

- `AcceptedEntryView`;
- resulting `head_hash`;
- registry version/hash used.

Semantics:

- rejects Claims that carry a revision target; callers must use `AppendRevisionClaim`;
- service assigns known-time metadata, sequence, batch id, Record hash, Entry hash, previous link, and head;
- concurrent submissions are ordered by the service per patient ledger.

### `AppendRevisionClaim`

Purpose: append a correction/revision Claim only after target existence is proven in the same patient ledger by Claim id and Record hash.

Kernel path: `validate_claim` -> `AppendAdmissibleClaim::admit` -> `RevisionAdmissibleClaim::admit` -> `AppendLedger::append_revision_admissible`.

Request:

- `PatientLedgerRef`;
- `ClaimPayload` with `revises.target.{id,hash}`;
- optional idempotency key;
- optional target expectation such as current head hash.

Response:

- `AcceptedEntryView`;
- target proof summary: target claim id, target record hash, target entry hash/seq;
- resulting head.

Semantics:

- service rechecks target against current same-patient ledger entries at append time;
- stale, missing, wrong-patient, or hash-mismatched targets reject with explicit non-retryable conflict unless caller refreshes target evidence.

### `GetEntry`

Purpose: fetch one accepted entry by Claim id and/or Record hash for evidence drill-down or correction-target acquisition.

Request:

- `PatientLedgerRef`;
- `claim_id?: string`;
- `record_hash?: string`;
- `as_of_known?: canonical UTC timestamp` optional future extension.

Response:

- accepted entry view(s) matching the selector;
- explicit not-found error if absent.

### `PointRead`

Purpose: expose bitemporal query over trusted accepted entries.

Kernel path: `query::point_read`.

Request:

- `PatientLedgerRef`;
- `valid_at: canonical UTC timestamp`;
- `known_at: canonical UTC timestamp`;
- optional predicate/claim filters.

Response:

- point-read view entries;
- ledger head/hash used;
- query time boundaries.

Boundary: point read is not admission, conflict resolution, or surface-label derivation.

### `SnapshotLedger`

Purpose: obtain a trusted snapshot for backup, diagnostics, or conformance; not a write shortcut.

Kernel path: `AppendLedger::snapshot`.

Request:

- `PatientLedgerRef`;
- admin/maintenance authorization context supplied by the app/backend or service operator;
- optional expected head hash for diagnostics.

Boundary: snapshot access is patient-scoped and admin/maintenance-authorized. It must not expose cross-patient ledgers, and it is not available to browser/EHR/workflow/`pi-agent` callers.

Response:

- snapshot metadata;
- entries;
- head hash;
- storage log position/checkpoint marker if implemented.

### `ValidateLedgerSnapshot`

Purpose: validate/rebuild a trusted snapshot/log for diagnostics or service startup.

Kernel path: `AppendLedger::from_snapshot` / `AppendLedger::validate`.

Request:

- `PatientLedgerRef` for the patient ledger the snapshot claims to represent;
- snapshot payload or service-local snapshot reference;
- admin/maintenance authorization context supplied by the app/backend or service operator.

Boundary: validation rejects snapshots whose embedded patient id or entries do not match `PatientLedgerRef`; cross-patient rebuild is never a convenience path.

Response:

- valid/invalid;
- first corruption/mismatch detail;
- rebuilt head hash if valid.

Boundary: rebuild does not rerun mutable current predicate policy unless a separate registry re-audit operation is designed later.

## Error vocabulary v1alpha1

Required error codes:

- `INVALID_CONTRACT_VERSION`
- `INVALID_JSON`
- `CLAIM_VALIDATION_FAILED`
- `NON_CANONICAL_TIMESTAMP`
- `INVALID_VALID_TIME_EXPRESSION`
- `CALLER_SUPPLIED_STORE_METADATA`
- `PATIENT_MISMATCH`
- `PREDICATE_NOT_FOUND`
- `PREDICATE_SHAPE_MISMATCH`
- `OBJECT_FIELD_MISSING`
- `OBJECT_FIELD_INVALID`
- `REVISION_TARGET_REQUIRED`
- `REVISION_NOT_ALLOWED_FOR_APPEND`
- `REVISION_TARGET_NOT_FOUND`
- `REVISION_TARGET_HASH_MISMATCH`
- `REVISION_TARGET_WRONG_PATIENT`
- `REGISTRY_VERSION_MISMATCH`
- `LEDGER_HEAD_CONFLICT`
- `LEDGER_CORRUPTION_DETECTED`
- `STORAGE_UNAVAILABLE`
- `INTERNAL_ERROR`

## Acceptance criteria for this contract plan

- Every write operation maps to the safe kernel lifecycle.
- No operation exposes admission bypass append support.
- Base append and revision append are distinct.
- Store-owned K3 metadata is never client-authority.
- Predicate registry version/hash are visible in validation/admission/append responses.
- Record hash acquisition is possible without client-side canonicalization.
- Point read is separated from admission and projection semantics.
- Snapshot/rebuild is marked diagnostic/storage authority, not a write bypass.
- Client exposure is private/backend-mediated only.
