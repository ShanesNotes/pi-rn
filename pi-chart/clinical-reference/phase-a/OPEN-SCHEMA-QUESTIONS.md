# Phase A open schema questions

Canonical catalog of open schema questions surfaced by prior Phase A efforts.

Coverage:
- A0a patient demographics / encounter
- A0b active constraints synthesis
- A0c problem list synthesis
- A1 lab results
- A2 results review
- A3 vital signs synthesis
- A4 MAR synthesis
- A4b medication reconciliation synthesis
- A5 intake & output, lines/tubes/drains
- A6 provider notes
- A7 nursing notes
- A8 ICU nursing assessment
- A9a order primitive
- A9b order-set / standing-protocol / template invocation

This file is a compilation surface. Source-specific sections remain
authoritative for full clinical rationale and references.

Status vocabulary:
- **Implemented** — already reflected in `DESIGN.md`, `CLAIM-TYPES.md`,
  schemas, validator, or views.
- **Accepted direction** — locally settled enough to guide fixture
  authoring, but not fully encoded as a committed schema/API contract.
- **Open** — still needs owner/ADR resolution before implementation.
- **Deferred** — intentionally left for Phase B or later.

## Resolution triage

This table is the data-purity layer for research agents. Do not treat
every source-artifact "current lean" as equally open.

