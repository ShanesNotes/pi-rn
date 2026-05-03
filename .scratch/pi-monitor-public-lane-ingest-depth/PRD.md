# PRD: pi-monitor public-lane ingest depth

Status: needs-triage
Owner: pi-monitor
Date: 2026-05-03

## Problem Statement

`pi-monitor` already consumes `pi-sim` public telemetry through single-file `current.json`, full public source-directory ingest, JSONL tailing, fixture replay, native app source-directory mode, and private localhost TCP. ADR-0003 accepts the important boundary: `pi-monitor` is a display-only consumer, while durable public contract authority stays producer-side in `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json`.

The remaining architecture work is not to reopen authority or make monitor output chart truth. It is to deepen the `pi-monitor` ingest Module so future agents can reason locally about transport Adapters, public lane parsing, freshness/alarm/waveform display semantics, and verification without scattering decisions across CLI/app call sites or treating fixtures as the ABI.

## Solution

Create a planning lane for hardening `pi-monitor` public-lane ingest behind ADR-0003. The lane keeps source changes out of this scratch artifact and slices future work into reviewable issues that preserve display-only consumer authority.

The target shape is:

- `pulse-public-frame` remains the public envelope/schema parsing crate for latest-frame, lane manifest, status, event, encounter, assessment, and waveform models.
- `monitor-ingest` owns read-only transport Adapters and source normalization for `current.json`, `--source-dir <vitals-dir>`, JSONL tailing, replay fixtures, and private localhost TCP.
- `monitor-core` owns a stable display Interface: freshness, alarms, numeric values, waveform availability, public context notes, offline/invalid states, and explicit “not charted” messaging.
- CLI/app call sites select exactly one Adapter mode and do not become separate schema authorities.
- Regression fixtures mirror producer examples as evidence only; contract authority remains `pi-sim/vitals/README.md` plus `.lanes.json`.

## User Stories

- As a monitor maintainer, I can add or adjust a public lane parser without touching CLI/app selection logic or chart-adjacent code.
- As a downstream display implementer, I can consume a stable monitor-core display model without learning hidden `pi-sim` runtime details.
- As a contract reviewer, I can run boundary scans proving `pi-monitor` reads public JSON/JSONL only and writes no chart/EHR truth.
- As a future replacement monitor agent, I can see which transport modes are durable public contract inputs and which are compatibility or private display transports.
- As a QA agent, I can validate source-directory ingest against producer public fixtures and monitor-only stale-lane cases without promoting fixtures to ABI authority.

## Ingest Responsibility Inventory

| Area | Current responsibility | Deepening target |
| --- | --- | --- |
| `pulse-public-frame` | Parses `current.json`, monitor extension, lane manifest, public events, run status, encounter, assessment, and waveform lane models. | Keep schema parsing and validation here; avoid CLI/app-specific interpretations; add tests when producer lane versions or optional-field rules change. |
| `monitor-ingest` | Reads single files, public vitals directories, JSONL frame tails, fixture directories, native watch/poll sources, and private TCP frames; applies public lane context to frames. | Make Adapter boundaries explicit: durable file lanes, compatibility latest-frame, append-friendly JSONL tail, replay fixtures, and private TCP mirror. Preserve read-only behavior and lane warnings. |
| `monitor-core` | Converts accepted frames/events into deterministic display state with freshness/alarm/numeric/waveform/offline/invalid behavior and non-chart footer text. | Treat display model fields as the stable Interface consumed by terminal, HTML, and native UI. Do not encode chart truth, patient truth, hidden provider state, or write semantics. |
| `monitor-cli` | Exposes `render`, `watch`, `replay`, `replay-dir`, `tail-jsonl`, and `live-tcp`; enforces one source mode at a time. | Keep command parsing as Adapter selection only; add smoke coverage for source-dir, JSONL tail, and private TCP boundaries without schema authority drift. |
| `monitor-app` | Exposes native `--source`, `--source-dir`, `--fixture-replay`, `--fixture-dir-replay`, and `--live-tcp` display modes. | Keep app parity with CLI Adapter semantics and display-only footer; avoid app-specific hidden-lane reads or chart writes. |
| `fixtures/public-contract/**` | Mirrors producer fixture cases plus monitor-only stale waveform mismatch case for regression. | Use as regression evidence only. Producer ABI remains `pi-sim/vitals/README.md` and `.lanes.json`. |

