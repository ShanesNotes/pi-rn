# Ledger golden-vector compatibility harness

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

7, 8, 10, 14, 15, 26, 28

## What to build

Build the first executable adapter proof: `pi-chart` consumes deterministic `pi-ledger` golden-vector evidence through the selected boundary mechanism and verifies stable ledger identity without migrating current patients or importing hidden simulator state.

## Acceptance criteria

- [ ] Starts with failing chart-side tests that consume deterministic `pi-ledger` fixture or golden-vector output through the selected mechanism.
- [ ] Verifies exact preservation of claim id and `sha256:<64 lowercase hex>` content hash across the adapter boundary.
- [ ] Verifies property-order-invariant canonical hash evidence is treated as ledger evidence, not recomputed by chart-local kernel code unless explicitly required by the selected mechanism.
- [ ] Uses synthetic ledger fixtures only; no current patient directories, chart schemas as kernel authority, or hidden `pi-sim` internals.
- [ ] Keeps adapter implementation narrow and read-only.
- [ ] Does not implement migration, write authority, FHIR/openEHR export, access plane, runtime orchestration, or UI workflows.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-kernel-consumer-contract-inventory.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/04-integration-mechanism-decision.md`

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
cd pi-chart && npm test
cd pi-chart && npm run typecheck
cd pi-chart && npm run check
```
