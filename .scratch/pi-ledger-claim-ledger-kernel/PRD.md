# PRD: pi-ledger reusable cryptographic claim-ledger kernel

Status: active
Program status: active `pi-ledger` implementation workstream.
Next slice status: needs-triage (`K10` append admission seam)

## Problem Statement

The project needs a clean, reusable cryptographic claim-ledger kernel that is independent from `pi-chart` prototype gravity. The prior V0.5 plan correctly identified the claim-ledger semantics, but its initial implementation home under the chart subsystem would keep the kernel too close to chart UI, brownfield `EventEnvelope`, patient fixture, and chart-specific workflow assumptions.

The maintainer has decided that the ledger should be a sibling subproject, `pi-ledger`, with `pi-chart` consuming it later through an adapter. The workstream needs precise Rust-first package/document authority that lets AFK agents implement and deepen the kernel without accidentally touching `pi-chart` source, schemas, patients, package archives, lockfiles outside `pi-ledger`, or hidden simulator internals.

K0-K9 proved the first kernel behaviors, but the current append path still has an architectural gap: a Claim can be structurally valid, canonicalizable, hashable, and patient-scoped while still bypassing predicate-registry policy if callers use the append ledger directly. Before adapter work depends on append APIs, the kernel needs an explicit append-admission seam that makes predicate-aware entry into a patient ledger the preferred path and makes any bypass impossible to miss.

## Solution

Build `pi-ledger` as a Rust-first reusable kernel with a single initial crate, `ledger-core`. Phase 1 began as the narrow K0-K6 proof:

- canonicalization and SHA-256 record hash;
- minimal Claim validation;
- append-only ledger entries and head validation;
- minimal predicate registry hook;
- valid-time / known-time point reads;
- deterministic synthetic fixtures and boundary checks.

After K0-K6 closeout, the workstream continues with small architecture-deepening slices that keep the proven behavior but improve kernel locality before adapter work:

- K7: shared canonical UTC time values and valid-time expressions across Claim, Ledger, and Query.
- K8: typed Record hash and Entry hash values in a shared kernel hash Module.
- K9: Validated Claim field accessors as the kernel authority for Claim id, predicate, patient, time, and revision-link extraction.
- K10: append admission as the explicit seam that proves a Validated Claim is eligible for a specific patient ledger after patient-scope and predicate-registry checks pass.

The K10 solution is to introduce an append-admissible value and admission error boundary. Claim validation remains responsible for the Ledger-acceptable Claim contract. Predicate registry remains responsible for predicate/object policy. Append ledger remains responsible for patient-local ordering, store-assigned known-time metadata, record hashes, entry hashes, previous-entry links, and head validation. The new admission seam composes those authorities before append, without making the append ledger silently own predicate policy.

`pi-chart` integration is deferred to a later adapter workstream after the kernel Interface is proven. Existing chart-local claim-ledger work, if present, is evidence only.

## User Stories

1. As a maintainer, I want the cryptographic ledger in `pi-ledger`, so that the kernel is not shaped by `pi-chart` prototype assumptions.
2. As a future chart adapter author, I want a small ledger Interface, so that `pi-chart` can consume ledger truth without owning cryptographic behavior.
3. As a future runtime author, I want stable id/hash references, so that ContextPacket, access-plane, and orchestrator work can cite claims consistently.
4. As a clinician-safety reviewer, I want append-only clinical truth, so that corrections never erase prior accepted claims.
5. As a kernel implementer, I want Rust package commands pinned, so that AFK development has a clear build/test loop.
6. As a future port/binding author, I want golden-vector behavior, so that any TypeScript/WASM/CLI adapter must match canonicalization and hash output exactly.
7. As a simulation-boundary reviewer, I want no hidden `pi-sim` dependency, so that the ledger never gains oracle knowledge.
8. As a patient-safety reviewer, I want explicit patient identity and bitemporal reads, so that cross-patient mixing and future-knowledge leakage are prevented.
9. As a future adapter author, I want canonical UTC time to be a kernel input invariant, so that source-system timezone normalization stays outside the cryptographic kernel.
10. As a future correction-link author, I want Record hash to be a typed value, so that claim id plus content hash references cannot silently accept malformed hash strings.
11. As a future storage/rebuild author, I want Entry hash to be a typed value distinct from Record hash, so that append-chain integrity and Claim content identity are not accidentally interchangeable.
12. As a future kernel maintainer, I want Validated Claim accessors to be the field extraction authority, so that Ledger, Predicate, and append-time code do not drift by reinterpreting raw Claim JSON independently.
13. As a future adapter author, I want a Claim to be admitted for append only after predicate policy passes, so that adapters cannot accidentally persist hashable but predicate-invalid clinical records.
14. As a patient-safety reviewer, I want append admission to check target patient scope before store metadata is assigned, so that cross-patient records cannot enter a patient ledger.
15. As a predicate-policy maintainer, I want the Predicate registry to stay outside the Append ledger, so that ontology policy can evolve without turning storage/chain code into a policy container.
16. As an append-ledger maintainer, I want to accept an append-admissible value instead of raw JSON on the preferred path, so that the API makes predicate admission hard to bypass.
17. As a future storage adapter author, I want any lower-level append bypass to be explicitly named as not enforcing predicate admission, so that unsafe seams are obvious in code review.
18. As a future registry-versioning author, I want snapshot re-read validation to remain chain-integrity-only for now, so that old ledgers do not become unreadable because current predicate policy changed.
19. As a correction-policy author, I want K10 to avoid correction target existence and conflict semantics, so that predicate-aware admission does not become an accidental correction graph engine.
20. As a fixture maintainer, I want deterministic fixture generation to use the same admission path as normal append tests, so that examples do not teach bypass patterns.
21. As a query maintainer, I want point reads to keep their trusted-entry boundary, so that K10 does not force unrelated query revalidation work.
22. As an AFK coding agent, I want a narrow K10 issue with exact module ownership and out-of-scope guardrails, so that implementation can be completed without touching adapters, storage backends, or brownfield chart code.
23. As a reviewer, I want admission failures to preserve whether predicate policy failed or patient scope mismatched, so that callers and tests do not match brittle strings or flatten errors into the wrong module.
24. As a kernel maintainer, I want append admission to be a deep module with a small interface, so that patient-scope and predicate-policy composition is testable without changing Claim, Predicate, or Ledger authority.

