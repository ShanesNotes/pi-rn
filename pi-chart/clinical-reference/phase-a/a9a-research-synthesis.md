# A9a Research Synthesis — Individual Order Primitive Council Synthesis

*Council synthesis note.* This file now reconciles the prior A9a research output with the competing same-prompt artifact. The merged research keeps `intent.order` + `data.order_kind` as the main thesis and incorporates the stronger decision framing around authoring channel metadata, PRN trigger payloads, blood-product prepare/transfuse obligations, restraint renewal, and explicit boundary protection for A9b.

## 1. Decision answered

A9a should define the **atomic individual order** as an existing pi-chart `intent.order` event with a polymorphic `data.order_kind` payload. The order is the accountable request/authorization/instruction. It is not the CPOE row, order composer UI, CDS alert, task list item, MAR row, result, or note sentence.

**Thesis:** An individual order is an accountable intent that authorizes or requests a patient-specific clinical activity, creates time-bound obligations, constrains downstream actions, and remains queryable until fulfillment, supersession, cancellation, expiration, or unresolved open-loop state.

## 2. Recommendation

| Decision | Recommendation | Rationale |
|---|---|---|
| Core primitive | **Adopt** `type: intent`, `subtype: order` | The live substrate already names `intent.order`; new event types would violate Phase A primitive discipline. |
| Order-family split | **Adopt** `data.order_kind` rather than many intent subtypes | A9a needs medication/lab/imaging/RT/nursing/diet/procedure/etc. coverage without creating a miniature CPOE taxonomy. |
| Fulfillment | **Adopt** action-mediated fulfillment | ADR 003 already states data-producing intents close through acquisition/performance actions; results support actions and do not fulfill orders directly. |
| Active orders | **Adopt derived state** from `currentState(axis:"intents")` | No mutable active-order list. The chart is canonical; current state is a query. |
| Order sets/protocol bundles | **Defer to A9b** | A9a may carry a parent/protocol reference, but invocation mechanics and child-order generation belong to A9b. |
| CDS alerts | **Reject as canonical events by default** | Safety checks influence write validation/openLoops; alert banners are rendered unless a clinician records an accountable override/review. |
| Verbal/telephone/secure-text order metadata | **Adopt as payload/source context + authentication loop** | Regulatory floor requires dated/timed/authenticated order capture; channel provenance matters but should not add source kinds yet. |
| PRN trigger shape | **Adopt `data.trigger_ref` + `data.trigger_text`; admin action carries `data.trigger_satisfied_by`** | Inherits A8 trigger discipline without adding `links.triggered_by`. |
| Blood product shape | **Defer; lean two coupled orders (`prepare` + `transfuse`)** | Preparation/crossmatch and administration are distinct obligations with prerequisite/expiration loops. |
| Restraint order shape | **Adopt regulation/policy-bounded `intent.order` with renewal via supersession/profile** | Tests regulatory cadence without creating a restraint module. |
| Order lifecycle | **Keep discontinuation/cancellation open-schema** | Discontinuation, cancellation, void, hold, and resume need append-only semantics but should not force a new event type prematurely. |

## 3. Evidence — primary/public synthesis

| Source class | Evidence | A9a impact |
|---|---|---|
| CMS medical-record CoPs | Hospital records must be accurate, prompt, dated, timed, authenticated; all orders, including verbal orders, must be dated/timed/authenticated; standing orders/order sets/protocols require medical-staff, nursing, and pharmacy review plus prompt authentication. | Order payload needs authorized requester/source, order mode, effective/recorded time, authentication state, and openLoop for missing authentication. |
| CMS nursing/pharmacy CoPs | Drugs/biologicals are administered according to orders and accepted standards; verbal orders must be controlled; pharmacy services must minimize medication errors and support drug information/auto-stop policies. | Medication/blood/contrast/diet safety checks are order-time validation and downstream MAR/action obligations. |
| Joint Commission / CMS secure texting guidance | CPOE remains preferred; secure text orders may be allowed only through compliant secure platforms and must be promptly captured, dated, timed, and authenticated in the EHR. | `data.order_mode` and `data.authentication` are load-bearing; the text-message itself is supporting communication/artifact, not the order primitive. |
| ONC/ASTP SAFER CPOE guide | CPOE/CDS safety depends on order structure, mapping, libraries, alerts/warnings, monitoring, and multidisciplinary governance. | A9a should store structured order intent; validators/openLoops handle missing prerequisites and unsafe writes. Do not store alert UI. |
| Leapfrog CPOE Evaluation Tool | Tests whether inpatient CPOE warns against serious medication errors, including interactions, excessive dose, route, diagnosis, age, labs, and monitoring, while also measuring over-alerting/alert fatigue. | Order validators need active constraints, labs, age/baseline, renal/weight data, monitoring requirements, and override discipline. |
| HL7 FHIR Request/ServiceRequest/MedicationRequest witnesses | FHIR separates request/order state from performer activity; execution state belongs to corresponding events/Task-like workflow; request fields include priority, occurrence, requester, performer, reason, supporting information, basedOn/replaces/grouping. | Use FHIR as witness only: `intent.order` keeps order truth; actions/observations/reviews close loops. Do not import FHIR resource taxonomy. |
| Johns Hopkins VTE order-set example | Service-specific CPOE order sets with mandatory risk/contraindication assessment and recommended orders improved appropriate VTE prophylaxis; monitoring still found missed administrations. | A9a must store child orders atomically; A9b will model parent invocation. Orders are necessary but not sufficient — downstream fulfillment loops remain separate. |

