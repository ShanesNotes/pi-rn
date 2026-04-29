# Evidence — pi-sim M2 Pulse provider runtime

Date: 2026-04-27
Plan: `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`
Context: `.omx/context/pi-sim-m2-pulse-provider-runtime-20260427T142543Z.md`

## Scope delivered

- Added a shared async provider runner at `scripts/runtime/runner.ts` for init, monotonic clock advance, deterministic action scheduling, frame assembly, and `PublicTelemetryPublisher` writes.
- Kept the scripted M1 provider on the shared runner via `scripts/sim-run.ts`.
- Added Pulse provider runtime modules:
  - `scripts/runtime/pulseProvider.ts` maps Pulse shim scalar output to `ProviderSnapshot` once and reports typed provider unavailability.
  - `scripts/runtime/pulseScenario.ts` loads explicit `provider: "pulse"` scenarios and infers legacy `state_file` Pulse scenarios for compatibility.
  - `scripts/sim-run-pulse.ts` runs the Pulse provider CLI path and writes unavailable evidence when the shim is offline.
- Added low-acuity stable observation scenario `vitals/scenarios/pulse_stable_observation.json`.
- Preserved `monitor:pulse` as the legacy interactive compatibility command.

## Verification results

```bash
npm run typecheck
# PASS: tsc --noEmit exited 0

npm run test:runtime
# PASS: runtime tests passed
# Covers shared runner scripted success, deterministic action order including mid-tick actions, Pulse fake-transport mapping, Pulse fake-runner success, unavailable provider output, and Pulse scenario loading

npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals
# PASS: scripted run complete: scripted_m1_demo t=30s sequence=4

node -e "... scripted current.json contract check ..."
# PASS: pi-sim-scripted ended 4

npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/pulse-stable/vitals --duration 60 --dt 10 --no-pacing
# EXPECTED LOCAL NO-DOCKER RESULT: [sim-run-pulse] unavailable: Pulse shim init failed: fetch failed
# pulse_exit=1

node -e "... pulse current.json unavailable contract check ..."
# PASS: pi-sim-pulse unavailable 0

npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/pulse-stable-wait/vitals --duration 10 --dt 10 --no-pacing --wait-for-shim-ms 1
# EXPECTED LOCAL NO-DOCKER RESULT: shim wait failed; continuing to bounded provider run; unavailable output written
# wait_pulse_exit=1
# PASS: pi-sim-pulse unavailable 0

rg -n "from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent" scripts || true
# PASS: no matches

git status --short vitals/current.json vitals/timeline.json vitals/status.json
# PASS: no tracked generated vitals churn

npm run | sed -n '/monitor/p;/pulse/p;/sim:/p'
# PASS: monitor:pulse, sim:run:pulse, and sim:run:pulse:stable are discoverable

git diff --check
# PASS: no whitespace errors

lsp_diagnostics_directory /home/ark/pi-rn/pi-sim
# PASS: 0 TypeScript errors, 0 warnings
```

## Live Pulse smoke status

After Docker/Pulse was started, live low-acuity Pulse smoke passed:

```bash
npm run pulse:health
# PASS: shim reachable; returned request schema and engine_ready false before scenario init

npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/live-pulse-stable/vitals --duration 60 --dt 10 --no-pacing
# PASS: Pulse run complete: pulse_stable_observation t=60s sequence=7

node -e "... live Pulse current.json contract check ..."
# PASS: pi-sim-pulse ended 7 60; no monitor.waveforms
```

The earlier no-Docker unavailable path remains valid evidence for bounded failure behavior under `.omx/evidence/pi-sim-m2-pulse-provider/pulse-stable/vitals/`.

## Output locations

- Scripted smoke: `.omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals/`
- Pulse unavailable smoke: `.omx/evidence/pi-sim-m2-pulse-provider/pulse-stable/vitals/`
- Pulse unavailable smoke after failed shim wait: `.omx/evidence/pi-sim-m2-pulse-provider/pulse-stable-wait/vitals/`
- Live Pulse stable smoke: `.omx/evidence/pi-sim-m2-pulse-provider/live-pulse-stable/vitals/`
