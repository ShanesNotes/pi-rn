# Deep Interview Spec — S5 Implementation Approval

## Metadata

- Profile: standard
- Rounds: 4
- Final ambiguity: 0.12
- Threshold: 0.20
- Context type: brownfield
- Context snapshot: `.omx/context/next-decision-interview-20260426T163800Z.md`
- Transcript: `.omx/interviews/s5-implementation-approval-20260426T163800Z.md`
- Source PRD: `docs/plans/prd-s5-read-side-context-bundle.md`
- Source test spec: `docs/plans/test-spec-s5-read-side-context-bundle.md`
- Source board: `docs/plans/kanban-prd-board.md`
- Preceding commits:
  - `e42f773 Land V03-001 acceptance report and S1-S6 HITL framing`
  - `e819155 Plan S5 context bundle without widening V03 scope`

## Clarity breakdown

| Dimension | Score | Notes |
|---|---:|---|
| Intent | 0.95 | Operator wants to approve S5 implementation after PRD/test-spec planning. |
| Outcome | 0.90 | First implementation lane should produce a minimal read-side context bundle. |
| Scope | 0.90 | Own tests, `src/views/bundle.ts`, and export wiring in `src/views/index.ts`. |
| Constraints | 0.95 | Existing projections only; no fingerprint/hash/profile/schema/validator/fixture/coupling expansion. |
| Success criteria | 0.90 | Six required bundle sections selected. |
| Context | 0.90 | Brownfield PRD/test-spec and prior commits are known. |

## Intent

Move from S5 planning into a narrowly approved first product implementation lane without reopening V03 fingerprint/profile/hash proposals.

## Desired Outcome

Implement a read-only S5 context bundle that uses existing projections and is available through the views export surface.

## In-Scope

- Add focused tests for the bundle contract.
- Implement `src/views/bundle.ts`.
- Wire the bundle through `src/views/index.ts`.
- Use existing projections only.
- Produce these required bundle sections:
  - identity header: `patient_id`, `asOf`, `source_view_refs`
  - current state
  - open loops
  - narrative handoff
  - evidence context
  - recent timeline

## Out-of-Scope / Non-goals

- No deterministic bundle fingerprint.
- No bundle hash.
- No `src/hash.ts`.
- No `src/identity.ts`.
- No root `profiles/`.
- No `schemas/profile.schema.json`.
- No profile-registry changes.
- No schema changes.
- No validator changes.
- No fixture mutation.
- No dependency/package changes.
- No pi-agent direct coupling.
- No hidden simulator state.

## Decision Boundaries

OMX may:
- Plan the S5 implementation lane using this spec.
- Treat `src/views/bundle.ts`, `src/views/bundle.test.ts`, and `src/views/index.ts` as approved candidate product files for the first implementation lane.
- Require tests before implementation.

OMX may not:
- Implement directly inside deep-interview mode.
- Add fingerprint/hash/identity/profile/schema/validator/dependency scope.
- Mutate patient fixtures unless a later plan explicitly proves append-only fixture need and obtains approval.
- Couple to pi-agent or pi-sim internals.

## Constraints

- Preserve `s5-read-only` boundary.
- Reuse existing projections before adding new read logic.
- Keep output explainable through `source_view_refs`.
- Keep S5 separate from S3 identity/hash and S4 profile work.

## Testable acceptance criteria

A downstream `$ralplan` / implementation plan should require:

1. A failing test exists before implementation for the minimal bundle contract.
2. `contextBundle` or equivalent returns `patient_id`, `asOf`, and `source_view_refs`.
3. Bundle output includes current state, open loops, narrative handoff, evidence context, and recent timeline sections.
4. Tests prove the bundle is derived from existing projections.
5. Tests prove forbidden fields/surfaces are absent: fingerprint/hash/identity/profile expansion, hidden simulator state, pi-agent internals.
6. `src/views/index.ts` exports the bundle API.
7. `npm test`, `npm run typecheck`, and relevant focused view tests pass unless a later plan narrows verification with rationale.

## Assumptions exposed + resolutions

- Assumption: S5 implementation might only be contract tests. Resolution: operator selected minimal implementation, not tests-only.
- Assumption: export wiring might be out of scope. Resolution: operator allowed `src/views/index.ts` export wiring.
- Assumption: useful bundle could be smaller. Resolution: operator selected all six sections as required.

## Pressure-pass findings

Round 2 forced implementation authority boundaries. The operator approved a minimal implementation lane, not broad bundle fingerprint/profile/hash work.

## Brownfield evidence vs inference

Evidence:
- S5 PRD/test-spec are committed and state planning-only boundaries.
- Existing read-side projections are already inventoried in S5 PRD.

Inference:
- `src/views/bundle.test.ts` is the likely focused test file because S5 PRD names it as a candidate future file; it was not created during planning.

## Recommended handoff

Next recommended mode: `$ralplan` for an implementation plan from this spec.

Suggested direct input:

```text
$ralplan .omx/specs/deep-interview-s5-implementation-approval.md
```

Do not execute implementation until the plan confirms file ownership, first failing test, and verification commands.
