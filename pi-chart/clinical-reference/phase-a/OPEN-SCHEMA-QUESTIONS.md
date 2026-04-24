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
| Accepted direction | [A0a structural split](#a0a-structural-event-split), [A1/A2 actionability tier](#a2-actionability-tier), [A3 shared metrics](#a3-shared-metrics), [A4 dose occurrence](#a4-dose-occurrence-and-cardinality), [A4b list-shaped observation](#a4b-list-shaped-observation) | Use as fixture-authoring guidance; identify what validator/view/API work would make it durable. |
| Open | [A0b read receipt](#a0b-read-receipt), [A3 oxygen context](#a3-oxygen-context), [A3 alarm events](#a3-alarm-and-artifact-events), [A4 titration interval episode](#a4-titration-interval-episode), [A4 attestation boundary](#a4-attestation-waste-boundary), [A4b current-state axes](#a4b-medication-current-state-axes), [A4b external retrieval source kinds](#a4b-external-retrieval-source-kinds) | Produce tradeoffs and a recommended ADR shape. Do not silently invent new source kinds, axes, or event types. |
| Deferred | [A0c longitudinal problem thread](#a0c-problem-key), [A0c sensitive access](#a0c-sensitive-category), [A0a location analytics](#a0a-location-context-segment) | Preserve hooks only. Do not let Phase A broaden into full access control, longitudinal registry, or analytics platform work. |

## Cross-cutting index

| Theme | Question anchors | Current lean |
| --- | --- | --- |
| Subtype consolidation | [A0b constraint subtype](#a0b-consolidated-subtype), [A2 diagnostic result subtype](#a2-diagnostic-result-subtype) | Prefer consolidated subtype plus payload domain fields unless hard validation needs justify type growth. |
| Order/result fulfillment | [A1 fulfillment link](#a1-fulfillment-link), [A2 intermediate-action model](#a2-intermediate-action-model) | Prefer intermediate actions that fulfill intents; observations support the action. |
| Temporal semantics | [A1 effective_at](#a1-effective-at), [A2 effective_at](#a2-effective-at), [A0b effective_period](#a0b-effective-period-allow-list), [A0c effective_period](#a0c-effective-period-allow-list), [A0a location intervals](#a0a-location-context-segment) | Keep physiologic/event time distinct from chart-actionable time; extend interval primitives only where query value is clear. |
| Derived/cache files | [A0b constraints file role](#a0b-constraints-file-role), [A0a structural split](#a0a-structural-event-split) | Event stream is authoritative; structural/cache files are identity or performance surfaces. |
| Result actionability and closure | [A1 risk tier](#a1-risk-tier), [A2 coverage threshold](#a2-review-coverage-threshold), [A2 implicit closure](#a2-implicit-closure-via-citation), [A2 actionability tier](#a2-actionability-tier) | Prefer policy-significant explicit review; routine closure can stay derived or implicit. |
| Stream/window addressability | [A3 stream sample identity](#a3-stream-sample-identity), [A4 dose occurrence and cardinality](#a4-dose-occurrence-and-cardinality) | Prefer deterministic virtual keys where dense materialized child events would create volume without clinical value. |
| Context/state axes | [A3 oxygen context](#a3-oxygen-context), [A4 titration interval episode](#a4-titration-interval-episode) | Keep current state derived from events; add view axes only when multiple artifacts need the same projection pattern. |
| Medication fulfillment and response | [A4 dose occurrence and cardinality](#a4-dose-occurrence-and-cardinality), [A4 response obligation closure](#a4-response-obligation-closure), [A4 attestation waste boundary](#a4-attestation-waste-boundary) | Preserve order-action-response auditability without widening `fulfills` unless an ADR explicitly changes it. |
| Medication reconciliation | [A4b home-med addressability](#a4b-homemed-addressability), [A4b list-shaped observation](#a4b-list-shaped-observation), [A4b reconciliation lifecycle](#a4b-reconciliation-lifecycle-and-discharge-closure) | Keep home-med snapshots distinct from inpatient medication intents; discharge instructions are canonical communication, not UI-only output. |

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
