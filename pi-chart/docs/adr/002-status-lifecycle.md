# ADR 002 — Status lifecycle: envelope `status` vs. `data.status_detail`

- **Status:** accepted (2026-04-21)
- **Date:** 2026-04-20 (drafted; accepted after operator review passes 1 + 2)
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope), §8 (invariants), CLAIM-TYPES, validator
- **Source convergence:** A1 Q3; foundation hole-poke B2; autoresearch P1 (workflow obligations); `src/views/openLoops.ts` `failed` seam

## Revisions

- **2026-04-21 (operator review pass 2):** Three clarifications.
  (1) `communication.status_detail` gains `timeout` for the "sent,
  SLA elapsed, no acknowledgment" state that openLoops detects on
  critical-value callbacks (A1). (2) Mid-infusion semantics for
  `action.administration`: interval-shaped administrations (ADR 005)
  express in-progress via an open `effective_period` and omit
  `status_detail`; terminal `status_detail` values apply only at
  close-out. No new enum value added. (3) `data.recommendation_status`
  rationale sentence added — it is a property of the review payload's
  content decision, not the action's lifecycle, and the two may move
  independently.

## Context

The envelope carries a single `status` field with five values:

```
draft | active | final | superseded | entered_in_error
```

These are sufficient for **graph lifecycle** — "is this claim current,
replaced, or retracted?" — but they cannot express clinical lifecycle
states that real artifacts demand:

- **`failed`** — openLoops infers this today from `data.outcome` and a
  `Status`-enum gap called out in `src/views/openLoops.ts`. A provider
  notification that never went through is not `entered_in_error` (not a
  mistake) and not `final` (the obligation did not close).
- **`on_hold`** — MAR needs this for held doses (A4). A held medication
  order is not cancelled, not final, not erroneous.
- **`cancelled`** — An order cancelled before execution is not an error
  and not superseded. No clean home in the envelope enum.
- **`preliminary | corrected | amended`** — Lab (A1) and imaging (A2)
  lifecycles. `corrected` ≠ `superseded` + `entered_in_error`: a
  correction is a new truth, not a retraction of the old. `amended` and
  `addendum` are lighter than `corrected`.
- **`declined | deferred`** — A2 recommendation workflow. A human can
  decline or defer a recommendation without error.

A1 Q3 and autoresearch P1 both independently recommend separating these
concerns. The `openLoops` code already carries a TODO around `failed`.

## Decision

**Two-layer status model.** Envelope `status` governs **graph lifecycle
only**; domain lifecycle moves to `data.status_detail`.

### Layer 1 — envelope `status` (unchanged enum, tighter semantics)

```
draft | active | final | superseded | entered_in_error
```

Meaning:

| Value              | Meaning                                                                      |
|--------------------|------------------------------------------------------------------------------|
| `draft`            | Not yet authoritative; agent-provisional before human confirm (rare).        |
| `active`           | Current, effective, not yet terminal.                                        |
| `final`            | Reached terminal domain state in the normal lifecycle.                       |
| `superseded`       | Replaced by a later event via `links.supersedes`.                            |
| `entered_in_error` | Retracted — written in error, not a domain state change. `links.corrects`.   |

Invariant 8 (supersession monotonicity) continues to pin to envelope
`status`. Views continue to filter on envelope `status` for presence.

### Layer 2 — `data.status_detail` (new, optional, per-type)

`data.status_detail` is a **type- and subtype-scoped enum**, closed per
subtype, registered in `CLAIM-TYPES.md`. Not universal. A subtype that
has no domain lifecycle simply omits `status_detail`.

Canonical values by consumer:

| Type          | Subtype                       | `status_detail` allowed values                                                                       |
|---------------|-------------------------------|------------------------------------------------------------------------------------------------------|
| `intent`      | `order`                       | `pending \| active \| on_hold \| cancelled \| completed \| failed \| declined`                       |
| `intent`      | `care_plan` / `monitoring_plan` | `pending \| active \| on_hold \| completed \| failed \| cancelled`                                 |
| `action`      | `administration`              | `performed \| held \| refused \| failed \| deferred`                                                 |
| `action`      | `result_review`               | `acknowledged \| deferred`                                                                           |
| `observation` | `lab_result` / `diagnostic_result` | `preliminary \| final \| corrected \| amended \| addendum \| cancelled`                        |
| `communication` | (any)                       | `sent \| acknowledged \| timeout \| failed`                                                          |
| `assessment`  | `problem`                     | `active \| resolved \| inactive \| ruled_out`                                                        |

