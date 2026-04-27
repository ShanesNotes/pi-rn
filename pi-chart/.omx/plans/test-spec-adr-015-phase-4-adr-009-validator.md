# Test Spec — ADR 015 Phase 4 ADR 009 validator rules

## Objective

Prove that Phase 4 adds only the requested ADR 009 validator logic, tightens
`links.addresses` in place, preserves the Phase 2/3 validator bodies, and does
not widen scope beyond `src/validate.ts` and `src/validate.test.ts`.

## Required Proof Points

### `V-CONTRA-01`

- positive: `contradicts.ref` to another-patient event id -> err
- positive: `contradicts.ref` to nonexistent id -> err
- negative: `contradicts.ref` to valid same-patient event -> silent
- assert exact message:
  `V-CONTRA-01: contradicts.ref out-of-patient or nonexistent: {ref}.`

### `V-CONTRA-02`

- positive: overlapping `contradicts[*].ref` and `corrects[*]` target -> err
- negative: disjoint contradicts/corrects targets -> silent
- prove enforcement is per overlapping target only
- assert exact message:
  `V-CONTRA-02: contradicts and corrects target same event: {ref}.`

### `V-CONTRA-03`

- positive: contradicted target recorded later than source -> err
- positive: contradicted target recorded equal to source -> err
- negative: contradicted target recorded earlier than source -> silent
- assert exact message:
  `V-CONTRA-03: contradicts.ref newer than source event: {ref}.`

### `V-CONTRA-04`

- positive: `A contradicts B`, `C supersedes B`, and `C` has neither
  `contradicts:[A]` nor `resolves:[A]` -> warn
- negative: same chain with `C.resolves:[A]` -> silent
- negative: same chain with `C.contradicts:[A]` -> silent
- assert exact message:
  `V-CONTRA-04: event {C.id} supersedes contradicted event {B.id} without contradicts or resolves pointing at {A.id}.`

### `V-RESOLVES-01`

- negative: resolves target is a pending intent -> silent
- negative: resolves target is an overdue intent -> silent
- positive: resolves target is a future/not-yet-effective intent at the
  resolver anchor -> err
- positive: resolves target is an in-progress intent -> err
- positive: resolves target is a failed/completed/cancelled intent -> err
- negative: resolves target is an unacknowledged communication
  (`data.status_detail:"sent"`) -> silent
- negative: fulfillment/replacement visible only after the resolver anchor
  leaves the target open at anchor -> silent
- positive: fulfillment/replacement visible before the resolver anchor closes
  the target -> err
- positive: resolves target is an acknowledged communication -> err
- positive: resolves target is a timeout/failed communication -> err
- negative: resolves target is an active alert -> silent
- negative: resolves target is a contradiction-bearing event -> silent
- positive: resolves target is a vanilla observation -> err
- positive: resolves target is an assessment without contradictions -> err
- assert exact message:
  `V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: {ref}.`
- prove the validator-local open-loop checks are bounded to the approved Phase 4
  surface and do not require view changes
- prove the active-alert acceptance uses the exact Phase 4 placeholder shape:
  `type:"observation"`, `subtype:"alert"`, `status:"active"`, no
  `data.status_detail`

### Addresses tightening

- negative: `links.addresses` target is `assessment/problem` -> silent
- positive: `links.addresses` target is `intent` -> err
- positive: `links.addresses` target is arbitrary observation -> err
- assert the exact tightened message:
  `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`
- assert the message no longer contains `or an intent`
- prove the tightening happened in place (no new addresses rule code)

## Global Regression Expectations

- `checkSupportsTargets()` behavior is unchanged.
- `V-EVIDENCE-01..03` bodies are unchanged.
- `V-TRANSFORM-01..02` bodies are unchanged.
- No edits land in `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, or
  `V-FULFILL` rule bodies.
- Only `V-CONTRA-01|02|03|04` and `V-RESOLVES-01` are added.

## Global Gates

- `npm test`
- `npm run check`
- `npm run typecheck`

## Phase-Boundary Checks

- `git diff --name-only -- src/validate.ts src/validate.test.ts`
- `git diff --name-only`
- `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*V-(CONTRA-(01|02|03|04)|RESOLVES-01)'`
- `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*V-(TRANSFORM|EVIDENCE|SRC|TIME|STATUS|INTERVAL|FULFILL)'` must return no matches
- `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*links\\.addresses: target .*assessment/problem'`
- `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+-].*or an intent'` must show deletion only
- `git diff -U0 -- src/validate.ts src/validate.test.ts | rg '^[+].*V-ADDRESSES|^[+].*ruleErr\\(.*ADDRESSES'` must return no matches
