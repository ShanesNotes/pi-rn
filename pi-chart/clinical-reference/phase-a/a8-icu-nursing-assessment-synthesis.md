# A8. ICU nursing assessment (head-to-toe)

*Council synthesis note.* This revision merges the prior A8 synthesis with the competing head-to-toe artifact. The prior synthesis remains the base on primitive discipline: A8 does **not** become a new `nursing_assessment` event type, does not duplicate A3 vitals, A5 LDA lifecycle, A6/A7 narrative, or A9 order semantics, and keeps `observation.exam_finding` as the canonical bedside-finding primitive. The competing artifact adds real value in five places and those are incorporated here: (1) session/completeness pressure, (2) three-valued `finding_state`, (3) an eight-system ICU coverage vocabulary, (4) finding-code/body-site/qualifier discipline, and (5) sharper PRN-trigger and coverage-gap validator rules. The stored session shell remains `[open-schema]`: useful enough to stage, but not accepted silently as a new primitive until the owner decides the cross-artifact session-identity ADR.

## 1. Clinical purpose

The ICU nursing head-to-toe assessment is the structured bedside evidence surface through which the nurse records what the patient looks, sounds, reports, tolerates, and cannot tolerate at a defined point in care. It preserves the nurse's direct human assessment of neurologic, respiratory, cardiovascular/perfusion, skin, functional, symptom, safety, and device-site status so that downstream clinicians and agents can detect deterioration, verify response to interventions, update care plans, escalate concerns, and hand off risk without relying on prose-only note extraction. A8 is not a smaller EHR flowsheet. Its clinical work is to make care-changing bedside findings individually citable, source-attributed, time-scoped, and distinguishable across three states: present, actively absent, and not assessed.

## 2. Agent-native transposition

A head-to-toe nursing assessment is not a checklist tab. In pi-chart it becomes **a session-bounded bedside finding stream**: mostly `observation.exam_finding`, `observation.patient_report`, and `observation.screening` events, optionally grouped by an A8 assessment-session identity, with nursing-scope `assessment.*` events only when the nurse is making an accountable judgment over those findings. The rendered head-to-toe grid is a projection. The canonical record is the finding, its state, its method, its body/system focus, its provenance, and its links to vitals, interventions, active problems, active devices, care plans, notifications, artifacts, and notes.

- Legacy artifact: ICU nursing head-to-toe / focused reassessment flowsheet.
- pi-chart primitive: `observation.exam_finding` plus existing `observation.patient_report`, `observation.screening`, `assessment.trend|severity|risk_score|impression`, `intent.monitoring_plan|care_plan`, `action.measurement|intervention|notification`, `communication.*`, and `artifact_ref`.
- Supporting views: `timeline`, `currentState`, `trend`, `evidenceChain`, `openLoops`, `narrative`.

| Legacy artifact / row | pi-chart primitive | Supporting views |
|---|---|---|
| Complete shift head-to-toe pass | Multiple `observation.exam_finding` events with shared `data.assessment_set_id` or future session shell; coverage metadata is `[open-schema]` | `timeline()`, `evidenceChain()`, `narrative()` |
| Respiratory assessment: work of breathing, accessory muscles, breath sounds, cough/sputum | `observation.exam_finding` with `data.system: respiratory`, `finding_code`, `finding_state`, body site, severity/qualifier, and method; patient-stated dyspnea is `observation.patient_report` | `timeline()`, `trend()` with A3 vitals, `evidenceChain()` |
| Neuro / mental status / delirium / sedation observation | `observation.exam_finding` for bedside status; `observation.screening` for GCS/CAM-ICU/RASS-like instruments; nursing `assessment.severity|risk_score|trend` when interpreting | `currentState()`, `openLoops()`, `narrative()` |
| Pain report and observed pain behavior | `observation.patient_report` for stated pain; `observation.exam_finding` for behavior/function; optional `observation.screening` for NRS/CPOT-like instruments; response interpretation is assessment, not raw finding | `timeline()`, `evidenceChain()`, `openLoops()` |
| Focused reassessment after oxygen escalation, suctioning, analgesic, repositioning, rapid response, procedure, or off-unit return | New `observation.exam_finding` with `data.assessment_context: focused_reassessment`, `data.trigger_ref` or companion session trigger, and optional `links.resolves` to reassessment loop | `openLoops()`, `evidenceChain()`, `narrative()` |
| Skin / wound / pressure-area finding | `observation.exam_finding` plus `artifact_ref` for photo when used; Braden-like risk score is `observation.screening` or `assessment.risk_score`, not a generic A8 row | `timeline()`, `evidenceChain()`, `openLoops()` |
| LDA site finding: redness, drainage, swelling, pain, dressing integrity | `observation.exam_finding` with `data.system: integumentary`, `data.focus`/`finding_code` identifying device site, and `related_lda_key` or EvidenceRef to A5 LDA segment; A5 retains device lifecycle truth | `evidenceChain()`, `currentState(axis:"lda")` if accepted |
| Normal-by-exception / WDL / WNL row | Canonical only when the nurse actively assessed a defined finding or defined normal set; silence is unknown, never normal; broad WDL-set semantics remain `[open-schema]` | rendered grid, `openLoops()` for missing required assessment |
| Nursing diagnosis / safety judgment such as high fall risk, aspiration concern, impaired skin integrity | Nursing-scope `assessment.risk_score`, `assessment.severity`, or `assessment.impression` citing A8 findings; downstream `intent.care_plan` / `intent.monitoring_plan` carries plan truth | `currentState(axis:"intents")`, `openLoops()`, `evidenceChain()` |
| Handoff statement: “lungs coarse, increasing WOB, watch first hour” | A7 `communication.handoff` cites A8 structured findings; the note does not become canonical exam truth | `narrative()`, `evidenceChain()` |
| Rendered body-system grid, checkboxes, color chips, “no acute change” banner | Not canonical. UI projection over recent A8 observations, screening results, and related active plans | rendered only |

