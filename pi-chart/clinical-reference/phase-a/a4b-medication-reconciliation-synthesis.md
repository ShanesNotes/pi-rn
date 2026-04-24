# A4b. Medication reconciliation & home medication list — synthesis

*Council note:* This synthesis intentionally keeps the council's productive internal competition visible. Claude's draft won the first round on transition-batch structure, list-snapshot semantics, and home-med item addressability. GPT's draft pushed harder on source-kind restraint, patient-facing discharge communication, and avoiding a hidden medication-state module. The council is competitive, but the competition is in service of one shared goal: a safer substrate for medication decisions, handoffs, and patient care.

## 1. Clinical purpose

Medication reconciliation is the clinical discipline of comparing medication states at care transitions — home vs admission, inpatient vs transfer, inpatient/home vs discharge — and producing a coherent medication plan that resolves omissions, duplications, substitutions, holds, discontinuations, and unknowns. Its purpose is not to maintain a pretty medication list. Its purpose is to prevent medication-transition errors at the seams where they most often occur. A patient admitted on seven home medications who leaves the ED on three, with no accountable decision about the other four, is the archetypal reconciliation failure. In the seed MICU pneumonia context, A4b asks: did the patient's home lisinopril get held because of hypotension / renal perfusion concern, or did it fall off the plan because no one reconciled it? A4 is the fulfillment ledger of what happens to inpatient medication orders; A4b is the assessment layer that decides whether the right medication intents exist at transition boundaries.

## 2. Agent-native transposition

Medication reconciliation is not a med-rec tab, a home-med list, or a printable discharge handout. In pi-chart it is **a transition-anchored assessment over medication-state snapshots that produces discrepancy-resolution tasks and medication intents**.

The three medication states are:

1. **Home medication state** — what the patient was reportedly taking before the transition, represented as a time-stamped `observation.home_medication_list` snapshot.
2. **Active inpatient medication-intent state** — currently active medication `intent.order` events, read from A4 / A9a order state.
3. **Post-discharge medication state** — the medications the patient should take after discharge, represented as `observation.discharge_medication_list` plus patient-facing `communication.discharge_med_instructions`.

The legacy EHR screen collapses those states into side-by-side rows and checkboxes. That collapse is not load-bearing. What must survive is the **per-medication reconciliation decision**: for each home or active medication at a transition, what was decided, why, what evidence supports the decision, and what downstream order/task/communication resulted.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Home medication list on admission paperwork | `observation.subtype = home_medication_list` — snapshot with `data.items[]`; list supersedes list | `currentState(axis:"home_medications")` proposed; `timeline()` |
| Patient says “I take a blue blood pressure pill” | `observation.home_medication_list` with incomplete item + `data.list_completeness = partial_pending_verification` | `openLoops(kind:"recon_pending_verification")` |
| Pharmacy / outside-records verification | Existing event source kind + `data.items[].source_subtype` for v0.2; new external-retrieval source kinds deferred to §16 Q4 | `evidenceChain()` |
| Per-home-med admission decision | `assessment.subtype = medication_reconciliation` with `data.transition = admission`, `data.disposition`, rationale, and home-med item reference | `timeline()`, `evidenceChain()`, `openLoops()` |
| “Continue home medication” | Reconciliation assessment supports a new or continued medication `intent.order`; the order is A4/A9a, not duplicated in A4b | `currentState(axis:"medications")`, `evidenceChain()` |
| “Hold home medication” | `assessment.medication_reconciliation` with `disposition = hold`, rationale, and supporting vitals/labs/problems | `openLoops()`, `narrative()` |
| “Substitute formulary/route equivalent” | `assessment.medication_reconciliation` with `disposition = substitute` and `data.substitute_intent_ref` pointing to the new `intent.order` | `evidenceChain()` |
| Unknown dose/name pending callback | `intent.subtype = reconciliation_task`, closed by `action.subtype = reconciliation_resolved` and a superseding reconciliation assessment | `openLoops(kind:"recon_task")` |
| Transfer medication review | New transition batch of `assessment.medication_reconciliation` events over active inpatient medication set | `timeline()`, `openLoops()` |
| Discharge medication list | `observation.subtype = discharge_medication_list` snapshot derived from reconciliation decisions and discharge medication intents | `currentState(axis:"home_medications")` post-discharge; `narrative()` |
| Printed / verbal discharge med instructions | `communication.subtype = discharge_med_instructions`, optionally paired with a note/artifact; not merely rendered UI | `narrative()`, `evidenceChain()` |
| “Med rec complete” checkbox | `assessment.subtype = medication_reconciliation_complete` summarizing transition-batch coverage | `openLoops()` |
| Allergy discovered during med rec | A0b constraint supersession; A4b may cite discovery but does not own allergy truth | `readActiveConstraints()`, `evidenceChain()` |

> A4 asked whether ordered drugs happened. A4b asks whether the medication plan crossing a boundary is coherent.

Load-bearing claims:

**(a) Reconciliation is primarily an assessment, not an action.** The primitive work is deciding and documenting the disposition of medication-state discrepancies. The order, hold, substitute, restart, or discontinue intent that results from the decision is A4/A9a. The reconciliation assessment is the reasoning record; the medication intent is the execution record.

**(b) Home medications are observations, not constraints and not inpatient intents.** They describe what the patient reportedly takes, not what the hospital ordered and not what the patient must continue taking. Treating home meds as constraints implies they should all remain active; treating them as intents implies the inpatient team ordered them. Both are wrong.

**(c) The list snapshot is the supersession unit.** A best-possible-medication-history update is normally reissued as a coherent list, not as a dozen independent item events. Item-level addressability is still required for reconciliation decisions, but item-level eventization is rejected unless future fixtures prove the list-snapshot model breaks.

**(d) Transition batches are independent claims.** Admission, transfer, and discharge reconciliation decisions are not the same claim being repeatedly superseded. They are separate decisions at separate care-transition boundaries. Supersession is allowed within a transition when new information corrects that transition’s earlier decision.

**(e) Patient-facing discharge instructions are canonical communication.** A discharge medication list snapshot answers “what is the plan?” A patient-facing communication answers “what was transmitted to the patient/caregiver?” Both are needed for safety. The instruction handout may be rendered or attached as an artifact, but the fact of communication is a chart event.

**(f) A4b does not duplicate A4’s medication ledger.** Continue/substitute/resume decisions point to medication `intent.order` events; they do not copy drug/dose/route payloads after the order exists. Duplication creates drift: the reconciliation says lisinopril 10 mg, the order changes to 20 mg, and the chart now contains two competing medication truths.

## 3. Regulatory / professional floor

1. **[regulatory] The Joint Commission medication-information continuity requirement** — historically anchored at NPSG.03.06.01 (maintain and communicate accurate patient medication information across the continuum of care). Effective January 1, 2026, for Hospital and Critical Access Hospital accreditation programs, the National Patient Safety Goals chapter is replaced by the National Performance Goals (NPG) chapter — 14 high-priority measurable topics. Per The Joint Commission, the NPGs *reorganize and elevate* existing requirements rather than adding new ones; the medication-information-continuity function persists under the new structure. Phase A should anchor on the function (medication-information continuity at care transitions) rather than hard-coding the deprecated NPSG.03.06.01 chapter label as the sole current reference. Verify the exact NPG mapping during any future implementation-phase regulatory review.
2. **[regulatory] CMS 42 CFR 482.24(c)** — the medical record must describe progress and response to medications/services, entries must be dated/timed/authenticated, and records must include medication records plus orders, nursing notes, treatment reports, labs, vitals, and other monitoring information. Anchors reconciliation decisions as dated, authenticated chart claims.
3. **[regulatory] CMS 42 CFR 482.43** — discharge planning must support effective transition to post-discharge care and transmit necessary medical information at discharge/transfer. Anchors discharge medication list plus patient/caregiver communication.
4. **[professional] AHRQ MATCH toolkit / ASHP pharmacist-role guidance** — best-possible-medication-history technique, pharmacist involvement for high-risk regimens, and standardized discrepancy resolution. Anchors `author.role: pharmd` and the verification/task lifecycle.
5. **[interop/professional] HL7 FHIR MedicationStatement / MedicationRequest boundary** — reported medication use is distinct from ordered medication. This supports representing home medication state separately from inpatient/discharge medication intents.

`[phase-b-regulatory]` — exact 2026 Joint Commission NPG chapter mapping, state-specific med-rec policy windows, PDMP checks, e-prescribing/NCPDP SCRIPT requirements, specialty-specific perioperative/transplant/oncology medication-hold rules, and controlled-substance reconciliation details.

## 4. Clinical function

Medication reconciliation is consumed at care-transition boundaries and when new external medication information arrives.

- **Admission reconciliation.** The team obtains a best-possible medication history from patient, caregiver, pill bottles, outpatient pharmacy, prior records, and imported data. For every home medication the team decides: continue, hold, discontinue, substitute, resume later, or verify. The decision is captured as `assessment.medication_reconciliation`; any downstream inpatient order is A4/A9a and cites the assessment.
- **Transfer reconciliation.** At intra-facility transfer or service change, the receiving team reviews the active inpatient medication-intent set and decides which medications continue, stop, convert, or need verification. This is a separate transition batch, not a supersession of admission reconciliation.
- **Discharge reconciliation.** The team compares home medication history, inpatient medication intents, active problems, constraints, and discharge goals. It produces a post-discharge medication plan, patient-facing instructions, and follow-up loops for unresolved medication issues.
- **Mid-encounter correction.** If pharmacy callback or outside records reveal a home medication was incorrect or missing, a new `home_medication_list` snapshot supersedes the prior list and may trigger superseding reconciliation assessments within the same transition.

Per-consumer specifics: **providers/APPs** own clinical dispositions and discharge prescriptions; **pharmacists** often author or co-author BPMH and high-risk discrepancy resolution; **RNs** obtain initial lists and deliver discharge education; **patients/caregivers** are evidence sources and communication recipients, not chart authors of reconciliation decisions; **pi-agent** surfaces gaps, drafts reconciliation tasks, and can propose unknown/pending verification claims but does not independently decide continue/hold/substitute/discontinue.

