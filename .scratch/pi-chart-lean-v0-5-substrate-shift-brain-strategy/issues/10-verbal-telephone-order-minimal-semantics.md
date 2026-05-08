# Verbal/telephone order minimal semantics

Status: ready-for-human
Type: AFK
User stories covered: 24, 44

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define minimal verbal and telephone order semantics needed for v0.5 workflow. The model should represent a nurse-entered order, ordering provider, mode, readback status, timestamp, co-sign requirement, co-sign state, downstream order/MAR/workflow tasks, and correction/supersession if rejected or modified.

The slice should support nursing workflow and order authority without building a full legal/compliance platform, full CPOE, or role registry.

## Acceptance criteria

- [x] Defines minimum verbal/telephone order fields and state.
- [x] Defines readback yes/no and co-sign required/status semantics.
- [x] Defines how a nurse-entered verbal/telephone order can generate downstream order/MAR/workflow tasks.
- [x] Defines rejection/modification as correction or supersession, not deletion.
- [x] Preserves review/attestation/accountability language without full legal/compliance scope.
- [x] Excludes full CPOE, pharmacy verification, legal signature platform, and role registry scope.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`


## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/verbal-telephone-order-minimal-semantics.md`.
- Defined minimum verbal/telephone order fields: patient/encounter scope, order summary, ordering provider, entering clinician, communication mode, received/readback time, readback status, co-sign requirement/state, source refs, downstream workflow, correction/supersession link, and caveat display.
- Defined state model for entered pending co-sign, readback documented/missing, co-sign signed/rejected, modified/superseded, cancelled/discontinued, and source-needed.
- Defined how sanctioned nurse-entered verbal/telephone orders can generate downstream order/MAR/workflow tasks while preserving pending co-sign/readback caveats.
- Defined rejection/modification/correction/supersession as lineage-preserving events, not deletion.
- Preserved review/attestation/accountability language without full legal/compliance, full CPOE, pharmacy verification, legal signature platform, or role registry scope.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, minimum fields, readback/co-sign semantics, state model, downstream workflow generation, correction/supersession, assistant boundary, and scope exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers; verified consistency with issue 06 source/authority, issue 07 human-agent boundary, issue 08 supportive language, and issue 09 medication/retiming boundary.
- AI slop cleanup pass — PASS: scoped to changed issue 10 docs; fallback-like scan found no masking fallback/workaround/bypass patterns; no cleanup edits required.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
