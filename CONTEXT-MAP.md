# Context Map

`pi-rn` is an umbrella workspace for a bounded clinical-agent harness. Read this file first, then read only the subproject `CONTEXT.md` files and ADRs relevant to the task.

## Contexts

| Area | Context file | ADR authority | Primary role |
| --- | --- | --- | --- |
| `pi-agent/` | `pi-agent/CONTEXT.md` | Create `pi-agent/docs/adr/` when agent-specific decisions need durable records | Clinician-agent workspace and future bounded/containerized runtime |
| `pi-chart/` | `pi-chart/CONTEXT.md` | `pi-chart/docs/adr/` | Chart/EHR truth substrate and durable clinical memory |
| `pi-monitor/` | `pi-monitor/CONTEXT.md` | `pi-monitor/docs/adr/` | Display-only monitor for public telemetry |
| `pi-sim/` | `pi-sim/CONTEXT.md` | `pi-sim/docs/adr/` | Hidden patient simulation runtime and public telemetry producer |

## Boundary map

```text
pi-sim hidden runtime
  └─ public telemetry contract: pi-sim/vitals/README.md + pi-sim/vitals/.lanes.json
       ├─ pi-monitor reads display-only telemetry
       ├─ pi-chart may ingest public telemetry into chart truth through explicit adapters
       └─ pi-agent may read only explicitly exposed clinical/public surfaces

pi-chart chart/EHR truth
  └─ append-only, provenance-rich patient records exposed through its public read/write APIs

pi-agent bounded workspace
  └─ must not import or inspect pi-sim hidden internals when acting as the clinical agent
```

## Which context to read

- **Agent/runtime boundary work:** read `pi-agent/CONTEXT.md`, then public contract docs such as `pi-sim/vitals/README.md` only if the task touches exposed telemetry.
- **Chart/EHR or clinical memory work:** read `pi-chart/CONTEXT.md` and relevant `pi-chart/docs/adr/*`; if telemetry ingestion is involved, also read `pi-sim/vitals/README.md`.
- **Monitor/display work:** read `pi-monitor/CONTEXT.md`, relevant `pi-monitor/docs/adr/*`, and `pi-sim/vitals/README.md`.
- **Simulator/provider/scenario work:** read `pi-sim/CONTEXT.md`, relevant `pi-sim/docs/adr/*`, and public contract fixture docs when changes affect consumers.
- **Cross-subproject changes:** read each touched subproject context and the producer/consumer boundary docs before editing.

## Issue workflow

Matt Pocock engineering skills use one root issue workflow for this umbrella repo:

- Issues and PRDs live under root `.scratch/<feature>/`.
- Triage status uses the default strings in `docs/agents/triage-labels.md`.
- Do not create duplicate `docs/agents/*` configuration under subprojects unless a subproject becomes a separate workflow/repo.

## Decision rules

- Prefer the narrowest owning subproject for new ADRs.
- Cross-cutting decisions should live with the subproject that owns the invariant, with links to affected contexts.
- Public contracts belong producer-side. For simulator telemetry, `pi-sim/vitals/README.md` and `.lanes.json` are the authority.
- Consumer fixtures are regression evidence, not a second source of truth.
