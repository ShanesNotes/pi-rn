# Trajectory, evidence, labs, and diagnostics substrate pack

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for clinical trajectory and evidence: vitals trends, alarms, evidence chains, labs, diagnostics, artifact references, and result-review behavior. The output should clarify what supports clinician chart digging when the question is “what changed, what evidence supports it, and what results matter?”

## Acceptance criteria

- [x] Covers vitals/flowsheet trend behavior, alarm/attention context, evidence refs, labs, diagnostics, artifacts, and result review.
- [x] Distinguishes point observations, trend windows, device/interface evidence, result facts, review actions, and rendered diagnostic/narrative views.
- [x] Uses Phase A source rows, brownfield trend/evidence/memory-proof/validation behavior, and patient corpus examples.
- [x] Identifies which evidence must be hot versus warm, and which diagnostic/history material is cold background.
- [x] Flags result-review and evidence-chain gaps for later reconciliation.
- [x] Preserves the hidden-simulator boundary for monitor/telemetry evidence.
- [x] Does not introduce FHIR/openEHR export, lab interface implementation, backend choice, or patient migration.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/trajectory-evidence-labs-diagnostics-substrate-pack.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` required row fields.
- Used approved source-map, brownfield-crosswalk, and corpus-atlas evidence; each artifact marks weak/missing evidence as mismatch-register input.
- Preserved canonical/derived/rendered and hot/warm/cold classifications.
- Boundary held: docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining`; no source, patient, ADR, design asset, lockfile, `pi-ledger`, or `pi-sim` edits.
