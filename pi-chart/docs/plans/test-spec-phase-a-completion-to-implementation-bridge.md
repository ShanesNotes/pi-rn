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
| Ready cards executable | Python heading/field check | Each ready tracer card (PHA-TB-0/1/2/3/V/4) has purpose, owned files, first failing/characterization test, and verification. |
| Open-schema ledger comprehensive | Python substring check | All 30 A8/A9a candidate anchors, A9b disposition anchors, and the full status vocabulary appear in the PRD before implementation. |
| TB-2/TB-3 disjoint from validator | Python owned-files inspection | Neither PHA-TB-2 nor PHA-TB-3 owns `src/validate.ts`, `src/validate.test.ts`, or `schemas/event.schema.json`; only PHA-TB-V does. |
| Acceptance report linked to evidence | Python substring + regex check | When `phase-a-bridge-acceptance-report.md` exists, it quotes a known TB verification command verbatim and includes a stdout/exit-code excerpt. |
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
for card in ['PHA-TB-0', 'PHA-TB-1', 'PHA-TB-2', 'PHA-TB-3', 'PHA-TB-V', 'PHA-TB-4']:
    start = prd.find(f'### {card}')
    if start == -1:
        raise SystemExit(f'Missing card heading: {card}')
    end_candidates = [prd.find('\n### PHA-TB-', start + 1), prd.find('\n## Explicit deferrals', start + 1)]
    end_candidates = [idx for idx in end_candidates if idx != -1]
    section = prd[start:min(end_candidates) if end_candidates else len(prd)]
    required_terms = ['Purpose:', 'Owned files', 'First failing/characterization test', 'Verification command:']
    missing = [term for term in required_terms if term not in section]
    if missing:
        raise SystemExit(f'{card} missing fields: {missing}')

# All 30 a8/a9a candidate anchors and A9b disposition anchors must be classified.
prd_required = [
    'a8-exam-finding-shape','a8-system-taxonomy-and-coverage','a8-finding-state-negative-missingness',
    'a8-normal-wdl-semantics','a8-finding-vocabulary-scope','a8-body-site-encoding',
    'a8-session-identity-and-completeness','a8-prn-trigger-shape','a8-reassessment-response-coupling',
    'a8-nursing-scope-assessment-boundary','a8-assessment-cadence-openloops','a8-wound-skin-artifact-refs',
    'a8-a7-structured-vs-narrative-boundary','a8-a5-lda-site-boundary','a8-current-state-axis-for-exam',
    'a9a-canonical-subtype','a9a-order-kind-registry','a9a-indication-exception-shape',
    'a9a-verbal-order-metadata','a9a-order-lifecycle-discontinue-cancel','a9a-occurrence-identity',
    'a9a-prn-trigger-shape','a9a-conditional-hold-titration-payload','a9a-result-fulfillment-pathway',
    'a9a-blood-product-order-shape','a9a-restraint-order-shape','a9a-monitoring-order-vs-monitoring-plan',
    'a9a-protocol-standing-order-boundary','a9a-isolation-and-code-status-boundaries',
    'a9a-source-kind-channel-boundary',
    'a9b-invocation-as-event-vs-derived','a9b-parent-child-link-convention',
    'a9b-orderset-modification-mid-invocation','a9b-set-level-openloops-vs-child-level',
    'orderset-definition-home','orderset-runtime-subtype-promotion','orderset-override-rationale-home',
    'orderset-template-scoping','orderset-cds-suggestion-boundary',
    'a9b-orderset-vs-protocol-vs-standing-order-vs-care-plan-taxonomy',
    'a9b-orderset-vs-order-panel-distinction','a9b-standing-order-authentication-loop',
    'a9b-protocol-decision-branch-boundary','a9b-personalization-model',
    'a9b-cross-orderset-deduplication','a9b-orderset-version-mismatch-handling',
    'a9b-blood-product-prepare-transfuse-coupling-as-mini-orderset',
    'a9b-indication-exception-shape','a9b-order-occurrence-uri-beyond-meddose',
    'a9b-verbal-text-channel-invocation-authentication','a9b-session-identity-recurrence',
    'accepted-direction','HITL-needed',
]
missing = [item for item in prd_required if item not in prd]
if missing:
    print('Missing executable-card ledger terms:', missing)
    raise SystemExit(1)

# Disjoint-ownership: TB-2 and TB-3 must NOT own validator or schema files.
def section_text(name):
    s = prd.find(f'### {name}')
    if s == -1: raise SystemExit(f'{name} not found')
    e_candidates = [prd.find('\n### PHA-TB-', s + 1), prd.find('\n## Explicit deferrals', s + 1)]
    e_candidates = [i for i in e_candidates if i != -1]
    return prd[s:min(e_candidates) if e_candidates else len(prd)]

forbidden_in_views = ['src/validate.ts', 'src/validate.test.ts', 'schemas/event.schema.json']
for tb in ['PHA-TB-2', 'PHA-TB-3']:
    sec = section_text(tb)
    owned = sec.split('Owned files', 1)[-1].split('First failing/characterization test', 1)[0]
    leaks = [f for f in forbidden_in_views if f in owned and 'NOT owned' not in owned.split(f, 1)[0][-80:]]
    if leaks:
        print(f'{tb} owned-files block leaks validator/schema files:', leaks)
        raise SystemExit(1)

# TB-V must own all three.
tbv = section_text('PHA-TB-V')
tbv_owned = tbv.split('Owned files', 1)[-1].split('Edit-scope guard rails', 1)[0]
for f in forbidden_in_views:
    if f not in tbv_owned:
        print(f'PHA-TB-V missing required owned file: {f}')
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
3. Current A8/A9a/A9b files are visible exactly once in `docs/plans/phase-a-status-matrix.md`.
4. Phase A bridge tracer cards are context-efficient enough to delegate: each names owned files, the first failing/characterization test, the verification command, and deferrals.
5. A8/A9a candidate open-schema deltas and A9b disposition anchors are visible as candidates, not silently accepted policy.
6. Product code changes are not authorized by this planning pass; any dirty product-root baseline is treated as out-of-scope until a selected tracer-bullet card owns it.
7. A HITL checkpoint remains required before implementation.

## Known gaps

- The board summarizes local `.omx` artifacts but does not promote all of them into tracked docs.
- Final implementation priority remains a HITL decision among PHA-TB-1, PHA-TB-2, and PHA-TB-3; A9b product implementation is intentionally deferred.
- Product tests are not required for this planning-only pass; future implementation cards must run `npm test`, `npm run typecheck`, and `npm run check`.
- `docs/plans/phase-a-bridge-acceptance-report.md` is intentionally absent until a selected implementation card has evidence.
- Current workspace may contain unrelated dirty files. They are not PHA-001 evidence and must be resolved or explicitly baselined before implementation begins.
