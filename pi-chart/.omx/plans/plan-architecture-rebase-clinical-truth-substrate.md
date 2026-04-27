# Plan — Architecture Rebase: Clinical Truth Substrate over Prototype Cockpit

## Status

- Date: 2026-04-27
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$plan` direct planning lane; no implementation yet.
- Recommended execution mode after approval: `$ralph` for docs/source-authority lane first; `$team` only after the plan splits into independent implementation lanes.
- Immediate decision: use **planning now**, not Ralph execution yet. Ralph should begin only after this plan is accepted and paired PRD/test-spec artifacts exist.

## Requirements summary

The architecture review found a strong core and a risky drift:

1. Preserve pi-chart's strongest foundation: append-only, patient-scoped clinical truth with provenance and read projections.
2. Demote UI prototypes to directional/product evidence, not architectural authority.
3. Treat filesystem/NDJSON/Markdown as the current fixture/export/backend, not a sacred production storage model.
4. Preserve openness to clean-slate Option B, but validate it with a bounded spike before committing to a rewrite.
5. Prevent coding-agent context poison by making source authority explicit and quarantining stale/prototype docs.
6. Create a durable ADR and an executable architecture rebase PRD/test-spec before any code implementation.

## Evidence base

| Evidence | Architectural fact used |
|---|---|
| `README.md:11-17` | The core thesis is already chart-canonical: chart is long-term memory; current state is query. |
| `README.md:19-36` | The primitive is a time-bound, source-attributed, immutable clinical claim/event envelope, plus vitals, notes, artifacts, and generated disposable views. |
| `README.md:74-120` | Public writes/reads are intended to go through `src/` with explicit `PatientScope`. |
| `README.md:122-138` | View primitives are the shared contract for UI, agent context, and derived renders. |
| `README.md:210-220` | Pi-sim boundary is public monitor output only; source kinds distinguish monitor/patient/agent provenance. |
| `ARCHITECTURE.md:142-179` | Current write/read paths are library-to-filesystem projections over `events.ndjson`, notes, vitals, and chart metadata. |
| `ARCHITECTURE.md:181-196` | Pi-sim monitor ingest is target shape only and not implemented; schema contract is not locked. |
| `ARCHITECTURE.md:214-231` | External boundaries forbid pi-chart/pi-sim direct coupling and restrict pi-agent to `src/index.ts`/tools. |
| `ARCHITECTURE.md:235-246` | Tests are strong for active semantics but lack fuzz/property and perf coverage. |
| `DESIGN.md:33-57` | The §1 primitive says every historical/live fact is one stream of envelopes; no live/import modes. |
| `DESIGN.md:354-637` | Six view primitives are the intended read surface; none are tabs, any UI composes them. |
| `DESIGN.md:1047-1060` | UI stack is not committed; UI must consume view primitives and write through sanctioned write APIs. |
| `ROADMAP.md:25-39` | Broad EHR skeleton is accepted as clinical-memory proof, not a full EHR mandate. |
| `ROADMAP.md:141-153` | UI remains deferred; SQLite/vector/FHIR are later/speculative. |
| `schemas/event.schema.json:72-85` | Event type set is closed at the high level but subtype is open. |
| `schemas/event.schema.json:194-212` | Evidence links already carry mixed event/vitals/note/artifact refs. |
| `schemas/vitals.schema.json:4-23` | Vitals have separate row identity/provenance and are not ordinary event envelopes. |
| `src/index.ts:4-56` | Current public API surface is compact enough to preserve through a storage/API refactor. |
| `src/write.ts:392-445` | Writes finalize, validate, isolate, and choose filesystem append target before persistence. |
| `src/write.ts:600-630` | Note + communication authoring is paired and rollback-aware, but not a general transaction system. |
| `src/validate.ts:919-1027` | Validator is the whole-chart invariant gate. |
| `src/validate.ts:1076-1212` | Validator walks filesystem timeline files directly. |
| `src/views/currentState.ts:48-127` | `currentState` is already a pure projection over a loaded context and axis semantics. |
| `src/views/trend.ts:20-77` | `trend` merges `vitals.jsonl` and event-recorded observations. |
| `src/views/openLoops.ts:48-110` | `openLoops` is explicit-link based, not subtype/time heuristic. |
| `src/views/bundle.ts:1-6` | `contextBundle` is intentionally thin and read-only over existing views. |
| `scripts/agent-canvas.ts:47-220` | Agent Canvas generator hardcodes demo patient/worklist/artifacts and must not become product architecture. |
| `docs/design/pi-agent-connector-contract.md:1-19` | Agent connector is a draft prototype contract and clearly separates cockpit vs co-pilot. |
| `docs/design/pi-agent-connector-contract.md:152-159` | Safety invariants say agent output is advisory and hidden sim state never reaches pi-agent. |
| `docs/design/pi-sim-vitals-write-contract.md:26-35` | Draft ingest endpoint exists as design, not code. |
| `docs/design/pi-sim-vitals-write-contract.md:139-151` | Draft latent/closed/offline behavior exists and should be reconciled before ingest implementation. |
| `decisions/016-broad-ehr-skeleton-clinical-memory.md:52-68` | Hidden physiology must enter only through explicit public observable adapters. |
| `docs/plans/kanban-prd-board.md:6-15` | Existing planning board already recognizes context-poison risk: future agents should not read all memos. |

## RALPLAN-DR summary

### Principles

1. **Clinical truth first.** Core pi-chart remains an append-only, patient-scoped clinical truth/provenance substrate.
2. **Projection over presentation.** UI, agent context, derived Markdown, and future services consume projections; they do not define the domain model.
3. **Boundary adapters, not hidden coupling.** Pi-sim and pi-agent integration happens only through explicit public contracts and chart-visible facts.
4. **Evidence before rewrite.** Clean-slate service/event-store architecture is attractive but must be proven by spike before production rewrite.
5. **Context hygiene is architecture.** Stale docs/prototypes must be clearly quarantined before coding agents execute broad changes.

### Decision drivers

1. **Prevent prototype capture.** `scripts/agent-canvas.ts` and design screenshots are useful cues but currently hardcode patient-specific product assumptions.
2. **Protect future production path.** Filesystem-native storage works now, but current read/write/validate paths scan concrete files directly.
3. **Enable agent-safe execution.** A source-authority map and ADR are needed before Ralph/team agents modify docs or code at scale.

### Viable options

| Option | Core idea | Pros | Cons | Current decision |
|---|---|---|---|---|
| A. Conservative evolution | Keep filesystem substrate and harden docs/boundaries incrementally. | Lowest risk; preserves all tests and fixtures. | May leave filesystem/prototype constraints in place too long. | Viable fallback. |
| B. Clean-slate service/event-store | Rebuild core around durable event store/service API, with filesystem as import/export. | Best production architecture if validated; clearer concurrency/API/storage story. | High rewrite risk; easy to overbuild before human validates product thesis. | Favored long-term candidate, pending spike. |
| C. Hybrid migration | Freeze current format as fixture/export/backend; add storage/API boundaries and use a spike to decide service rewrite. | Best near-term balance; supports clean-slate validation without discarding working core. | Requires discipline and temporary seams. | **Recommended immediate path.** |
| D. UI-led architecture | Continue building cockpit until product shape settles. | High visual feedback; helps human conceptualize domain. | Architecture becomes coupled to static prototype and patient_002. | Rejected as foundation; UI remains prototype evidence. |

## Recommended plan shape

Do this as **three durable planning artifacts before execution**:

1. **ADR 018 draft** — architecture rebase decision.
2. **Source-authority/quarantine map** — current, historical, prototype, deprecated docs classification.
3. **Architecture rebase PRD/test-spec** — executable plan for docs cleanup, source-authority banners, clean-slate spike, and later storage/API work.

This plan deliberately does **not** implement the refactor. It creates a safe handoff for Ralph/team execution.

## Acceptance criteria

Planning lane is complete when:

1. `decisions/018-architecture-rebase-clinical-truth-substrate.md` exists or is drafted for promotion and contains: decision, drivers, alternatives, why chosen, consequences, follow-ups.
2. A source-authority map exists and classifies at least: `README.md`, `DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `decisions/`, `docs/design/`, `memos/`, `.omx/plans/`, `docs/plans/`, and generated prototypes.
3. Stale/prototype docs have an explicit quarantine/banner strategy before any broad file moves.
4. The PRD/test-spec separate docs-only/source-authority work from later source-code/storage/API work.
5. Clean-slate Option B is preserved as a candidate and validated by a bounded spike before rewrite commitment.
6. The plan states that UI prototypes remain directional evidence only.
7. The plan states that filesystem is current fixture/export/backend, not sacred production storage.
8. The plan forbids direct pi-chart coupling to pi-sim hidden internals and forbids pi-agent access to hidden simulator state.
9. Verification commands are concrete and can be run by Ralph/team agents.
10. No `src/**`, `schemas/**`, `patients/**`, or `scripts/**` product changes are made in the first docs/source-authority lane unless separately approved.

