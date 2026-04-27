# Clinical-fidelity Corpus Review Packet for ADR 019

## Status and boundary

- Status: initial docs/review-only corpus-readiness packet lane.
- Gate: ADR 019 Corpus Readiness Gate from `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Paired gate test contract: `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Decision boundary: this packet is **not ADR 019** and does not authorize clean-slate rewrite, hybrid migration, storage-port migration, importer work, validator work, schema work, fixture edits, generated artifact edits, or hidden simulator-state use.
- Current outcome: **fail / incomplete for ADR 019 readiness** until at least five reviewed patients satisfy the corpus contract and ADR018 spike input is available.

## Reviewer/signoff placeholder

| Field | Value |
|---|---|
| Reviewer identity | Pending operator review |
| Reviewer role | Pending operator review |
| Review date | Pending operator review |
| Scope reviewed | Initial packet shape, seed rows, six-surface gaps, and >=5-patient / ≥5-patient target scenarios |
| Patient/scenario reviewed | Initial corpus matrix rows: `patient_001`, `patient_002`, and proposed target rows `patient_003`-`patient_005` |
| Memory-proof pass/fail | Pending row-level operator review; current seed rows are projection evidence only, not readiness pass evidence |
| One-entry/many-projection proof status | Pending row-level operator review; `patient_002` is the strongest seed candidate but remains unreviewed |
| Signoff | Pending: pass / conditional pass / fail |
| Required corrections | Complete target corpus rows, run later machine checks, and obtain explicit operator review before ADR 019 uses this packet as passing evidence. |

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
| `patient_001` | Seed evidence only | Respiratory deterioration teaching case | Single-day 2026-04-18 encounter | Hand-authored chart seed plus monitor-derived vitals; no Synthea seed/version/parameters recorded | Partial: vitals, respiratory assessment, care-plan intent, SBAR note; labs/diagnostics gap; orders/medications/interventions only partial via notification/action; handoff partial via SBAR/open intent | Present on events/vitals with effective/recorded times and source refs | Partial: assessment supports care-plan intent and provider notification; limited fulfillment semantics | Gap: one SBAR note only; no multi-step follow-up note sequence | Present as derived memory proof, but remains seed projection evidence only | Pending | Narrow respiratory scenario, no labs, no MAR/orderset, no multi-day evolution, no operator signoff, no Synthea metadata, not enough broad-EHR surfaces | Supports fixture-shape learning only; cannot support ADR 019 rewrite recommendation |
| `patient_002` | Seed evidence only | Respiratory worsening with ABG/lactate and handoff | Single-day 2026-04-19 encounter | Hand-authored chart seed plus stepdown-monitor vitals and lab-interface result; no Synthea seed/version/parameters recorded | Partial-to-strong seed: vitals, nursing assessment, nursing note, ABG/lactate, order/action/collection/result chain, care-plan watch item, handoff; still narrow respiratory focus | Present on events/vitals/result with effective/recorded/resulted/verified times and source refs | Partial-to-strong seed: ABG order, oxygen action, specimen collection, lab result, reassessment, care-plan, handoff | Partial: nursing note and handoff exist; no multi-day progression | Present as derived memory proof, but remains seed projection evidence only | Pending | Single scenario family, no multi-day encounter, no Synthea metadata, limited medication/MAR/reconciliation/I&O/device breadth, no operator signoff | Best current seed for chain/open-loop stress; still insufficient for ADR 019 readiness |
| `patient_003` | Proposed target row | Sepsis/shock or infection escalation with diagnostics, fluids/vasopressors, antimicrobial timing, and reassessment | Multi-day target with ED/ward-to-ICU transition | Proposed Synthea baseline plus hand-crafted ICU acute augmentation; seed/version/parameters required if used | Proposed all six surfaces with labs/diagnostics and medication/intervention depth | Proposed effective/recorded/resulted/verified times plus source/author/transform provenance | Proposed order -> intervention -> result review -> revised plan chain | Proposed serial progress/handoff notes across days | Proposed required six-section memory proof | Pending | Fixture, validator, operator review, and provenance metadata not yet created | Needed to broaden beyond respiratory-only corpus |
| `patient_004` | Proposed target row | Cardiac/renal medication-management scenario, e.g. heart failure/AKI risk with home-med reconciliation and held/continued meds | Multi-day target with admission reconciliation and next-day reassessment | Proposed Synthea baseline plus hand-crafted medication/MAR and nursing assessment augmentation | Proposed all six surfaces, emphasizing orders/medications/interventions and care-plan handoff | Proposed med-order/admin/hold times, renal lab timing, author/source provenance | Proposed medication order/hold/admin -> lab review -> care-plan chain | Proposed provider and nursing notes with follow-up | Proposed required six-section memory proof | Pending | Fixture, medication/MAR shape, operator review, and machine checks not yet created | Needed to test one-entry/many-projection reuse outside respiratory trend data |
| `patient_005` | Proposed target row | Post-op or frailty/delirium/fall-risk scenario with functional baseline, constraints, nursing assessment, and handoff watch items | Multi-day target with shift-to-shift continuity | Proposed Synthea or hand-authored baseline plus hand-crafted acute nursing/therapy/handoff details | Proposed all six surfaces, emphasizing nursing assessment, care continuity, and uncertainty | Proposed baseline/function/source provenance plus event timing | Proposed assessment -> intervention/order -> response -> handoff/open-loop chain | Proposed multiple nursing/provider/therapy notes | Proposed required six-section memory proof | Pending | Fixture, broad baseline axes, operator review, and machine checks not yet created | Needed to prove the gate can evaluate non-respiratory clinical memory and continuity |

