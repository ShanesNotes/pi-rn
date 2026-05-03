# pi-ledger

Reusable cryptographic claim-ledger kernel for the `pi-rn` workspace.

`pi-ledger` owns deterministic canonicalization, stable claim id plus content hash identity, append-only ledger integrity, and minimal valid-time / known-time query semantics. It is not a chart UI, not an EHR clone, not a blockchain, and not a `pi-chart` brownfield compatibility layer.

## Current scaffold

```text
pi-ledger/
├── Cargo.toml
├── CONTEXT.md
├── docs/adr/
└── crates/
    └── ledger-core/
        ├── Cargo.toml
        └── src/lib.rs
```

`ledger-core` is the first kernel crate. K0+K2 should add canonicalization and record hashing here before later claim validation, append ledger, predicate registry, bitemporal read, and fixture closeout slices.

## Commands

Run from the repository root:

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Boundaries

- Do not import `pi-chart` source, brownfield schemas, patient directories, UI prototypes, or `EventEnvelope` assumptions.
- Do not inspect hidden `pi-sim` internals.
- Do not add direct agent-accepted clinical write behavior.
- Treat `pi-chart` as a future adapter/consumer after the kernel Interface is proven.
