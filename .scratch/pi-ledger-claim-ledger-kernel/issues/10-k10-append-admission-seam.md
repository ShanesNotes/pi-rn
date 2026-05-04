# K10 append admission seam for predicate-aware appends

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
- `pi-ledger/docs/adr/005-append-admission-separates-predicate-policy.md`

## What to build

Deepen the append path so normal ledger entry creation consumes an **Append-admissible Claim** rather than raw JSON or a merely Validated Claim.

A Ledger-acceptable Claim remains the K1/K7/K8 boundary: structurally valid, canonicalizable, and hashable. An Append-admissible Claim is stricter: a `ValidatedClaim` proven eligible for a specific patient-scoped ledger after patient-scope and predicate-registry policy pass.

This slice should introduce a small admission seam that composes Claim validation authority, target patient scope, and Predicate registry policy before the Append ledger assigns accepted-time metadata, sequence, batch id, record hash, entry hash, previous-entry link, and head hash. The Append ledger must not silently own a `PredicateRegistry`; predicate policy remains explicit at admission time.

## Acceptance criteria

- [x] Starts with failing Rust tests proving a structurally valid, canonicalizable, hashable, patient-scoped Claim with an unregistered predicate can currently bypass Predicate registry policy through the append path.
- [x] Starts with failing Rust tests proving fixture or representative append examples do not yet use an explicit Append-admissible Claim path.
- [x] Adds an admission Module exposed from `ledger-core` with the minimal public surface needed for K10.
- [x] Admission exposes an `AppendAdmissibleClaim<'a>` value representing a `ValidatedClaim` admitted for one target patient ledger.
- [x] Admission exposes an `AdmissionError` boundary that preserves narrower module authority instead of flattening everything into Ledger errors.
- [x] `AdmissionError` wraps Predicate registry failures and owns patient-scope mismatch with both target ledger patient id and Claim patient id available to callers/tests.
- [x] Admission consumes `&ValidatedClaim`, a target ledger patient id, and `&PredicateRegistry`; it does not consume raw JSON.
- [x] Admission rejects target-patient mismatch before append metadata is assigned and before store-clock state is consumed.
- [x] Admission rejects unregistered predicates through wrapped Predicate registry errors.
- [x] Admission rejects predicate shape/object policy failures through wrapped Predicate registry errors.
- [x] Admission accepts seeded Phase 1 valid Claims when target patient id and Predicate registry policy match.
- [x] `AppendLedger` exposes a preferred append API that consumes an `AppendAdmissibleClaim` and preserves existing K3 append semantics.
- [x] The preferred append API still assigns store-authority metadata, computes/stores typed Record hash and Entry hash values, updates previous-entry/head links, and validates patient-local sequence behavior as before.
- [x] Public or test-visible lower-level append seams no longer look like normal safe append paths; if one remains, its name explicitly includes `without_predicate_admission` or equivalent bypass language.
- [x] Normal fixture generation uses the admission path with the seeded Predicate registry rather than manually validating and then calling a raw append bypass.
- [x] Representative ledger tests that append valid Claims use the admission path unless the test is explicitly proving the lower-level bypass seam.
- [x] Snapshot re-read/head validation remains independent of the current Predicate registry and does not require registry versioning.
- [x] K5 point reads keep their trusted-entry boundary and do not start revalidating every Claim through admission.
- [x] K10 does not implement raw JSON validate-and-admit convenience helpers; that adapter convenience remains deferred until needed.
- [x] K10 does not implement correction target existence checks, correction conflict policy, replacement policy, predicate registry versioning, storage backend work, production clocks, signatures, key management, chart adapters, current patient migration, or hidden simulator coupling.
- [x] Existing K0-K9 behavior remains green, including canonical golden vectors, K3 chain validation/rebuild, K4 predicate validation, K5 correction visibility, K6 fixture proof, K7 canonical time, K8 typed hash behavior, and K9 Validated Claim accessors.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K0-K9 are complete, and ADR 005 records the append-admission decision.

## User stories covered

