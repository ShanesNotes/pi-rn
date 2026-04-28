# pi-monitor

Standalone display-only Rust monitor for `pi-sim` public telemetry.

## Crates

- `pulse-public-frame` — parses target Pulse-style frames, legacy `current.json`, and the backward-compatible `current.json.monitor` display extension.
- `monitor-core` — deterministic freshness/alarm/numeric/waveform display model.
- `monitor-ingest` — read-only file ingest with native filesystem watching and polling fallback.
- `monitor-ui` — static terminal/HTML renderers for smoke tests and fixture artifacts.
- `monitor-cli` — `render`, `watch`, and `replay` commands.
- `monitor-app` — native Rust kiosk app using eframe/egui.

## Boundary

`pi-monitor` reads public JSON files only. It does not import `pi-sim/scripts`, `pi-sim/pulse`, `pi-agent`, `pi-chart`, and it does not write `vitals.jsonl` or any chart/EHR record.

## Run

```bash
# one-shot terminal render
cargo run -p monitor-cli -- render --source ../pi-sim/vitals/current.json

# static HTML artifact
cargo run -p monitor-cli -- render --source fixtures/legacy-monitor-waveforms.json --html /tmp/pi-monitor.html

# terminal replay
cargo run -p monitor-cli -- replay \
  --fixture fixtures/stable-current.json \
  --fixture fixtures/legacy-monitor-waveforms.json \
  --fixture fixtures/legacy-monitor-waveforms-next.json \
  --no-sleep

# native kiosk/windowed app
cargo run -p monitor-app -- --source ../pi-sim/vitals/current.json --windowed

# native fixture replay without a running simulator
cargo run -p monitor-app -- \
  --fixture-replay fixtures/legacy-monitor-waveforms.json \
  --fixture-replay fixtures/legacy-monitor-waveforms-next.json \
  --windowed
```

The current live Pulse shim is scalar-only, so live runtime frames usually show an explicit waveform-unavailable state. Waveform fixtures are synthetic test/demo data and are labeled as fixtures; runtime must not silently synthesize waveform truth.

## Verify

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace
```
