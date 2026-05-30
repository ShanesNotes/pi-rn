# pi-chart Context

`pi-chart` is the agent-native clinical chart for the `pi-rn` workspace. Architecturally, it is a durable clinical memory substrate that reuses legacy EHR rails where they are clinically valuable while adding AI-native context curation, navigation, projection, and accountability primitives.

## Domain role

- Owns agent-native clinical chart truth and clinical memory semantics.
- Stores append-oriented, provenance-rich clinical claims/events.
- Reuses legacy EHR rails such as patient, encounter, order, medication, note, lab, assessment, clinical-time, authorship, and audit concepts without cloning a full production EHR product.
- Provides read/write/view primitives for agents, tests, and future UI layers.
- Treats generated current state, summaries, and `_derived/` content as disposable views over canonical chart records.

## Core language

- **The chart is canonical. Current state is a query. Derived summaries are disposable.**
- **Agent-native clinical chart**: a patient-scoped clinical chart designed around durable clinical memory, AI-agent navigation, context curation, projection, and accountable human-agent workflows.
- **Clinical memory substrate**: the architectural role of `pi-chart` as append-oriented, provenance-rich patient memory over which current state, summaries, handoffs, and context packets are projected.
- **Patient chart**: clinician-facing term for the patient's charted clinical record.
- **Chart record**: clinician-facing term for a specific documented source or record in the patient chart.
- **Legacy EHR rails**: existing disciplined clinical-record concepts worth reusing, such as patient, encounter, orders, medications, notes, labs, assessments, clinical time, authorship, and audit.
- **Charted clinical fact**: a patient-scoped, time-bound, source-attributed clinical assertion or action that can be projected, corrected, reviewed, and included in task context.
- **Source-linked chart item**: clinician-facing umbrella for a chart-visible order, medication, lab result, vital sign, assessment, note, communication, task, or other chart item with visible source context.
- **Source**: primary clinician-facing trust label that shows where a chart item, care item, or view content came from, such as MAR, ICU note, lab result, flowsheet, order, report, or bedside verification.
- **Source document**: clinician-facing umbrella for a document, report, image, external record, or attachment referenced as a source.
- **Review state label**: clinician-facing label for source uncertainty or review need, such as Needs review, Source mismatch, May be outdated, Report only, or Source needed.
- **Lifecycle status label**: clinician-facing label for chart item lifecycle, such as Active, Updated, Corrected, Replaced, Entered in error, Canceled, Discontinued, or Resolved.
- **Attention cue label**: clinician-facing label for elevated relevance, such as Needs attention, Review priority, Safety flag, or Watch.
- **Cluster care**: clinician-facing action language for grouping compatible care items into a room entry, assessment window, or care episode when clinically appropriate.
- **Care cluster**: clinician-facing noun for a group of compatible care items that may be handled together.
- **Suggested cluster**: Pi-proposed care cluster that remains advisory and does not alter due times, source authority, or completion requirements.
- **Carry forward**: clinician-facing action or state for keeping unresolved care context visible for later in the shift or the next handoff.
- **Watch for next shift**: clinician-facing label for unresolved or nonurgent context that should remain visible to the next clinician.
- **Handoff View**: clinician-facing view for preparing source-linked carry-forward context for shift-to-shift handoff.
- **Pending care**: clinician-facing section label for open care items, unresolved work, and follow-up that still needs clinician attention.
- **Follow-up needed**: clinician-facing attention/action label for a specific care item or source-linked issue that needs later review or action.
- **Why am I seeing this?**: clinician-facing affordance that opens the source and relevance explanation for a surfaced item.
- **Source trail**: clinician-facing drill-down view showing source, time, author, review state, and why an item or view content was surfaced.
- **ContextPacket**: a task-scoped, content-addressed context artifact compiled from charted clinical facts and projections, recording included facts, omission rules, freshness, safety floors, and compiler/source versions.
- **ContextReceipt**: an accountability record that a specific actor, runtime, or workflow received or used a specific ContextPacket for a task at a known time.
- **Chart Review Packet**: clinician-facing view of task-scoped source-linked chart context compiled for a chart review, shift-start, evidence drill-down, or similar clinical attention mode.
- **Current Snapshot**: clinician-facing view of source-linked current chart items for a patient/encounter as of a visible time.
- **Patient banner**: clinician-facing scope area that shows patient identity, location, room, assignment, and other wrong-patient-risk context.
- **Current visit**: clinician-facing label for encounter scope.
- **As of**: clinician-facing label for the time boundary or freshness of a view.
- **Occurred**: clinician-facing label for the clinical time when an event, observation, or action happened.
- **Charted / Last charted**: clinician-facing label for the recorded time when an event, observation, or action was documented.
- **Effective**: clinician-facing timing label for orders, policies, or instructions where the time they take effect matters.
- **Context profile**: a named compilation shape for a recurring clinical attention mode, such as shift-start orientation, task-focused review, change-delta review, evidence drill-down, cold-history recall, or handoff.
- **Clinical attention signal**: a chart-visible cue that a charted clinical fact may need elevated relevance, urgency, verification, interruption, or handoff continuity.
- **Clinician-facing language**: the UI and workflow wording shown to nurses, physicians, APPs, and other clinical users over internal chart substrate primitives.
- **Clinician-facing view**: a source-linked clinician UI surface computed from chart substrate content, such as Shift Brain, Report View, Chart Review Packet, Task List, Handoff View, or Evidence Chain.
- **Report View**: clinician-facing source-linked view for shift report context that organizes high-attention patient information without becoming a chart note, final handoff, or paper-sheet authority.
- **Shift Brain**: clinician-facing per-patient view that organizes care priorities, tasks, due-soon work, watch/handoff items, and suggested care clusters for a clinician's shift.
- **Care item**: clinician-facing umbrella for a Shift Brain row or card that may represent a required task, time-sensitive action, routine reminder, suggested action, informational cue, or watch/handoff item.
- **Care item source label**: clinician-facing label explaining why a care item exists, such as Ordered, Protocol, Unit policy, Nursing plan, Patient/family request, Suggested by Pi, Device/import, or Chart-derived.
- **Care item authority label**: clinician-facing label explaining action posture, such as Required, Time-sensitive, Routine, Suggested, Info, or Watch/Handoff.
- **Order**: clinician-facing label for a formal provider, order-set, or sanctioned ordering-workflow instruction.
- **Plan**: clinician-facing label for documented clinical reasoning or intended direction that is not necessarily an order.
- **Goal**: clinician-facing label for a target or constraint, such as MAP, RASS, SpO2, mobility, pain, or fluid-balance target.
- **Nursing plan**: clinician-facing label for nurse-authored care intent or shift planning.
- **Protocol**: clinician-facing source label for accepted unit or clinical protocol-driven work.
- **Communication type label**: clinician-facing label for a concrete communication kind, such as Message, Call, Verbal order, Telephone order, Readback, Co-sign needed, Family update, or Handoff.
- **Problem**: clinician-facing label for a charted problem or problem-list style item.
- **Assessment**: clinician-facing label for a clinician-documented assessment.
- **Concern**: clinician-facing label for a softer or non-final current issue that should not be upgraded into a diagnosis without source support.
- **Working diagnosis**: clinician-facing label for a source-supported provisional diagnosis or working model.
- **Uncertain**: clinician-facing label for source-linked uncertainty.
- **Care timing label**: clinician-facing label for due or medication timing posture, such as Due now, Due soon, Scheduled, Delayed, Deferred, Held, Refused, Omitted, Given, Administered, Titrating, Waiting on..., Blocked, Bundled with care, or Carry forward.
- **Not appropriate now**: clinician-facing state or reason indicating the clinician judged a care item should not be performed in the current clinical context.
- **From handoff**: clinician-facing source label for verbal or report-derived context that orients care but is not chart truth unless charted or source-linked.
- **From monitor**: clinician-facing source label for monitor-observable values or cues that may prompt review without becoming chart truth by visibility alone.
- **From device**: clinician-facing source label for device-derived values or cues that may prompt review without becoming chart truth by import alone.
- **Imported**: clinician-facing source label for externally imported chart context that must preserve source, freshness, and review state.
- **Suggested by Pi**: clinician-facing source label for an assistant-generated care item or prompt that remains provisional until a clinician accepts, modifies, or dismisses it.
- **Pi**: clinician-facing name for the bounded in-chart assistant that can suggest, explain, cite, and prompt review without charting, completing, verifying, or deciding for the clinician.
- **Add to Shift Brain**: clinician-facing action that turns a provisional Pi suggestion into a clinician-owned care item without treating the suggestion itself as chart truth.
- **Done**: clinician-facing care-item state indicating the clinician marked work performed in a view without, by itself, proving a sanctioned chart record exists.
- **Charted**: clinician-facing care-item state indicating a sanctioned chart source exists for the performed work or documented clinical action.
- **Reviewed**: clinician-facing state indicating a clinician looked at a chart item, care item, or view content.
- **Verified**: clinician-facing state indicating a clinician checked a chart item, care item, or view content against bedside or source reality.
- **Review prompt action**: clinician-facing action language for uncertainty or mismatch prompts, such as Review, Verify, Check source, Check bedside, Reconcile, or Resolve.
- **Signed / Co-signed**: clinician-facing state indicating a formal documentation, order, or countersign authority action exists.
- **Hot context**: deterministic current-care context needed before immediate clinical reasoning, action, acceptance, rejection, or escalation.
- **Warm context**: recent or supporting evidence used to explain, verify, or expand hot context during chart digging.
- **Cold context**: source-linked longitudinal or background material retrieved when relevant without becoming current-care truth by default.
- **Current / acute care**: clinician-facing relevance section for hot context that is current, safety-relevant, or needed for immediate shift reasoning.
- **Recent course**: clinician-facing relevance section for warm context that explains the patient's recent trajectory, plans, trends, actions, or review history.
- **Baseline / history**: clinician-facing relevance section for cold context such as H&P, prior encounters, chronic conditions, baseline function, old consults, or background narrative.
- **STAT / now**: workflow-facing priority for immediate or safety-critical attention that may justify interruption.
- **Clinical claim/event envelope**: immutable, time-bound, source-attributed, linked clinical record.
- **Patient scope**: explicit `{ chartRoot, patientId }` confinement for public read/write calls.
- **View primitive**: pure read model such as timeline, current state, trend, evidence chain, open loops, or narrative.
- **Write boundary**: sanctioned APIs in `src/`, not raw file edits.
- **Clinical truth guardrail**: a domain-level rule preserved because it protects chart truth, not because prototype code happened to behave that way.
- **Observable charting seam**: the boundary where observable clinical signals, such as monitor vitals, become chart truth only after explicit adapter or clinician validation, preserving real-time clinician context and preventing hidden simulator foresight.

