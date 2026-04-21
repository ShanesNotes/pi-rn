# ADR 004 — `effective_at` semantics per event type

- **Status:** proposed (awaiting owner approval)
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope), CLAIM-TYPES, validator
- **Source convergence:** A1 Q2; A2 Q3; foundation hole-poke C3

## Revisions

- **2026-04-21 (operator review pass 1):** V-TIME-02 rewritten.
  Previous wording required `data.effective_period.start` for
  future-dated intents, but `effective_period` is an envelope field
  and (per ADR 005's XOR rule) cannot coexist with `effective_at` on
  the same event. New wording separates the point-shape and
  interval-shape intent cases cleanly.
- **2026-04-21 (operator review pass 2):** Imports clarification
  added. Rebased historical events (`source.kind: synthea_import` /
  `mimic_iv_import`) carry the same per-type `effective_at`
  semantics as live events; the rebase preserves physiologic
  truth-time relative to the corpus's original timeline.

## Context

The envelope documents `effective_at` as "when it was true/happened."
That is underspecified for clinical artifacts, which admit three
distinct meanings:

- **Physiologic truth-time** — the moment the state the event describes
  was actually in effect. For labs, `specimen.collected_at`. For
  imaging, `study.performed_at`. For nursing assessments, the time
  the exam occurred.
- **Chart-actionable time** — the moment the chart could act on the
  information. For labs, `resulted_at`. For imaging, `reported_at`. For
  provider orders, the ordered-at time.
- **Accountable-at time** — the moment authority attached. For labs,
  `verified_at`. For imaging, `cosigned_at`. For agent work,
  `attested_at` (deferred, see autoresearch P3).

Ambiguity breaks three things:

1. **`trend()` alignment.** If one lab event in a series uses
   `collected_at` and another uses `resulted_at`, the trend has a false
   x-axis shift typically of 30–90 minutes.
2. **openLoop SLA windows.** TJC time-to-notify for critical values is
   measured from `verified_at`; SSC serial lactate is measured from
   `collected_at`. Wrong choice of `effective_at` makes compliance
   calculations wrong.
3. **"As-of" queries.** `asOf` semantics depend on which time an event
   "takes effect." A specimen collected at 04:00 and resulted at 05:47
   is truthful about the patient's 04:00 state, not their 05:47 state.

A1 and A2 each surfaced this and left it as `[open-schema]`. Foundation
hole-poke C3 flagged the corresponding question for `recorded_at` vs
`effective_at` ordering.

## Decision

**Per-event-type convention, documented once in CLAIM-TYPES, enforced
by validator.**

### Convention

| Event type        | `effective_at` means                                                 | Rationale                                                               |
|-------------------|----------------------------------------------------------------------|-------------------------------------------------------------------------|
| `observation`     | **Physiologic truth-time.** Specimen collected / study performed / exam observed. | Trend accuracy; "what was true about the patient then."                 |
| `action`          | **Performed-at time.** When the action occurred in the world.        | Audit of what happened when; fulfillment timing.                        |
| `intent`          | **Ordered-at time.** When the intent came into force.                 | SLA clocks start here.                                                  |
| `communication`   | **Sent-at time.** When the communication left the sender.            | Callback windows, notification audit.                                   |
| `artifact_ref`    | **Captured-at time.** When the native artifact was generated.         | Correlates with the originating observation.                            |
| `assessment`      | **Author's time-of-writing.** (Same as `recorded_at`, typically.)    | Assessments are interpretations anchored to their author's viewpoint.   |

### Additional rules

- **`recorded_at` ≥ `effective_at` by default.** Historical backcharting
  is normal — the nurse charts a 08:00 vital at 08:15. Validator
  enforces `recorded_at ≥ effective_at` for `observation`, `action`,
  `communication`, `artifact_ref`, `assessment`. Future-dated events
  fail.
- **`intent` is exempt from the ordering rule.** An `intent` may be
  future-dated (`effective_at > recorded_at`) when it names a scheduled
  start. Example: a q6h lactate monitoring plan ordered at 05:00 with
  `effective_at: 06:00` to start at the top of the hour. Validator
  permits future-dated `intent` when `data.due_by` or
  `data.effective_period.start` is present.
- **Payload may carry the other time-stamps for auditability.**
  `data.collected_at`, `data.resulted_at`, `data.verified_at`,
  `data.reported_at`, `data.cosigned_at` as payload fields are
  **informational**; they do not replace `effective_at`. `trend()`,
  openLoops, and asOf queries read `effective_at`.
- **Amended / corrected events.** A correction event's `effective_at`
  is the physiologic truth-time of the newly-correct state, **not** the
  time the correction was issued. (The time the correction was issued
  is `recorded_at`.) Rationale: trends and asOf queries should reflect
  the corrected truth at the truth-time, not at the correction-time.
- **Imports.** Rebased historical events (`source.kind:
  synthea_import`, `mimic_iv_import`) obey the same per-type
  `effective_at` table. The rebase operation preserves physiologic
  truth-time relative to the corpus's original timeline — an
  imported lab carries the collected-at time rebased into the
  current encounter's clock, not the ingestion timestamp. `recorded_at`
  for imported events is the time of ingestion; the
  `recorded_at ≥ effective_at` rule (V-TIME-01) holds.

### Validator changes

- **V-TIME-01.** `recorded_at ≥ effective_at` for all types except
  `intent`. Error. (Intent exemption handled explicitly in V-TIME-02.)
- **V-TIME-02.** A future-dated `intent` takes one of two shapes,
  depending on whether it carries `effective_at` or
  `effective_period` (mutually exclusive per ADR 005 / invariant 11):
  - **Point-shape intent** with `effective_at > recorded_at` must
    carry `data.due_by`. `data.due_by ≥ effective_at`. Error if
    `data.due_by` is missing or earlier than `effective_at`.
  - **Interval-shape intent** with `effective_period.start >
    recorded_at` is permitted as written — the `start` is itself the
    scheduled-for time and no additional field is required. (`end`
    may be absent; open intervals close via supersession per ADR 005.)
  Non-`intent` events with `effective_at > recorded_at` are rejected
  by V-TIME-01.
- **V-TIME-03.** `observation` events with `data.resulted_at` or
  `data.verified_at` present must have `effective_at ≤ data.resulted_at ≤
  data.verified_at`. Warn on ordering violations.

## Tradeoffs

| Axis                                 | (a) Single rule (truth-time)     | (b) Per-type (chosen)         | (c) Status quo (ambiguous) |
|--------------------------------------|----------------------------------|-------------------------------|-----------------------------|
| Writer clarity                       | one rule to remember             | per-type table                | none                        |
| Trend alignment correctness          | correct for obs; wrong for action | correct for all               | inconsistent                |
| Audit SLA compliance                 | loses `performed_at` for actions | preserved                     | unreliable                  |
| Envelope field count                 | unchanged                        | unchanged                     | unchanged                   |
| Seed patient migration               | retime actions                   | retime some observations      | none                        |

(a) is appealing for simplicity but loses real information for actions
and communications, where "when it happened" is not a physiologic
truth-time. (c) is the current footgun.

## Consequences

- **DESIGN.md §1** — envelope table `effective_at` row gains a note
  "per-type semantics documented in CLAIM-TYPES; see ADR 004."
- **CLAIM-TYPES.md** — adds a §"`effective_at` per type" section with
  the table above, plus the amendment rule and the payload-shadow
  rule.
- **src/validate.ts** — V-TIME-01/02/03 as above.
- **Seed `patient_001`** — audit: any events where `effective_at`
  was set to "now" (write time) rather than the physiologic truth
  time. Migrate during implementation ADR follow-up.
- **`latestEffectiveAt` helper (`src/read.ts`)** — no change; already
  returns max `effective_at`. Its meaning becomes more precise under
  the per-type convention.

## Not decided here

- Whether `assessment.effective_at` should track the `asOf` the
  assessment was made for (e.g., an assessment written at 08:15 but
  reasoning as-of 08:00 because it rests on the 08:00 vital) — this
  is the "asOf of the assessment" and currently has no envelope slot.
  Leave in payload (`data.reasoned_asOf`) until a second artifact demands
  it.
- Time granularity (ms vs seconds). ISO8601 accepts fractional seconds;
  100Hz waveforms need it. Tracked as separate future work.
- Timezone mixing within an encounter. Deferred.
