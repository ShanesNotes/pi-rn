# Query trusted-entry projection facts

Status: completed
Type: AFK

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Deepen Query around a small trusted-entry projection value or helper so Query does not repeatedly reinterpret Claim JSON for point-read facts after entries are already trusted.

This is a **Depth** and **Locality** cleanup. Query must remain a projection **Module**, not an Admission owner, not a Predicate registry owner, and not a chain/head validator.

## Acceptance criteria

- [x] Starts with tests or source inventory showing the repeated trusted-entry fact extraction risk.
- [x] Introduces the smallest useful projection helper/value for claim id, Valid time, revision target, and Record hash facts needed by Query.
- [x] Keeps field authority aligned with Validated Claim rules where validation is required.
- [x] Proves existing point-read behavior, Valid time / Known time behavior, and correction visibility remain unchanged.
- [x] Does not make Query perform Append admission, Revision admission, Predicate policy, snapshot chain validation, or head validation.
- [x] Does not import chart source, patient fixtures, generated artifacts, hidden simulator internals, or agent runtime code.
- [x] Records closeout verification commands and evidence.

## Blocked by

- `02-deterministic-claim-fixture-locality-for-public-examples.md` (completed)
- `03-admission-proof-lifecycle-naming-and-clinician-readable-docs.md` (ready-for-human; docs-only blocker lifted for projection helper)

## User stories covered

PRD stories 5, 6, 7, 10, 11, and 13.

## Comments

- 2026-06-11: Added `query::TrustedEntryFacts`, `query::trusted_entry_facts`, and `query::valid_time_expression`; refactored `point_read` to reuse them. Documented in `ledger-core-public-interface.md`.
- Closeout: `cd pi-ledger && cargo test -p ledger-core query:: --features ledger-core/test-support` — 13/13 pass; `cargo test --workspace --features ledger-core/test-support` — full suite pass.