## Relationships

- An **Agent-native clinical chart** uses **Legacy EHR rails** as domain memory scaffolding without becoming a full production EHR clone.
- The **Patient chart** is the clinician-facing way to refer to canonical chart memory; a **Chart record** is a specific documented source in that chart.
- A **Charted clinical fact** is the pi-chart domain primitive beneath projections, context packets, workflow surfaces, and future ledger-backed storage.
- A **Source-linked chart item** is how clinician-facing UI should expose chart substrate content; normal screens should prefer concrete clinical labels such as order, medication, lab result, vital sign, assessment, note, communication, or task.
- **Source** is the clinician-facing label for provenance; evidence/provenance details remain available in drill-downs or developer-facing substrate docs.
- A **Source document** should be shown with type, date/time, author/source, and link when available.
- A **Review state label** flags source age, conflict, report-only status, or missing source; it is not a truth decision until a clinician resolves it through review or chart workflow.
- A **Lifecycle status label** summarizes correction or current-status posture while the Source trail preserves correction, replacement, and supersession history.
- An **Attention cue label** communicates why something is surfaced without implying autonomous action or alarm authority; Safety flag is reserved for safety-critical/current-risk posture and Watch is for nonurgent carry-forward.
- **Cluster care** may group **Care items**, but the grouping does not change each item's source, authority, due window, or completion criteria.
- **Carry forward** and **Watch for next shift** keep unresolved context visible, but the final handoff remains clinician-owned.
- **Pending care** is the clinician-facing view over open-loop/task-list projections; **Follow-up needed** marks a specific item without punitive framing.
- **Why am I seeing this?** opens a **Source trail**; the architectural view primitive behind that drill-down is an evidence chain.
- The **Clinical memory substrate** produces **View primitives** and **ContextPackets** from canonical chart records.
- A **Clinician-facing view** is the product-language counterpart of an architectural derived projection; it must keep source links, freshness, and non-authority visible.
- **Report View** may support nurse-to-nurse shift report, but it remains a derived clinician-facing view rather than a chart note, finalized handoff, or authoritative paper form.
- **Shift Brain** is a clinician-facing view over chart substrate content; it is not chart truth, an autonomous assistant plan, or a replacement for clinician judgment.
- A **Care item** is the clinician-facing counterpart of an internal workflow item; only care items with required/time-sensitive authority should read as obligations.
- A **Care item source label** explains origin, while a **Care item authority label** explains whether and how the clinician should treat it as an obligation, suggestion, or awareness cue.
- **Order**, **Plan**, **Goal**, **Nursing plan**, and **Protocol** are distinct clinician-facing labels; not every plan is an order and Pi suggestions do not become plans without clinician action.
- A **Communication type label** should name the concrete communication rather than showing generic communication-category language when possible.
- **Problem**, **Assessment**, **Concern**, **Working diagnosis**, **Uncertain**, and **Resolved** preserve different levels of clinical certainty and source authority.
- A **Care timing label** communicates timing or medication workflow posture without punitive wording; quick views may say **Given**, while MAR/chart-linked documentation should say **Administered** where precise.
- **From handoff** may orient the clinician while **Report only** marks that the content is not yet chart-linked truth.
- **From monitor**, **From device**, and **Imported** content can prompt review, but chart truth and task completion require charted or sanctioned workflow sources.
- **Suggested by Pi** care items use **Suggested** authority and do not become active obligations without clinician action.
- **Pi** is the clinician-facing product name for the bounded in-chart assistant; its outputs remain suggested, source-linked, and clinician-governed.
- **Add to Shift Brain**, Modify, and Dismiss are clinician-owned actions for Pi suggestions; **Done**, **Charted**, Defer, Waiting on..., Not appropriate now, and Carry forward are clinician-owned care-item handling labels.
- **Not appropriate now** records clinician judgment rather than failure to complete; Hold/Held should be reserved for actual medication or order hold semantics.
- **Done** and **Charted** are distinct: Shift Brain may show work marked done without implying chart documentation exists, and may show charted work only when a chart source supports it.
- **Reviewed**, **Verified**, and **Signed / Co-signed** are distinct authority states; review does not imply bedside verification or formal signature.
- **Review prompt action** labels carry different authority: Pi may prompt Review, Verify, Check source, or Check bedside, while Reconcile and Resolve remain clinician-owned sanctioned workflow outcomes.
- A **ContextPacket** is compiled from a **Context profile** plus a task frame, patient scope, query time, and available chart evidence.
- A **ContextPacket** composes chart facts, projections, and prior packets by reference or hash, not by copying packet contents into a second memory substrate.
- A **ContextReceipt** references a **ContextPacket**; it is not itself a clinical fact unless a future ADR explicitly promotes a receipt predicate for audit/governance.
- A **Chart Review Packet** is the clinician-facing view over a **ContextPacket**; the accountable compiled artifact remains **ContextPacket**.
- A **Current Snapshot** is a clinician-facing view over current-state queries and packet content; it is not an independent truth store.
- **Patient banner**, **Current visit**, and **As of** labels make patient/encounter/as-of scope visible for clinician-facing views.
- **Occurred**, **Charted / Last charted**, **Effective**, and **As of** expose clinically relevant time distinctions without forcing substrate bitemporal language into normal UI copy.
- **Clinical attention signals** may promote charted facts into **Hot context**, but they are evidence-linked cues rather than automatic chart truth.
- **Clinician-facing language** is the product vocabulary over substrate primitives; **provider** should be reserved for ordering, communication, and co-sign authority where that role distinction matters.
- **Hot context**, **Warm context**, and **Cold context** are context-access tiers, while **STAT / now**, due soon, routine, and handoff/watch are workflow-facing priority labels.
- **Current / acute care**, **Recent course**, and **Baseline / history** are clinician-facing relevance sections over hot/warm/cold access tiers; they should not be treated as disease-course labels because chronic history can become acutely relevant when linked to current care.
- A **Clinical truth guardrail** may be promoted from prior work only when it is source-cited, domain-level, and re-justified for V0.5.

