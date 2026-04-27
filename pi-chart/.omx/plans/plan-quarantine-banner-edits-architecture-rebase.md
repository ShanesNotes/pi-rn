# Plan — Quarantine banner edits for pi-chart architecture rebase

Date: 2026-04-27
Mode: `$ralplan` consensus revision. Plan-only; no banners applied in this lane.

## Consensus revision

This plan supersedes the earlier 8-file draft. QBN-001 is narrowed to six **tracked** files because `docs/plans/.draft/**` is ignored by Git and cannot be proven with the same durable insert-only checks. Ignored draft banners are deferred to a later local/ignored-artifact policy or promotion decision.

Durable execution artifacts:

- `docs/plans/prd-quarantine-banner-edits-architecture-rebase.md`
- `docs/plans/test-spec-quarantine-banner-edits-architecture-rebase.md`
- `.omx/plans/prd-quarantine-banner-edits-architecture-rebase.md`
- `.omx/plans/test-spec-quarantine-banner-edits-architecture-rebase.md`

## Requirements summary

Execute a narrow docs-only banner pass that reduces future coding-agent context poison from stale/prototype/historical architecture cues. The execution lane must not touch `src/**`, `schemas/**`, `patients/**`, `scripts/**`, generated prototype output, package files, binary assets, canonical docs, ADRs, source-authority docs, board rows, or ignored `.draft` planning files.

## Authority/evidence base

- ADR 018 accepts the clinical truth/provenance substrate direction over prototype cockpit architecture.
- `docs/architecture/source-authority.md` ranks accepted ADRs/canonical docs over active plans, prototype evidence, historical artifacts, and runtime artifacts.
- `docs/architecture/source-authority.md` requires selected quarantine banners and explicitly forbids bulk-bannering.
- `docs/plans/kanban-prd-board.md` marks ARCH-001 docs/source-authority complete and keeps product-root edits forbidden until later approved ADR/PRD.
- `docs/plans/.draft/**` is ignored by Git (`pi-chart/.gitignore`), so draft-file banners are not part of QBN-001.

## RALPLAN-DR summary

Principles:

1. Context hygiene beats preserving stale false authority.
2. Banner only the highest-risk tracked artifacts; do not bulk-banner.
3. Preserve useful evidence in place; no deletes, moves, or body rewrites.
4. Keep execution docs-only, allowlisted, reversible, and content-baseline verifiable.
5. Do not imply clean-slate service/event-store implementation is accepted before spike + ADR 019.

Decision drivers:

1. Reduce future coding-agent context poison.
2. Avoid demoting canonical/current authority.
3. Keep the lane small enough for Ralph to verify in one pass.

Viable options:

- Option A — Six tracked-file first slice: chosen. Highest signal-to-risk ratio and durable Git proof.
- Option B — Eight-file slice including `.draft`: rejected for QBN-001 because ignored files weaken verification.
- Option C — Bulk-banner all memos/design drafts: rejected because source-authority policy forbids bulk-bannering and it risks overcorrection.

## QBN-001 first-slice owned tracked files

Apply banners to exactly these six tracked files:

1. `memos/pi-chart-agent-canvas-plan-26042026.md`
2. `docs/design/pi-sim-vitals-write-contract.md`
3. `memos/pi-chart-vitals-connector-unblock-plan-26042026.md`
4. `docs/design/pi-agent-connector-contract.md`
5. `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
6. `memos/definitive-fhir-boundary-pi-chart.md`

## Required banner text

Insert each banner immediately after the H1 and before any existing status/decision/authority wording.

### `memos/pi-chart-agent-canvas-plan-26042026.md`

> **Status:** Prototype/directional evidence only. Not current architectural authority and not implementation authorization. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`.

### `docs/design/pi-sim-vitals-write-contract.md`

> **Status:** Draft connector/prototype artifact. Not current implementation authority for endpoints, storage, or pi-sim adapters. For current direction, see ADR 018 and `docs/architecture/source-authority.md`; require a later approved PRD/ADR before implementing ingest behavior.

### `memos/pi-chart-vitals-connector-unblock-plan-26042026.md`

> **Status:** Historical/proposal-only planning memo. Not current implementation authorization for vitals ingest, `chart_state`, source edits, or pi-sim coupling. For current direction, see ADR 018, `docs/architecture/source-authority.md`, and a later approved adapter/ingest PRD if one exists.

### `docs/design/pi-agent-connector-contract.md`

> **Status:** Prototype/directional connector sketch. Not current API, tool, or architecture authority. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`; promote any connector contract through a later PRD/ADR before implementation.

### `memos/pi-chart-boundary-adapter-definitive-synthesis.md`

> **Status:** Historical/proposal-only memo. Not current adapter implementation authority. Treat as boundary-design evidence only; promote specific claims through an accepted ADR or approved PRD/test-spec before editing `src/**`, schemas, or adapter docs.

### `memos/definitive-fhir-boundary-pi-chart.md`

> **Status:** Historical/proposal-only memo. Not current FHIR adapter implementation authority. Use as boundary-design evidence only; for current authority, see ADR 018, `docs/architecture/source-authority.md`, and any later accepted adapter ADR/PRD.

## Deferred candidates

Do not edit these in QBN-001:

- `docs/plans/.draft/prd-a9b-product-implementation.md`
- `docs/plans/.draft/test-spec-a9b-product-implementation.md`
- `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
- `docs/design/claude-agent-canvas-prompt.md`
- broader `/memos` sweep
- `docs/prototypes/**` or generated HTML outputs

## Execution handoff

Recommended execution mode: `$ralph` using this plan and the QBN-001 PRD/test-spec. Use one owner; do not split writes across parallel agents because the content-baseline verification assumes no concurrent same-worktree writes after baseline capture.

Suggested prompt:

```text
$ralph Use .omx/plans/plan-quarantine-banner-edits-architecture-rebase.md. Execute QBN-001 only. Apply banners to the six tracked owned files exactly as specified. Do not edit `.draft`, source, schema, patient, script, package, generated, canonical, ADR, board, or source-authority files. Run the QBN-001 test spec.
```

## Parallel work guidance

Safe while QBN-001 executes:

- Read-only planning/review of ADR 019 clean-slate spike scope.
- Read-only inventory of deferred banner candidates.
- Tests/validation in separate worktree or read-only mode.
- Work outside this repo/worktree that cannot affect `/home/ark/pi-rn` status.

Unsafe while QBN-001 executes:

- Any concurrent write in the same worktree after QBN baseline capture.
- Any edit to the six owned banner files by another agent.
- Edits to `docs/plans/.draft/**`.
- Edits to already-dirty planning/source-authority files, because that can confuse baseline verification.
- Product/source changes under forbidden paths.
