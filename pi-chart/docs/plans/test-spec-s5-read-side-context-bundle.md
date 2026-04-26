# Test Spec — S5 read-side context-bundle

## Scope

Verify the S5 docs-only planning surface, not product behavior. Owned files for this lane are:

- `docs/plans/prd-s5-read-side-context-bundle.md`
- `docs/plans/test-spec-s5-read-side-context-bundle.md`
- optionally `docs/plans/kanban-prd-board.md` for a narrow S5 row / V03 successor-selection update only

Do not edit `src/`, `schemas/`, `patients/`, `scripts/`, `profiles/`, `package.json`, `package-lock.json`, ADRs, roadmap roots, memos, `pi-agent/`, or `pi-sim/` in this docs-only planning lane.

## Required content checks

| Check | Pass condition |
|---|---|
| HITL selection | PRD and spec state S5 and `s5-read-only`. |
| Source authority | PRD names `.omx/specs/deep-interview-v03-hitl-successor.md` and `docs/plans/v03-foundation-reconciliation-acceptance-report.md`. |
| Fingerprint supersession | PRD states context bundle remains selected and `No deterministic bundle fingerprint`. |
| Brownfield view inventory | PRD names existing read-side view surfaces and marks `src/views/bundle.ts` absent. |
| Consumer / contract shape | PRD includes consumer, input, output shape, and `source_view_refs`. |
| Existing profile registry | PRD states `S5 does not modify, depend on, or expand the existing profile registry`; checks verify `schemas/profiles/index.json` and `PROFILE_REGISTRY` exist. |
| Forbidden scope | PRD defers identity/hash-chain, pi-agent direct coupling, hidden simulator state, schema/validator/package/dependency changes, and product implementation. |
| Tracer bullets | `S5-TB-0` through `S5-TB-4` exist as future successor tracer bullets only. |
| Optional board update | If board is edited, the isolated S5 row/section contains S5, `s5-read-only`, both S5 doc links, and HITL. |

## Preflight baseline

Capture this before S5 planning edits in a dirty repo:

```bash
mkdir -p .omx/tmp
git diff --name-only -- src schemas patients scripts profiles package.json package-lock.json | sort > .omx/tmp/s5-read-side-preflight.txt
```

Pass condition: later product/dependency diffs match this baseline exactly. A globally clean repo is not assumed.

## Structural verification

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-s5-read-side-context-bundle.md')
spec_path = Path('docs/plans/test-spec-s5-read-side-context-bundle.md')
for path in [prd_path, spec_path]:
    if not path.exists():
        raise SystemExit(f'Missing {path}')
prd = prd_path.read_text()
spec = spec_path.read_text()
text = prd + '\n' + spec
required = [
    'S5',
    's5-read-only',
    '.omx/specs/deep-interview-v03-hitl-successor.md',
    'docs/plans/v03-foundation-reconciliation-acceptance-report.md',
    'src/views/bundle.ts is absent',
    'src/views/index.ts',
    'src/views/active.ts',
    'src/views/timeline.ts',
    'src/views/currentState.ts',
    'src/views/trend.ts',
    'src/views/evidenceChain.ts',
    'src/views/openLoops.ts',
    'src/views/narrative.ts',
    'src/views/memoryProof.ts',
    'src/views/projection.ts',
    'src/views/reviewState.ts',
    'src/views/attestationState.ts',
    'src/views/source.ts',
    'consumer',
    'input',
    'output shape',
    'source_view_refs',
    'S5 does not modify, depend on, or expand the existing profile registry',
    'No deterministic bundle fingerprint',
    'No identity/hash-chain',
    'No pi-agent direct coupling',
    'No hidden simulator state',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('Missing required S5 planning terms:\n' + '\n'.join(missing))
for tb in [f'S5-TB-{i}' for i in range(0, 5)]:
    if tb not in prd:
        raise SystemExit(f'Missing future successor tracer bullet {tb}')
forbidden = 'No ' + 'profile registry'
if forbidden in text:
    raise SystemExit(f'Forbidden stale registry phrase present: {forbidden}')
PY
```

## Absence/current-state verification

```bash
python3 - <<'PY'
from pathlib import Path
expected_absent = [
    Path('src/views/bundle.ts'),
    Path('profiles'),
    Path('schemas/profile.schema.json'),
    Path('src/hash.ts'),
    Path('src/identity.ts'),
]
for path in expected_absent:
    if path.exists():
        raise SystemExit(f'S5 docs-only planning expected absent surface to remain absent: {path}')
expected_present = [
    Path('schemas/profiles/index.json'),
    Path('src/validate.ts'),
]
for path in expected_present:
    if not path.exists():
        raise SystemExit(f'S5 planning expected current brownfield surface to exist: {path}')
if 'PROFILE_REGISTRY' not in Path('src/validate.ts').read_text():
    raise SystemExit('Expected src/validate.ts to load PROFILE_REGISTRY')
prd = Path('docs/plans/prd-s5-read-side-context-bundle.md').read_text()
for phrase in [
    'S5 does not modify, depend on, or expand the existing profile registry',
    'No deterministic bundle fingerprint',
    'No identity/hash-chain',
    'No pi-agent direct coupling',
    'No hidden simulator state',
    '`src/views/bundle.ts` is absent',
]:
    if phrase not in prd:
        raise SystemExit(f'Missing boundary/current-state phrase: {phrase}')
PY
```

## Product/dependency baseline comparison

```bash
current=$(mktemp)
git diff --name-only -- src schemas patients scripts profiles package.json package-lock.json | sort > "$current"
if [ -f .omx/tmp/s5-read-side-preflight.txt ]; then
  diff -u .omx/tmp/s5-read-side-preflight.txt "$current"
else
  cat "$current"
  test ! -s "$current"
fi
rm -f "$current"
```

Pass condition: no product, schema, script, profile, patient, or dependency-manifest diff beyond preflight baseline. This protects `schemas/profiles/index.json`, `schemas/event.schema.json`, `src/validate.ts`, `package.json`, and `package-lock.json` relative to baseline.

## Optional board-row verification

If `docs/plans/kanban-prd-board.md` is edited, verify the isolated S5 row/section rather than grepping the whole file:

```bash
python3 - <<'PY'
from pathlib import Path
board = Path('docs/plans/kanban-prd-board.md').read_text().splitlines()
matching = [line for line in board if 'S5-001 read-side context-bundle' in line]
if len(matching) != 1:
    raise SystemExit(f'Expected exactly one S5-001 board row, found {len(matching)}')
row = matching[0]
required = [
    'S5',
    's5-read-only',
    'prd-s5-read-side-context-bundle.md',
    'test-spec-s5-read-side-context-bundle.md',
    'HITL',
]
missing = [item for item in required if item not in row]
if missing:
    raise SystemExit('S5 board row missing terms:\n' + '\n'.join(missing))
PY
```

## Known verification gaps

- These checks cannot grant HITL approval for product implementation.
- These checks do not prove future bundle implementation correctness.
- These checks do not create or validate `src/views/bundle.ts`.
- No `npm test`, `npm run typecheck`, or `npm run check` is required for this docs-only planning lane. A future product implementation lane must add focused failing tests first.
