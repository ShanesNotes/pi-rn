# Implement V0.5 claim-ledger kernel with TDD

Status: needs-triage
Retargeting note: kernel implementation now proceeds through `.scratch/pi-ledger-claim-ledger-kernel/`, not this front-door placeholder.

## Parent

`.scratch/pi-chart-v0-5/PRD.md`

## What to build

Historical placeholder for implementing the approved V0.5 claim-ledger kernel issue slices using one behavior test at a time. The active implementation gate moved to `.scratch/pi-ledger-claim-ledger-kernel/`.

## Acceptance criteria

- [ ] Implementation starts only after issue 03 creates approved K0-K6 slices.
- [ ] Each slice starts with a failing behavior test through a public interface.
- [ ] No current `patients/` migration is included.
- [ ] No hidden `pi-sim` internals are read.
- [ ] Verification evidence is appended to the relevant issue comments or final handoff.

## Blocked by

- `.scratch/pi-chart-v0-5/issues/03-promote-claim-ledger-kernel-plan.md`
