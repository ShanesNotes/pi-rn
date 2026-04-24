# A0c. Problem list & active problems

## 1. Clinical purpose

The problem list is the substrate's answer to *"what is wrong with this patient, and how does that shape what we do next?"* It is the shared cognitive model of the patient's clinical state — durable across shift handoffs and inter-encounter transitions, and the anchor the substrate uses to bind every intervention to its rationale via the `links.addresses` chain. In the MICU septic-shock context, problems span four overlapping layers: the **primary acute problem** (septic shock from pneumonia), **staging evolutions** that track progression on the same clinical identity (sepsis → severe sepsis → septic shock → septic shock with multi-organ dysfunction; KDIGO-1 → KDIGO-2 → KDIGO-3), **chronic / longitudinal problems** that shape interpretation and constrain therapy (CKD 3b, Type 2 DM, COPD, CHF with preserved EF), and **provisional candidates being worked up** (rule-out PE, rule-out meningitis). The clinical work the substrate must preserve is *not* "render the problem list alphabetically" — it is **"make every active problem auditable to its supporting evidence, make every intervention auditable to the problem it addresses, and make the absence of an intervention for an active high-priority problem itself a queryable safety state."** That is the difference between a problem list and a clinical safety graph.

## 2. Agent-native transposition

The legacy EHR collapses the problem list into a visually-sorted checklist with ICD-10 codes, severity icons, and a hidden maintenance workflow behind an apparently-mutable "current" column. In pi-chart the function becomes an **evidence-backed assessment graph**: each problem is an immutable clinical interpretation with required supporting evidence (invariant 5), a lifecycle-via-supersession model (ADR 002 `status_detail`), uncertainty expressed separately from lifecycle (FHIR-aligned `verification_status`), a reasoning trajectory (`course`), a scope dimension (current-encounter vs longitudinal vs historical-relevant), and downstream plans addressing it via `links.addresses`. The active problem set is a query over that graph, not stored truth.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Active inpatient problem-list row | `assessment.subtype = problem` with `data.status_detail = active` + `data.verification_status = confirmed` + `links.supports` to observations, vitals windows, labs, diagnostic results, artifacts, patient reports, or baseline observations | `activeProblems()`, `currentState(axis:"problems")`, `evidenceChain()` |
| Chronic comorbidity shaping this admission | `assessment.problem` with `data.scope = longitudinal` supported by import, patient report, prior labs, or baseline observations; re-asserted at admission via supersession of prior-encounter assertion | `currentState(axis:"problems")` (longitudinal filter), `evidenceChain()` |
| Rule-out / differential diagnosis | `assessment.subtype = differential` (existing, CLAIM-TYPES §2) for candidate-list reasoning snapshots; a candidate becomes `assessment.problem` with `verification_status = provisional` when it is **actively managed** (addressed by intents or needed for handoff) | `timeline()`, `openLoops()`, `evidenceChain()` |
| Problem staging (CKD 3b → CKD 4; sepsis → septic shock) | supersession chain of `assessment.problem` events for the **same problem identity**, each updating `data.stage`, `data.severity`, `data.course` | `evidenceChain()`, `timeline()` |
| "Resolved / Historical" section | supersession to `data.status_detail ∈ {resolved, inactive, ruled_out}` with required `data.resolution_datetime` + `data.resolution_reason` + `links.supports` to confirming evidence | `timeline(includeSuperseded: true)` |
| Admission reconciliation / daily rounds review / discharge reconciliation | `action.subtype = problem_review` — new subtype, parallel to A0b's `constraint_review` — records "reviewed, no change" OR "reviewed, updated to X" without requiring every rounds event to be a new assertion | `openLoops()`, `timeline()` |
| Progress-note A/P heading citing the problem | `communication` event (narrative) with `links.supports` citing the problem event id; narrative is render/synthesis, not a parallel problem-state source | `narrative()`, `evidenceChain()` |
| Orders / intents "for" a problem | `intent` events with `links.addresses → <current non-superseded problem event id>` per invariant 10 | `activeProblems()` with addressing rollup; `openLoops()` for orphan intents and unaddressed problems |
| Principal-diagnosis billing flag | derived from `data.priority = critical` + `data.problem_category = condition` + admitting-diagnosis linkage on A0a encounter; not stored | rendered only |

The load-bearing substrate claims: (a) every problem is an **interpretation** with required supporting evidence — invariant 5 is not a rule to work around, it's what makes the problem list defensible at rounds and auditable at QA; (b) **lifecycle and uncertainty are distinct fields** — a problem may be `status_detail = active` AND `verification_status = provisional` simultaneously ("actively managing the possibility of PE until CTA returns"), and each axis mutates independently; (c) **staging is supersession of the same problem identity**, not the creation of a second problem — CKD 3 → CKD 4 is one patient-durable identity expressed in two assertion events, with `evidenceChain()` walking both; (d) the `addresses` chain binds every intervention to the problem it exists to treat — intents without an addressing target are either screening / prophylaxis / protocol-standing (explicit exception, `data.indication_exception` required) or bugs; (e) differentials and problems are distinct subtypes with distinct semantic weight — a differential is a reasoning-at-a-moment snapshot; a problem is a durable interpretation; survivors of a differential promote via new problem events citing the differential as supports, **not via cross-subtype supersession**; (f) cross-encounter longitudinal problems re-assert at admission via a new problem event whose `links.supersedes` points at the prior-encounter assertion, carrying fresh `authorizing_person` and updated evidence — the substrate does not magically carry problems forward without a re-assertion event; (g) **nursing diagnoses (NANDA — skin integrity, fall risk, self-care deficit, ineffective airway clearance) are explicitly out of A0c scope** and belong to A8's nursing care plan to preserve the medical/nursing separation of accountability.

*Project owner to rewrite this section per charter §4.4 before Batch 0 calibration passes.*

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR 482.24(b)–(c) — medical record services.** The hospital record must be accurate, complete, retained, retrievable by diagnosis, and contain information sufficient to justify admission, support the diagnosis, and describe progress/response. **§482.24(c)(4)(i)** — H&P within 24h of admission. The H&P surfaces problems in narrative form; A0c events are the structured durable representation that `supports` the narrative.

2. **[regulatory] The Joint Commission PC.01.02.03 / AOP.1 — admission assessment.** Identification of physical, psychological, and social needs. Problems are the structured output. **RC.02.01.01** — medical-record content including diagnosis and progress.

3. **[regulatory] USCDI v4 (and forthcoming v6) — "Problems / Condition / Health Concerns" data class.** Condition code, name, category, `clinicalStatus` (active/inactive/resolved), `verificationStatus` (unconfirmed/provisional/differential/confirmed/refuted/entered-in-error), onset/diagnosis/resolution datetime, severity, body site, stage, author, provenance. A0c payload aligns to this data class structurally.

4. **[regulatory/professional] HL7 FHIR R5 `Condition` + US Core Condition Problems-and-Health-Concerns + US Core Condition Encounter-Diagnosis profiles.** **Load-bearing for this artifact:** FHIR separates `clinicalStatus` from `verificationStatus` rather than collapsing uncertainty into active/inactive. A0c preserves that distinction — `data.status_detail` is lifecycle, `data.verification_status` is epistemic, they mutate independently. `category` distinguishes problem-list-item vs encounter-diagnosis vs health-concern. `stage`, `evidence[]`, `bodySite`, `severity` all map structurally.

5. **[professional] ICD-10-CM** (administrative / billing primary, CMS-required for inpatient billing); **SNOMED CT** (clinical ontology primary, USCDI-preferred, carries laterality/severity/anatomic qualifiers); **LOINC** for some diagnostic problem codes (imaging-confirmed findings). `data.problem.codes[]` carries multi-ontology; `data.problem.display` is the human-readable anchor. Out-of-scope: HCC risk-adjustment, DRG assignment, POA indicator — billing-layer concerns per charter §9.

## 4. Clinical function

Problems are consumed at **rounds, handoff, intervention authorship, discharge planning, and every write requiring clinical indication.** Unlike A0b constraints (which gate every gated write), A0c problems are the *reasoning context* that makes those writes clinically defensible.

