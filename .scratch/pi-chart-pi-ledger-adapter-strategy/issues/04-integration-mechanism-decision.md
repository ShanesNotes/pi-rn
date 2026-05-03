# Integration mechanism decision

Status: needs-triage
Type: HITL

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

5, 6, 10, 21, 22, 23

## What to build

Prepare and record the decision for how `pi-chart` will consume `pi-ledger` across the Rust/TypeScript boundary. This slice is HITL because the mechanism affects packaging, latency, developer ergonomics, and future deployment shape.

## Acceptance criteria

- [ ] Adds an options note under `.scratch/pi-chart-pi-ledger-adapter-strategy/` comparing at least library binding, command/process boundary, generated JSON fixture exchange, and WebAssembly.
- [ ] Evaluates each option against latency, determinism, AFK development ergonomics, testability, packaging risk, Rust-first kernel purity, and future container/runtime implications.
- [ ] Recommends a first adapter mechanism and explicitly names rejected alternatives with reasons.
- [ ] Records the human-selected mechanism in a durable issue comment, `.scratch` decision note, or ADR path chosen by the maintainer.
- [ ] Does not implement the selected mechanism in this slice.
- [ ] Does not add dependencies, generated schemas, product source, lockfile changes, or runtime scripts.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-kernel-consumer-contract-inventory.md`

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart pi-ledger
```
