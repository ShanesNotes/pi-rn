# Clinical-risk prioritization and supportive language

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/08-clinical-risk-prioritization-and-supportive-language.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/bedside-verification-and-mismatch-prompts.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/human-agent-workflow-boundary.md`

## Purpose

Define the shift-brain prioritization and language contract. The shift brain is a derived projection that helps the nurse plan and reprioritize care. It should rank by clinical risk/context first, then by due/delayed time within a tier. It should assume competent clinician reprioritization under load and avoid blame-oriented task-manager language.

## Priority model

| Tier | Meaning | Examples | Prompt posture |
| --- | --- | --- | --- |
| `now / safety critical` | Needs immediate attention because delay may create harm or missed escalation | active critical drip/rate mismatch, rapid deterioration, order/constraint conflict, critical unreviewed result, blocked safety task, wrong patient/as-of scope | Prominent; may interrupt planning |
| `due soon / time-sensitive` | Timing matters for safety, effectiveness, workflow coordination, or quality | scheduled antibiotic, time-sensitive lab draw, transport/procedure readiness, reassessment after intervention, provider-requested follow-up | Visible and ordered by due window; prominent only when risk rises |
| `routine care` | Expected care that should be planned but is not currently safety-critical | full assessment, turns, baths, routine dressing check, routine I&O review, nonurgent family update | Quiet/glanceable; supports care clustering |
| `handoff / watch` | Not necessarily actionable now, but should remain visible for continuity | unresolved blocked work, deferred clinically relevant task, watch item, pending consult/result, care-cluster suggestion, report-only caveat | Quiet carry-forward unless safety context changes |

Clinical risk wins over simple due-time ordering. Within a tier, due/delayed time, source authority, patient condition, and dependency state can sort the view.

## Neutral/supportive language

Use language that helps the nurse decide what to do next:

- needs attention;
- review priority;
- due;
- due soon;
- delayed;
- carry forward;
- blocked;
- waiting on provider/pharmacy/transport/patient condition;
- deferred by clinician;
- not clinically appropriate now;
- bundled with next care cluster;
- source-needed;
- report-only;
- review before action;
- handoff/watch.

Avoid routine blame-oriented language:

- failed;
- nurse failed;
- noncompliant;
- ignored;
- overdue as accusation;
- violation;
- delinquent;
- punitive audit framing;
- language implying laziness, incompetence, or disregard.

Domain terms such as `failed` may still exist in canonical order/action semantics when clinically precise, such as failed procedure attempt or failed lab draw. The routine shift-brain presentation should translate those into supportive workflow language when addressing the clinician.

## Defer/block/carry-forward reasons

| Reason | Use when | Safe presentation |
| --- | --- | --- |
| Higher-priority work displaced it | Clinician handled instability, urgent medication, escalation, or competing safety issue first | "Delayed while higher-priority work was addressed." |
| Patient condition | Patient is unstable, unavailable, sleeping/resting when interruption is not appropriate, refusing, off-unit, or clinically unable | "Waiting on patient condition" or "not clinically appropriate now." |
| Provider/pharmacy/transport dependency | Work needs order clarification, medication availability, transport, procedure timing, or consult response | "Blocked / waiting on pharmacy" or relevant dependency. |
| Missing order/evidence/source | The task cannot safely proceed because authority or evidence is missing/conflicting | "Review source/authority before action." |
| Bundled with care cluster | Safe to combine with next room entry, med pass, assessment, turn, or line/device check | "Bundled with next care cluster." |
| Handoff/watch carry-forward | Still relevant but better handled by next clinician/time horizon | "Carry forward to handoff/watch." |
| Not clinically appropriate now | The clinician judges that a task should not happen now despite default timing | "Deferred by clinician: not clinically appropriate now." |

The reason preserves clinical judgment. It is not an admission of failure.

## Prominent vs quiet prompt rules

Prominent prompts are scarce. Use them for:

- immediate safety risk;
- critical med/drip issue;
- rapid deterioration or threshold/goal conflict;
- time-sensitive transport/procedure readiness;
- critical unreviewed result;
- blocked safety task;
- order/allergy/constraint conflict;
- patient/encounter/as-of mismatch.

Quiet prompts are the default for routine care. Use them for:

- turns, baths, routine assessments, routine I&O, nonurgent dressing changes;
- source-age caveats without immediate safety effect;
- report-only background context;
- care-clustering suggestions;
- handoff/watch carry-forward;
- delayed nonurgent work.

Prominence can escalate if context changes. Quiet does not mean unimportant; it means no current need to interrupt.

## Sorting and view behavior

A safe shift-brain projection should:

1. filter to patient/encounter/as-of scope;
2. assign or display source/authority and completion criteria from workflow grammar;
3. assign priority tier from clinical risk/context;
4. sort by due/delayed time within each tier;
5. show block/defer/carry-forward reason when present;
6. support care clustering for compatible quiet/routine/time-sensitive items without hiding urgent work;
7. keep handoff/watch items visible without turning them into immediate interruptions;
8. mark agent-originated content as suggested/provisional unless human accepted it.

This is product/domain behavior only. It does not define storage, ranking algorithms, alert infrastructure, vector retrieval, or backend services.

## Assistant language boundary

The assistant may:

- explain why an item is in a tier;
- suggest that a prompt should be prominent or quiet based on source-linked evidence;
- use neutral/supportive language;
- suggest defer/block/carry-forward labels for human review;
- suggest care clusters that respect urgency and incompatibilities;
- keep delayed work visible without shaming the clinician.

The assistant may not:

- blame the clinician for delayed work;
- infer negligence from an incomplete task;
- complete, defer, block, or carry forward a task without human action;
- use hidden state or unstated policy to escalate prompts;
- convert a suggestion into an active obligation without human acceptance;
- use punitive audit framing in routine workflow views.

## Examples

| Situation | Safe wording | Avoid |
| --- | --- | --- |
| Antibiotic is time-sensitive and due soon | "Due soon: scheduled antibiotic. Review MAR before med pass." | "Antibiotic will be failed if nurse does not administer." |
| Turn delayed during instability | "Delayed while higher-priority work was addressed; carry forward or bundle with next room entry." | "Turn missed / noncompliant." |
| Lab draw cannot proceed | "Blocked: waiting on access/order clarification." | "Lab task ignored." |
| Full assessment planned around meds | "Bundled with next med pass/care cluster if clinically appropriate." | "Assessment overdue; nurse failed timeline." |
| Wound concern from report only | "Report-only wound concern; review/source-link when able." | "Wound problem confirmed." |
| Critical result unreviewed | "Needs attention now: critical result appears unreviewed; review source and act per workflow." | "Agent reviewed and closed result." |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Items can be grouped into now/safety-critical, due soon/time-sensitive, routine care, and handoff/watch.
2. Clinical risk/context controls tiering before due/delayed time sorting.
3. Due/delayed time sorts within a tier.
4. Neutral/supportive language appears in delayed/deferred/blocked/carry-forward states.
5. Blame-oriented words do not appear in routine shift-brain presentation.
6. Defer/block/carry-forward reasons preserve clinician judgment.
7. Prominent prompts remain limited to meaningful safety/time-sensitive cases.
8. Quiet prompts remain glanceable and can carry to handoff/watch without alarm fatigue.

## Boundary closeout

- [x] Priority tiers defined: now/safety-critical, due soon/time-sensitive, routine care, handoff/watch.
- [x] Clinical risk wins over simple due-time ordering; due/delayed time sorts within tier.
- [x] Neutral/supportive language defined.
- [x] Routine blame-oriented language forbidden.
- [x] Defer/block/carry-forward reasons preserve clinical judgment.
- [x] Prominent versus quiet prompt rules defined to avoid alarm fatigue.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane decision.
- [x] No direct agent accepted-writes or autonomous task completion.
