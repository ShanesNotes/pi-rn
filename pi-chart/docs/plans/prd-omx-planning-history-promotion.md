# PRD — OMX planning history promotion

## Status and source inputs

- Board card: `DOC-002`
- Source board: [`kanban-prd-board.md`](kanban-prd-board.md)
- Scope: thin maintenance/promotion PRD for deciding which local `.omx/plans` artifacts deserve tracked `docs/plans` summaries.
- Posture: docs-only policy surface; no product-code work and no board/product-root edits in this lane.
- Paired verification: [`test-spec-omx-planning-history-promotion.md`](test-spec-omx-planning-history-promotion.md)

Source inputs:

- `.omx/plans/**` as local execution history.
- `docs/plans/README.md` as source-authority rule: `.omx/plans` PRD/test-spec/report artifacts are execution history unless promoted here.
- `docs/plans/kanban-prd-board.md` as the durable planning index and DOC-002 board context.
- `.omx/plans/doc-sprawl-source-map.md` as current inventory, authority hierarchy, and exclusion baseline.
- `.omx/plans/prd-kanban-backlog-expansion.md`, especially the consensus review addendum for thin PRD, ownership, and no-wholesale-`.omx` safeguards.

## Authority / proposal status

`.omx/plans` artifacts are not canonical product policy by path alone. They may contain useful execution history, decisions, and acceptance evidence, but they sit below current user instruction, accepted ADRs, Phase A controls, roadmap sequencing, and durable `docs/plans` surfaces.

Promotion means creating or updating a small tracked durable summary under `docs/plans/` after review. It does not mean archiving, rewriting, deleting, or force-adding `.omx` wholesale.

## Decision options

| Option | When to use | Result |
|---|---|---|
| Promote summary | Artifact has durable value that future agents need without replaying local history. | Add or update a concise tracked `docs/plans` surface with source links. |
| Keep as execution history | Artifact is useful trace/evidence but duplicates current board/PRDs or is too slice-specific. | Leave under `.omx/plans`; reference only when a card names it. |
| Defer review | Artifact may matter but current status is stale or conflicts with higher-authority sources. | Add a future board/card note only after HITL selects it. |
| Exclude runtime churn | Artifact is state/log/session noise or derived memory without independent decision value. | Do not promote and do not track `.omx` wholesale. |

## Promotion checklist

A candidate may be promoted only when all checks pass:

1. **Durable value** — preserves a decision, acceptance report, source map, or execution contract likely to matter across sessions.
2. **Non-duplicative** — does not restate an existing `docs/plans` PRD/test-spec/board section without adding a clearer handoff.
3. **Source-linked** — cites the original `.omx/plans` path and any higher-authority sources it depends on.
4. **Current enough** — reflects repo reality or clearly marks stale/deferred portions.
5. **Not runtime churn** — excludes `.omx/state/**`, `.omx/logs/**`, session-only traces, and transient workflow mechanics.

## HITL gate

Before any promotion beyond this PRD/test-spec pair, a human must approve the candidate artifact or artifact class. The approval should identify:

- source `.omx/plans` path(s),
- target tracked `docs/plans` file or board row,
- whether the output is policy, evidence, or execution handoff,
- stale/conflicting sections to omit or mark deferred.

## Acceptance criteria

1. Future agents can distinguish `.omx/plans` execution history from durable tracked planning docs.
2. Promotion requires the five-item checklist: durable value, non-duplicative, source-linked, current enough, not runtime churn.
3. No archive/rewrite/delete operation is implied or authorized.
4. No instruction force-adds `.omx` wholesale to tracked docs or version control.
5. Promotion remains HITL-gated and respects `docs/plans/README.md` authority hierarchy.
6. DOC-002 remains docs-only until a later approved promotion lane owns specific target files.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-omx-planning-history-promotion.md').read_text()
spec = Path('docs/plans/test-spec-omx-planning-history-promotion.md').read_text()
required = [
    'durable value',
    'non-duplicative',
    'source-linked',
    'current enough',
    'not runtime churn',
    'HITL',
    'no archive/rewrite/delete',
    'no force-add',
    '.omx/plans/**',
    'docs/plans/README.md',
    'docs/plans/kanban-prd-board.md',
    '.omx/plans/doc-sprawl-source-map.md',
]
missing = [item for item in required if item not in prd]
if missing:
    print('Missing PRD requirements:', missing)
    raise SystemExit(1)
if 'docs-only' not in spec or 'product roots' not in spec:
    print('Test spec must keep DOC-002 docs-only and out of product roots')
    raise SystemExit(1)
PY
```

## Explicit deferrals

- No promotion of specific `.omx/plans` artifacts in this lane.
- No archive, rewrite, deletion, or source-document move.
- No final decision that older `.omx` drafts are superseded.
- No product-code, schema, patient fixture, script, or test changes.
- No board edit; integration/verifier lanes own board changes under the backlog-expansion consensus addendum.
