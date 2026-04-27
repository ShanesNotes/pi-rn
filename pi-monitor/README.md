# pi-monitor

Standalone, display-only Pulse/pi-sim vitals monitor.

Authoritative plan: `../pi-sim/.omx/plans/plan-pulse-live-vitals-monitor.md`.

## Boundary

`pi-monitor` consumes public telemetry from `pi-sim/vitals/current.json` and writes no chart truth. It does not import `pi-agent`, `pi-sim/scripts`, or `pi-sim/pulse`. Future EHR/chart persistence must be a separate adapter.

## Run

```bash
cargo run -p monitor-cli -- render --source ../pi-sim/vitals/current.json
cargo run -p monitor-cli -- render --source ../pi-sim/vitals/current.json --html /tmp/pi-monitor.html
cargo run -p monitor-cli -- watch --source ../pi-sim/vitals/current.json
cargo run -p monitor-cli -- replay --fixture fixtures/stable-current.json --fixture fixtures/alarming-target.json
```

The watcher uses native filesystem notifications with a polling fallback. M1 is numeric-first. If waveform samples are absent, the UI renders an explicit `waveform feed unavailable` panel rather than faking ECG/pleth/capnogram.
