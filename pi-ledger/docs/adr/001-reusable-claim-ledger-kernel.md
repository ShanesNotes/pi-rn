# ADR 001 — Reusable cryptographic claim-ledger kernel

Date: 2026-05-03
Status: accepted
Decision maker: operator direction after clean-slate architecture review.
Related:
- `../../CONTEXT.md`
- `../../../CONTEXT-MAP.md`
- `../../../pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md`
- `../../../pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md`
- `../../../.scratch/pi-chart-v0-5-claim-ledger-kernel/`

## Context

V0.5 planning originally placed the clean-canvas claim-ledger kernel under `pi-chart/src/claim-ledger/` as a way to avoid the brownfield `EventEnvelope` implementation. Further review clarified a stronger architectural intent: the kernel is a reusable cryptographic ledger substrate, not merely an internal chart refactor.

If the project were starting from scratch, the ledger would be designed independently from chart UI, patient fixtures, and prototype chart code. `pi-chart` would consume it as an adapter/client rather than own the cryptographic kernel.

## Decision

Create `pi-ledger` as a sibling subproject that owns the reusable cryptographic claim-ledger kernel.

The kernel owns:

- deterministic canonicalization;
- SHA-256 content hashes and golden vectors;
- stable claim id plus content hash identity;
- append-only ledger entries and head validation;
- store-assigned accepted time, sequence, and batch identity;
- minimal Claim validation;
- minimal predicate registry hooks;
- valid-time / known-time point reads;
- deterministic synthetic fixtures and boundary checks.

`pi-chart` becomes a consumer/adapter for ledger-backed chart truth. Brownfield `pi-chart` code, schemas, patient directories, generated UI, and previous `EventEnvelope` assumptions remain evidence only unless a later adapter issue explicitly adopts them.

## Consequences

- New kernel implementation work should target `pi-ledger`, not `pi-chart/src/claim-ledger/`.
- Existing K0 work under `pi-chart/src/claim-ledger/`, if already started, should be treated as disposable golden-vector/prototype evidence unless deliberately moved through a new issue.
- `pi-chart` integration becomes a later adapter workstream after the kernel proves its interface.
- The implementation language and package tooling should be decided in the first `pi-ledger` scaffold issue. Rust is the preferred clean-slate direction for the cryptographic kernel, but golden-vector tests are the portability contract.
- Current `pi-chart` V0.5 K0-K6 planning remains useful, but paths, closeout commands, and readiness labels must be re-triaged for `pi-ledger` ownership.

## Rejected

- Keeping the cryptographic ledger as a `pi-chart` internal module only. This is rejected because it keeps the kernel too close to chart prototype gravity and makes future reuse by access/runtime/orchestrator surfaces harder.
- Creating a separate external repository immediately. This is rejected for now because a monorepo sibling subproject gives a clean seam without extra repository/versioning overhead.

## Non-goals

- This ADR does not implement the kernel.
- This ADR does not choose a production database, service framework, FHIR/openEHR model, CAS, blockchain, signatures, key management, or external anchoring.
- This ADR does not authorize direct agent-accepted clinical writes.
- This ADR does not migrate existing `pi-chart/patients/` data.
