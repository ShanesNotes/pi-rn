# Workflow item source and authority grammar

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
Depends on: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`
Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-03-04-06-20260504T151627Z.md`

## Purpose

Define the per-patient workflow item grammar for the shift brain. A workflow item is a derived projection that helps the nurse understand what needs attention, why it is on the list, who or what created it, whether it is required or suggested, what completes it, and how it can be deferred, blocked, carried forward, or marked not clinically appropriate now.

Workflow items support clinical prioritization. They are not canonical chart truth and do not authorize autonomous agent completion.

## Core questions every item answers

1. Why is this on my list?
2. Who or what created it?
3. Is it required, suggested, routine, or informational?
4. When is it due or relevant?
5. What evidence/source supports it?
6. What completes it?
7. What happens if it is delayed, deferred, blocked, bundled, or carried forward?
8. Does it need bedside verification or chart review before action?

## Source hierarchy

| Rank | Source | Authority posture | Examples | Notes |
| --- | --- | --- | --- | --- |
| 1 | Provider order | Required clinical order unless cancelled/superseded/held/refused by sanctioned workflow | medication order, lab draw, imaging prep, MAP goal | Full CPOE implementation remains out of scope |
| 2 | Protocol/order-set generated order | Required when generated through accepted policy/order workflow | default admission labs, ICU order-set tasks, protocol monitoring | Actual order-set content remains future scope |
| 3 | Nurse-entered verbal/telephone order pending co-sign | Required/active with pending accountability caveat | telephone potassium replacement order, verbal stat lab | Minimal semantics handled in later issue 10 |
| 4 | Nursing judgment / nurse-authored task | Clinician-authored workflow plan | recheck pain, call family, reassess after intervention | Human-authored and human-owned |
| 5 | Patient/family request | Contextual workflow item | family asks for update, patient requests repositioning | Requires clinical judgment and prioritization |
| 6 | Agent suggestion pending acceptance | Suggested/provisional only | assistant suggests reviewing downtrending BP or clustering care | Not active workflow until human acceptance |
| 7 | Device/import-derived attention item | Informational or review prompt unless explicitly modeled otherwise | monitor trend attention, imported observation needing review | Does not silently complete nursing tasks |
| 8 | System projection from existing facts | Derived reminder/watch item | open-loop projection, due soon view, carry-forward item | Projection over canonical memory, not separate truth |

## Authority labels

| Label | Meaning | Completion owner |
| --- | --- | --- |
| `required` | Must be addressed because a charted order/policy/protocol/constraint requires it | Human or sanctioned chart workflow |
| `time-sensitive` | Timing materially affects safety or quality | Human |
| `routine` | Expected care but not currently safety-critical | Human |
| `suggested` | Proposed by agent/system/nurse planning but not authoritative | Human accepts/rejects/modifies |
| `informational` | Helps awareness but does not itself require action | Human judgment |
| `handoff-watch` | Not due now but should carry forward | Human final handoff owner |

## Item shape

This is a product/domain grammar, not a storage schema decision.

| Field | Purpose |
| --- | --- |
| Patient/encounter/as-of scope | Prevent cross-patient context bleed |
| Display label | Human-readable task or attention item |
| Source kind | Provider order, protocol/order-set, verbal/telephone, nursing judgment, patient/family, agent suggestion, device/import, system projection |
| Source refs | Links back to canonical facts/actions/notes/refs or marks source-needed/report-only |
| Authority label | Required, time-sensitive, routine, suggested, informational, handoff-watch |
| Due window | Due now, due soon, scheduled time, recurrence/cadence, or no due time |
| Priority tier input | Safety critical, time-sensitive, routine, handoff/watch |
| Completion criteria | What charted action/fact/review closes or satisfies it |
| State | Active, due soon, delayed, deferred, blocked, waiting on, bundled, carried forward, completed, rejected/dismissed, not clinically appropriate now |
| Defer/block reason | Patient condition, provider/pharmacy/transport, bundled with care cluster, not clinically appropriate, higher-priority work, missing order/evidence |
| Evidence/caveat | Why it exists and uncertainty/source age/conflict notes |
| Human/agent boundary | Whether agent may suggest only, or whether human acceptance/completion is required |

## Posture and state language

Use supportive language:

- due;
- due soon;
- needs attention;
- review priority;
- delayed;
- deferred by clinician;
- blocked / waiting on X;
- not clinically appropriate now;
- bundled with next care cluster;
- carry forward.

Avoid routine blame language:

