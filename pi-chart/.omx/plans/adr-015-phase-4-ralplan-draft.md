# ADR 015 Phase 4 — ADR 009 validator rules in `src/validate.ts`

## RALPLAN-DR Summary

### Principles

- Keep Phase 4 validator-only and file-bounded: modify only `src/validate.ts`
  and `src/validate.test.ts`.
- Preserve existing validator behavior outside the new ADR 009 surface:
  `checkSupportsTargets()`, `V-EVIDENCE-*`, and `V-TRANSFORM-*` bodies stay
  unchanged.
- Reuse the existing patient-local event indexes already built inside
  `checkReferentialIntegrity()` rather than adding a new cross-file resolver
  abstraction.
- Tighten `links.addresses` in place, without inventing a new rule code, so the
  Phase 6 migration path stays mechanically consistent with ADR 009.
- Keep `V-RESOLVES-01` validator-local: compute target eligibility from current
  envelope/state facts instead of importing or editing view-layer logic.
- Be precise where repo semantics already exist: mirror current intent and
  communication openness behavior locally, and use one explicit ADR-derived
  placeholder shape for active alerts.

### Decision Drivers

1. `checkReferentialIntegrity()` already has the exact local data needed for
   same-patient resolution, recorded-time ordering, and supersession lookups.
2. The user fixed both scope and implementation shape: two files only,
   `checkSupportsTargets()` unchanged, two local helpers, additive new rules,
   one in-place tightening.
3. `V-RESOLVES-01` is the only nontrivial phase-4 rule because it needs a
   bounded notion of “open-loop-kind” without widening scope into `openLoops`
   or `currentState`.

### Viable Options

1. **Chosen: add `validateContradictsRules(...)` and
   `validateResolvesRules(...)` inside `src/validate.ts`, reusing the existing
   `envelopes`, `envelopesById`, and the existing event-id/type indexes
   surfaces.**  
   Pros:
   - stays within the exact two-file scope
   - keeps `checkSupportsTargets()` unchanged
   - keeps all ADR 009 logic near existing referential-integrity checks
   - makes the addresses tightening, contradiction rules, and resolves typing
     reviewable in one validator-local diff  
   Cons:
   - `V-RESOLVES-01` needs a small amount of local target-state logic that is
     not yet factored in the validator

2. **Reuse view-layer `openLoops` / `active` helpers directly from the
   validator.**  
   Pros:
   - less duplicated intent-open-state logic
   - conceptually close to eventual read-time behavior  
   Cons:
   - couples validator to views in a phase explicitly constrained to
     validator-only changes
   - risks incidental view-semantic drift inside validation
   - broadens both implementation and review surface

3. **Land `V-CONTRA-*` plus addresses tightening only, and defer
   `V-RESOLVES-01` to a later phase.**  
   Pros:
   - smallest immediate implementation  
   Cons:
   - violates the approved Phase 4 scope
   - leaves the `addresses` → `resolves` narrowing half-enforced
   - breaks the user’s required verification gates

### Why option 2 is rejected

- The task is explicitly validator-only; importing or reshaping view behavior
  would spend scope on architecture coupling instead of the requested rules.

### Chosen Approach

Add two helper calls from `checkReferentialIntegrity()` after the existing
supports/target checks:

- `validateContradictsRules(state, where, ev, envelopesById)`
- `validateResolvesRules(state, where, ev, envelopesById, envelopes)`

Implement Phase 4 as follows:

- `V-CONTRA-01`: validate each `links.contradicts[*].ref` against the existing
  patient-local event index; error if missing/nonlocal.
- `V-CONTRA-02`: compare each contradicted ref against `links.corrects[]`; emit
  only for overlapping targets.
- `V-CONTRA-03`: require `target.recorded_at < source.recorded_at`; equal also
  errors.
- `V-CONTRA-04`: for every `A contradicts B`, scan the existing envelope list
  for `C supersedes B`; warn if that supersessor omits both
  `contradicts:[A]` and `resolves:[A]`.
- `V-RESOLVES-01`: accept only targets that are either:
  - contradiction-bearing events (`links.contradicts.length > 0`), or
  - open-loop-kind events computed locally:
    - intent whose state at resolver `recorded_at` is `pending` or `overdue`
      under a bounded validator-local mirror of the current `openLoops`
      semantics
    - communication with unresolved/unacknowledged sent-state
      (`type === "communication"` and `data.status_detail === "sent"`)
    - active alert represented by one explicit Phase 4 placeholder shape:
      `type === "observation" && subtype === "alert" && status === "active"`
- Tighten the existing `links.addresses` target-type check in place so only
  `assessment/problem` remains valid, preserving the invariant-10
  cross-reference but removing the old intent allowance from the message. Use
  the exact tightened wording:
  `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`.
- Make the new Phase 4 helpers event-only: they resolve only against
  `events.ndjson` envelopes, not note/frontmatter ids that may also appear in
  `state.allIds`.
- Treat the Phase 4 user prompt as the source of truth for exact message
  literals when ADR prose is shorter or less specific (notably
  `V-CONTRA-03` including `{ref}`).

## Requirements Summary

