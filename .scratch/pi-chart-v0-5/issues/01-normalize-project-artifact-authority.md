# Normalize project artifact authority

Status: completed

## Parent

`.scratch/pi-chart-v0-5/PRD.md`

## What to build

Make the markdown authority model consistent with Matt skills: `.scratch` for active PRDs/issues, `docs/adr/` for accepted decisions, `.omx` for runtime lineage, and legacy planning docs as evidence unless cited.

## Acceptance criteria

- [x] Root workflow docs say active work uses `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`.
- [x] `pi-chart/docs/planning/v0.5/README.md` points to `.scratch/pi-chart-v0-5/` as the active work surface.
- [x] Active V0.5 docs use `pi-chart/docs/adr/` for accepted ADR authority.
- [x] Root `PLANNING.md` is clearly bannered as historical/transitional, not current authority.
- [x] `pi-chart/docs/plans/README.md` is clearly bannered as legacy/promoted planning evidence.

## Blocked by

None - can start immediately.

## Comments

- 2026-06-11: Closed. `README.md` and `CONTEXT-MAP.md` now route active work through `.scratch`; `PLANNING.md`, `pi-chart/docs/plans/README.md`, and `pi-chart/docs/planning/v0.5/README.md` already carried correct banners and authority pointers.