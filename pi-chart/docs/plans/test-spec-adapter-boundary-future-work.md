# Test Spec — BND-001 Adapter Boundary Future Work

## Status and source inputs

- Paired PRD: `docs/plans/prd-adapter-boundary-future-work.md`.
- Scope: structural verification for executable planning cards in a deferred-boundary lane.
- Product-root behavior remains authoritative; this spec validates planning docs only.
- Source inputs:
  - `memos/definitive-fhir-boundary-pi-chart.md`
  - `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
  - `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
  - `ROADMAP.md`
  - `ARCHITECTURE.md`
  - `README.md`
  - `.omx/plans/workstream-a-memory-proof-acceptance-report.md`

## Authority / proposal status checks

The PRD must state:

- FHIR is external read/export boundary only.
- openEHR is a Git-transaction/audit inspiration only, not an internal ontology.
- Workstream A acceptance report defers adapters, export/fingerprint contract, and proposed ADR17 policy.
- Adapter API shapes and module/file plans remain proposal-only until a later HITL-selected adapter PRD.
- Current repo behavior outranks proposed future architecture.

## Tracer-bullet checks

Each tracer bullet must include purpose, owned files, first validation, verification command, and boundary rule:

- BND-TB-0 Authority quarantine and source inventory.
- BND-TB-1 Consumer/readiness and boundary-mode matrix.
- BND-TB-2 Chart-visible source eligibility.
- BND-TB-3 FHIR/openEHR decision ledger.
- BND-TB-4 Promotion split and deferral guard.

## Decision and HITL checks

The PRD must expose decision options for:

- keeping BND-001 deferred;
- promoting only a research spike;
- promoting a future adapter PRD after a concrete consumer exists;
- splitting FHIR/openEHR/audit/UI surfaces;
- rejecting or superseding the boundary strategy.

The HITL gate must require consumer, directionality, representation, fingerprint scope, rejected surfaces, HITL owner, allowed source surfaces, forbidden source surfaces, and hidden-simulator-leak decisions before implementation.

## Structural verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-adapter-boundary-future-work.md')
test_path = Path('docs/plans/test-spec-adapter-boundary-future-work.md')
board_path = Path('docs/plans/kanban-prd-board.md')
prd = prd_path.read_text()
test = test_path.read_text()
board = board_path.read_text()
required_prd = [
  'executable planning cards for a deferred boundary lane; not an adapter build plan',
  'RALPLAN-DR summary',
  'Brownfield boundary reality',
  'Consumer readiness matrix',
  'What pi-chart may later expose',
  'What pi-chart must not know',
  'Refined acceptance criteria',
  'Thin tracer bullets',
  'Deferral / readiness decision options',
  'HITL checkpoint before implementation',
  'Boundary risks and anti-coupling rules',
  'proposal-only adapter API/file/test quarantine',
  'HITL owner',
  'Without this record, BND-001 stays deferred and docs-only',
  'Explicit deferrals',
  'memos/definitive-fhir-boundary-pi-chart.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/pi-chart-openEHR-cycle-decision-synthesis.md',
  'ROADMAP.md',
  'ARCHITECTURE.md',
  'README.md',
  '.omx/plans/workstream-a-memory-proof-acceptance-report.md',
]
for needle in required_prd:
    if needle not in prd:
        print(f'Missing PRD requirement: {needle}')
        raise SystemExit(1)
for bullet in [f'BND-TB-{i}' for i in range(5)]:
    if prd.count(bullet) < 1 or test.count(bullet) < 1:
        print(f'Missing tracer bullet in PRD/test spec: {bullet}')
        raise SystemExit(1)
for phrase in [
    'Named consumer',
    'Boundary mode',
    'First representation',
    'Fingerprint/export scope',
    'Allowed source surfaces',
    'Forbidden sources',
    'HITL owner',
    'no hidden simulator state may cross the boundary',
]:
    if phrase not in prd:
        print(f'Missing HITL/boundary phrase: {phrase}')
        raise SystemExit(1)
for forbidden in [
    'src/adapters/fhir/',
    'exportMemoryProof(',
    'class Fhir',
    'interface Adapter',
    'api contract is accepted',
    'pi-sim source may be read',
    'pi-agent may call pi-sim',
    'hidden simulator state is allowed',
]:
    if forbidden in prd:
        print(f'Forbidden adapter/coupling content in PRD: {forbidden}')
        raise SystemExit(1)
if 'BND-001 adapter/boundary future work' not in board:
    print('Missing BND-001 board row')
    raise SystemExit(1)
if len(prd.splitlines()) > 220 or len(test.splitlines()) > 180:
    print('Context-efficient PRD/test-spec line budget exceeded')
    raise SystemExit(1)
print('BND-001 structural checks passed')
PY
```

## Acceptance criteria

1. PRD and test spec both exist under `docs/plans/`.
2. Both files remain context-efficient: PRD ≤220 lines, test spec ≤180 lines.
3. PRD includes source inputs, authority/proposal status, RALPLAN-DR summary, brownfield reality, refined acceptance criteria, tracer bullets, HITL gate, boundary risks, verification command, and explicit deferrals.
4. Each tracer bullet includes owned files, first validation, verification command, and boundary rule.
5. PRD forbids speculative adapter implementation and does not assign product-root implementation files.
6. Product roots remain untouched by this lane.
7. Board keeps BND-001 visible as deferred boundary planning, not execution.

## Product-root no-touch check

```bash
git status --short -- src schemas patients scripts
```

Expected output for this lane: no new BND-attributable tracked or untracked entries.

## Explicit deferrals under test

- No adapter code, schemas, fixtures, scripts, runtime interfaces, or product tests.
- No FHIR/openEHR import/write/server/runtime/auth implementation.
- No accepted fingerprint/export contract without separate HITL selection.
- No ADR17 actor/attestation/review policy adoption.
- No direct `pi-agent` to `pi-sim` path and no hidden `pi-sim` source dependency.
