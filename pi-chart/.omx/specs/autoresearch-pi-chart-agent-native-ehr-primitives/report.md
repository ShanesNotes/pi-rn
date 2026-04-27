# Improving pi-chart primitives for an agent-native EHR

## Bottom line

pi-chart already has a strong **clinical-fact substrate**: one append-only envelope stream, strict per-patient scope, provenance on every write, and a compact set of six read primitives. The biggest remaining gap is not "more note types" or "more UI." It is a missing layer for **workflow obligations, reusable definitions, richer provenance/attestation, and interval/context modeling**.

In short:

- **Keep** the current event-stream thesis.
- **Do not** turn legacy packaging units (`MAR`, `orderset`, `provider note`) into first-class primitives by default.
- **Add** the minimum extra primitive power needed for an agent to safely hold obligations, inherit protocols, explain authority, and manage review loops over time.

## What pi-chart already gets right

### 1. The core storage thesis is good
Repo evidence: `README.md:10-35`, `README.md:141-160`.

The design choice that "the chart is canonical; current state is a query; derived summaries are disposable" is exactly the right foundation for agent memory. It gives the agent:

- durable longitudinal state,
- reversible projections,
- append-only auditability,
- a clean separation between raw claims and rendered views.

This is stronger than most "AI memory" systems because it is already shaped like a chart, not a scratchpad.

### 2. Per-patient scope and write boundaries are load-bearing
Repo evidence: `README.md:74-121`, `README.md:149-159`.

`PatientScope`, explicit authoring, and the rule that agents go through `src/` instead of raw file edits are the right trust boundaries for an agent-native EHR.

### 3. Primitive discipline is a real advantage
Repo evidence: `clinical-reference/phase-a/PHASE-A-CHARTER.md:72-100`.

The repo is already resisting a common failure mode: promoting every legacy artifact name into a schema primitive. That restraint should continue.

## Where the current primitives are thin

### A. Facts are modeled better than obligations
Repo evidence: `README.md:123-139`, `src/types.ts:279-287`, `src/views/openLoops.ts:1-19`, `ROADMAP.md:56-67`.

pi-chart can represent observations, assessments, intents, actions, communications, and artifacts. That is enough to reconstruct many clinical stories.

But an agent-native EHR also needs first-class answers to:

- Who owns this loop now?
- Was a result merely available, or actually reviewed?
- What is waiting for a human vs. safe for the agent?
- What failed, was declined, or timed out?
- What protocol or order set authorized this next step?

`openLoops()` is already carrying some of this burden, but it is being inferred from `intent` + `fulfills` + `due_by`, and even the repo notes a gap around a first-class `failed` status.

### B. There is no explicit definition/protocol layer
Repo evidence: `README.md:193-208`, `ROADMAP.md:32-67`, `clinical-reference/phase-a/PHASE-A-CHARTER.md:74-90`.

The current primitives model requests (`intent`) and events (`action`, `observation`, etc.), but not reusable **definitions** such as:

- monitoring protocols,
- escalation ladders,
- order sets,
- standing nursing/RT protocols,
- care pathways.

