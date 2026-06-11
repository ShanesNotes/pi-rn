# Public lane eligibility and negative boundaries

Status: readiness memo (not chart authority)
Parent: `.scratch/observable-charting-adapter-readiness/PRD.md`

## Primary replay and trigger lanes

| Lane | Posture | Adapter use |
| --- | --- | --- |
| `timeline.jsonl` | **Primary scalar replay source** | Durable append-friendly history for retrospective minute-level selection. |
| `events.jsonl` | **Trigger/context source** | Public alarms may trigger v1 auto-staging; other public events annotate context only. |

## Context and mapping-support lanes (not chart truth alone)

| Lane | Posture |
| --- | --- |
| `status.json` | Run/freshness context only |
| `encounter/current.json` | Public encounter context; supports explicit mapping, not heuristic identity |
| `assessments/status.json` | Reveal/request context only |
| `assessments/current.json` | Reveal-safe assessment context only |

## Smoke, compatibility, and deferred lanes

| Lane | Posture |
| --- | --- |
| `current.json` | Smoke/read-latest only; not durable ingest authority |
| `timeline.json` | Deferred compatibility array; prefer `timeline.jsonl` |
| `waveforms/status.json` | Deferred for chart ingest; may flag availability later |
| `waveforms/current.json` | Deferred; preserve future sub-minute/artifact review path |

## Forbidden inputs

- Hidden `pi-sim` scripts, providers, Pulse internals, validation-only evidence, latent findings, scoring keys, scenario secrets, future schedules
- `pi-monitor` display internals as chart authority
- Raw chart files or brownfield patient directories as ingest source
- `pi-agent` private reasoning or hidden context as source telemetry

## Implementation gate

No `pi-rn/ingest/` directory, adapter code, chart writes, or `pi-chart` ADR promotion in this readiness lane.