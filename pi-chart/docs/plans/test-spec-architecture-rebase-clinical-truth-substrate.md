# Test Spec — Architecture Rebase: Clinical Truth Substrate

## Scope

Structural verification for the architecture rebase planning lane. First execution is docs/source-authority only.

## Required artifacts

- `.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md`
- `docs/plans/prd-architecture-rebase-clinical-truth-substrate.md`
- `docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md`
- `decisions/018-architecture-rebase-clinical-truth-substrate.md`
- `docs/architecture/source-authority.md`

## Structural checks

### Plan artifact check

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md')
t = p.read_text()
required = [
  'Clinical truth first',
  'Projection over presentation',
  'Boundary adapters, not hidden coupling',
  'Evidence before rewrite',
  'Context hygiene is architecture',
  'Clean-slate Option B',
  'ADR 018',
  'source-authority',
  'filesystem',
  'prototype',
  'hidden simulator',
  'Ralph handoff guidance',
]
missing = [x for x in required if x not in t]
if missing:
    raise SystemExit(f'Missing required plan content: {missing}')
PY
```

### PRD/test-spec existence check

```bash
test -f docs/plans/prd-architecture-rebase-clinical-truth-substrate.md
test -f docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md
```

### ADR 018 check

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('decisions/018-architecture-rebase-clinical-truth-substrate.md')
t = p.read_text()
required = [
  'Context', 'Decision', 'Drivers', 'Alternatives considered',
  'Why chosen', 'Consequences', 'Follow-ups',
  'clinical truth substrate', 'hybrid migration', 'clean-slate',
  'filesystem', 'prototype', 'hidden simulator'
]
missing = [x for x in required if x not in t]
if missing:
    raise SystemExit(f'Missing ADR 018 content: {missing}')
PY
```

### Source-authority map check

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('docs/architecture/source-authority.md')
t = p.read_text()
required = [
  'Canonical architecture',
  'Accepted decisions',
  'Active planning',
  'Prototype/directional evidence',
  'Historical/proposal-only',
  'Deprecated / do-not-use-for-implementation',
  'Runtime/transient artifacts',
  'README.md', 'DESIGN.md', 'ARCHITECTURE.md', 'ROADMAP.md',
  'decisions/', 'docs/design/', 'docs/prototypes/', 'memos/', '.omx/plans/'
]
missing = [x for x in required if x not in t]
if missing:
    raise SystemExit(f'Missing source-authority content: {missing}')
PY
```

### Docs-only lane guard

```bash
if git diff --name-only -- src schemas patients scripts | grep .; then
  echo 'Unexpected product-root changes during docs-only lane'
  exit 1
fi
```

### Baseline validation after any docs-only lane

```bash
npm test
npm run validate -- --patient patient_001
npm run validate -- --patient patient_002
```

## Clean-slate spike acceptance checks

A later spike passes only if it can compare outputs against current filesystem backend for patient_002:

- `currentState(axis=all)` equivalent.
- `trend` for `spo2`, `heart_rate`, `respiratory_rate` equivalent.
- `openLoops` equivalent.
- One `evidenceChain` rooted at a patient_002 assessment equivalent.
- `contextBundle` equivalent enough to preserve source-view refs and evidence/provenance.

Spike must remain explicitly experimental until ADR 019.
