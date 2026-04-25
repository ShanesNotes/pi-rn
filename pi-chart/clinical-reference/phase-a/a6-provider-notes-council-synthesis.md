# A6. Provider notes (H&P, progress, consult, procedure, event) — council synthesis

*Council synthesis note.* This version merges the prior A6 synthesis with Claude's A6 pass and applies substrate corrections from the current pi-chart repo. The decisive boundary is unchanged: provider notes are **Markdown narrative files paired with `communication` events**, not a seventh clinical event type. Claude's subtype split wins over the earlier generic/provider-prefixed naming because `communication.progress_note` already exists as a conventional subtype and each provider-note kind carries different validator obligations. Two corrections are applied to Claude's draft: (1) `communication` events keep point-shaped `effective_at`; the clinical coverage interval lives in `data.window` unless ADR 005 later allow-lists communication intervals; and (2) provider notes do not use `links.addresses` as the executable problem-addressing edge. Plans, intents, and actions address problems; notes reference the problem and plan events.

## 1. Clinical purpose

Provider notes — admission H&P, progress/rounding notes, consult notes, procedure notes, event notes, and attestations — preserve a clinician's accountable synthesis over a bounded clinical window. They answer what the clinician believed was happening, what evidence supported that belief, what changed, what plan followed, what uncertainty remained, and who was accountable for the assertion. Their clinical function is not to store copied vitals, labs, medications, or device rows. Their function is to turn dispersed evidence into a dated, authenticated reasoning and handoff artifact while any care-changing facts inside the note are also represented as structured claim-stream events.

## 2. Agent-native transposition

A provider note is not a documentation tab, a SmartPhrase bundle, or a bag of free text. In pi-chart it is **a narrative communication over the claim graph**, paired with structured sibling claims for state-changing reasoning, plans, procedures, results, orders, and closures.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Admission H&P | `communication.admission_note` + paired Markdown note; co-authored `assessment.problem`, `assessment.impression`, `intent.care_plan`, and `intent.order` events where care state is established | `narrative()`, `evidenceChain()`, `currentState(axis:"problems")`, `openLoops()` |
| Daily progress / rounding note | Existing `communication.progress_note`; narrative cites recent A1/A2/A3/A4/A5/A8 evidence and companion assessments/intents for changes | `narrative()`, `timeline()`, `trend()`, `evidenceChain()` |
| Consult note | `communication.consult_note`; supports an action such as `action.notification` with `data.action: "consult_delivered"` or future `action.consult_delivered` that fulfills the `intent.referral`; the note itself does not fulfill | `openLoops(kind:"consult_pending")`, `evidenceChain()`, `narrative()` |
| Procedure note | `communication.procedure_note`; cites the `action.procedure_performed` event and verification evidence such as A2 result review or A5 LDA context | `timeline()`, `evidenceChain()` |
| Event note: rapid response, code, transfer, decompensation | `communication.event_note`; cites trigger evidence and co-authors any new `assessment.impression`, `intent.order`, `intent.monitoring_plan`, or `intent.care_plan` | `timeline()`, `openLoops()`, `evidenceChain()` |
| Resident/APP note + attending attestation | Primary `communication.*_note` plus `communication.attestation` with `data.attests_to` pointing to the primary note id and substantive `data.attestation_basis` | `narrative()`, `openLoops(kind:"attestation_pending")` |
| Family meeting / goals-of-care note | Usually `communication.event_note` or `communication.progress_note`; any code-status / goal change is A0b `assessment.constraint`, not note prose alone | `currentState(axis:"constraints")`, `narrative()` |
| SmartLink-rendered vitals/labs/I&O/medication sections | Not canonical; rendered from A1-A5/A8 views at read time | rendered only |
| Auto-populated problem list or medication list pasted into note | Not canonical; derived from `currentState(axis:"problems"|"medications")` when those axes exist | rendered only |
| Billing-driven E&M complexity / time block | Excluded unless a later payer profile needs it; not clinical memory | — |

> Provider notes are canonical for **who synthesized what, when, from which evidence, for which audience, and with what accountable plan**. The underlying clinical facts remain in the claim stream.

**Load-bearing claims.**

**(a) The note remains a paired Markdown + `communication` model, not a new event type.** The substrate already has six clinical event types in `events.ndjson`, with notes represented as Markdown files whose frontmatter is paired to a `communication` event through `data.note_ref`. A6 adds provider-note subtypes and payload conventions inside that model.

**(b) Narrative is canonical, but copied discrete facts are not.** A progress note saying “worsening hypoxemic respiratory failure; broaden antibiotics” is canonical evidence that the clinician wrote that synthesis. The SpO₂ trend is A3, the antibiotic intent/action chain is A4/A9a, and the respiratory trend/impression should be an `assessment` event when it drives care.

**(c) Reasoning and plan must be visible to views.** Problems live as A0c `assessment.problem`; interpretations as `assessment.impression`, `assessment.trend`, `assessment.severity`, or domain-specific assessments; plans and executable changes as `intent.*` or `action.*`. A note can summarize them, but `openLoops()` cannot act on prose alone.

