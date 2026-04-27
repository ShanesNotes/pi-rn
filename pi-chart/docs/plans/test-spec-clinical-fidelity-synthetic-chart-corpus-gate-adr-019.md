# Test Spec — Clinical-fidelity Synthetic Chart Corpus Gate for ADR 019

## Scope

Structural verification for the first docs/test-contract slice of the ADR 019 Corpus Readiness Gate. This spec verifies that the durable PRD and test contract define a prerequisite gate, not ADR 019, and that the lane remains documentation-only.

## Required artifacts

- `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `decisions/001-mimic-to-synthea.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`
- `decisions/018-architecture-rebase-clinical-truth-substrate.md`
- `docs/architecture/source-authority.md`
- `clinical-reference/broad-ehr-skeleton.md`

## Pass/fail checklist table

| Check | Method | Pass condition | Fail condition |
|---|---|---|---|
| Gate identity | Search PRD/spec for gate identity terms | `prerequisite gate`, `not ADR 019`, and `ADR 019` dependency language are present. | Gate is framed as ADR 019 itself or as rewrite authorization. |
| ADR evidence inputs | Search PRD for required packet terms | ADR evidence requires both `ADR018 spike input` and `corpus readiness packet`. | Either spike comparison or corpus packet can be omitted. |
| Six surfaces | Search PRD/spec checklist | Flowsheets/vitals, nursing assessment, notes/narrative charting, orders/medications/interventions, labs/diagnostics, and care plan/handoff are all present. | Any surface is missing or lacks pass/fail framing. |
| Memory-proof sections | Search PRD/spec for section names | What happened, why it mattered, evidence/provenance, uncertainty, open loops, and next-shift handoff are present. | Any required section is missing. |
| Provenance/timing | Search PRD/spec for provenance terms | Effective/recorded time or interval semantics plus source/author/transform provenance are required. | Chart facts can pass without provenance/timing. |
| Source tags | Search PRD/spec for source-mix terms | Source tags distinguish Synthea baseline, hand-crafted ICU acute portions, and chart-visible sources. | Generated data or hidden state can pass without source labeling. |
| Synthea augmentation | Search PRD/spec for Synthea guardrails | Synthea seed/version/parameters and hand-crafted ICU acute augmentation are required or explicitly placeholdered. | Synthea alone can be treated as sufficient clinical truth. |
| No-hidden-state boundary | Search PRD/spec for hidden-state terms | Hidden simulator physiology/state is excluded from chart truth and pi-agent context. | Hidden simulator state can count as corpus evidence. |
| Operator review | Search PRD/spec for review artifact and signoff | `docs/plans/clinical-fidelity-corpus-review-adr-019.md` is named and pass / conditional pass / fail signoff is required. | Operator review is unnamed or lacks explicit outcome states. |
| Minimum corpus matrix | Search PRD/spec for corpus minimums | `>=5` patients, varied admits, multi-day encounters, follow-up notes, six-surface coverage, provenance/timing, open loops, and evidence-chain stress are required. | Corpus can pass on one or two seed patients or without breadth/depth fields. |
| Waiver policy | Search PRD/spec for waiver terms | Waiver is operator-level, risk-documented, mitigation/follow-up recorded, and not a normal bypass. | Waiver can silently bypass readiness. |
| First-slice boundary | Git diff and path guard | Only PRD/spec and optional board row are changed by this lane; no source/fixture edits. | `src`, `schemas`, `patients`, `scripts`, validators, importers, generated artifacts, package files, or fixture data changed. |

## Structural validation command

Run from repo root:

```bash
python3 - <<'PY'
from pathlib import Path
import subprocess

plan_path = Path('.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md')
prd_path = Path('docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md')
spec_path = Path('docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md')
required_files = [
    plan_path,
    prd_path,
    spec_path,
    Path('decisions/001-mimic-to-synthea.md'),
    Path('decisions/016-broad-ehr-skeleton-clinical-memory.md'),
    Path('decisions/018-architecture-rebase-clinical-truth-substrate.md'),
    Path('docs/architecture/source-authority.md'),
    Path('clinical-reference/broad-ehr-skeleton.md'),
]
missing_files = [str(path) for path in required_files if not path.exists()]
if missing_files:
    raise SystemExit(f'Missing required artifacts: {missing_files}')

plan = plan_path.read_text()
prd = prd_path.read_text()
spec = spec_path.read_text()

required_plan = [
    'ADR 019 Corpus Readiness Gate',
    'prerequisite gate',
    'not ADR 019',
    'docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md',
    'docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md',
    'No `decisions/019-*` file',
    'No fixture edits under `patients/**`',
    'No validator/source edits under `src/**` or `scripts/**`',
]
missing_plan = [term for term in required_plan if term not in plan]
if missing_plan:
    raise SystemExit(f'Missing source plan terms: {missing_plan}')

