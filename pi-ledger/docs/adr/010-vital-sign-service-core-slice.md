# ADR 010 — Vital-sign clinical-truth service-core slice

Date: 2026-05-31
Status: accepted
Decision maker: autonomous ultragoal execution under maintainer brief.
Related:
- `009-clinical-truth-service.md`
- `008-kernel-public-interface-inventory-before-adapters.md`
- `../ledger-core-public-interface.md`
- `../../../pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`
- `../../../pi-chart/docs/adr/022-vital-sign-clinical-truth-adapter-slice.md`
- `../../../.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/`

## Context

ADR 009 selected a private clinical-truth service around `ledger-core`, but left the first executable contract slice unimplemented. The next useful proof needed one narrow fact family, Rust-owned conformance vectors, service-core request/response/error semantics, per-patient append ordering, idempotency, point reads, snapshot validation, and a storage seam without committing to production transport/auth.

The selected first fact family is `vital.sign` observation because it is already represented in pi-chart vitals and exercises patient scope, encounter scope, source, value/unit, valid time, recorded time, known time, and correction behavior.

## Decision

Implement a private, transport-agnostic `clinical-truth-service` crate inside `pi-ledger` for the first `clinical_truth.v1alpha1` `vital.sign` slice.

The slice includes:

- an executable versioned predicate registry fixture for `vital.sign` with stable registry version and content hash;
- Rust-generated conformance vectors for Claim canonical bytes, Record hash, append results, revision results, point-read behavior, and negative error expectations;
- service-core request/response/error types around `ledger-core` for service info, registry info, Claim validation, append preview, base append, revision append, get-entry, point-read, snapshot, and snapshot validation;
- deterministic `client_request_id` idempotency for same operation/payload replay and conflict for reused keys with different operation/payload;
- patient-scoped admin context for snapshot/export/validate operations;
- file/WAL prototype storage for accepted entries with explicit `Fsync` versus `TestModeNoFsync`, replay/head validation through trusted rebuild, durable request-id replay metadata, and fail-closed corruption handling.

`ClaimPayload.source_context` is transport-side diagnostic context only in this slice. It is not persisted into the accepted Claim record and is not part of idempotency identity; durable provenance must be represented later as explicit Claim/evidence facts or an explicitly versioned service metadata record.

This is not the production public service runtime. gRPC/UDS transport, production auth/session policy, operational storage selection, compaction/indexing, and multi-fact-family registry governance remain future decisions.

## Rejected

- Implementing the first slice in TypeScript. Rejected because canonicalization, Record hash, append admission, known-time assignment, and idempotent accepted-entry semantics must remain Rust-owned.
- Treating fixture registry policy as the production ontology. Rejected because `vital.sign` is only the first conformance slice.
- Letting snapshot validation import/write entries. Rejected because trusted rebuild is diagnostic/admin behavior, not an append bypass.
- Choosing a production embedded database before the append-only WAL shape is proven insufficient.

## Consequences

- `pi-ledger/crates/clinical-truth-service` is now the executable service-core contract surface for the first slice.
- Conformance vectors under `pi-ledger/conformance/clinical_truth/v1alpha1/` are consumer-facing evidence and should be regenerated from Rust, not edited by hand.
- Future transports should wrap the service-core semantics rather than reimplement them.
- Future storage backends should preserve append-accepted-entry-only writes, durable idempotency replay, trusted replay validation, patient scoping, and fail-closed corruption semantics.
