# Public contract fixtures

These fixtures mirror example outputs from `../pi-sim/vitals/fixtures/public-contract/**` plus one monitor-only stale waveform mismatch case.

Authority stays in the producer contract: `../pi-sim/vitals/README.md` and `../pi-sim/vitals/.lanes.json`. These files are regression inputs for `pi-monitor`; they are not the ABI source of truth.

`pi-monitor` must consume these files as public JSON artifacts only. Do not import `pi-sim/scripts`, `pi-sim/pulse`, `pi-agent`, or `pi-chart`. Monitor output is display-only and must not write chart/EHR records.

Cases:

- `scripted-demo/` — normal scripted run with encounter and revealed assessment context.
- `scripted-alarm/` — alarm lane containing `MAP_LOW` and `SPO2_LOW`.
- `provider-unavailable/` — terminal provider-unavailable run state.
- `available-waveform/` — positive ECG Lead II + pleth demo waveform-current fixture accepted for display, mirrored from `pi-sim` live demo output.
- `stale-waveform/` — monitor-only invalid waveform-current/status mismatch; current waveform must be ignored with a warning.
