# K7 canonical time Module for Claim, Ledger, and Query

Status: ready-for-human
Type: AFK
Resolution: implemented; merge/admin close pending human confirmation.

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

Related decisions:
- `pi-ledger/CONTEXT.md`
- `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md`
- `pi-ledger/docs/adr/002-canonical-utc-time-input-invariant.md`

## What to build

Deepen the kernel time rules into a dedicated `time` Module so Ledger-acceptable Claims, store-assigned known times, and bitemporal point reads all use the same canonical UTC timestamp and valid-time expression rules.

This slice should preserve the K5 decision to reject non-canonical timestamps rather than normalizing them. Consumer adapters normalize source-system timestamps before kernel entry; `pi-ledger` accepts only canonical UTC timestamps in `YYYY-MM-DDTHH:MM:SSZ` form.

## Acceptance criteria

- [x] Starts with failing Rust tests proving K1 currently accepts non-canonical Claim timestamps that K5 would reject later.
- [x] Adds `pi-ledger/crates/ledger-core/src/time.rs` and exposes it from `ledger-core` with the minimal `pub mod time;` surface.
- [x] The time Module owns an owned canonical UTC timestamp value with parsing, `as_str()`, ordering/comparison, and deterministic rejection of non-canonical forms.
- [x] The time Module owns a valid-time expression rule for exactly one canonical UTC instant or one canonical UTC interval with `start <= end`.
- [x] K1 Claim validation rejects non-canonical `time.valid.instant`, `time.valid.interval.start`, `time.valid.interval.end`, and `time.recorded_at`.
- [x] K3 Append ledger rejects non-canonical store-assigned accepted times before creating a Ledger entry or mutating ledger state.
- [x] K5 point reads reuse the shared time Module and preserve existing valid-time / known-time behavior, including before/after correction visibility.
- [x] `time.recorded_at` remains recorded provenance time and does not affect known-time visibility; only store-assigned accepted time controls known-time filtering.
- [x] Claim, Ledger, and Query keep module-specific outer error context while mapping from shared time Module failures; no string-matching of time errors.
- [x] `StoreClock` remains in the Append ledger Module as store authority and does not move into the time Module.
- [x] No adapter-local normalization, timezone conversion, offset support, fractional-second support, leap-second support, current patient migration, `pi-chart` dependency, hidden `pi-sim` coupling, backend selection, or production clock is introduced.
- [x] Existing K0-K6 behavior remains green, including the deterministic Phase 1 fixture corpus and K5 query semantics.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K0-K6 are complete, and ADR 002 records the canonical UTC time decision.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git status --short
```

## Guardrail application

- Protects: deterministic valid time / known time comparisons, Ledger-acceptable Claim hashability/queryability, adapter/kernel separation, and store authority over known time.
- Source: `pi-ledger` CONTEXT; ADR 001; ADR 002; K5 timestamp review decision; K6 fixture closeout.
- Not imported: adapter timestamp normalization, `pi-chart` source or patient directories, hidden `pi-sim` internals, production backend/clock, FHIR/openEHR/CAS commitments, access-plane/runtime/orchestrator work.

## Closeout evidence

- Baseline: `cd pi-ledger && cargo test --workspace` — PASS, 76 tests before K7 source edits.
- Red/green summary:
  - RED `claim::tests::t_k7_01_claim_validation_rejects_non_canonical_valid_time_that_query_would_reject` and `claim::tests::t_k7_01_claim_validation_rejects_non_canonical_recorded_at_provenance_time`: K1 accepted offset timestamps; GREEN after Claim validation reused the shared time Module.
  - RED `ledger::tests::t_k7_02_append_rejects_non_canonical_store_accepted_time_without_mutating_ledger`: ledger had no accepted-time error path and consumed the clock before validation; GREEN after append peeks, validates, and only consumes the `StoreClock` after entry construction succeeds.
  - RED `time::tests::t_k7_03_*`: initial timestamp/valid-time stub accepted offsets and ambiguous/unordered expressions; GREEN after `time.rs` owned canonical UTC timestamp parsing and valid-time expression containment.
  - REFACTOR K5: `query::point_read` now uses `CanonicalTimestamp` and `ValidTimeExpression`; invalid-entry tests mutate snapshots instead of appending now-invalid K1/K3 inputs.
- Additional behavior proof:
  - `claim::tests::t_k7_01_claim_validation_rejects_unordered_valid_intervals` proves `start <= end` at K1.
  - `ledger::tests::validation_rejects_non_canonical_accepted_time_in_stored_entry` proves persisted accepted metadata is reread under the same invariant.
  - `query::tests::t_k7_04_recorded_at_is_provenance_not_known_time_visibility` proves known-time filtering still uses store-assigned accepted time, not `time.recorded_at`.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 86 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git diff --check` — PASS.
  - `git status --short` — checked before commit; only K7 files staged for commit, with unrelated untracked files preserved.
- Manual confirmations:
  - No adapter-local normalization, timezone conversion, offset support, fractional seconds, or leap-second support.
  - No current patient migration, `pi-chart` dependency, hidden `pi-sim` coupling, backend selection, or production clock.
  - `StoreClock` remains in `ledger.rs`.
