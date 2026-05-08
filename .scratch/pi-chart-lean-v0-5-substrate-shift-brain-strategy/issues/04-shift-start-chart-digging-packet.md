# Shift-start chart-digging packet

Status: ready-for-human
Type: AFK
User stories covered: 85-91, 97

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the derived chart-digging packet an incoming ICU nurse needs during report: why the patient is here from the H&P, the current provider plan from the most recent ICU note, vitals trends, drip/dose-rate context, I&O/fluid balance, lab trends, and pending work-list/task-list actions.

This slice should describe what context is hot, what is warm supporting evidence, what is cold background history, and how the in-chart agent can summarize or highlight without hiding source links.

## Acceptance criteria

- [x] Defines the minimum shift-start packet fields for H&P, ICU note, vitals, drips/dose rates, I&O, labs, and tasks.
- [x] Marks which packet items are hot, warm, or cold access behavior.
- [x] Explains how each packet item links back to canonical chart memory.
- [x] Includes clinician-facing plain-language summary expectations for why an item matters.
- [x] Includes in-chart-agent expectations for evidence citation, uncertainty, and review prompts.
- [x] Does not choose retrieval/backend/vector/OpenBrain/storage/runtime architecture.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`


## Completion evidence

- Artifact: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/shift-start-chart-digging-packet.md`
- Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-03-04-06-20260504T151627Z.md`
- Verification: structural docs checks run in Ralph iteration 1.
