# A0b. Active constraints (allergies, code status, advance directives)

## 1. Clinical purpose

Active constraints are the non-negotiable safety predicates every clinical write must satisfy before the write is safe. They are not a tab, a banner, or a scanned-forms drawer — they are the live filter that turns an otherwise-valid order into an unsafe one and the precondition that makes urgent care congruent with the patient's known risks and treatment choices. In the MICU septic-shock context, an undocumented beta-lactam anaphylaxis forces an inferior empiric regimen; an unspecified code status unmoors every procedure consent and resuscitation decision; an unverified advance directive leaves the healthcare proxy and goals-of-care pathway without legal and ethical ground. Constraints span at least seven axes — **allergy/intolerance**, **resuscitation directive** (code status), **advance directive** (the activated clauses of a signed document), **blood-product restriction**, **dietary safety**, **activity restriction**, and **communication consent** — plus isolation precautions, which are modeled at the encounter layer in A0a because their scope is per-stay and per-unit. The clinical work the substrate must preserve is *not* "display allergies at the top of every screen" — it is **"reject or flag any write that conflicts with an active constraint, and treat the absence of a required constraint assertion as itself a blocking condition."** That is the difference between a tab and a safety floor.

## 2. Agent-native transposition

The legacy EHR collapses seven independent safety axes into three UI surfaces: an allergy band at the top of the chart, a code-status badge and bracelet, and a scanned advance-directive PDF accessed through a separate tab. Each surface is a rendering of the same underlying question — *what is actively true about this patient that constrains my next action?* — and each legacy surface hides a mutation history behind an apparently-mutable "current" field. In pi-chart the function decomposes into a **constraint ledger**: append-oriented, source-attributed, evidence-bearing claims that define restrictions or required checks before future care actions. The active set is a query over the claim graph, not a mutable list.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Allergy / intolerance list | `assessment.subtype = constraint, data.constraint_domain = allergy_intolerance` with `links.supports` to patient report, prior reaction observation, artifact, or clinician review | `currentState(axis:"constraints")`, `evidenceChain()` |
| "Allergy reviewed — NKDA" | `action.subtype = constraint_review` with `data.result = {allergy_intolerance: none_known}` + optional `observation.subtype = negative` as evidentiary support | `openLoops()`, `timeline()` |
| Code-status banner | `assessment.subtype = constraint, data.constraint_domain = resuscitation_directive` | `currentState(axis:"constraints")`, `readActiveConstraints()` |
| Advance directive / POLST / DPOA document | `artifact_ref(subtype = advance_directive)` + `assessment.subtype = constraint` events derived from its actionable clauses, each citing the artifact via `links.supports` | `evidenceChain()`, `narrative()` |
| Healthcare proxy designation | `assessment.subtype = constraint, data.constraint_domain = advance_directive` with `data.authorizing_person` payload (A0a carries proxy identity; A0b carries proxy authority-in-force) | `currentState(axis:"constraints")` |
| Blood refusal / product-specific limitation | `assessment.subtype = constraint, data.constraint_domain = blood_product_restriction` with per-product `data.rule` | write-side validator, `openLoops()` |
| Dietary / swallowing / allergen-exclusion restriction | `assessment.subtype = constraint, data.constraint_domain = dietary_safety` | write-side validator |
| Alert badge / DNR wristband / header chip | rendered affordance only | n/a |

The load-bearing substrate claims: (a) every constraint assertion is a first-class `assessment` event carrying its own provenance, severity, verification status, rule (avoid/withhold/allow-with-conditions/etc.), override policy, and `links.supports` chain to evidence — not a mutable row in a file; (b) the act of *reviewing* constraints is a separate primitive (`action.subtype = constraint_review`) that can resolve missingness without creating new assertions, and can document "none known" as a reviewed state rather than as an absence; (c) the `constraints.md` YAML is a *cached snapshot* of `currentState(axis:"constraints")`, explicitly derived, never the source of truth — on conflict, event stream wins; (d) the substrate treats the absence of any constraint-review-or-assertion in a domain as itself a safety-blocking state (OL-CONSTRAINT-01); (e) advance directives land as `artifact_ref` plus per-clause `assessment.constraint` events carrying the document's actionable rules — the constraint events supersede as capacity state changes (`data.capacity_context`), which makes "activation on capacity loss" an implicit supersession rather than a new primitive. Coverage-threshold discipline (parallel to A2): a `constraint_asserted` event fires on **assertion, verification-status change, severity re-classification, or rule change** — not on every chart open. Routine re-reads of unchanged constraints produce `constraint_review` events, not new assertions.

*Project owner to rewrite this section per charter §4.4 before Batch 0 calibration passes.*

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR 489.100–489.104 (Patient Self-Determination Act).** Hospitals participating in Medicare/Medicaid must provide written information about advance directives on admission, document prominently in the medical record whether the patient has executed an AD, maintain written policies, and not condition care on AD status. §489.102(a) is the admission-notice obligation; §489.102(a)(1)(ii) is the documentation obligation the advance-directive-domain assertion operationalizes.

2. **[regulatory] CMS 42 CFR 482.13(b)(2)–(3) (patient rights).** Patient's right to formulate advance directives and have staff comply; right to consent to or refuse treatment; right to make informed decisions about care. Anchors both the AD-activation assertion and the code-status assertion.

3. **[regulatory] The Joint Commission RI.01.05.01 (advance directive documentation), RI.01.02.01 (respecting treatment decisions including refusal), NPSG.03.06.01 (medication reconciliation — allergy status known before med-rec completes), and MM.01.01.03 coupled with NPSG.01.01.01** (allergies documented before first dose; two-identifier verification at every med pass, from A0a). V-CON-01/V-ID-09 is the substrate's joint enforcement.

4. **[regulatory] HL7 FHIR R5 `AllergyIntolerance` + USCDI / ONC 2026 standards bulletin.** Interoperable representation requires `clinicalStatus` (active/inactive/resolved), `verificationStatus` (unconfirmed/confirmed/refuted/entered-in-error/presumed), causative substance/class, reaction manifestations, `criticality` (low/high/unable-to-assess), and source. `data.verification_status` and `data.criticality` in A0b are FHIR-aligned for downstream adapter work. `[phase-b-regulatory]` — formal USCDI version floor as ONC/ASTP versions advance.

5. **[professional] POLST National Paradigm** (portable medical orders distinct from living will / DPOA), with state-level POLST / MOLST / MOST / POST program documentation — treated as `artifact_ref(subtype = advance_directive, data.form_type = polst)` with jurisdiction metadata. **[professional] SCCM / ATS ICU goals-of-care guidance** — code status and AD review within 24–48h of ICU admission with documented discussion evidence. **[professional] AMA Code of Medical Ethics Opinion 5.2** — obligation to elicit and document resuscitation preferences. Detailed jurisdiction-specific POLST/MOLST handling, perioperative DNR reversal conventions, and cross-state AD reciprocity are `[phase-b-regulatory]`.

## 4. Clinical function

