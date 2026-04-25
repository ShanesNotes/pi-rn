# A7. Nursing notes — council synthesis

*Council synthesis note.* A7 inherits the A6 council boundary: notes are Markdown bodies paired with `communication` events, not a new event family. Claude's draft wins on the shared-subtype posture, nursing-scope validator layer, `focused_note` pressure, handoff evidence obligations, protocol-standing-order narrative obligations, and preceptor attestation. The prior A7 synthesis contributes two corrections that are preserved here: communication notes remain point-shaped (`effective_at` plus `data.window`, not `effective_period`), and provider notification is an `action.notification` chain, not a prose-only note sentence. This synthesis also keeps the A7/A8 boundary explicit: A8 owns structured head-to-toe findings; A7 narrates, synthesizes, cites, and transfers accountability.

## 1. Clinical purpose

Nursing notes are the bedside nurse's dated, authenticated narrative record of patient trajectory, nursing judgment, interventions, response to care, provider/family communication, and handoff priorities over a shift, focused concern, or clinically significant event. Their clinical purpose is continuity of bedside surveillance: an oncoming nurse, covering provider, charge nurse, or agent should be able to answer what changed, what was done, whether the patient responded, who knows, and what remains open. They are not canonical storage for vital-sign values, MAR truth, I&O totals, LDA state, or head-to-toe findings; those facts live in the structured artifact streams and the note cites them.

## 2. Agent-native transposition

A nursing note is not a documentation tab and not the leftover gray space after structured charting. In pi-chart it is **the nursing-authored synthesis-communication act over the claim graph**: a point-in-time `communication` event paired with a Markdown note body, supported by structured observations, assessments, actions, and intents for every care-changing claim.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Shift-change SBAR / handoff report | Existing `communication.sbar` or `communication.handoff` with nursing author role, `data.window`, handoff recipient, evidence obligations, and paired Markdown body | `narrative()`, `openLoops(kind:"handoff_pending")`, `evidenceChain()` |
| Shift-progress nursing narrative | Existing `communication.progress_note` with nursing author role; cites A3 vitals, A4 MAR, A5 I&O/LDA, A8 findings, and in-window nursing interventions | `narrative()`, `timeline()`, `evidenceChain()` |
| Nursing admission assessment narrative | A6 `communication.admission_note` with nursing author role; cites/co-authors A8 head-to-toe findings plus nursing-scope `intent.care_plan` / `intent.monitoring_plan` | `narrative()`, `currentState(axis:"intents")`, `evidenceChain()` |
| Focused nursing note — DAR / PIE / SOAPIE on pain, skin, ambulation, psychosocial, family concern, protocol invocation | Proposed `communication.focused_note`; `data.focus` names the concern; note cites trigger evidence, intervention actions, and response observations | `narrative()`, `evidenceChain()`, `openLoops()` |
| Nursing event note — fall, medication event, rapid response, restraint episode, transfer, acute desaturation | A6 `communication.event_note` with nursing author role; cites trigger event/window and companion observations/actions; provider notification is a separate `action.notification` | `timeline()`, `evidenceChain()`, `openLoops()` |
| Provider notification narrative: “Dr. X notified of worsening SpO₂; no new orders” | `communication.sbar` or `communication.phone_note` supports `action.notification`; notification action carries recipient, channel, urgency, callback/response, and loop closure | `timeline()`, `openLoops()`, `evidenceChain()` |
| Nursing care-plan revision narrative | `communication.progress_note` or `communication.focused_note` explains the rationale; canonical care-plan truth is co-authored `intent.care_plan` / `intent.monitoring_plan` with `supersedes` | `currentState(axis:"intents")`, `narrative()` |
| Patient/family phone call or bedside discussion | Existing `communication.phone_note` or `communication.progress_note`; patient statements that change care are structured as `observation.patient_report` where needed | `narrative()`, `timeline()` |
| Student nurse / orientee note under preceptor sign-off | Primary `communication.*` note by student/orientee plus `communication.attestation` by preceptor when institutional profile requires it | `narrative()`, `openLoops(kind:"attestation_pending")` |
| Protocol-driven RN intervention | Canonical action (`action.administration`, `action.intervention`, `action.titration`, etc.) with `source.kind: protocol_standing_order`; related `focused_note` or `progress_note` documents why criteria were met and response observed | `timeline()`, `evidenceChain()`, `openLoops(kind:"protocol_invocation_narrative_pending")` |
| Head-to-toe physical exam | **Not A7.** Structured exam findings live in A8 as `observation.exam_finding` / assessment structures; A7 cites and summarizes them | A8 scope |
| Rendered vitals/MAR/I&O/assessment tables copied into note | **Not canonical.** Rendered from A3/A4/A5/A8 views at read time | rendered only |
| Manager-mandated compliance checkboxes | **Excluded.** Only care-changing, accountable claims survive as structured events or note narrative | — |
| Patient teaching / education documentation | **Phase B.** May return as `communication.education_note` or education-specific primitive after Phase A | — |

> Nursing notes are canonical for **bedside narrative, handoff accountability, and communication context**. They are not canonical storage for discrete bedside facts.

**Load-bearing claims.**

**(a) A7 reuses the A6 paired-note substrate.** A nursing note is a Markdown note file plus a matching `communication` event carrying `data.note_ref`. A7 does not add `type: nursing_note`, `type: note`, or a new storage primitive. The substrate's note/communication bidirectional integrity remains the base validator.

**(b) Author role, not author-prefixed subtype, distinguishes nursing from provider notes.** A7 reuses shared `communication` subtypes: `admission_note`, `progress_note`, `event_note`, `sbar`, `handoff`, `phone_note`, and `attestation`. Nursing-specific obligations attach when `author.role` is a nursing role. This avoids duplicate subtype families such as `nursing_progress_note` while preserving role-aware validators.

