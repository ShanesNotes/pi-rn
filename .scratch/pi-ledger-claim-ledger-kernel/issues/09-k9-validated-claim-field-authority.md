# K9 Validated Claim field authority

Status: ready-for-human
Type: AFK
Resolution: implemented; merge/admin close pending human confirmation.

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

Related decisions:
- `pi-ledger/CONTEXT.md`
- `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md`
- `pi-ledger/docs/adr/002-canonical-utc-time-input-invariant.md`
- `pi-ledger/docs/adr/003-typed-hash-value-module.md`
- `pi-ledger/docs/adr/004-validated-claim-field-authority.md`

## What to build

Deepen `ValidatedClaim` into the kernel authority for extracting stable Claim fields after K1 structural and canonicalizability validation succeeds.

This slice should preserve K0-K8 behavior while reducing duplicated raw Claim JSON interpretation in validation-adjacent paths. A Ledger-acceptable Claim should expose its id, shape, predicate, patient id, valid time, recorded time, revision target, and raw record through `ValidatedClaim` accessors backed by values captured during validation.

## Acceptance criteria

- [x] Starts with failing Rust tests proving `ValidatedClaim` exposes accessors for id, shape, predicate, patient id, valid time, recorded time, optional revision target, and raw record.
- [x] Starts with failing Rust regression tests proving Ledger append/patient-scope logic and Predicate validation can consume `ValidatedClaim` accessors instead of re-reading the same fields from raw Claim JSON.
- [x] Introduces a small revision-target value returned from `ValidatedClaim::revision_target()` that carries target id plus typed `RecordHash` without exposing a raw hash validator.
- [x] `ValidatedClaim` accessors are backed by borrowed or typed values captured during validation rather than by repeated JSON pointer parsing in each accessor.
- [x] `validate_claim(value)` still performs the full K1 structural allowlist, K7 canonical time validation, K8 hash validation for correction targets, and canonicalizability check.
- [x] `ValidatedClaim` exposes at least: `raw()`, `id()`, `shape()`, `predicate()`, `patient_id()`, `valid_time()`, `recorded_at()`, and `revision_target()`.
- [x] `ledger.rs` append and patient-scope checks use a `ValidatedClaim` from one validation pass rather than calling `validate_claim` and then separately re-reading `/subject/patientId` from raw JSON.
- [x] `predicates.rs` validation accepts or consumes `ValidatedClaim` for predicate id, shape, and object access where validation has already occurred.
- [x] Query keeps its narrow trusted-entry read path unless a small accessor adoption is natural; K9 must not force full Claim revalidation inside point reads.
- [x] No broad public raw `ClaimView` is introduced as the primary Claim field API.
- [x] No new wrapper/newtype explosion for every string field is introduced unless directly needed by tests; prefer borrowed strings plus existing typed `ClaimShape`, `CanonicalTimestamp`, `ValidTimeExpression`, and `RecordHash`.
- [x] No changes to Claim JSON shape, four-shape allowlist, predicate policy, time semantics, hash semantics, append-chain semantics, bitemporal query semantics, fixture payloads, storage backend, signatures/key management, `pi-chart` adapters, hidden `pi-sim` internals, or production backend are introduced.
- [x] Existing K0-K8 tests remain green, including canonical golden vectors, K3 chain validation/rebuild, K4 predicate validation, K5 correction visibility, K6 fixture proof, K7 canonical time, and K8 typed hash behavior.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K0-K8 are complete, and ADR 004 records the Validated Claim field authority decision.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git diff --check
git status --short
```

## Guardrail application

- Protects: Ledger-acceptable Claim boundary, patient-scope validation, predicate validation consistency, correction target identity, and adapter/kernel separation.
- Source: `pi-ledger` CONTEXT; ADR 001; ADR 002; ADR 003; ADR 004; K1 Claim validation tests; K3 patient-scope tests; K4 predicate registry tests; K8 typed hash tests.
- Not imported: public raw Claim view as primary authority, `pi-chart` source/patient directories, hidden `pi-sim` internals, FHIR/openEHR model commitments, signatures/key management, storage backend, CAS/blockchain anchoring, access-plane/runtime/orchestrator policy.

## Implementation notes

- Prefer extending `claim.rs` and `ValidatedClaim<'a>` before creating new modules.
- A revision target may be a small struct in `claim.rs`; keep it narrowly scoped to id plus `RecordHash`.
- It is acceptable for `ValidatedClaim::raw()` and object access needed by Predicate validation to expose the raw `serde_json::Value` after validation; the goal is to centralize stable field extraction, not hide the full JSON record.
- Keep `query.rs` changes minimal. Its trust boundary already says entries must come from a validated ledger/snapshot; K9 does not need to revalidate every point-read entry.
- Expected code touch scope: `pi-ledger/crates/ledger-core/src/claim.rs`, `ledger.rs`, `predicates.rs`, `lib.rs` only if needed, and this issue closeout section. Touch `query.rs` only for a small natural accessor adoption with tests.
- Do not edit `pi-chart`, `pi-sim`, `pi-agent`, generated design artifacts, overview HTML files, or unrelated `.scratch` workstreams.

## Closeout evidence

- Baseline before K9 source edits: `cd pi-ledger && cargo test --workspace` — PASS, 97 tests.
- Red evidence: `cd pi-ledger && cargo test -p ledger-core t_k9 -- --nocapture` initially failed to compile because `ValidatedClaim` lacked `predicate()`, `patient_id()`, `valid_time()`, `recorded_at()`, and `revision_target()`; `AppendLedger` lacked `append_validated`; and `PredicateRegistry` lacked `validate_validated_claim`.
- Green focused evidence: `cd pi-ledger && cargo test -p ledger-core t_k9 -- --nocapture` — PASS, 6 tests.
- Implementation evidence:
  - `claim.rs` now captures predicate, patient id, object, canonical valid time, recorded time, and optional revision target during `validate_claim`.
  - `RevisionTarget` carries target id plus typed `RecordHash`.
  - `ledger.rs` appends and validates patient scope through `ValidatedClaim`; `append(&Value)` validates once and delegates to `append_validated(&ValidatedClaim)`.
  - `predicates.rs` exposes `validate_validated_claim(&ValidatedClaim)` and uses validated predicate, shape, and object accessors.
  - `query.rs` was not changed; point reads keep the trusted-entry path.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 103 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git diff --check` — PASS.
  - `git status --short` — checked before commit; only K9 files staged, with unrelated dirty/untracked files preserved.
- Manual confirmations:
  - No broad public raw `ClaimView` introduced.
  - No changes to Claim JSON shape, four-shape allowlist, predicate policy, time semantics, hash semantics, append-chain semantics, bitemporal query semantics, fixture payloads, storage backend, signatures/key management, `pi-chart`, hidden `pi-sim`, or production backend.
