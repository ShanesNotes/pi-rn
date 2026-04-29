# Pulse sidecar

Current/legacy provider integration for the Kitware Pulse Physiology Engine (v4.3.1). This directory is the only place that links against Pulse. The rest of `pi-sim` treats it as an opaque provider service behind the public patient-runtime boundary.

## Architecture status

Per `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`, Pulse is a physiology provider/backend, not the center of the `pi-sim` architecture. The stdlib HTTP shim and Docker sidecar are the current implementation and a useful reference for mappings, action payloads, baked states, and validation evidence. The M2 TypeScript runtime wraps this shim in `scripts/runtime/pulseProvider.ts` and runs it through the shared provider runner/publisher without changing public consumers.

## Boundary

- **pi-agent never reaches this process.** The agent reads only `vitals/*.json` files, which the Node harness writes after talking to this sidecar.
- Pulse's C++/Java/Python internals stay inside the container. The host Node process speaks HTTP to `localhost:8765`; Docker publishes the port on host loopback only.
- Scenario action schedules live in `../vitals/scenarios/*.json`. The Node harness reads those and calls `/action` at the right sim times; the shim does not auto-execute scenarios.

## Layout

```
pulse/
  docker-compose.yml      Kitware image + stdlib-HTTP shim
  shim/
    app.py                stdlib ThreadingHTTPServer: /init /advance /action /vitals /state/save /health /schema
                          per request, drives /pulse/bin/PulseScenarioDriver via subprocess with a
                          generated ScenarioData JSON (no FastAPI, no Pulse Python wrapper)
    bake_states.py        Offline cold-init for condition-preset states (sepsis, etc.)
    numpy.py, pandas.py   local compatibility stubs — Pulse eagerly imports these at module load
                          even for code paths we never hit; real packages are not in the image
    requirements.txt      empty — shim is stdlib-only
```

Scenarios (action timelines + state file references + regression checkpoints) live in `../vitals/scenarios/`. The Node harness reads them on the host and drives this shim over HTTP — the shim itself does not parse scenarios.

`state_file` paths use Pulse-style relative names from the docs, but the shim resolves them explicitly:
- `./states/...` -> shipped engine states under `/pulse/bin/states/`
- `./state/...` -> baked runtime states under `/workspace/state/`

## Run

```bash
cd pulse
docker compose up -d
curl -fsS http://localhost:8765/health
cd ..
npm run sim:run:pulse:stable
```

First run pulls ~1.3 GB for the `kitware/pulse:4.3.1` image.

The shim process listens on `0.0.0.0` inside the container so Docker port
publishing works, but `docker-compose.yml` binds the published host port to
`127.0.0.1`. Set `PULSE_SHIM_TOKEN` before `docker compose up` to require a
bearer token or `X-Pulse-Shim-Token` header for every endpoint except
`/health`.

If the shim is not running, `npm run sim:run:pulse:stable` exits non-zero and writes `runState: "unavailable"` evidence to its output directory. This is intentional: local no-Docker verification should continue to use `npm run sim:run:demo` and fake-transport runtime tests.

## Endpoints

| Method | Path            | Body                                                     | Returns |
|--------|-----------------|----------------------------------------------------------|---------|
| POST   | `/init`         | `{state_file, log_file?}`                                | vitals frame + `t:0` |
| POST   | `/advance`      | `{dt_seconds}`                                           | vitals frame |
| POST   | `/action`       | `{type, params}`                                         | `{ok, t, type}` |
| POST   | `/state/save`   | `{path}`                                                 | `{ok, path}` |
| GET    | `/vitals`       | —                                                        | vitals frame (no advance) |
| GET    | `/health`       | —                                                        | `{engine_ready, t_sim, scenario, requests}` |
| GET    | `/schema`       | —                                                        | data-request → schema-key mapping |

When `PULSE_SHIM_TOKEN` is set, call protected endpoints with either
`Authorization: Bearer $PULSE_SHIM_TOKEN` or
`X-Pulse-Shim-Token: $PULSE_SHIM_TOKEN`. The `/health` endpoint remains
unauthenticated for Docker health checks.

### Action types

