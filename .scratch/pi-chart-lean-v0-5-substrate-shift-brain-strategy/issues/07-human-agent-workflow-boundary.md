# Human-agent workflow boundary

Status: needs-triage
Type: AFK
User stories covered: 32-37, 62-66, 76

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the boundary for agent-created workflow suggestions and in-chart reasoning. Agent-created tasks should have suggested, accepted, and rejected/dismissed states. Only human acceptance promotes a suggestion into active workflow. Agent suggestions must be disable-able. Humans own charting, task completion, review, acceptance, and final handoff truth.

This slice should frame the agent as a bounded assistant inside the chart: it can detect patterns, validate against evidence, summarize trends, explain possible urgency, suggest next steps, and prompt review, but it is not a clinician-equivalent decision-maker and cannot become silent canonical memory, direct accepted-write authority, or autonomous completion authority.

## Acceptance criteria

- [ ] Defines suggested, accepted, and rejected/dismissed states for agent-created tasks.
- [ ] States that human acceptance is required before an agent suggestion becomes active workflow.
- [ ] States that agent task suggestions are disable-able.
- [ ] States that humans complete workflow tasks and own final handoff content.
- [ ] Allows the agent to suggest completion only when explicit modeled evidence supports it.
- [ ] Includes negative cases for no direct agent accepted-writes and no autonomous task completion.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
