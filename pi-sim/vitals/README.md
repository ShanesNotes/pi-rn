# vitals/

Public telemetry boundary for the hidden `pi-sim` patient runtime. Current publishers include the shared provider runtime (`scripts/runtime/runner.ts`) used by `scripts/sim-run.ts` and `scripts/sim-run-pulse.ts`, plus `scripts/monitor.ts` as a legacy interactive Pulse compatibility surface. Sibling projects read this directory through explicit adapters; they must not import provider internals.

## Architecture status

Current authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` and `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`. `current.json` is the backward-compatible scalar/latest-frame boundary. The optional `monitor` extension carries display metadata for `../pi-monitor`; it is display-only and not chart/EHR truth. Public event and waveform lanes are additive files beside the scalar contract, not hidden imports into provider internals.

## Files

```
scenarios/*.json     scenario manifests — state file + action timeline + regression bands
scenario.json        default scenario (used when monitor runs without --scenario)
alarms.json          per-field threshold bands {low, high}; monitor emits *_LOW / *_HIGH flags
current.json         latest tick — written atomically per advance
timeline.json        compatibility array of every emitted frame since monitor/sim run launched; whole-file rewrite
timeline.jsonl       append-friendly JSONL frame lane for provider-runtime runs
status.json          latest publisher status: source, runState, sequence, simTime
events.jsonl         append-only public event lane for lifecycle/action/alarm/provider/encounter/assessment events
.lanes.json          public lane manifest: schema versions, write/reset semantics, consumer modes
encounter/current.json latest public encounter context when provider supplies one
assessments/status.json latest assessment capability/request/reveal status
assessments/current.json latest revealed assessment envelope only after request
waveforms/status.json latest waveform availability; written by provider runtime runs
waveforms/current.json latest waveform window only when a provider supplies one
```


## Public contract fixtures

Tracked consumer examples live under `vitals/fixtures/public-contract/`. They are golden examples for downstream readers, not a second ABI authority. The public contract remains this README plus `.lanes.json`; runtime producer tests remain the source-freshness gate.

Current fixture cases:

- `scripted-demo/` — normal Docker-free scripted run with frames, JSONL lanes, encounter context, reveal-only assessment output, explicit waveform-unavailable status, and terminal `run_ended`.
- `scripted-alarm/` — alarm smoke fixture with public `MAP_LOW` and `SPO2_LOW` event records.
- `provider-unavailable/` — deterministic Pulse-unavailable fixture. Its refresh command is expected to exit non-zero while still writing fallback public files with terminal `provider_unavailable`, `runState: "unavailable"`, and no terminal `run_ended`.
- `live-demo-waveform/` — positive ECG Lead II + pleth fixture from the demo waveform provider with `sourceKind: "demo"`, `fidelity: "demo"`, and `synthetic: true`.

See `vitals/fixtures/public-contract/README.md` for provenance and refresh commands. Fixture JSON must not include hidden scenario truth, scoring keys, future findings, or sibling/runtime import paths. Waveform fixtures must explicitly label source/fidelity/synthetic status. The demo waveform fixture is labeled `sourceKind: "demo"`, `fidelity: "demo"`, and `synthetic: true`; pure static fixture-only waveform samples should use fixture labels.

## Run

### No-Pulse scripted runtime

```bash
npm run sim:run:demo
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals
```

The scripted runtime uses `vitals/scenarios/scripted_m1_demo.json`, writes deterministic scalar frames, appends frames to `timeline.jsonl`, and labels `monitor.source` as `pi-sim-scripted`. It is a runtime-boundary/reference provider only; it is not clinical physiology truth and does not emit runtime waveform samples. Its waveform lane reports `available: false`. The demo scenario also includes a public encounter context and a scheduled `assessment_request` so smoke runs exercise reveal-only assessment output under `assessments/`.


### Live waveform demo provider

```bash
npm run sim:run:live-demo
# writes to vitals/ for 300 simulated seconds at real-time pacing

npm run sim:run:live-demo -- --out-dir .omx/evidence/live-waveform-monitor-mvp/vitals --duration 60 --dt 0.1 --time-scale 1
npm run sim:run:live-demo -- --tcp-port 8791  # optional private localhost NDJSON stream for pi-monitor
```

The demo provider emits coherent but synthetic ECG Lead II, arterial pressure, pleth, and respiration impedance windows through `waveforms/current.json`, with matching `waveforms/status.json` labels: `sourceKind: "demo"`, `fidelity: "demo"`, `synthetic: true`. Numeric HR, SpO2, BP/MAP, RR, and temperature fluctuate deterministically. This is the current MVP waveform source because the local Pulse provider is scalar-only. The optional `--tcp-port` stream is private localhost, non-durable, and mirrors frame envelopes for smoother monitor display; public JSON lanes remain the authoritative durable contract.

To open the popup monitor against this lane:

```bash
npm run monitor:live-demo
```

No `pi-chart` embedding, chart writes, or `pi-agent` automation are part of this MVP path.

### Pulse provider runtime

```bash
npm run sim:run:pulse:stable
npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/pulse-stable/vitals --duration 60 --dt 10 --no-pacing
```

The Pulse runtime uses `vitals/scenarios/pulse_stable_observation.json` by default. That scenario is deliberately low-acuity continuous observation and emits scalar vitals only. The current Pulse shim path does not supply waveform samples, so `waveforms/status.json` reports `available: false` and no `waveforms/current.json` is preserved. If the Pulse shim is unavailable, the command exits non-zero and writes `runState: "unavailable"` plus a `provider_unavailable` event to the selected output directory rather than leaving a stale successful frame.

### Legacy Pulse monitor compatibility

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

Ctrl-C exits cleanly. `monitor:pulse` remains a compatibility/discoverability alias for this legacy interactive path while new provider work routes through `sim:run:pulse:*`. `current.json` is the primary latest-frame public telemetry boundary for pi-agent, pi-monitor, and future adapters. Provider-runtime consumers that need durable offsets should prefer `timeline.jsonl`; `timeline.json` remains a compatibility array and is rewritten as a whole file.

## Schema — `current.json`

Produced by the active provider. The Pulse provider and M1 scripted provider both write the backward-compatible scalar/latest-frame shape through the shared publisher. Provider-specific values may be `null` or absent if unavailable:

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
- `waveforms`: legacy optional display extension field. The shared provider runtime does not put M3 waveform windows inside `current.json`; renderers must use `waveforms/status.json` and `waveforms/current.json` and show an explicit waveform-unavailable state when absent.

Example legacy waveform object, if a future compatibility layer exposes real samples inside `monitor`:

```json
"waveforms": {
  "ECG_LeadII": { "unit": "mV", "sampleRate_Hz": 125, "t0_s": 121.5, "values": [0.0, 0.8, -0.1] },
  "ArterialPressure": { "unit": "mmHg", "sampleRate_Hz": 125, "t0_s": 121.5, "values": [80, 96, 118] }
}
```

**Note**: this schema replaces the prior 6-vital TypeScript-engine schema. pi-agent readers updated in coordination with this change.

## Schema — `events.jsonl`

`events.jsonl` is append-only JSON Lines within a run and is reset when a new `PublicTelemetryPublisher` is constructed for that output directory. Event records use `schemaVersion: 2` and include a runner-owned, per-run monotonic `eventIndex` starting at `0`. Frame `sequence` remains the frame-correlation key; `eventIndex` is the total ordering key for same-frame events.

Events share the runner-owned `sequence`, `simTime_s`, `wallTime`, `source`, and `runState` context used by frames at the same boundary. M3/M4 emits:

- `run_started`
- `action_applied`
- `encounter_started` — first public context for an encounter id
- `encounter_phase_changed` — public phase changed after encounter start
- `assessment_requested`
- `assessment_revealed`
- `assessment_unavailable`
- `alarm_observed` — per-frame observation for each active alarm
- `provider_unavailable`
- `run_ended`

Example:

```json
{"schemaVersion":2,"eventIndex":3,"sequence":4,"simTime_s":30,"wallTime":"2026-04-27T00:00:03.000Z","source":"pi-sim-scripted","runState":"running","kind":"action_applied","payload":{"action":{"type":"position_change"}}}
```


Terminal semantics:

- Normal completion emits `run_ended` as the terminal event with `payload.terminal: true` and `payload.terminalReason: "normal_end"`.
- Provider failure emits `provider_unavailable` as the abnormal terminal event with `runState: "unavailable"`, `payload.terminal: true`, and `payload.terminalReason: "provider_unavailable"`. It does not emit `run_ended`.

## Schema — `timeline.jsonl`

`timeline.jsonl` is the preferred append-friendly frame history for provider-runtime runs. Each line is one `VitalFrame` record with the same frame schema as entries in `timeline.json`. The lane is reset on `PublicTelemetryPublisher` construction and then appended once per published frame. Consumers that tail files should use `timeline.jsonl`; consumers that still need the historical array may keep reading `timeline.json` during the compatibility window.

## Schema — `encounter/current.json`

`encounter/current.json` exists only when the provider supplies public encounter context. If a later run/provider does not supply encounter context, the publisher removes stale `encounter/current.json`; there is no `encounter/status.json`. The file contains chart-visible identity and clock/phase anchors only, not hidden findings, scoring targets, expected nurse charting ids, or future truth.

```json
{
  "schemaVersion": 1,
  "patientId": "demo_patient_001",
  "encounterId": "enc_demo_001",
  "visibleChartAsOf": "2026-04-19T06:45:00-05:00",
  "phase": "early_deterioration",
  "sequence": 4,
  "simTime_s": 30,
  "wallTime": "2026-04-27T00:00:03.000Z",
  "source": "pi-sim-scripted",
  "runState": "running",
  "display": { "bed": "ICU 7", "oxygenDevice": "nasal cannula" }
}
```

## Schema — `assessments/status.json` and `assessments/current.json`

`assessments/status.json` is the latest capability and request/reveal status. It is written even when assessment support is absent. Before a request, status can report `available: true` while `assessments/current.json` remains absent. If assessment support is unavailable, stale `assessments/current.json` is removed and status carries `reason: "provider_does_not_supply_assessments"`.

```json
{
  "schemaVersion": 1,
  "sequence": 4,
  "simTime_s": 30,
  "wallTime": "2026-04-27T00:00:03.000Z",
  "source": "pi-sim-scripted",
  "runState": "running",
  "available": true,
  "lastRequestId": null,
  "lastRevealSequence": null
}
```

`assessments/current.json` exists only after an `assessment_request` action reveals findings through `provider.assess(request)`. The generic `action_applied` event remains the M3 audit record; reveal data comes from the provider assessment capability and allowlist serialization, not from the action snapshot. Duplicate same-window request ids re-emit `assessment_revealed` with `replay: true`, `replayOfSequence`, and `envelopeDigest` without a second hidden reveal.

```json
{
  "schemaVersion": 1,
  "requestId": "assess_demo_0001",
  "assessmentType": "focused_respiratory",
  "bodySystem": "respiratory",
  "visibility": "revealed",
  "sequence": 5,
  "simTime_s": 40,
  "wallTime": "2026-04-27T00:00:04.000Z",
  "source": "pi-sim-scripted",
  "runState": "running",
  "findings": [
    {
      "id": "finding_demo_work_of_breathing",
      "label": "work of breathing",
      "value": "mildly increased",
      "severity": "mild",
      "evidence": [{ "kind": "event", "ref": "events.jsonl#requestId=assess_demo_0001", "role": "primary" }]
    }
  ],
  "summary": "Mildly increased work of breathing with stable oxygenation.",
  "envelopeDigest": "..."
}
```

## Schema — `waveforms/status.json` and `waveforms/current.json`

`waveforms/status.json` is the availability source of truth. It is written by provider runtime runs even when no waveform is available:

```json
{
  "schemaVersion": 1,
  "sequence": 4,
  "simTime_s": 30,
  "wallTime": "2026-04-27T00:00:03.000Z",
  "source": "pi-sim-pulse",
  "runState": "running",
  "available": false,
  "reason": "provider_does_not_supply_waveforms"
}
```

`waveforms/current.json` exists only when a provider supplies a waveform window. If a later frame has no waveform or the provider is unavailable, the publisher removes stale `waveforms/current.json` and updates status. Consumers must never treat an old waveform file as current without checking matching `sequence`/`simTime_s`/`source`/`runState` in status.

Fixture/demo waveform windows are allowed only for contract tests and demos. They must be explicitly labeled and are not production clinical truth:

```json
{
  "schemaVersion": 1,
  "sequence": 4,
  "simTime_s": 30,
  "wallTime": "2026-04-27T00:00:03.000Z",
  "source": "pi-sim-fixture-waveform",
  "runState": "running",
  "available": true,
  "sourceKind": "fixture",
  "fidelity": "fixture",
  "synthetic": true,
  "windows": {
    "ECG_LeadII": { "unit": "mV", "sampleRate_Hz": 125, "t0_s": 29, "values": [0, 0.8, -0.1] }
  }
}
```

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

`provider: "pulse"` marks provider-runner scenarios. For legacy compatibility, scenario files with a `state_file` and no `provider` are inferred as Pulse by the Pulse scenario loader. Scripted and Pulse scenario loaders share strict validation helpers for object/string/number/timeline/checkpoint structure; invalid timeline entries fail instead of being silently dropped. `state_file` paths are resolved by the shim inside the Docker container. `./states/...` maps to Pulse's shipped engine states under `/pulse/bin/states/`; `./state/...` maps to baked runtime states under `/workspace/state/`. Scenarios requiring preset conditions (e.g. sepsis) reference baked state files produced by `pulse/shim/bake_states.py`.

Supported Pulse action types: `hemorrhage`, `hemorrhage_stop`, `fluid_bolus`, `norepinephrine`, `norepinephrine_stop`. Scripted provider-runtime scenarios may also schedule `{ "type": "assessment_request", "params": { "requestId": "...", "assessmentType": "...", "bodySystem": "..." } }` to request matching provider-owned assessment fixtures. See `pulse/README.md#action-types` for Pulse params.

## Agent boundary

pi-agent reads `current.json` (and may read `scenarios/*.json` for context). It never reads `../scripts/` or `../pulse/`.
