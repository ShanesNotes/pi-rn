# RALPLAN-DR Short — pi-chart Agent Canvas Plan Revision

**Target memo:** `memos/pi-chart-agent-canvas-plan-26042026.md`  
**Consensus status:** APPROVED. Architect: APPROVE. Critic: APPROVE. Mandatory final improvements: none.  
**Execution stance:** do not execute the old memo. First revise it to this plan, then hand off to `$ralph` or `$team`.

## Requirements Summary

Revise the agent-canvas implementation plan so it is execution-safe, repo-accurate, clinically honest, and aligned with the established charting vocabulary. The prior plan is directionally useful but must not execute unchanged because it overstates Playwright infrastructure, uses commit vocabulary, collapses audit states, assumes dependencies, and schedules safety enforcement too early.

## RALPLAN-DR Summary

### Principles

1. **Use clinical charting vocabulary.** User-facing and domain-model language uses `chart`, `charted`, and `Chartable`; `commit/committed/Committable` is rejected unless explicitly proven internal-only and non-user-facing.
2. **Plan from repo facts, not desired infrastructure.** Current repo has `playwright` + `tsx`, no `@playwright/test`, no durable `tests/e2e`, and no `playwright.config.ts`.
3. **Prototype the worklist before policy enforcement.** Shape the worklist model, generator behavior, and patient mapping before hard safety rules.
4. **Preserve audit semantics.** `discarded` and `superseded` are distinct states; one is user disposition, the other is lineage replacement.
5. **Avoid unsupported clinical workflow claims.** Say “review-ready”, “staged”, or “requires clinician review”; do not imply real clinician sign-off workflow unless implemented.

### Decision Drivers

1. **Immediate executable correctness:** the next executor must not be sent toward nonexistent test runner/config/dependency assumptions.
2. **Clinical safety posture:** device-streamed vitals must be prefill/stage pending institutional policy, not auto-chart.
3. **Useful worklist model:** schema must support the actual panes: source/surface, markdown body, evidence/provenance, confidence, priority, action metadata, and safety metadata.

### Viable Options

#### Option A — Existing raw Playwright + Node test runner

Use the existing `playwright` devDependency through raw Playwright APIs from a durable `node:test` smoke file executed with `node --test --import tsx`, covered by the existing `npm test` glob if placed under `scripts/**/*.test.ts`.

**Pros:** matches current package state; no new dependency; can preserve temporary smoke coverage as a durable repo test; avoids `playwright.config.ts`.  
**Cons:** less featureful than Playwright Test; browser binary availability remains an environment prerequisite.

#### Option B — Adopt `@playwright/test`

Add `@playwright/test`, `playwright.config.ts`, `tests/e2e`, package scripts, and lockfile updates.

**Pros:** durable conventional E2E suite; easier future interaction matrix.  
**Cons:** dependency/config churn; contradicts “do not assume Playwright Test” unless explicitly chosen; expands scope and file budget.

### Selected Option

**Choose Option A now.** The revised memo must say: no durable repo E2E suite exists today; temporary raw Playwright smoke tests passed; the next pass should preserve that coverage via a durable raw Playwright smoke using existing `playwright` + `node --import tsx`. Do not add `@playwright/test` or `playwright.config.ts` in this plan.

## Corrected Implementation Plan

### Pass 0 — Hygiene and Durable Smoke

**Goal:** fix the generator data-island risk and make browser smoke coverage durable without changing the visual prototype.

**Scope:**
- Fix JSON/script data island escaping in `scripts/agent-canvas.ts` around current inline `const artifacts=${JSON.stringify(...)}` emission.
- Emit data as `<script type="application/json" id="artifacts-data">…</script>` / equivalent safe JSON island, escaping `<`, `>`, `&`, U+2028, and U+2029 as needed for HTML script data context.
- Parse before the current `let selected = artifacts[0].id` initialization.
- Add a durable raw Playwright smoke test using existing `playwright` + `node --test --import tsx`; do **not** add `@playwright/test`.
- Preserve the previous temporary smoke coverage as a repo test: load generated HTML, verify panes render, opening an artifact works, blocked MAR chart attempt does not mutate/close, and no console errors occur.
- Keep generated output visually equivalent except the JSON-island/script-parse delta.

