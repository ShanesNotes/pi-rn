# Seed public telemetry contract lock workstream

Status: needs-triage
Type: AFK

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Create the next workstream seed for the second-ranked deepening opportunity: a producer-owned public telemetry contract lock. This should prepare a dedicated `.scratch` PRD/issues lane, not implement schema changes yet.

## Acceptance criteria

- [x] A proposed `.scratch/pi-sim-public-telemetry-contract-lock/PRD.md` scope is drafted or linked.
- [x] The scope names `pi-sim/vitals/README.md` and `.lanes.json` as producer-side authority.
- [x] The scope names expected consumer checks for `pi-monitor` and future ingest without touching hidden `pi-sim` internals.
- [x] The scope defers `pi-rn/ingest/` until the ABI lock is accepted.
- [x] No public telemetry schema semantics are changed by this seed issue.

## Blocked by

- `.scratch/project-organization-consistency/issues/01-lock-work-surface-interface.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed seed by creating `.scratch/pi-sim-public-telemetry-contract-lock/PRD.md` plus four issues: authority inventory, README/manifest consistency checks, pi-monitor public consumer checks, and HITL ingest-readiness deferral. Only `.scratch` planning files were added; public telemetry schema semantics were not changed.
