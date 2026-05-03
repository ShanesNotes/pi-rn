# Polish active PRD and issue statuses

Status: needs-triage
Type: AFK

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Review active `.scratch` PRDs and issues for consistent status vocabulary, parent links, dependency links, evidence citations, and scope boundaries. Do not close or delete parent issues.

## Acceptance criteria

- [x] Every `.scratch/*/PRD.md` has a valid `Status:` using the local markdown triage vocabulary or a documented program status.
- [x] Every `.scratch/*/issues/*.md` has `Status:`, `Parent`, `What to build`, `Acceptance criteria`, and `Blocked by` sections.
- [x] Issue dependencies refer to local markdown paths that exist.
- [x] Any issue marked `ready-for-agent` has enough context for an AFK agent to start without reading stale `.omx` plans.
- [x] Any issue requiring durable authority decisions is marked `needs-triage` or `ready-for-human`, not `ready-for-agent`.

## Blocked by

- `.scratch/project-organization-consistency/issues/01-lock-work-surface-interface.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed structural polish. Normalized `.scratch/pi-chart-v0-5-claim-ledger-kernel/PRD.md` to a triage `Status:` plus `Program status:` note, converted `.scratch/shared-agent-surface/issues/01-fix-shared-skill-alias-plane.md` and `02-document-matt-omx-interoperability.md` to the Matt issue shape, and verified 5 PRDs plus 18 issues with `python3 /tmp/verify_scratch_workflow.py`.
