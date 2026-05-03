# ADR 019 — V0.5 clean-canvas claim-ledger kernel

Date: 2026-05-03
Status: accepted
Decision maker: operator direction during V0.5 planning and context-poison review.
Related:
- `018-architecture-rebase-clinical-truth-substrate.md`
- `../architecture/source-authority.md`
- `../planning/v0.5/README.md`
- `../../CONTEXT.md`
- `../../../.scratch/pi-chart-v0-5/PRD.md`
- `../../../.scratch/pi-chart-v0-5-claim-ledger-kernel/README.md`

## Context

ADR 018 chose a hybrid immediate path because the repo already contained useful clinical-memory proof and because a broad rewrite was risky before source authority was clear. Since then, V0.5 planning has clarified that the current pi-chart codebase is prototype and iterative design experimentation, not production code. The main risk for implementation agents is context poison: treating old prototype modules, fixtures, generated UI, or package-internal statuses as current architecture.

## Decision

V0.5 Phase 1 will build a clean-canvas claim-ledger kernel under `pi-chart/src/claim-ledger/`. Prior code, patient charts, non-technical clinical documents, memos, and archived research packages remain valuable evidence, but they are not implementation authority unless a current `.scratch` issue, accepted ADR, or canonical doc explicitly promotes a specific claim.

This narrows ADR 018 without discarding it: the hybrid path remains the preservation posture for old prototype behavior and fixtures, while the V0.5 kernel proceeds as a clean substrate proof.

## Consequences

- Do not retrofit `src/types.ts`, `schemas/event.schema.json`, or current `EventEnvelope` modules before the V0.5 kernel proves itself.
- Do not migrate current `patients/` data in Phase 1.
- Do preserve **clinical truth guardrails** from `CONTEXT.md` and prior ADRs: append-only truth, provenance, patient isolation, explicit time semantics, and disposable derived views. A guardrail must be source-cited, domain-level, and re-justified for V0.5.
- Mining prior work is allowed only as evidence gathering. Salvaged concepts must be promoted into `.scratch` PRDs/issues, accepted ADRs, or canonical docs before coding.
- Patient charts and non-technical clinical documents are especially likely to inform later fixtures, clinical vocabulary, and acceptance scenarios, but they should not drive the kernel’s first implementation slices.
- Archived research packages must be cited as `pkg-NNN:<path>` and mined selectively, not copied wholesale.

Prototype implementation details such as `EventEnvelope` shape, filesystem layout, patient directory structure, generated cockpit UI assumptions, or current test-helper patterns are not clinical truth guardrails.
