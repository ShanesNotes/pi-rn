# K12 public append Interface quarantines Admission bypass

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
- `pi-ledger/docs/adr/006-revision-admission-proves-correction-target-existence.md`
- `pi-ledger/docs/adr/007-admission-bypass-is-test-only.md`

## What to build

Deepen the public append Interface so future adapters cannot depend on the lower-level **Admission bypass**.

K10 and K11 made normal append behavior safe by requiring **Append-admissible Claims** for base Claims and **Revision-admissible Claims** for correction Claims. The remaining bypass method is loudly named, but it is still public on `AppendLedger`, so an external crate or future adapter can still call it. K12 should remove that method from the public crate Interface while preserving the minimal test-only power needed to build trusted-entry fixtures and negative/corrupt-ledger tests.

The safe public append paths should remain:

- `AppendLedger::append_admissible(&AppendAdmissibleClaim)` for base Claims;
- `AppendLedger::append_revision_admissible(&RevisionAdmissibleClaim)` for correction Claims;
- `AppendLedger::from_snapshot(snapshot)` for rebuilding trusted ledger history through chain/head validation.

Any lower-level bypass append support should compile only for tests and should be visible only inside the crate as `#[cfg(test)] pub(crate)` support close to the Append ledger Implementation it mutates.

## Acceptance criteria

- [x] Starts with a failing public-Interface/source guard proving `pub fn append_without_predicate_or_revision_admission` is currently exposed from production `ledger.rs`.
- [x] Starts with behavior coverage proving external/public append examples can append base Claims only through Append admission.
- [x] Starts with behavior coverage proving external/public append examples can append correction Claims only through Revision admission.
- [x] Does not add a compile-fail test dependency such as `trybuild` unless one already exists in the workspace.
- [x] Removes `AppendLedger::append_without_predicate_or_revision_admission` from the production public crate Interface.
- [x] Keeps the internal implementation helper used by safe append paths private to `AppendLedger` production code.
- [x] Preserves lower-level bypass append capability only under test compilation, as `#[cfg(test)] pub(crate)` support or an equivalently crate-private test-only method.
- [x] Any remaining test-only bypass name loudly states the omitted admission checks, including predicate and revision admission.
- [x] Existing ledger unit tests that intentionally need bypass construction use the test-only crate-private helper.
- [x] Query tests that intentionally need trusted-entry or corrupt-entry setup continue to work through test-only crate-private support without making Query an admission authority.
- [x] Normal fixtures and examples continue to use Append admission for base Claims and Revision admission for correction Claims.
- [x] Integration tests or public-surface tests do not call or rely on any bypass append method.
- [x] K12 source guard fails if a production `pub fn append_without_predicate_or_revision_admission` reappears.
- [x] K12 does not refactor Query revision-target parsing, share Revision admission internals with Query, or make Query validate target existence.
- [x] K12 does not implement correction conflict handling, replacement policy, clinical visibility requirements, graph-wide correction semantics, registry versioning/re-audit, storage backend work, chart adapters, current patient migration, or hidden simulator coupling.
- [x] Existing K0-K11 behavior remains green, including canonical golden vectors, chain validation/rebuild, predicate validation, point reads/correction visibility, fixture proof, canonical time, typed hashes, Validated Claim accessors, Append admission, and Revision admission.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K0-K11 are complete, and ADR 007 records the public Interface decision.

## User stories covered

- PRD stories 16-17, 25-34, especially public append Interface safety, bypass quarantine before adapter work, fixture-path safety, and preserving Query/Ledger trust boundaries.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git diff --check
git status --short
```

## Guardrail application

- Protects: Append admission authority, Revision admission authority, adapter-facing kernel Interface, patient-scoped ledger admission, deterministic store metadata assignment, fixture safety, Query trust boundary, and adapter/kernel separation.
- Source: `pi-ledger` CONTEXT; ADR 001; ADR 002; ADR 003; ADR 004; ADR 005; ADR 006; ADR 007; K10 Append admission tests; K11 Revision admission tests.
- Not imported: chart source or patient directories, hidden simulator internals, FHIR/openEHR commitments, signatures/key management, CAS/blockchain anchoring, storage backend selection, access-plane/runtime/orchestrator policy, predicate registry versioning, correction graph semantics, or Query projection redesign.

## Implementation notes

- Prefer a minimal Interface cleanup over a feature expansion.
- Keep safe append paths public and unchanged unless tests prove a narrower signature is required.
- Keep the private production helper that actually appends raw records available only to safe append methods.
- Move or gate the current public bypass to `#[cfg(test)] pub(crate)`; do not expose a public test module for adapters.
- A lightweight source guard is acceptable for the public-Interface regression because the workspace has no compile-fail harness today.
- Expected code touch scope: `pi-ledger/crates/ledger-core/src/ledger.rs`, unit tests in `ledger.rs` and `query.rs`, and at most a new integration/source-guard test under `pi-ledger/crates/ledger-core/tests/` if needed.
- Do not edit `pi-chart`, `pi-sim`, `pi-agent`, generated design artifacts, overview HTML files, or unrelated `.scratch` workstreams.

## Closeout evidence

- Baseline before K12 source edits: `cd pi-ledger && cargo test --workspace` — PASS, 118 tests.
- Red basis: current production `ledger.rs` exposed `pub fn append_without_predicate_or_revision_admission`; the new `k12_public_source_guard_keeps_admission_bypass_out_of_production_interface` guard is written to fail on that production public signature.
- Focused K12 evidence: `cd pi-ledger && cargo test -p ledger-core k12 -- --nocapture` — PASS, 3 public-interface tests.
- Implementation evidence:
  - Changed `AppendLedger::append_without_predicate_or_revision_admission` to `#[cfg(test)] pub(crate)` so it is available only to crate-internal tests.
  - Kept the private production append helper available to the safe public append APIs.
  - Added `pi-ledger/crates/ledger-core/tests/public_append_interface.rs` with a source guard and public examples for base Append admission and correction Revision admission.
  - Updated adapter-strategy issue 02 to require K12 before consumer-contract inventory documents the post-bypass public Interface.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 121 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git diff --check` — PASS.
  - `git status --short -- pi-ledger .scratch/pi-ledger-claim-ledger-kernel .scratch/pi-chart-pi-ledger-adapter-strategy` — checked; K12 touched `ledger.rs`, new public interface test file, this issue, and adapter issue 02 prerequisite note; pre-existing untracked `pi-ledger/docs/k0-overview.html` and `pi-ledger/docs/k2-overview.html` remain unrelated.
- Manual confirmations:
  - No Query revision-target parsing refactor.
  - No Query admission authority.
  - No correction conflict handling, replacement policy, clinical visibility requirements, graph-wide correction semantics, registry versioning/re-audit, storage backend work, chart adapters, current patient migration, or hidden simulator coupling.
  - No compile-fail dependency added.
- Ralph review/cleanup:
  - Architect verification — APPROVE, no blockers.
  - Changed-file deslop pass — no cleanup edits required; `bypass` terms are intentional K12 domain vocabulary and test `unwrap()` calls are assertion setup.
  - Post-deslop regression re-run: `cargo fmt --all -- --check`, `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, and `git diff --check` — PASS.
  - Build check: `cd pi-ledger && cargo build --workspace` — PASS.
