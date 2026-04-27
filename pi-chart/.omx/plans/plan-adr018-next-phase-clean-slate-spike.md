# Plan — ADR 018 Next Phase: Clean-slate Spike Charter and Golden Projection Contract

## Status

- Date: 2026-04-27
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan` consensus planning lane; no implementation in this turn.
- Source context snapshot: `.omx/context/next-phase-adr-018-20260427T133404Z.md`
- Recommended execution mode after approval: `$ralph` for sequential docs/test-contract setup; `$team` only for the later spike if lanes are split by write ownership.
- Immediate recommendation: plan and execute a **bounded ADR 019 spike charter + golden projection contract** before any production-code refactor or clean-slate rewrite.

## Problem statement

ADR 018 accepted the architecture rebase direction: `pi-chart` is a clinical truth/provenance substrate, the immediate path is hybrid migration, and clean-slate service/event-store remains a serious candidate gated by a spike and ADR 019. The next phase must make Option B falsifiable without allowing a rewrite, UI prototype, or storage technology preference to capture the architecture prematurely.

The current repo already has enough foundation to define the spike target:

- `README.md:11-17` states the core thesis: chart canonical, current state query, derived summaries disposable.
- `README.md:122-138` and `DESIGN.md:354-369` define the view primitives as the shared read contract for UI, agent context, and derived renders.
- `ARCHITECTURE.md:142-179` shows current write/read paths over filesystem files.
- `src/views/active.ts:37-55` and `src/validate.ts:1076-1211` show direct filesystem walking remains a real implementation constraint.
- `decisions/018-architecture-rebase-clinical-truth-substrate.md:30-37` and `docs/architecture/source-authority.md:123-125` require a spike and ADR 019 before rewrite.

## RALPLAN-DR summary

### Principles

1. **Falsifiable before fashionable.** The next phase must prove or disprove clean-slate value against current behavior, not merely express a cleaner architecture diagram.
2. **View contract over storage preference.** `currentState`, `trend`, `openLoops`, `evidenceChain`, and `contextBundle` behavior are the comparison target; database/framework choice is deferred.
3. **Isolation over contamination.** Spike work must not alter production `src/**`, schemas, patients, scripts, generated artifacts, or canonical ADR 018/source-authority files unless a later approved plan owns them.
4. **Patient_002 is a golden scenario, not product ontology.** Use it because it is the richest current fixture, but do not generalize its respiratory scenario into architecture.
5. **Decision memo or stop.** The spike must culminate in ADR 019 with evidence, not an open-ended experimental branch.

### Decision drivers

1. **Context hygiene for AI agents:** future agents need an explicit spike charter and comparison contract before touching code.
2. **Rewrite-risk containment:** Option B may be best, but uncontrolled rewrite is the largest project risk.
3. **Production-path evidence:** the deciding evidence is whether a service/event-store shape preserves chart truth, provenance, and projections more cleanly than the filesystem substrate.

### Viable options

| Option | Core idea | Pros | Cons | Disposition |
|---|---|---|---|---|
| A. Docs-only ADR 019 charter | Write a charter/ADR plan but no executable spike harness. | Lowest risk; improves authority map quickly. | Does not validate Option B; can become another abstract planning artifact. | Insufficient alone. Use only as Step 1. |
| B. Isolated golden-projection spike | Freeze current patient_002 projection outputs, build an isolated event-store/service-shaped prototype that imports current chart facts and reproduces selected projections. | Directly tests clean-slate architecture; protects production code; produces ADR-grade evidence. | Requires careful scoping and comparison normalization; some prototype code will exist. | **Recommended next phase.** |
| C. Production storage-port refactor first | Add storage ports/interfaces in `src/**` before spike. | May reduce later migration cost if hybrid wins. | Presumes target before evidence; risks contorting current code. | Reject for now. Do after ADR 019 if warranted. |
| D. UI-first validation loop | Resume cockpit/monitor UI to make product concrete before architecture. | Gives human visual feedback. | ADR 018 already identified UI prototype capture as a risk; not the core uncertainty now. | Reject as ADR 018 next phase. UI may run later as consumer validation. |

## Recommended architecture path

Proceed with **Option B: isolated golden-projection spike**, split into two execution lanes:

1. **NP1 — Spike charter and golden projection contract (docs/test-contract lane).**
   - Create durable PRD/test-spec for ADR 019 spike.
   - Define exactly which current outputs are golden comparison surfaces.
   - Define isolation rules, allowed files, forbidden files, normalization rules, and ADR 019 decision criteria.
   - This can be executed by one `$ralph` lane.

2. **NP2 — Experimental clean-slate spike implementation (isolated prototype lane).**
   - Only after NP1 acceptance.
   - Build under an explicit experimental namespace such as `experiments/adr019-event-store-spike/` or a separate worktree.
   - Import current chart facts through public chart-visible files/API, not hidden pi-sim internals.
   - Reproduce selected projections and produce a comparison report.
   - This may use `$team` if split into disjoint lanes: baseline contract, spike store/importer, projection adapter, verifier.

3. **NP3 — ADR 019 decision.**
   - Decide: clean-slate rewrite, hybrid storage-port migration, or defer rewrite.
   - No production refactor until ADR 019 is accepted.

## NP1 PRD/test-spec scope

This ralplan creates the planning artifacts:

- `docs/plans/prd-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`

NP1 execution should own only planning/contract files unless explicitly expanded:

- `.omx/plans/plan-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/prd-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`
- Optional later board row in `docs/plans/kanban-prd-board.md`

NP1 must not edit:

- `src/**`
- `schemas/**`
- `patients/**`
- `scripts/**`
- generated `_derived/**` or prototype output
- `decisions/018-*`
- `docs/architecture/source-authority.md`
- QBN-bannered files

## NP2 spike comparison contract

A later spike succeeds only if it can compare a clean-slate candidate against the current filesystem backend for `patient_002` on these surfaces:

Baseline source rule: use the public root API `src/index.ts` for views it currently exports. `contextBundle` is currently exported from `src/views/index.ts`, not the root API; capture it from `src/views/index.ts` unless a separate API decision first promotes it to `src/index.ts`. Do not smuggle a root API expansion into the spike.

1. `currentState({ axis: "all" })`
2. `trend` for at least `spo2`, `heart_rate`, and `respiratory_rate`
3. `openLoops()` including ordinary, vital, and contested loops when present
4. `evidenceChain()` for at least one patient_002 assessment with mixed support refs
5. `contextBundle()` preserving `source_view_refs` and evidence/provenance enough for agent-facing bounded context
6. `validateChart()` equivalent invariant report for the fixture, or an explicit explanation of which validator duties belong outside the event store

Normalization rules for comparison:

- Ignore object key order.
- Require stable sorted arrays where current views guarantee sorting.
- Preserve ISO strings, IDs, source refs, event links, statuses, evidence refs, and patient isolation.
- Do not compare generated HTML or screenshot pixels.
- Do not infer hidden simulator ground truth.

## ADR 019 decision criteria

ADR 019 should recommend clean-slate rewrite only if the spike shows all of the following:

1. Projection equivalence is achievable without encoding patient_002-specific hacks.
2. Provenance/evidence semantics become simpler or safer, not merely relocated.
3. Write/read boundary, transaction, and validation story is clearer than current direct filesystem walking.
4. Migration path from current filesystem fixtures is plausible and reversible.
5. The proposed service/event-store architecture improves bounded pi-agent context and pi-sim opacity.
6. The spike produces an evidence matrix that distinguishes exact matches, accepted normalized differences, unresolved mismatches, and intentionally out-of-scope behavior.
7. **No new dependencies.** The spike requires no new production dependency, database, service framework, package-file edit, lockfile edit, or deployment assumption before ADR 019 accepts it.

If any criterion fails, ADR 019 should choose hybrid storage-port migration or defer rewrite. A partial success should not be rounded up into clean-slate authorization; it should become either a narrower storage-port plan or a second spike with explicit unknowns.

### Required ADR 019 evidence matrix

ADR 019 must include a table with at least these columns:

| Surface | Current backend command/input | Spike command/input | Match status | Differences | Decision implication |
|---|---|---|---|---|---|
| `currentState(axis=all)` | public `src/index.ts` call | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| `trend(spo2)` | public `src/index.ts` call | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| `trend(heart_rate)` | public `src/index.ts` call | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| `trend(respiratory_rate)` | public `src/index.ts` call | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| `openLoops()` | public `src/index.ts` call | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| `evidenceChain(...)` | named patient_002 assessment root | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| `contextBundle()` | `src/views/index.ts` export, unless a separate root API export decision is approved first | spike projection call | exact / normalized / mismatch | documented | rewrite / hybrid / defer signal |
| validation/invariants | `validateChart` report | spike invariant strategy | equivalent / gap / mismatch | documented | rewrite / hybrid / defer signal |

Hard rule: ADR 019 cannot recommend rewrite if the evidence matrix contains unresolved mismatches in provenance, evidence links, patient isolation, or hidden-simulator opacity.

## Execution sequence

### Step 0 — Dirty-worktree preflight

Purpose: keep ADR 018/QBN docs and unrelated sibling-repo edits from contaminating spike evidence.

Actions:

- Capture `git status --short` from `/home/ark/pi-rn/pi-chart`.
- Record that there are existing dirty docs from ADR 018/QBN lanes.
- Before NP2 implementation, **hard gate** on one of two isolation choices:
  1. commit/stash/otherwise isolate completed ADR 018/QBN planning docs; or
  2. run NP2 in a separate worktree with a clean baseline and an explicit artifact-import path.
- If a future human deliberately declines both choices, NP2 must stop and return to planning. Guard-only dirty evidence is not acceptable for NP2; baseline-aware guards are acceptable only for docs-only NP1.

Validation:

```bash
git status --short
```

### Step 1 — Create NP1 PRD/test-spec

Purpose: turn this plan into execution-safe durable planning surfaces.

Owned files:

- `docs/plans/prd-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`

Acceptance:

- PRD states problem, goals, non-goals, owned/forbidden files, workstreams, and decision criteria.
- Test spec includes structural checks and later spike acceptance checks.
- No product-source files are changed.

### Step 2 — Define golden baseline surfaces

Purpose: make current behavior an explicit contract for the spike.

Allowed in later NP2 only after NP1 approval:

- a baseline-capture script or test under an approved experimental/test path; or
- a documented manual command set if the human chooses no script yet.

Minimum baseline commands:

```bash
npm test
npm run validate -- --patient patient_001
npm run validate -- --patient patient_002
node --import tsx -e '/* capture patient_002 currentState/trend/openLoops/evidenceChain from src/index.ts; capture contextBundle from src/views/index.ts unless root API export is separately approved */'
```

### Step 3 — Build isolated clean-slate spike

Purpose: test Option B without mutating production architecture.

Allowed only in NP2 after separate approval.

Suggested isolated write scope:

- `experiments/adr019-event-store-spike/**`
- `docs/plans/adr019-clean-slate-spike-report.md`

Forbidden:

- production `src/**` changes
- schema changes
- patient fixture changes
- UI/prototype changes
- pi-sim hidden-source reads
- `package.json` / lockfile / new dependency changes unless a separate dependency ADR explicitly authorizes them
- database, server, or framework commitment; in-memory/file-local structures are enough for architecture proof

Overfit guard:

- The spike may select concrete patient_002 event IDs for comparison roots, but reusable importer/projection code must not branch on `patient_002`, respiratory-specific subtype names, or exact fixture paths beyond a declared input root.
- Any hardcoded ID used as a golden root must live in a baseline manifest/report, not in the event-store/projection logic.

### Step 4 — Decide ADR 019

Purpose: close the loop.

Owned file in NP3:

- `decisions/019-clean-slate-event-store-spike.md` or equivalent

ADR 019 must choose one:

1. clean-slate service/event-store rewrite path;
2. hybrid storage-port migration path;
3. defer rewrite and keep filesystem substrate for now.

## Testing strategy

### For NP1 planning/contract lane

- Structural markdown checks for required terms and file scopes.
- Guard that production roots are untouched:

```bash
if git diff --name-only -- src schemas patients scripts | grep .; then
  echo 'Unexpected production-root changes during NP1 planning lane'
  exit 1
fi
```

### For NP2 spike lane

- Full existing suite: `npm test`.
- Patient validation: `npm run validate -- --patient patient_001` and `patient_002`.
- Golden projection comparison harness over patient_002.
- Diff review proving changes are isolated to approved spike files.
- Optional performance smoke only after equivalence passes; do not optimize first.

## Available-agent roster and staffing guidance

Recommended `$ralph` prompt for NP1:

```text
$ralph Use .omx/plans/plan-adr018-next-phase-clean-slate-spike.md. Execute NP1 only: publish/verify the ADR 018 next-phase PRD and test spec for the ADR 019 clean-slate spike. Do not edit src, schemas, patients, scripts, generated artifacts, ADR 018, source-authority, QBN-bannered files, or UI/prototype files. Run the NP1 structural test spec.
```

Recommended `$team` shape for later NP2 only after NP1 approval:

- `explore`: map exact patient_002 event IDs and projection calls for baseline capture.
- `test-engineer`: build golden comparison tests/harness in the approved experimental/test scope.
- `executor`: implement isolated event-store spike/importer/projection adapter under experimental scope only.
- `architect`: review whether the spike proves architecture value or merely reimplements current files.
- `verifier`: run full tests, compare outputs, and produce evidence matrix for ADR 019.
- `critic`: challenge patient_002 overfit and hidden-coupling risks before ADR 019.

Suggested reasoning levels:

- Planner/architect/critic/verifier: high.
- Explore/test-engineer/executor: medium, with narrow ownership.
- No worker should broaden scope into production `src/**` without leader approval.

## Team verification path

1. Baseline manifest: exact files dirty before NP2.
2. Owned-file manifest: only approved experimental/report files changed.
3. Existing tests green.
4. Patient validations green.
5. Projection comparison report generated.
6. Architect + critic sign off that ADR 019 can be decided from evidence.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Spike becomes stealth rewrite | Isolated path, no production `src/**`, ADR 019 gate. |
| Patient_002 overfit | Require no hardcoded scenario assumptions and compare semantics, not UI. |
| Another planning artifact with no evidence | NP1 must point directly to NP2 baseline/projection comparison acceptance. |
| Dirty worktree confuses verification | Commit/isolate ADR 018/QBN first or use explicit baseline guards. |
| Storage tech debate derails phase | Defer database/framework choice; test architecture shape first. |

## Rejected alternatives

- **Start production storage ports now.** Rejected because it assumes the migration target before the clean-slate spike.
- **Resume UI/cockpit as the next ADR 018 phase.** Rejected because ADR 018 demotes UI prototypes to evidence; UI is not the uncertainty blocking architecture.
- **Bulk-delete stale docs before spike.** Rejected because quarantine/source-authority already reduced immediate context poison; deletion/movement can wait.
- **Choose a database/framework now.** Rejected because current evidence need is model/boundary validity, not vendor/tooling selection.

## Open questions

1. Should NP2 live under tracked `experiments/` or in a separate worktree with only a report committed?
2. Should ADR 019 require a runnable prototype, or is a test harness + architecture report enough?
3. Which patient_002 assessment should be the canonical evidence-chain root?
4. How much write-path behavior must the spike prove: append-only imports only, or simulated transaction/rollback semantics too?

## Decision memo

### Executive summary

The next phase of ADR 018 should be a bounded clean-slate spike path, not production refactor and not UI work. First publish an execution-safe PRD/test-spec for ADR 019 spike criteria, then run an isolated golden-projection spike against patient_002, then decide ADR 019.

### Major findings

- The current repo has a strong projection contract but direct filesystem walking is a real constraint.
- ADR 018 already names the correct gate: spike before rewrite.
- The dangerous path is letting Option B enthusiasm turn into uncontrolled rewrite.
- The productive path is to make Option B prove itself against current chart truth/provenance behavior.

### Recommended architecture

Hybrid remains the current architecture. The next step is an isolated service/event-store-shaped spike that imports current chart-visible facts and reproduces golden projections. ADR 019 decides whether that evidence justifies clean-slate rewrite or hybrid storage-port migration.

### Rejected alternatives

See rejected alternatives above.

### Risks

Primary risks are stealth rewrite, patient_002 overfit, dirty-worktree evidence confusion, and tech-selection distraction.

### Things the human probably believes that may be wrong

- Leaning clean-slate does not mean the repo should be rewritten next; it means the spike should be made brutally falsifiable next.
- UI helped human intuition, but it is still the wrong architecture driver for this phase.
- Filesystem ugliness is not itself evidence for a service rewrite; only projection/provenance/write-boundary evidence is.
- Patient_002 richness is useful, but it is not the product model.
