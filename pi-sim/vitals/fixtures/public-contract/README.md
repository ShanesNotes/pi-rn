# Public contract fixtures

Tracked public-file examples for downstream readers of `pi-sim` telemetry. These fixtures are consumer examples only; the ABI authority remains `vitals/README.md` plus `vitals/.lanes.json`, and producer freshness remains covered by runtime tests.

Generated/refreshed: 2026-04-28. Closeout reviewed: 2026-05-04. M4 prerequisite status: baseline frozen for M5 in `.omx/evidence/pi-sim-m5-public-consumer-readiness/m4-baseline-freeze.md`.

## Fixture cases

| Directory | Provenance | Purpose |
|---|---|---|
| `scripted-demo/` | `npm run sim:run:demo -- --out-dir vitals/fixtures/public-contract/scripted-demo` | Normal Docker-free scripted run with scalar frames, JSONL lanes, encounter context, assessment reveal, unavailable waveform status, and terminal `run_ended`. |
| `scripted-alarm/` | `npm run sim:run -- --scenario vitals/scenarios/scripted_alarm_smoke.json --duration 20 --dt 10 --no-pacing --out-dir vitals/fixtures/public-contract/scripted-alarm` | Docker-free alarm example proving public `alarm_observed` events for `MAP_LOW` and `SPO2_LOW`. |
| `provider-unavailable/` | `npm run sim:run:pulse:stable -- --out-dir vitals/fixtures/public-contract/provider-unavailable --duration 60 --dt 10 --no-pacing --shim-url http://127.0.0.1:1` | Deterministic unavailable-provider example. The command is expected to exit non-zero while still writing fallback public files and terminal `provider_unavailable`. |
| `live-demo-waveform/` | `npm run sim:run:live-demo -- --out-dir vitals/fixtures/public-contract/live-demo-waveform --duration 2 --dt 0.5 --no-pacing` | Positive ECG Lead II + ABP + pleth + respiration public waveform lane with `sourceKind: "demo"`, `fidelity: "demo"`, `synthetic: true`. |

The `live-demo-waveform/` case is intentionally synthetic demo output, not clinical truth. Static fixture-only waveform samples should use `sourceKind: "fixture"`, `fidelity: "fixture"`, and `synthetic: true`.

## Refresh policy

1. Refresh fixtures only after public ABI changes are documented in `vitals/README.md` and `vitals/.lanes.json`.
2. Re-run the provenance commands above from the `pi-sim` repo root.
3. Keep `provider-unavailable/` deterministic by using an unavailable local shim URL and preserving the expected non-zero exit in evidence.
4. From the repository root, run `npm test --prefix pi-sim` after any fixture or fixture-reader change; from `pi-sim/`, `npm test` is equivalent and includes `npm run test:public-contract`.
5. Do not copy hidden scenario truth, scoring keys, future findings, provider internals, runtime import paths, or sibling project paths into fixture payloads.

## Boundary rule

Downstream consumers should read these files as mounted public artifacts and treat them as regression evidence only. They must not import pi-sim runtime/type internals, Pulse internals, hidden scenario files, or sibling source trees. Public-contract reader checks should use only Node built-ins plus files under `vitals/fixtures/public-contract/` and the public lane manifest.