**Likely file budget:**
- `scripts/agent-canvas.ts`
- `docs/prototypes/pi-chart-agent-canvas.html` generated output
- `scripts/agent-canvas-smoke.test.ts` or similar raw Playwright `node:test` smoke
- optional `package.json` / `package-lock.json` only if adding a script alias; not required if existing `npm test` glob covers `scripts/**/*.test.ts`

**Acceptance criteria:**
- The memo correctly states no durable E2E suite existed before this pass.
- Raw Playwright smoke is durable and runnable through current Node test infrastructure.
- No `playwright.config.ts`, `tests/e2e`, or `@playwright/test` appears unless a later plan explicitly chooses Option B.
- Generated prototype is visually equivalent apart from safe data-island plumbing.

### Pass 1 — Prototype-Oriented Worklist Model

**Goal:** introduce a typed worklist view primitive without overbuilding addendum chains or policy enforcement.

**Add `src/views/worklist.ts` with a schema shaped for current panes:**

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

**Pure helpers:**
- parse/normalize worklist item inputs
- visible/sorted items
- `isChartable(item): item is Chartable`
- `isBlocked(item)`
- render-data helpers, not broad HTML generation

**Explicit model rules:**
- `discarded` is user/task disposition and remains audit-visible when requested.
- `superseded` is lineage replacement via `supersedes` and is separate from discarded.
- Addendum chain stays minimal: support fields and display semantics only; do not overbuild workflow enforcement yet.
- Device-streamed vitals use `action.primary: 'prefill' | 'stage'` and `safety.policyStatus: 'pending_institutional_policy'`, not auto-chart.

**Likely file budget:**
- `src/views/worklist.ts`
- `src/views/worklist.test.ts`
- `src/views/worklist.fixture.ts` if useful for stable prototype data
- `src/views/index.ts` if exporting the view primitive

**Acceptance criteria:**
- No `Committable`; type is `Chartable`.
- `charted` replaces `committed` in domain/user-facing lifecycle.
- `discarded` and `superseded` are separate and tested.
- No `cheerio` dependency. Structural assertions use pure helpers, strings, or raw Playwright smoke.

### Pass 2 — Generator Cutover

**Goal:** use the worklist model inside `scripts/agent-canvas.ts` while preserving current cockpit behavior and aesthetic.

**Scope:**
- Replace ad hoc artifact/task status objects with normalized `WorklistItem` data.
- Generate the current rail/panes from worklist render data.
- Keep behavior:
  - chart closes pane
  - blocked MAR does not chart or close
  - edits persist during session
  - stage/chart/discard sync rail and modal status
  - chat persists globally
- Map current prototype statuses to corrected states:
  - `draft`, `edited`, `staged`, `charted`, `discarded`, `superseded`
  - legacy visual CSS can remain temporarily if mapper preserves user-facing labels
- Keep cockpit aesthetic and generator-native single HTML output.

**Likely file budget:**
- `scripts/agent-canvas.ts`
- `docs/prototypes/pi-chart-agent-canvas.html`
- `src/views/worklist.ts` / fixture updates if cutover exposes missing fields
- raw Playwright smoke updates as needed

**Acceptance criteria:**
- Generated HTML uses safe JSON/data islands.
- User-facing labels say chart/charted where applicable.
- MAR blocked behavior remains a no-op with evidence from raw Playwright smoke.
- No process/file locks or brittle external assumptions are introduced.

### Pass 3 — Real `patient_002` Mapping

**Goal:** start replacing prototype literals with real chart primitives for `patient_002` without coupling to hidden simulator internals.

