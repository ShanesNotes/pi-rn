# Per-patient WAL/log storage and rebuild plan

Date: 2026-05-31
Ultragoal story: `G005-per-patient-wal-log-storage-and-rebuild-plan`
Status: planning artifact; implementation deferred.

## Purpose

Specify the first durable storage posture for the private clinical-truth service: a per-patient append-only WAL/log backing `ledger-core` accepted entries. This plan keeps the storage model aligned with append-only clinical truth before introducing embedded stores such as `redb`, `sled`, or SQLite.

## Storage invariants

- One authoritative append order per patient ledger.
- Accepted entries are append-only; corrections append new entries and never erase prior entries.
- Store/service assigns `accepted_at`, `seq`, `batch_id`, Record hash, Entry hash, previous-entry hash, and head.
- Rebuild validates the chain/head and accepted metadata before trusting history.
- Predicate policy is admission-time policy; ordinary rebuild does not rerun mutable current predicate policy unless a separate re-audit mode is designed.
- Patient ledger files cannot mix patients.

## Proposed durable layout

```text
<truth-root>/
  service.json
  registries/
    predicate-registry.<version>.json
    predicate-registry.<version>.sha256
  patients/
    <patient_id>/
      ledger.meta.json
      wal/
        00000000000000000001.log
        00000000000001000000.log
      checkpoints/
        checkpoint-<seq>-<head_hash>.json
      quarantine/
        <timestamp>-<reason>/
```

`truth-root` is private service storage. It is not mounted into `pi-agent`, not read directly by browsers/EHR plugins, and not treated as a `pi-chart` patient directory.

## `ledger.meta.json`

Fields:

- `patient_id`
- `contract_version`
- `created_at`
- `current_head_hash`
- `current_seq`
- `active_wal_segment`
- `active_registry_version`
- `last_checkpoint_seq?`
- `last_checkpoint_head_hash?`
- `storage_format_version`

Meta is advisory until verified against WAL/checkpoint replay. Startup must distrust stale meta if replay disagrees.

## WAL record envelope

Each WAL line is length-delimited JSON or a binary-framed equivalent. JSONL is acceptable for the first proof; a later binary frame may preserve the same semantic fields.

```json
{
  "record_kind": "accepted_entry",
  "storage_format_version": 1,
  "patient_id": "patient_001",
  "seq": 1,
  "accepted_at": "2026-05-31T22:00:00Z",
  "batch_id": "batch_...",
  "registry_version": "predicate-registry.v1",
  "record_hash": "sha256:<64hex>",
  "entry_hash": "sha256:<64hex>",
  "previous_entry_hash": null,
  "claim_json": { "...": "accepted claim content" }
}
```

Optional future record kinds:

- `checkpoint_marker`
- `registry_activation`
- `service_metadata`

They must never be confused with accepted clinical entries.

## Append protocol

1. Receive backend-mediated append request.
2. Load or lock the target patient ledger state.
3. Validate Claim and run append/revision admission against current trusted entries and active registry.
4. Assign service-owned metadata (`seq`, `accepted_at`, `batch_id`).
5. Compute Record hash and Entry hash via `ledger-core` rules.
6. Append the WAL record to the active segment.
7. Flush according to durability mode.
8. Update in-memory ledger/head only after durable append succeeds.
9. Update `ledger.meta.json` as a secondary convenience; meta failure after WAL success is recoverable by replay.

## Durability modes

| Mode | Use | Rule |
| --- | --- | --- |
| `strict_fsync` | Clinical-truth default target | fsync WAL record/segment before acknowledging accepted write. |
| `batched_fsync` | Later performance option | May batch acknowledgements only if product accepts durability window; not default. |
| `test_no_fsync` | Unit/conformance only | Explicit test mode; never production. |

The first implementation should start with strict or obviously named test mode; no silent relaxed durability.

## Segment rotation

- Rotate by sequence count or byte size.
- Segment filename records starting sequence.
- Segment close writes a final checksum/trailer if binary framing is adopted later.
- Startup reads segments in sequence order and rejects gaps unless a checkpoint proves prior history.

## Checkpoints

Checkpoint file contains:

- patient id;
- highest seq included;
- head hash;
- accepted entries or compact snapshot shape compatible with `AppendLedger::snapshot`;
- registry versions present in history;
- checkpoint file hash.

Checkpoint use:

- Rebuild from latest valid checkpoint, then replay later WAL segments.
- Validate checkpoint with `AppendLedger::from_snapshot` before trusting.
- If checkpoint invalid, fall back to earlier checkpoint or full WAL replay.

## Startup/rebuild protocol

1. Read service config and enumerate patient ledgers.
2. For each patient, choose latest checkpoint candidate.
3. Validate checkpoint via kernel rebuild path.
4. Replay WAL entries after checkpoint sequence.
5. For every replayed entry, recompute/validate Claim structure, patient scope, sequence, accepted time, Record hash, Entry hash, previous link, and head.
6. Compare rebuilt head/seq with `ledger.meta.json`; if meta disagrees, rewrite meta from rebuilt truth and record diagnostic.
7. If replay fails, fail the patient ledger closed and move suspect files to quarantine only after preserving originals.

## Corruption behavior

| Failure | Behavior |
| --- | --- |
| Truncated trailing record | If no ack could have been returned, truncate to last valid record with audit; otherwise quarantine and require operator decision. |
| Hash mismatch | Fail closed; do not serve accepted truth beyond mismatch. |
| Previous-entry link mismatch | Fail closed; possible tampering or out-of-order segment. |
| Sequence gap/duplicate | Fail closed unless checkpoint proves intentional compaction. |
| Patient id mismatch in WAL path | Fail closed; never import into target patient. |
| Registry missing for historical entry | Allow structural rebuild if entry is otherwise trusted; flag registry material missing for audit/replay completeness. |
| Meta/head mismatch but WAL valid | Treat meta as stale; rebuild meta from WAL/checkpoint. |

## Concurrency model

- Lock granularity: patient ledger.
- Concurrent writes for different patients may proceed independently.
- Concurrent writes for the same patient serialize at append admission + WAL append.
- Revision admission uses current trusted entries inside the patient lock, so stale target hashes fail before append.
- Read operations may use a consistent snapshot of the in-memory ledger/head.

## Migration path to embedded stores

The WAL/log remains the semantic contract. A later embedded store can be introduced only behind the same service contract if it proves one of these needs:

- faster point reads/indexes;
- compaction beyond checkpoints;
- operational backup/restore features;
- safer concurrent storage semantics.

Migration requirements:

1. Existing WAL/checkpoint history can rebuild the embedded store.
2. Embedded store can export a WAL-equivalent conformance snapshot.
3. Golden-vector outputs stay unchanged.
4. Service contract remains version-compatible or explicitly versioned.
5. `pi-chart` backend client does not observe the storage engine choice except service info diagnostics.

## Verification plan for implementation ultragoal

- Unit tests: append record shape, sequence monotonicity, fsync mode guards.
- Rebuild tests: valid replay, checkpoint+tail replay, stale meta rewrite.
- Corruption tests: hash mismatch, prev-link mismatch, sequence gap, wrong patient, truncated tail.
- Concurrency tests: same-patient serialized appends and stale revision target rejection.
- Conformance tests: vectors run from clean WAL and rebuilt WAL produce identical service responses.

## Non-goals

- Production backup/retention policy.
- Encryption/key management/signatures.
- Remote replication.
- Embedded database selection.
- Public API exposure.
