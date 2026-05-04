# PRD: pi-ledger reusable cryptographic claim-ledger kernel

Status: active
Program status: active `pi-ledger` implementation workstream.
Next slice status: ready-for-agent (`K12` public append Interface quarantines Admission bypass)

## Problem Statement

The project needs a clean, reusable cryptographic claim-ledger kernel that is independent from `pi-chart` prototype gravity. The prior V0.5 plan correctly identified the claim-ledger semantics, but its initial implementation home under the chart subsystem would keep the kernel too close to chart UI, brownfield `EventEnvelope`, patient fixture, and chart-specific workflow assumptions.

The maintainer has decided that the ledger should be a sibling subproject, `pi-ledger`, with `pi-chart` consuming it later through an adapter. The workstream needs precise Rust-first package/document authority that lets AFK agents implement and deepen the kernel without accidentally touching `pi-chart` source, schemas, patients, package archives, lockfiles outside `pi-ledger`, or hidden simulator internals.

K0-K11 proved the first kernel behaviors, introduced explicit append and revision admission seams, and made normal correction append prove target existence before store metadata mutates. The next architecture-deepening slice is K12: preserving those admission authorities while quarantining the remaining public Admission bypass before adapter work depends on the kernel Interface.

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
- K11: revision admission as the explicit seam that proves an Append-admissible correction Claim targets existing same-patient ledger content by Claim id plus Record hash before append.
- K12: public append Interface quarantine for Admission bypass, keeping lower-level bypass append support test-only before adapter work.

The K11 solution is to deepen the existing admission seam rather than create a general correction graph engine. Claim validation remains responsible for the Ledger-acceptable Claim contract. Predicate registry remains responsible for predicate/object policy. Append admission remains responsible for patient-scope and predicate-policy composition. Revision admission composes an already Append-admissible correction Claim with the current patient ledger entry surface and returns a Revision-admissible value only when the correction target exists and the stored target Record hash matches the recomputed Record hash. Append ledger remains responsible for patient-local ordering, store-assigned known-time metadata, record hashes, entry hashes, previous-entry links, and head validation.

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
16. As an append-ledger maintainer, I want to accept an append-admissible value instead of raw JSON on the base-claim preferred path, so that the API makes predicate admission hard to bypass.
17. As a future storage adapter author, I want any lower-level append bypass to be explicitly named as not enforcing omitted admission checks, so that unsafe seams are obvious in code review.
18. As a future registry-versioning author, I want snapshot re-read validation to remain chain-integrity-only for now, so that old ledgers do not become unreadable because current predicate policy changed.
19. As a correction-policy author, I want K10 to avoid correction target existence and conflict semantics, so that predicate-aware admission does not become an accidental correction graph engine.
20. As a correction-policy author, I want K11 to prove correction target existence before append, so that dangling correction references cannot enter normal ledger history.
21. As a patient-safety reviewer, I want correction targets to be same-patient accepted entries, so that one patient ledger cannot revise content from another patient ledger.
22. As a correction-link author, I want Revision admission to match target Claim id plus typed Record hash, so that a correction cannot point at the right id with the wrong clinical content.
23. As a ledger-integrity reviewer, I want Revision admission to recompute the target Record hash, so that corrupt stored target hashes cannot become trusted revision anchors.
24. As a ledger-integrity reviewer, I want Revision admission to reject stored/recomputed target hash mismatches, so that accepted target proof depends on canonical record content, not only stored metadata.
25. As an append-ledger maintainer, I want base Claims to continue using Append admission without Revision admission, so that the base-claim path stays simple and explicit.
26. As an append-ledger maintainer, I want correction Claims to require a Revision-admissible value on the normal path, so that append APIs encode the extra correction-target proof.
27. As a fixture maintainer, I want deterministic fixture generation to use Append admission for base Claims and Revision admission for the correction Claim, so that examples teach the safe path.
28. As a query maintainer, I want point reads to keep their trusted-entry boundary, so that revision-target admission does not turn Query into a chain/head validator.
29. As a future storage adapter author, I want Revision admission to consume the current ledger/snapshot entry surface, so that target proof can work with in-memory and future persistence backends.
30. As a future storage adapter author, I want Revision admission to assume a current validated entry surface rather than own whole-chain validation, so that chain/head validation remains a Ledger responsibility.
31. As a future correction-conflict author, I want K11 to prove existence only, so that replacement policy, visibility policy, and graph-wide semantics can be designed separately.
32. As an AFK coding agent, I want a narrow K11 issue with exact acceptance criteria and bypass inventory requirements, so that implementation can be completed without touching adapters, storage backends, or brownfield chart code.
33. As a reviewer, I want admission failures to preserve whether predicate policy, patient scope, target absence, malformed stored target hash, or target hash mismatch failed, so that tests do not match brittle strings or flatten errors into the wrong module.
34. As a kernel maintainer, I want Revision admission to be a deep module extension with a small interface, so that correction-target existence is testable without changing Query or making Ledger own predicate policy.

