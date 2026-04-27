# Context snapshot — BND-001 adapter boundary planning

## Task statement
Deepen `docs/plans/prd-adapter-boundary-future-work.md` and paired test spec into executable, context-efficient planning cards for BND-001 only. Update planning/docs artifacts only. Do not implement adapter code, API contracts, runtime interfaces, or cross-project integration.

## Desired outcome
Future agents can read the kanban row plus BND PRD/test spec and know what pi-chart may expose, what it must not know, what tests/docs prove the boundary, and what remains deferred until explicit HITL approval.

## Known facts/evidence
- Parent `AGENTS.md` defines subprojects: `pi-agent` agent workspace, `pi-chart` chart/EHR subsystem, `pi-sim` hidden patient simulation subsystem; do not couple `pi-agent` directly to `pi-sim` source.
- `docs/plans/kanban-prd-board.md` is the canonical tracked planning index; BND-001 is deferred boundary PRD, not adapter build plan.
- Current BND PRD names FHIR as read/export boundary only, chart canonicality, openEHR semantics only at Git commit boundary, and Workstream A deferrals.
- Current repo exposes chart/library surfaces under `src/index.ts`, views under `src/views/*`, validation under `src/validate.ts`, schemas under `schemas/*`, and fixtures under `patients/*`.
- Source memos support a future FHIR document Bundle direction and openEHR Git-transaction/audit semantics, but adapter API shapes/module plans are proposal-only.

## Constraints
- Planning/docs updates only.
- No direct pi-agent to pi-sim coupling.
- No hidden pi-sim source dependency.
- No new dependencies.
- No speculative adapter build.
- Prefer tests/executable validation before implementation.
- Keep current repo behavior authoritative over future architecture.

## Unknowns/open questions
- Concrete future consumer is not selected.
- Export/import/bidirectional boundary mode is not selected; export-only remains default.
- FHIR representation and fingerprint scope need HITL decision before implementation.
- Whether any research-only spike should precede adapter PRD remains deferred to HITL.

## Likely touchpoints for this planning lane
- `docs/plans/kanban-prd-board.md`
- `docs/plans/prd-adapter-boundary-future-work.md`
- `docs/plans/test-spec-adapter-boundary-future-work.md`
- Source inputs: `ROADMAP.md`, `ARCHITECTURE.md`, `README.md`, named memos, `.omx/plans/workstream-a-memory-proof-acceptance-report.md`
