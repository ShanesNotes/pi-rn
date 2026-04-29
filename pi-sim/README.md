# pi-sim

`pi-sim` is the hidden **patient simulation runtime** for the `pi-rn` workspace. Its job is to produce a coherent synthetic patient encounter: scenario time, physiology, latent findings, alarms/events, validation evidence, and public telemetry surfaces that sibling projects can consume through explicit boundaries.

Pulse is a provider/backend for physiology, not the architecture center. The current implementation still uses the Kitware Pulse Physiology Engine (v4.3.1) through a Docker sidecar and stdlib Python shim, with a Node/TypeScript harness publishing public JSON files. Treat that shim as the current legacy Pulse provider implementation and reference, not as the permanent shape of `pi-sim`.

```
~/pi-rn/pi-sim/                  ← hidden patient runtime
  pulse/                         current/legacy Pulse provider sidecar + shim
  scripts/                       current TS harness: monitor, render, validate, client, types
  vitals/                        public telemetry boundary (current.json, timeline.json, scenarios)
  resources/physiology/          citation-backed reference library + validation curves
  docs/adr/                      durable architecture decisions
  docs/plans/                    retained plans; superseded docs have tombstones
  .omx/                          plans, state, context, and historical archives

~/pi-rn/pi-monitor/              standalone Rust/native display-only monitor
~/pi-rn/pi-chart/                chart/EHR subsystem and future telemetry adapter
~/pi-rn/pi-agent/                clinician agent workspace (must not see hidden pi-sim internals)
```

## Canonical direction

Current architecture authority:

1. `docs/adr/002-pi-sim-as-patient-three-stream-topology.md` — `pi-sim` is the patient; History, Physical, and Vitals are separate streams.
2. `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` — `pi-sim` is a provider-based patient runtime; Pulse is a backend/provider.
3. `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md` — detailed implementation direction after the `pi-monitor` split.
4. `vitals/README.md` — public telemetry contract for `current.json`, the monitor extension, scenarios, and future lanes.
5. `pulse/README.md` — current Pulse provider/shim implementation notes, not global architecture authority.

Superseded PySide monitor, shim-first, and chart-display-first plans have been tombstoned or archived under `.omx/archive/`. Future display work belongs in sibling `../pi-monitor`; future chart/EHR ingestion belongs in `../pi-chart` or an explicit adapter lane.

## Run the provider-based patient runtime

### No-Pulse scripted patient runtime (M1)

M1 adds a deterministic scripted scalar provider that exercises the patient-runtime clock, provider boundary, public frame assembly, and file publisher without Docker/Pulse. This is a development/reference path for the runtime seam, not high-fidelity physiology and not a waveform source.

```bash
cd ~/pi-rn/pi-sim
npm run sim:run:demo

# Keep generated smoke output out of tracked vitals files
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals
```

The scripted provider writes the same public scalar/latest-frame shape as the live provider: `current.json`, `timeline.json`, and `status.json`, including the backward-compatible `monitor` extension with `source: "pi-sim-scripted"`. Provider-runtime runs also write additive public lanes: `events.jsonl` for lifecycle/action/alarm/provider events, `timeline.jsonl` for append-friendly frame history, and `waveforms/status.json` for explicit waveform availability. The static `vitals/.lanes.json` manifest documents lane semantics for default public telemetry consumers. Scripted runs report no waveform window.


### Popup live waveform monitor MVP (demo provider)

For the first visible bedside-monitor MVP, use the waveform-capable demo provider rather than Pulse-native waveforms:

```bash
cd ~/pi-rn/pi-sim
npm run monitor:live-demo
```

That command starts `pi-sim` publishing public telemetry to `vitals/` and launches the sibling `pi-monitor` native window against `--source-dir vitals`. It shows ECG Lead II + pleth waveform strips, fluctuating HR/SpO2/BP/MAP/RR/temp numerics, and visible labels: `sourceKind: "demo"`, `fidelity: "demo"`, `synthetic: true`. Stop it with Ctrl-C.

Headless/two-terminal fallback:

