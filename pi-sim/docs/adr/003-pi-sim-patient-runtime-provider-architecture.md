# ADR 003 — pi-sim patient runtime and provider architecture

Date: 2026-04-27
Status: accepted
Extends: `docs/adr/002-pi-sim-as-patient-three-stream-topology.md`
Plan authority: `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`

## Decision

`pi-sim` is a scenario-driven hidden patient simulation runtime. It owns the encounter definition, canonical simulation clock, hidden patient state, scenario timeline, physiology progression, latent assessment findings, validation checkpoints, and public telemetry publication.

Pulse is a physiology provider/backend behind a provider boundary. It is valuable for acute physiology, drug response, and validation, but it is not the architecture center and is not the only possible source of vitals. The current Docker/Python/CSV shim is a legacy/current Pulse provider implementation and reference surface until it is wrapped, replaced, or retired behind a cleaner provider interface.

`pi-monitor`, `pi-chart`, and `pi-agent` remain separated consumers:

- `pi-monitor` owns live display and consumes public telemetry only.
- `pi-chart` owns clinical memory/chart truth and receives telemetry through an explicit adapter, not through monitor internals.
- `pi-agent` sees only explicit clinical interfaces and must not import hidden `pi-sim` source, Pulse internals, or scenario secrets.

## Context

The project split `pi-monitor` into a sibling Rust/native display subsystem. That makes the old `pi-sim` monitor-centric docs and PySide in-repo monitor plans misleading. ADR 002 already established that `pi-sim` is the patient rather than the monitor and that Pulse is an optional injector/backend. This ADR makes that direction durable and turns it into the controlling architecture lens for future `pi-sim` work.

Current implementation reality still matters:

- `scripts/monitor.ts` writes public scalar frames to `vitals/current.json` and `vitals/timeline.json`.
- `vitals/current.json` has a backward-compatible `monitor` extension for display metadata.
- The current Pulse shim emits scalar vitals only; it does not expose real waveform samples.
- The existing Pulse shim captures useful mappings, action payloads, baked-state procedures, and validation lessons that should be salvaged into the provider layer.

## Drivers

1. Keep the hidden-patient model clear after the standalone monitor split.
2. Avoid hard-locking the whole simulator to Docker, per-request subprocesses, CSV parsing, or scalar-only Pulse output.
3. Preserve truthful telemetry: no fake runtime waveforms or hidden monitor-owned physiology masquerading as clinical truth.
4. Give charting, display, validation, and agent seams one canonical clock and event model.
5. Prevent future agents from following obsolete PySide-monitor-first, shim-first, or chart-display-first plans.

## Alternatives considered

| Alternative | Decision | Rationale |
|---|---|---|
| Extend the current TypeScript harness and Python shim as the permanent architecture | Rejected as final architecture | Lowest short-term cost, but keeps the shim-first mental model, scalar limitation, Docker/subprocess/CSV constraints, and stale monitor assumptions at the center. |
| Make Pulse the authoritative global runtime | Rejected | Pulse is useful but currently scalar-only in this integration; over-centralizes around a difficult backend and conflicts with ADR 002's optional-provider framing. |
| Move simulation into `pi-monitor` | Rejected | Collapses display and patient truth; monitor must stay display-only. |
| Move simulation into `pi-chart` | Rejected | Leaks hidden patient state into chart truth and undermines partial observability. |
| Provider-based patient runtime | Accepted | Cleanest boundary, aligns with ADR 002, preserves Pulse where valuable, and supports scripted, fixture, Pulse, and future waveform-capable providers. |

## Why chosen

A provider-based patient runtime is the simplest architecture that preserves the project’s clinical simulation goals without letting an implementation detail become the system shape. It lets `pi-sim` publish stable public telemetry while changing how physiology is produced behind the boundary.

## Consequences

- New `pi-sim` implementation plans should start from this ADR and the patient-runtime plan.
- Pulse-specific files remain implementation/provider notes, not global architecture authority.
- Old PySide monitor and pulse-live-vitals-display plans are superseded or archived.
- Runtime waveform support must come from a public waveform/event lane or a provider that truly emits samples; display code must show unavailable states rather than inventing clinical truth.
- Future chart/EHR adapters must consume explicit public telemetry and must not constrain `pi-monitor` display fidelity.

## Follow-ups

1. Create a separate PRD/test-spec for the first patient-runtime skeleton: canonical clock, scenario loader, provider trait, and file publisher.
2. Design public waveform/event lanes only after confirming the provider can produce truthful samples or clearly labeled fixtures.
3. Wrap the current Pulse shim as a provider or replace it with a cleaner Pulse integration after preserving mappings, action schemas, baked-state flows, and validation evidence.
4. Consider deleting or moving `monitor-ui/` implementation code only in a separate cleanup lane; this ADR only marks it historical.