**(d) Note subtypes split by clinical function, not rendering format.** `admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, and `attestation` have different validator obligations. A generic `provider_note` with `data.note_kind` remains an open option, but split subtypes are the council lean.

**(e) `communication` events are point events.** A note may cover a shift or admission window, but the communication itself has `effective_at` as the authored/sent clinical communication time. The covered clinical interval belongs in `data.window`. Do not use `effective_period` on note communications under the current ADR 005 allow-list.

**(f) Notes do not carry `links.fulfills`.** ADR 003 keeps fulfillment sources as `action` events and targets as `intent` events. A consult note supports the consult-delivered action; the action fulfills the referral. A procedure note supports or references `action.procedure_performed`; the action fulfills the procedure intent.

**(g) Attestation is a thin second communication.** A cosign/attestation is a dated, signed, authored record addition that other clinicians read. Model it as `communication.attestation`, not as an envelope mutation and not as a bedside clinical action. Whether it also resolves a documentation loop is an open-loop convention, not a `fulfills` edge.

**(h) Section-level evidence pressure is real.** A progress note can contain multiple claims. Whole-note citation is often too blunt. A6 therefore carries an open schema question for note-section / statement addressability using `EvidenceRef.kind: "note"` plus `selection`, rather than inventing a separate note URI in this artifact.

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR § 482.24(b) and § 482.24(c)(1)** — hospital medical records must be accurate, prompt, accessible, dated, timed, and authenticated by the responsible person. Anchors note frontmatter, author, `recorded_at`, status, append-only correction, and attestation discipline.
2. **[regulatory] CMS 42 CFR § 482.24(c)** — the medical record must justify admission and continued hospitalization, support diagnosis, and describe patient progress and response to medications and services. Anchors evidence-backed progress/admission notes rather than template filler.
3. **[regulatory] CMS 42 CFR § 482.24(c)(4)(i), (iii), (vi), (vii), (viii)** — records must include H&P/update timing, consultative evaluations, orders/reports/vitals/monitoring information, discharge summary, and final diagnosis as appropriate. Anchors `admission_note`, `consult_note`, provider progress/procedure hooks, and discharge-summary adjacency.
4. **[regulatory] CMS 42 CFR § 415.172** — teaching-physician participation must be documented in the medical record for applicable resident services. Anchors `communication.attestation` and teaching-context open loops.
5. **[professional/interoperability] HL7 FHIR R5 `Composition`, `DocumentReference`, `ClinicalImpression`, and `Communication`** — separates attested narrative/document packages, referenced documents, clinical assessment, and communications. Used as an interoperability witness, not pi-chart authority.

`[phase-b-regulatory]` — state scope of practice, teaching-hospital cosign windows, APP supervision, specialty consult timing, discharge-summary completion deadlines beyond the federal floor, sensitive-note access controls, local note-retention policy, and payer E/M documentation should be profile/policy work, not Phase A primitive design.

## 4. Clinical function

Provider notes are consumed at four moments.

- **Admission / transfer framing.** The receiving clinician needs the story: why the patient is here, what problems are active, what constraints matter, what evidence supports the diagnosis, what the initial plan is, and what immediate risks remain.
- **Daily / rounding reassessment.** The team asks what changed since the last note, whether trajectory is improving or worsening, whether active orders match the plan, and what must happen before the next handoff.
- **Consultation, procedure, and escalation.** Specialists and proceduralists document their assessment, recommendations, performed procedures, complications, verification evidence, and follow-up obligations.
- **Handoff and audit.** Downstream clinicians, agents, validators, and chart reviewers need to reconstruct which reasoning was available at the time, who authored it, and which plan/order/device/medication/result loops remained open.

For the seed respiratory-decompensation fixture, A6 is the surface that would answer: what did the admitting provider think, what did the progress note say about worsening hypoxemia, what did ID recommend, what happened during CVC placement if the scenario escalates, and whether a resident note was attested.

## 5. Who documents

Primary: **attending physicians, fellows, residents, interns, and APPs** for admission/progress/event/procedure notes within scope; **consultant physicians or APPs** for consult notes.

Secondary:
- **Resident-attending pairing:** resident/fellow authors the primary note; attending authors `communication.attestation` where required.
- **APP workflows:** APPs may author independently or with attestation depending on local/state rules (`[phase-b-regulatory]`).
- **Procedural operator:** authors procedure notes; may be physician, fellow, resident, or APP depending on scope.
- **pi-agent:** may draft `source.kind: agent_synthesis` notes or summaries but should not create final provider-authority notes or attestations without clinician authorship/confirmation.
- **Importer:** may import historical notes as narrative-only with decomposition pending; imported prose does not automatically populate structured state.
- **Patient/surrogate:** does not author provider notes; patient statements enter as `observation.patient_report` or communication evidence that a note may cite.

Owner of record: the authoring clinician in the envelope. For resident-attending pairs, the primary note still names the resident/fellow author; the attestation names the attending and records the attending's accountable addition/agreement/qualification.

Source-kind discipline: use the existing closed taxonomy (`clinician_chart_action`, `admission_intake`, `agent_synthesis`, `dictation_system`, `synthea_import`, `mimic_iv_import`, `manual_scenario`). No new A6 `source.kind` values are proposed.

## 6. When / how often

Frequency class: **per-encounter + periodic + event-driven + per-transition**, subtype-dependent.

- **Admission note / H&P:** one-shot per encounter/admission; CMS floor is within the H&P timing rules and prior to anesthesia procedures where applicable.
- **Progress / rounding note:** periodic; daily on many inpatient floors, often per-day or per-shift in ICU depending on service policy and patient acuity.
- **Consult note:** per consult request, with follow-up notes when the consulting service continues to manage recommendations.
- **Procedure note:** per performed procedure; contemporaneous or near-contemporaneous with the action.
- **Event note:** event-driven after code, rapid response, transfer, major decompensation, procedure complication, or major goals-of-care change.
- **Attestation:** per primary note requiring cosign/attestation within local teaching/supervision policy.
- **Discharge summary:** A6-adjacent note subtype for transition closure; Phase A keeps it as a provider-note family hook while discharge planning content remains Phase B narrative scope.

Regulatory floor is sparser than clinical practice. Practice may require same-day progress notes, immediate event notes, or service-specific consult windows; those are `[phase-b-regulatory]` policies.

## 7. Candidate data elements

### Envelope / note-pair elements

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| `type: communication` | [clinical] | ✓ | enum | Note loses graph identity; would pressure a new event type unnecessarily | substrate | high |
| `subtype` | [clinical][regulatory] | ✓ | enum: `admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation` | Cannot apply subtype-specific validators or narrative filters | clinician_chart_action / agent_synthesis / import | high |
| `author.id`, `author.role` | [regulatory] | ✓ | object | Authentication, accountability, cosign rules, and role-aware views fail | envelope | high |
| `effective_at` | [clinical][regulatory] | ✓ | ISO timestamp | Communication cannot be placed in timeline; ADR 004 meaning for communication is lost | envelope | high |
| `recorded_at` | [regulatory] | ✓ | ISO timestamp | Completion timing and audit trail fail | envelope | high |
| `status` | [clinical][regulatory] | ✓ | `draft | active | final | superseded | entered_in_error` | Draft/final/correction distinction fails | envelope | high |
| `source.kind` | [clinical][agent] | ✓ | closed enum | Human, agent, dictation, and import provenance collapse | envelope | high |
| `transform` | [agent] | optional | ADR 011 object | Generated/extracted/transcribed notes cannot expose processing inputs | pi-agent / importer | medium |
| `data.note_ref` | [clinical][regulatory] | ✓ | note id | Markdown↔communication bidirectional integrity fails | writeCommunicationNote | high |
| note frontmatter `references[]` | [clinical][agent] | ✓ | array of local string ids | Validator cannot audit note references; narrative evidence is opaque | authoring tool / importer | high |
| Markdown narrative body | [clinical][regulatory] | ✓ | markdown | Synthesis and legal narrative record fail | clinician / agent draft / import | high |

### Subtype-specific payload elements

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| `data.window` | [clinical] | ✓ for progress/event/admission coverage | `{from,to}` | Cannot distinguish the clinical period covered by the note; evidence-in-window validation fails | authoring tool | high |
| `data.focus_problem_refs[]` | [clinical][agent] | ✓ | event ids to `assessment.problem` | Narrative cannot be mapped to active problems without abusing `links.addresses` | authoring tool / derived helper | medium-high |
| `data.plan_change_refs[]` | [clinical][agent] | ✓ when note changes plan | event ids to `intent`/`action` | Plan/order drift is hidden; `openLoops()` cannot verify executable changes | authoring clinician / agent | high |
| `data.problems_established[]` | [clinical] | ✓ for admission note | `assessment.problem` ids | Admission note can describe problems invisible to `currentState(axis:"problems")` | clinician | high |
| `data.problems_updated[]` | [clinical] | optional/conditional | `assessment.problem` ids | Problem status changes may stay prose-only | clinician | medium |
| `data.procedure_ref` | [clinical][regulatory] | ✓ for procedure note | `action.procedure_performed` id | Cannot connect narrative to performed procedure or verification | clinician | high |
| `data.consult_request_ref` | [clinical] | ✓ for consult note | `intent.referral` id | Consult-pending loop cannot close cleanly | consultant / ordering team | high |
| `data.trigger_ref` | [clinical] | ✓ for event note | event id or EvidenceRef | Cannot reconstruct why event note was written | clinician / agent | medium-high |
| `data.attests_to` | [regulatory] | ✓ for attestation | primary note id | Cosign chain cannot resolve | attending | high |
| `data.attestation_basis` | [regulatory][clinical] | ✓ for attestation | short text | Boilerplate attestation cannot show what was agreed/qualified | attending | high |
| `data.import_provenance` / `data.decomposition_pending` | [agent][open-schema] | conditional | enum / boolean | Imported prose may masquerade as fully structured live-authored note | importer | medium |
| `data.summary` | [agent][clinical] | optional | short text | Narrative list is less scannable; not safety-critical | authoring tool / agent | medium |
| `data.audience` | [clinical] | optional | roles/ids | Handoff routing and consult audience may be unclear | authoring tool | medium |

**Considered and excluded as separate canonical fields:** `data.session_id` (derivable; see §16), note title (subtype + timestamp + slug suffices), patient banner fields (context-derived), word count, E/M level, MDM complexity, note UI section order, “copy forward from” as a fact rather than provenance/transform metadata, and duplicated vitals/labs/I&O/medication tables.

## 8. Excluded cruft — with rationale

| Field / pattern | Why it exists in current EHRs | Why pi-chart excludes |
|---|---|---|
| Auto-rendered vitals/labs/I&O/medications blocks inside note body | SmartLinks, billing visibility, perceived completeness | Truth lives in A1-A5/A8; note should cite or interpret relevant evidence, not paste the table |
| Copy-forward prior-note prose | Speed, defensive documentation, template habit | Creates stale narrative; structured siblings and evidence-in-window validators should expose changes |
| Billing E&M complexity, time-spent block, CPT-level MDM prose | Payer documentation | Not clinical memory; Phase B/payer profile if ever |
| Legal disclaimer boilerplate | Institutional risk management | Does not answer a clinical decision, handoff, safety, or audit question |
| “Reviewed and agree” attestation with no substance | Template default and speed | Fails attestation decision test; must state what is being attested or qualified |
| Exhaustive ROS pasted into every provider note | Billing/template inheritance | A8 exam findings and targeted observations carry clinical truth; narrative ROS is only synthesis |
| CDS alert history pasted into note text | Audit habit | CDS alerts are pi-sim/UI policy surface unless a clinician acted and wrote an action/assessment |
| Problem list copy-paste at note top | Template/context convenience | `currentState(axis:"problems")` is authoritative; pasted copies drift |
| Patient education checkbox block | Quality/billing/Meaningful Use habit | Patient education is Phase B unless it changes constraints/care plan or is a patient-facing communication |
| Note tab color, cosign badge, section collapse, differential highlighting | UI navigation | Rendered only; views can compute status without storing UI affordances |

## 9. Canonical / derived / rendered

- **Canonical**
  - Markdown provider note body with frontmatter under `notes/HHMM_<slug>.md`.
  - Matching `communication` event with `data.note_ref`.
  - Provider-note subtypes: existing `progress_note`; proposed `admission_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`.
  - Companion structured events for problems, assessments, plans, orders, result reviews, procedures, consult delivery, and constraints.
  - `artifact_ref` events for external documents or native dictated/scanned artifacts when the artifact matters.
  - `communication.attestation` as a second communication/note when cosign/teaching participation must be documented.

- **Derived**
  - Latest note by service/author, problem-oriented note list, “what changed since last note,” plan/order drift, missing H&P, pending consult, pending attestation, discharge-summary readiness, copy-forward/staleness warnings, and note-derived handoff summaries.
  - Context panels rendered from A0-A5/A8/A9 state.
  - Session grouping from author + recorded_at proximity + explicit note references.

- **Rendered**
  - SOAP/APSO headings, collapsible note panels, yesterday/today diffs, note badges, colored cosign icons, problem-list sidebars, auto-filled tables, section labels, and one-liner placement.

## 10. Provenance and lifecycle

### Provenance

Sources of truth: clinician-authored narrative, clinician-dictated/transcribed narrative, imported external note, and agent-generated draft/synthesis. Use existing source kinds: `clinician_chart_action`, `admission_intake`, `dictation_system`, `agent_synthesis`, `agent_inference` only for companion assessment events, `synthea_import`, `mimic_iv_import`, and `manual_scenario`. Do not create `provider_note` or `attestation_system` source kinds. `author.role` differentiates attending, resident, APP, consultant, and agent roles.

Generated notes require `source.kind: agent_synthesis` plus `transform.activity: "summarize" | "extract" | "transcribe" | "infer"` as appropriate, with `transform.input_refs` for the evidence read. Live generated provider notes remain `status: draft` until clinician confirmation/attestation.

### Lifecycle

- **Created by:** `writeCommunicationNote()` or an importer/transcription pathway creates both note file and matching communication event.
- **Updated by:** new communication/note event using `links.supersedes`, `links.corrects`, or a future addendum convention. Do not mutate the original note body.
- **Fulfilled by:** notes themselves fulfill no intents. Consult, procedure, and documentation obligations close through action/loop conventions; the note supports or resolves those where allowed.
- **Cancelled / discontinued by:** not applicable for finalized notes; erroneous notes use `entered_in_error` plus correction/supersession.
- **Superseded / corrected by:** a later note/communication; views show the chain and preserve prior text.
- **Stale when:** patient condition materially changes, referenced evidence is superseded/corrected, active problems/intents no longer match the narrative plan, or local cadence/policy creates an overdue documentation obligation.
- **Closes a loop when:** the relevant note/attestation/action exists and any executable plan changes have structured `intent`/`action` events. A prose note alone does not close medication, device, result-review, or order loops.

### Contradictions and reconciliation

- **Note says “no hypoxia” but A3 shows sustained SpO₂ decline.** Preserve both; later assessment/correction uses `contradicts` or counterevidence.
- **Note plan says “continue ceftriaxone” but active medication order is stopped.** Preserve both; surface plan/order drift.
- **Consult recommends anticoagulation but A0b constraint or A1 labs suggest bleeding risk.** Preserve both; downstream decision cites acceptance/defer/decline rationale.
- **Copied-forward exam says “no central line” while A5 shows active CVC.** Preserve both and flag likely stale narrative.
- **Resident note and attending attestation disagree.** Preserve both; attestation basis should name the disagreement or qualification.
- **Narrative says “no change” but companion events create new orders/intents.** Structured events drive state; note-narrative divergence becomes a soft open loop.

Chart-as-claims, not chart-as-truth.

## 11. Missingness / staleness

- **What missing data matters clinically?**
  - Missing admission H&P/update by the regulatory/procedural deadline.
  - Missing progress/provider reassessment after major deterioration, ICU transfer, new critical result, escalating oxygen/pressor need, major I&O/bleeding event, or unresolved rapid-response communication.
  - Consult requested but no consult note + consult-delivered action/recommendation disposition by expected time.
  - Procedure performed without a procedure note and verification references within policy window.
  - Resident/fellow/APP note requiring cosign without `communication.attestation` by local policy window.
  - Note states a plan change but no corresponding structured intent/action exists.
  - Discharge summary/final diagnosis/follow-up narrative missing at transition.

- **What missing data is merely unknown?**
  - No exhaustive ROS/exam prose when focused findings and A8 observations are complete.
  - No separate note for a stable overnight interval when local policy does not require one and no trigger occurred.
  - No billing complexity/time block.
  - No patient education boilerplate when no patient-facing communication or care-plan change occurred.

- **When does A6 become stale?**
  - A note is an immutable account of its authored window; it does not become invalid merely because time passes.
  - Note-related obligations become stale when policy windows pass, clinical state changes without reassessment, or structured state diverges from prose.
  - Admission, consult, procedure, attestation, and discharge-summary deadlines are policy/profile-specific except where CMS creates a federal floor.

- **Should staleness create an `openLoop`?**
  - Yes for missing H&P/update, consult response, procedure note, attestation, post-deterioration provider reassessment, discharge summary, and note-plan/action drift.
  - No for generic “no note today” without a policy or clinical trigger.

## 12. Agent read-before-write context

Before drafting or authoring a provider note, an agent should read:

- `readPatientContext()` / encounter header for identity, admission time, service, location, baseline, and time zone.
- `currentState(axis:"constraints")` / `readActiveConstraints()` for allergies, code status, directives, goals, refusals, and communication preferences.
- `currentState(axis:"problems")` / `activeProblems()` for the active problem graph.
- Recent `narrative({from,to})` for provider notes, consult notes, nursing notes, SBAR/handoff communications, and attestations.
- `timeline({from:last_note,to:now})` filtered to clinically relevant observations, assessments, intents, actions, and communications.
- `trend()` and A3 vitals/context for trajectory, not just latest values.
- A1/A2 results and `openLoops(kind:"result_review"|"critical_result")` for actionable unreviewed findings.
- A4/A4b medication state, recent administrations/holds/refusals/omissions, reconciliation decisions, and medication response obligations.
- A5 I&O balance/LDA state once implemented, especially for ICU progress/event/procedure notes.
- `openLoops()` for overdue orders, monitoring cadence misses, pending consults, missing attestations, contradictions, and plan-order divergence.
- `evidenceChain()` for any claim the note will supersede, correct, or heavily summarize.
- For consult notes: the specific `intent.referral` and any question asked by the primary team.
- For procedure notes: the performed action, consent/constraint context, verification artifacts, complications, and follow-up orders.
- For attestations: the primary note body, companion structured events, and the evidence chain for any statement the attending endorses or qualifies.

Write companion structured claims first or in the same transaction when the note changes care. The note then references those claim ids and explains the reasoning.

## 13. Related artifacts

- **A0a Patient/encounter/baseline:** H&P and progress notes use encounter/admission/location context.
- **A0b Constraints:** notes cite allergies, code status, goals, refusals; constraint changes are A0b events.
- **A0c Problems:** admission/progress notes create, update, and synthesize active problem assessments, but problem truth remains structured.
- **A1 Labs / A2 results review:** notes interpret results; result-review actions close review loops.
- **A3 Vitals:** progress/event notes cite vitals windows and context; copied vitals grids are rendered-only.
- **A4 MAR / A4b medication reconciliation:** notes synthesize medication plan/response; MAR/med-rec remain authoritative.
- **A5 I&O + LDAs:** notes interpret fluid balance and devices; A5 remains volume/device truth.
- **A7 Nursing notes:** parallel narrative surface with different author role and bedside-care function.
- **A8 ICU nursing assessment:** provider notes may cite findings but should not duplicate head-to-toe flowsheets.
- **A9a Individual order primitive:** note plans become executable only as intents/orders/actions.
- **A9b Orderset invocation:** admission notes may describe an invoked orderset; orderset lineage remains A9b.
- **patient_001 fixture:** currently narrow respiratory-decompensation seed with one SBAR/note pattern; A6 fixture additions should not be treated as existing broad coverage until authored.

## 14. Proposed pi-chart slot shape

### Event type + subtype

**Existing type:** `communication`.

**Recommended subtypes:**

- Existing: `progress_note`.
- Proposed new conventional subtypes: `admission_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`.

**No new event type. No new storage primitive. No new source kind. No new link kind. No new view primitive.**

### Note frontmatter example

```jsonc
{
  "id": "note_20260419T093000_progress",
  "type": "communication",
  "subtype": "progress_note",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T09:30:00-05:00",
  "recorded_at": "2026-04-19T09:34:00-05:00",
  "author": { "id": "md_resident_03", "role": "resident" },
  "source": { "kind": "clinician_chart_action", "ref": "rounding" },
  "status": "final",
  "references": [
    "evt_problem_hypoxemic_resp_failure",
    "evt_assessment_resp_trend_0920",
    "evt_intent_id_referral",
    "evt_mardose_ceftriaxone_0600"
  ]
}
```

### Matching communication event

```jsonc
{
  "id": "evt_20260419T093000_progress_note",
  "type": "communication",
  "subtype": "progress_note",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T09:30:00-05:00",
  "recorded_at": "2026-04-19T09:34:00-05:00",
  "author": { "id": "md_resident_03", "role": "resident" },
  "source": { "kind": "clinician_chart_action", "ref": "rounding" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "note_ref": "note_20260419T093000_progress",
    "note_family": "provider",
    "window": { "from": "2026-04-18T20:00:00-05:00", "to": "2026-04-19T08:00:00-05:00" },
    "summary": "Overnight worsening hypoxemia; ID consult pending; continue ceftriaxone pending culture finalization.",
    "focus_problem_refs": ["evt_problem_hypoxemic_resp_failure", "evt_problem_pneumonia"],
    "plan_change_refs": ["evt_intent_id_referral", "evt_intent_spo2_monitoring_q1h"],
    "service": "medicine_micu",
    "audience": ["primary_team", "bedside_rn"]
  },
  "links": {
    "supports": [
      { "kind": "event", "ref": "evt_assessment_resp_trend_0920", "role": "primary" },
      {
        "kind": "vitals_window",
        "ref": "vitals://enc_001?name=spo2&from=2026-04-18T20:00:00-05:00&to=2026-04-19T08:00:00-05:00",
        "role": "primary"
      },
      { "kind": "event", "ref": "evt_io_balance_0600", "role": "context" }
    ]
  }
}
```

### Companion structured assessment

```jsonc
{
  "id": "evt_assessment_resp_trend_0920",
  "type": "assessment",
  "subtype": "trend",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T09:20:00-05:00",
  "recorded_at": "2026-04-19T09:22:00-05:00",
  "author": { "id": "md_resident_03", "role": "resident" },
  "source": { "kind": "clinician_chart_action", "ref": "rounding" },
  "certainty": "inferred",
  "status": "final",
  "data": {
    "domain": "respiratory",
    "summary": "Worsening hypoxemic respiratory failure overnight despite oxygen escalation",
    "status_detail": "worsening"
  },
  "links": {
    "supports": [
      {
        "kind": "vitals_window",
        "ref": "vitals://enc_001?name=spo2&from=2026-04-18T20:00:00-05:00&to=2026-04-19T08:00:00-05:00",
        "role": "primary"
      },
      { "kind": "event", "ref": "evt_context_o2_4l_nc", "role": "context" }
    ]
  }
}
```

### Consult note with action-based closure

```jsonc
// action.notification — existing-subtype closure candidate; dedicated
// action.consult_delivered remains an open-schema option.
{
  "id": "evt_20260419T153000_consult_delivered",
  "type": "action",
  "subtype": "notification",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T15:30:00-05:00",
  "recorded_at": "2026-04-19T15:31:00-05:00",
  "author": { "id": "md_id_01", "role": "consultant" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "action": "consult_delivered",
    "channel": "consult_note",
    "note_ref": "note_20260419T153000_id_consult"
  },
  "links": {
    "fulfills": ["evt_intent_id_referral"],
    "supports": [{ "kind": "note", "ref": "note_20260419T153000_id_consult", "role": "primary" }]
  }
}

