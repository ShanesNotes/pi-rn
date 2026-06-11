# pi-ledger

Reusable cryptographic claim-ledger kernel for the `pi-rn` workspace.

`pi-ledger` owns deterministic canonicalization, stable claim id plus content hash identity, append-only ledger integrity, and minimal valid-time / known-time query semantics. It is not a chart UI, not an EHR clone, not a blockchain, and not a `pi-chart` brownfield compatibility layer.

## Current kernel

```text
pi-ledger/
├── Cargo.toml
├── CONTEXT.md
├── conformance/clinical_truth/v1alpha1/vital_sign_vectors.json
├── docs/adr/
│   ├── 009-clinical-truth-service.md
│   └── 010-vital-sign-service-core-slice.md
├── docs/admission-proof-lifecycle.md
├── docs/ledger-core-public-interface.md
├── docs/trusted-history-rebuild-seam.md
└── crates/
    ├── ledger-core/
    │   ├── Cargo.toml
    │   ├── examples/generate_clinical_truth_vectors.rs
    │   ├── src/
    │   └── tests/
    └── clinical-truth-service/
        ├── Cargo.toml
        └── src/
```

`ledger-core` is the first kernel crate. K0-K12 now cover canonicalization,
record hashing, minimal Claim validation, append-only ledger integrity,
Predicate admission, bitemporal point reads, canonical UTC time, typed hashes,
Validated Claim field authority, Append admission, Revision admission, and
test-only Admission bypass quarantine.

The first service-core slice is `clinical_truth.v1alpha1` `vital.sign`: `crates/clinical-truth-service/` exposes transport-agnostic service semantics around `ledger-core`, and `conformance/clinical_truth/v1alpha1/vital_sign_vectors.json` is generated from Rust as the cross-project contract fixture.

For safe-use guidance, read:

- `docs/ledger-core-public-interface.md` for the adapter-facing Interface map.
- `docs/admission-proof-lifecycle.md` for the clinician-readable proof lifecycle.
- `docs/trusted-history-rebuild-seam.md` for snapshot/from_snapshot rebuild boundaries.
- `docs/adr/009-clinical-truth-service.md` and `docs/adr/010-vital-sign-service-core-slice.md` for the first service-core slice.

## Commands

From the `pi-rn` monorepo root:

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace --features ledger-core/test-support
cd pi-ledger && cargo run -p ledger-core --example generate_clinical_truth_vectors --quiet \
  > conformance/clinical_truth/v1alpha1/vital_sign_vectors.json
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

From inside `pi-ledger/`, omit the `cd pi-ledger &&` prefix.

## Boundaries

- Do not import `pi-chart` source, brownfield schemas, patient directories, UI prototypes, or `EventEnvelope` assumptions.
- Do not inspect hidden `pi-sim` internals.
- Do not add direct agent-accepted clinical write behavior.
- Treat `pi-chart` as a future adapter/consumer after the kernel Interface is proven.
