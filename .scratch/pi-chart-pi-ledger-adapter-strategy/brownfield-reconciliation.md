# Brownfield claim-ledger reconciliation

Status: docs-only inventory drafted on 2026-05-03.
Related issue: `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/03-brownfield-claim-ledger-reconciliation.md`

## Purpose

This inventory classifies chart-local claim-ledger and claim-ledger-adjacent artifacts after the accepted ownership move to `pi-ledger`. It does not delete, move, or edit product source. The goal is to prevent future agents from treating chart-local prototype work as a second active cryptographic kernel.

## Authority baseline

- `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md` makes `pi-ledger` the reusable cryptographic claim-ledger kernel owner.
- `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md` supersedes ADR 019's `pi-chart/src/claim-ledger/` implementation-home detail.
- `pi-chart/CONTEXT.md` says `pi-chart` owns workflows, clinical views, adapters, and brownfield compatibility, and should consume `pi-ledger` through explicit adapters after the kernel interface is proven.
- `pi-chart/docs/architecture/source-authority.md` says ADR 020 and `pi-ledger` ADR 001 supersede the `pi-chart/src/claim-ledger/` implementation home.

## Inventory and classification

| Artifact | Classification | Rationale | Follow-up |
| --- | --- | --- | --- |
| `pi-chart/src/claim-ledger/canonical.ts` | Golden-vector / prototype evidence; not canonical kernel authority | Implements TypeScript canonicalization/hash behavior that matches the old chart-local K0 direction, but ADR 020 and `pi-ledger` ADR 001 moved kernel ownership to `pi-ledger`. | After `pi-ledger` K0+K2 evidence is reviewed, either archive as lineage/golden-vector evidence or delete through a cleanup issue. Do not import it into `pi-ledger`. |
| `pi-chart/src/claim-ledger/canonical.test.ts` | Golden-vector / prototype evidence; not active adapter test authority | Tests useful hash behaviors: canonicalization id, SHA-256 encoding, property-order invariance, self-field exclusion, unsupported-input rejection, clinical-value sensitivity, and id/hash separation. | May inform adapter golden-vector checks only after a triaged issue names the expected comparison. Otherwise archive/delete with `canonical.ts`. |
| `pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md` | Lineage and clean-canvas guardrails; path detail superseded | ADR 019 remains useful for guardrails against `EventEnvelope` retrofit, but ADR 020 supersedes its chart-local implementation home. | Cite only for guardrails, not file ownership. |
| `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md` | Current chart-side authority | States future kernel issues target `pi-ledger`; chart-local claim-ledger work is disposable prototype/golden-vector evidence until reconciled. | Keep as authority. Do not edit from this issue. |
| `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md` | Current kernel-side authority | Defines the reusable kernel's owned behavior and says `pi-chart` becomes consumer/adapter. | Keep as authority. Do not edit from this issue. |
| `.scratch/pi-chart-v0-5-claim-ledger-kernel/` | Superseded lineage evidence | Retains the prior PRD/issues and guardrails but no longer owns implementation paths. | Use for history and package-reconciliation context only. |
| `.scratch/pi-ledger-claim-ledger-kernel/` | Active kernel workstream | Owns K0-K6 Rust-first kernel implementation issues and closeout commands. | Adapter issues should wait for its evidence before implementation. |
| `pi-chart/docs/prototypes/v0-5-cockpit/adapters/pi-chart.js` | Directional prototype evidence with stale path language | Prototype comments still point future reads at `src/claim-ledger/` per ADR 019. That is now superseded for kernel ownership. | Later source-authority/prototype cleanup issue should update the wording to `pi-ledger` plus chart adapter/projection language. Do not edit in this reconciliation slice. |
| `pi-chart/docs/prototypes/v0-5-cockpit/README.md` | Directional prototype evidence with stale path language | Describes the cockpit substrate as a claim-ledger kernel under `pi-chart/src/claim-ledger/`. Useful for UI seam intent, not kernel authority. | Later cleanup issue should banner or update stale path references after adapter strategy settles. |
| `pi-chart/docs/design/v0-5-design-system/IMPORT.md` | Directional design evidence | Captures visual/product language and mentions ADR 019 as then-current substrate context. It is not source of ledger architecture. | Leave unless source-authority closeout chooses a small banner/update pass. |
| `pi-chart/memos/*claim-ledger*`, `pi-chart/memos/package-archive-adoption-map-20260503.md`, and related V0.5 memos | Historical/research evidence | Useful package and planning context; not implementation authority unless promoted into `.scratch`, accepted ADRs, or canonical docs. | Retarget useful claims to `pi-ledger` primitives or adapter surfaces through issue 11. |
| `pi-chart/CLAIM-TYPES.md`, `pi-chart/schemas/event.schema.json`, `pi-chart/src/types.ts`, and current `EventEnvelope` users | Brownfield chart evidence; not kernel authority | These define or support current chart behavior. The adapter may later translate to/from them, but they must not shape `pi-ledger` internals. | Treat as consumer-side compatibility inputs only after adapter issue triage. |
| `pi-chart/patients/**/events.ndjson` and related patient directories | Current chart fixture/evidence; not Phase 1 adapter migration input | Patient data remains out of scope for first adapter proof and must not become kernel fixture authority. In short, current patient fixtures are migration evidence only, not adapter/kernel authority. | Migration requires a later dedicated issue after kernel and adapter proof. |

## Reconciliation conclusions

1. There is no active chart-owned cryptographic kernel authority after ADR 020.
2. `pi-chart/src/claim-ledger/` should be treated as disposable prototype/golden-vector evidence until a cleanup or adapter issue explicitly adopts, archives, or deletes it.
3. `EventEnvelope`, current schemas, and patient directories are brownfield compatibility inputs for future chart adapters, not inputs to `pi-ledger` internals.
4. Prototype cockpit docs preserve useful UI seam intent, but their `src/claim-ledger/` path references are stale after ADR 020.
5. Archived package material should be retargeted to `pi-ledger` primitives plus chart adapter surfaces, not revived as chart-local kernel ownership.

## Follow-up recommendations

- After K0-K6 complete, run issue 02 to inventory the real `pi-ledger` consumer contract before implementing adapter code.
- After the integration mechanism decision, create a cleanup issue for `pi-chart/src/claim-ledger/` that either archives it as golden-vector lineage or deletes it after equivalent `pi-ledger` evidence is stable.
- Add a later source-authority/prototype cleanup slice to update stale prototype references from `src/claim-ledger/` to `pi-ledger` plus chart adapter/projection wording.
- Do not start current-patient migration until a separate migration PRD/issue defines accepted behavior and verification.
