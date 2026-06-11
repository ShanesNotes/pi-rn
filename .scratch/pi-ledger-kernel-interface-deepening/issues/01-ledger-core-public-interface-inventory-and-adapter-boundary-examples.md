# ledger-core public Interface inventory and Adapter boundary examples

Status: completed
Type: AFK
Resolution: implemented in `pi-ledger/docs/ledger-core-public-interface.md` and integration tests.

## Parent

`.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

Related decisions:
- `pi-ledger/CONTEXT.md`
- `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md`
- `pi-ledger/docs/adr/004-validated-claim-field-authority.md`
- `pi-ledger/docs/adr/005-append-admission-separates-predicate-policy.md`
- `pi-ledger/docs/adr/006-revision-admission-proves-correction-target-existence.md`
- `pi-ledger/docs/adr/007-admission-bypass-is-test-only.md`
- `pi-ledger/docs/adr/008-kernel-public-interface-inventory-before-adapters.md`

## What to build

Publish a small `ledger-core` public **Interface** inventory that tells future **Adapters** which kernel paths are safe to call and which paths are internal, trusted rebuild, or test-only.

The inventory should be written for two readers: a clinical project owner who needs to understand the safety path, and an AFK implementation agent that needs exact Rust-facing boundaries. It should not implement a `pi-chart` adapter.

## Acceptance criteria

- [x] Adds or updates a `pi-ledger` documentation page that inventories the adapter-facing `ledger-core` Interface after K12.
- [x] Separates safe public consumer paths from trusted rebuild paths, test-only seams, and internal Implementation details.
- [x] Names the safe lifecycle: Ledger-acceptable Claim, Validated Claim, Append-admissible Claim, Revision-admissible Claim, Append ledger, Query point read.
- [x] Documents that base Claims append through Append admission and correction Claims append through Revision admission.
- [x] Documents that Admission bypass support is test-only and not an Adapter contract.
- [x] Includes at least one public example or regression guard proving examples use safe public append paths rather than bypass append.
- [x] Does not add chart-specific types, patient fixture assumptions, generated UI artifacts, hidden simulator details, or `pi-agent` runtime assumptions.
- [x] Leaves current K0-K12 behavior unchanged.
- [x] Records closeout verification commands and evidence.

## Blocked by

None — K12 is complete, and ADR 008 records the Interface-inventory decision.

## User stories covered

PRD stories 1, 2, 3, 4, 10, 12, 14, and 15.

## Implementation notes

- Added `pi-ledger/docs/ledger-core-public-interface.md` as the post-K12 adapter-readiness Interface inventory.
- Updated `pi-ledger/README.md` to stop describing `ledger-core` as only a scaffold and to link the Interface inventory.
- Updated `ledger-core` crate docs to name the safe append lifecycle.
- Added `interface_inventory_docs_name_safe_paths_and_bypass_boundary` to `public_append_interface.rs` so the docs keep naming the safe lifecycle, `from_snapshot`, test-only Admission bypass boundary, and cross-subproject non-coupling rules.
- Reused the existing K12 public examples for base Append admission and correction Revision admission as the safe-path behavior proof.

## Closeout evidence

- `cd pi-ledger && cargo fmt --all -- --check` — PASS after formatting.
- `cd pi-ledger && cargo test -p ledger-core interface_inventory -- --nocapture` — PASS, 1 Interface inventory doc guard.
- `cd pi-ledger && cargo test -p ledger-core k12 -- --nocapture` — PASS, 3 safe public append path tests.
- `cd pi-ledger && cargo test --workspace` — PASS, 122 tests total: 118 unit tests plus 4 public append/interface tests.
- `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
- `cd pi-ledger && git diff --check` — PASS.
- `git status --short -- .scratch/pi-ledger-kernel-interface-deepening pi-ledger/README.md pi-ledger/crates/ledger-core/src/lib.rs pi-ledger/crates/ledger-core/tests/public_append_interface.rs pi-ledger/docs/adr/008-kernel-public-interface-inventory-before-adapters.md pi-ledger/docs/ledger-core-public-interface.md` — checked own paths only; unrelated staged `pi-chart` work remains untouched.

## Boundary confirmation

- No `pi-chart` adapter implementation.
- No chart brownfield source, patient directory, generated UI artifact, or `EventEnvelope` dependency.
- No hidden `pi-sim` internal dependency.
- No `pi-agent` runtime dependency or direct agent write policy.
- No behavior expansion beyond docs, crate docs, README link, and Interface inventory regression guard.

## Comments

### 2026-05-06 `$code-review` closeout

Verdict: COMMENT.

- Code/spec/security lane: APPROVE; no severity-rated findings.
- Architecture lane: WATCH; fixture helpers are public Rust exports while the Interface inventory labels them as test/example utilities, not Adapter contracts.
- Immediate doc precision fix applied in `pi-ledger/docs/ledger-core-public-interface.md`: accepted entries should not be mutated **or** treated as trusted after mutation.
- Follow-up issue created: `07-fixture-export-quarantine-and-adapter-api-boundary-tests.md`.
