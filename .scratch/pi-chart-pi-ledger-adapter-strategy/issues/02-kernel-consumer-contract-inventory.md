# Kernel consumer contract inventory

Status: completed
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

3, 4, 5, 6, 7, 8, 17, 18, 19, 22

## What to build

After the `pi-ledger` kernel proof is stable and the K12 public append Interface is sealed, inventory the public kernel interface that a `pi-chart` adapter may consume. The output is a consumer-facing contract note, not an implementation or a request to reshape the kernel.

## Acceptance criteria

- [x] Adds a consumer-contract inventory under `.scratch/pi-chart-pi-ledger-adapter-strategy/` using evidence from completed `pi-ledger` K0-K12 slices, including the post-bypass public append Interface.
- [x] Names the ledger facts that `pi-chart` may rely on: claim id, content hash, shape, predicate, subject, object, valid time, recorded time, accepted time, sequence, batch id, previous-entry hash, predicate validation result, and bitemporal point-read result.
- [x] Distinguishes stable kernel interface evidence from implementation details that chart code must not depend on.
- [x] Identifies any missing interface evidence as follow-up `pi-ledger` triage, not as chart-side reimplementation.
- [x] Does not import `pi-chart` schema, patient, UI, or brownfield vocabulary into `pi-ledger`.
- [x] Does not edit product source, accepted ADRs, or lockfiles.

## Blocked by

- K0–K12 kernel slices (shipped); kernel-deepening issue 07 quarantine (completed 2026-06-11).

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart pi-ledger
```

## Comments

- 2026-06-11: Delivered `kernel-consumer-contract-inventory.md`. Adapter implementation remains gated on PredicateRegistry, canonicalization-id agreement, and HITL mechanism decision (issue 04).