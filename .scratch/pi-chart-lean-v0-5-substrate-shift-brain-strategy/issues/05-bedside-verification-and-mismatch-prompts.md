# Bedside verification and mismatch prompts

Status: needs-triage
Type: AFK
User stories covered: 88, 92-93, 99

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define how the shift-start workflow surfaces mismatches between nurse report, charted data, documented drip/dose rates, vitals trends, I&O/labs, task state, and bedside monitor or medication verification. Mismatches should become clinician review prompts with source links, not autonomous truth decisions by the agent.

The slice should support the moment when the incoming nurse enters the room, introduces themself, verifies medications, checks the vitals monitor, and decides whether anything urgent changes the plan.

## Acceptance criteria

- [ ] Identifies common shift-start mismatch types across report, chart, drips/dose rates, monitor vitals, labs/I&O, and task state.
- [ ] Defines mismatch prompts as derived review prompts with source/evidence links.
- [ ] States that the clinician resolves or charts the reconciliation through sanctioned workflows.
- [ ] Allows the agent to suggest what to inspect next but not declare canonical truth or complete tasks.
- [ ] Defines when mismatch prompts should be prominent versus quiet.
- [ ] Preserves hidden `pi-sim` boundary by using only observable/charted data.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/04-shift-start-chart-digging-packet.md`
