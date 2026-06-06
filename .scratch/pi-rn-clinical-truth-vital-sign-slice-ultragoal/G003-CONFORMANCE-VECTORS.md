# G003 — Rust-owned conformance vectors

Date: 2026-05-31

## What changed

Added Rust-owned `vital.sign` conformance vector generation in `pi-ledger`:

- `pi-ledger/crates/ledger-core/src/conformance.rs`
- `pi-ledger/crates/ledger-core/examples/generate_clinical_truth_vectors.rs`
- `pi-ledger/conformance/clinical_truth/v1alpha1/vital_sign_vectors.json`

The vector suite is generated from `ledger-core` safe lifecycle APIs. It is not hand-authored TypeScript hash/canonicalization evidence.

## Suite identity

```text
clinical_truth.v1alpha1.vital_sign.2026-05-31
```

Contract version:

```text
clinical_truth.v1alpha1
```

Registry version:

```text
clinical_truth.v1alpha1.vital_sign_fixture.2026-05-31
```

## Covered positive vectors

- base `vital.sign` canonical JSON and Record hash;
- base append result with sequence, accepted time, Record hash, Entry hash, previous link, head, and accepted Claim JSON;
- revision canonical JSON and Record hash with target proof;
- revision append result;
- point-read before and after correction, proving append-only history projects to current value after correction.

## Covered negative vectors

- patient mismatch;
- predicate shape mismatch;
- non-canonical recorded timestamp;
- caller-supplied K3 store metadata;
- revision not allowed through base append;
- missing revision target;
- stale revision target hash;
- idempotency key reused with a different payload.

## Verification

Passed:

- `cd pi-ledger && cargo test conformance`
- `cd pi-ledger && cargo test`
- vector regeneration diff against committed JSON is empty;
- committed vector JSON parses and reports 5 positive / 8 negative vectors;
- `git diff --check` passed.

Evidence files:

- `evidence/g003-conformance-tests.txt`
- `evidence/g003-pi-ledger-cargo-test.txt`
- `evidence/g003-vector-regeneration-diff.txt`
- `evidence/g003-vector-json-parse.txt`
