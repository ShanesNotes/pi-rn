Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.

# PRD — ADR17-002 dashboard disposition

## RALPLAN-DR summary

### Principles

1. Decision before implementation: this lane decides dashboard disposition; it does not change `docs/plans/dashboard.html`, `scripts/dashboard*.ts`, `package.json`, or any canonical surface.
2. Brownfield reality wins: accepted ADR 018, the source-authority map, the current `npm run dashboard` workflow, and the passing `scripts/dashboard.test.ts` outrank proposal/memo language.
3. ADR 018 directionality binds: UI prototypes and generated cockpit artifacts are directional product evidence only and must not be promoted to authoritative architecture by silent regen or repetition.
4. Thin, owned tracer bullets: each card names owned files, first validation, verification command, and stop boundary.
5. HITL for canonical authority: a human must record the disposition before any banner injection, retirement, CI wiring, or canonical edit.

### Decision drivers

1. Avoid silently promoting `docs/plans/dashboard.html` from a generated planning utility into an authoritative project status reporter.
2. Preserve the current `npm run dashboard` / `npm run dashboard:dev` workflow until disposition is recorded; the dashboard is the only quick four-column glance over `kanban-prd-board.md`.
3. Resolve the tension between `docs/plans/README.md` (treats dashboard as stable build artifact, lines 48–52) and `decisions/018-architecture-rebase-clinical-truth-substrate.md:34` ("UI prototypes and generated cockpit artifacts are directional product evidence only") with the deprecated cue at `docs/architecture/source-authority.md:86` ("Treating Agent Canvas or generated HTML as product architecture").
4. Keep the agent-canvas disposition out of this lane; it is materially entangled with the ADR 018 spike and belongs in `ADR17-003`.

### Viable options

| Option | Tradeoff | When to choose |
|---|---|---|
| A. Accept dashboard.html as stable planning-utility build artifact | Keeps current `npm run dashboard` workflow; no banner pass; signals dashboard is a permanent (planning-only, non-clinical) tool, distinct from UI prototypes. | HITL agrees the dashboard is utility tooling over `kanban-prd-board.md`, not a UI prototype, and ADR 018 §UI-status does not apply. |
| B. Quarantine-banner per `docs/architecture/source-authority.md:107–111` | Preserves artifact and workflow; signals non-authority via standardized banner; matches ADR 018 directional-evidence framing. | HITL agrees the dashboard is directional/historical evidence and the banner-first-pass strategy from `source-authority.md` applies. |
| C. Retire to `docs/plans/.draft/` (gitignored) per A9B precedent | Cleanest current-state planning surface; removes dashboard from canonical entry points; future re-authorization required to revive. | HITL agrees the dashboard adds noise and is not load-bearing for the current planning loop. |
| D. Promote to first-class CI-wired tooling | Wires `npm run dashboard` into `npm run check` or pre-commit; commits dashboard.html as tracked output (or moves regen target into CI). | HITL wants the dashboard to become canonical project status reporter and accepts the dependency, untracked-build, and regen-on-edit surface. |
| E. Defer until ADR 018 spike result | Keeps current state; revisits after the clean-slate spike and future ADR 019; mirrors `ADR17-003` (agent-canvas) gating. | HITL wants disposition aligned with whatever surfaces survive clean-slate analysis. |

This PRD does not pre-recommend an option. HITL records one disposition.

The verbatim quarantine banner referenced by Option B (and required for the post-approval implementation outline if Option B is chosen) is the line from `docs/architecture/source-authority.md:109`:

