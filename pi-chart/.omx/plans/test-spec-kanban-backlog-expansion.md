# Test Spec — Kanban backlog expansion consensus plan

## Scope

This test spec verifies a later backlog-expansion execution pass against `.omx/plans/prd-kanban-backlog-expansion.md`. It does not require product tests unless the later execution intentionally starts an implementation card, which this PRD forbids.

## Required outputs after execution

| Artifact | Required |
|---|---:|
| `docs/plans/kanban-prd-board.md` updated | yes |
| `docs/plans/prd-phase-a-completion-to-implementation-bridge.md` tightened | yes |
| `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md` tightened | yes |
| `docs/plans/prd-v03-foundation-reconciliation.md` | yes |
| `docs/plans/test-spec-v03-foundation-reconciliation.md` | yes |
| `docs/plans/prd-adr17-actor-attestation-decision.md` | yes |
| `docs/plans/test-spec-adr17-actor-attestation-decision.md` | yes |
| `docs/plans/prd-adapter-boundary-future-work.md` | yes |
| `docs/plans/test-spec-adapter-boundary-future-work.md` | yes |
| `docs/plans/prd-omx-planning-history-promotion.md` | yes |
| `docs/plans/test-spec-omx-planning-history-promotion.md` | yes |

## Structural checks

```bash
python3 - <<'PY'
from pathlib import Path
expected = [
  'docs/plans/prd-phase-a-completion-to-implementation-bridge.md',
  'docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md',
  'docs/plans/prd-v03-foundation-reconciliation.md',
  'docs/plans/test-spec-v03-foundation-reconciliation.md',
  'docs/plans/prd-adr17-actor-attestation-decision.md',
  'docs/plans/test-spec-adr17-actor-attestation-decision.md',
  'docs/plans/prd-adapter-boundary-future-work.md',
  'docs/plans/test-spec-adapter-boundary-future-work.md',
  'docs/plans/prd-omx-planning-history-promotion.md',
  'docs/plans/test-spec-omx-planning-history-promotion.md',
]
missing = [p for p in expected if not Path(p).exists()]
if missing:
    print('Missing expected planning artifacts:')
    print('\n'.join(missing))
    raise SystemExit(1)
PY
```

```bash
python3 - <<'PY'
from pathlib import Path
board = Path('docs/plans/kanban-prd-board.md').read_text(errors='ignore')
required_cards = ['PHA-001', 'V03-001', 'ADR17-001', 'BND-001', 'DOC-002']
missing = [card for card in required_cards if card not in board]
if missing:
    print('Missing board cards:', missing)
    raise SystemExit(1)
PY
```

```bash
python3 - <<'PY'
from pathlib import Path
surface = ''
for p in Path('docs/plans').glob('*.md'):
    surface += p.read_text(errors='ignore') + '\n'
missing = [str(p) for p in sorted(Path('clinical-reference/phase-a').glob('*.md')) if str(p) not in surface]
if missing:
    print('Missing Phase A source coverage:')
    print('\n'.join(missing))
    raise SystemExit(1)
PY
```

## Non-product-code check

The later backlog-expansion execution should not modify product implementation roots:

```bash
git diff --name-only -- src schemas patients scripts
```

Pass condition: no new changes from the backlog-expansion execution appear under those roots. Pre-existing changes from earlier Workstream A work must be called out separately if still present.

## Content checks

Each new PRD/test-spec pair must include:

- source inputs
- source authority / proposal status
- in scope / out of scope
- acceptance criteria
- verification command or structural check
- HITL gate
- next action

## Parallelization checks

The board must state:

- which PRD creation lanes can run in parallel
- which later implementation lanes likely share `schemas/event.schema.json` or `src/validate.ts`
- which cards are docs-only vs implementation-ready

## Known verification gaps

- This test spec cannot prove future HITL approval.
- This test spec does not run `npm test` because the consensus PRD forbids product implementation in the backlog-expansion pass.

## Consensus review addendum checks

### Preflight baseline

Before backlog-expansion execution, capture:

```bash
git status --short -- src schemas patients scripts
git diff --name-only -- src schemas patients scripts
git ls-files --others --exclude-standard -- src schemas patients scripts
```

Final verification compares against this baseline and must prove no new product-root changes were introduced by the backlog-expansion pass.

### Exact Phase A canonical coverage

```bash
python3 - <<'PY'
from pathlib import Path
phase_files = [str(p) for p in sorted(Path('clinical-reference/phase-a').glob('*.md'))]
candidates = [Path('docs/plans/phase-a-status-matrix.md'), Path('docs/plans/kanban-prd-board.md')]
text = ''
for p in candidates:
    if p.exists():
        t = p.read_text(errors='ignore')
        if 'Phase A current file coverage' in t or p.name == 'phase-a-status-matrix.md':
            text += t + '\n'
missing = [p for p in phase_files if text.count(p) == 0]
duplicates = [p for p in phase_files if text.count(p) > 1]
if missing or duplicates:
    print('Missing Phase A source coverage:', missing)
    print('Duplicate Phase A source coverage:', duplicates)
    raise SystemExit(1)
PY
```

### Thin PRD content limit

Thin PRDs for V03/ADR17/BND/DOC must target 150-200 lines or less and include only source inputs, authority/proposal status, decision options, HITL gate, acceptance criteria, verification, and explicit deferrals. They must not contain broad implementation plans unless HITL later selects the card.

### ADR17 status check

```bash
grep -E "proposed|non-canonical|HITL/ADR approval" docs/plans/prd-adr17-actor-attestation-decision.md
```

### Board ownership check

The execution handoff must name a single integration/verifier owner for final `docs/plans/kanban-prd-board.md` updates. Parallel lanes may own only their distinct PRD/test-spec files and board row snippets.