## Implementation steps

### Step 0 — Preflight and context snapshot

Purpose: preserve the architecture-review evidence and current repo state.

Actions:

- Save a Ralph-ready context snapshot under `.omx/context/architecture-rebase-clinical-truth-substrate-<timestamp>.md`.
- Capture current status:
  - `git status --short`
  - `npm test`
  - `npm run validate -- --patient patient_001`
  - `npm run validate -- --patient patient_002`
- Record evidence from this plan and the architecture review.

Acceptance:

- Context snapshot exists.
- Test/validation evidence is recorded.
- No product-root source changes yet.

### Step 1 — Draft ADR 018

Owned files:

- `decisions/018-architecture-rebase-clinical-truth-substrate.md`
- Optional narrow pointers in `ROADMAP.md` / `ARCHITECTURE.md` only after ADR text stabilizes.

Required ADR sections:

- Context.
- Decision.
- Drivers.
- Alternatives considered:
  - conservative evolution;
  - clean-slate service/event-store;
  - hybrid migration;
  - UI-led architecture.
- Why chosen.
- Consequences.
- Follow-ups.
- Non-goals.

Required decision content:

- Core is clinical truth substrate, not cockpit UI.
- Hybrid migration is immediate path.
- Clean-slate Option B is favored enough to deserve a spike, not enough to authorize rewrite.
- Current filesystem layout is fixture/export/backend, not permanent database commitment.
- UI prototypes are non-authoritative directional evidence.
- Hidden simulator state stays forbidden.