## 4. Pi-chart mapping

| Legacy artifact | A9a mapping | Owned elsewhere |
|---|---|---|
| Active order row | `intent.order` + `data.status_detail: active` | active-order list is derived |
| Medication order | `intent.order` with `order_kind: medication` | A4 owns administration/hold/refusal/omission/titration fulfillment |
| Continuous infusion order | `intent.order` with medication/fluid payload + titration/target metadata | A4 owns rate epochs/actions; A3 owns response vitals |
| Lab order | `intent.order` with `order_kind: lab` and expected `specimen_collection` fulfillment | A1 owns lab result observation; A2 owns result review |
| Imaging order | `intent.order` with expected `imaging_acquired` fulfillment | A2 owns diagnostic result/review |
| Procedure/LDA order | `intent.order`; fulfilled by `action.procedure_performed` | A5 owns LDA context segments/assessments |
| Nursing/monitoring order | `intent.order` or `intent.monitoring_plan` depending duration/cadence | A3/A5/A8 own measurement/finding evidence |
| Consult/referral order | `intent.order` or existing `intent.referral` depending implementation | A6 owns consult note; action/communication owns delivery |
| Diet/NPO/activity/restraint | `intent.order` with safety/constraint payload | A0b may own constraints such as code status/blood restriction |
| Protocol/standing-order child | ordinary `intent.order` citing protocol/order-set source | A9b owns invocation model and parent-child generation |

## 5. Schema entropy level

| Proposal | Entropy level | Reason |
|---|---:|---|
| `intent.order` as A9a primitive | 0–1 | Existing subtype already recognized by repo and prior artifacts. |
| `data.order_kind` polymorphic registry | 2 | New payload shape, not a new event type. |
| Family-specific nested payloads | 2 | Needed for meds/labs/imaging/procedures without subtype explosion. |
| `expected_fulfillment` payload | 2 | Makes ADR 003 executable for result-producing orders. |
| `data.order_mode` / authentication loop for verbal/text orders | 2 | Regulatory payload, existing event/link/source grammar. |
| Order occurrence URI beyond A4 `meddose://` | 3/open | Needs open-schema decision if generalized across labs/RT/monitoring. |
| Active-order storage file | 6–7 rejected | Would violate chart-as-claims/current-state-as-query. |

## 6. Tests / acceptance criteria

- A medication order can be written only after active constraints are read; unsafe conflicts block or require structured override per profile.
- A lab order is not fulfilled by the lab result directly; it is fulfilled by `action.specimen_collection`, with the result supporting the action and later review handled by A2.
- A CXR order is not closed by a note sentence; acquisition/review events and diagnostic artifacts close the relevant loops.
- A norepinephrine infusion order creates titration and response obligations; A4 rate epochs and A3 MAP/vital windows fulfill/evidence those obligations.
- A verbal/secure-text order creates an authentication/read-back loop until properly dated/timed/authenticated.
- A PRN administration without trigger-satisfaction evidence creates an openLoop.
- A blood-product transfuse order without a valid prepare/type-screen/crossmatch prerequisite creates a missing/stale prerequisite loop.
- A restraint order with an expired effective window or renewal obligation creates a regulation/profile-driven openLoop.
- A discontinued order is represented by append-only supersession/cancellation semantics, not mutation of the original event.
- `currentState(axis:"intents")` can reconstruct active orders; no canonical active-order list exists.

## 7. Negative-space findings — what not to copy

- Do not copy the order composer UI.
- Do not copy order tabs, section headers, favorites, preference lists, row colors, or release buttons.
- Do not treat CDS alerts as chart facts.
- Do not import FHIR’s resource taxonomy as internal pi-chart event types.
- Do not let one `action.verification` fulfill the medication order; it resolves a prerequisite loop only.
- Do not store due-time cells as canonical order children unless an occurrence-identity ADR accepts that pattern.
- Do not let A9a absorb A9b’s order-set invocation semantics.
- Do not use `links.addresses` for non-problem targets; prophylaxis/screening/protocol cases need explicit indication exceptions.

## 8. Open questions for Shane/operator

1. Should `data.order_kind` be a closed enum or a profile-registered enum?
2. Should scheduled-order occurrence identity generalize beyond A4 `meddose://`?
3. Should discontinue/cancel/void be modeled as superseding `intent.order`, `action.cancel`, `status_detail`, or a small combination?
4. Should `data.indication_exception` be a closed enum, or should a future `assessment.risk` primitive absorb prophylaxis/screening rationale?
5. Does blood product ordering become two coupled orders (`prepare` + `transfuse`) or one order with distinct phases?
6. Where exactly is the boundary between `intent.order(order_kind: monitoring)` and `intent.monitoring_plan`?
7. What minimal A9a parent/protocol reference is safe before A9b defines orderset invocation?