`timeout` on `communication` captures the "sent, no acknowledgment
within the defined SLA" state. It is distinct from `failed`
(delivery itself did not succeed) and is the state openLoops
watches for unresolved critical-value callbacks (A1 §11) and
similar workflow obligations.

**Interval-shaped administrations.** When an
`action.administration` carries `effective_period` (infusion,
titration window — allow-listed per ADR 005), in-progress state is
expressed by an open `effective_period` (no `end`), not by a
`status_detail` value. The envelope `status` stays `active`;
`status_detail` is omitted. Terminal `status_detail` values
(`performed` | `held` | `refused` | `failed` | `deferred`) apply at
close-out, when the interval closes via supersession.
Point-in-time administrations (IV push, single tablet) carry
`effective_at` and may carry a terminal `status_detail` at write
time.

**`data.recommendation_status` stays distinct from `status_detail`.**
`status_detail` describes the action's lifecycle (did the review
happen, was it deferred, etc.). `data.recommendation_status`
describes the content decision (was the recommendation accepted,
declined, deferred). The two are orthogonal — a review action may
be `status_detail: acknowledged` while its
`data.recommendation_status: declined`. A2 uses this split; do not
collapse it.

### Layer rules

1. Envelope `status` is **always present** on clinical events.
2. `data.status_detail` is **optional**; required per the subtype table above.
3. `data.status_detail` cannot contradict envelope `status`. Examples
   enforced by validator:
   - `status: entered_in_error` forbids `status_detail`.
   - `status: superseded` forbids `status_detail` transitions (the
     supersessor carries the new detail).
   - `status: final` requires a terminal `status_detail` value when one
     is defined (e.g., `order` with `final` → `status_detail ∈ {completed, cancelled, failed, declined}`).

### Transition rules

Transitions in `status_detail` are append-only like everything else:
a state change produces a new event with `links.supersedes` pointing
at the prior, carrying the new `status_detail` value. No in-place
mutation. Envelope `status` of the superseded event flips to
`superseded` by view-time computation, not by disk mutation (per
invariant 8).

## Tradeoffs

| Axis                                 | (a) Expand envelope enum          | (b) Two-layer (chosen)           | (c) Per-subtype `data` field      |
|--------------------------------------|-----------------------------------|----------------------------------|-----------------------------------|
| Envelope schema entropy              | grows (15+ values)                | unchanged                        | unchanged                         |
| Universal graph operations           | preserved                         | preserved                        | fragmented                        |
| Domain expressiveness                | flat (all domains compete)        | scoped                           | scoped                            |
| Validator complexity                 | single enum check                 | two enums + per-subtype table    | scattered per subtype             |
| Discoverability                      | one place                         | envelope + CLAIM-TYPES table     | scattered                         |
| Change cost when adding a value      | schema bump                       | CLAIM-TYPES table + validator    | per-subtype change                |

(b) accepts a modest rise in validator complexity for the biggest
expressiveness gain without breaking the envelope's minimal surface.

## Consequences

- **DESIGN.md §1** — envelope table adds `data.status_detail?` row;
  §6 adds a note that `status_detail` transitions use the same
  append+supersede machinery.
- **CLAIM-TYPES.md** — adds a dedicated section "Envelope `status` vs.
  `data.status_detail`" with the per-subtype allowed-values table above.
- **schemas/event.schema.json** — no change to envelope `status`;
  no top-level `status_detail` field; per-subtype `data.status_detail`
  constraint lives in the `allOf` conditional blocks.
- **src/validate.ts** — gains V-STATUS-01 (detail ∈ allowed per subtype),
  V-STATUS-02 (detail consistent with envelope status), V-STATUS-03
  (transition via supersedes preserves forward-only lifecycle per
  subtype, e.g., no `final → active` backtrack unless `corrects`).
- **src/views/openLoops.ts** — `failed` detection moves from
  `data.outcome` inference to `data.status_detail === "failed"`. Clean.
- **Seed `patient_001`** — audit whether any existing events model
  lifecycle via `data.outcome` or subtype workarounds. Migrate to
  `status_detail` in the implementation ADR follow-up.

## Not decided here

- The exact transition-graph per subtype (e.g., can `on_hold → failed`
  skip `active`?). Fix in CLAIM-TYPES during execution, with validator
  rules.
- Whether `draft` gains a sibling `provisional` for agent-authored
  content that must be confirmed — overlap with autoresearch P3
  (attestation). Deferred with P3.
- Whether `entered_in_error` should be expressible as a `status_detail`
  value in addition to the envelope status (almost certainly not, but
  surfaces during V-STATUS-02 rule writing).
