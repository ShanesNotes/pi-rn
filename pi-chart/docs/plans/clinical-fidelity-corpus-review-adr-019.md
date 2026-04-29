# Clinical-fidelity Corpus Review Packet for ADR 019

## Status and boundary

- Status: CORP-019 corpus review packet with two frozen accepted anchors and three revised-for-review candidates.
- Gate: ADR 019 Corpus Readiness Gate from `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Paired gate test contract: `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Decision boundary: this packet is **not ADR 019** and does not authorize clean-slate rewrite, hybrid migration, storage-port migration, importer work, validator work, hidden simulator-state use, replacement patients, or `decisions/019-*` creation. The current amended fixture work is limited to in-place deepening of `patient_001`, `patient_003`, and `patient_005` as revised-for-review candidates.
- Current outcome: **fail / incomplete for ADR 019 readiness**. `patient_002` and `patient_004` are frozen as accepted anchors; `patient_001`, `patient_003`, and `patient_005` are revised-for-review candidates that still require operator signoff before counting as reviewed evidence.
- Accepted-anchor handoff: `patient_002` and `patient_004` are the only accepted anchors for this review cycle. This does not change the packet's fail / incomplete readiness outcome because three rows remain pending operator review and ADR018 input is not complete here.

## Reviewer/signoff placeholder

| Field | Value |
|---|---|
| Reviewer identity | Pending operator review |
| Reviewer role | Pending operator review |
| Review date | Pending operator review |
| Scope reviewed | Initial packet shape, seed rows, six-surface gaps, and >=5-patient / ≥5-patient target scenarios |
| Patient/scenario reviewed | Initial corpus matrix rows: `patient_001`, signed golden seed `patient_002`, generated pilot row `patient_003`, generated cardiac/renal row `patient_004`, and generated post-op frailty/delirium row `patient_005` |
| Memory-proof pass/fail | `patient_002` and `patient_004` are accepted anchors; `patient_001`, `patient_003`, and `patient_005` are revised-for-review candidates with scoped rebuild/validate checks expected before operator review; none of the revised candidates count as readiness pass evidence yet |
| One-entry/many-projection proof status | Accepted anchors: `patient_002` proof fact `evt-002-0032` and `patient_004` proof fact `evt-004-0017`; revised candidates: `patient_001` proof fact `evt_20260418T0842_02`, `patient_003` proof fact `evt-003-0018`, and `patient_005` proof fact `evt-005-0018` require operator review before evidence use |
| Signoff | Pending: pass / conditional pass / fail |
| Required corrections | Review revised `patient_001`, `patient_003`, and `patient_005`; preserve accepted anchors without clinical churn; do not claim ADR 019 readiness until five rows have operator pass/conditional-pass signoff and ADR018 input is handled. |

## Readiness legend

| Mark | Meaning |
|---|---|
| Pass | Chart-visible evidence exists, has timing/provenance, contributes to review value, and is represented in reviewable projection output. |
| Partial | Some chart-visible evidence exists, but breadth, timing/provenance, projection reuse, follow-up, or review signoff is incomplete. |
| Gap | Required surface or gate evidence is absent for ADR 019 readiness. |
| Proposed | Target scenario only; no fixture exists in this docs/review-only lane. |

## Initial corpus readiness matrix

`patient_001` and `patient_002` are useful seed evidence, but both are respiratory-focused, single-day examples. They do **not** establish corpus breadth for ADR 019.

