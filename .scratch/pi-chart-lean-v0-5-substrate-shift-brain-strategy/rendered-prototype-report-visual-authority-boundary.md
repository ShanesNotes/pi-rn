# Rendered/prototype/report visual authority boundary

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/14-rendered-prototype-report-visual-authority-boundary.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/one-page-nursing-report-projection.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/shift-start-workflow-tracer.md`

## Purpose

Define how report visuals, rendered prototypes, generated UI, screenshots, design assets, tab names, component names, public API shapes, and disposable `_derived` output may inform the lean v0.5 shift-brain strategy without becoming substrate authority.

Visual and prototype artifacts are valuable because they preserve real workflow pressure: what nurses look for during report, what needs to stay glanceable, and which clinical questions a screen or report sheet should answer. They are unsafe when copied as chart truth, storage shape, API shape, component taxonomy, or permanent medical-record structure.

## Authority stance

| Artifact type | Allowed role | Not allowed role |
| --- | --- | --- |
| Corewell-style nursing report image or paper report sheet | Workflow/product evidence for attention categories and report-time questions | Canonical chart truth, permanent medical record, UI mandate, storage/API authority |
| Rendered prototype or screenshot | Evidence of navigation pressure, grouping pressure, and user comprehension needs | Domain schema, required layout, final visual design, source-of-truth state |
| Generated UI artifacts and `_derived` output | Disposable rendering/projection evidence that may reveal useful clinical questions | Accepted chart memory, durable facts, final API, reusable substrate model |
| Tab names, component names, route names, public API shapes | Hints about how prototype authors organized a question | Clinical ontology, canonical memory categories, storage shape, adapter contract |
| Design-system assets, logos, color, spacing, static mockups | Product/design reference for later UI work | Clinical authority, chart memory, workflow-completion evidence |

The durable substrate remains canonical chart facts/actions/notes/refs plus rebuildable derived projections. Visual artifacts can ask good questions; they do not answer those questions as chart truth.

## Safe borrowing

Future agents may borrow these lessons from visuals and prototypes:

- clinical questions the artifact tries to answer, such as "What must I not miss before entering the room?";
- attention categories, such as code status, isolation/precautions, consults, allergies, admission context, principal problem, relevant history, drips/infusions, medication context, blood-pressure goals, lines/tubes/drains, wounds, mobility/fall risk, abnormal labs, to-do items, family/social context, and safety checks;
- navigation affordances, such as making source review reachable, grouping related clinical questions, exposing stale/source-needed/conflicting state, or keeping handoff/watch visible;
- workflow pressure, such as report-time glanceability, bedside verification, med-pass planning, care clustering, and assessment charting sequence;
- source-state prompts, such as source-linked, source-needed, report-only, conflicting, stale, or not-applicable;
- mismatch/review prompts when report, chart, prototype display, or bedside-visible information disagree;
- usability constraints, such as avoiding alarm fatigue and keeping high-risk items prominent.

Borrowed lessons must be translated into product/domain language and linked back to canonical chart memory or explicit source-needed/report-only caveats.

## Unsafe borrowing

Future agents must not borrow these as substrate authority:

- storage shape, database tables, JSON nesting, cache shape, or file layout;
- public API shape, endpoint names, request/response objects, adapter contracts, or generated payload shape;
- exact UI layout, screen flow, visual hierarchy, colors, spacing, component anatomy, or print layout;
- tab names, component names, route names, local variable names, CSS classes, or generated IDs;
- screenshot text as accepted clinical fact without chart source linkage;
- disposable `_derived` content as durable chart truth;
- generated artifacts or generated summaries as accepted clinical memory;
- prototype state as review/attestation/completion state;
- canonical chart schema from a visual or generated artifact;
- cross-patient assignment orchestration as first substrate layer;
- hidden simulator, oracle, or validation internals as clinical evidence.

A useful prototype can be wrong as a substrate model. The safe move is to extract the clinical question, then ask which canonical fact/action/note/ref or derived projection should answer it.

## Report visual category source-linking

When a report visual category survives into the product/domain contract, it should point back to canonical chart memory or an explicit source state.

| Visual/report category | Safe domain interpretation | Canonical source or caveat |
| --- | --- | --- |
| Patient/room/assignment frame | Scope the view to the right patient, encounter, room, assignment, and as-of time | Identity/encounter/assignment facts; never cross-patient visual context |
| Code status | Current safety constraint | Charted order/constraint/communication with source/time/review state |
| Isolation/precautions/allergies | Current harm-prevention context | Charted precautions/allergy/intolerance facts; source-needed if only seen on report sheet |
| Consults/coverage | Who is involved and what is pending | Consult orders, notes, communications, provider/team refs |
| Admission context/principal problem/relevant history | Why the patient is here and what background matters | H&P, ICU note, problem/assessment facts, cold-history refs with hot/warm/cold caveat |
| Drips/infusions/medication context/BP goals | Current medication and hemodynamic safety | Orders, MAR/actions, infusion documentation, vitals/goals; mismatch prompts if report/chart differ |
| Lines/tubes/drains/wounds/mobility/fall risk | Bedside care planning and safety pressure | LDA/device facts, procedures, nursing assessments, wound notes/orders, precautions |
| Abnormal labs/results | Trend, review, or action-changing evidence | Lab/diagnostic observations plus review actions; critical/unreviewed stays prominent |
| To-do/work items | Pending or planned workflow | Intents, actions, workflow-item projections; human owns completion |
| Family/social/context | Communication and support background | Notes/communications/social-history facts; privacy/policy and source age caveats |
| Safety checks | Prevent missed high-risk or routine safety work | Orders, policies/protocols, constraints, assessment cadence, workflow items |

If the visual category cannot be linked, mark it `source-needed`, `report-only`, `stale`, or `conflicting` rather than promoting it.

## Per-patient first, assignment-level later

The lean v0.5 slice is per-patient first. Assignment-level nurse brain is a later aggregation/orchestration projection over multiple patient-scoped workflow items.

This means:

1. each report projection, chart-digging packet, workflow item, mismatch prompt, care cluster, and handoff/watch item must remain patient/encounter/as-of scoped;
2. cross-patient prioritization may later aggregate per-patient items, but it should not define the first canonical substrate;
3. assignment selection is a scoping step, not a license to merge patient truth;
4. assignment-level views may borrow navigation pressure from prototypes, but the underlying source/authority still belongs to per-patient items;
5. future cross-patient orchestration must preserve safety-critical prominence without hiding source links or human completion authority.

A visual showing multiple patients can inspire orchestration questions. It cannot define cross-patient storage, ranking, or source-of-truth state in this slice.

## Boundary checks for future agents

Before using a visual/prototype/generated artifact as evidence, ask:

1. What clinical question is this artifact trying to help the nurse answer?
2. Which canonical chart facts/actions/notes/refs could answer that question?
3. Is the artifact showing chart-linked truth, report-only material, a generated summary, or disposable `_derived` output?
4. Is any field stale, conflicting, source-needed, or missing provenance?
5. Am I copying UI/component/API/storage shape instead of translating a clinical lesson?
6. Does this preserve per-patient scope before assignment-level aggregation?
7. Does this preserve human authority over charting, review, task completion, reconciliation, and final handoff?
8. Does this avoid hidden `pi-sim`, backend/vector/OpenBrain/storage/runtime/access-plane, adapter, and `pi-ledger` kernel decisions?

If the answer is unclear, keep the visual as evidence only and record the open question rather than inventing substrate authority.

## Assistant behavior

The bounded in-chart assistant may:

- cite a report visual or prototype as workflow/product evidence;
- extract clinical questions and attention categories from a visual artifact;
- suggest source-linked projection fields that answer those questions;
- flag when a visual category is source-needed, report-only, stale, or conflicting;
- explain why a category belongs in a one-page report or chart-digging packet;
- preserve generated summaries as derived/provisional;
- recommend future UI affordance pressure without mandating implementation shape.

The assistant may not:

- treat a screenshot, mockup, generated UI, or `_derived` output as canonical chart memory;
- use prototype component/API/storage shape as domain authority;
- mark visual content reviewed, accepted, charted, completed, or reconciled;
- finalize handoff content from a report visual;
- use hidden simulator/oracle state;
- choose backend, storage, vector/OpenBrain, runtime, access-plane, adapter, external EHR, or ledger-kernel architecture.

## Examples

| Artifact observation | Safe extraction | Unsafe extraction |
| --- | --- | --- |
| Report sheet has a code-status box | "Code status is a high-attention report category; link to charted code-status source." | Add a `codeStatusBox` storage field because the paper has a box. |
| Prototype has a Drips tab | "Active drips need prominent source-linked medication/hemodynamic context." | Make `DripsTab` the canonical medication API boundary. |
| Screenshot groups labs and I&O together | "The nurse needs trend/context grouping during report." | Copy the exact screen layout into substrate schema. |
| `_derived` output lists pending tasks | "Derived workflow items need source, authority, due window, and completion criteria." | Treat `_derived` text as accepted task truth. |
| Multi-patient prototype dashboard exists | "Assignment-level orchestration pressure exists for later aggregation." | Start with cross-patient storage before per-patient item authority. |
| Generated summary says patient has a wound | "Source-needed/report-only unless linked to wound note, assessment, order, or charted finding." | Accept the wound as chart truth because the UI displayed it. |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Every report/prototype-derived category maps to canonical chart facts/actions/notes/refs or explicit source-needed/report-only state.
2. Generated UI and `_derived` output are visibly non-authoritative.
3. Component names, tab names, route names, and API shapes are not used as clinical ontology.
4. The system can learn clinical questions from visuals without copying exact layout.
5. Assignment-level views aggregate per-patient workflow items rather than defining first substrate truth.
6. Visual mismatch or report-only material prompts human review rather than truth declaration.
7. No backend/vector/OpenBrain/storage/runtime/access-plane/adapter or hidden simulator boundary is selected by visual evidence.

## Boundary closeout

- [x] Report visuals and prototype artifacts defined as workflow/product evidence only.
- [x] Safe borrowing defined: clinical questions, attention categories, navigation affordances, workflow pressure, source-state prompts, and review prompts.
- [x] Unsafe borrowing defined: storage shape, API shape, UI layout, component names, generated artifacts, disposable `_derived` truth, and canonical schema.
- [x] Report visual categories linked back to canonical chart facts/actions/notes/refs or source-needed/report-only caveats.
- [x] Assignment-level nurse brain preserved as later aggregation/orchestration over per-patient workflow items.
- [x] Raw design/generated UI authority boundary checks included.
- [x] No UI implementation, backend/vector/OpenBrain/storage/runtime/access-plane/adapter decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