Load-bearing claims:

1. **A8 should not create a `nursing_assessment` event type.** The substrate already has `observation.exam_finding`; A8 formalizes its payload and validator expectations rather than introducing body-system event families.
2. **A8 stores findings, absence assertions, and focused reassessments, not the whole form.** “Respiratory WDL” is only useful when it points to an assessed, defined normal set; “no accessory muscle use after oxygen escalation” is a canonical finding because it can close a response loop.
3. **RN findings are observations; RN judgments are scoped assessments.** A nurse can author “crackles present,” “edema absent,” “patient reports pain 8/10,” “sacrum non-blanchable,” or “high fall risk.” RN-authored medical-diagnosis-like claims warn unless scoped as nursing judgment, profile-approved, or supported by provider assessment.
4. **A8 and A7 stay separate.** A7 narrates and transfers accountability; A8 supplies the structured bedside evidence A7 cites.
5. **Session identity is useful but not settled.** The competing artifact’s `assessment.exam_session` proposal solves cross-artifact citation and completeness checks, but a parent session event may also become EHR-module drift. This revision stages the decision rather than silently adopting it.

## 3. Regulatory / professional floor

- **[regulatory] CMS 42 CFR § 482.23(b)(3)–(4)** — nursing services require an RN to supervise/evaluate nursing care for each patient, and nursing staff must develop and keep current a nursing care plan reflecting patient goals and nursing care needs.
- **[regulatory] CMS 42 CFR § 482.24(b), § 482.24(c), § 482.24(c)(1)** — hospital records must be accurately written, promptly completed, accessible, and contain dated/timed/authenticated entries describing patient progress and response to medications/services.
- **[accreditation witness] Joint Commission 2026 National Performance Goals / provision-of-care expectations** — hospitals must communicate condition/treatment/recent or anticipated changes, assess/reassess according to defined timeframes, recognize/respond to condition change, and document pain response where applicable. A8 supplies the structured bedside evidence; exact cadence remains profile/policy-dependent.
- **[professional] ANA nursing documentation principles and scope/standards** — RNs are accountable for clear, accurate, accessible nursing documentation and for collecting/analyzing pertinent assessment data.
- **[phase-b-regulatory] State nurse practice acts and institutional policies** — exact ICU assessment cadence, LPN/CNA delegation, student/preceptor sign-off, restraint/seclusion assessment intervals, wound-photo consent, and standing-protocol authority are profile-specific.

## 4. Clinical function

A8 is consumed at moments where bedside findings change the next safe action.

- **Oncoming RN at handoff.** Needs current neuro, respiratory, cardiovascular/perfusion, skin, pain/symptom, mobility, safety, and device-site findings, what changed, and which domains need early reassessment.
- **Bedside RN during deterioration.** Needs to prove that change was recognized, matched against vitals/labs/baseline, escalated, and reassessed.
- **Provider/APP/RT/pharmacy.** Uses nursing findings to interpret vital trends, determine urgency, verify response to respiratory or medication interventions, and assess adverse effects.
- **Charge RN/resource coordinator.** Uses exam burden, missing reassessment loops, and acuity-bearing findings to calibrate staffing and rescue needs.
- **Wound/skin, PT/OT, RT, and other consultants.** Use the specific findings that define consult need and response, not a generic “assessment completed.”
- **pi-agent.** Reads structured findings to avoid note-only truth, to decide whether an intervention needs reassessment, to generate narrative/handoff without inventing unobserved physiology, and to detect silence vs explicit normality.

Concrete decisions depending on A8: whether hypoxemia is clinically worsening despite a stable oxygen device, whether oxygen/suctioning/analgesic/repositioning worked, whether delirium or sedation risk changes safety plan, whether skin/device-site findings need wound consult or provider notification, whether fall/aspiration/pressure-injury risk requires a care-plan update, and whether a note/handoff can safely summarize the patient’s current state.

## 5. Who documents

Primary: assigned bedside RN.

Secondary: RN relief/charge nurse, LPN/LVN, CNA/PCT, RT, wound RN, PT/OT, patient/caregiver, device/importer, or agent may contribute narrow observations when local profile permits. Patient/caregiver symptom statements are `observation.patient_report`, not silently merged into nurse-observed findings. RT/wound/PT/OT findings may use the same `observation.exam_finding` subtype but should not be labeled as the bedside RN’s complete head-to-toe session.

Owner of record: the responsible RN for nursing assessment findings in the active assignment. Student/orientee documentation requires profile-specific preceptor/co-signature handling, likely via the same attestation pattern already staged for A7. The agent does not author human bedside findings; agent-derived synthesis across A8 findings is derived and must carry derivation/provenance rather than `source.kind: human_assessor`.

## 6. When / how often

Frequency class: periodic, per-shift, event-driven, per-encounter.