**(c) One new subtype is strongly justified: `communication.focused_note`.** Focused nursing charting has a distinct concern-centered shape: focus → evidence/data → intervention → response/evaluation. It is not merely a shorter progress note and has no clean provider-note analog. The council lean is to add `focused_note` rather than hide this shape behind `progress_note` with `data.focused: true`.

**(d) `communication` timing remains point-shaped.** Notes cover clinical windows, but the communication act is authored at a point. Under current ADR 005 discipline, A7 uses `effective_at` for the note event and `data.window` for the shift/focus/event window. A7 does **not** add `communication.*` to the interval allow-list.

**(e) Nursing notes do not own bedside facts.** If the note says SpO₂ fell, A3 owns the vital evidence. If it says ceftriaxone was administered, A4 owns medication truth. If it says Foley was removed or a CVC dressing was changed, A5 owns LDA lifecycle/care. If it says crackles or pressure injury were found, A8 owns structured finding truth. The note cites these facts and explains nursing reasoning, communication, and handoff implications.

**(f) Handoff notes have evidence obligations.** An SBAR/handoff note is not SBAR merely because it has headings. It must cite an active problem, an active plan/monitoring intent, and recent observation evidence in the handoff window. The required shape can be flat `links.supports` with EvidenceRef roles; optional `data.sbar_sections[]` may help agents render the SBAR legs but should not be required until the owner resolves that open question.

**(g) Provider notification is an action chain.** “MD notified,” “no new orders,” “provider to bedside,” and “callback pending” are not prose-only facts. The note supports an `action.notification` event. The action may `fulfills` a communication-required intent or `resolves` an escalation loop when that is the narrow loop being closed; the note itself does not carry `fulfills`.

**(h) Nursing scope is a validator posture, not a separate primitive.** RNs can author nursing-scope assessments, monitoring plans, care plans, patient-response assessments, and protocol-driven actions. They do not normally author medical diagnostic impressions or prescriptive orders unless credential/profile/protocol context supports it. Because state law, institutional policy, and credentialing vary, A7 recommends soft warn-not-block validation for scope boundary pressure.

**(i) A7 and A8 must not collapse.** A8 is the structured head-to-toe and focused assessment surface. A7 is the narrative communication that synthesizes those findings, explains nursing judgment and response, and transfers accountability.

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR § 482.23(b)(3)–(4)** — an RN must supervise/evaluate nursing care, and nursing staff must develop and keep current a nursing care plan reflecting patient goals and nursing care needs. Anchors RN accountability, care-plan currency, and evaluation/response narrative.
2. **[regulatory] CMS 42 CFR § 482.24(b), § 482.24(c), and § 482.24(c)(1)** — hospital records must be accurate, promptly completed, accessible, and contain dated/timed/authenticated entries describing progress and response to medications/services. Anchors `recorded_at`, `effective_at`, author, authentication, and response-to-care documentation.
3. **[regulatory] State Nurse Practice Acts and institutional scope policies** — scope of practice, delegation, LPN/CNA documentation, student/preceptor sign-off, and standing-order/protocol authority are jurisdiction/profile-specific. `[phase-b-regulatory]` for exact state and institutional rules.
4. **[accreditation witness] Joint Commission 2026 National Performance Goals and Record of Care standards** — witness pressure for handoff communication, condition-change recognition/response, medication management, record integrity, and documentation completeness. Avoid hard-coding deprecated NPSG labels as the sole current authority.
5. **[professional] ANA Principles for Nursing Documentation and ANA Nursing: Scope and Standards of Practice (4th ed., 2021)** — professional witness for clear, accurate, accessible documentation, nursing-process communication/evaluation, delegation, and accountability.

`[phase-b-regulatory]` — restraint/seclusion intervals, fall/pressure-injury institutional policies, event/incident-report mandatory pathways, union-contract charting requirements, local handoff acknowledgement policy, local student/preceptor timing, and patient-facing OpenNotes phrasing are implementation-profile issues, not Phase A primitive shape.

## 4. Clinical function

Nursing notes are consumed at six concrete moments.

- **Shift-to-shift handoff.** The oncoming RN needs trajectory, current risks, active nursing plan, pending tasks, provider communications, and what to watch in the first hour.
- **Admission onboarding.** The care team needs baseline nursing context, immediate safety concerns, initial nursing plan, and A8 head-to-toe synthesis.
- **Condition change / rapid response.** Nurses, providers, charge RNs, and agents need proof that deterioration was recognized, escalated, communicated, and reassessed.
- **Protocol-driven intervention review.** A protocol-driven medication, titration, respiratory intervention, or safety intervention needs the nurse's reasoning for why criteria were met and how the patient responded.
- **Patient/family communication.** The chart needs a clear account of clinically material concerns, refusals, questions, and callbacks without turning every courtesy conversation into a primitive.
- **Quality/post-event review.** Falls, medication events, restraints, patient complaints, and transfers need the bedside account, but pi-chart must keep administrative incident-reporting systems out of the clinical-memory core.

Per-consumer specifics: the **oncoming RN** is the dominant reader; the **charge RN** uses notes for acuity/resource calibration; **providers/APPs** use them to verify bedside implementation and response; **RT/PT/OT/pharmacy** use them around scope intersections; **pi-agents** use `narrative()` and `evidenceChain()` for shift-context loading and safe note drafting.

## 5. Who documents

Primary: **bedside RN** for admission notes, progress notes, focused notes, SBAR/handoff notes, event notes, provider-notification narratives, and family/patient communication notes.

Secondary:

