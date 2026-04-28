# Context snapshot — quarantine banner edits architecture rebase

## Task statement
Consensus-review `.omx/plans/plan-quarantine-banner-edits-architecture-rebase.md` via `$ralplan`; do not apply banners in this lane. Determine whether the plan is execution-ready and identify parallel work that should happen next while/after the banner lane executes.

## Desired outcome
A durable, critic-approved execution handoff for a docs-only quarantine banner pass that reduces stale/prototype context poison without changing product code, schemas, fixtures, scripts, generated artifacts, or canonical architecture authority.

## Known facts/evidence
- ADR 018 accepted the clinical truth/provenance substrate direction over prototype cockpit architecture.
- `docs/architecture/source-authority.md` defines source-authority hierarchy and quarantine banner policy.
- `docs/plans/kanban-prd-board.md` has ARCH-001 complete for docs/source-authority lane and forbids product-root edits until later approved ADR/PRD.
- The proposed plan lists 8 first-slice banner files plus deferred candidates.
- The proposed lane is plan-only now; banners are not yet applied.

## Constraints
- Do not implement or apply banners during ralplan.
- Future banner execution should be docs-only and allowlisted.
- Do not edit `src/**`, `schemas/**`, `patients/**`, `scripts/**`, generated binary/prototype outputs, or product behavior.
- Do not bulk-banner or demote canonical docs.
- Preserve artifacts in place; no deletes or moves.

## Unknowns/open questions
- Whether all 8 first-slice files should be included or split smaller.
- Whether the plan needs a new PRD/test-spec artifact before `$ralph` execution.
- Whether parallel work should proceed now or wait until banner lane completes.

## Likely codebase touchpoints
- `.omx/plans/plan-quarantine-banner-edits-architecture-rebase.md`
- `decisions/018-architecture-rebase-clinical-truth-substrate.md`
- `docs/architecture/source-authority.md`
- `docs/plans/kanban-prd-board.md`
- first-slice memo/design/draft docs named in the plan