- **Attending / APP / resident-under-attestation** owns the problem list. Reviews at rounds; promotes differentials; stages chronic problems; marks resolutions/rule-outs; writes `problem_review` actions at admission/rounds/discharge. Every assertion carries `authorizing_person`. Owner of record.
- **Bedside RN** reads active problems for shift report, care-planning relevance, and monitoring intensity (CKD 3 → daily I&O; COPD → continuous SpO₂; delirium → qshift CAM-ICU). Does not author medical problems directly; authors observations that subsequently *support* problems (witnessed hypotension → lactate → septic-shock progression).
- **Consulting services** add specialty-specific problems with their role-specific `authorizing_person`; primary team may supersede/reconcile.
- **Pharmacist** reads problems for dose adjustment, contraindication assessment, and pharmacogenomics; may author drug-induced problems (vancomycin-associated AKI) with `source.kind = clinician_chart_action`.
- **Case manager / social work** consumes active chronic + scope-longitudinal problems for discharge planning; does not author problems.
- **pi-agent** reads `activeProblems()` for clinical context, cites problems via `links.supports` in assessments, and uses `links.addresses` when writing intents. V-PROB-07 enforces that every therapeutic intent either addresses an active problem or carries `data.indication_exception` for prophylactic / protocol / screening / maintenance intents.

Handoff trigger: *"What active problems changed this shift, what evidence supports the change, are any active orders still attached to resolved or ruled-out problems, and are any high-priority problems without addressing intents?"* — answered by `activeProblems()` + `openLoops()` filtered to `OL-PROBLEM-*`.

## 5. Who documents

Ownership is split by role and accountability.

- **Primary:** attending of record, APP, or resident-under-attestation for diagnostic/problem assertions. Attending owns accuracy.
- **Secondary:** consulting services for specialty problems (each with their `authorizing_person`); pharmacist for drug-induced problems; admitting clinician for initial problem reconciliation; discharging clinician for final-diagnosis reconciliation.
- **Importer authors:** `source.kind = synthea_import` / `mimic_iv_import` at chart initialization; imported problems require reconciliation before becoming active-for-this-encounter.
- **Patient/surrogate:** contributes history and self-reported conditions via `observation.patient_report`, which then *supports* a clinician-authored `assessment.problem` — patient statement alone is not a problem event.
- **Agent:** may author provisional problems (`verification_status = provisional`, `source.kind = agent_inference`) requiring human confirmation for anything above `priority = moderate`.
- **Explicitly excluded:** nursing diagnoses (NANDA) — these belong to A8's nursing care plan. Skin integrity, fall risk, ineffective airway clearance, and similar NANDA diagnoses are *not* A0c events. RN-authored problems that appear in A0c are medical observations later promoted to problems by the attending (witnessed fall → documented fall → "fall-related injury" problem authored by MD).
- **Sensitive-category documentation** (mental health, substance use disorder, HIV, reproductive health) follows institutional access-control policy; **42 CFR Part 2** applies specifically to SUD records and carries regulatory restrictions on disclosure. `[verify-with-nurse — scaffold; pi-chart's fine-grained access control for sensitive problem categories is project-owner scope and not modeled at the substrate layer in Phase A. Problems themselves are recorded like any other problem; access gating lives outside A0c.]`

Owner of record: attending of record for the problem's lifecycle; consulting attending for specialty-originated problems.

## 6. When / how often

Frequency class: **event-driven with admission, daily-rounds, handoff/transfer, and discharge reconciliation overlays. Write-triggered for intent authorship.**

- **Regulatory floor:** admission H&P within 24h (CFR 482.24(c)(4)(i)) includes problem identification.
- **Practice norm (ICU):** initial active problem set on admission/H&P; daily problem-oriented update at rounds; event-driven update after major diagnostic results, deterioration, new organ failure, source-control findings, consultant input, therapy de-escalation, or transitions of care; resolution/ruled-out update when an active plan no longer applies.
- **Divergence:** regulation requires problems to be *documented*; ICU practice demands them to be *addressed* — every active high-priority problem should have a corresponding active intent within priority-appropriate window `[verify-with-nurse — scaffold; specific window for OL-PROBLEM-04 is project-owner scope, likely 2–4h for critical priority and 24h for moderate]`.

**The strongest cadence is write-triggered:** before a new intent/action commits, the agent must know which active problem it addresses (or why no addressing target is appropriate). A review that confirms unchanged state produces an `action.subtype = problem_review`, not a new assertion. New `assessment.problem` events fire on assertion, staging/severity/course/priority change, resolution, refutation, or cross-encounter re-assertion.

## 7. Candidate data elements

Target: 17 included fields. Organized as **problem identity** + **lifecycle/epistemic state** + **trajectory/context** + **linkage**.

### Problem identity

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|---|
| 1 | `data.problem.display` | [clinical] | ✓ | string | Humans and agents cannot recognize the problem in handoff or narrative without a stable display phrase; codes alone are unreadable at bedside | MIMIC `d_icd_diagnoses.long_title`; Synthea; clinician_chart_action | high |
| 2 | `data.problem.codes[]` — array of `{system, code, display}` covering SNOMED CT (preferred), ICD-10-CM, LOINC where applicable | [regulatory][clinical] | ✓ | array | Cross-system identity, import reconciliation, duplicate detection, discharge/final-diagnosis reconciliation, and class-level queries all break. USCDI/FHIR preference is SNOMED; CMS billing requires ICD-10 | MIMIC `d_icd_diagnoses.icd_code`; Synthea emits SNOMED; USCDI-aligned | high |
| 3 | `data.problem.summary` | [clinical] | ✓ | string (1–3 sentences) | Brief display phrase cannot carry the clinical reasoning context (differential rationale, severity qualifiers, relevant history). Summary is the narrative anchor that `display` abbreviates | clinician_chart_action | med |
| 4 | `data.problem_category` | [clinical] | ✓ | enum {condition, syndrome, symptom, complication, health_concern, risk} per FHIR Condition category | A symptom ("dyspnea") and a confirmed diagnosis ("pneumonia") are managed differently; HAI/complication queries for quality reporting break; health-concern routing (SDOH) cannot filter. Complication category has regulatory importance for HAI/iatrogenic tracking | clinician_chart_action; derived | med |

### Lifecycle / epistemic state

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|---|
| 5 | `data.status_detail` (per ADR 002, registered for subtype `problem`) | [clinical] | ✓ | enum {active, resolved, inactive, ruled_out} | Lifecycle transitions impossible; `activeProblems()` cannot filter; resolved-vs-historical-vs-ruled-out distinctions collapse | clinician_chart_action | high |
| 6 | `data.verification_status` | [clinical][regulatory] | ✓ | enum {confirmed, provisional, differential, unconfirmed, refuted, entered_in_error} per FHIR | **Uncertainty and lifecycle are orthogonal** — a problem may be active-and-provisional. Without this field, high-risk therapy may proceed without diagnostic uncertainty visible. Parallels A0b's adoption of the FHIR-aligned `verification_status` vocabulary | clinician_chart_action; derived | high |
| 7 | `data.onset_at` + `data.onset_precision` | [clinical] | ✓ | timestamp + enum {year, month, day, hour} | Chronology collapses; acute-vs-chronic reasoning weakened; duration-sensitive management (sepsis timing, stroke window, MI timing) fails | clinician_chart_action; patient_statement; import | high |
| 8 | `data.resolution_datetime` + `data.resolution_reason` (conditional on `status_detail ∈ {resolved, inactive, ruled_out}`) | [clinical] | ✓ | timestamp + string | Silent resolution breaks audit; retrospective "was this active at T?" queries fail; orders still addressing silently-resolved problems go undetected | clinician_chart_action | high |

