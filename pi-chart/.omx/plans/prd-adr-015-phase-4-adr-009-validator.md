# PRD — ADR 015 Phase 4 ADR 009 validator rules

## Goal

Land the Phase 4 ADR 009 validator rules and the validator-side
`links.addresses` narrowing as one bounded validator-only change:

- `V-CONTRA-01` (err)
- `V-CONTRA-02` (err)
- `V-CONTRA-03` (err)
- `V-CONTRA-04` (warn)
- `V-RESOLVES-01` (err)
- in-place `links.addresses` tightening to `assessment/problem` only

## Scope

In scope:

- `src/validate.ts`
- `src/validate.test.ts`

Out of scope:

- schema changes
- type changes
- parser changes
- view changes
- migration changes
- write-path changes
- changes to `checkSupportsTargets()`
- changes to `V-EVIDENCE-01..03`
- changes to `V-TRANSFORM-01..02`
- changes to unrelated validator rule families

## User Story

As the ADR 015 maintainer, I want ADR 009’s contradiction and resolves rules,
plus the `addresses` narrowing, to land in the validator before the later
migration/view phases, so Phase 6 and contested-state read surfaces can build
on an already-enforced validator contract.

## Requirements

1. Add `V-CONTRA-01` with exact message:
   `V-CONTRA-01: contradicts.ref out-of-patient or nonexistent: {ref}.`
2. Add `V-CONTRA-02` with exact message:
   `V-CONTRA-02: contradicts and corrects target same event: {ref}.`
3. Add `V-CONTRA-03` with exact message:
   `V-CONTRA-03: contradicts.ref newer than source event: {ref}.`
4. Add `V-CONTRA-04` as a warning with exact message:
   `V-CONTRA-04: event {C.id} supersedes contradicted event {B.id} without contradicts or resolves pointing at {A.id}.`
5. Add `V-RESOLVES-01` with exact message:
   `V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: {ref}.`
   Message literals follow the Phase 4 user prompt when ADR prose is shorter or
   less specific.
6. Keep `checkSupportsTargets()` unchanged.
7. Keep `V-EVIDENCE-01..03` and `V-TRANSFORM-01..02` rule bodies unchanged.
8. Add two local helpers called from `checkReferentialIntegrity()` after the
   existing checks:
   - `validateContradictsRules(...)`
   - `validateResolvesRules(...)`
9. `V-CONTRA-01` resolves `links.contradicts[*].ref` against the same-patient
   event index only.
10. `V-CONTRA-02` is enforced per overlapping target, not per whole-array
    presence.
11. `V-CONTRA-03` requires strict ordering:
    target `recorded_at < source.recorded_at`; equal also errors.
12. `V-CONTRA-04` reuses the existing event index; no new global index layer is
    introduced.
13. `V-RESOLVES-01` accepts only:
    - pending or overdue intent targets at resolution time
    - unacknowledged communication targets
    - active alert targets, defined in this phase as exactly
      `type:"observation" && subtype:"alert" && status:"active"`
    - targets carrying a non-empty `links.contradicts`
14. `V-RESOLVES-01` rejects vanilla observations and non-contradiction-bearing
    assessments.
15. Intent eligibility for `V-RESOLVES-01` mirrors current repo-local
    `openLoops` semantics at the resolver event's `recorded_at`:
    - `anchorMs = Date.parse(resolver.recorded_at)`
    - intent visibility requires `eventStartMs(intent) <= anchorMs`
    - interval coverage uses `eventCoversAsOf(intent, anchorMs)`
    - future/not-yet-effective intents are not valid resolve targets
    - ignore fulfillments not yet visible at that time
    - ignore superseded/corrected fulfillments
    - reject intents already closed by status
    - reject intents with a visible terminal final fulfillment
    - reject `in_progress`, `failed`, and other terminally closed intents
    - accept only `pending` or `overdue`
16. Communication eligibility for `V-RESOLVES-01` is bounded to
    `type:"communication"` with `data.status_detail:"sent"` and no visible
    superseding/correcting replacement at the resolver timestamp.
17. The new `V-CONTRA-*` / `V-RESOLVES-*` helpers resolve only against
    timeline-event envelopes, not note/frontmatter ids that may also exist in
    `state.allIds`.
18. Tighten the existing `links.addresses` validator branch in place so only
    `type:"assessment" && subtype:"problem"` is accepted.
19. Preserve the invariant-10 cross-reference in the addresses error message and
    keep the tightening under the existing rule surface (no new addresses rule
    code). Exact tightened message:
    `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`.
20. Only `src/validate.ts` and `src/validate.test.ts` change.

## Acceptance Criteria

1. Only `src/validate.ts` and `src/validate.test.ts` change.
2. `src/validate.ts` adds the five requested Phase 4 rule surfaces and the
   addresses narrowing only.
3. `checkSupportsTargets()` remains unchanged.
4. `V-EVIDENCE-01..03` and `V-TRANSFORM-01..02` bodies remain unchanged.
5. `V-CONTRA-01..04` and `V-RESOLVES-01` behave exactly as specified and use
   the exact approved messages.
6. `V-CONTRA-04` is warning-severity only.
7. `links.addresses` accepts only `assessment/problem` targets in validation.
8. An intent target in `links.addresses` now errors.
9. The addresses failure message matches the tightened in-place wording and no
   longer contains `or an intent`.
10. `src/validate.test.ts` contains the requested contradiction/resolves/
   addresses tests.
11. `src/validate.test.ts` includes anchor-sensitive `V-RESOLVES-01` proofs
    for:
    - future/not-yet-effective intent -> err
    - fulfillment/replacement visible only after resolver anchor -> target
      still open
    - communication replacement before vs after resolver anchor
12. `npm test`, `npm run check`, and `npm run typecheck` all pass.
13. Boundary proof uses concrete diff/rg commands to confirm only the requested
    rule codes landed and unrelated validator families did not drift.
14. Boundary proof confirms the addresses tightening happened in place with the
    invariant-10 message retained and no new addresses rule code introduced.
15. The known write-vs-validate asymmetry for `links.addresses` is documented
    in the final report as an intentional phase-boundary consequence.
