# Domain Docs

How engineering skills should consume this repo's domain documentation before exploring, planning, or editing.

## Layout

This is a **multi-context umbrella repo**. The root workflow config is shared, but domain authority lives per subproject.

```text
/
├── CONTEXT-MAP.md                     # root index and boundary map
├── AGENTS.md                          # root agent instructions + shared skill setup
├── docs/agents/                       # shared Matt Pocock skill configuration
├── pi-agent/
│   ├── AGENTS.md                      # Pi-specific runtime/scaffold rules
│   └── CONTEXT.md                     # bounded clinician-agent workspace
├── pi-chart/
│   ├── CONTEXT.md                     # chart/EHR truth substrate and adapters
│   └── docs/adr/                      # chart/EHR decisions
├── pi-ledger/
│   ├── CONTEXT.md                     # reusable cryptographic claim-ledger kernel
│   └── docs/adr/                      # ledger kernel decisions
├── pi-monitor/
│   ├── CONTEXT.md                     # display-only monitor
│   └── docs/adr/                      # monitor decisions
└── pi-sim/
    ├── CONTEXT.md                     # hidden patient runtime
    ├── docs/adr/                      # simulator/runtime decisions
    └── vitals/README.md               # public telemetry contract authority
```

| Area | Context file | ADR authority |
| --- | --- | --- |
| `pi-agent/` | `pi-agent/CONTEXT.md` | Create `pi-agent/docs/adr/` only when agent-specific decisions need durable records |
| `pi-chart/` | `pi-chart/CONTEXT.md` | `pi-chart/docs/adr/` |
| `pi-ledger/` | `pi-ledger/CONTEXT.md` | `pi-ledger/docs/adr/` |
| `pi-monitor/` | `pi-monitor/CONTEXT.md` | `pi-monitor/docs/adr/` |
| `pi-sim/` | `pi-sim/CONTEXT.md` | `pi-sim/docs/adr/` |

## Before exploring, read these

1. Read root `CONTEXT-MAP.md`.
2. Read each touched subproject's `CONTEXT.md`.
3. Read relevant ADRs under that subproject's `docs/adr/`. For claim-ledger kernel work, read `pi-ledger/CONTEXT.md` and `pi-ledger/docs/adr/` before `pi-chart` adapter docs.
4. If a task crosses the simulator telemetry boundary, read `pi-sim/vitals/README.md` and, when lane semantics matter, `pi-sim/vitals/.lanes.json`.

Do not duplicate this setup under subprojects. `docs/agents/*` at the root is the shared skill setup for the whole umbrella workspace.

Use `docs/agents/work-surface.md` for the shared conversation → PRD → issue → ADR → canonical-doc promotion ladder. This file only maps domain/context authority.

## Boundary rules

- `pi-agent` must not depend on hidden `pi-sim` internals. Design as if it only sees mounted/explicitly exposed surfaces.
- `pi-sim` owns hidden patient state and public telemetry publication.
- `pi-monitor` is display-only and reads public telemetry; it does not write chart truth.
- `pi-ledger` owns the reusable cryptographic claim-ledger kernel.
- `pi-chart` owns chart/EHR truth, clinical workflows, and adapters; it may ingest public telemetry only through explicit adapters and consumes `pi-ledger` through explicit adapters after kernel proof.
- Public contracts belong producer-side. For telemetry, `pi-sim/vitals/README.md` and `.lanes.json` are authoritative; fixtures are regression evidence only.

## ADR guidance

ADR filename convention across subprojects: `NNN-kebab-slug.md` with a three-digit number and no `ADR-` prefix.

- Prefer the narrowest owning subproject for new ADRs.
- Cross-cutting decisions should live with the subproject that owns the invariant, with links to affected contexts.
- `pi-agent` currently has no ADR directory; create `pi-agent/docs/adr/` only when a durable agent-specific decision needs it.

## Use the glossary's vocabulary

When your output names a domain concept in an issue title, refactor proposal, hypothesis, test name, or implementation note, use the term from the relevant `CONTEXT.md`. Do not drift to synonyms that the context explicitly avoids.

If the concept you need is missing, note the gap and consider a `/grill-with-docs` pass before making large design changes.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding it:

> Contradicts `pi-chart/docs/adr/007-adr-002-006-implementation.md` — reopen only if the new constraint is stronger.