// communication.consult_note — no fulfills edge.
{
  "id": "evt_20260419T153000_consult_note",
  "type": "communication",
  "subtype": "consult_note",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T15:30:00-05:00",
  "recorded_at": "2026-04-19T15:31:00-05:00",
  "author": { "id": "md_id_01", "role": "consultant" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "note_ref": "note_20260419T153000_id_consult",
    "note_family": "provider",
    "consult_request_ref": "evt_intent_id_referral",
    "summary": "ID consult: pneumonia improving; narrow antibiotics if culture finalizes susceptible."
  },
  "links": {
    "supports": [
      { "kind": "event", "ref": "evt_culture_result_s_pneumo", "role": "primary" },
      { "kind": "event", "ref": "evt_problem_pneumonia", "role": "context" }
    ]
  }
}
```

### Attestation

```jsonc
{
  "id": "evt_20260419T110000_attestation",
  "type": "communication",
  "subtype": "attestation",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T11:00:00-05:00",
  "recorded_at": "2026-04-19T11:00:30-05:00",
  "author": { "id": "md_attending_01", "role": "attending" },
  "source": { "kind": "clinician_chart_action", "ref": "cosign" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "note_ref": "note_20260419T110000_attestation",
    "attests_to": "note_20260419T093000_progress",
    "attestation_basis": "Present for morning exam. Agree with worsening hypoxemia assessment and ID consult plan; add NIV escalation contingency if SpO2 <88% sustained."
  },
  "links": {
    "supports": [{ "kind": "note", "ref": "note_20260419T093000_progress", "role": "primary" }],
    "resolves": ["loop_attestation_pending_evt_20260419T093000_progress_note"]
  }
}
```

### Link conventions

- `supports`: note/communication events cite evidence and companion structured claims. Structured `EvidenceRef` objects are preferred on the event; frontmatter `references[]` remains string ids until note schema evolves.
- `supersedes`: new note/communication replaces a prior note version.
- `corrects`: narrower; prior note was wrong or entered in error.
- `resolves`: attestation or documentation notes may resolve open-loop-kind targets if the owner accepts that convention.
- `fulfills`: never on `communication` notes. Actions fulfill intents.
- `addresses`: do not use provider notes as executable problem-addressing edges. Use `data.focus_problem_refs[]` for narrative focus; `intent`/`action` events address problems.
- `contradicts`: later note or structured claim may explicitly disagree with prior note/assessment while preserving both.

### Evidence addressability

- Current: event ids, note ids, artifact ids, `vitals://` windows, and structured `EvidenceRef` in event `links.supports`.
- Current limitation: note frontmatter `references[]` is string-only.
- Proposed/open: section/statement addressability via `EvidenceRef.kind: "note"` with `selection.section`, `selection.heading`, `selection.quote_hash`, or similar. No A6-specific URI scheme is proposed unless the owner chooses URI serialization.

