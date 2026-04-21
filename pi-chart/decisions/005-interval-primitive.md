# ADR 005 — Interval primitive: optional `effective_period`

- **Status:** proposed (awaiting owner approval)
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope), §5.2 (ICU stay granularity open seam), schemas/event.schema.json, validator, views
- **Source convergence:** foundation hole-poke B1; autoresearch P4; ROADMAP Seam 5 (ICU stay granularity); A5 (LDAs) anticipated pressure

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

Two patterns accepted, equivalent in semantics:

1. **Supersede**: write a new event with the same payload (or updated
   payload) and a populated `effective_period.end`, carrying
   `links.supersedes: [<open-interval-event-id>]`. The prior open
   interval is now superseded; current state reflects the new closed
   interval.
2. **Stop-event chain**: write a new event of the same subtype with a
   `data.event: "stop"` marker and `effective_at` at the stop time,
   carrying `links.corrects` or `links.supersedes` to the original.
   This is the legacy pattern; permitted but not preferred.

Pattern (1) is canonical; views assume it.

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
  allow-list of `(type, subtype)` combinations (listed in
  CLAIM-TYPES). Error outside the list.
- **V-INTERVAL-03.** `effective_period.start` ≤ `effective_period.end`
  when `end` is present. Error otherwise.
- **V-INTERVAL-04.** Open intervals are closed only via supersession
  (§closing above). A direct in-place write setting `end` on an existing
  event is already forbidden by append-only (invariant 2); this rule is
  implicit.

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
  table notes which subtypes may use `effective_period`.
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
