# K11 revision admission for correction target existence

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
- `pi-ledger/docs/adr/004-validated-claim-field-authority.md`
- `pi-ledger/docs/adr/005-append-admission-separates-predicate-policy.md`
- `pi-ledger/docs/adr/006-revision-admission-proves-correction-target-existence.md`

## What to build

Deepen the admission path so normal correction appends consume a **Revision-admissible Claim** rather than an **Append-admissible Claim** alone.

A Ledger-acceptable Claim remains the Claim validation boundary: structurally valid, canonicalizable, and hashable. An Append-admissible Claim remains the K10 boundary: a Validated Claim admitted for a target patient ledger after patient-scope and Predicate registry policy pass. K11 adds the stricter correction path: a Revision-admissible Claim is an Append-admissible correction Claim whose `revises.target` matches already accepted same-patient ledger content by Claim id plus typed Record hash.

This slice should keep Revision admission in the existing Admission module. Revision admission should inspect the current ledger/snapshot entry surface supplied by the caller, validate target candidate records as Ledger-acceptable Claims, parse stored target Record hashes, recompute target Record hashes from target record content, require stored/recomputed hash equality, and then match the correction target by Claim id plus Record hash.

Base Claims should continue to append through the Append-admissible path. Correction Claims should not silently append through the base Append-admissible path; they should require a Revision-admissible value before the Append ledger assigns store-authority metadata, consumes the store clock, computes hashes, links entries, or updates the ledger head.

## Acceptance criteria

- [x] Starts with failing Rust tests proving an Append-admissible correction Claim with a dangling `revises.target` can currently enter the ledger through the normal append path.
- [x] Starts with failing Rust tests proving an Append-admissible correction Claim with the right target id but wrong target Record hash can currently enter the ledger through the normal append path.
- [x] Starts with failing Rust tests proving the deterministic fixture correction currently uses Append admission only, not Revision admission.
- [x] Adds a Revision-admissible value under the Admission module as the normal correction-append proof value.
- [x] Adds typed Admission error cases for correction target absence, malformed stored target Record hash, and stored/recomputed target Record hash mismatch without collapsing them into brittle strings.
- [x] Revision admission consumes an Append-admissible correction Claim plus the current patient ledger entry surface supplied by the caller; it does not consume raw JSON as its primary input.
- [x] Revision admission rejects non-correction/base Claims so base Claims remain on the Append-admissible path rather than acquiring unnecessary correction-target requirements.
- [x] Revision admission rejects correction Claims whose target id/hash pair does not match any current same-patient accepted entry.
- [x] Revision admission validates candidate target records as Ledger-acceptable Claims before using their id, patient id, or Record hash as target proof.
- [x] Revision admission parses stored candidate `record_hash` values as typed Record hashes and rejects malformed stored hashes.
- [x] Revision admission recomputes candidate target Record hashes from canonical record content and rejects stored/recomputed mismatch.
- [x] Revision admission matches correction targets by candidate Claim id plus typed Record hash, not by id alone and not by Entry hash.
- [x] Revision admission does not own whole-chain/head validation; it assumes callers supply entries from the current patient ledger or a validated snapshot surface.
- [x] The preferred base-claim append API continues to consume an Append-admissible Claim and preserves existing K10/K3 append semantics for non-revision Claims.
- [x] The preferred base-claim append API refuses Claims carrying a revision target before store-clock state is consumed and before ledger entries/head mutate.
- [x] A new preferred correction-claim append API consumes a Revision-admissible Claim and preserves existing K3 metadata, typed Record hash, typed Entry hash, previous-link, and head behavior.
- [x] A valid correction Claim targeting an existing same-patient entry by id plus Record hash appends successfully through the Revision-admissible path.
- [x] A dangling correction target is rejected before append and before store-clock state is consumed.
- [x] A target with the right Claim id but wrong Record hash is rejected before append and before store-clock state is consumed.
- [x] Corrupt target-entry stored hash data used for Revision admission is rejected before append and before store-clock state is consumed.
- [x] Base Claims still append through Append admission without requiring Revision admission.
- [x] Correction Claims cannot append through the normal Append-admissible path, even if patient scope and Predicate registry policy pass.
- [x] Deterministic Phase 1 fixture generation appends base Claims through Append admission, computes the original observation target Record hash from the accepted base entry, admits the correction through Revision admission against current ledger entries, and appends via the Revision-admissible API.
- [x] Representative ledger tests use the safe base or correction admission paths unless the test explicitly proves a lower-level bypass.
- [x] Any remaining public or test-visible lower-level append bypass is loudly named as omitting predicate and/or revision admission checks, for example `without_predicate_or_revision_admission` or equivalent.
- [x] Query remains a trusted-entry point-read projection and does not start validating correction target existence, ledger chain/head, or Predicate registry policy.
- [x] Snapshot re-read/head validation remains a Ledger concern and does not require a Predicate registry or Revision admission re-audit.
- [x] K11 does not implement correction conflict handling, replacement policy, clinical visibility requirements, graph-wide correction semantics, registry versioning, storage backend work, production clocks, signatures, key management, chart adapters, current patient migration, or hidden simulator coupling.
- [x] Existing K0-K10 behavior remains green, including canonical golden vectors, K3 chain validation/rebuild, K4 predicate validation, K5 correction visibility, K6 fixture proof, K7 canonical time, K8 typed hash behavior, K9 Validated Claim accessors, and K10 Append admission.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K0-K10 are complete, and ADR 006 records the Revision admission decision.

