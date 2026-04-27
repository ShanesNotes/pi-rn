# Test Spec — ADR 015 Phase 5 view updates + write-path tightening

## Objective

Prove that Phase 5 surfaces ADR 009/010/011 read behavior coherently across the
view layer, closes the write/validate `links.addresses` mismatch, and does so
without mutating schema/parser/validator/type surfaces.

## Required Proof Points

### 5a — evidenceChain

- role-carrying support refs yield emitted child nodes that preserve the role
- contradiction edges produce a dedicated `contradicts` fork on emitted event
  nodes
- supports semantics remain unchanged for non-contradiction paths
- branch-local depth capping works independently for supports vs contradicts
- cycle through `derived_from` still terminates with one visited set spanning
  both branches
- `external` refs stay structurally valid but emit no node
- canonical/legacy vitals handling still emits `{kind:"vitals", metric, points}`
- contradiction `basis` is not surfaced in emitted evidence nodes

### 5b — currentState + openLoops

- currentState axis-specific runtime outputs use `contested: ContestedRuntimeEntry[]`
- currentState `axis:"all"` runtime output adds `observations` and
  `contested.{constraints,problems,intents,observations}`
- `ContestedRuntimeEntry` is exactly `{events,basis,axis}`
- currentState can surface both active and contested content on the same axis
- no silent winner is chosen when both sides remain live
- supersession/correction on either side clears the contested pair
- openLoops emits `kind:"contested_claim"` runtime items only after threshold age
- contested openLoops items exactly match the planned runtime contract
- ordinary intent renderers explicitly filter contested-claim entries out of
  intent sections while using sibling contested data / dedicated rendering
- default threshold is 3600 seconds
- default severity is `medium`
- `high` contested claims sort above overdue intents; non-high sort after
  overdue intents
- resolver event that supersedes one side and resolves the contradictor clears
  the loop

### 5c — timeline + narrative + derived + write

- timeline later contradiction entry uses `contradicts_prev_id`
- timeline earlier contradiction entry uses `contradicted_by_next_id`
- timeline omits those keys when the counterpart is filtered out
- no new persisted timeline storage is introduced
- narrative adds `[extracted]` only for `extract|transcribe`
- narrative adds `[inferred]` only for `infer|summarize`
- narrative adds `(primary)` / `(counterevidence)` only for those exact roles
- notes without a joined backing event or role-bearing support remain untagged
- `_derived/current.md` appends ` (contested with \`<otherId>\`)` to existing
  rendered bullet lines only
- `buildOpenIntents()` excludes `kind:"contested_claim"` entries from the
  ordinary open-intents list
- write-path rejects `addresses:[<intent-id>]`
- write-path error exactly matches validator wording:
  `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`

### End-to-end contradiction lifecycle proof

One fresh fixture must demonstrate:
- a contradiction pair is authored
- validator remains green on that pair
- currentState shows the contested pair
- openLoops emits the contested_claim after threshold age
- a later resolver event supersedes one side and resolves the contradictor
- currentState contested output clears
- openLoops contested_claim clears
- `_derived/current.md` no longer marks the cleared pair as contested

## Phase-Scoped Verification Matrix

### 5a gates

- `node --test --import tsx src/views/evidenceChain.test.ts`
- `npm run typecheck`
- `npm run check`
- `git diff --name-only -- src/views/evidenceChain.ts src/views/evidenceChain.test.ts`
- grep proof: no changes to `src/types.ts`, `src/evidence.ts`, `src/validate.ts`, `schemas/event.schema.json`

### 5b gates

- `node --test --import tsx src/views/currentState.test.ts src/views/openLoops.test.ts`
- `npm run typecheck`
- `npm run check`
- `git diff --name-only -- src/views/currentState.ts src/views/currentState.test.ts src/views/openLoops.ts src/views/openLoops.test.ts`
- contradiction lifecycle proof through validator -> currentState -> openLoops -> resolver-clear

### 5c / final gates

- `node --test --import tsx src/views/timeline.test.ts src/views/narrative.test.ts src/derived.test.ts src/write.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run check`
- `git diff --name-only`
- `git diff -U0 | rg "V-"` must show no new validator rule codes
- `git diff --name-only | rg 'src/types.ts|src/evidence.ts|src/validate.ts|schemas/event.schema.json'` must return no matches
- full contradiction lifecycle proof including `_derived/current.md` clearance

## Global Regression Expectations

- `src/types.ts` is unchanged
- `src/evidence.ts` is unchanged
- `src/validate.ts` is unchanged
- `schemas/event.schema.json` is unchanged
- `git diff -U0 | rg "V-"` shows no new validator rule codes
- existing phase-2 baseline warnings remain the only expected `npm run check`
  warnings
