# Test Spec — OMX planning history promotion

## Scope

This spec verifies DOC-002 as a thin maintenance/promotion surface. It checks that future agents can decide whether a `.omx/plans` artifact should become a tracked `docs/plans` summary without importing runtime churn or changing product roots.

## Structural checks

| Check | Method | Pass condition |
|---|---|---|
| PRD/test-spec pair exists | `test -f` for both DOC-002 files | Both tracked planning files exist. |
| Source inputs named | grep PRD for required source paths | `.omx/plans/**`, `docs/plans/README.md`, board, and source map are named. |
| Promotion checklist complete | grep PRD for five checklist terms | Durable value, non-duplicative, source-linked, current enough, and not runtime churn are present. |
| HITL gate present | grep PRD for `HITL` | Promotion beyond this pair requires human approval. |
| No wholesale `.omx` tracking | grep PRD for force-add prohibition | PRD forbids force-adding `.omx` wholesale. |
| No archive/rewrite operation | grep PRD for archive/rewrite/delete prohibition | PRD does not authorize destructive document operations. |
| Docs-only boundary | `git diff --name-only` review | This lane changes only the two DOC-002 files. |

## Validation command

```bash
python3 - <<'PY'
from pathlib import Path
expected = [
    Path('docs/plans/prd-omx-planning-history-promotion.md'),
    Path('docs/plans/test-spec-omx-planning-history-promotion.md'),
]
missing_files = [str(p) for p in expected if not p.exists()]
if missing_files:
    print('Missing files:', missing_files)
    raise SystemExit(1)
prd = expected[0].read_text()
required_prd = [
    '.omx/plans/**',
    'docs/plans/README.md',
    'docs/plans/kanban-prd-board.md',
    '.omx/plans/doc-sprawl-source-map.md',
    'durable value',
    'non-duplicative',
    'source-linked',
    'current enough',
    'not runtime churn',
    'HITL',
    'no archive/rewrite/delete',
    'no force-add',
]
missing_terms = [term for term in required_prd if term not in prd]
if missing_terms:
    print('Missing PRD terms:', missing_terms)
    raise SystemExit(1)
status = __import__('subprocess').check_output(
    ['git', 'status', '--short', '--', *map(str, expected)], text=True
).splitlines()
seen = {line[3:] for line in status if len(line) > 3}
expected_names = {str(p) for p in expected}
if not expected_names.issubset(seen):
    print('DOC-002 files not both present in status:', status)
    raise SystemExit(1)
product_status = __import__('subprocess').check_output(
    ['git', 'status', '--short', '--', 'src', 'schemas', 'patients', 'scripts'], text=True
).strip()
if product_status:
    print('Product-root status exists; compare to pre-lane baseline, do not attribute to DOC-002 blindly:')
    print(product_status)
PY
```

## Acceptance criteria

1. The PRD is thin and maintenance-only.
2. The promotion checklist is complete and exact enough for future use.
3. The HITL gate blocks silent promotion of local execution history into durable policy.
4. Runtime churn and wholesale `.omx` tracking are explicitly excluded.
5. Verification is docs-only and product-root status is compared to the pre-lane baseline before attribution.

## Known gaps / explicit deferrals

- This spec does not choose any `.omx/plans` artifact for promotion.
- This spec does not update `docs/plans/kanban-prd-board.md`; integration owns board edits.
- This spec does not require `npm test`, `npm run typecheck`, or `npm run check` because DOC-002 is docs-only.
- This spec does not archive, rewrite, delete, or move source documents.