### Trajectory / clinical context

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|---|
| 9 | `data.acuity` | [clinical] | ✓ | enum {acute, chronic, acute_on_chronic, subacute} | AKI-on-CKD collapses to either AKI or CKD, losing the acute-on-chronic framing that changes interpretation; chronic-vs-acute staleness windows cannot calibrate | clinician_chart_action | high |
| 10 | `data.scope` | [clinical] | ✓ | enum {current_encounter, longitudinal, historical_relevant} | Encounter-scoped acute issues and lifelong comorbidities cannot be reconciled across admissions; discharge carry-forward becomes unsafe; "history of MI" (historical_relevant) indistinguishable from "active MI" | clinician_chart_action; derived from acuity + status | high |
| 11 | `data.course` | [clinical] | ✓ when active | enum {worsening, improving, stable, resolved, unknown} | Daily assessment cannot distinguish "active but improving" from "active and worsening"; de-escalation and escalation triggers fail; handoff compression fails | clinician_chart_action; derived | med |
| 12 | `data.severity` | [clinical] | ✓ | enum {mild, moderate, severe} or problem-specific scale | Clinical triage collapses; "pneumonia" with CURB-65 1 vs CURB-65 4 same shape; severity trajectory across supersession chain lost | clinician_chart_action | high |
| 13 | `data.priority` | [clinical][agent] | ✓ | enum {critical, high, moderate, low, historical} | OL-PROBLEM-04 windowing (critical → tight window; moderate → looser) cannot calibrate; rounds-ordering derivation loses its primary input | clinician_chart_action | med |
| 14 | `data.stage` (conditional on staging applicability) | [clinical] | ✓ | `{system: string, value: string, criteria?: string}` (e.g., `{system: "KDIGO", value: "G3b"}`; `{system: "Sepsis-3", value: "septic_shock", criteria: "hypotension requiring pressors, lactate >2 after volume"}`) | CKD staging supersession chains cannot carry stage; sepsis severity evolution untrackable; TNM/NYHA/CTCAE stages invisible | clinician_chart_action; consulting_specialty | high |
| 15 | `data.laterality` | [clinical] | ✓ when anatomic | enum {left, right, bilateral, n/a} | Wrong-sided procedures, contralateral injuries, bilateral-vs-unilateral pathology indistinguishable | clinician_chart_action; SNOMED laterality qualifier | med |
| 16 | `data.authorizing_person` | [regulatory] | ✓ | `{role: attending|app|resident|pharmacist|consultant|pi_agent, identity, authority_source}` | Accountability-of-record collapses; attestation audit fails for resident-authored problems; consulting-service attribution lost | A0a attending_of_record; note metadata | high |

### Linkage

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---|---|---|---|---|
| 17 | `data.problem_key` (lightweight stable identity key for duplicate detection + supersession threading) | [clinical][open-schema] | ✓ provisional | string (derivable from primary `problem.codes[].code` + first-assertion hash) | Duplicate-active detection (OL-PROBLEM-06) brittle; cross-encounter longitudinal threading requires walking supersession graphs through encounter boundaries; stable id enables O(1) identity queries. **Full longitudinal-thread primitive deferred to Phase B per ROADMAP;** `problem_key` is the v0.2 interim mechanism | derived; clinician override allowed | med |
| — | `data.parent_problem` (optional) | [clinical] | ✓ when hierarchy applies | event_id | Hierarchy ("septic shock secondary to pneumonia" — septic-shock problem has pneumonia problem as parent) cannot be expressed; cause-effect clinical reasoning invisible | clinician_chart_action | med |
| — | `data.differential_origin_ref` (optional, conditional on promotion from a differential) | [clinical][agent] | ✓ | event_id → `assessment.subtype = differential` | Workup-to-diagnosis provenance recoverable only via `evidenceChain` walking supports; explicit pointer clarifies promotion logic | derived from differential + supports | med |
| — | `data.diagnostic_basis[]` (optional, conditional on syndrome-level problems) | [clinical] | ✓ | array of short criteria labels (e.g., `["Sepsis-3: infection + SOFA≥2", "SIRS ≥2/4 with suspected infection"]`) | Sepsis, ARDS, AKI, delirium, shock claims are opaque; validator cannot distinguish evidence-backed syndrome from unsupported assertion (overlaps with `stage.criteria` — use `diagnostic_basis` when multiple criteria combine; use `stage` when single staging system applies) | clinician_chart_action; derived from A1/A2/A3/A8 | med |
| — | `links.supports` (required per invariant 5) | [clinical][regulatory] | ✓ | `EvidenceRef[]` | Problem without evidence is invariant-5 error and clinically sloppy; `evidenceChain(problem_id)` is what makes the problem rounds-auditable and QA-defensible | A1/A2/A3/A6/A7/A8 | high |

Not included as separate fields (derived or excluded): `problem_id_sequence_number` (rendered), `principal_diagnosis_flag` (derived from priority + admitting-diagnosis), `poa_indicator` (billing), `icd10_primary` (redundant with `problem.codes[]`), `problem_icon_key` (rendered), `billing_chronicity` (distinct in some EHRs; we use only clinical acuity), `reasoned_asOf` (optional; appears in payload only for back-charted assessments per ADR 004), `managing_service` / `problem_owner` (optional; derivable from `authorizing_person` in most cases).

## 8. Excluded cruft — with rationale

| Field | Why it exists in current EHRs | Why pi-chart excludes it |
|---|---|---|
| **Problem-list display order / row number** | Legacy UI layout — problems rendered in fixed-order lists. | Derived from `priority` + `acuity` + `recorded_at`. Stored position introduces drift and maintenance burden. |
| **ICD-10-CM as sole problem identity** | Billing / DRG / quality reporting. | ICD-10 alone lacks clinical granularity, laterality nuance, and uncertainty semantics. `data.problem.codes[]` carries ICD + SNOMED + LOINC plurally. |
| **Principal diagnosis / DRG / reimbursement weight** | CMS DRG billing: exactly one "principal" diagnosis drives DRG assignment. | Billing concern (charter §9). Derivable from `priority = critical` + admitting-diagnosis linkage on A0a if ever needed. |
| **Present-on-admission (POA) indicator as core problem state** | CMS HAC payment-adjustment logic. | Derivable from `onset_at` vs `admit_datetime`. Substrate should not be shaped by payment methodology. |
| **Generic "problem comments" free-text blob** | Workaround for rigid problem-row schemas. | Unstructured comments hide severity/stage/course from `activeProblems()`. Caveats live in a bounded `data.interpretation` field or as `communication` events with `links.supports`. |
| **Copy-forward A/P note headings without fresh evidence** | Note-efficiency and billing documentation habits. | A copied heading is not a new problem assessment unless it cites fresh evidence or records no-change review. Pure copy-forward is exactly what `action.problem_review` replaces — a lightweight affirmation with scope explicit. |
| **"Last edited by / last edited at" fields on the problem row** | Audit trail / UI history. | Envelope `author`, `recorded_at`, `source`, and `links.supersedes` already carry full provenance. Dedicated fields duplicate and risk drift. |
| **Mutable `active / resolved / inactive` dropdown** | Legacy list maintenance UX. | Lifecycle is explicit supersession with rationale and evidence; mutable flag violates invariant 2 (append-only) and erases history. |
| **Nursing diagnoses mixed with medical problems** | Some legacy EHRs conflate NANDA + medical; many already separate. | A8 scope explicitly. Mixing erases accountability-of-record distinctions, violates split-ownership discipline. |
| **Private provider-specific problem-list copies** | Specialty workflow and note templates. | Competing claims preserved as events with provenance; divergent mutable lists defeat auditability. |

## 9. Canonical / derived / rendered

