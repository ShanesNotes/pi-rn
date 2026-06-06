# G007 — File/WAL storage seam and migration notes

## Status

Complete for the AFK prototype slice.

## Implemented

- Added a service-core file/WAL storage seam for accepted ledger entries:
  - `WalDurability::{Fsync, TestModeNoFsync}` makes the durability boundary explicit.
  - `FileWalPatientLedgerStore` writes one JSONL record per accepted entry.
  - WAL records include version, kind, patient scope, sequence, previous head, head after append, and the full accepted `LedgerEntry`.
- Added replay semantics:
  - Patient-specific log path is derived from a hex-encoded patient id.
  - Replay rejects malformed JSON, unsupported record versions/kinds, patient mismatch, previous-head mismatch, entry/head mismatch, and trusted ledger-core validation failures.
  - Replay returns a `LedgerSnapshot` only after `AppendLedger::from_snapshot` validates the hash chain/head.
- Added service-core integration:
  - `with_file_wal_storage(...)` enables the prototype store.
  - `with_patient_ledger_from_storage(...)` rehydrates a patient ledger from the WAL and restores a caller-supplied store clock for future appends.
  - Append paths persist accepted entries to WAL when storage is configured.
  - `replay_patient_wal_snapshot(...)` exposes diagnostic replay without importing entries.
- Added `AppendLedger::from_snapshot_with_clock(...)` so validated snapshots can be rehydrated with a future append clock without reopening public append bypasses.

## Migration notes

- This remains a local service-core prototype, not the production embedded store decision.
- Later storage engines should preserve the same logical contract: append accepted entries only after kernel admission, replay through trusted ledger validation, fail closed on corruption, and keep patient logs scoped by patient ledger id.
- Production work still needs crash-consistency/transaction semantics around in-memory mutation plus WAL append; this slice only makes durability explicit and tested at the file boundary.
- `TestModeNoFsync` is for deterministic unit tests only. Production adapters should use `Fsync` or a stronger transactional backend behind the same seam.

## Verification

- `cd pi-ledger && cargo test -p clinical-truth-service` passed: 15/15 tests.
- `cd pi-ledger && cargo test` passed: 148/148 tests across service-core, ledger-core, integration tests, and doc-tests.
- `git diff --check` passed.

## Evidence files

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g007-service-core-wal-tests.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g007-pi-ledger-workspace-test.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g007-diff-check.txt`
