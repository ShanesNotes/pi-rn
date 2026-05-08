# pi-chart rebase rescue review

Status: docs-only rescue gate
Parent plan: `.omx/plans/ralplan-pi-chart-rebase-rescue-review-20260506T021553Z.md`

## Review goal

This workstream rescues the useful clinical, regulatory/governance, workflow, and architecture signal from the original `pi-chart` prototype and subsequent mining work **without** treating that prior work as implementation authority.

The target frame is:

> pi-chart is an agent-native clinical chart: a provenance-rich, patient-scoped clinical memory and context-curation substrate for clinicians and bounded AI agents.

The review is not a rewrite plan. It is a triage gate that decides which ideas should become future ADRs, PRDs/issues, prototype evidence, rejections, or named open questions.

## Scope

In scope:

- preserve prototype gold;
- audit legacy EHR rails worth reusing or adapting;
- identify agent-native clinical workflow gaps;
- challenge language, storage, dependency, package-boundary, fixture, and standards assumptions;
- map splice risks before implementation;
- produce a closeout promotion map with exactly one destination per rescued idea.

Out of scope:

- source implementation;
- schema changes;
- patient fixture migration;
- package/lockfile changes;
- accepted ADR edits;
- hidden `pi-sim` coupling;
- direct agent accepted-write policy;
- chart-local ledger-kernel implementation.

## Boundary constraints

- `pi-ledger` owns reusable claim-ledger kernel concerns: canonicalization, hashes, append admission, append order, correction-target admission, and minimal bitemporal reads.
- `pi-chart` owns chart memory semantics, clinical workflow surfaces, projections, review/governance, and future adapters.
- Lower-authority prototype, memo, rendered UI, patient corpus, and package-archive evidence must be promoted into ADRs, PRDs/issues, or canonical docs before implementation.
- Compliance/regulatory content is treated as clinician burden-offload, governance, auditability, and review-pressure evidence. This workstream makes no product/regulatory certification claim.

## Artifact reading order

1. `requirements-summary.md`
2. `legacy-EHR-leverage-audit.md`
3. `agent-native-gap-audit.md`
4. `foundation-decision-matrix.md`
5. `prototype-gold-register.md`
6. `splice-risk-matrix.md`
7. `future-ADR-map.md`
8. `review-closeout.md`

## Relationship to existing workstreams

| Workstream | Existing purpose | This review relationship | Action | Reason | Risk if confused |
|---|---|---|---|---|---|
| `.scratch/pi-chart-phase-a-context-digging-corpus-mining/` | Broad source/corpus/brownfield mining and substrate recommendation. | Reuse as evidence inventory and row vocabulary; do not duplicate broad mining. | merge | This review narrows Phase A outputs into rebase/foundation rescue decisions and exact promotion destinations. | New planning archaeology; repeated mining without new decisions. |
| `.scratch/pi-chart-pi-ledger-adapter-strategy/` | Plan pi-chart consumer adapter after `pi-ledger` kernel evidence. | Reuse boundary and readiness gates; keep adapter implementation deferred. | reuse | Adapter strategy already blocks implementation until kernel evidence exists. | Chart-specific needs leak into ledger kernel or premature adapter code. |
| `.scratch/pi-ledger-claim-ledger-kernel/` | Kernel PRD/issues for canonical claim ledger. | Leave kernel execution untouched; feed only clearly kernel-owned questions back as separate issues/ADRs. | leave untouched | This rescue review is about pi-chart rebase foundations, not changing the active kernel lane. | `pi-chart` pulls workflow/compliance/UI concerns into `pi-ledger`. |
| `.scratch/pi-chart-v0-5*` | V0.5 strategy, foundation decisions, old chart-local kernel lane, salvage/mining context. | Merge surviving decisions and supersede stale chart-local kernel home assumptions where ADR020 already moved ownership. | merge | V0.5 has high-signal foundation decisions, but some implementation-home assumptions are stale. | Future agents treat stale chart-local kernel or shift-brain-first language as current authority. |

## Closeout decision rules

Every rescued idea must end as exactly one of:

- `promote to future ADR`
- `promote to PRD/issue`
- `keep as prototype evidence`
- `reject`
- `defer/open question`

No idea may remain as an orphaned “interesting finding.”

## Stop condition

This workstream is complete only when `review-closeout.md` records verification evidence, every rescued idea appears exactly once in the promotion map, existing workstreams are mapped, and no files outside `.scratch/pi-chart-rebase-rescue-review/` were changed by this pass.