Handoff trigger: *“Which medication discrepancies are unresolved, which home meds have no disposition, and has the transition’s medication plan been communicated?”* Answered by `openLoops(kind:"recon_*")`, `timeline()` filtered to reconciliation assessments/tasks, and current medication axes.

## 5. Who documents

Primary: **admitting, receiving, or discharging provider/APP** for clinical reconciliation decisions. `source.kind: clinician_chart_action`; `author.role: provider | app`.

Secondary:

- **Pharmacist** — best-possible-medication-history, high-risk discrepancy review, external pharmacy verification, formulary substitution recommendations. `source.kind: clinician_chart_action`; `author.role: pharmd`.
- **RN** — initial patient/caregiver home-med list capture and discharge instruction communication. `source.kind: nurse_charted`; `author.role: rn`.
- **Patient/caregiver** — source for reported medication use; represented via `source.kind: patient_statement` or `data.items[].source_subtype`, not as an author of reconciliation decisions.
- **External pharmacy / outside records / HIE** — represented in v0.2 by existing source kinds plus `data.items[].source_subtype`, `source.ref`, `artifact_ref`, and/or `communication` evidence. New `source.kind` values are deferred to §16 Q4 / ADR 006.
- **Importer** — `synthea_import`, `mimic_iv_import`, or `manual_scenario` for research fixtures.
- **pi-agent** — may author provisional `intent.reconciliation_task` or `assessment.medication_reconciliation` with `disposition = unknown_pending_verification`; must not author final continue/hold/discontinue/substitute decisions without a clinician authority model from A9a.

Owner of record: transition-specific provider/APP for the reconciliation batch; pharmacist for BPMH/verification claims they author; RN for patient-facing discharge communication. Cosignature/attestation requirements can live in `author.co_signers` or supporting verification events; no new event type is needed.

## 6. When / how often

Frequency class: **per-transition + event-driven correction**.

- **Regulatory floor:** every material care transition needs medication-information continuity. Do not hard-code a clock cadence in schema.
- **Clinical practice norm:** admission reconciliation often targeted within institutional policy windows; transfer reconciliation at handoff/service change; discharge reconciliation before the patient leaves; high-risk medication verification prioritized earlier.
- **Event-driven triggers:** new admission, ICU/ward transfer, service-of-record change, discharge order, pharmacy callback, outside-record retrieval, newly discovered allergy/contraindication, or patient/caregiver correction.

A reconciliation decision does not re-fire merely because time passed. It re-fires when a transition occurs or materially new medication information invalidates the prior transition decision. A list snapshot may be superseded; transition batches remain independent unless the correction belongs to the same transition.

## 7. Candidate data elements

Aim: included rows across five shapes: home-med snapshot, reconciliation assessment, reconciliation task/resolution, discharge medication list, and discharge communication.

### `observation.subtype = home_medication_list`

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 1 | `data.items[]` | [regulatory][clinical] | ✓ | array of medication items | No input state to reconcile | patient, caregiver, pill bottle, pharmacy, outside record, import | high |
| 2 | `data.items[].item_key` | [clinical][agent][open-schema] | ✓ | stable string unique within list | Decisions cannot reference a specific item without brittle positional indexing | generated/manual | med |
| 3 | `data.items[].medication` | [clinical] | ✓ | `{name, rxnorm_code?, normalized_name?}` | Cannot identify medication; duplicates/substitutions impossible | human/import/device | high |
| 4 | `data.items[].dose_route_frequency` | [clinical] | ✓ | structured dose, route, frequency | Cannot decide continue/hold/substitute safely | patient/pharmacy/prior chart | high |
| 5 | `data.items[].last_taken` | [clinical] | ✓ | datetime/date/unknown | Cannot assess missed doses, duplication risk, perioperative holds | patient/caregiver/pharmacy | med |
| 6 | `data.items[].adherence` | [clinical] | ✓ | enum `{taking_as_prescribed, intermittent, stopped, unknown}` | Continuing a medication the patient no longer takes may be unsafe | patient/caregiver/pharmacy | med |
| 7 | `data.items[].indication_text` | [clinical] | ✓ | text / coded problem ref when known | Indication gaps cannot be detected; restart decisions weaker | patient/prior chart/provider | med |
| 8 | `data.items[].source_subtype` | [regulatory][clinical] | ✓ | enum `{patient_report, caregiver_report, pill_bottle, outpatient_pharmacy, outside_records, prior_encounter_chart, import, unknown}` | Cannot judge reliability or BPMH quality | per item | high |
| 9 | `data.items[].verified_by` | [regulatory] | ✓ | `{role, id, method?, verified_at?}` | Verification provenance missing | RN/pharmD/provider | med |
| 10 | `data.list_completeness` | [clinical][agent] | ✓ | enum `{best_possible, partial_pending_verification, unavailable, patient_unable_to_provide}` | Cannot distinguish complete list from known-incomplete list | clinician/pharmD | high |
| 11 | `effective_at` / `recorded_at` | [regulatory] | ✓ | envelope timestamps | Cannot sequence snapshots or audit delayed entry | substrate | high |
| 12 | `source.kind` + `author` | [regulatory] | ✓ | existing envelope | Source/author discipline lost | substrate | high |

