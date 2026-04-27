# Context snapshot — ADR 019 Corpus Readiness Gate docs/test-contract slice

Task statement: Use `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md` and execute only the first docs/test-contract slice for the ADR 019 Corpus Readiness Gate.

Desired outcome: Create durable `docs/plans/` PRD and paired test spec that define the ADR 019 Corpus Readiness Gate as a prerequisite, not ADR 019, with structural validation. Run the structural test spec and `npm run check`.

Known facts / evidence:
- Source plan: `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Prior context snapshot: `.omx/context/clinical-fidelity-synthetic-chart-corpus-gate-adr-019-20260427T144845Z.md`.
- ADR 018 requires spike evidence and ADR 019 before any clean-slate rewrite commitment.
- `docs/architecture/source-authority.md` marks future `decisions/019-*` as pending and forbids starting clean-slate rewrite before spike evidence plus ADR 019.
- ADR 016 and `clinical-reference/broad-ehr-skeleton.md` require six observable surfaces, provenance/timing, memory-proof projection, one-entry/many-projection reuse, and no hidden simulator physiology.
- ADR 001 treats Synthea as deterministic baseline/seeding evidence, not sufficient ICU clinical truth without hand-crafted acute portions and operator validation.
- Current repo baseline inside `pi-chart/` before this slice has only existing untracked `.omx/context/**` and `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`; parent workspace has unrelated dirty files outside this slice.

Constraints:
- Do not create ADR 019.
- Do not edit `src/**`, `schemas/**`, `patients/**`, `scripts/**`, validators, importers, generated artifacts, package files, or fixture data.
- Optional board indexing is allowed only because the plan explicitly allows a `docs/plans/kanban-prd-board.md` row when board maintenance is in scope.
- Keep the first slice documentation/test-contract only; future validator/importer/corpus fixture work must remain backlog/contract text.
- No hidden `pi-sim` source inspection or dependency.

Unknowns / open questions:
- Exact future corpus patient scenarios remain open for later operator/corpus work.
- Exact future executable validator metadata format remains deferred; this slice names candidate checks only.

Likely codebase touchpoints:
- `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- Optional: `docs/plans/kanban-prd-board.md`
