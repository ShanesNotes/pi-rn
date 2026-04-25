# Test Spec — V03 foundation reconciliation

## Scope

Verify the executable planning surface for `V03-001`, not product behavior. Owned files for this lane are:

- `docs/plans/prd-v03-foundation-reconciliation.md`
- `docs/plans/test-spec-v03-foundation-reconciliation.md`
- optionally `docs/plans/kanban-prd-board.md` for the V03 row only

Do not edit `src/`, `schemas/`, `patients/`, `scripts/`, `profiles/`, ADRs, roadmap roots, or memos.

## Required content checks

| Check | Pass condition |
|---|---|
| Source authority | PRD names board, roadmap, v0.3 memo, ADR 009/010/011/015/016, and proposed ADR17. |
| Buckets complete | PRD includes all buckets: `accepted/current`, `stale/superseded`, `deferred/backlog`, `needs-ADR/HITL`, `rejected/out-of-scope`. |
| Brownfield reality | PRD records `0.3.0-partial`, implemented ADR 009/010/011 surfaces, and absent profile/hash/identity/bundle surfaces. |
| Tracer bullets complete | `V03-TB-1` through `V03-TB-5` exist and include owned files, first characterization validation, verification command, and product-code exclusion. |
| Row-level dispositions | Reconciliation table includes evidence link, bucket, current repo truth, HITL flag, and next lane/disposition. |
| HITL exactness | HITL checkpoint lists exact operator choices before any implementation handoff. |
| Deferrals explicit | PRD defers profiles, ADR17 governance, protocols/ordersets/problem threads, suppression/incidents, hash/identity, invalidation cache, context bundle, adapters/internal model, coupling, dependencies, and product-root changes. |

## Preflight baseline

Capture this before any future V03 implementation-planning edit in a dirty repo:

```bash
mkdir -p .omx/tmp
{
  git diff --name-only -- src schemas patients scripts profiles || true
} | sort > .omx/tmp/v03-product-root-preflight.txt
```

Pass condition: later product-root diffs match this baseline exactly. A globally clean repo is not assumed.

## Structural verification

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-v03-foundation-reconciliation.md')
spec_path = Path('docs/plans/test-spec-v03-foundation-reconciliation.md')
for path in [prd_path, spec_path]:
    if not path.exists():
        raise SystemExit(f'Missing {path}')
prd = prd_path.read_text()
spec = spec_path.read_text()
text = prd + '\n' + spec
required = [
  'docs/plans/kanban-prd-board.md',
  'ROADMAP.md',
  'memos/pi-chart-v03-memo.md',
  'decisions/009-contradicts-link-and-resolves.md',
  'decisions/010-evidence-ref-roles.md',
  'decisions/011-transform-activity-provenance.md',
  'decisions/015-adr-009-011-implementation.md',
  'decisions/016-broad-ehr-skeleton-clinical-memory.md',
  'decisions/017-actor-attestation-review-taxonomy.md',
  'accepted/current', 'stale/superseded', 'deferred/backlog',
  'needs-ADR/HITL', 'rejected/out-of-scope',
  'proposed/non-canonical', '0.3.0-partial',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('Missing required V03 terms:\n' + '\n'.join(missing))
for tb in [f'V03-TB-{i}' for i in range(1, 6)]:
    if tb not in prd:
        raise SystemExit(f'Missing tracer bullet {tb}')
for header in ['Owned files', 'First characterization validation', 'Verification command', 'Product-code exclusion']:
    if header not in prd:
        raise SystemExit(f'Missing tracer bullet column: {header}')
PY
```

## Brownfield absence/current-state verification

```bash
python3 - <<'PY'
from pathlib import Path
expected_absent = [
  Path('profiles'),
  Path('src/hash.ts'),
  Path('src/identity.ts'),
  Path('src/views/bundle.ts'),
  Path('schemas/profile.schema.json'),
]
for path in expected_absent:
    if path.exists():
        raise SystemExit(f'V03 planning expected absent surface to remain absent: {path}')
prd = Path('docs/plans/prd-v03-foundation-reconciliation.md').read_text()
for phrase in [
  'No `profiles/`',
  'No `src/hash.ts`',
  'No `src/identity.ts`',
  'No `src/views/bundle.ts`',
  'No `schemas/profile.schema.json`',
  '`schema_version: 0.3.0-partial`',
]:
    if phrase not in prd:
        raise SystemExit(f'Missing brownfield phrase: {phrase}')
PY
```

## Product-root baseline comparison

```bash
current=$(mktemp)
git diff --name-only -- src schemas patients scripts profiles | sort > "$current"
if [ -f .omx/tmp/v03-product-root-preflight.txt ]; then
  diff -u .omx/tmp/v03-product-root-preflight.txt "$current"
else
  # Fallback for a clean planning lane: print any product-root edits.
  cat "$current"
  test ! -s "$current"
fi
rm -f "$current"
```

Pass condition: no product-root diff beyond preflight baseline.

## Optional board-row verification

If the board is edited, verify it still links V03 artifacts and shows HITL-gated status:

```bash
python3 - <<'PY'
from pathlib import Path
board = Path('docs/plans/kanban-prd-board.md').read_text()
required = [
  'V03-001 v0.3 foundation reconciliation',
  'prd-v03-foundation-reconciliation.md',
  'test-spec-v03-foundation-reconciliation.md',
  'HITL',
]
missing = [item for item in required if item not in board]
if missing:
    raise SystemExit('Board missing V03 row terms:\n' + '\n'.join(missing))
PY
```

## Known verification gaps

- These checks cannot grant HITL approval.
- These checks do not prove future implementation correctness; they only prove the V03 planning surface preserves authority, brownfield reality, explicit deferrals, and no product-root changes.
- No `npm test` is required for this planning-only lane. Product implementation lanes must add focused tests before code.
