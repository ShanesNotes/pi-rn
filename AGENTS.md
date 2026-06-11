# pi-rn

Parent workspace for a bounded clinical-agent harness.

Read `CONTEXT-MAP.md` first, then this file and the subproject `CONTEXT.md` relevant to your task.

## Subprojects

- `pi-agent/` — Pi-based agent workspace
- `pi-chart/` — chart/EHR subsystem
- `pi-ledger/` — reusable cryptographic claim-ledger kernel
- `pi-monitor/` — display-only monitor for public telemetry
- `pi-sim/` — hidden patient simulation subsystem

## Boundary intent

The long-term goal is to run `pi-agent/` in a container so it only sees its own mounted context plus explicitly exposed interfaces.

Do not couple `pi-agent/` directly to `pi-sim/` source code. Do not couple `pi-ledger/` to `pi-chart` brownfield source, patient directories, generated UI artifacts, or hidden `pi-sim`; `pi-chart` should consume `pi-ledger` through explicit adapters after the kernel Interface is proven.

`pi-monitor/` is a display-only consumer of `pi-sim` public telemetry. `pi-chart` must not depend on `pi-monitor`; ingest public lanes through explicit chart adapters instead.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `CONTEXT-MAP.md` at root pointing at per-subproject `CONTEXT.md` files; per-subproject `docs/adr/` for context-scoped decisions. See `docs/agents/domain.md`.

## Shared agent work surface

Use root `.scratch/` for durable cross-agent PRDs, issues, triage state, and handoffs. Treat `.omx/` as OMX runtime-specific state; mirror durable decisions or handoffs into `.scratch/<feature>/` when Claude Code, Codex, Pi, or humans all need to see them. See `docs/agents/work-surface.md` and `docs/agents/skill-interoperability.md`.
