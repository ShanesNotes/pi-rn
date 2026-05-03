# PRD: Architecture Deepening Artifact Placement

Status: needs-triage
Owner: workspace
Date: 2026-05-03
Source plan: `.omx/plans/ralplan-architecture-deepening-artifact-placement.md`

## Problem Statement

Recent architecture-deepening work identified several worthwhile Module-depth candidates across `pi-sim`, `pi-monitor`, Observable charting adapter readiness, and `pi-chart`. Those candidates are project-relevant, but they currently live in runtime/planning context rather than a durable issue surface that future AI coding models can execute safely.

The project needs one small, durable placement artifact that tells future agents where each candidate belongs without turning this coordination lane into another implementation queue. The coordination lane must preserve the current constraints:

- active work belongs in root `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`;
- accepted hard-to-reverse decisions belong in owning subproject ADRs;
- `.omx/` artifacts are runtime evidence, not the active issue tracker;
- `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` remain the public telemetry Interface authority;
- the parallel `pi-chart` rebase means current-code-coupled `pi-chart` deepening must defer;
- adapter readiness planning may proceed only while it stays contract/readiness-oriented and does not create `pi-rn/ingest/` or write chart truth.

## Solution

Create this `.scratch/architecture-deepening-placement/` lane as an **index-only coordination PRD**. Implementation work lives in the lane PRDs below, not in this coordination PRD.

This PRD records the placement decision and hands off six independently grabbable issue slices:

1. create the `pi-sim` public telemetry publication Module PRD/issues;
2. create the `pi-monitor` public-lane ingest depth PRD/issues;
3. create the Observable charting adapter readiness PRD/issues;
4. park `pi-chart` whole-chart validation Module work until the rebase publishes stable ownership;
5. maintain a durable checker for this placement pass;
6. audit ADR triggers after PRD decisions crystallize.

### Placement map

| Candidate | Durable home now | ADR now? | Issue slicing now? | Execution posture |
| --- | --- | --- | --- | --- |
| `pi-sim` public telemetry publication Module | `.scratch/pi-sim-public-telemetry-publication-module/` | No; create `pi-sim/docs/adr/005-*` only if a new durable Module Interface or external publication invariant is accepted | Yes | Can proceed after PRD/issues are written and regression tests are scoped |
| `pi-sim` runner event/reveal behavior | Same `pi-sim` publication lane | No | Yes, as subordinate issue(s) | Can proceed after publication behavior is test-locked |
| `pi-monitor` public-lane ingest Module | `.scratch/pi-monitor-public-lane-ingest-depth/` | No; create `pi-monitor/docs/adr/004-*` only if crate Interfaces or durable ingest seams change | Yes | Can proceed after source-dir fixtures and boundary checks are locked |
| Observable charting adapter readiness / draft staging contract | `.scratch/observable-charting-adapter-readiness/` | Not now; chart-write policy remains PRD/memo seed until post-rebase `pi-chart` ownership is known | Yes, contract/readiness only | Can proceed without creating `pi-rn/ingest/`, chart writes, or hidden-sim inputs |
| `pi-chart` whole-chart validation Module | `.scratch/pi-chart-post-rebase-validation-module-audit/` parking artifact | No | No implementation issues now | Wait for the parallel `pi-chart` rebase closeout |

## User Stories

1. As a fresh AI coding model, I want one placement index for architecture-deepening candidates, so that I do not mine `.omx` or stale plan docs for current work.
2. As a `pi-sim` maintainer, I want public telemetry publication work isolated in its own lane, so that hidden patient runtime internals stay hidden behind public lanes.
3. As a `pi-monitor` maintainer, I want ingest deepening scoped behind display-only consumer authority, so that monitor work does not drift into chart truth.
4. As a charting adapter planner, I want readiness work to proceed from public telemetry and chart truth invariants, so that adapter contracts can mature without depending on unstable `pi-chart` code.
5. As a `pi-chart` rebasing agent, I want current-code-coupled validation deepening parked, so that parallel planning does not fight the rebase.
6. As a reviewer, I want ADR triggers separated from PRD issue slices, so that speculative architecture ideas do not become durable decisions too early.

## Implementation Decisions

- This PRD is an **index/handoff surface only**. It does not authorize source edits or implementation against the candidates.
- Downstream work must be promoted into the named lane PRDs before implementation.
- The coordination issues start as `Status: needs-triage` because they define planning work that still needs owner acceptance before execution.
- Current `pi-chart` file or Module references are historical candidate evidence only until the parallel rebase publishes stable owners, files, and verification commands.
- Observable charting adapter readiness may define terms, fixtures, negative boundaries, and chart-write policy seeds, but must not create an ingest Adapter implementation or write final chart truth.
- Do not promote the chart-write policy seed to a `pi-chart` ADR until after the `pi-chart` rebase names stable chart-write ownership.
- ADRs are follow-up outputs only when a lane PRD accepts a durable, hard-to-reverse Interface, Seam, Adapter, invariant, or ownership decision.

## Testing Decisions

This planning pass is verified structurally rather than by application tests:

- `.scratch/architecture-deepening-placement/checks/verify-artifact-placement.py` must pass.
- The checker compares a recorded baseline `git status --short` with the final status, allowing pre-existing unrelated dirty files and new files under this coordination lane while failing on new source edits outside the lane.
- The checker fails if root `ingest/` is created.
- The checker validates this PRD and all six issue files use the expected local markdown issue shape.
- Existing public telemetry checks remain authoritative for the earlier ABI-lock lane:
  - `.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py`
  - `.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py`
- Future source edits must run their lane-specific commands (`npm test --prefix pi-sim` for `pi-sim`; cargo fmt/clippy/test/build for `pi-monitor`; post-rebase published checks for `pi-chart`).

## Out of Scope

- Editing source files.
- Creating `pi-rn/ingest/` or any replacement ingest implementation.
- Writing chart truth or bypassing clinician/user validation.
- Promoting adapter chart-write policy directly into a `pi-chart` ADR before the rebase names stable chart-write ownership.
- Creating implementation slices for current-code-coupled `pi-chart` validation work.
- Reopening `pi-sim` ADR 004 or `pi-monitor` ADR 003 authority decisions.
- Bulk archiving, moving, or deleting historical planning files.

## Further Notes

Primary evidence and constraints:

- `.omx/plans/ralplan-architecture-deepening-artifact-placement.md`
- `.omx/context/architecture-deepening-artifact-placement-20260503T205200Z.md`
- `CONTEXT-MAP.md`
- `docs/agents/work-surface.md`
- `docs/agents/skill-interoperability.md`
- `docs/agents/issue-tracker.md`
- `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md`
- `pi-monitor/docs/adr/003-public-lane-consumer-authority.md`
- `pi-chart/CONTEXT.md`
- `.scratch/pi-sim-public-telemetry-contract-lock/ingest-adapter-readiness.md`

Recommended next execution mode after this lane is reviewed:

- Use `$team` only if creating all downstream PRD lanes in parallel.
- Use `$ralph` for sequential creation of one downstream lane at a time.
