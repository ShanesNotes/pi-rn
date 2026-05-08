# Verbal/telephone order minimal semantics

Status: needs-triage
Type: AFK
User stories covered: 24, 44

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define minimal verbal and telephone order semantics needed for v0.5 workflow. The model should represent a nurse-entered order, ordering provider, mode, readback status, timestamp, co-sign requirement, co-sign state, downstream order/MAR/workflow tasks, and correction/supersession if rejected or modified.

The slice should support nursing workflow and order authority without building a full legal/compliance platform, full CPOE, or role registry.

## Acceptance criteria

- [ ] Defines minimum verbal/telephone order fields and state.
- [ ] Defines readback yes/no and co-sign required/status semantics.
- [ ] Defines how a nurse-entered verbal/telephone order can generate downstream order/MAR/workflow tasks.
- [ ] Defines rejection/modification as correction or supersession, not deletion.
- [ ] Preserves review/attestation/accountability language without full legal/compliance scope.
- [ ] Excludes full CPOE, pharmacy verification, legal signature platform, and role registry scope.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
