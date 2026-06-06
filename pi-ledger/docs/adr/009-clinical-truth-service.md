# ADR 009 — Clinical-truth service around ledger-core

Date: 2026-05-31
Status: accepted
Decision maker: human grill-with-docs session under maintainer direction.
Related:
- `008-kernel-public-interface-inventory-before-adapters.md`
- `../ledger-core-public-interface.md`
- `../../../pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md`
- `../../../pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`
- `../../../.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `../../../.scratch/pi-rn-reentry-audit-28052026/GRILL-WITH-DOCS-HUMAN-DECISIONS.md`

## Context

`ledger-core` is intentionally reusable and independent from `pi-chart`, but the safe public interface is stateful: admission and point-read paths need trusted same-patient ledger history. A per-call CLI, browser-facing binding, or TypeScript reimplementation would either re-ship patient history on every operation, create a second protocol, or duplicate canonicalization authority.

The clinical workspace also needs many clinicians, workflows, and agents to enter Pi-RN from different surfaces while sharing one patient truth stream.

## Decision

Grow `pi-ledger` from a library-only kernel into a private internal clinical-truth service around `ledger-core`.

The service will:

- own durable per-patient append-only ledger storage;
- expose only the ADR-008 safe consumer paths over a versioned contract;
- keep canonicalization and hashing in Rust as the single cryptographic source of truth;
- provide one authoritative service-side append order per patient ledger;
- accept concurrent submissions from the app/backend, not directly from browsers, EHR plugins, or external workflow tools;
- use private/local gRPC over Unix-domain socket as the first transport, behind a swappable contract;
- use a per-patient append-only WAL/log as the first durable storage posture.

Embedded stores such as `redb`, `sled`, or SQLite remain later implementation options if indexing, compaction, or operational needs justify them behind the same service contract. Cap'n Proto or custom framing remain later transport options only if profiling proves gRPC/UDS inadequate.

## Rejected

- Per-agent or per-entry-point truth copies. They would let clinical surfaces diverge.
- Spawn-per-call CLI as the source-of-truth mechanism. It is stateless, slow, and forces a second protocol.
- Browser/EHR/workflow clients directly calling the ledger service. The service is private/internal, not a public clinical API.
- Reimplementing canonicalization or ledger admission in TypeScript. That recreates the duplicate cryptographic authority ADR 020 rejected.
- Choosing an embedded database before the append-only WAL/log shape has proven insufficient.

## Consequences

- `pi-ledger` may add a service crate/runtime, but it must not import `pi-chart`, brownfield chart schemas, generated UI artifacts, patient directories, or hidden `pi-sim` internals.
- `pi-chart` and future consumers integrate as clients of the versioned service contract, not by depending on private Rust internals.
- Golden vectors and ledger-core public-interface tests should become transport-agnostic conformance evidence for the service contract.
- Implementation remains future work; this ADR selects the service boundary and first transport and storage posture.
