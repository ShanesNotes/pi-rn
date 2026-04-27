# Context snapshot — approved V03 foundation reconciliation edit

## Task statement
Apply the user-approved V03-001 planning pass to docs only. The approved plan deepens V03-001 to match PHA-001 and ADR17-001 chunking discipline.

## Desired outcome
Update `docs/plans/prd-v03-foundation-reconciliation.md`, `docs/plans/test-spec-v03-foundation-reconciliation.md`, and the V03-001 row in `docs/plans/kanban-prd-board.md` with: RALPLAN-DR summary, six load-bearing claims V03-C1..C6 with memo line citations, 29-row closed-enum ledger, seven tracer bullets V03-TB-0..6, successor scaffolds S1..S6, HITL packet, hard-gate DAG, validators, risk register, ADR section, and recommended `$ralph` follow-up.

## Known facts/evidence
- Memo line citations verified on disk: 188 profile, 278 identity/hash, 324 invalidated_at, 630 contextBundle, 695 attestation, 801 migration.
- Brownfield absence verified: no `profiles/`, no `src/hash.ts`, no `src/identity.ts`, no `src/views/bundle.ts`, no `schemas/profile.schema.json`.
- Repo currently has unrelated dirty changes in PHA/ADR17/BND/prototype/product files. V03 validation must compare product-root diffs against preflight baseline.
- Current accepted substrate is `schema_version: 0.3.0-partial`; ADR 009/010/011 are implemented under ADR 015; ADR17 remains proposed/non-canonical.

## Constraints
- Docs-only V03 lane.
- No product-root edits.
- Do not duplicate ADR17-001; route overlap through successor S2.
- Avoid BND-001 collision; keep context-bundle S5 internal read-side.
- No new dependencies.
- No pi-agent to pi-sim coupling.

## Unknowns/open questions
- Operator still must choose one successor path S1..S6 before any V03 successor implementation.
- PHA and ADR17 are beginning implementation concurrently; V03 must avoid shared implementation surfaces.

## Likely touchpoints
- `docs/plans/prd-v03-foundation-reconciliation.md`
- `docs/plans/test-spec-v03-foundation-reconciliation.md`
- `docs/plans/kanban-prd-board.md` V03-001 row only