## First-principles architecture stack

`pi-chart` should be reasoned about as a stack, not as a single "clinical memory" feature:

1. **Legacy EHR rails** — disciplined clinical-record concepts that make patient memory clinically usable.
2. **Chart truth substrate** — patient-scoped clinical claims/events with provenance, time, authorship, status, evidence, and correction semantics.
3. **Projection system** — deterministic read models over chart truth, such as current state, timeline, evidence chains, open loops, narrative, and handoff-style views.
4. **Context compiler** — task-scoped assembly of chart facts and projections into accountable ContextPacket-style artifacts with inclusion, omission, freshness, and safety-floor semantics.
5. **Agent navigation/access plane** — bounded read surfaces and navigation affordances for clinicians and AI agents.
6. **Governance/review/accountability** — human-agent authorship, proposal, review, attestation, correction, and audit semantics.
7. **Roadmap workflow surfaces** — handoff, MAR, worklist, order lifecycle, documentation relief, and clinical cockpit experiences built over the lower layers.

## Vocabulary discipline

Before implementation, overloaded prototype language must be cleansed into this context's domain vocabulary. Future agents should distinguish:

- domain primitives, such as **Charted clinical fact**;
- architectural roles, such as **Clinical memory substrate**;
- implementation evidence, such as brownfield envelopes, current views, fixtures, and generated prototypes;
- product/workflow surfaces, such as handoff, worklist, MAR, or cockpit.

