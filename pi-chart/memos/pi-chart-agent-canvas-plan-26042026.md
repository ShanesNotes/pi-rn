# pi-chart Agent Canvas Plan — Revised Approval Baseline (26042026)

**Status:** revised after user review. The prior “Final” memo is **not approved as-is** and is superseded by this baseline.  
**Ralplan source:** `.omx/plans/ralplan-pi-chart-agent-canvas-memo-revision-26042026.md`  
**Consensus:** Architect APPROVE; Critic APPROVE; no mandatory final improvements.  
**Execution rule:** implement this plan in order. Do not resurrect the prior vocabulary, file budget, dependency assumptions, or early safety-enforcement sequence.

## 1. Requirements Summary

The right rail remains a **clinical worklist** for generated drafts, staged charting, order-driven tasks, review tasks, pending decisions, and passive observations. The worklist must become useful before it becomes policy-enforcing.

This revision locks these corrections:

- Use **chart / charted / Chartable** terminology for domain and user-facing concepts.
- The previous `commit` vocabulary is legacy wording only. It must not be user-facing, and new type names/functions should prefer `Chartable`, `chart`, and `charted`.
- Correct Playwright facts: the repo has `playwright` and `tsx`, but no durable E2E suite, no `@playwright/test`, no `tests/e2e`, and no `playwright.config.ts` today.
- Preserve the successful temporary raw Playwright smoke coverage by making it durable with raw Playwright + `node --test --import tsx`.
- Do not use `cheerio` in the selected plan.
- Remove the false fixed-size file budget. Generator cutover necessarily includes `scripts/agent-canvas.ts`, generated HTML, tests, and package files only if a script/dependency change is intentionally made.
- Device-streamed vitals are **prefill/stage pending institutional policy**, not automatic charting.
- Preserve `discarded` separately from `superseded`.
- Expand `WorklistItem` enough to support current panes: source/surface, markdown body, evidence refs, confidence/provenance, priority, action metadata, and safety metadata.
- Use “review-ready”, “requires clinician review”, or “pending institutional policy” unless a real review workflow is implemented.
- Defer hard safety enforcement until worklist surfaces, chart semantics, and real `patient_002` mapping are stable.

## 2. RALPLAN-DR Summary

### Principles

1. **Clinical language first:** charting actions use `chart`, `charted`, and `Chartable`.
2. **Repo facts over assumed infrastructure:** no durable Playwright Test setup exists unless intentionally added later.
3. **Surface before enforcement:** model, UI, and patient mapping stabilize before hard safety rules.
4. **Audit states stay distinct:** `discarded` is user/task disposition; `superseded` is lineage replacement.
5. **No unsupported clinical promises:** review/sign language must match implemented workflow reality.

### Decision Drivers

1. Execution must not depend on nonexistent packages, config files, or scripts.
2. Clinical safety posture must avoid default automatic charting for device streams.
3. The worklist schema must support the actual cockpit panes, not just lifecycle mechanics.

### Runner Decision

**Selected:** raw Playwright with Node’s built-in test runner.

Use existing devDependencies:

- `playwright`
- `tsx`

Do **not** add `@playwright/test`, `playwright.config.ts`, or `tests/e2e` in this plan. That remains a future optional path if the project deliberately adopts Playwright Test with package and script changes.

## 3. Pass 0 — Hygiene and Durable Smoke

**Goal:** fix the generator data-island risk and make browser smoke coverage durable without changing the visual prototype.

### Scope

- Fix JSON/script data island escaping in `scripts/agent-canvas.ts` around the current inline artifact emission.
- Emit worklist/artifact data as a safe JSON island such as:

```html
<script type="application/json" id="artifacts-data">…</script>
```

- Escape `<`, `>`, `&`, U+2028, and U+2029 for HTML script-data context.
- Parse the JSON island before initializing the selected artifact/task state.
- Add a durable raw Playwright smoke test under the existing Node test path, for example `scripts/agent-canvas-smoke.test.ts`.
- Preserve the temporary smoke coverage as durable repo coverage:
  - generated HTML loads;
  - agent pane/list renders;
  - opening an artifact works;
  - blocked MAR chart attempt does not mutate state or close the pane;
  - no browser console errors occur.
- Keep generated output visually equivalent except for safe data-island plumbing.

### File budget

Expected files may include:

- `scripts/agent-canvas.ts`
- `docs/prototypes/pi-chart-agent-canvas.html`
- `scripts/agent-canvas-smoke.test.ts`
- `package.json` / `package-lock.json` only if a script alias is intentionally added; not required if existing `npm test` glob covers the new smoke test.

### Acceptance criteria

- Memo and implementation state that no durable E2E suite existed before this pass.
- Raw Playwright smoke runs through `node --test --import tsx`.
- No Playwright Test config/dependency is introduced in this pass.
- Generated output remains visually equivalent aside from JSON-island implementation details.

## 4. Pass 1 — Prototype-Oriented Worklist Model

**Goal:** introduce a typed worklist primitive without overbuilding addendum workflows or policy enforcement.

### Proposed schema shape

