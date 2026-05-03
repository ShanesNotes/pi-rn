# Bitemporal correction projection proof

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

8, 10, 17, 18, 19, 27, 29

## What to build

Extend the read projection proof to preserve append-only correction semantics and valid-time/known-time separation. The completed slice should show that chart projections can represent corrected ledger facts without destructive mutation or future-knowledge leakage.

## Acceptance criteria

- [ ] Starts with failing tests using synthetic ledger fixtures that contain an original claim and a correction claim.
- [ ] Verifies that a view at an earlier known time does not include later accepted corrections.
- [ ] Verifies that a view at a later known time can show the correction while preserving the prior claim's id/hash lineage.
- [ ] Verifies valid time and accepted known time remain distinct in chart-visible projection output.
- [ ] Does not erase, mutate, or hide prior claims to represent corrections.
- [ ] Does not introduce current-patient migration, direct agent writes, FHIR/openEHR export, or production backend assumptions.

## Blocked by

- `.scratch/pi-ledger-claim-ledger-kernel/issues/05-k5-bitemporal-read.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/07-chart-projection-read-model-proof.md`

## Closeout commands

```bash
cd pi-ledger && cargo test --workspace
cd pi-chart && npm test
cd pi-chart && npm run typecheck
cd pi-chart && npm run check
```