### Storage placement

- Note bodies: `timeline/YYYY-MM-DD/notes/HHMM_<slug>.md`.
- Matching communication events and companion structured events: `events.ndjson`.
- External/scanned/dictated native documents: `artifact_ref` in `events.ndjson` plus file under `artifacts/`; normalized note only if text is consumed as chart narrative.

### Frequency class

Per-encounter, periodic, event-driven, per-consult, per-procedure, per-primary-note for attestations.

### View consumers

`narrative()` primary; `timeline()`, `evidenceChain()`, `openLoops()`, `currentState()`, and `trend()` indirectly through cited evidence.

### Schema confidence

High for the paired note + communication model; high for no new event type/source kind; medium-high for split subtypes; medium for `communication.attestation`; medium for note-section addressability; low-medium for consult/documentation closure action shape until A9a and owner review settle consult-order semantics.

### Schema impact

- `new subtype`: `admission_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`; formalize existing `progress_note`.
- `new payload shape`: `note_family`, `window`, `focus_problem_refs`, `plan_change_refs`, `procedure_ref`, `consult_request_ref`, `trigger_ref`, `attests_to`, `attestation_basis`, import/decomposition flags.
- `new validator/openLoop rules`: V-NOTE-* and OL-NOTE/OL-CONSULT kinds.
- `none`: no new event type, storage primitive, source kind, link kind, view primitive, or currentState axis.
- `open-schema`: note subtype split, section/statement addressability, attestation shape, consult/documentation closure, reasoning/plan decomposition, session coupling, legacy/generated-note handling.

