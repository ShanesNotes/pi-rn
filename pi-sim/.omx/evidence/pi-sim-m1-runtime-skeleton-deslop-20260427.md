# AI slop cleanup plan — pi-sim M1 runtime skeleton

Scope: Ralph-owned M1 files only: `package.json`, `scripts/sim-run.ts`, `scripts/runtime/*.ts`, `vitals/scenarios/scripted_m1_demo.json`, `README.md`, `vitals/README.md`, and M1 evidence files.

Behavior lock already green before cleanup:
- `npm run typecheck`
- `npm run test:runtime`
- `npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals`
- `../pi-monitor cargo test --workspace` and render smoke

Cleanup plan:
1. Dead/needless abstraction: remove the single-use `WaveformWindowProvider` interface while keeping the optional provider waveform method absent/unavailable.
2. Test reinforcement/readability: assert `status.json` output and reduce long repeated frame-building expressions.
3. Documentation polish: remove accidental extra blank spacing around the new M1 README section.

No broad architecture changes, no dependency changes, no sibling file edits.

AI SLOP CLEANUP REPORT
======================

Scope: Ralph-owned M1 changed files only.
Behavior Lock: pre-cleanup typecheck/runtime tests/smoke and pi-monitor smoke were green.
Cleanup Plan: remove needless waveform-provider abstraction, reinforce publisher status test, polish README spacing.

Passes Completed:
1. Dead/needless abstraction: removed single-use `WaveformWindowProvider` interface and kept optional `waveformWindow` on `PhysiologyProvider`.
2. Test reinforcement: added `status.json` assertion in runtime publisher test and reduced repeated frame-builder boilerplate.
3. Documentation polish: removed accidental extra blank line before the M1 README section.

Quality Gates:
- Regression tests: PASS (`npm run test:runtime`)
- Typecheck: PASS (`npm run typecheck`)
- CLI smoke: PASS (`npm run sim:run:demo -- --out-dir ...`)
- Static diff check: PASS (`git diff --check`)
- pi-monitor smoke: PASS (`cargo test --workspace`, `monitor-cli render`)
- Static/security scan: N/A (no auth/network/security surface added)

Changed Files:
- `scripts/runtime/provider.ts` — simplified provider interface.
- `scripts/runtime/test.ts` — strengthened publisher/status coverage and readability.
- `README.md` — spacing polish.

Remaining Risks:
- TypeScript M1 remains a reference seam, not final runtime architecture.
- Sibling worktree has pre-existing dirty files; use path-limited staging.
