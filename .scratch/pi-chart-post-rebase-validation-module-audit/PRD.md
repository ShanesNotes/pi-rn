# PRD: pi-chart post-rebase validation Module audit

Status: needs-triage

Parking state: parked
Owner: post-rebase `pi-chart` closeout owner, not current-code implementers
Date: 2026-05-03
Source issue: `.scratch/architecture-deepening-placement/issues/04-park-pi-chart-validation-until-rebase.md`

## Parking Notice

This is a parking-only PRD/artifact. It creates no implementation issues and authorizes no source edits against current `pi-chart` code.

Current `pi-chart` file, directory, Module, Interface, command, and test references are historical candidate evidence only. They are not actionable implementation targets until the parallel `pi-chart` rebase closeout publishes stable validation owners, files, Interfaces, and verification commands.

## Problem Statement

Architecture-deepening work identified a likely need for a whole-chart validation Module audit after the `pi-chart` rebase. The candidate is important because chart truth depends on validator behavior, append-only provenance, patient isolation, time semantics, evidence links, disposable derived views, and clinician/user review constraints.

The current risk is timing. `pi-chart` is being rebased, ADR 020 moved reusable claim-ledger kernel ownership to `pi-ledger`, and current `pi-chart` source references may be stale or transitional. If this lane produced implementation issues now, future agents could couple validation work to unstable paths, brownfield envelope details, generated UI assumptions, or in-flight rebase artifacts.

This artifact preserves the candidate without converting it into executable work.

## Solution

Park the whole-chart validation Module audit under `.scratch/pi-chart-post-rebase-validation-module-audit/` until rebase closeout gives stable source authority.

After unblock, a future owner may turn this PRD into real issues only if the closeout names:

1. the validation owner(s) and maintainers;
2. the stable files/directories/Interfaces that own chart validation;
3. the canonical verification commands for chart validation, type checks, tests, derived rebuilds, and regression checks;
4. the relationship between `pi-chart` validation and `pi-ledger` kernel verification;
5. the explicit chart-write policy boundaries for clinician/user validation and agent proposals;
6. the allowed evidence sources and forbidden historical/prototype surfaces.

Until then, the only valid work in this lane is documentation parking, review, or closeout intake. No implementation issue files should be added under this lane before the unblock gate is satisfied.

## User Stories

1. As a maintainer, I want the validation Module audit candidate parked, so that useful architecture-deepening context survives the rebase without racing it.
2. As a future `pi-chart` agent, I want current file references labeled as historical evidence, so that I do not implement against stale ownership.
3. As a rebase owner, I want a clear unblock checklist, so that validation audit work starts only after stable files and commands are named.
4. As a clinical-safety reviewer, I want chart truth constraints preserved, so that future validation work protects append-only provenance, patient isolation, and time semantics.
5. As a clinician/user workflow reviewer, I want chart-write and review authority kept explicit, so that validation work does not imply direct agent acceptance of clinical truth.
6. As a `pi-ledger` integrator, I want chart validation separated from reusable ledger kernel verification, so that neither subsystem accidentally owns the other's truth boundary.

## Implementation Decisions

- This lane is parked and planning-only.
- Do not create implementation issues against current `pi-chart` code from this artifact.
- Do not edit `pi-chart` source, schemas, fixtures, package files, generated UI, patient directories, or validation scripts from this lane.
- Current `pi-chart` references are historical candidate evidence only until rebase closeout names stable owners/files/verification.
- ADR 018 remains evidence for the clinical truth substrate posture: chart canonicality, provenance, hidden-state boundaries, and prototype-evidence hygiene.
- ADR 019 remains evidence for clean-canvas guardrails, but ADR 020 supersedes its implementation-home detail for the reusable claim-ledger kernel.
- ADR 020 is the current authority that reusable claim-ledger kernel implementation belongs to `pi-ledger`, not `pi-chart` validation.
- Future chart validation audit work must preserve the chart thesis: the chart is canonical, current state is a query, and derived summaries are disposable.
- Future validation audit work must preserve clinician/user validation constraints and must not introduce a direct agent-accepted clinical write path.
- Future validation audit work must not read hidden `pi-sim` internals or hidden simulator oracle state as chart truth.
- Future validation audit work must distinguish chart validation from Observable/charting adapters, public telemetry ingest, and external EHR export concerns.