- Regulatory minimum: no single federal “Qx head-to-toe” interval. The floor is that nursing care is evaluated, the care plan is current, and chart entries are prompt, dated/timed/authenticated, and sufficient to describe progress/response. Facility/state/unit profiles decide exact required cadence.
- Clinical default for adult ICU fixture: one complete head-to-toe assessment per shift, an admission/transfer-in assessment near encounter entry, and focused reassessment after material status change, intervention, procedure, rapid response, transport return, or new safety risk.
- Session/cadence shape: `cadence_class ∈ {admission, shift, focused_reassessment, prn}` may live on a future session shell or on grouped finding metadata. It is not a per-finding clinical fact unless no session/grouping is available.
- Admission coverage default: all eight systems represented as either `present`, `absent`, or explicitly `not_assessed` when clinically impossible.
- Shift coverage default: at minimum neuro, respiratory, cardiac/perfusion, and integumentary/skin should be covered for an adult ICU fixture; the remaining systems require explicit `not_assessed` or profile reason if omitted.
- PRN/focused coverage default: the trigger system(s) plus any clinically coupled safety system. For respiratory decompensation this usually means respiratory plus neuro/mentation and perfusion-relevant findings; it is not a full head-to-toe unless the clinical event demands one.

`[open-schema]` Whether these coverage defaults become validator rules, profile defaults, or fixture-only conventions is staged in §16. Avoid hard-coding a universal ICU cadence in the global schema.

## 7. Candidate data elements

Aggressive filtering applied. The included rows separate per-finding truth from optional session/completeness metadata.

### 7a. Per-finding fields — canonical on `observation.exam_finding`

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|
| `effective_at` | [regulatory] | Yes | ISO-8601 instant | Trend reconstruction and prompt documentation fail | Author/system timestamp | High |
| `recorded_at` | [clinical] | Yes | ISO-8601 instant | Backdating/delay detection fails | System-stamped | High |
| `author` / `actor` | [regulatory] | Yes | actor ref + role | RN accountability and credential checks fail | Session/current user | High |
| `source.kind` | [clinical] | Yes | closed source taxonomy | Human vs imported/agent-derived epistemics collapse | Writer-provided | High |
| `data.system` | [clinical] | Yes | governed enum | Head-to-toe coverage and system queries fail | Author-selected | High |
| `data.focus` | [clinical] | Yes | short string / local enum | “What exactly was assessed?” becomes free prose | Author-selected | High |
| `data.finding_code` | [clinical] | Yes | local enum/codeable concept | Crackles/wheezes/edema/etc. become NLP-only | Author-selected | Medium — open-schema vocabulary |
| `data.finding_state` | [clinical] | Yes | `present | absent | not_assessed` | Absence vs silence collapses | Author-selected | High |
| `data.body_site` | [clinical] | Conditional | local body-site enum or code | Laterality/localization and LDA-site reasoning fail | Author-selected | Medium — open-schema |
| `data.measurement` | [clinical] | Conditional | value/unit/components | Quantitative findings collapse to text: GCS, pupil mm, cap refill sec, edema grade | Author/device/manual | High |
| `data.severity` | [clinical] | Conditional | enum/ordinal | Trending severity collapses to binary | Author-selected | Medium |
| `data.qualifier` | [clinical] | Optional | object | Distribution/character/phase/associated features become prose | Author-selected | Medium |
| `data.method` | [clinical] | Yes | enum/string | “Absent” lacks assessed-by method; WDL is not auditable | Author-selected | High |
| `data.assessment_context` | [clinical] | Yes | `admission | shift | focused_reassessment | prn | procedure_return | transport_return` | Cadence/reassessment semantics become implicit | Author/session-derived | Medium |
| `data.trigger_ref` | [clinical] | Conditional | EvidenceRef-like ref | PRN/focused findings cannot explain why they exist | Trigger event/window | Medium — open-schema |
| `data.assessment_set_id` | [agent] | Optional | string | Group-level citations and coverage checks are clumsy | Generated | Medium — open-schema |
| `data.related_lda_key` / `related_device_ref` | [clinical] | Conditional | LDA key/EvidenceRef | Site finding cannot join to A5 lifecycle | A5 device context | Medium — dependent on A5 |
| `links.supports` | [clinical] | Common | EvidenceRefs | Downstream A0c/A5/A6/A7 claims cannot cite findings | Author/downstream | High |
| `links.resolves` | [clinical] | Conditional | loop/event refs | Reassessment loops remain open despite evidence | Open loop context | Medium |
| `artifact_ref` / `links.supports` to artifact | [clinical] | Conditional | artifact id | Photo-supported wound/skin claims become untraceable | Artifact manifest | High |

### 7b. Optional session/completeness fields — `[open-schema]`

