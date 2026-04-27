# vitals/

Public telemetry boundary for the hidden `pi-sim` patient runtime. Current publishers include `scripts/monitor.ts` for the current Pulse provider and `scripts/sim-run.ts` for the M1 deterministic scripted provider. Sibling projects read this directory through explicit adapters; they must not import provider internals.

## Architecture status

Current authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` and `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`. `current.json` is the backward-compatible scalar/latest-frame boundary. The optional `monitor` extension carries display metadata for `../pi-monitor`; it is display-only and not chart/EHR truth. Future waveform windows and event streams must be added as documented public lanes when truthful provider samples/events exist.

## Files

```
scenarios/*.json     scenario manifests — state file + action timeline + regression bands
scenario.json        default scenario (used when monitor runs without --scenario)
alarms.json          per-field threshold bands {low, high}; monitor emits *_LOW / *_HIGH flags
current.json         latest tick — written atomically per advance
timeline.json        array of every emitted frame since monitor/sim run launched
status.json          latest publisher status: source, runState, sequence, simTime
```

## Run

### No-Pulse scripted runtime

```bash
npm run sim:run:demo
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals
```

The scripted runtime uses `vitals/scenarios/scripted_m1_demo.json`, writes deterministic scalar frames, and labels `monitor.source` as `pi-sim-scripted`. It is a runtime-boundary/reference provider only; it is not clinical physiology truth and does not emit runtime waveform samples.

### Current Pulse provider

```bash
cd ../pulse && docker compose up -d              # start the Pulse sidecar
cd ..
npm run monitor                                   # default scenario
npm run monitor:shock                             # hemorrhagic shock
npm run monitor:sepsis                            # sepsis + norepinephrine
```

Env knobs:
- `TIME_SCALE=1` — sim seconds per wall second (10 = 10× speedup; 0 = free-run)
- `DT_SIM=2` — seconds of sim time advanced per HTTP round-trip
- `PULSE_SHIM=http://localhost:8765` — override shim URL
- `BED="ICU 7"` — header label

Ctrl-C exits cleanly. `current.json` is the primary latest-frame public telemetry boundary for pi-agent, pi-monitor, and future adapters.

## Schema — `current.json`

Produced by the active provider. The current Pulse provider and M1 scripted provider both write the backward-compatible scalar/latest-frame shape. Provider-specific values may be `null` or absent if unavailable:

```json
{
  "t": 123.5,
  "wallTime": "2026-04-19T20:32:00.000Z",
  "hr": 78.4,
  "map": 72.1,
  "bp_sys": 98.2,
  "bp_dia": 59.0,
  "rr": 18.0,
  "spo2": 94.3,
  "temp_c": 38.2,
  "cardiac_output_lpm": 4.8,
  "stroke_volume_ml": 62.1,
  "etco2_mmHg": 34.0,
  "pao2_mmHg": 82.4,
  "paco2_mmHg": 38.1,
  "urine_ml_hr": 42.0,
  "ph": 7.33,
  "lactate_mmol_l": 3.1,
  "hgb_g_dl": 11.4,
  "alarms": ["MAP_LOW", "LACTATE_HIGH"],
  "monitor": {
    "schemaVersion": 1,
    "source": "pi-sim-pulse | pi-sim-scripted",
    "sequence": 42,
    "runState": "running",
    "events": ["MAP_LOW", "LACTATE_HIGH"],
    "heartRhythm": "unavailable"
  }
}
```

### `monitor` extension

`monitor` is an optional, backward-compatible display extension for the standalone `pi-monitor` app. Legacy consumers may ignore it and continue using the top-level scalar keys. The monitor extension is display-only and must not be treated as chart/EHR truth.

Fields:

- `schemaVersion`: extension schema version, currently `1`.
- `source`: public source label, currently `pi-sim-pulse` for the Pulse provider or `pi-sim-scripted` for the deterministic M1 scripted provider.
- `sequence`: monotonically increasing monitor frame number for update/replay ordering.
- `runState`: `running`, `paused`, `ended`, or `unavailable`.
- `events`: monitor event/alarm feed for display; currently mirrors top-level `alarms`.
- `heartRhythm`: rhythm label when public rhythm telemetry exists. Current shim output is scalar-only, so this is `unavailable`.
- `waveforms`: optional bounded waveform sample windows keyed by signal name. Current Pulse shim output does not expose real waveform samples; when absent, renderers must show an explicit waveform-unavailable state and must not silently synthesize physiology as truth.

Example waveform object, when a future public publisher exposes real samples:

```json
"waveforms": {
  "ECG_LeadII": { "unit": "mV", "sampleRate_Hz": 125, "t0_s": 121.5, "values": [0.0, 0.8, -0.1] },
  "ArterialPressure": { "unit": "mmHg", "sampleRate_Hz": 125, "t0_s": 121.5, "values": [80, 96, 118] }
}
```

**Note**: this schema replaces the prior 6-vital TypeScript-engine schema. pi-agent readers updated in coordination with this change.

## Schema — `scenarios/*.json`

```json
{
  "name": "hemorrhagic_shock",
  "description": "...",
  "state_file": "./states/StandardMale@0s.pbb",
  "duration_s": 900,
  "timeline": [
    { "t": 60,  "action": { "type": "hemorrhage", "params": { "compartment": "VenaCava", "severity": 0.5 } } }
  ],
  "checkpoints": [
    { "t": 200, "phase": "moderate", "expect": { "hr": [80, 115], "map": [55, 85] } }
  ]
}
```

`state_file` paths are resolved by the shim inside the Docker container. `./states/...` maps to Pulse's shipped engine states under `/pulse/bin/states/`; `./state/...` maps to baked runtime states under `/workspace/state/`. Scenarios requiring preset conditions (e.g. sepsis) reference baked state files produced by `pulse/shim/bake_states.py`.

Supported action types: `hemorrhage`, `hemorrhage_stop`, `fluid_bolus`, `norepinephrine`, `norepinephrine_stop`. See `pulse/README.md#action-types` for params.

## Agent boundary

pi-agent reads `current.json` (and may read `scenarios/*.json` for context). It never reads `../scripts/` or `../pulse/`.
