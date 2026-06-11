# Adapter-facing error vocabulary consistency

Status: completed
Type: AFK

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Align error vocabulary for adapter-facing diagnosis so failures can be explained consistently without flattening module-local ownership.

A future Adapter should be able to tell whether a Claim failed structural validation, canonical time validation, hash parsing, Predicate policy, patient-scope admission, revision-target admission, append-chain validation, or Query/rebuild assumptions.

## Acceptance criteria

- [x] Inventories current public or near-public error categories across Claim, time, hash, Predicate, Admission, Ledger, and Query modules.
- [x] Defines a small consistent vocabulary for "what failed / where / why" in docs and, if useful, tests.
- [x] Preserves module-local error ownership instead of creating one generic catch-all ledger error.
- [x] Adds tests for error classification where behavior is adapter-facing, avoiding brittle full-string matching.
- [x] Does not change successful append, admission, revision, Query, or rebuild behavior.
- [x] Does not add chart-specific error types or UI copy.
- [x] Records closeout verification commands and evidence.

## Blocked by

- `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md` (completed)
- `03-admission-proof-lifecycle-naming-and-clinician-readable-docs.md` (ready-for-human; vocabulary docs do not require admission doc rename)

## User stories covered

PRD stories 1, 2, 7, 9, 10, 11, and 14.

## Comments

- 2026-06-11: Added `adapter_diagnosis::FailureLayer` plus `*_error_layer` classifiers and `pi-ledger/docs/adapter-facing-errors.md`. Unit tests classify variants by layer without full-string matching.
- Closeout: `cd pi-ledger && cargo test -p ledger-core adapter_diagnosis --features ledger-core/test-support` — pass; full workspace test suite pass.