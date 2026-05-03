# Adapter readiness gate

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

1, 2, 21, 22, 23, 25

## What to build

Create the planning gate that decides when `pi-chart` ↔ `pi-ledger` adapter work can move from strategy into implementation. This slice should give future agents a deterministic go/no-go checklist without touching product source or competing with the active `pi-ledger` K1-K6 kernel chain.

## Acceptance criteria

- [x] Adds a readiness-gate note under `.scratch/pi-chart-pi-ledger-adapter-strategy/` that names the exact kernel evidence required before adapter implementation can be promoted.
- [x] Requires `pi-ledger` K0-K6 completion evidence, including stable id/hash behavior, minimal Claim validation, append metadata, predicate registry behavior, bitemporal reads, and deterministic synthetic fixtures.
- [x] States that adapter implementation issues remain `needs-triage` until a maintainer explicitly promotes them after reviewing kernel interface evidence.
- [x] Separates internal `pi-chart` ↔ `pi-ledger` integration from external FHIR/openEHR/export boundary work.
- [x] Repeats the no-hidden-`pi-sim`, no-current-patient-migration, no-direct-agent-accepted-write guardrails.
- [x] Does not edit `pi-chart/src/`, `pi-ledger/crates/`, schemas, patients, package archives, accepted ADRs, or lockfiles.

## Blocked by

None - can start immediately.

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart pi-ledger
```


## Comments

- Docs-only scratch update completed on 2026-05-03. Status remains `needs-triage` because this tracker has no separate done label and downstream promotion still requires maintainer triage.
