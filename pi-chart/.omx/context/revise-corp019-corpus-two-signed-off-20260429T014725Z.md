# Context — revise CORP-019 corpus after only patient_002 and patient_004 signoff

## Task statement

User indicates they will sign off only `patient_002` and `patient_004` from the current five-patient group, and asked whether to ralplan the fixes here or send to external ChatGPT/Claude. Continue from current mode by planning the in-repo path.

## Desired outcome

Create a bounded plan to revise the CORP-019 patient corpus so the repo honestly records `patient_002` and `patient_004` as accepted/signed-off anchors, marks `patient_003` and `patient_005` as not accepted / needs replacement or repair, and defines the safest path to reach five reviewed rows without claiming ADR019 readiness early.

## Known facts / evidence

- `patients/patient_001` through `patients/patient_005` exist.
- `pi-chart.yaml` registers all five patients.
- `patient_002` is already signed off as golden seed in `docs/plans/patient-002-golden-seed-review-packet.md`.
- `patient_003`, `patient_004`, `patient_005` were generated/machine-verified rows.
- User now says they will sign off only `patient_002` and `patient_004`.
- `patient_003` and `patient_005` therefore cannot count as reviewed pass evidence unless later revised and re-reviewed.
- Current full repo validation is unstable because unowned `patient_004` drift appeared outside the previous patient_005 allowed write set; scoped `patient_005` validation still passes.

## Constraints

- Do not claim CORP-019 / ADR019 readiness until five reviewed rows have operator signoff and ADR018 spike input is folded in.
- External ChatGPT/Claude can provide critique, but cannot replace repo-local edits/tests or operator signoff.
- Preserve chart-visible truth only; no `../pi-sim` hidden state.
- Avoid touching `../pi-sim` and avoid creating `decisions/019-*` until readiness is actually established.
- Treat `patient_003` and `patient_005` as rejected/deferred unless operator provides concrete correction notes.

## Unknowns / open questions

- Exact clinical reasons `patient_003` and `patient_005` will not be signed off.
- Whether operator wants to repair rejected rows or generate replacements.
- Whether `patient_001` is worth upgrading into a reviewed row or should remain seed-only.

## Likely touchpoints

- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-003-operator-review-checklist.md`
- `docs/plans/patient-004-operator-review-checklist.md`
- `docs/plans/patient-005-operator-review-checklist.md`
- `docs/plans/patient-002-golden-seed-review-packet.md`
- New replacement/repair plans under `.omx/plans/`
- Future replacement patient directories, likely `patients/patient_006/**`, `patients/patient_007/**`, `patients/patient_008/**`, if chosen
- `pi-chart.yaml` and `src/views/memoryProof.test.ts` only during execution, not this planning pass