Constraints are consumed at **every gated write**, not on a schedule. The strongest cadence is not time-based — it is *write-triggered*: each medication, transfusion, contrast study, procedure, resuscitation plan, diet order, or goals-of-care change is evaluated against the active constraint set as of that write.

- **Bedside RN** reads active allergies, blood-product restrictions, diet/swallow constraints, isolation precautions (A0a), and code status before every med pass, transfusion, specimen collection, bedside procedure prep, transport, or escalation. Highest-frequency constraint reader in the chart.
- **Prescriber (attending / APP / resident)** reads code status, advance directives, treatment limitations, and allergy/contraindication evidence before antibiotics, contrast imaging, invasive procedures, intubation plans, pressor escalation, DNR/POLST orders, or goals-of-care notes. Owns code-status and AD-clause constraint authorship.
- **Pharmacist** consumes medication allergies/intolerances, reaction severity and manifestations, cross-reactive classes, and documented override rationales before medication verification. Owns verification-status escalation (patient-report → clinician-verified → test-confirmed → refuted via graded challenge or delabeling).
- **Respiratory therapist** reads resuscitation directives and treatment limitations before CPR, intubation, NIV, ventilator withdrawal, or comfort-focused respiratory plans.
- **Blood bank / procedural team** reads transfusion restrictions, religious refusal, and consent limitations before issuing blood products or performing high-risk procedures.
- **Case manager / chaplain / palliative care** reads advance-directive location, healthcare proxy authority, and treatment-limitation constraints when capacity is lost or goals-of-care decisions are urgent. Owns AD verification events (social work / ethics).
- **pi-agent** reads `readActiveConstraints()` before every gated intent or action. V-CON-01 / V-ID-09 is the validator-level enforcement: the intent commit is rejected if no read has occurred within the decision cycle or if a conflict exists with no authorized override.

Handoff trigger: *"Any active constraints, unresolved allergy review, code-status conflict, missing POLST, or treatment limitation that changes what we can do tonight?"* — answered by `currentState(axis:"constraints")` + `openLoops()` filtered to OL-CONSTRAINT-*.

## 5. Who documents

Ownership is **split by domain**, and the split is load-bearing.

- **Allergies/intolerances** — *Primary:* admission RN at intake (`source.kind = admission_intake`). *Secondary:* pharmacist during med reconciliation (A4b), attending when a reaction is directly observed. *Patient/surrogate* is the source for self-reported assertions. *Owner of record:* pharmacist for medication-relevant allergies; attending for clinically significant non-medication allergies.
- **Code status (resuscitation directive)** — *Primary:* attending or APP who conducts the goals-of-care discussion. *Secondary:* RN who witnesses the discussion and documents the resulting state transition. *Patient or surrogate* owns the underlying preference; the assertion event binds it to a clinical safety rule. *Owner of record:* attending of record.
- **Advance directives** — *Primary:* social work / case management for document retrieval and verification; attending for application and activation; admitting RN for asking-on-intake. *Patient/surrogate* is the document's authoring source. *Owner of record:* social work / ethics for verification; attending for clinical application.
- **Blood-product restrictions** — *Primary:* admission RN and blood bank; patient/surrogate as authoring source.
- **Dietary / activity / communication-consent constraints** — *Primary:* admission RN and case management; patient as authoring source.

Split ownership mirrors A0a's registration-vs-clinical-vs-verification tri-partite pattern. No single "allergy list owner" may silently overwrite conflicting claims — supersession is explicit and carries author attribution.

Goals-of-care `communication` events authored by chaplain / ethics / palliative care *precede* code-status and AD-activation assertions; those communications appear in the constraint event's `links.supports` as conversation evidence.

## 6. When / how often

Frequency class: **event-driven with per-encounter review overlay and write-triggered validation.**

- **Regulatory floor (first documentation):** AD notice on admission (CFR 489.102); allergy documentation before first dose (TJC NPSG.03.06.01 / MM.01.01.03); code status documented on admission per TJC; medical-record entries dated/timed/authenticated per CFR 482.24.
- **Practice norm (ICU):** allergy review on admission, transfer, pre-procedure, and at medication reconciliation; code status on ICU admission — the policy window is facility-specific `[verify-with-nurse — scaffold; 4h has been discussed in the field but the project owner should finalize against institutional policy, tighter for vasopressors or imminent intubation]`; advance directive verification within policy window of ICU admission `[verify-with-nurse — scaffold; SCCM/ATS guidance cites 24–48h for goals-of-care review, project owner to specify pi-chart's operational target]`; re-review on major clinical change, attending transition, inter-unit transfer, loss of capacity, or new source document.
- **Divergence:** regulation requires policy, disclosure, record content, and respect for rights; ICU practice demands proactive elicitation and evidence-of-discussion for *every* patient — not just those with known directives — before any high-risk write.

A re-review that confirms unchanged state produces an `action.constraint_review` event, not a new assertion. A new `assessment.constraint` event fires only on assertion, verification-status change, severity re-classification, rule change, or scope change.

## 7. Candidate data elements

Target: 16 included fields. Organized as **cross-domain core** (applies to all constraint assertions) + **domain-specific payload fields** (domain-conditional).

