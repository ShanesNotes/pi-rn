# Test spec — Versioned clinical-truth service contract

Date: 2026-05-31
Ultragoal story: `G003-versioned-clinical-truth-service-contract-pr`

## Test strategy

This test spec defines the minimum evidence required before source/runtime implementation of the clinical-truth service/client seam. Tests must prove contract semantics before transport-specific plumbing is trusted.

## Test layers

| Layer | Purpose | Example checks |
| --- | --- | --- |
| Contract schema tests | Request/response compatibility for `clinical_truth.v1alpha1` | Unknown fields ignored where allowed; missing required fields rejected; version mismatch rejected. |
| Kernel lifecycle mapping tests | Prove every operation uses safe `ledger-core` path | Append uses validation + admission + append; revision uses revision admission; no bypass append visible. |
| Golden-vector conformance tests | Transport-agnostic deterministic behavior | Canonical bytes/hash, accepted entry metadata shape, expected error codes. |
| Storage/rebuild tests | Per-patient WAL/log durability and corruption detection | Replay valid log; detect truncated/corrupt entry; head mismatch fails closed. |
| Client-boundary tests | `pi-chart` backend-mediated access | UI/browser-like callers cannot reach service contract directly in test harness; backend client does. |
| Projection separation tests | Service returns facts/views, not clinician-surface authority | Shift Brain/Report/Handoff labels remain `pi-chart` projections. |

## Operation-specific tests

### `GetServiceInfo`

- Reports `clinical_truth.v1alpha1` support.
- Reports storage posture `per_patient_wal_log` once storage exists.
- Does not reveal patient data.

### `GetRegistryInfo`

- Returns registry version and content hash.
- Registry ids include review/attestation predicates and `observation.context_segment` when production registry is introduced.
- A client using an unsupported registry version receives `REGISTRY_VERSION_MISMATCH` on admission/append preview.

### `ValidateClaim`

Positive:

- Valid base Claim returns extracted id, predicate, shape, patient id, valid time, recorded time.
- Valid correction Claim returns revision target summary without proving target existence.

Negative:

- malformed JSON -> `INVALID_JSON`;
- non-canonical timestamps -> `NON_CANONICAL_TIMESTAMP`;
- invalid instant/interval expression -> `INVALID_VALID_TIME_EXPRESSION`;
- caller-supplied `accepted_at`, `seq`, `batch_id`, Record hash, Entry hash, previous head -> `CALLER_SUPPLIED_STORE_METADATA`.

### `PreviewAppendAdmission`

Positive:

- Valid patient-matching base Claim with registered predicate passes preview.

Negative:

- Claim subject patient differs from target ledger -> `PATIENT_MISMATCH`;
- unregistered predicate -> `PREDICATE_NOT_FOUND`;
- predicate shape differs from Claim shape -> `PREDICATE_SHAPE_MISMATCH`;
- missing required object field -> `OBJECT_FIELD_MISSING`;
- wrong object field type -> `OBJECT_FIELD_INVALID`.

Staleness:

- Preview success is not reused as append authority; append tests mutate ledger/registry between preview and append and prove append rechecks.

### `AppendClaim`

Positive:

- Base Claim appends and returns `AcceptedEntryView` with service-assigned `seq`, `accepted_at`, `batch_id`, `record_hash`, `entry_hash`, `head_hash`.
- Two concurrent base Claims for the same patient receive one deterministic service-side order in the durable log.

Negative:

- Claim with `revises.target` submitted to `AppendClaim` rejects with deterministic `REVISION_NOT_ALLOWED_FOR_APPEND` before append.
- Duplicate idempotency key returns the prior accepted result or a deterministic idempotency conflict according to implementation spec.

### `AppendRevisionClaim`

Positive:

- Correction Claim with target id + current Record hash appends, preserves prior entry, and returns target proof summary.

Negative:

- missing target -> `REVISION_TARGET_NOT_FOUND`;
- target hash mismatch -> `REVISION_TARGET_HASH_MISMATCH`;
- target belongs to another patient ledger -> `REVISION_TARGET_WRONG_PATIENT`;
- stale target hash after a correction race rejects until caller refreshes target evidence.

### `GetEntry`

- Finds accepted entry by Claim id + Record hash.
- Returns multiple history entries for a Claim id if the contract chooses to expose them; otherwise documents selector exactness.
- Not found is explicit and non-mutating.

### `PointRead`

- Valid-time and known-time boundaries produce expected visible entries.
- Correction history remains append-only; point read visibility changes by known time, not mutation.
- Query does not run admission or predicate policy.

### `SnapshotLedger` / `ValidateLedgerSnapshot`

- Snapshot requests include explicit `PatientLedgerRef` and admin/maintenance authorization context.
- Cross-patient snapshot or rebuild attempts reject before returning entries.
- Snapshot round-trips through rebuild with same head hash.
- Corrupted entry hash, previous link, accepted time ordering, or head mismatch is detected.
- Rebuild does not rerun current predicate policy unless a future registry re-audit mode is explicitly requested.

## Boundary tests

- Browser/EHR/task-list simulated caller cannot call service directly in the planned architecture; only app/backend client has service transport configuration.
- `pi-agent` fixtures only receive exposed chart/public context, not UDS path or service credentials.
- Hidden `pi-sim` paths are absent from service/client tests; public telemetry fixtures are referenced only through explicit adapter planning.
- Suggestions and review prompts cannot become accepted writes without a backend-mediated accepted-write operation and future clinical policy.

## Exit criteria before source implementation

- This test spec and the PRD have corresponding golden-vector and WAL/log design artifacts.
- Every required negative error has at least one named vector or test case.
- Independent review agrees the contract does not widen the kernel or expose private service directly to clinical entry points.
