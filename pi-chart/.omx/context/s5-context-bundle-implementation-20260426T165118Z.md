# Context Snapshot: S5 Context Bundle Implementation

## Task statement
Plan implementation for `.omx/specs/deep-interview-s5-implementation-approval.md`: a minimal read-only S5 context bundle implementation lane.

## Desired outcome
Produce a consensus implementation plan that can be handed to `$ralph` or `$team`, without implementing code in planning mode.

## Known facts/evidence
- Approval spec authorizes planning for `src/views/bundle.ts`, `src/views/bundle.test.ts`, and export wiring in `src/views/index.ts`.
- Required bundle sections: identity header (`patient_id`, `asOf`, `source_view_refs`), current state, open loops, narrative handoff, evidence context, recent timeline.
- Existing projections include `currentState`, `openLoops`, `narrative`, `timeline`, `evidenceChain`, and `memoryProof`.
- `src/views/index.ts` currently exports existing view APIs but no bundle API.
- `src/views/bundle.ts` and `src/views/bundle.test.ts` are currently absent.

## Constraints
- Preserve `s5-read-only` boundary.
- Tests first before implementation.
- Use existing projections only; prefer composition to new read logic.
- No deterministic bundle fingerprint/hash, `src/hash.ts`, `src/identity.ts`, root `profiles/`, schema/profile/validator/dependency changes, fixture mutation, pi-agent direct coupling, hidden simulator state, or pi-sim internals.

## Unknowns/open questions
- Exact exported API name can be `contextBundle` unless implementation finds a local naming conflict.
- Exact evidence-context shape should be minimal and derived from existing `memoryProof`/`evidenceChain` outputs, avoiding new graph traversal logic.

## Likely codebase touchpoints
- `src/views/bundle.test.ts`
- `src/views/bundle.ts`
- `src/views/index.ts`
- Existing projection APIs in `src/views/currentState.ts`, `src/views/openLoops.ts`, `src/views/narrative.ts`, `src/views/timeline.ts`, `src/views/memoryProof.ts`, and possibly `src/views/evidenceChain.ts`
- Existing view and fixture types in `src/types.ts` and `src/test-helpers/fixture.ts` (read/use only unless plan explicitly adds bundle types)