```bash
# Terminal A
cd ~/pi-rn/pi-sim && npm run sim:run:live-demo

# Terminal B
cd ~/pi-rn/pi-monitor && cargo run -p monitor-cli -- watch --source-dir ../pi-sim/vitals
# or native popup:
cd ~/pi-rn/pi-monitor && cargo run -p monitor-app -- --source-dir ../pi-sim/vitals --windowed
```

Pulse is deferred for this MVP because the local Pulse shim/provider currently exposes scalar vitals only. This demo provider exists to prove live waveform transport/rendering through the public lane before later replacing the provider with Pulse-native or higher-fidelity samples. It does not add `pi-chart` embedding, chart writes, or `pi-agent` automation.

### Pulse provider runtime (M2)

M2 wraps the Pulse shim behind the same patient-runtime provider boundary and shared publisher used by the scripted runtime. Pulse remains a backend/provider: `scripts/client.ts` is transport-only, `scripts/runtime/pulseProvider.ts` maps shim scalars into provider snapshots, and `scripts/runtime/runner.ts` owns the clock/action/publish loop.

```bash
cd ~/pi-rn/pi-sim

# Low-acuity stable observation scenario; writes evidence output by default.
npm run sim:run:pulse:stable

# Explicit smoke output location.
npm run sim:run:pulse:stable -- \
  --out-dir .omx/evidence/pi-sim-m2-pulse-provider/pulse-stable/vitals \
  --duration 60 --dt 10 --no-pacing
```

If the Pulse Docker shim is unavailable, the Pulse provider command exits non-zero with a clear unavailable message and writes an `unavailable` `status.json`/`current.json` plus a `provider_unavailable` event to the selected output directory. This is expected in no-Docker local environments and does not affect the M1 scripted path.

The current Pulse provider is scalar-only. It writes `waveforms/status.json` with `available: false` and removes any stale `waveforms/current.json` in the selected output directory. Do not infer, synthesize, or display Pulse waveforms as production clinical truth unless a later provider supplies real samples and the public waveform lane labels them accordingly.

The stable Pulse smoke scenario is `vitals/scenarios/pulse_stable_observation.json`. It is intentionally low-acuity continuous observation: no ACLS/code blue, shock, sepsis, pressors, resuscitation, or decompensation story. Acute legacy scenarios remain compatibility/reference assets.

`npm run monitor:pulse` remains discoverable as the legacy interactive Pulse monitor compatibility command while the provider runner reaches parity.

## One-time setup for the current Pulse provider

```bash
# 1. Install Docker + docker compose (Ubuntu): https://docs.docker.com/engine/install/
# 2. Pull + build the Pulse sidecar (first run downloads ~1.3 GB)
cd ~/pi-rn/pi-sim
npm install
npm run pulse:up
npm run pulse:health       # should print {engine_ready: false, ...} before init
```

## Run the current patient telemetry loop

```bash
npm run monitor            # default: StandardMale baseline
npm run monitor:shock      # venous hemorrhage + 2× 1L LR boluses
npm run monitor:sepsis     # patient already septic, norepi drip starts at t=480s
```

Speed knobs:

- `TIME_SCALE=10 npm run monitor:shock` — 10× wall clock (`0` = free-run, no pacing)
- `DT_SIM=5` — seconds of sim time per HTTP round-trip (default `2`)
- `BED="ICU 7"` — header label
- `PULSE_SHIM=http://host:port` — override shim URL

Ctrl-C exits cleanly. Every tick writes `vitals/current.json` atomically and rewrites the compatibility array `vitals/timeline.json`. Provider-runtime runs also append each frame to `vitals/timeline.jsonl` for tailing consumers. `current.json` is the latest scalar public frame. Event and waveform lanes are public files under `vitals/`; consumers must use those files and must not infer hidden provider internals.

### Sepsis scenario setup

Sepsis is a Pulse init-only chronic condition, not a runtime action. The `sepsis_norepi` scenario loads a pre-baked "already-septic" state. Bake once after first `npm run pulse:up`:

```bash
docker compose -f pulse/docker-compose.yml exec pulse   python3 /workspace/shim/bake_states.py --out /workspace/state --sepsis-severity 0.70
```

