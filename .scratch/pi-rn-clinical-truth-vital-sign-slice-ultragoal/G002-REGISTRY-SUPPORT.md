# G002 — Versioned registry support in Rust

Date: 2026-05-31

## What changed

Added executable first-slice registry support in `pi-ledger/crates/ledger-core/src/predicates.rs`:

- `CLINICAL_TRUTH_V1ALPHA1_VITAL_SIGN_REGISTRY_VERSION`
- `clinical_truth_v1alpha1_vital_sign_registry()`
- `clinical_truth_v1alpha1_vital_sign_registry_summary()`
- `PredicateRegistry::summary(...)`
- `PredicateRegistry::predicate_summaries()`
- summary structs for predicate registry metadata and required object fields

## First-slice policy

The first clinical-truth service fixture registry is deliberately narrow and contains exactly one predicate:

- `vital.sign`
- shape: `observation`
- required object fields:
  - `code: string`
  - `value: number`
  - `unit: string`
  - `encounterId: string`

This does not promote the fixture registry into production ontology. It is executable contract evidence for the `vital.sign` vertical slice.

## Stable metadata

Registry version:

```text
clinical_truth.v1alpha1.vital_sign_fixture.2026-05-31
```

Registry content hash:

```text
sha256:d08fd55c937cca96c02d8a0f050e157d001e1539ac280aad344fbf029a0f0b46
```

The hash covers canonical JSON for the version and predicate summaries, so it is deterministic and version-sensitive.

## Verification

Passed:

- `cd pi-ledger && cargo test clinical_truth_vital_sign_registry`
- `cd pi-ledger && cargo test predicates`
- `cd pi-ledger && cargo test`
- `git diff --check`

Evidence files:

- `evidence/g002-clinical-truth-registry-tests.txt`
- `evidence/g002-predicates-test.txt`
- `evidence/g002-pi-ledger-cargo-test.txt`
