# HITL workflow prioritization decisions

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`
Related recommendation: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/lean-dense-v0-5-substrate-recommendation.md`
Captured: 2026-05-04

## Purpose

This note captures maintainer/HITL decisions made after issue 13 about the clinician-facing workflow / shift-brain projection. These decisions should feed issue 14 closeout and downstream PRDs/issues.

Core framing:

> The chart and agent should gather the right context at the right time to make the clinician maximally effective.

The workflow surface should help clinicians prioritize work without becoming punitive, autonomous, or a second source of chart truth.

## Decisions

### 1. Workflow item sources

The shift-brain/work-priority view should allow both:

- chart-derived obligations from orders, MAR, assessments, constraints, open loops, policy, protocol, and order-set generated work;
- human-authored workflow tasks added by clinicians.

Standing orders, protocol orders, default admission orders, and ICU orders should drive many medication and nursing tasks. Human-authored tasks may later be created through agent chat/orchestration, but v0.5 chart substrate should structure source and authority now.

### 2. Order sets

Default hospital admission order sets and adult ICU order sets should be downstream content/policy artifacts, not core substrate primitives.

v0.5 chart substrate should define how to represent orderset-derived work, including:

- medication orders;
- nursing task orders;
- monitoring cadence;
- assessments;
- labs;
- diet/activity/precautions;
- consults;
- transport/imaging preparation.

The actual order-set content belongs in a later PRD/package.

### 3. Agent-created tasks

Agent-created tasks should use a three-state model:

1. `suggested` — visible but provisional;
2. `accepted` — human-accepted and promoted into active workflow;
3. `rejected` / `dismissed` — not active workflow.

Only human acceptance promotes an agent suggestion into active workflow. The agent task-suggestion function should be disable-able.

### 4. Task completion authority

Humans complete workflow tasks.

Narrow chart/device/import evidence may satisfy explicitly modeled facts, but the agent cannot silently complete tasks. The agent may suggest completion when evidence supports it.

Examples:

- MAR administration can satisfy a med-due task.
- Labs/results can satisfy a linked draw/result workflow only when explicitly modeled.
- Device/import evidence may update observations but generally should not complete nursing tasks.

### 5. Priority logic

Shift-brain prioritization should be clinical-risk/context tiered, not a simple due-time list.

Recommended tiers:

1. **Now / safety critical** — critical meds, pressors/drips, instability, urgent transport/procedure readiness, critical results.
2. **Due soon / time-sensitive** — scheduled meds, blood glucose checks, assessments, antibiotics, turns, I&O checks.
3. **Routine care** — bath, linen, routine dressing, non-urgent documentation.
4. **Handoff/watch** — not necessarily due now, but should carry forward.

Sort by due/overdue time within tiers.

Rule: **time matters, but clinical risk wins.**

### 6. Time horizons and modularity

Shift-brain views should support multiple horizons:

- now;
- next 1 hour;
- next 4 hours;
- shift view;
- encounter context.

Default should be **now + next 4 hours**.

The feature must be modular/customizable to clinician and nursing workflow. Lack of customization in existing EHRs is a major pain point. Customization changes views/projections, not canonical chart truth.

### 7. Customization boundaries

View customization may include:

- time horizons;
- grouping by patient, room, task type, priority, or due time;
- visibility/filtering;
- pinning;
- snoozing;
- personal notes/checklists;
- unit templates.

Clinical workflow modification is different from display customization. Changes that alter medication/order/task truth become charted clinical actions with source, authority, timing, and attestation.

Examples of canonical workflow modifications:

- changing medication due times;
- retiming meds;
- documenting holds/refusals;
- entering verbal orders;
- entering telephone orders;
- readback;
- provider co-sign/countersign.

### 8. Verbal and telephone orders

v0.5 should represent minimal verbal/telephone order semantics because they affect nursing workflow and order authority.

Minimum concepts:

- nurse-entered order;
- ordering provider;
- mode: verbal or telephone;
- readback yes/no;
- timestamp;
- co-sign required;
- co-sign status: pending, signed, rejected;
- normal downstream order/MAR/workflow tasks;
- correction/supersession if rejected or modified.

Do not build a full legal/compliance platform yet.

### 9. Medication retiming

Medication retiming should be modeled as a medication workflow action linked to the original order/MAR schedule.

Do not model it as simply mutating the due time or primarily as an old/new due-time record. In real clinical workflow, retiming is a charted medication workflow action.

### 10. Workflow item authority hierarchy

Each shift-brain item should expose source/authority. Initial hierarchy:

1. provider order;
2. protocol/order-set generated order;
3. verbal/telephone order entered by nurse pending co-sign;
4. nursing judgment / nurse-authored task;
5. patient/family request;
6. agent suggestion pending acceptance;
7. device/import-derived attention item;
8. system projection from existing facts.

Each item should answer:

- why is this on my list?
- who/what created it?
- is it required, suggested, routine, or informational?
- what completes it?
- what happens if it is ignored or deferred?

### 11. Supportive, non-punitive operating mandate

Ignored, delayed, or deferred tasks are normal in everyday nursing because clinicians continuously reprioritize.

The shift brain must not become a punitive or judgmental "Karen nurse overlord." It should assume competent prioritization under load rather than incompetence or laziness.

Operating mandate:

- gentle reminders;
- unobtrusive suggestions;
- no shaming language;
- no "nurse failed" framing;
- no punitive audit posture;
- assume higher-priority work displaced lower-priority work;
- help recover context, not assign blame.

Risk labels may explain prioritization but should not judge the nurse or create punitive audit behavior.

### 12. Neutral overdue/deferred language

Use neutral/supportive language:

- needs attention;
- due / due soon;
- delayed;
- carry forward;
- review priority;
- blocked / waiting on X;
- deferred by clinician.

Allow nurses to mark:

- deferred;
- not clinically appropriate now;
- waiting on patient condition;
- waiting on provider/pharmacy/transport;
- bundled with next care cluster.

Avoid punitive language such as failed, noncompliant, or blame-oriented overdue framing.

### 13. Care clustering

The shift brain should support care clustering as a derived grouping/projection.

It should:

- group compatible tasks by patient/location/time window;
- respect urgency and incompatibilities;
- avoid altering underlying task source;
- allow the nurse to accept, modify, or ignore the cluster;
- carry unresolved clusters into handoff/watch when useful.

### 14. Interruptiveness

Interruptions should be scarce. Most workflow support should be glanceable, not intrusive.

Prominent interrupt only for:

- immediate safety risk;
- critical med/drip issue;
- rapid deterioration signal;
- time-sensitive transport/procedure readiness;
- critical unreviewed result;
- task blocked by missing order/evidence;
- conflict between orders/constraints.

Quiet shift-brain items include routine turns, baths, assessments, I&O, and non-urgent dressing changes.

Nonurgent unresolved work can carry to handoff/watch.

### 15. Handoff carry-forward

The shift brain should contribute derived/proposed handoff content, including:

- unresolved safety-critical tasks;
- delayed but relevant care;
- blocked tasks and why;
- patient-specific watch items;
- recent major changes;
- medication/order issues;
- pending labs/scans/consults;
- clinician-deferred items;
- care-cluster suggestions.

The human owns final handoff content.

### 16. Cadence sources

Nursing assessment/task cadence can come from multiple sources:

- unit policy;
- order set;
- patient acuity;
- nurse-authored plan;
- provider/protocol order;
- insulin protocol;
- pressure-injury risk;
- CIWA/COWS or other protocolized scoring.

Every cadence item needs source, authority, and override/defer semantics.

### 17. Unit policy representation

Unit policy should be represented as structured policy-derived workflow sources that the chart can reference, not as hardcoded defaults.

Chart substrate should support:

- policy source;
- policy name/version;
- patient applicability;
- generated task/obligation;
- override/defer reason;
- human completion/action.

The actual policy library comes later.

### 18. Patient vs assignment-level brain

The workflow model should support both per-patient and assignment-level views.

v0.5 chart substrate should model per-patient workflow items first. Assignment-level nurse brain is a later cross-patient projection/orchestration surface aggregating per-patient items.

## Downstream implications

- Issue 14 should include this note in closeout/handoff verification.
- Future PRD/issues should likely split:
  - workflow item/source/authority grammar;
  - order/protocol/order-set derived tasks;
  - verbal/telephone order minimal semantics;
  - MAR retiming/action semantics;
  - care clustering and non-punitive UX principles;
  - per-patient shift brain projection;
  - future assignment-level aggregation/orchestration.
- These decisions do not authorize source implementation, patient migration, backend/vector/OpenBrain choices, `pi-ledger` kernel changes, or autonomous agent task completion.

## Boundary closeout

- [x] Docs-only HITL capture.
- [x] No source, schema, test, patient, `_derived`, package, lockfile, ADR, design asset, `pi-ledger`, or `pi-sim` internal edits authorized.
- [x] No backend, vector, OpenBrain, storage, runtime, or access-plane decision.
- [x] No autonomous agent task-completion authority.
- [x] Workflow projections remain derived from chart facts/actions/tasks and human-authored workflow items with explicit authority.
