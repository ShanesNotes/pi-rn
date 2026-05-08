# Policy/order-set/cadence-derived work

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/11-policy-order-set-cadence-derived-work.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/clinical-risk-prioritization-and-supportive-language.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/medication-timing-retiming-and-clustered-assessment.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/verbal-telephone-order-minimal-semantics.md`

## Purpose

Define how unit policy, protocol, order-set, scoring, acuity, and cadence-derived work can appear in the per-patient shift brain as source-linked workflow items. These items help nurses understand why a task exists, who/what authorized it, when it matters, what completes it, and how it can be deferred, blocked, overridden, bundled, or carried forward without blame.

This is not a policy library, order-set package, protocol/CDS engine, or CPOE design. It is a product/domain contract for representing derived work whose source is a policy/order-set/protocol/cadence decision made elsewhere.

## Phase A evidence review

Issue 11 requires inspecting Phase A before proposing order-set representation language. Reviewed evidence:

| Source | What it supports | What it does not settle |
| --- | --- | --- |
| `hitl-workflow-prioritization-decisions.md` decisions 1, 2, 16, 17 | Order-set-derived work should drive meds, nursing tasks, monitoring cadence, assessments, labs, diet/activity/precautions, consults, and transport/imaging prep. Cadence sources include unit policy, order set, acuity, nurse-authored plan, provider/protocol order, insulin protocol, pressure-injury risk, CIWA/COWS, and similar scoring. Unit policy should carry source/name/version/applicability/generated obligation/override-defer/human completion. | Actual default admission/adult ICU order-set content; actual policy library content. |
| `source-artifact-mining-map.md` row `SRC-A9B-001` | A governed protocol/order-set invocation can become patient-specific child orders with provenance and transform backlinks. Definition layer stays outside patient chart truth. | Definition storage, parent/child transform convention, standing-order authentication, bundle open-loop rules, and CDS/protocol boundary remain open. |
| `orders-mar-medrec-io-lda-open-loop-substrate-pack.md` row `ORDERSET-007` | v0.5 may represent governed invocation provenance and child obligations while deferring protocol engines, CDS, standing-order products, and order-management UI. | Dedicated order-set implementation and concrete template are not covered. |
| `lean-dense-v0-5-substrate-recommendation.md` `RECON-ORDER-008` and `RECON-DEFER-019` | Preserve lean obligation/open-loop state and defer full CPOE, task-management product, policy thresholds, protocol/CDS engine, and order-set implementation. | Product policy thresholds and actual order-set packages. |
| `workflow-item-source-authority-grammar.md` | Protocol/order-set generated orders and policy/nursing cadence items are workflow source/authority inputs with completion criteria and defer/block/carry-forward state. | Concrete content or policy defaults. |

Conclusion: Phase A supports a **representation pattern** for source-linked policy/order-set/cadence-derived work, but it does **not** provide an adequate concrete order-set template. This artifact therefore defines the representation contract and records a bounded research brief below instead of inventing order-set content.

## Source-linked representation contract

Every policy/order-set/cadence-derived workflow item should expose:

| Field | Purpose | Boundary |
| --- | --- | --- |
| Patient/encounter/as-of scope | Keeps work patient-specific and time-bounded | Required for every projected item |
| Source category | Unit policy, protocol, order set, provider/protocol order, acuity/scoring rule, nurse-authored plan, system projection, or accepted human-authored task | Source category is not a policy engine |
| Source name | Human-readable policy/order-set/protocol/cadence name when known | May be `source-needed` when report-only or unmapped |
| Source version/date | Version, effective date, or local identifier when known | Does not define enterprise policy registry |
| Applicability basis | Why this source applies to this patient now: order, unit policy, acuity, score, diagnosis/context, device/line, medication, procedure, or clinician plan | Applicability is evidence/caveat, not hidden CDS |
| Generated obligation | The derived task/work item, such as lab draw, assessment cadence, turn/reposition, glucose check, neuro check, transport prep, line care, wound/skin check, med timing, or handoff watch | Work item remains a projection over source facts/actions |
| Authority label | Required, time-sensitive, routine, suggested, informational, or handoff-watch | Uses issue 06 grammar |
| Due/relevance window | Due now, due soon, scheduled time, recurrence/cadence, shift horizon, or no due time | Does not implement scheduler engine |
| Completion criteria | Human-charted action/fact/review that satisfies the work when modeled | Agent cannot complete silently |
| Override/defer/block reason | Higher-priority work, patient condition, waiting on provider/pharmacy/transport, missing order/evidence, not clinically appropriate now, bundled with care cluster, carry forward | Supports clinician judgment; not punitive |
| Evidence/caveat | Source age, missing version, report-only, source-needed, conflicting, stale, pending co-sign, open-question status | Does not flatten uncertainty |
| Human/agent boundary | Whether assistant may suggest/review only or human acceptance/completion is required | Human owns active workflow changes |

## Policy-derived work

Policy-derived work comes from unit or organizational policy that is relevant to the patient. The shift brain can reference policy as source material, but should not hardcode policy defaults into substrate truth.

Examples:

| Policy-derived pressure | Possible workflow item | Caveat |
| --- | --- | --- |
| Pressure-injury prevention policy | Turn/reposition, skin check, wound/skin reassessment | Actual risk tool and cadence content are downstream policy artifacts |
| Central-line care policy | Line dressing check/change or line assessment | LDA addressability remains an open-question boundary where unsettled |
| Foley/I&O policy | Foley care, I&O documentation, output review | I&O/device grammar remains bounded by issue 06 open-question language |
| Fall-risk policy | Fall precautions check, mobility assistance, handoff/watch item | Risk scoring source/version should remain visible when known |
| Unit assessment policy | Routine assessment cadence | Nurse may defer/bundle when not clinically appropriate now |

## Order-set/protocol-derived work

Order-set or protocol-derived work comes from a governed invocation or order path, not from a hardcoded list inside the shift brain.

Representation posture:

- The order-set/protocol definition layer stays outside patient chart truth.
- A patient-specific invocation or order action may generate child intents/tasks with transform/source backlinks.
- Child orders/tasks can become hot when active or safety-critical.
- Bundle status and open loops are derived from child intents/actions, not stored as separate truth.
- Standing-order authentication, parent/child transform convention, set-level versus child-level open loops, and CDS/protocol suggestion boundaries remain later ADR/HITL topics.

Examples:

| Source | Derived work | Boundary |
| --- | --- | --- |
| Default admission order-set invocation | Admission labs, diet/activity/precaution tasks, consults, monitoring work | Actual default admission order-set content is downstream scope |
| Adult ICU order-set invocation | ICU labs, monitoring cadence, line/device care, medication/infusion-related tasks | Actual adult ICU order-set content is downstream scope |
| Insulin protocol | Blood glucose checks, insulin-related med workflow, hypoglycemia watch | Protocol engine and dosing decision support are out of scope |
| CIWA/COWS or other scoring protocol | Scoring cadence, symptom-triggered review prompt | Scoring instrument content and treatment protocol are out of scope |
| Pressure-injury risk protocol | Skin/turn/wound workflow and handoff/watch | Full risk engine or policy library out of scope |

## Cadence-derived work

Cadence items should name their source and authority. A cadence item may come from:

- unit policy;
- order set;
- patient acuity;
- nurse-authored plan;
- provider/protocol order;
- insulin protocol;
- pressure-injury risk;
- CIWA/COWS or other protocolized scoring;
- device/line/tube/drain context when explicitly modeled;
- accepted human-authored task or plan.

Cadence-derived items should show:

1. the recurrence or due/relevance window;
2. why the cadence applies to this patient;
3. what charted action/fact/review completes the current occurrence when modeled;
4. whether the item is required, time-sensitive, routine, informational, or handoff-watch;
5. whether it can be bundled, deferred, blocked, or carried forward;
6. what caveat applies when the source/version/applicability is missing or uncertain.

## Override, defer, block, and carry-forward

Policy/order-set/cadence-derived work must preserve clinician judgment. Safe labels include:

- delayed while higher-priority work was addressed;
- deferred by clinician;
- not clinically appropriate now;
- blocked / waiting on provider, pharmacy, transport, patient condition, source, or order clarification;
- bundled with next care cluster;
- carry forward to handoff/watch;
- source-needed;
- report-only;
- pending co-sign or pending clarification.

Avoid routine blame language such as nurse failed, noncompliant, ignored, delinquent, or punitive overdue framing.

## Assistant boundary

The assistant may:

- explain why a policy/order-set/cadence item appears;
- cite source category, source name/version, applicability, and generated obligation;
- prompt review when source/version/applicability is missing, stale, conflicting, or report-only;
- suggest defer/block/carry-forward labels for human review;
- suggest care clustering when urgency and incompatibilities permit;
- keep language supportive and nonpunitive.

The assistant may not:

- create a policy/order-set/protocol library;
- invoke a protocol, order set, or standing order autonomously;
- generate active obligations without sanctioned chart source or human acceptance;
- complete, defer, block, override, or carry forward tasks without human action;
- decide patient applicability from hidden CDS or hidden simulator state;
- choose protocol/CDS engine, backend, storage, vector, OpenBrain, runtime, access-plane, or adapter architecture;
- expand `pi-ledger` kernel scope.

## Bounded research brief for later order-set content

Phase A does not contain an adequate default hospital admission or adult ICU order-set template. Later research should answer only the content-shape question, not implementation architecture:

**Research question:** What common categories appear in default adult hospital admission and adult ICU order sets that should be represented as source-linked workflow inputs, without hardcoding site policy content into v0.5 substrate?

**Allowed research outputs:**

- category inventory, such as labs, nursing tasks, monitoring cadence, meds, diet/activity/precautions, consults, transport/imaging prep;
- examples of source/version/applicability metadata;
- examples of generated obligation and completion/defer/override fields;
- safety caveats around local policy variation and provider/pharmacy authority.

**Forbidden research outputs:**

- selecting a site-specific order set as canonical;
- implementing a policy library, protocol engine, CDS logic, full CPOE, pharmacy verification, barcode MAR, role registry, backend/storage/access plane, or external EHR integration;
- treating found content as medical advice or universally applicable defaults.

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Policy/order-set/cadence items expose source category, name/version when known, applicability, generated obligation, due/relevance window, source refs, authority label, completion criteria, and caveats.
2. Policy/order-set/cadence items remain derived workflow inputs, not hardcoded substrate primitives.
3. Actual policy/order-set/protocol content is not embedded in the substrate contract.
4. Override/defer/block/carry-forward states preserve clinician judgment and supportive language.
5. Missing or insufficient order-set source evidence produces a source-needed/research-needed caveat, not invented content.
6. Assistant behavior remains suggestion/review-only and cannot create policy libraries, invoke order sets, or complete work.
7. Full protocol/CDS engine, full CPOE, content packages, backend/storage/adapter, hidden simulator, and `pi-ledger` kernel work remain out of scope.

## Boundary closeout

- [x] Existing Phase A order-set research and notes mined before representation language.
- [x] Policy/order-set/cadence work defined as source-linked workflow inputs, not hardcoded substrate primitives.
- [x] Source, policy/order-set/protocol name and version when known, patient applicability, generated obligation, override/defer reason, and human completion/action defined.
- [x] Actual order-set and policy library content preserved as downstream scope.
- [x] Bounded deep-research query brief recorded because no adequate concrete order-set template exists in Phase A evidence.
- [x] Full protocol/CDS engine, full CPOE, and content packages excluded.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane/adapter decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