### Cross-domain core

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|---|
| 1 | `constraint_domain` | [clinical][agent] | ✓ | enum {allergy_intolerance, resuscitation_directive, advance_directive, blood_product_restriction, dietary_safety, activity_restriction, communication_consent} | `currentState(axis:"constraints")` cannot route per-domain; V-CON-01 cannot match conflicts | manual-scenario / Synthea / pi-sim | high |
| 2 | `target` (coded object: substance, class, product, action-class, document clause) | [clinical][agent] | ✓ | `{kind, display, code_system?, code?}` | Agent cannot determine whether a proposed medication / transfusion / procedure / CPR action conflicts | FHIR `AllergyIntolerance.code` / Synthea / RxNorm / SNOMED | high |
| 3 | `rule` | [clinical][agent] | ✓ | enum {avoid, withhold, allow, allow_with_conditions, requires_review, requires_consent, requires_premedication, requires_substitution} | The constraint is not operational — agent knows "penicillin" but not whether to avoid, substitute, or verify. Separating rule from target is what makes V-CON-01 actionable | human / manual-scenario / pi-agent | high |
| 4 | `criticality` | [clinical] | ✓ | enum {low, high, unable_to_assess} per FHIR AllergyIntolerance | Mild nausea and anaphylaxis block identically → alert fatigue or unsafe override | USCDI / FHIR / human / Synthea | high |
| 5 | `verification_status` | [clinical][regulatory] | ✓ | enum {unconfirmed, confirmed, refuted, entered_in_error, provisional} per FHIR | Patient-reported childhood rash and allergist-confirmed anaphylaxis look equally authoritative; delabeling cannot be represented | human / import / pi-agent | high |
| 6 | `authorizing_person` | [regulatory] | ✓ | `{role: patient|surrogate|clinician, identity?, relationship?, authority_source}` | Code-status and treatment-limitation changes cannot be trusted; surrogate authority cannot be audited | human / A0a proxy link / notes | high |
| 7 | `capacity_context` | [clinical][regulatory] | ✓ | enum {has_capacity, lacks_capacity, surrogate_authorized, emergency_exception, unknown} + evidence pointer | Goals-of-care and refusal claims may be applied despite incapacity or invalid surrogate authority. Capacity transitions drive AD-clause supersession (activation = has_capacity → lacks_capacity + surrogate_authorized) | human / A0a / A0c / notes | high |
| 8 | `source_document_ref` | [regulatory] | ✓ | `artifact_ref` id or section ref | POLST / advance-directive clauses cannot be verified; scanned-document drawer reappears as unstructured truth | artifact_ref / import / scan | high |
| 9 | `applies_to_scope` | [clinical] | ✓ | enum {patient_lifetime, current_encounter, procedure, medication_course, care_setting, conditional} | A perioperative limitation leaks into unrelated future care, or a lifelong anaphylaxis expires at discharge | human / import / derived | med |
| 10 | `effective_period` OR `effective_at` + supersession | [clinical][open-schema] | ✓ | interval `{start, end?}` per ADR 005, **or** point event + supersession chain (see §16 Q3) | Temporary constraints (resolving drug rash, periop-only limitation) and active-window queries require the interval shape; without it, staleness and "was this active at T?" become derived queries over supersession chains | event envelope | high for data, **low for representation** |
| 11 | `links.supports` to evidence | [clinical][regulatory] | ✓ | `EvidenceRef[]` | Reported allergies indistinguishable from test-confirmed; audit trail broken; invariant 5 violated | pi-sim / Synthea / note / artifact_ref | high |
| 12 | `override_policy` | [agent][clinical] | ✓ | enum {never_override, human_only, requires_rationale, requires_pharmacy, allows_agent_warning} | Write validator cannot decide whether a conflict blocks, warns, or requires human co-sign | manual-scenario / policy | med |
| 13 | `conflict_key` | [agent] | ✓ | normalized `{domain, target, rule}` key (derived) | Duplicate active constraints and contradictory code-status states cannot be deterministically detected | derived from payload | med |
| 14 | `status_detail` (per ADR 002) | [clinical] | ✓ | enum (registered for subtype `constraint`): {active, inactive, resolved, refuted, no_longer_applicable} | Cannot distinguish "still allergic" from "history of"; refuted delabeling indistinguishable from mutation | clinician_chart_action | high |

### Domain-specific payload (conditional on `data.constraint_domain`)

| # | Field | Domain | Include? | What fails if absent? |
|---|---|---|---|---|
| 15 | `reaction_manifestations[]` + `reaction_severity` per manifestation | `allergy_intolerance` | ✓ | Allergy delabeling, override rationale, and re-exposure risk assessment fail; "allergy" remains uninterpretable |
| 16 | `directive` + `directive_text` (e.g., "DNR; allow intubation for reversible respiratory failure") | `resuscitation_directive`, `advance_directive` | ✓ | Nuanced directives ("DNR but intubation OK") collapse to binary; nuance is clinically and legally essential. **Specific enum values for code-status states are deliberately scaffold** — `[verify-with-nurse — project-owner to finalize institutional vocabulary: full_code / dnr_dni / dnr_ok_intubate / comfort_focused / other]` |

Excluded from field list: `allergy_band_color` (rendered), `bracelet_indicator` (rendered), `last_reviewed_at` (derived from timeline), `severity_numeric_score` (no consensus scale), `free_text_note` (forces unstructured capture — usable only as source text in `interpretation`, not as primary field), `category_icon` (derived from target ontology).

## 8. Excluded cruft — with rationale

| Field | Why it exists in current EHRs | Why pi-chart excludes it |
|---|---|---|
| **Allergy wristband color / band type / DNR sticker color** | Bedside visual interlock mandated by facility policy; color conventions vary by institution. | Rendering, not canonical. Band/sticker color is a view decision over `criticality` and `directive`, not a stored field. |
| **"NKA" vs "NKDA" as distinct values** | Legacy free-text distinctions meaning roughly "no known allergies" vs "no known drug allergies." | Collapse to `action.constraint_review` with `data.result.allergy_intolerance = "none_known"` and `data.scope ∈ {drug, food, environmental, all}`. One canonical representation with explicit scope. |
| **"Last reviewed by / last reviewed at" fields on the allergy list** | Audit trail for periodic reconciliation required by some policies. | Derived: `timeline(types:["action"], subtypes:["constraint_review"])` carries the full review trail with author attribution. Dedicated fields duplicate and risk drift. |
| **"Allergy comments" free-text field without structure** | Historical fallback when the drop-down didn't cover the reaction. | Unstructured notes hide reaction type and severity from V-CON-01; substrate requires structured `reaction_manifestations[]` + `reaction_severity`. Free text appears only in `interpretation` as caveat. |
| **EHR "allergy alert acknowledged" click count** | Alert audit and medicolegal defense. | Durable override is an explicit event carrying rationale, not a UI click counter. Click counts encourage alert fatigue without improving audit. |
| **Inactive hidden-allergy flag without supersession** | Legacy list maintenance; suppress nuisance alerts. | Lifecycle is explicit supersession/correction; hidden mutable flags erase history and violate invariant 2. |
| **AD "on file" checkbox without document_ref or actionable summary** | Billing / regulatory checkbox for 42 CFR 489.102 admission notice. | Must have either `artifact_ref` or structured assertion with clauses; a flag alone is non-operational. A review action with `data.result.advance_directive = "present_unverified"` handles the intake step without creating a fake constraint. |
| **"Code status as of chart entry" header field** | Flat "current state" for rounds glance. | This is the definition of derived state (`currentState(axis:"constraints")`); treating it as canonical was the exact mistake the charter §3.4 guards against. |
| **Generic "contraindication yes/no" checkbox** | Forms and procedure checklists. | No target, rule, source, or lifecycle; cannot block or allow a specific write. Constraint requires structured payload. |
| **Separate POLST / living-will / DPOA tabs with distinct schemas** | Documents filed under separate origin workflows. | One primitive: `artifact_ref(subtype = advance_directive)` with `data.form_type` polymorphism; assertions are `assessment.constraint` events derived per clause. Tabs are a view concern. |

## 9. Canonical / derived / rendered

- **Canonical** (claim stream): `assessment.subtype = constraint` events for each actionable restriction/directive/refusal; `action.subtype = constraint_review` events proving a domain was reviewed (including "none known" outcomes); `observation.subtype = negative` events when patient/surrogate denies a constraint (evidence supporting a review); `communication` events documenting goals-of-care conversations that precede code-status or AD-activation changes; `artifact_ref(subtype = advance_directive)` events for POLST/MOLST/living-will/DPOA documents and outside allergy records; supersession/correction links preserving prior versions.
- **Derived** (view primitives): `readActiveConstraints()` — active constraints + latest review metadata by domain; `currentState(axis:"constraints")` — non-superseded active/final constraint events as of `asOf`, filtered per DESIGN §4.3 axis rule; `openLoops()` — OL-CONSTRAINT-01…09; `evidenceChain(constraint_id)` — walks supports to patient report, reactions, documents, conversations, corrections. The `constraints.md` YAML snapshot is a cached render of `currentState(axis:"constraints")`; **on any disagreement between snapshot and event stream, event stream wins.** Regeneration closes the gap.
- **Rendered** (UI-only): allergy banners, severity-to-color mapping, NKDA chip text, DNR wristband indicator, code-status header badge, POLST icon, "AD verified" checkmark, side-panel grouping, alert wording, modal styling, alert-fatigue thresholds. None of these live in the event stream.

