# K0+K2 canonicalization and hash helper

Status: wontfix
Type: AFK

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Build the first `ledger-core` kernel module: deterministic canonicalization plus record-hash behavior for synthetic V0.5 claims. This slice proves stable `(id, hash)` reference behavior in `pi-ledger` without importing `pi-chart` source, current `EventEnvelope`, patient directories, package-internal status labels, or hidden simulator state.

Package reconciliation included from `pkg-018`: canonicalization id, SHA-256 content hash, self-field exclusion, property-order invariance, clinical-value sensitivity, explicit id/hash separation, and hash-not-only-id guardrail.

## Acceptance criteria

- [ ] Starts with failing Rust tests mapped to T-K0-01 through T-K0-04 and T-K2-01 through T-K2-02 in `test-spec.md`.
- [ ] Implementation lives in `pi-ledger/crates/ledger-core/src/canonical.rs` with Rust test coverage and exports only the minimal behavior required by this slice.
- [ ] Exposes canonicalization identifier `jcs-rfc8785-pi-chart-v1`.
- [ ] Computes record hashes as SHA-256 over canonical JSON and encodes output as `sha256:<64 lowercase hex characters>`.
- [ ] Hash calculation is property-order invariant for object keys.
- [ ] Hash calculation is sensitive to clinical payload changes in `object`, `predicate`, `subject`, valid time, or actor/provenance fields.
- [ ] Hash calculation excludes self-reference fields `integrity.hash` and `integrity.signature` wherever they appear in the claim integrity block.
- [ ] Hash calculation preserves id/hash separation: claim id remains part of identity and hash is never treated as the only claim id.
- [ ] Unsupported canonicalization inputs fail deterministically, including non-finite numbers and non-JSON representable values.
- [ ] K0 may add only narrowly justified Rust dependencies needed for this behavior, expected to be `serde`, `serde_json`, and `sha2`; any additional dependency requires triage.
- [ ] Tests use synthetic in-memory claim-like values only; no `pi-chart` source, current `EventEnvelope`, chart schemas, current patient fixtures, hidden `pi-sim`, package archive edits, or accepted ADR edits are introduced.

## Blocked by

None - can start immediately.

## Closeout commands

Run from the repository root:

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Guardrail application

- Protects: stable claim identity, provenance integrity, patient-safe rebuildability.
- Source: `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md`; `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md`; `clinical-truth-guardrails.md`; `future-runtime-constraints.md`; `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` D4/D7; `pkg-018:plans/test-spec-018-kernel-predicate-bitemporal-ledger.md` T-HASH rows.
- Not imported: `pi-chart` source, current `EventEnvelope`, current filesystem/NDJSON/Markdown layout, current patient directories, package-internal ADR status, generated UI assumptions, FHIR/CAS identity.
- Test proof: failing Rust behavior tests for canonicalization id, `sha256:<hex>` hash format, stable recomputation, property-order invariance, value sensitivity, self-field exclusion, unsupported input rejection, and id/hash separation.
