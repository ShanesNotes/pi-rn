# Milestones and README scratch routing

Status: completed

## Parent

`.scratch/pi-sim-rebase-grounding/PRD.md`

## What to build

Reconcile `pi-sim/docs/MILESTONES.md` and any remaining pi-sim entry docs so M-series lineage is historical evidence and next implementation-adjacent lanes route through `.scratch/<feature>/` rather than `.omx/plans/` as the active work queue.

## Acceptance criteria

- [x] `docs/MILESTONES.md` names `.scratch` as the promotion target for new active work.
- [x] M5/M6/M7 rows cite `.scratch` lanes where they exist (public contract lock, monitor ingest depth) without implying `.omx/plans/` is the issue tracker.
- [x] `pi-sim/README.md` already routes through `CONTEXT-MAP.md`, `docs/agents/work-surface.md`, and `.scratch`; no regression.
- [x] No `pi-chart` internals modified.

## Blocked by

None.

## Comments

- 2026-06-11: Updated `pi-sim/docs/MILESTONES.md` M5/M6/M7 rows to cite `.scratch/pi-sim-public-telemetry-contract-lock/` and `.scratch/pi-monitor-public-lane-ingest-depth/` as active lanes; `.omx/plans/` retained as historical lineage only.