## Implementation Decisions

- `pi-ledger` is a Rust workspace with one initial crate: `ledger-core`.
- `ledger-core` owns kernel behavior; `pi-chart` is a future adapter/consumer.
- The canonicalization identifier remains `jcs-rfc8785-pi-chart-v1` for continuity with prior accepted planning, even though ownership moved to `pi-ledger`; renaming requires a later explicit issue/ADR because it would change hash vectors.
- Record hashes are SHA-256 encoded as `sha256:<64 lowercase hex characters>`.
- Canonical UTC timestamp handling is a kernel input invariant recorded by ADR 002; adapters normalize source timestamps before kernel entry.
- Record hash and Entry hash are distinct kernel identity values recorded by ADR 003; a dedicated hash Module owns shared `sha256:<64 lowercase hex>` parsing/formatting.
- Validated Claim field extraction is recorded by ADR 004; Claim, Ledger, Predicate, and append-time paths should consume validated accessors instead of raw JSON field reads where validation has already occurred.
- Append admission is recorded by ADR 005; it separates predicate policy from append-chain storage.
- Revision admission is recorded by ADR 006; it proves correction target existence before normal append without becoming a general correction graph engine.
- Admission bypass quarantine is recorded by ADR 007; bypass append support is test-only and not part of the public adapter-facing Interface.
- A Ledger-acceptable Claim means structurally valid, canonicalizable, and hashable.
- An Append-admissible Claim means a Validated Claim that is eligible to enter a specific patient-scoped ledger after patient-scope and predicate-registry checks pass.
- A Revision-admissible Claim means an Append-admissible correction Claim whose revision target matches an already accepted entry in the same patient ledger by Claim id and Record hash.
- The admission Module should own both Append-admissible and Revision-admissible values plus admission error boundaries.
- Append admission should consume a Validated Claim, a target patient id, and a Predicate registry. It should not consume raw JSON and should not make the Append ledger own the registry.
- Revision admission should consume an Append-admissible correction Claim and the current patient ledger entry surface supplied by the caller.
- Revision admission should prove target identity by validating target candidate records as Ledger-acceptable Claims, parsing stored target Record hashes, recomputing target Record hashes from target record content, requiring stored/recomputed hash equality, and matching the correction's target Claim id plus Record hash.
- Revision admission should not own whole-chain or head validation. Callers should supply entries from the current patient ledger or a validated snapshot; snapshot re-read/head validation remains a Ledger concern.
- Admission success should be represented as values that preferred append APIs consume, not only as boolean side checks.
- Admission errors should wrap predicate failures and own patient-scope mismatch, target absence, malformed stored target hash, and target hash mismatch cases. They should not flatten all failures into Ledger errors.
- The preferred append API for base Claims should accept an Append-admissible Claim.
- The preferred append API for correction Claims should accept a Revision-admissible Claim.
- Append admission alone should not silently append Claims that carry a revision target.
- Any lower-level bypass seam must be explicitly named as not enforcing the omitted predicate and/or revision admission checks.
- Fixture and normal append tests should use the safe admission paths so the codebase does not teach bypass patterns.
- Snapshot re-read validation remains a chain-integrity check. Predicate re-audit against a registry is deferred until registry versioning exists.
- Query remains a trusted-entry projection and should not own correction target admission.
- K11 covers correction target existence only. Correction conflicts, replacement policy, clinical visibility requirements, graph-wide correction semantics, and registry-versioned re-audit are separate future work.
- Phase 1 does not implement FHIR/openEHR/CAS/blockchain/signatures/key management/external anchoring.
- Phase 1 does not migrate current chart patient data or implement chart adapters.

