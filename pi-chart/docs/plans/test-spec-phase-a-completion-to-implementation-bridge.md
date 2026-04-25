# Test Spec — Phase A completion-to-implementation bridge

## Scope

This test spec verifies the planning bridge and the handoff shape for product implementation. It proves that future agents can select Phase A cards with enough context to start from tests and avoid re-reading all memos.

## Structural checks

| Check | Method | Pass condition |
|---|---|---|
| Durable surface exists | `test -f docs/plans/kanban-prd-board.md` | Board exists in tracked docs path. |
| PRD/test-spec pair exists | `test -f docs/plans/prd-phase-a-completion-to-implementation-bridge.md && test -f docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md` | Both files exist. |
| Phase A docs represented exactly once | Python check in PHA-TB-0 | Every `clinical-reference/phase-a/*.md` appears exactly once in `docs/plans/phase-a-status-matrix.md`. |
| Memos captured | grep board for required memo paths | `/memos` research files are listed as evidence/proposal inputs. |
| Ready cards executable | grep card fields | Each ready tracer card has purpose, owned files, first test/validation, boundary, and verification. |
| Scoped-change pass | `git diff --name-only` review | Planning-surface updates are docs-only; later tracer execution may edit only files owned by the selected card. |

## Validation commands

```bash
test -f docs/plans/kanban-prd-board.md
test -f docs/plans/prd-phase-a-completion-to-implementation-bridge.md
test -f docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md
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
```

## Acceptance criteria

1. The durable tracked board exists and points to the next PRD/test-spec pair.
2. The board explicitly states that `/memos` and research reports are captured as evidence/proposal layers.
3. Current A8/A9a files are visible exactly once in `docs/plans/phase-a-status-matrix.md`.
4. Phase A bridge tracer cards are context-efficient enough to delegate.
5. Product code changes are scoped to selected tracer-bullet cards; planning-surface maintenance remains docs-only.

## Known gaps

- The board summarizes local `.omx` artifacts but does not promote all of them into tracked docs.
- Final implementation priority remains a HITL decision.
- Product tests are not required for this planning-only pass; future implementation cards must run `npm test`, `npm run typecheck`, and `npm run check`.
