# PRD — Quarantine banner edits for architecture rebase (QBN-001)

## Status and authority

- Status: proposed execution-ready, docs-only.
- Source plan: [`.omx/plans/plan-quarantine-banner-edits-architecture-rebase.md`](../../.omx/plans/plan-quarantine-banner-edits-architecture-rebase.md), narrowed by consensus review from an 8-file slice to a 6-file tracked slice.
- Source authority: [`decisions/018-architecture-rebase-clinical-truth-substrate.md`](../../decisions/018-architecture-rebase-clinical-truth-substrate.md) and [`docs/architecture/source-authority.md`](../architecture/source-authority.md).
- This PRD authorizes only banner insertion in the exact tracked first-slice files listed below. It does not authorize product-code, schema, fixture, script, UI, generated-output, adapter, ingest, ignored-draft, or clean-slate implementation work.

## Problem

The architecture rebase established pi-chart as a clinical truth/provenance substrate and demoted several earlier UI, adapter, vitals, and FHIR artifacts to prototype or historical status. Several tracked artifacts still contain high-authority phrasing such as “approved baseline,” “implement this plan,” “definitive,” or “adopted design artifact.” Future coding agents may treat those stale documents as current implementation authority unless they are explicitly quarantined at the top of each file.

The original plan also proposed banners for `docs/plans/.draft/**`, but that directory is ignored by Git. Those ignored files cannot be proven through the same durable Git diff/insert-only checks, so they are deferred from QBN-001 rather than mixed into the tracked banner lane.

## Goals

1. Add top-of-file status banners to the smallest high-risk tracked first slice of stale/prototype/historical artifacts.
2. Preserve all artifacts in place as evidence; do not delete, move, or rewrite them.
3. Make false authority obvious before older status wording is read.
4. Keep the execution lane mechanically verifiable, tracked, and reversible.

## Non-goals

- No edits to `src/**`, `schemas/**`, `patients/**`, `scripts/**`, package files, generated prototype output, HTML prototypes, screenshots, or binary assets.
- No edits to ignored `docs/plans/.draft/**` files in this lane.
- No implementation of vitals ingest, pi-agent connector behavior, FHIR adapters, boundary adapters, UI/cockpit changes, or clean-slate service/event-store architecture.
- No demotion of canonical/current docs: `README.md`, `DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CLAIM-TYPES.md`, accepted ADRs, `docs/architecture/source-authority.md`, or active board/source-authority planning docs.
- No broad `/memos` sweep and no bulk-bannering.

## First-slice owned tracked files

Banner execution owns exactly these tracked files:

1. `memos/pi-chart-agent-canvas-plan-26042026.md`
2. `docs/design/pi-sim-vitals-write-contract.md`
3. `memos/pi-chart-vitals-connector-unblock-plan-26042026.md`
4. `docs/design/pi-agent-connector-contract.md`
5. `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
6. `memos/definitive-fhir-boundary-pi-chart.md`

## Required banner placements

Each banner must be inserted immediately after the H1 title and before any existing status, decision, or authority language.

### `memos/pi-chart-agent-canvas-plan-26042026.md`

Classification: prototype/directional evidence.

Banner:

> **Status:** Prototype/directional evidence only. Not current architectural authority and not implementation authorization. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`.

### `docs/design/pi-sim-vitals-write-contract.md`

Classification: prototype/directional evidence.

Banner:

> **Status:** Draft connector/prototype artifact. Not current implementation authority for endpoints, storage, or pi-sim adapters. For current direction, see ADR 018 and `docs/architecture/source-authority.md`; require a later approved PRD/ADR before implementing ingest behavior.

### `memos/pi-chart-vitals-connector-unblock-plan-26042026.md`

Classification: historical/proposal-only.

Banner:

> **Status:** Historical/proposal-only planning memo. Not current implementation authorization for vitals ingest, `chart_state`, source edits, or pi-sim coupling. For current direction, see ADR 018, `docs/architecture/source-authority.md`, and a later approved adapter/ingest PRD if one exists.

### `docs/design/pi-agent-connector-contract.md`

Classification: prototype/directional evidence.

Banner:

> **Status:** Prototype/directional connector sketch. Not current API, tool, or architecture authority. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`; promote any connector contract through a later PRD/ADR before implementation.

### `memos/pi-chart-boundary-adapter-definitive-synthesis.md`

Classification: historical/proposal-only.

Banner:

> **Status:** Historical/proposal-only memo. Not current adapter implementation authority. Treat as boundary-design evidence only; promote specific claims through an accepted ADR or approved PRD/test-spec before editing `src/**`, schemas, or adapter docs.

### `memos/definitive-fhir-boundary-pi-chart.md`

Classification: historical/proposal-only.

Banner:

> **Status:** Historical/proposal-only memo. Not current FHIR adapter implementation authority. Use as boundary-design evidence only; for current authority, see ADR 018, `docs/architecture/source-authority.md`, and any later accepted adapter ADR/PRD.

## Execution rules

1. Capture pre-execution content baselines before editing: owned-file copies, non-owned tracked diff, dirty-path status, ignored `.draft` hashes, and SHA manifests for pre-existing dirty non-owned paths, including untracked files/directories. Because prior planning/source-authority artifacts may already be uncommitted, verification must prove both that owned files changed only by banner insertion and that non-owned dirty content did not change during execution.
2. At baseline, stop if any forbidden product/source path is already dirty; do not hide product changes under a docs-only lane.
3. Do not change board status, source-authority text, ADRs, PRD/test-spec docs, or `.omx` planning artifacts inside the banner execution lane.
4. Insert banners only; do not rewrite body content.
5. Preserve existing older status text below the new banner so historical context remains auditable.
6. If any owned file has changed enough that the planned insertion point or classification is no longer correct, stop and report the mismatch instead of freelancing.

## Acceptance criteria

- AC1: Exactly the six owned tracked files receive top-of-file banners during the banner execution delta.
- AC2: Each banner appears within the first five lines and before older status/authority wording.
- AC3: There are no deletes, moves, body rewrites, ignored-draft edits, or non-owned tracked file edits in the execution delta.
- AC4: Forbidden path guard passes for `src/**`, `schemas/**`, `patients/**`, `scripts/**`, package files, generated prototype output, and binary assets at baseline and after execution.
- AC5: Runtime regressions pass: `npm test`, `npm run validate -- --patient patient_001`, and `npm run validate -- --patient patient_002`.
- AC6: Any pre-existing dirty worktree files are reported separately from the banner execution delta.

## Deferred candidates

Do not include these in QBN-001 unless a later PRD expands scope:

- `docs/plans/.draft/prd-a9b-product-implementation.md` — ignored by Git; needs separate local/ignored-artifact policy or promotion decision.
- `docs/plans/.draft/test-spec-a9b-product-implementation.md` — ignored by Git; needs separate local/ignored-artifact policy or promotion decision.
- `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
- `docs/design/claude-agent-canvas-prompt.md`
- broader `/memos` directory sweep
- `docs/prototypes/**` or generated HTML outputs
