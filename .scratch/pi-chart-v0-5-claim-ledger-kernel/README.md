# pi-chart V0.5 claim-ledger kernel workstream

Status: retargeting required; prior pi-chart-internal implementation-home is superseded by `pi-ledger` ownership.

## Role

This surface preserves the Phase 1 K0-K6 claim-ledger kernel PRD/test-spec/issue lineage. After the 2026-05-03 decision, implementation must be retargeted to sibling subproject `pi-ledger/` before further AFK source work. The parent V0.5 program/front-door remains `.scratch/pi-chart-v0-5/`.

## Source anchors

- `future-runtime-constraints.md` — long-horizon compatibility constraints mined from all five archived research packages without expanding Phase 1 scope.
- `clinical-truth-guardrails.md` — active V0.5 substrate development standards for clean-canvas slices.
- `pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md` — accepted clean-canvas kernel decision.
- `.scratch/pi-chart-v0-5/PRD.md` — parent program PRD.
- `.omx/plans/prd-v0-5-claim-ledger-kernel.md` — original reviewed PRD lineage.
- `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md` — original reviewed test-spec lineage.
- `.omx/plans/review-v0-5-claim-ledger-kernel-20260503.md` — Architect+Critic review evidence.
- `pi-chart/memos/package-archive-adoption-map-20260503.md` — archived research package adoption/defer/reject map.

## Lock

No source, schema, fixture, package-manager, package-archive, patient-data, or accepted-ADR edits are authorized by this scaffold alone. Existing issue paths that mention `pi-chart/src/claim-ledger/` are superseded and must be re-triaged for `pi-ledger` before implementation.

## Issue slices

1. `issues/01-k0-k2-canonical-hash.md` — canonicalization plus hash behavior.
2. `issues/02-k1-minimal-claim-validation.md` — minimal Claim validator, no `EventEnvelope` dependency.
3. `issues/03-k3-append-only-ledger.md` — append metadata, sequence, chain, head validation.
4. `issues/04-k4-predicate-registry-minimum.md` — seeded predicate registry and object validation.
5. `issues/05-k5-bitemporal-read.md` — `validAt` / `knownAt` point-query proof.
6. `issues/06-k6-synthetic-fixture-closeout.md` — deterministic generated fixture and boundary checks.

## Planned implementation home

Superseded: the previous `pi-chart/src/claim-ledger/` implementation home is no longer current. The claim-ledger kernel now belongs under sibling subproject `pi-ledger/`; exact source/package paths are intentionally `needs-triage` until the pi-ledger scaffold issue decides Rust/TypeScript packaging and closeout commands.

This workstream should not retrofit `pi-chart/src/types.ts`, `pi-chart/schemas/event.schema.json`, or existing `EventEnvelope` behavior first. Current prototype code is reference evidence only unless an approved issue explicitly adopts a pattern.

## Prior-work mining language

Use **clinical truth guardrail** for a source-cited, domain-level rule that protects chart truth and is re-justified for V0.5. Do not use broad “invariant” language to import prototype implementation details.

## Package usage rule

Archived research package fragments may be used as cited reference designs where relevant. Adapt only the minimum needed for the current issue. Do not wholesale copy/import package artifacts, issue lists, ADR statuses, or broad type graphs as implementation authority.

## Historical AFK-readiness note

Superseded by the later `pi-ledger` ownership decision. Earlier on 2026-05-03, the AFK-readiness pass restored only `issues/01-k0-k2-canonical-hash.md` to `ready-for-agent` based on `k0-go-no-go.md`, left issues 02-06 in `needs-triage`, pinned issue 01 to `pi-chart/src/claim-ledger/canonical.ts` plus colocated tests, added closeout commands to all six issues, authorized K4 to reuse existing AJV without importing `schemas/event.schema.json` or adding dependencies, tightened K1/K3 ownership of store-assigned time fields, and clarified Phase 1 one-append/one-batch semantics without widening scope beyond the existing K0-K6 workstream.

## Retargeting decision

On 2026-05-03, the operator chose `pi-ledger` as the reusable cryptographic claim-ledger kernel owner. `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md` and `pi-ledger/docs/adr/001-reusable-claim-ledger-kernel.md` supersede the previous `pi-chart/src/claim-ledger/` implementation home. Any in-flight `pi-chart/src/claim-ledger/` code is prototype/golden-vector evidence only until moved or reconciled through a new issue.

## Active successor surface

Use `.scratch/pi-ledger-claim-ledger-kernel/` for current PRD/issues and AFK implementation. This pi-chart-named directory is retained only as lineage evidence for the retargeting decision.
