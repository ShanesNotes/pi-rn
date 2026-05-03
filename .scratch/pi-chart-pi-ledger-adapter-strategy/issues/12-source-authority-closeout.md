# Source-authority closeout

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

1, 2, 21, 22, 23, 25, 30

## What to build

Close the adapter-strategy planning lane by updating durable source-authority surfaces so future agents know which adapter issues are active, which are deferred, and how they relate to the accepted `pi-ledger` ownership decision.

## Acceptance criteria

- [ ] Updates the workstream root with a concise issue index and promotion rules for future adapter implementation.
- [ ] Updates only appropriate source-authority docs if needed so `pi-chart` remains the adapter/consumer and `pi-ledger` remains the kernel owner.
- [ ] Marks external FHIR/openEHR export planning as separate from this internal adapter seam.
- [ ] Records that adapter implementation issues remain `needs-triage` until upstream kernel blockers and HITL decisions are resolved.
- [ ] Captures any obsolete chart-local ledger implementation references as superseded or lineage evidence rather than active authority.
- [ ] Does not edit accepted ADRs unless a separate ADR issue explicitly authorizes it.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/01-adapter-readiness-gate.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-kernel-consumer-contract-inventory.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/03-brownfield-claim-ledger-reconciliation.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/04-integration-mechanism-decision.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/05-ledger-golden-vector-compatibility-harness.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/06-readonly-claim-translation-proof.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/07-chart-projection-read-model-proof.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/08-bitemporal-correction-projection-proof.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/09-adapter-negative-boundary-tests.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/10-write-authority-deferral-gate.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/11-archived-package-retargeting.md`

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy CONTEXT-MAP.md pi-chart/CONTEXT.md pi-chart/docs/architecture/source-authority.md pi-ledger/CONTEXT.md
```