These fields are adopted as useful but not yet assigned a final storage home. Candidate homes are: (a) thin `assessment.exam_session`; (b) `action.measurement`/assessment-performed action; (c) `data.assessment_set_id` plus derived session view; or (d) EvidenceRef selection only.

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|
| `session_id` / `assessment_set_id` | [agent] | Yes if session accepted | string | Whole-session citation and A7 admission-note obligation are awkward | Generated | High clinical utility, storage open |
| `cadence_class` | [clinical] | Yes if session accepted | enum | Coverage/staleness rules cannot be applied consistently | Author/profile | High utility |
| `session_status` | [clinical] | Optional | `open | closed | amended` | In-progress vs finalized exam is unclear | Author/system | Medium |
| `coverage.systems` | [clinical] | Optional | array of systems + completeness assertion | Coverage-gap loops cannot be emitted deterministically | Derived plus author assertion | High utility |
| `trigger_ref` | [clinical] | Conditional | EvidenceRef-like ref | PRN session lacks causal context | Trigger event/window | High utility |
| `closed_at` / `amended_at` | [regulatory] | Conditional | ISO-8601 | Addendum lifecycle is unclear | System-stamped | Medium |
| `cosignature_ref` | [phase-b-regulatory] | Profile-driven | attestation ref | Student/orientee/LPN policy not enforceable | Attestation workflow | Medium |

### 7c. Proposed A8 system enum

For head-to-toe coverage, use a small ICU-nursing system vocabulary:

`neuro` | `cardiac` | `respiratory` | `gi` | `gu` | `integumentary` | `musculoskeletal` | `psychosocial`

Pain, sedation/delirium instruments, fall risk, Braden score, LDA status, endocrine/hematologic lab interpretation, and education/discharge readiness are not additional A8 systems. They may be findings, screenings, assessments, or companion artifacts that cite A8. LDA site appearance typically lives under `integumentary` plus `related_lda_key`; pain may be `patient_report`, `screening`, or an exam-finding focus depending on the form of evidence.

### 7d. Three-valued `finding_state`

`data.finding_state` is the central value-add from the competing artifact and should replace ambiguous “normality + null” logic for A8 findings.

- `present` — finding is asserted present: “bibasilar crackles present,” “sacral non-blanchable erythema present.”
- `absent` — finding was actively assessed and asserted absent: “edema absent,” “accessory muscle use absent.”
- `not_assessed` — finding/system was not assessed in this session and must carry a reason when required by coverage or cadence.

Silence never means normal. `normality` can be derived or retained as a convenience label, but it is secondary to `finding_state` and must not be the only missingness representation.

## 8. Excluded cruft — with rationale

| Excluded item | Why it exists in EHRs | Why pi-chart excludes or demotes it |
|---|---|---|
| Full body-system checkbox inventory | Survey/regulatory anxiety, documentation billing, local flowsheet history | It creates a miniature EHR module. A8 keeps care-relevant findings and explicit required absences; rendered grids are disposable. |
| Per-row “reviewed/confirmed” checkboxes | Compliance and orientee/cosign workflows | Session/signature/attestation and event provenance cover accountability. Per-row stamps add noise. |
| “Assessment performed: yes/no” checkbox | Survey-signoff theater | If findings/session exist, assessment was performed; if no findings exist, the checkbox cannot supply clinical evidence. |
| Copy-forward “no acute changes since last shift” | Time-saving and legacy charting by exception | Trend sameness is derived from prior and current findings, not asserted by copied text. |
| WDL/WNL as blanket normality from silence | Normal-by-exception charting speed | Accepted only as explicit, defined shorthand over assessed findings; otherwise it converts unknown into normal. |
| Free-text comment field on every row | Dropdown escape hatch | Structured `qualifier`, body site, method, and A7 narrative citations are safer. Free text is not canonical finding truth. |
| Duplicate vitals, I&O totals, medication rows, and device active status | EHR screen consolidation | A3 owns vitals, A4 owns med actions, A5 owns I&O and LDA lifecycle. A8 cites them. |
| Pain, Braden, CAM-ICU, RASS, fall risk as generic “assessment rows” | Co-located nursing entry screens | Scores/instruments should be `observation.screening` or nursing `assessment.risk_score`, not undifferentiated A8 rows. |
| Education needs, discharge readiness, vaccination screening | Admission navigator consolidation | Separate Phase B / discharge / education surfaces. |
| Billing/quality-only fields | Compliance extraction | Excluded unless they alter clinical action, staleness, or provenance. |
| Body silhouette/map UI coordinates | Rendering convenience for skin/wound charting | Store structured `body_site` and artifact refs; UI coordinates are rendered unless tied to an accepted artifact standard. |

## 9. Canonical / derived / rendered

| Class | A8 examples |
|---|---|
| **Canonical** | `observation.exam_finding` events; `observation.patient_report` symptom statements; `observation.screening` instrument results; nursing-scope `assessment.*` events citing findings; `artifact_ref` for wound/site images; `action.notification`/`action.measurement` companion events when reassessment or escalation loops are closed. |
| **Canonical only if accepted by open-schema** | A stored A8 session shell such as `assessment.exam_session` or `action.measurement` with `session_id`, `cadence_class`, `coverage.systems`, `session_status`, and `trigger_ref`. Until accepted, these are grouping metadata or derived session views. |
| **Derived** | “No change from prior assessment,” latest finding by system/focus, coverage gap status, trend across A8 sessions, WDL grid state, risk-score calculations from findings, “response improved/worsened” when computed rather than authored. |
| **Rendered** | Body-system flowsheet grid, color-coded normal/abnormal badges, missing-assessment banners, body maps, shift summary cards, default row order, “assessment complete” checkmark, note snippets. |

A8’s canonical boundary is: **what a credentialed assessor directly observed/reported/screened and what evidence-backed nursing judgment followed.** UI layouts, totals, copied normals, and trend labels are projections.

## 10. Provenance and lifecycle

