# trusted-history rebuild Seam for snapshots

Status: ready-for-human
Type: AFK
Resolution: implemented; merge/admin close pending human confirmation.

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Clarify and regression-guard the trusted-history rebuild **Seam** around snapshots and `from_snapshot` so adapters and future storage work know how accepted ledger history can be reconstructed without bypassing admission for new writes.

The rebuild path is trusted history validation, not a fresh append-admission path.

## Acceptance criteria

- [x] Documents the difference between appending new Claims and rebuilding trusted ledger history.
- [x] Clarifies which snapshot/rebuild types or functions are public Interface, trusted rebuild support, or internal Implementation.
- [x] Adds or strengthens tests proving chain/head validation behavior during rebuild remains intact.
- [x] Proves Admission bypass append support does not become public through the snapshot/rebuild cleanup.
- [x] Does not add predicate registry re-audit, storage backend selection, or chart adapter code.
- [x] Preserves current append, Query, and rebuild behavior.
- [x] Records closeout verification commands and evidence.

## Blocked by

- `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md`

## User stories covered

PRD stories 2, 3, 6, 10, 11, 12, and 15.

## Implementation notes

- Added `pi-ledger/docs/trusted-history-rebuild-seam.md` as the snapshot/from_snapshot rebuild boundary reference.
- Linked the rebuild Seam doc from `pi-ledger/README.md`, `pi-ledger/docs/ledger-core-public-interface.md`, and crate-level docs.
- Documented the difference between new base Claim append, new correction Claim append, and trusted history rebuild.
- Documented public rebuild/integrity paths: `AppendLedger::snapshot`, `LedgerSnapshot`, `AppendLedger::from_snapshot`, `AppendLedger::validate`, `AppendLedger::recompute_hashes`, `AppendLedger::entries`, and `AppendLedger::head_hash`.
- Documented what `from_snapshot` validates: Claim structure, patient scope, record kind/version, sequence, Known time, batch id, previous-entry links, Record hash, Entry hash, and ledger head.
- Documented what rebuild does not validate: current Predicate registry re-audit, correction conflict/replacement policy, storage backend, chart UI behavior, or agent write authority.
- Added public integration tests in `trusted_history_rebuild.rs`:
  - `trusted_rebuild_docs_name_snapshot_seam_and_bypass_boundary`
  - `public_rebuild_round_trips_snapshot_and_preserves_query_view`
  - `public_rebuild_rejects_broken_previous_link_and_head`
  - `snapshot_rebuild_does_not_reopen_public_admission_bypass`

## Closeout evidence

- `timeout 15s omx explore --prompt "In pi-ledger ledger-core, map AppendLedger::snapshot/from_snapshot/validate public rebuild seam and existing rebuild tests. Read-only lookup only."` — no usable output before timeout; proceeded with direct source inventory.
- `cd pi-ledger && cargo test -p ledger-core trusted_rebuild -- --nocapture` — PASS, 1 rebuild documentation guard.
- `cd pi-ledger && cargo test -p ledger-core public_rebuild -- --nocapture` — PASS, 2 public rebuild behavior tests.
- `cd pi-ledger && cargo test -p ledger-core snapshot_rebuild -- --nocapture` — PASS, 1 Admission-bypass source guard tied to rebuild cleanup.
- `cd pi-ledger && cargo fmt --all -- --check` — PASS.
- `cd pi-ledger && cargo test --workspace` — PASS, 128 tests total: 118 unit tests, 6 public append/interface/lifecycle tests, and 4 trusted rebuild tests.
- `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
- `cd pi-ledger && git diff --check` — PASS.

## Boundary confirmation

- No predicate registry re-audit added.
- No storage backend selected or introduced.
- No chart adapter, chart source, chart patient data, generated UI artifact, hidden simulator detail, or `pi-agent` runtime assumption added.
- No production Admission bypass exposed.
- Current append, Query, and rebuild behavior remains green.
