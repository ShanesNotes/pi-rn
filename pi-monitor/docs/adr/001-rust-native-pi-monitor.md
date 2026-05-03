# ADR-0001 — Rust-native standalone pi-monitor

## Decision

Build `pi-monitor` as a standalone display-only Rust/native monitor subsystem with a public-frame schema crate, deterministic monitor core, read-only ingest, renderer package, and CLI/fixture replay path.

## Drivers

- The authoritative plan in `../pi-sim/.omx/plans/plan-pulse-live-vitals-monitor.md` settles Rust/native direction.
- The live monitor must be independent from EHR/chart truth and must not write `vitals.jsonl`.
- The monitor must read only public `current.json` telemetry and avoid hidden `pi-sim` internals.

## Consequences

- Current lowercase scalar frames are supported through an explicit compatibility adapter.
- Target Pulse-native frames are supported alongside the compatibility format.
- UI rendering is fed by a renderer-independent display model.
- A future Tauri/native shell can consume the same core/model without changing ingest or schema contracts.
