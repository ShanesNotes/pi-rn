# RALPLAN-DR — S5 read-side context-bundle PRD/test-spec docs lane

## Status

- Plan date: 2026-04-26
- Repo: `/home/ark/pi-rn/pi-chart`
- Lane type: docs-only planning lane
- HITL selection source: `.omx/specs/deep-interview-v03-hitl-successor.md`
- Selected successor: **S5 read-side context-bundle**
- Boundary: **`s5-read-only`**
- Primary deliverables to create later:
  - `docs/plans/prd-s5-read-side-context-bundle.md`
  - `docs/plans/test-spec-s5-read-side-context-bundle.md`
- Optional deliverable:
  - Narrow update to `docs/plans/kanban-prd-board.md` recording HITL S5 selection and linking the new docs.
- Explicit non-deliverables in this planning lane:
  - No product-code edits.
  - No creation of `src/views/bundle.ts` during planning.
  - No profile registry, profile schema, identity module, hash chain, deterministic fingerprint, or bundle fingerprint.

## Evidence inspected

| Evidence | Finding used by this plan |
|---|---|
| `.omx/specs/deep-interview-v03-hitl-successor.md` | Operator selected S5 as the V03 successor and narrowed it to read-only. It explicitly forbids profile registry, identity/hash-chain, deterministic fingerprint, and product code in the interview/planning mode. |
| `docs/plans/v03-foundation-reconciliation-acceptance-report.md` | V03-001 accepted docs-only reconciliation, records `src/views/bundle.ts` as absent, and lists S5 context-bundle as the HITL-required future lane for bundle export. |
| `docs/plans/prd-v03-foundation-reconciliation.md` and paired test spec | Established planning pattern: PRD + test-spec, explicit brownfield authority, no-product-root proof, optional board-row verification. |
| `docs/plans/kanban-prd-board.md` | Canonical tracked planning index. Existing V03-001 row still says successor selection is a HITL gate; S5 selection can be recorded there as an optional same-lane board update. |
| `src/views/index.ts` and `src/views/*.ts` | Existing read-side views include `timeline`, `currentState`, `trend`, `evidenceChain`, `openLoops`, `narrative`, and `memoryProof`; additional helper modules include `active`, `projection`, `reviewState`, `attestationState`, and `source`. `src/views/bundle.ts` is absent. |

## RALPLAN-DR

### Principles

1. **Read-only first.** S5 must compose existing projections and events without writing chart state, mutating fixtures, or changing validator/schema behavior.
2. **Boundary preservation.** S5 may expose only pi-chart-visible facts; it must not leak pi-sim hidden physiology or require pi-agent internals.
3. **No hidden prerequisite expansion.** S5 must not smuggle in S3 identity/hash or S4 profile-registry work.
4. **Consumer-driven bundle shape.** The PRD must define the intended consumer and acceptance shape before any future `bundle.ts` implementation.
5. **Auditable source provenance.** The bundle plan must name input views and source-view refs so future output remains explainable from existing read-side primitives.

### Decision drivers

1. **HITL directive:** S5 was selected after V03-001, with boundary `s5-read-only`.
2. **Brownfield reality:** Existing read-side views and tests already cover most projection ingredients; `src/views/bundle.ts` is absent and should stay absent during this docs-only planning lane.
3. **Drift risk:** V03 memo language includes bundle fingerprint/profile/hash adjacent ideas; the S5 PRD/test-spec must prevent accidental scope expansion.
4. **Agent context need:** The lane is valuable because an agent-facing context bundle can reduce repeated ad hoc reads while remaining within pi-chart boundaries.
5. **Dirty-repo safety:** Existing planning patterns use product-root baseline comparisons, so docs-only changes can be verified without assuming a globally clean repo.

### Viable options

