# ledger-core public Interface inventory

Status: active adapter-readiness reference
Related ADR: `docs/adr/008-kernel-public-interface-inventory-before-adapters.md`

This page is the current safe-use map for the `ledger-core` claim-ledger kernel after K12. For a clinician-readable explanation of the proof steps, see `admission-proof-lifecycle.md`; for snapshot rebuild boundaries, see `trusted-history-rebuild-seam.md`.

Clinical summary: the kernel accepts clinical assertions into ledger history only after it can prove that the Claim is structurally valid, belongs to the target patient ledger, satisfies Predicate policy, and, for corrections, points to already accepted same-patient ledger content. New accepted ledger history should enter through those proof steps. Bypass append support is test-only and is not an Adapter contract.

## Safe lifecycle for new Claims

1. **Ledger-acceptable Claim** — raw JSON satisfies the kernel Claim shape and can be canonicalized.
   - Rust path: `claim::validate_claim` returns `claim::ValidatedClaim`.
2. **Validated Claim** — field extraction authority for Claim id, predicate, patient, Valid time, Recorded time, and revision target.
   - Rust path: `claim::ValidatedClaim` accessors.
3. **Append-admissible Claim** — Validated Claim is eligible for a specific patient ledger after patient-scope and Predicate registry checks.
   - Rust path: `admission::AppendAdmissibleClaim::admit`.
4. **Revision-admissible Claim** — correction Claim also proves its target exists in the current same-patient ledger by Claim id plus Record hash.
   - Rust path: `admission::RevisionAdmissibleClaim::admit`.
5. **Append ledger** — assigns Known time, sequence, batch id, Record hash, Entry hash, previous-entry link, and head.
   - Base Claim path: `ledger::AppendLedger::append_admissible`.
   - Correction Claim path: `ledger::AppendLedger::append_revision_admissible`.
6. **Query point read** — computes a Valid time / Known time view from already trusted ledger entries.
   - Rust path: `query::point_read`.

## Safe public consumer paths

These are the paths future Adapters may use as the intended `ledger-core` Interface.

| Need | Use | Boundary note |
| --- | --- | --- |
| Canonical Claim bytes | `canonical::canonical_json`, `canonical::canonical_json_from_str` | Deterministic JSON-compatible canonicalization. |
| Record content hash | `canonical::record_hash`, `hash::RecordHash` | Record hash proves Claim content; it is not the append-chain head. |
| Entry/head hash parsing | `hash::EntryHash` | Entry hash proves append-chain entry identity. |
| Canonical time input | `time::CanonicalTimestamp`, `time::ValidTimeExpression` | Adapters normalize timestamps before kernel entry. |
| Claim validation | `claim::validate_claim`, `claim::ValidatedClaim` | Field extraction should go through Validated Claim accessors after validation. |
| Predicate policy | `predicates::PredicateDefinition`, `predicates::PredicateRegistry::load`, `PredicateRegistry::validate_validated_claim` | Predicate policy stays outside Append ledger storage. |
| Base Claim admission | `admission::AppendAdmissibleClaim::admit` | Requires target patient id and Predicate registry. |
| Correction Claim admission | `admission::RevisionAdmissibleClaim::admit` | Requires current trusted entries from the same patient ledger. |
| New patient ledger | `ledger::AppendLedger::new` | StoreClock supplies store-assigned Known time for deterministic tests/current kernel use. |
| Append base Claim | `AppendLedger::append_admissible` | Rejects correction Claims that need Revision admission. |
| Append correction Claim | `AppendLedger::append_revision_admissible` | Rechecks target proof against current ledger entries before append. |
| Inspect accepted entries | `AppendLedger::entries`, `ledger::LedgerEntry` | Entries are accepted ledger history; do not mutate them or treat mutated copies as trusted. |
| Point-in-time view | `query::point_read`, `query::PointReadView` | Query is a trusted-entry projection, not Admission or chain validation. |
| Trusted-entry facts | `query::trusted_entry_facts`, `query::TrustedEntryFacts`, `query::valid_time_expression` | Projection helpers for claim id, Record hash, revision target, and Valid time on already accepted entries. |
| Failure classification | `adapter_diagnosis::FailureLayer`, `adapter_diagnosis::*_error_layer` | Adapter-facing diagnosis vocabulary; see `adapter-facing-errors.md`. |

## Trusted rebuild and integrity paths

These paths are public because future storage/rebuild work needs them, but they are not shortcuts for new clinical writes. The rebuild Seam is documented in `trusted-history-rebuild-seam.md`.