- **Charge RN / nursing supervisor** — unit-level handoff, serious event notes, staffing/acuity communication, transfer coordination.
- **LPN/LVN** — direct-care narrative within local scope and policy; RN co-review may be required. `[phase-b-regulatory]`.
- **CNA / nursing assistant** — usually structured observations rather than narrative; where local policy permits narrative, it should be observation/focused-care only.
- **Student RN / orientee** — may author under supervision; `communication.attestation` by preceptor closes policy-required sign-off loops.
- **Nursing preceptor** — authors attestations and may co-sign or correct student/orientee notes.
- **pi-agent** — may draft progress/focused/SBAR text from structured evidence; requires RN confirmation for final nursing authorship, and should not independently final-author admission, event, or attestation notes.
- **Importer** — legacy or synthetic notes may be imported, but Phase A fixtures should prefer `manual_scenario`; MIMIC-style narrative imports belong under A6/A7 legacy-import questions.

Owner of record: the authoring nurse named in the event envelope. For student/preceptor pairs, the primary note remains authored by the student/orientee and the preceptor's accountability is explicit in the attestation event.

Source-kind discipline: use the existing closed taxonomy. `nurse_charted` is the primary nursing source; `clinician_chart_action` remains role-agnostic where the repo expects it; `protocol_standing_order` marks protocol-driven actions; `agent_synthesis` marks agent-drafted narrative; `patient_statement` marks patient self-report evidence; `manual_scenario`, `synthea_import`, and `mimic_iv_import` cover fixture/import provenance. **No new A7 `source.kind` values.**

## 6. When / how often

Frequency class: **per-encounter + per-shift + event-driven + focused-concern-driven**, subtype-dependent.

- **Admission note:** one-shot per encounter/admission, usually during the admitting shift.
- **Progress note:** often per shift in ICU, per condition-change or institutional cadence elsewhere.
- **SBAR/handoff:** per accountability transfer; ICU commonly twice daily shift change plus additional transfer handoffs.
- **Focused note:** triggered by a concern or intervention requiring concern → action → response documentation.
- **Event note:** triggered by fall, rapid response, medication event, restraint episode, transfer, significant deterioration, patient complaint, or other safety-relevant bedside event.
- **Phone note/provider notification:** triggered by clinically material call/callback/notification, not every social update.
- **Attestation:** only when institutional profile requires preceptor/student/orientee sign-off.

Regulatory minimum: authenticated, dated/timed medical-record entries and current nursing care plan; no universal federal “one nursing note per shift” rule. Clinical practice norm: ICU admission note + per-shift progress/SBAR/handoff + focused/event notes as triggered. Divergence: local hospital policies drive much more note volume than the federal floor.

A re-read of unchanged patient status by the same RN does not produce a canonical note. A rendered shift-summary composite is `narrative()`, not a stored nursing note.

## 7. Candidate data elements

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| `type: communication` | [clinical] | ✓ | enum | Notes become a new primitive and violate A6 substrate | events.ndjson | high |
| `subtype` | [clinical] | ✓ | enum: `sbar`, `handoff`, `progress_note`, `admission_note`, `event_note`, `phone_note`, `focused_note`, `attestation` | Subtype-specific validators and views cannot dispatch | nurse_charted / agent_synthesis | high |
| `data.note_ref` | [clinical][regulatory] | ✓ | note id | Cannot bind communication envelope to Markdown note body | note schema | high |
| Markdown frontmatter `id` matching `data.note_ref` | [clinical][regulatory] | ✓ | string | Bidirectional integrity fails; orphan note/body possible | note schema | high |
| `effective_at` | [clinical][regulatory] | ✓ | timestamp | Cannot know when the communication/note act occurred | chart entry | high |
| `recorded_at` | [regulatory] | ✓ | timestamp | Cannot audit delayed charting/authentication | chart entry | high |
| `data.window.start/end` | [clinical] | ✓ for progress/SBAR/focused/event | timestamp interval object | Cannot know clinical window summarized without misusing `effective_period` | note payload | high |
| `author.id` + `author.role` | [regulatory][clinical] | ✓ | object | Scope, accountability, attestation, and role-conditioned validators fail | chart entry | high |
| `source.kind` | [clinical] | ✓ | existing enum | Provenance and agent-vs-RN distinction fail | source taxonomy | high |
| `status` | [regulatory] | ✓ | draft/final/entered_in_error/corrected | Cannot distinguish draft from final documentation | chart entry | high |
| `data.summary` | [clinical] | ✓ | short text | Timeline/narrative previews degrade; not the full note body | note payload | medium |
| `data.focus` | [clinical] | ✓ for `focused_note` | object: concern_kind, trigger ref | Focused note loses its concern-centered semantics | nurse note | high |
| `data.interventions_performed[]` | [clinical] | ✓ for action-bearing `focused_note` | event refs | Cannot verify action leg of DAR/PIE/SOAPIE | action refs | high |
| `data.response_observations[]` | [clinical] | ✓ when response is expected | event/window refs | Cannot close response/reassessment obligation | A3/A4/A8 events | high |
| `data.handoff_to` / `data.receiver` | [clinical] | ✓ for handoff | author/user ref | Cannot track acknowledgement/open handoff loop | chart identity | medium |
| `data.provider_notification_ref` | [clinical] | ✓ when notification occurred | event ref to `action.notification` | “Provider notified” remains uncheckable prose | notification action | high |
| `data.protocol_invocations[]` | [clinical] | ✓ when protocol action cited | action refs | Cannot ensure protocol-driven action has narrative rationale | A4/A5/A9 actions | high |
| `data.problem_refs[]` | [clinical] | ✓ when note situates active problems | event refs | Narrative cannot be tied to active problem context without overusing `links.addresses` | A0c / assessments | medium |
| `links.supports[]` with EvidenceRef roles | [clinical] | ✓ | refs to events/windows/artifacts/notes | Note cannot prove its claims or SBAR legs | all artifacts | high |
| `links.corrects` / `links.supersedes` | [clinical][regulatory] | ✓ when applicable | event refs | Correction/supersession lineage fails | events | high |
| `links.contradicts` | [clinical] | ✓ when explicit disagreement | event refs | Nursing-provider or nurse-nurse divergence becomes invisible | events | medium |
| `links.fulfills` on notes | [cruft/unsafe] | ✗ | link | Violates ADR 003; notes should support fulfilling actions | — | high |
| `links.addresses` on notes | [open/avoid] | ✗ by default | link | Risks treating narrative as executable care plan; use `data.problem_refs` and structured intents/actions | — | medium |
| `data.sbar_sections[]` | [clinical][open-schema] | optional | section objects with refs | Could improve agent rendering, but mandatory structure may overfit SBAR form | note payload | medium-low |
| `data.preceptor_attestation_required` | [regulatory][phase-b] | profile-gated | boolean/policy ref | Local preceptor sign-off loops cannot be configured | institutional profile | medium |
| Copied vitals/MAR/I&O tables in note body | [rendered] | ✗ canonical | generated markdown | Duplicates truth and causes stale note tables | rendered views | high |
| Billing/time/compliance boilerplate | [cruft] | ✗ | text | Not clinical memory; obscures signal | — | high |
| Patient education details | [phase-b] | ✗ for A7 | future communication/education shape | Education workflow not researched in Phase A | future artifact | medium |

