# Workflow item source and authority grammar

Status: ready-for-human
Type: AFK
User stories covered: 24-31, 67-68

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the per-patient workflow item grammar for the shift brain. Each workflow item should answer why it is on the list, who or what created it, whether it is required/suggested/routine/informational, what completes it, and what happens if it is ignored, deferred, blocked, carried forward, or no longer clinically appropriate.

The grammar should cover provider orders, protocol/order-set generated orders, nurse-entered verbal/telephone orders pending co-sign, nursing judgment/nurse-authored tasks, patient/family requests, accepted or pending agent suggestions, device/import-derived attention items, and system projections from existing facts.

## Acceptance criteria

- [x] Defines workflow item source hierarchy and authority labels.
- [x] Defines required/suggested/routine/informational posture.
- [x] Defines due window, priority tier input, completion criteria, defer/block/carry-forward state, and evidence/source links.
- [x] Distinguishes canonical workflow modifications from display customization.
- [x] Preserves unresolved bedside/I&O/LDA/device grammar as an explicit open-question area rather than pretending it is settled.
- [x] Provides examples from medication due work, lab draw work, assessment cadence, I&O, lines/tubes/drains, transport/procedure readiness, and nursing judgment tasks.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`


## Completion evidence

- Artifact: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-03-04-06-20260504T151627Z.md`
- Verification: structural docs checks run in Ralph iteration 1.
