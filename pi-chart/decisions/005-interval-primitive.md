# ADR 005 — Interval primitive: optional `effective_period`

- **Status:** proposed (awaiting owner approval)
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope), §5.2 (ICU stay granularity open seam), schemas/event.schema.json, validator, views
- **Source convergence:** foundation hole-poke B1; autoresearch P4; ROADMAP Seam 5 (ICU stay granularity); A5 (LDAs) anticipated pressure

## Revisions

- **2026-04-21 (operator review pass 1):** Stop-event chain (legacy
  pattern 2) removed. Supersession is the only permitted closure
  path. Rationale: the view-layer rules below assume the
  authoritative end timestamp lives on the event currently holding
  authority (i.e., the supersessor). A sibling stop event strands the
  `end` on a separate record that `currentState` and `openLoops` would
  have to special-case, defeating the uniform "active at T" query
  shape. V-INTERVAL-04 updated to reject point events that attempt
  to close an interval.
- **2026-04-21 (operator review pass 2):** Two tightenings.
  (1) `observation.context_segment` is net-new subtype introduced
  by this ADR; §Consequences now lists the CLAIM-TYPES addition
  explicitly. (2) Per-subtype open-interval policy locked in:
  `effective_period` with no `end` is permitted on
  `observation.context_segment`, `observation.device_reading`,
  `intent.monitoring_plan`, `intent.care_plan`, and
  `action.administration`; rejected on
  `observation.vital_sign` and `observation.lab_result`. The
  allow-list moves from lean-guidance to validator rule under
  V-INTERVAL-02.

## Context

Every clinical event in pi-chart anchors on a single `effective_at`
timestamp. That works for point events (a specimen drawn at 08:00, a
med administered at 09:15, a lab resulted at 10:20). It does not work
for **states that persist across time**:

