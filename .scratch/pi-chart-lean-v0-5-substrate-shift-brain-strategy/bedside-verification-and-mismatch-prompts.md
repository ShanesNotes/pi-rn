# Bedside verification and mismatch prompts

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/05-bedside-verification-and-mismatch-prompts.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/shift-start-chart-digging-packet.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`

## Purpose

Define the derived bedside-verification and mismatch-prompt contract for shift start. The incoming ICU nurse has heard report, skimmed the chart-digging packet, and then enters the room to introduce themself, verify medications/drips, look at the monitor, and decide whether anything urgent changes the early-shift plan.

A mismatch prompt is a **derived review prompt**, not a truth declaration. It points to competing or incomplete report/chart/bedside-observable evidence and asks the clinician to review, verify, chart, or reconcile through sanctioned workflow.

## Prompt-level contract

Every mismatch prompt should answer:

1. What sources disagree, look stale, or need verification?
2. Which patient, encounter, and as-of frame does the prompt belong to?
3. Why might this matter clinically at shift start?
4. Which source links support the prompt?
5. Is this prominent enough to interrupt planning, or quiet enough to remain in the packet/shift brain?
6. What sanctioned clinician action could resolve or document the reconciliation?
7. What may the bounded in-chart assistant suggest without declaring truth or completing work?

## Common shift-start mismatch types

| Mismatch type | Example prompt language | Source/evidence links | Default prominence | Clinician resolution path | Assistant boundary |
| --- | --- | --- | --- | --- | --- |
| Patient/encounter/as-of mismatch | "Review patient and encounter scope before using this packet; report context and chart context do not share the same as-of frame." | assignment/patient scope, encounter facts, packet as-of time, report projection as-of time | Prominent; scope mismatch can invalidate all downstream review | Re-open correct patient/encounter or regenerate packet for the right as-of frame | May block summary confidence; may not merge patient contexts |
| Report vs charted drip/rate | "Reported norepinephrine rate differs from latest charted MAR/infusion rate; verify bedside pump and MAR before med pass." | report projection, MAR/admin action, infusion documentation, hemodynamic goal, timestamp | Prominent when active critical drip or hemodynamic goal is involved; quiet review for noncritical discrepancy | Bedside medication/pump verification; chart correction, MAR action, note, or provider/pharmacy escalation as locally sanctioned | May suggest which source to inspect next; may not select the true rate |
| Charted drip/rate vs bedside pump | "Latest charted infusion rate may not match bedside-observed pump state; verify and chart if needed." | MAR/admin action, infusion flowsheet/documentation, bedside-observable verification cue | Prominent for vasoactive/critical/high-risk meds; quiet for routine fluids unless safety context changes | Human verifies pump/MAR/order and documents through sanctioned medication workflow | May cite charted rate/time and prompt bedside check; may not write or complete MAR work |
| Report vs current vitals trend | "Report describes stable blood pressure, but recent charted vitals trend shows lower MAP; review current monitor and goals." | report projection, vitals observations, monitor-observable cue, active goals/orders | Prominent when trend crosses safety threshold, active goal, or deterioration cue; quiet when mild/stale | Human checks monitor, patient, orders/goals, and charts/reviews as needed | May explain trend window and uncertainty; may not diagnose instability by itself |
| Charted vitals vs bedside monitor | "Bedside monitor value appears different from latest charted value; verify source/time before acting on the trend." | vitals observations, monitor-visible value/time when observable to clinician, device/source metadata if charted | Prominent for critical value, rapid deterioration, or order/goal conflict; quiet if expected charting lag | Human validates current value/source and records/acts through local workflow | May flag source age/charting lag; may not consume hidden telemetry/oracle state |
| Lab/I&O trend vs reported plan | "Report plan assumes improving volume status, but latest I&O/lab packet shows incomplete or conflicting evidence; review before planning fluids/diuresis." | I&O observations, lab observations, ICU note/plan, report projection, timestamps | Prominent when likely to affect immediate medication/fluid/safety decision; quiet when it only informs later chart digging | Human reviews chart, patient state, and provider plan; charts clarification or escalates if needed | May identify missing window or contradictory evidence; may not infer uncharted intake/output truth |
| Pending/unreviewed result vs task state | "A critical or time-sensitive result appears unreviewed while no matching follow-up task is active; review result and workflow state." | lab/diagnostic result fact, review actions, open-loop/workflow projection | Prominent for critical/unreviewed/action-changing results; quiet for routine pending results | Human reviews result, acknowledges/attests/charts action, or creates/accepts workflow item if appropriate | May suggest result review or task creation; may not mark reviewed or create active obligation without human acceptance |
| Task state vs observed bedside reality | "Task status and bedside observation may not align; verify whether this item is completed, blocked, deferred, or still active." | workflow item, completion criteria, charted actions, bedside-observable cue, source refs | Prominent if safety-critical or time-sensitive; quiet for routine care | Human completes, defers, blocks, carries forward, or charts action through sanctioned workflow | May suggest likely state options; may not complete, defer, or block the task autonomously |
| Handoff statement vs source-needed category | "Report-only item has no chart source yet; keep it visible as report evidence until linked or charted." | report-only handoff content, source-needed category marker | Quiet by default; prominent only if immediate safety issue | Human links source, charts supported fact, asks clarifying question, or leaves as report-only | May preserve caveat; may not promote report-only material to chart truth |
| Stale source vs overnight change | "Most recent ICU note predates a later medication/vital/lab change; review current sources before relying on the plan summary." | note timestamp, later MAR/vital/lab/action events, packet as-of time | Quiet-to-prominent depending on whether later change affects active safety/plan | Human reviews current chart and reconciles plan understanding or escalates | May summarize source age and later events; may not rewrite provider plan |
| Order/constraint conflict | "Current task or medication context may conflict with an active constraint, goal, allergy, precaution, or order status; review before action." | active constraints/allergies/precautions, orders, MAR/task item, evidence refs | Prominent; potential preventable harm or wrong-path work | Human reviews orders/constraints and escalates/charts according to local policy | May cite conflict; may not override orders or constraints |

## Source state and evidence rules

Mismatch prompts reuse the shift-start packet source-state vocabulary:

- `source-linked` — supported by canonical chart memory, note refs, actions, observations, or artifact refs;
- `source-needed` — clinically important but no chart source is linked yet;
- `report-only` — inherited from nurse-to-nurse report or handoff context but not chart-linked;
- `conflicting` — sources disagree and need review;
- `stale` — the source exists but predates potentially relevant later changes;
- `not-applicable` — no known relevance for this patient/as-of frame.

A prompt should cite source kind, source time, author/source if available, and the projection boundary. It should not flatten conflict into certainty.

## Prominent vs quiet prompts

Prominent prompts may interrupt early-shift planning only when the mismatch may change immediate safety, medication, monitoring, or escalation decisions.

Prominent examples:

- wrong patient, encounter, assignment, or as-of frame;
- active critical medication/drip mismatch;
- rapid deterioration or vitals conflict against a goal/threshold;
- critical or time-sensitive unreviewed result;
- order, allergy, code-status, isolation, precaution, or constraint conflict;
- task blocked by missing order/evidence where delay creates safety risk;
- time-sensitive transport/procedure/readiness mismatch.

Quiet prompts should stay visible without interrupting care. They support chart digging, handoff, and later reconciliation.

Quiet examples:

- report-only background item without immediate safety consequence;
- stale note caveat when later facts do not change current safety posture;
- routine I&O/lab incompleteness for later review;
- routine task status ambiguity when not time-sensitive;
- nonurgent care-clustering or handoff carry-forward suggestion.

Prominence is a projection decision. It does not create chart truth, complete work, or judge the clinician.

## Sanctioned reconciliation paths

Mismatch prompts should point toward clinician-owned actions, such as:

- verify bedside medication/pump state against MAR/order;
- check current monitor and patient condition;
- review H&P, ICU note, orders, MAR, vitals, I&O, labs, task list, or source note;
- chart a new observation, medication action, assessment, review, correction, deferral, block reason, or handoff note through sanctioned workflows;
- escalate to provider, pharmacy, respiratory therapy, charge nurse, transport, or another appropriate role;
- accept, modify, dismiss, or leave provisional an agent/system-suggested workflow item.

The prompt should not prescribe unauthorized workflow or invent policy. It names the likely reconciliation surface and keeps local policy out of the substrate contract.

## Bounded assistant behavior

The assistant may:

- compare source-linked report, chart, packet, workflow, and bedside-observable cues;
- explain why a mismatch may matter clinically;
- show the source/time/evidence caveat;
- suggest which chart source or bedside item to inspect next;
- suggest a provisional workflow item when explicit evidence supports it;
- keep language supportive and nonpunitive.

The assistant may not:

- decide which conflicting source is true;
- promote report-only material into canonical chart memory;
- perform direct accepted-writes;
- complete, defer, block, or carry forward tasks without human action;
- silently mark a result reviewed or a med/task completed;
- use hidden `pi-sim` internals, oracle truth, latent state, validation internals, or private simulator source;
- select backend, storage, vector, OpenBrain, retrieval, runtime, or access-plane architecture.

## Hidden simulator and observable-data boundary

Mismatch prompts can only use evidence visible through charted, observable, or explicitly exposed public surfaces. They may refer to bedside-observable checks as work the clinician performs, but the chart/assistant must not read hidden `pi-sim` internals or latent simulator truth to decide what is happening at the bedside.

Allowed evidence examples:

- charted vitals, labs, I&O, orders, MAR/admin actions, notes, assessments, tasks, review actions, source refs;
- report/handoff projection material marked with source state;
- public or chart-sanctioned telemetry only if explicitly exposed through an adapter later;
- clinician-observed bedside verification once charted or explicitly represented as a review/action.

Forbidden evidence examples:

- hidden simulator source code;
- oracle/latent patient state;
- validation internals;
- private scenario scripts;
- unexposed provider routing or hidden monitor state;
- generated UI/design artifacts treated as truth.

## Example prompt shapes

| Shape | Example | Why it is safe |
| --- | --- | --- |
| Source conflict | "Reported drip rate and latest charted MAR rate differ. Review bedside pump and MAR before relying on either value." | Names conflict and review path without choosing truth. |
| Stale source | "Latest ICU note predates overnight pressor change. Use note as plan context, not current drip truth." | Preserves note value while marking time caveat. |
| Missing source | "Handoff mentions wound concern, but no linked chart source appears in this packet. Keep as report-only until reviewed/charted." | Keeps report evidence visible without promotion. |
| Task ambiguity | "Lab draw task has no matching completion action in the packet. Review whether it is completed, blocked, or still pending." | Human owns completion/block decision. |
| Quiet caveat | "I&O window after 0400 appears incomplete. Treat net balance as uncertain during chart digging." | Supports planning without interruption. |
| Prominent conflict | "Active order/constraint conflict may affect medication safety. Review order, allergy/precaution, and MAR before administration." | Interrupts because preventable harm is plausible. |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Mismatch prompts are derived from source-linked report/chart/packet/workflow evidence.
2. Prompts cite source kind and time or explicitly mark source-needed/report-only/conflicting/stale state.
3. Prominent prompts are limited to safety-critical, critical medication/drip, deterioration, result-review, order/constraint, blocked-safety-task, or time-sensitive readiness cases.
4. Quiet prompts remain glanceable and nonpunitive.
5. The clinician, not the assistant, resolves or charts reconciliation through sanctioned workflow.
6. The assistant can suggest inspection next steps but cannot declare truth, write accepted facts, or complete tasks.
7. Hidden simulator internals and oracle truth are unavailable to the prompt logic.

## Boundary closeout

- [x] Common shift-start mismatch types defined across report, chart, drips/dose rates, monitor/vitals, labs/I&O, and task state.
- [x] Mismatch prompts defined as derived review prompts with source/evidence links.
- [x] Clinician-owned sanctioned reconciliation paths listed.
- [x] Assistant can suggest inspection/review next steps but cannot declare truth or complete tasks.
- [x] Prominent vs quiet prompt rules defined.
- [x] Hidden `pi-sim` boundary preserved by limiting evidence to observable/charted/explicitly exposed data.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane decision.
- [x] No direct agent accepted-writes or autonomous task completion.