When a lower-authority term is useful but misleading, preserve the evidence and rename the concept before it becomes implementation authority.

## Invariants

- Append-only clinical truth: corrections supersede or correct earlier records instead of mutating them.
- Every claim must carry source, clinical time, recorded time, author, and status.
- Patient isolation is mandatory; no cross-patient links or accidental writes outside the scoped patient chart.
- `_derived/` is never authoritative.
- Narrative note authoring should preserve paired note/event provenance when applicable.
- Whole-chart validation owns link resolution, contradiction/resolution checks, note-reference integrity, and transform provenance coherence.


## Boundary with pi-ledger

`pi-ledger` owns the reusable cryptographic claim-ledger kernel after ADR 020. `pi-chart` owns chart/EHR workflows, clinical views, adapters, and brownfield compatibility. `pi-chart` should consume `pi-ledger` through explicit adapters after the kernel interface is proven; it should not treat `pi-chart/src/claim-ledger/` as the canonical kernel home.

## Boundary with pi-sim

`pi-chart` may consume `pi-sim` public telemetry through explicit adapters, but must not depend on hidden simulator internals. The boundary is hidden-state versus observable-and-charted data: observable monitor vitals may become chart truth through the **Observable charting seam**, while hidden simulator/oracle state must never enter pi-chart or pi-agent context. `pi-sim/vitals/README.md` and `.lanes.json` define producer-side telemetry contracts.

