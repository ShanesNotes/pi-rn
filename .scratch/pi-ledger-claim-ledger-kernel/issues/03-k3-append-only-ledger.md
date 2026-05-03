# K3 append-only ledger

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Create the minimal append-only ledger behavior for accepted synthetic claims: store-assigned accepted metadata, patient-local sequence, record hash, entry hash, previous-entry link, and head validation.

## Acceptance criteria

- [ ] Starts with failing Rust tests mapped to T-K3-01 through T-K3-05 plus T-REBUILD-01 and T-REBUILD-02 in `test-spec.md`.
- [ ] Implementation lives in `pi-ledger/crates/ledger-core/src/ledger.rs` with Rust test coverage; update `lib.rs` only to expose the minimal K3 interface.
- [ ] Append accepts only claims that pass the K1 validator.
- [ ] Append sets or overwrites store-owned `accepted_at`, monotonic `seq`, and `batch_id`; caller-supplied values are rejected, either by silent overwrite/ignore or deterministic warning behavior covered in tests.
- [ ] Phase 1 `batch_id` is deterministic and store-assigned per append: one append equals one batch; caller-supplied `batch_id` and multi-append batches are forbidden. Future batch APIs remain deferred per `pkg-018`.
- [ ] Tests use deterministic accepted-time and batch-id controls to avoid flaky assertions.
- [ ] Ledger entries store record hash, previous-entry hash, entry hash, record kind, entry version, and accepted metadata.
- [ ] Entry hashes are SHA-256 canonical hashes encoded as `sha256:<64 lowercase hex characters>` and exclude the entry's own hash field from its payload.
- [ ] Fresh synthetic ledger validates its hash chain and head hash.
- [ ] Mutating an older entry causes validation failure.
- [ ] Changing ledger head without matching entries causes validation failure.
- [ ] Ledger can be re-read deterministically and hashes can be recomputed from stored records.
- [ ] No production backend, current patient migration, package-archive edit, `pi-chart` dual-write path, batch hash ledger, legal signature, or access-plane shortcut is introduced.

## Blocked by

None — K1 minimal Claim validation was committed green on 2026-05-03.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Guardrail application

- Protects: append-only clinical truth, correction by new claim, stable known time, disposable derived views from canonical ledger data.
- Source: `pi-ledger/CONTEXT.md`; ADR 001; workstream PRD K3; `pkg-018` D5/D6/D7.
- Not imported: current timeline-date canonical storage, current patient directories, v0.3 migration scripts, native CAS, signatures/key management, multi-writer filesystem locking, `pi-chart` dual-write compatibility.
- Test proof: failing Rust behavior tests for store-assigned metadata, monotonic sequence, deterministic clock/batch controls, hash-chain validation, mutation detection, head mismatch detection, and deterministic reread/recompute.