## 15. Validator and fixture implications

### Validator rules

- **V-NOTE-01 — Note/communication bidirectional integrity.** Every note file must have matching `communication` event with `data.note_ref == note.id`; every `communication` event with provider-note subtype must resolve to a note file with matching frontmatter. Severity: error.
- **V-NOTE-02 — Communication timing shape.** Provider-note `communication` events use `effective_at`, not `effective_period`, under current ADR 005. Clinical coverage windows live in `data.window`. Severity: error unless ADR 005 allow-list changes.
- **V-NOTE-03 — Reference integrity.** Frontmatter `references[]`, event `links.*`, and `transform.input_refs` must resolve under existing same-patient evidence semantics. Severity: error for local ids; warning for unresolved external refs with explicit `kind:"external"`.
- **V-NOTE-04 — Progress-note evidence-in-window.** `communication.progress_note` must cite or co-author in-window evidence or assessment/intent changes. Severity: error in replay; live openLoop/warn.
- **V-NOTE-05 — Admission-note problem and plan obligations.** `communication.admission_note` must cite or co-author at least one active `assessment.problem` and one initial plan/order/monitoring intent unless marked imported narrative-only. Severity: error in authored fixtures.
- **V-NOTE-06 — Procedure-note action link.** `communication.procedure_note.data.procedure_ref` must point to `action.procedure_performed`; verification artifacts/assessments should be cited when applicable. Severity: error for missing action.
- **V-NOTE-07 — Consult-note referral and action closure.** `communication.consult_note.data.consult_request_ref` must point to `intent.referral`; an action must fulfill the referral and cite/support the note or note event. Communication cannot carry `fulfills`. Severity: replay error; live OL-CONSULT-01.
- **V-NOTE-08 — Attestation target and substance.** `communication.attestation.data.attests_to` must resolve to a primary note id, and `attestation_basis` must be non-empty and not boilerplate-only. Severity: error for missing target; warning/openLoop for boilerplate.
- **V-NOTE-09 — Teaching-context attestation closure.** Resident/fellow/APP notes requiring cosign must receive `communication.attestation` within local policy. Severity: live OL-NOTE-01; strict replay error.
- **V-NOTE-10 — No note fulfillment.** Reject or warn on `links.fulfills` from any `communication` event. Notes support or resolve; actions fulfill.
- **V-NOTE-11 — Generated/imported note provenance.** Agent-generated notes require `source.kind: agent_synthesis` plus coherent `transform`; imported narrative-only notes require import provenance/decomposition-pending flag and relaxed decomposition validators. Severity: warn/error per profile.
- **V-NOTE-12 — Narrative-vs-structured coherence.** Note text that states a plan/order/medication/device/result-review change without companion structured event should warn and may create `openLoops(kind:"plan_order_divergence")` or subtype-specific drift loop. Severity: warning by default.

