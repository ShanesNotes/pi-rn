# Context snapshot — clinical-fidelity synthetic chart corpus gate for ADR 019

Task statement: plan a clinical-fidelity synthetic chart corpus gate that can inform or block ADR 019.

Desired outcome: a consensus-approved plan, saved under `.omx/plans/`, that defines a non-implementation gate for deciding whether the synthetic chart corpus is clinically faithful enough to support ADR 019's architecture decision. No execution starts from ralplan.

Known facts / evidence:
- ADR 018 says ADR 019 should decide after spike evidence whether to continue hybrid storage-port migration, commit to clean-slate service/event-store, or defer rewrite (`decisions/018-architecture-rebase-clinical-truth-substrate.md:56-63`, `:93-100`).
- Source authority map marks future `decisions/019-*` as pending and says clean-slate rewrite must not start before spike + ADR 019 (`docs/architecture/source-authority.md:35-42`, `:80-92`, `:123-125`).
- ADR 016 accepts broad shallow EHR skeleton as clinical-memory proof surface and requires six observable surfaces, coherent fixture story, provenance/timing, memory proof projection, one-entry/many-projection documentation relief, and no hidden simulator physiology (`decisions/016-broad-ehr-skeleton-clinical-memory.md:30-67`, `:105-115`).
- `clinical-reference/broad-ehr-skeleton.md` defines the six-surface contract and pass condition for memory-proof projection (`clinical-reference/broad-ehr-skeleton.md:26-56`) and states current `patient_001` is only a narrow respiratory seed, not full broad skeleton (`:89-109`).
- ROADMAP Track B targets ≥5 hand-crafted + Synthea-seeded patients with varied admits, multi-day encounters, follow-up notes, and order/assessment/intent chains stressing `evidenceChain` and `openLoops` (`ROADMAP.md:51-65`).
- ADR 001 chose Synthea over MIMIC because Synthea is open/deterministic but lower-realism; ICU portions are expected to be hand-crafted and locally clinically validated (`decisions/001-mimic-to-synthea.md:15-27`, `:47-64`).
- Current implementation has patient-scoped validation through `validateChart()` (`src/validate.ts:919-1027`) and CLI `npm run check` = rebuild + validate all patients (`package.json`, `scripts/validate.ts:1-61`).
- Baseline check on 2026-04-27: `npm run check` passed with 0 errors / 0 warnings across 2 patients.

Constraints:
- Plan only. Do not implement in ralplan.
- Preserve hidden-state boundaries: pi-chart must not read hidden pi-sim internals; all corpus evidence must be observable chart-visible artifacts.
- No new dependencies without explicit request.
- Prefer ADR/PRD/test-spec/documented gate before code.
- Existing filesystem/NDJSON/Markdown backend remains current backend/export/fixture format until ADR 019 decides otherwise.

Unknowns / open questions:
- Whether ADR 019 is meant to decide only storage architecture or also corpus quality threshold; this plan treats corpus gate as an ADR 019 prerequisite, not the ADR itself.
- Exact clinical scenarios beyond respiratory decompensation.
- Whether operator review must be formal HITL signoff or can be represented by a checklist artifact.
- Whether Synthea importer exists yet; current repo has no `src/importers/synthea/` implementation.

Likely codebase touchpoints for later execution:
- `decisions/019-*` or pre-ADR gate doc.
- `docs/plans/prd-*` and `docs/plans/test-spec-*`.
- `clinical-reference/broad-ehr-skeleton.md` and phase-a references.
- `patients/` fixtures and `_derived/memory-proof.md` outputs.
- `src/validate.ts`, `scripts/validate.ts`, `src/views/*`, `src/derived.ts` if execution adds machine gates.
