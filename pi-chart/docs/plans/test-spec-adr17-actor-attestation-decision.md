Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.

# Test Spec — ADR17 actor attestation decision

## Scope

This spec verifies that `ADR17-001` is an executable decision plan, not implementation authorization. It validates the PRD structure, tracer bullets, HITL checkpoint, explicit deferrals, brownfield characterization commands, and canonical/product/package guard.

## Per-bullet validation matrix

| Card | First failing/characterization test or validation | Verification command |
|---|---|---|
| ADR17-TB-0 Authority/source conflict lock | PRD contains every required source, the non-canonical status, brownfield authority, and proposal/memo tension. | Python structural script below. |
| ADR17-TB-1 HITL disposition packet | PRD contains accept/revise/split/defer/reject, required HITL answers, and consequences. | Python structural script below. |
| ADR17-TB-2 Brownfield schema/validator characterization | Read-only grep characterizes whether current code already contains ADR17 policy markers; it must not be treated as implementation approval. | `grep -RIn "V-REVIEW\|V-ATTEST\|claim_review\|attestation\|review_status\|attested_by" schemas src patients || true` |
| ADR17-TB-3 Split/revision design card | PRD separately names `action.claim_review.v1` and `communication.attestation.v1` and keeps both deferred unless HITL approves. | Python structural script below. |
| ADR17-TB-4 Post-approval implementation handoff | PRD names future tests-first implementation files and blocks them in this lane. | `git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock` must catch modified and untracked canonical/product/package files. |

## Structural validation command

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-adr17-actor-attestation-decision.md')
spec_path = Path('docs/plans/test-spec-adr17-actor-attestation-decision.md')
prd = prd_path.read_text()
spec = spec_path.read_text()
status = 'Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.'
required_prd = [
    status,
    '## RALPLAN-DR summary',
    '## Source inputs and brownfield authority',
    'decisions/017-actor-attestation-review-taxonomy.md',
    'memos/Actor-attestation-taxonomy.md',
    '.omx/plans/workstream-a-memory-proof-acceptance-report.md',
    '.omx/plans/prd-kanban-backlog-expansion.md',
    '## Refined acceptance criteria',
    '## Thin tracer bullets',
    'ADR17-TB-0', 'ADR17-TB-1', 'ADR17-TB-2', 'ADR17-TB-3', 'ADR17-TB-4',
    '## HITL checkpoint',
    'accept', 'revise', 'split', 'defer', 'reject',
    'action.claim_review.v1',
    'communication.attestation.v1',
    '## Explicit deferrals',
    'Post-approval implementation outline (not authorized now)',
    'schemas/event.schema.json',
    'src/validate.ts',
    'git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock',
]
required_spec = [
    status,
    '## Per-bullet validation matrix',
    'ADR17-TB-0', 'ADR17-TB-1', 'ADR17-TB-2', 'ADR17-TB-3', 'ADR17-TB-4',
    'canonical/product/package guard',
    'package manifest',
    'untracked',
    'decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock',
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
    print('Failed ADR17 decision-plan checks:')
    for item in missing:
        print('-', item)
    raise SystemExit(1)
print('ADR17 decision-plan structural checks passed')
print(f'PRD lines: {len(prd.splitlines())}')
print(f'Test spec lines: {len(spec.splitlines())}')
PY

grep -RIn "V-REVIEW\|V-ATTEST\|claim_review\|attestation\|review_status\|attested_by" schemas src patients || true

git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock
```

Expected canonical/product/package guard output: empty for this lane. The guard must catch modified and untracked files. If output is non-empty because the repo was already dirty, compare against the pre-existing baseline and prove this ADR17 planning lane did not introduce those changes. Package manifests and lockfiles are included to verify no new dependencies or package-surface changes were made by this lane.

## Acceptance criteria

1. Both ADR17 decision files exist under `docs/plans/` and start with the non-canonical status warning.
2. The PRD contains refined acceptance criteria, 3–6 thin tracer bullets, owned files, first validations/tests, verification commands, explicit deferrals, decision options with tradeoffs, and a HITL checkpoint.
3. The test spec validates each tracer bullet without requiring product implementation.
4. The brownfield characterization command is read-only and does not imply policy acceptance.
5. Canonical/product/package guard confirms no canonical ADR, product-root, package manifest, lockfile, modified-file, or untracked-file changes under `decisions`, `src`, `schemas`, `patients`, `scripts`, `package.json`, or lockfiles from this lane.
6. Future implementation commands (`npm test`, `npm run typecheck`, `npm run check`) are named only as post-HITL handoff gates.

## Known gaps / deferred validation

- No product test is added in this lane because ADR17 is non-canonical.
- No canonical ADR update is made until HITL records a disposition.
- No schema, validator, projection, fixture, package/dependency surface, or write-path behavior is changed.
- If HITL approves implementation, the first execution lane must add characterization/failing tests before policy code.
