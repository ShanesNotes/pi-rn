# Ralph context snapshot — Agent Canvas recommended fixes

## Task statement
Implement the reviewer-recommended hardening fixes before Agent Canvas Pass 5.

## Desired outcome
Make the Agent Canvas context/connector safer and more generic for future `.pi` read-side extension work, without redesigning the UI or touching unrelated workstream files.

## Known facts/evidence
- Prior review found: hardcoded `Due 09:50` in `buildAgentCanvasContext`; incomplete encounter scoping for latest vitals/open loops; transitive fixture coupling through `agent-canvas-fixtures`; connector trusts caller `marState`; freshness state is only current-open-pane UI state.
- Existing verification previously passed after rerun: targeted Agent Canvas tests, prototype smoke, typecheck, full test, check, pi-sim grep guard.
- Unrelated dirty files to avoid: docs/plans/kanban-prd-board.md, docs/plans/phase-a-status-matrix.md, src/validate.test.ts, src/validate.ts; untracked ../pi-sim docs.

## Constraints
- Preserve clinical safety invariants: pi-chart is chart truth, pi-agent is advisory/process, draft artifacts are not chart truth, MAR med admin blocked without barcode/patient scan and clinician attestation.
- No pi-sim coupling; use pi-chart views/interfaces only.
- No new dependencies.
- Keep diffs small/reversible.
- Preserve canonical advisory banner copy.
- Keep patient_002 as demo/test fixture only.

## Unknowns/open questions
- Exact future `.pi` loader contract is still a spike; keep import allowlist conservative.
- Existing `src/views/currentState` and `openLoops` lack encounterId params; decide whether to extend them or filter in builder.

## Likely codebase touchpoints
- scripts/agent-canvas-context.ts
- scripts/agent-canvas-connector.ts
- scripts/agent-canvas-fixtures.ts
- scripts/agent-canvas-view-catalog.ts (new)
- scripts/agent-canvas*.test.ts
- tests/e2e/agent-canvas-smoke.mjs
- docs/prototypes/pi-chart-agent-canvas.html and tests/fixtures/agent-canvas-context.json via npm run agent-canvas