## Validate the current provider

Docker-free CI gate:

```bash
npm test                         # typecheck + runtime tests + scripted scenario validation
npm run test:runtime             # runtime/publisher/ABI regression harness
npm run test:validate:scripted   # validates scripted scenario files without Pulse/Docker
```

Legacy Pulse validation remains explicit and may be red without scenario retuning per `docs/adr/001-validation-recovery-bounded-stop.md`:

```bash
npm run validate:pulse                                                    # Pulse regression — requires sidecar
npm run validate:pulse -- --mode reference --scenario vitals/scenarios/hemorrhagic_shock.json
npm run validate:pulse -- --observe vitals/scenarios/sepsis_norepi.json
```

`npm run validate` is retained as a legacy alias for `validate:pulse`; do not use it as the Docker-free green CI gate.

Pulse validation modes:

- **regression** — Pulse output stays inside per-scenario `expect` bands (default)
- **reference** — Pulse output stays inside validation curves at `resources/physiology/validation-curves/<scenario>.json`
- **`--observe`** — composable flag; writes per-checkpoint trajectory artifacts to `.omx/observations/<scenario>-<mode>.json`

## Workflow with sibling projects

```bash
# Terminal A — current Pulse provider sidecar
npm run pulse:up

# Terminal B — patient telemetry publisher
cd ~/pi-rn/pi-sim && npm run monitor:shock

# Terminal C — display-only monitor
cd ~/pi-rn/pi-monitor && cargo run -p monitor-cli -- watch --source ../pi-sim/vitals/current.json

# Terminal D — clinician workspace
cd ~/pi-rn/pi-agent && npx pi
```

Sibling projects consume `pi-sim` only through explicit public interfaces such as `vitals/current.json`, `vitals/timeline.json`, `vitals/timeline.jsonl`, `vitals/events.jsonl`, `vitals/encounter/current.json`, `vitals/assessments/status.json`, optional `vitals/assessments/current.json`, `vitals/waveforms/status.json`, optional `vitals/waveforms/current.json`, `vitals/scenarios/*.json`, and documented assessment surfaces. Pulse internals, Docker container state, Python shim files, and TypeScript harness internals are hidden implementation details.

## Optional: Pulse Explorer GUI for your own viewing

See `explorer/README.md`. Explorer is a Qt GUI that runs its own Pulse engine. It is useful as a visual reference launched in parallel; it is not wired into `pi-sim`'s public telemetry boundary and may drift from the runtime provider instance.

## Boundary rules

1. `pi-sim` owns hidden patient-state generation, scenario time, physiology/provider routing, latent clinical facts, public telemetry publication, and validation.
2. Pulse source, Docker internals, Python shim files, and current TypeScript harness internals are implementation details.
3. `pi-monitor` reads public telemetry and remains display-only; it does not write chart truth or import hidden `pi-sim` internals.
4. `pi-chart` owns chart/EHR truth; adapters may consume public telemetry, but the display path must not depend on those adapters.
5. `pi-agent` reads only explicit clinical/public surfaces. It must never import `scripts/`, `pulse/`, provider internals, or scenario secrets.
6. Runtime waveform support must come from truthful public telemetry. Do not synthesize fake clinical waveforms as production truth.
7. Encounter and assessment files are reveal-only public runtime evidence. Providers may hold latent findings internally, but public assessment findings appear only after an `assessment_request` action and must be serialized through allowlist builders.

## Version notes

Pulse 4.3.1 is the currently pinned provider image. Breaking changes on upgrade: bump `pulse/docker-compose.yml`, re-bake condition-preset state files, and re-run reference curves via `npm run validate -- --observe --mode reference`.

`pi-agent` and `pi-monitor` readers require the schema documented in `vitals/README.md`. The current schema includes Pulse-native scalar fields plus a backward-compatible `monitor` extension for display metadata.

State file note: scenario `state_file` values intentionally use Pulse-style relative paths. The shim resolves `./states/...` into Pulse's shipped assets under `/pulse/bin/states/` and `./state/...` into baked runtime states under `/workspace/state/`.
