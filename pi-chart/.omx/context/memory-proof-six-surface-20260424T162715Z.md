# Ralplan context — memory-proof six-surface broad EHR skeleton

## Task statement

Create consensus planning artifacts for Workstream A from
`memos/deep-research-alignment-24042026.md`: memory-proof projection over the
six-surface broad EHR skeleton.

## Desired outcome

Produce a PRD and test specification that turn ADR 016 into executable,
testable work. The plan should define one coherent fixture story spanning the
six surfaces, a deterministic memory-proof projection API/export, and proof
that one bedside observation can be charted once and reused across note,
review, open-loop, and handoff projections.

## Known facts / evidence

- `memos/deep-research-alignment-24042026.md` §10-§11 names Workstream A as
  the next lane.
- `decisions/016-broad-ehr-skeleton-clinical-memory.md` accepts the broad EHR
  skeleton as clinical-memory proof surface and requires a memory proof
  projection.
- `clinical-reference/broad-ehr-skeleton.md` says `patient_001` remains a
  narrow respiratory-decompensation seed and does not yet satisfy the broad
  skeleton.
- `README.md`, `DESIGN.md`, and `ARCHITECTURE.md` define the current claim
  substrate, six view primitives, append-only provenance, and FHIR-as-boundary
  posture.
- `decisions/015-adr-009-011-implementation.md` and `ROADMAP.md` state ADRs
  009-011 have landed under `0.3.0-partial`.

## Constraints

- Ralplan produces planning artifacts only; no implementation in this mode.
- Accepted ADRs are settled; do not re-litigate ADR 015 or ADR 016.
- No external standards/OSS claims become decisions during this plan.
- No new dependencies unless a later execution plan explicitly justifies them.
- Preserve hidden-simulator boundary: pi-chart/pi-agent must consume only
  observable clinical artifacts, not pi-sim internals.

## Unknowns / open questions

- Exact fixture timestamps/order sequence.
- Whether the memory-proof projection should be a new view primitive or a
  composition over existing views.
- Whether to extend existing patient_001 or create a successor fixture.
- Exact API/export name and output file location.

## Likely codebase touchpoints

- `src/views/*`
- `src/derived.ts`
- `src/types.ts`
- `src/index.ts`
- `src/test-helpers/fixture.ts`
- `patients/patient_001/**` or a new fixture patient
- `clinical-reference/broad-ehr-skeleton.md`
- `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`
