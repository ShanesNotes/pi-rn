# Phase A open schema questions

Canonical catalog of open schema questions surfaced by prior Phase A efforts.

Coverage:
- A0a patient demographics / encounter
- A0b active constraints synthesis
- A0c problem list synthesis
- A1 lab results
- A2 results review

This file is a compilation surface. Source-specific sections remain authoritative
for full clinical rationale and references.

## Cross-cutting index

| Theme | Question anchors | Current lean |
| --- | --- | --- |
| Subtype consolidation | [A0b constraint subtype](#a0b-consolidated-subtype), [A2 diagnostic result subtype](#a2-diagnostic-result-subtype) | Prefer consolidated subtype plus payload domain fields unless hard validation needs justify type growth. |
| Order/result fulfillment | [A1 fulfillment link](#a1-fulfillment-link), [A2 intermediate-action model](#a2-intermediate-action-model) | Prefer intermediate actions that fulfill intents; observations support the action. |
| Temporal semantics | [A1 effective_at](#a1-effective-at), [A2 effective_at](#a2-effective-at), [A0b effective_period](#a0b-effective-period-allow-list), [A0c effective_period](#a0c-effective-period-allow-list), [A0a location intervals](#a0a-location-context-segment) | Keep physiologic/event time distinct from chart-actionable time; extend interval primitives only where query value is clear. |
| Derived/cache files | [A0b constraints file role](#a0b-constraints-file-role), [A0a structural split](#a0a-structural-event-split) | Event stream is authoritative; structural/cache files are identity or performance surfaces. |
| Result actionability and closure | [A1 risk tier](#a1-risk-tier), [A2 coverage threshold](#a2-review-coverage-threshold), [A2 implicit closure](#a2-implicit-closure-via-citation), [A2 actionability tier](#a2-actionability-tier) | Prefer policy-significant explicit review; routine closure can stay derived or implicit. |

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
