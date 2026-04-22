# Pivot pi-sim to Kitware Pulse Engine

## Context

pi-sim currently runs a hand-built TypeScript ODE physiology engine under `scripts/engine/`. Validation curves and scenario expectations already reference Pulse v4.3.1 as the ground truth, which signals that the DIY engine's job has always been to approximate Pulse. Maintaining a bespoke engine is expensive and will always lag the real thing.

Goal: replace the DIY engine with the upstream Kitware Pulse Physiology Engine while preserving pi-sim's external boundary — pi-agent still consumes simulation state only through `vitals/current.json` and scenario files, never through engine source code. The TUI, validation harness, and scenario library continue to exist; their backend becomes Pulse.

Secondary goal: let the user run Pulse Explorer (Qt GUI) in parallel on the same Pulse scenario JSON for their own visual reference — Explorer is a separate user-side process, not part of pi-sim runtime.

## Decisions (confirmed with user)

1. **Deployment**: Docker sidecar using `kitware/pulse:4.3.1` — no local C++ build. Node spawns a small Python shim inside the container.
2. **Sepsis**: Pulse models sepsis as an init-only chronic condition. The `sepsis_norepi` scenario will initialize the engine already-septic rather than trigger onset at t=60s.
3. **Explorer**: user installs the prebuilt Explorer binary separately and opens the same Pulse scenario JSON for visual monitoring. Explorer runs its own engine; it is NOT wired into pi-sim's vitals pipeline. Dev/user convenience, not runtime.
4. **Output schema**: full redesign of `vitals/current.json` to Pulse-native fields (HR, MAP, SBP, DBP, RR, SpO2, core temp, cardiac output, stroke volume, EtCO2, PaO2, PaCO2, lactate, Hgb, urine output, pH, plus sim time `t`). **This breaks pi-agent's current reads** — pi-agent (`~/pi-rn/pi-agent`) will need a coordinated update before this pivot is merged.

## Target architecture

```
~/pi-rn/pi-sim/
  pulse/                              NEW — Pulse integration surface (engine-adjacent)
    docker-compose.yml                kitware/pulse:4.3.1 + shim service
    shim/
      app.py                          FastAPI app: POST /init, /advance, /action; GET /vitals
      requirements.txt                fastapi, uvicorn (pulse-python comes from base image)
      scenarios/                      Pulse-native scenario JSON (protobuf-backed)
        hemorrhagic_shock.json
        sepsis_norepi.json            sepsis as init condition
    README.md                         how the sidecar works, engine never exposed to agent
  scripts/
    monitor.ts                        REWRITTEN — HTTP-drives shim, writes vitals/current.json per tick
    render.ts                         UNCHANGED — reads vitals/current.json
    validate.ts                       REWRITTEN — drives shim in headless batch, compares to checkpoints
    engine/                           DELETED — DIY ODE engine gone
  vitals/
    current.json                      NEW SCHEMA — Pulse-native fields (see below)
    timeline.json                     NEW SCHEMA — append-only history at same shape
    alarms.json                       UPDATED thresholds for new fields (add lactate, MAP, EtCO2, etc.)
    scenario.json                     UPDATED — thin wrapper pointing to active Pulse scenario + pi-sim metadata
    scenarios/                        UPDATED — each file = pi-sim wrapper referencing pulse/shim/scenarios/*.json
  resources/physiology/               KEPT — citation library stays; validation-curves still used by validate
  explorer/                           NEW — dev-only (gitignored binary)
    README.md                         how to download prebuilt Explorer + open the same scenario JSON
    .gitignore                        ignore the binary itself
  docs/plans/
    002-pulse-pivot.md                copy of this plan for repo history
```

## New `vitals/current.json` schema

```json
{
  "t": 123.5,
  "wallTime": "2026-04-19T20:32:00Z",
  "hr": 78,
  "map": 72,
  "bp_sys": 98,
  "bp_dia": 59,
  "rr": 18,
  "spo2": 94,
  "temp_c": 38.2,
  "cardiac_output_lpm": 4.8,
  "stroke_volume_ml": 62,
  "etco2_mmHg": 34,
  "pao2_mmHg": 82,
  "paco2_mmHg": 38,
  "lactate_mmol_l": 3.1,
  "hgb_g_dl": 11.4,
  "urine_ml_hr": 42,
  "ph": 7.33,
  "rhythm": "ST",
  "alarms": ["MAP_LOW", "LACTATE_HIGH"]
}
```