> **Status:** Historical/prototype artifact. Not current architectural authority. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`.

It must be reproduced exactly if HITL chooses Option B; this PRD includes it for review, not for injection.

## Source inputs and brownfield authority

Primary inputs:

- `docs/plans/kanban-prd-board.md` (`ADR17-002` row, narrowed by this lane)
- `docs/plans/phase-a-bridge-acceptance-report.md` (deferral language: "Dashboard/cockpit/prototype files and the `playwright` dependency remain an out-of-scope, non-authoritative dirty baseline for PHA-001 because the user was unsure how to dispose of them.")
- `decisions/017-actor-attestation-review-taxonomy.md` (lane parent, accepted; says nothing about dashboard.html — `ADR17-002` is board-level naming, not an ADR017 successor)
- `decisions/018-architecture-rebase-clinical-truth-substrate.md` (UI prototypes are directional product evidence only; non-deletion non-goal)
- `docs/architecture/source-authority.md` (prototype/directional evidence classification; deprecated cue line 86; quarantine banner policy lines 105–111)
- `.omx/specs/deep-interview-kanban-dashboard.md` (origin spec, PASSED; non-goals list excludes click-through, deltas, backend, theming)
- `.omx/plans/ralplan-kanban-dashboard.md` (implementation RALPLAN; hand-rolled parser; build-artifact + gitignore strategy)
- `docs/plans/disposition-memo-a9b-prd-vs-adr-018.md` (short-form `.draft/` retirement precedent)

Brownfield reality:

- `docs/plans/dashboard.html` is a 38KB generated static viewer of `kanban-prd-board.md`. It is gitignored and rebuilt by `npm run dashboard`.
- `scripts/dashboard.ts` (289 lines) parses pipe tables in `kanban-prd-board.md` and emits `docs/plans/dashboard.html`. `scripts/dashboard.test.ts` (8 tests) covers parser/renderer behavior. `scripts/dashboard-dev.ts` (105 lines) is an optional SSE-backed dev server on port 5173.
- `package.json` declares `"dashboard": "tsx scripts/dashboard.ts"` and `"dashboard:dev": "tsx scripts/dashboard-dev.ts"`. Neither is invoked from `npm run check` or any CI hook.
- `docs/plans/README.md` lines 48–52 reference the dashboard as "a generated, gitignored build artifact" and "a 4-column glance view."
- `decisions/018-architecture-rebase-clinical-truth-substrate.md:34` reframes UI prototypes generally as directional-only; the non-goals section forbids deletion of historical memos, design files, screenshots, or `.omx` artifacts.
- `docs/architecture/source-authority.md` lists `docs/prototypes/`, `scripts/agent-canvas.ts` output, and `tests/fixtures/agent-canvas-context.json` as prototype evidence. It does not list `docs/plans/dashboard.html` — its classification is currently ambiguous, which is exactly what this lane resolves.
- The agent-canvas baseline (`scripts/agent-canvas*.ts`, `docs/prototypes/pi-chart-agent-canvas.html`, `tests/fixtures/agent-canvas-context.json`) is **out of scope** for this lane. It is deferred to `ADR17-003 Agent-canvas disposition`, gated on ADR 018 spike acceptance.
- This lane must not edit canonical ADRs, `docs/architecture/source-authority.md`, `docs/plans/dashboard.html`, `scripts/dashboard*.ts`, `package.json`, or `docs/plans/README.md`.
- This lane must preserve `pi-chart` boundaries: no coupling to `pi-agent`, `pi-sim`, hidden simulator state, or the bounded chart/EHR surface itself. The dashboard renders only `kanban-prd-board.md`; it must never read from `patients/` or any clinical surface.

## Problem

`PHA-001` deferred dashboard disposition because the user was unsure how to dispose of it. ADR 018 has since landed and reframed UI prototypes as directional-only, but `docs/plans/dashboard.html` is arguably planning-utility tooling rather than a UI prototype: it has no clinical coupling, sources only from `kanban-prd-board.md`, and is regenerable without state. The project needs an executable decision lane that lets HITL pick one disposition, distinguishes the dashboard from the agent-canvas baseline (now `ADR17-003`), and prevents accidental implementation (banner injection, `.draft/` retirement, CI wiring, package-manifest change, or deletion) before approval.

## Refined acceptance criteria

1. PRD and test spec begin from the proposed/non-canonical status and never promote a disposition to accepted policy by themselves.
2. The lane separates **HITL decision work**, **brownfield characterization**, and **post-approval implementation only**.
3. Decision options include accept, banner, retire, promote, and defer, each with tradeoffs and downstream consequences. There is no reject/delete option because ADR 018 non-goals forbid deletion of historical artifacts.
4. Every tracer bullet names owned files, first failing/characterization test or validation, verification command, and a stop boundary.
5. Current `dashboard.html` / `scripts/dashboard*.ts` / `package.json` / `docs/plans/README.md` behavior is described as brownfield reality, not desired policy.
6. Banner injection, `.draft/` retirement, CI wiring, deletion, package-manifest change, dependency change, or any edit to `docs/plans/dashboard.html` or `scripts/dashboard*.ts` is blocked until HITL approval.
7. Explicit deferrals list every dashboard implementation concept that must not be implemented by this lane, including agent-canvas (deferred to `ADR17-003`).
8. Verification proves no canonical ADR, product-root, package-manifest, lockfile, or `scripts/` change was introduced by this planning lane; the only paths owned by this lane are `docs/plans/prd-adr17-002-dashboard-disposition.md`, `docs/plans/test-spec-adr17-002-dashboard-disposition.md`, and the narrow row edits in `docs/plans/kanban-prd-board.md`.

## Thin tracer bullets

| Card | Purpose | Owned files | First failing/characterization test or validation | Verification command | Stop boundary |
|---|---|---|---|---|---|
| ADR17-002-TB-0 Authority/source conflict lock | Capture sources, repo authority, brownfield reality, and the README/ADR018/source-authority tension before any decision. | `docs/plans/prd-adr17-002-dashboard-disposition.md`; `docs/plans/test-spec-adr17-002-dashboard-disposition.md` | Structural script confirms required source citations and the proposed/non-canonical status banner. | Embedded Python validator in the test spec. | Docs-only; no canonical ADR, source-authority, dashboard, scripts, or package change. |
| ADR17-002-TB-1 HITL disposition packet | Present accept/banner/retire/promote/defer options with tradeoffs, required HITL answers, and decision consequences. | Same PRD/test-spec; possible future board row edit only after disposition. | Completeness check proves all five options, seven HITL answers, and consequences are present. | Embedded Python validator plus human review of `## HITL checkpoint`. | Stop until human records one disposition. |
| ADR17-002-TB-2 Brownfield dashboard characterization | Prove current dashboard behavior and identify safe future test seams without touching code. | Planning docs only; read-only references to `docs/plans/dashboard.html`, `scripts/dashboard.ts`, `scripts/dashboard.test.ts`, `scripts/dashboard-dev.ts`, `package.json`, `docs/plans/README.md`. | Read-only commands characterize file presence, gitignore status, npm-script wiring, and test-suite green: `ls -la docs/plans/dashboard.html scripts/dashboard.ts scripts/dashboard.test.ts scripts/dashboard-dev.ts`; `grep -n "dashboard" package.json docs/plans/README.md`; `git ls-files docs/plans/dashboard.html` (expects empty); `git log --oneline -- docs/plans/dashboard.html scripts/dashboard.ts scripts/dashboard.test.ts scripts/dashboard-dev.ts \| head`. | Same commands; expected outputs documented in the test spec. | If HITL wants implementation, create characterization tests in a later lane first; do not edit `docs/plans/dashboard.html` or `scripts/dashboard*.ts` here. |
| ADR17-002-TB-3 ADR 018 / source-authority cross-check | Anchor the disposition against accepted architecture authority so no option silently violates ADR 018 §UI-status, §non-deletion, or the source-authority deprecated cue. | PRD decision tables; future `docs/architecture/source-authority.md` edit only after HITL revision. | Structural script asserts the PRD cites `decisions/018-architecture-rebase-clinical-truth-substrate.md`, `docs/architecture/source-authority.md`, the verbatim banner phrase from line 109, and the directional-evidence and non-deletion phrases. | Embedded Python validator. | No canonical ADR or `source-authority.md` edit in this lane. |
| ADR17-002-TB-4 Post-approval implementation handoff | Define implementation that would follow only after approval, per disposition. | PRD/test-spec only now; future-owned files would include `docs/plans/dashboard.html` (header banner via generator template), `docs/plans/README.md` (pointer text), `docs/plans/.draft/dashboard.html` (retirement target), or `package.json` (CI wiring) depending on disposition. | First future failing/characterization step would be re-running `scripts/dashboard.test.ts` (8/8 baseline) after any generator-template change. Future lane runs `npm test`, `npm run typecheck`, and `npm run check` after HITL-approved edits. | Current guard: `git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock docs/plans/dashboard.html docs/plans/README.md`. | Explicitly blocked in this lane. |