- **Canonical** (claim stream): `assessment.subtype = problem` events for assertions / stagings / resolutions / ruled-out transitions; `assessment.subtype = differential` events for candidate-listing reasoning snapshots; `action.subtype = problem_review` events for admission / daily-rounds / handoff / discharge reconciliation recording reviewed-without-change or reviewed-with-update outcomes; `communication` events for problem-oriented progress notes and goals-of-care discussions; supersession/correction links; `links.supports` chains terminating in observations / vitals intervals / artifacts / notes.
- **Derived** (view primitives): `activeProblems(scope, asOf?)` — convenience alias for `currentState(axis:"problems")` returning non-superseded problems with `status_detail = active`, filtered by `scope` for longitudinal vs encounter-scoped rendering; `currentState(axis:"problems")` per DESIGN §4.3; `openLoops()` filtered to OL-PROBLEM-01…09; `evidenceChain(problem_id)` for clinical-reasoning audit; `timeline(subtypes:["problem", "differential"], includeSuperseded:true)` for staging history and rule-outs; optional `problemStagingChain(problem_key)` convenience walking supersession by stable identity.
- **Rendered** (UI-only): problem-list rendering order (derived from `priority` + `acuity` + recency); severity icons; acuity badges; stage rendering ("CKD 4" from `codes[]` + `stage`); resolved-problem strikethrough; collapsed historical section; "primary" star on the admitting-diagnosis-linked problem; problem chips; SOAP A/P headings; disease-specific icons. **No canonical `problems.md` structural file** — unlike A0b's `constraints.md` cache, the active problem list is cheap enough to derive on demand that caching is a `_derived/problems.md` convenience for grep and never authoritative.

## 10. Provenance and lifecycle

### Provenance
- Sources of truth: clinician-authored (primary), imported from prior records, derived from differential + workup resolution, consulting-specialty-authored, agent-proposed (with `verification_status = provisional` pending human confirmation for non-provisional use).
- `source.kind` values from DESIGN §1.1: `clinician_chart_action` (attending-authored primary), `admission_intake`, `synthea_import`, `mimic_iv_import`, `agent_inference`, `agent_synthesis`, `agent_review`, `protocol_standing_order` (rare — consulting standing), `dictation_system` (consultant notes via transcription), `pacs_interface` (imaging-confirmed findings promoting differential candidates). Patient-reported history at intake becomes `source.kind = patient_statement` for the *supporting observation*; the `assessment.problem` that promotes that observation carries `clinician_chart_action` or `admission_intake`.

### Lifecycle
- **Created by:** `assessment.subtype = problem` event, supported (invariant 5) by at least one `observation`, `artifact_ref`, or vitals interval ref. Differential-promoted problems additionally cite the differential via `data.differential_origin_ref` + `links.supports`.
- **Updated by:** supersession — a new `assessment.problem` event with revised payload (severity / stage / course / priority / verification_status change, cross-encounter re-assertion) and `links.supersedes: [prior_event_id]`. **Staging supersedes the same problem identity** (CKD 3 → CKD 4 is two events in one chain); `problem_key` persists; `evidenceChain()` walks both.
- **Reviewed without change:** `action.subtype = problem_review` event with `data.review_scope ∈ {admission, rounds, handoff, transfer, discharge}`, `data.result ∈ {no_change, updated, unable_to_verify}`, and `data.reviewed_problem_ids[]` citing the problems reviewed. Closes missingness / staleness openLoops without requiring new assertion events.
- **Resolved by:** supersession to `data.status_detail = resolved` with required `data.resolution_datetime` + `data.resolution_reason` + `links.supports` to confirming evidence. Opens OL-PROBLEM-08 (cleanup of addressing intents) until superseded-problem's active intents are discontinued or retargeted.
- **Inactive (historical):** supersession to `data.status_detail = inactive` for problems that persist as historical fact without active management (old fracture, history of MI years ago). Inactive historical-relevant problems remain in `currentState(axis:"problems")` under the `scope = historical_relevant` filter because they still shape risk interpretation.
- **Ruled out:** supersession to `data.status_detail = ruled_out` with `links.supports` pointing at the refuting observation (CTA-negative ruling out PE). `data.verification_status` typically transitions provisional → refuted in the same event.
- **Cross-encounter re-assertion:** at admission, longitudinal problems re-assert via new `assessment.problem` events with `data.scope = longitudinal`, `data.cross_encounter_persistence` implied, `links.supersedes: [prior-encounter event_id]`, and fresh `authorizing_person`. The substrate does not carry problems forward without a re-assertion event (V-PROB-06).
- **Superseded / corrected:** `links.supersedes` for legitimate lifecycle change; `links.corrects` for wrong-patient, wrong-code, duplicate import, or entered-in-error.
- **Stale when:** acute active problem without `supports`-adding event or rounds `problem_review` in 72h; chronic/longitudinal problem in 30 days; provisional problem without resolution in 24–72h `[verify-with-nurse — scaffold; specific windows project-owner to finalize per acuity]`.
- **Closes the loop when:** a new `intent.links.addresses → <problem_event_id>` fires (OL-PROBLEM-05 closes); or problem supersedes to resolved/ruled-out (OL-PROBLEM-03 closes); or supports evidence added (OL-PROBLEM-02 closes); or `problem_review` event confirms review (OL-PROBLEM-01/03 close depending on scope).

### Contradictions and reconciliation
- Active "septic shock" with no hypotension/pressor/lactate/infection evidence in current window → **warn**; require problem review or downgrade to provisional / ruled-out via supersession.
- Active "pneumonia" and active "pulmonary edema" both explaining hypoxemia → **preserve both** if both have evidence; require differential or plan clarity when orders conflict.
- Imported CKD 3 with admission eGFR normal and no prior evidence → **preserve both, mark imported unconfirmed**; OL-PROBLEM-09 until reconciled.
- Problem resolved but active addressing intents remain → **OL-PROBLEM-08 opens**; resolution is allowed but addressing intents must be discontinued or retargeted within policy window.
- CT rules out PE but provisional-PE problem remains active and heparin intent continues → **require review**; supersede to ruled_out + discontinue or retarget the heparin intent.
- Two active diabetes problems with different codes but same clinical target → **warn** via `problem_key` duplicate detection; require merge supersession (OL-PROBLEM-06).
- Consultant-asserted diagnosis disputed by primary team → **preserve both**; author/source provenance and evidence chains decide downstream application until review resolves.
- Sensitive-category problems → access control external to substrate; conflicts resolved per institutional policy.

## 11. Missingness / staleness

- **OL-PROBLEM-01 — admission problem set missing.** No `assessment.problem` or `action.problem_review` for the admitting diagnosis / working ICU problems within the admission / H&P window. Violates CFR 482.24(c)(4)(i) spirit; weakens all downstream indication logic. Severity: high.
- **OL-PROBLEM-02 — active problem lacks admissible support.** Active problem with no `links.supports` item resolving to observation / artifact / vitals EvidenceRef. V-PROB-01 catches at write time; OL re-opens on subsequent supersession that silently drops supports. Severity: high (validator error in most cases).
- **OL-PROBLEM-03 — active problem stale.** Acute problem without fresh supports or rounds `problem_review` in 72h; chronic/longitudinal in 30d; provisional in 24–72h `[verify-with-nurse]`. Severity: medium.
- **OL-PROBLEM-04 — orphan high-risk evidence (unreacted deterioration).** Critical lab / result / vital-sign deterioration exists and has been reviewed (`action.result_review` from A2 fired), but no active problem assessment incorporates it AND no explicit "no-new-problem" `problem_review` records a decision. Surfaces the "the lactate is 6 but no one has said what it means" failure mode. Severity: high for critical-priority evidence.
- **OL-PROBLEM-05 — orphan clinical intent (diagnosed but untreated, or treated without diagnosis).** Two sub-failures: (a) active problem with `priority ∈ {critical, high}` has no active addressing intent within priority-appropriate window — *the load-bearing A0c loop;* (b) active medication / procedure / monitoring / consult / therapy intent without `links.addresses` to an active problem or parent care plan, and no `data.indication_exception` for screening/prophylaxis/protocol-standing. Severity: high-to-critical.
- **OL-PROBLEM-06 — duplicate / conflicting active problems.** Two active non-superseded `assessment.problem` events share `problem_key` or any `problem.codes[]` entry. Requires merge/supersession. Severity: low-to-medium.
- **OL-PROBLEM-07 — provisional problem driving high-risk therapy.** A problem with `verification_status ∈ {provisional, differential, unconfirmed}` is addressed by high-risk anticoagulation / antibiotics / surgery / thrombolysis / transfusion / invasive-procedure intent without a recent `problem_review` or certainty update. Uncertainty-propagation guard. Severity: high.
- **OL-PROBLEM-08 — resolution without plan cleanup.** Problem marked `resolved` / `ruled_out` but active addressing intents remain. Prompts retargeting or discontinuation. Severity: medium.
- **OL-PROBLEM-09 — chronic care-shaping problem unreconciled at admission.** CKD / DM / COPD / CHF / anticoagulation-indication / immunosuppression / pregnancy / cirrhosis / seizure disorder / transplant status imported or reported but not reconciled this encounter (no `problem_review` or current-encounter-scoped supports added). Severity: medium.
- **OL-PROBLEM-10 — discharge final-diagnosis not reconciled.** At `action.encounter_discharged` (or death / transfer), final-diagnosis candidates have no mapping to active/resolved problem events, or unresolved problems remain without disposition. Severity: medium.

