# PRD: pi-ledger reusable cryptographic claim-ledger kernel

Status: needs-triage
Program status: active `pi-ledger` implementation workstream.

## Problem Statement

The project needs a clean, reusable cryptographic claim-ledger kernel that is independent from `pi-chart` prototype gravity. The prior V0.5 plan correctly identified the claim-ledger semantics, but its initial implementation home under `pi-chart/src/claim-ledger/` would keep the kernel too close to chart UI, brownfield `EventEnvelope`, patient fixture, and chart-specific workflow assumptions.

The maintainer has decided that the ledger should be a sibling subproject, `pi-ledger`, with `pi-chart` consuming it later through an adapter. The workstream now needs a precise Rust-first scaffold, issue retargeting, and package/document authority that lets AFK agents implement K0-K6 without accidentally touching `pi-chart` source, schemas, patients, package archives, lockfiles outside `pi-ledger`, or hidden simulator internals.

## Solution

Build `pi-ledger` as a Rust-first reusable kernel with a single initial crate, `ledger-core`. Phase 1 remains the same narrow K0-K6 proof:

- canonicalization and SHA-256 record hash;
- minimal Claim validation;
- append-only ledger entries and head validation;
- minimal predicate registry hook;
- valid-time / known-time point reads;
- deterministic synthetic fixtures and boundary checks.

`pi-chart` integration is deferred to a later adapter workstream after the kernel Interface is proven. Existing `pi-chart/src/claim-ledger/` work, if present, is evidence only.

## User Stories

1. As a maintainer, I want the cryptographic ledger in `pi-ledger`, so that the kernel is not shaped by `pi-chart` prototype assumptions.
2. As a future chart adapter author, I want a small ledger Interface, so that `pi-chart` can consume ledger truth without owning cryptographic behavior.
3. As a future runtime author, I want stable id/hash references, so that ContextPacket, access-plane, and orchestrator work can cite claims consistently.
4. As a clinician-safety reviewer, I want append-only clinical truth, so that corrections never erase prior accepted claims.
5. As a kernel implementer, I want Rust package commands pinned, so that AFK development has a clear build/test loop.
6. As a future port/binding author, I want golden-vector behavior, so that any TypeScript/WASM/CLI adapter must match canonicalization and hash output exactly.
7. As a simulation-boundary reviewer, I want no hidden `pi-sim` dependency, so that the ledger never gains oracle knowledge.
8. As a patient-safety reviewer, I want explicit patient identity and bitemporal reads, so that cross-patient mixing and future-knowledge leakage are prevented.

## Implementation Decisions

- `pi-ledger` is a Rust workspace with one initial crate: `ledger-core`.
- `ledger-core` owns kernel behavior; `pi-chart` is a future adapter/consumer.
- K0+K2 implementation home is `pi-ledger/crates/ledger-core/src/canonical.rs` with Rust tests.
- Later module names are planned but not pinned until their upstream issues are triaged.
- The canonicalization identifier remains `jcs-rfc8785-pi-chart-v1` for continuity with prior accepted planning, even though ownership moved to `pi-ledger`; renaming requires a later explicit issue/ADR because it would change hash vectors.
- Record hashes are SHA-256 encoded as `sha256:<64 lowercase hex characters>`.
- K0 may introduce only narrowly justified Rust dependencies needed for canonical JSON and SHA-256 hashing, expected to be `serde`, `serde_json`, and `sha2`; any additional dependency requires issue triage.
- Phase 1 does not implement FHIR/openEHR/CAS/blockchain/signatures/key management/external anchoring.
- Phase 1 does not migrate current `pi-chart/patients/` data or implement `pi-chart` adapters.

## Testing Decisions

- Use Rust tests through `cargo test --workspace`.
- Keep tests behavior-first and public-interface oriented.
- K0+K2 should produce deterministic golden vectors for canonical JSON and hash output.
- Run `cargo fmt --all -- --check`, `cargo test --workspace`, and `cargo clippy --workspace --all-targets -- -D warnings` for closeout.
- Do not use current `pi-chart` patient fixtures, schemas, or `EventEnvelope` tests as implementation authority.

## Out of Scope

- `pi-chart` adapter integration.
- Current patient migration.
- Brownfield event-envelope compatibility mappers.
- Relation claims, `inputs[]`, full predicate tiers, range queries, ContextPacket, access plane, runtime, orchestrator, direct agent writes, and production backend selection.
- Separate external repository extraction.

## Further Notes

The superseded `.scratch/pi-chart-v0-5-claim-ledger-kernel/` surface remains lineage evidence. New AFK implementation should use this `pi-ledger` workstream. Issues 02-06 stay `needs-triage`; issue 01 can be AFK-ready after the scaffold and command/path retargeting are verified.
