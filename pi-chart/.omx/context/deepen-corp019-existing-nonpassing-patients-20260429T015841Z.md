# Context — Deepen existing CORP-019 non-passing patients

## Task statement

User clarified the prior replacement-patient plan was wrong: do **not** generate replacement patients (`patient_006`-`patient_008`). Instead, deepen the existing patients from the current five-row series that were not signed off.

## Desired outcome

Revise the active CORP-019 plan so execution improves the current corpus rows in place:

- Keep `patient_002` and `patient_004` as the only accepted/signed-off anchors.
- Deepen `patient_001`, `patient_003`, and `patient_005` as needed so they can return for operator review.
- Preserve existing row IDs and provenance.
- Do not create replacement patients.
- Do not claim ADR019 readiness until five reviewed rows pass/conditional-pass and ADR018 input is accounted for.

## Known facts / evidence

- Existing patient dirs: `patient_001` through `patient_005` only.
- User indicated only `patient_002` and `patient_004` are signoff candidates from the group.
- Prior ralplan artifact incorrectly recommended generating `patient_006`-`patient_008` replacement candidates.
- Prior verification reported full validation/typecheck/tests passing before this amendment, but execution must re-run verification after any edits.

## Constraints

- No `../pi-sim/**` edits.
- No `decisions/019-*` creation.
- No package/schema/importer/runtime changes unless a future explicit plan supersedes this one.
- Use existing CORP-019 PRD/test-spec gate.
- Treat external AI critique as advisory only.

## Unknowns / open questions

- Exact operator objections for `patient_001`, `patient_003`, and `patient_005` are not recorded in this prompt.
- Execution should therefore deepen known weak dimensions without inventing a signoff/fail rationale: continuity, longitudinal cross-links, evidence traceability, nursing relevance, handoff/open-loop clarity, and checklist honesty.

## Likely touchpoints

- `patients/patient_001/**`, `patients/patient_003/**`, `patients/patient_005/**`
- generated `_derived/**` for touched patients
- `pi-chart.yaml` only if registration/provenance fields need in-place metadata correction
- `src/views/memoryProof.test.ts` only if proof semantics need tightened coverage for existing rows
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-003-operator-review-checklist.md`
- `docs/plans/patient-005-operator-review-checklist.md`
- optional new `docs/plans/patient-001-operator-review-checklist.md` if no review checklist exists