Validation:

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('decisions/018-architecture-rebase-clinical-truth-substrate.md')
t = p.read_text()
required = [
  'clinical truth substrate',
  'hybrid migration',
  'clean-slate',
  'filesystem',
  'prototype',
  'hidden simulator',
  'Alternatives considered',
  'Consequences',
  'Follow-ups',
]
missing = [x for x in required if x not in t]
if missing:
    raise SystemExit(f'Missing ADR content: {missing}')
PY
```

### Step 2 — Create source-authority map

Owned file:

- `docs/architecture/source-authority.md`

Required classification buckets:

1. Canonical architecture.
2. Accepted decisions.
3. Active planning.
4. Prototype/directional evidence.
5. Historical/proposal-only.
6. Deprecated / do-not-use-for-implementation.
7. Runtime/transient artifacts.

Minimum classified surfaces:

- `README.md`
- `DESIGN.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `CLAIM-TYPES.md`
- `decisions/*.md`
- `docs/plans/kanban-prd-board.md`
- `docs/design/*`
- `docs/prototypes/*`
- `memos/*`
- `.omx/plans/*`
- `.omx/context/*`
- `wiki/*`
- generated `_derived/` files

Validation:

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('docs/architecture/source-authority.md')
t = p.read_text()
for phrase in [
    'Canonical architecture',
    'Accepted decisions',
    'Active planning',
    'Prototype/directional evidence',
    'Historical/proposal-only',
    'Deprecated / do-not-use-for-implementation',
    'Runtime/transient artifacts',
    'README.md', 'DESIGN.md', 'ARCHITECTURE.md', 'ROADMAP.md',
    'docs/design', 'memos', '.omx/plans', 'docs/prototypes'
]:
    if phrase not in t:
        raise SystemExit(f'Missing source-authority classification: {phrase}')