`timeline.json` = array of the same objects, appended per tick.
`alarms.json` = threshold bands per field; monitor generates the `alarms` array in `current.json` from these.

## Implementation phases

### Phase 1 — Pulse sidecar (new files only; DIY engine still runs)

1. `pulse/docker-compose.yml` — service using `kitware/pulse:4.3.1`, mounts `pulse/shim/` and `pulse/shim/scenarios/`, exposes port on localhost.
2. `pulse/shim/app.py` — FastAPI app wrapping Pulse Python API:
   - `POST /init` — body `{scenario_path, patient_state?}` → `SerializeFromFile` or `InitializeEngine`, register DataRequests for every field in the new schema, return `{t: 0}`.
   - `POST /advance` — body `{dt_seconds}` → advance engine; return latest vitals (full schema).
   - `POST /action` — body `{type, params, t?}` → `ProcessAction` (Hemorrhage, SubstanceCompoundInfusion saline, SubstanceInfusion norepinephrine).
   - `POST /state/save|load` — serialize/hydrate engine state (to skip slow re-init).
   - `GET /vitals` — current values without advancing.
3. `pulse/shim/scenarios/hemorrhagic_shock.json` — Pulse scenario JSON: patient `StandardMale.json`, `DataRequestManager` listing every field, `AnyAction[]` with `Hemorrhage` at t=60 sev=0.5, escalate at t=240 sev=0.75, `SubstanceCompoundInfusion` (LactatedRingers, 1000 mL) at t=360 and t=540.
4. `pulse/shim/scenarios/sepsis_norepi.json` — patient with `Sepsis` chronic condition set at init (severity 0.7), `SubstanceInfusion` norepinephrine 0.12 mcg/kg/min at t=480. No dynamic onset.
5. Smoke test: `docker compose up`, `curl POST /init`, run 600 ticks, eyeball vitals.

### Phase 2 — TS harness rewrite

6. `scripts/monitor.ts` — rewrite:
   - Read `vitals/scenarios/<name>.json` (pi-sim wrapper pointing to Pulse scenario file).
   - `POST /init` to shim; poll `/advance` at `TIME_SCALE`-modulated wallclock rate.
   - For each tick, map Pulse response → new-schema `current.json`; atomic write; append to `timeline.json`.
   - Alarm generation from `alarms.json` thresholds (simple band check).
   - Keep existing env knobs (`TIME_SCALE`, `RENDER_MS`, `BED`).
7. `scripts/render.ts` — update only to display new fields (lactate, MAP, CO, EtCO2). Structure unchanged.
8. `vitals/scenarios/hemorrhagic_shock.json` + `vitals/scenarios/sepsis_norepi.json` — rewrite as thin wrappers:
   ```json
   { "name": "hemorrhagic_shock", "pulse_scenario": "pulse/shim/scenarios/hemorrhagic_shock.json", "checkpoints": [...] }
   ```
   Checkpoints retain the per-timepoint expected-range shape but now reference Pulse-native fields.
9. `vitals/alarms.json` — rewrite with thresholds for all new fields.

### Phase 3 — Validation rewrite

10. `scripts/validate.ts` — rewrite:
    - Drive shim in non-realtime mode (`advance` as fast as HTTP allows).
    - Parse `checkpoints[]` from wrapper scenario; at each `t`, check engine vitals fall inside `expect` ranges.
    - `--mode reference` still reads `resources/physiology/validation-curves/<scenario>.json`; ranges now match Pulse-native field names.
    - `--observe` still writes `.omx/observations/<scenario>-<mode>-seed<N>.json`.
11. Regenerate `resources/physiology/validation-curves/*.json` from actual Pulse runs (one-time script: run each scenario with `--observe`, snapshot the trajectory, commit).

### Phase 4 — Cleanup

12. Delete `scripts/engine/` (DIY ODE engine).
13. Delete or demote `resources/physiology/parameters/`, `coupling/`, `drugs/` if they were only used by the DIY engine. Keep the citation-backed tables that are human-reference material (not engine inputs).
14. Update `README.md`: new run commands, Docker dependency, pi-agent schema-change note.
15. Update `docs/plans/001-ultraplan-pi-rn-substrate.md` status line to note the Pulse pivot.
16. Coordinate with `~/pi-rn/pi-agent` — its reader must accept the new schema before this lands on master.

