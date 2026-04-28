# Ralph Context Snapshot — Architecture Rebase Clinical Truth Substrate

## Task statement

Execute only the docs/source-authority lane from `.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md`.

## Desired outcome

Create durable architecture-source artifacts without product-code changes:

- ADR 018 draft/promotion.
- `docs/architecture/source-authority.md`.
- promoted PRD/test-spec under `docs/plans/`.
- optional narrow kanban board row.

## Known facts/evidence

- Plan artifacts exist under `.omx/plans/`.
- Initial architecture review recommended hybrid migration now and clean-slate service/event-store spike before rewrite.
- Current repo validation before this lane: `npm test` passed 386 tests; patient_001 and patient_002 validation passed 0 errors / 0 warnings.
- Core architecture docs identify chart truth as canonical and view primitives as the intended read contract.

## Constraints

- Do not edit `src/**`, `schemas/**`, `patients/**`, `scripts/**`, or generated binary/prototype assets.
- First lane is docs/source-authority only.
- UI prototypes are directional evidence only.
- Filesystem is current fixture/export/backend, not permanent production storage commitment.
- Hidden simulator state and direct pi-agent/pi-sim coupling remain forbidden.

## Unknowns/open questions

- ADR 019 direction remains open until clean-slate spike evidence exists.
- Which stale documents get banners first should be decided by source-authority map and future narrow slice, not bulk edits now.

## Likely codebase touchpoints

- `decisions/018-architecture-rebase-clinical-truth-substrate.md`
- `docs/architecture/source-authority.md`
- `docs/plans/prd-architecture-rebase-clinical-truth-substrate.md`
- `docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md`
- `docs/plans/kanban-prd-board.md` optional row only
