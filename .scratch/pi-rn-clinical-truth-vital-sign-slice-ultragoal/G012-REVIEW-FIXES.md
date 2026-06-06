# G012 review fixes

Independent `code-reviewer` returned REQUEST CHANGES and `architect` returned WATCH. Fixes applied:

1. **Atomic service append around WAL persistence**
   - `ClinicalTruthService` now stages appends on a cloned ledger, persists the accepted entry, and commits the staged ledger only after storage succeeds.
   - Regression: `file_wal_append_failure_does_not_mutate_ledger_or_consume_clock`.

2. **Durable WAL idempotency replay**
   - WAL records include `operation`, `client_request_id`, `payload_fingerprint`, and optional `target_proof`.
   - Rehydration restores idempotency records before accepting new writes.
   - Regression: `file_wal_persists_replays_and_rehydrates_patient_ledger` now verifies same-request replay and same-key conflict after restart.

3. **Exact get-entry selector semantics**
   - `GetEntry` requires at least one selector and treats `claim_id + record_hash` as an AND identity check.
   - Regression: `get_entry_fetches_by_claim_id_record_hash_or_exact_pair`.

4. **Fail-closed WAL metadata parsing**
   - `entry_version` uses checked `u32::try_from`.
   - Regression: `file_wal_replay_rejects_entry_version_overflow`.

5. **Adapter fake boundary**
   - Removed `createFakeClinicalTruthBackendClient` from `pi-chart/src/index.ts` package-root exports; tests still import it directly from the adapter module.

6. **Source-context semantics**
   - Documented `source_context` as transport-only diagnostic context; durable provenance remains future explicit Claim/evidence modeling or versioned service metadata.

Verification evidence:
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g012-harness-post-review-fixes.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g012-pi-ledger-cargo-test-post-review-fixes.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g012-pi-chart-npm-test-post-review-fixes.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g012-service-core-clippy-post-review-fixes.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g012-diff-check-post-review-fixes.txt`
