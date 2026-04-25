# Test Spec — Phase A completion-to-implementation bridge

## Scope

This test spec verifies the planning bridge and the handoff shape for product implementation. It proves that future agents can select Phase A cards with enough context to start from tests and avoid re-reading all memos.

## Structural checks

| Check | Method | Pass condition |
|---|---|---|
| Durable surface exists | `test -f docs/plans/kanban-prd-board.md` | Board exists in tracked docs path. |
| PRD/test-spec pair exists | `test -f docs/plans/prd-phase-a-completion-to-implementation-bridge.md && test -f docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md` | Both files exist. |
| Phase A docs represented exactly once | Python check in PHA-TB-0 | Every `clinical-reference/phase-a/*.md` appears exactly once in `docs/plans/phase-a-status-matrix.md`. |
| Board links PHA-001 artifacts | Python substring check | Board links PRD, test spec, and status matrix. |
| Memos captured | grep board for required memo paths | `/memos` research files are listed as evidence/proposal inputs. |
| Ready cards executable | Python heading/field check | Each ready tracer card has purpose, owned files, first failing/characterization test, boundary, verification, and explicit deferrals. |
| Open-schema ledger present | Python substring check | A8/A9a delta anchors and status vocabulary are present before implementation. |
| PHA-001 scoped-change pass | Targeted `git diff --name-only -- <PHA-001 files>` review plus dirty-baseline capture | PHA-001 evidence is limited to the four focused planning docs; unrelated dirty files are listed as out-of-scope baseline and must be resolved or explicitly carried before implementation. |

## Validation commands

```bash
test -f docs/plans/kanban-prd-board.md
test -f docs/plans/prd-phase-a-completion-to-implementation-bridge.md
test -f docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md
python3 - <<'PY'
from pathlib import Path
board = Path('docs/plans/kanban-prd-board.md').read_text()
required_links = [
  'prd-phase-a-completion-to-implementation-bridge.md',
  'test-spec-phase-a-completion-to-implementation-bridge.md',
  'phase-a-status-matrix.md',
]
missing_links = [item for item in required_links if item not in board]
if missing_links:
    print('Missing PHA-001 artifact links:', missing_links)
    raise SystemExit(1)
PY
python3 - <<'PY'
from pathlib import Path
board = Path('docs/plans/kanban-prd-board.md').read_text()
required = [
  'memos/Workstream A PRD test.md',
  'memos/deep-research-alignment-revised-2026-04-25.md',
  'memos/deep-research-report24042026.md',
  'memos/pi-chart-v03-memo.md',
]
missing = [item for item in required if item not in board]
if missing:
    print('Missing memo evidence:', missing)
    raise SystemExit(1)
PY
python3 - <<'PY'
from pathlib import Path
phase = sorted(str(p) for p in Path('clinical-reference/phase-a').glob('*.md'))
matrix = Path('docs/plans/phase-a-status-matrix.md').read_text()
missing = [p for p in phase if matrix.count(p) == 0]
duplicates = [p for p in phase if matrix.count(p) > 1]
if missing or duplicates:
    print('Missing Phase A files from matrix:', missing)
    print('Duplicate Phase A files in matrix:', duplicates)
    raise SystemExit(1)
PY
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-phase-a-completion-to-implementation-bridge.md').read_text()
for card in ['PHA-TB-0', 'PHA-TB-1', 'PHA-TB-2', 'PHA-TB-3', 'PHA-TB-4']:
    start = prd.find(f'### {card}')
    if start == -1:
        raise SystemExit(f'Missing card heading: {card}')
    end_candidates = [prd.find('\n### PHA-TB-', start + 1), prd.find('\n## Explicit deferrals', start + 1)]
    end_candidates = [idx for idx in end_candidates if idx != -1]
    section = prd[start:min(end_candidates) if end_candidates else len(prd)]
    required_terms = ['Purpose:', 'Owned files', 'First failing/characterization test', 'Implementation boundary:', 'Verification command:']
    missing = [term for term in required_terms if term not in section]
    if missing:
        raise SystemExit(f'{card} missing fields: {missing}')
prd_required = [
  'a8-exam-finding-shape',
  'a8-session-identity-and-completeness',
  'a8-prn-trigger-shape',
  'a8-reassessment-response-coupling',
  'a8-assessment-cadence-openloops',
  'a9a-canonical-subtype',
  'a9a-order-kind-registry',
  'a9a-verbal-order-metadata',
  'a9a-order-lifecycle-discontinue-cancel',
  'a9a-result-fulfillment-pathway',
  'accepted-direction',
  'HITL-needed',
]
missing = [item for item in prd_required if item not in prd]
if missing:
    print('Missing executable-card ledger terms:', missing)
    raise SystemExit(1)
PY
python3 - <<'PY'
import subprocess
focus = [
  'docs/plans/kanban-prd-board.md',
  'docs/plans/prd-phase-a-completion-to-implementation-bridge.md',
  'docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md',
  'docs/plans/phase-a-status-matrix.md',
]
changed_focus = set(filter(None, subprocess.check_output(['git', 'diff', '--name-only', '--', *focus], text=True).splitlines()))
expected = set(focus) | {f'pi-chart/{p}' for p in focus}
unexpected = sorted(path for path in changed_focus if path not in expected)
if unexpected:
    print('Unexpected PHA-001 focused changes:', unexpected)
    raise SystemExit(1)
baseline = subprocess.check_output(['git', 'status', '--short', '--untracked-files=all'], text=True)
out_of_scope = [line for line in baseline.splitlines() if not any(line.endswith(path) or line.endswith(f'pi-chart/{path}') for path in focus)]
if out_of_scope:
    print('Out-of-scope dirty baseline to resolve or carry before implementation:')
    print('\n'.join(out_of_scope))
PY
```

## Acceptance criteria

1. The durable tracked board exists and points to the next PRD/test-spec pair.
2. The board explicitly states that `/memos` and research reports are captured as evidence/proposal layers.
3. Current A8/A9a files are visible exactly once in `docs/plans/phase-a-status-matrix.md`.
4. Phase A bridge tracer cards are context-efficient enough to delegate: each names owned files, the first failing/characterization test, the verification command, and deferrals.
5. A8/A9a candidate open-schema deltas are visible as candidates, not silently accepted policy.
6. Product code changes are not authorized by this planning pass; any dirty product-root baseline is treated as out-of-scope until a selected tracer-bullet card owns it.
7. A HITL checkpoint remains required before implementation.

## Known gaps

- The board summarizes local `.omx` artifacts but does not promote all of them into tracked docs.
- Final implementation priority remains a HITL decision among PHA-TB-1, PHA-TB-2, and PHA-TB-3.
- Product tests are not required for this planning-only pass; future implementation cards must run `npm test`, `npm run typecheck`, and `npm run check`.
- `docs/plans/phase-a-bridge-acceptance-report.md` is intentionally absent until a selected implementation card has evidence.
- Current workspace may contain unrelated dirty files. They are not PHA-001 evidence and must be resolved or explicitly baselined before implementation begins.
