# Patient 001-005 corpus atlas

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`
Issue: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`
Template: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md`

## Scope and authority

This artifact mines `pi-chart/patients/patient_001` through `pi-chart/patients/patient_005` as patient-corpus evidence only. It does not edit or promote patient fixtures, `_derived/` outputs, schemas, tests, source code, hidden simulator truth, or `pi-sim` internals.

Authority interpretation:

- Corpus files show scenario pressure, public chart-facing examples, fixture gaps, caveats, and hot/warm/cold examples.
- They do not define production schema, migration readiness, hidden simulation truth, or v0.5 architecture by themselves.
- `_derived/` output is projection evidence only. In this worktree, no `pi-chart/patients/patient_001` through `patient_005` `_derived/` directory is present; prior review docs cite `patient_002/_derived/memory-proof.md`, but the path is absent and is therefore carried as a projection-evidence gap rather than direct evidence.
- Hidden simulator/evaluator surfaces remain out of bounds. `patient_001/simulation/hidden_truth/**` and `patient_002` simulation expected/latent materials can only prove boundary pressure, not chart truth.

## Corpus inventory

| Patient | Scenario contribution | Public corpus surfaces mined | Counts observed | Review/caveat state | Primary gaps carried forward |
| --- | --- | --- | --- | --- | --- |
| `patient_001` | Narrow respiratory-decompensation / CAP watch seed with oxygen titration, penicillin allergy, antibiotic/MAR holds, contested RT exam, and handoff reuse. | `chart.yaml`, `patient.md`, `constraints.md`, `artifacts/index.json`, labs/imaging artifacts, `scenario-blueprints/patient_001_revised_respiratory_watch.yaml`, timeline events/vitals/notes, operator checklist. | 52 event rows; 95 vitals samples; 10 notes; 6 artifact files. | `status: revised_for_operator_review`; checklist says operator clinical realism review pending. | Narrow respiratory seed only; not proof broad EHR coverage is complete; hidden truth exists only as forbidden boundary fixture. |
| `patient_002` | Live-demo/public chart-surface seed for severe CAP/septic shock with longitudinal history, current admission, ICU handoff, HFpEF/CKD/T2DM background, simulation role boundary, and public chart manifest. | `chart.yaml`, `patient.md`, `constraints.md`, artifacts including longitudinal labs/imaging/immunizations, scenario blueprint, simulation `README*`, `ROLE_BOUNDARY.md`, `chart_surface_manifest.json`, timeline events/vitals/notes, golden-seed packet. | 96 event rows; 56 vitals samples; 10 notes; 10 artifact files. | Golden seed packet says signed off as strongest seed only, not ADR019/CORP-019 readiness. | Hidden `pi-sim` internals forbidden; one scenario family cannot define ontology; `_derived/memory-proof.md` cited by docs but absent in this worktree. |
| `patient_003` | Infection-escalation / obstructing pyelonephritis with sepsis physiology, source-control bridge, MAP/lactate proof fact, and ED-to-MICU transition. | `chart.yaml`, `patient.md`, `constraints.md`, artifact index/labs/CT/microbiology, `scenario-blueprints/patient_003_infection_escalation.yaml`, timeline events/vitals/notes, operator checklist. | 44 event rows; 56 vitals samples; 5 notes; 4 artifact files. | `status: revised_for_operator_review`; operator clinical review pending. | Operator review needed before readiness credit; single-day infection arc needs caveat visible. |
| `patient_004` | Cardiac/renal medication-management row with HFpEF/CKD, AKI/hyperkalemia, MAR holds, diuresis, BMP/weight trend, consults, discharge restart criteria. | `chart.yaml`, `patient.md`, `constraints.md`, artifact index/labs/CXR, `scenario-blueprints/patient_004_cardiac_renal_med_management.yaml`, 3-day timeline events/vitals/notes, operator checklist. | 81 event rows; 96 vitals samples; 20 notes; 6 artifact files. | Operator checklist marks accepted anchor/frozen for current review cycle, while row-level surface cells remain pending. | Strong multi-day medication continuity pressure, but still hand-authored and not production schema authority. |
| `patient_005` | Post-op frailty/delirium/fall-risk row with hip-fracture repair, pain/sedation balance, PT/nursing handoff, daughter context, and safety precautions. | `chart.yaml`, `patient.md`, `constraints.md`, artifact index/labs, `scenario-blueprints/patient_005_postop_frailty_delirium.yaml`, timeline events/vitals/notes, operator checklist. | 29 event rows; 46 vitals samples; 6 notes; 3 artifact files. | `status: revised_for_operator_review`; operator clinical review pending. | Revised candidate only; delirium/fall-risk realism needs human review before readiness credit. |

## Patient-by-patient mining notes

### `patient_001` respiratory-decompensation seed

- Clinical questions: Is oxygenation improving or worsening? Which reassessment closed the respiratory-watch loop? How does penicillin anaphylaxis change antibiotic/MAR decisions? What contradiction exists between RN and RT respiratory exam context?
- Minimum data visible: identity and encounter span in `chart.yaml`; baseline/PMH in `patient.md`; allergy/code status/goals in `constraints.md`; labs and CXR in `artifacts/index.json`; timed events/vitals/notes across 2026-04-18 and 2026-04-19; scenario proof fact `evt_20260418T0842_02` in the blueprint.
- Evidence/provenance pressure: same proof fact is expected to drive assessment review, evidence provenance, open loop, next-shift handoff, and narrative note.
- Lifecycle/open loops: scenario lists SpO2 maintenance loop closure, respiratory-watch closure, contested RT/RN exam reconciliation, q4h monitoring, family update, and day-2 PO transition target.
- Hot examples: current O2 device/SpO2/RR, penicillin anaphylaxis, beta-lactam hold, active respiratory-watch state.
- Warm examples: admit and repeat labs/CXR, pharmacy med-rec, contested-exam resolution, family update.
- Cold examples: baseline smoking history, return-to-work priority, prior surgeries, routine baseline SpO2.
- Fixture gaps: operator clinical realism review pending; narrow CAP/respiratory arc cannot prove broad substrate completeness.

### `patient_002` public/live-demo chart-surface seed

- Clinical questions: What is visible at live-demo start? What should remain hidden/future? How do chronic HFpEF/CKD/T2DM history and current sepsis/respiratory failure shape chart review?
- Minimum data visible: longitudinal patient history in `patient.md`; admission constraints in `constraints.md`; timeline spanning prior encounters and 2026-04-19 admission; artifacts for imaging, immunizations, A1c, renal, lipid, BNP/BP, admission labs; `scenario-blueprints/patient_002_live_demo_initial.yaml`; simulation role-boundary docs and chart-surface manifest.
- Evidence/provenance pressure: public chart-surface manifest and live-demo startup rules separate loaded chart evidence from future, expected, latent, or hidden state.
- Lifecycle/open loops: current admission active sepsis, hypoxemic respiratory failure, AKI, HFNC context, ICU consult acceptance, ED-to-ICU SBAR, and historical chronic-disease follow-up all pressure open-loop and longitudinal context behavior.
- Hot examples: active HFNC context, sepsis/AKI/respiratory failure problems, code status, renal dosing/med-hold constraints.
- Warm examples: admission labs/CXR, ICU consult, ED/provider/nursing notes, active artifact index, current encounter events.
- Cold examples: 2022-2025 HFpEF/CKD/PCP/cardiology/nephrology encounters, longitudinal labs, immunizations, social/family history.
- Fixture gaps: hidden `pi-sim` and future expected files must never become evidence; golden seed is not sufficient for corpus readiness; `_derived/memory-proof.md` is cited in review docs but absent in this worktree.

### `patient_003` infection-escalation context

- Clinical questions: Is infection escalating despite initial treatment? What evidence supports septic physiology and source-control urgency? What handoff content bridges ED to MICU and overnight source-control planning?
- Minimum data visible: demographics/baseline/presentation in `patient.md`; TMP-SMX allergy, med holds, renal adjustment, and daughter communication in `constraints.md`; CT/labs/culture in `artifacts/index.json`; scenario proof fact `evt-003-0018`; timeline events/vitals/notes for 2026-04-22.
- Evidence/provenance pressure: MAP 58, lactate 4.6, delayed capillary refill, and source-control bridge need explicit chart-visible provenance rather than hidden simulator truth.
- Lifecycle/open loops: infection escalation, antibiotic/fluids/actions, MICU handoff, blood culture prelim, source-control bridge, and night reassessment create unresolved work for next shift.
- Hot examples: MAP/lactate/hypotension, allergy/med-hold constraints, active sepsis assessment, source-control concern.
- Warm examples: CT abdomen/pelvis, culture prelim, admission labs/UA, ED provider/MICU notes.
- Cold examples: nephrolithiasis history, diabetes baseline, daughter support context.
- Fixture gaps: operator review pending; no direct derived projection file available in this worktree.

### `patient_004` cardiac/renal medication-management context

- Clinical questions: Which medications are held, administered, restarted, or avoided? How do K/Cr, volume status, diuresis, weight, I&O, and consults change the plan over three days? What restart criteria leave the hospital with the patient?
- Minimum data visible: 3-day encounter metadata in `chart.yaml`; source mix and PMH/home meds in `patient.md`; CKD/HF/NSAID/RAAS/metformin/apixaban constraints in `constraints.md`; serial BMP/CXR artifacts; scenario proof fact `evt-004-0017`; three days of timeline events/vitals/notes.
- Evidence/provenance pressure: K 5.6 and Cr 2.2 after losartan/spironolactone/ibuprofen exposure must thread through MAR holds, pharmacy review, consults, patient education, discharge med-rec, and restart criteria.
- Lifecycle/open loops: admission med holds, repeated BMPs, IV-to-PO diuretic transition, discharge prescriptions, outpatient cardiology/nephrology restart criteria, NSAID avoidance.
- Hot examples: K/Cr trend, active medication holds, renal-dose anticoagulation review, avoid NSAIDs, current weight/diuresis state.
- Warm examples: serial BMP artifacts, consult notes, pharmacy med reviews, patient education, handoffs.
- Cold examples: baseline CKD/HFpEF/AF/diabetes, prior volume overload, home pill-organizer context.
- Fixture gaps: accepted as review-cycle anchor but still hand-authored; row-level surface checklist remains pending and should not become schema authority.

### `patient_005` postop frailty/delirium/fall-risk context

- Clinical questions: What fall/delirium risk is active right now? How should pain control balance mobility and sedation? What orientation supports and transfer precautions must survive into next-shift handoff?
- Minimum data visible: postop scenario metadata in `chart.yaml`; baseline function/cognition/support and surgery context in `patient.md`; allergy, delirium, fall-risk, orientation, and weight-bearing constraints in `constraints.md`; postop/POD1 labs; scenario proof fact `evt-005-0018`; two-day events/vitals/notes.
- Evidence/provenance pressure: functional-safety proof fact should be reused through assessment review, evidence provenance, open loop, next-shift handoff, narrative note, family reorientation, opioid-sparing plan, toileting prompts, and fall-prevention loop.
- Lifecycle/open loops: PACU-to-floor handoff, POD1 labs, PT eval, pain/sedation plan, assisted transfers, family updates, night safety reassessment.
- Hot examples: high fall risk, delirium precautions, current transfer assist, pain/sedation balance, hearing aids/glasses orientation supports.
- Warm examples: PT eval, nursing handoff, postop labs, family reorientation, night reassessment.
- Cold examples: baseline cane use, mild cognitive impairment, daughter support, prior fall history.
- Fixture gaps: operator clinical realism review pending; no direct derived projection file available in this worktree.

## Corpus recommendation rows

| Row id | Substrate family | Clinical chart-digging question | Source artifact citation | Brownfield code/test citation | Corpus citation | Evidence summary | Canonical/derived/rendered classification | Hot/warm/cold class | Reconciliation state | Mismatch register input | v0.5 implication | Boundary check |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CORPUS-P001-RESP-001 | vitals/trends; constraints; orders/MAR/med-rec; care plan/handoff; provenance/lifecycle | Is the pneumonia patient improving after oxygen titration and antibiotics, and which respiratory-watch loops remain open? | `not-covered` | `not-covered` | `pi-chart/patients/patient_001/scenario-blueprints/patient_001_revised_respiratory_watch.yaml`; `pi-chart/patients/patient_001/timeline/2026-04-18/events.ndjson`; `pi-chart/docs/plans/patient-001-operator-review-checklist.md` | Patient 001 supports oxygen trend, allergy-aware antibiotic/MAR, contested assessment reconciliation, and handoff reuse as fixture pressure. Operator review remains pending and the row is narrow respiratory/CAP evidence only. | canonical facts + derived projection expectation | hot + warm | revise | Narrow respiratory seed; operator-review pending; hidden truth path exists only as forbidden boundary fixture. | v0.5 needs hot oxygen/constraint/current-loop facts plus warm evidence chains and handoff projections without treating this fixture as broad EHR completion. | Docs-only; no patient edits; no hidden simulator truth; no backend/vector/OpenBrain/FHIR or direct accepted-write commitment. |
| CORPUS-P002-LIVE-002 | identity/encounter; context access; problems/assessments; labs/diagnostics; notes/narrative; care plan/handoff | What public chart surface is safe to load for a live-demo ICU/sepsis chart without future leak or hidden simulator coupling? | `not-covered` | `pi-chart/src/views/memoryProof.test.ts` hidden-state and patient_002 open-loop coverage | `pi-chart/patients/patient_002/scenario-blueprints/patient_002_live_demo_initial.yaml`; `pi-chart/patients/patient_002/simulation/ROLE_BOUNDARY.md`; `pi-chart/docs/plans/patient-002-golden-seed-review-packet.md` | Patient 002 is the strongest public/live-demo seed and has explicit load/not-load boundaries, longitudinal context, and brownfield memory-proof tests. It is seed evidence only, not enough for CORP-019 or schema authority. | canonical facts + rendered/public-surface boundary + derived projection expectation | hot + warm + cold | adopt | `_derived/memory-proof.md` cited by review docs but absent in this worktree; hidden/future simulation materials must stay excluded. | v0.5 needs explicit chart-surface manifests and hot/warm/cold load boundaries that keep hidden/future evaluator state out of clinician/agent views. | Docs-only; no hidden `pi-sim`; no patient migration/editing; no backend/vector/OpenBrain/FHIR or direct accepted-write commitment. |
| CORPUS-P003-INF-003 | problems/assessments; vitals/trends; labs/diagnostics; orders/interventions; care plan/handoff | Is infection escalating, what evidence supports source-control urgency, and what must MICU/night shift follow? | `not-covered` | `not-covered` | `pi-chart/patients/patient_003/scenario-blueprints/patient_003_infection_escalation.yaml`; `pi-chart/patients/patient_003/artifacts/index.json`; `pi-chart/docs/plans/patient-003-operator-review-checklist.md` | Patient 003 pressures sepsis escalation with MAP/lactate proof, CT/labs/culture, ED-to-MICU handoff, and source-control open loops. Review is pending and must remain visible. | canonical facts + derived projection expectation | hot + warm | revise | Operator clinical realism pending; no direct `_derived/` output present in this worktree. | v0.5 needs infection/escalation facts tied to provenance, result review, source-control loops, and handoff uncertainty without hidden simulator physiology. | Docs-only; no source or patient edits; no hidden simulator truth; no backend/vector/OpenBrain/FHIR or direct accepted-write commitment. |
| CORPUS-P004-MED-004 | orders/MAR/med-rec; labs/diagnostics; I&O/LDA/device context; notes/narrative; care plan/handoff | Which medication holds, diuretic changes, renal trends, and restart criteria explain safe discharge? | `not-covered` | `not-covered` | `pi-chart/patients/patient_004/scenario-blueprints/patient_004_cardiac_renal_med_management.yaml`; `pi-chart/patients/patient_004/timeline/2026-04-23/events.ndjson`; `pi-chart/patients/patient_004/timeline/2026-04-24/events.ndjson`; `pi-chart/patients/patient_004/timeline/2026-04-25/events.ndjson`; `pi-chart/docs/plans/patient-004-operator-review-checklist.md` | Patient 004 is the strongest multi-day medication-management pressure row: K/Cr trends, MAR holds, pharmacy/consult notes, IV-to-PO diuretic transition, education, and discharge restart criteria. It remains hand-authored and fixture-level. | canonical facts + derived projection expectation | hot + warm + cold | adopt | Accepted anchor/frozen, but row-level review cells remain pending and hand-authored realism caveat must stay visible. | v0.5 needs lean medication/MAR/open-loop substrate for holds, administrations, lab-dependent restarts, discharge handoff, and renal safety without building a full pharmacy/CPOE product. | Docs-only; no patient edits; no full MAR/CPOE/pharmacy product scope; no backend/vector/OpenBrain/FHIR or direct accepted-write commitment. |
| CORPUS-P005-FRAIL-005 | nursing assessment; constraints; care plan/handoff; notes/narrative; review/accountability | What immediate fall/delirium precautions, pain/sedation tradeoffs, and orientation supports must carry into next shift? | `not-covered` | `not-covered` | `pi-chart/patients/patient_005/scenario-blueprints/patient_005_postop_frailty_delirium.yaml`; `pi-chart/patients/patient_005/constraints.md`; `pi-chart/patients/patient_005/timeline/2026-04-24/events.ndjson`; `pi-chart/docs/plans/patient-005-operator-review-checklist.md` | Patient 005 pressures nursing safety substrate: fall risk, delirium precautions, functional baseline, transfer assist, PT evidence, opioid-sparing plan, family reorientation, and next-shift handoff. Operator review is pending. | canonical facts + derived projection expectation | hot + warm + cold | revise | Revised-for-review only; human realism signoff pending; no direct `_derived/` output present in this worktree. | v0.5 needs nursing safety constraints and handoff loops that keep current precautions hot while preserving warm PT/nursing evidence and cold baseline function. | Docs-only; no patient edits; no hidden simulator truth; no full EHR/fall-risk product scope; no backend/vector/OpenBrain/FHIR or direct accepted-write commitment. |
| CORPUS-GAP-DERIVED-006 | provenance/lifecycle; context access; review/accountability | Which patient projection outputs can be cited, and are they projection-only rather than chart truth? | `not-covered` | `pi-chart/src/views/memoryProof.test.ts` patient_002 and hidden-state coverage | `pi-chart/docs/plans/patient-002-golden-seed-review-packet.md`; `pi-chart/docs/plans/patient-003-operator-review-checklist.md` | Review docs mention memory-proof projection expectations, but current worktree lacks patient `_derived/` directories for direct mining. Treat this as an evidence gap, not as permission to generate or edit derived outputs. | derived projection only | warm | open-question | Need later generated projection inventory if issue 14 or a later approved lane authorizes it. | v0.5 should preserve derived projection contracts, but current atlas can only cite available docs and tests, not missing generated files. | Docs-only; no `_derived/` edits/generation; no hidden simulator truth; no backend/vector/OpenBrain/FHIR or direct accepted-write commitment. |

## Cross-patient substrate pressure summary

| Substrate family | Strongest corpus pressure | Hot example | Warm example | Cold example | Gap/caveat |
| --- | --- | --- | --- | --- | --- |
| Identity/encounter | All five `chart.yaml` and `patient.md` files. | Current patient, encounter, timezone, active admission. | Encounter span and care team. | Prior encounter history, social/family context. | Corpus files are fixture metadata, not production identity schema. |
| Constraints/safety | `constraints.md` across all five patients. | Allergies, code status, renal dosing, fall risk, delirium precautions. | Pharmacy review, patient/family communication, education. | Baseline preferences and long-term support context. | Constraint shape should be reconciled with source and brownfield before adoption. |
| Vitals/trends | Patients 001, 002, 003, 004, 005 vitals JSONL; especially 001 oxygen, 003 MAP/lactate context, 004 weight/diuresis, 005 postop safety. | Current SpO2/MAP/K/Cr/fall risk state. | Trend windows and reassessments. | Baseline physiology. | Trend behavior must not depend on semantic/vector retrieval for hot facts. |
| Labs/diagnostics/artifacts | Artifact indexes and labs/imaging for all five; patient_004 serial BMPs; patient_003 CT/culture; patient_002 longitudinal labs. | Critical/current lab or imaging result. | Result-review chain and serial trends. | Longitudinal A1c/renal/lipid/echo history. | Result-review actions need reconciliation with brownfield views before schema promotion. |
| Orders/MAR/med-rec | Patient 001 antibiotic/allergy holds; patient 004 medication holds/restarts; patient 002 sepsis/HFNC actions. | Active holds, administrations, restart criteria. | Pharmacy/consult notes, med-rec rationale. | Home meds and past medication intolerance. | Lean v0.5 should model intent/action/fulfillment/open loop, not full pharmacy/CPOE. |
| Notes/narrative/handoff | Notes across all patients, especially 004's 20 narratives and 001/003/005 proof-fact handoff reuse. | Current handoff and next-shift watch items. | Narrative evidence explaining why facts matter. | Prior consults/discharge summaries. | Notes should remain source truth; projections should link/extract without duplicating accepted writes. |
| Review/accountability/provenance | Operator checklists and proof-fact reuse expectations. | Current reviewed/unreviewed state. | Evidence chains and operator review packets. | Historical signoff context. | Most rows still require human/operator clinical review before readiness credit. |
| Context access | Patient 002 live-demo boundary and template hot/warm/cold taxonomy. | Demo-start chart surface and no-future-leak current facts. | Recent structured support and review material. | Longitudinal history and prior encounters. | Access tier is a clinical behavior model only; no backend/vector/OpenBrain selection. |

## Mismatch and caveat inputs

1. `patient_001` is a narrow respiratory-decompensation seed and must not be used as proof that broad EHR fixture coverage is complete.
2. `patient_002` is the strongest public/live-demo seed, but hidden/future simulation materials are forbidden and it remains insufficient for corpus readiness alone.
3. `patient_003` carries infection-escalation pressure, but operator clinical realism review is pending.
4. `patient_004` is the strongest medication-management and multi-day row, but it is hand-authored fixture evidence, not source/schema authority.
5. `patient_005` carries nursing safety/frailty/delirium pressure, but operator clinical realism review is pending.
6. `_derived/` projection files are absent under `patient_001` through `patient_005` in this worktree; prior docs cite projection expectations, so direct derived-output mining must be deferred or handled by a later approved lane.
7. No automated docs-only regression harness currently verifies every atlas row field, explicit `not-covered` placeholders, hidden-sim exclusion, or issue-to-PRD consistency.

## Closeout validation notes

- Reused the required template fields from `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md`.
- Source artifact citation is `not-covered` in corpus rows except artifact-level framing, because this issue mines corpus evidence only.
- Brownfield code/test citation is `not-covered` except where `pi-chart/src/views/memoryProof.test.ts` directly supports hidden-state exclusion and patient_002 projection/open-loop behavior as implementation evidence only.
- Corpus citations point to exact patient paths, scenario blueprints, timelines, artifact indexes, constraints, or review packets.
- Boundary checks are explicit on every row.
- Issues 05-14 remain untouched.
