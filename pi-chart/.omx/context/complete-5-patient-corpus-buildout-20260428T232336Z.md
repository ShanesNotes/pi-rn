# Context Snapshot — complete 5-patient corpus buildout

## Task statement
Create a consensus execution plan to finish the pi-chart 5-patient CORP-019 corpus buildout after patient_003 and patient_004 were generated.

## Desired outcome
A bounded, verifiable plan that can be handed to `$ralph` or `$team` to finish the corpus lane without touching pi-sim, creating ADR019 decision files, or overclaiming readiness before review gates pass.

## Known facts/evidence
- `patients/` currently contains `patient_001` through `patient_004`; no `patients/patient_005` directory exists.
- `pi-chart.yaml` registers `patient_001` through `patient_004` only.
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` says CORP-019 remains fail/incomplete until at least five reviewed patients and ADR018 spike input are available.
- `patient_003` is generated/machine-verified but operator review pending via `docs/plans/patient-003-operator-review-checklist.md`.
- `patient_004` is generated/machine-verified but operator review pending via `docs/plans/patient-004-operator-review-checklist.md`.
- `src/views/memoryProof.test.ts` table currently covers corpus cases `patient_002`, `patient_003`, and `patient_004`.
- Latest local verification: `npm run validate` passed with 0 errors / 20 pre-existing patient_002 warnings; `npm run typecheck` passed; `npm test` passed 389/389.

## Constraints
- CORP-019 corpus work is not ADR019; do not create `decisions/019-*`.
- Do not touch `../pi-sim`.
- Do not use hidden simulator/private state as chart truth.
- Existing package/source shape should be reused; no schema/importer/package dependency changes unless a later explicit lane authorizes them.
- Operator review is required before counting generated rows as reviewed corpus evidence.

## Unknowns/open questions
- Whether the operator will pass `patient_003` and `patient_004` without corrections.
- Whether `patient_001` will be upgraded/reviewed or replaced by `patient_006` after `patient_005`.
- Whether ADR018 spike input has a summarized artifact ready for eventual ADR019 pairing.

## Likely codebase touchpoints
- `patients/patient_005/**`
- `pi-chart.yaml`
- `src/views/memoryProof.test.ts`
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-005-operator-review-checklist.md`
- `.omx/plans/plan-patient-005-postop-frailty-delirium.md`
