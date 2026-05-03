# Promote claim-ledger kernel plan into active issue slices

Status: ready-for-human
Retargeting note: superseded for implementation by `.scratch/pi-ledger-claim-ledger-kernel/` after ADR 020 and `pi-ledger` ADR 001.

## Parent

`.scratch/pi-chart-v0-5/PRD.md`

## What to build

This pre-`pi-ledger` issue records the reviewed OMX Phase 1 claim-ledger kernel handoff. Implementation has been retargeted to `.scratch/pi-ledger-claim-ledger-kernel/`; use this issue as lineage evidence only.

## Acceptance criteria

- [ ] Dedicated workstream exists at `.scratch/pi-ledger-claim-ledger-kernel/` with PRD and test spec mirrors.
- [ ] Source PRD/test-spec/review paths are linked from each issue slice.
- [ ] Each issue is a thin vertical slice with behavior-oriented acceptance criteria.
- [ ] Dependencies match K0-K6 ordering.
- [ ] Source implementation remains locked until issue slices are reviewed.
- [ ] Slices explicitly use Matt `$tdd` discipline.

## Blocked by

- `.scratch/pi-chart-v0-5/issues/01-normalize-project-artifact-authority.md`


## Proposed workstream slices

The agreed TDD vertical issue shape is:

1. `.scratch/pi-ledger-claim-ledger-kernel/issues/01-k0-k2-canonical-hash.md`
2. `.scratch/pi-ledger-claim-ledger-kernel/issues/02-k1-minimal-claim-validation.md`
3. `.scratch/pi-ledger-claim-ledger-kernel/issues/03-k3-append-only-ledger.md`
4. `.scratch/pi-ledger-claim-ledger-kernel/issues/04-k4-predicate-registry-minimum.md`
5. `.scratch/pi-ledger-claim-ledger-kernel/issues/05-k5-bitemporal-read.md`
6. `.scratch/pi-ledger-claim-ledger-kernel/issues/06-k6-synthetic-fixture-closeout.md`

K0 and K2 are intentionally merged so canonicalization is proven by executable hash behavior rather than a doc-only issue.


## Human review note

The dedicated workstream, PRD/test-spec mirrors, six issue slices, implementation home, guardrail standard, and K0 readiness gate now exist. K0+K2 was unblocked and implementation moved to `pi-ledger`. This issue remains `ready-for-human` so a reviewer can confirm the broader K1-K6 decomposition before additional slices become `ready-for-agent`.
