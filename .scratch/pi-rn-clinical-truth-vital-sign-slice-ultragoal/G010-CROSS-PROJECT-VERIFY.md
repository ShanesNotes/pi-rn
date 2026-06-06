# G010 — Cross-project conformance and boundary verification

## Status

Complete.

## Implemented

- Added reproducible verification harness:
  - `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/verify-vital-sign-slice.sh`
- Harness writes durable evidence under:
  - `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-*.txt`
- Harness steps:
  1. Regenerate Rust clinical truth vectors.
  2. Assert committed vector JSON is clean after regeneration.
  3. Run service-core tests.
  4. Run pi-chart typecheck.
  5. Run pi-chart clinical truth contract/adapter tests.
  6. Run pi-chart boundary scan for hidden sim/direct service/hash-computation coupling.
  7. Run pi-ledger boundary scan for pi-chart/pi-sim/patient/showcase path coupling outside fixture-only documentation.
  8. Run `git diff --check`.

## Verification

- Harness completed successfully.
- Vector regeneration was diff-clean.
- `cargo test --manifest-path pi-ledger/Cargo.toml -p clinical-truth-service` passed: 15/15 tests.
- `npm --prefix pi-chart run typecheck` passed.
- `cd pi-chart && node --test --import tsx src/clinical-truth-contract.test.ts src/clinical-truth-adapter.test.ts` passed: 7/7 tests.
- Boundary scans passed.
- `git diff --check` passed.

## Evidence files

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-regenerate-vectors.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-vectors-diff-clean.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-service-core-tests.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-pi-chart-typecheck.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-pi-chart-adapter-tests.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-pi-chart-adapter-boundary-scan.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-pi-ledger-boundary-scan.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g010-diff-check.txt`
