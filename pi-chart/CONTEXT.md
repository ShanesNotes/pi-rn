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
- **Legacy EHR rails**: existing disciplined clinical-record concepts worth reusing, such as patient, encounter, orders, medications, notes, labs, assessments, clinical time, authorship, and audit.
- **Charted clinical fact**: a patient-scoped, time-bound, source-attributed clinical assertion or action that can be projected, corrected, reviewed, and included in task context.
- **ContextPacket**: a task-scoped, content-addressed context artifact compiled from charted clinical facts and projections, recording included facts, omission rules, freshness, safety floors, and compiler/source versions.
- **ContextReceipt**: an accountability record that a specific actor, runtime, or workflow received or used a specific ContextPacket for a task at a known time.
- **Context profile**: a named compilation shape for a recurring clinical attention mode, such as shift-start orientation, task-focused review, change-delta review, evidence drill-down, cold-history recall, or handoff.
- **Clinical attention signal**: a chart-visible cue that a charted clinical fact may need elevated relevance, urgency, verification, interruption, or handoff continuity.
- **Hot context**: deterministic current-care context needed before immediate clinical reasoning, action, acceptance, rejection, or escalation.
- **Warm context**: recent or supporting evidence used to explain, verify, or expand hot context during chart digging.
- **Cold context**: source-linked longitudinal or background material retrieved when relevant without becoming current-care truth by default.
- **STAT / now**: workflow-facing priority for immediate or safety-critical attention that may justify interruption.
- **Clinical claim/event envelope**: immutable, time-bound, source-attributed, linked clinical record.
- **Patient scope**: explicit `{ chartRoot, patientId }` confinement for public read/write calls.
- **View primitive**: pure read model such as timeline, current state, trend, evidence chain, open loops, or narrative.
- **Write boundary**: sanctioned APIs in `src/`, not raw file edits.
- **Clinical truth guardrail**: a domain-level rule preserved because it protects chart truth, not because prototype code happened to behave that way.
- **Observable charting seam**: the boundary where observable clinical signals, such as monitor vitals, become chart truth only after explicit adapter or clinician validation, preserving real-time clinician context and preventing hidden simulator foresight.

## Relationships

- An **Agent-native clinical chart** uses **Legacy EHR rails** as domain memory scaffolding without becoming a full production EHR clone.
- A **Charted clinical fact** is the pi-chart domain primitive beneath projections, context packets, workflow surfaces, and future ledger-backed storage.
- The **Clinical memory substrate** produces **View primitives** and **ContextPackets** from canonical chart records.
- A **ContextPacket** is compiled from a **Context profile** plus a task frame, patient scope, query time, and available chart evidence.
- A **ContextPacket** composes chart facts, projections, and prior packets by reference or hash, not by copying packet contents into a second memory substrate.
- A **ContextReceipt** references a **ContextPacket**; it is not itself a clinical fact unless a future ADR explicitly promotes a receipt predicate for audit/governance.
- **Clinical attention signals** may promote charted facts into **Hot context**, but they are evidence-linked cues rather than automatic chart truth.
- **Hot context**, **Warm context**, and **Cold context** are context-access tiers, while **STAT / now**, due soon, routine, and handoff/watch are workflow-facing priority labels.
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
- "claim" is ambiguous across `pi-ledger` and `pi-chart`; use **Charted clinical fact** for the pi-chart domain primitive and reserve ledger-specific claim language for `pi-ledger` kernel mechanics.
- "context bundle" and "memory proof" are prototype/evidence terms; use **ContextPacket** for compiled task context and **ContextReceipt** for accountable context handoff/use records.
- "Invariant" is too broad for V0.5 salvage planning; use **Clinical truth guardrail** when the rule is safe to preserve because it protects chart truth.
