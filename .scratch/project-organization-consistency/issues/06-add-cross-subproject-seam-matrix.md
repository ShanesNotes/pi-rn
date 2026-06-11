# Add cross-subproject seam matrix

Status: completed
Type: AFK

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Add or update a concise seam matrix that lists each subproject, owned domain truth, allowed consumers, forbidden consumers, durable authority docs, and verification entrypoints.

## Acceptance criteria

- [x] Matrix includes `pi-sim`, `pi-monitor`, `pi-chart`, and `pi-agent`.
- [x] Matrix states that `pi-sim/vitals/README.md` plus `.lanes.json` are public telemetry authority.
- [x] Matrix states that `pi-monitor` is display-only and does not write chart truth.
- [x] Matrix states that `pi-chart` owns chart/EHR truth and consumes simulator telemetry only through explicit adapters.
- [x] Matrix states that `pi-agent` may consume only mounted/exposed clinical/public surfaces.
- [x] Matrix links to existing contexts/ADRs instead of duplicating full decisions.

## Blocked by

- `.scratch/project-organization-consistency/issues/01-lock-work-surface-interface.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed by adding `CONTEXT-MAP.md` → `## Seam matrix`. Verification script confirmed all four Modules, public telemetry authority, monitor display-only/no chart writes, chart explicit adapters, and agent exposed-surface constraint.
