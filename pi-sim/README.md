# pi-sim

Bedside-monitor backed by the **Kitware Pulse Physiology Engine** (v4.3.1, Apache 2.0). Pulse runs inside a Docker sidecar. A small Python shim (stdlib-only HTTP server) in the same container drives Pulse's compiled `PulseScenarioDriver` binary per request. A Node/TypeScript harness on the host talks HTTP to that shim and writes `vitals/current.json` for the sibling **pi-agent** workspace to consume.

```
~/pi-sim/                          ← you are here
  pulse/                           Docker sidecar (kitware/pulse:4.3.1) + Python shim
    docker-compose.yml
    shim/                          app.py (stdlib HTTP), bake_states.py, numpy/pandas import stubs
  scripts/                         TS harness: monitor, render, validate, client, types
  vitals/                          bedside-monitor output surface (current.json, scenarios)
  resources/physiology/            citation-backed reference library + validation curves
  explorer/                        optional: prebuilt Pulse Explorer GUI for visual review
  docs/plans/                      architecture plans
  .omx/                            evidence ledger + observation artifacts

~/pi-rn/pi-agent/                  clinician agent workspace (sibling — see ../README.md)
```

## One-time setup

```bash
# 1. Install Docker + docker compose (Ubuntu): https://docs.docker.com/engine/install/
# 2. Pull + build the Pulse sidecar (first run downloads ~1.3 GB)
cd ~/pi-rn/pi-sim
npm install
npm run pulse:up
npm run pulse:health       # should print {engine_ready: false, ...}
```

## Run the bedside monitor

```bash
npm run monitor            # default: StandardMale baseline
npm run monitor:shock      # venous hemorrhage + 2× 1L LR boluses
npm run monitor:sepsis     # patient already septic, norepi drip starts at t=480s
```

Speed knobs:
- `TIME_SCALE=10 npm run monitor:shock` — 10× wall clock (0 = free-run, no pacing)
- `DT_SIM=5` — seconds of sim time per HTTP round-trip (default 2)
- `BED="ICU 7"` — header label
- `PULSE_SHIM=http://host:port` — override shim URL

Ctrl-C exits cleanly. Every tick writes `vitals/current.json` atomically and appends to `vitals/timeline.json` — those files are the primary integration point with the clinician-facing workspace.

### Sepsis scenario setup

Sepsis is a Pulse init-only chronic condition, not a runtime action. The `sepsis_norepi` scenario loads a pre-baked "already-septic" state. Bake once after first `npm run pulse:up`:

```bash
docker compose -f pulse/docker-compose.yml exec pulse \
  python3 /workspace/shim/bake_states.py --out /workspace/state --sepsis-severity 0.70
```

## Validate the engine

```bash
npm run validate                                                    # regression — both scenarios
npm run validate -- --mode reference --scenario vitals/scenarios/hemorrhagic_shock.json
npm run validate -- --observe vitals/scenarios/sepsis_norepi.json
```

Three modes:
- **regression** — Pulse output stays inside the per-scenario `expect` bands (default)
- **reference** — Pulse output stays inside validation curves at `resources/physiology/validation-curves/<scenario>.json`
- **`--observe`** — composable flag; writes per-checkpoint trajectory artifacts to `.omx/observations/<scenario>-<mode>.json`

## Workflow with the clinician workspace

```bash
# Terminal A — Pulse sidecar (runs in background)
npm run pulse:up

# Terminal B — monitor
cd ~/pi-rn/pi-sim && npm run monitor:shock

# Terminal C — clinician workspace
cd ~/pi-rn/pi-agent && npx pi
```

The clinician workspace consumes this repo through explicit interfaces only: `vitals/current.json`, `vitals/timeline.json`, `vitals/scenarios/*.json`. The Pulse engine, Docker container, Python shim, and TypeScript harness are intentionally not part of the agent runtime context.

## Optional: Pulse Explorer GUI for your own viewing

See `explorer/README.md`. Explorer is a Qt GUI that runs its own Pulse engine — not wired into pi-sim's vitals pipeline. Useful as a visual reference you launch in parallel; numbers may drift slightly from pi-sim's engine instance.

## Boundary rules

1. pi-sim owns patient-state generation, physiology, monitoring, and validation.
2. The Pulse engine source, Docker container internals, and Python shim are **implementation details**. pi-agent must never reach them.
3. pi-agent reads only `vitals/*.json` (and optionally the text scenario manifests).
4. Engine behavior is authoritative — the DIY TypeScript engine from prior versions is retired.

## Version notes

Pulse 4.3.1 is the currently pinned image. Breaking changes on upgrade: bump `pulse/docker-compose.yml`, re-bake any condition-preset state files, and re-run reference curves via `npm run validate -- --observe --mode reference`.

pi-agent's vitals reader requires the schema documented in `vitals/README.md`. That schema was redesigned in v0.2.0 (from 6 vitals to 17+ Pulse-native fields). Coordinated update required on pi-agent.

State file note: scenario `state_file` values intentionally use Pulse-style relative paths. The shim resolves `./states/...` into Pulse's shipped assets under `/pulse/bin/states/` and `./state/...` into baked runtime states under `/workspace/state/`.