| Patient ID | Status | Scenario/admit type | Encounter shape | Source mix | Six-surface coverage | Provenance/timing | Chain depth | Follow-up notes | Memory proof output | Operator review | Gaps | ADR 019 implication |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `patient_001` | Revised-for-review candidate | Respiratory deterioration teaching case deepened with oxygen titration, follow-up labs, reassessment, respiratory-watch loop, and handoff | Single-day 2026-04-18 encounter | Hand-authored chart seed plus monitor-derived and nurse-charted vitals; no Synthea seed/version/parameters recorded | Machine candidate: vitals/flowsheet trend, focused nursing reassessment, follow-up nursing/handoff notes, order/action/lab/result-review/care-plan surfaces now present | Present on events/vitals/labs/notes with effective/recorded times and source refs | Revised chain: worsening trend → provider respiratory orders → oxygen titration/specimen collection → proof reassessment `evt_20260418T0842_02` → labs → unresolved respiratory-watch plan → handoff | Present: SBAR plus follow-up nursing note and respiratory-watch handoff | Present after rebuild; proof fact `evt_20260418T0842_02` is intended for assessment/evidence/open-loop/narrative/handoff reuse | Pending operator review | Single respiratory day, no Synthea metadata, and no operator signoff; revised candidate only | Can return for operator review as a broadened seed candidate; cannot support ADR 019 readiness until accepted |
| `patient_002` | Signed-off golden seed | Respiratory worsening with ABG/lactate and handoff | Single-day 2026-04-19 encounter | Hand-authored chart seed plus stepdown-monitor vitals and lab-interface result; no Synthea seed/version/parameters recorded | Partial-to-strong seed: vitals, nursing assessment, nursing note, ABG/lactate, order/action/collection/result chain, care-plan watch item, handoff; still narrow respiratory focus | Present on events/vitals/result with effective/recorded/resulted/verified times and source refs | Partial-to-strong seed: ABG order, oxygen action, specimen collection, lab result, reassessment, care-plan, handoff | Partial: nursing note and handoff exist; no multi-day progression | Present as derived memory proof, but remains seed projection evidence only | Signed off 2026-04-28 for golden-seed use | Single scenario family, no multi-day encounter, no Synthea metadata, limited medication/MAR/reconciliation/I&O/device breadth | Best current seed for chain/open-loop stress; still insufficient for ADR 019 readiness |
| `patient_003` | Revised-for-review candidate | Infection escalation: obstructing pyelonephritis with sepsis physiology, antimicrobial timing, fluids, norepinephrine watch, urology/source-control loop, and ED-to-MICU transition | Single chart day with multiple shifts: ED resuscitation → MICU day shift → night reassessment/source-control bridge | Hand-authored synthetic pilot with chart-visible source/author provenance; no Synthea seed used for this row | Machine pass: vitals/flowsheet trend, bedside nursing assessment, serial notes, orders/meds/interventions, labs/diagnostics, and care plan/handoff are present | Present on events/vitals/labs/notes with effective/recorded/resulted/verified times and deterministic vital sample keys | Revised chain: order/specimen/medication/intervention/result-review/reassessment/care-plan/handoff plus 22:00 lactate and overnight source-control bridge | Present: triage note, ED provider note, ED→MICU SBAR, MICU night-shift handoff, and night reassessment note | Present after rebuild; table-driven tests cover six sections, hidden-state exclusion, and proof reuse | Pending operator review | Needs human clinical realism review and signoff; revised candidate, not corpus readiness | Broadens beyond respiratory seed and returns for operator review without counting as accepted evidence |
| `patient_004` | Accepted anchor / frozen clinical content | Cardiac/renal medication-management: HFpEF volume overload with AKI on CKD, hyperkalemia risk, home-med reconciliation, MAR holds/admins, sustained diuresis, IV-to-PO diuretic transition, and outpatient restart criteria | Multi-day 3-day admission spanning ED evaluation → cardiac telemetry diuresis → discharge home (2026-04-23 → 2026-04-25) | Fully hand-authored synthetic row; no Synthea seed, version, or parameters used; baseline content and acute medication/MAR/renal augmentation are hand-authored across 3 hospital days | Machine pass: vitals/flowsheet trend, bedside nursing assessment, serial notes, orders/meds/interventions, labs/diagnostics, and care plan/handoff are present across all 3 days | Present on events/vitals/labs/notes with effective/recorded/resulted/verified times and deterministic vital sample keys | Strong row with multi-day reuse: admission med-rec/holds → repeat BMP trend (5 BMPs over 3 days, K 5.6→4.2, Cr 2.2→1.5) → cardiology/nephrology consults → IV-to-PO torsemide transition → discharge med-rec with outpatient restart criteria → discharge SBAR | Present across 3 days (≥18 notes): ED triage, ED provider, pharmacy med-rec, ED→telemetry SBAR, day-1 night handoff; day-2 morning handoff, hospitalist progress, cardiology consult, nephrology consult, pharmacy med review, PT eval, patient education, night handoff; day-3 morning handoff, discharge rounds, cardiology discharge note, nephrology discharge note, pharmacy discharge med-rec, discharge education, discharge SBAR | Present after rebuild; table-driven tests cover six sections, hidden-state exclusion, and proof reuse for `evt-004-0017` across all 3 days | Accepted anchor; do not change clinical content in this lane | Frozen accepted anchor; still insufficient for ADR 019 readiness alone because three peer rows remain revised-for-review | First multi-day accepted anchor; broadens medication/MAR/renal-risk memory and adds inpatient-to-outpatient transition evidence without authorizing ADR 019 readiness |
| `patient_005` | Revised-for-review candidate | Post-op frailty/delirium/fall-risk continuity: POD0/POD1 hip-fracture repair with baseline cane use, hearing/glasses orientation needs, pain/sedation balance, PT-confirmed two-person assist, unsafe transfer attempt, family reorientation, and nursing safety handoff | Multi-shift target spanning PACU-to-floor evening handoff through POD1 day-to-night safety reassessment | Fully hand-authored synthetic row; no Synthea seed, version, or parameters used; baseline functional/cognitive context and acute post-op nursing/therapy/handoff details are hand-authored | Machine pass: vitals/flowsheet trend, bedside nursing assessment, serial notes, orders/meds/interventions, labs/diagnostics, and care plan/handoff are present | Present on events/vitals/labs/notes with effective/recorded/resulted/verified times and deterministic vital sample keys | Revised chain: post-op orders/analgesia -> labs -> PT mobility eval -> safety finding -> intervention -> evening reassessment -> overnight delirium/fall plan | Present: PACU nursing note, PACU→floor handoff, day nursing note, PT evaluation note, night-shift safety handoff, and night safety reassessment | Present after rebuild; table-driven tests cover six sections, hidden-state exclusion, and proof reuse for `evt-005-0018` | Pending operator review | Needs human clinical realism review and signoff; revised candidate, not corpus readiness | Broadens corpus into functional-safety/delirium/fall-risk continuity and returns for operator review without counting as accepted evidence |

