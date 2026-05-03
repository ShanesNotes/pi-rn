# Banner stale planning surfaces before archive

Status: ready-for-human
Type: HITL

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Inventory high-risk stale planning surfaces that a fresh agent may misread as current authority, then add or propose short banners that point back to current work-surface rules. Archive/move decisions remain separate follow-ups.

## Acceptance criteria

- [ ] Inventory includes root `PLANNING.md`, subproject `docs/plans`, subproject `memos`, and historical `.omx/plans` references that are visible from tracked docs.
- [ ] Each candidate is classified as keep, banner, archive-later, or no-action.
- [ ] Banner text points to `CONTEXT-MAP.md`, `docs/agents/work-surface.md`, relevant `CONTEXT.md`, accepted ADRs, or active `.scratch` PRDs/issues.
- [ ] No historical file is moved or deleted in this issue.
- [ ] HITL review is requested before any archive-later action is executed.

## Blocked by

- `.scratch/project-organization-consistency/issues/02-normalize-adr-style-audit.md` (completed 2026-05-03)
- `.scratch/project-organization-consistency/issues/03-polish-active-prd-and-issue-statuses.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Promoted to `ready-for-human` because the blocking ADR audit and `.scratch` polish are complete, but archive/banner decisions should remain HITL before moving or deleting historical planning surfaces.