- `hemorrhage` — `{compartment, severity}` or `{compartment, rate_ml_min}`
- `hemorrhage_stop` — `{compartment}`
- `fluid_bolus` — `{fluid: "Saline"\|"LactatedRingers", volume_ml, rate_ml_min}`
- `norepinephrine` — `{rate_mcg_kg_min, weight_kg?, concentration_mg_per_ml?}`
- `norepinephrine_stop` — `{}`

## Vitals schema

See `GET /schema` for authoritative list. Keys written to `vitals/current.json`: `t, hr, map, bp_sys, bp_dia, rr, spo2, temp_c, cardiac_output_lpm, stroke_volume_ml, etco2_mmHg, pao2_mmHg, paco2_mmHg, urine_ml_hr, ph, lactate_mmol_l, hgb_g_dl`.

## Baked states

Sepsis in Pulse is an init-only chronic condition, not a runtime action. The `sepsis_norepi` scenario loads a pre-baked "already-septic" state produced by `bake_states.py`. Bake once, then load on every session:

```bash
docker compose exec pulse python /workspace/shim/bake_states.py --out /workspace/state
```

The resulting state file lives in the `pulse_state` volume at `/workspace/state/<name>.json` and is referenced by pi-sim scenario wrappers as `./state/<name>.json`.

## Smoke test

```bash
# Load StandardMale stock state, advance 60s, read vitals
curl -sX POST localhost:8765/init    -H 'Content-Type: application/json' ${PULSE_SHIM_TOKEN:+-H "Authorization: Bearer $PULSE_SHIM_TOKEN"} \
  -d '{"state_file": "./states/StandardMale@0s.pbb"}' | jq .

curl -sX POST localhost:8765/advance -H 'Content-Type: application/json' ${PULSE_SHIM_TOKEN:+-H "Authorization: Bearer $PULSE_SHIM_TOKEN"} \
  -d '{"dt_seconds": 60}' | jq .

curl -sX POST localhost:8765/action  -H 'Content-Type: application/json' ${PULSE_SHIM_TOKEN:+-H "Authorization: Bearer $PULSE_SHIM_TOKEN"} \
  -d '{"type":"hemorrhage","params":{"compartment":"VenaCava","severity":0.5}}' | jq .

curl -sX POST localhost:8765/advance -H 'Content-Type: application/json' ${PULSE_SHIM_TOKEN:+-H "Authorization: Bearer $PULSE_SHIM_TOKEN"} \
  -d '{"dt_seconds": 120}' | jq .
```

HR should rise and MAP should drop after the hemorrhage.

## Implementation notes

- **Not FastAPI / not uvicorn / not the Pulse Python wrapper.** Those were the
  original plan (`docs/plans/002-pulse-pivot.md`) but the shipped
  `kitware/pulse:4.3.1` image lacks numpy/pandas/fastapi/uvicorn at runtime.
  The shim was rewritten to use Python stdlib (`ThreadingHTTPServer`) and to
  drive the compiled `/pulse/bin/PulseScenarioDriver` binary via `subprocess`
  per HTTP call. Each `/advance` spawns the driver with a generated
  `ScenarioData` JSON that loads the current state, runs the requested actions,
  and writes the next state + results CSV. The shim parses the CSV's last row
  into the vitals frame.
- **`shim/numpy.py` and `shim/pandas.py`** are intentional local stubs. Pulse's
  Python modules import them at load time even when we never take those code
  paths; the real packages are not in the base image.
- **Runtime files** live under `/workspace/state/shim-runtime/` inside the
  container (shim-owned, auto-purged to the latest state after each call).
  Baked condition states live under `/workspace/state/` (persistent, mounted
  as the `pulse_state` volume).
- **Single-engine state** is serialized with an in-process lock. Concurrent
  HTTP requests are accepted by `ThreadingHTTPServer`, but state-changing
  routes run one at a time against one current patient state.

Fastest way to sanity-check the engine independently of the shim:

```bash
docker compose -f pulse/docker-compose.yml exec pulse \
  bash -c 'cd /pulse/bin && ls scenarios/'            # shipped Pulse scenario samples
```
