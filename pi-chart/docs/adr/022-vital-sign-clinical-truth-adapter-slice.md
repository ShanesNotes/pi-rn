# ADR 022 — Vital-sign clinical-truth adapter slice

Date: 2026-05-31
Status: accepted
Decision maker: autonomous ultragoal execution under maintainer brief.
Related:
- `021-clinical-truth-service-client-boundary.md`
- `020-claim-ledger-kernel-owned-by-pi-ledger.md`
- `../../../pi-ledger/docs/adr/009-clinical-truth-service.md`
- `../../../pi-ledger/docs/adr/010-vital-sign-service-core-slice.md`
- `../../../.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/`

## Context

ADR 021 says pi-chart should consume the private clinical-truth service through the app/backend boundary, not by giving browsers or workflow entry points direct service access and not by reimplementing Rust ledger authority in TypeScript.

The first executable service slice is the `clinical_truth.v1alpha1` `vital.sign` observation contract in `pi-ledger`.

## Decision

Add a minimal pi-chart adapter slice for `vital.sign` that remains backend-mediated and contract-driven.

The slice includes:

- transport-free contract mapping from `VitalSample` and `EventEnvelope` `observation/vital_sign` inputs to a Claim candidate shape matched against Rust-generated vectors;
- an injected `ClinicalTruthBackendClient` seam for append requests;
- append request builders and append helpers for vital samples/events;
- a fake contract backend kept out of the package-root public export and used by tests only;
- accepted-entry projection that derives clinician-facing vital fields from backend-returned accepted `claim_json` and accepted metadata, not from the original caller view;
- rejection of draft/suggested/inferred event facts before append.

TypeScript may construct candidate Claim JSON and transport-side source context, but it does not compute canonical JSON, Record hashes, Entry hashes, append admission, registry decisions, or idempotent acceptance. The source context is not durable clinical truth in this slice; durable provenance must be accepted as explicit Claim/evidence facts or future versioned service metadata.

## Rejected

- Importing or instantiating `pi-ledger` service-core from pi-chart. Rejected because pi-chart should target the versioned backend/service contract.
- Letting UI/workflow entry points call the ledger service directly. Rejected by ADR 021; app/backend mediation owns auth/session/workflow and suggestion promotion.
- Projecting accepted clinical truth from the original sample after append. Rejected because accepted backend fields are the source of accepted truth.
- Treating Pi suggestions or draft events as accepted ledger writes. Rejected because suggestion/review/promotion remains upstream of accepted service append.

## Consequences

- `pi-chart/src/clinical-truth-contract.ts` and `pi-chart/src/clinical-truth-adapter.ts` are the first backend-client adapter surface for the vital-sign slice.
- Tests must continue reading Rust-owned conformance vectors rather than duplicating expected canonical/hash values in TypeScript.
- Future app/backend transport code should implement `ClinicalTruthBackendClient` and keep browser/EHR clients behind pi-chart mediation.
