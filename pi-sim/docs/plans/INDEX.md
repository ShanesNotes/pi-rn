# pi-sim Plans Index

Current pi-sim planning-classification surface: `007-authority-ledger-and-ai-alignment-roadmap.md`.

Use this index to avoid reviving historical plans. ADRs decide architecture; root `.scratch/<feature>/` holds active Matt-skill PRDs/issues; this directory explains plan lineage.

## Current

| File | Use |
|---|---|
| `007-authority-ledger-and-ai-alignment-roadmap.md` | Current authority ledger, Claude/Codex synthesis, roadmap, and verification gates for AI-agent alignment. |
| `000-vitals-triad-prd-index.md` | Historical triad PRD index, extended by `007`; keep for lineage until future archive move. |

## Historical / superseded lineage

| File | Status | Successor / note |
|---|---|---|
| `001-ultraplan-pi-rn-substrate.md` | historical | Superseded by ADR-002/ADR-003 and the 007 ledger. |
| `002-pulse-pivot.md` | superseded | Pulse is now one provider behind the provider runtime. |
| `003-monitor-ui.md` | superseded | Native `pi-monitor/` owns current display work. |
| `004-vitals-telemetry-bridge.md` | tombstoned | Replaced by future explicit `pi-rn/ingest/` lane after authority/ABI lock. |
| `004a-architecture-review-26042026.md` | tombstoned | Lineage for PRD 004 only. |
| `005-alarm-channel.md` | tombstoned | Alarm/attention semantics must be re-specified through public lanes. |
| `006-assessment-query.md` | tombstoned | Assessment query work must preserve hidden-patient/public-lane boundary. |

## Rule for new plans

Do not use this directory as the active issue tracker. For new work, create or update root `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`, then add ADR-backed durable decisions or classification notes here only after the active surface is clear.