required_prd = [
    'prerequisite gate',
    'not ADR 019',
    'ADR018 spike input',
    'corpus readiness packet',
    'operator review',
    'no source/fixture edits',
    'ADR 019 evidence must include both',
    'clean-slate projection comparison',
    '>=5 patients',
    'varied admits',
    'multi-day encounters',
    'follow-up notes',
    'six-surface coverage',
    'provenance/timing',
    'open loops',
    'evidence-chain stress',
    'Flowsheets / vitals',
    'Nursing assessment',
    'Notes / narrative charting',
    'Orders / medications / interventions',
    'Labs / diagnostics',
    'Care plan / handoff',
    'What happened',
    'Why it mattered',
    'Evidence/provenance',
    'Uncertainty',
    'Open loops',
    'Next-shift handoff',
    'Synthea seed, version, and parameters',
    'hand-crafted ICU acute',
    'source tags distinguish Synthea baseline from hand-crafted ICU acute portions',
    'no hidden simulator physiology',
    'docs/plans/clinical-fidelity-corpus-review-adr-019.md',
    'pass / conditional pass / fail',
    'not a normal bypass',
    'mitigation and follow-up lane',
    'No ADR 019 creation',
    'No Synthea importer implementation',
    'No clean-slate rewrite',
    'No production storage-port migration',
]
missing_prd = [term for term in required_prd if term not in prd]
if missing_prd:
    raise SystemExit(f'Missing PRD terms: {missing_prd}')

required_spec = [
    'Pass/fail checklist table',
    'Flowsheets/vitals',
    'nursing assessment',
    'notes/narrative charting',
    'orders/medications/interventions',
    'labs/diagnostics',
    'care plan/handoff',
    'What happened',
    'why it mattered',
    'evidence/provenance',
    'uncertainty',
    'open loops',
    'next-shift handoff',
    'Effective/recorded time or interval semantics',
    'Source tags distinguish Synthea baseline',
    'hand-crafted ICU acute',
    'No-hidden-state boundary',
    'hidden simulator physiology/state is excluded',
    'pass / conditional pass / fail',
    'operator-level',
    'not a normal bypass',
]
missing_spec = [term for term in required_spec if term not in spec]
if missing_spec:
    raise SystemExit(f'Missing test-spec terms: {missing_spec}')

for forbidden in Path('decisions').glob('019-*'):
    if forbidden.is_file():
        raise SystemExit(f'Forbidden ADR 019 artifact exists: {forbidden}')

forbidden_status = subprocess.check_output(
    [
        'git', 'status', '--short', '--',
        'src', 'schemas', 'patients', 'scripts',
        'package.json', 'package-lock.json',
    ],
    text=True,
).strip()
if forbidden_status:
    raise SystemExit('Forbidden source/fixture/package changes detected:\n' + forbidden_status)

changed = subprocess.check_output(['git', 'diff', '--name-only', '--', '.'], text=True).splitlines()
untracked = subprocess.check_output(
    ['git', 'ls-files', '--others', '--exclude-standard', '--', '.'],
    text=True,
).splitlines()
allowed = {
    'docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md',
    'docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md',
    'docs/plans/kanban-prd-board.md',
}
relevant = [p for p in changed + untracked if 'clinical-fidelity-synthetic-chart-corpus-gate-adr-019' in p or p == 'docs/plans/kanban-prd-board.md']
unexpected = [p for p in relevant if p not in allowed and not p.startswith('.omx/context/') and p != '.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md']
if unexpected:
    raise SystemExit(f'Unexpected gate-slice artifacts: {unexpected}')

print('ADR 019 corpus readiness docs/test-contract structural checks passed.')
PY
```

## Additional required command

Because this Ralph slice was requested with full verification, run:

```bash
npm run check
```

Pass condition: rebuild and validation complete successfully with zero errors.

## Acceptance criteria

1. PRD/test-spec pair exists under `docs/plans/`.
2. The PRD includes gate identity, ADR evidence inputs, six-surface contract, minimum corpus matrix, memory-proof readiness, one-entry/many-projection proof, Synthea realism guardrails, operator review, waiver policy, future machine-check backlog, and first-slice non-goals.
3. This test spec includes a pass/fail checklist table for six surfaces, memory-proof sections, provenance/timing, source tags, Synthea augmentation, and the no-hidden-state boundary.
4. Structural validation command passes.
5. `npm run check` passes.
6. No `decisions/019-*` file is created.
7. No source/fixture edits occur: `src/**`, `schemas/**`, `patients/**`, `scripts/**`, validators, importers, generated artifacts, package files, and fixture data remain untouched by this slice.
8. Optional board indexing, if present, links the PRD/test-spec without widening scope.

## Known gaps / explicit deferrals

- No corpus fixture is created in this slice.
- No validator, importer, schema, generated artifact, package, or source implementation is changed in this slice.
- No operator review artifact is filled out in this slice.
- No ADR 019 decision is created in this slice.
- Future executable metadata shape is intentionally deferred to a later approved implementation lane.
