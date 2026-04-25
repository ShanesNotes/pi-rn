# Test Spec — BND-001 Adapter Boundary Future Work

## Status and source inputs

- Paired PRD: `docs/plans/prd-adapter-boundary-future-work.md`.
- Scope: structural verification for a thin deferred-boundary PRD.
- Source inputs:
  - `memos/definitive-fhir-boundary-pi-chart.md`
  - `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
  - `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
  - `ROADMAP.md`
  - `.omx/plans/workstream-a-memory-proof-acceptance-report.md`

## Authority / proposal status checks

The PRD must state:

- FHIR is external read/export boundary only.
- openEHR is a Git-transaction/audit inspiration only, not an internal ontology.
- Workstream A acceptance report defers adapters, export/fingerprint contract, and proposed ADR17 policy.
- Adapter API shapes and module/file plans remain proposal-only until a later HITL-selected adapter PRD.

## Decision and HITL checks

The PRD must expose decision options for:

- keeping BND-001 deferred;
- promoting only a research spike;
- promoting a future adapter PRD after a concrete consumer exists;
- splitting FHIR/openEHR/audit/UI surfaces;
- rejecting or superseding the boundary strategy.

The HITL gate must require consumer, directionality, representation, fingerprint scope, and hidden-simulator-leak decisions before implementation.

## Structural verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-adapter-boundary-future-work.md')
test_path = Path('docs/plans/test-spec-adapter-boundary-future-work.md')
prd = prd_path.read_text()
test = test_path.read_text()
required_prd = [
  'thin deferred-boundary PRD; not an adapter build plan',
  'memos/definitive-fhir-boundary-pi-chart.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/pi-chart-openEHR-cycle-decision-synthesis.md',
  'ROADMAP.md',
  '.omx/plans/workstream-a-memory-proof-acceptance-report.md',
  'Authority / proposal status',
  'Deferral / readiness decision options',
  'HITL gate',
  'Explicit deferrals',
]
for needle in required_prd:
    if needle not in prd:
        print(f'Missing PRD requirement: {needle}')
        raise SystemExit(1)
for forbidden in [
    'src/adapters/fhir/',
    'exportMemoryProof(',
    'Implementation plan',
    'Owned files:',
]:
    if forbidden in prd:
        print(f'Forbidden adapter-build content in PRD: {forbidden}')
        raise SystemExit(1)
if len(prd.splitlines()) > 200 or len(test.splitlines()) > 200:
    print('Thin PRD/test-spec line budget exceeded')
    raise SystemExit(1)
if 'src/' in ''.join(Path(p).as_posix() for p in Path('docs/plans').glob('prd-adapter-boundary-future-work.md')):
    print('Unexpected product-root ownership reference')
    raise SystemExit(1)
print('BND-001 structural checks passed')
PY
```

## Acceptance criteria

1. PRD and test spec both exist under `docs/plans/`.
2. Both files are thin: each is 200 lines or less.
3. PRD includes source inputs, authority/proposal status, deferral/readiness options, HITL gate, acceptance criteria, verification command, and explicit deferrals.
4. PRD forbids speculative adapter implementation and does not assign product-root files.
5. Product roots remain untouched by this lane.

## Product-root no-touch check

```bash
git diff --name-only -- src schemas patients scripts
```

Expected output for this lane: no new entries attributable to BND-001.

## Explicit deferrals under test

- No adapter code, schemas, fixtures, scripts, or product tests.
- No FHIR/openEHR import/write/server/runtime/auth implementation.
- No accepted fingerprint/export contract without separate HITL selection.
- No ADR17 actor/attestation/review policy adoption.