### `assessment.subtype = medication_reconciliation`

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 13 | `data.transition` | [regulatory][clinical] | ✓ | enum `{admission, transfer, discharge}` | Per-transition audit impossible | clinician | high |
| 14 | `data.transition_ref` | [clinical][agent] | ✓ | encounter/transfer/discharge event id or marker | Batch cannot be anchored to the care boundary | encounter state | med |
| 15 | `data.item_ref` | [clinical][open-schema] | ✓ | `{list_event_id, item_key}` or future `homemed://` URI | Decision cannot point to the medication it reconciles | derived | high |
| 16 | `data.disposition` | [regulatory][clinical] | ✓ | enum `{continue, hold, discontinue, substitute, unknown_pending_verification}` — five dispositions only; "resume at discharge" and similar future-restart cases are modeled as `hold` with a structured `data.rationale.restart_condition` (e.g., `"restart on discharge if MAP stable ≥ 65"` or `"restart when sepsis resolved"`). A separate `resume_later` disposition would overlap with `hold` and force authoring ambiguity about when each applies. | Actual reconciliation decision missing | clinician | high |
| 17 | `data.rationale` | [regulatory][clinical] | ✓ | `{reason_code, reason_detail}` | “Why did this med disappear?” remains unanswered | clinician/pharmD | high |
| 18 | `data.resulting_intent_ref` | [clinical] | ✓ when applicable | medication `intent.order` id | Continue/substitute/discharge order cannot be traced | order write | high |
| 19 | `links.supports` | [clinical] | ✓ | EvidenceRef/event ids/vitals windows/labs/constraints | Decision lacks evidence chain | chart | high |
| 20 | `links.addresses` | [clinical] | ✓ when applicable | active problem/plan id | Medication has no clinical target; indication-gap detection fails | chart | med |
| 21 | `certainty` | [agent] | ✓ | observed/reported/inferred/planned | Agent/provisional decisions indistinguishable from clinician decisions | substrate | high |

### `intent.subtype = reconciliation_task` and `action.subtype = reconciliation_resolved`

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 22 | `data.task_kind` | [clinical] | ✓ | enum `{verify_med_name, verify_dose, verify_indication, obtain_outside_records, pharmacy_callback, patient_interview, caregiver_call}` | Pending verification cannot be assigned/closed | clinician/agent | high |
| 23 | `data.due_by` | [clinical][agent] | ✓ | ISO datetime | Open loops cannot prioritize unresolved med-rec uncertainty | clinician/policy | med |
| 24 | `data.target_item_ref` | [clinical] | ✓ | item ref / transition ref | Task cannot be tied to the discrepancy | chart | high |
| 25 | `action.reconciliation_resolved.links.fulfills` | [clinical] | ✓ | target reconciliation_task intent id | Task closure not auditable | clinician/pharmD/RN | high |
| 26 | `action.reconciliation_resolved.links.supports` | [clinical] | ✓ | communication/artifact/list snapshot evidence | Resolution has no evidence | chart | high |

### `observation.subtype = discharge_medication_list` and `communication.subtype = discharge_med_instructions`

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 27 | `discharge_medication_list.data.items[]` | [regulatory][clinical] | ✓ | medication list snapshot | Post-discharge plan not represented | provider/pharmD/order state | high |
| 28 | `items[].origin` | [clinical] | ✓ | enum `{continued_home, new_prescription, changed_dose, discontinued, substituted, resumed}` | Patient/caregiver cannot tell what changed | reconciliation/order state | high |
| 29 | `communication.discharge_med_instructions.data.recipient` | [regulatory][clinical] | ✓ | patient/caregiver | Cannot audit that the plan was communicated | RN/provider | high |
| 30 | `communication.discharge_med_instructions.links.supports` | [clinical] | ✓ | discharge list + complete reconciliation assessment | Communication not tied to canonical plan | chart | high |

## 8. Excluded cruft — with rationale

| Field | Why it exists in current EHRs | Why pi-chart excludes |
|---|---|---|
| Medication-list row color | UI scanning | Rendered from disposition/open-loop state |
| Checkbox-only “reviewed” | Fast workflow attestation | Replaced by batch completeness assessment with coverage counts |
| Insurance formulary display | Billing/dispensing workflow | Only clinically relevant substitutions become reconciliation decisions |
| Pharmacy phone/fax boilerplate | Operational contact tracking | Store only when it supports verification/resolution evidence |
| Copy-forward home med list without timestamp | Workflow speed | Unsafe; every snapshot needs effective/recorded time and source |
| “Patient unsure” free-text only | EHR pressure valve | Structured as incomplete item + reconciliation task |
| Generic “med rec done” without item coverage | Compliance checkbox | Fails the decision test; coverage counts are required |
| Discharge print-layout fields | Patient-handout formatting | Rendered/artifact layer; communication event is canonical |
| Billing medication class groupings | Coding/reporting | Derived from drug codes if needed; not chart truth |
| Hidden discrepancy score | Quality metric | External evaluation/quality trace unless it changes care |