## 10. Provenance and lifecycle

### Provenance
- Source(s) of truth: patient/surrogate report, clinician-authored assessment, prior observed reaction, imported `AllergyIntolerance` / POLST / AD data, scanned or native artifact, goals-of-care communication, pharmacist clarification, agent consistency checks.
- `source.kind` values from DESIGN §1.1: `patient_statement`, `surrogate_statement`, `admission_intake`, `nurse_charted`, `clinician_chart_action`, `protocol_standing_order` (pharmacist cross-class assertion, RN verification under protocol), `agent_bedside_observation`, `agent_review`, `manual_lab_entry` (outside allergy records transcribed at the chart), `synthea_import`, `manual_scenario`. `mimic_iv_import` coverage is thin for constraints; not a primary source.

### Lifecycle
- **Created by:** an `assessment.subtype = constraint` event, supported by one or more of `observation.patient_report`, `observation.negative`, `communication.goals_of_care`, prior reaction `observation`, or `artifact_ref`.
- **Updated by:** supersession — a new `assessment.constraint` event with revised payload and `links.supersedes: [prior_event_id]`. Verification-status escalation (unconfirmed → confirmed → refuted), severity re-classification, rule change, and code-status transitions are all supersessions. **AD activation on capacity loss is a supersession** of a prior AD-domain constraint with `capacity_context = has_capacity` by a new one with `capacity_context = lacks_capacity, surrogate_authorized` — no new primitive required.
- **Review-only (no mutation):** `action.constraint_review` — the domain was reviewed, result recorded, no change to the assertion stream. Resolves missingness openLoops without creating constraint events.
- **Fulfilled by:** n/a in the strict `links.fulfills` sense; constraints are not intents. A proposed action may *comply with* a constraint, but does not fulfill it.
- **Cancelled / discontinued by:** supersession to `data.status_detail ∈ {inactive, resolved, refuted, no_longer_applicable}` with supporting evidence (allergist delabeling, patient/surrogate revocation, new POLST, discharge of an encounter-scoped limitation, clinician correction).
- **Superseded / corrected:** `links.supersedes` for legitimate lifecycle change; `links.corrects` for wrong-patient, wrong-substance, transcription, imported duplicate, or erroneous entry.
- **Stale when:** domain not reviewed in the current encounter; code status or AD not re-reviewed after major deterioration, procedure/anesthesia planning, transfer, loss of capacity, or new source document; high-severity allergy unsupported by recent evidence `[verify-with-nurse — specific staleness cadence per domain scaffold for project owner]`.
- **Closes the loop when:** a human or authorized agent writes `action.constraint_review` or creates/supersedes a constraint, links the authoritative artifact, or writes documented override/alternative plan accepted by policy.

### Contradictions and reconciliation
- Active penicillin anaphylaxis + piperacillin-tazobactam intent → **warn or block** depending on `criticality` + `override_policy`; require pharmacist/provider review + alternative or rationale.
- NKDA at admission + later imported outside-hospital cephalosporin anaphylaxis → **preserve both, warn**; OL-CONSTRAINT-06 until reconciled; no silent deletion.
- Two active code-status constraints (Full Code + DNR) → **require review**; block elective procedure/anesthesia/resuscitation writes until supersession resolves.
- POLST says DNR + note says family wants "everything" while patient lacks capacity → **preserve both**; require surrogate-authority and capacity review; artifact-supported patient directive remains active until legally superseded.
- AD referenced in note but no `artifact_ref` → **warn**; OL-CONSTRAINT-04 fires; actionable summary is provisional only.
- Blood refusal documented but emergent transfusion intent proposed → **block** unless legal/emergency exception is documented by an authorized clinician; preserve both refusal and exception rationale.
- Allergy delabeling assessment conflicts with active allergy → **require review**; supersede only when delabeling evidence and authorized reviewer are present.
- `constraints.md` snapshot disagrees with event-stream active set → **event stream wins; snapshot regenerates.** V-CON-07 warning, not error.

## 11. Missingness / staleness

- **OL-CONSTRAINT-01 — admission constraint review missing.** No current-encounter `action.constraint_review` or `assessment.constraint` events exist for allergies/intolerances and other high-risk domains. **Blocks** medication, contrast, latex/procedure, blood-product, and diet-related writes until reviewed or emergency override documented. Severity: critical. *The absence of assertion is itself the blocking state — this is the load-bearing OL for A0b.*
- **OL-CONSTRAINT-02 — allergy details incomplete for proposed agent.** Active allergy target matches a proposed medication/class but `reaction_manifestations`, `criticality`, or `verification_status` are unknown. Requires pharmacist/provider review; may block depending on target and severity.
- **OL-CONSTRAINT-03 — code status unspecified in ICU / serious illness.** No active resuscitation directive within the current encounter for MICU / intubated / sedated / vasopressor / perioperative / rapidly deteriorating patients. Blocks elective procedures requiring anesthesia; prompts goals-of-care review; emergency care proceeds under local default policy. Window: `[verify-with-nurse — scaffold]`.
- **OL-CONSTRAINT-04 — advance directive / POLST referenced but unavailable.** Note, patient/surrogate statement, or import references an AD/POLST, but no `artifact_ref` or actionable summary exists. Requires document retrieval or surrogate clarification.
- **OL-CONSTRAINT-05 — active treatment restriction lacks authorizing basis.** Constraint exists for CPR / intubation / dialysis / transfusion / artificial nutrition / surgery but lacks `authorizing_person` or `capacity_context`. Requires review before use.
- **OL-CONSTRAINT-06 — contradictory active constraints.** Two active non-superseded constraints share a `conflict_key` with incompatible `rule` values. Blocks writes in that domain.
- **OL-CONSTRAINT-07 — transfusion possible, blood-product restriction unknown.** Patient is bleeding, severely anemic, perioperative, on ECMO/CRRT, or has an active transfusion intent, but blood-product refusal/restriction has not been reviewed this encounter. Prompts review; blocks non-emergent transfusion consent finalization.
- **OL-CONSTRAINT-08 — stale directive after major change.** Code status or AD constraint was documented before intubation, loss of capacity, major deterioration, ICU transfer, new terminal diagnosis, or new surrogate activation, and has not been re-reviewed. Specific trigger semantics `[verify-with-nurse — scaffold; project-owner to finalize the trigger set and windows]`.
- **OL-CONSTRAINT-09 — conflict overridden without follow-up review.** A conflicting order was allowed with `override_rationale` but no follow-up pharmacist/provider review occurred within the required window. Audit loop remains open.

Staleness is domain-specific. Allergies are durable but their *review status* is encounter-stale. Code status / treatment limitations stale after admission and major clinical change. ADs stale when a newer document is suspected, jurisdiction/setting changes, or capacity state changes. Blood-product restrictions re-confirm before each procedure/transfusion.