## HITL checkpoint

Before any canonical, dashboard, scripts, package, or README change, a human reviewer must record one disposition: **accept**, **banner**, **retire**, **promote**, or **defer**.

Required HITL answers:

1. Disposition for `docs/plans/dashboard.html`: accept, banner, retire-to-`.draft/`, promote, or defer?
2. If banner: inject the verbatim banner from `docs/architecture/source-authority.md:109` inline at the top of the HTML template in `scripts/dashboard.ts` (so every `npm run dashboard` regen carries it), or add a one-paragraph pointer at the top of `docs/plans/README.md` only?
3. If retire: move the `npm run dashboard` regen target from `docs/plans/dashboard.html` to `docs/plans/.draft/dashboard.html` (already gitignored), and what happens to `scripts/dashboard.ts`, `scripts/dashboard.test.ts`, `scripts/dashboard-dev.ts`, and the `dashboard` / `dashboard:dev` npm scripts — keep, archive, or delete?
4. If promote: wire `npm run dashboard` into `npm run check` (and/or pre-commit), and is committing `docs/plans/dashboard.html` as a tracked output acceptable, or should regen move into CI only?
5. If defer: bind the deferral to ADR 018 spike acceptance (same gate as `ADR17-003`) or to a calendar review date?
6. Is the dashboard.html-only narrowing of `ADR17-002` acceptable, with agent-canvas moved to a new `ADR17-003` placeholder gated on ADR 018 spike output?
7. Binding source if `docs/plans/README.md` lines 48–52 (treats dashboard as stable build artifact) and `decisions/018-architecture-rebase-clinical-truth-substrate.md:34` (UI prototypes are directional-only) conflict — README, ADR 018, `docs/architecture/source-authority.md`, or a new revised note?

