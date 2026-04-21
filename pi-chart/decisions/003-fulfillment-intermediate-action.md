# ADR 003 — Fulfillment graph: intermediate-action model

- **Status:** proposed (awaiting owner approval)
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §6.1, §6.4, §8 (invariant 10), CLAIM-TYPES, validator
- **Source convergence:** A1 Q1 (lab order → lab result closure); A2 Q2 (council converged); foundation hole-poke B3; autoresearch P1

## Context

Invariant 10 requires `links.fulfills` targets to be `intent` events.
CLAIM-TYPES convention is that `action` is the source: an action
fulfills an intent.

A1 surfaced a puzzle: a lab-result is an `observation`, not an `action`.
How does an `observation.lab_result` close a `intent.order`?

- Option (a) extends invariant 10 to permit `observation → intent` for
  specific subtypes. Convenient locally; dilutes the invariant globally.
- Option (c) weakens the whole link to `observation.supports → intent`
  and derives closed-loop via query. Loses a first-class closure edge.

A2 (results review) independently converged on a cleaner third path:
**every lab/study/procedure has an implicit acquisition action**. Make
it explicit.

- `action.specimen_collection` — phlebotomy, POC capillary stick, culture swab
- `action.imaging_acquired` — tech completes the scan at the scanner
- `action.procedure_performed` — proceduralist performs the line placement, bronchoscopy, LP

The acquisition action fulfills the upstream order (intent). The
resulting narrative or numeric `observation` then **supports** the
acquisition action (and, downstream, any assessment that cites it).
Invariant 10 stays intact without exception. A2's council reached this
resolution without coordination with A1, which is strong convergence
signal.

The clean topology:

```
intent (order) ◄── fulfills ── action (acquisition)
                                      ▲
                                      │ supports
                                      │
                               observation (result)
                                      ▲
                                      │ supports
                                      │
                               assessment
                                      ▲
                                      │ addresses
                                      │
                         action (result_review) / communication / follow-up intent
```

## Decision

**Adopt the intermediate-action model substrate-wide.** A data-producing
intent (order for labs, imaging, procedures, measurements) is fulfilled
by an acquisition `action`; the resulting `observation` supports that
action, not the intent.

### New conventional `action` subtypes

| Subtype                 | Fulfills                                                   | Typical support target (reverse)                    |
|-------------------------|------------------------------------------------------------|-----------------------------------------------------|
| `specimen_collection`   | `intent.order` for lab/culture/POC test                    | `observation.lab_result` (supports → this action)   |
| `imaging_acquired`      | `intent.order` for imaging / study                         | `observation.diagnostic_result` (imaging domain)    |
| `procedure_performed`   | `intent.order` for procedure (line, bronch, LP, POCUS)     | `observation.diagnostic_result` (procedure domain)  |
| `measurement`           | `intent.order` or `intent.monitoring_plan` for a vital/device reading taken ad hoc | `observation.vital_sign` / streamed `vitals.jsonl` |

`measurement` is added to distinguish a nurse-taken manual vital
captured under an order from a continuous monitor reading. For
continuous streams that are not order-driven (baseline monitor ticks),
no acquisition action is required — observation stands alone.

### Tightened invariant 10

Wording update in DESIGN §8 invariant 10:

> **Fulfillment typing.** `links.fulfills` targets must be events of
> type `intent`. Sources must be events of type `action`. Observations
> and assessments do not carry `links.fulfills`; their relation to an
> upstream intent is indirect, expressed as `supports` on an intermediate
> acquisition action (see §6.1, ADR 003). `links.addresses` targets must
> be events of type `assessment` with subtype `problem`, or of type
> `intent`.

### Validator changes

- **V-FULFILL-01.** `links.fulfills` on any event of type
  `observation` or `assessment` is rejected (was warned).
- **V-FULFILL-02.** `action.subtype ∈ {specimen_collection,
  imaging_acquired, procedure_performed, measurement}` must carry
  `links.fulfills` with at least one target of type `intent` whose
  subtype is `order` or `monitoring_plan`. (Exception: `source.kind`
  indicating ad hoc POC or standing-protocol execution — recorded as
  `data.origin: ad_hoc | standing_protocol` with `rationale_text`.)
- **V-FULFILL-03.** `observation.subtype ∈ {lab_result,
  diagnostic_result}` must carry `links.supports` with at least one
  target of type `action` whose subtype is in the acquisition list
  above, unless `data.origin = ad_hoc` is set and a matching order
  does not exist in the chart.

V-LAB-01 and V-RES-07 from A1/A2 drafts subsume under V-FULFILL-02/03.

## Tradeoffs

| Axis                                  | (a) Extend invariant 10 per subtype         | (b) Intermediate-action (chosen)                 | (c) Weaken to supports                           |
|---------------------------------------|---------------------------------------------|--------------------------------------------------|--------------------------------------------------|
| Invariant simplicity                  | erodes — per-subtype exceptions             | preserved                                        | weakens                                          |
| Agent closed-loop query simplicity    | `intent → observation` one hop              | `intent → action → observation` two hops         | derived; requires heuristic                      |
| Matches A2 findings                   | partially                                   | fully (council-converged)                        | no                                               |
| Fidelity to clinical reality          | weak (there is always an acquisition step)  | strong                                           | weakest                                          |
| Seed patient migration cost           | low                                         | **medium** — existing events may need acquisition events inserted | low                                |
| Event volume (counts)                 | baseline                                    | +1 event per order                               | baseline                                         |

(b) adds event volume but matches the clinical story truthfully. The
"extra" acquisition event is real information: who drew the specimen,
when it was collected (the moment physiologic state was sampled),
which specimen id groups the panel.

## Consequences

- **DESIGN.md §1 primitives table** — unchanged (no new types).
- **DESIGN.md §6.1** — link taxonomy gets a clarifying note that
  `fulfills` sources are `action` events.
- **DESIGN.md §6.4** — write-side constraints gain the action-source
  rule and acquisition-subtype requirement for data-producing orders.
- **DESIGN.md §8 invariant 10** — rewording above.
- **CLAIM-TYPES.md §4 (`action`)** — conventional subtypes list gains
  `specimen_collection`, `imaging_acquired`, `procedure_performed`,
  `measurement`, each with a payload example tying to the fulfilled
  intent.
- **src/validate.ts** — V-FULFILL-01/02/03 as above.
- **Seed `patient_001`** — audit: any `observation` that conceptually
  closes an `intent` needs a preceding acquisition `action`. Typically
  one new event per order-observation pair. Implementation ADR
  follow-up.
- **Fixture authoring for Phase A** — A1/A2 drafts already anticipate
  this shape. A3 (vitals), A4 (MAR), A5 (LDAs) should adopt it from
  the start.

## Not decided here

- Whether `measurement` also covers scheduled monitor readings (cadence
  checks) or only ad-hoc manual measurements. Clarify in CLAIM-TYPES
  during execution.
- How streamed vitals in `vitals.jsonl` (which are not event-shaped)
  acquire provenance to an acquisition action. Likely "monitor extension
  writes a single `action.measurement` event per observation-window
  start" — confirm during A3.
- Exceptions policy for `ad_hoc` POC. A1 fixture 4 exercises this —
  the exception lives in `data.origin` + `source.kind`, not as a
  validator-off flag.
