# pi-monitor

Standalone display-only Rust monitor for `pi-sim` public telemetry.

## Crates

- `pulse-public-frame` — parses target Pulse-style frames, legacy `current.json`, the backward-compatible `current.json.monitor` display extension, and additive public-lane models from `pi-sim/vitals`.
- `monitor-core` — deterministic freshness/alarm/numeric/waveform display model.
- `monitor-ingest` — read-only file and public source-directory ingest with native filesystem watching and polling fallback.
- `monitor-ui` — static terminal/HTML renderers for smoke tests and fixture artifacts.
- `monitor-cli` — `render`, `watch`, and `replay` commands.
- `monitor-app` — native Rust kiosk app using eframe/egui.

## Boundary

`pi-monitor` reads public JSON files only. It does not import `pi-sim/scripts`, `pi-sim/pulse`, `pi-agent`, `pi-chart`, and it does not write `vitals.jsonl` or any chart/EHR record.

Public contract authority remains producer-side in `../pi-sim/vitals/README.md` and `../pi-sim/vitals/.lanes.json`. The mirrored files under `fixtures/public-contract/**` are regression fixtures only.

## Run

```bash
# one-shot terminal render
cargo run -p monitor-cli -- render --source ../pi-sim/vitals/current.json

# one-shot public source-directory render across public lanes
cargo run -p monitor-cli -- render --source-dir ../pi-sim/vitals

# static HTML artifact
cargo run -p monitor-cli -- render --source fixtures/legacy-monitor-waveforms.json --html /tmp/pi-monitor.html

# terminal replay
cargo run -p monitor-cli -- replay \
  --fixture fixtures/stable-current.json \
  --fixture fixtures/legacy-monitor-waveforms.json \
  --fixture fixtures/legacy-monitor-waveforms-next.json \
  --no-sleep

# public contract directory replay
cargo run -p monitor-cli -- replay-dir \
  --fixture-dir fixtures/public-contract/scripted-demo \
  --fixture-dir fixtures/public-contract/scripted-alarm \
  --fixture-dir fixtures/public-contract/provider-unavailable \
  --no-sleep

# offset-based JSONL frame tail for append-only timeline lanes
cargo run -p monitor-cli -- tail-jsonl --source ../pi-sim/vitals/timeline.jsonl --poll-ms 100

# private localhost TCP NDJSON live stream (non-durable; no fallback)
# Terminal A: cd ../pi-sim && npm run sim:run:live-demo -- --tcp-port 8791
# Terminal B:
cargo run -p monitor-cli -- live-tcp --addr 127.0.0.1:8791

# native kiosk/windowed app
cargo run -p monitor-app -- --source ../pi-sim/vitals/current.json --windowed

# native source-directory app
cargo run -p monitor-app -- --source-dir ../pi-sim/vitals --windowed

# native private TCP live app
cargo run -p monitor-app -- --live-tcp 127.0.0.1:8791 --windowed

# one-command live ECG + ABP + pleth + CO₂ demo from pi-sim
cd ../pi-sim && npm run monitor:live-demo

# native fixture replay without a running simulator
cargo run -p monitor-app -- \
  --fixture-replay fixtures/legacy-monitor-waveforms.json \
  --fixture-replay fixtures/legacy-monitor-waveforms-next.json \
  --windowed

# native public fixture directory replay
cargo run -p monitor-app -- \
  --fixture-dir-replay fixtures/public-contract/scripted-demo \
  --fixture-dir-replay fixtures/public-contract/provider-unavailable \
  --windowed
```

The current live Pulse shim is scalar-only, so Pulse-backed runtime frames show an explicit waveform-unavailable state. The current live waveform MVP uses `pi-sim`'s demo waveform provider; it is visibly labeled `sourceKind=demo fidelity=demo synthetic=true` in terminal, HTML, and native footer output. Runtime must not silently synthesize waveform truth.

`--source <current.json>` and the app default remain single-file compatible. Use `--source-dir <vitals-dir>` explicitly when the monitor should read `status.json`, `events.jsonl`, encounter, assessment, and waveform lanes. Supplying both source modes is an error.

## Verify

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace
```
