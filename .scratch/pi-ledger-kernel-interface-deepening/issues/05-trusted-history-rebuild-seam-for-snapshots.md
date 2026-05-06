# trusted-history rebuild Seam for snapshots

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Clarify and regression-guard the trusted-history rebuild **Seam** around snapshots and `from_snapshot` so adapters and future storage work know how accepted ledger history can be reconstructed without bypassing admission for new writes.

The rebuild path is trusted history validation, not a fresh append-admission path.

## Acceptance criteria

- [ ] Documents the difference between appending new Claims and rebuilding trusted ledger history.
- [ ] Clarifies which snapshot/rebuild types or functions are public Interface, trusted rebuild support, or internal Implementation.
- [ ] Adds or strengthens tests proving chain/head validation behavior during rebuild remains intact.
- [ ] Proves Admission bypass append support does not become public through the snapshot/rebuild cleanup.
- [ ] Does not add predicate registry re-audit, storage backend selection, or chart adapter code.
- [ ] Preserves current append, Query, and rebuild behavior.
- [ ] Records closeout verification commands and evidence.

## Blocked by

- `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md`

## User stories covered

PRD stories 2, 3, 6, 10, 11, 12, and 15.
