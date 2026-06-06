# Clinical-truth vital-sign slice handoff

## Implemented

- `pi-ledger` now has a Rust-owned `clinical_truth.v1alpha1` `vital.sign` conformance suite and `clinical-truth-service` service-core crate.
- Service-core covers validation, append preview, base append, revision append, durable WAL-backed idempotency replay, exact get-entry selector matching, point-read, snapshot/admin validation, and a file/WAL prototype.
- `pi-chart` now has a backend-mediated vital-sign adapter slice with contract mapping, request builders, test-only fake backend support, and accepted-entry projection.
- Cross-project harness: `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/verify-vital-sign-slice.sh`.

## Still non-production / future work

- No production gRPC/UDS transport yet.
- No production auth/session/access-plane policy yet.
- File/WAL prototype is still not a full production storage decision, though appends are staged before in-memory commit and WAL replay carries request-id idempotency metadata.
- `source_context` is transport-side diagnostic context only; durable provenance remains future Claim/evidence modeling or explicit service metadata.
- `vital.sign` registry is a first-slice fixture, not a complete production ontology.
- Broader fact families, registry governance, transport bindings, backend integration, and end-to-end app wiring remain future work.

## Verification commands

```bash
.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/verify-vital-sign-slice.sh
cd pi-ledger && cargo test
cd pi-chart && npm run typecheck && npm test
```

## Key docs

- `pi-ledger/docs/adr/010-vital-sign-service-core-slice.md`
- `pi-chart/docs/adr/022-vital-sign-clinical-truth-adapter-slice.md`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/G010-CROSS-PROJECT-VERIFY.md`
