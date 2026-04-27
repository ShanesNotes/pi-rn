# Context snapshot — DOC-002 OMX planning history promotion

## Task statement
Deepen DOC-002 into executable, context-efficient documentation/promotion cards without product implementation.

## Desired outcome
Tracked planning docs explain which ignored/local `.omx` planning history is worth preserving, where promoted summaries should live, what remains ignored/local, and how to avoid document sprawl.

## Known facts/evidence
- `docs/plans/kanban-prd-board.md` is the durable backlog entrypoint.
- `docs/plans/README.md` ranks `.omx/plans` as execution history unless promoted, and `.omx/context`, `.omx/specs`, `/wiki`, `.omx/wiki` as derived traceability.
- `git check-ignore -v .omx .omx/plans/doc-sprawl-source-map.md` confirms `.omx/` is ignored by `.gitignore`.
- `.omx/plans/doc-sprawl-source-map.md` already inventories planning artifacts and classifies context/wiki/spec artifacts as traceability/evidence below source policy.
- Existing DOC-002 PRD/test spec are thin and need tracer bullets, owned files, validations, explicit promotion/do-not-promote criteria, deferrals, and HITL gate.

## Constraints
- Do not force-add `.omx` wholesale.
- Do not move, delete, force-add, or rewrite `.omx` artifacts without explicit HITL handoff.
- Promote only selected durable knowledge into tracked docs.
- Avoid duplicating stale planning text.
- No product implementation changes and no new dependencies.

## Unknowns/open questions
- Which exact `.omx` artifacts a human will approve for promotion later.
- Whether the board integration owner will update the DOC-002 row in a later lane.

## Likely tracked touchpoints
- `docs/plans/prd-omx-planning-history-promotion.md`
- `docs/plans/test-spec-omx-planning-history-promotion.md`
- Optional future board snippet in `docs/plans/kanban-prd-board.md`, gated by ownership/HITL.
