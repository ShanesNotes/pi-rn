# Trusted history rebuild Seam

Status: active adapter-readiness reference
Related ADRs:
- `docs/adr/001-reusable-claim-ledger-kernel.md`
- `docs/adr/005-append-admission-separates-predicate-policy.md`
- `docs/adr/007-admission-bypass-is-test-only.md`
- `docs/adr/008-kernel-public-interface-inventory-before-adapters.md`

This page defines the boundary between writing new Claims and rebuilding already accepted ledger history.

Clinical summary: appending a new Claim is like signing a new entry into the chart's trusted record. Rebuilding from a snapshot is like reopening a previously accepted chart ledger and checking that its pages, hashes, sequence, and head still line up. Rebuild validates trusted history; it is not a shortcut for new clinical writes.

## New write path vs rebuild path

| Path | Purpose | Required proof | What it must not do |
| --- | --- | --- | --- |
| **New base Claim append** | Accept a new non-correction Claim into one patient ledger. | Ledger-acceptable Claim → Validated Claim → Append-admissible Claim. | Must not let callers assign Known time, sequence, Record hash, Entry hash, previous-entry link, or head. |
| **New correction Claim append** | Accept a new correction Claim into one patient ledger. | Ledger-acceptable Claim → Validated Claim → Append-admissible Claim → Revision-admissible Claim. | Must not append dangling correction targets or skip same-patient target proof. |
| **Trusted history rebuild** | Reconstruct a ledger from already accepted entries and a stored head. | Snapshot chain/head validation through `AppendLedger::from_snapshot`. | Must not become a public Admission bypass, fresh Predicate re-audit, storage backend, or Adapter write path. |

## Public trusted rebuild Interface

These are intentional public rebuild and integrity paths:

| Public item | Role | Boundary |
| --- | --- | --- |
| `AppendLedger::snapshot` | Produces a copy of accepted entries plus patient id and head. | Snapshot data is portable history, not permission to write new Claims. |
| `ledger::LedgerSnapshot` | Carries patient id, entries, and head hash for trusted history reconstruction. | Public fields support storage/rebuild and tests; mutated snapshots must pass validation before trust. |
| `AppendLedger::from_snapshot` | Rebuilds an Append ledger from a snapshot after validation. | Validates stored history; does not run Append admission or Revision admission for new Claims. |
| `AppendLedger::validate` | Validates the current ledger's accepted history. | Chain/head integrity check, not Predicate registry re-audit. |
| `AppendLedger::recompute_hashes` | Recomputes Record hash and Entry hash values for diagnosis. | Diagnostic support; does not mutate history or accept new Claims. |
| `AppendLedger::entries` | Reads trusted accepted entries after append or rebuild. | Entries can feed Query point reads and Revision admission target proof. |
| `AppendLedger::head_hash` | Reads current append-chain head. | Inspection only. |

## What `from_snapshot` validates

`AppendLedger::from_snapshot` rebuilds only after the snapshot passes ledger validation:

- each entry record is still a Ledger-acceptable Claim;
- each Claim still belongs to the snapshot patient id;
- record kind and entry version are supported;
- sequence is contiguous and starts at 1;
- Known time is canonical UTC;
- batch id matches the store-assigned sequence format;
- previous-entry links match the recomputed chain;
- stored Record hashes match canonical Claim content;
- stored Entry hashes match the entry envelope;
- the stored ledger head matches the recomputed final Entry hash.

If any of those checks fail, rebuild fails and the snapshot must not be trusted.

## What rebuild deliberately does not validate

Rebuild does not rerun current Predicate registry policy. A previously accepted ledger may have been accepted under an older registry. Historical Predicate re-audit needs registry versioning, which is not part of the current kernel.

Rebuild also does not decide correction conflict policy, replacement policy, clinical visibility policy, storage backend selection, chart UI behavior, or agent write authority.

## Admission bypass remains test-only

The trusted history rebuild Seam is separate from Admission bypass. Future Adapters may call `snapshot`, `from_snapshot`, `validate`, `recompute_hashes`, and `entries`, but may not call a bypass append method.

`AppendLedger::append_without_predicate_or_revision_admission` is compiled only as crate-private test support. It is not part of the production public Interface and must not become a snapshot/rebuild convenience path.

## Query after rebuild

A point read may use entries from a rebuilt ledger:

```text
LedgerSnapshot
  -> AppendLedger::from_snapshot(snapshot)
  -> rebuilt.entries()
  -> query::point_read(entries, valid_at, known_at)
```

Query still assumes trusted entries. It does not validate the full chain; callers should rebuild or validate the ledger before treating stored entries as trusted.
