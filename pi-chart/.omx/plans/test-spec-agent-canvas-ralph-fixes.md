# Test Spec — Agent Canvas Ralph fixes

## Regression tests to add/update
1. `scripts/agent-canvas-context.test.ts`
   - patient_001 output must not include hardcoded `09:50` fixture detail.
   - builder must not import `agent-canvas-fixtures` or contain patient_002/enc_p002 literals.
   - latest vitals should be encounter-scoped when an encounterId is supplied.
2. `scripts/agent-canvas-connector.test.ts`
   - blocked MAR administration must be advisory-only even if caller supplies stale `marState: "unblocked"`.
   - unblocked administration may remain advisory-only; no draft for medication administration.
3. `tests/e2e/agent-canvas-smoke.mjs`
   - after vitals shift while pane is closed, reopening a vitals-backed artifact shows stale.
4. Existing type/tests/prototype tests should be updated for moved view catalog imports.

## Verification commands
- `npm run agent-canvas`
- `node --test --import tsx scripts/agent-canvas-context.test.ts scripts/agent-canvas-connector.test.ts scripts/agent-canvas.test.ts scripts/agent-canvas-types.test.ts`
- `npm run test:prototype`
- `npm run typecheck -- --pretty false`
- `npm test`
- `npm run check`
- `! rg "from ['\"].*pi-sim|pi-sim" scripts docs/prototypes .pi`