| Option | Summary | Pros | Cons | Decision |
|---|---|---|---|---|
| A. PRD/test-spec only | Create the two S5 docs and leave board untouched. | Smallest diff; no shared board ownership. | Board remains stale: V03-001 still reads as waiting for successor selection. | Viable fallback if board ownership is contested. |
| B. PRD/test-spec plus narrow kanban row update | Create the two S5 docs and update only the V03/S5 board area to record HITL S5 selection and links. | Keeps canonical planning index current; future agents find the selected lane without reading `.omx/specs`. | Slightly broader docs diff; requires careful row-only edit. | **Chosen / recommended.** |
| C. Include product scaffold (`src/views/bundle.ts`) | Create docs and implementation stub together. | Faster path to code. | Violates user request and HITL boundary; risks fingerprint/profile/hash creep. | Rejected. |
| D. Broaden S5 to bundle fingerprint/profile/identity | Treat context bundle as canonical identity artifact. | Could support future cache/provenance needs. | Explicitly forbidden by `s5-read-only`; belongs to later HITL S3/S4/fingerprint decision. | Rejected. |

### Decision

Choose **Option B** unless a separate board-owner conflict is present at execution time. The same docs-only lane should update `docs/plans/kanban-prd-board.md` narrowly because the board is the canonical planning index and currently records V03 successor choice as pending. The board update should not add product ownership; it should record only: S5 selected, read-only boundary, links to the new PRD/test-spec, and explicit deferrals.

## Chosen execution plan

### Step 0 — Preflight baseline and ownership guard

Owned files for execution:

- Required:
  - `docs/plans/prd-s5-read-side-context-bundle.md`
  - `docs/plans/test-spec-s5-read-side-context-bundle.md`
- Optional recommended:
  - `docs/plans/kanban-prd-board.md` only for a narrow S5/V03 successor row or note.

Forbidden files/surfaces:

- `src/**`
- `schemas/**`
- `patients/**`
- `scripts/**`
- `profiles/**`
- `src/views/bundle.ts`
- `src/hash.ts`
- `src/identity.ts`
- `schemas/profile.schema.json`
- `pi-agent/**` and `pi-sim/**`

Preflight command:

```bash
mkdir -p .omx/tmp
{
  git diff --name-only -- src schemas patients scripts profiles || true
} | sort > .omx/tmp/s5-read-side-product-root-preflight.txt
```

Acceptance:

- Baseline file exists.
- Any later product-root diff matches the baseline exactly.

### Step 1 — Create S5 PRD

Create `docs/plans/prd-s5-read-side-context-bundle.md` with these required sections:

1. **Status and authority**
   - State HITL selected S5.
   - State boundary `s5-read-only`.
   - Cite `.omx/specs/deep-interview-v03-hitl-successor.md` and `docs/plans/v03-foundation-reconciliation-acceptance-report.md`.
   - State the PRD is planning authority only, not product implementation authority until approved.

2. **Problem / consumer**
   - Define the initial consumer as an agent/context-loader needing a bounded pi-chart read-side bundle.
   - Require the bundle to be derived only from pi-chart-visible chart data and existing projections.
   - Do not assume a pi-agent API contract beyond “consumer reads a serialized context bundle.”

3. **Brownfield input inventory**
   - Name current read-side surfaces:
     - `src/views/index.ts`
     - `src/views/active.ts`
     - `src/views/timeline.ts`
     - `src/views/currentState.ts`
     - `src/views/trend.ts`
     - `src/views/evidenceChain.ts`
     - `src/views/openLoops.ts`
     - `src/views/narrative.ts`
     - `src/views/memoryProof.ts`
     - `src/views/projection.ts`
     - `src/views/reviewState.ts`
     - `src/views/attestationState.ts`
     - `src/views/source.ts`
   - State tests exist for most current views.
   - State `src/views/bundle.ts` is absent and is only a candidate future surface.

4. **Proposed future bundle contract**
   - Candidate future API: `contextBundle(params)` or equivalent in `src/views/bundle.ts`, but no code in this lane.
   - Inputs should be limited to existing patient scope/time filters and optional consumer-safe flags.
   - Output shape should include at minimum:
     - `patient_id`
     - `asOf`
     - `source_view_refs`
     - bounded summary sections composed from existing views, likely including current state, timeline/recent events, open loops, narrative/handoff, evidence/uncertainty, review/attestation signals where already derivable.
   - Output must not include deterministic fingerprint/profile/hash fields in the first S5 scope.