## Testing Decisions

- Use Rust tests through `cargo test --workspace`.
- Keep tests behavior-first and public-interface oriented.
- K0+K2 should produce deterministic golden vectors for canonical JSON and hash output.
- Architecture-deepening issues should start with narrow failing regressions that prove the current seam is stringly, duplicated, bypassable, dangling, or inconsistent before refactoring.
- K12 tests should avoid new compile-fail dependencies unless already present; use a lightweight public-interface/source guard plus behavior tests that exercise only safe public append paths. Remaining bypass append support should live only as `#[cfg(test)] pub(crate)` Append ledger support.
- K12 should not refactor Query revision-target parsing or make Query share Revision admission internals; Query remains a trusted-entry projection, and projection cleanup should be a separate candidate if selected.
- K7/K8/K9 tests should preserve prior K0-K6 behavior while adding module-local tests for value parsing/rejection/accessors and cross-module integration tests for Claim, Ledger, Predicate, and Query consumption.
- K10 tests should prove admission accepts only Validated Claims whose patient scope matches the target ledger and whose predicate/object policy passes the registry.
- K10 tests should prove the preferred append path consumes an append-admissible value and preserves K3 metadata, record-hash, entry-hash, previous-link, and head behavior.
- K10 tests should prove snapshot re-read validation remains independent from the current Predicate registry and preserve K5 point-read behavior.
- K11 tests should prove dangling correction targets are rejected before append and before store-clock mutation.
- K11 tests should prove a target with the right Claim id but wrong Record hash is rejected.
- K11 tests should prove malformed stored target hashes and stored/recomputed target hash mismatches are rejected during Revision admission.
- K11 tests should prove base Claims still append through Append admission without requiring Revision admission.
- K11 tests should prove correction Claims cannot append through the normal Append-admissible path and must use the Revision-admissible path.
- K11 tests should prove the deterministic fixture uses Append admission for base Claims and Revision admission for its correction Claim.
- K11 tests should prove Query remains a trusted-entry projection and does not become the owner of revision-target admission.
- K11 tests should inventory every remaining lower-level bypass call site and prove bypass names loudly state omitted admission checks.
- Run `cargo fmt --all -- --check`, `cargo test --workspace`, and `cargo clippy --workspace --all-targets -- -D warnings` for closeout.
- Do not use current chart patient fixtures, schemas, or `EventEnvelope` tests as implementation authority.

## Out of Scope

- Chart adapter integration.
- Current patient migration.
- Brownfield event-envelope compatibility mappers.
- Relation claims, `inputs[]`, full predicate tiers, range queries, ContextPacket, access plane, runtime, orchestrator, direct agent writes, production backend selection, signatures, key management, CAS/blockchain anchoring, adapter timestamp normalization, and separate external repository extraction.
- Predicate registry versioning or historical predicate-policy re-audit during snapshot re-read.
- Correction conflict handling, replacement policy, clinical visibility requirements, graph-wide correction semantics, or “latest correction wins” rules.
- Requiring the target Claim to be visible at a query `knownAt`; K11 proves accepted target existence only.
- Raw JSON validate-and-admit convenience helpers until an adapter proves the need.
- Making the Append ledger silently own or construct a Predicate registry.
- Making Query validate correction target existence, ledger chain/head, or predicate policy.

## Further Notes

The superseded chart-local planning surface remains lineage evidence. New AFK implementation should use this `pi-ledger` workstream. K0-K11 are complete and committed; the next slice should be chosen through architecture-deepening review before adapter integration.

K12 should be issued as one narrow vertical implementation ticket for public append Interface governance. It should cite the pi-ledger context glossary and ADR 007, preserve all K0-K11 behavior, and avoid expanding into Query projection cleanup, registry versioning, correction conflict policy, storage backend work, query revalidation, or chart integration.
