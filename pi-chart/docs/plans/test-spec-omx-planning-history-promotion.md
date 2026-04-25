# Test Spec — OMX planning history promotion

## Scope

This spec verifies DOC-002 as an executable docs-only maintenance/promotion surface. It checks that future agents can decide whether selected ignored/local `.omx` planning history should become a small tracked `docs/plans` summary without importing runtime churn, copying stale drafts, editing product roots, or mutating `.omx`.

Intended lane files are only:

- `docs/plans/prd-omx-planning-history-promotion.md`
- `docs/plans/test-spec-omx-planning-history-promotion.md`

`docs/plans/kanban-prd-board.md` remains the durable backlog entrypoint, but this lane must not directly edit the board. The PRD may contain a non-canonical future handoff snippet only.

## Structural checks

| Check | Method | Pass condition |
|---|---|---|
| PRD/test-spec pair exists | `test -f` for both DOC-002 files | Both tracked planning files exist. |
| Source inputs named | Search PRD for required source paths | Parent `.gitignore`, `.omx/plans/**`, `.omx/context/**`, `.omx/interviews/**`, `.omx/specs/**`, `docs/plans/README.md`, board, and source map are named. |
| Tracer bullets present | Search PRD and spec for `DOC2-TB-1` through `DOC2-TB-5` | Every tracer appears in both documents. |
| Owned files per tracer | Inspect PRD tracer table | Owned files are limited to DOC-002 PRD/spec; board is snippet-only. |
| First validation per tracer | Inspect PRD tracer table | Each tracer has a first failing/characterization validation. |
| Verification command per tracer | Inspect PRD tracer table | Each tracer has a concrete command. |
| Promotion criteria complete | Search PRD for criteria terms | Durable value, non-duplicative, source-linked, current enough, link rather than copy, decision, source path, current/stale status, next action, and not runtime churn are present. |
| Do-not-promote criteria complete | Search PRD for excluded classes | `.omx/state/**`, `.omx/logs/**`, runtime traces, session mechanics, whole `.omx`, duplicative drafts, stale unlabeled proposals, private/local credentials, hidden simulator state, and artifacts requiring move/rewrite/delete/archive before HITL are excluded. |
| HITL gate present | Search PRD and spec for HITL + action terms | No `.omx` move, rewrite, archive, delete, canonical promotion, or force-add occurs before human approval. |
| Board snippet non-canonical | Search PRD/spec for snippet language | The snippet is marked as a future handoff only and not a direct board edit request; integration/verifier owns board application. |
| Stale-duplication guard | Search PRD/spec for guard terms | Promoted summaries must be source-linked, current/stale-marked, non-duplicative, and link rather than copy old `.omx` drafts. |
| Docs-only lane boundary | `git diff --name-only` review with pre-lane baseline awareness | DOC-002 does not authorize `src`, `schemas`, `patients`, `scripts`, dependency, board, or `.omx` mutations. Existing unrelated diffs are not attributed to this lane. |

## Tracer validation matrix

| Tracer | Validation | Command |
|---|---|---|
| DOC2-TB-1 | PRD names `kanban-prd-board.md` as durable backlog entrypoint and blocks direct board edits. | `grep -n "durable backlog entrypoint\|no direct board edit\|integration/verifier" docs/plans/prd-omx-planning-history-promotion.md` |
| DOC2-TB-2 | PRD has promotion and do-not-promote criteria with link-not-copy summary fields. | `python3 - <<'PY'\nfrom pathlib import Path\nprd=Path('docs/plans/prd-omx-planning-history-promotion.md').read_text()\nrequired=['Promotion criteria','Do not promote criteria','link rather than copy','decision','source path','current/stale status','next action','small promotion card/summary only']\nmissing=[x for x in required if x not in prd]\nassert not missing, missing\nPY` |
| DOC2-TB-3 | PRD/spec enforce HITL before `.omx` movement, rewrite, archive, delete, canonical promotion, or force-add. | `grep -n "HITL\|move\|rewrite\|archive\|delete\|canonical promotion\|force-add" docs/plans/prd-omx-planning-history-promotion.md docs/plans/test-spec-omx-planning-history-promotion.md` |
| DOC2-TB-4 | Test spec mirrors all tracer IDs and includes the stale-duplication guard. | `python3 - <<'PY'\nfrom pathlib import Path\nspec=Path('docs/plans/test-spec-omx-planning-history-promotion.md').read_text()\nrequired=['DOC2-TB-1','DOC2-TB-2','DOC2-TB-3','DOC2-TB-4','DOC2-TB-5','stale-duplication guard']\nmissing=[x for x in required if x not in spec]\nassert not missing, missing\nPY` |
| DOC2-TB-5 | PRD/spec mark the board row as a non-canonical future handoff snippet only. | `grep -n "future handoff snippet only\|not a direct edit request\|integration/verifier owns board application" docs/plans/prd-omx-planning-history-promotion.md docs/plans/test-spec-omx-planning-history-promotion.md` |

