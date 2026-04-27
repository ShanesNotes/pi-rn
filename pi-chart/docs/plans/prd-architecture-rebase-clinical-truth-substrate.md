# PRD — Architecture Rebase: Clinical Truth Substrate

## Status and authority

- Status: active docs/source-authority lane.
- Source plan: `.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md`.
- Durable decision: `decisions/018-architecture-rebase-clinical-truth-substrate.md`.
- Scope: architecture-source authority and context-hygiene work before implementation.
- First execution lane: docs/source-authority only.
- Non-goal for first lane: no product-code, schema, patient fixture, script, or UI implementation changes.

## Problem

The repository has a strong clinical truth substrate but has accumulated UI prototypes, memos, `.omx` planning artifacts, and draft connector docs that can mislead future coding agents. A durable architecture rebase decision and source-authority map are needed before broad implementation.

## Users / consumers

- Human project lead validating architecture direction.
- Future coding agents needing unambiguous source authority.
- Ralph/team execution lanes needing owned files and verification commands.
- Later pi-agent/pi-sim integration work needing safe boundaries.

## Goals

1. Publish ADR 018 stating the architecture rebase direction.
2. Create source-authority classification to reduce context poison.
3. Define quarantine/banner strategy for stale/prototype docs.
4. Preserve clean-slate Option B as a validated-spike candidate.
5. Create executable PRD/test-spec for subsequent lanes.

## Non-goals

- No immediate rewrite to service/event-store architecture.
- No UI app implementation.
- No storage-port implementation in first lane.
- No pi-sim ingest server implementation.
- No pi-agent tool implementation.
- No broad file moves or deletions in first lane.

## Requirements

1. ADR 018 must state that pi-chart core is clinical truth/provenance substrate over cockpit UI.
2. ADR 018 must state hybrid migration is immediate path and clean-slate service/event-store remains a candidate pending spike.
3. Source-authority map must classify canonical, accepted, active-planning, prototype, historical/proposal, deprecated, and runtime/transient docs.
4. Prototype UI artifacts must be marked as directional evidence only.
5. Filesystem storage must be described as current fixture/export/backend, not permanent production database.
6. Hidden simulator state and direct pi-agent/pi-sim coupling remain forbidden.
7. The first execution lane must be docs-only except optional narrow board/index updates.
8. The clean-slate spike must reproduce current view outputs before any rewrite ADR.

## Acceptance criteria

- `decisions/018-architecture-rebase-clinical-truth-substrate.md` exists and passes structural content checks.
- `docs/architecture/source-authority.md` exists and classifies the required surfaces.
- `docs/plans/prd-architecture-rebase-clinical-truth-substrate.md` and paired test spec exist.
- Optional `docs/plans/kanban-prd-board.md` update is narrow and only records this lane.
- `git diff --name-only -- src schemas patients scripts` is empty after docs-only lane.
- Structural verification commands in the test spec pass.

## Workstreams

1. ADR 018 draft/promotion.
2. Source-authority map.
3. Quarantine/banner plan.
4. Architecture rebase PRD/test-spec.
5. Clean-slate Option B spike plan.
6. ADR 019 decision gate after spike.

## Risks

- Premature rewrite: mitigated by spike gate.
- Prototype deletion too early: mitigated by quarantine, not deletion.
- More doc sprawl: mitigated by source-authority map and canonical index.
- Agent context poison persists: mitigated by banners and explicit do-not-use classification.

## Verification

Use paired test spec: `docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md`.
