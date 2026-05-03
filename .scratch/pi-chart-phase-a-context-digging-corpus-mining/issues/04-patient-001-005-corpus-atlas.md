# patient_001-005 corpus atlas

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Mine `patient_001` through `patient_005` into a corpus atlas for clinician-style chart digging. The atlas should describe what each patient contributes to v0.5 substrate design, what is missing, which caveats must remain visible, and which substrate families each scenario pressures.

## Acceptance criteria

- [x] Covers `patient_001` through `patient_005`, including patient files, constraints, chart metadata, artifacts/indexes, scenario blueprints, and `_derived/` outputs as projection evidence only.
- [x] Marks `patient_001` as a narrow respiratory-decompensation seed, not a completed broad EHR fixture.
- [x] Mines `patient_002` for public/live-demo/chart-surface implications while forbidding hidden `pi-sim` internals as evidence.
- [x] Mines `patient_003` for infection-escalation context and preserves any operator-review or realism caveats.
- [x] Mines `patient_004` for cardiac/renal medication-management context and preserves any operator-review or realism caveats.
- [x] Mines `patient_005` for postop frailty/delirium context and preserves any operator-review or realism caveats.
- [x] For each patient, captures clinical questions, minimum data, evidence/provenance, lifecycle/open loops, hot/warm/cold examples, substrate family coverage, and fixture gaps.
- [x] Does not edit patient files or derived outputs.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/01-evidence-authority-ladder-and-mining-templates.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/patient-001-005-corpus-atlas.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` row fields and boundary rules.
- Patient files and `_derived/` outputs were not edited.
- Hidden `pi-sim` and simulation expected/latent materials were handled only as boundary/projection pressure, not chart truth.
- Issues 05-14 remain `needs-triage` / untouched.
- `git status --short` captured during worker validation.
