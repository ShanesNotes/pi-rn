# vitals/

Bedside-monitor output surface. Written by `scripts/monitor.ts`; read by pi-agent through an explicit adapter.

## Files

```
scenarios/*.json     scenario manifests — state file + action timeline + regression bands
scenario.json        default scenario (used when monitor runs without --scenario)
alarms.json          per-field threshold bands {low, high}; monitor emits *_LOW / *_HIGH flags
current.json         latest tick — written atomically per advance
timeline.json        array of every emitted frame since monitor launched
```

## Run

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

Ctrl-C exits cleanly. `current.json` is the primary integration point for pi-agent.

## Schema — `current.json`

Produced by the Pulse Physiology Engine via the sidecar. All keys present at every tick (value may be `null` or absent if Pulse doesn't report it for that patient):

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
  "alarms": ["MAP_LOW", "LACTATE_HIGH"]
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
