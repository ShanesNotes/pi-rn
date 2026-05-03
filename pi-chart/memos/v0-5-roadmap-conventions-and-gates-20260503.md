# V0.5 Roadmap Conventions and Gates

Date: 2026-05-03
Status: alignment memo; planning artifact only; no implementation authority.
Primary substrate: `.omx/plans/v0-5-spec-prep-synthesis.md` and `pi-chart/memos/v0-5-spec-prep-synthesis-20260503.md`.

## 1. Date and filename convention

- Artifact headers use ISO dates: `YYYY-MM-DD`.
- Filenames omit dates unless chronological disambiguation is needed.
- When a filename date suffix is needed, use sortable `YYYYMMDD`.
- Do not create new `DDMMYYYY` filenames. Existing `02052026` artifacts are legacy and mean 2026-05-02.

## 2. Artifact location authority

- `.omx/specs/` — interview/source-of-truth artifacts produced by OMX workflows.
- `.omx/plans/` — active RALPLAN/spec-prep workspace for Codex iteration.
- `.omx/package-archive/` — preserved package zips and extracted package research.
- `pi-chart/memos/` — project-visible architect/founding-engineer memos and mirrors.
- `pi-chart/docs/planning/v0.5/` — durable project-visible planning index and distilled planning surfaces.
- `pi-chart/decisions/` — accepted ADRs only, numbered in repo-local sequence.

Working rule: `.omx/plans/` may be the live Codex planning substrate, but durable project planning needs a visible `pi-chart/` surface before implementation handoff.

## 3. Citation format

- Brownfield code: `pi-chart/src/types.ts:177-198`.
- Package source: `pkg-018:plans/prd-018a-claim-kernel-and-compat.md §3`.
- Cross-spec/synthesis: `v0.5-synthesis §7 C5` or `v0.5-conventions §4`.
- Accepted ADR: `pi-chart/decisions/018-architecture-rebase-clinical-truth-substrate.md §Decision`.

## 4. Delta logging

Every V0.5 PRD/test-spec that diverges from the synthesis must include a `Delta from synthesis` table with:

| Topic | Synthesis stance | New stance | Reason | Approval |
| --- | --- | --- | --- | --- |

No silent divergence.

## 5. Gate language

Use RFC2119-style language:

- `MUST` — hard contract; implementation cannot override without changing the PRD/spec.
- `SHOULD` — default choice; engineer may override only with a recorded rationale.
- `MAY` — optional capability.

For overridable defaults, add: `rationale required if rejected`.

## 6. Roadmap loose-end commitments

- L1: The first accepted V0.5 kernel ADR is `pi-chart/decisions/019-v0-5-claim-ledger-kernel.md`, if approved.
- L2: Phase 1 uses a fresh generated `patient_kernel` fixture; no `patient_001`, no `patient_002`, and no committed on-disk patient directory for the kernel proof.
- L3: Backend posture is not a Phase 0 blocker. Phase 1 assumes generated synthetic/local fixtures. Backend architecture, including any OpenBrain-like adapter model, belongs in the access/runtime PRDs that need it.
- L4: `Phase 1.5` is a deferred-items label, not a named phase or PRD until explicitly promoted.
- L5: Phase 1 `ClaimRef` uses `(id, hash)` from day one.
- L6: No source/schema/package edits until Phase 0 durable artifacts plus Phase 1 PRD and Phase 1 test-spec are Architect+Critic approved.

## 7. Phase 0 authoring recommendation

Prefer serial `$ralph` over `$team` for Phase 0 artifacts because ADR numbering and package archive adoption depend on the conventions/authority split. Use `$team` only after the conventions memo is stable and there is a clear integration owner.

Recommended order:

1. Conventions and gates memo.
2. ADR numbering reconciliation.
3. Package archive adoption map.
4. Phase 1 PRD/test-spec.

Backend posture and predicate tiers should be handled inside the PRD/specs that own backend adapters, capture/review routing, predicate registry behavior, or playbook validation. They should not be prematurely frozen as standalone Phase 0 policy.

## 8. Dirty-tree disposition

Commit the existing dirty tree in scoped commits, then continue V0.5 work on a fresh tree. Do not stash or mix unrelated monitor/simulator cleanup with V0.5 planning commits.

## 9. Telos / attention rule

Prior context is evidence, not authority. If an older context note puts a concern in the wrong phase, later engineering judgment and the current user correction should control placement. When user suggestions and implementation architecture conflict, the founding engineer should preserve the telos and propose the safer engineering boundary.