## 9. Canonical / derived / rendered

- **Canonical**
  - `observation.home_medication_list` snapshots with item keys, source subtypes, completeness state.
  - `assessment.medication_reconciliation` per medication per transition.
  - `assessment.medication_reconciliation_complete` per transition batch.
  - `intent.reconciliation_task` and `action.reconciliation_resolved` for pending verification loops.
  - Medication `intent.order` events produced or justified by reconciliation decisions.
  - `observation.discharge_medication_list` and `communication.discharge_med_instructions`.
  - `artifact_ref` for outside records, pill-bottle photos, pharmacy faxes, or generated handouts when archived.

- **Derived**
  - Latest home medication state from non-superseded list snapshot.
  - Active inpatient medications from medication `intent.order` state.
  - Discrepancy counts by transition.
  - `openLoops(kind:"recon_*")`: missing batch, item without disposition, pending verification overdue, discharge list missing, discharge instructions not communicated.
  - Medication-list deltas between snapshots.
  - Indication-gap warnings when a continued med lacks an addressed problem.

- **Rendered**
  - Side-by-side home/admission/discharge grid, checkboxes, color badges, patient handout formatting, pill icons, collapsible discrepancy groups, “completed” banners, printed instructions layout.

## 10. Provenance and lifecycle

### Provenance

Sources of truth are mixed: patient/caregiver report, clinician-authored BPMH, pharmacist verification, prior-chart import, external pharmacy/outside records, and active order state. `source.kind` remains restricted to the existing registry in v0.2: `patient_statement`, `nurse_charted`, `clinician_chart_action`, `synthea_import`, `mimic_iv_import`, `manual_scenario`, plus relevant existing artifact/communication origins. External pharmacy/HIE/outside-record retrieval source kinds are deferred to §16 Q4.

### Lifecycle

- **Created by:** transition trigger or new medication-history evidence.
- **Updated by:** append-only supersession; a new list supersedes the prior list; a new reconciliation assessment supersedes a prior assessment only within the same transition when new evidence changes that decision.
- **Fulfilled by:** reconciliation tasks are fulfilled by `action.reconciliation_resolved`. Reconciliation decisions themselves do not carry `links.fulfills`; medication orders resulting from decisions cite them via `links.supports`.
- **Cancelled / discontinued by:** task cancellation or transition-batch supersession; medication orders are cancelled/discontinued in A4/A9a, not A4b.
- **Superseded / corrected by:** list snapshot supersession, same-transition decision supersession, or entered-in-error correction.
- **Stale when:** a transition occurs without a batch; a pending verification exceeds `due_by`; discharge list exists without patient-facing communication; new external evidence contradicts an existing decision.
- **Closes the loop when:** every transition-relevant medication item has a disposition; all unknowns have active tasks or are resolved; discharge plan is listed and communicated.

### Contradictions and reconciliation

- **Patient report vs pharmacy fill history:** preserve both; list item carries source_subtype and verification state; unresolved conflict creates task.
- **Home med vs active allergy/constraint:** preserve home-med observation; reconciliation disposition likely hold/discontinue/substitute and may trigger A0b constraint update.
- **Home dose vs prior chart dose:** preserve both as evidence; verified list snapshot supersedes earlier list.
- **Admission decision vs later transfer/discharge decision:** independent transitions, not supersession.
- **Same-transition decision corrected by pharmacy callback:** supersede within transition.
- **Discharge instructions differ from discharge medication list:** warning/open loop until communication is corrected or list is superseded.

## 11. Missingness / staleness

- **Clinically meaningful missingness**
  - No home medication list on admission.
  - Home medication list marked `partial_pending_verification` without a reconciliation task.
  - Home medication item without reconciliation disposition.
  - Hold/discontinue/substitute decision without rationale.
  - Continue/substitute/resume decision without resulting medication intent when one is expected.
  - Discharge transition without discharge medication list.
  - Discharge medication list without patient/caregiver communication.

- **Merely unknown**
  - Medication indication unknown when the medication is intentionally held pending verification.
  - Exact last_taken unknown for a chronic stable medication when it does not affect immediate inpatient decisions.
  - RxNorm absent for manual-scenario fixtures if name/dose/route/frequency are otherwise clear.

- **Staleness**
  - Per transition: no batch after transition event.
  - Per task: `due_by` passed.
  - Per list: new conflicting evidence arrives.
  - Per discharge: patient leaves or discharge event fires without completed list + communication.

- **Open loops**
  - **OL-RECON-01:** transition occurred without reconciliation batch.
  - **OL-RECON-02:** home-med item has no disposition.
  - **OL-RECON-03:** pending verification task overdue.
  - **OL-RECON-04:** disposition requires downstream medication intent but none exists.
  - **OL-RECON-05:** discharge list or patient-facing instruction communication missing.
  - **OL-RECON-06:** new external evidence contradicts same-transition decision and no superseding decision exists.