- **Authorship.** Each canonical finding carries actor identity, role, source, `effective_at`, and `recorded_at`. RN-authored head-to-toe findings should use the closed source taxonomy value that corresponds to direct human bedside assessment; if the repo’s exact label differs from `human_assessor`, use the existing label rather than inventing one.
- **Session lifecycle.** If a stored session shell is accepted, it may open, close, and amend coverage metadata. If no shell is accepted, findings share `assessment_set_id`; closure/completeness is derived by write transaction or generated view. In either case, a closed session must not silently accept new findings without amendment/correction semantics.
- **Corrections vs addenda.** Documentation error uses `links.corrects`. Later clinical change uses a new finding with later `effective_at`, not correction. Late-discovered but same-time information may use addendum semantics if a session shell is accepted.
- **Supersession.** Newer findings may supersede older current-state findings for the same patient/system/focus/body_site, but raw observations remain available in timeline. Do not supersede prior findings merely because a new shift has started; only current-state projection changes.
- **Contradiction.** If two same-window findings materially disagree — for example “skin intact” versus photo-supported sacral pressure injury — preserve both and use `links.contradicts` or review loop rather than overwriting.
- **Fulfillment discipline.** Raw A8 observations do not carry `links.fulfills`. If an order/monitoring plan required a measurement or reassessment, a companion `action.measurement` or other accepted action fulfills it; A8 findings support that action and may resolve the open loop.
- **Addresses discipline.** Raw A8 observations generally do not `links.addresses` problems. They support `assessment.problem`, `assessment.impression`, `assessment.risk_score`, care-plan intent, or notification events that address problems.

## 11. Missingness / staleness

A8’s most important safety distinction is explicit absence vs silence.

- `finding_state: absent` means assessed and absent.
- `finding_state: not_assessed` means not assessed and should usually carry `data.reason` when the system/finding is expected by cadence or trigger.
- No event means unknown, not normal.

Open-loop classes:

| Loop | Trigger | Expected closure |
|---|---|---|
| `a8.assessment_missing` | Required admission/shift assessment absent by profile-defined due time | A8 session/finding set or profile-approved reason |
| `a8.coverage_gap` | Required system coverage missing for an admission/shift/focused session | Finding with `present/absent/not_assessed` plus reason, or amended coverage |
| `a8.focused_reassessment_pending` | Intervention/status change/procedure/transport creates reassessment requirement | Focused A8 finding set and/or `action.measurement` with A8 findings supporting it |
| `a8.stale_finding` | Domain/focus older than active monitoring/care-plan cadence | New finding or profile-approved cadence change |
| `a8.artifact_followup_pending` | Wound/site finding says photo/evidence needed but artifact missing | `artifact_ref` or explicit reason no artifact captured |
| `a8.contradiction_review` | Same-window material contradiction between A8 finding and note/import/peer finding | Review, correction, or preserved contradiction with rationale |

Severity should be profile-driven. In live mode, missing/coverage gaps usually produce open loops rather than immediate write rejection. In replay/fixture mode, asserted-complete sessions with required gaps may be errors.

## 12. Agent read-before-write context

Before writing an A8 finding or session, the agent or authoring tool should read:

1. **Identity/encounter/baseline:** A0a patient/encounter, baseline cognition/function/respiratory status, active location/assignment if modeled.
2. **Active constraints:** A0b allergies, code status, isolation/communication constraints, wound-photo consent policy if relevant.
3. **Active problems:** A0c current problems and provisional concerns; avoid unscoped RN-authored medical diagnosis.
4. **Recent A3 vitals/context:** oxygen device/flow, respiratory trend, hemodynamics, fever, monitoring artifacts.
5. **A4 medication/intervention context:** recent analgesics, sedatives, vasopressors, antibiotics, holds, titrations, and post-dose reassessment obligations.
6. **A5 I&O/LDA context:** active devices, site context, urine/drain output patterns, device complication loops.
7. **A6/A7 narrative context:** prior provider/nursing notes for claims that require structured A8 sibling findings.
8. **Active intents/open loops:** monitoring plans, care plans, reassessment pending loops, coverage gaps, result/provider notification loops.
9. **Prior A8 findings:** latest finding by system/focus/body_site and prior session coverage if session identity is accepted.

Read-before-write prevents copy-forward errors, wrong-patient/wrong-encounter writes, stale reassessment closure, and note-only truth.

## 13. Related artifacts

| Artifact | Boundary with A8 |
|---|---|
| A0a demographics/encounter/baseline | Baseline provides reference frame; A8 writes current findings, not baseline demographics. |
| A0b active constraints | Constraints govern what actions/communication/photo capture are safe; A8 may supply evidence for new constraint concerns but does not own constraint truth. |
| A0c problems | A8 findings support problem creation, staging, or resolution; problem truth remains `assessment.problem`. |
| A1/A2 labs/results | A8 may cite results for context but does not store lab/diagnostic truth. |
| A3 vitals | A3 supplies physiologic stream; A8 supplies human bedside context that interprets that stream. |
| A4 MAR | Medication actions create reassessment obligations; A8 findings document response evidence. |
| A4b med reconciliation | No direct ownership except symptom/findings that affect med decisions. |
| A5 I&O/LDAs | A5 owns volume/device lifecycle; A8 owns observed skin/site/body findings tied to devices. |
| A6 provider notes | Provider notes synthesize/cite A8; care-changing exam statements in notes should have structured sibling claims when current and material. |
| A7 nursing notes | A7 narrates, explains, and hands off; A8 is the structured evidence source A7 must cite for material findings. |
| A9a individual orders | A9a owns order/intents. A8 findings may trigger/support orders or reassessment obligations but do not become orders. |
| A9b ordersets | A8 may supply trigger/response evidence for order-set invocation but does not own order-set structure. |

