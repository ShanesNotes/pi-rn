# Context Snapshot: S5 Context Bundle PRD Planning

## Task statement
Run `$ralplan` consensus planning for the HITL-selected S5 successor: a narrow read-only context-bundle PRD/test-spec lane.

## Desired outcome
Produce an execution-ready plan for authoring docs-only S5 planning artifacts before any product code.

## Known facts/evidence
- Deep-interview spec: `.omx/specs/deep-interview-v03-hitl-successor.md`.
- HITL selected S5 context-bundle and then selected `s5-read-only` boundary.
- V03 acceptance report: `docs/plans/v03-foundation-reconciliation-acceptance-report.md`.
- V03 PRD states `src/views/bundle.ts` is absent and context-bundle work needs a separate read-side PRD.
- Current accepted implementation reality remains `schema_version: 0.3.0-partial` under ADR 009/010/011/015/016.

## Constraints
- Planning only; no `src/views/bundle.ts` implementation.
- Explicitly defer profile registry, identity/hash-chain, invalidated_at cache, and deterministic bundle fingerprint.
- Preserve pi-chart/pi-agent/pi-sim boundary separation.
- No new dependencies.
- No product-root edits during planning.

## Unknowns/open questions
- Exact naming of S5 PRD/test-spec files.
- Whether to update the kanban row as part of planning artifact authoring.
- Exact bundle consumer/output shape is future PRD content, not decided by this planning pass.

## Likely codebase touchpoints
- New `docs/plans/prd-s5-read-side-context-bundle.md`.
- New `docs/plans/test-spec-s5-read-side-context-bundle.md`.
- Optional `docs/plans/kanban-prd-board.md` row update to record HITL S5 selection.
- Read-only references: V03 acceptance report, V03 PRD/test-spec, deep-interview spec, ADR015, existing `src/views/*` names for brownfield inventory only.