## 12. Agent read-before-write context

Before surfacing or writing any A4b-related claim, the agent reads:

- `currentState({ axis:"home_medications", asOf })` if implemented; otherwise latest non-superseded `observation.home_medication_list`.
- `currentState({ axis:"medications", asOf })` or active `intent.order` medication set.
- `readActiveConstraints()` for allergies, contraindications, code status, and patient preferences.
- `currentState({ axis:"problems" })` to check indications and `links.addresses` consistency.
- A1 labs and A3 vitals relevant to holds/substitutions: Cr/eGFR, INR, K+, BP/MAP, HR, oxygenation.
- Recent A4 MAR actions when transfer/discharge decisions depend on actual administration history.
- Prior reconciliation batches via `timeline()` and `evidenceChain()`.
- `openLoops({ kind:"recon_*" })` so it does not duplicate an existing task.
- `artifact_ref` / `communication` evidence for external records or pharmacy callbacks.

Agent restrictions:

- The agent may propose or surface reconciliation tasks.
- The agent may write `unknown_pending_verification` provisional assessments with clear `certainty: inferred` / author role.
- The agent must not independently author final continue/hold/discontinue/substitute decisions unless future project-owner policy grants a clinician-authority workflow.
- The agent must not leak hidden simulator truth or external evaluation labels into the chart.

## 13. Related artifacts

- **A0a** — encounter and transition events anchor reconciliation batches.
- **A0b** — allergies/constraints discovered during reconciliation update constraint truth via A0b; A4b only cites discovery.
- **A0c** — active problems provide indications and `links.addresses` targets.
- **A1** — renal function, electrolytes, INR, drug levels justify holds/substitutions.
- **A3** — hypotension, bradycardia, hypoxia justify holding/resuming home meds.
- **A4** — A4b decisions create/support medication intents; A4 records whether those orders were administered/held/refused/omitted.
- **A5** — NPO status, enteral access, dialysis access, and I/O status affect route/substitution decisions.
- **A6** — provider admission/discharge narratives cite structured reconciliation decisions.
- **A7** — RN admission history and discharge teaching narratives cite home-med and discharge-instruction events.
- **A8** — cognitive status, swallowing ability, functional status, and caregiver capacity affect discharge-med communication.
- **A9a** — medication order primitive owns resulting `intent.order` shape.
- **A9b** — admission/discharge ordersets may generate medication intents that cite reconciliation assessments.

## 14. Proposed pi-chart slot shape

### Event type + subtype

Preferred path: existing event types only; new subtypes only.

- `observation.subtype = home_medication_list`
- `observation.subtype = discharge_medication_list`
- `assessment.subtype = medication_reconciliation`
- `assessment.subtype = medication_reconciliation_complete`
- `intent.subtype = reconciliation_task`
- `action.subtype = reconciliation_resolved`
- `communication.subtype = discharge_med_instructions`

These subtypes are additive but earned. No new storage primitive and no new event type is proposed.

### Home medication list snapshot

```jsonc
{
  "id": "evt_20260418T0615_home_meds",
  "type": "observation",
  "subtype": "home_medication_list",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T06:15:00-05:00",
  "recorded_at": "2026-04-18T06:20:00-05:00",
  "author": { "id": "pharmd_lee", "role": "pharmd" },
  "source": { "kind": "clinician_chart_action", "ref": "BPMH" },
  "certainty": "reported",
  "status": "final",
  "data": {
    "list_completeness": "partial_pending_verification",
    "items": [
      {
        "item_key": "lisinopril_10mg_po_daily",
        "medication": { "name": "lisinopril", "rxnorm_code": "29046" },
        "dose_route_frequency": { "dose": 10, "unit": "mg", "route": "PO", "frequency": "daily" },
        "last_taken": "2026-04-17",
        "adherence": "taking_as_prescribed",
        "indication_text": "hypertension",
        "source_subtype": "patient_report",
        "verified_by": { "role": "pharmd", "id": "pharmd_lee", "method": "patient_interview" }
      },
      {
        "item_key": "unknown_blue_bp_pill",
        "medication": { "name": "unknown blue blood pressure pill" },
        "dose_route_frequency": { "route": "PO", "frequency": "unknown" },
        "source_subtype": "patient_report",
        "verified_by": { "role": "rn", "id": "rn_shane", "method": "patient_interview" }
      }
    ]
  },
  "links": { "supports": [] }
}
```

### Per-medication reconciliation assessment