## 8. Excluded cruft — with rationale

- **Copied flowsheet/MAR/I&O tables.** They are rendered from A3/A4/A5/A8. Storing copies creates stale, contradictory note content.
- **“Charted for legal protection” boilerplate.** The clinical account matters; defensive phrases do not become primitives.
- **Manager/audit checkboxes.** “Skin assessed: yes,” “education provided: yes,” and “rounding completed” are not clinical memory unless they correspond to structured observations/actions/intents.
- **Incident report body.** A clinical event note belongs in the chart; risk-management incident reports are administrative systems and should not be pulled into the clinical substrate.
- **Billing/time blocks.** Nursing time accounting can matter operationally, but Phase A clinical memory does not model it.
- **Patient-education workflows.** Education, teach-back, discharge instructions, and patient-facing comprehension are important but excluded from Batch 2 and should return in Phase B or a dedicated artifact.
- **Copy-forward “no changes” paragraphs.** If the structured state changed, copy-forward prose is stale. If nothing changed, a rendered shift summary can show continuity without another canonical note.

## 9. Canonical / derived / rendered

| Layer | A7 content |
|---|---|
| **Canonical** | `communication` event envelope; paired Markdown note body; `data.note_ref`; `effective_at`; `recorded_at`; `author`; `source`; `status`; `data.window`; subtype-specific payload (`focus`, `handoff_to`, `provider_notification_ref`, `protocol_invocations`, `response_observations`); `links.supports` evidence refs; corrections/supersession/contradiction links; companion `action.notification`, `intent.care_plan`, `intent.monitoring_plan`, structured `observation` / `assessment` events. |
| **Derived** | shift narrative digest; handoff-pending loop; admission-note-pending loop; provider-notification-chain completeness; protocol-invocation-narrative pending loop; preceptor-attestation pending loop; nursing-provider plan divergence; stale copied-table detection; narrative-to-structured coupling warnings. |
| **Rendered** | SBAR headings; note timeline cards; shift summary panels; auto-inserted vitals/labs/I&O/MAR snippets; handoff badges; “MD notified” banners; note search/highlights; patient-portal formatting. |

Canonical nursing notes are immutable accounts of what was authored at a time. The current clinical state is read from structured events and views; note rendering may display later corrections or contradictions but does not rewrite old note prose.

## 10. Provenance and lifecycle

### Creation

A nursing note is created by writing a `communication` event and a matching Markdown file. The event envelope records author, role, source, `effective_at`, `recorded_at`, status, and `data.note_ref`. The Markdown frontmatter carries the same note id and enough metadata for `narrative()` to read it.

### Clinical window

The note's clinical coverage window lives in `data.window`:

```jsonc
"effective_at": "2026-04-19T07:05:00-05:00",
"data": {
  "window": {
    "start": "2026-04-18T19:00:00-05:00",
    "end": "2026-04-19T07:00:00-05:00"
  }
}
```

Do not use `effective_period` for nursing-note communications unless ADR 005 is explicitly amended.

### Links and closure

- **Supports:** notes cite the structured evidence they synthesize.
- **Corrects/supersedes:** used for documentation corrections and replacement notes.
- **Contradicts:** used when a nursing note explicitly disagrees with a prior note/assessment.
- **Fulfills:** not used on notes. `action.notification`, `action.intervention`, or another action may fulfill an intent.
- **Addresses:** not recommended for notes by default. A note may include `data.problem_refs[]` for context; structured care plans/actions carry executable problem-addressing edges.
- **Resolves:** rare on notes; more commonly an acknowledgement action or follow-up progress note resolves a handoff/open-loop condition.

### Staleness and open loops

The note itself does not stale, but obligations around note kinds can become stale:

- missing handoff/SBAR around accountability transfer;
- handoff authored but no acknowledgement/follow-up by receiving RN within local window;
- admission encounter without nursing admission note/A8 citation by end of admission shift;
- protocol-driven action without focused/progress note within policy window;
- provider notification prose without `action.notification`;
- student/orientee note without required preceptor attestation.

### Contradictions and reconciliation

