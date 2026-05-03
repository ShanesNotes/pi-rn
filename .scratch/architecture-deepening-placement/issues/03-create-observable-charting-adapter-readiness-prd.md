# Create Observable charting adapter readiness PRD

Status: needs-triage
Type: AFK

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

Create `.scratch/observable-charting-adapter-readiness/PRD.md` and initial issue slices for adapter readiness and draft flowsheet staging policy. This work may proceed only as contract/readiness planning from stable public telemetry and chart-truth invariants; it must not depend on current `pi-chart` internals while the parallel rebase is active.

The lane should promote the HITL decisions from `.scratch/pi-sim-public-telemetry-contract-lock/ingest-adapter-readiness.md`: retrospective-only draft staging from already-observed public telemetry, clinician/user validation authority, `pi-agent` assistant/reviewer role, provenance, idempotency, patient/encounter mapping, replay offsets, quality flags, and staging queue semantics.

## Acceptance criteria

- [ ] `.scratch/observable-charting-adapter-readiness/PRD.md` exists and is explicitly contract/readiness-only.
- [ ] The PRD allows only public telemetry lanes such as `timeline.jsonl`, `events.jsonl`, `status.json`, `encounter/current.json`, and accepted assessment public lanes as inputs.
- [ ] The PRD forbids hidden `pi-sim` internals, monitor display internals, future scripted data, raw chart writes, and `pi-agent` private reasoning as adapter inputs.
- [ ] The PRD includes a chart-write policy PRD/memo seed covering draft flowsheet observations, clinician/user validation, provenance, idempotency, replay offsets, patient/encounter mapping, quality flags, and staging queue semantics.
- [ ] The PRD states: do not promote the chart-write policy seed to a `pi-chart` ADR until after the `pi-chart` rebase names stable chart-write ownership.
- [ ] No `pi-rn/ingest/` directory, ingest Adapter implementation, or chart-write implementation issue is created in this phase.

## Blocked by

- Maintainer triage of `.scratch/architecture-deepening-placement/PRD.md`.
- Post-rebase `pi-chart` ownership is required before chart-write implementation issues.

## Comments

- 2026-05-03: Seeded from `.omx/plans/ralplan-architecture-deepening-artifact-placement.md` and the HITL readiness artifact. This issue is intentionally safe to execute before the `pi-chart` rebase completes because it creates contract planning, not code-coupled chart implementation.