```jsonc
{
  "id": "evt_20260418T0630_recon_lisinopril",
  "type": "assessment",
  "subtype": "medication_reconciliation",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T06:30:00-05:00",
  "recorded_at": "2026-04-18T06:35:00-05:00",
  "author": { "id": "app_morgan", "role": "app" },
  "source": { "kind": "clinician_chart_action", "ref": "admission_reconciliation" },
  "certainty": "inferred",
  "status": "final",
  "data": {
    "transition": "admission",
    "transition_ref": "enc_001#admission",
    "item_ref": { "list_event_id": "evt_20260418T0615_home_meds", "item_key": "lisinopril_10mg_po_daily" },
    "disposition": "hold",
    "rationale": {
      "reason_code": "hypotension_or_hypoperfusion_risk",
      "reason_detail": "Hold home ACE inhibitor during septic shock evaluation; MAP low and creatinine elevated."
    }
  },
  "links": {
    "supports": [
      { "kind": "vitals_window", "ref": "vitals://enc_001?name=map&from=2026-04-18T0600:00-05:00&to=2026-04-18T0630:00-05:00", "role": "primary" },
      "evt_20260418T0625_cr_1_8"
    ],
    "addresses": ["evt_problem_sepsis_hypoperfusion"]
  }
}
```

### Reconciliation task and resolution

```jsonc
{
  "type": "intent",
  "subtype": "reconciliation_task",
  "data": {
    "task_kind": "pharmacy_callback",
    "target_item_ref": { "list_event_id": "evt_20260418T0615_home_meds", "item_key": "unknown_blue_bp_pill" },
    "due_by": "2026-04-18T12:00:00-05:00",
    "reason": "Verify medication name and dose before admission reconciliation can be completed."
  }
}
```

```jsonc
{
  "type": "action",
  "subtype": "reconciliation_resolved",
  "data": {
    "resolution": "verified_as_amlodipine_5mg_daily",
    "method": "outpatient_pharmacy_callback"
  },
  "links": {
    "fulfills": ["evt_20260418T0640_recon_task_blue_pill"],
    "supports": ["evt_20260418T1015_pharmacy_callback_note"]
  }
}
```

### Discharge medication list + communication

```jsonc
{
  "type": "observation",
  "subtype": "discharge_medication_list",
  "data": {
    "items": [
      {
        "item_key": "amoxicillin_clavulanate_875_125_po_bid_5d",
        "origin": "new_prescription",
        "medication": { "name": "amoxicillin-clavulanate" },
        "dose_route_frequency": { "dose": "875/125", "unit": "mg", "route": "PO", "frequency": "BID", "duration": "5 days" }
      },
      {
        "item_key": "lisinopril_10mg_po_daily_resume",
        "origin": "resumed",
        "medication": { "name": "lisinopril" },
        "dose_route_frequency": { "dose": 10, "unit": "mg", "route": "PO", "frequency": "daily" }
      }
    ]
  },
  "links": { "supports": ["evt_discharge_reconciliation_complete"] }
}
```

```jsonc
{
  "type": "communication",
  "subtype": "discharge_med_instructions",
  "data": {
    "recipient": "patient",
    "mode": "verbal_and_printed",
    "teach_back_completed": true,
    "summary": "Reviewed new antibiotic, resumed home lisinopril, and discontinued duplicate OTC cold medication."
  },
  "links": { "supports": ["evt_discharge_medication_list"] }
}
```

### Link conventions

- `links.supports` — reconciliation decisions cite home-med list items, labs, vitals, constraints, problems, outside records, and prior orders.
- `links.addresses` — reconciliation decisions may address active problems/medication goals.
- `links.supersedes` — same-transition correction or list supersession only.
- `links.fulfills` — `action.reconciliation_resolved` fulfills `intent.reconciliation_task`; medication orders/actions use A4/A9a fulfillment rules. **`assessment.medication_reconciliation` events do NOT carry `links.fulfills`** — reconciliation decisions are assessments, not fulfillments of intents. This preserves the A4 §2 claim (f) discipline that `fulfills` stays narrow (action → intent, or action → dose occurrence per A4-Q1). Medication `intent.order` events resulting from reconciliation decisions cite the reconciliation assessment via `links.supports`, not `links.addresses` or `links.fulfills`.
- `links.corrects` — entered-in-error list/decision correction.
- `links.resolves` — may resolve an open reconciliation loop if ADR 009 is used for loop closure; no new link kind needed.

### Schema confidence

- **High:** reconciliation-as-assessment, home-med-list-as-observation, per-transition batch, existing source-kind discipline.
- **Medium:** item_key / future `homemed://` addressability, discharge instruction communication subtype.
- **Low/open:** currentState axis expansion, external-retrieval source-kind amendment, list-shaped observation precedent for other artifacts.

## 15. Validator and fixture implications

### Validator rules