## 14. Proposed pi-chart slot shape

**Summary recommendation:** Use `observation.exam_finding` as the canonical A8 finding primitive with a standardized payload centered on `system`, `focus`, `finding_code`, `finding_state`, `body_site`, `method`, and optional grouping/session metadata. Stage — but do not silently accept — a thin session/completeness shell.

### 14a. Finding event example

```jsonc
{
  "id": "evt_20260418T1910_a8_wob_001",
  "type": "observation",
  "subtype": "exam_finding",
  "subject": "patient_001",
  "encounter_id": "encounter_001",
  "effective_at": "2026-04-18T19:10:00-05:00",
  "recorded_at": "2026-04-18T19:12:04-05:00",
  "author": { "role": "rn_bedside", "id": "rn_002" },
  "source": { "kind": "human_assessor" },
  "data": {
    "assessment_set_id": "a8set_20260418_1900_shift_rn002",
    "assessment_context": "shift",
    "system": "respiratory",
    "focus": "work_of_breathing",
    "finding_code": "accessory_muscle_use",
    "finding_state": "present",
    "severity": "moderate",
    "method": "inspection",
    "body_site": "chest_wall",
    "qualifier": {
      "pattern": "intercostal_retractions",
      "associated_features": ["speaks_in_short_phrases"]
    },
    "trigger_ref": {
      "kind": "vitals_window",
      "ref": "vitals://encounter_001?metric=spo2&from=2026-04-18T18:30:00-05:00&to=2026-04-18T19:10:00-05:00",
      "role": "trigger"
    }
  },
  "links": {
    "supports": [
      { "kind": "vitals_window", "ref": "vitals://encounter_001?metric=spo2&from=2026-04-18T18:30:00-05:00&to=2026-04-18T19:10:00-05:00", "role": "context" }
    ]
  }
}
```

### 14b. Explicit absent finding example

```jsonc
{
  "type": "observation",
  "subtype": "exam_finding",
  "effective_at": "2026-04-18T19:15:00-05:00",
  "author": { "role": "rn_bedside", "id": "rn_002" },
  "source": { "kind": "human_assessor" },
  "data": {
    "assessment_set_id": "a8set_20260418_1900_shift_rn002",
    "assessment_context": "shift",
    "system": "cardiac",
    "focus": "peripheral_edema",
    "finding_code": "edema_lower_extremity",
    "finding_state": "absent",
    "body_site": "lower_extremity_bilateral",
    "method": "inspection_palpation"
  }
}
```

### 14c. `not_assessed` coverage example

```jsonc
{
  "type": "observation",
  "subtype": "exam_finding",
  "effective_at": "2026-04-18T19:25:00-05:00",
  "author": { "role": "rn_bedside", "id": "rn_002" },
  "source": { "kind": "human_assessor" },
  "data": {
    "assessment_set_id": "a8set_20260418_1900_shift_rn002",
    "assessment_context": "shift",
    "system": "musculoskeletal",
    "focus": "active_range_of_motion",
    "finding_code": "active_range_of_motion",
    "finding_state": "not_assessed",
    "reason": "deep_sedation_rass_minus_4"
  },
  "links": {
    "supports": [
      { "kind": "event", "ref": "evt_20260418T1905_rass_minus4", "role": "reason" }
    ]
  }
}
```

### 14d. Wound/device-site finding example

```jsonc
{
  "type": "observation",
  "subtype": "exam_finding",
  "effective_at": "2026-04-18T20:05:00-05:00",
  "author": { "role": "rn_bedside", "id": "rn_002" },
  "source": { "kind": "human_assessor" },
  "data": {
    "assessment_set_id": "a8set_20260418_1900_shift_rn002",
    "assessment_context": "focused_reassessment",
    "system": "integumentary",
    "focus": "central_line_site",
    "finding_code": "erythema_at_insertion_site",
    "finding_state": "present",
    "severity": "mild",
    "body_site": "right_internal_jugular_insertion_site",
    "related_lda_key": "lda_cvc_rij_001",
    "method": "inspection",
    "artifact_ref": "artifact_20260418_cvc_site_photo_001"
  }
}
```

### 14e. Optional session shell candidate — `[open-schema]`

If the owner accepts a stored session shell, keep it thin and do not let it become a nursing-assessment module. Candidate shape:

```jsonc
{
  "id": "evt_a8session_20260418_1900_rn002",
  "type": "assessment",              // or action, pending open-schema
  "subtype": "exam_session",
  "subject": "patient_001",
  "encounter_id": "encounter_001",
  "effective_at": "2026-04-18T19:00:00-05:00",
  "recorded_at": "2026-04-18T19:00:05-05:00",
  "author": { "role": "rn_bedside", "id": "rn_002" },
  "source": { "kind": "human_assessor" },
  "data": {
    "session_id": "a8set_20260418_1900_shift_rn002",
    "cadence_class": "shift",
    "session_status": "closed",
    "coverage": {
      "systems": ["neuro", "cardiac", "respiratory", "gi", "gu", "integumentary", "musculoskeletal", "psychosocial"],
      "complete_by_author_assertion": true
    },
    "trigger_ref": null
  }
}
```