## Six-surface gap review

| Surface | `patient_001` seed evidence | `patient_002` seed evidence | Current packet gap | Target-row requirement |
|---|---|---|---|---|
| Flowsheets / vitals | Partial/pass seed: short SpO2/HR/RR/BP trend with oxygen context. | Partial/pass seed: SpO2/HR/RR trend before and after oxygen change. | Both are short single-day respiratory trends; no corpus-level variety. | At least five rows with timed trends where clinically relevant, including non-respiratory vital/flowsheet context. |
| Nursing assessment | Partial: work-of-breathing observation and trend assessment. | Pass seed: bedside work-of-breathing finding with accessory muscle use. | Generated rows now add sepsis, medication-safety, and functional-safety breadth, but operator review is still pending. | Include bedside findings not inferable from monitors alone across varied scenarios. |
| Notes / narrative charting | Partial: one SBAR communication note. | Partial/pass seed: focused nursing note plus handoff note. | Generated rows now include multi-note and multi-shift progression, including patient_005 POD0/POD1 safety continuity, but operator review is still pending. | Include follow-up notes showing scenario evolution, actions, response, uncertainty, and evidence links. |
| Orders / medications / interventions | Partial: care-plan intent and provider notification; weak order/fulfillment semantics. | Partial/pass seed: ABG order, oxygen action, specimen collection, and result-driven reassessment. | Medication/MAR, reconciliation, holds/admins, and intervention response obligations remain thin. | Include at least one target row with medication/MAR/reconciliation depth and fulfillment/open-loop semantics. |
| Labs / diagnostics | Gap: no clinically meaningful lab/diagnostic sequence. | Pass seed: ABG/lactate result linked to collection and reassessment. | Only one lab/diagnostic pattern; no imaging/result-review variety. | Include asynchronous labs/diagnostics that change, confirm, or contradict interpretation across multiple rows. |
| Care plan / handoff | Partial: active care-plan intent and SBAR/open intent, but no true shift handoff note. | Pass seed: care-plan watch item and handoff communication/note. | Continuity breadth improved with patient_005 multi-shift POD0/POD1 handoff progression, but operator review remains pending. | Include next-shift concerns, pending work, contingencies, and follow-up obligations across multi-day rows. |

