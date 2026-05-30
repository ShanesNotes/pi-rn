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
| `pi-chart/` | See `CONTEXT-MAP.md` subproject matrix and `pi-chart/CONTEXT.md`; `pi-chart/docs/adr/` (notably 018/019/020) is authority | Active work in `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/` | Agent-native clinical chart; no longer owns the cryptographic claim-ledger kernel (ADR 020). Do not depend on `pi-monitor`; ingest via explicit Observable charting adapters. |
| `pi-agent/` | `pi-agent/AGENTS.md` | M7 public-read smoke artifacts classified in the ledger | Must not import or read hidden `pi-sim` source. Future reads are public vitals and chart/query APIs only. |
| `ingest/` | NOT a subproject — `CONTEXT-MAP.md` defines a 5-subproject matrix (pi-sim, pi-monitor, pi-ledger, pi-chart, pi-agent) with no `ingest/`; the public-vitals→chart adapter seam lives inside `pi-chart`. | n/a | Stale historical placeholder; do not create `ingest/`. |

## Active execution posture

- Current approved path: authority reconciliation first, implementation later.
- Do not create duplicate PRD/test-spec wrappers when M5/M6/M7 artifacts are already classified execution-ready.
- The public-vitals→chart adapter seam is owned inside `pi-chart` (see `CONTEXT-MAP.md`); there is no separate `pi-rn/ingest/` subproject.

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
