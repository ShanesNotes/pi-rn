# Context snapshot — durable kanban PRD surface

## Task statement

Consolidate pi-chart workflow/document sprawl into a durable, tracked planning surface that future agents can use without re-reading every memo or transient OMX artifact.

## Desired outcome

Create a tracked `docs/plans` surface with a kanban-style PRD board and next-workstream PRD/test-spec context. Keep product code unchanged.

## Known facts/evidence

- Existing local consolidation artifacts exist under `.omx/plans/`, including `doc-sprawl-source-map.md`, `prd-doc-sprawl-consolidation-operating-system.md`, and `test-spec-doc-sprawl-consolidation-operating-system.md`.
- The source map reports 162 mapped planning sources and explicitly includes `/memos` research reports as evidence/proposal layers.
- Workstream A has been executed/hardened per handoff, with acceptance report at `.omx/plans/workstream-a-memory-proof-acceptance-report.md`.
- Current git status shows Workstream A test changes in `src/views/memoryProof.test.ts` and `src/validate.test.ts`; this planning pass must not touch product code.
- New Phase A files now present beyond the older source map include A8 and A9a files under `clinical-reference/phase-a/`.

## Constraints

- No product code changes in this chat.
- Durable surface should live in tracked `docs/plans` rather than hidden/transient `.omx` state.
- User delegated kanban/card granularity decisions to the agent.
- Minimum proof for future agents: staged cards with source/conflict context at PRD level and execution details on ready tracer-bullet cards.

## Unknowns/open questions

- Final HITL priority order remains open; the board may recommend order but not lock it.
- Whether `.omx/plans` artifacts should later be promoted or force-added remains open.

## Likely touchpoints

- `docs/plans/README.md`
- `docs/plans/kanban-prd-board.md`
- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`