## Cross-cutting gaps before this packet can pass

1. Generated corpus shape now includes five patient directories; only `patient_002` and `patient_004` are accepted anchors. `patient_001`, `patient_003`, and `patient_005` remain revised-for-review candidates.
2. Revised rows broaden beyond respiratory deterioration into infection escalation and post-op frailty/delirium/fall-risk continuity, but `patient_001`, `patient_003`, and `patient_005` remain machine evidence until operator review.
3. No row records Synthea seed, version, and parameters; future Synthea-seeded rows must distinguish baseline content from hand-crafted ICU acute augmentation.
4. No operator has signed this packet as pass / conditional pass / fail.
5. ADR018 spike input is not summarized here yet, so this packet cannot be paired with the projection comparison for ADR 019.
6. Current machine checks cover generated-row memory-proof sections, hidden-state exclusion, and proof-fact reuse; matrix completeness, operator waiver policy, and clinical realism signoff remain pending.
7. This packet still does not authorize validators, importers, schemas, package files, hidden simulator use, or `decisions/019-*`; generated fixture rows are separate machine-verified evidence, not ADR readiness.

## Minimum target scenario set

The passing corpus should include at least five reviewed patient rows (the >=5 / ≥5-patient target). The initial target set is:

1. `patient_001` — respiratory deterioration seed deepened in place with oxygen titration, follow-up labs, focused reassessment, respiratory-watch plan, and handoff; revised-for-review candidate.
2. `patient_002` — respiratory worsening with ABG/order/action/handoff seed; accepted anchor, frozen in this lane.
3. `patient_003` — revised sepsis/shock infection-escalation row with diagnostics, interventions, result review, MICU transition, ICU handoff, and overnight source-control bridge; operator review pending.
4. `patient_004` — cardiac/renal medication-management row extended to a 3-day admission (2026-04-23 → 2026-04-25); accepted anchor, frozen in this lane.
5. `patient_005` — revised post-op/frailty/delirium/fall-risk continuity row with baseline function, nursing/therapy safety assessment, pain/sedation balance, family communication, and multi-shift safety handoff; operator review pending.

Additional rows may be added if operator review finds the five-row set too narrow for ADR 019.

## Operator review checklist

For each row, the operator should record:

- patient/scenario reviewed,
- pass / partial / gap status for each of the six surfaces,
- whether memory-proof sections answer what happened, why it mattered, evidence/provenance, uncertainty, open loops, and next-shift handoff,
- whether at least one charted fact proves one-entry/many-projection reuse,
- Synthea baseline versus hand-crafted augmentation notes,
- realism notes and required corrections,
- explicit signoff: pass / conditional pass / fail.

## Waiver / exception state

No waiver is granted in this packet. If a future operator grants a waiver, it must be documented as an operator-level exception, not a normal bypass, and must include identity/role, date, rationale, risks, mitigation/follow-up, and why ADR 019 can proceed despite incomplete corpus readiness.