FHIR workflow explicitly separates **definitions, requests, and events** and treats all three as important workflow categories ([HL7 FHIR Workflow](https://hl7.org/fhir/R5/workflow.html)). pi-chart currently has the request/event half, but not the definition half.

### C. Provenance is present, but not rich enough for delegation and attestation
Repo evidence: `README.md:146-155`, `src/types.ts:66-77`.

Current provenance is mostly `author` + `source`. That is enough for authorship, but not for an agent-native clinical environment where the system must often distinguish:

- author vs performer vs reviewer,
- agent draft vs human sign-off,
- who acted on behalf of whom,
- what authority or protocol justified the act,
- attested vs unreviewed content.

FHIR Provenance is useful here because it explicitly models actor roles, delegation, encounter association, and "basedOn" workflow authorization ([HL7 FHIR Provenance](https://fhir.hl7.org/fhir/provenance.html)).

### D. Time is point-based more than interval-based
Repo evidence: `README.md:161-166`, `src/evidence.ts`, `ROADMAP.md:63-64`, `clinical-reference/phase-a/PHASE-A-TEMPLATE.md` and Track A notes.

pi-chart handles `effective_at`, `recorded_at`, and even `vitals://` interval evidence well. But many clinically important states are not point facts:

- oxygen-device epochs,
- infusion/titration intervals,
- vent-setting periods,
- care-location segments,
- NPO / restraint / isolation windows,
- "review required by X unless acknowledged" windows.

Those are awkward if the only general temporal primitive is point-in-time events plus an observation-specific `vitals://` interval URI.

### E. Documents/results need a stronger metadata pattern
Repo evidence: `CLAIM-TYPES.md:220-241`, `clinical-reference/phase-a/a2-results-review.md:5-22`, `clinical-reference/phase-a/a2-results-review.md:74-116`.

The repo's A2 draft is already discovering this: a diagnostic result is not just a file pointer. It is a compound of:

- narrative interpretation,
- native artifact,
- lifecycle (preliminary/final/amended/corrected),
- review acknowledgment,
- downstream action.

FHIR DocumentReference is useful not because pi-chart should become FHIR internally, but because it highlights a real distinction: the provenance of the document itself is not the same as the provenance of the record that indexes it ([HL7 FHIR DocumentReference](https://www.hl7.org/fhir/R5/documentreference.html)). pi-chart's current `artifact_ref` is narrower than that distinction.

## Recommended primitive improvements

## Priority 1 — Add an explicit workflow-obligation primitive layer

### Recommendation
Introduce a primitive contract for **obligations/reviews/tasks**, either by:

1. extending `intent` + `action` with a canonical workflow profile, or
2. adding a narrowly scoped new primitive if the current grammar becomes too contorted.

### Minimum fields
Whether this stays as `intent.subtype = task|review_required|monitoring_plan` or becomes a new type, the primitive needs:

- `owner` / assignee,
- `requested_by`,
- `due_by` / SLA,
- `priority`,
- `status_detail` with at least `pending | in_progress | completed | failed | declined | cancelled`,
- `based_on` / protocol or order authorization,
- `completion_reason`,
- optional `requires_human_role` or `authority_gate`.

### Why this matters
This is the single biggest gap between "durable chart memory" and an actual **agent-native EHR substrate**. Agents need more than facts; they need durable obligations with explicit ownership and closure semantics.

### Why now
The repo already has the symptom:

- `openLoops()` is inferring a workflow state machine,
- `failed` exists in view logic but not the main status enum,
- Track A is surfacing result-review and acknowledgment loops.

### Design advice
Start by **profiling existing types**, not by exploding the grammar. A good first pass is:

- `intent.subtype = review_required | monitoring_plan | task`
- `action.subtype = review_completion | escalation | refusal | cancellation`

If that becomes too awkward after two or three real domains, then promote a dedicated primitive.

## Priority 2 — Add a definition/protocol layer outside the patient event stream

### Recommendation
Create a **definition layer** for reusable machine-readable protocols, separate from patient history but referenceable from it.

Examples:

- oxygen escalation protocol,
- sepsis resuscitation pathway,
- q2h neuro checks,
- orderset templates,
- monitoring cadences,
- standing RN/RT protocols.

### Shape
These should not be patient events. They belong in a repo-level definitions space, e.g.:

- `definitions/plan/*.yaml`
- `definitions/activity/*.yaml`

Patient-local `intent` or workflow obligations can then carry `definition_id` / `based_on_definition`.

### Why this matters
FHIR's workflow split between definitions, requests, and events is helpful here ([HL7 FHIR Workflow](https://hl7.org/fhir/R5/workflow.html)). pi-chart already has requests/events. Definitions let the agent execute from reusable logic without copying protocol text into every chart event.

### Design advice
Keep definitions:

- versioned,
- non-authoritative for patient truth,
- referenceable from patient events,
- safe to evolve without mutating patient history.

## Priority 3 — Enrich provenance into actor/authority/attestation semantics

### Recommendation
Evolve provenance beyond `{ author, source }` into a richer actor model.

### Minimum additions
- `performers[]` or `actors[]` with role/function,
- `on_behalf_of`,
- `attested_by` / `attested_at`,
- `review_status`,
- `authority_basis` (standing order, protocol, human instruction, simulation feed, agent inference),
- optional `human_confirmation_required`.

### Why this matters
An agent-native EHR must distinguish:

- the agent observing a result,
- the agent inferring an assessment,
- a human confirming or rejecting it,
- a nurse executing a standing protocol,
- a radiologist authoring a read,
- an attending cosigning or amending it.

The current model can say who wrote something, but not the richer trust story.

### External framing
FHIR Provenance shows why this is useful: workflow authorization, encounter association, agent role, and delegation are all first-class concerns even when the underlying clinical facts remain event-like ([HL7 FHIR Provenance](https://fhir.hl7.org/fhir/provenance.html)).

## Priority 4 — Generalize interval/context primitives

### Recommendation
Introduce a generalized **interval/context** primitive instead of relying on point events plus one special-case `vitals://` interval reference.

### Candidate uses
- oxygen therapy epoch,
- infusion / titration window,
- ventilator setting segment,
- ICU location segment,
- "NPO until" / restraint duration / isolation period,
- coverage or responsibility window,
- review obligation windows.

### Options
1. add `effective_period` to a subset of events,
2. introduce a structured `interval_ref` evidence shape beyond vitals,
3. add a dedicated context/segment profile for location and care-state intervals.

### Why this matters
The repo already knows this is unresolved: ICU stay granularity is an open seam. Interval modeling is likely to become foundational for realistic ICU content, not an edge case.

## Priority 5 — Upgrade result/document modeling without abandoning the current grammar

### Recommendation
Keep the current grammar, but make the **document/result pattern** first-class enough for agent use.

### Likely pattern
- `observation.subtype = diagnostic_result` (or domain-specific subtype)
- linked `artifact_ref`
- linked `action.subtype = result_review`
- linked `communication` for critical callbacks
- richer lifecycle fields like `status_detail = preliminary|final|amended|corrected`

### Why this matters
The A2 note is pointing to a real primitive need: the agent must know not only that a result exists, but whether it was reviewed, whether it changed the plan, and whether its artifact and narrative can be separately reasoned over.

### External framing
FHIR Observation emphasizes that observations are event resources; FHIR DocumentReference emphasizes that document metadata and document provenance are their own concern ([HL7 FHIR Observation](https://www.hl7.org/fhir/observation.html), [HL7 FHIR DocumentReference](https://www.hl7.org/fhir/R5/documentreference.html)). pi-chart can borrow that separation without adopting FHIR internally.

## Priority 6 — Add a semantic profile registry for subtype/data contracts

### Recommendation
Keep open subtypes, but stop relying on string convention alone as the long-term semantic contract.

### Add
A lightweight profile registry for:

- stable subtype names,
- required data fields per subtype/profile,
- normalized codes/units where relevant,
- allowed status/detail values,
- links expectations,
- which views should consume the subtype.

### Why this matters
Agent-native systems need predictable machine semantics. Freeform payloads are flexible, but they can become brittle when multiple writers (agent, extension, importer, human tools) must reason over the same subtype.

### Design advice
Do **not** jump straight to full ontology bureaucracy. Start with profile descriptors that sit one level above the raw schema.

## Priority 7 — Promote problem/concern threads into a stronger longitudinal primitive

### Recommendation
Treat `assessment.subtype = problem` as a real longitudinal thread with durable identity and lifecycle, not just a momentary interpretation.

### Additions
- stable `problem_id`,
- onset / abatement,
- active/resolved/inactive state,
- owner / responsible team,
- severity / stage / priority,
- evidence backlinks and supersession chain.

### Why this matters
For an agent, the problem list is the organizing scaffold for assessment, planning, and handoff. Right now pi-chart can represent problems, but a stronger problem-thread contract would make `currentState()` and `openLoops()` more reliable coordination surfaces.

## Recommended sequencing

### Phase A — workflow-first hardening
1. Add workflow-obligation profile and richer terminal states.
2. Add richer provenance/attestation fields needed for agent vs human trust boundaries.
3. Extend `openLoops()` from inferred task list toward an obligation view over the richer workflow profile.

### Phase B — definition and interval support
4. Add repo-level protocol/definition artifacts.
5. Add interval/context primitives and generalized interval evidence references.

### Phase C — domain-rich profiles
6. Lock the result/document pattern.
7. Strengthen problem threads.
8. Add the semantic profile registry.

This order matters because the workflow/authority gap is what most directly blocks safe agent behavior.

## Anti-goals

Do **not**:

- replace the internal model with FHIR resources,
- add new top-level primitives just because a legacy EHR has a named module,
- turn `_derived/` outputs into source-of-truth state,
- collapse authorship, attestation, review, and provenance into one overloaded field,
- treat every result as requiring an explicit review event.

## Highest-confidence conclusion

The next major evolution of pi-chart should not be "more content types." It should be **a better contract for obligations, protocol inheritance, authority, and time-bounded context**. The current primitives are already good at storing clinical facts. To become an agent-native EHR substrate, pi-chart now needs to become equally good at storing **what must happen next, who is allowed to do it, under what protocol, and whether it was truly acknowledged and completed**.

## Evidence vs inference

### Direct repo evidence
- pi-chart explicitly defines itself as an append-oriented, provenance-rich chart substrate, not an EHR clone: `README.md:3-6`.
- The repo's core thesis is canonical chart + disposable derived views: `README.md:10-16`.
- The fixed grammar and schema-entropy discipline are explicit in Phase A charter: `clinical-reference/phase-a/PHASE-A-CHARTER.md:72-100`.
- `openLoops()` already contains a workflow state machine and a documented `failed` seam: `src/types.ts:279-287`, `src/views/openLoops.ts:1-19`, `ROADMAP.md:56-64`.
- Results-review research is already surfacing a cross-cutting acknowledgment primitive need: `clinical-reference/phase-a/a2-results-review.md:5-22`, `:98-118`.

### External standards framing
- HL7 FHIR Workflow distinguishes definitions, requests, and events, which maps cleanly onto pi-chart's missing definition layer: <https://hl7.org/fhir/R5/workflow.html>
- HL7 FHIR Provenance shows why richer actor/authority modeling matters: <https://fhir.hl7.org/fhir/provenance.html>
- HL7 FHIR Observation and DocumentReference clarify the event-vs-document split useful for pi-chart result modeling: <https://www.hl7.org/fhir/observation.html>, <https://www.hl7.org/fhir/R5/documentreference.html>

