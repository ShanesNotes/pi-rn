# Ralplan context snapshot — post-patient_003 next step

## Task statement
The user invoked `$ralplan` with the completion report for the Step 2+3 patient_003 lane. Need produce a consensus next-step plan for what to do after patient_003 is generated, while a separate reviewer is doing clinical review.

## Desired outcome
A grounded plan that preserves momentum without overclaiming: wait for patient_003 review, apply corrections if needed, then generate patient_004 cardiac/renal medication-management as the next corpus row using the established patient_003 pattern.

## Known facts/evidence
- patient_003 implementation completed and architect-approved.
- Verification evidence: rebuild, validate, typecheck, tests all passed; no decisions/019-*.
- patient_003 remains operator-review pending and cannot count as a reviewed corpus row yet.
- Planning artifacts already exist for patient_004 and patient_003 review checklist:
  - `.omx/plans/plan-patient-004-cardiac-renal-med-management.md`
  - `docs/plans/patient-003-operator-review-checklist.md`
- Current repo has unrelated pre-existing dirty files; do not widen scope.

## Constraints
- Do not touch `../pi-sim`.
- Do not create `decisions/019-*`.
- Do not start clean-slate rewrite.
- Do not generate patient_004 until patient_003 review returns clean or required corrections are resolved.
- CORP-019 corpus planning only; not ADR019.

## Unknowns/open questions
- External patient_003 clinical-review verdict is not known yet.
- patient_004 execution should branch depending on pass/conditional/fail.

## Likely touchpoints
- `.omx/plans/plan-patient-004-cardiac-renal-med-management.md`
- `docs/plans/patient-003-operator-review-checklist.md`
- future execution: `patients/patient_004/**`, `pi-chart.yaml`, `src/views/memoryProof.test.ts`, `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
