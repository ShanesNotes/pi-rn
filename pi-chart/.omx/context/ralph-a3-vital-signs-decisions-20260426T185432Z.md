# Ralph Context Snapshot — A3 vital signs decisions implementation

- Task statement: Execute the approved ralplan for A3 vital-signs decisions.
- Desired outcome: Implement the PRD/test-spec enough to satisfy schema/types/views/validation/fixtures/docs requirements, then verify with tests/typecheck/validation and architect review.
- Known facts/evidence:
  - PRD: `.omx/plans/prd-a3-vital-signs-decisions-20260426T183501Z.md`
  - Test spec: `.omx/plans/test-spec-a3-vital-signs-decisions-20260426T183501Z.md`
  - Current vitals schema lacks `recorded_at`, `sample_key`, structured quality, registry constraints.
  - Current `Axis` lacks `context`; `currentState(axis:"all")` lacks context.
  - `openLoops()` lacks vital cadence/alarm loops.
  - `trend()` does not gate metric registry/profile distinctions.
- Constraints:
  - Preserve existing uncommitted edits in prototype/agent-canvas files; do not modify them unless required.
  - No pi-sim source coupling; chart adapter contract can be docs/fixture-level if no adapter exists.
  - Existing behavior/tests must remain passing.
- Unknowns/open questions:
  - Exact minimal implementation breadth needed for this iteration; prioritize testable core substrate changes.
  - Replay/strict replay API may remain documented/future if no validation mode exists.
- Likely touchpoints:
  - `schemas/vitals.schema.json`, new `schemas/vital-metrics.json`, `src/types.ts`, `src/views/currentState.ts`, `src/views/trend.ts`, `src/views/openLoops.ts`, `src/validate.ts`, tests, docs/decision files, fixtures if needed.
