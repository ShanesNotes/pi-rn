# Authority ledger completeness verification

Status: completed

## Parent

`.scratch/pi-sim-rebase-grounding/PRD.md`

## What to build

Verify `pi-sim/docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` lists every required pi-sim, shared-agent, and documented sibling-reference path exactly once, and that public telemetry authority remains `vitals/README.md` plus `vitals/.lanes.json`.

## Acceptance criteria

- [x] Check script or documented command proves required authority paths appear in the 007 ledger table.
- [x] Check confirms `vitals/README.md` and `vitals/.lanes.json` are classified as current execution-ready public contract authority.
- [x] Check confirms no row treats root `PLANNING.md` or `.omx/plans/*` as the default active issue queue.
- [x] Verification command recorded in issue comments.
- [x] No `pi-chart` source or internals modified.

## Blocked by

None.

## Comments

- 2026-06-11: Added `.scratch/pi-sim-rebase-grounding/checks/verify-authority-ledger-completeness.py`. Verification from `pi-sim/`: `python3 ../.scratch/pi-sim-rebase-grounding/checks/verify-authority-ledger-completeness.py` — 78 required paths, vitals authority execution-ready, PLANNING.md transitional rule present.