### Minimal fixture

1. **Admission H&P happy path.** Attending-authored `communication.admission_note`; co-authored pneumonia/hypoxemic respiratory failure problem events, initial care plan, antibiotic/oxygen/monitoring intents, and constraint references.
2. **ICU progress note after deterioration.** `communication.progress_note` over an overnight window; cites A3 vitals window, A5 balance/LDA context if present, A4 MAR events, and co-authored `assessment.trend`.
3. **Resident progress note + attending attestation.** Tests `communication.attestation`, attestation basis, teaching-context loop closure, and note id resolution.
4. **Procedure note — CVC placement.** `communication.procedure_note` references `action.procedure_performed` with `data.procedure_family: lda_placement`, cites A2 CXR verification and A5 line-in-service segment.
5. **Consult note — ID.** `intent.referral`; `action.notification`/candidate consult-delivered action fulfills referral; `communication.consult_note` supports recommendations and downstream medication intent.
6. **Event note — acute decompensation.** `communication.event_note` cites triggering A3 vitals window, new impression, emergent CXR/ABG orders, updated monitoring/care plan.
7. **Addendum/correction.** Prior note copied wrong oxygen device or Foley status; later correction note uses `links.corrects` and cites A3/A5 evidence.
8. **Agent-generated draft summary.** `agent_synthesis` draft with `transform.input_refs`; not accepted as final provider note until clinician signs/attests.
9. **Legacy narrative-only import.** Imported outside-hospital progress note with decomposition pending; visible in `narrative()` but not in `currentState(axis:"problems")` until reviewed/extracted.

