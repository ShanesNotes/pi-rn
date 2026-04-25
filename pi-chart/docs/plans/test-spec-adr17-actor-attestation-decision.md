# Test Spec — ADR17 actor attestation decision

## Scope

This test spec verifies that `ADR17-001` is a thin decision/backlog surface, not an implementation plan. It proves the PRD preserves non-canonical status, names source inputs, exposes the human decision gate, and avoids product-root changes.

## Structural checks

| Check | Method | Pass condition |
|---|---|---|
| PRD exists | `test -f docs/plans/prd-adr17-actor-attestation-decision.md` | PRD file exists. |
| Test spec exists | `test -f docs/plans/test-spec-adr17-actor-attestation-decision.md` | Test spec file exists. |
| Non-canonical first line | Python `startswith` check | PRD begins with the exact proposed/non-canonical status warning. |
| Board-row snippet status | Python substring check | Intended board row begins with the same status warning and names `ADR17-001`. |
| Required sources | Python substring check | ADR 017, actor-attestation memo, Workstream A report, and backlog addendum are named. |
| Decision options | Python substring check | Accept, revise, split, defer, and reject are all represented. |
| HITL gate | Python substring check | Product policy implementation is blocked pending HITL/ADR approval. |
| Explicit deferrals | Python substring check | Schema, validator, projection, write-path, and attestation implementation are deferred. |
| Thin PRD size | `wc -l` or Python count | PRD is at or below 200 lines. |
| Product-root guard | `git diff --name-only -- src schemas patients scripts` | This docs-only lane introduces no product-root changes. |

## Validation command

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-adr17-actor-attestation-decision.md')
spec_path = Path('docs/plans/test-spec-adr17-actor-attestation-decision.md')
prd = prd_path.read_text()
spec = spec_path.read_text()
status = 'Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.'
checks = {
    'prd exists': prd_path.exists(),
    'spec exists': spec_path.exists(),
    'status first line': prd.startswith(status),
    'board snippet status': f'{status} `ADR17-001`' in prd,
    'ADR source': 'decisions/017-actor-attestation-review-taxonomy.md' in prd,
    'memo source': 'memos/Actor-attestation-taxonomy.md' in prd,
    'Workstream A report': '.omx/plans/workstream-a-memory-proof-acceptance-report.md' in prd,
    'backlog addendum': '.omx/plans/prd-kanban-backlog-expansion.md' in prd,
    'accept option': '| Accept |' in prd,
    'revise option': '| Revise |' in prd,
    'split option': '| Split |' in prd,
    'defer option': '| Defer |' in prd,
    'reject option': '| Reject |' in prd,
    'HITL gate': '## HITL gate' in prd,
    'explicit deferrals': '## Explicit deferrals' in prd,
    'thin PRD': len(prd.splitlines()) <= 200,
    'product-root guard noted': 'no product-root changes' in spec,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    print('Failed checks:', failed)
    raise SystemExit(1)
print('ADR17 decision PRD checks passed')
print(f'PRD lines: {len(prd.splitlines())}')
PY

git diff --name-only -- src schemas patients scripts
```

Expected product-root diff output: empty. If output is non-empty, compare against the baseline captured by the integration/verifier lane and confirm this ADR17 lane did not introduce those changes.

## Acceptance criteria

1. Both ADR17 decision files exist under `docs/plans/`.
2. PRD line count is at or below 200 lines.
3. PRD and intended board row preserve proposed/non-canonical status.
4. Human decision options and HITL approval gate are explicit.
5. The PRD does not authorize implementation policy.
6. Verification command passes.
7. Product-root diff check shows no product-root changes from this lane.

## Known gaps

- `docs/plans/kanban-prd-board.md` is not updated here because that file belongs to the integration/verifier lane.
- No product tests are required for this docs-only decision PRD.
- Final policy wording remains pending HITL/ADR review.