## Implementation Decisions

- `pi-ledger` is a Rust workspace with one initial crate: `ledger-core`.
- `ledger-core` owns kernel behavior; `pi-chart` is a future adapter/consumer.
- The canonicalization identifier remains `jcs-rfc8785-pi-chart-v1` for continuity with prior accepted planning, even though ownership moved to `pi-ledger`; renaming requires a later explicit issue/ADR because it would change hash vectors.
- Record hashes are SHA-256 encoded as `sha256:<64 lowercase hex characters>`.
- Canonical UTC timestamp handling is a kernel input invariant recorded by ADR 002; adapters normalize source timestamps before kernel entry.
- Record hash and Entry hash are distinct kernel identity values recorded by ADR 003; a dedicated hash Module owns shared `sha256:<64 lowercase hex>` parsing/formatting.
- Validated Claim field extraction is recorded by ADR 004; Claim, Ledger, Predicate, and append-time paths should consume validated accessors instead of raw JSON field reads where validation has already occurred.
- Append admission is recorded by ADR 005; it separates predicate policy from append-chain storage.
- A Ledger-acceptable Claim means structurally valid, canonicalizable, and hashable.
- An Append-admissible Claim means a Validated Claim that is eligible to enter a specific patient-scoped ledger after patient-scope and predicate-registry checks pass.
- The admission Module should own the Append-admissible value and admission error boundary.
- Admission should consume a Validated Claim, a target patient id, and a Predicate registry. It should not consume raw JSON and should not make the Append ledger own the registry.
- Admission success should be represented as a value that the preferred append API consumes, not only as a boolean side check.
- Admission errors should wrap predicate failures and own patient-scope mismatch. They should not flatten all failures into Ledger errors.
- The preferred append API should accept an Append-admissible Claim. Any lower-level bypass seam must be explicitly named as not enforcing predicate admission.
- Fixture and normal append tests should use the admission path so the codebase does not teach predicate bypass.
- Snapshot re-read validation remains a chain-integrity check. Predicate re-audit against a registry is deferred until registry versioning exists.
- K10 admission covers patient scope plus predicate policy only. Correction target existence, correction conflicts, and broader replacement policy are separate future work.
- Phase 1 does not implement FHIR/openEHR/CAS/blockchain/signatures/key management/external anchoring.
- Phase 1 does not migrate current chart patient data or implement chart adapters.

## Testing Decisions

- Use Rust tests through `cargo test --workspace`.
- Keep tests behavior-first and public-interface oriented.
- K0+K2 should produce deterministic golden vectors for canonical JSON and hash output.
- Architecture-deepening issues should start with narrow failing regressions that prove the current seam is stringly, duplicated, bypassable, or inconsistent before refactoring.
- K7/K8/K9 tests should preserve prior K0-K6 behavior while adding module-local tests for value parsing/rejection/accessors and cross-module integration tests for Claim, Ledger, Predicate, and Query consumption.
- K10 tests should prove admission accepts only Validated Claims whose patient scope matches the target ledger and whose predicate/object policy passes the registry.
- K10 tests should prove admission rejects patient mismatch with an admission-owned error and predicate failures with wrapped Predicate errors.
- K10 tests should prove the preferred append path consumes an append-admissible value and preserves K3 metadata, record-hash, entry-hash, previous-link, and head behavior.
- K10 tests should prove ordinary fixture generation and representative append examples use the admission path rather than a raw or merely validated append bypass.
- K10 tests should prove any remaining lower-level append bypass is explicitly named as not enforcing predicate admission.
- K10 tests should prove snapshot re-read validation remains independent from the current Predicate registry.
- K10 tests should preserve K5 point-read behavior and avoid turning query into a full Claim revalidation path.
- Run `cargo fmt --all -- --check`, `cargo test --workspace`, and `cargo clippy --workspace --all-targets -- -D warnings` for closeout.
- Do not use current chart patient fixtures, schemas, or `EventEnvelope` tests as implementation authority.

## Out of Scope

- Chart adapter integration.
- Current patient migration.
- Brownfield event-envelope compatibility mappers.
- Relation claims, `inputs[]`, full predicate tiers, range queries, ContextPacket, access plane, runtime, orchestrator, direct agent writes, production backend selection, signatures, key management, CAS/blockchain anchoring, adapter timestamp normalization, and separate external repository extraction.
- Predicate registry versioning or historical predicate-policy re-audit during snapshot re-read.
- Correction target existence checks, correction conflict handling, replacement policy, or broader correction graph semantics.
- Raw JSON validate-and-admit convenience helpers until an adapter proves the need.
- Making the Append ledger silently own or construct a Predicate registry.

## Further Notes

The superseded chart-local planning surface remains lineage evidence. New AFK implementation should use this `pi-ledger` workstream. K0-K9 are complete and committed; K10 is the next architecture-deepening slice before adapter integration.

K10 should be issued as a narrow implementation ticket for the append-admission seam. It should cite the pi-ledger context glossary and ADR 005, preserve all K0-K9 behavior, and avoid expanding into registry versioning, correction graph policy, storage backend work, or chart integration.