Not openLoop-worthy: environmental/incidental historical problems with no current relevance; cleanly resolved problems; refuted differentials; low-priority problems addressed adequately. **Missingness is not automatically harmful** — a patient without a "problem list reviewed" event is not unsafe if no current write depends on it and no rounds/admission review is due; missingness becomes harmful when it blocks indication, evidence synthesis, handoff, or plan closure.

Naming pattern parallels A0a's `OL-IDENTITY-*` and A0b's `OL-CONSTRAINT-*` families.

## 12. Agent read-before-write context

Before writing or modifying **any problem assertion**:

1. `readPatientContext(scope)` — subject, active encounter, baseline attributes (A0a) that shape problem interpretation, admitting diagnosis, current location/service.
2. `currentState(axis:"problems")` / `activeProblems(scope, asOf)` — existing active, resolved-recent, and longitudinal-relevant problems; prevents duplicate assertions (OL-PROBLEM-06).
3. `readActiveConstraints()` (A0b) — constraints may shape problem interpretation (pregnancy status, known allergies supporting drug-reaction problem assertions, code status supporting terminal-illness framing).
4. `timeline(types:["observation", "assessment", "artifact_ref", "communication"], subtypes:["lab_result", "diagnostic_result", "vital_sign", "differential", "exam_finding", "patient_report"], window:<encounter>)` — evidence available to support the new problem (invariant 5 requirement).
5. `trend()` for problem-relevant metrics — lactate/MAP for shock, creatinine/urine-output for AKI, SpO₂/FiO₂ for respiratory failure, CAM-ICU/RASS for delirium.
6. `evidenceChain(prior_problem_id)` when superseding — confirm the staging/resolution logic rests on fresh evidence.
7. `openLoops(filter:{domain:"problems"})` — check unsupported/stale/orphan loops before writing against them.

Before writing an **intent that addresses a problem**:

8. `activeProblems(scope)` — confirm the target problem is still active and non-superseded at the time of intent authoring.
9. `openLoops(filter:{domain:"problems"})` — avoid duplicate interventions; parallel therapy may be legitimate but warrants warning.
10. For prophylactic / screening / protocol-standing intents with no addressing target: populate `data.indication_exception` explaining the non-addressing purpose (VTE prophylaxis on every ICU admit; scheduled screening labs; skin bundle).

Before **resolving or ruling out** a problem:

11. Read active addressing intents — each must be discontinued, retargeted, or justified-to-remain before OL-PROBLEM-08 closes.

**Write-side rules.** New problem assertions carry `links.supports` to at least one observation/artifact/vitals interval per invariant 5. Staging supersessions carry `links.supersedes` to the prior event and fresh `links.supports` justifying the stage change. New addressing intents carry `links.addresses` to the **current non-superseded** event in the problem's supersession chain — *never* to a superseded-by-staging ancestor. V-PROB-07 enforces; the addresses chain always points at the latest active event.

## 13. Related artifacts

A0c is the second-most-read structural artifact after A0a, and load-bearing for every downstream `addresses` chain.

- **A0a (patient/encounter)** — problems scoped by `subject`; longitudinal problems persist across encounters via explicit re-assertion; `admitting_diagnosis` links to primary active problem at admission; baseline attributes (A0a) shape problem interpretation (baseline Cr → AKI staging; baseline cognition → delirium detection).
- **A0b (constraints)** — constraints sometimes derive clinical rationale from problems (pregnancy → medication-category constraint; severe-reaction history supporting allergy); the direction is constraint `links.supports` problem, not the reverse. Derived "contraindications-from-problems" (renal-dose adjustments, pregnancy-category adjustments) are CDS territory, explicitly excluded per EXECUTION §1, and are *not* modeled as A0c events.
- **A1 (labs)** — lab results are primary evidence in `links.supports` for most medical problems; AKI staging rests on creatinine trends, septic shock on lactate, DKA on anion gap.
- **A2 (results review)** — imaging and diagnostic results supply `supports` for imaging-confirmed problems; result reviews may promote differentials to problems or establish ruled-out states.
- **A3 (vitals)** — vital-sign observations and intervals support many problems; `vitals://` URIs are frequent `supports` entries.
- **A4 (MAR)** — medication administrations fulfill intents that *address* problems; full chain is problem → intent (`addresses`) → action (`fulfills`).
- **A4b (medication reconciliation)** — home-med discrepancies sometimes reveal undocumented chronic problems (warfarin → "history of DVT" or "atrial fibrillation").
- **A5 (I&O + LDAs)** — line-associated problems (CLABSI, line dysfunction) address A5 events; device-related complications surface here.
- **A6 (provider notes)** — progress notes clinically reason problems; the H&P is the origin narrative for the admission problem set; daily SOAP notes `supports` problem re-assertions and stage updates.
- **A7 (nursing notes)** — bedside changes, escalation notes, witnessed events support problem evolution.
- **A8 (nursing assessment)** — head-to-toe findings generate evidence for medical problems AND author parallel nursing diagnoses (explicitly distinct from A0c).
- **A9a / A9b (orders / ordersets)** — every therapeutic order/orderset-invocation intent addresses a problem or carries `data.indication_exception`. Ordersets are especially dangerous when their default indications don't match active problems.

The inverse dependency: A0c problems are targets that A0b constraints reference, A1/A2 evidence chains terminate in, A4/A5/A9 intents address, and A6/A7 notes document.

## 14. Proposed pi-chart slot shape

### Event types + subtypes
- **Existing:** `assessment.subtype = problem` (CLAIM-TYPES §2). Payload extends with fields §7.
- **Existing:** `assessment.subtype = differential` — remains distinct; reasoning-moment snapshots; survivors promote via new problem events citing the differential as supports.
- **Existing → new subtype:** `action.subtype = problem_review` — review/reconciliation action that can close problem missingness or staleness without asserting a changed problem. Parallel to A0b's `action.constraint_review`. **`schema_impact: new subtype`**.

### Payload shape

