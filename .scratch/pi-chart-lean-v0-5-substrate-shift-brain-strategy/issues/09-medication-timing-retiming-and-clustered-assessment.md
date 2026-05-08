# Medication timing, retiming, and clustered assessment

Status: ready-for-human
Type: AFK
User stories covered: 22-23, 44, 94-96

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the medication-centered early shift workflow: the nurse plans around due medications, may cluster 8, 9, or 10 o'clock meds when clinically appropriate, performs the first assessment during the med pass, and charts after care. Medication retiming should be a charted medication workflow action linked to the original order/MAR schedule, not a silent mutation of due time.

This slice should connect med due work, drips/dose-rate context, holds/refusals/omissions, retiming, clustered assessment, and assessment charting while avoiding full pharmacy, drug dictionary, barcode MAR, or full medication reconciliation scope.

## Acceptance criteria

- [x] Defines med-pass planning as part of the shift-brain projection.
- [x] Defines medication retiming as a charted workflow action linked to original order/MAR schedule.
- [x] Covers administrations, holds, refusals, omissions, drips/dose-rate context, and restart/retiming rationale where relevant.
- [x] Defines care clustering around due meds and first assessment as advisory and clinician-controlled.
- [x] Links assessment charting to performed bedside care without autonomous completion.
- [x] Explicitly excludes full pharmacy workflow, barcode MAR, drug dictionary, and full medication reconciliation product scope.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/08-clinical-risk-prioritization-and-supportive-language.md`


## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/medication-timing-retiming-and-clustered-assessment.md`.
- Defined med-pass planning as a derived shift-brain projection over orders, MAR actions, workflow items, due windows, source/authority, and safety caveats.
- Defined medication retiming as a charted medication workflow action linked to the original order/MAR schedule, not a silent due-time mutation.
- Covered administrations, holds, refusals, omissions, restarts, titrations/dose-rate context, dependency states, and retiming rationale at product/domain level.
- Defined due-med/first-assessment care clustering as advisory, modifiable, ignorable, and clinician-controlled.
- Preserved human-owned assessment charting after performed bedside care.
- Explicitly excluded full pharmacy workflow, barcode MAR, drug dictionary, full medication reconciliation, backend/storage/adapter work, hidden simulator coupling, and `pi-ledger` kernel expansion.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, med-pass projection, retiming as charted workflow action linked to original schedule, administrations/holds/refusals/omissions/restarts/titration context, advisory clustering, human-owned assessment charting, and boundary exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers; verified consistency with issue 06 source/authority, issue 07 human-agent boundary, and issue 08 supportive prioritization.
- AI slop cleanup pass — PASS: scoped to changed issue 09 docs; fallback-like scan found only intentional "silent mutation/completion" negative-boundary language; wording cleanup changed `re-times` to `retimes` and expanded `med-rec` to `medication reconciliation`.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