- Modify only `src/validate.ts` and `src/validate.test.ts`.
- Add new validator rules:
  - `V-CONTRA-01` (err):
    `V-CONTRA-01: contradicts.ref out-of-patient or nonexistent: {ref}.`
  - `V-CONTRA-02` (err):
    `V-CONTRA-02: contradicts and corrects target same event: {ref}.`
  - `V-CONTRA-03` (err):
    `V-CONTRA-03: contradicts.ref newer than source event: {ref}.`
  - `V-CONTRA-04` (warn):
    `V-CONTRA-04: event {C.id} supersedes contradicted event {B.id} without contradicts or resolves pointing at {A.id}.`
  - `V-RESOLVES-01` (err):
    `V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: {ref}.`
- Tighten existing `links.addresses` validator logic in place so valid targets
  are only `type:"assessment" && subtype:"problem"`.
- Preserve the invariant-10 cross-reference in the addresses error message and
  keep that tightening code-path under the existing rule surface (no new rule
  code). Exact tightened message:
  `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`.
- Keep `checkSupportsTargets()` unchanged.
- Keep `V-EVIDENCE-01..03` and `V-TRANSFORM-01..02` bodies unchanged.
- Reuse the existing patient-local resolver/index surfaces.
- Use the existing event index for `V-CONTRA-04`; do not add a new one.
- Make `V-CONTRA-*` and `V-RESOLVES-*` event-only: timeline-event envelopes are
  the valid target universe for these new Phase 4 rules.

## Implementation Plan

1. **Hook Phase 4 helpers into `checkReferentialIntegrity()`.**
   - Leave `checkSupportsTargets()`, `validateEvidenceRules()`, and
     `validateTransformRules()` untouched.
   - Add:
     - `validateContradictsRules(state, where, ev, envelopesById)`
     - `validateResolvesRules(state, where, ev, envelopesById, envelopes)`
   - Keep the helper split clean so `contradicts` and `resolves` remain
     independently reviewable.

2. **Implement `V-CONTRA-01..04`.**
   - `V-CONTRA-01`: iterate `ev.links?.contradicts ?? []`; resolve each `ref`
     through `envelopesById` only; unknown, non-event, or out-of-patient emits
     the exact message.
   - `V-CONTRA-02`: build a `Set` from `links.corrects ?? []`; emit only for
     contradicted refs that also appear in that set.
   - `V-CONTRA-03`: compare `Date.parse(target.recorded_at)` against
     `Date.parse(ev.recorded_at)`; require strict less-than, so equal also
     errors.
   - `V-CONTRA-04`: for each contradiction pair `A -> B`, scan current
     envelopes for any `C` whose `links.supersedes` includes `B.id`; if found,
     warn unless `C.links.contradicts[*].ref === A.id` or
     `C.links.resolves[*] === A.id`.

3. **Implement `V-RESOLVES-01` with bounded local target-state logic.**
   - Iterate `ev.links?.resolves ?? []` and resolve each target through the
     existing patient-local event index (`envelopesById`); note ids and
     frontmatter-only ids do not qualify.
   - Accept immediately if the target event carries a non-empty
     `links.contradicts` array.
   - Otherwise, accept only when the target is one of the local open-loop-kind
     surfaces:
     - **pending/overdue intent:** compute fulfillment state using the current
       envelope list plus the resolver event's `recorded_at` as the “resolution
       time” anchor; specifically:
       - `anchorMs = Date.parse(ev.recorded_at)`
       - intent visibility requires `eventStartMs(intent) <= anchorMs`
       - interval coverage uses `eventCoversAsOf(intent, anchorMs)`
       - future/not-yet-effective intents are not valid resolve targets
       - mirror current repo-local `openLoops` semantics by:
       - ignoring fulfillments not visible at `anchorMs`
       - ignoring superseded/corrected fulfillments
       - rejecting intents already closed by status
       - rejecting intents with a visible terminal final fulfillment
       - rejecting `in_progress`, `failed`, and terminally closed intents
       - accepting only `pending` or `overdue`
     - **unacknowledged communication:** treat a communication event with
       `data.status_detail === "sent"` and no visible superseding/correcting
       replacement at `anchorMs` as unresolved/open for this validator phase;
       `acknowledged`, `timeout`, and `failed` do not qualify
     - **active alert:** treat exactly
       `type === "observation" && subtype === "alert" && status === "active"`
       as the bounded validator-local alert predicate for Phase 4
   - Emit the exact Phase 4 message for all nonqualifying targets.

4. **Tighten `links.addresses` in place.**
   - Remove the old intent allowance from the existing target-type branch.
   - Keep the current invariant-10 cross-reference in the message.
   - Use the exact tightened message:
     `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`.
   - Update/extend the current invariant-10 tests so:
     - `assessment/problem` stays silent
     - `intent` now errors
     - arbitrary observation still errors
     - the failure proof asserts the message no longer contains `or an intent`

