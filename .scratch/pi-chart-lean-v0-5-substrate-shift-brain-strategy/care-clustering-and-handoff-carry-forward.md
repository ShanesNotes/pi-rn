# Care clustering and handoff carry-forward

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/12-care-clustering-and-handoff-carry-forward.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/clinical-risk-prioritization-and-supportive-language.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/human-agent-workflow-boundary.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/medication-timing-retiming-and-clustered-assessment.md`

## Purpose

Define care clustering and handoff carry-forward for the lean v0.5 shift brain. Both are derived projections over source-linked workflow items and canonical chart memory. They help a nurse organize work and preserve continuity, but they do not create chart truth, change underlying task authority, complete care, or finalize handoff.

The goal is practical shift support: fewer avoidable room entries, less alarm fatigue, clearer rationale for unresolved work, and a respectful handoff proposal that the human clinician owns.

## Projection posture

| Projection | What it answers | Authority boundary |
| --- | --- | --- |
| Care cluster | Which compatible items might be handled together for this patient, location, and time window? | Advisory grouping only; underlying items keep their source, authority, due window, completion criteria, and human-owned state |
| Handoff/watch carry-forward | Which unresolved or context-relevant items should remain visible to the next clinician/time horizon? | Derived/proposed content only; final handoff is human-owned |

Care clustering is an advisory derived projection. A cluster can explain relationships between items, but it cannot make a suggested item required, downgrade a required item, chart completion, or hide a safety-critical prompt. Handoff carry-forward can propose content, but it cannot mark handoff as sent, received, reviewed, or accepted.

## Care-cluster inputs

A safe cluster proposal should be built from workflow items that already carry source/authority, patient/encounter/as-of scope, due window, priority tier, evidence caveat, and completion criteria.

Useful inputs include:

- due or due-soon medication work;
- first assessment, reassessment, pain/sedation/neuro/respiratory checks, or other assessment cadence;
- vitals or bedside monitor comparison when source state supports review;
- line/tube/drain/device/I&O/wound/skin/mobility checks where source/authority exists or open-question status is explicit;
- turns, baths, dressing checks, education, patient/family communication, or routine care tasks;
- pending labs/scans/consult coordination that affects room entry or timing;
- nurse-authored tasks and patient/family requests;
- agent/system suggestions that remain provisional until accepted.

The cluster should display why the items are compatible and what would still require separate attention.

## Compatibility rules

A care cluster is potentially compatible when all of the following are true:

1. items share the same patient/encounter/as-of frame;
2. items fit the same bedside location, room entry, med pass, transport/procedure prep, communication block, or documentation block;
3. due windows overlap enough that grouping does not create unsafe delay;
4. priority tiers permit bundling without hiding `now / safety critical` work;
5. dependencies are aligned or visible, such as waiting on pharmacy, provider, transport, patient condition, access, or order clarification;
6. source and completion criteria remain visible for each item;
7. the nurse can change the grouping without changing chart truth.

Compatible does not mean mandatory. It means the grouping may reduce interruption or duplicated work if the nurse decides it is clinically appropriate.

## Urgency and incompatibility checks

The shift brain should avoid or break a cluster when grouping would obscure safety, authority, or timing. Keep or raise a prominent prompt when:

- immediate safety risk, rapid deterioration, critical result, or order/constraint conflict is present;
- a critical medication/drip issue needs immediate bedside/MAR/order verification;
- a required task's due window would be meaningfully worsened by bundling;
- an assessment finding could change whether medication, mobility, feeding, transport, or procedure readiness is appropriate;
- patient condition makes routine care not clinically appropriate now;
- a task requires separate monitoring, sterility, isolation handling, two-person support, timing, or location;
- source state is stale, conflicting, report-only, or source-needed in a way that affects action;
- local policy/protocol, order source, or clinician judgment requires separate handling.

Quiet clustering remains appropriate for compatible routine care, routine reassessments, and nonurgent checks. Quiet does not mean unimportant; it means no current need to interrupt or alarm.

## Nurse control over clusters

The nurse may:

- accept a cluster as a personal workflow plan;
- modify the cluster by adding, removing, splitting, reordering, or retiming items through sanctioned workflow where needed;
- ignore or dismiss a cluster suggestion;
- defer a compatible item because it is not clinically appropriate now;
- block an item because a dependency remains unresolved;
- bundle an item with the next care cluster;
- carry unresolved relevant work to handoff/watch.

Accepting a cluster does not complete any item. Completion still requires the modeled chart action, review, communication, medication workflow action, assessment charting, or other sanctioned human-owned workflow for each underlying item.

If an assistant proposed the cluster, the proposal remains suggested/provisional until a human accepts or modifies it. Rejection or dismissal should avoid clutter and avoid punitive framing.

## Handoff/watch carry-forward eligibility

Handoff/watch carry-forward should propose unresolved or context-relevant items that matter to continuity. Eligible content includes:

| Carry-forward category | Why it matters | Safe posture |
| --- | --- | --- |
| Unresolved safety-critical task | Harm could occur if the next clinician misses it | Prominent if still immediate; otherwise visible handoff/watch with source links |
| Blocked task | Work depends on provider, pharmacy, transport, access, patient condition, order clarification, or missing source | Show blocker and next review need |
| Delayed relevant care | Care remains clinically relevant after higher-priority work displaced it | Use supportive delayed/carry-forward language |
| Patient-specific watch item | Trend, caveat, risk, or uncertainty needs continuity | Explain what to watch and why |
| Recent major change | New order, status change, event, escalation, deterioration, procedure, transfer, or communication changes plan | Source-link and time-stamp the change |
| Medication/order issue | Med due/delayed/held/refused/omitted/retimed, drip/rate caveat, pending co-sign, or order/source conflict affects next actions | Preserve original order/MAR/source context and human authority |
| Pending lab/scan/consult | Result, review, transport, collection, or consult response remains open | Keep result/review/open-loop separation visible |
| Clinician-deferred item | Nurse/provider judged work not appropriate now or better handled later | Preserve rationale without blame |
| Care-cluster suggestion | Compatible unresolved work may be useful for the next room entry or shift block | Advisory only; receiver may accept, modify, or ignore |
| Report-only/source-needed item | Handoff mentions an issue not yet linked to chart source | Keep caveat visible; do not promote to chart truth |

Carry-forward should explain why each item matters, what source supports it, what remains unresolved, and what human-owned action or review could close it.

## Handoff composition rules

A handoff proposal should:

1. stay patient/encounter/as-of scoped;
2. distinguish canonical chart facts/actions/notes/refs from derived projection text;
3. show source, time, author/provenance, review state, and uncertainty where available;
4. preserve workflow-item source and authority labels;
5. identify why the item matters to the receiver;
6. include defer/block/carry-forward rationale when known;
7. distinguish immediate safety items from quiet continuity/watch items;
8. mark assistant-generated content as derived/proposed;
9. require human finalization before handoff content is treated as sent, accepted, or clinically endorsed.

The proposal may organize content. It may not decide final handoff truth.

## Supportive language

Use language that assumes competent clinical reprioritization under load:

- bundled with next care cluster;
- due / due soon;
- needs attention;
- review priority;
- delayed while higher-priority work was addressed;
- blocked / waiting on provider, pharmacy, transport, patient condition, access, or order clarification;
- deferred by clinician;
- not clinically appropriate now;
- carry forward to handoff/watch;
- source-needed;
- report-only;
- review before action.

Avoid routine blame-oriented presentation:

- failed as a judgment on the clinician;
- nurse failed;
- noncompliant;
- ignored;
- delinquent;
- violation;
- punitive overdue framing;
- language implying laziness, incompetence, or disregard.

Precise clinical terms may still appear where they are chart facts or domain semantics, such as failed procedure attempt or medication omission. The shift-brain presentation should still keep workflow support respectful and source-linked.

## Assistant behavior

The assistant may:

- suggest a care cluster with source links and compatibility rationale;
- explain urgency, incompatibility, and why an item should remain separate;
- suggest handoff/watch carry-forward content for human review;
- explain why each handoff item matters;
- keep delayed, deferred, blocked, and carried-forward work visible without shaming the clinician;
- mark its own content as suggested, provisional, derived, or report-only where appropriate.

The assistant may not:

- make a cluster mandatory;
- change source, authority, due window, or completion criteria of underlying tasks;
- complete, defer, block, reject, or carry forward workflow items without human action;
- chart an assessment, medication action, order action, review, communication, or handoff;
- finalize handoff content;
- mark results reviewed or accepted;
- hide urgent work inside a quiet cluster;
- promote report-only handoff content into chart truth;
- use hidden simulator/oracle state;
- choose backend, storage, vector/OpenBrain, runtime, access-plane, adapter, or external EHR architecture;
- expand `pi-ledger` kernel scope.

## Examples

| Situation | Safe shift-brain output | Human-owned resolution |
| --- | --- | --- |
| 0900 antibiotic, first assessment, and routine line check are all relevant | "Care cluster suggestion: med pass + first assessment + line check may fit this room entry if clinically appropriate. Antibiotic remains due soon." | Nurse accepts, modifies, or ignores; charts each action after care |
| Critical drip mismatch appears during a proposed cluster | "Needs attention now: drip/rate source mismatch. Verify bedside pump and MAR before clustering routine care." | Nurse verifies and acts/charts through sanctioned workflow |
| Turn delayed during instability | "Delayed while higher-priority work was addressed; carry forward or bundle with next room entry." | Nurse decides whether to perform, defer, or hand off |
| CT transport pending and routine bath also due | "Transport readiness is time-sensitive; routine bath can remain quiet or carry forward if transport timing conflicts." | Nurse prioritizes transport prep and updates workflow as needed |
| Pharmacy has not delivered due med | "Blocked / waiting on pharmacy; carry forward until available or clarify with pharmacy/provider." | Nurse follows local medication workflow and documents if needed |
| Handoff mentions wound concern with no chart source | "Report-only wound concern; source-needed before treating as charted fact. Keep visible for handoff/watch." | Human reviews, links source, charts supported finding, or leaves caveat |
| Unresolved cluster at shift end | "Handoff/watch proposal: antibiotic follow-up, reassessment after pain med, and pending lab review remain relevant; receiver may regroup." | Sender finalizes what belongs in handoff; receiver owns next plan |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Care clusters are rebuilt from source-linked workflow items and do not mutate underlying item authority.
2. Urgency checks prevent safety-critical work from being hidden inside quiet clusters.
3. Incompatibility checks can split or reject unsafe grouping.
4. Nurses can accept, modify, or ignore cluster suggestions.
5. Cluster acceptance does not complete underlying workflow items.
6. Handoff/watch proposals include eligible unresolved safety, blocked, delayed, watch, major-change, medication/order, pending-result/consult, clinician-deferred, care-cluster, and report-only/source-needed items.
7. Final handoff content remains human-owned.
8. Each proposed handoff item explains why it matters and links to source/provenance when available.
9. Supportive language appears for delayed, deferred, blocked, bundled, and carried-forward work.
10. Backend/storage/adapter/vector/runtime/access-plane, hidden simulator, and ledger-kernel choices remain out of scope.

## Boundary closeout

- [x] Care clustering defined as advisory derived grouping over source-linked workflow items.
- [x] Clusters do not alter underlying task source, authority, due window, or completion criteria.
- [x] Urgency and incompatibility checks defined.
- [x] Nurse can accept, modify, ignore, defer, block, bundle, or carry forward cluster suggestions.
- [x] Handoff/watch carry-forward eligibility defined.
- [x] Handoff carry-forward remains derived/proposed and final handoff is human-owned.
- [x] Supportive, nonpunitive delayed/deferred/blocked/carry-forward language defined.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane/adapter decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
