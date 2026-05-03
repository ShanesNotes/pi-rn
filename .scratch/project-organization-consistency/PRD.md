# PRD: Project Organization Consistency and Planning-Surface Deepening

Status: needs-triage
Owner: workspace
Date: 2026-05-03

## Problem Statement

`pi-rn` is now a multi-context clinical-agent harness with strong domain boundaries, but the organization and planning surfaces are still uneven. Active Matt-skill work lives under `.scratch`, OMX runtime state lives under `.omx`, accepted decisions live under subproject `docs/adr/`, and canonical domain docs live in `CONTEXT.md`/README-style surfaces. Historical plan docs, memos, old ADR paths, root `PLANNING.md`, and subproject-specific indexes can still look authoritative to a fresh coding agent.

The result is high orientation cost and inconsistent follow-through: an agent can understand the high-level architecture, then lose locality when drilling into ADRs, PRDs, and issue slices. The project needs one deep project work-surface module that concentrates organization rules behind a small interface and then applies those rules fractally to each subproject.

## Solution

Create a durable organization-consistency lane that uses the existing Matt Pocock work-surface model as the interface:

- Root `CONTEXT-MAP.md` explains context selection and cross-subproject seams.
- Root `docs/agents/*` explains how agents choose `.scratch`, `.omx`, `docs/adr/`, and canonical docs.
- Active organization work lives in this `.scratch/project-organization-consistency/` PRD and issue set.
- Each subproject keeps domain authority in its own `CONTEXT.md` and `docs/adr/`.
- Historical plans/memos remain evidence unless an active PRD or accepted ADR names them as current inputs.
- ADR, PRD, and issue polish happens in small, reviewable slices with explicit verification checks.

The first deepening target is the **Project work-surface module**. After it is stable, downstream lanes can deepen the **Public telemetry contract module**, `pi-sim` provider-runtime module, `pi-monitor` ingest module, and `pi-chart` validation/V0.5 salvage module.

## User Stories

1. As a fresh coding agent, I want one read order for the workspace, so that I do not mine stale planning files before understanding the current seams.
2. As a maintainer, I want `.scratch`, `.omx`, `docs/adr/`, and canonical docs to have distinct responsibilities, so that planning work does not become doc sprawl.
3. As a subproject owner, I want ADRs to use the same filename/status style, so that durable decisions are easy to compare across `pi-chart`, `pi-monitor`, and `pi-sim`.
4. As a reviewer, I want active PRDs and issue slices to cite the evidence they promote, so that old plans remain provenance rather than hidden authority.
5. As an implementation agent, I want issues to be independently grabbable tracer bullets, so that I can complete one polish path without re-planning the whole repo.
6. As a clinical-memory architect, I want `pi-chart` V0.5 work to remain separated from simulator and monitor implementation, so that chart truth does not inherit hidden simulator assumptions.
7. As a simulator maintainer, I want `pi-sim/vitals/README.md` plus `.lanes.json` to stay the public telemetry authority, so that sibling consumers do not invent their own ABI.
8. As a display maintainer, I want `pi-monitor` ADRs and docs to consistently state display-only/public-lane authority, so that monitor work does not drift into chart truth or simulator internals.
9. As an agent-runtime maintainer, I want `pi-agent` docs to make mounted/exposed surfaces explicit, so that future bounded runtime work does not rely on files the agent should never see.
10. As a human operator, I want a clean issue queue for organization polish, so that future implementation lanes can start from reviewed scope.

## Implementation Decisions

- Treat **Project work-surface module** as the first deepening opportunity. Its interface is the read order and promotion ladder, not a new code package.
- Do not create another root planning scratchpad. This PRD and its issues are the active work surface for this lane.
- Keep root `PLANNING.md` historical/transitional unless a later issue archives or replaces it through an explicit review.
- Do not bulk-move or delete historical files in this lane. Banner first, archive only after a follow-up issue records where useful content went.
- Preserve producer-side public telemetry authority in `pi-sim/vitals/README.md` and `.lanes.json`.
- Preserve subproject ownership: `pi-sim` owns hidden patient runtime and public telemetry production; `pi-monitor` owns display-only consumption; `pi-chart` owns chart/EHR truth; `pi-agent` owns bounded clinician-agent workspace.
- Use Matt issue statuses (`needs-triage`, `ready-for-agent`, `ready-for-human`, `wontfix`) in each local issue file.
- Use HITL only where the issue changes durable authority, archives files, or reopens an accepted decision. Prefer AFK for audit, banner, index, and consistency checks.

## Testing Decisions

- Organization polish is verified with structural checks: file existence, no stale active-authority phrases, ADR filename/status audits, and issue-status consistency.
- ADR/PRD/issue slices should test external behavior of the documentation surface: a fresh agent can find current authority without reading `.omx` or stale plan folders.
- Public telemetry contract follow-up must include producer/consumer compatibility checks rather than prose-only assertions.
- Source-code refactors are out of scope until their PRDs/issues define behavior tests through public interfaces.
- Verification evidence should be appended to issue comments or final handoff when a slice completes.

## Out of Scope

- Source-code refactors in `pi-sim`, `pi-monitor`, or `pi-chart`.
- Creating `pi-rn/ingest/`.
- Bulk deleting, moving, or rewriting historical planning files.
- Changing the accepted clinical truth model in `pi-chart`.
- Changing public telemetry schema semantics without a dedicated ABI-lock PRD/issues lane.
- Changing runtime skill installation or symlink topology beyond documentation consistency.

## Further Notes

Ranked deepening opportunities from the zoomed-out pass:

1. Project work-surface module.
2. Public telemetry contract module.
3. `pi-sim` provider-runtime module.
4. `pi-monitor` ingest module.
5. `pi-chart` validation / V0.5 salvage module.

Primary evidence:

- `CONTEXT-MAP.md`
- `docs/agents/work-surface.md`
- `docs/agents/skill-interoperability.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/domain.md`
- `pi-sim/CONTEXT.md`
- `pi-monitor/CONTEXT.md`
- `pi-chart/CONTEXT.md`
- `pi-agent/CONTEXT.md`
- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`
- `.scratch/pi-sim-rebase-grounding/PRD.md`
- `.scratch/pi-chart-v0-5/PRD.md`
