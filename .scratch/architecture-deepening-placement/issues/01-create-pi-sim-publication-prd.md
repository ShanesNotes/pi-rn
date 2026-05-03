# Create pi-sim public telemetry publication Module PRD

Status: needs-triage
Type: AFK

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

Create `.scratch/pi-sim-public-telemetry-publication-module/PRD.md` and initial issue slices for deepening the `pi-sim` public telemetry publication Module. This is a planning lane, not a source-edit lane.

The PRD should treat `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md`, `pi-sim/vitals/README.md`, and `pi-sim/vitals/.lanes.json` as constraints. It should inventory publication responsibilities across `pi-sim/scripts/runtime/provider.ts`, `pi-sim/scripts/runtime/runner.ts`, `pi-sim/scripts/runtime/publisher.ts`, public contract docs, and public contract tests.

## Acceptance criteria

- [ ] `.scratch/pi-sim-public-telemetry-publication-module/PRD.md` exists and states that `pi-sim/vitals/README.md` plus `.lanes.json` remain the public telemetry Interface authority.
- [ ] The PRD distinguishes hidden patient runtime Implementation from public telemetry publication output.
- [ ] Initial issues cover inventory, regression-lock tests, internal publication Module Interface design, lane construction/write semantics, and documentation updates only if the internal Seam becomes maintainer-relevant.
- [ ] Runner event/reveal behavior is included as subordinate issue work inside this lane rather than as a separate top-level PRD.
- [ ] The lane does not change JSON/JSONL semantics, public lane names, or sibling consumer contracts during PRD creation.
- [ ] The lane names `npm test --prefix pi-sim` as the future source-edit verification command.

## Blocked by

- Maintainer triage of `.scratch/architecture-deepening-placement/PRD.md`.

## Comments

- 2026-05-03: Seeded from `.omx/plans/ralplan-architecture-deepening-artifact-placement.md`. ADR trigger: create `pi-sim/docs/adr/005-public-telemetry-publication-module.md` only if the PRD accepts a durable Module Interface or changes how sibling consumers reason about publication semantics.