- **Nursing note vs structured facts:** if prose says “ceftriaxone not given” but A4 has a final administration action, surface a contradiction. Structured event state remains canonical for downstream MAR queries.
- **RN assessment vs provider assessment:** “worsening respiratory status” and “stable” may coexist as clinically meaningful disagreement. Preserve both and expose via `evidenceChain()` / `contradicts` where explicit.
- **Nursing scope pressure:** RN-authored `assessment.impression` or unprofiled `intent.order` should warn, not silently normalize or hard-block without profile.
- **Corrected actions:** if a note cites an action later corrected, render the correction lineage; do not rewrite the note body.

Chart-as-claims, not chart-as-truth.

## 11. Missingness / staleness

Clinically meaningful missingness:

- No nursing admission note after admission-shift window.
- Nursing admission note with no A8 head-to-toe/focused assessment citation.
- No handoff/SBAR note at a shift/accountability boundary where institutional profile requires one.
- Handoff exists but no receiver acknowledgement or receiving-shift follow-up note within local policy window.
- Focused/progress note lacks the trigger/action/response evidence it claims to summarize.
- Protocol-driven action lacks narrative rationale within policy window.
- “Provider notified” appears in narrative but no `action.notification` exists.
- Provider notification action exists but has no response/callback status when response is clinically expected.
- Student/orientee note lacks required `communication.attestation`.
- Imported narrative note has no structured children; allowed as bounded import, but should trigger Phase B extraction/decomposition work rather than corrupt Phase A primitive shape.

Patient_001 limitation: the seed fixture has one SBAR-style nursing note and a respiratory-decompensation trend, but it does not yet cover nursing admission, handoff acknowledgement, focused note, protocol invocation, fall/event note, or preceptor attestation. It should not be used as proof that A7 breadth is complete.

## 12. Agent read-before-write context

Before drafting or validating an A7 note, an agent should read:

- `narrative({ from, to, author_role_filter: "provider" })` for plan-of-day and provider context;
- `currentState({ axis:"problems", asOf })` for active problems;
- `currentState({ axis:"intents", asOf, filter:"care_plan|monitoring_plan|order" })` for active nursing plan, monitoring cadence, and relevant orders;
- `currentState({ axis:"constraints", asOf })` / `readActiveConstraints()` for allergies, code status, goals-of-care, refusals, isolation, and other active constraints;
- `openLoops({ asOf })` filtered to nursing-relevant loops: monitoring cadence, provider callback pending, handoff pending, protocol-invocation narrative pending, attestation pending, LDA care due, medication response due;
- `timeline({ types:["observation","action","assessment","intent"], from: data.window.start, to: data.window.end })` for in-window evidence;
- A3 vital windows via `vitals://`, A5 I&O/LDA windows via `io://`/event ids, A4 medication actions via event ids or `meddose://`, and A8 exam findings;
- `evidenceChain({ eventId })` for any structured assessment/action/intent the note cites;
- protocol references when a `source.kind: protocol_standing_order` action is cited;
- prior nursing notes and handoff notes for continuity and contradictions.

Agent-authored notes must cite structured `EvidenceRef` objects with roles in `links.supports`. An agent that produces SBAR prose without active problem, active plan, and recent observation evidence has written SBAR-shaped prose, not an A7 note.

## 13. Related artifacts

- **A0a** — baseline, encounter context, home routine, location/transfer context; admission note engages these.
- **A0b** — active constraints; nursing notes frequently engage allergies, code status, isolation, refusal, restraints if modeled.
- **A0c** — active problems; A7 cites problem context and may co-author nursing-scope problem/trend assessments where allowed.
- **A1/A2** — labs and diagnostic results cited in progress/focused/event notes.
- **A3** — vitals windows are primary evidence for deterioration, response, monitoring cadence, and handoff.
- **A4** — MAR actions and response obligations cited in focused notes around pain, sedation, antibiotics, titrations, and adverse effects.
- **A4b** — medication-reconciliation uncertainty or discharge medication communication may appear in nursing notes but does not own medication-transition truth.
- **A5** — I&O, LDA state, fluid balance, catheter/drain care, and LDA complications are cited; A5 owns device/volume truth.
- **A6** — provider-note parallel. A7 reuses A6 subtypes and note-pair substrate; A6 and A7 notes cite each other for plan/bedside context.
- **A8** — structured head-to-toe/focused assessment. A7 admission/progress/focused notes cite A8; A8 owns findings.
- **A9a** — active orders and nursing-scope order/protocol boundaries; provider notification may result in provider-authored `intent.order`.
- **A9b** — orderset/protocol invocation and standing-order shape; A7 narrates nursing reasoning for protocol-driven actions.

## 14. Proposed pi-chart slot shape

### Event type + subtype

Existing event type, mostly existing/shared subtypes, one new subtype:

- `communication.sbar` — existing; handoff/provider escalation shape.
- `communication.handoff` — existing; accountability transfer.
- `communication.progress_note` — existing/A6; nursing role adds evidence-in-window obligations.
- `communication.admission_note` — A6; nursing role requires A8 citation and initial nursing plan context.
- `communication.event_note` — A6; event trigger + action/notification chain.
- `communication.phone_note` — existing; clinically material phone/callback/family communication.
- `communication.attestation` — A6; reused for preceptor sign-off.
- `communication.focused_note` — **new A7 candidate**; concern-centered DAR/PIE/SOAPIE shape.

No new event type. No new storage primitive. No nursing-prefixed subtype family. No new source kind. No new link kind. No new URI scheme. No new view axis.

### Payload examples

#### Shift-change SBAR handoff

