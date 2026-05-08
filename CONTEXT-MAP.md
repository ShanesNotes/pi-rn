# Context Map

`pi-rn` is an umbrella workspace for a bounded clinical-agent harness. Read this file first, then read only the subproject `CONTEXT.md` files and ADRs relevant to the task.

## Contexts

| Area | Context file | ADR authority | Primary role |
| --- | --- | --- | --- |
| `pi-agent/` | `pi-agent/CONTEXT.md` | Create `pi-agent/docs/adr/` when agent-specific decisions need durable records | Clinician-agent workspace and future bounded/containerized runtime |
| `pi-chart/` | `pi-chart/CONTEXT.md` | `pi-chart/docs/adr/` | Agent-native clinical chart and durable clinical memory substrate |
| `pi-ledger/` | `pi-ledger/CONTEXT.md` | `pi-ledger/docs/adr/` | Reusable cryptographic claim-ledger kernel |
| `pi-monitor/` | `pi-monitor/CONTEXT.md` | `pi-monitor/docs/adr/` | Display-only monitor for public telemetry |
| `pi-sim/` | `pi-sim/CONTEXT.md` | `pi-sim/docs/adr/` | Hidden patient simulation runtime and public telemetry producer |

## Boundary map

```text
pi-sim hidden runtime
  └─ public telemetry contract: pi-sim/vitals/README.md + pi-sim/vitals/.lanes.json
       ├─ pi-monitor reads display-only telemetry
       ├─ pi-chart may ingest public telemetry into chart truth through explicit adapters
       └─ pi-agent may read only explicitly exposed clinical/public surfaces

pi-ledger cryptographic claim-ledger kernel
  └─ reusable canonicalization/hash/append-order/bitemporal primitives consumed through explicit adapters

pi-chart agent-native clinical chart
  └─ chart views/workflows and clinical adapters over ledger-backed or brownfield chart records

pi-agent bounded workspace
  └─ must not import or inspect pi-sim hidden internals when acting as the clinical agent
```

## Seam matrix

Use this matrix to preserve Locality before crossing subproject Interfaces. It summarizes ownership and points to authority docs; it does not replace each subproject `CONTEXT.md` or ADRs.

| Module | Owned truth / Implementation depth | Allowed consumers | Forbidden consumers / writes | Durable authority docs | Verification entrypoints |
| --- | --- | --- | --- | --- | --- |
| `pi-sim/` | Hidden patient runtime, scenario time, provider routing, validation, and public telemetry production | `pi-monitor` display reads; `pi-chart` explicit telemetry adapters; `pi-agent` only explicitly exposed public/clinical surfaces | Hidden provider/scenario/latent/validation internals must not be imported or inspected by `pi-agent` or sibling consumers | `pi-sim/CONTEXT.md`; `pi-sim/docs/adr/`; public telemetry Interface authority is `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` | `pi-sim/README.md`; public contract fixtures under `pi-sim/vitals/fixtures/public-contract/**`; package test commands in `pi-sim/package.json` |
| `pi-monitor/` | Display-only monitor modeling, freshness/alarm/numeric/waveform rendering, native kiosk/CLI behavior | Public JSON/JSONL telemetry from `pi-sim/vitals/` | Does not write chart truth, `vitals.jsonl`, simulator state, patient truth, or import `pi-chart`/hidden `pi-sim` internals | `pi-monitor/CONTEXT.md`; `pi-monitor/docs/adr/`; producer contract `pi-sim/vitals/README.md` plus `.lanes.json` | `pi-monitor/README.md`; `cargo fmt --all -- --check`; `cargo clippy --workspace --all-targets -- -D warnings`; `cargo test --workspace`; `cargo build --workspace` |
| `pi-ledger/` | Reusable cryptographic claim-ledger kernel: canonicalization, stable id+hash identity, append order, ledger integrity, minimal bitemporal reads | `pi-chart` adapters; future access/runtime/orchestrator surfaces through explicit kernel interfaces | Must not import `pi-chart` brownfield schemas, patient directories, UI prototypes, hidden `pi-sim`, or runtime transcripts as patient memory | `pi-ledger/CONTEXT.md`; `pi-ledger/docs/adr/`; root `CONTEXT-MAP.md` | Future `pi-ledger` package tests and golden-vector checks |
| `pi-chart/` | Agent-native clinical chart truth, clinical memory semantics, chart views/workflows, clinical adapters, disposable derived views | Explicit adapters may ingest public simulator telemetry through the Observable charting seam; agents/tests may use sanctioned chart APIs; consumes `pi-ledger` through adapters after kernel proof | Must not depend on hidden `pi-sim` internals or `pi-monitor`; raw file writes are outside the write boundary; no longer owns the cryptographic claim-ledger kernel | `pi-chart/CONTEXT.md`; `pi-chart/docs/adr/`; `pi-chart/DESIGN.md`; `pi-chart/ARCHITECTURE.md`; `pi-chart/docs/adr/020-claim-ledger-kernel-owned-by-pi-ledger.md` | `pi-chart/README.md`; package test/build scripts; whole-chart validation and adapter tests |
| `pi-agent/` | Bounded clinician-agent workspace and future containerized runtime policy | Mounted/exposed chart/EHR and public telemetry surfaces intentionally made visible to the agent | Must not import, inspect, or design around hidden `pi-sim` source, provider state, latent findings, scenario secrets, or validation internals | `pi-agent/CONTEXT.md`; create `pi-agent/docs/adr/` only for durable agent-specific decisions; root `docs/agents/` for workflow | `pi-agent/AGENTS.md`; future container/public-read smoke checks; boundary scans for hidden simulator coupling |

## Which context to read

- **Agent/runtime boundary work:** read `pi-agent/CONTEXT.md`, then public contract docs such as `pi-sim/vitals/README.md` only if the task touches exposed telemetry.
- **Cryptographic claim-ledger kernel work:** read `pi-ledger/CONTEXT.md`, `pi-ledger/docs/adr/*`, and any active `.scratch/*ledger*` workstream.
- **Agent-native clinical chart or clinical memory work:** read `pi-chart/CONTEXT.md` and relevant `pi-chart/docs/adr/*`; if telemetry ingestion is involved, also read `pi-sim/vitals/README.md`.
- **Monitor/display work:** read `pi-monitor/CONTEXT.md`, relevant `pi-monitor/docs/adr/*`, and `pi-sim/vitals/README.md`.
- **Simulator/provider/scenario work:** read `pi-sim/CONTEXT.md`, relevant `pi-sim/docs/adr/*`, and public contract fixture docs when changes affect consumers.
- **Cross-subproject changes:** read each touched subproject context and the producer/consumer boundary docs before editing.

## Issue workflow

Matt Pocock engineering skills use one root issue workflow for this umbrella repo:

- Issues and PRDs live under root `.scratch/<feature>/`.
- Triage status uses the default strings in `docs/agents/triage-labels.md`.
- Do not create duplicate `docs/agents/*` configuration under subprojects unless a subproject becomes a separate workflow/repo.

For the full conversation → PRD → issue → ADR → canonical-doc promotion ladder, read `docs/agents/work-surface.md`.

## Decision rules

- Prefer the narrowest owning subproject for new ADRs.
- Cross-cutting decisions should live with the subproject that owns the invariant, with links to affected contexts.
- Public contracts belong producer-side. For simulator telemetry, `pi-sim/vitals/README.md` and `.lanes.json` are the authority.
- Consumer fixtures are regression evidence, not a second source of truth.