```jsonc
// Primary acute problem at admission — community-acquired pneumonia, right lower lobe
{
  "id": "evt_20260418T030500_11",
  "type": "assessment",
  "subtype": "problem",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_at": "2026-04-18T03:05:00Z",
  "recorded_at": "2026-04-18T03:06:12Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "admission_hp" },
  "certainty": "inferred",
  "status": "active",
  "data": {
    "problem": {
      "display": "Community-acquired pneumonia, right lower lobe",
      "codes": [
        { "system": "SNOMED CT",  "code": "385093006", "display": "Community-acquired pneumonia" },
        { "system": "ICD-10-CM",  "code": "J18.1",     "display": "Lobar pneumonia, unspecified organism" }
      ],
      "summary": "Productive cough, fever 38.9°C, rigors x24h; RLL consolidation on portable CXR; leukocytosis 18.2; early sepsis physiology. Awaiting sputum culture + blood cultures."
    },
    "problem_category": "condition",
    "problem_key": "pneumonia::pi-patient-00423::enc-00423-001::1",
    "status_detail": "active",
    "verification_status": "confirmed",
    "onset_at": "2026-04-16T00:00:00Z",
    "onset_precision": "day",
    "acuity": "acute",
    "scope": "current_encounter",
    "course": "worsening",
    "severity": "severe",
    "priority": "critical",
    "laterality": "right",
    "authorizing_person": { "role": "attending", "id": "dr-chen-b" }
  },
  "links": {
    "supports": [
      "evt_20260418T025500_01",                        // CXR diagnostic_result (A2)
      "evt_20260418T023000_02",                        // sputum culture lab_result (A1, preliminary)
      { "kind": "vitals", "metric": "temperature", "from": "2026-04-17T18:00:00Z", "to": "2026-04-18T03:00:00Z" },
      "evt_20260418T024500_07"                         // patient-reported productive cough
    ]
  }
}

// Chronic longitudinal problem re-asserted at admission — CKD 3b
{
  "id": "evt_20260418T031000_12",
  "type": "assessment",
  "subtype": "problem",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_at": "2026-04-18T03:10:00Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "admission_hp" },
  "certainty": "inferred",
  "status": "active",
  "data": {
    "problem": {
      "display": "Chronic kidney disease, stage 3b",
      "codes": [
        { "system": "SNOMED CT", "code": "700379002", "display": "Chronic kidney disease stage 3B" },
        { "system": "ICD-10-CM", "code": "N18.32",    "display": "Chronic kidney disease, stage 3b" }
      ],
      "summary": "Baseline Cr 1.4 (eGFR 38), sustained x2y. No proteinuria on prior UA. Diabetic nephropathy suspected primary driver. No prior nephrology involvement."
    },
    "problem_category": "condition",
    "problem_key": "ckd::pi-patient-00423::longitudinal",  // longitudinal threading across encounters
    "status_detail": "active",
    "verification_status": "confirmed",
    "onset_at": "2022-01-01T00:00:00Z",
    "onset_precision": "year",
    "acuity": "chronic",
    "scope": "longitudinal",
    "course": "stable",
    "severity": "moderate",
    "priority": "moderate",
    "stage": { "system": "KDIGO", "value": "G3b", "criteria": "eGFR 30–44 sustained x≥3 months" },
    "authorizing_person": { "role": "attending", "id": "dr-chen-b" }
  },
  "links": {
    "supersedes": ["evt_prior_encounter_ckd3b_longitudinal"],  // cross-encounter re-assertion
    "supports": [
      "evt_baseline_cr_2026_a0a",
      { "kind": "vitals", "metric": "creatinine", "from": "2024-01-01T00:00:00Z", "to": "2026-04-18T03:00:00Z" }
    ]
  }
}

// Staging supersession — pneumonia → septic shock from pneumonia (same identity evolving)
{
  "id": "evt_20260418T073000_21",
  "type": "assessment",
  "subtype": "problem",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_at": "2026-04-18T07:30:00Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "progress_note" },
  "certainty": "inferred",
  "status": "active",
  "data": {
    "problem": {
      "display": "Septic shock secondary to community-acquired pneumonia",
      "codes": [
        { "system": "SNOMED CT", "code": "76571007", "display": "Septic shock" },
        { "system": "ICD-10-CM", "code": "R65.21",   "display": "Severe sepsis with septic shock" },
        { "system": "ICD-10-CM", "code": "A41.9",    "display": "Sepsis, unspecified organism" }
      ],
      "summary": "Hypotension requiring norepinephrine 0.12 mcg/kg/min despite 30 mL/kg crystalloid; lactate 4.2 → 3.8; MAP 58–62; source: pulmonary."
    },
    "problem_category": "syndrome",
    "problem_key": "pneumonia::pi-patient-00423::enc-00423-001::1",  // same key as the earlier pneumonia assertion — same identity evolving
    "parent_problem": null,
    "status_detail": "active",
    "verification_status": "confirmed",
    "acuity": "acute",
    "scope": "current_encounter",
    "course": "worsening",
    "severity": "severe",
    "priority": "critical",
    "stage": { "system": "Sepsis-3", "value": "septic_shock", "criteria": "hypotension requiring pressors + lactate >2 after adequate volume" },
    "diagnostic_basis": ["Sepsis-3 criteria met: suspected infection + SOFA ≥2", "Septic shock: persistent hypotension requiring vasopressors to maintain MAP ≥65 after adequate fluid resuscitation, and lactate >2 mmol/L"],
    "authorizing_person": { "role": "attending", "id": "dr-chen-b" }
  },
  "links": {
    "supersedes": ["evt_20260418T030500_11"],           // same identity — pneumonia problem evolving
    "supports": [
      { "kind": "vitals", "metric": "MAP", "from": "2026-04-18T06:00:00Z", "to": "2026-04-18T07:30:00Z" },
      "evt_20260418T072500_15",                         // lactate lab_result
      "evt_20260418T070000_18"                          // pressor initiation action
    ]
  }
}

// Provisional problem from differential — rule-out PE being worked up
{
  "id": "evt_20260418T040000_30",
  "type": "assessment",
  "subtype": "problem",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_at": "2026-04-18T04:00:00Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "inferred",
  "status": "active",
  "data": {
    "problem": {
      "display": "Rule out pulmonary embolism",
      "codes": [
        { "system": "SNOMED CT", "code": "59282003", "display": "Pulmonary embolism (disorder)" }
      ],
      "summary": "Acute hypoxemia disproportionate to pneumonia extent; tachycardia 118; unilateral leg swelling. Wells score 5. CTA pending."
    },
    "problem_category": "condition",
    "problem_key": "pe::pi-patient-00423::enc-00423-001::1",
    "status_detail": "active",
    "verification_status": "provisional",               // lifecycle active + epistemic provisional, independently
    "acuity": "acute",
    "scope": "current_encounter",
    "course": "unknown",
    "priority": "high",
    "differential_origin_ref": "evt_20260418T034500_28",
    "authorizing_person": { "role": "attending", "id": "dr-chen-b" }
  },
  "links": {
    "supports": [
      "evt_20260418T034500_28",                         // the differential assessment
      { "kind": "vitals", "metric": "spo2", "from": "2026-04-18T02:00:00Z", "to": "2026-04-18T03:45:00Z" }
    ]
  }
}

// Problem review at admission — closes OL-PROBLEM-01 + OL-PROBLEM-09
{
  "id": "evt_20260418T031500_14",
  "type": "action",
  "subtype": "problem_review",
  "subject": "pi-patient-00423",
  "encounter_id": "enc-00423-001",
  "effective_at": "2026-04-18T03:15:00Z",
  "recorded_at": "2026-04-18T03:16:00Z",
  "author": { "id": "dr-chen-b", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "admission_hp" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "review_scope": "admission",
    "result": "updated",
    "reviewed_problem_ids": [
      "evt_20260418T030500_11",                         // pneumonia
      "evt_20260418T031000_12",                         // CKD 3b
      "evt_20260418T031200_13",                         // Type 2 DM (longitudinal re-assertion, not shown)
      "evt_20260418T040000_30"                          // rule-out PE
    ],
    "reconciliation_notes": "Imported outside-record 'mild CHF' not carried forward — no recent echo or functional limitation; will re-evaluate if clinical evolution suggests."
  }
}
```

### Link conventions
- `supports` (required per invariant 5): points at observations / vitals intervals / artifacts / notes constituting clinical evidence. V-PROB-01 enforces at least one non-note entry for new assertions.
- `supersedes`: staging, severity/course/priority/verification-status change, resolution, ruling-out, cross-encounter re-assertion. V-PROB-05 enforces temporal monotonicity.
- `corrects`: wrong-patient, wrong-code, duplicate import, entered-in-error.
- `fulfills`: **not used** on problems (problems are not intents; invariant 10).
- `addresses` (inbound from intents): per invariant 10, intent `addresses` targets must be problem-subtype assessments or intents. V-PROB-07 enforces that the target is the current non-superseded event in the supersession chain.

### Evidence addressability
- `event id` for assertions, stagings, resolutions, differentials, reviews.
- `note id` / `section ref` for progress-note citations.
- `artifact id` + `section ref` for imaging-confirmed problems (CT impression section).
- `vitals://` URIs for trend-supported problems (shock ← MAP trend; AKI ← creatinine trend).

### Storage placement
- `events.ndjson` for all `assessment.subtype = problem`, `assessment.subtype = differential`, and `action.subtype = problem_review` events.
- No canonical structural file; `_derived/problems.md` may be regenerated for grep convenience but is explicitly disposable.

