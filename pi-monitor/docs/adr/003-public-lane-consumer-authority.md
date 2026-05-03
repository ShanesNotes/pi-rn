# ADR-0003 — Public Lane Consumer Authority

Status: Accepted
Date: 2026-05-03

## Decision

`pi-monitor` is a display-only consumer of `pi-sim` public telemetry. Durable public contract authority remains producer-side in `../pi-sim/vitals/README.md` and `../pi-sim/vitals/.lanes.json`.

ADR-0002 remains valid as the M2 backward-compatible `current.json` extension decision, but it is extended by this ADR:

- Public JSON lanes under `../pi-sim/vitals/` are the durable ABI for monitor-style consumers.
- `--source-dir <vitals-dir>` is the preferred complete public-lane mode when the monitor should read status, events, encounter, assessment, timeline, and waveform lanes.
- `--source <current.json>` remains a backward-compatible single-file mode.
- `live-tcp` / private TCP is localhost/private/non-durable display transport mirroring public envelopes.
- TCP is not chart truth and not contract authority.
- `pi-monitor` must not write chart/EHR truth or hidden simulator state.

## Drivers

- `pi-monitor` currently supports public source-directory ingest and private live TCP in addition to single-file `current.json` compatibility.
- ADR-0002 intentionally limited the M2 boundary before public-lane adoption evidence existed.
- The monitor must be useful for live display without becoming the chart/EHR authority or learning hidden simulator internals.

## Consequences

- Future monitor work should target public JSON lanes first and treat fixtures as regression evidence, not authority.
- Private TCP work must preserve localhost/private/non-durable semantics and must not become a required contract for chart/agent consumers.
- `pi-monitor` documentation must describe display-only as “no chart truth and no hidden sim writes,” not “no attention/alarm surfaces.”
- Any replacement monitor implementation must satisfy the same public-lane consumer authority.

## Alternatives considered

- Keep `current.json` as the only public monitor boundary: rejected because source-directory public-lane ingest is now implemented and documented.
- Promote TCP to public ABI: rejected because it weakens file-first integration and durability.
- Let `pi-monitor` feed chart truth: rejected because `pi-chart` owns chart/EHR truth and needs explicit provenance/idempotency/write policy.

## Verification

- Boundary scans must show no `pi-monitor` imports from `pi-sim/scripts`, `pi-sim/pulse`, or hidden provider internals.
- Boundary scans must show no chart/EHR writes from `pi-monitor` crates.
- `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- -D warnings`, and `cargo test --workspace` must pass after monitor changes.
