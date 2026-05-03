# Historical planning note

> **Status:** Transitional planning scratchpad. Not current workflow authority.
> For domain boundaries, read `CONTEXT-MAP.md`. For active work, use `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`. For durable decisions, use each subproject's `docs/adr/`.

This file is preserved as lineage from a pre-Matt-skills planning pass. Do not add new active plans here.

## Current rule

The single shared promotion ladder now lives in `docs/agents/work-surface.md`.
This file is not a second ladder and should not be extended for active planning.

## Historical content

The content below predates the current `.scratch`-first workflow and may be stale.

---
# pi-rn Planning Front Door

Purpose: make a fresh AI coding agent productive in one read-pass before touching source.

## Read order

1. This file.
2. `pi-sim/docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` — canonical authority ledger and roadmap.
3. Subsystem authority below.
4. The relevant PRD/test-spec listed by the ledger.
5. Source code only after the planning surface names the lane as execution-ready.

## Current subsystem authority

| Subsystem | Current authority | Next planning surface | Boundary rule |
|---|---|---|---|
| `pi-sim/` | `pi-sim/docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`; `pi-sim/vitals/README.md`; `pi-sim/vitals/.lanes.json` | `pi-sim/docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` | Hidden patient runtime. Publishes public vitals lanes; do not expose provider/scenario internals to sibling consumers. |
| `pi-monitor/` | `pi-monitor/docs/ADR-0001-rust-native-pi-monitor.md`; `pi-monitor/docs/ADR-0003-public-lane-consumer-authority.md` | `pi-monitor/docs/ADR-0003-public-lane-consumer-authority.md` | Display-only public consumer. Public JSON lanes are durable; private TCP is non-durable display transport. No chart/EHR writes. |
| `pi-chart/` | `pi-chart/src/vitals.ts` for current vital-sample identity; broader chart direction remains sibling-owned | Future pi-chart v0.5 disposition lane | Chart/EHR truth owner. Do not depend on `pi-monitor`; telemetry adapter must specify provenance/idempotency/write policy first. |
| `pi-agent/` | `pi-agent/AGENTS.md` | M7 public-read smoke artifacts classified in the ledger | Must not import or read hidden `pi-sim` source. Future reads are public vitals and chart/query APIs only. |
| `ingest/` | Not created yet | Future `pi-rn/ingest/README.md`, PRD, and test-spec | Explicit adapter seam from public vitals to chart truth. No hidden sim imports. |

## Active execution posture

- Current approved path: authority reconciliation first, implementation later.
- Do not create duplicate PRD/test-spec wrappers when M5/M6/M7 artifacts are already classified execution-ready.
- Do not start `pi-rn/ingest/` implementation until the authority ledger, public ABI lock, and chart write semantics are accepted.

## Archive posture

- `pi-sim/docs/plans/INDEX.md` lists live vs historical pi-sim plan surfaces.
- `pi-sim/docs/MILESTONES.md` distills M1-M7 status.
- Historical `.omx/plans/*` files are preserved as lineage unless the ledger marks them current/execution-ready.

## Required pre-edit checks

```bash
git -C /home/ark/pi-rn status --short --untracked-files=all
cd /home/ark/pi-rn/pi-sim && sed -n '1,220p' docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md
```

If this file and the ledger disagree, update them in the same planning PR before implementation.
