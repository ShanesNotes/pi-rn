# Kernel consumer contract inventory

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

3, 4, 5, 6, 7, 8, 17, 18, 19, 22

## What to build

After the `pi-ledger` kernel proof is stable and the K12 public append Interface is sealed, inventory the public kernel interface that a `pi-chart` adapter may consume. The output is a consumer-facing contract note, not an implementation or a request to reshape the kernel.

## Acceptance criteria

- [ ] Adds a consumer-contract inventory under `.scratch/pi-chart-pi-ledger-adapter-strategy/` using evidence from completed `pi-ledger` K0-K12 slices, including the post-bypass public append Interface.
- [ ] Names the ledger facts that `pi-chart` may rely on: claim id, content hash, shape, predicate, subject, object, valid time, recorded time, accepted time, sequence, batch id, previous-entry hash, predicate validation result, and bitemporal point-read result.
- [ ] Distinguishes stable kernel interface evidence from implementation details that chart code must not depend on.
- [ ] Identifies any missing interface evidence as follow-up `pi-ledger` triage, not as chart-side reimplementation.
- [ ] Does not import `pi-chart` schema, patient, UI, or brownfield vocabulary into `pi-ledger`.
- [ ] Does not edit product source, accepted ADRs, or lockfiles.

## Blocked by

- `.scratch/pi-ledger-claim-ledger-kernel/issues/01-k0-k2-canonical-hash.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/02-k1-minimal-claim-validation.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/03-k3-append-only-ledger.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/04-k4-predicate-registry-minimum.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/05-k5-bitemporal-read.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/06-k6-synthetic-fixture-closeout.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/07-k7-canonical-time-module.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/08-k8-typed-hash-values.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/09-k9-validated-claim-field-authority.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/10-k10-append-admission-seam.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/11-k11-revision-admission-correction-target-existence.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/12-k12-public-append-interface-quarantines-admission-bypass.md`

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart pi-ledger
```