### Frequency class
Event-driven with admission / daily-rounds / handoff / transfer / discharge reconciliation overlays; write-triggered for intent authoring.

### View consumers
- `activeProblems()` / `currentState(axis:"problems")` — primary consumers.
- `timeline(subtypes:["problem", "differential"])` — problem-list history including ruled-out candidates and staging.
- `evidenceChain(problem_id)` — clinical-reasoning audit.
- `openLoops()` — OL-PROBLEM-01…10.
- `narrative()` — problem citations in notes.
- `trend()` — not a direct problem-consumer; used transitively via `vitals://` support resolution.

### Schema confidence + schema impact
- `assessment.subtype = problem` with payload extensions (nested `data.problem`, `verification_status`, `acuity`, `scope`, `course`, `stage`, `laterality`, `priority`, `problem_key`, `problem_category`, `differential_origin_ref`, `parent_problem`, `diagnostic_basis[]`): **schema_confidence: high**, **schema_impact: new payload shape**. Rests on existing subtype + existing `status_detail` enum per ADR 002; adds payload fields.
- `action.subtype = problem_review`: **schema_confidence: medium-high**, **schema_impact: new subtype**. Parallels A0b's `constraint_review`.
- `problem_key` for stable identity + cross-encounter supersession threading: **schema_confidence: medium** (full longitudinal-thread primitive deferred to Phase B per ROADMAP). **schema_impact: new payload shape**.
- V-PROB-07 addressing the current non-superseded event: **schema_confidence: high**, **schema_impact: new validator rule** only (existing grammar).

## 15. Validator and fixture implications

**Validator rules:**

- **V-PROB-01** (invariant 5 specialization) — `assessment.subtype = problem` MUST carry `data.problem.display` OR `data.problem.codes[]`, `data.status_detail`, `data.verification_status`, `data.acuity`, `data.scope`, AND at least one entry in `links.supports` resolving to `observation` / `artifact_ref` / vitals EvidenceRef. Note-only supports chain is invalid.
- **V-PROB-02** — `data.status_detail = resolved` MUST carry `data.resolution_datetime` + `data.resolution_reason` (non-empty) + `links.supports` including the resolution evidence. Silent resolution is a validator error.
- **V-PROB-03** — `data.status_detail = ruled_out` MUST carry `links.supports` including at least one refuting observation (typically a negative diagnostic result) + `data.resolution_reason` describing the refutation.
- **V-PROB-04** — `data.acuity` MUST be in `{acute, chronic, acute_on_chronic, subacute}`; `data.verification_status` in `{confirmed, provisional, differential, unconfirmed, refuted, entered_in_error}`; `data.scope` in `{current_encounter, longitudinal, historical_relevant}`.
- **V-PROB-05** — problem supersession chain MUST be temporally monotonic (`effective_at(new) ≥ effective_at(prior)`); no circular supersession (invariant 8 specialization).
- **V-PROB-06** — cross-encounter re-assertion MUST carry `links.supersedes` pointing at a problem event in a prior encounter belonging to the same `subject`, AND `data.scope = longitudinal`, AND matching `problem_key` when present. A longitudinal problem appearing in a new encounter without the supersedes link is either a first-diagnosis (should not be scope=longitudinal) OR a missing-link bug — validator warns.
- **V-PROB-07** (cross-artifact with A9a/A4/A5) — any `intent.links.addresses` pointing at an `assessment.problem` target MUST point at the **current non-superseded** event in that problem's supersession chain at the time of intent writing. Addressing a superseded ancestor is a validator error.
- **V-PROB-08** — new `intent` or `action` with `links.addresses → <problem_event_id>` MUST NOT target a problem whose latest status is `resolved`, `inactive`, or `ruled_out`, unless the write is itself a `problem_review`, `discontinue`, `follow_up`, or carries `data.indication_exception`.
- **V-PROB-09** — `action.subtype = problem_review` MUST carry `data.review_scope ∈ {admission, rounds, handoff, transfer, discharge, other}`, `data.result ∈ {no_change, updated, unable_to_verify}`, AND `data.reviewed_problem_ids[]` (non-empty) OR a documented reason the active set could not be reviewed.
- **V-PROB-10** — high-risk intents (anticoagulation, antibiotics for suspected infection, thrombolysis, transfusion, invasive procedure) addressing a problem with `verification_status ∈ {provisional, differential, unconfirmed}` SHOULD require a recent `problem_review` or explicit uncertainty rationale in the intent's `data.rationale_text`. OL-PROBLEM-07 fires otherwise.
- **V-PROB-11** — imported problem claims (`source.kind ∈ {synthea_import, mimic_iv_import}`) entering the chart carry `verification_status = unconfirmed` by default; they require a current-encounter `problem_review` or supporting local evidence before transitioning to `verification_status = confirmed` and counting as active for the current encounter.

**Minimal fixture set (7 scenarios, MICU septic-shock-from-pneumonia aligned, shared `pi-patient-00423` / `enc-00423-001` with A0a/A0b):**

1. **Admission problem set with reconciliation review.** H&P writes 4 problems: (a) community-acquired pneumonia (acute, severe, critical priority, `verification_status = confirmed`, supports = CXR + sputum + fever trend + cough report); (b) CKD 3b (chronic, longitudinal, cross-encounter re-assertion via `supersedes`); (c) Type 2 DM (chronic, longitudinal); (d) rule-out PE (acute, high priority, `verification_status = provisional`). An `action.problem_review` at admission reconciles these 4 + a prior-encounter "mild CHF" marked not-carried-forward. Validates V-PROB-01/04/06/09.

2. **Staging supersession — pneumonia → septic shock from pneumonia.** At T+4.5h, hypotension + elevated lactate + pressor initiation prompt a new assertion with updated `display`, expanded `codes[]`, `stage = {Sepsis-3, septic_shock}`, `course = worsening`, `priority = critical`, same `problem_key`. Supersedes prior pneumonia assertion. Exercises V-PROB-05 + same-identity-supersession.

3. **Differential → provisional problem → resolution flow.** Differential at T+3.5h listed PE among candidates. Provisional PE problem written at T+4h with `verification_status = provisional`. CTA result at T+9h negative → new assertion with `status_detail = ruled_out`, `verification_status = refuted`, `resolution_reason`, supports to the CTA. Original differential event remains in timeline unsuperseded. Validates V-PROB-03 and differential-origin-ref pattern.

4. **V-PROB-07 enforcement — addresses chain after staging.** At T+1h, critical pneumonia problem has no addressing intent. Agent attempts to write antibiotic intent `links.addresses → <pneumonia-event-id>`. By T+4.5h, pneumonia has been superseded by septic-shock-from-pneumonia. If agent's intent still references the superseded pneumonia event_id, V-PROB-07 rejects; agent re-resolves to current non-superseded event and resubmits. Validates cross-artifact integrity.

5. **OL-PROBLEM-05 — diagnosed but untreated.** At admission, 4 problems written; for 3h no addressing intent for critical-priority pneumonia. OL-PROBLEM-05 (a) fires. When cefepime intent (with override for PCN allergy per A0b V-CON-01) is written with `links.addresses`, loop closes. Exercises priority-windowed openLoop and cross-artifact A0b/A0c/A9a interaction.

6. **OL-PROBLEM-07 — provisional problem driving high-risk therapy.** Provisional PE problem (`verification_status = provisional`) + heparin intent addressing it. Without an updated `problem_review` or supporting CTA result, OL-PROBLEM-07 fires; either the CTA result resolves to confirmed (close the loop) or to ruled-out (both intent and problem get updated). Validates uncertainty-propagation guard.

7. **Resolution + discharge reconciliation.** Day 7: pneumonia/septic-shock-from-pneumonia resolved — supersession to `status_detail = resolved` + `resolution_datetime` + `resolution_reason` + supports to clean follow-up CXR. Active norepinephrine intent (still addressing the now-resolved problem) triggers OL-PROBLEM-08 until discontinued. At discharge, `action.problem_review` with `review_scope = discharge`, `result = updated`, reconciles final diagnoses across all problems. OL-PROBLEM-09 catches "CKD 3b still active, no outpatient follow-up intent"; case manager writes nephrology referral intent; loop closes. Validates V-PROB-02, OL-PROBLEM-08/09/10, full discharge pattern.

