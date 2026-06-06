# G006 — Point-read and snapshot/admin boundaries

## Status

Complete.

## Implemented

- Added service-core point read request/response types that project the effective accepted entry for a `patient_id` + `as_of` expression without mutating ledger history.
- Added patient-scoped admin context for diagnostic/maintenance/backup operations.
- Added snapshot export and snapshot validation service methods.
- Snapshot validation rebuilds through the trusted ledger-core path and returns validation metadata only; it does not import entries or bypass append admission.
- Added fail-closed error mapping for malformed or corrupted snapshots.

## Boundary decisions

- Snapshot/export operations require explicit admin context.
- Admin context is scoped to the requested patient; cross-patient snapshot validation is rejected.
- Snapshot validation is diagnostic-only and cannot write/import entries into service state.
- Point-read uses ledger-core query semantics rather than a service-local projection shortcut.

## Verification

- `cd pi-ledger && cargo test -p clinical-truth-service` passed: 13/13 tests.
- `cd pi-ledger && cargo test` passed across the workspace: 146/146 tests.
- `git diff --check` passed.

## Evidence files

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g006-service-core-point-snapshot-tests.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g006-pi-ledger-workspace-test.txt`
