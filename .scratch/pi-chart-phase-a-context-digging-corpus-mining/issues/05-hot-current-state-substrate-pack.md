# Hot current-state substrate pack

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize the hot current-state substrate that v0.5 must make deterministic and quickly available for chart digging. Focus on patient identity, demographics, encounter, active constraints, allergies/precautions/code status, active problems, current assessments, current vitals snapshot, and immediate safety flags.

## Acceptance criteria

- [ ] Defines what belongs in hot current-state context and why each item is latency/safety critical.
- [ ] Covers identity/demographics/encounter, active constraints, allergies/precautions/code status, active problems/assessments, current vitals, and immediate safety flags.
- [ ] Uses source artifacts, brownfield code/tests, and patient corpus rows as evidence for each included substrate item.
- [ ] Identifies which items are canonical facts versus derived current-state projections versus rendered display choices.
- [ ] Flags missing or weak evidence in the mismatch register input format.
- [ ] Explicitly states that hot current-state truth must not depend on semantic/vector retrieval.
- [ ] Does not propose backend, vector, UI, patient migration, or source implementation changes.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`
