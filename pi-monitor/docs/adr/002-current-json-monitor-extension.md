# ADR-0002 — Backward-compatible current.json monitor extension

## Decision

Keep `pi-sim/vitals/current.json` as the single public live-monitor boundary for M2 and add an optional `monitor` object for display-grade metadata and future bounded waveform sample windows.

## Drivers

- Existing consumers rely on top-level scalar fields in `current.json`.
- `pi-monitor` needs sequence, run state, event, rhythm, and waveform semantics to behave like a bedside display.
- Display remains separate from chart/EHR truth; no `vitals.jsonl` writes belong in this path.
- Hidden simulator internals must remain hidden from sibling projects.

## Consequences

- Top-level scalar keys remain backward-compatible.
- Legacy readers can ignore `monitor`.
- The current Pulse shim is scalar-only, so live `monitor.waveforms` is absent until a future public publisher exposes real samples.
- Fixture waveform data can exercise the renderer without claiming synthetic physiology as runtime truth.

## Alternatives considered

- Separate `vitals/waveforms.jsonl`: better streaming throughput but expands the public boundary before evidence requires it.
- Socket/IPC: lower latency but adds runtime coordination and weakens the file-first integration contract.
- Synthetic runtime waveforms from scalars: quick visual win, but not simulation-grade truth.
- Embedding in pi-chart: mixes monitor presentation with EHR/chart concerns.