## Decision consequences and follow-on boundaries

| Disposition | Immediate outcome | Implementation that may follow only after approval |
|---|---|---|
| Accept | Dashboard is canonical planning utility; `docs/plans/README.md` and `kanban-prd-board.md` continue to reference it as-is. | Optionally tighten `scripts/dashboard.test.ts` coverage and document regen workflow more explicitly. No CI wiring, no banner. |
| Banner | Dashboard remains regenerable; banner pass authorized for the generator template only. | Edit the HTML template inside `scripts/dashboard.ts` to emit the verbatim banner from `source-authority.md:109` at the top of every regenerated `docs/plans/dashboard.html`; update `scripts/dashboard.test.ts` to assert the banner appears in output. |
| Retire | Dashboard removed from canonical planning surface; `npm run dashboard` regen target moves to `.draft/`. | Move regen output target to `docs/plans/.draft/dashboard.html` in `scripts/dashboard.ts`; update or remove `dashboard` / `dashboard:dev` npm scripts per HITL #3; delete the `Dashboard` section from `docs/plans/README.md`. |
| Promote | Dashboard becomes first-class CI-wired tooling. | Decide tracked-output vs CI-only regen; wire `npm run dashboard` into `npm run check`; update `package.json`; add CI documentation. |
| Defer | Current state preserved; revisit after ADR 018 spike acceptance (same gate as `ADR17-003`). | None until the gate clears. |

## Post-approval implementation outline (not authorized now)

If HITL approves an implementation branch, execution should start with characterization/failing tests, then code:

1. Re-run `npm test` (current baseline 389/389, including `scripts/dashboard.test.ts` 8/8) and capture the green baseline before any change.
2. Add a characterization test asserting the chosen disposition's invariant: e.g., for `banner`, assert the regenerated HTML contains the verbatim banner line; for `retire`, assert `docs/plans/dashboard.html` no longer exists and `docs/plans/.draft/dashboard.html` is the new regen target; for `promote`, assert `npm run check` invokes `npm run dashboard`.
3. Only then modify approved files: likely `scripts/dashboard.ts` (template), possibly `scripts/dashboard.test.ts` (assertions), and possibly `package.json` / `docs/plans/README.md` per disposition.
4. Run `npm test`, `npm run typecheck`, and `npm run check`; document deferrals in an acceptance report.