| Need | Use | Boundary note |
| --- | --- | --- |
| Snapshot current ledger | `AppendLedger::snapshot`, `ledger::LedgerSnapshot` | Snapshot is a copy of accepted history plus head. |
| Rebuild trusted history | `AppendLedger::from_snapshot` | Revalidates Claim structure, patient scope, sequence, hashes, previous links, accepted times, and head. It does not rerun current Predicate policy. |
| Validate current ledger | `AppendLedger::validate` | Chain/head integrity check for the current in-memory ledger. |
| Recompute hashes for diagnosis | `AppendLedger::recompute_hashes`, `ledger::RecomputedEntryHashes` | Diagnostic support for stored/recomputed hash comparison. |
| Read patient/head metadata | `AppendLedger::patient_id`, `AppendLedger::head_hash` | Metadata inspection only. |

## Test/example utilities, not Adapter contracts

**Quarantine strategy (K12+):** `ledger_core::fixture` is compiled only under `#[cfg(any(test, feature = "test-support"))]`. Default `cargo build -p ledger-core` omits the module. Integration tests that import fixture helpers must enable the `test-support` Cargo feature. Production Adapters must not depend on `test-support`.

| Item | Status | Boundary note |
| --- | --- | --- |
| `fixture` module | Kernel fixture/example utility (feature-gated) | Useful for deterministic demos and tests; not a production clinical ontology and not a `pi-chart` patient model. Not part of the default production API surface. |
| `fixture::fixture_observation_claim` / `fixture::fixture_correction_claim` | Deterministic Claim example helpers (`test-support` only) | Keep public examples from copying raw Claim JSON shape details. They still require normal validation, Append admission, and Revision admission. |
| `predicates::phase1_registry` | Fixture registry | Covers generated kernel fixtures only. Production Adapters should load their own registry definitions. |
| `ledger::StoreClock::deterministic` | Deterministic clock seed | Current kernel test/demo clock. Store authority remains inside Append ledger; callers do not set accepted metadata on Claims. |
| `AppendLedger::append_without_predicate_or_revision_admission` | Test-only, crate-private | Admission bypass support is compiled only for crate tests and is not visible to Adapter crates. |

## Internal Implementation details that are not Adapter promises

- The private append helper that mutates the ledger after Admission succeeds.
- The exact internal storage layout of `PredicateRegistry` and Predicate object rules.
- The exact helper functions used to compute Entry hashes and batch ids.
- Query's current internal extraction helpers for revision targets and Valid time.
- Public struct fields that exist to serialize, snapshot, or inspect current kernel records should not be treated as permission to bypass validation, Admission, or rebuild checks.

## Base Claim example path

A safe base Claim flow is:

```text
raw Claim JSON
  -> validate_claim
  -> AppendAdmissibleClaim::admit(validated, ledger.patient_id(), registry)
  -> AppendLedger::append_admissible
  -> LedgerEntry with store-assigned Known time, sequence, Record hash, Entry hash, and head link
```

The public regression test `k12_public_base_claim_moves_from_validated_to_append_admissible_before_append` exercises this path.

## Correction Claim example path

A safe correction Claim flow is:

```text
raw correction Claim JSON with revises.target id + Record hash
  -> validate_claim
  -> AppendAdmissibleClaim::admit(validated, ledger.patient_id(), registry)
  -> RevisionAdmissibleClaim::admit(append_admissible, ledger.entries())
  -> AppendLedger::append_revision_admissible
  -> new LedgerEntry; prior entry remains append-only history
```

The public regression test `k12_public_correction_claim_moves_from_append_admissible_to_revision_admissible_before_append` exercises this path.

## Query path

A safe point-read flow is:

```text
trusted entries from AppendLedger::entries or AppendLedger::from_snapshot(...).entries()
  -> query::point_read(entries, valid_at, known_at)
  -> PointReadView entries visible at both Valid time and Known time
```

Query remains a trusted-entry projection. It does not prove Admission, run Predicate policy, validate the whole chain, or decide clinical correction conflict policy.

## Service-core layer

The first transport-agnostic service wrapper lives in `crates/clinical-truth-service/` under the `clinical_truth.v1alpha1` contract. Read `docs/adr/009-clinical-truth-service.md` and `docs/adr/010-vital-sign-service-core-slice.md` for the versioned request/response boundary. Adapters should target the service contract and conformance vectors under `conformance/clinical_truth/v1alpha1/`, not private `ledger-core` internals.

## Boundary reminders

- `pi-ledger` does not import `pi-chart` source, brownfield schemas, patient directories, generated UI artifacts, or `EventEnvelope` assumptions.
- `pi-ledger` does not inspect hidden `pi-sim` internals.
- `pi-ledger` does not grant `pi-agent` direct accepted clinical write authority.
- FHIR, openEHR, signatures, key management, blockchain/CAS anchoring, storage backend selection, and clinical write-review workflow remain future Adapter/runtime policy, not current kernel Interface.
