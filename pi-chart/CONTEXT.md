# pi-chart Context

`pi-chart` is the chart/EHR subsystem and durable clinical memory substrate for the `pi-rn` workspace.

## Domain role

- Owns chart/EHR truth.
- Stores append-oriented, provenance-rich clinical claims/events.
- Provides read/write/view primitives for agents, tests, and future UI layers.
- Treats generated current state, summaries, and `_derived/` content as disposable views over canonical chart records.

## Core language

- **The chart is canonical. Current state is a query. Derived summaries are disposable.**
- **Clinical claim/event envelope**: immutable, time-bound, source-attributed, linked clinical record.
- **Patient scope**: explicit `{ chartRoot, patientId }` confinement for public read/write calls.
- **View primitive**: pure read model such as timeline, current state, trend, evidence chain, open loops, or narrative.
- **Write boundary**: sanctioned APIs in `src/`, not raw file edits.

## Invariants

- Append-only clinical truth: corrections supersede or correct earlier records instead of mutating them.
- Every claim must carry source, clinical time, recorded time, author, and status.
- Patient isolation is mandatory; no cross-patient links or accidental writes outside the scoped patient chart.
- `_derived/` is never authoritative.
- Narrative note authoring should preserve paired note/event provenance when applicable.
- Whole-chart validation owns link resolution, contradiction/resolution checks, note-reference integrity, and transform provenance coherence.

## Boundary with pi-sim

`pi-chart` may consume `pi-sim` public telemetry through explicit adapters, but must not depend on hidden simulator internals. `pi-sim/vitals/README.md` and `.lanes.json` define producer-side telemetry contracts.

## ADR authority

Read `pi-chart/docs/adr/` before changing chart primitives, lifecycle/status semantics, source taxonomy, evidence links, provenance, patient isolation, import behavior, or the clinical-memory architecture.

## Useful project docs

- `pi-chart/README.md` — primer and run commands.
- `pi-chart/DESIGN.md` — current spec and invariants.
- `pi-chart/ARCHITECTURE.md` — code map over the design.
- `pi-chart/ROADMAP.md` — shipped/deferred seams and growth path.
