# Brownfield claim-ledger reconciliation

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

11, 12, 13, 20, 30

## What to build

Inventory any chart-local claim-ledger prototype work and classify it as lineage archive, golden-vector evidence, deletion candidate, or future adapter evidence. This slice prevents the codebase from carrying two competing ledger kernels while avoiding destructive cleanup before adapter direction is triaged.

## Acceptance criteria

- [x] Adds a brownfield reconciliation note under `.scratch/pi-chart-pi-ledger-adapter-strategy/`.
- [x] Classifies chart-local claim-ledger files or artifacts into: archive/lineage, golden-vector evidence, deletion candidate, future adapter evidence, or unrelated.
- [x] Explains why `pi-chart` source is not the canonical cryptographic kernel home after ADR 020 and `pi-ledger` ADR 001.
- [x] Does not delete, move, or edit chart-local prototype source in this slice.
- [x] Does not treat current patient fixtures, schemas, or `EventEnvelope` compatibility as kernel authority.
- [x] Produces follow-up recommendations that can become later cleanup issues after the adapter mechanism is selected.

## Blocked by

None - can start immediately.

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart/src pi-chart/schemas pi-chart/patients
```


## Comments

- Docs-only scratch update completed on 2026-05-03. Status remains `needs-triage` because this tracker has no separate done label and downstream promotion still requires maintainer triage.