### Link conventions

- `links.supports`: A8 findings support nursing/provider assessments, response claims, care-plan updates, notifications, notes, and problem creation.
- `links.resolves`: A8 findings or companion measurement actions may close concrete loops such as pain reassessment or respiratory reassessment pending.
- `links.contradicts`: later or peer finding structurally disagrees with a same-window finding and the disagreement matters.
- `links.supersedes`: newer state assertion over the same finding identity when current-state projection should prefer the newer finding.
- `links.corrects`: documentation error.
- `links.fulfills`: not on raw `observation.exam_finding`.
- `links.addresses`: not on raw A8 observations except by future explicit ADR; downstream intents/actions/assessments address A0c problems.

### Storage placement

`events.ndjson` for structured observations, assessments, intents, and actions; `artifacts/` plus artifact manifest for wound/skin/device-site images; A7 `notes/*.md` only for narrative synthesis.

### Schema confidence

Medium-high for `observation.exam_finding` payload and link discipline. Medium for body-system coverage and three-valued finding state. Medium-low for stored session shell until cross-artifact session identity is resolved.

### Schema impact

New payload convention for `observation.exam_finding`; possible new assessment/action subtype only if session shell accepted; validator rules; no new event type, storage primitive, source kind, or link type recommended by default.

## 15. Validator and fixture implications

### Validator rules

- `A8-EXAM-01`: `observation.exam_finding` must include `data.system`, `data.focus`, `data.finding_code`, `data.finding_state`, and `data.method` unless a profile-approved legacy import transform is present.
- `A8-EXAM-02`: `data.finding_state` must be one of `present`, `absent`, or `not_assessed`; null/omitted state warns or errors depending on import/live mode.
- `A8-EXAM-03`: `finding_state: absent` requires method/provenance; absence cannot be inferred from missing abnormal findings.
- `A8-EXAM-04`: `finding_state: not_assessed` should include `data.reason` when the system/finding is expected by cadence, trigger, or active monitoring plan.
- `A8-EXAM-05`: `assessment_context: focused_reassessment` or `prn` should include `data.trigger_ref` or a session-level trigger unless `data.reason: ad_hoc` is present.
- `A8-EXAM-06`: raw `observation.exam_finding` must not carry `links.fulfills`; use `action.measurement` or accepted companion action for fulfillment.
- `A8-EXAM-07`: raw A8 findings should not carry `links.addresses`; downstream assessments/intents/actions address problems.
- `A8-EXAM-08`: wound/photo-supported findings must cite an `artifact_ref` if the image is used as evidence; raw image paths in payload warn.
- `A8-EXAM-09`: `data.related_lda_key` should resolve to an active or recently active A5 LDA context segment; warn while A5 addressability remains open.
- `A8-EXAM-10`: RN-authored `assessment.*` events with medical-diagnosis-like content should warn unless `data.scope: nursing`, a provider-authored assessment is cited, or local profile allows it.
- `A8-EXAM-11`: WDL/WNL/normal-shorthand assertions require defined normal set, method, and explicit assessed scope; never derive normal from silence.
- `A8-OPENLOOP-01`: active `intent.monitoring_plan`, `intent.care_plan`, or profile requirement with an A8 domain cadence should create an open loop when due and unresolved.
- `A8-OPENLOOP-02`: if session coverage is accepted and a closed admission/shift session lacks required systems, emit `a8.coverage_gap`; replay fixtures may escalate to error.
- `A8-SESSION-01`: if stored session shell accepted, all findings referencing `session_id` must match patient/encounter and cannot append to a closed session without amendment/correction.

### Minimal fixture additions for `patient_001`

- **Normal/stable shift assessment:** explicit respiratory and neuro findings normal-for-current baseline, without materializing every checkbox.
- **Respiratory deterioration:** A3 SpO₂/RR trend plus A8 work-of-breathing, breath-sound, cough/sputum, dyspnea, and mentation findings supporting a worsening-respiratory-status assessment.
- **Three-state contrast:** one present finding, one absent finding, and one required-but-not-assessed finding with reason.
- **Post-intervention reassessment:** oxygen escalation, suctioning, analgesic, or repositioning action followed by focused A8 reassessment that closes a concrete open loop.
- **LDA/site finding:** active A5 line/tube/drain context plus A8 insertion-site or dressing/skin finding; no duplicated LDA lifecycle state.
- **Skin/wound/photo evidence:** A8 wound/pressure-area finding with artifact_ref photo evidence and optional nursing risk-score assessment.
- **Coverage-gap fixture:** intentionally incomplete shift session/grouping that emits `a8.coverage_gap`, plus paired complete fixture covering all required systems.
- **Contradiction case:** A7 note/imported row says WDL/skin intact while A8 finding or artifact shows abnormality; validator preserves both and flags review.

## 16. Open schema questions

