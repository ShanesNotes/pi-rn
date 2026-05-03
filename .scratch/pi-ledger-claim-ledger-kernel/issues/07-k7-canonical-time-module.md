# K7 canonical time Module for Claim, Ledger, and Query

Status: needs-triage
Type: AFK

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

- [ ] Starts with failing Rust tests proving K1 currently accepts non-canonical Claim timestamps that K5 would reject later.
- [ ] Adds `pi-ledger/crates/ledger-core/src/time.rs` and exposes it from `ledger-core` with the minimal `pub mod time;` surface.
- [ ] The time Module owns an owned canonical UTC timestamp value with parsing, `as_str()`, ordering/comparison, and deterministic rejection of non-canonical forms.
- [ ] The time Module owns a valid-time expression rule for exactly one canonical UTC instant or one canonical UTC interval with `start <= end`.
- [ ] K1 Claim validation rejects non-canonical `time.valid.instant`, `time.valid.interval.start`, `time.valid.interval.end`, and `time.recorded_at`.
- [ ] K3 Append ledger rejects non-canonical store-assigned accepted times before creating a Ledger entry or mutating ledger state.
- [ ] K5 point reads reuse the shared time Module and preserve existing valid-time / known-time behavior, including before/after correction visibility.
- [ ] `time.recorded_at` remains recorded provenance time and does not affect known-time visibility; only store-assigned accepted time controls known-time filtering.
- [ ] Claim, Ledger, and Query keep module-specific outer error context while mapping from shared time Module failures; no string-matching of time errors.
- [ ] `StoreClock` remains in the Append ledger Module as store authority and does not move into the time Module.
- [ ] No adapter-local normalization, timezone conversion, offset support, fractional-second support, leap-second support, current patient migration, `pi-chart` dependency, hidden `pi-sim` coupling, backend selection, or production clock is introduced.
- [ ] Existing K0-K6 behavior remains green, including the deterministic Phase 1 fixture corpus and K5 query semantics.
- [ ] Closeout records verification commands and evidence in this issue or final handoff.

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
