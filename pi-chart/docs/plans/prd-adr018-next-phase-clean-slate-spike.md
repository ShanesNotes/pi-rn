# PRD — ADR 018 Next Phase: Clean-slate Spike Charter

## Status and authority

- Status: planned next ADR 018 phase; planning/contract lane only.
- Source plan: `.omx/plans/plan-adr018-next-phase-clean-slate-spike.md`.
- Source decision: `docs/adr/018-architecture-rebase-clinical-truth-substrate.md`.
- Paired test spec: `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`.
- Scope: define and verify the ADR 019 clean-slate spike charter and golden projection comparison contract.
- Non-goal: no product-source, schema, patient fixture, script, UI, generated-artifact, ADR 018, or source-authority implementation changes in this lane.

## Problem

ADR 018 keeps clean-slate service/event-store architecture as a serious candidate but requires spike evidence before any rewrite. The project now needs an execution-safe next-phase plan that makes the spike falsifiable, protects the current clinical truth substrate, and prevents AI agents from treating Option B preference as rewrite authorization.

## Users / consumers

- Human project lead deciding whether Option B should advance.
- Future Ralph/team agents executing the spike without scope drift.
- Architect/critic/verifier agents deciding ADR 019 from evidence.
- Future pi-agent/pi-sim boundary work needing chart-visible-only constraints.

## Goals

1. Define the ADR 019 clean-slate spike scope and success criteria.
2. Define golden projection outputs that any clean-slate candidate must reproduce.
3. Preserve ADR 018 constraints: hybrid current path, no hidden pi-sim coupling, UI non-authoritative, filesystem current but not sacred.
4. Keep the first lane docs/test-contract only.
5. Provide safe execution guidance for a later isolated spike.

## Non-goals

- No immediate clean-slate rewrite.
- No production `src/**` storage-port refactor.
- No schema changes.
- No patient fixture changes.
- No pi-sim ingest implementation.
- No pi-agent tool/API implementation.
- No UI/cockpit work.
- No database or framework selection.
- No new dependencies; no package-file or lockfile edits.
- No broad file moves/deletions.

## Requirements

1. The plan must state that ADR 019 is required before production rewrite or storage-port implementation.
2. The plan must specify golden comparison surfaces: `currentState`, `trend`, `openLoops`, `evidenceChain`, `contextBundle`, and validation/invariant behavior.
3. The plan must state patient_002 is a rich golden scenario but not product ontology.
4. The plan must forbid hidden pi-sim internals and raw pi-agent hidden context.
5. The plan must distinguish NP1 planning/contract lane from NP2 experimental spike implementation and NP3 ADR 019 decision.
6. The plan must define allowed and forbidden file scopes for NP1.
7. The plan must define isolated file-scope guidance for NP2 without authorizing it in NP1.
8. The test spec must include structural checks and production-root guards.
9. NP2 must require a clean/separate baseline before experimental implementation evidence is trusted.
10. ADR 019 must include an evidence matrix over golden projection surfaces and must not authorize rewrite with unresolved provenance/evidence/patient-isolation mismatches.
11. `contextBundle` baseline capture must use `src/views/index.ts` unless a separate root API export decision is approved before the spike.
12. Guard-only dirty evidence is not acceptable for NP2; NP2 must start from a clean committed/stashed tree or separate clean worktree.

## Owned files for NP1

- `.omx/plans/plan-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/prd-adr018-next-phase-clean-slate-spike.md`
- `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`

Optional later file, only if a separate execution prompt authorizes board indexing:

- `docs/plans/kanban-prd-board.md`

## Forbidden files for NP1

- `src/**`
- `schemas/**`
- `patients/**`
- `scripts/**`
- generated `_derived/**`
- generated prototype output
- `docs/adr/018-*`
- `docs/architecture/source-authority.md`
- QBN-bannered prototype/historical files
- package/dependency files
- dependency installation or lockfile updates
- No new dependencies

## Workstreams

### NP1 — Charter and contract

Create/verify this PRD and paired test spec. No implementation.

### NP2 — Isolated spike implementation

Separate future approval. Build an isolated service/event-store-shaped prototype or report under an approved experimental scope. Compare against patient_002 golden projections.

### NP3 — ADR 019 decision

Separate future approval. Decide clean-slate rewrite, hybrid migration, or defer rewrite based on spike evidence.

## Acceptance criteria

- This PRD and paired test spec exist.
- `.omx/plans/plan-adr018-next-phase-clean-slate-spike.md` exists.
- Required ADR 018/ADR 019 language is present.
- Golden projection surfaces are named.
- NP1 forbidden-file guard passes.
- Existing runtime checks are either run or explicitly deferred as not required for docs-only NP1.

## Risks

- Option B enthusiasm becomes stealth rewrite.
- Spike overfits patient_002.
- Spike evidence is collected from a dirty worktree and becomes untrustworthy; guard-only dirty evidence is not acceptable for NP2.
- Dirty worktree hides unintended edits.
- Storage technology debate distracts from architecture evidence.
- Planning artifacts grow without execution evidence.

## Verification

Use paired test spec: `docs/plans/test-spec-adr018-next-phase-clean-slate-spike.md`.