5. **Boundaries and non-goals**
   - No profile registry.
   - No `profiles/`.
   - No `schemas/profile.schema.json`.
   - No `src/hash.ts` or `src/identity.ts`.
   - No deterministic bundle fingerprint.
   - No new schema/validator/event model work.
   - No hidden simulator state.
   - No pi-agent direct coupling.
   - No new dependencies.

6. **Tracer bullets for later implementation**
   Suggested PRD tracer bullets:

   | Bullet | Purpose | Future owned files | First validation | Boundary |
   |---|---|---|---|---|
   | `S5-TB-0` Docs/authority guard | Keep S5 selection and deferrals explicit. | S5 PRD, test spec, optional board row | Structural docs check. | Docs only. |
   | `S5-TB-1` Bundle contract characterization | Define future output shape from existing views. | `src/views/bundle.test.ts` first, later `src/views/bundle.ts` | Failing test names required bundle keys and source-view refs. | No fingerprint/profile/hash. |
   | `S5-TB-2` Existing-view composition | Compose from `memoryProof`, `currentState`, `timeline`, `openLoops`, `narrative`, and evidence where needed. | `src/views/bundle.ts(.test)` | Test proves selected fixture bundle is derived from existing views. | Read-only; no fixture mutation except append-only test fixture if separately authorized. |
   | `S5-TB-3` Boundary exclusion tests | Prove bundle excludes hidden sim/profile/hash/fingerprint surfaces. | `src/views/bundle.test.ts` | Test asserts forbidden keys are absent. | No S3/S4 scope. |
   | `S5-TB-4` Acceptance report | Record implementation evidence after later code lane. | Future report under `docs/plans/` | Report links verification outputs. | Docs report only. |

7. **Acceptance criteria**
   - PRD states S5 is HITL-selected and `s5-read-only`.
   - PRD names `src/views/bundle.ts` as candidate future surface and confirms it is absent during planning.
   - PRD explicitly defers profiles, identity/hash-chain, deterministic fingerprint, schema/validator changes, pi-agent coupling, and hidden simulator access.
   - PRD defines consumer, input projections, output-shape requirements, future tracer bullets, boundaries, and verification commands before product code.
   - PRD preserves pi-chart/pi-agent/pi-sim boundary separation.
   - PRD contains a clear HITL gate before implementation.

### Step 2 — Create S5 test spec

Create `docs/plans/test-spec-s5-read-side-context-bundle.md` with these required sections:

1. **Scope**
   - Planning-doc verification only.
   - Owned files list.
   - Explicit no-product-code rule.

2. **Required content checks**
   Include a table with pass conditions for:
   - HITL S5 selection.
   - Boundary `s5-read-only`.
   - Source evidence references.
   - Existing read-side view inventory.
   - Candidate `src/views/bundle.ts` future surface.
   - Deferrals for profile/hash/identity/fingerprint.
   - Consumer/input/output shape.
   - pi-chart/pi-agent/pi-sim boundary.
   - Optional board update if made.

3. **Structural verification command**

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-s5-read-side-context-bundle.md')
spec_path = Path('docs/plans/test-spec-s5-read-side-context-bundle.md')
for path in [prd_path, spec_path]:
    if not path.exists():
        raise SystemExit(f'Missing {path}')