## ADR authority

Read `pi-chart/docs/adr/` before changing chart primitives, lifecycle/status semantics, source taxonomy, evidence links, provenance, patient isolation, import behavior, or the clinical-memory architecture.

## Useful project docs

- `pi-chart/README.md` — primer and run commands.
- `pi-chart/DESIGN.md` — current spec and invariants.
- `pi-chart/ARCHITECTURE.md` — code map over the design.
- `pi-chart/ROADMAP.md` — shipped/deferred seams and growth path.

## Flagged ambiguities

- "chart/EHR subsystem" is retained only as historical shorthand; use **Agent-native clinical chart** for the north star and **Clinical memory substrate** for the architectural role.
- "canonical chart memory" and "clinical memory substrate" are architecture language; clinician-facing UI should say **the chart**, **Patient chart**, or **Chart record** as appropriate.
- "provider-facing UI" is ambiguous because `provider` can imply order-authoring physician/APP authority; use **clinician-facing language/UI** for the broader nurse/clinician product surface and reserve **provider** for order, communication, and co-sign contexts.
- "claim" is ambiguous across `pi-ledger` and `pi-chart`; use **Charted clinical fact** for the pi-chart domain primitive and reserve ledger-specific claim language for `pi-ledger` kernel mechanics.
- "charted clinical fact" is substrate/domain language, not ordinary UX copy; clinician-facing UI should use **Source-linked chart item** as the umbrella only when needed and otherwise name the concrete clinical thing.
- "provenance" and "evidence refs" are substrate language; clinician-facing UI should primarily say **Source**, with microcopy such as Last charted, Reviewed by, or Needs source where appropriate.
- "artifact ref" is substrate language; clinician-facing UI should use concrete labels such as **Document**, **Report**, **Image**, **External record**, or umbrella **Source document**.
- "mismatch", "stale", "report-only", and "source-needed" states should appear as review prompts, not accusations; use **Needs review**, **Source mismatch**, **May be outdated**, **Report only**, or **Source needed** in clinician-facing UI.
- "superseded" is substrate/history language; clinician-facing UI should usually say **Replaced** while preserving supersession lineage in the Source trail.
- "clinical attention signal" is internal language; clinician-facing UI should use **Needs attention**, **Review priority**, **Safety flag**, or **Watch**, and avoid **Alert** unless interruptive alerting is explicitly in scope.
- "care clustering" is domain/planning language; clinician-facing UI should use **Cluster care** for the action, **Care cluster** for the group, and **Suggested cluster** when Pi proposes the grouping.
- "handoff projection" is architecture language; clinician-facing UI should use **Handoff View**, **Carry forward**, and **Watch for next shift**, with clinician finalization before handoff authority.
- "open loop" is architecture/product-domain language; clinician-facing UI should say **Pending care** for the section and **Follow-up needed** for a specific item.
- "evidence chain" is architecture language; clinician-facing UI should use **Why am I seeing this?** for the affordance and **Source trail** for the drill-down.
- "derived projection" is architecture language, not ordinary UX copy; clinician-facing UI should say **view** or use a concrete surface name such as Shift Brain, Report View, Chart Review Packet, Task List, Handoff View, or Evidence Chain.
- "one-page nursing report projection" is docs/product-domain language; clinician-facing UI should say **Report View**, with optional subtitle **Shift report** when used during nurse-to-nurse report.
- "Shift Brain" is allowed as the product surface name, but avoid implying that the view itself creates obligations, completes work, or owns the clinician's plan.
- "workflow item" is internal/product-domain language; clinician-facing UI should use **Care item** as the umbrella and show concrete authority/status labels such as Required, Time-sensitive, Routine, Suggested, Info, or Watch/Handoff.
- "Ordered" and "Required" are not synonyms: use **Ordered** as a care item source label when an order exists, and **Required** as an authority label when an item must be addressed through human or sanctioned chart workflow.
- "intent" is substrate language; clinician-facing UI should distinguish **Order**, **Plan**, **Goal**, **Nursing plan**, and **Protocol**.
- "communication" is category language; clinician-facing UI should name the concrete type, such as **Message**, **Call**, **Verbal order**, **Telephone order**, **Readback**, **Co-sign needed**, **Family update**, or **Handoff**.
- "working model" is substrate/product-domain language; clinician-facing UI should distinguish **Problem**, **Assessment**, **Concern**, **Working diagnosis**, **Uncertain**, and **Resolved**, and Pi should not upgrade concerns into diagnoses.
- "overdue" should not be used as routine blame language; prefer precise timing labels such as **Due now**, **Delayed**, **Deferred**, **Waiting on...**, or **Blocked** with clinician-owned reasons.
- "skip" is unsafe and ambiguous for clinical work; use **Not appropriate now** when the clinician judges an item should not be done in the current context.
- "verbal report" and "handoff" content should not silently become chart truth; use **From handoff** as the source label and **Report only** as the review-state label when no chart source exists.
- "live value" should be avoided unless runtime freshness guarantees are explicit; use **From monitor**, **From device**, or **Imported** plus freshness/review labels instead.
- "agent suggestion" is internal language; clinician-facing UI should say **Suggested by Pi** for source and **Suggested** for authority, without implying accepted workflow authority.
- "bounded in-chart assistant" is architecture language; clinician-facing UI should say **Pi** or first-use **Pi, your chart assistant**, while preserving that Pi cannot chart, complete, verify, or decide for the clinician.
- "Accept" is ambiguous because it can sound like accepting clinical truth; use **Add to Shift Brain** when a clinician turns a Pi suggestion into a care item.
- "Done / Charted" should not be collapsed into one semantic state; use **Done** for view-level work completion and **Charted** only when documentation source exists.
- "attestation" is internal/admin/legal language; clinician-facing UI should use **Reviewed**, **Verified**, **Signed**, or **Co-signed** according to the actual authority action.
- "review prompt" copy should use action-specific verbs; do not let Pi wording imply it reconciled or resolved source conflicts on its own.
- "context bundle" and "memory proof" are prototype/evidence terms; use **ContextPacket** for compiled task context and **ContextReceipt** for accountable context handoff/use records.
- "ContextPacket" is internal/accountability language; clinician-facing UI should say **Chart Review Packet** for the view shown to clinicians.
- "current-care truth" is too absolute for normal UI copy; clinician-facing UI should say **Current Snapshot** and show source, review state, and as-of time.
- "patient/encounter/as-of scope" is substrate/interface language; clinician-facing UI should show **Patient banner**, **Current visit**, and **As of** labels.
- "clinical time", "recorded time", and "effective time" are substrate/interface language; clinician-facing UI should use **Occurred**, **Charted / Last charted**, and **Effective** where the distinction affects interpretation or safety.
- "Hot/warm/cold" is access-tier architecture language; clinician-facing UI should use **Current / acute care**, **Recent course**, and **Baseline / history** for relevance sections without implying every condition is clinically acute, subacute, or chronic.
- "Invariant" is too broad for V0.5 salvage planning; use **Clinical truth guardrail** when the rule is safe to preserve because it protects chart truth.
