# ADR 003 — Fulfillment graph: intermediate-action model

- **Status:** proposed (awaiting owner approval)
- **Date:** 2026-04-20
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §6.1, §6.4, §8 (invariant 10), CLAIM-TYPES, validator
- **Source convergence:** A1 Q1 (lab order → lab result closure); A2 Q2 (council converged); foundation hole-poke B3; autoresearch P1

## Revisions

- **2026-04-21 (operator review pass 1):** V-FULFILL-02 exception
  re-keyed to `data.origin` instead of `source.kind`. `source.kind`
  describes the origin-channel (e.g., `poc_device`) and is
  orthogonal to whether the event is order-driven; an order-driven
  POC result must still carry `links.fulfills`. The ad-hoc /
  standing-protocol exception hangs on `data.origin` with
  `data.rationale_text` populated.
- **2026-04-21 (operator review pass 2):** Four clarifications,
  no rule changes. (1) `measurement` scope bounded: vital
  observations not tied to `intent.monitoring_plan` or
  `intent.order` stand alone — continuous monitor ticks and ad-hoc
  spot vitals do not require an acquisition action. (2) Panel
  semantics: a single acquisition action may support N result
  observations (one per analyte); each result carries
  `links.supports` → the one acquisition action. (3)
  Cancelled-specimen path: an acquisition action may produce no
  result observation (hemolyzed, insufficient sample). Canonical
  path — the upstream `intent.order` transitions to
  `status_detail: failed` via supersession (ADR 002), and no
  `observation.lab_result` is written. (4) `patient_001` seed
  migration count: zero. The current seed has no lab/imaging/
  procedure result chain; the acquisition-action pattern applies
  going forward to Phase A Batch 1+ fixtures.

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

**Scope of `measurement`.** The acquisition requirement for
`measurement` applies only when the vital is tied to an
`intent.order` (spot vital under a specific order) or an
`intent.monitoring_plan` (cadenced vital under a monitoring plan
and counting toward its fulfillment). Vital observations not tied
to either — baseline monitor ticks, ad-hoc nurse spot checks
entered without a linked order — stand alone. The `source.kind`
(`monitor_extension`, `nurse_charted`) provides origin provenance;
no acquisition action is required.

**Panels.** A single acquisition action may support many result
observations. A BMP draw is one `action.specimen_collection`; it
produces seven `observation.lab_result` events (one per analyte),
each carrying `links.supports` → the one acquisition action.
Invariant 10 stays intact: observations do not carry `fulfills`;
one acquisition action closes the order.

**Cancelled specimens.** An acquisition action may produce no
result observation — hemolyzed specimen, insufficient sample,
patient refused mid-draw. Canonical path: the upstream
`intent.order` transitions to `status_detail: failed` via
supersession (ADR 002), and no `observation.lab_result` is written
for the missing analyte. The acquisition action itself records
what happened (`status_detail: failed` with `data.rationale_text`).

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
  subtype is `order` or `monitoring_plan`.
  **Exception:** `data.origin ∈ {ad_hoc, standing_protocol}` with
  `data.rationale_text` populated. `source.kind` alone (e.g.,
  `poc_device`, `lab_interface_hl7`) does **not** grant the
  exception — origin-channel is orthogonal to order-derivedness, so
  an order-driven POC or lab result still requires `links.fulfills`.
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
- **Seed `patient_001`** — audit: zero retrofits required. The
  current seed (respiratory decompensation teaching case) contains
  no lab/imaging/procedure result chain, so no existing observation
  needs a preceding acquisition action. The pattern applies going
  forward to Phase A Batch 1+ fixtures as they author
  lab/imaging/procedure flows.
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
