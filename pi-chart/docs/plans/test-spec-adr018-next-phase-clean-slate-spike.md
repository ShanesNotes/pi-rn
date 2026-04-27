# Test Spec — ADR 018 Next Phase: Clean-slate Spike Charter

## Scope

Structural verification for the ADR 018 next-phase planning/contract lane. This test spec verifies that the clean-slate spike is bounded, falsifiable, and non-implementation in NP1.

## Required artifacts

- `.omx/plans/plan-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/prd-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`
- `decisions/018-architecture-rebase-clinical-truth-substrate.md`
- `docs/architecture/source-authority.md`

## Structural checks

### Plan content check

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('.omx/plans/plan-adr018-next-phase-clean-slate-spike.md')
t = p.read_text()
required = [
  'ADR 018 Next Phase',
  'clean-slate',
  'ADR 019',
  'No new dependencies',
  'evidence matrix',
  'golden projection',
  'currentState',
  'trend',
  'openLoops',
  'evidenceChain',
  'contextBundle',
  'src/views/index.ts',
  'Guard-only dirty evidence is not acceptable for NP2',
  'No new dependencies',
  'patient_002',
  'hidden pi-sim',
  'No production refactor until ADR 019',
  'experiments/adr019-event-store-spike',
  'evidence matrix',
  'Hard rule: ADR 019 cannot recommend rewrite',
  'No production refactor until ADR 019',
]
missing = [x for x in required if x not in t]
if missing:
    raise SystemExit(f'Missing required plan content: {missing}')
PY
```

### PRD content check

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('docs/plans/prd-adr018-next-phase-clean-slate-spike.md')
t = p.read_text()
required = [
  'Status and authority',
  'Problem',
  'Goals',
  'Non-goals',
  'Requirements',
  'Owned files for NP1',
  'Forbidden files for NP1',
  'NP1', 'NP2', 'NP3',
  'ADR 019',
  'No new dependencies',
  'evidence matrix',
  'currentState', 'trend', 'openLoops', 'evidenceChain', 'contextBundle',
  'src/views/index.ts',
  'Guard-only dirty evidence is not acceptable for NP2',
]
missing = [x for x in required if x not in t]
if missing:
    raise SystemExit(f'Missing PRD content: {missing}')
PY
```

### Source-authority consistency check

```bash
python3 - <<'PY'
from pathlib import Path
adr = Path('decisions/018-architecture-rebase-clinical-truth-substrate.md').read_text()
auth = Path('docs/architecture/source-authority.md').read_text()
for phrase in ['clean-slate', 'spike', 'ADR 019', 'hidden simulator']:
    if phrase not in adr and phrase not in auth:
        raise SystemExit(f'Missing source authority phrase: {phrase}')
PY
```

### NP1 production-root guard

```bash
if git diff --name-only -- src schemas patients scripts package.json package-lock.json | grep .; then
  echo 'Unexpected production-root/package changes during NP1 planning lane'
  exit 1
fi
```

### NP1 owned-file guard

```bash
python3 - <<'PY'
from pathlib import Path
allowed = {
  '.omx/plans/plan-adr018-next-phase-clean-slate-spike.md',
  'docs/plans/prd-adr018-next-phase-clean-slate-spike.md',
  'docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md',
}
# This check is intended for an NP1-only execution branch. It ignores pre-existing
# dirty files but fails if any ADR018-next-phase filename outside the allowed set exists.
for p in Path('.').rglob('*adr018-next-phase-clean-slate-spike*'):
    if p.is_file():
        s = p.as_posix()
        if s not in allowed:
            raise SystemExit(f'Unexpected ADR018 next-phase artifact: {s}')
PY
```

## Later NP2 spike acceptance checks

A later isolated spike must add its own executable checks, but the minimum contract is:

- Existing tests pass: `npm test`.
- Existing validations pass:
  - `npm run validate -- --patient patient_001`
  - `npm run validate -- --patient patient_002`
- Baseline capture uses current public `src/index.ts` views where exported; `contextBundle` uses `src/views/index.ts` unless a separate root API export decision is approved. Baseline capture never uses hidden simulator state.
- NP2 runs from a clean commit/stash-isolated baseline or a separate worktree; dirty baseline evidence is rejected. Guard-only dirty evidence is not acceptable for NP2.
- No new dependencies. No package/dependency files are edited unless a separate dependency ADR authorizes them.
- Candidate clean-slate output compares against patient_002 golden surfaces:
  - `currentState({ axis: "all" })`
  - `trend` for `spo2`, `heart_rate`, `respiratory_rate`
  - `openLoops()`
  - one mixed-support `evidenceChain()`
  - `contextBundle()`
- Output report states whether ADR 019 should choose clean-slate rewrite, hybrid migration, or defer rewrite.
