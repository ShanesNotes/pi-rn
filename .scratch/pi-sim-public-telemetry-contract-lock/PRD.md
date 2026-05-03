# PRD: pi-sim public telemetry contract lock

Status: needs-triage
Owner: pi-sim
Date: 2026-05-03

## Problem Statement

`pi-sim` already exposes a useful public telemetry Interface under `pi-sim/vitals/`, and sibling Modules are beginning to align around it. The next architecture-deepening step is to lock the producer-owned public contract before `pi-monitor` hardens consumers, `pi-chart` designs telemetry ingestion, or `pi-agent` reads public clinical surfaces.

Without a dedicated `.scratch` lane, future agents may treat historical `.omx/plans`, legacy monitor paths, or fixture examples as the ABI authority. That would reduce Locality and risk leaking hidden simulator Implementation details into consumers.

## Solution

Create a contract-lock planning lane that treats `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` as the producer-side authority and defines consumer-facing checks before any schema semantics change.

This PRD seeds the lane only. It does not change public telemetry JSON schemas, create `pi-rn/ingest/`, or edit hidden `pi-sim` runtime code.

## User Stories

- As a `pi-monitor` agent, I can validate display-only reads against the public telemetry contract without importing hidden `pi-sim` internals.
- As a future `pi-chart` ingest agent, I can see which public lanes are stable enough for an explicit adapter and which chart-write policies remain undecided.
- As a `pi-sim` maintainer, I can distinguish producer ABI authority from regression fixtures and historical OMX lineage.
- As a `pi-agent` boundary reviewer, I can confirm any exposed telemetry surface is intentionally public and not hidden simulator truth.

## Implementation Decisions

- Producer authority stays in `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json`.
- Fixtures under `pi-sim/vitals/fixtures/public-contract/**` are consumer regression evidence, not a second source of truth.
- `pi-monitor` checks should verify display-only consumption and no chart/EHR writes.
- Future ingest planning should name the adapter seam, provenance/idempotency questions, and chart-write policy gaps, but `pi-rn/ingest/` stays deferred until the ABI lock is accepted.
- Hidden `pi-sim` internals (`scripts/`, providers, scenario secrets, validation evidence, latent findings) are outside consumer scope.

## Testing Decisions

- Start with docs/fixture/manifest checks, not source refactors.
- Verify `.lanes.json` lane names, paths, schema versions, write semantics, reset semantics, producers, and preferred consumer modes are covered by README prose or explicit test expectations.
- Verify `pi-monitor` can be tested against public fixtures without `pi-chart` or hidden `pi-sim` imports.
- Future ingest issues must include chart authority checks before any chart writes are allowed.

## Out of Scope

- Changing telemetry schema semantics.
- Implementing `pi-rn/ingest/`.
- Modifying hidden provider/runtime Implementation.
- Adding `pi-chart` chart writes.
- Exposing hidden simulator state to `pi-agent`.

## Further Notes

Primary evidence:

- `CONTEXT-MAP.md` Seam matrix.
- `pi-sim/CONTEXT.md` public contract authority section.
- `pi-sim/vitals/README.md`.
- `pi-sim/vitals/.lanes.json`.
- `pi-monitor/CONTEXT.md` display-only boundary.
- `pi-chart/CONTEXT.md` Observable charting seam.