5. **Add targeted tests in `src/validate.test.ts`.**
   - `V-CONTRA-01`:
     - other-patient id -> err
     - nonexistent id -> err
     - valid same-patient event -> silent
   - `V-CONTRA-02`:
     - overlap with `corrects` -> err
     - disjoint targets -> silent
   - `V-CONTRA-03`:
     - later target -> err
     - equal recorded_at -> err
     - earlier target -> silent
   - `V-CONTRA-04`:
     - `A contradicts B`, `C supersedes B`, no back-reference -> warn
     - same chain + `C.resolves:[A]` -> silent
     - same chain + `C.contradicts:[A]` -> silent
   - `V-RESOLVES-01`:
     - pending intent -> silent
     - overdue intent -> silent
     - future/not-yet-effective intent at resolver anchor -> err
     - in-progress intent -> err
     - failed/completed/cancelled intent -> err
     - unacknowledged communication (`sent`) -> silent
     - communication replacement visible after resolver anchor -> target still
       open at anchor -> silent
     - communication replacement visible before resolver anchor -> err
     - acknowledged/timeout/failed communication -> err
     - active alert -> silent
     - contradiction-bearing event -> silent
     - vanilla observation -> err
     - assessment without contradictions -> err
     - active-alert fixture uses the explicit Phase 4 placeholder shape:
       `observation:alert` + `status:"active"` + no `data.status_detail`
   - addresses tightening:
     - assessment/problem -> silent
     - intent -> err
     - observation -> err
     - exact tightened message -> matches
     - old wording `or an intent` -> absent

6. **Verification and boundary proof.**
   - Run:
     - `npm test`
     - `npm run check`
     - `npm run typecheck`
  - Boundary proof:
    - `git diff --name-only -- src/validate.ts src/validate.test.ts`
    - `git diff --name-only`
    - `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*V-(CONTRA-(01|02|03|04)|RESOLVES-01)'`
    - `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*V-(TRANSFORM|EVIDENCE|SRC|TIME|STATUS|INTERVAL|FULFILL)'` must return no matches
    - `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*links\\.addresses: target .*assessment/problem'`
    - `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*or an intent'` must show deletion only
    - `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+].*V-ADDRESSES|^[+].*ruleErr\\(.*ADDRESSES'` must return no matches

## Acceptance Criteria

- `src/validate.ts` adds only the requested Phase 4 ADR 009 validator logic
  plus the in-place `links.addresses` narrowing.
- `checkSupportsTargets()` remains unchanged.
- `V-EVIDENCE-01..03` and `V-TRANSFORM-01..02` bodies remain unchanged.
- `V-CONTRA-01..04` and `V-RESOLVES-01` use the exact approved messages.
- Exact message literals follow the Phase 4 user prompt where it is more
  specific than ADR prose.
- `V-CONTRA-02` is per overlapping target, not per whole-array presence.
- `V-CONTRA-03` enforces strict ordering (`<`), so equal `recorded_at` fails.
- `V-CONTRA-04` remains a warning.
- `V-RESOLVES-01` accepts the requested target classes and rejects vanilla
  non-open-loop/non-contradiction targets.
- `V-RESOLVES-01` mirrors current repo-local intent/communication openness
  semantics where they already exist, and uses exactly one explicit
  ADR-derived placeholder shape for active alerts.
- `links.addresses` accepts only `assessment/problem` targets in the validator.
- The tightened addresses message no longer contains `or an intent`.
- `src/validate.test.ts` covers the requested positive / negative / edge cases.
- `npm test`, `npm run check`, and `npm run typecheck` pass.
- Boundary checks prove no unintended validator families changed.
- Boundary commands are concrete enough to prove both positive additions and
  negative non-drift claims.

## ADR Summary

### Decision

Implement ADR 015 Phase 4 as a validator-only change in `src/validate.ts` and
`src/validate.test.ts`, adding `V-CONTRA-01..04`, `V-RESOLVES-01`, and an
in-place narrowing of `links.addresses` to `assessment/problem` only.

### Drivers

- Exact file-boundary and helper-shape constraints from the approved Phase 4
  request
- Existing validator indexes already provide the needed patient-local facts
- Current repo-local `openLoops` behavior supplies the exact intent-state
  semantics that Phase 4 should mirror locally
- ADR 009 requires both contradiction validation and the addresses→resolves
  semantic split to land together

### Alternatives considered

- Reuse/import view-layer open-loop logic directly — rejected as out of scope
  and coupling-heavy
- Defer `V-RESOLVES-01` — rejected because it would leave the narrowing
  incomplete

### Why chosen

It is the smallest reviewable plan that fully lands the approved Phase 4
validator surface without dragging schema/view/migration work into this diff.

### Consequences

- Validator becomes stricter than `src/write.ts` for `links.addresses` until a
  later write-path/migration phase catches up
- `V-RESOLVES-01` will carry a small validator-local open-loop predicate until
  the later view/migration phases land
- The alert portion of `V-RESOLVES-01` is an explicit Phase 4 placeholder:
  `observation:alert` + `status:"active"`; revisit only when a later ADR adds a
  stronger repo-local alert primitive

### Follow-ups

- Phase 6 migration should rewrite remaining open-loop `addresses` targets to
  `resolves`
- Later view work should surface `contested_claim` and contradiction-resolution
  state using the ADR 009 semantics
