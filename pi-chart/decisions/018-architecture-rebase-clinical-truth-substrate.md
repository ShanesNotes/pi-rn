# ADR 018 — Architecture rebase: clinical truth substrate over prototype cockpit

Date: 2026-04-27
Status: accepted
Decision maker: operator direction after fresh-eyes architecture review and `$plan` rebase plan.
Related:
- `../README.md`
- `../DESIGN.md`
- `../ARCHITECTURE.md`
- `../ROADMAP.md`
- `../docs/architecture/source-authority.md`
- `../docs/plans/prd-architecture-rebase-clinical-truth-substrate.md`
- `../docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md`
- `../docs/design/pi-agent-connector-contract.md`
- `../docs/design/pi-sim-vitals-write-contract.md`
- `016-broad-ehr-skeleton-clinical-memory.md`

## Context

The repo has proved a useful foundation: append-only patient-scoped clinical facts, explicit provenance, evidence links, chart-clock reads, validation, and view primitives. The root primer states the core thesis directly: the chart is canonical, current state is a query, and derived summaries are disposable. `DESIGN.md` and `ARCHITECTURE.md` implement that thesis through one stream of clinical envelopes plus notes, vitals, artifacts, validation, and read projections.

The same repo has also accumulated product exploration artifacts: generated static cockpit HTML, design screenshots, draft connector contracts, extensive `.omx` plans, memos, wiki pages, and prototype-specific patient_002 UI assumptions. These artifacts are valuable as evidence, but they are not all equal architectural authority. Future coding agents can be misled if stale proposal or prototype language is read as current implementation direction.

The operator is interested in a cleaner production-grade architecture, including a possible clean-slate service/event-store core. That preference is credible but not yet validated by implementation evidence. A direct rewrite now would convert a promising direction into a risky commitment before the human has validated enough product shape and before the current repo's source authority is safe for agent execution.

## Decision

Adopt an architecture rebase direction:

1. **Core identity:** `pi-chart` is a clinical truth and provenance substrate, not primarily a cockpit UI.
2. **Immediate path:** pursue a **hybrid migration**. Preserve current behavior and fixtures while introducing clearer boundaries through later, separately approved work.
3. **Long-term candidate:** keep the clean-slate service/event-store architecture as a serious candidate, but require a bounded spike and follow-up ADR before any rewrite commitment.
4. **Filesystem status:** the current filesystem/NDJSON/Markdown layout remains the current backend, fixture format, and export/archive format. It is not sacred production storage.
5. **UI status:** UI prototypes and generated cockpit artifacts are directional product evidence only. They do not define the core architecture.
6. **Boundary status:** pi-chart must not read hidden `pi-sim` internals or hidden simulator state, and pi-agent must receive only bounded chart-visible context through explicit interfaces.
7. **Context hygiene:** source authority must be made explicit before broad coding-agent execution. Stale/prototype docs should be quarantined or bannered before they are deleted or moved.

## Drivers

1. **Protect the strong kernel.** The append-only clinical claim/event model, provenance, patient isolation, and view primitives are foundation-worthy.
2. **Prevent prototype capture.** Generated UI and patient_002-specific cockpit assumptions must not become product architecture by repetition.
3. **Avoid premature rewrite.** Clean-slate service/event-store design may be better, but it must first reproduce current projections and evidence semantics.
4. **Reduce context poison.** Coding agents need a durable authority map that distinguishes accepted architecture from historical proposal and prototype evidence.
5. **Preserve hidden-state boundaries.** The harness value depends on pi-agent and pi-chart seeing only observable clinical artifacts, not hidden simulation source or oracle state.

## Alternatives considered

### A. Conservative filesystem evolution

Keep the filesystem-native architecture and only harden documentation and validation.

- Pros: lowest implementation risk; preserves all tests and fixtures.
- Cons: filesystem and prototype constraints may quietly become permanent production constraints.
- Disposition: viable fallback, but not ambitious enough for the production-grade direction.

### B. Clean-slate service/event-store core

Rebuild around an event-store/service architecture with filesystem import/export, indexed projections, explicit APIs, and separate UI/adapters.

- Pros: cleanest production target; better concurrency, transaction, API, and deployment story.
- Cons: high rewrite risk; could overbuild before the human validates the product thesis.
- Disposition: favored long-term candidate, but requires a spike and ADR 019 before commitment.

### C. Hybrid migration

Freeze the current format as working backend/fixture/export, clarify authority, then introduce storage/API seams and spike the clean-slate option.

- Pros: preserves working system and test evidence while creating a path to production architecture.
- Cons: requires discipline to avoid both stagnation and premature rewrite.
- Disposition: chosen immediate path.

### D. UI-led architecture

Continue building cockpit UI until the product shape feels concrete, then infer architecture.

- Pros: strong human feedback loop and useful product intuition.
- Cons: high risk of coupling core architecture to generated static prototype, patient_002, and early visual metaphors.
- Disposition: rejected as foundation. UI remains evidence, not authority.

## Why chosen

Hybrid migration is the safest way to preserve existing clinical-memory proof while opening the path to a cleaner production core. It honors the operator's leaning toward clean-slate Option B without making an irreversible rewrite commitment. It also recognizes that context hygiene is now part of the architecture: stale docs and prototypes must be classified before agents execute broad work.

## Consequences

- ADR 018 and `docs/architecture/source-authority.md` become the first stop for architecture direction after the root docs.
- Future implementation lanes must say whether they are docs/source-authority, spike, storage/API, adapter, fixture, or UI work.
- Prototype UI artifacts remain useful but non-authoritative.
- Broad deletion/movement of stale docs is deferred until after quarantine/source-authority mapping.
- The clean-slate service/event-store path requires a bounded spike that reproduces current projection behavior before a rewrite ADR.
- Filesystem-backed operation remains valid until replaced by an approved storage/API lane.

## Follow-ups

1. Maintain `docs/architecture/source-authority.md` as the durable map of canonical vs proposal/prototype/runtime surfaces.
2. Use `docs/plans/prd-architecture-rebase-clinical-truth-substrate.md` and its test spec for first-lane execution.
3. Add quarantine banners to selected prototype/historical docs in a narrow follow-up slice.
4. Plan and run a clean-slate service/event-store spike against patient_002 projections.
5. Decide ADR 019 after spike evidence: hybrid storage-port migration, clean-slate rewrite, or defer rewrite.
6. Keep pi-sim/pi-agent boundaries explicit in every adapter or context-bundle successor lane.

## Non-goals

- This ADR does not authorize rewriting `src/`, schemas, fixtures, scripts, or UI.
- This ADR does not choose a production database or service framework.
- This ADR does not delete historical memos, design files, screenshots, or `.omx` artifacts.
- This ADR does not promote any generated Agent Canvas prototype into product architecture.
