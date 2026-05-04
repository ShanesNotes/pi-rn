# Design internal public telemetry publication Module Interface

Status: completed
Type: HITL

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

Propose a maintainer-facing internal Module Interface for public telemetry publication only if inventory and regression-lock work show the seam is useful.

## Acceptance criteria

- [x] Design keeps public ABI authority in `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json`.
- [x] Design treats `Module` as a planning hypothesis, not a commitment to create a new source directory, class, function, package, or abstraction.
- [x] Design does not change public lane names, paths, schema versions, event kinds, write/reset semantics, or sibling consumer contracts.
- [x] Design preserves runner-owned clock, sequence, and per-run event index ownership.
- [x] Design keeps scenario orchestration, provider routing, and canonical simulation clock progression outside the publication Module.
- [x] Design names which responsibilities remain in `runProviderRuntime` versus any new publication Module helper.
- [x] Design names how provider optional capabilities flow into public encounter, assessment, and waveform lanes without exposing hidden provider internals.
- [x] Design includes a rollback path: keep current runner/publisher structure if the Module seam would add abstraction without reducing risk.
- [x] Design explicitly allows a "no new module" outcome if evidence shows the existing structure is clearer and safer.

## Blocked by

- `issues/01-inventory-publication-responsibilities.md`.
- `issues/02-lock-publication-regression-tests.md`.

## Comments

- 2026-05-03: ADR trigger remains conditional. Create `pi-sim/docs/adr/005-public-telemetry-publication-module.md` only if this design is accepted as durable architecture or changes maintainer reasoning about publication semantics.
- 2026-05-04: Completed by adding `.scratch/pi-sim-public-telemetry-publication-module/internal-publication-module-interface-design.md`. The recommended planning posture is a minimal private publication-cycle seam only if later source work proves it reduces risk; no source module, public API, lane/schema change, or ADR is created by this issue. Recommended next gate: Issue 05.
