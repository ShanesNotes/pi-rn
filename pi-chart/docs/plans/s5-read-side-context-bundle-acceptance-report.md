# Context-bundle acceptance report (CB-001)

Status: accepted under CB-001 (originally drafted under S5-001 framing).
Authority: `docs/plans/prd-context-bundle-implementation.md` (CB-001).
Date: 2026-04-26
Source board: `docs/plans/kanban-prd-board.md`
Predecessor planning surface: `docs/plans/prd-s5-read-side-context-bundle.md` (S5-001 stays docs-only).
HITL disposition: `memos/hitl-decisions-26042026.md` #3 — operator opened CB-001 as a distinct lane to authorize the on-disk bundle implementation that S5-001 explicitly forbids.
Test spec: `docs/plans/test-spec-context-bundle-implementation.md`
Implementation plan: `.omx/plans/s5-context-bundle-implementation-plan.md`
Implementation snapshot: `.omx/context/s5-context-bundle-20260426T171150Z.md`
Closure snapshot: `.omx/context/s5-tb4-acceptance-report-board-closure-20260426T173300Z.md`

## Implemented scope

S5 now has the first approved read-side context bundle implementation:

- `src/views/bundle.ts` adds `contextBundle(params)` as a read-only composition layer over existing projections.
- `src/views/bundle.test.ts` adds focused contract, view-derivation, export-surface, and forbidden-wrapper-key tests.
- `src/views/index.ts` exports `contextBundle` and its public types from the views barrel only.

The implementation preserves the approved first-lane boundary: No deterministic bundle fingerprint, No identity/hash-chain, no profile-registry expansion, no schema/validator/package/dependency changes, no fixture mutation, no root API export, No pi-agent direct coupling, and no pi-sim/hidden-simulator source access.

## Tests run

Fresh verification for this acceptance report used:

```bash
node --test --import tsx src/views/bundle.test.ts
npm run typecheck
npm test
```

## Pass/fail evidence

Focused S5 bundle test transcript excerpt:

```text
--- focused bundle test ---
# tests 3
# pass 3
# fail 0
# duration_ms 334.661685
```

Typecheck transcript excerpt:

```text
--- typecheck ---
> pi-chart@0.1.0 typecheck
> tsc --noEmit
outcome: PASS (exit code 0)
```

Full regression transcript excerpt:

```text
--- full test ---
# tests 324
# pass 324
# fail 0
# duration_ms 22751.096154
```

Initial test-first evidence from the implementation lane:

```text
node --test --import tsx src/views/bundle.test.ts
failed before implementation with ERR_MODULE_NOT_FOUND for src/views/bundle.js
```

Architect and cleanup evidence from the implementation and closure lanes:

```text
Implementation architect verification: APPROVED
Implementation mandatory deslop pass: completed on src/views/bundle.ts, src/views/bundle.test.ts, and src/views/index.ts
Implementation post-deslop focused test/typecheck/full regression: PASS
S5-TB-4 closure architect verification: APPROVED
```

## Boundary confirmation

This S5-TB-4 closure lane edits documentation/board state only. It does not add new product code beyond the already-completed S5 implementation.

Current protected product/dependency diff snapshot:

```text
Tracked protected diff:
pi-chart/package-lock.json
pi-chart/package.json
pi-chart/scripts/agent-canvas.ts
pi-chart/src/views/index.ts

Untracked protected files:
scripts/agent-canvas.test.ts
src/views/bundle.test.ts
src/views/bundle.ts
```

Interpretation:

- `src/views/bundle.ts`, `src/views/bundle.test.ts`, and `src/views/index.ts` are the prior S5 implementation surface.
- `package.json`, `package-lock.json`, `scripts/agent-canvas.ts`, `scripts/agent-canvas.test.ts`, and design/prototype files are unrelated dirty baseline from outside S5 and are not S5 closure evidence.
- No S5 changes were made to `schemas/`, `patients/`, `profiles/`, `src/hash.ts`, `src/identity.ts`, `src/validate.ts`, package manifests, `pi-agent/`, or `pi-sim/` in this closure lane.

## Accepted behavior

`contextBundle({ scope, asOf })` returns:

- `patient_id`
- `asOf`
- `source_view_refs`
- `current_state`
- `open_loops`
- `narrative_handoff`
- `evidence_context`
- `recent_timeline`

Focused tests prove the bundle sections are derived from direct calls to existing projections for the same fixture and `asOf`: `currentState`, `openLoops`, `narrative`, `timeline`, and `memoryProof`.

## Deferred items

- Deterministic bundle fingerprints remain deferred/out of S5 scope.
- Identity/hash-chain, logical-id, invalidation, and `src/hash.ts` / `src/identity.ts` work remain deferred to a separate S3/ADR012-013-style lane if selected.
- Profile registry expansion, `profiles/`, `schemas/profile.schema.json`, and event `profile` field work remain deferred to a separate S4/profile lane if selected.
- DTO normalization, section selectors, section limits, performance optimization, and consumer-specific reshaping require a later S5 successor lane.
- Root `src/index.ts` API exposure is not part of this first S5 lane.

## Next recommended card

S5 is closed for the approved first implementation lane. The next existing board PRD/card is `ADR17-001 actor attestation decision`, a HITL decision-only governance lane that keeps product behavior blocked until disposition.

If the operator wants a new substantive clinical substrate PRD rather than the next existing board card, start an A9b/Phase-B ADR/PRD for order-set invocation implementation details. Do not restart PHA-TB-1 unless `docs/plans/phase-a-bridge-acceptance-report.md` is declared invalid or stale.
