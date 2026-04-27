# Context snapshot — pi-chart agent canvas replan

## Task statement
Revise `memos/pi-chart-agent-canvas-plan-26042026.md` before execution using the user's explicit approval stance: directionally good, not approved as-is.

## Desired outcome
Produce a consensus-approved revised implementation plan that keeps the generator-native cockpit aesthetic, corrects inaccurate assumptions, and prevents premature safety/process overreach.

## Known facts / evidence
- `scripts/agent-canvas.ts` generates `docs/prototypes/pi-chart-agent-canvas.html` and currently embeds `const artifacts=${JSON.stringify(artifacts)}` in an inline script at lines 80-81, creating a `</script>` escaping risk.
- Current agent-canvas task/action handler blocks charting a blocked MAR task with a string/DOM status gate at line 112.
- `package.json` has `playwright` and `tsx`, but no `@playwright/test`; scripts include `agent-canvas`, `screenshot:prototype`, `typecheck`, and `test`, but no durable E2E script.
- No `playwright.config.ts` or `tests/e2e` exists in the repo right now.
- `src/views/openLoops.ts` exports `openLoops`; `src/views/trend.ts` exports `trend`; `src/views/memoryProof.ts` exports `memoryProof`; `src/views/narrative.ts` exports `narrative`.
- patient_002 derived files already expose open intent, latest vitals, memory proof, and handoff content.
- User requires `chart/charted/Chartable` terminology over `commit/committed/Committable`, with `discarded` preserved separately from `superseded`.

## Constraints
- No source implementation in this planning lane.
- No new dependencies unless intentionally chosen and reflected in package changes.
- Safety enforcement deferred until worklist surfaces and chart semantics stabilize; safety memo can come earlier.
- Device-streamed vitals are prefill/stage pending institutional policy, not auto-chart.
- File budget must include generator and generated HTML; no false “exactly 4 files” cap.

## Unknowns / open questions
- Whether execution should adopt raw Playwright with `node --import tsx`, or add `@playwright/test`. Plan should choose explicitly.
- Exact final shape of generated HTML diff after generator cutover.

## Likely codebase touchpoints
- `scripts/agent-canvas.ts`
- `docs/prototypes/pi-chart-agent-canvas.html`
- `package.json` / `package-lock.json` if adding scripts/deps
- `src/views/worklist.ts`, `src/views/worklist.test.ts`, `src/views/worklist.fixture.ts`
- optional raw Playwright smoke under `scripts/` or `tests/e2e/` depending runner choice
- patient mapping: `src/views/openLoops.ts`, `src/views/trend.ts`, `src/views/memoryProof.ts`, `src/views/narrative.ts`, `patients/patient_002/**`
