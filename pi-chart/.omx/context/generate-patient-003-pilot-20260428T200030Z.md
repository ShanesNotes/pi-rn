# Ralph context snapshot — generate patient_003 pilot

## Task statement
Execute `.omx/plans/plan-generate-corpus-patients-after-patient-002-signoff.md` in `/home/ark/pi-rn/pi-chart`, implementing Step 2 and Step 3 only.

## Desired outcome
- Generate `patients/patient_003/**` as the pilot infection/sepsis escalation corpus row.
- Add `patient_003` to `pi-chart.yaml`.
- Add semantic tests for `patient_002` + `patient_003` around six surfaces, memory-proof sections, hidden-state exclusion, and one-entry/many-projection reuse.
- Verify with `npm run rebuild`, `npm run validate`, `npm run typecheck`, and `npm test`.

## Known facts/evidence
- `patient_002` is signed off as golden seed, but CORP-019 remains incomplete and not ADR019.
- Plan requires patient_003 to broaden to infection escalation/sepsis physiology with ED-to-ICU transition, cultures/lactate/antibiotics/fluids/pressor watch, and order-action-result-review chain.
- Existing registry has only `patient_001` and `patient_002`.
- Rebuild/validate scan on-disk `patients/` directories and accept `--patient` scoping.
- `src/views/memoryProof.test.ts` already contains patient_002 memory-proof and one-entry/many-projection tests.

## Constraints
- Do not touch `../pi-sim`.
- Do not create `decisions/019-*`.
- Do not start clean-slate rewrite.
- Do not edit schemas/importers/package/source except tests authorized by Step 3.
- Preserve pre-existing dirty files as unrelated.

## Unknowns/open questions
- Operator signoff for patient_003 remains pending after machine generation and tests.
- Existing repo has unrelated dirty files, including parent `../pi-sim`, which must remain untouched.

## Likely codebase touchpoints
- `patients/patient_003/**`
- `pi-chart.yaml`
- `src/views/memoryProof.test.ts`
- Possibly `docs/plans/clinical-fidelity-corpus-review-adr-019.md` for a minimal operator-review row if needed for Step 2 acceptance.
