# Medication timing, retiming, and clustered assessment

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/09-medication-timing-retiming-and-clustered-assessment.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/clinical-risk-prioritization-and-supportive-language.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/human-agent-workflow-boundary.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/bedside-verification-and-mismatch-prompts.md`

## Purpose

Define the medication-centered early-shift workflow for the lean v0.5 shift brain. After report, chart digging, and bedside verification, the incoming nurse often plans the first work block around due medications. The first assessment may be clustered with 8, 9, or 10 o'clock meds when clinically appropriate, then charted after the bedside care is actually performed.

This artifact keeps medication timing and assessment clustering as clinician-owned workflow. The shift brain can organize, suggest, cite, and prompt review. It cannot administer meds, retime meds, complete tasks, chart assessments, or turn medication timing into silent derived truth.

## Medication-centered early-shift sequence

| Step | Nurse workflow question | Shift-brain support | Human-owned action |
| --- | --- | --- | --- |
| Review medication due work | Which meds are due now, due soon, delayed, held, refused, omitted, titrated, restarted, or linked to a current clinical goal? | Source-linked medication due view with order/MAR/source/authority, due window, current state, and caveats | Nurse reviews orders/MAR/patient context and decides what to do next |
| Verify high-risk/active med context | Do drips, dose rates, BP goals, sedation/analgesia, insulin/electrolyte protocols, anticoagulation, antibiotics, or titratable meds need immediate attention? | Hot prompts for critical med/drip mismatches, goal conflicts, or safety-critical timing | Nurse verifies bedside/MAR/orders and acts/charts through sanctioned workflow |
| Plan med pass | Which due meds can safely anchor the first room entry or early work block? | Derived med-pass planning view sorted by clinical risk tier, then due/delayed time | Nurse accepts, modifies, or ignores the plan |
| Consider clustered assessment | Can first assessment, vitals review, line/device check, I&O check, wound/skin/mobility checks, or education be safely bundled with the med pass? | Advisory care-cluster suggestion with compatibility and risk caveats | Nurse decides what to cluster based on patient condition and workload |
| Perform bedside care | What actually happened at the bedside? | Optional prompts/checklist only; no silent completion | Nurse administers, holds, refuses, omits, or retimes meds as appropriate and performs assessment/care |
| Chart after care | What needs to be documented after performed care? | Source-linked documentation reminders for meds, assessment, defer/block reasons, and unresolved items | Nurse charts MAR actions, assessment, retiming, hold/refusal/omission, deferral/block, or notes |
| Carry unresolved items | What did not happen and why? | Nonpunitive delayed/deferred/blocked/carry-forward/handoff-watch state | Nurse records reason or leaves appropriate carry-forward/handoff/watch item |

## Med-pass planning as a shift-brain projection

The med-pass planning view is a derived projection over canonical orders, MAR actions, workflow items, source states, and shift-start context. It should show:

- patient/encounter/as-of scope;
- medication/order source and authority;
- due window or scheduled time;
- current medication workflow state: due, due soon, delayed, held, refused, omitted, administered, restarted, titrating, waiting on, blocked, deferred by clinician, bundled with next care cluster, or handoff/watch;
- current relevant clinical context, such as vitals goal, active drip/rate, lab result, renal/electrolyte issue, NPO/procedure context, pain/sedation target, or order/constraint conflict;
- completion criteria and charting surface where known;
- source age and mismatch caveats;
- whether an assistant suggestion is provisional or human-accepted.

The projection may help order work, but it is not an administration record, medication order, pharmacy verification, or barcode MAR system.

## Retiming contract

Medication retiming is a **charted medication workflow action linked to the original order/MAR schedule**. It is not a silent mutation of a due time inside a projection.

A retiming action should preserve, at product/domain level:

| Retiming element | Purpose |
| --- | --- |
| Original medication/order/MAR schedule reference | Shows what schedule is being changed or interpreted |
| Original due window/time | Preserves timing lineage and reviewability |
| New intended due window/time or timing plan | Shows the nurse/provider workflow decision |
| Source/authority | Provider order, protocol, nursing judgment within local policy, pharmacy/provider clarification, verbal/telephone order, or other sanctioned source |
| Rationale | Patient condition, clustering with assessment/med pass, safety/monitoring need, medication availability, provider/pharmacy instruction, procedure/transport timing, hold/refusal/omission path, or other local reason |
| Actor/time | Who charted the action and when |
| Review/co-sign/clarification caveat when applicable | Keeps accountability visible without building full compliance machinery |
| Downstream effect | Updates derived due-work projection after charting; does not rewrite history |

Retiming can be suggested by the assistant only as a provisional review prompt. Human action is required to chart, accept, reject, or modify retiming.

## Medication workflow states in scope

| State/action | Meaning in this slice | Human authority boundary |
| --- | --- | --- |
| Administration | Medication given/administered through MAR or sanctioned chart workflow | Human or sanctioned med workflow charts it; assistant may not administer or complete |
| Hold | Medication intentionally held | Human/provider/sanctioned workflow records hold and reason |
| Refusal | Patient refuses or cannot accept the med | Human records refusal and context |
| Omission | Medication not given for a documented reason | Human records omission; presentation should stay nonpunitive |
| Retiming | Timing changed or planned as workflow action linked to original schedule | Human charts retiming and rationale |
| Restart | Medication restarted after hold/pause/titration context when applicable | Human/provider/sanctioned workflow records restart/action |
| Titration / dose-rate context | Active drip/rate adjusted or reviewed against goal/context | Human verifies and charts; mismatch prompts may ask for review |
| Waiting on dependency | Pharmacy/provider/transport/patient condition/order clarification blocks action | Human records or accepts block/defer reason |
| Bundled with assessment/care cluster | Safe to perform with first assessment or other bedside care | Advisory until nurse chooses it |

Full pharmacy verification, drug dictionary logic, barcode scan flows, full medication reconciliation product behavior, dosing decision support, legal/compliance platform, and external EHR integration are out of scope.

## Clustered assessment contract

Care clustering is advisory. It groups compatible work by patient, location, time window, source/authority, and clinical risk. It should never hide urgent work or require the nurse to follow a proposed order.

A medication-centered care cluster may include:

- due or due-soon meds;
- bedside medication/drip/pump verification;
- first full assessment;
- vitals check or monitor comparison;
- pain/sedation/neuro/respiratory reassessment where relevant;
- I&O/device/line/tube/drain/wound/skin/mobility checks where source/authority exists or where open-question status is explicit;
- patient/family communication or education when clinically appropriate;
- charting reminders after performed care.

A cluster should show:

1. why the items are compatible;
2. what cannot be safely delayed or bundled;
3. what evidence/source supports the suggestion;
4. what the nurse may accept, modify, ignore, defer, block, or carry forward;
5. what charting remains after care is performed.

The first assessment is not completed by cluster creation. Assessment charting remains a human chart action after bedside assessment and care.

## Safety and incompatibility rules

The shift brain should avoid unsafe clustering. It should keep or raise a prominent prompt when:

- a critical medication/drip issue requires immediate verification;
- a medication conflicts with an allergy, order status, precaution, NPO/procedure status, hemodynamic goal, lab value, or patient condition;
- an assessment finding could change whether a med should be administered;
- a medication requires separate monitoring or timing that conflicts with bundling;
- transport/procedure readiness changes timing;
- patient condition makes routine assessment or medication timing not clinically appropriate now;
- source state is conflicting, stale, report-only, or source-needed in a way that affects safety.

Quiet clustering is appropriate for compatible routine care, routine assessments, and nonurgent checks when safety-critical work is not hidden.

## Nonpunitive presentation

Use supportive language:

- due / due soon;
- needs attention;
- review before med pass;
- delayed while higher-priority work was addressed;
- blocked / waiting on pharmacy, provider, transport, patient condition, or order clarification;
- deferred by clinician;
- not clinically appropriate now;
- bundled with next care cluster;
- carry forward to handoff/watch.

Avoid routine blame language:

- med failed;
- nurse failed;
- noncompliant;
- ignored;
- delinquent;
- punitive overdue framing.

Clinical terms such as hold, refusal, omission, or failed attempt may remain precise chart semantics when charted. The shift-brain view should still present clinician workflow with supportive context and source links.

## Assistant behavior

The assistant may:

- summarize due medication context with source links;
- highlight active drips/dose-rate mismatches for review;
- suggest med-pass grouping by risk tier and due window;
- suggest a retiming review prompt when explicit evidence supports it;
- suggest a care cluster that includes due meds and first assessment;
- explain why a medication item is prominent or quiet;
- suggest documentation reminders after performed care;
- preserve provisional/suggested status until human acceptance.

The assistant may not:

- administer medications;
- chart MAR actions, holds, refusals, omissions, retiming, restarts, titrations, or assessments;
- silently mutate medication due times;
- complete med or assessment tasks;
- decide a medication should be held, refused, omitted, restarted, or retimed;
- promote a care cluster to an active obligation without human acceptance;
- use hidden simulator/oracle state;
- choose backend/storage/adapter architecture.

## Examples

| Situation | Shift-brain output | Human-owned resolution |
| --- | --- | --- |
| 0900 antibiotic due, assessment also due | "Due soon: antibiotic. First assessment may be bundled with med pass if clinically appropriate." | Nurse administers or documents hold/refusal/omission/retiming; nurse performs and charts assessment |
| Pressor rate differs between report and latest MAR | "Needs attention now: reported drip rate differs from latest charted MAR rate. Verify bedside pump and MAR before relying on either." | Nurse verifies and charts/corrects through sanctioned med workflow |
| Med delayed because patient unstable | "Delayed while higher-priority instability was addressed; review before next med pass." | Nurse decides next action and documents reason/action as needed |
| Pharmacy has not delivered medication | "Blocked / waiting on pharmacy; carry forward until available or clarify with provider/pharmacy." | Nurse follows local workflow and documents if needed |
| Nurse wants to move med to cluster with assessment | "Retiming requires charted medication workflow action linked to original schedule; suggested reason: bundled with first assessment." | Nurse charts retiming or rejects suggestion |
| Assessment checklist appears complete from device/import data only | "Device/import data may inform assessment, but human assessment charting is still required." | Nurse performs and charts assessment |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Med-pass planning is a derived shift-brain projection over orders/MAR/actions/workflow items.
2. Retiming is represented as a charted workflow action linked to the original order/MAR schedule.
3. Administrations, holds, refusals, omissions, restarts, titrations/dose-rate context, and dependency states preserve source/authority and human ownership.
4. Care clusters around due meds and first assessment are advisory, modifiable, ignorable, and clinician-controlled.
5. Assessment charting is linked to performed bedside care and cannot be completed autonomously.
6. Prominent prompts catch medication safety issues without turning routine delays into alarm fatigue.
7. Full pharmacy, barcode MAR, drug dictionary, full med-rec, backend/storage/adapter, hidden simulator, and `pi-ledger` kernel work remain out of scope.

## Boundary closeout

- [x] Med-pass planning defined as a shift-brain projection.
- [x] Medication retiming defined as a charted workflow action linked to original order/MAR schedule.
- [x] Administrations, holds, refusals, omissions, drips/dose-rate context, restarts, retiming rationale, and dependency states covered where relevant.
- [x] Care clustering around due meds and first assessment defined as advisory and clinician-controlled.
- [x] Assessment charting linked to performed bedside care without autonomous completion.
- [x] Full pharmacy workflow, barcode MAR, drug dictionary, and full medication reconciliation product scope excluded.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane/adapter decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