## 16. Open schema questions

1. **Q1 — Note primitive boundary.** Should pi-chart keep Markdown note + matching `communication` event as the note primitive, or introduce a first-class `type: note` clinical event? Lean: keep the paired model; add provider-note wrapper APIs if useful. See `OPEN-SCHEMA-QUESTIONS.md#a6-note-primitive-boundary`.
2. **Q2 — Note subtypes: split vs generic.** Should A6 register split `communication` subtypes (`admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`) or a generic `provider_note` with `data.note_kind`? Lean: split by validator obligation. See `OPEN-SCHEMA-QUESTIONS.md#a6-note-subtypes`.
3. **Q3 — Section/statement addressability.** How should a later claim cite a specific A/P subsection, consult recommendation, or attestation clause? Lean: `EvidenceRef.kind:"note"` with lightweight `selection` anchors; no event explosion. See `OPEN-SCHEMA-QUESTIONS.md#a6-section-and-statement-addressability`.
4. **Q4 — Attestation primitive.** Should attestation be `communication.attestation`, `action.attestation`, or envelope-level `cosigners[]`? Lean: `communication.attestation` with substantive basis; no primary-note mutation. See `OPEN-SCHEMA-QUESTIONS.md#a6-attestation-primitive`.
5. **Q5 — Consult/documentation closure.** How do consult completion, H&P due, discharge-summary due, procedure-note due, and attestation loops close without allowing `communication → intent fulfills`? Lean: derived documentation loops plus action-based closure for consult/procedure; notes may resolve documentation loops where owner accepts. See `OPEN-SCHEMA-QUESTIONS.md#a6-consult-and-documentation-closure`.
6. **Q6 — Reasoning/plan coupling.** How strict should validators be that note reasoning and plan decompose into companion `assessment.*` and `intent.*` events? Lean: subtype-dependent; strict for admission/progress/procedure/consult obligations, relaxed for acute event notes and narrative-only imports. See `OPEN-SCHEMA-QUESTIONS.md#a6-reasoning-plan-coupling`.
7. **Q7 — Session coupling.** Use implicit author+window grouping, explicit `data.session_id`, or bidirectional links? Lean: implicit grouping plus note-to-event references; no new session id yet. See `OPEN-SCHEMA-QUESTIONS.md#a6-session-coupling`.
8. **Q8 — Legacy import and generated-note provenance.** How should imported monolithic notes and AI/dictation-derived notes enter without fabricating structured truth? Lean: narrative-only import with decomposition-pending flag for Phase A; generated live notes draft until clinician attestation. See `OPEN-SCHEMA-QUESTIONS.md#a6-legacy-import-and-generated-provenance`.

