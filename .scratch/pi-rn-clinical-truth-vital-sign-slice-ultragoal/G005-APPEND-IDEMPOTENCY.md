# G005 — Append and idempotency service behavior

Date: 2026-05-31

## What changed

Extended `pi-ledger/crates/clinical-truth-service/src/lib.rs` with in-memory service-core write semantics for the `vital.sign` slice:

- `AppendClaimRequest` / `AppendClaimResponse`
- `AppendRevisionClaimRequest` / `AppendRevisionClaimResponse`
- `GetEntryRequest` / `GetEntryResponse`
- `AcceptedEntryView`
- `RevisionTargetProof`
- patient-ledger initialization via `with_patient_ledger(...)`
- per-patient idempotency record tracking keyed by `client_request_id`

## Semantics now covered

- `AppendClaim` appends base non-revision Claims only.
- `AppendRevisionClaim` requires a correction target and reuses `ledger-core` revision admission proof.
- Returned `AcceptedEntryView` includes Claim id, Record hash, Entry hash, seq, accepted_at, batch id, previous-entry hash, head hash, and accepted Claim JSON.
- Same `client_request_id` + same operation + same canonical payload returns the original accepted response as an idempotent replay.
- Same `client_request_id` with a different payload/operation rejects with `IDEMPOTENCY_CONFLICT`.
- `GetEntry` can fetch by Claim id or Record hash.
- Append order is per-patient and deterministic in tests through the kernel `StoreClock`.

## Verification

Passed:

- `cd pi-ledger && cargo test -p clinical-truth-service` — 10/10
- `cd pi-ledger && cargo test` — workspace 143/143
- `git diff --check`

Evidence files:

- `evidence/g005-service-core-append-tests.txt`
- `evidence/g005-pi-ledger-workspace-test.txt`
