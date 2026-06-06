AI SLOP CLEANUP REPORT
======================

Scope: G012 ultragoal-owned files only; scope list captured in `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/ai-slop-cleaner-scope.txt`.

Behavior Lock: Before cleanup, `g012-harness-pre-cleaner.txt`, `g012-pi-ledger-cargo-test-pre-cleaner.txt`, `g012-pi-chart-npm-test-pre-cleaner.txt`, and `g012-diff-check-pre-cleaner.txt` were green. The service-core test suite also locked the newly closed stale revision-target hash case.

Cleanup Plan:
1. Resolve fallback-like findings before style changes.
2. Delete or avoid dead/speculative paths; do not widen scope.
3. Repair naming/error-handling issues surfaced by static checks.
4. Reinforce tests only where behavior was under-specified.

Fallback Findings:
- `createFakeClinicalTruthBackendClient`: grounded test fake behind an explicit injected backend seam; used by adapter tests and documented as test-only.
- `WalDurability::TestModeNoFsync`: grounded durability test boundary; production default remains `Fsync`, WAL tests cover no-fsync behavior explicitly.
- `AppendLedger` admission bypass references in docs/tests: pre-existing, intentionally loud kernel test/trusted-entry vocabulary; not introduced as an adapter-facing path.
- Test `unwrap()`/generator `expect()`: acceptable fail-fast test/generator assertions, not production fallback masking.

UI/Design Findings: N/A; no UI surface edited in this slice.

Passes Completed:
- Fallback-like code resolution gate: no masking fallback slop found.
1. Pass 1: Dead code deletion - no dead G012 code found.
2. Pass 2: Duplicate removal - no safe duplicate-removal pass found without widening scope.
3. Pass 3: Naming/error handling cleanup - closed stale revision-target hash mapping so right-id/wrong-hash now returns `REVISION_TARGET_HASH_MISMATCH`; collapsed clippy-reported registry-version conditionals; documented the intentional large structured `ErrorDetail` service contract.
4. Pass 4: Test reinforcement - added service-core regression coverage for stale revision target hash mismatch.

Quality Gates:
- Regression tests: PASS (`cargo test -p clinical-truth-service`, harness pre-cleaner)
- Lint/static: PASS (`cargo clippy -p clinical-truth-service --all-targets -- -D warnings`)
- Typecheck: PASS (`npm --prefix pi-chart run typecheck` via harness)
- Tests: PASS (`cargo test --manifest-path pi-ledger/Cargo.toml`; `npm test` in `pi-chart`)
- Boundary scan: PASS (harness hidden-sim/direct-service/hash-authority scans)

Changed Files:
- `pi-ledger/crates/clinical-truth-service/src/lib.rs` - added stale target hash mismatch mapping/regression, collapsed clippy conditionals, documented intentional structured error size.

Fallback Review:
- Findings: test fake backend, explicit no-fsync test mode, documented kernel admission bypass vocabulary, test/generator fail-fast assertions.
- Classification: grounded compatibility/test/fail-safe boundaries; no masking fallback slop.
- Escalation Status: none.

Remaining Risks:
- Production transport/auth, production registry governance, durable storage choice beyond the file/WAL prototype, and multi-provider clinical workspace authorization remain intentionally out of scope for this first vital-sign slice.

Post-review cleanup addendum
----------------------------
Independent review found durability/idempotency/get-entry/fake-export issues. Follow-up cleanup/fix pass:
- Staged service-core ledger append before WAL persistence so failed storage writes do not mutate in-memory ledger or consume accepted_at clock values.
- Added durable WAL request-id metadata and replay restoration for idempotent same-request responses/conflict detection after restart.
- Tightened `GetEntry` to require exact AND matching when both `claim_id` and `record_hash` are supplied.
- Made WAL `entry_version` overflow fail closed instead of truncating.
- Removed the test fake backend from the pi-chart package-root export.
- Documented `source_context` as transport-side diagnostic context, not durable clinical truth.

Post-review verification:
- PASS: `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/verify-vital-sign-slice.sh` (`g012-harness-post-review-fixes.txt`)
- PASS: `cargo test --manifest-path pi-ledger/Cargo.toml` (`g012-pi-ledger-cargo-test-post-review-fixes.txt`)
- PASS: `npm test` in `pi-chart` (`g012-pi-chart-npm-test-post-review-fixes.txt`)
- PASS: `cargo clippy -p clinical-truth-service --all-targets -- -D warnings` (`g012-service-core-clippy-post-review-fixes.txt`)
- PASS: `git diff --check` (`g012-diff-check-post-review-fixes.txt`)