**Mapping sources:**
- `openLoops()` / `patients/patient_002/_derived/open-intents.md` → due reassessment worklist item.
- `trend()` / `patients/patient_002/timeline/2026-04-19/vitals.jsonl` / `_derived/latest-vitals.md` → vitals strip and vitals-derived prefill/stage candidates.
- `memoryProof()` / `_derived/memory-proof.md` → pane provenance, evidence refs, uncertainty, and support counts.
- `narrative()` / `patients/patient_002/timeline/2026-04-19/notes/0930_handoff.md` → handoff/draft artifact body.

**Scope:**
- Build a generator adapter that maps these primitives into `WorklistItem` fields.
- Keep fixture fallback for visual stability if a primitive read fails in prototype mode.
- Preserve `patient_002` boundary: use public chart files/views only, not `pi-sim` source.

**Likely file budget:**
- `scripts/agent-canvas.ts`
- `src/views/worklist.ts` if adapter types belong there; otherwise a small generator-local adapter
- relevant tests for mapping helpers
- generated HTML

**Acceptance criteria:**
- At least one open loop becomes a due reassessment worklist item.
- Vitals strip is driven by patient_002 vitals/trend data.
- Evidence/provenance fields include refs from memory proof or source events.
- Handoff artifact body comes from narrative data or clearly documented fixture fallback.

### Pass 4 — Safety Memo and Later Enforcement

**Goal:** document safety policy and only then consider enforcement after worklist semantics stabilize.

**Scope:**
- Write a safety memo/table as a design artifact, not a claim of implemented sign-off.
- Language should be “pending institutional policy” / “requires clinician review” unless a real workflow is added.
- Device-streamed vitals row: **prefill/stage pending institutional policy**, not auto-chart.
- Enforcement remains deferred until Passes 1–3 are stable and tested.
- If enforcement is later added, gate it behind an explicit feature flag and dedicated tests.

**Acceptance criteria:**
- No hard safety enforcement is scheduled before worklist model, generator cutover, and patient mapping are stable.
- Safety metadata exists in `WorklistItem` before enforcement consumes it.
- Memo does not imply clinician sign-off mechanics absent implementation.

## Verification Plan

Run after implementation handoff, not during this planning-only lane:

1. `npm test`
2. `npm run typecheck`
3. `npm run check`
4. Raw Playwright smoke via existing Node test infrastructure; no `npm run e2e` unless Option B is explicitly adopted later.
5. Greps/checks:
   - no user-facing `commit`, `committed`, `Committable`
   - no unexplained `cheerio`
   - no `auto-chart` for device-streamed vitals
   - `discarded` and `superseded` both present and distinct
   - no `@playwright/test`, `playwright.config.ts`, or `tests/e2e` unless deliberately added by a later plan

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Raw Playwright smoke mistaken for Playwright Test | Memo explicitly selects raw Playwright and forbids `playwright.config.ts` unless Option B is later adopted. |
| Chart terminology drifts back to commit terminology | Add terminology grep and require `Chartable` type/predicate naming. |
| Worklist schema overbuilds safety workflow | Keep Pass 1 prototype-oriented; safety metadata only, enforcement later. |
| Discard/supersede semantics collapse in CSS mapper | Test separate state mapping and audit selectors. |
| Patient mapping couples to simulator | Use only `patients/patient_002/**` and exported `src/views/**` primitives. |
| Browser availability on fresh clone | Document `npx playwright install chromium` as environment setup, not a repo dependency change. |

## ADR

**Decision:** revise the agent-canvas plan around a five-pass sequence: hygiene/raw smoke, prototype worklist model, generator cutover, real patient_002 mapping, and delayed safety memo/enforcement. Use chart/charted/Chartable vocabulary, raw Playwright under Node test infrastructure, and a richer WorklistItem contract.

**Drivers:** repo-accurate test infrastructure, clinical vocabulary correctness, audit-state preservation, and staged safety posture.

**Alternatives considered:**
- Add `@playwright/test` now: rejected because it adds unrequested package/config scope.
- Keep `commit/committed/Committable`: rejected for user-facing/domain wording; only acceptable as hidden internal implementation if proven non-user-facing.
- Enforce safety before worklist/patient mapping: rejected because enforcement would encode unstable semantics.

