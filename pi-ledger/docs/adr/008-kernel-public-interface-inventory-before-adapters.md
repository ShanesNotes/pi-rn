# ADR 008 — Kernel public Interface inventory before adapters

Date: 2026-05-06
Status: accepted
Decision maker: autonomous agent execution under maintainer direction for no-sacred-cows pi-ledger refinement.
Related:
- `../../CONTEXT.md`
- `001-reusable-claim-ledger-kernel.md`
- `004-validated-claim-field-authority.md`
- `005-append-admission-separates-predicate-policy.md`
- `006-revision-admission-proves-correction-target-existence.md`
- `007-admission-bypass-is-test-only.md`
- `../../../.scratch/pi-ledger-kernel-interface-deepening/PRD.md`

## Context

K0-K12 moved `pi-ledger` from foundation proof into a safer adapter-ready kernel shape. The most important K12 outcome is that Admission bypass append support is no longer part of the production public Interface.

The `pi-chart` v0.5 rebase can now begin learning from `pi-ledger`, but a future Adapter should not infer the contract from every exported Rust item, fixture helper, or test setup path. Without an explicit inventory, agents may treat shallow Implementation details as adapter contracts and accidentally reintroduce chart-specific assumptions or unsafe append paths.

## Decision

Before adapter implementation depends on `ledger-core`, `pi-ledger` should publish and test a small public Interface inventory.

The inventory should separate:

- safe public consumer paths for Claim validation, Append admission, Revision admission, append, hash/time values, and point reads;
- trusted rebuild paths such as snapshot reconstruction and chain/head validation;
- test-only seams, especially Admission bypass support;
- internal Implementation details that are not adapter promises.

This Interface inventory is the first slice of the next kernel deepening phase. It should increase **Leverage** for adapters by making the correct seam easy to find, and increase **Locality** by keeping later Query, fixture, snapshot, and error-vocabulary refinements inside `pi-ledger`.

## Rejected

- Starting `pi-chart` adapter implementation from scattered `ledger-core` exports. This is rejected because it turns accidental public surface area into contract by imitation.
- Treating K12 as sufficient adapter guidance without a public Interface inventory. K12 removed the most dangerous bypass, but it did not document the full safe consumer path.
- Creating a broad facade or new abstraction layer before inventory. This is rejected because the current problem is contract clarity, not proven need for another runtime layer.
- Moving adapter-specific concepts into `pi-ledger`. This is rejected because `pi-ledger` must remain independent of chart UI, brownfield source, patient directories, generated artifacts, and hidden simulator internals.

## Consequences

- The next `pi-ledger` issue should document the public Interface before deeper code cleanup.
- Future adapter work should cite the Interface inventory rather than copying private tests or fixtures.
- Query projection cleanup, snapshot/rebuild seam cleanup, fixture locality, and error vocabulary can proceed as later narrow issues.
- This ADR does not freeze every public Rust symbol forever; it establishes that adapter-facing promises must be intentional, documented, and regression-guarded.
