# Shift-start chart-digging packet

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/04-shift-start-chart-digging-packet.md`
Depends on: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`
Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-03-04-06-20260504T151627Z.md`

## Purpose

Define the derived chart-digging packet an incoming ICU nurse needs during report. The packet gathers the right sources at the right time: H&P, recent ICU note, vitals trends, drips/dose rates, I&O/fluid balance, lab trends, and pending work-list/task-list actions.

The packet is not a new canonical record. It is a source-linked working surface that helps the clinician rapidly orient, compare report against chart, and decide what needs bedside verification.

## Packet-level contract

Every packet field should answer:

1. What does the nurse need to know now?
2. Which canonical chart memory or note source backs it?
3. Is it hot, warm, or cold for shift-start use?
4. What is uncertain, stale, missing, or conflicting?
5. How can the bounded in-chart assistant summarize it without hiding evidence?

## Minimum packet fields

| Packet field | Shift-start question | Hot/warm/cold posture | Canonical memory/source link | Clinician-facing summary expectation | Assistant expectation |
| --- | --- | --- | --- | --- | --- |
| Patient/encounter/as-of frame | Am I looking at the right patient and time boundary? | Hot | Identity/encounter facts, patient scope | "Patient, room, encounter, as-of time" | Confirm scope; prevent cross-patient bleed |
| H&P admission reason | Why is the patient here? | Cold by default; warm when orienting; hot only if current safety relevance is explicitly promoted | H&P note, admission facts, source-linked history | One or two sentence source-linked admission reason | Cite H&P; separate admission story from current plan |
| Most recent ICU note/current plan | What is the current provider plan and working model? | Warm by default; hot for active goals/constraints/orders | ICU/progress note, assessments, orders, plan refs | Concise current-plan summary with author/time | Flag if note predates major overnight change |
| Vitals trend | What changed physiologically? | Hot for current instability/latest critical facts; warm for trend window | Vitals observations, device/oxygen facts, validity caveats | Latest and short trend in plain clinical language | Cite time window; avoid alarmism; prompt review for critical/conflicting values |
| Drips/dose rates | What medication support is running and does it match report? | Hot for active critical drips/rates | Orders, MAR/admin actions, infusion documentation, hemodynamic goals | Latest charted drip/rate, timestamp, goal if known | Compare report/chart/bedside when sources exist; prompt verification for mismatch |
| I&O/fluid balance | What is the recent volume picture? | Warm by default; hot when unsafe balance/renal/hemodynamic burden exists | I&O observations, drain/urine outputs, intake entries, device facts | Interval balance with caveats | Note incomplete windows; avoid overclaiming |
| Lab trends | Which labs are abnormal, changing, pending, or unreviewed? | Hot for critical/unreviewed/current action-changing results; warm for serial trends | Lab observations, diagnostic refs, review actions, evidence links | Key latest values and direction of travel | Distinguish result fact from review action; cite times/status |
| Work/task list | What pending actions might be missed? | Hot for due/overdue/safety-critical; warm for routine/shift planning | Intents, actions, open-loop/workflow projections, due windows | Source, due window, priority, completion criteria | Explain why item exists; do not complete it |
| Report-to-chart deltas | What did report mention that the chart does not support or that conflicts? | Hot when safety-critical; warm otherwise | Report projection states plus chart sources | Review prompt, not truth declaration | Surface competing sources and ask clinician review |

## Source states

Packet fields should use the same source-state language as the report projection:

- `source-linked` — backed by canonical chart memory or note refs;
- `source-needed` — important but missing a canonical source;
- `report-only` — present in handoff but not chart-linked;
- `conflicting` — sources disagree;
- `stale` — source exists but may predate relevant changes;
- `not-applicable` — no known relevance for this patient.

## Plain-language summary rules

Clinician-facing summaries should:

- be short enough to use during report;
- say why the item matters clinically;
- include source/time/review caveats;
- avoid implementation terms such as storage, projection node, vector, API, or backend;
- avoid blame language;
- distinguish current truth from background context;
- mark uncertainty instead of smoothing it away.

Examples:

- "Admitted for septic shock; latest ICU note still targets MAP >65, but overnight pressor rate changed after the note. Review current MAR and vitals."
- "Net positive over the last documented window, but urine-output entries appear incomplete after 0400. Treat balance as uncertain until reviewed."
- "Potassium is trending down; latest abnormal value is source-linked, review state not shown in this packet."

## Bounded assistant behavior

The assistant may:

- generate a shift-start packet summary;
- cite H&P, ICU note, vitals, MAR/orders, I&O, labs, and workflow items;
- explain uncertainty and source age;
- prompt review when report/chart/bedside sources conflict;
- suggest which chart tab/source to open next;
- keep language supportive and nonpunitive.

The assistant may not:

- hide source links behind a confident summary;
- mark report-only material as accepted truth;
- decide that a task is complete;
- write canonical chart facts;
- use hidden simulator/oracle state;
- decide backend, retrieval, vector, OpenBrain, storage, runtime, or access-plane architecture.

## Hot/warm/cold use at shift start

| Tier | Shift-start role | Examples |
| --- | --- | --- |
| Hot | Must be deterministic for immediate safety and bedside verification | patient/encounter scope, active constraints, current critical vitals, active critical drips/rates, due safety-critical tasks, critical unreviewed results |
| Warm | Supports report-time chart digging and early shift planning | ICU note, short vitals/lab trends, recent I&O windows, active plan rationale, work-list history, recent review state |
| Cold | Background source-linked context used for orientation | H&P, prior history, old consults, prior encounters, baseline functional/social context |

This table is an access behavior contract only. It does not select storage, index, vector, OpenBrain, retrieval, runtime, or access-plane technology.

## Verification prompts for later slices

A future implementation or prototype should prove:

1. The nurse can open a packet scoped to selected patient/encounter/as-of frame.
2. The packet shows H&P reason, ICU note plan, vitals, drips/rates, I&O, labs, and task-list items.
3. Each packet field has a source state and source link where available.
4. Hot/warm/cold posture is visible or testable through examples.
5. Assistant summaries include source/time/uncertainty and do not overclaim.
6. No packet output becomes canonical truth by itself.

## Boundary closeout

- [x] Minimum shift-start packet fields defined.
- [x] Hot/warm/cold posture assigned.
- [x] Canonical chart memory/source-link expectations described.
- [x] Clinician-facing plain-language expectations included.
- [x] Bounded in-chart assistant expectations included.
- [x] No retrieval/backend/vector/OpenBrain/storage/runtime/access-plane decision; no backend/vector/OpenBrain/storage/runtime/access-plane choice.