```jsonc
// events.ndjson
{
  "id": "evt_20260419T0705_sbar_handoff",
  "type": "communication",
  "subtype": "sbar",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T07:05:00-05:00",
  "recorded_at": "2026-04-19T07:07:00-05:00",
  "author": { "id": "rn_night_02", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "observed",
  "status": "final",
  "data": {
    "note_ref": "note_20260419T0705_sbar_handoff",
    "window": {
      "start": "2026-04-18T19:00:00-05:00",
      "end": "2026-04-19T07:00:00-05:00"
    },
    "handoff_to": "rn_day_04",
    "summary": "Night-shift SBAR: worsening oxygen requirement, low UOP trend, provider notified at 04:35; oncoming RN to recheck work of breathing and urine output by 08:00.",
    "problem_refs": ["evt_20260418T1425_problem_pneumonia", "evt_20260418T1430_problem_hypoxemia"],
    "plan_refs": ["evt_20260418T1500_care_plan_resp", "evt_20260418T1510_monitor_plan_uop"],
    "provider_notification_ref": "evt_20260419T0435_notify_provider"
  },
  "links": {
    "supports": [
      { "ref": "evt_20260418T1425_problem_pneumonia", "kind": "event", "role": "context" },
      { "ref": "evt_20260418T1500_care_plan_resp", "kind": "event", "role": "primary" },
      { "ref": "vitals://patient_001/enc_001?metric=spo2&from=2026-04-19T03:00:00-05:00&to=2026-04-19T07:00:00-05:00", "kind": "vitals_window", "role": "primary" },
      { "ref": "io://patient_001/enc_001?metric=uop&from=2026-04-18T19:00:00-05:00&to=2026-04-19T07:00:00-05:00", "kind": "io_window", "role": "confirmatory" }
    ]
  }
}
```

```markdown
---
id: note_20260419T0705_sbar_handoff
event_id: evt_20260419T0705_sbar_handoff
title: Night shift SBAR handoff
author_role: rn
---
S: Patient with pneumonia/hypoxemia had increasing oxygen needs overnight...
B: Admitted yesterday for worsening respiratory status...
A: SpO₂ trend worsened after 03:00; UOP below target...
R: Day RN to reassess work of breathing and UOP by 08:00; provider callback pending if sustained SpO₂ <88%.
```

#### Focused note with protocol invocation

```jsonc
{
  "id": "evt_20260419T0330_focused_pain",
  "type": "communication",
  "subtype": "focused_note",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T03:30:00-05:00",
  "recorded_at": "2026-04-19T03:33:00-05:00",
  "author": { "id": "rn_night_02", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "status": "final",
  "data": {
    "note_ref": "note_20260419T0330_focused_pain",
    "window": {
      "start": "2026-04-19T02:00:00-05:00",
      "end": "2026-04-19T03:30:00-05:00"
    },
    "focus": {
      "concern_kind": "pain_management",
      "concern_event_ref": "evt_20260419T0200_pain_report"
    },
    "interventions_performed": ["evt_20260419T0210_morphine_prn"],
    "response_observations": ["evt_20260419T0245_pain_report_post", "evt_20260419T0300_rass"],
    "protocol_invocations": ["evt_20260419T0210_morphine_prn"],
    "summary": "PIE note: pain 7/10; PRN morphine given per pain protocol; pain 3/10 after reassessment, RASS 0."
  },
  "links": {
    "supports": [
      { "ref": "evt_20260419T0200_pain_report", "kind": "event", "role": "trigger" },
      { "ref": "evt_20260419T0210_morphine_prn", "kind": "event", "role": "primary" },
      { "ref": "evt_20260419T0245_pain_report_post", "kind": "event", "role": "confirmatory" }
    ]
  }
}
```

#### Provider notification action plus event note

```jsonc
// action.notification — canonical provider notification
{
  "id": "evt_20260419T0435_notify_provider",
  "type": "action",
  "subtype": "notification",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T04:35:00-05:00",
  "recorded_at": "2026-04-19T04:38:00-05:00",
  "author": { "id": "rn_night_02", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "status": "final",
  "data": {
    "action": "provider_notification",
    "recipient": { "id": "md_resident_03", "role": "md" },
    "channel": "phone",
    "urgency": "urgent",
    "reason": "SpO2 sustained 86-88% despite repositioning and increased O2 per protocol",
    "response": "provider_to_bedside",
    "callback_due_at": null
  },
  "links": {
    "supports": [
      { "ref": "vitals://patient_001/enc_001?metric=spo2&from=2026-04-19T04:00:00-05:00&to=2026-04-19T04:35:00-05:00", "kind": "vitals_window", "role": "primary" },
      { "ref": "evt_20260419T0425_assessment_worsening_resp", "kind": "event", "role": "primary" }
    ],
    "resolves": ["loop_20260419T0425_provider_escalation_needed"]
  }
}

// communication.event_note — narrative context, supports the action; it does not fulfill
{
  "id": "evt_20260419T0450_event_desaturation_note",
  "type": "communication",
  "subtype": "event_note",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T04:50:00-05:00",
  "recorded_at": "2026-04-19T04:55:00-05:00",
  "author": { "id": "rn_night_02", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "status": "final",
  "data": {
    "note_ref": "note_20260419T0450_desaturation_event",
    "window": {
      "start": "2026-04-19T04:00:00-05:00",
      "end": "2026-04-19T04:50:00-05:00"
    },
    "trigger_ref": "evt_20260419T0425_assessment_worsening_resp",
    "provider_notification_ref": "evt_20260419T0435_notify_provider",
    "summary": "Desaturation event; protocol steps attempted; provider notified and came to bedside."
  },
  "links": {
    "supports": [
      { "ref": "evt_20260419T0435_notify_provider", "kind": "event", "role": "primary" }
    ]
  }
}
```

#### Preceptor attestation