## Explicit deferrals

- Editing `docs/plans/dashboard.html` directly.
- Editing `scripts/dashboard.ts`, `scripts/dashboard.test.ts`, or `scripts/dashboard-dev.ts`.
- Editing `package.json` `dashboard` / `dashboard:dev` script entries or adding/removing dependencies.
- Editing `decisions/017-actor-attestation-review-taxonomy.md` or `decisions/018-architecture-rebase-clinical-truth-substrate.md`.
- Editing `docs/architecture/source-authority.md` (canonical source-authority map).
- Editing the `## Dashboard` section of `docs/plans/README.md` (lines 48–52).
- Wiring dashboard generation into `npm run check`, pre-commit, or CI.
- Committing `docs/plans/dashboard.html` as a tracked output before HITL approves promotion.
- Adding new dependencies for dashboard tooling (e.g., a markdown parser library to replace the hand-rolled parser).
- Deleting `docs/plans/dashboard.html`, `scripts/dashboard*.ts`, or any historical prototype artifact (ADR 018 non-deletion non-goal).
- Authoring agent-canvas disposition (deferred to `ADR17-003 Agent-canvas disposition`, gated on ADR 018 spike acceptance).
- Coupling the dashboard to clinical surfaces (`patients/**`), `pi-agent`, `pi-sim`, or hidden simulator state.
- Adding actor/attestation/review semantics from ADR 017 to dashboard rendering.
- Mapping the dashboard to FHIR, openEHR, legal signature, retention, redaction, archive, or UI workflows.

## Intended board row snippet

`ADR17-002 Dashboard disposition` — neutral options-only disposition lane with five tracer bullets `ADR17-002-TB-0` through `ADR17-002-TB-4`. Decide accept, banner, retire, promote, or defer for `docs/plans/dashboard.html` and the `scripts/dashboard*.ts` family before any banner injection, retirement, CI wiring, package-manifest change, or canonical edit. Sources: `docs/plans/dashboard.html`, `scripts/dashboard.ts`, `scripts/dashboard.test.ts`, `scripts/dashboard-dev.ts`, `package.json` `dashboard` / `dashboard:dev` scripts, `docs/plans/README.md` lines 48–52, `decisions/018-architecture-rebase-clinical-truth-substrate.md` UI-status decision and non-deletion non-goal, `docs/architecture/source-authority.md` lines 55–65, 86, 105–111, `.omx/specs/deep-interview-kanban-dashboard.md`, `.omx/plans/ralplan-kanban-dashboard.md`, `docs/plans/disposition-memo-a9b-prd-vs-adr-018.md`. Owned artifacts: `docs/plans/prd-adr17-002-dashboard-disposition.md`, `docs/plans/test-spec-adr17-002-dashboard-disposition.md`. Agent-canvas baseline is **deferred to `ADR17-003`**, gated on ADR 018 spike acceptance. Next gate: HITL disposition.

## Available-agent-types roster and staffing guidance for future handoff

- `$ralph` path: one sequential owner should run HITL-approved tests-first implementation after disposition; use `executor` for the narrow code/template edit and `verifier` for evidence review (`npm test` 389/389 baseline plus disposition invariant).
- `$team` path: only after HITL approves multiple parallel sub-cards (e.g., banner + README pointer simultaneously). Suggested roles: `planner` for sub-card shaping, `executor` for one approved code/template slice, `test-engineer` for characterization tests, `verifier` for final no-policy-leak review.
- Suggested launch hint after approval only: `$ralph <approved ADR17-002 disposition card>` for sequential execution.

## Verification command

Use the validation command in `docs/plans/test-spec-adr17-002-dashboard-disposition.md`. It must pass and the canonical/product/package/script guard output must be empty for this lane (or explicitly reconciled against a pre-existing dirty baseline). Guard: `git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock docs/plans/dashboard.html docs/plans/README.md`.