Naming pattern parallels A0a's `OL-IDENTITY-*` / `OL-ENCOUNTER-*` / `OL-BASELINE-*` families.

## 12. Agent read-before-write context

Before writing or modifying **any** constraint:

1. `readPatientContext(scope)` — subject, active encounter, baseline context, healthcare proxy link, capacity-relevant A0a fields.
2. `currentState(axis:"constraints")` or `readActiveConstraints(scope)` — active constraints + latest review metadata.
3. `evidenceChain(constraint_id)` for any constraint being changed, refuted, overridden, or cited.
4. `timeline(types:["communication","artifact_ref","assessment","observation"], subtypes:["goals_of_care","scanned_document","constraint","patient_report","negative"], window:<encounter>)` — supporting conversations, documents, reports.
5. `openLoops(filter:{domain:"constraints"})` — unresolved missingness, stale reviews, contradictions.
6. `currentState(axis:"problems")` — serious illness / incapacity / delirium / shock / bleeding / renal failure / diagnosis-specific contraindications can change which constraints matter.

Before writing a **medication, contrast, diet, transfusion, procedure, anesthesia, resuscitation, or goals-of-care intent/action**, additionally:

7. `readActiveConstraints(scope, target:<proposed target/action>)` — target-aware conflict check against `conflict_key`.
8. `evidenceChain()` for any matched hard constraint.
9. `openLoops()` to confirm no active OL-CONSTRAINT-* blocks the proposed write.
10. `currentState(axis:"intents")` to avoid conflicting with an active hold or alternative plan.
11. For surrogate-authorized actions: A0a healthcare proxy + capacity context and latest A6/A7 narrative around goals-of-care.

