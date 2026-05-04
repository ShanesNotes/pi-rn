# K8 typed hash values for Record and Entry hashes

Status: ready-for-human
Type: AFK
Resolution: implemented; merge/admin close pending human confirmation.

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

Related decisions:
- `pi-ledger/CONTEXT.md`
- `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md`
- `pi-ledger/docs/adr/002-canonical-utc-time-input-invariant.md`
- `pi-ledger/docs/adr/003-typed-hash-value-module.md`

## What to build

Deepen hash identity into a dedicated kernel `hash` Module so Record hash and Entry hash parsing, formatting, validation, and digest construction are owned by one reusable rule instead of being duplicated across Claim, Ledger, Query, and Canonicalization code.

This slice must preserve existing K0-K7 behavior while making the hash boundary explicit: Record hash proves canonical Claim record content and participates in Claim correction links; Entry hash proves ledger entry envelope content and participates in append-chain/head validation.

## Acceptance criteria

- [x] Starts with failing Rust tests for the new public hash Module contract: valid `sha256:<64 lowercase hex>` strings parse for both `RecordHash` and `EntryHash`; missing prefix, wrong length, uppercase hex, and non-hex characters are rejected deterministically.
- [x] Starts with a failing Rust integration/regression test proving `canonical::record_hash(value)` returns a typed `RecordHash` with the same golden-vector string as K0/K2.
- [x] Starts with a failing Rust regression test proving Claim correction target hash validation uses the shared `RecordHash` rule rather than a Claim-local parser.
- [x] Starts with a failing Rust regression test proving Ledger entry hash construction/validation uses `EntryHash` for entry/previous/head hashes and `RecordHash` for record hashes at the recomputation boundary.
- [x] Adds `pi-ledger/crates/ledger-core/src/hash.rs` and exposes it from `ledger-core` with the minimal `pub mod hash;` surface.
- [x] `hash.rs` owns shared `sha256:<64 lowercase hex>` validation, parse, `as_str()`, owned `String` conversion, and digest-to-prefixed-lowercase-hex construction.
- [x] Provides distinct public value types for `RecordHash` and `EntryHash`; they may share private helpers, but must be separate public structs rather than type aliases.
- [x] `canonical::record_hash(value)` returns `RecordHash` rather than raw `String`, while preserving existing canonical record-hash semantics including exclusion of top-level `integrity.hash` and `integrity.signature` only.
- [x] `claim.rs` removes Claim-local `RecordHash` parsing ownership and validates `revises.target.hash` through the shared `hash::RecordHash` rule.
- [x] `ledger.rs` uses `RecordHash` for record-hash recomputation and `EntryHash` for entry, previous-entry, and head-hash recomputation/validation before comparing or storing string fields.
- [x] `query.rs` correction hiding parses `revises.target.hash` through `hash::RecordHash` before comparing targets, and does not introduce a second raw hash validator.
- [x] Module-specific outer errors remain useful to callers; shared hash failures may be mapped into Claim/Ledger/Query errors without string matching.
- [x] Public serialization/storage boundaries may still expose strings where appropriate, but conversion into kernel behavior must pass through typed hash values.
- [x] No changes to hash algorithm, hash prefix, canonicalization id, JCS/I-JSON rules, correction semantics, predicate policy, time semantics, storage backend, signatures, key management, `pi-chart` adapters, hidden `pi-sim` internals, or production backend are introduced.
- [x] Existing K0-K7 tests remain green, including canonical golden vectors, K3 chain validation/rebuild tests, K5 correction visibility, K6 fixture proof, and K7 canonical time tests.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K0-K7 are complete, and ADR 003 records the typed hash value decision.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git diff --check
git status --short
```

## Guardrail application

- Protects: claim id plus Record hash identity, append-chain Entry hash integrity, deterministic hash encoding, and adapter/kernel separation.
- Source: `pi-ledger` CONTEXT; ADR 001; ADR 003; K0/K2 canonical hash tests; K3 ledger chain tests; K5 correction target behavior.
- Not imported: `pi-chart` source/patient directories, hidden `pi-sim` internals, signatures/key management, storage backend, CAS/blockchain anchoring, FHIR/openEHR model commitments, access-plane/runtime/orchestrator policy.

## Implementation notes

- Prefer a small private helper in `hash.rs` for shared validation/formatting, with thin distinct wrappers for `RecordHash` and `EntryHash`.
- Avoid introducing a generic public hash type unless it remains impossible for callers to mix Record hash and Entry hash by accident.
- Keep `canonical.rs` responsible for which canonical bytes are hashed; keep `hash.rs` responsible for turning digest bytes or strings into typed hash values.
- Preserve existing JSON snapshot field names (`record_hash`, `previous_entry_hash`, `entry_hash`, `head_hash`) unless tests prove an API-breaking change is explicitly necessary.
- Expected code touch scope: `pi-ledger/crates/ledger-core/src/hash.rs`, `lib.rs`, `canonical.rs`, `claim.rs`, `ledger.rs`, `query.rs`, and this issue closeout section only.
- Do not edit `pi-chart`, `pi-sim`, `pi-agent`, generated design artifacts, overview HTML files, or unrelated `.scratch` workstreams.

## Closeout evidence

- Baseline before K8 source edits: `cd pi-ledger && cargo test --workspace` — PASS, 86 tests.
- Red evidence: `cd pi-ledger && cargo test -p ledger-core t_k8 -- --nocapture` initially failed before implementation because `canonical::record_hash` still returned `String` instead of `RecordHash`, and `LedgerError` had no typed invalid-hash boundary errors (`InvalidRecordHash`, `InvalidEntryHash`, `InvalidHeadHash`).
- Green focused evidence: `cd pi-ledger && cargo test -p ledger-core t_k8 -- --nocapture` — PASS, 9 tests after the core K8 implementation.
- Added query coverage: `query::tests::t_k8_05_correction_hiding_requires_typed_record_hash_targets` proves correction hiding does not compare malformed raw hash strings.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 96 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git diff --check` — PASS.
  - `git status --short` — checked before commit; only K8 files staged, with unrelated dirty/untracked files preserved.
- Manual confirmations:
  - `RecordHash` and `EntryHash` are distinct public structs in `ledger-core::hash`.
  - Public JSON snapshot/storage fields remain strings, while Claim/Ledger/Query behavior parses through typed hash values before comparing or recomputing.
  - No changes to hash algorithm, `sha256:` prefix, canonicalization id, JCS/I-JSON policy, correction semantics, predicate policy, time semantics, storage backend, signatures/key management, `pi-chart`, hidden `pi-sim`, or production backend.
