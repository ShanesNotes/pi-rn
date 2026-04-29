Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.

# Test Spec — ADR17-002 dashboard disposition

## Scope

This spec verifies that `ADR17-002` is an executable decision plan, not implementation authorization. It validates the PRD structure, tracer bullets, HITL checkpoint, explicit deferrals, brownfield characterization commands, and canonical/product/package/script guard. The lane covers only `docs/plans/dashboard.html` and the `scripts/dashboard*.ts` family. Agent-canvas disposition is deferred to `ADR17-003` and must not be authored, decided, or implemented by this lane.

## Per-bullet validation matrix

| Card | First failing/characterization test or validation | Verification command |
|---|---|---|
| ADR17-002-TB-0 Authority/source conflict lock | PRD contains every required source, the non-canonical status, brownfield authority, and the README/ADR018/source-authority tension. | Python structural script below. |
| ADR17-002-TB-1 HITL disposition packet | PRD contains accept/banner/retire/promote/defer, required HITL answers, and consequences. | Python structural script below. |
| ADR17-002-TB-2 Brownfield dashboard characterization | Read-only commands characterize whether dashboard files, npm scripts, and gitignore status match brownfield reality; must not be treated as implementation approval. | `ls -la docs/plans/dashboard.html scripts/dashboard.ts scripts/dashboard.test.ts scripts/dashboard-dev.ts`; `grep -n "dashboard" package.json docs/plans/README.md`; `git ls-files docs/plans/dashboard.html`; `git log --oneline -- docs/plans/dashboard.html scripts/dashboard.ts scripts/dashboard.test.ts scripts/dashboard-dev.ts \| head` |
| ADR17-002-TB-3 ADR 018 / source-authority cross-check | PRD cites ADR 018 directional-evidence framing, the non-deletion non-goal, and the verbatim quarantine banner phrase from `source-authority.md:109`; defers agent-canvas to `ADR17-003`. | Python structural script below. |
| ADR17-002-TB-4 Post-approval implementation handoff | PRD names future tests-first implementation files and blocks them in this lane. | `git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock docs/plans/dashboard.html docs/plans/README.md` must catch any modified or untracked canonical/product/package/script/dashboard/README files. |

## Structural validation command

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-adr17-002-dashboard-disposition.md')
spec_path = Path('docs/plans/test-spec-adr17-002-dashboard-disposition.md')
prd = prd_path.read_text()
spec = spec_path.read_text()
status = 'Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.'
required_prd = [
    status,
    '## RALPLAN-DR summary',
    '## Source inputs and brownfield authority',
    'docs/plans/kanban-prd-board.md',
    'docs/plans/phase-a-bridge-acceptance-report.md',
    'decisions/017-actor-attestation-review-taxonomy.md',
    'decisions/018-architecture-rebase-clinical-truth-substrate.md',
    'docs/architecture/source-authority.md',
    '.omx/specs/deep-interview-kanban-dashboard.md',
    '.omx/plans/ralplan-kanban-dashboard.md',
    'docs/plans/disposition-memo-a9b-prd-vs-adr-018.md',
    'docs/plans/dashboard.html',
    'scripts/dashboard.ts',
    'scripts/dashboard.test.ts',
    'scripts/dashboard-dev.ts',
    'package.json',
    'docs/plans/README.md',
    '## Refined acceptance criteria',
    '## Thin tracer bullets',
    'ADR17-002-TB-0', 'ADR17-002-TB-1', 'ADR17-002-TB-2', 'ADR17-002-TB-3', 'ADR17-002-TB-4',
    '## HITL checkpoint',
    'accept', 'banner', 'retire', 'promote', 'defer',
    '## Decision consequences and follow-on boundaries',
    '## Explicit deferrals',
    'Post-approval implementation outline (not authorized now)',
    'Historical/prototype artifact. Not current architectural authority.',
    'directional product evidence',
    'non-deletion',
    'ADR17-003',
    'agent-canvas',
    'git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock docs/plans/dashboard.html docs/plans/README.md',
]
required_spec = [
    status,
    '## Per-bullet validation matrix',
    'ADR17-002-TB-0', 'ADR17-002-TB-1', 'ADR17-002-TB-2', 'ADR17-002-TB-3', 'ADR17-002-TB-4',
    'canonical/product/package/script guard',
    'package manifest',
    'untracked',
    'decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock docs/plans/dashboard.html docs/plans/README.md',
    'agent-canvas',
    'ADR17-003',
]
missing = [item for item in required_prd if item not in prd]
missing += [f'spec:{item}' for item in required_spec if item not in spec]
if prd.splitlines()[0].strip() != status:
    missing.append('PRD first line changed from non-canonical status')
