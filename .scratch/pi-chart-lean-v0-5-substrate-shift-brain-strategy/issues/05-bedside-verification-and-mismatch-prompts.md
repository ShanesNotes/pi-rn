# Bedside verification and mismatch prompts

Status: ready-for-human
Type: AFK
User stories covered: 88, 92-93, 99

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define how the shift-start workflow surfaces mismatches between nurse report, charted data, documented drip/dose rates, vitals trends, I&O/labs, task state, and bedside monitor or medication verification. Mismatches should become clinician review prompts with source links, not autonomous truth decisions by the agent.

The slice should support the moment when the incoming nurse enters the room, introduces themself, verifies medications, checks the vitals monitor, and decides whether anything urgent changes the plan.

## Acceptance criteria

- [x] Identifies common shift-start mismatch types across report, chart, drips/dose rates, monitor vitals, labs/I&O, and task state.
- [x] Defines mismatch prompts as derived review prompts with source/evidence links.
- [x] States that the clinician resolves or charts the reconciliation through sanctioned workflows.
- [x] Allows the agent to suggest what to inspect next but not declare canonical truth or complete tasks.
- [x] Defines when mismatch prompts should be prominent versus quiet.
- [x] Preserves hidden `pi-sim` boundary by using only observable/charted data.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/04-shift-start-chart-digging-packet.md`


## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/bedside-verification-and-mismatch-prompts.md`.
- Kept prompts derived/review-only and source-linked.
- Defined common mismatch types across report/chart/bedside drips, vitals, monitor values, I&O/labs, result review, task state, stale sources, report-only sources, and order/constraint conflicts.
- Defined prominent versus quiet prompt behavior to protect safety without adding alarm fatigue.
- Preserved clinician-owned reconciliation and charting through sanctioned workflows.
- Preserved hidden `pi-sim` boundary by limiting evidence to charted, observable, or explicitly exposed public surfaces.

## Closeout evidence

- `python3` structural check — PASS: artifact status, mismatch categories, source-state vocabulary, prominent/quiet rules, sanctioned reconciliation paths, assistant boundary, hidden simulator boundary, and issue checklist verified.
- `git diff --check` — PASS.
