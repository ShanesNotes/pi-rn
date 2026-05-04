# Lean dense v0.5 substrate recommendation

Status: ready-for-agent
Type: HITL-draft

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Draft the final lean dense v0.5 substrate recommendation from the reconciliation register. The output should be broad enough to cover clinically important chart-digging surfaces and compact enough to preserve a small primitive grammar. This is a draft for maintainer review, not an implementation authorization.

## Acceptance criteria

- [ ] Produces a concise v0.5 substrate recommendation organized around clinical function and chart-digging questions, not EHR modules.
- [ ] Names which substrate families should be adopted, revised, deferred, rejected, or escalated as open questions.
- [ ] Preserves compact primitive/link/time/lifecycle vocabulary and explains any pressure to expand it.
- [ ] Includes a hot/warm/cold context summary with no backend/vector/OpenBrain commitment.
- [ ] Explains how chart-once/project-many should work across trend, narrative, evidence, open loops, review, care plan, human workflow prioritization, and handoff.
- [ ] Includes a clinician-facing workflow/"shift brain" projection: meds due, assessment cadence, medication drip/bag changes, turns, blood sugar checks, baths, Foley/I&O work, dressing changes, travel-to-scan/off-unit tasks, and similar human-only care obligations derived from chart context.
- [ ] Clearly states that workflow/task-list/brain surfaces are derived prioritization views over orders, MAR, assessments, open loops, constraints, device/line context, and handoff/watch items; they are not autonomous agent action authority or canonical chart truth.
- [ ] Lists downstream implications for pi-chart ↔ pi-ledger adapter strategy without adding new pi-ledger kernel requirements.
- [ ] Includes a maintainer-review section that clearly separates recommended decisions from open HITL questions.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/12-three-layer-reconciliation-and-mismatch-register.md`

## Comments

- 2026-05-04: Maintainer approved issue 12 reconciliation/mismatch register; issue 13 is unblocked for HITL-draft synthesis. Issue 14 remains gated.
- 2026-05-04: Maintainer added clinician workflow-prioritization requirement: v0.5 should treat an EPIC Brain/work-list/task-list analogue as a derived human workflow projection over chart context, with stronger prioritization than existing EHR surfaces and no autonomous task-completion authority.
