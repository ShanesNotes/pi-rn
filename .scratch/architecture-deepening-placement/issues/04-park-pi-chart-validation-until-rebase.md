# Park pi-chart validation Module work until rebase closeout

Status: needs-triage
Type: AFK

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

Create a deferred parking artifact such as `.scratch/pi-chart-post-rebase-validation-module-audit/PRD.md` that records the whole-chart validation Module candidate without creating implementation issues tied to current `pi-chart` code.

The artifact should capture the rebase dependency and the acceptance gate: do not slice implementation work until the parallel `pi-chart` rebase closeout names stable validation owners, files, Interfaces, and verification commands.

## Acceptance criteria

- [ ] A deferred parking artifact exists under `.scratch/pi-chart-post-rebase-validation-module-audit/`.
- [ ] The artifact states that current `pi-chart` file references are historical candidate evidence only, not actionable implementation targets.
- [ ] The artifact creates no implementation issues against current `pi-chart` code.
- [ ] The artifact names the unblocker: post-rebase closeout must publish stable chart validation owners, files, Interfaces, and verification commands.
- [ ] The artifact preserves chart truth ownership and clinician/user validation constraints.

## Blocked by

- Parallel `pi-chart` deep rebase closeout.

## Comments

- 2026-05-03: Seeded from `.omx/plans/ralplan-architecture-deepening-artifact-placement.md`. This parking lane exists to prevent stale, code-coupled issue slices from racing the rebase.
