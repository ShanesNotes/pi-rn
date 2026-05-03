# Orders, MAR, med rec, I&O, LDA, and open-loop substrate pack

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for clinical work and bedside burden: orders, intents, actions, interventions, MAR, medication reconciliation, administrations, holds/refusals, I&O, LDAs, oxygen/device context, and open-loop fulfillment. The output should keep this lean and clinically useful without turning v0.5 into full CPOE/pharmacy/flowsheet software.

## Acceptance criteria

- [ ] Covers orders/intents, performed actions, fulfillment/failure, MAR, med reconciliation, medication holds/refusals, I&O, LDAs, oxygen context, device/context intervals, and open loops.
- [ ] Distinguishes canonical facts from derived open-loop state and rendered workflow/task displays.
- [ ] Uses Phase A A4/A4b/A5/A9 source evidence, brownfield openLoops/timeline/currentState/validation evidence, and patient corpus examples.
- [ ] Identifies which items are hot, warm, or cold for chart digging.
- [ ] Flags full CPOE, pharmacy verification, barcode administration, drug dictionary, and complete flowsheet product scope as deferred unless source/corpus evidence demands a lean substrate item.
- [ ] Preserves problem-targeting, fulfillment, correction, and interval semantics where supported by existing accepted decisions.
- [ ] Does not implement orders, MAR, med rec, I&O, LDA, or source code changes.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`
