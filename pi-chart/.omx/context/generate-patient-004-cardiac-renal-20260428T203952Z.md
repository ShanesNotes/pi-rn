# Ralph context snapshot — generate patient_004 cardiac/renal medication-management row

## Task statement
Execute `.omx/plans/plan-patient-004-cardiac-renal-med-management.md` in `/home/ark/pi-rn/pi-chart`. Generate only `patient_004` as the cardiac/renal medication-management corpus row, extend semantic corpus tests to include `patient_004`, document source mix, and verify with rebuild/validate/typecheck/test/final boundary checks.

## Desired outcome
- New `patients/patient_004/**` package registered in `pi-chart.yaml`.
- `patient_004` is a CORP-019 corpus row for HFpEF/CKD AKI/hyperkalemia medication management.
- `src/views/memoryProof.test.ts` includes `patient_004` in the table-driven semantic guardrails.
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` marks `patient_004` generated/operator-review-pending with source mix.
- No `../pi-sim` edits, no `decisions/019-*`, no clean-slate rewrite.

## Known facts/evidence
- Preflight `git status --short -- . ../pi-sim` captured at 2026-04-28T20:39:52Z.
- Pre-existing/unowned dirty files include clinical-reference docs, kanban docs, patient_002 imaging artifacts, plans, prior patient_003 files, and many `../pi-sim` files. These are not owned by this lane.
- Forbidden decision check returned no output.
- Approved plan requires patient_004 source mix as Synthea-seeded with seed/version/params or fully hand-authored/no Synthea seed.
- Existing patient_003 package and `memoryProof.test.ts` define the corpus row pattern.

## Constraints
- Do not touch `../pi-sim`.
- Do not create `decisions/019-*`.
- Do not start clean-slate rewrite.
- No new dependencies.
- Scope expected: `patients/patient_004/**`, `pi-chart.yaml`, `src/views/memoryProof.test.ts`, corpus packet docs, generated `_derived/**` via rebuild.

## Unknowns/open questions
- Patient_003 external reviewer is separate; current user explicitly ordered patient_004 execution, so proceed under user-provided signoff/gate override.
- Validation may reveal required event/data shape corrections.

## Likely codebase touchpoints
- `patients/patient_003/**` as structural template.
- `pi-chart.yaml` registry.
- `src/views/memoryProof.test.ts` corpus table.
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` corpus matrix.