## 16. Open schema questions

Each appears here inline (short form) and in `OPEN-SCHEMA-QUESTIONS.md#a0c-<slug>` (durable home).

1. **[open-schema] `problem_key` / stable longitudinal identity — interim mechanism vs Phase B primitive.** v0.2 interim: lightweight `data.problem_key` derived from primary `problem.codes[]` code + patient-id + (for longitudinal) a stable suffix. Full longitudinal-thread primitive (deferred per ROADMAP autoresearch P7) adds stable cross-encounter identity with richer thread semantics. Current lean: **adopt interim `problem_key` for duplicate detection + within-chart supersession threading**; revisit when Phase B is scoped. *See `OPEN-SCHEMA-QUESTIONS.md#a0c-problem-key`.*

2. **[open-schema] `effective_period` for `assessment.problem` — extend ADR 005 allow-list.** Problems are inherently temporal states (active across a period, resolved at a time). ADR 005 currently allow-lists `effective_period` for context_segment, infusion administration, care/monitoring plans, stable device settings. A0c could extend the list to `assessment.problem`. Current draft uses `effective_at` + `resolution_datetime` + supersession; an interval representation would be cleaner for "was this problem active at T?" queries. Parallels A0b Q3. Current lean: **defer** — the `effective_at` + supersession model works; revisit if interval queries prove important. *See `OPEN-SCHEMA-QUESTIONS.md#a0c-effective-period-allow-list`.*

3. **[open-schema] Differential-to-problem promotion — cross-subtype `links.supersedes` vs `links.supports` only.** Option A: the new `problem` event supersedes the prior `differential` (cross-subtype supersession — collapses reasoning trail into current problem). Option B: the new `problem` event has `links.supports` citing the differential; differential remains in timeline unsuperseded. Current lean: **Option B**, preserving the differential as a reasoning snapshot for `timeline()` audit. A + C agree here; B originally leaned toward option A but the synthesis chose B. *See `OPEN-SCHEMA-QUESTIONS.md#a0c-differential-promotion`.*

4. **[open-schema] Sensitive-category access control.** 42 CFR Part 2 applies to substance-use-disorder records; similar regulatory/institutional expectations for mental health, HIV, and reproductive-health problems. A0c models them as ordinary problems; access control lives at an external policy layer. Open question: does the substrate need any minimum hook (e.g., `data.access_sensitivity` tag) for downstream access-control policy to consume, or is that externality-only? Current lean: **externality-only for Phase A**; project-owner decision on substrate-level flagging in Phase B. *See `OPEN-SCHEMA-QUESTIONS.md#a0c-sensitive-category`.*

5. **[open-schema] "Health concerns" and SDOH scope.** FHIR Condition category includes `health-concern` (functional / psychosocial / SDOH issues affecting care). A0c includes `data.problem_category = health_concern` in the enum, but the A0c scope decision is whether SDOH concerns (housing instability, food insecurity, transportation) live in A0c or wait for a Phase B social/discharge-planning artifact. Current lean: **include in A0c only when the concern changes current care or discharge planning** (per B's framing); broader SDOH screening results belong to a Phase B artifact. *See `OPEN-SCHEMA-QUESTIONS.md#a0c-health-concerns-scope`.*

Further questions carried forward — stage ontology registry commitment (KDIGO, TNM, NYHA, Sepsis-3, CTCAE: keep `data.stage.system` open or commit to a registry?); pregnancy status dual representation (problem AND A0b constraint); final-diagnosis-role field for discharge reconciliation (B's optional field, deferred to discharge-planning artifact if one emerges).

## 17. Sources

- CMS 42 CFR 482.24(b)–(c), §482.24(c)(4)(i) — Conditions of Participation: Medical Record Services, H&P timing. eCFR: https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482.
- 42 CFR Part 2 — Confidentiality of Substance Use Disorder Patient Records (sensitive-category access control).
- The Joint Commission PC.01.02.03 / AOP.1 (admission assessment and problem identification); RC.02.01.01 (medical-record content including diagnosis/progress); RI.01.02.01 (respecting treatment decisions including refusal).
- ONC USCDI v4 (and forthcoming v6) — Problems / Condition / Health Concerns data class (healthit.gov/isa). Defines federal interoperability floor.
- HL7 FHIR R5 `Condition` resource + US Core Condition Problems-and-Health-Concerns profile + US Core Condition Encounter-Diagnosis profile (hl7.org/fhir/R5). Load-bearing for the `clinicalStatus` / `verificationStatus` / `category` / `stage` / `evidence[]` field separations adopted in A0c.
- ICD-10-CM / ICD-10-PCS — National Center for Health Statistics (cdc.gov/nchs/icd).
- SNOMED CT — SNOMED International (snomed.org).
- KDIGO 2012 CKD and AKI Practice Guidelines — staging definitions used in `data.stage`.
- Sepsis-3 consensus — Singer M et al. *JAMA* 2016;315(8):801–810 — staging for sepsis/septic-shock problem evolution.
- NYHA Functional Classification — American Heart Association — heart-failure staging.
- AJCC Cancer Staging Manual (8th/9th ed.) / TNM — oncology staging.
- AMA Code of Medical Ethics Opinion 5.2 — documentation of resuscitation preferences and clinical picture.
- SCCM / ATS ICU goals-of-care guidance — problem-list review timing at ICU admission and transitions.
- AHIMA Problem List Guidance — professional literature on problem-list completeness and accuracy.
- MIMIC-IV `hosp.diagnoses_icd` and `d_icd_diagnoses` modules (mimic.mit.edu/docs/iv/modules/hosp/); ICD coverage for problem import.
- Synthea patient condition module; `conditions.csv` exporter schema (github.com/synthetichealth/synthea).
- Repository: `PHASE-A-CHARTER.md` (stance, tags, §4.4 hybrid-execution rule), `PHASE-A-TEMPLATE.md v3.1`, `PHASE-A-EXECUTION.md v3.2` (Batch 0 rationale, calibration checklist), `CLAIM-TYPES.md` (`assessment.subtype = problem` existing with `status_detail` enum per ADR 002; `assessment.subtype = differential` existing with distinct semantic role), `DESIGN.md` §1.1 source.kind registry, §4.3 currentState axis rules (problems active filter), §6 link taxonomy (`addresses` target types per invariant 10), §8 invariants 5/6/8/10; `a0a-patient-demographics-encounter.md` (encounter scoping, baseline attributes, MICU septic-shock anchor, admitting-diagnosis linkage); `a0b-active-constraints-synthesis.md` (`verification_status` FHIR alignment, `constraint_review` parallel for `problem_review` subtype, cross-artifact validator pattern, `authorizing_person` / `capacity_context` payload structure, scaffold-light discipline on sensitive workflow); `a1-lab-results.md` and `a2-results-review.md` (labs and diagnostic results as primary evidence sources; consolidated-subtype convergent pattern).

*End A0c synthesis. Primitive resolution: `assessment.subtype = problem` (existing) + `action.subtype = problem_review` (new, parallel to A0b's `constraint_review`) + `assessment.subtype = differential` (existing, distinct role). Payload shape: FHIR-aligned `clinicalStatus` (`status_detail`) / `verificationStatus` / `category` separation, nested `data.problem.{display, codes[], summary}`, `acuity` / `scope` / `course` trajectory fields, `stage` + optional `diagnostic_basis[]`, lightweight `problem_key` for identity + supersession threading (Phase B replaces with full longitudinal-thread primitive per ROADMAP). Sensitive-workflow scaffolds preserved: OL-PROBLEM-05 priority-specific windowing (§11), sensitive-category access control (§16 Q4 + §5), specific staleness windows (§10), stage-ontology registry commitment deferred. §2 requires project-owner rewrite per charter §4.4 before Batch 0 calibration passes.*
