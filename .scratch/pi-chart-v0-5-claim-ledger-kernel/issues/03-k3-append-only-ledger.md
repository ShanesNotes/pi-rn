# K3 append-only ledger

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-v0-5-claim-ledger-kernel/PRD.md`

## What to build

Create the minimal append-only ledger behavior for accepted synthetic claims: store-assigned accepted metadata, patient-local sequence, record hash, entry hash, previous-entry link, and head validation. The slice proves append-only clinical truth without selecting a production backend or migrating current patient data.

Package reconciliation included from `pkg-018`: SHA-256 record hash, entry hash, `prev_entry_hash`, patient-local head, store-assigned `accepted_at`/`seq`/`batch_id`, mutation detection, and explicit deferral of batch hash files, dual-write compatibility, migration, CAS, signatures, and multi-writer locking.

## Acceptance criteria

- [ ] Starts with failing Node tests mapped to T-K3-01 through T-K3-05 plus T-REBUILD-01 and T-REBUILD-02 in `test-spec.md`.
- [ ] Append accepts only claims that pass the K1 validator.
- [ ] Append sets or overwrites store-owned `accepted_at`, monotonic `seq`, and `batch_id`; caller-supplied values for those fields are rejected, either by silent overwrite/ignore or by deterministic warning behavior covered in tests.
- [ ] Phase 1 `batch_id` is a deterministic store-assigned per-append batch identifier: one append equals one batch; caller-supplied `batch_id` and multi-append batches are forbidden in Phase 1, and future batch APIs remain deferred per `pkg-018`.
- [ ] Tests use deterministic accepted-time and batch-id controls to avoid flaky assertions.
- [ ] Two appends produce sequence `N` and `N+1` for the same synthetic patient ledger.
- [ ] Ledger entries store record hash, previous-entry hash, entry hash, record kind, entry version, and accepted metadata.
- [ ] Entry hashes are SHA-256 canonical hashes encoded as `sha256:<64 lowercase hex characters>` and exclude the entry's own hash field from its payload.
- [ ] Fresh synthetic ledger validates its hash chain and head hash.
- [ ] Mutating an older entry causes validation failure.
- [ ] Changing ledger head without matching entries causes validation failure.
- [ ] Ledger can be re-read deterministically and hashes can be recomputed from stored records.
- [ ] Missing/empty ledger behavior is explicit for synthetic tests and does not imply current patient migration.
- [ ] No production backend, current patient migration, package-archive edit, current `appendEvent` dual-write path, batch hash ledger, legal signature, or access-plane shortcut is introduced.

## Blocked by

- `.scratch/pi-chart-v0-5-claim-ledger-kernel/issues/02-k1-minimal-claim-validation.md`

## Closeout commands

Run from the repository root unless the command itself changes directory:

```bash
cd pi-chart && npm test
cd pi-chart && npm run typecheck
# Run only if this slice affects validation, derived output, fixtures, or whole-chart checks:
cd pi-chart && npm run check
```

## Guardrail application

- Protects: append-only clinical truth, correction by new claim, stable known time, disposable derived views from canonical ledger data.
- Source: `pi-chart/CONTEXT.md`; ADR 019; workstream PRD K3; `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` D5/D6/D7; `pkg-018:plans/prd-018c-bitemporal-ledger-and-integrity.md` ledger research.
- Not imported: current timeline-date canonical storage, current patient directories, v0.3 migration scripts, native CAS, signatures/key management, multi-writer filesystem locking, dual-write `appendEvent` compatibility.
- Test proof: failing behavior tests for store-assigned metadata, monotonic sequence, deterministic clock/batch controls, hash-chain validation, mutation detection, head mismatch detection, and deterministic reread/recompute.
