# Adapter negative boundary tests

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

4, 13, 15, 21, 26, 28

## What to build

Add negative tests and boundary checks for the adapter seam so invalid ledger data, hidden simulator coupling, chart-patient fixture leakage, and external EHR vocabulary creep fail deterministically.

## Acceptance criteria

- [ ] Starts with failing tests for malformed ledger input, unsupported claim shape, missing id/hash identity, malformed time metadata, and unsupported correction mode.
- [ ] Verifies adapter errors are deterministic and explainable enough for AFK debugging.
- [ ] Adds a boundary check that fails if adapter implementation imports hidden `pi-sim` internals or treats current patient directories as adapter fixture authority.
- [ ] Adds a boundary check or test assertion that FHIR/openEHR shapes are not internal chart-ledger identity.
- [ ] Keeps checks narrow to the adapter seam; does not rewrite chart validation or kernel validation.
- [ ] Does not add net-new dependencies unless a later triage note explicitly justifies them.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/06-readonly-claim-translation-proof.md`

## Closeout commands

```bash
cd pi-ledger && cargo test --workspace
cd pi-chart && npm test
cd pi-chart && npm run typecheck
cd pi-chart && npm run check
```
