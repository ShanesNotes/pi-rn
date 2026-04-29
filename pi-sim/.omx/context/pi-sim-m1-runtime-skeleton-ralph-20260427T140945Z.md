# Context snapshot — Ralph execution: pi-sim M1 runtime skeleton

Task: execute `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`.

Desired outcome: implement no-Pulse patient-runtime skeleton with clock/provider/scripted provider/publisher/CLI/tests, update scripts/docs, verify, architect-review, deslop, and cancel Ralph.

Known facts/evidence:
- ADR 003 says `pi-sim` is patient runtime; Pulse is provider/backend.
- Approved plan requires TypeScript-first M1 reference seam under existing package, not final architecture.
- Current tooling: `tsx`, `typescript`, `tsc --noEmit`; no test script yet.
- Existing Pulse path is `scripts/monitor.ts` via `npm run monitor*`; keep available.
- `vitals/current.json` is public scalar/latest-frame boundary plus optional `monitor` extension.

Constraints:
- Do not stage unrelated sibling dirty work in `../pi-chart` or `../pi-monitor`.
- Do not synthesize runtime waveform truth.
- No new dependencies.
- Generated telemetry should go to temp/evidence by default.
- Preserve Pulse command discoverability.

Likely touchpoints:
- package.json
- scripts/runtime/*.ts
- scripts/sim-run.ts
- vitals/scenarios/scripted_m1_demo.json
- README.md
- vitals/README.md
- .omx/evidence/*