prd = prd_path.read_text()
spec = spec_path.read_text()
text = prd + '\n' + spec
required = [
    'S5',
    's5-read-only',
    '.omx/specs/deep-interview-v03-hitl-successor.md',
    'docs/plans/v03-foundation-reconciliation-acceptance-report.md',
    'src/views/bundle.ts',
    'src/views/index.ts',
    'src/views/active.ts',
    'src/views/timeline.ts',
    'src/views/currentState.ts',
    'src/views/trend.ts',
    'src/views/evidenceChain.ts',
    'src/views/openLoops.ts',
    'src/views/narrative.ts',
    'src/views/memoryProof.ts',
    'src/views/projection.ts',
    'src/views/reviewState.ts',
    'src/views/attestationState.ts',
    'src/views/source.ts',
    'consumer',
    'input',
    'output shape',
    'source_view_refs',
    'No profile registry',
    'No `profiles/`',
    'No `schemas/profile.schema.json`',
    'No `src/hash.ts`',
    'No `src/identity.ts`',
    'No deterministic bundle fingerprint',
    'No hidden simulator state',
    'No pi-agent direct coupling',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('Missing required S5 planning terms:\n' + '\n'.join(missing))
for tb in [f'S5-TB-{i}' for i in range(0, 5)]:
    if tb not in prd:
        raise SystemExit(f'Missing tracer bullet {tb}')
PY
```

4. **Brownfield absence verification**

```bash
python3 - <<'PY'
from pathlib import Path
expected_absent = [
    Path('src/views/bundle.ts'),
    Path('profiles'),
    Path('schemas/profile.schema.json'),
    Path('src/hash.ts'),
    Path('src/identity.ts'),
]
for path in expected_absent:
    if path.exists():
        raise SystemExit(f'S5 docs-only planning expected absent surface to remain absent: {path}')
prd = Path('docs/plans/prd-s5-read-side-context-bundle.md').read_text()
for phrase in [
    'No `profiles/`',
    'No `src/hash.ts`',
    'No `src/identity.ts`',
    'No deterministic bundle fingerprint',
    '`src/views/bundle.ts` is absent',
]:
    if phrase not in prd:
        raise SystemExit(f'Missing brownfield/deferral phrase: {phrase}')
PY
```

5. **Product-root baseline comparison**

```bash
current=$(mktemp)
git diff --name-only -- src schemas patients scripts profiles | sort > "$current"
if [ -f .omx/tmp/s5-read-side-product-root-preflight.txt ]; then
  diff -u .omx/tmp/s5-read-side-product-root-preflight.txt "$current"
else
  cat "$current"
  test ! -s "$current"
fi
rm -f "$current"
```

6. **Optional board-row verification**

Use only if `docs/plans/kanban-prd-board.md` is edited:

```bash
python3 - <<'PY'
from pathlib import Path
board = Path('docs/plans/kanban-prd-board.md').read_text()
required = [
    'S5',
    'read-side context-bundle',
    's5-read-only',
    'prd-s5-read-side-context-bundle.md',
    'test-spec-s5-read-side-context-bundle.md',
    'HITL',
]
missing = [item for item in required if item not in board]
if missing:
    raise SystemExit('Board missing S5 row terms:\n' + '\n'.join(missing))
PY
```

7. **Known verification gaps**
   - Docs checks do not prove future bundle implementation correctness.
   - Docs checks do not authorize product code.
   - No `npm test` is required for this docs-only lane; future product implementation must add focused tests first.

### Step 3 — Optional recommended kanban update

Recommendation: **update kanban in the same docs-only lane** if no concurrent board-owner conflict is active.

Rationale:

- `docs/plans/kanban-prd-board.md` is the canonical tracked planning index.
- It currently records V03 successor selection as a future HITL decision.
- The HITL decision now exists in `.omx/specs/deep-interview-v03-hitl-successor.md`.
- A narrow board update prevents future agents from reopening S1-S6 selection.

Permitted board content:

- Add one row under the backlog/planning area or update the V03-001 follow-up text to say:
  - HITL selected S5.
  - Boundary is `s5-read-only`.
  - PRD/test-spec links are the next planning artifacts.
  - No product implementation until PRD/test-spec are approved.

Forbidden board content:

- No claim that `src/views/bundle.ts` exists.
- No implementation-ready ownership of `src/views/bundle.ts` before approval.
- No fingerprint/profile/hash scope.
- No change to unrelated cards.

### Step 4 — Final verification and report

Run, in order:

```bash
# 1. Structural content check from the S5 test spec
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-s5-read-side-context-bundle.md')
spec_path = Path('docs/plans/test-spec-s5-read-side-context-bundle.md')
for path in [prd_path, spec_path]:
    if not path.exists():
        raise SystemExit(f'Missing {path}')
text = prd_path.read_text() + '\n' + spec_path.read_text()
required = ['S5', 's5-read-only', 'src/views/bundle.ts', 'No deterministic bundle fingerprint']
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('Missing required terms:\n' + '\n'.join(missing))
PY

# 2. Brownfield absence check from the S5 test spec
python3 - <<'PY'
from pathlib import Path
for path in [Path('src/views/bundle.ts'), Path('profiles'), Path('schemas/profile.schema.json'), Path('src/hash.ts'), Path('src/identity.ts')]:
    if path.exists():
        raise SystemExit(f'Expected absent: {path}')
PY

# 3. Product-root baseline comparison
current=$(mktemp)
git diff --name-only -- src schemas patients scripts profiles | sort > "$current"
diff -u .omx/tmp/s5-read-side-product-root-preflight.txt "$current"
rm -f "$current"

# 4. Docs diff review
git diff -- docs/plans/prd-s5-read-side-context-bundle.md docs/plans/test-spec-s5-read-side-context-bundle.md docs/plans/kanban-prd-board.md
```

Acceptance for the execution lane:

- Required docs exist.
- Required content checks pass.
- Expected-absent product surfaces remain absent.
- Product-root diff matches preflight baseline.
- Optional board update, if present, passes board-row verification.
- Final report states changed docs, verification commands, and remaining risks.

## Boundaries

### In scope

- Docs-only S5 PRD/test-spec creation.
- Optional narrow kanban update recording HITL S5 selection.
- Brownfield inventory of existing read-side views.
- Future implementation tracer bullets, including test-first guidance.
- Explicit deferrals and no-product-root verification.

### Out of scope

- Creating or editing `src/views/bundle.ts`.
- Editing any product code, schema, patient fixture, scripts, profiles, or hidden simulator files.
- Adding a deterministic bundle fingerprint.
- Adding logical IDs, hash-chain, identity module, invalidation cache, or profile registry.
- Defining pi-agent runtime integration beyond a generic consumer statement.
- Adding dependencies.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| S5 expands into S3/S4 fingerprint/profile/hash work. | Violates HITL boundary and creates hidden schema burden. | Required PRD/test-spec deferrals and absence checks. |
| Board update collides with other planning lanes. | Merge conflict or stale index. | Keep board edit optional and row-scoped; fall back to PRD/test-spec only if conflict exists. |
| Future bundle duplicates `memoryProof` instead of composing it. | Redundant read-side logic and drift. | PRD should require reuse/composition of existing projections before new logic. |
| Consumer shape is too vague. | Future implementation lacks testable output. | PRD must define minimum output keys and source-view refs before code. |
| Hidden simulator or pi-agent coupling enters bundle. | Boundary violation. | Explicit must-not-know list and structural checks. |
| Dirty repo hides product edits. | Docs-only claim becomes unverifiable. | Preflight product-root baseline and comparison command. |

## Verification summary

This plan requires structural docs checks, brownfield absence checks, product-root baseline comparison, optional board-row verification, and final docs diff review before execution is reported complete.

## Execution handoff guidance

Suggested staffing if executed by agents:

- **Single executor lane** is sufficient. Complexity: medium docs-only.
- Optional verifier lane can independently run the structural checks and product-root baseline comparison after docs are drafted.
- No team mode required unless other PRD lanes are simultaneously editing `docs/plans/kanban-prd-board.md`.

Suggested launch hints:

- Executor reasoning: medium.
- Verifier reasoning: low/medium.
- Avoid product-code tools except read-only inspection and verification commands.

## Handoff confirmation gate

Before product implementation starts, require human approval of both:

1. `docs/plans/prd-s5-read-side-context-bundle.md`
2. `docs/plans/test-spec-s5-read-side-context-bundle.md`

Only after approval should a later implementation lane create a failing `src/views/bundle.test.ts` and then implement `src/views/bundle.ts` under the approved read-only boundary.
