# Plan — patient_004 cardiac/renal medication-management corpus row

## Status

- Date: 2026-04-28
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: planning only; do **not** generate `patient_004` until `patient_003` external review returns clean or required `patient_003` corrections are resolved.
- Parent plan: `.omx/plans/plan-generate-corpus-patients-after-patient-002-signoff.md`
- Scope when executed: Step 4 for `patient_004` only, plus semantic corpus-test extension to include `patient_004`.

## Boundary

This is a CORP-019 corpus-generation lane, not ADR019.

Do not:
- touch `../pi-sim`,
- create `decisions/019-*`,
- start a clean-slate rewrite,
- edit schemas/importers/package files,
- count hidden simulator/private state as chart truth,
- claim corpus readiness from `patient_004` alone.

## Preflight and source-mix gate

Before editing, the future Ralph lane must capture:

```bash
git status --short -- . ../pi-sim
find decisions -maxdepth 1 -name '019-*' -print
```

Classify all pre-existing dirty files, especially `../pi-sim`, as unowned unless the user explicitly changes scope. The final report must run the same checks and prove no new `../pi-sim` changes and no `decisions/019-*`.

Patient_004 must document one source-mix posture in its patient package and corpus packet row:

- **Synthea-seeded**: record Synthea seed, version, parameters, baseline content, and hand-crafted acute/EHR augmentation.
- **Fully hand-authored**: explicitly state that no Synthea seed was used and rely on operator clinical realism review before counting it as reviewed corpus evidence.

## Why patient_004 exists

`patient_002` proves the respiratory/sepsis-shock golden pattern and `patient_003` pilots a non-respiratory infection/escalation row. `patient_004` should stress a different clinical memory axis: cardiac/renal medication management where chart quality depends on reconciliation, MAR hold/admin semantics, renal trend interpretation, and handoff of medication-risk decisions.

## Target clinical scenario

Working title: **HFpEF/CKD medication-management admission with AKI/hyperkalemia risk**.

Recommended shape:
- Older adult with HFpEF, CKD stage 3b, atrial fibrillation, hypertension, type 2 diabetes.
- Presents with dyspnea/volume overload plus worsening renal function and borderline hyperkalemia after outpatient NSAID use or poor oral intake.
- ED/admission dilemma: decongest enough to improve symptoms while avoiding renal worsening and unsafe continuation of home meds.
- Multi-shift chart day or two chart days if clinically useful.

Core clinical tensions:
1. Home-med reconciliation must identify meds to continue, hold, or dose-adjust.
2. Renal labs and potassium must drive orders and plan changes.
3. MAR must distinguish ordered, administered, held, and discontinued medications.
4. One charted medication-safety fact must propagate through review, narrative, open loops, handoff, and memory-proof evidence.

## Required distinguishing evidence

### Six EHR surfaces

| Surface | Required patient_004 evidence |
|---|---|
| Vitals/flowsheet trend | Dyspnea/volume trend: BP, HR, SpO2, weight or urine output if available; enough rows for before/after diuresis or medication-hold decision. |
| Bedside nursing assessment | Volume status and safety assessment: edema, crackles, orthopnea, dizziness/fall risk, medication-history reliability. |
| Notes/narrative | ED/admission provider note, pharmacy med-rec note or medication safety note, nursing progress/handoff note. |
| Orders/meds/interventions | Home-med reconciliation intent, loop diuretic order/admin, ACE/ARB/MRA/metformin/NSAID hold, anticoagulation continue/adjust decision. |
| Labs/diagnostics | BMP/renal panel with creatinine/eGFR/potassium, BNP, troponin if needed, CXR or echo reference if clinically useful. |
| Care plan/handoff | Open loop for repeat BMP/K, urine output/weight response, med restart criteria, anticoag/renal-dose follow-up. |

### One-entry/many-projection proof fact

Recommended proof fact:

`evt-004-00XX`: **Medication-safety/renal finding** — e.g. “K 5.6 with creatinine 2.2 from baseline 1.4 after home losartan + spironolactone + ibuprofen; hold losartan/spironolactone/metformin and repeat BMP after diuresis.”

This single charted fact must be reused by:
- an assessment/review item explaining why it mattered,
- evidence/provenance in memory proof,
- at least one open loop (repeat BMP/K, med restart criteria, renal dosing review),
- next-shift handoff,
- a narrative note reference,
- corpus packet row evidence.

## Patient package contract for patient_004

Create only under `patients/patient_004/**` plus the shared registry/test/docs files listed below.

Minimum files:
- `patients/patient_004/chart.yaml`
- `patients/patient_004/patient.md`
- `patients/patient_004/constraints.md`
- `patients/patient_004/timeline/<date>/encounter_001.md`
- `patients/patient_004/timeline/<date>/events.ndjson`
- `patients/patient_004/timeline/<date>/vitals.jsonl`
- `patients/patient_004/timeline/<date>/notes/*.md`
- `patients/patient_004/artifacts/index.json`
- `patients/patient_004/artifacts/labs/*.json`
- optional `patients/patient_004/artifacts/imaging/*.md`
- `patients/patient_004/scenario-blueprints/patient_004_cardiac_renal_med_management.yaml`
- generated `_derived/**` only from `npm run rebuild`