**Write-side rule (V-CON-01, operationalizing A0a's V-ID-09).** No gated intent or action commits unless `readActiveConstraints()` has been called in the current agent decision cycle AND no active conflict exists — or, if a conflict exists, unless `data.override_rationale` is present on the intent, `override_policy` permits override, and an `assessment` documents the clinical reasoning with `links.supports` to the cited constraint. Stale context-window memory of allergies or code status is **insufficient** — the read must be in-cycle. Mechanism for "in-cycle" is the highest-impact §16 open question.

## 13. Related artifacts

A0b is referenced by every artifact that writes gated intents or actions — the **most frequently read artifact after A0a** in the substrate.

- **A0a (patient/encounter)** — constraints are scoped by `subject`; `constraints.md` linked from `patient.md`; A0a healthcare proxy flows into `authorizing_person` and `capacity_context`.
- **A0c (problems)** — chronic problems may *generate* constraints (CKD 4 → contrast-caution; Jehovah's Witness religious identity → blood-product restriction documented explicitly in A0b). Problems may appear in constraint `links.supports` as clinical rationale; but derived "contraindications-from-problems" are CDS territory (explicitly excluded per EXECUTION §1) and are *not* modeled as A0b constraint events.
- **A1 (labs)** — abnormal labs may support contraindication constraints (severe hyperK + K replacement hold) or trigger review loops; constraints affect lab/procedure order flow.
- **A2 (imaging / procedures)** — contrast allergy screening pulls from A0b; procedural consent pulls code status + AD state + proxy authority.
- **A3 (vitals)** — deterioration stales code-status and AD review (OL-CONSTRAINT-08).
- **A4 (MAR)** — every medication administration passes V-CON-01 against A0b; allergy conflicts produce holds / alternatives / override actions. Highest-volume read path.
- **A4b (medication reconciliation)** — imported home-med discrepancies surface new allergies; reconciliation is a major allergy-verification touchpoint.
- **A5 (I&O + LDAs)** — transfusion / contrast / dialysis / CRRT / line procedures consume constraints.
- **A6 (provider notes), A7 (nursing notes)** — narrative goals-of-care, patient refusals, family meetings, allergy histories *support* constraints via `links.supports`; narrative alone is not itself a constraint.
- **A8 (nursing assessment)** — admission / per-shift assessments refresh constraint review (swallowing / diet / safety / falls).
- **A9a / A9b (orders / ordersets)** — orders must pass A0b gate before commit; orderset defaults are especially dangerous if constraints are stale or unreviewed.

The inverse dependency: A0b assertions are referenced by every gated intent's read-receipt (§16 Q4 mechanism) and by override rationales that cite the specific constraint being overridden.

## 14. Proposed pi-chart slot shape

### Two-layer structure (inherited from A0a)

**Layer 1 — structural `constraints.md`** (lightweight `constraint_set` envelope): derived YAML block snapshotting the per-domain active set for fast read. Explicitly **not authoritative**. The existing `schemas/constraints.schema.json` requires revision to reflect cache semantics rather than primary-source semantics (§16 Q2).

**Layer 2 — event stream** (full envelope):
- `assessment.subtype = constraint` — **new subtype** — the primary constraint primitive (one subtype, axis polymorphism via `data.constraint_domain`). `schema_impact: new subtype`.
- `action.subtype = constraint_review` — **new subtype** — the review act (resolves missingness; documents "none known"). `schema_impact: new subtype`.
- `observation.subtype = negative` — existing subtype from CLAIM-TYPES §1; used as evidentiary support for review actions where applicable.
- `artifact_ref.subtype = advance_directive` — existing `artifact_ref` pattern.
- `communication` with goals-of-care subtypes — existing primitive.

### Event type + subtype
- **New:** `assessment.subtype = constraint` + `action.subtype = constraint_review`. Flagged to `OPEN-SCHEMA-QUESTIONS.md`. Justification against charter §3.3: stays within existing event types (no new type); reuses envelope + links + supersession + `status_detail` machinery; adds two subtypes under the existing `assessment` and `action` types. Parallels A1/A2 convergent consolidated-subtype-with-payload-polymorphism pattern. Per-domain subtypes remain §16 Q1 fallback.
- **Existing:** `observation.negative`, `artifact_ref.advance_directive`, `communication`.

### Payload shape (axis-parameterized assertions + review)

```jsonc
// Medication allergy — high-severity, patient-reported, unconfirmed
{
  "id": "evt_20260418T041500_01",
  "type": "assessment",
  "subtype": "constraint",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_period": { "start": "2026-04-18T04:15:00Z" },
  "recorded_at": "2026-04-18T04:16:10Z",
  "author": { "id": "rn-wilson-c", "role": "rn" },
  "source": { "kind": "admission_intake", "ref": "bedside" },
  "certainty": "reported",
  "status": "active",
  "data": {
    "constraint_domain": "allergy_intolerance",
    "status_detail": "active",
    "target": {
      "kind": "medication_class",
      "display": "penicillins",
      "code_system": "RxNorm",
      "code": "7980"
    },
    "rule": "avoid",
    "criticality": "high",
    "verification_status": "unconfirmed",
    "reaction_manifestations": [
      { "display": "anaphylaxis", "severity": "life_threatening" }
    ],
    "applies_to_scope": "patient_lifetime",
    "override_policy": "human_only",
    "conflict_key": "allergy_intolerance::rxnorm:7980::avoid"
  },
  "links": { "supports": ["evt_20260418T041300_03"] }
}

// Constraint review at admission — closes OL-CONSTRAINT-01 for allergy + blood_product domains
{
  "id": "evt_20260418T040500_04",
  "type": "action",
  "subtype": "constraint_review",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_at": "2026-04-18T04:05:00Z",
  "recorded_at": "2026-04-18T04:05:30Z",
  "author": { "id": "rn-wilson-c", "role": "rn" },
  "source": { "kind": "admission_intake", "ref": "bedside" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "domains_reviewed": ["allergy_intolerance", "blood_product_restriction"],
    "result": {
      "allergy_intolerance": "constraints_present",         // triggers cross-reference to the allergy constraint event(s)
      "blood_product_restriction": "none_known"
    },
    "scope": { "allergy_intolerance": "drug" },             // "drug" | "food" | "environmental" | "all"
    "informant": { "role": "patient", "reliability": "high" }
  },
  "links": { "supports": ["evt_20260418T040430_05"] }       // optional observation.negative for none_known domains
}

// Code-status assertion at ICU admit — full_code, patient has capacity
{
  "id": "evt_20260418T043000_02",
  "type": "assessment",
  "subtype": "constraint",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_period": { "start": "2026-04-18T04:30:00Z" },
  "recorded_at": "2026-04-18T04:35:00Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "goals_of_care_review" },
  "certainty": "observed",
  "status": "active",
  "data": {
    "constraint_domain": "resuscitation_directive",
    "status_detail": "active",
    "target": { "kind": "action_class", "display": "cardiopulmonary resuscitation" },
    "rule": "allow",
    "directive": "full_code",                               // SCAFFOLD — project-owner to finalize institutional enum
    "directive_text": "full code: CPR, intubation, pressors, defibrillation all permitted",
    "authorizing_person": { "role": "patient", "capacity_context": "has_capacity" },
    "applies_to_scope": "current_encounter",
    "override_policy": "human_only",
    "conflict_key": "resuscitation_directive::cpr::allow"
    // trigger set for stale-review (OL-CONSTRAINT-08) deferred to project owner
  },
  "links": { "supports": ["evt_20260418T042700_06"] }       // goals-of-care communication
}

// Advance-directive clause — POLST-derived DNR, supersedes prior full_code
{
  "id": "evt_20260419T143000_07",
  "type": "assessment",
  "subtype": "constraint",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_period": { "start": "2026-04-19T14:30:00Z" },
  "recorded_at": "2026-04-19T14:35:00Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "polst_review" },
  "certainty": "observed",
  "status": "active",
  "data": {
    "constraint_domain": "advance_directive",
    "status_detail": "active",
    "target": { "kind": "action_class", "display": "chest compressions" },
    "rule": "withhold",
    "directive_text": "DNR; selective treatment; intubation permitted for reversible respiratory failure",
    "source_document_ref": "art_20260418_polst_01#section_a",
    "jurisdiction": "IL",
    "authorizing_person": { "role": "patient", "capacity_context": "has_capacity_at_signature" },
    "applies_to_scope": "care_setting",
    "override_policy": "human_only",
    "conflict_key": "advance_directive::chest_compressions::withhold"
    // detailed capacity-loss / activation procedural semantics deferred to project owner (§4.4)
  },
  "links": {
    "supports": ["art_20260418_polst_01", "evt_20260419T142500_08"],  // POLST artifact + family-meeting communication
    "supersedes": ["evt_20260418T043000_02"]                          // prior full_code constraint
  }
}
```

### Link conventions
- `supports`: required — patient report, observed reaction, artifact, communication, outside-record import, pharmacist clarification, allergist delabeling. Invariant 5 enforces at least one entry for constraint assertions with `criticality = high` (validator rule V-CON-03).
- `supersedes`: lifecycle change — verification-status escalation, severity re-classification, rule change, code-status transition, AD-clause re-assertion on capacity change. Also closes open `effective_period` intervals.
- `corrects`: wrong-patient, wrong-substance, transcription, duplicate import, entered-in-error.
- `fulfills`: **not used** on constraint events (constraints are not intents; invariant 10).
- `addresses`: **not used** from constraints to other events (invariant 10); override/rationale events cite constraints via `supports`.

### Evidence addressability
- `event id` (bare or `EvidenceRef`) for each constraint, review, communication, or negative observation.
- `artifact id` + `section ref` for POLST / living will / DPOA / refusal forms.
- `note id` for goals-of-care notes.
- `interval ref` for active periods when reconstructing historical state as of an intent.

### Storage placement
- `assessment.constraint`, `action.constraint_review`, `communication`, and `observation.negative` in `events.ndjson` for the relevant encounter day.
- `artifact_ref` events in `events.ndjson`; native documents under `artifacts/advance_directives/`.
- `constraints.md` as the structural `constraint_set` manifest — **cache only**, regenerable from event stream.

### Frequency class
Event-driven with per-encounter review overlay and write-triggered validation.

### View consumers
`currentState(axis:"constraints")` (primary) · `timeline()` (constraint history, verification escalations, state transitions) · `openLoops()` (OL-CONSTRAINT-01…09) · `evidenceChain()` (walks supports for a verified allergy or activated AD) · `narrative()` (citations in notes). `trend()` is not a constraint consumer.

### Schema confidence + schema impact
- `assessment.subtype = constraint` + `action.subtype = constraint_review`: **schema_confidence: medium**, **schema_impact: new subtype + new payload shape**. Per-domain subtypes remain §16 Q1 fallback.
- Two-layer `constraints.md`-as-cache: **schema_confidence: high** (inherits A0a). **schema_impact: new payload shape** (redefining snapshot semantics), plus `schemas/constraints.schema.json` revision.
- `effective_period` for the `constraint` subtype: **schema_confidence: low**, **schema_impact: potentially new allow-list entry under ADR 005** — §16 Q3.
- V-CON-01 read-receipt mechanism: **schema_confidence: low**, **schema_impact: potentially high** — §16 Q4, highest-impact open question.

## 15. Validator and fixture implications

**Validator rules:**

- **V-CON-01** (cross-artifact with A0a V-ID-09) — every gated intent or action (medication order, contrast-requiring imaging, blood-product order, procedure, anesthesia, resuscitation-altering, dietary) MUST be preceded in its decision cycle by a `readActiveConstraints()` call AND the proposed action MUST NOT match an active constraint whose `conflict_key` intersects the proposed target/action under an incompatible `rule`, unless `data.override_rationale` is present AND `override_policy` permits override AND a supporting `assessment` documents the reasoning. **Mechanism for "preceded in cycle" is §16 Q4.**
- **V-CON-02** — `assessment.subtype = constraint` MUST carry `data.constraint_domain`, `data.target`, `data.rule`, `data.status_detail`, and either `effective_at` or `effective_period` per envelope invariant 11.
- **V-CON-03** (invariant 5 specialization) — `assessment.subtype = constraint` with `data.criticality = high` OR `data.constraint_domain ∈ {resuscitation_directive, advance_directive}` MUST carry at least one entry in `links.supports` pointing at an `observation`, `artifact_ref`, or `communication`. Missing support is a validator error.
- **V-CON-04** — Allergy/intolerance constraints MUST carry `data.target` AND at least one of `reaction_manifestations[]`, `criticality`, or explicit `unknown` placeholders. If a matched medication intent is proposed AND `criticality` or `reaction_manifestations` is unknown, OL-CONSTRAINT-02 fires.
- **V-CON-05** — Resuscitation-directive / advance-directive constraints MUST carry `data.authorizing_person` AND `data.capacity_context`, or link to an artifact/communication providing them. Missing authority creates OL-CONSTRAINT-05.
- **V-CON-06** — `assessment.constraint` with `data.source_document_ref` MUST point to an existing `artifact_ref` in the same patient directory. Dangling reference creates OL-CONSTRAINT-04.
- **V-CON-07** — `action.constraint_review` with result `none_known` MUST include `domains_reviewed`, `result` map, and `informant`; it may resolve missingness but MUST NOT erase prior active constraints without explicit supersession/refutation.
- **V-CON-08** — Supersession chain for the `resuscitation_directive` domain MUST be temporally monotonic (`effective_*(new) > effective_*(prior)`); at most one active code-status constraint per encounter.
- **V-CON-09** — `data.verification_status = refuted` MUST carry `links.supports` with at least one observation or note documenting the refutation (negative skin test, graded challenge, tolerance history). Prevents silent allergy erasure.
- **V-CON-10** — Two active non-superseded `assessment.constraint` events sharing `data.conflict_key` with incompatible `data.rule` values = warning + OL-CONSTRAINT-06; blocks writes in that domain until resolved.
- **V-CON-11** — `constraints.md` YAML, if present, SHOULD match `currentState(axis:"constraints")` at rebuild time; mismatch is a staleness warning (not error) — snapshot regenerates.
- **V-CON-12** — Code-status / treatment-limitation review becomes stale after configured triggers (`[verify-with-nurse — scaffold: trigger set for project owner]`) and SHOULD open OL-CONSTRAINT-08.

**Minimal fixture set (7 scenarios, MICU septic-shock-from-pneumonia aligned, shared `pi-patient-00423` / `enc-00423-001` with A0a):**

1. **Admission constraint review → severe PCN allergy assertion → verification escalation.** `action.constraint_review` at T+0 with `result.allergy_intolerance = none_known`. At T+6h, patient reports hives after PCN → `assessment.constraint, verification_status = unconfirmed, criticality = high, rule = avoid` supersedes the "none known" claim. Pharmacist imports outside records at T+18h documenting prior anaphylaxis → new assertion with `verification_status = confirmed, reaction_manifestations = [{display: anaphylaxis, severity: life_threatening}]` supersedes prior. Exercises V-CON-02/03/04/09 and the verification escalation path.

2. **V-CON-01 enforcement: medication intent blocked by constraint-read absence and conflict match.** An `intent.subtype = order` for piperacillin-tazobactam is proposed without a preceding `readActiveConstraints()` in the decision cycle. V-CON-01 rejects. Agent re-reads constraints, matches the active PCN-class allergy via `conflict_key`, and emits an `assessment` noting the conflict rather than committing. A separate intent for a non-conflicting antibiotic (e.g., cefepime with documented no cross-reactivity concern under override rationale, or a non-beta-lactam alternative) passes. Validates the full V-CON-01 / V-ID-09 path including blocked write + reasoning trace.

3. **Code-status full_code → DNR supersession with goals-of-care support.** Initial `full_code` constraint at admit (scenario 1's decision-cycle read). Day 3, clinical trajectory evolves — detail deliberately scaffold — prompting a goals-of-care `communication` event. A new code-status assertion with `directive` DNR supersedes the prior; `links.supports` cites the conversation. Exercises V-CON-08 (monotonicity) + the communication-as-supports pattern. **Sensitive — clinical detail deliberately light per project-owner instruction.**

4. **AD on file + activation via supersession on capacity loss.** POLST `artifact_ref` exists from 2024. Day 1: `assessment.constraint, constraint_domain = advance_directive, capacity_context = has_capacity` asserts the DNR clause. Day 2: patient intubated and sedated; new assertion with `capacity_context = lacks_capacity, surrogate_authorized` supersedes the prior. No new primitive; activation is an implicit state-change via supersession. Couples to A0a OL-IDENTITY-03 resolution. Exercises V-CON-05, V-CON-06, and the AD-activation-as-supersession pattern. **Sensitive — specific capacity determination workflow scaffolded.**

5. **Outside-hospital transfer with conflicting allergy records (preserve both, require review).** Patient transfers in; imported outside chart asserts sulfa allergy (`source.kind = synthea_import` or equivalent); patient self-reports no drug allergies at admission (`action.constraint_review, result.allergy_intolerance = none_known`). Neither supersedes silently; both events stand and OL-CONSTRAINT-06 fires via `conflict_key` collision. Pharmacist-led tolerance-history review produces either a verification event (`verification_status = confirmed` + supports) or refutation (`verification_status = refuted` + documentation). Exercises V-CON-07, V-CON-09, V-CON-10.

6. **Blood-product restriction — Jehovah's Witness declination blocks non-emergent transfusion.** Admission assertion (`constraint_domain = blood_product_restriction, rule = withhold`, with `target` per product class and `data.partial_acceptance = ["albumin"]`). Day 2, transfusion intent submitted; V-CON-01 blocks via `conflict_key` match. An explicit `override_rationale` + ethics-consult `communication` unlocks the intent only if `override_policy` permits (not `never_override`). Exercises per-domain constraint matching beyond allergy + override documentation path.

7. **Allergy delabeling: refuted penicillin allergy with graded-challenge evidence.** After skin test (-) and graded challenge without reaction, a new assertion with `verification_status = refuted, status_detail = refuted, rule = allow` supersedes the prior confirmed PCN allergy, `links.supports` pointing at the challenge-event observations. A subsequent beta-lactam order passes V-CON-01; `evidenceChain()` from the new intent shows the full refutation trail. Exercises V-CON-09 and the delabeling workflow.

## 16. Open schema questions

Each appears here inline (short form) and in `OPEN-SCHEMA-QUESTIONS.md#a0b-<slug>` (durable home).

1. **[open-schema] Consolidated `assessment.subtype = constraint` with `data.constraint_domain` vs dedicated per-domain subtypes.** Current lean (synthesis resolution): **consolidated**, parallel to A1 Q1 and A2 Q1 convergent pattern, with `data.constraint_domain` polymorphism and domain-conditional payload fields. Alternative (per-domain `constraint_allergy`, `constraint_code_status`, `constraint_advance_directive`) admits per-domain schema constraints at the cost of query-surface fragmentation and type-count growth. **Schema impact: new subtype (consolidated) vs multiple new subtypes (per-domain).** *See `OPEN-SCHEMA-QUESTIONS.md#a0b-consolidated-subtype`.*

2. **[open-schema] `constraints.md` role — cache vs structural canonical.** Synthesis resolution: **cache only.** `constraints.md` is a snapshot of `currentState(axis:"constraints")`, regenerable, never authoritative; event stream wins on any conflict (V-CON-11 warning). Requires revising `schemas/constraints.schema.json` to reflect cache semantics and updating CLAIM-TYPES.md accordingly. *See `OPEN-SCHEMA-QUESTIONS.md#a0b-constraints-file-role`.*

3. **[open-schema] `effective_period` for `constraint` subtype — extend ADR 005 allow-list vs stay with point events + supersession chain.** ADR 005 currently allow-lists `effective_period` for `observation.context_segment`, `action.administration` (infusion), `intent.{monitoring_plan, care_plan}`, `observation.device_reading` (stable setting). Constraints are inherently temporal states (allergies active across a lifetime, code status active per encounter, AD clauses active per capacity state) — interval semantics are natural. But adopting requires an ADR amendment. Current lean: **extend allow-list to include `assessment.constraint` and `action.constraint_review`**, per interval semantics. Alternative: point events in supersession chains (current-state derived via latest non-superseded event). **This is a new open question surfaced by synthesis.** *See `OPEN-SCHEMA-QUESTIONS.md#a0b-effective-period-allow-list`.*

4. **[open-schema] V-CON-01 / V-ID-09 read-receipt mechanism — the highest-impact A0b open question.** How does the validator know `readActiveConstraints()` was called in the current agent decision cycle? Options: **(a)** implicit — every gated intent carries a `data.constraint_read_at` timestamp + a hash or reference to the read's return set; **(b)** explicit — a new `action.subtype = constraint_read` event per read (adds envelope volume); **(c)** agent-run-id correlation — the validator cross-references the intent's `author.run_id` against a read-receipt log outside the chart (pushes state outside); **(d)** semantic via links — the intent carries `links.supports` pointing at constraint events resolved in the cycle, relying on the existing supports grammar. Current lean: **(a) or (d)** — (b) expands primitive grammar contrary to charter §3.3; (c) pushes state outside the chart; (a) keeps the signal on the intent where V-CON-01 checks cheaply; (d) is even lighter but conflates semantic support with read-receipt signaling. **Schema impact: potentially high.** *See `OPEN-SCHEMA-QUESTIONS.md#a0b-read-receipt`.*

5. **[open-schema] `data.verification_status` (payload) vs envelope `certainty` — and relationship to FHIR AllergyIntolerance `verificationStatus`.** `certainty` is epistemic grade of the claim (observed/reported/inferred/planned/performed); `verification_status` is clinical workflow state (unconfirmed/confirmed/refuted/entered-in-error/provisional) aligned with FHIR. They're orthogonal in principle: a `certainty = reported` allergy can have any verification status depending on workup. Current lean: **keep `verification_status` in payload** (FHIR-aligned, drives V-CON-09, drives OL-CONSTRAINT-02), `certainty` remains epistemic grade. Document the orthogonality explicitly in DESIGN / CLAIM-TYPES. *See `OPEN-SCHEMA-QUESTIONS.md#a0b-verification-status`.*

Further questions carried forward — jurisdiction-specific AD form handling (`[phase-b-regulatory]`), perioperative DNR reversal semantics (`[verify-with-nurse]`, explicitly scaffolded), cross-class allergy cross-reference table versioning (`[phase-b]`), whether activity / falls-risk constraints belong in A0b or A8 (flag at calibration), `override_policy` enum finalization (`[verify-with-nurse]`).

## 17. Sources

- CMS 42 CFR 489.100–489.104 — Patient Self-Determination Act, advance directive provisions and admission-notice obligations. eCFR: https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-489/subpart-I.
- CMS 42 CFR 482.13(b)(2)–(3), §482.24(c) — Conditions of Participation: patient rights, advance directives, consent to/refusal of treatment; medical-record content.
- The Joint Commission — RI.01.05.01 and PC.02.02.01 (advance directive documentation); RI.01.02.01 (respecting treatment decisions); NPSG.03.06.01 (medication reconciliation prerequisite); MM.01.01.03 (medication management, allergy before first dose); NPSG.01.01.01 (two-identifier verification, cross-reference A0a). Joint Commission 2026 Hospital National Performance Goals NPG.07 and NPG.14.05.01.
- POLST National Paradigm — polst.org; state-level POLST / MOLST / MOST / POST program documentation (jurisdiction-specific, `[phase-b-regulatory]`).
- AMA Code of Medical Ethics — Opinion 5.2 (resuscitation preferences documentation).
- Society of Critical Care Medicine / American Thoracic Society — ICU goals-of-care guidance, code status and AD review within 24–48h of ICU admission with documented discussion evidence.
- HL7 FHIR R5 `AllergyIntolerance` + `Consent` + `Goal` resources (hl7.org/fhir/R5); US Core AllergyIntolerance profile. USCDI v4 Advance Directive + Allergies data classes (healthit.gov/isa). ONC/ASTP 2026 Standards Bulletin on allergy intolerance criticality.
- RxNorm — NLM drug-ingredient terminology for allergy cross-reference at ingredient / class / cross-class level (rxnav.nlm.nih.gov).
- SNOMED CT — allergen and reaction terminology for non-drug allergies (snomed.org).
- AHRQ / PSNet — safe practices for drug allergies using CDS and health IT. AAAAI workgroup report on allergy EHR documentation.
- MIMIC-IV `hosp.allergies` module — partial coverage; severity and reaction sparse (mimic.mit.edu/docs/iv/modules/hosp/).
- Synthea allergy module and advance-directive module exporter schemas (github.com/synthetichealth/synthea).
- Repository: `PHASE-A-CHARTER.md` (stance, tags, §4.4 hybrid-execution rule), `PHASE-A-TEMPLATE.md v3.1`, `PHASE-A-EXECUTION.md v3.2` (Batch 0 rationale, calibration checklist), `CLAIM-TYPES.md` (`assessment.subtype` conventions, `observation.subtype = negative`, `constraint_set` structural type, `status_detail` enums per ADR 002, `effective_period` allow-list per ADR 005), `DESIGN.md` §1.1 source.kind registry, §4.3 currentState axis rules, §6 link taxonomy, §8 invariants 5/6/10/11; `a0a-patient-demographics-encounter.md` (V-ID-09 cross-artifact rule, two-layer hybrid pattern, OL-IDENTITY-03 parallel, MICU septic-shock anchor); `a1-lab-results.md`, `a2-results-review.md` (consolidated-subtype convergent pattern, supports-chain verification).

*End A0b synthesis. Primitive resolution: `assessment.subtype = constraint` (Council B) + `action.subtype = constraint_review` (Council B) + `observation.subtype = negative` as evidence (existing). Sensitive clinical-workflow detail (capacity-assessment specifics, code-status transition cadence thresholds, AD activation procedure, perioperative DNR reversal, withdrawal-of-care workflow, trigger sets for OL-CONSTRAINT-08) deliberately scaffold-light for project-owner rewrite, per instruction. §2 requires project-owner rewrite per charter §4.4 before Batch 0 calibration passes.*