Accepted direction, pending ADR wording: no new A6 `source.kind`; no `links.fulfills` on communications; no communication `effective_period` under current ADR 005; no new A6 URI scheme unless note-selection serialization is owner-approved.

## 17. Sources

- CMS eCFR **42 CFR § 482.24 — Medical record services**, especially (b), (c), (c)(1), and (c)(4)(i), (iii), (vi), (vii), (viii).
- CMS eCFR **42 CFR § 415.172 — Physician fee schedule payment for services of teaching physicians**.
- HL7 FHIR R5 **Composition**, **DocumentReference**, **ClinicalImpression**, and **Communication** resources as interoperability witnesses.
- pi-chart repo substrate: `CLAIM-TYPES.md` communication conventions, existing `progress_note` subtype, event-envelope link semantics, EvidenceRef shape, interval allow-list, source-kind taxonomy; `schemas/note.schema.json`; `src/write.ts`; `src/views/narrative.ts`; `src/views/evidenceChain.ts`; `DESIGN.md`; ADR 003, ADR 005, ADR 006, ADR 009, ADR 010, ADR 011, ADR 016.
- Phase A inputs: `PHASE-A-CHARTER.md`, `PHASE-A-TEMPLATE.md`, `PHASE-A-EXECUTION.md`, `OPEN-SCHEMA-QUESTIONS.md`, A3/A4/A4b/A5 synthesis artifacts, `PHASE-A-FIXTURE-SCAFFOLD.md`, prior A6 synthesis, and Claude A6 draft/open-schema entries.