## Implementation Decisions

- ADR-0003 is a constraint, not a work queue: `pi-monitor` stays a display-only consumer of `pi-sim` public telemetry.
- `--source-dir <vitals-dir>` is the preferred complete public-lane mode for status, events, encounter, assessment, timeline, and waveform lanes.
- `--source <current.json>` remains backward-compatible single-file mode.
- JSONL tailing is a display Adapter for append-friendly frame history, not a chart replay authority.
- Private `live-tcp` remains localhost/private/non-durable display transport that mirrors public envelopes. It is not public ABI and not chart truth.
- CLI and native app source selectors must reject ambiguous multi-source combinations.
- Boundary scans are first-class verification for this lane because the product risk is authority drift, not just parser correctness.

## Testing Decisions

Future implementation issues must name fresh verification evidence before completion:

```bash
cd pi-monitor
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py
```

Additional issue-local checks should cover:

- `monitor-cli replay-dir` against public producer fixture directories.
- `monitor-cli render --source-dir` against complete public-lane fixtures.
- stale or mismatched waveform-current/status behavior with monitor-only regression fixtures.
- source selector errors when more than one source mode is supplied.
- boundary scans for hidden `pi-sim` imports, `pi-agent`/`pi-chart` coupling, producer writes, chart/EHR writes, and `vitals.jsonl` writes.

## Out of Scope

- Changing `pi-sim` public telemetry schema semantics.
- Moving contract authority from `pi-sim/vitals/README.md` or `.lanes.json` into `pi-monitor`.
- Writing chart/EHR truth, `vitals.jsonl`, patient truth, or hidden simulator state.
- Importing `pi-sim/scripts`, `pi-sim/pulse`, provider internals, hidden scenarios, latent findings, scoring keys, `pi-agent`, or `pi-chart` internals.
- Promoting private TCP to public ABI.
- Creating a telemetry-to-chart ingest adapter or `pi-rn/ingest/` implementation.
- Treating public fixtures as schema authority instead of regression evidence.

## Initial Issues

1. `issues/01-source-dir-fixture-regression-depth.md` — deepen source-directory fixture coverage without changing public schema authority.
2. `issues/02-boundary-scan-display-only-authority.md` — make display-only/no-hidden-import/no-chart-write scans durable.
3. `issues/03-durable-public-lane-ingest-seams.md` — document and test lane-specific read semantics for complete public directory ingest.
4. `issues/04-transport-adapter-matrix.md` — make Adapter mode boundaries explicit across `current.json`, source-dir, JSONL tail, replay, and private TCP.
5. `issues/05-monitor-core-display-interface.md` — lock the stable display Interface expected by terminal, HTML, and native UI renderers.
6. `issues/06-verification-closeout.md` — collect full monitor verification and regression evidence after implementation slices land.

## ADR Trigger Guidance

Create a future `pi-monitor/docs/adr/004-public-lane-ingest-module-depth.md` only if implementation changes introduce a new externally meaningful ingest Seam, alter public Adapter semantics, or define a replacement-monitor compatibility promise beyond ADR-0003. Do not create an ADR for internal test-only cleanup.

## Further Notes

Primary evidence used for this planning lane:

- `pi-monitor/docs/adr/003-public-lane-consumer-authority.md`
- `pi-monitor/README.md`
- `pi-monitor/CONTEXT.md`
- `pi-monitor/crates/pulse-public-frame/src/lib.rs`
- `pi-monitor/crates/monitor-ingest/src/lib.rs`
- `pi-monitor/crates/monitor-core/src/lib.rs`
- `pi-monitor/crates/monitor-cli/src/main.rs`
- `pi-monitor/crates/monitor-app/src/main.rs`
- `pi-monitor/fixtures/public-contract/README.md`
- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`
- `.scratch/pi-sim-public-telemetry-contract-lock/pi-monitor-public-consumer-checks.md`
