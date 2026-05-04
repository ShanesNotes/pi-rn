# Hot current-state substrate pack

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize the hot current-state substrate that v0.5 must make deterministic and quickly available for chart digging. Focus on patient identity, demographics, encounter, active constraints, allergies/precautions/code status, active problems, current assessments, current vitals snapshot, and immediate safety flags.

## Acceptance criteria

- [x] Defines what belongs in hot current-state context and why each item is latency/safety critical.
- [x] Covers identity/demographics/encounter, active constraints, allergies/precautions/code status, active problems/assessments, current vitals, and immediate safety flags.
- [x] Uses source artifacts, brownfield code/tests, and patient corpus rows as evidence for each included substrate item.
- [x] Identifies which items are canonical facts versus derived current-state projections versus rendered display choices.
- [x] Flags missing or weak evidence in the mismatch register input format.
- [x] Explicitly states that hot current-state truth must not depend on semantic/vector retrieval.
- [x] Does not propose backend, vector, UI, patient migration, or source implementation changes.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/hot-current-state-substrate-pack.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` required row fields.
- Used approved source-map, brownfield-crosswalk, and corpus-atlas evidence; each artifact marks weak/missing evidence as mismatch-register input.
- Preserved canonical/derived/rendered and hot/warm/cold classifications.
- Integrated review-probe finding that hot bedside nursing/device/oxygen context must be explicit instead of silently deferred.
- Boundary held: docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining`; no source, patient, ADR, design asset, lockfile, `pi-ledger`, or `pi-sim` edits.
