# patient_001-005 corpus atlas

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Mine `patient_001` through `patient_005` into a corpus atlas for clinician-style chart digging. The atlas should describe what each patient contributes to v0.5 substrate design, what is missing, which caveats must remain visible, and which substrate families each scenario pressures.

## Acceptance criteria

- [ ] Covers `patient_001` through `patient_005`, including patient files, constraints, chart metadata, artifacts/indexes, scenario blueprints, and `_derived/` outputs as projection evidence only.
- [ ] Marks `patient_001` as a narrow respiratory-decompensation seed, not a completed broad EHR fixture.
- [ ] Mines `patient_002` for public/live-demo/chart-surface implications while forbidding hidden `pi-sim` internals as evidence.
- [ ] Mines `patient_003` for infection-escalation context and preserves any operator-review or realism caveats.
- [ ] Mines `patient_004` for cardiac/renal medication-management context and preserves any operator-review or realism caveats.
- [ ] Mines `patient_005` for postop frailty/delirium context and preserves any operator-review or realism caveats.
- [ ] For each patient, captures clinical questions, minimum data, evidence/provenance, lifecycle/open loops, hot/warm/cold examples, substrate family coverage, and fixture gaps.
- [ ] Does not edit patient files or derived outputs.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/01-evidence-authority-ladder-and-mining-templates.md`
