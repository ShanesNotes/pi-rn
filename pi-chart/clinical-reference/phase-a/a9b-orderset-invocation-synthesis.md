# A9b — Orderset / Standing-Protocol / Template Invocation

## Council Synthesis

**Status:** Council-synthesis draft (reconciles competing-artifact council recommendation with prior research draft).
**Phase:** A · Budget-expanded artifact (Charter §7) · Length budget 6–8 pages · Open-schema cap WAIVED.
**Author:** Shane (project owner, working ICU nurse).
**Synthesis posture:** option-balanced, council-direction-preferred where divergent. Researcher leans non-authoritative.

---

## Synthesis preamble — what the council corrected

This document reconciles a prior research draft of A9b against the council-produced competing artifact (`a9b-order-sets.md`). The council made three substrate-level corrections that this synthesis adopts. They are flagged here so the reasoning is auditable rather than buried in the merged text.

**Correction 1 — Runtime slot.** Prior draft proposed `intent.orderset_invocation` as a new subtype on the existing `intent` type (entropy 1, new subtype). Council recommends keeping the runtime invocation as `action.intervention` with `data.action: "orderset_invocation"` and a constrained payload (entropy 3, new payload convention; no new subtype, no new event type). The council reasoning is substrate-faithful: invocation is a *clinician action* — the moment of applying a governed definition — not a new flavor of intent. The intents are the children. **Synthesis adopts the council position.** The prior draft was schema-overcommitting; promotion to a dedicated subtype remains an explicit follow-on ADR if generic `action.intervention` proves muddy in practice.

**Correction 2 — Parent/child provenance.** Prior draft proposed `data.invoked_by` (or escalated `links.member_of`) on each child order. Council recommends standardizing on **existing `transform` provenance surface** — `transform.activity = "orderset_apply"`, `transform.run_id = <invocation_event_id>`, `transform.input_refs[]` pointing to the invocation. Per ADR 011 the `transform` block already exists for exactly this kind of generation-provenance capture. **Synthesis adopts the council position.** This eliminates the open-schema entry on parent/child link convention by resolving it through pre-existing substrate.

**Correction 3 — No set-level lifecycle.** Prior draft proposed several set-level openLoops (`partial-bundle-fulfillment`, `unsigned-set`, `cross-invocation-conflict`, etc.) and contemplated a set-level cancel cascade event. Council position is firm: the invocation event is **provenance and governance context only**, never a second state machine. Child orders carry their own lifecycle through ordinary A9a / A4 / A1 / A2 / A5 semantics. Bundle-completion views, deduplication checks, and "is this set still active" questions are **derived** — `currentState(axis:"intents")` plus filters. **Synthesis adopts the council position.** Several open-schema entries from the prior draft collapse as a result; one or two survive in narrower form.

The prior draft's strongest contribution that the council artifact did *not* fully address — the **session-identity recurrence at four artifacts (A6/A7/A8/A9b)** — is preserved here as the dominant cross-artifact ADR signal. The council's runtime-as-action recommendation does *not* eliminate the recurrence; it just relocates the question (children carry `transform.run_id` pointing to an action event, but the underlying "what binds these N claims as a unit" pattern is still recurring).

---

## ⚠ Required flags at top of output

**F1 — Live repo inspection.** Council artifact confirms direct inspection of the live `pi-rn` repo (CMS, TJC, ONC, Leapfrog, Hopkins, FHIR PlanDefinition / RequestOrchestration witnesses). Synthesis adopts that inspection as authoritative. Public phase-a tree currently includes A0–A7; A8/A9a/A9b are **not yet committed publicly**, so this synthesis is research-first rather than reconciliation against committed public A8/A9a artifacts. The local-conversation A8/A9a council syntheses are the operative inheritance basis.

**F2 — Repo lag inconsistency.** Council noted that `clinical-reference/README.md` still says A5–A9b remain unproduced while the phase-a tree contains A5–A7. This is a documentation-lag issue, not a substrate inconsistency. Out of A9b scope; flag for Shane's housekeeping queue.

**F3 — A9b prior synthesis check.** Council artifact notes no prior public A9b file exists. Synthesis treats both inputs (prior research draft + council artifact) as equally first-pass.

**F4 — Session-identity recurrence count.** Confirmed at **four** (A6 note session, A7 note session, A8 exam session, A9b orderset invocation). Strongest cross-artifact signal in Phase A. Carried forward to summary.

---

## 1. Clinical purpose