- failed;
- nurse failed;
- noncompliant;
- overdue as accusation;
- punitive audit framing.

Domain lifecycle terms such as `failed` may still exist in canonical order/action semantics when clinically precise, but routine shift-brain presentation should not use them to judge the clinician.

## Canonical workflow modifications vs display customization

Display customization changes the view only:

- horizon;
- grouping;
- filtering;
- pinning;
- snoozing;
- personal checklist display;
- unit template display.

Canonical workflow modifications require sanctioned chart facts/actions/communications:

- medication retiming;
- documenting hold/refusal/omission;
- completing a medication administration;
- entering verbal/telephone orders;
- readback;
- provider co-sign/countersign;
- documenting an assessment;
- documenting why a required task is not clinically appropriate now.

## Open-question preservation

The exact bedside/I&O/LDA/device grammar is not fully settled in this lane. This artifact can name workflow pressure from I&O, lines/tubes/drains, oxygen/device burden, wounds, turns, mobility, and nursing assessments, but implementation authority should preserve open-question status where the canonical grammar is not explicit.

Do not pretend unresolved I&O interval grammar, LDA addressability, or device-derived completion semantics are settled.

## Examples

| Example item | Source/authority | Completion criteria | Defer/block/carry-forward behavior |
| --- | --- | --- | --- |
| Scheduled antibiotic due at 0900 | Provider medication order; required/time-sensitive | Human-charted MAR administration, hold, refusal, omission, or retiming action | Can be delayed/deferred with reason; agent may not complete |
| Lab draw due after electrolyte replacement | Provider/protocol order; time-sensitive | Specimen collection/action and resulting lab workflow state when modeled | Blocked if access unavailable or patient condition prevents draw |
| First full assessment | Unit/nursing cadence or nurse-authored plan; routine/time-sensitive depending acuity | Human-charted assessment | May be bundled with med pass or deferred for higher-priority instability |
| Foley/I&O check | Device/order/policy/nursing workflow source; routine or time-sensitive | Human-charted I&O/device assessment where modeled | Can be blocked by patient condition or bundled with room entry |
| Central-line dressing check/change | LDA/policy/order source; routine/time-sensitive | Human-charted dressing assessment/action | Carry forward if delayed and still relevant |
| Transport readiness for CT | Imaging/procedure order and care coordination; time-sensitive | Human-documented readiness/transport action | Blocked waiting on transport/provider/patient stability |
| Reposition/turn | Unit policy/nursing plan/skin-risk source; routine/time-sensitive | Human-charted reposition/skin assessment if required | Can be bundled with care cluster; not punitive if delayed |
| Agent suggests reviewing downtrending MAP | Agent suggestion; suggested/provisional | Human accepts as workflow item or dismisses; source vitals remain evidence | Agent cannot create active obligation without acceptance |
| Family update request | Patient/family request; informational/routine/time-sensitive depending context | Human communication/action when performed | Can carry to handoff/watch if unresolved |

## Bounded assistant behavior

The assistant may:

- explain why an item is listed;
- show source, authority, due window, and completion criteria;
- suggest priority tier or care clustering;
- detect missing source/evidence;
- suggest review when state is conflicting or stale;
- keep language nonpunitive.

The assistant may not:

- promote its own suggestion to active workflow;
- complete a task;
- chart a clinical action;
- decide a defer/block reason without human action;
- treat device/import evidence as nursing task completion unless explicitly modeled and accepted;
- resolve open I&O/LDA/device grammar by implication.

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Every workflow item shows source and authority.
2. Required/suggested/routine/informational posture is visible.
3. Due window and priority tier inputs are available.
4. Completion criteria are source-linked.
5. Deferred, blocked, carry-forward, not-clinically-appropriate, and bundled states preserve clinician judgment.
6. Agent-created items remain suggested until human acceptance.
7. Examples across medication due work, lab draws, assessment cadence, I&O, LDA/device work, transport readiness, and nursing judgment are representable.

## Boundary closeout

- [x] Source hierarchy and authority labels defined.
- [x] Required/suggested/routine/informational posture defined.
- [x] Due window, priority tier input, completion criteria, defer/block/carry-forward state, and evidence/source links defined.
- [x] Canonical workflow modifications distinguished from display customization.
- [x] Bedside/I&O/LDA/device grammar preserved as open-question where unsettled.
- [x] Examples provided across medication due work, lab draw work, assessment cadence, I&O, lines/tubes/drains, transport/procedure readiness, and nursing judgment tasks.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane choice.