- **`a8-exam-finding-shape`** — Should A8 standardize one consolidated `observation.exam_finding` payload or add granular body-system subtypes? See `OPEN-SCHEMA-QUESTIONS.md#a8-exam-finding-shape`.
- **`a8-system-taxonomy-and-coverage`** — Should A8 use the eight-system head-to-toe enum for coverage, the earlier flexible domain/focus model, or a hybrid? See `OPEN-SCHEMA-QUESTIONS.md#a8-system-taxonomy-and-coverage`.
- **`a8-finding-state-negative-missingness`** — Should `present|absent|not_assessed` become the canonical A8 finding-state model? See `OPEN-SCHEMA-QUESTIONS.md#a8-finding-state-negative-missingness`.
- **`a8-normal-wdl-semantics`** — When is WDL/normal shorthand canonical versus derived/rendered? See `OPEN-SCHEMA-QUESTIONS.md#a8-normal-wdl-semantics`.
- **`a8-finding-vocabulary-scope`** — What controlled vocabulary should `data.finding_code` use? See `OPEN-SCHEMA-QUESTIONS.md#a8-finding-vocabulary-scope`.
- **`a8-body-site-encoding`** — How granular should `data.body_site` be? See `OPEN-SCHEMA-QUESTIONS.md#a8-body-site-encoding`.
- **`a8-session-identity-and-completeness`** — Are event ids plus grouping enough, or does A8 need a stored session shell with coverage semantics? See `OPEN-SCHEMA-QUESTIONS.md#a8-session-identity-and-completeness`.
- **`a8-prn-trigger-shape`** — Should PRN/focused reassessment trigger context live in `data.trigger_ref`, `links.supports`, or a session shell? See `OPEN-SCHEMA-QUESTIONS.md#a8-prn-trigger-shape`.
- **`a8-reassessment-response-coupling`** — How should A8 focused reassessments close response-to-intervention loops without violating ADR 003 fulfillment semantics? See `OPEN-SCHEMA-QUESTIONS.md#a8-reassessment-response-coupling`.
- **`a8-nursing-scope-assessment-boundary`** — What payload/profile rules distinguish RN-authored nursing judgments from medical diagnoses? See `OPEN-SCHEMA-QUESTIONS.md#a8-nursing-scope-assessment-boundary`.
- **`a8-assessment-cadence-openloops`** — Should assessment cadence live only in plans/profiles, or should A8 define default staleness rules? See `OPEN-SCHEMA-QUESTIONS.md#a8-assessment-cadence-openloops`.
- **`a8-wound-skin-artifact-refs`** — How should skin/wound/photo artifacts be linked without creating a wound module? See `OPEN-SCHEMA-QUESTIONS.md#a8-wound-skin-artifact-refs`.
- **`a8-a7-structured-vs-narrative-boundary`** — Which nursing-note assessment statements require structured A8 siblings? See `OPEN-SCHEMA-QUESTIONS.md#a8-a7-structured-vs-narrative-boundary`.
- **`a8-a5-lda-site-boundary`** — How should A8 site findings reference A5 LDA identity/lifecycle without duplicating device truth? See `OPEN-SCHEMA-QUESTIONS.md#a8-a5-lda-site-boundary`.
- **`a8-current-state-axis-for-exam`** — Does A8 need `currentState(axis:"exam")`, or can initial fixtures use existing timeline/currentState projections? See `OPEN-SCHEMA-QUESTIONS.md#a8-current-state-axis-for-exam`.

## 17. Sources

- pi-chart Phase A Charter v3.1: primitive discipline, schema entropy budget, canonical/derived/rendered boundary, field tags, output budgets, acceptance criteria.
- pi-chart Phase A Template v3.1: mandatory 17-section artifact shape.
- pi-chart Phase A Execution Plan v3.2: A8 sequencing and A9a/A9b boundaries; A9a is the individual order primitive, not focused reassessment.
- Uploaded current `OPEN-SCHEMA-QUESTIONS.md`: current A0a-A7 open-schema catalog and accepted-direction table.
- Uploaded `PHASE-A-FIXTURE-SCAFFOLD.md`: patient_001 narrow respiratory-decompensation seed and missing A8 breadth.
- Prior Phase A artifacts: A0a patient demographics/encounter/baseline; A0b active constraints; A0c active problems; A3 vital signs; A4 MAR; A4b medication reconciliation; A5 I&O/LDAs; A6 provider notes; A7 nursing notes.
- Prior A8 synthesis file generated in this session: `a8-icu-nursing-assessment-synthesis.md` and `a8-open-schema-entries-synthesis.md` before council merge.
- Competing A8 head-to-toe artifact uploaded for council synthesis: `a8-headtotoeassessment.md`.
- pi-chart repo surface previously inspected via GitHub raw for A8 first pass: README, DESIGN, CLAIM-TYPES, ROADMAP, ADRs, schemas, views, and `patient_001` chart files. This council pass did not repeat repo inspection; it preserves the prior repo-derived boundary where it conflicts with the competing artifact.
- CMS eCFR 42 CFR § 482.23, Nursing services, especially § 482.23(b)(3)–(4).
- CMS eCFR 42 CFR § 482.24, Medical record services, especially § 482.24(b), § 482.24(c), and § 482.24(c)(1).
- Joint Commission 2026 National Performance Goals / Provision of Care assessment-reassessment expectations as accreditation witnesses.
- American Nurses Association, *Principles for Nursing Documentation* and nursing scope/standards materials.
- AACN critical/progressive care scope and practice-alert materials as professional witnesses for ICU bedside assessment.
- Public clinical practice references used only as witnesses for head-to-toe system organization and WDL/charting-by-exception risk; they do not define substrate schema.
