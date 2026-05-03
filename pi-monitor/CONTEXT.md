# pi-monitor Context

`pi-monitor` is the standalone Rust/native display-only monitor for `pi-sim` public telemetry.

## Domain role

- Reads public telemetry files or streams and renders monitor/display views.
- Owns display modeling, freshness/alarm/numeric/waveform rendering, CLI smoke output, and native kiosk behavior.
- Does not own chart/EHR truth and does not mutate simulator state.

## Hard boundaries

- Read public JSON/JSONL telemetry only.
- Do **not** import `pi-sim/scripts`, `pi-sim/pulse`, provider internals, hidden scenario truth, `pi-agent`, or `pi-chart` internals.
- Do **not** write `vitals.jsonl`, chart/EHR records, or patient truth.
- Treat `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json` as producer-side public contract authority.
- Treat mirrored files under `fixtures/public-contract/**` as regression fixtures only.

## Core language

- **Display-only**: monitor output is presentation, not chart truth.
- **Public telemetry lane**: documented producer-owned file/stream surface under `pi-sim/vitals/`.
- **Freshness**: display state derived from timestamp/sequence/run-state semantics, not hidden provider state.
- **Waveform availability**: explicit public status; do not silently synthesize production clinical waveforms.

## ADR authority

Read `pi-monitor/docs/adr/` before changing public-lane consumption, display-only scope, source compatibility, or Rust/native monitor architecture.

## Verification entrypoints

Typical checks live in `pi-monitor/README.md`:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace
```