if spec.splitlines()[0].strip() != status:
    missing.append('spec first-line status')
for required_boundary in ['bounded chart/EHR', 'pi-agent', 'pi-sim', 'hidden simulator']:
    if required_boundary not in prd:
        missing.append(f'boundary:{required_boundary}')
accepted_status = 'Status:' + ' accepted'
if accepted_status in prd or accepted_status in spec:
    missing.append('forbidden accepted status phrase')
if missing:
    print('Failed ADR17-002 dashboard-disposition decision-plan checks:')
    for item in missing:
        print('-', item)
    raise SystemExit(1)
print('ADR17-002 dashboard-disposition decision-plan structural checks passed')
print(f'PRD lines: {len(prd.splitlines())}')
print(f'Test spec lines: {len(spec.splitlines())}')
PY

ls -la docs/plans/dashboard.html scripts/dashboard.ts scripts/dashboard.test.ts scripts/dashboard-dev.ts
grep -n "dashboard" package.json docs/plans/README.md
git ls-files docs/plans/dashboard.html
git log --oneline -- docs/plans/dashboard.html scripts/dashboard.ts scripts/dashboard.test.ts scripts/dashboard-dev.ts | head

git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock docs/plans/dashboard.html docs/plans/README.md
```

Expected canonical/product/package/script guard output: empty for this lane. The guard must catch modified and untracked files. If output is non-empty because the repo was already dirty, compare against the pre-existing baseline and prove this `ADR17-002` planning lane did not introduce those changes. Package manifests and lockfiles are included to verify no new dependencies or package-surface changes were made by this lane. `docs/plans/dashboard.html` and `docs/plans/README.md` are included because any disposition implementation would touch one of them and this planning lane must not.

The brownfield characterization commands are read-only:

- `ls -la` confirms file presence and size; expect `docs/plans/dashboard.html` ~38KB, `scripts/dashboard.ts` ~289 lines, `scripts/dashboard.test.ts` ~182 lines, `scripts/dashboard-dev.ts` ~105 lines.
- `grep -n "dashboard" package.json docs/plans/README.md` confirms the `"dashboard"` and `"dashboard:dev"` npm scripts and the `Dashboard` section in the README.
- `git ls-files docs/plans/dashboard.html` is expected to be empty (the file is gitignored as a build artifact); a non-empty result means the dashboard is currently tracked, which would change the baseline for promotion option D.
- `git log --oneline` confirms the dashboard family's git history is intact.

## Acceptance criteria

1. Both `ADR17-002` decision files exist under `docs/plans/` and start with the non-canonical status warning.
2. The PRD contains refined acceptance criteria, five thin tracer bullets, owned files, first validations/tests, verification commands, explicit deferrals, decision options with tradeoffs, decision consequences, post-approval implementation outline, intended board row snippet, available-agent-types roster, and a HITL checkpoint with at least seven required answers.
3. The test spec validates each tracer bullet without requiring product implementation.
4. The brownfield characterization commands are read-only and do not imply policy acceptance or any disposition outcome.
5. The canonical/product/package/script guard confirms no canonical ADR, product-root, package manifest, lockfile, modified-file, or untracked-file changes under `decisions`, `src`, `schemas`, `patients`, `scripts`, `package.json`, lockfiles, `docs/plans/dashboard.html`, or `docs/plans/README.md` from this lane.
6. Future implementation commands (`npm test`, `npm run typecheck`, `npm run check`) are named only as post-HITL handoff gates.

## Known gaps / deferred validation

- No product test is added in this lane because `ADR17-002` is non-canonical.
- No banner injection, `.draft/` retirement, CI wiring, or canonical edit is made until HITL records a disposition.
- No schema, validator, projection, fixture, package/dependency surface, or write-path behavior is changed.
- Agent-canvas baseline disposition is not validated here; it belongs to `ADR17-003 Agent-canvas disposition`, gated on ADR 018 spike acceptance. Any agent-canvas-related assertions in this lane are limited to confirming the deferral, not deciding it.
