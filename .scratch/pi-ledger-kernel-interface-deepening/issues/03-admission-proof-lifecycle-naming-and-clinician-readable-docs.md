# Admission proof lifecycle naming and clinician-readable docs

Status: completed
Type: AFK
Resolution: implemented and verified; clinician-readable docs shipped in `pi-ledger/docs/admission-proof-lifecycle.md`.

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Make the admission proof lifecycle easier to understand in docs, examples, and test names: Ledger-acceptable Claim → Validated Claim → Append-admissible Claim → Revision-admissible Claim.

The goal is to help clinical reviewers and future agents see why each proof exists before accepted ledger history mutates.

## Acceptance criteria

- [x] Adds or updates concise docs explaining each proof step in clinician-readable language.
- [x] Aligns examples or test names with the glossary terms where this improves clarity.
- [x] Explains why base Claims require Append admission and correction Claims require Revision admission.
- [x] Explains that Known time, sequence, Record hash, Entry hash, previous-entry link, and ledger head remain Append ledger authority.
- [x] Does not change clinical policy, correction conflict policy, or adapter behavior.
- [x] Preserves all K0-K12 behavior.
- [x] Records closeout verification commands and evidence.

## Blocked by

- `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md`

## User stories covered

PRD stories 1, 3, 4, 7, 9, 11, and 14.

## Implementation notes

- Added `pi-ledger/docs/admission-proof-lifecycle.md` as a clinician-readable lifecycle reference.
- Linked the lifecycle reference from `pi-ledger/README.md`, `pi-ledger/docs/ledger-core-public-interface.md`, and crate-level docs.
- Documented each proof step in plain language: Ledger-acceptable Claim, Validated Claim, Append-admissible Claim, Revision-admissible Claim, and Append ledger entry.
- Documented why base Claims require Append admission and correction Claims require Revision admission.
- Documented that Known time, sequence, batch id, Record hash, Entry hash, previous-entry link, and ledger head remain Append ledger authority.
- Renamed the public example tests to carry the lifecycle terms:
  - `k12_public_base_claim_moves_from_validated_to_append_admissible_before_append`
  - `k12_public_correction_claim_moves_from_append_admissible_to_revision_admissible_before_append`
- Added `admission_lifecycle_docs_explain_proof_steps_and_append_ledger_authority` so lifecycle docs keep the proof-step and Append ledger authority vocabulary.

## Closeout evidence

- `cd pi-ledger && cargo fmt --all -- --check` — PASS.
- `cd pi-ledger && cargo test -p ledger-core admission_lifecycle -- --nocapture` — PASS, 1 lifecycle documentation guard.
- `cd pi-ledger && cargo test -p ledger-core k12 -- --nocapture` — PASS, 3 K12 public Interface/safe path tests.
- `cd pi-ledger && cargo test -p ledger-core public_examples -- --nocapture` — PASS, 1 public-example fixture-locality guard.
- `cd pi-ledger && cargo test --workspace` — PASS, 124 tests total: 118 unit tests plus 6 public append/interface/lifecycle tests.
- `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
- `cd pi-ledger && git diff --check` — PASS.

## Boundary confirmation

- No clinical correction conflict policy, replacement policy, latest-correction-wins rule, or adapter behavior changed.
- No `pi-chart` code, chart patient data, generated UI artifact, hidden simulator detail, or `pi-agent` runtime assumption added.
- No production write-authority policy added.
- This slice changed docs, test names, and documentation guards only; kernel behavior remains unchanged.

## Comments

### 2026-05-06 `$code-review` fix closeout

Verdict after fix: APPROVE pending final commit verification.

- Code-review finding fixed: `pi-ledger/docs/ledger-core-public-interface.md` no longer says the kernel accepts "clinical facts" or "clinical truth".
- Replacement wording says the kernel accepts **clinical assertions into ledger history** and that new **accepted ledger history** enters through proof steps.
- Regression guard added in `public_append_interface.rs` so the Interface inventory must keep assertion/history wording and must not reintroduce "clinical facts" or "clinical truth" overclaim language.
