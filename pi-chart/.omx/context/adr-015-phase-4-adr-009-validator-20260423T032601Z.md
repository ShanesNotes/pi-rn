# Context Snapshot — ADR 015 Phase 4 / ADR 009 validator rules

## Task statement

Plan Phase 4 of ADR 015: implement the ADR 009 validator-only rules plus the
`links.addresses` target-type tightening, with code changes restricted to
`src/validate.ts` and `src/validate.test.ts`.

## Desired outcome

Produce a consensus-approved execution plan, PRD, and test spec for landing:

- `V-CONTRA-01` (err)
- `V-CONTRA-02` (err)
- `V-CONTRA-03` (err)
- `V-CONTRA-04` (warn)
- `V-RESOLVES-01` (err)
- in-place `links.addresses` narrowing from `assessment/problem OR intent` to
  `assessment/problem` only

No schema, type, parser, view, or migration changes in this phase.

## Known facts / evidence

- Schema/types already include the ADR 009 surface:
  - `schemas/event.schema.json` already has `links.resolves` and
    `links.contradicts`.
  - `src/types.ts` already has `Links.resolves?: string[]` and
    `Links.contradicts?: ContradictsLink[]`.
- `src/validate.ts` currently has no `V-CONTRA-*` or `V-RESOLVES-*` logic.
- `checkReferentialIntegrity()` already builds:
  - `envelopes: Array<{where, ev}>`
  - `envelopesById: Map<string, any>`
  - patient-local id/type indexes via `state.allIds` and `state.eventTypes`
- `checkSupportsTargets()` already exists and must remain unchanged.
- Phase 2 and Phase 3 already added bounded helpers from
  `checkReferentialIntegrity()`:
  - `validateEvidenceRules(...)`
  - `validateTransformRules(...)`
- Current `links.addresses` validation in `src/validate.ts` still allows either:
  - `type:"assessment" && subtype:"problem"`
  - `type:"intent"`
  and emits the current invariant-10 message:
  `links.addresses: target '{id}' must be an assessment/problem or an intent (invariant 10: fulfillment typing)`
- `src/write.ts` still allows `links.addresses` to target intent or
  assessment/problem, but Phase 4 scope is validator-only, so write-path
  tightening is explicitly out of scope.
- ADR 009 specifies:
  - `contradicts` direction is later-written event -> earlier event
  - `V-CONTRA-04` stays warn in v0.3/v0.4
  - `V-RESOLVES-01` accepts targets that are either open-loop-kind events
    (pending/overdue intent, active alert, unacknowledged communication) or
    contradiction-bearing events
  - `links.addresses` is narrowed to problem-targeting only; loop-closing moves
    to `links.resolves`
  - the Phase 4 user prompt is the source of truth for exact validator message
    literals where it is more specific than ADR prose
- Repo-local view logic already models open intents in `src/views/openLoops.ts`,
  but Phase 4 forbids view changes; validator must therefore implement a local,
  bounded target-state check rather than importing new view behavior.
- `src/views/openLoops.ts` currently computes intent openness by excluding
  status-closed intents, excluding superseded/corrected intents, excluding
  intents with a terminal final fulfillment, and then classifying the
  remaining visible fulfillments as `pending` / `in_progress` / `overdue` /
  `failed`.
- Phase 4 can mirror that intent logic locally by anchoring visibility at the
  resolver event's `recorded_at`, without importing the view helper itself.
  For planning purposes:
  - `anchorMs = Date.parse(resolver.recorded_at)`
  - visibility requires `eventStartMs(item) <= anchorMs`
  - interval coverage uses `eventCoversAsOf(item, anchorMs)`
  - future/not-yet-effective intents are not valid resolve targets at that
    anchor
- `validateStatusDetailSemantics()` currently recognizes:
  - intent rules with `pending` / `active` / terminal details
  - communication rules with `sent` / `acknowledged` / `timeout` / `failed`
  - `assessment:problem` rules with `active` / `resolved` / `inactive` /
    `ruled_out`
- There is no existing repo-local shared validator constant for “active alert”
  typing; Phase 4 therefore needs one explicit validator-local placeholder
  shape. The cleanest bounded choice is a timeline event with
  `type:"observation"`, `subtype:"alert"`, `status:"active"`, and no
  `data.status_detail`.

## Constraints

- Modify only `src/validate.ts` and `src/validate.test.ts`.
- No schema, type, parser, view, or migration changes.
- Keep `checkSupportsTargets()` unchanged.
- Keep `V-EVIDENCE-01..03` and `V-TRANSFORM-01..02` bodies unchanged.
- Add exactly two local helpers called from `checkReferentialIntegrity()` after
  existing target checks:
  - `validateContradictsRules(...)`
  - `validateResolvesRules(...)`
- `V-CONTRA-02` is per-target-pair, not per-array.
- `V-CONTRA-04` must reuse the existing event index; no new global index layer.
- Addresses tightening is in-place: keep the existing invariant-10
  cross-reference and do not introduce a new rule code.

## Unknowns / open questions

- Whether the Phase 4 plan should explicitly compute intent openness using the
  resolver event's `recorded_at` as the “resolution time” anchor.
- Exact tightened `links.addresses` wording: preserve the invariant-10
  cross-reference while removing the old intent allowance. Preferred exact
  message:
  `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`
- Whether the new helpers should intentionally operate on timeline-event
  envelopes only, rather than the broader `state.allIds` universe that also
  includes note/frontmatter ids.

## Likely code touchpoints

- `src/validate.ts`
  - `checkReferentialIntegrity()`
  - existing `links.addresses` target check
  - `envelopes` / `envelopesById` / `state.allIds` / `state.eventTypes`
  - `validateStatusTransitions()` / `validateIntervalClosure()` as helper style
    precedents
- `src/validate.test.ts`
  - existing fixture-copy and event-mutation helpers
  - current invariant-10 addresses test block as the tightening precedent

## Risk notes

- The largest planning risk is `V-RESOLVES-01`: validator needs enough
  target-state logic to enforce ADR 009 while staying validator-only and not
  importing view-layer behavior.
- The most important precision point is to state exactly which repo-local
  semantics are mirrored for intent/communication targets and exactly which
  ADR-derived placeholder shape is accepted for active alerts.
- `src/write.ts` will remain more permissive than `src/validate.ts` after this
  phase. That asymmetry is expected because the user explicitly constrained the
  change to validator/tests only.