Also update:
- `pi-chart.yaml` with `patient_004`,
- `src/views/memoryProof.test.ts` table to include patient_004 proof fact,
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` matrix row from proposed to generated/operator-review-pending.

## Implementation steps for a later Ralph lane

### Step A — Gate on patient_003 review

Before generating `patient_004`, read the external review result for `patient_003`.

- If `patient_003` is approved or conditionally approved with no structural/test changes: continue.
- If `patient_003` requires corrections that affect the package/test pattern: patch `patient_003` first, re-run full verification, then generate `patient_004`.
- If review rejects the pattern: stop and re-plan; do not propagate a flawed pattern to patient_004.

### Step B — Create patient_004 fixture

Generate a concise but clinically rich patient package using existing patient_003 structure.

Target event chain:
1. ED triage vital/assessment: dyspnea/orthopnea, crackles, edema, borderline oxygenation.
2. Initial problems: acute decompensated HFpEF/volume overload, AKI on CKD or CKD worsening, hyperkalemia/med safety risk.
3. Diagnostic orders: BMP/Mg, BNP, troponin, CXR, ECG, strict I&O/daily weight.
4. Medication reconciliation: home meds include losartan, spironolactone or potassium supplement, loop diuretic, metformin/SGLT2 if useful, apixaban/warfarin if anticoagulation axis is chosen.
5. Medication actions: administer IV furosemide, hold losartan/spironolactone/metformin/NSAID, continue anticoagulation with renal-dose check or explicitly hold if bleeding/fall concern exists.
6. Lab/imaging results: potassium/creatinine/BNP/CXR result.
7. Result review: renal/K finding changes medication plan and repeat-lab timing.
8. Handoff/open loop: repeat BMP/K, monitor urine output/weight, restart criteria for held meds, anticoagulation/renal dosing review.

### Step C — Extend semantic tests

In `src/views/memoryProof.test.ts`:
- Add `patient_004` to the corpus-case table with `encounterId`, `asOf`, proof-fact id, and proof-fact label.
- Reuse existing semantic tests; do not add full-output snapshots.
- Ensure tests fail if patient_004 lacks any required surface, proof sections, proof-fact reuse, or hidden-state isolation.

### Step D — Update corpus packet

Update `docs/plans/clinical-fidelity-corpus-review-adr-019.md`:
- Status: `Generated / operator review pending`.
- Scenario: cardiac/renal medication-management.
- Six-surface coverage: machine pass only if evidence exists.
- Operator review remains pending.
- ADR019 implication remains defensive: broadens corpus but does not create readiness alone.

### Step E — Verify

Run and read:

```bash
npm run rebuild
npm run validate
npm run typecheck
npm test
find decisions -maxdepth 1 -name '019-*' -print
```

Acceptance:
- `npm run validate` has zero errors. Pre-existing warnings may remain only if unrelated to patient_004.
- `npm test` remains green.
- `patient_004/_derived/memory-proof.md` exists and has the six clinical sections.
- No `decisions/019-*` output.
- No touched `../pi-sim` files attributable to the lane.

## Patient_004 review checklist

After patient_004 is generated and machine-verified, create or update a patient_004 operator-review checklist/artifact before any patient_005 generation. The corpus packet row may serve this role only if it records reviewer identity/role/date, pass/conditional/fail result, required corrections, and explicit proceed/stop decision.

The later operator review should answer:

1. Does the medication-management scenario feel clinically plausible, not copy-pasted from patient_002/003?
2. Are med holds/admins/restarts clear enough from chart-visible evidence?
3. Does the renal/K proof fact appear exactly once as chart truth and then propagate through projections?
4. Are labs/diagnostics timed and sourced well enough for a reader to reconstruct the decision?
5. Does the handoff tell the next shift what to do, what is pending, and what would change the plan?
6. Are uncertainty and restart criteria visible, not implied?
7. Is there any hidden simulator/evaluator/private state in visible chart surfaces?
8. Does the corpus packet avoid claiming ADR019 readiness?

## Recommended next command after patient_003 review is clean

```bash
$ralph Execute .omx/plans/plan-patient-004-cardiac-renal-med-management.md in /home/ark/pi-rn/pi-chart. First capture git status --short -- . ../pi-sim and classify pre-existing dirty files. Generate patient_004 only as the cardiac/renal medication-management corpus row and extend semantic corpus tests to patient_004. Document source mix as Synthea-seeded with seed/version/parameters plus baseline-vs-augmentation, or fully hand-authored/no Synthea seed. Do not touch ../pi-sim, do not create decisions/019-*, do not start clean-slate rewrite, and verify with npm run rebuild, npm run validate, npm run typecheck, npm test, final git status --short -- . ../pi-sim, and find decisions -maxdepth 1 -name '019-*' -print.
```

## If patient_003 review returns corrections first

Use this instead:

```bash
$ralph Apply the patient_003 external review corrections in /home/ark/pi-rn/pi-chart before generating patient_004. First capture git status --short -- . ../pi-sim and classify pre-existing dirty files. Scope only to patient_003-owned files, corpus packet language, and semantic tests if required by the review. Do not touch ../pi-sim, do not create decisions/019-*, do not start clean-slate rewrite, and verify with npm run rebuild, npm run validate, npm run typecheck, npm test, final git status --short -- . ../pi-sim, and find decisions -maxdepth 1 -name '019-*' -print.
```
