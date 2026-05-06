# fixture export quarantine and Adapter API boundary tests

Status: ready-for-agent
Type: AFK
Source: `$code-review` WATCH item after Issue 01 review on 2026-05-06.
Adapter gate: must close before any `pi-chart` or other Adapter imports `ledger-core` as production-facing API.

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Harden the boundary between deterministic kernel fixtures and the future Adapter-facing `ledger-core` Interface.

The clinical safety goal is simple: sample/generated Claims are teaching props for tests and demos, not real clinical workflow building blocks. Future Adapters should not accidentally treat `ledger_core::fixture::*` as production API just because the Rust module is currently public.

Build the smallest boundary-hardening slice that proves default Adapter consumers cannot mistake fixture helpers or bypass seams for normal clinical-write paths.

This is a pre-adapter blocker. Do not start production Adapter implementation against `ledger-core` until this issue either quarantines fixture exports or records an explicit accepted alternative with equivalent boundary protection.

## Acceptance criteria

- [ ] Inventories the current public fixture/export surface, including `ledger_core::fixture`, generated IDs, `Phase1Fixture`, `phase1_fixture`, `fixture_observation_claim`, and `fixture_correction_claim`.
- [ ] Chooses and documents one minimal quarantine strategy before first Adapter work: feature-gated fixtures, a `ledger-core-test-support` crate, `#[doc(hidden)]` plus explicit non-semver wording, or an equivalent stronger boundary.
- [ ] Preserves deterministic public examples without teaching production Adapters to build clinical Claims through fixture helpers.
- [ ] Adds a compile/API boundary guard proving default production consumers cannot import fixture helpers as Adapter contract if the chosen strategy makes them non-default.
- [ ] Adds or preserves a guard proving Admission bypass append remains unavailable to production consumers.
- [ ] Keeps base Claims on Append admission and correction Claims on Revision admission in any examples that remain.
- [ ] Does not introduce a production Claim builder unless a failing test proves a public need.
- [ ] Does not add chart-specific types, chart patient fixtures, generated UI artifacts, hidden simulator details, or `pi-agent` runtime assumptions.
- [ ] Preserves existing canonicalization, hash, append, admission, revision, fixture, Query, and rebuild behavior.
- [ ] Records closeout verification commands and evidence.

## Blocked by

- `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md`
- `02-deterministic-claim-fixture-locality-for-public-examples.md`

## User stories covered

PRD stories 2, 3, 8, 10, 11, 12, 13, and 15.

## Review evidence

The Issue 01 and Issue 02 code reviews found no severity-rated code/spec/security issues, but both review cycles raised this architectural WATCH:

- `pi-ledger/crates/ledger-core/src/lib.rs` exports `pub mod fixture`.
- `pi-ledger/crates/ledger-core/src/fixture.rs` exposes generated constants, `Phase1Fixture`, `phase1_fixture`, `fixture_observation_claim`, and `fixture_correction_claim`.
- `pi-ledger/docs/ledger-core-public-interface.md` correctly says fixtures are not Adapter contracts.
- `pi-ledger/crates/ledger-core/tests/public_append_interface.rs` imports fixture helpers for public examples.

Risk: future Adapter agents may infer contract from public imports and examples instead of the intended safe Interface inventory.

Issue 02 was approved only as a fixture-locality slice with WATCH. Its safe examples may merge, but this quarantine issue remains the gate before adapter work.

## Suggested verification

- `cd pi-ledger && cargo fmt --all -- --check`
- `cd pi-ledger && cargo test --workspace`
- `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings`
- `cd pi-ledger && git diff --check`
