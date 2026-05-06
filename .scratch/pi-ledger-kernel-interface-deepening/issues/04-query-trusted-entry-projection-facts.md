# Query trusted-entry projection facts

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Deepen Query around a small trusted-entry projection value or helper so Query does not repeatedly reinterpret Claim JSON for point-read facts after entries are already trusted.

This is a **Depth** and **Locality** cleanup. Query must remain a projection **Module**, not an Admission owner, not a Predicate registry owner, and not a chain/head validator.

## Acceptance criteria

- [ ] Starts with tests or source inventory showing the repeated trusted-entry fact extraction risk.
- [ ] Introduces the smallest useful projection helper/value for claim id, Valid time, revision target, and Record hash facts needed by Query.
- [ ] Keeps field authority aligned with Validated Claim rules where validation is required.
- [ ] Proves existing point-read behavior, Valid time / Known time behavior, and correction visibility remain unchanged.
- [ ] Does not make Query perform Append admission, Revision admission, Predicate policy, snapshot chain validation, or head validation.
- [ ] Does not import chart source, patient fixtures, generated artifacts, hidden simulator internals, or agent runtime code.
- [ ] Records closeout verification commands and evidence.

## Blocked by

- `02-deterministic-claim-fixture-locality-for-public-examples.md`
- `03-admission-proof-lifecycle-naming-and-clinician-readable-docs.md`

## User stories covered

PRD stories 5, 6, 7, 10, 11, and 13.