## Historical Candidate Evidence

These surfaces may help a future owner understand context after rebase closeout, but they are not current implementation targets from this PRD:

- `pi-chart/README.md` — brownfield primer and V0.5 clean-canvas note.
- `pi-chart/DESIGN.md`, `pi-chart/ARCHITECTURE.md`, and `pi-chart/ROADMAP.md` — current/historical chart substrate descriptions that require post-rebase authority review before issue slicing.
- `pi-chart/docs/adr/018-architecture-rebase-clinical-truth-substrate.md` — accepted architecture rebase posture and hidden-state boundary.
- `pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md` — clean-canvas guardrails, with path-specific kernel ownership superseded.
- `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md` — accepted reusable kernel ownership boundary.
- `.scratch/pi-chart-v0-5/` and `.scratch/pi-chart-pi-ledger-adapter-strategy/` — planning/front-door evidence for V0.5 and adapter strategy, not validation implementation authority.
- `pi-chart/memos/`, `pi-chart/docs/design/`, `pi-chart/docs/prototypes/`, `.omx/`, and archived/imported surfaces — prototype or runtime evidence only unless promoted by an accepted post-rebase artifact.

## Unblock Gate

This lane may move from `parked` to `needs-triage` only after the parallel `pi-chart` rebase closeout publishes a stable closeout note or equivalent artifact that names:

- validation ownership and review authority;
- stable validation files/directories/Interfaces;
- stable verification commands and expected outputs;
- the relation between chart validation and `pi-ledger` kernel checks;
- chart-write policy boundaries for clinician/user review;
- forbidden evidence sources, including hidden `pi-sim` internals and stale prototype-only surfaces.

If any item is missing, keep this PRD parked and do not create implementation issues.

## Testing Decisions

Parking verification is structural only:

- the artifact exists under `.scratch/pi-chart-post-rebase-validation-module-audit/`;
- it states that current `pi-chart` references are historical candidate evidence only;
- it creates no implementation issues against current `pi-chart` code;
- it names the post-rebase closeout unblocker;
- it preserves chart truth ownership and clinician/user validation constraints;
- `git diff --name-only` shows no edits outside this lane for this task.

Future post-unblock validation issues must define executable checks from the rebase closeout rather than from this parking artifact.

## Out of Scope

- Creating implementation issue slices now.
- Editing current `pi-chart` source, schemas, fixtures, package files, scripts, generated UI, patient directories, or docs outside this assigned scratch lane.
- Promoting any current `pi-chart` file path, Module name, or test command into authoritative implementation scope.
- Reopening ADR 020 or moving reusable claim-ledger kernel ownership back into `pi-chart`.
- Implementing `pi-ledger` integration, Observable charting adapters, telemetry ingest, chart writes, external EHR export, or runtime/orchestrator access planes.
- Mining hidden `pi-sim` state, model traces, runtime transcripts, generated cockpit assumptions, or patient fixtures as implementation authority.

## Next Feasible Follow-up After Rebase

After rebase closeout, a future maintainer can review this PRD and either:

1. keep it parked if source authority is still unstable;
2. convert it to `needs-triage` and create issue slices for a validation Module audit; or
3. reject it if rebase closeout proves the candidate is obsolete or owned elsewhere.

Any future issue slices must start from the closeout's stable owners/files/verification commands, not from the historical evidence list above.

## Further Notes

This parking artifact is intentionally non-executable until the pi-chart rebase closeout names stable validation owners, files, Interfaces, and verification commands. Current `pi-chart` references are historical candidate evidence only.
