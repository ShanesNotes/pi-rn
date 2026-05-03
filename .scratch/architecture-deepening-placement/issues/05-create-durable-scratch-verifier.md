# Create durable scratch verifier for artifact placement

Status: needs-triage
Type: AFK

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

Maintain a durable checker under `.scratch/architecture-deepening-placement/checks/` that verifies the coordination PRD/issues and guards this planning pass against accidental source edits or `pi-rn/ingest/` creation.

The checker should be reusable by future agents running this placement lane and should not depend on `/tmp` scripts.

## Acceptance criteria

- [ ] `.scratch/architecture-deepening-placement/checks/verify-artifact-placement.py` exists.
- [ ] The checker validates the PRD and six issue files are present.
- [ ] The checker validates each issue has `Status:`, `Type:`, `Parent`, `What to build`, `Acceptance criteria`, `Blocked by`, and `Comments` sections.
- [ ] The checker records or consumes a baseline `git status --short` and compares it with final status; `--refresh-baseline` can create `baseline-status-local.txt` for shared worktrees before a verification pass.
- [ ] The checker allows pre-existing unrelated dirty files while failing on new status entries outside `.scratch/architecture-deepening-placement/`.
- [ ] The checker fails if root `ingest/` is created.

## Blocked by

None - this issue is part of the current coordination artifact pass.

## Comments

- 2026-05-03: The current pass created `.scratch/architecture-deepening-placement/checks/baseline-status-before-artifact-pass.txt` as initial provenance and added `.scratch/architecture-deepening-placement/checks/verify-artifact-placement.py` so future verification can be durable rather than `/tmp`-only. In a shared moving worktree, run the checker with `--refresh-baseline` before verification to create an uncommitted `baseline-status-local.txt`.
