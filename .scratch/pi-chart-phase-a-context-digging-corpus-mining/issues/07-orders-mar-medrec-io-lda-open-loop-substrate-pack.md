# Orders, MAR, med rec, I&O, LDA, and open-loop substrate pack

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for clinical work and bedside burden: orders, intents, actions, interventions, MAR, medication reconciliation, administrations, holds/refusals, I&O, LDAs, oxygen/device context, and open-loop fulfillment. The output should keep this lean and clinically useful without turning v0.5 into full CPOE/pharmacy/flowsheet software.

## Acceptance criteria

- [x] Covers orders/intents, performed actions, fulfillment/failure, MAR, med reconciliation, medication holds/refusals, I&O, LDAs, oxygen context, device/context intervals, and open loops.
- [x] Distinguishes canonical facts from derived open-loop state and rendered workflow/task displays.
- [x] Uses Phase A A4/A4b/A5/A9 source evidence, brownfield openLoops/timeline/currentState/validation evidence, and patient corpus examples.
- [x] Identifies which items are hot, warm, or cold for chart digging.
- [x] Flags full CPOE, pharmacy verification, barcode administration, drug dictionary, and complete flowsheet product scope as deferred unless source/corpus evidence demands a lean substrate item.
- [x] Preserves problem-targeting, fulfillment, correction, and interval semantics where supported by existing accepted decisions.
- [x] Does not implement orders, MAR, med rec, I&O, LDA, or source code changes.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/orders-mar-medrec-io-lda-open-loop-substrate-pack.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` required row fields.
- Used approved source-map, brownfield-crosswalk, and corpus-atlas evidence; each artifact marks weak/missing evidence as mismatch-register input.
- Preserved canonical/derived/rendered and hot/warm/cold classifications.
- Boundary held: docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining`; no source, patient, ADR, design asset, lockfile, `pi-ledger`, or `pi-sim` edits.