## User stories covered

- PRD stories 20-34, especially correction-target existence before append, same-patient target proof, id-plus-Record-hash matching, corrupt target hash rejection, explicit correction append API, fixture-path safety, and preserving Query/Ledger trust boundaries.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git diff --check
git status --short
```

## Guardrail application

- Protects: append-only clinical truth, correction target identity, patient-scoped ledger admission, typed Record hash boundaries, deterministic store metadata assignment, fixture safety, Query trust boundary, and adapter/kernel separation.
- Source: `pi-ledger` CONTEXT; ADR 001; ADR 002; ADR 003; ADR 004; ADR 005; ADR 006; K3 append-chain tests; K5 correction visibility tests; K6 fixture proof; K8 typed hash tests; K9 Validated Claim accessor tests; K10 append-admission tests.
- Not imported: chart source or patient directories, hidden simulator internals, FHIR/openEHR commitments, signatures/key management, CAS/blockchain anchoring, storage backend selection, access-plane/runtime/orchestrator policy, predicate registry versioning, or broad correction graph semantics.

## Implementation notes

- Prefer extending the existing Admission module rather than creating a separate Revision module for K11.
- Keep `validate_claim` as the Ledger-acceptable Claim boundary. Revision admission should rely on Validated Claim / Append-admissible field authority rather than reinterpreting correction JSON in Ledger code.
- Keep Predicate registry ownership in the Predicate module and Append admission seam; K11 should not make Append ledger own a registry.
- Keep Append ledger ownership over store-authority metadata and hash-chain mutation. Revision admission proves eligibility; it should not construct ledger entries.
- The current `AppendLedger::append_admissible` path should become base-claim-only or otherwise refuse correction Claims with a typed error before mutation. Add a separate correction path that consumes the Revision-admissible proof value.
- It is acceptable for test helpers to retain a lower-level bypass for constructing trusted-entry point-read fixtures or corrupt snapshots, but the name must make omitted predicate/revision admission checks explicit.
- Expected code touch scope: Admission, Ledger, Fixture, and tests that currently append corrections through the old path. Touch Claim, Predicate, Query, or shared test helpers only for narrow API wiring required by the Revision admission seam.
- Do not edit `pi-chart`, `pi-sim`, `pi-agent`, generated design artifacts, overview HTML files, or unrelated `.scratch` workstreams.

## Closeout evidence

- Baseline before K11 source edits: `cd pi-ledger && cargo test --workspace` — PASS, 109 tests.
- Red evidence: after adding K11 tests, `cd pi-ledger && cargo test -p ledger-core t_k11 -- --nocapture` failed because `RevisionAdmissibleClaim`, revision-specific `AdmissionError` variants, `LedgerError::RevisionAdmissionRequired`, and `AppendLedger::append_revision_admissible` did not exist.
- Green focused evidence: `cd pi-ledger && cargo test -p ledger-core t_k11 -- --nocapture` — PASS, 7 tests.
- Implementation evidence:
  - Extended `ledger-core::admission` with `RevisionAdmissibleClaim<'a>`.
  - `AppendAdmissibleClaim` now carries the captured optional `RevisionTarget` from `ValidatedClaim`.
  - Revision admission consumes an `AppendAdmissibleClaim` plus current `LedgerEntry` surface, rejects base Claims, validates target candidate records through `validate_claim`, parses stored `record_hash` through typed `RecordHash`, recomputes canonical record hashes, rejects malformed/mismatched target hash storage, and matches by target Claim id plus typed Record hash.
  - Added typed admission errors for expected correction Claim, target absence, invalid target Claim, malformed stored target Record hash, stored/recomputed target Record hash mismatch, and canonical recomputation failure.
  - `AppendLedger::append_admissible` is now base-claim-only and rejects revision-target Claims before store-clock consumption.
  - Added `AppendLedger::append_revision_admissible(&RevisionAdmissibleClaim)` for normal correction appends.
  - Renamed the lower-level bypass to `append_without_predicate_or_revision_admission`; query tests use a helper with the same loud omitted-check vocabulary.
  - `phase1_fixture()` appends base Claims through Append admission, computes the original observation Record hash from the accepted base entry, admits the correction against current ledger entries through Revision admission, then appends through the revision-admissible API.
  - Query remained a trusted-entry projection; no target-existence validation was added there.
  - Snapshot re-read still uses `AppendLedger::from_snapshot(snapshot)` without Predicate registry or Revision admission re-audit.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 116 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git diff --check` — PASS.
  - `git status --short` — checked before commit; only K11 files staged, with unrelated dirty/untracked files preserved.
- Manual confirmations:
  - No correction conflict handling, replacement policy, clinical visibility requirements, graph-wide correction semantics, registry versioning/re-audit, storage backend work, production clocks, signatures/key management, chart adapters/current-patient migration, or hidden simulator coupling introduced.
  - No `pi-chart`, `pi-sim`, `pi-agent`, generated design artifact, overview HTML, or unrelated scratch changes were staged for K11.
