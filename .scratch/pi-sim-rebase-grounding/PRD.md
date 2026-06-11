# pi-sim Rebase Grounding

Status: completed
Owner: pi-sim
Date: 2026-05-03

## Problem Statement

`pi-sim` has useful planning and ADR additions from the prior OMX/RALPLAN pass, but some language still treats root `PLANNING.md` and `.omx/plans/` as active planning surfaces. Commit `fa7b278` established the shared Matt Pocock skill workflow: active PRDs and issue slices live under root `.scratch/<feature>/`, while `.omx/` remains runtime state and `docs/plans/` remains provenance/classification unless an ADR names a durable decision.

Fresh coding agents need one pi-sim-focused rebase grounding surface that preserves the public telemetry authority and avoids touching sibling internals during the planning reconciliation.

## Solution

Reconcile the pi-sim planning additions so they follow the shared work-surface model:

- Root `CONTEXT-MAP.md` plus `docs/agents/*` define cross-agent workflow and work-surface routing.
- `pi-sim/CONTEXT.md` and `pi-sim/docs/adr/` define domain language and durable simulator decisions.
- `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` remain the public telemetry contract authority.
- `pi-sim/docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` classifies planning evidence and roadmap order, but does not become the issue tracker.
- New implementation lanes must be promoted into `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` before execution.

## User Stories

- As a fresh AI coding agent, I can read `CONTEXT-MAP.md`, `docs/agents/work-surface.md`, `pi-sim/CONTEXT.md`, and the pi-sim ADRs without mining `.omx/` for active work.
- As a pi-sim maintainer, I can tell which old plans are historical evidence and which future work needs a `.scratch` PRD/issues lane.
- As a sibling project, I can rely on `pi-sim/vitals/README.md` and `.lanes.json` as the producer-side telemetry ABI authority.

## Implementation Decisions

- Do not edit pi-chart internals in this grounding pass; pi-chart may appear only as documented boundary references.
- Do not make root `PLANNING.md` a required active front door. If present, it is transitional lineage only.
- Keep `.omx/plans/*` as evidence/runtime lineage. Mirror any project-relevant implementation intent into `.scratch` before new work starts.
- Keep the next implementation-adjacent lane as public ABI lock, then `pi-rn/ingest/` contract stub after ABI semantics are explicit.

## Testing Decisions

Verify the grounding with docs/boundary checks rather than source behavior changes:

- The pi-sim authority ledger includes all required pi-sim, shared-agent, and documented sibling-reference paths exactly once.
- `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json` remain the stated public contract authority.
- Pi-sim planning docs no longer require root `PLANNING.md` or `.omx/plans/` as the active issue/work surface.
- No pi-chart internals are modified by this pass.

## Out of Scope

- Implementing the public ABI lock.
- Creating `pi-rn/ingest/`.
- Moving or deleting historical `.omx/plans/` artifacts.
- Renaming or editing pi-chart internals.

## Further Notes

This PRD is the Matt-skill-compatible durable handoff for the pi-sim rebase grounding. Future implementation breakdown should use `.scratch/<feature>/issues/*.md` with tracer-bullet slices.
