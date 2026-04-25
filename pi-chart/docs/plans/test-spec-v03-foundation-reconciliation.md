# Test Spec — V03 foundation reconciliation

## Scope

Verify the thin V03 decision PRD, not product behavior. This lane creates only:

- `docs/plans/prd-v03-foundation-reconciliation.md`
- `docs/plans/test-spec-v03-foundation-reconciliation.md`

It must not edit `docs/plans/kanban-prd-board.md`, product roots, roadmap roots, memos, or ADR files.

## Required content checks

| Check | Pass condition |
|---|---|
| Source inputs present | PRD/test spec name the v0.3 memo, `ROADMAP.md`, accepted ADR 009/010/011/015/016, and proposed ADR 017. |
| Authority preserved | Accepted ADRs are canonical; v0.3 memo is evidence/proposal; ADR17 is proposed/non-canonical. |
| Decision shape thin | PRD stays a decision/backlog surface, target <=200 lines, no broad implementation plan. |
| Options present | PRD lists decision options and rejects direct implementation from memo alone. |
| HITL gate present | PRD states operator approval required before proposed/deferred items become implementation scope. |
| Acceptance criteria present | PRD has explicit acceptance criteria for reconciliation output. |
| Deferrals present | PRD explicitly defers unaccepted profiles, governance, protocols, ordersets, adapter/internal-model work, and product-code changes. |

## Structural verification

```bash
python3 - <<'PY'
from pathlib import Path
files = [
  Path('docs/plans/prd-v03-foundation-reconciliation.md'),
  Path('docs/plans/test-spec-v03-foundation-reconciliation.md'),
]
for path in files:
    if not path.exists():
        print(f'Missing {path}')
        raise SystemExit(1)
    lines = path.read_text().splitlines()
    if path.name.startswith('prd-') and len(lines) > 200:
        print(f'{path} exceeds thin PRD target: {len(lines)} lines')
        raise SystemExit(1)
PY
```

## Authority and source verification

```bash
python3 - <<'PY'
from pathlib import Path
text = '\n'.join(p.read_text(errors='ignore') for p in [
    Path('docs/plans/prd-v03-foundation-reconciliation.md'),
    Path('docs/plans/test-spec-v03-foundation-reconciliation.md'),
])
required = [
  'memos/pi-chart-v03-memo.md',
  'ROADMAP.md',
  'decisions/009-contradicts-link-and-resolves.md',
  'decisions/010-evidence-ref-roles.md',
  'decisions/011-transform-activity-provenance.md',
  'decisions/015-adr-009-011-implementation.md',
  'decisions/016-broad-ehr-skeleton-clinical-memory.md',
  'decisions/017-actor-attestation-review-taxonomy.md',
  'accepted',
  'canonical',
  'evidence/proposal',
  'proposed/non-canonical',
  'HITL',
  'Deferred',
]
missing = [item for item in required if item not in text]
if missing:
    print('Missing required content:')
    print('\n'.join(missing))
    raise SystemExit(1)
PY
```

## Ownership verification

Because other agents may edit other docs concurrently, compare against the lane preflight baseline instead of assuming `docs/plans` is otherwise clean. This lane's owned output set is exactly:

- `docs/plans/prd-v03-foundation-reconciliation.md`
- `docs/plans/test-spec-v03-foundation-reconciliation.md`

```bash
python3 - <<'PY'
from pathlib import Path
owned = [
  Path('docs/plans/prd-v03-foundation-reconciliation.md'),
  Path('docs/plans/test-spec-v03-foundation-reconciliation.md'),
]
missing = [str(p) for p in owned if not p.exists()]
if missing:
    print('Missing owned files:')
    print('\n'.join(missing))
    raise SystemExit(1)
PY

git diff --name-only -- src schemas patients scripts
```

Pass condition: owned files exist and product-root diff has no new paths beyond the captured preflight baseline for this lane.

## Known verification gaps

- These checks cannot grant HITL approval.
- These checks do not prove future reconciliation quality; they only prove the thin decision surface has the required authority, option, gate, acceptance, verification, and deferral structure.
- No `npm test` is required because this is planning-only and product code is out of scope.
