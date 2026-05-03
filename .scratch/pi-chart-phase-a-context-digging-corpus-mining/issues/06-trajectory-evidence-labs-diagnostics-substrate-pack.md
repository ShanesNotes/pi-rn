# Trajectory, evidence, labs, and diagnostics substrate pack

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for clinical trajectory and evidence: vitals trends, alarms, evidence chains, labs, diagnostics, artifact references, and result-review behavior. The output should clarify what supports clinician chart digging when the question is “what changed, what evidence supports it, and what results matter?”

## Acceptance criteria

- [ ] Covers vitals/flowsheet trend behavior, alarm/attention context, evidence refs, labs, diagnostics, artifacts, and result review.
- [ ] Distinguishes point observations, trend windows, device/interface evidence, result facts, review actions, and rendered diagnostic/narrative views.
- [ ] Uses Phase A source rows, brownfield trend/evidence/memory-proof/validation behavior, and patient corpus examples.
- [ ] Identifies which evidence must be hot versus warm, and which diagnostic/history material is cold background.
- [ ] Flags result-review and evidence-chain gaps for later reconciliation.
- [ ] Preserves the hidden-simulator boundary for monitor/telemetry evidence.
- [ ] Does not introduce FHIR/openEHR export, lab interface implementation, backend choice, or patient migration.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`
