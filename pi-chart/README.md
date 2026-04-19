# pi-chart

Durable clinical memory substrate for `pi-agent`, running against `pi-sim`.

Not an EHR clone. A minimal, append-oriented, provenance-rich substrate
for an AI agent operating under partial observability.

See `DESIGN.md` for the current spec (v0.2); this file is the primer.

## Core thesis

> The chart is canonical. Current state is a query. Derived summaries are disposable.

There is no separate "memory" system. The chart *is* the agent's long-term
memory for a patient. Short-term memory is whatever's in the agent's current
context window. Long-term memory is whatever has been durably written here.

## The primitive

One **clinical claim/event envelope** — time-bound, source-attributed, linked,
immutable once written. Storage format is chosen for the payload:

| Payload shape                        | Format                      |
|--------------------------------------|-----------------------------|
| Atomic structured event              | NDJSON (`events.ndjson`)    |
| Vitals / monitor stream              | JSONL (`vitals.jsonl`)      |
| Narrative note                       | Markdown + YAML frontmatter |
| Patient baseline                     | Markdown + YAML frontmatter |
| Constraints, goals, preferences      | Markdown + YAML frontmatter |
| Encounter header                     | Markdown + YAML frontmatter |
| Images, PDFs, waveforms              | Native artifact + manifest  |
| Current state / summaries / indices  | Generated (disposable)      |

The envelope schema (`schemas/event.schema.json`) is the ontology. Markdown
and NDJSON are carriers.

## Directory layout (v0.2)

```
pi-chart/
├── README.md                 # this file
├── DESIGN.md                 # the spec — committed decisions + open items
├── CLAIM-TYPES.md            # event types, subtypes, data shapes
├── pi-chart.yaml             # system registry (patient ids, defaults)
├── sessions/
│   ├── current.yaml          # GITIGNORED — operator identity + current patient
│   └── current.example.yaml  # COMMITTED — template
├── patients/
│   └── patient_001/          # one patient's complete chart
│       ├── chart.yaml        # per-patient metadata (subject, tz, clock)
│       ├── patient.md        # baseline
│       ├── constraints.md    # allergies, code status, preferences
│       ├── timeline/
│       │   └── YYYY-MM-DD/
│       │       ├── encounter_NNN.md
│       │       ├── events.ndjson
│       │       ├── vitals.jsonl
│       │       └── notes/HHMM_<slug>.md
│       ├── artifacts/
│       └── _derived/         # cached render — disposable, grep-friendly
├── schemas/
├── scripts/                  # tsx CLIs (migrate, validate, rebuild)
└── src/                      # API surface (read/write/views/validate)
```

Every patient directory is a complete, self-contained chart. Copy one
elsewhere and it still works.

## The write boundary

The agent goes through `src/`, never raw file edits. Every entry point
takes a `PatientScope` so writes are confined to one patient directory
(DESIGN §2.6). CLI wrappers may default `chartRoot` to cwd and pick up
`author` / `patientId` from `sessions/current.yaml`; agents and tests
always pass scope + author explicitly.

```ts
import {
  // reads
  readPatientContext,
  readActiveConstraints,
  readRecentEvents,
  readRecentNotes,
  readLatestVitals,
  latestEffectiveAt,

  // view primitives (DESIGN §4) — pure, JSON-serializable, axis-aware
  timeline,
  currentState,
  trend,
  evidenceChain,
  openLoops,
  narrative,

  // writes (raise on contract violation)
  appendEvent,
  writeNote,
  writeCommunicationNote,
  writeArtifactRef,
  nextEventId,
  nextNoteId,

  // derived + validate
  rebuildDerived,
  validateChart,

  // session + registry helpers
  tryLoadSessionAuthor,
  tryLoadSessionChartRoot,
  listPatientIds,
} from "./src/index.js";

// All public calls take a PatientScope:
await appendEvent(event, { chartRoot, patientId: "patient_001" });
await currentState({ scope, axis: "all" });
```

## View primitives

The read surface is six functions (DESIGN §4). UI panels, agent context
pulls, and derived renders are all compositions of these:

| View          | UI rendering                                                |
|---------------|-------------------------------------------------------------|
| `timeline`    | chronological list / flowsheet row                          |
| `currentState`| sidebar panels (problems, constraints, open intents, vitals)|
| `trend`       | line chart                                                  |
| `evidenceChain`| collapsible tree / breadcrumb from any claim               |
| `openLoops`   | task list / shift summary                                   |
| `narrative`   | notes pane                                                  |

Return shapes are JSON-serializable (ISO strings, no `Date`s or
streams) so the same contract works for agents, tests, and any future
HTTP surface.

## Invariants

Machine-checked by `validateChart`. Full list with error messages in
DESIGN §8; ten in v0.2:

1. Every claim carries `source`, `effective_at`, `recorded_at`, `author`, `status`.
2. Append-only — corrections create new events with `links.supersedes` / `links.corrects`.
3. `_derived/` is never authoritative.
4. No orphan claims — every `links.*` target exists within the same patient.
5. Assessments include at least one observation / vitals ref / artifact_ref in `links.supports`.
6. **Patient isolation** — writes match `patients/<id>/chart.yaml.subject` **and** the directory name; cross-patient links rejected.
7. **Session transparency** — author captured at write time; agents pass explicit author; session never retroactively rewrites.
8. **Supersession monotonicity** — no circular chains, at most one supersessor per event.
9. **MIMIC provenance** (Phase 3) — structured `source` fields for imported events.
10. **Fulfillment typing** — `links.fulfills` targets must be `intent`; `links.addresses` targets must be problem-subtype assessment or intent.

## Clock source

Per-patient `chart.yaml` declares `clock: sim_time | wall_time` plus an
optional `sim_start` and `timezone`. View primitives default `asOf` to
chart-clock "now" (sim charts use latest authored timestamp; wall charts
use real time) so replayed simulations stay internally coherent.

## Getting started

```bash
npm install
npm run check       # rebuild _derived/ + validate every patient
npm test            # unit suites
npm run migrate .   # v0.1 → v0.2 layout (idempotent)
npm run validate -- --patient patient_001   # scope to one patient
```

## Commit discipline

One commit per **agent decision cycle**, not per claim.

A cycle is a coherent clinical transaction — for example:
```
read monitor → append vitals observations → append assessment →
append intent/plan → write note → commit
```

Commit messages reflect the cycle's clinical meaning:
```
cycle: escalation trigger met; SpO2 89% sustained, SBAR to provider
```

## Growth path

- **v0.2 (now):** multi-patient layout, view primitives, explicit
  fulfillment links, MIMIC provenance structure.
- **Phase 3:** MIMIC-IV ingestion (`src/importers/mimic-iv/`). Deferred
  pending CSV staging; see DESIGN §5 and §10.
- **Phase 4:** UI. Separate design doc when ready; will compose view
  primitives.
- **Later:** SQLite index over `events.ndjson` when grep gets slow;
  vector index over notes for fuzzy retrieval; FHIR as boundary adapter
  (never internal model).

## The pi-sim boundary

`pi-sim` is the hidden simulator. The agent does not have access to it.
An extension observes monitor output from `pi-sim` (the public
`vitals/current.json` surface only) and appends vitals events into the
chart with `source.kind: "monitor_extension"`. Patient-reported symptoms
arrive via `source.kind: "patient_statement"`. Agent-derived conclusions
carry `source.kind: "agent_inference"` or `"agent_reasoning"`.

This asymmetry is the point. The agent only knows what has been
observed, reported, inferred, or documented — never ground truth.
That's how clinical work actually operates.