| Status | Question anchors | Research-agent instruction |
| --- | --- | --- |
| Implemented | [A0b constraint subtype](#a0b-consolidated-subtype), [A0b effective period](#a0b-effective-period-allow-list), [A1/A2 result lifecycle](#a1-status-mapping), [A1/A2 effective time](#a1-effective-at), [A2 intermediate action](#a2-intermediate-action-model) | Treat as substrate baseline. Challenge only if evidence shows a defect, not because the source artifact predates implementation. |
| Accepted direction | [A0a structural split](#a0a-structural-event-split), [A1/A2 actionability tier](#a2-actionability-tier), [A3 shared metrics](#a3-shared-metrics), [A4 dose occurrence](#a4-dose-occurrence-and-cardinality), [A4b list-shaped observation](#a4b-list-shaped-observation), [A5 artifact unity](#a5-artifact-unity), [A5 balance storage](#a5-balance-storage), [A5 med-derived intake](#a5-med-derived-intake), [A6 note primitive boundary](#a6-note-primitive-boundary), [A6 note window timing](#a6-note-window-timing) | Use as fixture-authoring guidance; identify what validator/view/API work would make it durable. |
| Open | [A0b read receipt](#a0b-read-receipt), [A3 oxygen context](#a3-oxygen-context), [A3 alarm events](#a3-alarm-and-artifact-events), [A4 titration interval episode](#a4-titration-interval-episode), [A4 attestation boundary](#a4-attestation-waste-boundary), [A4b current-state axes](#a4b-medication-current-state-axes), [A4b external retrieval source kinds](#a4b-external-retrieval-source-kinds), [A5 I&O event grammar](#a5-io-event-grammar-and-interval-allow-list), [A5 I&O / LDA addressability and axes](#a5-io-lda-addressability-and-axes), [A6 note subtypes](#a6-note-subtypes), [A6 section addressability](#a6-section-and-statement-addressability), [A6 attestation primitive](#a6-attestation-primitive), [A6 consult/documentation closure](#a6-consult-and-documentation-closure), [A6 reasoning/plan coupling](#a6-reasoning-plan-coupling), [A6 session coupling](#a6-session-coupling), [A6 legacy/generated provenance](#a6-legacy-import-and-generated-provenance), [A7 subtype reuse vs split](#a7-subtype-reuse-vs-split), [A7 focused note](#a7-focused-note-primitive), [A7 scope enforcement](#a7-scope-enforcement), [A7 handoff evidence](#a7-handoff-evidence-shape), [A7 provider notification closure](#a7-provider-notification-closure), [A7 preceptor attestation](#a7-preceptor-attestation), [A7/A8 assessment boundary](#a7-a8-assessment-boundary) | Produce tradeoffs and a recommended ADR shape. Do not silently invent new source kinds, axes, or event types. |
| Deferred | [A0c longitudinal problem thread](#a0c-problem-key), [A0c sensitive access](#a0c-sensitive-category), [A0a location analytics](#a0a-location-context-segment) | Preserve hooks only. Do not let Phase A broaden into full access control, longitudinal registry, or analytics platform work. |

## Cross-cutting index

| Theme | Question anchors | Current lean |
| --- | --- | --- |
| Subtype consolidation | [A0b constraint subtype](#a0b-consolidated-subtype), [A2 diagnostic result subtype](#a2-diagnostic-result-subtype), [A6 note subtypes](#a6-note-subtypes), [A7 subtype reuse vs split](#a7-subtype-reuse-vs-split), [A7 focused note](#a7-focused-note-primitive) | Prefer consolidated subtype plus payload domain fields unless hard validation needs justify type growth; A6 splits when validator obligations diverge sharply, A7 reuses A6 subtypes by `author.role` and adds only `focused_note`. |
| Order/result fulfillment | [A1 fulfillment link](#a1-fulfillment-link), [A2 intermediate-action model](#a2-intermediate-action-model), [A6 consult/documentation closure](#a6-consult-and-documentation-closure), [A7 provider-notification closure](#a7-provider-notification-closure) | Prefer intermediate actions that fulfill intents; observations support the action. Notes never carry `fulfills`; consult/procedure use action closure, escalation runs through `action.notification`, documentation due is a derived openLoop. |
| Temporal semantics | [A1 effective_at](#a1-effective-at), [A2 effective_at](#a2-effective-at), [A0b effective_period](#a0b-effective-period-allow-list), [A0c effective_period](#a0c-effective-period-allow-list), [A0a location intervals](#a0a-location-context-segment), [A5 I&O event grammar](#a5-io-event-grammar-and-interval-allow-list), [A6 note window timing](#a6-note-window-timing) | Keep physiologic/event time distinct from chart-actionable time; extend interval primitives only where query value is clear. A5 widens the ADR 005 allow-list for `intake_event` / `output_event`; communication notes stay point-shaped with `data.window`. |
| Derived/cache files | [A0b constraints file role](#a0b-constraints-file-role), [A0a structural split](#a0a-structural-event-split), [A5 balance storage](#a5-balance-storage) | Event stream is authoritative; structural/cache files are identity or performance surfaces. Running balance stays a view unless promoted via `assessment.fluid_balance` or imported as legacy aggregate with provenance. |
| Result actionability and closure | [A1 risk tier](#a1-risk-tier), [A2 coverage threshold](#a2-review-coverage-threshold), [A2 implicit closure](#a2-implicit-closure-via-citation), [A2 actionability tier](#a2-actionability-tier) | Prefer policy-significant explicit review; routine closure can stay derived or implicit. |
| Stream/window addressability | [A3 stream sample identity](#a3-stream-sample-identity), [A4 dose occurrence and cardinality](#a4-dose-occurrence-and-cardinality), [A5 I&O / LDA addressability and axes](#a5-io-lda-addressability-and-axes), [A6 section addressability](#a6-section-and-statement-addressability) | Prefer deterministic virtual keys where dense materialized child events would create volume without clinical value. Extend URI grammar (`io://`, `lda://`, optional `note://`) and EvidenceRef selection rather than splitting events. |
| Context/state axes | [A3 oxygen context](#a3-oxygen-context), [A4 titration interval episode](#a4-titration-interval-episode), [A5 I&O / LDA addressability and axes](#a5-io-lda-addressability-and-axes) | Keep current state derived from events; add view axes only when multiple artifacts need the same projection pattern. `currentState(axis:"lda")` joins the unified currentState-axis ADR; balance stays windowed via `ioBalance()` rather than a latest-state axis. |
| Medication fulfillment and response | [A4 dose occurrence and cardinality](#a4-dose-occurrence-and-cardinality), [A4 response obligation closure](#a4-response-obligation-closure), [A4 attestation waste boundary](#a4-attestation-waste-boundary), [A5 med-derived intake](#a5-med-derived-intake) | Preserve order-action-response auditability without widening `fulfills` unless an ADR explicitly changes it. A4 owns medication truth; A5 consumes A4 volume-bearing actions for balance and writes its own intake row only for non-medication or imported aggregates; blood products remain the open exception candidate. |
| Medication reconciliation | [A4b home-med addressability](#a4b-homemed-addressability), [A4b list-shaped observation](#a4b-list-shaped-observation), [A4b reconciliation lifecycle](#a4b-reconciliation-lifecycle-and-discharge-closure) | Keep home-med snapshots distinct from inpatient medication intents; discharge instructions are canonical communication, not UI-only output. |
| Note primitive boundary | [A6 note primitive boundary](#a6-note-primitive-boundary), [A6 section addressability](#a6-section-and-statement-addressability), [A6 attestation primitive](#a6-attestation-primitive), [A7 focused note](#a7-focused-note-primitive) | Notes remain paired `communication` events plus Markdown bodies — not a seventh event family; section/quote-hash precision lives in EvidenceRef rather than child events. |
| Decomposition vs narrative-only | [A6 reasoning/plan coupling](#a6-reasoning-plan-coupling), [A6 legacy/generated provenance](#a6-legacy-import-and-generated-provenance), [A7/A8 assessment boundary](#a7-a8-assessment-boundary) | Live authoring writes structured siblings for state-changing claims; legacy and AI-generated drafts stay visible without authoring structured currentState. |
| Attestation and cosignature | [A6 attestation primitive](#a6-attestation-primitive), [A7 preceptor attestation](#a7-preceptor-attestation) | Reuse `communication.attestation` across provider and nursing roles with profile-driven timing; do not introduce a new event type. |
| Scope-of-practice enforcement | [A7 scope enforcement](#a7-scope-enforcement) | Default to soft warnings on out-of-scope authorship; profile-driven severity is the implementation endpoint once profiles exist. |
| Session and import provenance | [A6 session coupling](#a6-session-coupling), [A6 legacy/generated provenance](#a6-legacy-import-and-generated-provenance) | Defer stored session id and new note-import source kinds; rely on author proximity, note `references[]`, and existing source kinds plus transform provenance. |
| Phase A order/finding bridge | [A8 finding-state negative missingness](#a8-finding-state-negative-missingness), [A8 reassessment response coupling](#a8-reassessment-response-coupling), [A8 nursing-scope assessment boundary](#a8-nursing-scope-assessment-boundary), [A8 structured vs narrative boundary](#a8-a7-structured-vs-narrative-boundary), [A9a canonical subtype](#a9a-canonical-subtype), [A9a result fulfillment pathway](#a9a-result-fulfillment-pathway) | Accepted direction for PHA-001: findings are observations/evidence, fulfillment stays action-mediated, and order family remains payload on `intent.order`. |
| A9b order-set invocation | [A9b invocation as event vs derived](#a9b-invocation-as-event-vs-derived), [A9b parent-child link convention](#a9b-parent-child-link-convention), [A9b orderset modification mid invocation](#a9b-orderset-modification-mid-invocation), [A9b set-level openLoops vs child-level](#a9b-set-level-openloops-vs-child-level), [A9b CDS suggestion boundary](#a9b-cds-suggestion-boundary), [A9b protocol decision branch boundary](#a9b-protocol-decision-branch-boundary) | Accepted direction for planning only: invocation is `action.intervention` payload, children are `intent.order`, parent/child provenance uses `transform`, set lifecycle is derived, CDS/protocol state remains out-of-chart. |

## A8/A9a/A9b Phase A bridge promotions

Source: `docs/plans/prd-phase-a-completion-to-implementation-bridge.md` PHA-TB-1, approved for canonical merge during Ralph execution.

### a8-finding-state-negative-missingness

**[accepted-direction] Three-valued finding state.** `observation.exam_finding`
fixtures and future validator work should distinguish `present`, explicitly
absent, and not-assessed states so chart silence is not confused with explicit
normal/negative findings. PHA-001 may characterize this in view tests; closed
finding vocabularies and full exam-session shells remain deferred.

### a8-reassessment-response-coupling

**[accepted-direction] Exam findings are evidence, not fulfillment.**
`observation.exam_finding` must not carry `links.fulfills` to close an
`intent.order` or `intent.monitoring_plan`. Fulfillment/closure remains
action-mediated; findings and nursing assessments may support/address/interpret
the loop context.

### a8-nursing-scope-assessment-boundary

**[accepted-direction] RN-scope structured assessments stay nursing-domain.**
Nursing-scope `assessment.*` claims can support or interpret bedside findings,
but they do not become provider-only judgments and do not bypass action-mediated
fulfillment.

### a8-a7-structured-vs-narrative-boundary

**[accepted-direction] A8 owns structured findings; A7 owns narrative.**
Nursing notes can support or narrate findings, but live structured findings
belong in `observation.exam_finding` rather than being minted by note text alone.

### a9a-canonical-subtype

**[accepted-direction] Orders stay `intent.order`.** Do not introduce order
family subtypes for first implementation; use `intent.order` with payload fields
such as `data.order_kind`.

### a9a-result-fulfillment-pathway

**[accepted-direction] Result-producing orders use action-mediated fulfillment.**
Diagnostic results and lab results support acquisition/performance actions; the
actions fulfill the upstream `intent.order` or `intent.monitoring_plan`.

### a9b-invocation-as-event-vs-derived

**[accepted-direction] Order-set/protocol/template invocation is a chart action.**
Use a point-shaped `action.intervention` event with
`data.action = "orderset_invocation"` as the planning direction. Do not add a
new event type or `intent.orderset_invocation` in PHA-001.

### a9b-parent-child-link-convention

**[accepted-direction] Parent/child provenance uses existing transform surface.**
Generated child `intent.order` events should point back to the invocation through
`transform.run_id` and `transform.input_refs`, not through a new link kind or
`data.invoked_by`.

### a9b-orderset-modification-mid-invocation

**[accepted-direction] Modify children, not the invocation.** Mid-invocation
changes are represented by per-child supersession/cancellation; the invocation
event remains point-shaped provenance and is never re-authored as a mutable
bundle object.

### a9b-set-level-openloops-vs-child-level

**[accepted-direction] Set lifecycle is derived from child orders.** Do not add
stored bundle-complete/bundle-cancelled lifecycle fields. Standing-order delayed
authentication is the surviving regulated set-level loop candidate and needs a
later ADR/profile decision before implementation.

### orderset-cds-suggestion-boundary

**[accepted-direction] Non-accepted CDS suggestions are not patient-stream
claims.** They remain system telemetry unless accepted into patient-specific
orders/actions.

### a9b-protocol-decision-branch-boundary

**[accepted-direction] Protocol branch state stays out of pi-chart.** pi-agent
owns protocol state machines; pi-chart records authoring, provenance, and
action-mediated fulfillment, with only opaque references if needed later.

## A0a patient demographics / encounter

Source: `a0a-patient-demographics-encounter.md` section 16.

### a0a-structural-event-split

**[open-schema] Two-layer structural vs event-stream split.** Is the recommended
hybrid correct: identity-stable structural YAML plus mutable event-stream with
supersession? Alternatives are everything-as-events, which is uniform but
heavier, or everything-as-structural, which is lighter but lossy for lifecycle
and provenance. Current recommendation: hybrid, with explicit boundary rules.

### a0a-race-ethnicity-versioning

**[open-schema] Race/ethnicity representation across OMB 1997 and OMB 2024.**
OMB SPD 15 revised March 2024 combines race and ethnicity into one multi-select
question with seven minimum categories, including Middle Eastern or North
African; federal compliance is due by March 28, 2029. Open choice: adopt OMB
2024 natively, preserve OMB 1997 for legacy import fidelity, or support both
with a `standard_version` field per value set. Current lean: OMB 2024 canonical,
OMB 1997 preserved on import from pre-2029 sources.

### a0a-baseline-representation

**[open-schema] Baseline attributes as tagged observations vs structural
baseline set.** Current recommendation models baselines as observations with
`tags=["baseline", "<axis>"]`. Alternative: a `baseline_set` structural type
parallel to `constraint_set`. Current lean: stay with tagged observations;
revisit if tag-based queries prove fragile.

### a0a-adt-actions-vs-encounter-supersession

**[open-schema] ADT as actions vs encounter supersession.**
`action.encounter_transferred` matches HL7 ADT trigger semantics. Alternative:
represent transfer as supersession of encounter structural files. Current lean:
action events for transfers; administrative encounter-class corrections can use
a narrower correction action if needed.

### a0a-sex-gender-model

**[open-schema] Sex / gender model.** Prior section records a final local
decision: `GENDER = Male/Female`. Treat this as closed unless later work
reopens sex/gender representation for regulatory or clinical reasons.

### a0a-structural-correction-semantics

**[open-schema] Structural correction semantics.** Structural types have a
lightweight envelope, but errors in identity-stable fields need provenance.
Candidate models: mutable frontmatter plus revisions, versioned structural
files, or correction events. Current lean: correction events for mutable fields
plus versioned structural files for identity-stable corrections that must remain
structural-level.

### a0a-location-context-segment

**[open-schema] Location/level-of-care as action events vs interval
`observation.context_segment`.** Action events match HL7 ADT and are simpler.
Context segments improve analytics over location stays. Current lean: action
events for ADT; context segments remain a Phase B candidate if stay analytics
need them.

## A0b active constraints synthesis

Source: `a0b-active-constraints-synthesis.md` section 16.

### a0b-consolidated-subtype

**[open-schema] Consolidated `assessment.subtype = constraint` with
`data.constraint_domain` vs dedicated per-domain subtypes.** Current lean:
consolidated subtype plus domain-conditional payload fields. Alternative:
per-domain subtypes such as `constraint_allergy`, `constraint_code_status`, and
`constraint_advance_directive`, which admit tighter per-domain schema at the
cost of query fragmentation and type-count growth. Schema impact: one new
subtype vs multiple new subtypes.

### a0b-constraints-file-role

**[open-schema] `constraints.md` role: cache vs structural canonical.** Current
lean: cache only. `constraints.md` snapshots `currentState(axis:"constraints")`,
is regenerable, and is never authoritative; the event stream wins on conflict.
Requires revising `schemas/constraints.schema.json` and updating
`CLAIM-TYPES.md`.

### a0b-effective-period-allow-list

**[open-schema] `effective_period` for `constraint` subtype.** Constraints are
temporal states, so interval semantics are natural. Current lean: extend ADR
005's allow-list to include `assessment.constraint` and
`action.constraint_review`. Alternative: point events plus supersession chains.

### a0b-read-receipt

**[open-schema] V-CON-01 / V-ID-09 read-receipt mechanism.** The validator needs
evidence that active constraints were read during the agent decision cycle.
Options: intent-level `constraint_read_at` plus hash/ref, explicit
`action.constraint_read`, external run-id correlation, or semantic links to
constraint events. Current lean: intent-level signal or semantic links; explicit
read events add volume, and external logs push state outside the chart.

### a0b-verification-status

**[open-schema] `data.verification_status` vs envelope `certainty`.** These are
orthogonal: `certainty` is epistemic grade, while verification status is
clinical workflow state aligned with FHIR AllergyIntolerance. Current lean: keep
`verification_status` in payload and document orthogonality in DESIGN and
`CLAIM-TYPES.md`.

## A0c problem list synthesis

Source: `a0c-problem-list-synthesis.md` section 16.

### a0c-problem-key

**[open-schema] `problem_key` / stable longitudinal identity.** v0.2 interim
option: lightweight `data.problem_key` derived from primary problem code,
patient id, and possibly a stable longitudinal suffix. Full longitudinal thread
primitive is deferred to Phase B. Current lean: adopt interim `problem_key` for
duplicate detection and within-chart supersession threading.

### a0c-effective-period-allow-list

**[open-schema] `effective_period` for `assessment.problem`.** Problems are
temporal states, but the current model can use `effective_at`,
`resolution_datetime`, and supersession. Current lean: defer interval expansion
for problems until interval queries prove important.

### a0c-differential-promotion

**[open-schema] Differential-to-problem promotion.** Option A: new problem event
cross-subtype supersedes prior differential. Option B: new problem event cites
the differential via `links.supports`, preserving the reasoning snapshot.
Current lean: Option B.

### a0c-sensitive-category

**[open-schema] Sensitive-category access control.** A0c models substance use,
mental health, HIV, and reproductive-health problems as ordinary problems while
access control remains external. Open choice: whether the substrate needs a
minimum hook such as `data.access_sensitivity`. Current lean: externality-only
for Phase A; revisit in Phase B.

### a0c-health-concerns-scope

**[open-schema] Health concerns and SDOH scope.** FHIR Condition includes
`health-concern`. Current lean: include health concerns in A0c only when they
change current care or discharge planning; broader SDOH screening belongs to a
Phase B artifact.

## A1 lab results

Source: `a1-lab-results.md` section 16.

### a1-fulfillment-link

**[open-schema] Fulfillment semantics for A9a -> A1.** Current invariant and
claim-type guidance make `fulfills` action-to-intent, but lab-result
observations need to close lab-order intents. Options: permit
`observation.fulfills -> intent` for lab results, model an intermediate
`action.specimen_collection`, or use `observation.supports -> intent` and derive
closure. Highest-impact A1 question.

### a1-effective-at

**[open-schema] `effective_at` semantics for lab results.** Choices:
`specimen.collected_at` as physiologic truth-time, `resulted_at` as chart-
actionable time, or `verified_at` as lab-accountable time. This affects trends,
delta checks, serial lactate compliance, and as-of queries.

### a1-status-mapping

**[open-schema] Result lifecycle status: envelope-level or payload-level.** Lab
results need statuses such as preliminary, final, corrected, amended, and
cancelled. Open choice: map them onto envelope status and correction links, or
carry lab-specific status in payload with duplication risk.

### a1-reference-range

**[open-schema] Reference range: inline payload vs separate versioned resource.**
Inline ranges travel with each event and survive range changes. A shared
resource enforces consistency but requires point-in-time resolution for audits.

### a1-risk-tier

**[open-schema] Risk tier: CLSI GP47 two-tier vs single `critical_flag`.**
Regulatory programs often collapse panic/alert/critical into one binary. GP47
stratifies critical-risk vs significant-risk. Two-tier modeling changes
open-loop SLA windows and callback obligations.

## A2 results review

Source: `a2-results-review.md` section 16.

### a2-diagnostic-result-subtype

**[open-schema] Consolidated `diagnostic_result` subtype vs per-modality
subtypes.** Option A: single `observation.diagnostic_result` with
`result_domain` and `modality` in payload. Option B: discrete imaging,
procedure, pathology, and cardiology result subtypes. Convergent recommendation:
consolidated payload-polymorphic subtype.

### a2-intermediate-action-model

**[open-schema] Does A2 resolve A1 fulfillment semantics via the
intermediate-action model?** In A2, `action.imaging_acquired`,
`action.procedure_performed`, or `action.specimen_collected` fulfills the
intent, while the narrative observation supports the action. Recommendation:
adopt substrate-wide; then result/order closure validators can hard-reject
missing links instead of warning.

### a2-effective-at

**[open-schema] `effective_at` semantics for diagnostic observations and review
actions.** Diagnostic observations must choose performed, reported, or cosigned
time. Review actions use reviewed time, usually matching recorded time.
Resolution should stay consistent with A1.

### a2-review-coverage-threshold

**[open-schema] Coverage threshold for explicit review action.** Open choice:
require review actions for policy-significant results only, or for every
reviewed result. Recommendation: policy-significant only; routine nonactionable
results remain implicitly reviewed unless local policy says otherwise.

### a2-implicit-closure-via-citation

**[open-schema] Implicit closure via note or assessment citation.** If an
assessment or progress note cites a result through `links.supports`, should that
satisfy review obligation? Recommendation: allow implicit closure via citation,
represented by `acknowledgment_method = implicit_via_citation` on a derived
review event.

### a2-provisional-agent-reviews

**[open-schema] Provisional agent reviews.** Open choice: may pi-agent author
draft reviews for non-critical trending results, later confirmed or corrected
by a human? Recommendation: permit draft agent reviews for non-critical results
only; critical results require human confirmation.

### a2-actionability-tier

**[open-schema] First-class `actionability_tier` vs derived, unified with A1
risk tier.** ACR actionable categories and A1 CLSI GP47 risk tier may collapse
into one actionability field on all result observations, with modality-specific
policy determining SLA. Adoption would unify A2 and A1 validator logic.

## A3 vital signs synthesis

Source: `a3-vital-signs-synthesis.md` section 16 and
`a3-open-schema-entries-synthesis.md`.

### a3-stream-sample-identity

**[open-schema] Stream-sample identity, correction, and fulfillment.**
Continuous telemetry cannot give every sample a normal event id without
ballooning `events.ndjson`, but unaddressed samples are hard to correct,
supersede, cite, or use as fulfillment evidence. Current lean: keep dense
stream rows lightweight, use vitals-window refs for evidence, and reserve
explicit `action.measurement` events for one-shot ordered measurements.

### a3-shared-metrics

**[open-schema] Shared metrics across labs and vitals.** ABG-like values,
lactate, and hemoglobin can appear both as lab observations and simulator or
monitor-derived vital-frame fields. Current lean: A1 is canonical for drawn
labs; suppress or profile-route A3 simulator-derived equivalents unless they
are explicitly labeled as training/simulation values.

### a3-oxygen-context

**[open-schema] Oxygen-delivery context and current-state axis.** SpO2 is not
clinically interpretable without oxygen device/flow/FiO2 context. Current lean:
migrate from inline per-sample context toward interval
`observation.context_segment` events, with backward-compatible reads over legacy
inline context. `currentState(axis:"context")` remains proposed, not accepted.

### a3-early-warning-score

**[open-schema] Early-warning score storage.** NEWS2/MEWS/qSOFA can be derived
from vitals and assessment data, stored as `assessment.risk_score`, or handled
by policy profiles. Current lean: derived by default; store only when the score
itself becomes clinically acted upon or must be audited.

### a3-alarm-and-artifact-events

**[open-schema] Alarm and artifact event class.** Alarms can be derived from
thresholds, represented as actions such as `alarm_pause`, or captured as
canonical alert events. Current lean: derive alert state from monitoring plans
first; add canonical alarm/pause events only where audit requirements or
fixture evidence require them.

## A4 MAR synthesis

Source: `a4-mar-synthesis.md` section 16 and
`a4-open-schema-entries-synthesis.md`.

### a4-dose-occurrence-and-cardinality

**[open-schema] Dose occurrence identity and fulfillment cardinality.** A q6h
order creates repeated due obligations; `links.fulfills: [order_id]` alone
cannot distinguish which dose was given, late, held, refused, or omitted.
Current lean: deterministic `meddose://...` occurrence keys plus strict
one-disposition-action-to-one-medication-order fulfillment. Do not permit one
administration to silently fulfill sibling medication orders.

### a4-device-authored-dispositions

**[open-schema] Device-authored dispositions and pump telemetry.** Barcode
scans, dispensing systems, and smart pumps may provide supporting evidence, but
not all device signals are clinician actions. Current lean: ADS/BCMA evidence
supports nurse/provider actions; smart-pump state can become canonical exposure
truth later once device provenance is formalized.

### a4-response-obligation-closure

**[open-schema] Medication response obligations and loop closure.** Many
administrations require reassessment or monitoring. Current lean: persistent
requirements live on orders, high-risk concrete checks become monitoring
intents, ad hoc obligations can live on the action, and closure should use
`links.resolves` or evidence overlap rather than widening `fulfills`.

### a4-titration-interval-episode

**[open-schema] Titration / infusion interval and episode model.** Continuous
infusions and titrations are interval-shaped medication exposures. Current lean:
extend ADR 005 with a narrow action-interval allow-list such as
`action.titration` or `action.continuous_infusion`, and allow optional episode
grouping without creating a new event type.

### a4-attestation-waste-boundary

**[open-schema] Partial dose, waste, verification, and attestation boundary.**
High-risk administrations may need witness, cosign, double-check, waste, or
pharmacy verification evidence. Current lean: administered dose is canonical;
use compact `waste` and `attestations[]` payloads plus policy-profile
validators. Promote separate action subtypes only if fixtures prove independent
claim identity is required.

### a4-order-discriminator

**[open-schema] Medication order discriminator.** A4 uses the working shape
`intent.subtype = order` plus `data.order_kind = "medication"`. Current lean:
defer the durable order-family decision to A9a; if A9a chooses split subtypes,
A4 can migrate mechanically.

## A4b medication reconciliation synthesis

Source: `a4b-medication-reconciliation-synthesis.md` section 16 and
`a4b-open-schema-entries-synthesis.md`.

### a4b-homemed-addressability

**[open-schema] Home-medication-list item addressability.**
`observation.home_medication_list.data.items[]` is list-shaped, but
reconciliation decisions need stable item-level references. Current lean:
v0.2 uses stable `item_key` values unique within the list event; a later
cross-artifact ADR may unify this with `vitals://`, `meddose://`, and a
future `homemed://` URI pattern.

### a4b-list-shaped-observation

**[open-schema] Home/discharge medication list as observation with
`items[]`.** Home-med and discharge-med lists are snapshots, not constraints
and not inpatient orders. Current lean: keep them as list-shaped observations
whose list snapshot is the supersession unit; solve item references with
item keys instead of materializing every item as a standalone event.

### a4b-medication-current-state-axes

**[open-schema] Cross-artifact `currentState` axis pattern.** A3 wants
current oxygen/context, A4 wants active medication state, and A4b wants
current home/discharge medication state. Current lean: resolve these axes in
one ADR rather than adding piecemeal helpers. Rule: "what is currently true
on this axis?" belongs in `currentState`; cross-axis reasoning stays in
`openLoops`, `trend`, `evidenceChain`, or a later domain-specific view.

### a4b-external-retrieval-source-kinds

**[open-schema] Outside-records / pharmacy / HIE provenance.** A4b needs to
distinguish patient report, caregiver report, pill bottle, outpatient
pharmacy, outside records, prior chart, and HIE-style retrieval. Current lean:
do not add new `source.kind` values in Phase A. Use existing source kinds plus
`source.ref`, item-level `source_subtype`, `artifact_ref`, and communication
evidence; consider a single ADR 006 amendment later with A4 device-source
questions.

### a4b-reconciliation-lifecycle-and-discharge-closure

**[open-schema] Supersession scope, discrepancy closure, and discharge
communication.** Admission, transfer, and discharge reconciliation are
separate transition batches; same-transition corrections may supersede prior
same-transition decisions. Current lean: discharge reconciliation is incomplete
until both the discharge medication list and patient/caregiver communication
exist. Do not treat the printed/rendered handout as sufficient chart truth.

## A5 intake & output, lines/tubes/drains

Source: `a5-io-lda-synthesis.md` §16. This council synthesis supersedes the
earlier `a5-open-schema-entries.md` staging file — it folds LDA in-service
state into `observation.context_segment`, splits I&O into direction-specific
`observation.intake_event` / `observation.output_event` subtypes, and reuses
existing ADR-003 action grammar for placement/removal instead of new
`action.lda_*` aliases.

### a5-artifact-unity

**[open-schema] I&O and LDA as one Phase A artifact vs two.** Output
interpretation depends on active LDA state, balance assessments cite
device segments, and validator/view work (active-device dispatch,
output-source consistency, balance windows citing segments) is shared.
Splitting into separate artifacts would force every output validator to
import LDA context anyway. Current lean: keep unified. No schema impact;
this is a scope-discipline anchor for downstream batches.

### a5-io-event-grammar-and-interval-allow-list

**[open-schema] Split `observation.intake_event` / `observation.output_event`
vs single generic `observation.io_measurement`, and ADR 005 allow-list
membership.** A combined `io_measurement` subtype is adapter-friendly but
makes every validator branch on `direction` and hides different clinical
semantics: output requires source-device consistency; intake carries
route/substance and medication-boundary checks. Many I&O values are
interval truths (urine 09:00–10:00, JP shift output, 4h tube-feed total,
24h net), but ADR 005's interval allow-list predates A5. Current lean:
split into `observation.intake_event` and `observation.output_event` — one
extra subtype each buys stronger payload validation and clearer agent
reads — and extend ADR 005 to allow `effective_period` on both. Reject
`data.period_start/end` ad-hoc conventions that recreate the problem
ADR 005 was designed to prevent.

### a5-balance-storage

**[open-schema] When derived running balance becomes canonical chart
truth.** `ioBalance(from, to)` computes net I−O from canonical intake
events, output events, and A4 volume-bearing actions. Storing every
shift/24h total as a row duplicates derived state and risks drift; never
storing balance prevents evidence-chain traversal for clinically
meaningful interpretations like "net positive 3 L with worsening
oxygenation." Current lean: derived by default; canonical only as
`assessment.fluid_balance` when a clinician or agent interprets the
window and uses it to change interpretation, plan, or handoff, citing
the `io://` window plus supporting A3 vitals / A1 labs. Imported legacy
aggregates allowed only with explicit provenance and must not silently
override reconstructible balance from atomic events. Resolution should
unify with the A3 derived-score discipline ADR.

### a5-med-derived-intake

**[open-schema] A4 medication/fluid volume in A5 balance, and the
blood-product boundary.** IV antibiotics, diluents, flushes attached to
medication administration, maintenance fluids, titrated infusions, and
medication carriers originate in A4 volume-bearing `action.administration` /
infusion epochs. A5 needs the volume for balance; A4 owns
drug/dose/route/order fulfillment. Current lean: non-blood medication / IV
fluid volumes stay A4-owned and are consumed by A5-derived balance via
`source_action_ref`; A5 writes its own intake row only for non-medication
volumes or imported legacy aggregates without a reconstructible A4 anchor.
Blood products remain the strongest exception candidate — owner-decision
pending — because transfusion volume often arrives through a workflow
distinct from MAR. Validator should warn when an A5 volume duplicates A4
without `source_action_ref` or `links.supports`.

### a5-io-lda-addressability-and-axes

**[open-schema] `io://` and `lda://` URIs, and `currentState` axis dispatch
for active devices and fluid balance.** Foley/JP/feeding-tube identity
must be cited consistently across placement, in-service segment,
site/patency assessment, output measurement, setting changes, and removal.
I&O windows must be cited as evidence without materializing every derived
total as a stored event. Active-LDA reads parallel the A3/A4/A4b
`context` / `medications` / `home_medications` currentState-axis pressure.
Current lean: adopt `lda://enc/<key>` durable session identity (backed by
`data.lda_key` and `observation.context_segment` events) and
`io://enc?metric=...&from=...&to=...` windowed evidence grammar; resolve
axis dispatch — `currentState(axis:"lda")` for active devices,
`ioBalance(from, to)` rather than `currentState(axis:"fluid_balance")`
because balance is windowed not latest-state — in the unified
cross-artifact axis ADR with A3/A4/A4b. Fallback without URI ADR: cite
segment event ids and enumerated I&O event ids plus `data.window`.

### A5 accepted-direction notes

Council-settled without elevating to standalone questions:

- **No new A5 source kinds.** ADR 006 restraint holds; automated
  urimeters, smart pumps, drain devices, and feeding pumps ride on
  existing `source.kind` (`nurse_charted`, `poc_device`,
  `monitor_extension`, etc.) plus `source.ref`, `data.method`, and
  `artifact_ref` until fixture or import data proves the existing
  taxonomy cannot carry device provenance.
- **No new A5 event type or storage primitive.** All A5 canonical claims
  fit existing `observation` / `action` / `intent` / `assessment` types.
  No A5 stream file — output cadence is not A3 telemetry scale.
- **LDA in-service state reuses `observation.context_segment`.** New
  `segment_type` values (`line_in_service`, `foley_in_service`,
  `drain_in_service`, `airway_in_service`, `tube_in_service`,
  `chest_tube_in_service`) are payload, not new subtypes; segment
  already sits on the ADR 005 interval allow-list.
- **LDA placement/removal reuse existing action grammar.**
  `action.procedure_performed` with
  `data.procedure_family ∈ {lda_placement, lda_removal}` rather than
  new `action.lda_*` aliases. `action.measurement` / `action.intervention`
  only when a monitoring/care intent needs explicit fulfillment.
- **Observations do not carry `links.fulfills`.** Routine LDA checks
  (`observation.lda_assessment`) support actions; only `action.*`
  fulfills intents.

## A6 provider notes

Source: `a6-open-schema-entries-council-synthesis.md` and
`a6-provider-notes-council-synthesis.md` §16.

### a6-note-primitive-boundary

**[open-schema] Notes as Markdown body + `communication` event vs first-class
`type: note` event.** The substrate already exposes six clinical event types;
notes live as Markdown files with frontmatter and a paired `communication`
event whose `data.note_ref` points back to the body. The Phase A charter lists
`note` in the primitive vocabulary, but the implementation treats it as a
narrative storage primitive paired with communication, not a seventh event
family. Current lean: keep the paired model — note file is canonical
narrative, `communication` event is graph identity — and add note-specific
wrapper APIs (e.g. `writeProviderNote()`) that compile down to
`writeCommunicationNote()` and enforce provider-note payloads. No new clinical
event type in Phase A; clarify in DESIGN/CLAIM-TYPES that "note" is a
sanctioned paired narrative carrier, not an `events.ndjson` type.

### a6-note-window-timing

**[open-schema] `communication.effective_at` + `data.window` vs
`effective_period` for note coverage.** A progress note may cover an
overnight shift; an admission H&P may cover an admission workup interval.
ADR 004 says `communication.effective_at` is sent/authored time; ADR 005
only allow-lists interval events by subtype and does not include note
communications. Current lean: keep `communication.*_note` as point events
with `data.window` for clinical coverage. Envelope time is when the
communication happened; payload window is the clinical interval the note
synthesizes. Do not extend ADR 005's interval allow-list for notes.

### a6-note-subtypes

**[open-schema] Split provider-note communication subtypes vs generic
`provider_note` with `data.note_kind`.** Each provider-note kind has distinct
validator obligations: admission notes establish problems and initial plan;
progress notes cite or author in-window evidence; procedure notes reference
`action.procedure_performed`; consult notes link to `intent.referral` plus a
fulfilling action; event notes cite a trigger; attestations reference a
primary note and carry substantive basis. Current lean: split subtypes
(`admission_note`, existing `progress_note`, `consult_note`,
`procedure_note`, `event_note`, `attestation`) — the count is justified by
validator clarity. Fallback if subtype-growth pressure is high: split only
the validator-sharp types (`admission_note`, `consult_note`,
`procedure_note`, `attestation`) and use a generic note kind for
progress/event.

### a6-section-and-statement-addressability

**[open-schema] Citing a section, A/P item, paragraph, or statement instead
of a whole note.** Provider notes are multi-claim artifacts; a consult note
may contain an antibiotic recommendation, a differential, and a follow-up
instruction; a progress note may contain multiple problem-specific A/P
paragraphs. Whole-note citation is too blunt for contradiction handling,
evidence chains, or downstream actions. Note frontmatter `references[]` is
string-only, while `links.supports[]` already accepts EvidenceRef with
`kind:"note"` and a `selection` shape. The missing piece is a stable
Markdown convention for section keys and quote hashes. Current lean:
Markdown section anchors plus `EvidenceRef.kind:"note"` with
`selection.section`, `selection.heading`, or `selection.quote_hash`;
optionally a `note://note_id#section_key` serialization alias. Anchor major
sections and problem-oriented A/P subsections; defer sentence-level spans
to Phase B unless fixtures prove need.

### a6-attestation-primitive

**[open-schema] Attestation as `communication.attestation`,
`action.attestation`, or envelope-level `cosigners[]`.** Teaching/supervision
workflows require a durable dated/signed addition to the record.
`communication.attestation` reuses paired-note infrastructure and preserves
attestation text as narrative; `action.attestation` treats attestation as a
performed clinical act (poor fit unless the goal is `fulfills`
compatibility); envelope `cosigners[]` is metadata-like but mutates the
primary note and can lose substantive text. Current lean:
`communication.attestation` with `data.attests_to` and
`data.attestation_basis`. May `resolves` an attestation-pending openLoop
without mutating the primary note.

### a6-consult-and-documentation-closure

**[open-schema] Closing consult, H&P, progress, procedure, discharge, and
attestation loops without widening `links.fulfills` beyond action-to-intent.**
ADR 003 keeps `fulfills` action-to-intent. A consult or procedure has a
clinician act (consult delivered, procedure performed); documentation
obligations (H&P due, discharge summary due, attestation due) are often
derived from encounter state and policy windows rather than explicit intent
events. Current lean: notes never carry `fulfills`; consult and procedure
use action closure (`action.notification` with `data.action:"consult_delivered"`
or future `action.consult_delivered`; `action.procedure_performed`);
documentation due is a derived openLoop computed from policy and note
presence; `communication.attestation` may `resolves` attestation-pending.
Defer dedicated `action.documentation_completed` to A9a unless fixtures
prove it is needed.

### a6-reasoning-plan-coupling

**[open-schema] Decomposition coupling between provider-note narrative and
companion `assessment.*` / `intent.*` events.** Live pi-chart authoring
should not let new problems, orders, result reviews, medication decisions,
device decisions, or monitoring plans hide inside prose; legacy imports and
acute event notes can be narrative-heavy. Strict everywhere breaks real
authoring; loose everywhere defeats the substrate. Current lean:
subtype-dependent strictness with severity grading — admission, progress,
procedure, and consult notes are strict on their obligations; event notes
are lighter; imported notes get relaxation. Replay enforces strict; live
mode warns or opens loops instead of blocking. Note text/event drift
creates warnings or openLoops.

### a6-session-coupling

**[open-schema] Grouping a rounding session's note plus assessments and
intents.** Validators need co-authored siblings for note obligations; views
need to render what the author did during rounds. Options: implicit
derivation from author + recorded_at proximity (imprecise); explicit
`data.session_id` on every session event (new stored association that can
drift); bidirectional links between note and every co-authored event
(precise for cited siblings only). Current lean: hybrid — implicit grouping
for session discovery, explicit note `references[]` / `links.supports[]`
for clinically cited siblings. Do not add a session id until a concrete
query fails without it.

### a6-legacy-import-and-generated-provenance

**[open-schema] Legacy/dictated/AI-generated notes without fabricating
structured truth or blurring accountable authorship.** Real-world legacy
notes arrive as monolithic prose; Synthea/MIMIC/manual fixtures vary in
note fidelity; agent-generated summaries must remain distinct from
clinician-authored finals. ADR 006 supplies source kinds and ADR 011
supplies transform provenance, so the open issue is validator behavior,
status, and decomposition boundaries — not new source kinds. Current lean:
narrative-only import carries `data.import_provenance:"narrative_only"` and
`data.decomposition_pending:true`, visible in `narrative()` but not
authoring structured currentState; agent-generated live notes use
`status:"draft"`, `source.kind:"agent_synthesis"`, and
`transform.input_refs`, with clinician signing/attestation promoting
authority. Full NLP extraction at import is Phase B scope. Do not add new
`source.kind` values such as `provider_note_import` or `copy_forward`.

## A7 nursing notes

Source: `a7-open-schema-entries-council-synthesis.md` and
`a7-nursing-notes-council-synthesis.md` §16.

### a7-subtype-reuse-vs-split

**[open-schema] Reuse A6 communication subtypes with `author.role`
differentiation vs nursing-specific subtype families vs `shift_note`.** The
nursing/provider distinction shows up in validator obligations and
structured siblings, not in the communication primitive itself: a nursing
`progress_note` cites A3/A4/A5/A8 bedside streams and co-authors
nursing-scope `intent.care_plan` / `intent.monitoring_plan`; a provider one
may co-author `assessment.impression` and `intent.order`. Current lean:
reuse A6 subtypes and dispatch validators on `(subtype, author.role)`; use
`progress_note` for shift-progress narrative and `sbar`/`handoff` for
accountability transfer. Do not add `nursing_*` subtype variants or a
distinct `shift_note` unless an ADR explicitly accepts them.

### a7-focused-note-primitive

**[open-schema] `communication.focused_note` for DAR/PIE/SOAPIE charting vs
`progress_note` with `data.focused: true`.** Focused nursing notes center
on a specific concern (pain, skin, mobility, safety, psychosocial, family
interaction, protocol invocation) and follow a strict trigger/action/response
shape over a short window — distinct from broader progress synthesis.
Current lean: add `communication.focused_note` requiring non-empty
`data.focus` and trigger/action/response evidence refs. The shape earns one
subtype; keep it function-specific, not author-prefixed.

### a7-scope-enforcement

**[open-schema] Nursing-vs-medical scope enforcement on `assessment.*`,
`intent.*`, and action events.** Nurses author nursing-scope assessments,
monitoring plans, care plans, and protocol-driven interventions; they
generally should not author medical diagnostic impressions or unprofiled
prescriptive orders. But scope is state, institution, and credential
specific, and advanced-practice and protocol/standing-order contexts
complicate the boundary. Current lean: soft warn-not-block by default with
profile-driven escalation; the implementation endpoint is fully
profile-driven severity once profiles exist. Default warnings fire for
RN/LPN/CNA/student-authored `assessment.impression`, `assessment.differential`,
or `intent.order` without credential/protocol support. Protocol-driven
actions require `source.kind: protocol_standing_order` plus a protocol
reference.

### a7-handoff-evidence-shape

**[open-schema] SBAR/handoff evidence shape and acknowledgement.** Handoff
is the strongest A7 continuity function; a handoff note must cite active
situation/problem context, active plan/recommendation context, and recent
observation evidence. Options: structured `data.sbar_sections[]` with
per-leg evidence refs (best structure, highest form creep); flat
`links.supports` minimum bundle; explicit
`action.handoff_acknowledgement` for receiver accountability;
receiving-shift `progress_note` / first-assessment note citation as
implicit acknowledgement. Current lean: flat `links.supports` minimum
bundle (active problem/context + active plan/intent/order + recent
observation window) with optional `data.sbar_sections[]`; treat
acknowledgement as a profile-driven openLoop until the owner decides
whether a new action is worth the entropy.

### a7-provider-notification-closure

**[open-schema] Modeling "provider notified," "no new orders," "provider to
bedside," and callback pending.** Treating "MD notified" as prose-only
makes escalation accountability unverifiable, but allowing a `communication`
note to fulfill a monitoring plan or order violates ADR 003's action-source
fulfillment discipline. Current lean: `action.notification` is canonical;
SBAR/phone/event note supports it; the action carries recipient, channel,
urgency, reason, response, callback status, and links to trigger evidence.
The action may `fulfills` a communication-required intent or `resolves` an
escalation loop. New V-NNOTE rule warns when note text/payload says
provider was notified but no `action.notification` exists in the same
window.

### a7-preceptor-attestation

**[open-schema] Nursing preceptor sign-off via `communication.attestation`
vs distinct nursing shape.** A6's attestation pattern was provider-focused
(resident/attending); nursing has parallel student/orientee/preceptor and
LPN/RN co-review contexts, but the underlying primitive is still
attestation. Current lean: reuse `communication.attestation` with
nursing-specific `author.role` and profile-driven timing windows; do not
add `communication.preceptor_attestation` or `action.verification` unless
fixtures prove the reused shape cannot carry the obligation. Profile-gated
openLoop closes when an attestation references the primary note.

### a7-a8-assessment-boundary

**[open-schema] When nursing-note statements must decompose into A8
structured observations.** Nursing notes routinely contain assessment text
("lungs coarse," "skin intact," "confused," "pain 7/10," "ambulated 20 ft,"
"pressure injury noted"). A8 should own structured head-to-toe and focused
findings; A7 cites and synthesizes. Current lean: strict for care-changing
facts — if a statement changes assessment, plan, safety state, monitoring,
or response obligations, require/cite a structured A8 sibling. Admission
notes require A8 citation; focused/event notes require trigger/action/
response evidence; routine progress notes cite material evidence but
stable narrative ("WDL") need not become events. Imported legacy notes
remain narrative-only with extraction debt rather than schema distortion.

### A7 accepted-direction notes

These were settled in the A7 council without elevating to standalone
questions:

- **No new A7 source kinds.** Use `author.role`, `source.ref`, and payload
  detail.
- **No new A7 event/storage primitive.** Notes remain `communication` plus
  Markdown body.
- **No note-level `fulfills`.** ADR 003 holds; actions fulfill, notes
  support.
- **No `effective_period` on note communications.** Use `effective_at` plus
  `data.window` per the A6 timing decision.
- **No A7 URI scheme.** Reuse event ids, note ids, and inherited
  `vitals://` / `io://` / `meddose://` windows.
- **No A7 current-state axis.** Nursing notes influence current state
  through co-authored structured events and views, not through note state.
