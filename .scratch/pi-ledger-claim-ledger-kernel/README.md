# pi-ledger claim-ledger kernel workstream

Status: active `pi-ledger` implementation workstream.

## Role

This surface owns the Phase 1 K0-K6 reusable cryptographic claim-ledger kernel PRD, test spec, and Matt `$to-issues` TDD slices after the 2026-05-03 ownership decision moved the kernel out of `pi-chart`.

## Source anchors

- `pi-ledger/CONTEXT.md` — subproject domain and boundary context.
- `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md` — accepted owner decision for the reusable kernel.
- `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md` — chart-side supersession of ADR 019's old implementation home.
- `clinical-truth-guardrails.md` — active development guardrails.
- `future-runtime-constraints.md` — long-horizon compatibility constraints mined from archived research packages.
- `test-spec.md` — K0-K6 behavior, negative, rebuild, and boundary test rows.
- `pi-chart/memos/package-archive-adoption-map-20260503.md` — archived research package adoption/defer/reject map.
- `.scratch/pi-chart-v0-5-claim-ledger-kernel/` — superseded lineage surface; useful evidence only.

## Scaffold

The active implementation scaffold is Rust-first:

```text
pi-ledger/
  Cargo.toml
  CONTEXT.md
  README.md
  docs/adr/
  crates/
    ledger-core/
      Cargo.toml
      src/lib.rs
```

Planned Phase 1 module home:

```text
pi-ledger/crates/ledger-core/src/
  canonical.rs
  claim.rs
  ledger.rs
  predicates.rs
  query.rs
  fixture.rs
  lib.rs
```

K0+K2 should start with `canonical.rs`; later files remain unpinned until upstream slices land.

## Commands

Run from the repository root:

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Lock

Do not implement under `pi-chart/src/claim-ledger/`. Any code already there is prototype/golden-vector evidence only until a new issue explicitly reconciles it.

Do not import `pi-chart` source, brownfield schemas, patient directories, package archives, generated UI artifacts, or hidden `pi-sim` internals into `pi-ledger`.

## Package usage rule

Archived research package fragments may be used as cited reference designs where relevant. Adapt only the minimum needed for the current issue. Do not wholesale copy/import package artifacts, issue lists, ADR statuses, or broad type graphs as implementation authority.
