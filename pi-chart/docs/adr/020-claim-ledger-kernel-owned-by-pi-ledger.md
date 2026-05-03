# ADR 020 — Claim-ledger kernel owned by pi-ledger

Date: 2026-05-03
Status: accepted
Decision maker: operator direction after clean-slate architecture review.
Related:
- `019-v0-5-clean-canvas-claim-ledger-kernel.md`
- `../architecture/source-authority.md`
- `../../../pi-ledger/CONTEXT.md`
- `../../../pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md`

## Context

ADR 019 authorized a clean-canvas claim-ledger kernel under `pi-chart/src/claim-ledger/` to avoid retrofitting brownfield `EventEnvelope` code. After reviewing the clean-slate target, the operator decided the cryptographic ledger should be reusable and independent from `pi-chart`, with `pi-chart` consuming it through an adapter.

## Decision

Supersede ADR 019's implementation-home detail: the V0.5 claim-ledger kernel is owned by the new sibling subproject `pi-ledger/`, not by `pi-chart/src/claim-ledger/`.

ADR 019 remains valid for the clean-canvas posture and for the clinical truth guardrails it preserves. Its path-specific instruction is superseded by this ADR and by `pi-ledger` ADR 001.

## Consequences

- Future kernel implementation issues should target `pi-ledger`, not `pi-chart/src/claim-ledger/`.
- `pi-chart/src/claim-ledger/` work, if present from an in-flight agent, is not canonical implementation authority and should be treated as disposable prototype/golden-vector evidence until reconciled.
- `pi-chart` integration should be planned as an adapter after the `pi-ledger` kernel interface is proven.
- Source-authority docs and `.scratch` issues must be re-triaged before additional AFK implementation.

## Non-goals

- This ADR does not delete in-flight untracked code.
- This ADR does not migrate patient data.
- This ADR does not choose final packaging, Rust/TypeScript binding strategy, or production storage.