- **V-RECON-01:** Every transition event requiring med rec must have a reconciliation batch or an OL-RECON-01 open loop. Severity: warning in replay/live, error in completed fixture validation.
- **V-RECON-02:** Every item in the active `home_medication_list` for an admission/discharge transition must have exactly one active `assessment.medication_reconciliation` decision for that transition, or an active `intent.reconciliation_task`. Severity: error.
- **V-RECON-03:** `continue`, `substitute`, and discharge-start dispositions that require an order must link to or be linked from a medication `intent.order`. Severity: error when transition is complete. *Note: `hold` with `rationale.restart_condition` does NOT require a resulting intent at the hold-writing time; the restart produces an order at the restart moment, which cites this reconciliation via `links.supports`.*
- **V-RECON-04:** `hold`, `discontinue`, and `substitute` decisions must carry rationale and supporting evidence. Severity: error.
- **V-RECON-05:** Unknown/pending dispositions must create or cite a reconciliation task with `due_by`. Severity: error.
- **V-RECON-06:** A4b events must use existing `source.kind` values unless ADR 006 is amended. External retrieval details live in `source.ref`, `data.items[].source_subtype`, `artifact_ref`, or `communication`. Severity: warn→error.
- **V-RECON-07:** `home_medication_list.data.items[].item_key` must be unique within the list event. Severity: error.
- **V-RECON-08:** Supersession across reconciliation decisions must be within the same transition unless explicitly marked as correction of entered-in-error. Severity: error.
- **V-RECON-09:** Discharge reconciliation completion requires a `discharge_medication_list` plus `communication.discharge_med_instructions` unless patient/caregiver unavailable is documented. Severity: error in completed discharge fixture.
- **V-RECON-10:** Agent-authored final clinical dispositions (`continue`, `hold`, `discontinue`, `substitute`) require human confirmation or are invalid under Phase A rules. Severity: error.

### Minimal fixture set

1. **Clean admission reconciliation** — complete home-med list with three meds; all receive dispositions; batch complete.
2. **Hold with evidence** — home lisinopril held for hypotension/AKI, citing MAP vitals window and creatinine lab.
3. **Substitution** — home apixaban substituted with inpatient heparin order; `substitute_intent_ref` links to A4/A9a order.
4. **Pending verification** — unknown blue BP pill produces reconciliation task; pharmacy callback resolves it; new list snapshot supersedes old; same-transition decision superseded.
5. **Constraint discovery** — patient reports penicillin anaphylaxis during home-med review; A0b constraint is superseded; A4b cites but does not own allergy truth.
6. **Transfer batch** — ICU to ward transfer reviews active medication intents, independent from admission batch.
7. **Discharge batch** — discharge medication list produced and communicated; teach-back communication closes OL-RECON-05.
8. **Agent-surfaced gap** — pi-agent detects home-med item without disposition and writes provisional reconciliation task, not a final decision.

## 16. Open schema questions

1. **Q1 — Home-medication-list item addressability.** How should reconciliation decisions reference individual items within a list snapshot without materializing each item as an event? Leading lean: `item_key` in v0.2; migrate to deterministic `homemed://` URI when A3/A4 addressability ADR work matures.
2. **Q2 — List-shaped observation precedent.** Is `observation.home_medication_list` with `data.items[]` acceptable, or should list-shaped medication state become a new type / per-item events? Leading lean: keep as observation; document the precedent for discharge lists and future list-shaped artifacts.
3. **Q3 — Medication current-state axes.** Should `currentState` gain `axis:"home_medications"`, `axis:"medications"`, and A3’s `axis:"context"` in one ADR? Leading lean: yes, resolve cross-artifact rather than per artifact.
4. **Q4 — External retrieval source kinds.** Should outpatient pharmacy, HIE, outside-record retrieval become canonical `source.kind` values? Leading lean: keep existing source kinds in v0.2; propose ADR 006 amendment when external retrieval becomes implementation work.
5. **Q5 — Reconciliation decision lifecycle and discharge closure.** How do within-transition supersession, cross-transition independence, discrepancy resolution, batch completeness, and patient-facing discharge communication compose? Leading lean: strict within-transition supersession; independent transition batches; discharge complete only when list + communication exist.

## 17. Sources

- pi-chart Phase A Execution Plan — A4b is paired with A4: MAR is fulfillment ledger; reconciliation is intent-layer assessment comparing home/inpatient/discharge medication state.
- pi-chart Phase A Charter — primitive discipline, schema entropy budget, canonical/derived/rendered separation, and pi-sim boundary.
- pi-chart DESIGN.md — source.kind registry, envelope/link grammar, view primitives, currentState/openLoops discipline.
- pi-chart CLAIM-TYPES.md — observation, assessment, intent, action, communication, artifact_ref families.
- A3 synthesis — stream/window addressability and currentState axis precedent.
- A4 synthesis — medication intent/action/response loop and `meddose://` addressability precedent.
- A4b Claude draft — transition-batch model, home-med list snapshot, per-medication reconciliation assessments, reconciliation tasks, list-shaped observation questions.
- A4b GPT draft — medication-state coherence framing, source-kind restraint, discharge instruction communication, and conservative external-retrieval handling.
- The Joint Commission — National Patient Safety Goals / National Performance Goals transition page; medication-information continuity requirement historically associated with NPSG.03.06.01.
- CMS eCFR — 42 CFR 482.24 Medical record services; 42 CFR 482.43 Discharge planning.
- AHRQ MATCH Toolkit — medication reconciliation at transitions.
- ASHP Statement on the Pharmacist's Role in Medication Reconciliation.
- HL7 FHIR R5 — MedicationStatement and MedicationRequest boundary.
