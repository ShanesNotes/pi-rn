# Context snapshot — PRD kanban backlog expansion

## Task statement

Continue building out pi-chart PRDs and adding to the durable kanban backlog because the project is in a transition state: large document load, not enough conversion into context-efficient execution work.

## Desired outcome

Clarify what backlog-expansion pass should produce next: which candidate PRDs should be promoted, how many, and how much execution detail belongs in each card.

## Stated solution

Use `$deep-interview` before expanding `docs/plans/kanban-prd-board.md` and adding PRD/test-spec artifacts.

## Probable intent hypothesis

The user wants less document gravity and more agent-ready units. The output should reduce context burden for future agents and make parallelization possible without letting stale memos become canonical policy.

## Known facts/evidence

- Durable planning surface exists under `docs/plans/`.
- Current board has one active ready PRD: PHA-001 Phase A completion-to-implementation bridge.
- Current board backlog includes V03-001, ADR17-001, BND-001, and DOC-002.
- `omx explore` confirmed memos/research and A8/A9a are represented.
- Existing `.omx/plans` remains rich execution history but not fully promoted into tracked durable docs.
- Current git status includes pre-existing Workstream A test diffs and untracked A8/A9a Phase A docs.

## Constraints

- Preserve source authority hierarchy.
- Avoid hidden `pi-sim` coupling.
- Avoid treating proposed ADR 017 or memo-only v0.3 content as canonical.
- Keep future cards context-efficient and execution-ready.

## Unknowns/open questions

- Should the next pass deepen PHA-001, broaden backlog PRD coverage, or promote `.omx` history into durable docs?
- How many PRD/test-spec pairs should be created before implementation resumes?
- What is the HITL gate for deciding enough conversion has happened?

## Decision-boundary unknowns

- Whether OMX may create multiple PRD/test-spec pairs without further approval.
- Whether priority order can be recommended but not locked.
- Whether documentation cleanup/promotion is a first-class workstream or secondary maintenance.

## Likely codebase touchpoints

- `docs/plans/kanban-prd-board.md`
- `docs/plans/prd-*.md`
- `docs/plans/test-spec-*.md`
- `.omx/plans/**` as source history
- `memos/**`, `decisions/**`, `clinical-reference/phase-a/**`, `ROADMAP.md`

## Prompt-safe initial-context summary status

not_needed
