# Human-agent workflow boundary

Status: ready-for-human
Type: AFK
User stories covered: 32-37, 62-66, 76

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the boundary for agent-created workflow suggestions and in-chart reasoning. Agent-created tasks should have suggested, accepted, and rejected/dismissed states. Only human acceptance promotes a suggestion into active workflow. Agent suggestions must be disable-able. Humans own charting, task completion, review, acceptance, and final handoff truth.

This slice should frame the agent as a bounded assistant inside the chart: it can detect patterns, validate against evidence, summarize trends, explain possible urgency, suggest next steps, and prompt review, but it is not a clinician-equivalent decision-maker and cannot become silent canonical memory, direct accepted-write authority, or autonomous completion authority.

## Acceptance criteria

- [x] Defines suggested, accepted, and rejected/dismissed states for agent-created tasks.
- [x] States that human acceptance is required before an agent suggestion becomes active workflow.
- [x] States that agent task suggestions are disable-able.
- [x] States that humans complete workflow tasks and own final handoff content.
- [x] Allows the agent to suggest completion only when explicit modeled evidence supports it.
- [x] Includes negative cases for no direct agent accepted-writes and no autonomous task completion.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`


## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/human-agent-workflow-boundary.md`.
- Defined suggested, accepted, and rejected/dismissed states for agent-created tasks.
- Required human acceptance before suggestions become active workflow.
- Defined disable-able suggestion posture.
- Preserved human ownership of task completion, review, reconciliation, charting, and final handoff truth.
- Allowed completion suggestions only when explicit modeled evidence supports a provisional recommendation.
- Recorded negative cases for no direct agent accepted-writes and no autonomous task completion.

## Closeout evidence

- `python3` structural check — PASS: artifact status, suggested/accepted/rejected states, disable-able suggestions, human acceptance gate, completion evidence boundary, final handoff ownership, direct-write/autonomous-completion negatives, hidden simulator boundary, and issue checklist verified.
- `git diff --check` — PASS.
