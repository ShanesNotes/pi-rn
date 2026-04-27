# Context snapshot — V03 foundation reconciliation

## Task statement
Deepen V03-001 planning only, using `docs/plans/kanban-prd-board.md` as backlog entrypoint and the paired V03 PRD/test-spec as owned artifacts. Do not implement product changes.

## Desired outcome
Executable, context-efficient V03-001 implementation-planning cards with refined acceptance criteria, 3-6 thin tracer bullets, owned files, first failing/characterization test or validation, verification command, deferrals, stale-doc/contradiction findings, and a HITL checkpoint before implementation.

## Known facts / evidence
- Board row `V03-001` currently says thin decision/backlog PRD; next action is bucket v0.3 memo content into accepted/current, stale/superseded, deferred, needs-ADR, or rejected.
- Current repo is `schema_version: 0.3.0-partial` in `pi-chart.yaml` and patient charts.
- ADRs 009/010/011 are accepted and implemented under ADR 015; current repo has `links.resolves`, `links.contradicts`, typed `EvidenceRef`, optional `transform`, migration `scripts/migrate-v02-to-v03.ts`, and associated tests.
- ADR 016 broad EHR skeleton is accepted; it is current roadmap driver but not full EHR product scope.
- ADR 017 is proposed/non-canonical. Actor/attestation/review taxonomy cannot become implementation scope without HITL/ADR approval.
- v0.3 memo contains stale/full-v0.3 claims: `profiles/`, `profile` event field, `logical_id`, `fingerprint`, `prev_hash`, `invalidated_at`, `src/hash.ts`, `src/identity.ts`, `src/views/bundle.ts`, `schemas/profile.schema.json`, incident/suppression/attestation/profile implementation, and full `0.3.0` bump are not present in current repo.
- There is no `profiles/` directory, `src/hash.ts`, `src/identity.ts`, `src/views/bundle.ts`, or `schemas/profile.schema.json`.
- Product-root baseline at snapshot start is clean by `git status --short`.

## Constraints
- pi-chart remains bounded chart/EHR subsystem.
- No pi-agent to pi-sim coupling.
- ADR17 is non-canonical unless explicitly approved.
- No new dependencies.
- Brownfield repo reality outranks stale roadmap/memo text.
- Planning/docs artifact updates allowed; product implementation changes prohibited before HITL.

## Unknowns / open questions
- Operator has not approved any promotion from v0.3 memo deferred/proposed content into ADR/implementation.
- Whether ADR 012/013 should be drafted next remains HITL-dependent.
- Whether profile registry should be revived as ADR 008 or split remains HITL-dependent.

## Likely touchpoints for this planning pass
- `docs/plans/prd-v03-foundation-reconciliation.md`
- `docs/plans/test-spec-v03-foundation-reconciliation.md`
- `docs/plans/kanban-prd-board.md` only if board row/status needs update.
