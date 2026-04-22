# Clinical Agent Substrate — Historical Draft

## Status

This document is an archival planning draft from an earlier phase when the simulator, chart surface, and agent workspace were less clearly separated.

It is kept for research history only. It does **not** define the current repository architecture.

**Superseded by** `002-pulse-pivot.md`, which replaces the original DIY TypeScript physiology engine with the Kitware Pulse Physiology Engine in a Docker sidecar.

## Current architectural direction

The project is now separating into bounded subprojects under `~/pi-rn/`:

```text
pi-agent/   clinician-facing workspace and runtime context
pi-chart/   chart / EHR surface or backend
pi-sim/     hidden patient simulation backend
```

## Current boundary principles

1. `pi-sim/` owns patient-state generation, physiology, monitoring, and validation.
2. `pi-sim/` should describe its outputs and schemas, not agent-specific runtime details.
3. `pi-agent/` should consume simulation data only through explicit interfaces.
4. `pi-sim/` source code should stay outside the agent runtime context.
5. `pi-chart/` may evolve into a more realistic charting or persistence layer over time.

## Why this file remains

This draft captured useful early questions about:

- what belongs in the clinician workspace context
- what should remain hidden behind system boundaries
- how to stage the build from simple file-based integrations to more realistic interfaces

Those questions still matter, but the implementation details in the original draft were tied to an earlier harness design and should not be treated as current guidance.

## If this plan is revived later

Any new plan should be written in terms of:

- simulator outputs
- chart interfaces
- runtime boundaries
- container/mount isolation
- context exposure rules

and should avoid coupling simulator documentation to any particular agent framework.
