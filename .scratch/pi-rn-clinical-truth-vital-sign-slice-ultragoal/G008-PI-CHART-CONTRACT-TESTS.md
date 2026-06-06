# G008 — pi-chart adapter contract tests before runtime adapter

## Status

Complete.

## Implemented

- Added `pi-chart/src/clinical-truth-contract.ts` as a transport-free contract mapping layer for the `vital.sign` slice.
- Added `pi-chart/src/clinical-truth-contract.test.ts` with contract tests that read the Rust-generated vector suite at `pi-ledger/conformance/clinical_truth/v1alpha1/vital_sign_vectors.json`.
- Covered both input surfaces:
  - `VitalSample` → Claim candidate.
  - `EventEnvelope` with `observation/vital_sign` → Claim candidate.
- Asserted key mapping fields:
  - patient → `subject.patientId` and `patient_ledger_ref.patient_id`
  - encounter → `object.encounterId`
  - source → `object.source`
  - quality → `object.quality`
  - sampled time → `time.valid.instant`
  - recorded time → `time.recorded_at`
  - evidence retained in `source_context`, not embedded as view truth inside the Claim record
- Added boundary assertions that the contract layer does not import hidden `pi-sim`, does not directly access `clinical-truth-service`, and does not compute TypeScript hashes/canonical JSON.

## Boundary notes

- This is still a candidate mapper, not the backend-mediated runtime adapter.
- TypeScript emits Claim-shaped data only; Rust remains the authority for canonicalization, Record hash, registry validation, append admission, and idempotent acceptance.

## Verification

- `cd pi-chart && npm run typecheck` passed.
- `cd pi-chart && node --test --import tsx src/clinical-truth-contract.test.ts` passed: 3/3 tests.
- During this story, `cd pi-chart && npm test ...` also completed the full test suite: 392/392 tests passed.
- `git diff --check` passed.

## Evidence files

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g008-pi-chart-typecheck.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g008-clinical-truth-contract-tests.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g008-diff-check.txt`
