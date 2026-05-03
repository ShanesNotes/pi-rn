# Archived package retargeting

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

18, 19, 20, 24, 25

## What to build

Reconcile archived research-package implications after the ownership move to `pi-ledger`. The completed slice should tell future agents which package-derived ideas target `pi-ledger`, which target the chart adapter, and which remain deferred or rejected.

## Acceptance criteria

- [ ] Adds an adapter-specific package retargeting note under `.scratch/pi-chart-pi-ledger-adapter-strategy/` or updates an existing workstream note without moving package archives.
- [ ] Maps relevant future-package concepts such as ContextPacket, access plane, runtime/orchestrator, external export, and direct agent writes to `pi-ledger`, `pi-chart` adapter, downstream work, or rejected/deferred status.
- [ ] Explicitly states that archived packages are evidence only, not implementation authority.
- [ ] Retargets assumptions away from chart-local claim-ledger ownership and toward `pi-ledger` primitives plus chart adapter surfaces.
- [ ] Does not create implementation issues for downstream packages unless separately requested.
- [ ] Does not edit package archives, accepted ADRs, product source, schemas, patients, or lockfiles.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-kernel-consumer-contract-inventory.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/03-brownfield-claim-ledger-reconciliation.md`

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart/memos pi-chart/docs/adr pi-ledger
```
