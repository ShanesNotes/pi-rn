# deterministic Claim fixture Locality for public examples

Status: completed
Type: AFK
Resolution: implemented and verified 2026-06-11; fixture helpers shipped in `ledger-core::fixture`.

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## What to build

Consolidate repeated deterministic synthetic Claim construction used by tests and public examples so Claim shape knowledge lives in one fixture **Module** instead of being copied across Query, Ledger, Admission, and public Interface tests.

This should improve test **Locality** without creating a production Claim builder or changing accepted Claim semantics.

## Acceptance criteria

- [x] Inventories repeated synthetic Claim JSON or fixture construction across `ledger-core` tests.
- [x] Moves repeated happy-path Claim setup behind deterministic test/example fixture helpers.
- [x] Keeps fixture examples on safe Append admission and Revision admission paths.
- [x] Does not introduce a production Claim builder unless a failing test proves a public need.
- [x] Preserves existing canonicalization, hash, append, admission, revision, fixture, and Query behavior.
- [x] Makes future public Interface examples shorter and less dependent on raw JSON shape details.
- [x] Records closeout verification commands and evidence.

## Blocked by

- `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md`

## User stories covered

PRD stories 8, 10, 11, 12, and 13.

## Fixture construction inventory

Repeated synthetic Claim construction exists in these areas:

- `canonical.rs`, `claim.rs`, and `predicates.rs` keep local raw JSON helpers for low-level validation/canonicalization negative tests. Those are intentionally close to the tested rules because they mutate malformed fields.
- `ledger.rs` keeps local helpers for admission, corrupt-entry, and rebuild tests. Many are intentionally tailored to storage or failure cases.
- `query.rs` keeps local helpers for trusted-entry projection and corrupt-entry tests. Query remains a trusted-entry projection and should not learn Admission internals.
- `tests/public_append_interface.rs` had duplicated happy-path observation/correction Claim JSON even though public examples should teach fixture reuse and safe Admission paths.
- `fixture.rs` already owned the deterministic Phase 1 generated Claim package, but its observation/correction builders were private and could not be reused by public examples.

Decision: centralize the happy-path public/example observation and correction Claim setup in the `fixture` Module now, while leaving intentionally malformed or module-specific negative-test helpers local until later issues prove a safe deeper refactor.

## Implementation notes

- Added `fixture::fixture_observation_claim` and `fixture::fixture_correction_claim` as deterministic kernel fixture/example helpers.
- Documented those helpers as generated fixture utilities, not a production Claim builder or clinical ontology.
- Rewired the Phase 1 fixture and public append examples to use the shared fixture helpers.
- Updated `pi-ledger/docs/ledger-core-public-interface.md` to list the helpers under test/example utilities, explicitly not Adapter contracts.
- Added `public_examples_use_fixture_helpers_instead_of_local_claim_json_builders` so public Interface examples do not drift back to local raw JSON builders.
- Kept the K12 public examples on the safe paths: base Claims through Append admission, correction Claims through Revision admission.

## Closeout evidence

- `timeout 20s omx explore --prompt "In pi-ledger/crates/ledger-core, identify repeated synthetic Claim JSON construction in tests/examples and summarize fixture.rs helper surface. Read-only lookup only."` — no usable output before timeout; proceeded with direct source inventory.
- `cd pi-ledger && cargo test -p ledger-core public_examples -- --nocapture` — PASS, 1 public-example fixture-locality guard.
- `cd pi-ledger && cargo test -p ledger-core k12 -- --nocapture` — PASS, 3 safe public append path tests.
- `cd pi-ledger && cargo test -p ledger-core fixture -- --nocapture` — PASS, 17 fixture-related tests plus public-example guard.
- `cd pi-ledger && cargo fmt --all -- --check` — PASS.
- `cd pi-ledger && cargo test --workspace` — PASS, 123 tests total: 118 unit tests plus 5 public append/interface tests.
- `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
- `cd pi-ledger && git diff --check` — PASS.

## Boundary confirmation

- No production Claim builder introduced; helpers remain under the fixture/example Module and are documented as non-production.
- No chart-specific types, chart patient fixture assumptions, generated UI artifacts, hidden simulator details, or `pi-agent` runtime assumptions added.
- No Query admission authority added.
- No behavior changes to canonicalization, hash, append, admission, revision, fixture, or Query semantics.

## Comments

### 2026-05-06 `$code-review` closeout

Verdict: COMMENT.

- Code/spec/security lane: APPROVE; no severity-rated findings.
- Architecture lane: WATCH; `ledger_core::fixture` remains public while docs mark fixture helpers as test/example utilities, not Adapter contracts.
- Issue 02 remains merge-ready as a narrow fixture-locality slice because examples still validate, pass Append admission, and use Revision admission before append.
- Follow-up gate confirmed: `07-fixture-export-quarantine-and-adapter-api-boundary-tests.md` must close before any Adapter treats `ledger-core` as production-facing API.