- oxygen therapy epochs ("2L NC from 08:00 to 14:30")
- infusion / titration windows ("norepinephrine 0.12 mcg/kg/min from
  06:30 until titrated down at 08:45")
- ventilator setting periods
- NPO windows, restraint intervals, isolation precautions
- ICU location segments (DESIGN §5.2 open seam)
- monitoring-plan cadence windows ("q2h lactate checks until lactate
  clearance")
- coverage / responsibility windows

Today, these are either (i) expressed by paired start+stop events
whose linkage is implicit, or (ii) stuffed into `data.start_at` /
`data.end_at` conventions per subtype, which validator cannot reason
about.

The `vitals://` URI (DESIGN §4.5) is a precedent for interval
reasoning — it describes an interval over a metric. But it is
observation-specific and lives in evidence references, not envelopes.
A5 (LDAs) will hit interval semantics on day one. ROADMAP Seam 5
("ICU stay granularity") is the same problem.

## Decision

**Add an optional envelope field `effective_period: { start, end? }`
alongside `effective_at`.** Exactly one of `effective_at` or
`effective_period` is present per event. Point events keep
`effective_at`; interval events use `effective_period`. `end` may be
omitted for open (ongoing) intervals; an open interval closes when a
later event with `links.supersedes` provides an `end` or a new
`effective_period`.

### Shape

```jsonc
// point event (existing shape; unchanged)
{
  "effective_at": "2026-04-20T08:00:00-05:00",
  "recorded_at":  "2026-04-20T08:00:08-05:00"
}

// interval event
{
  "effective_period": {
    "start": "2026-04-20T06:30:00-05:00",
    "end":   "2026-04-20T08:45:00-05:00"    // omit for open intervals
  },
  "recorded_at": "2026-04-20T06:30:03-05:00"
}
```

### Schema rule

`event.schema.json` adds:

```jsonc
"oneOf": [
  { "required": ["effective_at"],      "not": { "required": ["effective_period"] } },
  { "required": ["effective_period"],  "not": { "required": ["effective_at"] } }
]
```

### Closing an open interval

Open intervals close by **supersession only**. Write a new event
with the same payload (or updated payload) and a populated
`effective_period.end`, carrying `links.supersedes:
[<open-interval-event-id>]`. The prior open interval is superseded;
current state reflects the new closed interval.

Stop-event chains (a separate point event carrying a `data.event:
"stop"` marker or equivalent that claims to end a referenced
interval) are **not permitted**. The view-layer rules below assume
the authoritative end timestamp lives on the event currently holding
authority (i.e., the supersessor). Allowing a sibling stop event
would strand `effective_period.end` on a separate record and force
`currentState` and `openLoops` to special-case the stranded-end case
for every subtype. Validator rejects this pattern (V-INTERVAL-04).

### Applicable event types

Interval semantics make sense for:

- `intent.monitoring_plan` (cadence window)
- `intent.care_plan` (plan duration)
- `action.administration` when the administration is an infusion or
  titration (distinct from a point-in-time push)
- `observation.device_reading` when the reading represents a stable
  setting period (vent settings, pressor drip rate)
- new `observation.subtype = context_segment` for care-location, NPO,
  isolation precautions, restraint intervals (resolves DESIGN §5.2 open
  seam without a new top-level type)

Event types that are inherently point-shaped continue to use
`effective_at`: specimen results, critical callbacks, assessments,
artifact refs. Validator rejects `effective_period` on those in a
per-subtype allow-list (V-INTERVAL-02 below).

### Validator changes

- **V-INTERVAL-01.** Exactly one of `effective_at` / `effective_period`
  is present. Error otherwise.
- **V-INTERVAL-02.** `effective_period` permitted only on a closed
  allow-list of `(type, subtype)` combinations. Error outside the
  list. Open intervals (`effective_period` without `end`) are
  further restricted: permitted on `observation.context_segment`,
  `observation.device_reading`, `intent.monitoring_plan`,
  `intent.care_plan`, and `action.administration`; rejected on
  `observation.vital_sign` and `observation.lab_result` (point-in-
  time domains; an open interval is always a write error). The
  full allow-list and per-subtype open/closed policy live in
  CLAIM-TYPES.
- **V-INTERVAL-03.** `effective_period.start` ≤ `effective_period.end`
  when `end` is present. Error otherwise.
- **V-INTERVAL-04.** Open intervals close only via supersession
  (§Closing an open interval). A point event that attempts to end a
  referenced interval — e.g., `data.event: "stop"`, `data.closes:
  <interval-event-id>`, or any equivalent shape claiming to close
  another event's `effective_period` — is rejected. Direct in-place
  mutation of `effective_period.end` on an existing event is already
  forbidden by append-only (invariant 2).

### View updates (documented, implemented in follow-up ADR)

- `timeline` sort key: `effective_at ?? effective_period.start`.
- `currentState(axis: "devices" | "care_location" | "meds_active")`:
  returns events whose `effective_period` covers `asOf` and are not
  superseded. "Active interval at time T" is a clean new query shape.
- `trend`: for numeric context segments (e.g., FiO2 epochs), returns
  step-function points at period boundaries.
- `evidenceChain`: unchanged; references cite event ids regardless of
  point/interval shape.
- `openLoops`: cadence monitoring plans (`intent.monitoring_plan` with
  `effective_period`) that are active as of `asOf` but have not seen
  the cadenced observation within the window → open.

## Tradeoffs

| Axis                                  | (a) `effective_period` envelope (chosen) | (b) `data.{start,end}` convention | (c) New `interval` type           |
|---------------------------------------|------------------------------------------|-----------------------------------|-----------------------------------|
| Envelope change                       | one optional field + XOR rule            | none                              | breaks "six clinical types"       |
| Validator can reason about intervals  | yes                                      | only per-subtype (scattered)      | yes, but costs a primitive        |
| View query shape "active at T"        | uniform                                  | subtype-specific                  | uniform                           |
| Primitive discipline (charter §3.3)   | new payload shape (medium impact)        | new payload shape (scattered)     | new event type (high impact)      |
| Seed patient migration                | medium (some events gain `effective_period`) | low (already using `data.*`)   | high                              |
| Backward compat                       | preserves point events                   | preserves everything              | breaks                            |

(a) is the minimum structural addition that makes interval semantics
first-class. (b) exists today in piecewise form and is the root cause.
(c) blows the primitive budget.

## Consequences

- **DESIGN.md §1** — envelope table adds `effective_period?` row with
  the "exactly one of" note.
- **DESIGN.md §4** — view primitive specs get a short note that
  `asOf` queries cover interval events via `effective_period`.
- **DESIGN.md §5.2** — ICU stay granularity seam resolves: use
  `observation.context_segment` with `effective_period` and
  `data.location`. Mark seam closed in ROADMAP.
- **DESIGN.md §8** — add invariant 11 "exactly one of `effective_at` /
  `effective_period` per event" (or fold into invariant 1).
- **schemas/event.schema.json** — add `effective_period` with `oneOf`
  against `effective_at`.
- **CLAIM-TYPES.md** — envelope recap shows both shapes; per-type
  table notes which subtypes may use `effective_period`. §1
  observation subtype list adds `context_segment` (net-new subtype
  introduced by this ADR) for care-location, NPO, isolation
  precautions, restraint intervals, and other time-spanning
  non-numeric state. The open/closed allow-list for `effective_period`
  is enumerated here as the canonical source.
- **src/validate.ts** — V-INTERVAL-01/02/03 as above.
- **src/views/** — `timeline`, `currentState`, `trend`, `openLoops`
  gain interval awareness (follow-up ADR execution).
- **Seed `patient_001`** — audit: any multi-hour state today expressed
  as "an event at start time" (e.g., O2 set to 2L NC at 08:00 and
  assumed stable thereafter) should become an interval event.
  Specifically the O2 device context on the respiratory case.

## Not decided here

- Whether `effective_period` applies to `action.administration` for
  titrated drips (versus one event per titration step). Likely: yes
  for stable infusion periods; new event per rate change with
  supersession. A4 MAR will stress this.
- Whether open intervals (no `end`) are permitted on `observation`
  types other than `context_segment`. Lean: yes for `device_reading`,
  no for `vital_sign`. Confirm in CLAIM-TYPES.
- Interaction with `asOf` for a point-in-interval query: is a sample
  at T=08:30 "inside" a period 08:00–08:45? Semantics say yes;
  validator needn't enforce.
- Migration of `vitals://` URI syntax — unaffected today; may collapse
  into the general interval-ref story later.