A9b describes how *grouped* prescriptive intent — order sets, standing protocols, reusable templates, bundles, sliding-scale frames, panels — is represented in the pi-chart claim stream when a single authoring decision produces N atomic orders. The clinical question is **"how does a governed reusable artifact become patient-specific child intents, with provenance preserved, without inventing a parallel order-management subsystem"**. Motivating cases are the [Surviving Sepsis Campaign Hour-1 Bundle](https://saude.ufpr.br/labsim/wp-content/uploads/sites/23/2019/01/Surviving-Sepsis-Campaign-Hour-1-Bundle-2018.pdf), [Johns Hopkins VTE prophylaxis smart order set](https://pubmed.ncbi.nlm.nih.gov/27925423/), nurse-initiated standing orders under [42 CFR 482.24(c)(3)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24), insulin protocols ([AAFP 2010](https://www.aafp.org/pubs/afp/issues/2010/0501/p1130.html)), admission ordersets, and post-procedure ordersets.

Charter §8 makes "orderset invocation modeled as parent/child relationship" a Phase A acceptance criterion and "flat intents with no parent relationship" an explicit Phase A failure mode; A9b holds that line through `transform`-based provenance backlinks rather than through a new event type or a new link kind.

`[clinical]` `[regulatory]`

---

## 2. Agent-native transposition (scaffold — Shane will rewrite per Charter §4.4)

The legacy EHR collapses three different things into the noun "order set": (a) a **template** maintained by a system-level governance committee, (b) a **patient-specific instantiation** the prescriber confirmed at authoring time, and (c) the **individual orders** that resulted. pi-chart keeps these three separated:

- **Definition** = governed, versioned reference artifact, **outside** the patient claim stream.
- **Invocation** = point-shaped `action.intervention` event with `data.action: "orderset_invocation"`, **inside** the patient stream.
- **Children** = N atomic `intent.order` events (per A9a), each individually fulfilled, cancelled, queryable.
- **Closure** = ordinary A9a/A4/A1/A2/A5 semantics. The invocation does not own closure.


| Legacy artifact                                                 | pi-chart primitive                                                                                                                                                                                                                                                                 | Supporting views                                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Order set *template* (P&T-approved, versioned, evidence-graded) | Definition artifact / registry entry, outside `patients/<id>/`; referenced by id+version from the invocation event                                                                                                                                                                 | resolved at invocation time only; not in views                                               |
| Order set *invocation on a patient*                             | `action.intervention` with `data.action: "orderset_invocation"` and `data.definition_ref` + `data.definition_version`                                                                                                                                                              | `timeline()`, `currentState(axis:"intents")` over children, `evidenceChain()`, `openLoops()` |
| Protocol activation (sepsis Hour-1 bundle)                      | Same shape, `data.invocation_kind: "protocol"`; protocol decision-branch state machine lives in pi-agent (out-of-chart)                                                                                                                                                            | derived `axis:"intents"` filtered by `transform.run_id == invocation.id`                     |
| Standing-order trigger (nurse-initiated under approved policy)  | Same shape, `data.invocation_kind: "standing_order"`, `source.kind: "nurse"`, with delayed-authentication openLoop until practitioner authenticates per [42 CFR 482.24(c)(3)(iv)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24) | `openLoops()` kind: `pending-practitioner-authentication-of-standing-invocation`             |
| Sepsis Hour-1 bundle activation                                 | Invocation with five children: lactate, blood cultures, broad-spectrum abx, 30 mL/kg crystalloid (conditional), vasopressor (conditional) per [SCCM/SSC 2018](https://saude.ufpr.br/labsim/wp-content/uploads/sites/23/2019/01/Surviving-Sepsis-Campaign-Hour-1-Bundle-2018.pdf)   | bundle-completion is **derived** from per-child fulfillment status                           |
| VTE prophylaxis smart order set                                 | Invocation with risk-stratified children (mechanical vs pharmacologic) per [Streiff 2016](https://pubmed.ncbi.nlm.nih.gov/27925423/); mutual-exclusion enforced in *definition*, not in invocation event                                                                           | `currentState(axis:"intents")`, `openLoops()`                                                |
| Anticoagulation protocol                                        | Invocation; weight- and indication-conditioned child doses; protocol-state-machine in pi-agent                                                                                                                                                                                     | per-child supersession on rate change                                                        |
| Insulin sliding scale / basal-bolus-correction                  | Invocation, `invocation_kind: "protocol"`, with a `data.protocol_state_ref` URI to pi-agent state                                                                                                                                                                                  | child orders per administration occurrence                                                   |
| Admission orderset                                              | Invocation; large child set; personalization (preselect/required/forbidden) recorded as authoring-time selection, not as runtime constraint                                                                                                                                        | derived membership                                                                           |
| Post-procedure orderset                                         | Invocation tied to procedure event via `links.addresses`                                                                                                                                                                                                                           | derived                                                                                      |
| Order panel (CBC + BMP + lactate "draw together")               | Same primitive, `invocation_kind: "panel"` — smaller scope, no governed definition required                                                                                                                                                                                        | derived                                                                                      |
| Modified-during-invocation orderset                             | Per-child supersession events; **invocation event itself never mutated and never re-authored**; the `action.intervention` is point-shaped                                                                                                                                          | derived membership reflects supersession                                                     |
| Cancelled orderset                                              | Per-child cancellations; **no set-level cancel event**; derived view recognizes "all members cancelled"                                                                                                                                                                            | derived                                                                                      |
| Partially-fulfilled orderset                                    | Derived: per-child fulfillment counts; threshold judgment is a profile rule on a derived view, not a stored event                                                                                                                                                                  | derived                                                                                      |
| Expired orderset (definition sunset)                            | Invocation immutably records definition version; sunsetted-version detection at replay produces an openLoop only on still-active children                                                                                                                                          | derived                                                                                      |
| Cross-orderset interaction (sepsis + insulin)                   | Two invocations active simultaneously; deduplication of overlapping children is a **profile-driven derived view**                                                                                                                                                                  | derived                                                                                      |
| Version-mismatch invocation                                     | Replay validates referenced definition version still resolvable; failure → live-mode openLoop, not replay error                                                                                                                                                                    | derived                                                                                      |


The transposition is mostly a *renaming* and *placement* exercise: the underlying primitives (action, intent, links, transform, derived views) already exist; A9b adds (a) a payload convention on `action.intervention` and (b) a `transform` convention on each child intent.

---

## 3. Regulatory / professional floor (≤5 anchors — cap holds)

1. **42 CFR 482.24(c)(3)** — pre-printed and electronic standing orders, order sets, and protocols are permitted only when (i) reviewed/approved by medical staff + nursing + pharmacy leadership, (ii) consistent with nationally recognized evidence-based guidelines, (iii) periodically reviewed, and (iv) **dated, timed, and authenticated promptly in the patient's medical record by the ordering practitioner or another responsible practitioner** ([eCFR 482.24](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24)). [CMS S&C-13-20](https://www.cms.gov/Medicare/Provider-Enrollment-and-Certification/SurveyCertificationGenInfo/Downloads/Survey-and-Cert-Letter-13-20.pdf) and Tag A-0457 enforce that nurse-initiated standing orders require subsequent practitioner authentication of the patient-specific application. **This is the load-bearing regulation for A9b.**
2. **42 CFR 482.23(c)(1)(ii)** — drugs and biologicals may be prepared and administered on the orders contained within standing orders, order sets, and protocols only if those orders meet §482.24(c)(3) ([eCFR Part 482 Subpart C](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C)).
3. **42 CFR 482.24(c)(2)** + [CMS QSO-25-24 / Appendix A 2025 update](https://www.cms.gov/medicare/health-safety-standards/quality-safety-oversight-general-information/policy-memos/policy-memos-states-and-cms-locations/revisions-hospital-appendix-state-operations-manual) — all orders, including verbal and secure-text, must be dated/timed/authenticated. CMS QSO Feb 8, 2024 added permission for HIPAA-compliant secure texting platforms ([TJC FAQ secure texting](https://www.jointcommission.org/en-us/knowledge-library/support-center/standards-interpretation/standards-faqs/000002483)). A9b inherits A9a's posture: channel is payload metadata, not new source kinds.
4. **TJC Medication Management — Accreditation 360 (effective Jan 1, 2026)** — order content elements (drug, dose, route, frequency, indication, PRN trigger) and order-set governance map into MM standards; chapter restructured but content elements remain ([TJC MM transition](https://digitalassets.jointcommission.org/api/public/content/03b59f35a60f4558a4948e48ccb2d415?v=65ce516b)). National Performance Goals (NPGs) replaced NPSGs in the 2026 cycle ([NPG #14 medications](https://www.jointcommission.org/en-us/standards/national-performance-goals/effectively-managing-medications)).
5. **ISMP Guidelines for Standard Order Sets** — order sets must be designed for content (complete orders, monitoring, indication), format (no error-prone abbreviations, radio buttons for mutual exclusion), and approval/maintenance (initial approval + revision lifecycle); they are "an essential part of clinical protocols, algorithms, and critical pathways" ([ISMP guidelines](https://www.ismp.org/sites/default/files/attachments/2018-01/StandardOrderSets.pdf), [Grissinger 2014](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3956384/)). Together with [ONC SAFER CPOE+CDS guide (2025 revision)](https://www.healthit.gov/wp-content/uploads/2025/06/SAFER-Guide-3.-CPOE-Final.pdf) and [Leapfrog CPOE Evaluation Tool 2024](https://www.leapfroggroup.org/sites/default/files/Files/CPOE%20Tool%20Guidance%202024.pdf), this defines the *governance* terrain that A9b refuses to absorb into the patient claim stream.

`[regulatory]`

---

## 4. Clinical function

The orderset / protocol / standing-order layer exists to (a) bundle proven sequences of care under cognitive load (Hour-1 bundle reasoning per [SSC 2018](https://saude.ufpr.br/labsim/wp-content/uploads/sites/23/2019/01/Surviving-Sepsis-Campaign-Hour-1-Bundle-2018.pdf)), (b) push evidence-based defaults into the path of least resistance (95.8% risk-appropriate VTE prophylaxis after smart order set vs 88.0% baseline per [Streiff 2016](https://pubmed.ncbi.nlm.nih.gov/27925423/)), (c) extend nurse capacity under defined conditions without per-patient practitioner authoring delay (CMS standing-order framework), and (d) standardize variation. The function pi-chart serves is **recording what was authored, what was acquired/given, and what loops remain open** — *not* executing protocol logic. Protocol decision branches ("if SBP < 90, start vasopressor") are pi-agent territory; pi-chart records the resulting `intent.order` events and their action-mediated fulfillment per ADR 003.

`[clinical]`

---

## 5. Who documents

- **Definition layer:** medical staff, nursing leadership, pharmacy (P&T or Medication Safety Committee), and informatics/CDS governance — required by [42 CFR 482.24(c)(3)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24). **Not patient-chart territory.**
- **Invocation layer (per patient):** the authoring prescriber for orderset/protocol invocations; the initiating nurse for standing-order invocations (with required delayed practitioner authentication).
- **Per-child fulfillment:** per A9a — the action source (RN, RT, pharmacy, lab) via acquisition/administration actions; ADR 003 holds.

`[clinical]` `[regulatory]`

---

## 6. When / how often

Invocation is **episodic** (one event per authoring decision; sepsis bundle once per code-sepsis activation; admission orderset once per admission). The *child orders* inherit each their own frequency class per A9a. Definition versions are revised on the governance cycle (typically annual review per [ISMP](https://www.ismp.org/sites/default/files/attachments/2018-01/StandardOrderSets.pdf)).

`[operational]`

---

## 7. Candidate data elements

For an **invocation** event (the `action.intervention` carrying `data.action: "orderset_invocation"`).


| Element                                  | Class               | Notes                                                                                                                                        |
| ---------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `event.id`                               | provenance          | UUID                                                                                                                                         |
| `event.type` = `action`                  | canonical           | reuse, no new type                                                                                                                           |
| `event.subtype` = `intervention`         | canonical           | reuse, no new subtype (council position; promotion deferred)                                                                                 |
| `data.action` = `"orderset_invocation"`  | canonical-payload   | discriminator within `action.intervention`                                                                                                   |
| `data.invocation_kind`                   | clinical            | enum lean: `orderset` | `protocol` | `standing_order` | `panel` | `bundle` — open-schema                                                     |
| `data.definition_ref`                    | provenance          | URI/id to governed definition (e.g., `orderset://sepsis/adult-ed-inpatient`); shape is open-schema                                           |
| `data.definition_version`                | provenance          | resolved semantic version at invocation time (immutable)                                                                                     |
| `data.indication`                        | clinical            | invocation-level indication                                                                                                                  |
| `data.indication_exception`              | clinical            | declination rationale when prescriber overrides default opt-in (e.g., VTE pharm-prophylaxis declined); open shape                            |
| `data.override_rationale`                | clinical/regulatory | per ISMP / Hopkins VTE pattern, deviation from default path requires rationale where definition mandates it                                  |
| `data.selection_mode`                    | clinical            | one of `default_only`, `default_plus_clinician_adjustments`, `clinician_constructed`, etc. — captures what the prescriber actually committed |
| `data.authoring_channel`                 | regulatory          | inherited A9a payload pattern: `cpoe_orderset`, `verbal`, `secure_text`, `nurse_standing_trigger`                                            |
| `data.protocol_state_ref`                | rendered            | opaque URI to pi-agent state machine; **pi-chart does not validate state-machine consistency**                                               |
| `data.trigger_ref` / `data.trigger_text` | clinical            | for standing-order invocations (inherited from A9a)                                                                                          |
| `data.standing_authority_ref`            | regulatory          | URI to standing-order policy (medical-staff-approved); required to satisfy 482.24(c)(3) audit                                                |
| `source.kind`                            | provenance          | reuse closed taxonomy (ADR 006) — `clinician_chart_action` | `nurse_standing_trigger` | `agent_action`                                       |
| `source.actor_id`                        | provenance          | who invoked                                                                                                                                  |
| `links.addresses`                        | provenance          | problem-subtype assessment(s) the invocation addresses (per ADR 009)                                                                         |
| `links.supports`                         | provenance          | supporting evidence (assessments, vitals windows, prior labs) per ADR 010 EvidenceRef                                                        |
| `effective_at`                           | clinical            | per ADR 005; invocation is point-shaped, not interval-shaped                                                                                 |


For each child `intent.order`:


| Element                                   | Class      | Notes                                                         |
| ----------------------------------------- | ---------- | ------------------------------------------------------------- |
| All A9a child fields (per-child)          | per A9a    | `data.order_kind`, `data.orderable`, dose/route/freq, etc.    |
| `data.authoring_channel`                  | provenance | `"orderset_generated"` to distinguish from manual orders      |
| `transform.activity` = `"orderset_apply"` | provenance | per ADR 011                                                   |
| `transform.tool`                          | provenance | e.g., `"cpoe"`, `"protocol_engine"`                           |
| `transform.run_id`                        | provenance | the invocation event id (the load-bearing parent/child link)  |
| `transform.input_refs[]`                  | provenance | structured refs back to the invocation, with `role: "source"` |


**This is the full parent/child story** — no `data.invoked_by`, no `links.member_of`, no new link kind. Existing `transform` surface carries it.

`[clinical]` `[regulatory]` `[provenance]`

---

## 8. Excluded cruft (≤10, with rationale)


| Excluded                                                            | Why it exists in EHRs                                                                                                                          | Why pi-chart excludes                                                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Order-set authoring UI state (collapsed sections, default tabs)     | EHR vendor UX                                                                                                                                  | not a patient claim                                                                                 |
| Alert-fired-during-invocation events                                | CDS audit / Leapfrog scoring                                                                                                                   | A9a council: CDS alerts not canonical                                                               |
| P&T meeting minutes for the *definition*                            | governance evidence per [42 CFR 482.24(c)(3)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24) | governance system, not patient chart                                                                |
| Evidence-grade ratings of order-set elements                        | order-set library metadata                                                                                                                     | external registry                                                                                   |
| "Order sets used today" utilization dashboards                      | hospital QA                                                                                                                                    | aggregate; derive externally                                                                        |
| Order-set personalization defaults *per prescriber*                 | EHR favorites                                                                                                                                  | provider-preference store, not patient chart                                                        |
| Vendor "order session" / "order pad" identifiers                    | Epic/Cerner internals                                                                                                                          | replaced by `transform.run_id`                                                                      |
| Pre-checkbox state of each item before user click                   | UI capture                                                                                                                                     | only the final committed children matter                                                            |
| Smart-text snippets / order comments boilerplate                    | EHR template prose                                                                                                                             | rendered, not canonical                                                                             |
| Billing/charge codes attached to set elements                       | revenue cycle                                                                                                                                  | Charter §2 hard-out                                                                                 |
| **Set-level "complete" / "in progress" / "cancelled" status field** | EHR worklist UX                                                                                                                                | invocation event is point-shaped action; child lifecycle is per-child; bundle status is **derived** |
| **Mutable bundle-membership object on the invocation**              | EHR convenience                                                                                                                                | children carry the link via `transform.run_id`; no parent mutation                                  |


`[cruft]`

---

## 9. Canonical / derived / rendered

**Canonical (per-patient chart):**

- The `action.intervention` invocation event with `data.action: "orderset_invocation"` and full payload.
- N child `intent.order` events (per A9a), each carrying `transform.run_id` pointing to the invocation.
- Per-child action events fulfilling each child (per ADR 003) — unchanged.
- For standing-order invocations: a subsequent practitioner-authentication event (shape open-schema; lean is `intent.order_authentication` reuse OR an attestation note pattern; council position kept open).

**Derived (views over canonical):**

- "Active orderset invocations" = `currentState(axis:"intents")` filtered by `transform.run_id` matching an `action.intervention.orderset_invocation`. **Direct parallel to A9a's "active orders are derived" decision.**
- "Bundle completion" = per-invocation count of children with action-mediated fulfillment vs total; threshold judgment is a profile rule (e.g., Hour-1 bundle complete iff ≥4 of 5 children acted on within 60 min).
- "Standing-order pending authentication" openLoop, with deadline driven by hospital policy / state law (CMS removed federal 48-hour ceiling per [CMS final rule 2007](https://www.federalregister.gov/documents/2006/11/27/E6-19957/medicare-and-medicaid-programs-hospital-conditions-of-participation-requirements-for-history-and)).
- Cross-orderset overlap detection for deduplication candidates.
- "Orderset cancelled" = derived predicate when all member children are cancelled — **no set-level cancel event**.

**Rendered (presentation only):**

- Order-set "title" displayed in sidebar, "evidence basis" link, definition version label.
- Protocol decision-branch *progress indicator* (current step, next-step preview) — read from pi-agent state, never canonical in pi-chart.
- Personalization summary ("3 preselected items declined").
- Bundle "completion %" badge — derived view rendered as UI affordance.

`[clinical]` `[derived]` `[rendered]`

---

## 10. Provenance and lifecycle

**Creation:** invocation event written when prescriber commits orderset/protocol authoring, or when nurse triggers standing order under predefined criteria. `source.kind` per ADR 006: `clinician_chart_action` for ordered/protocol; `nurse_standing_trigger` for standing-order initiation.

**Personalization:** `data.selection_mode` and (optionally) a snapshot of which optional items were kept/declined relative to the resolved definition version. ISMP literature treats opt-in vs opt-out, mutually-exclusive options, and required items as **definition-level constraints** ([ISMP](https://www.ismp.org/sites/default/files/attachments/2018-01/StandardOrderSets.pdf), [StatPearls CPOE](https://www.ncbi.nlm.nih.gov/books/NBK470273/)) — pi-chart records the *result* (which children are present), not enforcement.

**Partial fulfillment:** per-child fulfillment is action-mediated (ADR 003); set-level "complete" is a derived view with profile-driven thresholds. **A bundle is not an event-completion; it is a derived predicate over siblings.**

**Modification (mid-invocation):** per-child `intent.order` events are individually superseded (A9a). **The invocation event itself is never mutated and never re-authored.** If the prescriber materially changes the invocation, that is a new invocation, not an amendment of the prior one.

**Cancellation / discontinuation:** per-child cancellation only. Derived view recognizes "all members cancelled". **No set-level cancel event.** This is a council-direction correction; the prior draft kept set-level cancel as an option and the council closed it.

**Expiration:** per child `effective_period.end` (ADR 005). The invocation, being point-shaped, does not "expire" — it has happened.

**Supersession of definition version:** invocation immutably records `definition_version`. Sunset → replay can detect unresolvable version and emit a `sunsetted-definition-still-active` openLoop on still-active children only (not retroactively against past invocations).

**Cross-orderset interaction:** profile-driven derived view; not a stored event.

`[provenance]`

---

## 11. Missingness / staleness

OpenLoops attach to **children** (per A9a) or to **derived projections over children**, not to a stored set-level lifecycle. The set-level openLoops the prior draft proposed mostly collapse into derived views over children:

- `**pending-practitioner-authentication-of-standing-invocation`** — derived from "this `action.intervention` invocation has `source.kind: nurse_standing_trigger` and no subsequent authentication event closes the loop". Deadline = max(state law, hospital policy); replay error vs live openLoop is replay-mode dependent. **Required by [42 CFR 482.24(c)(3)(iv)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24).** This is the only set-level openLoop that survives — and it survives because federal regulation requires it.
- `**partial-bundle-fulfillment`** — derived from per-child fulfillment counts within profile-driven window (e.g., Hour-1 bundle children expected within 60 min). Profile rule on a derived view, not a stored event.
- `**agent-protocol-pending-input**` — pi-agent reports the protocol is awaiting input; this surfaces in pi-agent's own openLoop projection. pi-chart does not store the protocol state.
- `**sunsetted-definition-still-active**` — definition version no longer in active registry while at least one child still has `effective_period` that includes now.
- `**cross-invocation-conflict**` / `**duplicate-child-across-invocations**` — profile-driven derived view; not a stored openLoop kind on canonical events.

Child-level openLoops (overdue fulfillment, missing acknowledgment, missing pharmacy verification, etc.) are **A9a's territory** and unchanged.

`[clinical]` `[derived]`

---

## 12. Agent read-before-write context

Before an agent writes any child-order intent or fulfillment action, it must resolve, for the patient:

1. `currentState(axis:"intents")` projected over `transform.run_id` to identify **active invocations** with their kind, definition_ref, definition_version, and currently-active children.
2. For each active invocation, the open-loop set: are bundle elements still pending? is practitioner authentication pending (standing orders)? is the protocol stalled?
3. The deduplication surface: would a new child duplicate a still-active sibling in another invocation?
4. The selection_mode and any recorded `data.indication_exception` from the invocation: which optional items were declined at authoring (so the agent does not silently re-introduce them).
5. For standing-order invocations: the standing-authority reference and the authentication-deadline policy.

The agent should **not** read protocol decision-branch state from pi-chart; that lives in pi-agent. pi-chart's read surface returns "what is true about authoring and fulfillment", not "what step is the protocol on".

`[agent]`

---

## 13. Related artifacts

- **A9a** — atomic-order shape this artifact composes; A9a's `data.invoked_by` placeholder is **resolved through `transform.run_id`** (council direction), not through a new link or payload field.
- **A4 / A4b** — medication dose URI (`meddose://`) for child orders; protocol-time-staggered children stress this URI scheme (open-schema entry preserved).
- **A1** — vital-sign acquisition is the most common standing-order invocation type (q-shift VS, glucose checks).
- **A5** — assessments referenced via `links.addresses` from invocations.
- **A0c** — provenance and event identity.
- **A6/A7/A8** — session-identity recurrence pattern; A9b is the fourth instance and the strongest cross-artifact ADR signal.

---

## 14. Proposed pi-chart slot shape

**Two layers, council-aligned:**

**(a) Definition layer** — *outside* `patients/<id>/`. Storage placement is open-schema. Researcher lean: `pi-chart/definitions/ordersets/<slug>@<version>.json` as in-repo registry, with full-external-registry as a Phase-B option. Definitions are **not events**; they are reference documents carrying id, version, title, evidence basis URIs, governance approvals, sunset date, member templates, required/preselected/forbidden lists, mutual-exclusion groups, conditional logic refs, indications, contraindications. Definitions are **referenced by URI from invocation events**, never embedded.

**(b) Invocation layer** — inside `patients/<id>/`. Council position: `**action.intervention` with `data.action: "orderset_invocation"` and constrained payload**. No new event subtype. Children carry `transform.run_id` pointing at the invocation event.

`schema_confidence`: medium (council position is more conservative than prior draft; substrate-faithful).
`schema_impact`: 3 (new payload convention on existing subtype + new transform-activity convention; no new event types, no new subtypes, no new link kinds).
`view consumers`: `timeline`, `currentState`, `evidenceChain`, `openLoops`, `narrative`.
`frequency class`: episodic (invocation), per-child class inherited.

### jsonc payloads

**Sepsis Hour-1 bundle definition** (system-level, NOT patient-chart):

```jsonc
// pi-chart/definitions/ordersets/sepsis-hour1@v3.2.json
{
  "id": "orderset:sepsis/adult-ed-inpatient",
  "version": "2026.04",
  "title": "Sepsis Hour-1 Bundle (adult, non-pregnant)",
  "kind": "protocol",
  "evidence_basis": [
    "https://doi.org/10.1097/CCM.0000000000003119"
  ],
  "governance": {
    "approved_by": ["medical_staff", "nursing_leadership", "pharmacy"],
    "approval_date": "2025-03-12",
    "sunset_date": "2027-03-12"
  },
  "indications": ["sepsis-suspected", "septic-shock-suspected"],
  "members": [
    { "id": "lactate",        "required": true,  "child_template": { "order_kind": "lab",      "code": "LACTATE" } },
    { "id": "blood-cultures", "required": true,  "child_template": { "order_kind": "lab",      "code": "BLOOD-CULT-x2" } },
    { "id": "broad-abx",      "required": true,  "child_template": { "order_kind": "med",      "code": "EMPIRIC-ABX-PROTOCOL" } },
    { "id": "crystalloid",    "required": false, "condition": "MAP<65 OR lactate>=4",
                                                  "child_template": { "order_kind": "iv-fluid","code": "LR-30ML-PER-KG" } },
    { "id": "vasopressor",    "required": false, "condition": "MAP<65 after fluids",
                                                  "child_template": { "order_kind": "med",     "code": "NOREPI-INFUSION" } },
    { "id": "repeat-lactate", "required": true,  "timing": "+2h",
                                                  "child_template": { "order_kind": "lab",     "code": "LACTATE" } }
  ],
  "mutual_exclusion_groups": []
}
```

Per [SSC 2018 / Levy et al.](https://saude.ufpr.br/labsim/wp-content/uploads/sites/23/2019/01/Surviving-Sepsis-Campaign-Hour-1-Bundle-2018.pdf): "begin rapid administration of crystalloid at 30 mL/kg for hypotension or lactate ≥4 mmol/L; start vasopressors if hypotensive during or after fluid resuscitation".

**Sepsis bundle invocation on patient_001** (council shape):

```jsonc
{
  "id": "evt_invk_sepsis_01",
  "type": "action",
  "subtype": "intervention",
  "patient_id": "patient_001",
  "effective_at": "2026-04-18T05:06:00-05:00",
  "author": { "id": "md_001", "role": "md" },
  "source": { "kind": "clinician_chart_action" },
  "status": "final",
  "data": {
    "action": "orderset_invocation",
    "invocation_kind": "protocol",
    "definition_ref": "orderset:sepsis/adult-ed-inpatient",
    "definition_version": "2026.04",
    "authoring_channel": "cpoe_orderset",
    "indication": "suspected sepsis with hypotension and pneumonia concern",
    "selection_mode": "default_plus_clinician_adjustments",
    "override_rationale": null,
    "protocol_state_ref": "pi-agent://protocol/sepsis-hour1/run-evt_invk_sepsis_01"
  },
  "links": {
    "addresses": ["evt_problem_sepsis_01"],
    "supports": [
      "evt_assessment_shock_01",
      "vitals://enc_001/map?from=2026-04-18T04:45:00-05:00&to=2026-04-18T05:05:00-05:00"
    ]
  },
  "meta": { "schema_version": "0.3.0-partial" }
}
```

**One child intent.order, with transform-based parent provenance:**

```jsonc
{
  "id": "evt_order_lactate_repeat_01",
  "type": "intent",
  "subtype": "order",
  "patient_id": "patient_001",
  "effective_at": "2026-04-18T05:06:02-05:00",
  "author": { "id": "md_001", "role": "md" },
  "source": { "kind": "clinician_chart_action" },
  "status": "final",
  "data": {
    "order_kind": "lab",
    "orderable": "repeat lactate in 2 hours",
    "priority": "urgent",
    "authoring_channel": "orderset_generated"
  },
  "links": {
    "addresses": ["evt_problem_sepsis_01"],
    "supports": ["evt_assessment_shock_01"]
  },
  "transform": {
    "activity": "orderset_apply",
    "tool": "cpoe",
    "run_id": "evt_invk_sepsis_01",
    "input_refs": [
      { "ref": "evt_invk_sepsis_01", "kind": "event", "role": "source" }
    ]
  },
  "meta": { "schema_version": "0.3.0-partial" }
}
```

**VTE prophylaxis standing-order activation** (nurse-initiated):

```jsonc
{
  "id": "evt_invk_vte_01",
  "type": "action",
  "subtype": "intervention",
  "patient_id": "patient_001",
  "effective_at": "2026-04-25T15:00:00Z",
  "author": { "id": "rn_shaneb", "role": "rn" },
  "source": { "kind": "nurse_standing_trigger" },
  "status": "final",
  "data": {
    "action": "orderset_invocation",
    "invocation_kind": "standing_order",
    "definition_ref": "standing-order:vte-prophylaxis-medsurg",
    "definition_version": "2.1.0",
    "authoring_channel": "nurse_standing_trigger",
    "trigger_ref": "policy:vte-risk-assessment-padua-positive",
    "trigger_text": "Padua score 5; no active bleeding.",
    "standing_authority_ref": "policy:medstaff-approved-2025-vte-protocol"
  },
  "links": {
    "addresses": ["evt_padua_assessment_01"]
  },
  "meta": { "schema_version": "0.3.0-partial" }
}
```

This invocation immediately opens the derived `pending-practitioner-authentication-of-standing-invocation` openLoop required by [42 CFR 482.24(c)(3)(iv)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24). Closure event:

```jsonc
{
  "id": "evt_auth_vte_01",
  "type": "intent",
  "subtype": "order_authentication",   // open-schema: subtype reuse vs new event
  "patient_id": "patient_001",
  "effective_at": "2026-04-25T17:42:00Z",
  "data": {
    "authenticates_invocation_id": "evt_invk_vte_01"
  },
  "source": { "kind": "clinician_chart_action" },
  "author": { "id": "md_jdoe", "role": "md" },
  "links": {
    "resolves": ["openLoop:pending-practitioner-authentication-of-standing-invocation:evt_invk_vte_01"]
  },
  "meta": { "schema_version": "0.3.0-partial" }
}
```

**Mid-invocation modification** (per-child supersession only; no set-level event):

```jsonc
// Original child:
{ "id":"evt_child_2", "type":"intent", "subtype":"order",
  "data":{"order_kind":"med", "orderable":"ceftriaxone 2g IV"},
  "transform":{"activity":"orderset_apply","run_id":"evt_invk_sepsis_01", "input_refs":[{"ref":"evt_invk_sepsis_01","kind":"event","role":"source"}]},
  "effective_at":"2026-04-18T05:08:00-05:00" }

// Supersession:
{
  "id": "evt_child_2_cx",
  "type": "intent",
  "subtype": "order",
  "patient_id": "patient_001",
  "effective_at": "2026-04-18T05:30:00-05:00",
  "data": { "order_kind": "med", "void": true },
  "links": { "supersedes": ["evt_child_2"] },
  "transform": {
    "activity": "orderset_apply",
    "run_id": "evt_invk_sepsis_01",
    "input_refs": [{ "ref": "evt_invk_sepsis_01", "kind": "event", "role": "source" }]
  },
  "source": { "kind": "clinician_chart_action" },
  "meta": { "schema_version": "0.3.0-partial" }
}
```

`[agent]` `[clinical]` `[provenance]`

---

## 15. Validator and fixture implications

Council-position validator rules (renamed to A9b-INV-NN per council convention; profile-driven where possible):

- **A9B-INV-01**: invocation event must reference a governed definition id and version (`data.definition_ref` + `data.definition_version` non-empty).
- **A9B-INV-02**: invocation event must declare `data.invocation_kind` and a permitted `source.kind`. Replay-mode error.
- **A9B-INV-03**: generated child orders must be standalone `intent.order` events. **A nested `data.children: [...]` array on the invocation is rejected.** Replay-mode error.
- **A9B-INV-04**: generated child orders must carry standardized provenance backlink to the invocation, preferably through `transform.input_refs` (council position adopted). Replay-mode error.
- **A9B-INV-05**: if the referenced definition declares an indication/problem-support requirement, the invocation or its children must satisfy it via `links.addresses` to a problem-subtype assessment. Live-mode openLoop / replay-mode warning.
- **A9B-INV-06**: if the definition requires contraindication review, missing review produces `openLoop` (`pending-contraindication-review`) or replay-mode warning per profile.
- **A9B-INV-07**: override/deviation from governed default path requires `data.override_rationale` when the definition marks it as mandatory. Replay-mode error if rationale missing on a flagged-mandatory deviation.
- **A9B-INV-08**: invocation itself never fulfills child orders and never carries a separate bundle-lifecycle state field. **No `status: complete` on the invocation.** Replay-mode error if such fields appear.
- **A9B-INV-09**: at replay time, `data.definition_ref` + `data.definition_version` SHOULD resolve in the active definition registry. Failure → `sunsetted-definition-still-active` openLoop (live mode) or registry-resolution warning (replay).
- **A9B-INV-10** (standing orders): an invocation with `source.kind: nurse_standing_trigger` MUST eventually be linked from an authentication event closing the `pending-practitioner-authentication-of-standing-invocation` openLoop. Threshold profile-driven (state law / hospital policy). Live-mode openLoop until satisfied; replay-mode warning if the chart closes without it (per [42 CFR 482.24(c)(3)(iv)](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24)).
- **A9B-INV-11** (protocol state): a `data.protocol_state_ref` URI is informational; pi-chart MUST NOT validate state-machine consistency. That is pi-agent's territory.

Replay vs live posture: missingness becomes openLoops in live mode; structural integrity violations are replay errors. This mirrors A9a council direction.

### Minimal fixture additions on `patient_001` (respiratory-decompensation seed)

Council guidance: keep `patient_001` narrow. **One sepsis-bundle invocation only**, plus the standing-order example for the 482.24(c)(3)(iv) authentication-loop demonstration. A future `patient_002` may carry a textbook sepsis bundle with full progression.

Six rows minimum:

1. `evt_assessment_shock_01` — anchor for `links.addresses`.
2. `evt_invk_sepsis_01` — sepsis Hour-1 invocation (jsonc above).
3. `evt_child_lactate`, `evt_child_cult`, `evt_child_abx`, `evt_child_crystalloid`, `evt_order_lactate_repeat_01` — five child `intent.order` events with `transform.run_id` populated (vasopressor intentionally absent to drive `partial-bundle-fulfillment` derived openLoop until conditions met).
4. `evt_acquire_lactate`, `evt_administer_abx` — two action events per ADR 003 (showing two children fulfilled, three pending).
5. `evt_invk_vte_01` — VTE-prophylaxis standing-order invocation (jsonc above) authored `source.kind: nurse_standing_trigger`, intentionally without immediate authentication event (drives `pending-practitioner-authentication-of-standing-invocation` openLoop).
6. `evt_child_vte_dvt_prophy` — one child intent.order generated by the standing invocation, carrying `transform.run_id: evt_invk_vte_01`.
7. `evt_auth_vte_01` — practitioner authentication event closing the standing-order openLoop (resolves §482.24(c)(3)(iv) requirement).

Six rows is the floor; seven (above) demonstrates the full set of intended behaviors and the regulation-required authentication loop.

`[provenance]` `[clinical]`

---

## 16. Open schema questions (inline pointers to durable-home file `a9b-open-schema-entries.md`)

Status legend: **O** Open · **OC** Open — cross-artifact ADR candidate · **AS** Accepted direction from prior synthesis · **OD** Open, dependent on X.

**Resolved by council direction (collapsed from prior draft):**

- ~~`a9b-invocation-as-event-vs-derived`~~ — **resolved**: stored `action.intervention` event, council position.
- ~~`a9b-parent-child-link-convention`~~ — **resolved**: `transform.run_id` + `transform.input_refs`, no new link kind.
- ~~`a9b-orderset-modification-mid-invocation`~~ — **resolved**: per-child supersession only; invocation never re-authored.
- ~~`a9b-set-level-openloops-vs-child-level`~~ — **resolved**: only `pending-practitioner-authentication-of-standing-invocation` survives as set-level (federal regulation requires it); all others are derived projections.

**Surviving and active:**

- `orderset-definition-home` `[OC]` — definition storage placement (council's preferred slug).
- `orderset-runtime-subtype-promotion` `[O]` — when, if ever, to promote `action.intervention + data.action: orderset_invocation` to a dedicated `action.orderset_invocation` subtype.
- `orderset-override-rationale-home` `[O]` — invocation-level only, or also required at child level when child deviates.
- `orderset-template-scoping` `[O]` — provider-authored vs nurse-standing-trigger differentiation by `source.kind`/role/definition scope rules.
- `orderset-cds-suggestion-boundary` `[AS]` — non-accepted CDS suggestions remain system telemetry, not patient-stream events. Direction accepted from A9a council.
- `a9b-orderset-vs-protocol-vs-standing-order-vs-care-plan-taxonomy` `[O]` — facet on one primitive vs distinct primitives (council leans facet via `invocation_kind`; care plan excluded as longitudinal).
- `a9b-orderset-vs-order-panel-distinction` `[O]` — panel as small orderset vs distinct primitive.
- `a9b-standing-order-authentication-loop` `[OC]` — shape of the closure event (subtype reuse vs attestation note vs successor invocation). Federally regulated.
- `a9b-protocol-decision-branch-boundary` `[AS]` — confirmed out-of-chart (pi-agent owns); URI shape and read contract still open.
- `a9b-personalization-model` `[O]` — selection_mode shape, declination capture.
- `a9b-cross-orderset-deduplication` `[O]` — profile rule shape.
- `a9b-orderset-version-mismatch-handling` `[O]` — sunsetted-version invocation behavior.
- `a9b-blood-product-prepare-transfuse-coupling-as-mini-orderset` `[O]` — A9a kept open; A9b notes structural similarity.
- `a9b-indication-exception-shape` `[O]` — A9a kept open; ordersets surface this hardest (VTE prophylaxis declinations).
- `a9b-order-occurrence-uri-beyond-meddose` `[O]` — A9a inherited; protocol-time-staggered children stress URI scheme.
- `a9b-verbal-text-channel-invocation-authentication` `[OD]` — depends on A9a's verbal/secure-text payload-metadata convention.
- `a9b-session-identity-recurrence` `[OC]` — **fourth recurrence** (A6, A7, A8, A9b). Strongest cross-artifact ADR signal in Phase A.

`[open-schema]`

---

## 17. Sources

Regulatory:

- 42 CFR §482.24 — eCFR. [https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24)
- 42 CFR Part 482 Subpart C — eCFR. [https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C)
- CMS S&C-13-20 — standing orders, order sets, protocols implementation. [https://www.cms.gov/Medicare/Provider-Enrollment-and-Certification/SurveyCertificationGenInfo/Downloads/Survey-and-Cert-Letter-13-20.pdf](https://www.cms.gov/Medicare/Provider-Enrollment-and-Certification/SurveyCertificationGenInfo/Downloads/Survey-and-Cert-Letter-13-20.pdf)
- CMS Final Rule, 71 FR 68672 / 2007 S&C letter on verbal-order authentication. [https://www.federalregister.gov/documents/2006/11/27/E6-19957/medicare-and-medicaid-programs-hospital-conditions-of-participation-requirements-for-history-and](https://www.federalregister.gov/documents/2006/11/27/E6-19957/medicare-and-medicaid-programs-hospital-conditions-of-participation-requirements-for-history-and) ; [https://www.cms.gov/Medicare/Provider-Enrollment-and-Certification/SurveyCertificationGenInfo/downloads/SCLetter07-13.pdf](https://www.cms.gov/Medicare/Provider-Enrollment-and-Certification/SurveyCertificationGenInfo/downloads/SCLetter07-13.pdf)
- CMS QSO-25-24 / Appendix A 2025 update. [https://www.cms.gov/medicare/health-safety-standards/quality-safety-oversight-general-information/policy-memos/policy-memos-states-and-cms-locations/revisions-hospital-appendix-state-operations-manual](https://www.cms.gov/medicare/health-safety-standards/quality-safety-oversight-general-information/policy-memos/policy-memos-states-and-cms-locations/revisions-hospital-appendix-state-operations-manual)
- TJC FAQ secure texting (post-Feb 2024). [https://www.jointcommission.org/en-us/knowledge-library/support-center/standards-interpretation/standards-faqs/000002483](https://www.jointcommission.org/en-us/knowledge-library/support-center/standards-interpretation/standards-faqs/000002483)

Professional / safety:

- ISMP Guidelines for Standard Order Sets. [https://www.ismp.org/sites/default/files/attachments/2018-01/StandardOrderSets.pdf](https://www.ismp.org/sites/default/files/attachments/2018-01/StandardOrderSets.pdf)
- Grissinger, P&T 2014. [https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3956384/](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3956384/)
- ISMP 2024–2025 Targeted Medication Safety Best Practices. [https://online.ecri.org/hubfs/ISMP/Resources/ISMP_TargetedMedicationSafetyBestPractices_Hospitals_FAQ.pdf](https://online.ecri.org/hubfs/ISMP/Resources/ISMP_TargetedMedicationSafetyBestPractices_Hospitals_FAQ.pdf)
- TJC NPG #14 Effectively Managing Medications (2026). [https://www.jointcommission.org/en-us/standards/national-performance-goals/effectively-managing-medications](https://www.jointcommission.org/en-us/standards/national-performance-goals/effectively-managing-medications)
- TJC Accreditation 360 — MM/IM transition (2026). [https://digitalassets.jointcommission.org/api/public/content/03b59f35a60f4558a4948e48ccb2d415?v=65ce516b](https://digitalassets.jointcommission.org/api/public/content/03b59f35a60f4558a4948e48ccb2d415?v=65ce516b)
- ONC SAFER Guides — CPOE with Decision Support (2025 revision). [https://www.healthit.gov/wp-content/uploads/2025/06/SAFER-Guide-3.-CPOE-Final.pdf](https://www.healthit.gov/wp-content/uploads/2025/06/SAFER-Guide-3.-CPOE-Final.pdf)
- Leapfrog CPOE Evaluation Tool 2024. [https://www.leapfroggroup.org/sites/default/files/Files/CPOE%20Tool%20Guidance%202024.pdf](https://www.leapfroggroup.org/sites/default/files/Files/CPOE%20Tool%20Guidance%202024.pdf)

Clinical / institutional:

- Surviving Sepsis Campaign Hour-1 Bundle (Levy 2018). [https://saude.ufpr.br/labsim/wp-content/uploads/sites/23/2019/01/Surviving-Sepsis-Campaign-Hour-1-Bundle-2018.pdf](https://saude.ufpr.br/labsim/wp-content/uploads/sites/23/2019/01/Surviving-Sepsis-Campaign-Hour-1-Bundle-2018.pdf)
- SCCM Adult Sepsis Guidelines (2021/2024 updates). [https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines](https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines)
- Streiff et al., Johns Hopkins VTE Collaborative, J Hosp Med 2016. [https://pubmed.ncbi.nlm.nih.gov/27925423/](https://pubmed.ncbi.nlm.nih.gov/27925423/)
- Streiff et al., BMJ 2012. [https://pmc.ncbi.nlm.nih.gov/articles/PMC4688421/](https://pmc.ncbi.nlm.nih.gov/articles/PMC4688421/)
- Haut et al., Mandatory CDS for VTE in trauma, Arch Surg 2012. [https://pure.johnshopkins.edu/en/publications/improved-prophylaxis-and-decreased-rates-of-preventable-harm-with-4/](https://pure.johnshopkins.edu/en/publications/improved-prophylaxis-and-decreased-rates-of-preventable-harm-with-4/)
- AAFP 2010 — Glycemic Control Beyond Sliding-Scale Insulin. [https://www.aafp.org/pubs/afp/issues/2010/0501/p1130.html](https://www.aafp.org/pubs/afp/issues/2010/0501/p1130.html)
- Adelman et al., Wrong-patient electronic orders, JAMIA 2013. [https://pmc.ncbi.nlm.nih.gov/articles/PMC3638184/](https://pmc.ncbi.nlm.nih.gov/articles/PMC3638184/)
- StatPearls, CPOE. [https://www.ncbi.nlm.nih.gov/books/NBK470273/](https://www.ncbi.nlm.nih.gov/books/NBK470273/)

State boards / nursing law:

- Washington NCQAC Advisory Opinion 6.0, Standing and Verbal Orders. [https://nursing.wa.gov/sites/default/files/2022-07/StandingAndVerbalOrders.pdf](https://nursing.wa.gov/sites/default/files/2022-07/StandingAndVerbalOrders.pdf)
- Arkansas State Board of Nursing — Role of Nurse in Nurse-Driven Standing Orders. [https://healthy.arkansas.gov/wp-content/uploads/20-1RoleofNurseinNurseDrivenStandingOrders.pdf](https://healthy.arkansas.gov/wp-content/uploads/20-1RoleofNurseinNurseDrivenStandingOrders.pdf)

FHIR semantic witnesses (NOT for adoption — boundary clarification only):

- HL7 FHIR R5 PlanDefinition. [http://hl7.org/fhir/plandefinition.html](http://hl7.org/fhir/plandefinition.html)
- HL7 FHIR R5 RequestOrchestration (formerly R4 RequestGroup). [https://hl7.org/fhir/requestorchestration.html](https://hl7.org/fhir/requestorchestration.html)
- FHIR PlanDefinition `$apply` operation (R6 ballot). [https://build.fhir.org/plandefinition-operation-apply.html](https://build.fhir.org/plandefinition-operation-apply.html)

---

# Synthesis summary

## Substrate additions proposed (council-aligned, more conservative than prior draft)

- **No new event types** (council).
- **No new event subtypes** (council; promotion to dedicated `action.orderset_invocation` subtype is an explicit follow-on ADR option, not Phase A).
- **No new link kinds** (council; `links.member_of` from prior draft dropped).
- **New payload convention** on `action.intervention`: `data.action: "orderset_invocation"` + the §7 fields.
- **New transform-activity convention**: `transform.activity: "orderset_apply"` + `transform.run_id: <invocation_event_id>` on each child intent.
- **New validator profile** A9B-INV-01..11 (council numbering).
- **One stored set-level openLoop pattern** (`pending-practitioner-authentication-of-standing-invocation`); all other "set-level" projections are derived.
- **New definition layer** outside `patients/<id>/`; storage placement is open-schema entry `orderset-definition-home`.

## What is explicitly NOT proposed

- ❌ No new event types.
- ❌ No new event subtypes (council position; deferred).
- ❌ No new source kinds (ADR 006 closed taxonomy holds; channel is payload metadata).
- ❌ No new link kinds (council; `transform` does the parent/child work).
- ❌ No new currentState axes.
- ❌ No new URI schemes (`protocol_state_ref` is opaque pi-agent URI; order-occurrence URI generalization is escalated, not resolved).
- ❌ No new storage primitives in patient dir.
- ❌ No mutable bundle/invocation status field.
- ❌ No set-level cancel cascade event.
- ❌ No FHIR resource taxonomy import (witnesses only).
- ❌ No CDS-alert canonical events (A9a council direction held).

## Owner-decision gates Shane needs (Phase A → Phase B)

These are the **last set of Phase A gates**. Council corrections collapsed several prior-draft gates; eight remain:

- **G1 — definition storage placement** (`orderset-definition-home`): in-repo `pi-chart/definitions/` (researcher lean) vs out-of-repo registry vs Phase-B-deferred. Affects directory structure, replay behavior, and tooling.
- **G2 — invocation subtype promotion**: keep `action.intervention + data.action: orderset_invocation` (council position) vs promote to dedicated `action.orderset_invocation` subtype later. **Decision: defer until usage demonstrates need; not blocking Phase A close.**
- **G3 — taxonomy collapse** (`a9b-orderset-vs-protocol-vs-standing-order-vs-care-plan-taxonomy`): facet via `invocation_kind` (council lean) vs distinct primitives. Care plan excluded as longitudinal.
- **G4 — standing-order authentication shape** (`a9b-standing-order-authentication-loop`): new subtype vs reused attestation vs successor invocation. **Federally regulated; cannot defer indefinitely.**
- **G5 — session-identity ADR (the big one)**: unify A6/A7/A8/A9b session handling now or defer to first Phase-B ADR. **Recurrence count = 4. Strongest cross-artifact signal in Phase A.**
- **G6 — discontinue/cancel/void/hold/resume cascade pattern**: per-child only (council position) is adopted for sets; A9a's open question on individual orders persists. ADR 005 hold/resume extension may surface here.
- **G7 — protocol state-machine contract with pi-agent**: confirm pi-agent owns the state machine (direction is AS) and lock the read contract (URI shape, no read from pi-chart). Required for the pi-chart ↔ pi-agent integration spec.
- **G8 — override_rationale scope** (`orderset-override-rationale-home`): invocation-level only vs also required at child-level when child individually deviates.

## Cross-cutting ADR signals A9b contributes

- **Session-identity ADR** — recurrence-4. Cleanest, strongest, most consequential pattern in Phase A. Council direction (transform-based) does not eliminate the recurrence; it relocates it.
- **Definition-vs-instantiation ADR** — pattern likely recurs for protocols, monitoring plans, restraint policies, care plans. Worth resolving once.
- **Standing-authority-with-delayed-authentication ADR** — recurs for verbal orders (A9a), standing orders (A9b), secure-text orders, and probably agent-initiated orders. Federally constrained.
- **Profile-driven validation discipline** — A8 → A9a → A9b consistent: thresholds, deduplication rules, authentication deadlines are profile-driven, not hardcoded validators.
- **Transform-as-parent-child convention** — A9b establishes that `transform.run_id` is the canonical "this came from that" backlink across the substrate. Likely to recur (derived assessments, agent-generated notes, protocol-spawned events). Worth lifting into substrate doctrine.

## Phase A → Phase B transition assessment

**What Shane has substrate-evidence-wise to commit to schema (high confidence):**

- Closed event-type set; closed `source.kind` set (ADR 006); ADR 003 fulfillment discipline; ADR 005 effective_period; ADR 009 link semantics; ADR 010 EvidenceRef; ADR 011 transform; ADR 015 schema_version.
- Atomic-order shape (`intent.order` + `data.order_kind`) — A9a-accepted.
- Orderset invocation as `action.intervention` with payload convention — A9b-council-accepted.
- "Active" anything is derived, not stored — pattern hardened across A8, A9a, A9b.
- `transform.run_id` as parent-child backlink — A9b-council-accepted.
- CDS alerts non-canonical.
- pi-chart records authoring + action-mediated fulfillment; protocol decision branches are pi-agent's.

**What still needs ADR resolution before Phase B schema commit:**

- Session-identity unification (the critical one).
- Definition-vs-instantiation pattern (storage placement, addressability).
- Standing-authority delayed-authentication shape.
- Order-occurrence URI generalization beyond `meddose://`.
- Indication-exception shape (free-text, code, or hybrid).
- Hold/resume extension to `effective_period` if needed.

**Verdict:** Phase A has produced **enough substrate evidence** to commit the atomic primitives and the composition patterns (event envelope, source-kind taxonomy, intent-as-order, action-mediated fulfillment, derived currentState, transform discipline as parent-child backlink, action-intervention as orderset-invocation). The remaining open questions (sessions, definition placement, standing-auth shape) are **ADR-level decisions**, not schema-level. A9b's recommendation to Shane: **ship Phase A with per-artifact session conventions and make session-identity unification the first Phase-B ADR**; ship A9b under the council's `action.intervention` payload-convention model with definition-storage gated behind G1; and resolve G4 (standing-order authentication) within the first month of Phase B because it touches federal regulatory requirements directly.

---

*End of synthesis. Council direction adopted on three substrate-level corrections; prior draft's session-identity recurrence finding preserved as the dominant cross-artifact signal heading into Phase B.*