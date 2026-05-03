# K0+K2 canonicalization and hash helper

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-v0-5-claim-ledger-kernel/PRD.md`

## What to build

Build the first clean-canvas claim-ledger kernel module: deterministic canonicalization plus record-hash behavior for synthetic V0.5 claims. The slice proves stable `(id, hash)` reference behavior without importing the current `EventEnvelope`, current patient directories, package-internal status labels, or hidden simulator state.

Package reconciliation included from `pkg-018`: canonicalization id, SHA-256 content hash, self-field exclusion, property-order invariance, clinical-value sensitivity, explicit id/hash separation, and hash-not-only-id guardrail.

## Acceptance criteria

- [ ] Starts with failing Node tests mapped to T-K0-01 through T-K0-04 and T-K2-01 through T-K2-02 in `test-spec.md`.
- [ ] Exposes canonicalization identifier `jcs-rfc8785-pi-chart-v1`.
- [ ] Computes record hashes as SHA-256 over canonical JSON and encodes output as `sha256:<64 lowercase hex characters>`.
- [ ] Hash calculation is property-order invariant for object keys.
- [ ] Hash calculation is sensitive to clinical payload changes in `object`, `predicate`, `subject`, valid time, or actor/provenance fields.
- [ ] Hash calculation excludes self-reference fields `integrity.hash` and `integrity.signature` wherever they appear in the claim integrity block.
- [ ] Hash calculation preserves id/hash separation: claim id remains part of identity and hash is never treated as the only claim id.
- [ ] Unsupported canonicalization inputs fail deterministically, including non-finite numbers, `undefined`, functions, symbols, and cyclic object graphs.
- [ ] Tests use synthetic in-memory claim-like objects only; no current `EventEnvelope`, schemas, current patient fixtures, hidden `pi-sim`, package archive edits, lockfile edits, or accepted ADR edits are introduced.
- [ ] Implementation home must be re-triaged for `pi-ledger` before AFK pickup; prior `pi-chart/src/claim-ledger/canonical.ts` path is superseded by ADR 020 and `pi-ledger` ADR 001.

## Blocked by

None - can start immediately after triage.

## Closeout commands

Run from the repository root unless the command itself changes directory:

```bash
cd pi-chart && npm test
cd pi-chart && npm run typecheck
# Run only if this slice affects validation, derived output, fixtures, or whole-chart checks:
cd pi-chart && npm run check
```

## Guardrail application

- Protects: stable claim identity, provenance integrity, patient-safe rebuildability.
- Source: `pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md`; `.scratch/pi-chart-v0-5-claim-ledger-kernel/clinical-truth-guardrails.md`; `.scratch/pi-chart-v0-5-claim-ledger-kernel/future-runtime-constraints.md`; `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` D4/D7; `pkg-018:plans/test-spec-018-kernel-predicate-bitemporal-ledger.md` T-HASH rows.
- Not imported: current `EventEnvelope`, current filesystem/NDJSON/Markdown layout, current patient directories, package-internal ADR status, generated UI assumptions, FHIR/CAS identity.
- Test proof: failing behavior tests for canonicalization id, `sha256:<hex>` hash format, stable recomputation, property-order invariance, value sensitivity, self-field exclusion, unsupported input rejection, and id/hash separation.

## Retargeting note

This issue was previously `ready-for-agent` for `pi-chart/src/claim-ledger/canonical.ts`. The 2026-05-03 operator decision moved kernel ownership to `pi-ledger`; keep this issue in `needs-triage` until implementation path, package/tooling, and closeout commands are retargeted. Existing `pi-chart/src/claim-ledger/` work, if present, is prototype/golden-vector evidence only.