**Why chosen:** smallest reliable path that corrects false assumptions and creates an execution-ready plan without prematurely adding framework or policy machinery.

**Consequences:** browser checks remain raw smoke for now; execution touches more than four files when generator cutover occurs; safety enforcement is explicit future work, not silently omitted.

**Follow-ups:** decide later whether a full Playwright Test suite is worth dependency/config adoption; promote safety memo into enforcement only after review-ready worklist behavior is stable.

## Available Agent Types Roster

- `explore` — repo fact lookup and file/symbol mapping.
- `planner` — sequencing and scope control.
- `architect` — architecture and tradeoff review.
- `critic` — contradiction and acceptance-criteria review.
- `executor` — implementation/memo edits after approval.
- `test-engineer` — raw Playwright/node:test strategy and smoke coverage.
- `verifier` — final evidence and requirement checklist.
- `writer` — memo wording, terminology, and ADR polish.
- `security-reviewer` — future safety/enforcement review if policy or PHI/auth boundaries expand.

## Consensus Review Log

- Planner draft 1 created `.omx/plans/ralplan-pi-chart-agent-canvas-memo-revision-26042026.md`.
- Architect review 1: `REVISE` — pass structure was mostly correct but did not match required Pass 0–4 sequence and lacked a dedicated real `patient_002` mapping pass.
- Planner revision: rebuilt plan around Pass 0 hygiene/raw smoke, Pass 1 worklist model, Pass 2 generator cutover, Pass 3 real `patient_002` mapping, Pass 4 safety memo/enforcement.
- Architect review 2: `APPROVE` — no required edits.
- Critic review: `APPROVE` — no mandatory final improvements. Evidence included target memo, `package.json`, `scripts/agent-canvas.ts`, `src/views/index.ts`, and `patient_002` mapping sources.

## `$ralph` Handoff Guidance

Use `$ralph` for single-owner execution of the memo revision or implementation after approval.

```bash
$ralph "Revise memos/pi-chart-agent-canvas-plan-26042026.md to match .omx/plans/ralplan-pi-chart-agent-canvas-memo-revision-26042026.md. Do not implement source changes yet. Verify all required user revisions are represented."
```

Suggested internal lanes:
- `executor` medium: memo revision.
- `test-engineer` medium: package/test/Playwright fact validation.
- `verifier` high: checklist against user-required revisions.

## `$team` Handoff Guidance

Use `$team` only if implementation begins and parallel lanes are worthwhile.

```bash
omx team 4:executor "Implement approved agent-canvas plan from .omx/plans/ralplan-pi-chart-agent-canvas-memo-revision-26042026.md with lanes for Pass 0 smoke/hygiene, Pass 1 worklist model, Pass 2 generator cutover, and verification."
```

Suggested staffing:
1. `executor` medium — Pass 0 generator JSON island + raw Playwright smoke.
2. `executor` medium — Pass 1 worklist primitive/tests.
3. `executor` medium — Pass 2 generator cutover.
4. `verifier`/`test-engineer` high — acceptance checklist and command verification.

## Team Verification Path

Before shutdown, team must prove:
- all assigned tasks terminal with no pending/failed work;
- `npm test`, `npm run typecheck`, and `npm run check` pass or documented blocker exists;
- raw Playwright smoke covers blocked MAR no-op and artifact opening;
- generated HTML reflects safe data island and charted terminology;
- `discarded` and `superseded` remain distinct;
- no new dependency/config appeared unless explicitly approved.

## Changelog From Prior Draft

- Replaced generic pass structure with required Pass 0–4 sequencing.
- Added dedicated real `patient_002` mapping pass.
- Made raw Playwright + Node test the selected runner choice.
- Removed `cheerio` from selected plan.
- Added expanded `WorklistItem` schema and `Chartable` type.
- Deferred safety enforcement after worklist, generator cutover, and patient mapping.