```ts
export type LifecycleState =
  | 'draft'
  | 'edited'
  | 'staged'
  | 'charted'
  | 'discarded'
  | 'superseded'
  | 'addendum_pending'
  | 'addendum_charted';

export type WorklistSurface =
  | 'artifact-pane'
  | 'task-lane'
  | 'vitals-strip'
  | 'handoff-pane'
  | 'timeline';

export interface EvidenceRef {
  ref: string;
  kind?: 'event' | 'vitals_window' | 'note' | 'derived_view' | 'artifact';
  role?: 'primary' | 'supporting' | 'context' | 'counterevidence';
}

export interface WorklistActionMeta {
  primary: 'edit' | 'stage' | 'chart' | 'discard' | 'review' | 'prefill';
  chartable?: boolean;
  blockedReason?: string;
  requiresReview?: boolean;
}

export interface WorklistSafetyMeta {
  autonomy: 'assist' | 'draft' | 'prefill' | 'stage' | 'chart';
  policyStatus: 'prototype' | 'pending_institutional_policy' | 'reviewed';
  warning?: string;
}

export interface WorklistItem {
  id: string;
  state: LifecycleState;
  source: string;
  surface: WorklistSurface;
  title: string;
  kind: string;
  bodyMarkdown: string;
  evidenceRefs: EvidenceRef[];
  confidence?: number;
  provenance?: string;
  priority: 'stat' | 'urgent' | 'routine' | 'watch';
  dueAt?: string;
  supersedes?: string;
  addendumOf?: string;
  action: WorklistActionMeta;
  safety: WorklistSafetyMeta;
}

export type Chartable = WorklistItem & {
  state: 'staged';
  action: WorklistActionMeta & { chartable: true; blockedReason?: undefined };
};
```

### Pure helpers

- parse/normalize worklist item inputs;
- visible/sorted item selectors;
- `isChartable(item): item is Chartable`;
- `isBlocked(item)`;
- render-data helpers, not broad HTML generation.

### Model rules

- `discarded` means the user/task chose not to proceed with that item. It remains available for audit views.
- `superseded` means a newer item replaces an older item via `supersedes` lineage.
- `addendum_pending` and `addendum_charted` remain minimal display states for now; do not overbuild the addendum chain.
- Device-streamed vitals use `action.primary: 'prefill' | 'stage'` and `safety.policyStatus: 'pending_institutional_policy'`.

### File budget

Expected files may include:

- `src/views/worklist.ts`
- `src/views/worklist.test.ts`
- `src/views/worklist.fixture.ts` if useful for stable prototype data
- `src/views/index.ts` if exporting the primitive

### Acceptance criteria

- `Chartable` is the domain type; no new `Committable` type.
- `charted` is the lifecycle state for completed chart writes.
- `discarded` and `superseded` are separate and tested.
- No `cheerio` dependency is selected; structural assertions use pure helpers, strings, or raw Playwright smoke.

## 5. Pass 2 — Generator Cutover

**Goal:** use the worklist model inside `scripts/agent-canvas.ts` while preserving current cockpit behavior and aesthetic.

### Scope

- Replace ad hoc artifact/task status objects with normalized `WorklistItem` data.
- Generate the current rail/panes from worklist render data.
- Keep behavior:
  - chart closes pane;
  - blocked MAR does not chart or close;
  - edits persist during session;
  - stage/chart/discard sync rail and modal status;
  - chat persists globally.
- Map prototype statuses to corrected states:
  - `draft`, `edited`, `staged`, `charted`, `discarded`, `superseded`.
- Legacy visual CSS classes may remain temporarily only if user-facing labels and schema semantics are correct.
- Keep generator-native single HTML output and cockpit aesthetic.

### File budget

Expected files may include:

- `scripts/agent-canvas.ts`
- `docs/prototypes/pi-chart-agent-canvas.html`
- `src/views/worklist.ts` / fixture updates if cutover exposes missing fields
- raw Playwright smoke updates as needed

### Acceptance criteria

- Generated HTML uses safe JSON/data islands.
- User-facing labels say chart/charted where applicable.
- MAR blocked behavior remains a no-op with smoke-test evidence.
- No process locks, file locks, or brittle external assumptions are introduced.

## 6. Pass 3 — Real `patient_002` Mapping

**Goal:** start replacing prototype literals with real chart primitives for `patient_002` without coupling to hidden simulator internals.

### Mapping sources

- `openLoops()` / `patients/patient_002/_derived/open-intents.md` → due reassessment worklist item.
- `trend()` / `patients/patient_002/timeline/2026-04-19/vitals.jsonl` / `_derived/latest-vitals.md` → vitals strip and vitals-derived prefill/stage candidates.
- `memoryProof()` / `_derived/memory-proof.md` → pane provenance, evidence refs, uncertainty, and support counts.
- `narrative()` / `patients/patient_002/timeline/2026-04-19/notes/0930_handoff.md` → handoff/draft artifact body.

### Scope

- Build a generator adapter that maps public chart primitives into `WorklistItem` fields.
- Keep fixture fallback for visual stability if a primitive read fails in prototype mode.
- Preserve the boundary: use public `pi-chart` files/views only, not hidden simulator source.

### File budget

Expected files may include:

- `scripts/agent-canvas.ts`
- `src/views/worklist.ts` if adapter types belong there, or a small generator-local adapter if not
- relevant mapping-helper tests
- generated HTML

### Acceptance criteria

- At least one open loop becomes a due reassessment worklist item.
- Vitals strip is driven by `patient_002` vitals/trend data.
- Evidence/provenance fields include refs from memory proof or source events.
- Handoff artifact body comes from narrative data or a clearly documented fixture fallback.

## 7. Pass 4 — Safety Memo and Later Enforcement

**Goal:** document safety policy and only then consider enforcement after worklist semantics stabilize.

### Scope

- Write a safety memo/table as a design artifact, not a claim of implemented clinical review workflow.
- Use “pending institutional policy” and “requires clinician review” language unless a real workflow is added.
- Device-streamed vitals row: **prefill/stage pending institutional policy**.
- Hard enforcement remains deferred until Passes 1–3 are stable and tested.
- If enforcement is later added, gate it behind an explicit feature flag and dedicated tests.

### Acceptance criteria

- No hard safety enforcement is scheduled before worklist model, generator cutover, and patient mapping are stable.
- Safety metadata exists in `WorklistItem` before enforcement consumes it.
- Memo does not imply clinician review mechanics absent implementation.

## 8. Verification Plan

Run after implementation handoff:

1. `npm test`
2. `npm run typecheck`
3. `npm run check`
4. Raw Playwright smoke through Node test infrastructure; no `npm run e2e` unless a later plan intentionally adopts Playwright Test.
5. Grep/checks:
   - no unexplained legacy charting vocabulary in user-facing output;
   - no selected `cheerio` dependency;
   - no automatic charting claim for device-streamed vitals;
   - `discarded` and `superseded` both present and distinct;
   - no Playwright Test config/dependency unless deliberately added later.

## 9. Risk Register

| Risk | Mitigation |
|---|---|
| Raw Playwright smoke mistaken for Playwright Test | Select raw Playwright explicitly and forbid Playwright Test config unless a later plan adopts it. |
| Chart terminology drifts back to legacy wording | Require `Chartable` naming and terminology checks. |
| Worklist schema overbuilds safety workflow | Keep Pass 1 prototype-oriented; safety metadata only. |
| Discard/supersede semantics collapse in CSS or selectors | Test separate state mapping and audit selectors. |
| Patient mapping couples to simulator internals | Use only `patients/patient_002/**` and exported `src/views/**` primitives. |
| Browser missing on fresh clone | Document `npx playwright install chromium` as environment setup, not a repo dependency change. |

## 10. ADR

**Decision:** Use a five-pass execution sequence: hygiene/raw smoke, prototype worklist model, generator cutover, real `patient_002` mapping, and delayed safety memo/enforcement. Use chart/charted/Chartable vocabulary, raw Playwright under Node test infrastructure, and a richer `WorklistItem` contract.

**Drivers:** repo-accurate test infrastructure, clinical vocabulary correctness, audit-state preservation, and staged safety posture.

**Alternatives considered:**

- Add Playwright Test now: rejected because it adds unrequested package/config scope.
- Keep legacy charting vocabulary: rejected for user-facing/domain wording; only acceptable as hidden internal implementation if proven non-user-facing.
- Enforce safety before worklist/patient mapping: rejected because enforcement would encode unstable semantics.

**Why chosen:** smallest reliable path that corrects false assumptions and creates an execution-ready plan without prematurely adding framework or policy machinery.

**Consequences:** browser checks remain raw smoke for now; execution touches more than four files when generator cutover occurs; safety enforcement is explicit future work, not silently omitted.

**Follow-ups:** decide later whether a full Playwright Test suite is worth dependency/config adoption; promote safety memo into enforcement only after review-ready worklist behavior is stable.

## 11. Execution Handoff

### Ralph path

Use single-owner execution when revising the memo or implementing one pass at a time.

Recommended lanes:

- `executor` — source/memo edits;
- `test-engineer` — Node test/raw Playwright smoke strategy;
- `verifier` — checklist evidence and final verification.

### Team path

Use team execution only when multiple implementation lanes are active.

Suggested split:

1. Pass 0 generator JSON island + raw Playwright smoke.
2. Pass 1 worklist primitive/tests.
3. Pass 2 generator cutover.
4. Verification/checklist lane.

Team must prove all tasks are terminal, required tests pass, smoke covers blocked MAR no-op and artifact opening, generated HTML reflects safe data islands and charted terminology, and no unapproved dependency/config appeared.

## 12. Consensus Log

- Original memo: directionally useful but not approved as-is.
- Required user revisions incorporated: chart terminology, Playwright fact correction, runner decision, no selected `cheerio`, real file budget, staged/prefill vitals posture, separate discarded/superseded states, expanded `WorklistItem`, softened review language, and deferred safety enforcement.
- Ralplan revision 1: Architect `REVISE` because pass structure did not match required Pass 0–4 sequence and lacked a dedicated real `patient_002` mapping pass.
- Ralplan revision 2: Architect `APPROVE`.
- Critic review: `APPROVE`; no mandatory final improvements.
