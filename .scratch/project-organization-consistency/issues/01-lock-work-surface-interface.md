# Lock project work-surface interface

Status: completed
Type: AFK

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Make the root work-surface interface explicit enough that a fresh agent can determine where active work, runtime state, durable decisions, and canonical docs belong without reading historical plan folders.

## Acceptance criteria

- [x] Root work-surface docs define exactly one promotion ladder for conversation, PRD, issue, ADR, and canonical-doc surfaces.
- [x] `CONTEXT-MAP.md` and `docs/agents/domain.md` agree on subproject context and ADR authority.
- [x] Root `PLANNING.md`, if present, is clearly historical/transitional and not required for active work.
- [x] A grep check finds no active-work instruction that routes new PRDs/issues to `.omx/plans`, root `PLANNING.md`, or subproject `docs/plans` by default.
- [x] Verification evidence is recorded in the final handoff or issue comments.

## Blocked by

None - can start immediately.

## Comments

- 2026-05-03: Completed. `docs/agents/work-surface.md` remains the single canonical promotion ladder; `CONTEXT-MAP.md` now links to it from the issue workflow; `docs/agents/domain.md` now spells out the same subproject context/ADR authority paths; root `PLANNING.md` now points to the canonical ladder instead of duplicating it. Verification: `python3 /tmp/verify_project_org.py` passed; focused grep found active-work instructions route new PRDs/issues to `.scratch` or mark older surfaces as history/evidence.