### Phase 5 — Explorer (user convenience, optional)

17. `explorer/README.md` — instructions to download the prebuilt Explorer binary from Kitware, launch it, `File → Open Scenario`, point at `pulse/shim/scenarios/<name>.json`. Note that Explorer runs its OWN engine instance; numbers may diverge slightly from pi-sim's engine. Both engines read the same scenario JSON, so the narrative matches even if the numerics don't tick-for-tick.
18. `.gitignore` Explorer binary.

## Boundary preservation (how this keeps pi-sim's contract)

- **pi-agent sees only `vitals/*.json`.** Engine source (Pulse C++, Python shim, Docker internals) is not reachable from pi-agent's workspace. README explicitly keeps the "simulation source stays outside the agent runtime context" rule.
- **Pulse engine runs in Docker**, isolating its dependencies (JDK, C++ runtime, protobuf) from pi-sim's Node host. Agent context never sees the container internals.
- **Scenarios are data, not code.** pi-agent may read scenario JSON for context if wanted, but the scenario files describe *what happens to the patient*, not *how the engine computes*.
- **Explorer is user-side only.** It is not a dependency of the agent loop, not a runtime component, not bundled with pi-sim. Documented as an optional viewer the human can launch.
- **Resource library (`resources/physiology/`) remains** as citation-backed reference material for the human/agent reading about physiology. It is no longer wired into the engine.

## Critical files to modify

- Create: `pulse/docker-compose.yml`, `pulse/shim/app.py`, `pulse/shim/requirements.txt`, `pulse/shim/scenarios/*.json`, `pulse/README.md`, `explorer/README.md`, `docs/plans/002-pulse-pivot.md`
- Rewrite: `scripts/monitor.ts`, `scripts/validate.ts`, `scripts/render.ts`, `vitals/scenarios/hemorrhagic_shock.json`, `vitals/scenarios/sepsis_norepi.json`, `vitals/alarms.json`, `vitals/scenario.json`, `README.md`, `package.json` (new scripts, drop DIY engine deps)
- Regenerate: `resources/physiology/validation-curves/*.json`
- Delete: `scripts/engine/` (whole directory)
- Coordinated external change: `~/pi-rn/pi-agent` vitals reader (must accept new schema)

## Verification

1. `docker compose -f pulse/docker-compose.yml up` → shim reachable on localhost.
2. `curl -X POST localhost:PORT/init -d '{"scenario":"hemorrhagic_shock"}'` returns `{t:0}` within seconds (using pre-serialized state, not cold init).
3. `npm run monitor:shock` → TUI renders new-schema vitals; `vitals/current.json` updates atomically each tick; `timeline.json` grows.
4. `npm run monitor:sepsis` → patient starts already-septic (tachycardic, febrile, lactate elevated), norepi kicks in at t=480s and MAP rises.
5. `npm run validate` → both scenarios pass regression checkpoints. `npm run validate -- --mode reference --scenario ...` → passes against regenerated Pulse-reference curves.
6. `cat vitals/current.json` in sibling pi-agent workspace → new schema readable; pi-agent reader updated to match.
7. User launches Explorer prebuilt binary, opens `pulse/shim/scenarios/hemorrhagic_shock.json` → sees Qt vitals monitor telling the same narrative.
8. `ls scripts/engine/` → directory gone. `grep -r "engine/state.ts" .` → no references.

## Known risks / follow-ups

- **Pulse init latency**: cold init takes minutes. Must ship pre-serialized patient states (bake once, load on every run). Scenarios should reference state files, not re-initialize.
- **Shim HTTP overhead**: per-tick HTTP round-trip may be slow at high TIME_SCALE. If it bottlenecks, switch to stdin/stdout JSONL (simpler, no HTTP parsing).
- **Field mapping surface**: Pulse emits SI-ish units in specific names (e.g., `MeanArterialPressure` mmHg, `CardiacOutput` L/min). The schema mapping needs a single source-of-truth table in the shim — document it in `pulse/shim/README.md`.
- **Explorer version coupling**: Explorer is branch-pinned to engine versions. Must grab the Explorer build matching `4.3.1` or numerical drift will be worse than expected.
- **pi-agent coordination**: schema redesign is a breaking change. Do not merge this pivot to pi-sim master until pi-agent's reader is updated. Stage both on feature branches and flip together.