PY
```

### Step 3 — Add quarantine banner plan, then banners in a separate execution slice

Owned file for planning:

- `docs/architecture/source-authority.md`

Future docs-only execution may touch:

- selected stale `memos/*.md`
- selected `docs/design/*.md`
- selected `.omx/plans` promotion summaries if already tracked
- never bulk move files in the first pass

Banner template:

> **Status:** Historical/prototype artifact. Not current architectural authority. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`.

Acceptance:

- The plan identifies exactly which files get banners in pass 1.
- Pass 1 is small and reversible.
- No generated binary/screenshot files are edited.

### Step 4 — Create PRD/test-spec for architecture rebase execution

Owned files:

- `docs/plans/prd-architecture-rebase-clinical-truth-substrate.md`
- `docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md`
- Optional narrow row in `docs/plans/kanban-prd-board.md`

PRD must define workstreams:

1. ADR/source-authority/docs quarantine.
2. Clean-slate Option B spike.
3. Storage boundary design.
4. Agent context API stabilization.
5. Latent vitals ingest boundary.
6. Fixture diversity.
7. Prototype quarantine and future UI app boundary.

Test spec must define structural and behavioral verification for each workstream.

Acceptance:

- PRD and test-spec cite this plan and ADR 018.
- PRD explicitly says which workstreams are docs-only vs product-code.
- Test spec includes no-op checks proving product files remain untouched during docs-only lanes.

### Step 5 — Run clean-slate Option B spike after ADR/source-authority approval

Spike goal:

Can a service/event-store shaped backend reproduce current patient fixture projections without losing provenance or making agent context harder?

Suggested bounded spike deliverable:

- Prototype under an explicitly quarantined path, e.g. `experiments/event-store-spike/` or `.omx/drafts/event-store-spike/`.
- Load `patient_002` from current fixture format.
- Represent events, vitals, notes, links, provenance in a service-like or SQLite-like repository.
- Reproduce outputs equivalent to:
  - `currentState(axis=all)`
  - `trend(spo2|heart_rate|respiratory_rate)`
  - `openLoops`
  - `evidenceChain` for one assessment
  - `contextBundle`

Decision criteria:

- If spike reproduces projections with simpler boundaries and clearer future operations, promote clean-slate service core to ADR 019.
- If spike adds complexity without clear benefit, continue hybrid storage-port migration.

### Step 6 — Decide ADR 019

Possible outcomes:

- `ADR 019A` — continue hybrid migration, add storage port and later SQLite index.
- `ADR 019B` — commit to clean-slate service/event-store core.
- `ADR 019C` — keep filesystem core for another validation cycle and defer service/storage rewrite.

No broad product-code refactor should start before this decision.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Context poison from stale docs leads agents into old UI/prototype assumptions. | Source-authority map plus banners before implementation lanes. |
| Clean-slate enthusiasm triggers premature rewrite. | Require spike output equivalence against current projections before ADR 019. |
| Hybrid path preserves accidental filesystem constraints. | Treat filesystem as backend/export, introduce storage-port design only after docs lane. |
| UI prototype gets incorrectly deleted or ignored. | Mark it directional evidence; do not delete until replacement product evidence exists. |
| Planning docs sprawl grows further. | Add canonical source-authority doc and promote only durable decisions into `decisions/` / `docs/plans/`. |
| Agents edit broad docs/source files inconsistently. | Use Ralph for first lane; use explicit owned-file lists and structural validation. |

## Verification steps

Planning artifact verification:

```bash
test -f .omx/plans/plan-architecture-rebase-clinical-truth-substrate.md
python3 - <<'PY'
from pathlib import Path
p = Path('.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md')
t = p.read_text()
for phrase in [
    'Clinical truth first',
    'Projection over presentation',
    'Clean-slate Option B',
    'source-authority',
    'ADR 018',
    'filesystem',
    'prototype',
    'hidden simulator',
    'Acceptance criteria',
    'Implementation steps',
    'Verification steps',
    'ADR section',
]:
    if phrase not in t:
        raise SystemExit(f'Missing plan phrase: {phrase}')
PY
```

Repo baseline verification before any execution:

```bash
git status --short
npm test
npm run validate -- --patient patient_001
npm run validate -- --patient patient_002
```

## ADR section

### Decision

Adopt an architecture rebase direction: pi-chart core is a clinical truth/provenance substrate, not a cockpit UI. Use hybrid migration as the immediate execution path, while preserving clean-slate service/event-store architecture as a serious candidate to be validated by spike.

### Drivers

- Current core has strong append-only/provenance/view semantics.
- UI prototypes are helpful but hardcoded and non-authoritative.
- Filesystem-native storage is productive now but insufficient as a production commitment.
- Coding-agent execution requires explicit source authority to avoid stale-document context poison.

### Alternatives considered

- Conservative filesystem evolution.
- Clean-slate service/event-store rewrite.
- Hybrid migration with spike-backed decision.
- UI-led architecture.

### Why chosen

Hybrid migration maximizes learning while preserving working tests and fixtures. It lets the human validate the clean-slate direction without turning architectural preference into a premature rewrite.

### Consequences

- Docs/source authority work comes before refactor.
- UI prototype is demoted to directional evidence.
- Storage/API seams become future workstreams.
- Clean-slate spike becomes an explicit decision gate.

### Follow-ups

1. Draft/promote ADR 018.
2. Create source-authority map.
3. Create PRD/test-spec.
4. Quarantine stale docs.
5. Run clean-slate spike.
6. Decide ADR 019.

## Available-agent-types roster for handoff

Known useful agent types from this session:

- `explore` — fast codebase/doc lookup.
- `planner` — PRD/test-spec shaping.
- `architect` — architecture review and ADR quality.
- `critic` — challenge assumptions and reject shallow plans.
- `executor` — bounded docs/source edits after approval.
- `writer` — ADR/source-authority wording.
- `verifier` — evidence/claim validation.
- `code-reviewer` — later broad code refactor review.
- `test-engineer` — spike/test strategy.
- `dependency-expert` — later storage/service/library evaluation if needed.

## Ralph handoff guidance

Use `$ralph` first for a **docs/source-authority lane**, not source refactor.

Suggested Ralph context:

- Plan path: `.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md`
- Task: create ADR 018 draft, source-authority map, PRD/test-spec, and optional board row.
- Forbidden first-lane files: `src/**`, `schemas/**`, `patients/**`, `scripts/**`, binary screenshots/zips.
- Required verification: structural commands in this plan, `git diff --name-only`, and no product-root diffs outside owned docs.

Suggested Ralph roles:

- `writer` for ADR/source-authority draft.
- `architect` for ADR soundness review.
- `critic` for context-poison and accidental-constraint challenge.
- `verifier` for structural checks and source-authority coverage.

## Team handoff guidance

Use `$team` only after ADR 018/source-authority map exists and work splits cleanly.

Possible team lanes:

1. Docs authority/quarantine lane — `writer`/`verifier`.
2. Clean-slate spike design lane — `architect`/`test-engineer`.
3. Storage-port mapping lane — `explore`/`architect`.
4. Agent context API mapping lane — `explore`/`architect`.
5. Latent vitals ingest boundary lane — `architect`/`test-engineer`.

Team verification path:

- Team proves owned artifacts exist and structural checks pass.
- Ralph verifies final integration, source-authority consistency, and no unauthorized product-root edits.

## Launch hints

Recommended next command after human approval:

```text
$ralph Use .omx/plans/plan-architecture-rebase-clinical-truth-substrate.md. Execute only the docs/source-authority lane: ADR 018 draft, source-authority map, architecture rebase PRD/test-spec, optional kanban row. Do not edit src/, schemas/, patients/, scripts/, or generated binary/prototype assets.
```

Possible later team command:

```text
$team Use .omx/plans/plan-architecture-rebase-clinical-truth-substrate.md. Split into docs authority, clean-slate spike design, storage-port mapping, agent context API mapping, and latent vitals boundary planning lanes. Verify no source refactor begins before ADR 019 decision.
```
