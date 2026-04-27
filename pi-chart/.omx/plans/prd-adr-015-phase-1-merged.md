# PRD — ADR 015 Phase 1 merged substrate update

## Goal

Land the Phase 1 substrate for ADRs 009/010/011 in one commit:

- schema `$defs.EvidenceRef` plus additive envelope fields
- canonical `EvidenceRef` / link / transform types
- parser normalization for legacy and canonical refs
- compatibility rewrites in current consumers so the repo stays green

## Scope

In scope:

- `schemas/event.schema.json`
- `src/types.ts`
- `src/evidence.ts`
- compatibility consumers in `src/write.ts`, `src/validate.ts`, `src/views/evidenceChain.ts`
- existing proof-point tests in `src/schema.test.ts`, `src/write.test.ts`,
  `src/evidence.test.ts`, `src/validate.test.ts`, `src/views/evidenceChain.test.ts`

Out of scope:

- new validator rules (`V-EVIDENCE*`, `V-TRANSFORM*`, `V-CONTRA*`, `V-RESOLVES*`)
- new contested / role-threaded view behavior
- migration scripts, fixture sweeps, or new test suites

## User Story

As a maintainer of the ADR 015 rollout, I want Phase 1 to introduce the
canonical evidence and envelope substrate without pulling later validator or
view semantics forward, so later phases can build on one coherent base.

## Requirements

1. Schema exposes `$defs.EvidenceRef`, `links.resolves`,
   `links.contradicts`, and `transform`.
2. TypeScript surface exposes canonical `EvidenceRef`, `EvidenceRole`,
   `ContradictsLink`, `TransformActivity`, `TransformBlock`, `OpenLoopKind`.
3. `parseEvidenceRef` normalizes legacy refs to canonical refs and preserves
   canonical object fields on round-trip.
4. One shared helper expands canonical vitals-window refs for validator/write/view
   compatibility use.
5. Existing write/validate/evidenceChain behavior remains phase-stable:
   no Phase 2+ rules, no Phase 5 view surface.
6. `kind:"external"` is structurally accepted but not treated as
   patient-local evidence resolution in Phase 1.

## Acceptance Criteria

- `npm test` passes.
- `npm run check` passes.
- `npm run typecheck` passes.
- Existing proof-point tests cover schema acceptance, parser normalization,
  write compatibility, validator compatibility, and stable evidenceChain
  output.
- Final diff contains no new `V-EVIDENCE`, `V-TRANSFORM`, `V-CONTRA`, or
  `V-RESOLVES` logic and no unintended role/contradicts view-surface changes.
