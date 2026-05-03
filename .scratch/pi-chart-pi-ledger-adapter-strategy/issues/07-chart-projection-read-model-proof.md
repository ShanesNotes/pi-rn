# Chart projection read-model proof

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

5, 8, 9, 10, 17, 18, 19, 26, 29

## What to build

Create a narrow chart-visible projection from ledger-backed translated claims. The completed slice should demonstrate that chart workflows can read a ledger-backed clinical fact through a stable projection without depending on ledger storage details.

## Acceptance criteria

- [ ] Starts with failing tests that exercise ledger fixture input through the adapter into a chart-visible projection or read model.
- [ ] The projection exposes clinical meaning plus ledger identity references without requiring callers to inspect raw ledger entries.
- [ ] The projection preserves valid-time and known-time metadata enough for later bitemporal behavior.
- [ ] The projection is deterministic and rebuildable from the same ledger fixture input.
- [ ] The implementation remains read-only and does not migrate or mutate current patient directories.
- [ ] Tests verify external behavior, not private helper layout.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/06-readonly-claim-translation-proof.md`

## Closeout commands

```bash
cd pi-ledger && cargo test --workspace
cd pi-chart && npm test
cd pi-chart && npm run typecheck
cd pi-chart && npm run check
```