## Validation command

```bash
python3 - <<'PY'
from pathlib import Path
import subprocess

prd_path = Path('docs/plans/prd-omx-planning-history-promotion.md')
spec_path = Path('docs/plans/test-spec-omx-planning-history-promotion.md')
expected = [prd_path, spec_path]
missing_files = [str(p) for p in expected if not p.exists()]
if missing_files:
    print('Missing files:', missing_files)
    raise SystemExit(1)

prd = prd_path.read_text()
spec = spec_path.read_text()

required_prd = [
    'Parent `.gitignore` rule for `.omx/`',
    '.omx/plans/**', '.omx/context/**', '.omx/interviews/**', '.omx/specs/**',
    'docs/plans/README.md', 'docs/plans/kanban-prd-board.md', '.omx/plans/doc-sprawl-source-map.md',
    'durable backlog entrypoint',
    'DOC2-TB-1', 'DOC2-TB-2', 'DOC2-TB-3', 'DOC2-TB-4', 'DOC2-TB-5',
    'Promotion criteria', 'Do not promote criteria',
    'durable value', 'Non-duplicative', 'Source-linked', 'Current enough',
    'link rather than copy', 'decision', 'source path', 'current/stale status', 'next action',
    '.omx/state/**', '.omx/logs/**', 'runtime traces', 'session mechanics', 'whole `.omx/`',
    'duplicative', 'stale unlabeled proposals', 'private/local credentials', 'hidden simulator state',
    'future handoff snippet only', 'not a direct edit request', 'integration/verifier owns board application',
    'No `.omx` move, rewrite, archive, delete, canonical promotion, or force-add occurs before HITL approval',
]
missing_prd = [term for term in required_prd if term not in prd]
if missing_prd:
    print('Missing PRD terms:', missing_prd)
    raise SystemExit(1)

required_spec = [
    'DOC2-TB-1', 'DOC2-TB-2', 'DOC2-TB-3', 'DOC2-TB-4', 'DOC2-TB-5',
    'stale-duplication guard', 'source-linked', 'current/stale-marked', 'non-duplicative', 'link rather than copy',
    'future handoff only', 'not a direct board edit request', 'integration/verifier owns board application',
    'docs/plans/prd-omx-planning-history-promotion.md',
    'docs/plans/test-spec-omx-planning-history-promotion.md',
]
missing_spec = [term for term in required_spec if term not in spec]
if missing_spec:
    print('Missing test-spec terms:', missing_spec)
    raise SystemExit(1)

product_status = subprocess.check_output(
    ['git', 'status', '--short', '--', 'src', 'schemas', 'patients', 'scripts', 'package.json', 'package-lock.json'],
    text=True,
).strip()
if product_status:
    print('Product/dependency-root status exists; compare to pre-lane baseline before attributing to DOC-002:')
    print(product_status)
    raise SystemExit(1)
PY
```

## Acceptance criteria

1. The PRD is thin, executable, and maintenance-only.
2. The PRD defines 3–6 tracer bullets; each bullet has owned files, first validation, verification command, and boundary.
3. The promotion checklist is complete and exact enough for future use.
4. The stale-duplication guard requires promoted summaries to be source-linked, current/stale-marked, non-duplicative, and link rather than copy old `.omx` drafts.
5. The HITL gate blocks silent promotion of local execution history into durable policy and blocks `.omx` move/rewrite/archive/delete/canonical promotion/force-add before approval.
6. Runtime churn, private/local state, hidden simulator state, stale unlabeled proposals, and wholesale `.omx` tracking are explicitly excluded.
7. Verification is docs-only and product/dependency-root status is compared to the pre-lane baseline before attribution.
8. Board changes are not required; any board row text in the PRD is a non-canonical future handoff only.

## Known gaps / explicit deferrals

- This spec does not choose any `.omx` artifact for promotion.
- This spec does not update `docs/plans/kanban-prd-board.md`; integration/verifier owns board edits.
- This spec does not require `npm test`, `npm run typecheck`, or `npm run check` because DOC-002 is docs-only.
- This spec does not archive, rewrite, delete, move, canonicalize, or force-add `.omx` content.
- This spec does not accept or reject clinical, actor, adapter, FHIR/openEHR, simulator, or product policy proposals by implication.