## Six-surface gap review

| Surface | `patient_001` seed evidence | `patient_002` seed evidence | Current packet gap | Target-row requirement |
|---|---|---|---|---|
| Flowsheets / vitals | Partial/pass seed: short SpO2/HR/RR/BP trend with oxygen context. | Partial/pass seed: SpO2/HR/RR trend before and after oxygen change. | Both are short single-day respiratory trends; no corpus-level variety. | At least five rows with timed trends where clinically relevant, including non-respiratory vital/flowsheet context. |
| Nursing assessment | Partial: work-of-breathing observation and trend assessment. | Pass seed: bedside work-of-breathing finding with accessory muscle use. | No broad head-to-toe, functional, safety, or continuity assessment breadth. | Include bedside findings not inferable from monitors alone across varied scenarios. |
| Notes / narrative charting | Partial: one SBAR communication note. | Partial/pass seed: focused nursing note plus handoff note. | No multi-day note evolution and limited provider/nursing narrative breadth. | Include follow-up notes showing scenario evolution, actions, response, uncertainty, and evidence links. |
| Orders / medications / interventions | Partial: care-plan intent and provider notification; weak order/fulfillment semantics. | Partial/pass seed: ABG order, oxygen action, specimen collection, and result-driven reassessment. | Medication/MAR, reconciliation, holds/admins, and intervention response obligations remain thin. | Include at least one target row with medication/MAR/reconciliation depth and fulfillment/open-loop semantics. |
| Labs / diagnostics | Gap: no clinically meaningful lab/diagnostic sequence. | Pass seed: ABG/lactate result linked to collection and reassessment. | Only one lab/diagnostic pattern; no imaging/result-review variety. | Include asynchronous labs/diagnostics that change, confirm, or contradict interpretation across multiple rows. |
| Care plan / handoff | Partial: active care-plan intent and SBAR/open intent, but no true shift handoff note. | Pass seed: care-plan watch item and handoff communication/note. | Continuity remains single-day; no multi-shift/multi-day handoff progression. | Include next-shift concerns, pending work, contingencies, and follow-up obligations across multi-day rows. |

## Cross-cutting gaps before this packet can pass

1. Corpus breadth is below the `>=5 patients` gate; only two seed patients exist.
2. Existing rows overfit respiratory deterioration and do not prove varied admits or broad EHR skeleton coverage.
3. No row records Synthea seed, version, and parameters; future Synthea-seeded rows must distinguish baseline content from hand-crafted ICU acute augmentation.
4. No operator has signed this packet as pass / conditional pass / fail.
5. ADR018 spike input is not summarized here yet, so this packet cannot be paired with the projection comparison for ADR 019.
6. Later machine checks for matrix completeness, source tags, timing/provenance, hidden-state exclusion, memory-proof sections, evidence-chain stress, and waiver fields remain unimplemented by design.
7. This docs/review-only lane deliberately does not edit fixtures, validators, importers, schemas, source, scripts, generated artifacts, or package files.

## Minimum target scenario set

The passing corpus should include at least five reviewed patient rows (the >=5 / ≥5-patient target). The initial target set is:

1. `patient_001` — respiratory deterioration seed; retained as seed evidence only unless broadened in a later approved fixture lane.
2. `patient_002` — respiratory worsening with ABG/order/action/handoff seed; retained as seed evidence only unless broadened in a later approved fixture lane.
3. `patient_003` — proposed sepsis/shock or infection escalation row with multi-day diagnostics, interventions, result review, and ICU acute augmentation.
4. `patient_004` — proposed cardiac/renal medication-management row with reconciliation, MAR/order semantics, renal lab review, and follow-up plan changes.
5. `patient_005` — proposed post-op/frailty/delirium/fall-risk continuity row with baseline function, nursing assessment, safety constraints, and multi-shift handoff.

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