```jsonc
{
  "id": "evt_20260419T1100_preceptor_attestation",
  "type": "communication",
  "subtype": "attestation",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-19T11:00:00-05:00",
  "recorded_at": "2026-04-19T11:03:00-05:00",
  "author": { "id": "rn_preceptor_01", "role": "preceptor" },
  "source": { "kind": "nurse_charted" },
  "status": "final",
  "data": {
    "note_ref": "note_20260419T1100_preceptor_attestation",
    "attests_to": "evt_20260419T0930_student_progress",
    "attestation_basis": "Reviewed student RN assessment and independently confirmed respiratory assessment and care-plan updates at bedside."
  },
  "links": {
    "supports": [
      { "ref": "evt_20260419T0930_student_progress", "kind": "event", "role": "primary" }
    ]
  }
}
```

### Link conventions

- `supports` — required evidence binding; handoff/SBAR has minimum evidence bundle.
- `corrects` / `supersedes` — standard documentation lineage.
- `contradicts` — explicit note/assessment disagreement.
- `fulfills` — not on nursing notes; fulfilling actions carry it.
- `addresses` — avoid for notes by default; care-changing `intent`/`action` events address problems. Notes may carry `data.problem_refs[]` for narrative context.
- `resolves` — usually on acknowledgement/notification/follow-up actions; rare on note events.

### Evidence addressability

- Event ids for structured observations/actions/assessments/intents/communications.
- Note ids for attestation, note-to-note correction, and narrative reference.
- Existing windowed URIs such as `vitals://`, `io://`, and `meddose://` where prior artifacts define them.
- No new A7 URI.

### Storage placement

- `events.ndjson` — communication events, notification actions, structured sibling events.
- `notes/HHMM_<slug>.md` — Markdown note bodies with matching frontmatter.
- `artifacts/` — wound photos, external documents, or native artifacts cited via `artifact_ref` when relevant.

### View consumers

`narrative()` is primary. `timeline()`, `evidenceChain()`, and `openLoops()` are required. `currentState()` is indirect through co-authored intents/assessments, not through the note itself.

### Schema confidence

- **High** — A6 paired note model, existing communication subtypes, note integrity, source-kind restraint, no note-source `fulfills`.
- **Medium-high** — `communication.focused_note` as one new subtype.
- **Medium** — role-conditioned nursing scope validators.
- **Medium-low** — optional `data.sbar_sections[]` and exact handoff acknowledgement mechanics.

### Schema impact

- **New subtype candidate:** `communication.focused_note`.
- **New payload conventions:** `data.window`, `data.focus`, `data.interventions_performed[]`, `data.response_observations[]`, `data.protocol_invocations[]`, `data.handoff_to`, `data.provider_notification_ref`, `data.problem_refs[]`; optional `data.sbar_sections[]`.
- **New validator/open-loop rules:** V-NNOTE-01 through V-NNOTE-09; OL-NNOTE-01 through OL-NNOTE-05.
- **None:** no new event types, storage primitives, source kinds, link kinds, URI schemes, or view axes.

## 15. Validator and fixture implications

### Validator rules

- **V-NNOTE-01 — Note/communication bidirectional integrity.** Inherited from A6: every nursing note body must have a matching `communication` event and every nursing `communication` note must have a matching Markdown body.
- **V-NNOTE-02 — Communication timing discipline.** `communication.*` nursing notes use `effective_at` plus `data.window`; use of `effective_period` on a note event warns/errors depending on replay strictness until ADR 005 is amended.
- **V-NNOTE-03 — Nursing scope soft warning.** `assessment.impression`, `assessment.differential`, or unprofiled `intent.order` authored by nursing roles emits a warning unless credential/profile/protocol context allows it.
- **V-NNOTE-04 — Nursing admission note requires A8 citation.** `communication.admission_note` by nursing role must support at least one A8-shape structured head-to-toe/focused assessment event or session in the same admission window.
- **V-NNOTE-05 — Focused note payload obligations.** `communication.focused_note` must have non-empty `data.focus` and at least one trigger/action/response evidence ref appropriate to the concern. Observation-only focused notes may omit interventions but must cite assessment/response observations.
- **V-NNOTE-06 — Handoff evidence obligation.** `communication.sbar` or `communication.handoff` must cite at least one active problem/context, one active care/monitoring plan or order context, and one recent observation window/event. Severity: replay error; live open loop until evidence/acknowledgement completes.
- **V-NNOTE-07 — Protocol-invocation narrative.** `action.*` with `source.kind: protocol_standing_order` should be cited by `communication.focused_note` or `communication.progress_note` within policy window N. Default N = 4h `[verify-with-nurse]`. Severity: warn/open loop.
- **V-NNOTE-08 — Provider-notification chain.** If a note narrative/payload indicates provider notification, a matching `action.notification` should exist in the window with recipient, channel, reason, and response/callback status. Severity: warn/open loop.
- **V-NNOTE-09 — Preceptor attestation when profile requires.** Student/orientee-authored nursing note requires `communication.attestation` by preceptor within local policy window. Severity profile-driven.

### Open-loop kinds

- **OL-NNOTE-01 — handoff_pending / handoff_unacknowledged.** Shift/accountability transfer lacks SBAR/handoff or receiver acknowledgement/follow-up.
- **OL-NNOTE-02 — nursing_admission_note_pending.** Admission lacks nursing admission note or A8 citation by end of admission shift.
- **OL-NNOTE-03 — protocol_invocation_narrative_pending.** Protocol-driven action lacks focused/progress narrative within N hours.
- **OL-NNOTE-04 — provider_notification_chain_incomplete.** Note says provider notified but action/response chain incomplete.
- **OL-NNOTE-05 — preceptor_attestation_pending.** Profile requires preceptor attestation and none exists by policy window.

### Minimal fixture

