# Medication timing, retiming, and clustered assessment

Status: needs-triage
Type: AFK
User stories covered: 22-23, 44, 94-96

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the medication-centered early shift workflow: the nurse plans around due medications, may cluster 8, 9, or 10 o'clock meds when clinically appropriate, performs the first assessment during the med pass, and charts after care. Medication retiming should be a charted medication workflow action linked to the original order/MAR schedule, not a silent mutation of due time.

This slice should connect med due work, drips/dose-rate context, holds/refusals/omissions, retiming, clustered assessment, and assessment charting while avoiding full pharmacy, drug dictionary, barcode MAR, or full medication reconciliation scope.

## Acceptance criteria

- [ ] Defines med-pass planning as part of the shift-brain projection.
- [ ] Defines medication retiming as a charted workflow action linked to original order/MAR schedule.
- [ ] Covers administrations, holds, refusals, omissions, drips/dose-rate context, and restart/retiming rationale where relevant.
- [ ] Defines care clustering around due meds and first assessment as advisory and clinician-controlled.
- [ ] Links assessment charting to performed bedside care without autonomous completion.
- [ ] Explicitly excludes full pharmacy workflow, barcode MAR, drug dictionary, and full medication reconciliation product scope.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/08-clinical-risk-prioritization-and-supportive-language.md`