- PRD stories 13-24, especially predicate-aware append admission, patient-scope enforcement before store metadata, explicit bypass naming, fixture-path safety, and preserving snapshot/query trust boundaries.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git diff --check
git status --short
```

## Guardrail application

- Protects: Predicate policy at append entry, patient-scoped ledger admission, append-chain storage authority, deterministic store metadata assignment, typed hash boundaries, and adapter/kernel separation.
- Source: `pi-ledger` CONTEXT; ADR 001; ADR 002; ADR 003; ADR 004; ADR 005; K3 append-chain tests; K4 predicate registry tests; K9 Validated Claim accessor tests.
- Not imported: chart source or patient directories, hidden simulator internals, FHIR/openEHR commitments, signatures/key management, CAS/blockchain anchoring, storage backend selection, access-plane/runtime/orchestrator policy, predicate registry versioning, or correction graph semantics.

## Implementation notes

- Prefer a small `admission` Module rather than spreading patient-scope plus predicate-policy composition across Ledger and Predicate modules.
- Keep `validate_claim` as the Ledger-acceptable Claim boundary. Admission should use `ValidatedClaim` rather than validate raw JSON itself.
- Keep Predicate registry ownership in the Predicate module; admission should call the registry, not duplicate predicate checks.
- Keep Append ledger ownership over store-authority metadata and hash-chain mutation. Admission should prove eligibility, not construct ledger entries.
- It is acceptable for the append ledger to retain a narrowly named lower-level internal or test seam for chain construction, but the name must make predicate-admission bypass explicit.
- Expected code touch scope: `pi-ledger/crates/ledger-core/src/admission.rs`, `lib.rs`, `ledger.rs`, `fixture.rs`, and tests that currently append through the old path. Touch `claim.rs`, `predicates.rs`, or `query.rs` only for small API wiring required by the admission seam.
- Do not edit `pi-chart`, `pi-sim`, `pi-agent`, generated design artifacts, overview HTML files, or unrelated `.scratch` workstreams.

## Closeout evidence

- Baseline before K10 source edits: `cd pi-ledger && cargo test --workspace` — PASS, 103 tests.
- Red evidence: after adding K10 tests, `cd pi-ledger && cargo test -p ledger-core t_k10 -- --nocapture` failed because `crate::admission` was not exposed, `AppendLedger::append_admissible` did not exist, and the explicit `append_without_predicate_admission` bypass seam did not exist.
- Green focused evidence: `cd pi-ledger && cargo test -p ledger-core t_k10 -- --nocapture` — PASS, 6 tests.
- Implementation evidence:
  - Added `ledger-core::admission` with `AppendAdmissibleClaim<'a>` and `AdmissionError`.
  - `AppendAdmissibleClaim::admit(&ValidatedClaim, target_patient_id, &PredicateRegistry)` checks patient scope and wraps predicate-registry policy failures without accepting raw JSON.
  - Replaced the normal append entry point with `AppendLedger::append_admissible(&AppendAdmissibleClaim)`.
  - Renamed the lower-level validated-claim append bypass to `append_without_predicate_admission`.
  - Updated fixture generation to validate, admit with the seeded Phase 1 registry, then append admissible Claims.
  - Updated ledger tests to use the admission path for representative valid appends.
  - Updated query test helpers only as needed to use the explicit lower-level bypass and preserve the trusted-entry point-read boundary.
  - Snapshot re-read still uses `AppendLedger::from_snapshot(snapshot)` without any Predicate registry.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 109 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git diff --check` — PASS.
  - `git status --short` — checked before commit; only K10 files staged, with unrelated dirty/untracked files preserved.
- Manual confirmations:
  - No raw JSON validate-and-admit helper introduced.
  - No correction target existence/conflict policy, replacement policy, predicate registry versioning, storage backend work, production clock work, signature/key-management work, chart adapter/current-patient migration, or hidden simulator coupling introduced.
  - No `pi-chart`, `pi-sim`, `pi-agent`, generated design artifact, overview HTML, or unrelated scratch changes were staged for K10.
