# Ralph context — PHA-001 A9b + TB execution

## Task statement
User invoked `$ralph`: A9b was added to clinical-reference; review and update contingent docs; user approves canonical merge; user is unsure about dashboard/prototype/playwright disposition; proceed to execute TBs.

## Desired outcome
- Update PHA-001 docs for A9b exact-once coverage and open-schema/canonical merge.
- Carry dashboard/prototype/playwright as out-of-scope, non-authoritative dirty baseline unless explicitly resolved later.
- Execute PHA-TB sequence with tests before implementation.
- Verify with targeted commands, full tests/typecheck/check, architect review, deslop/reverify.

## Known facts/evidence
- `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` exists and is currently untracked.
- Prior ralplan approved path: PHA-TB-0, PHA-TB-1, TB-2/TB-3, TB-V, TB-4.
- Prior exact-once check failed because A9b was absent from `docs/plans/phase-a-status-matrix.md`.
- Existing validator already has V-FULFILL-02/03 acquisition/result support rules.
- `schemas/event.schema.json` is intentionally permissive for open subtype/data; broad conditional schema machinery is out of scope.

## Constraints
- pi-chart bounded chart/EHR subsystem only.
- No pi-agent to pi-sim coupling.
- ADR17 non-canonical unless separately approved.
- No new PHA-001 dependencies.
- Prefer tests before implementation.
- Dashboard/prototype/playwright changes are out-of-scope non-authoritative baseline for PHA-001.

## Unknowns/open questions
- Exact final disposition of dashboard/prototype/playwright remains unclear; carry as baseline, do not expand.
- A9b order-set semantics should be documented as current/proposal input, not implemented unless TB scope requires it.

## Likely touchpoints
- Docs: `docs/plans/phase-a-status-matrix.md`, `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`, `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`, `docs/plans/kanban-prd-board.md`, `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`, future acceptance report.
- Code/tests: `src/views/evidenceChain.ts(.test)`, `src/views/currentState.ts(.test)`, `src/views/openLoops.ts(.test)`, `src/views/timeline.ts(.test)`, `src/validate.ts`, `src/validate.test.ts`, `schemas/event.schema.json`.