Seven scenarios cover normal, edge, and replay cases:

1. **Nursing admission happy path.** RN authors `communication.admission_note`, cites A8 head-to-toe session, co-authors `intent.care_plan` and `intent.monitoring_plan`.
2. **Shift-change SBAR happy path.** Night RN authors `communication.sbar` with problem, plan, vitals/I&O evidence, `handoff_to`, and provider-notification ref; day RN acknowledges/follows up.
3. **Focused pain-management note.** RN authors `communication.focused_note` with pain trigger, PRN/protocol action, and post-dose pain/RASS response.
4. **Condition-change event note.** Acute desaturation: RN authors `assessment.trend`, `action.notification`, and `communication.event_note` supporting the action.
5. **Protocol-driven titration without narrative.** RN titrates norepinephrine per protocol; no focused/progress note by N hours. Live mode emits OL-NNOTE-03; replay strictness warns/errors per profile.
6. **Fall without injury.** RN event note cites fall event, focused post-fall exam, provider notification, and updated fall-prevention care plan.
7. **Student-RN progress note with preceptor attestation.** Student note plus preceptor `communication.attestation` exercises profile-gated attestation logic.

## 16. Open schema questions

1. **Q1 — Subtype reuse vs nursing-specific split.** Should A7 reuse A6 subtypes with role-conditioned validators, or add nursing-prefixed subtype families / a `shift_note` subtype? Lean: reuse A6 subtypes; do not add `nursing_*`; do not add `shift_note` unless owner later wants a separate subtype for shift-progress narrative. See `OPEN-SCHEMA-QUESTIONS.md#a7-subtype-reuse-vs-split`.
2. **Q2 — `focused_note` subtype vs `progress_note` flag.** Should focused DAR/PIE/SOAPIE charting get `communication.focused_note`, or remain `progress_note` with `data.focused: true`? Lean: add `focused_note`. See `OPEN-SCHEMA-QUESTIONS.md#a7-focused-note-primitive`.
3. **Q3 — Nursing-scope validator posture.** How strict should RN/LPN/CNA/student scope enforcement be for `assessment.*`, `intent.*`, and protocol-driven actions? Lean: soft warn-not-block, with institutional profile able to raise severity. See `OPEN-SCHEMA-QUESTIONS.md#a7-scope-enforcement`.
4. **Q4 — Handoff evidence shape and acknowledgement.** Should SBAR/handoff use flat `links.supports`, structured `data.sbar_sections[]`, explicit acknowledgement actions, or receiving-shift note citation? Lean: flat evidence minimum; optional `data.sbar_sections[]`; acknowledgement mechanism profile/open. See `OPEN-SCHEMA-QUESTIONS.md#a7-handoff-evidence-shape`.
5. **Q5 — Provider-notification closure.** How should “provider notified,” “no new orders,” “provider to bedside,” and callback pending close loops without letting notes fulfill intents? Lean: `action.notification` carries closure; SBAR/phone/event note supports it. See `OPEN-SCHEMA-QUESTIONS.md#a7-provider-notification-closure`.
6. **Q6 — Preceptor attestation reuse.** Does A6 `communication.attestation` fully cover student/orientee nursing sign-off? Lean: reuse A6 attestation with profile-gated timing and role enums. See `OPEN-SCHEMA-QUESTIONS.md#a7-preceptor-attestation`.
7. **Q7 — A7/A8 assessment boundary.** Which bedside findings must decompose into A8 structured observations, and when is narrative-only acceptable? Lean: A8 owns structured findings; A7 cites/summarizes; imports may be narrative-only with extraction debt. See `OPEN-SCHEMA-QUESTIONS.md#a7-a8-assessment-boundary`.

Accepted direction, pending ADR wording: no new A7 event type; no new storage primitive; no new A7 source kinds; no `communication`-source `fulfills`; no `effective_period` on nursing-note communications under current ADR 005; no A7-specific URI; no A7-specific current-state axis.

## 17. Sources

- CMS eCFR **42 CFR § 482.23 — Nursing services**, especially § 482.23(b)(3)–(4) on RN supervision/evaluation and current nursing care plan.
- CMS eCFR **42 CFR § 482.24 — Medical record services**, especially § 482.24(b), § 482.24(c), and § 482.24(c)(1) on accurate/prompt/accessible records and dated/timed/authenticated entries describing progress and response.
- State Nurse Practice Acts and institutional policy profiles — scope, delegation, standing-order authority, LPN/CNA/student/preceptor documentation rules. `[phase-b-regulatory]`.
- Joint Commission **2026 National Performance Goals** and Record of Care standards — handoff, condition-change response, medication management, record integrity as accreditation witnesses.
- American Nurses Association **Principles for Nursing Documentation** and **Nursing: Scope and Standards of Practice** (4th ed., 2021) — documentation clarity/accountability and nursing-process communication/evaluation.
- HL7 FHIR R5 **Communication**, **Composition**, **DocumentReference**, **Observation**, and **ClinicalImpression** as interoperability witnesses only.
- pi-chart repo substrate: `DESIGN.md`, `CLAIM-TYPES.md`, `schemas/note.schema.json`, `src/write.ts`, `src/views/narrative.ts`, `src/views/evidenceChain.ts`, ADR 003, ADR 005, ADR 006, ADR 009, ADR 010, ADR 011, ADR 016.
- Phase A inputs: `PHASE-A-CHARTER.md`, `PHASE-A-TEMPLATE.md`, `PHASE-A-EXECUTION.md`, `OPEN-SCHEMA-QUESTIONS.md`, A3/A4/A4b/A5/A6 synthesis artifacts, Claude A7 outputs, prior A7 synthesis, and `PHASE-A-FIXTURE-SCAFFOLD.md`.
