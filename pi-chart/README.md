# pi-chart

The durable clinical memory surface for `pi-agent`, running against `pi-sim`.

Not an EHR clone. A minimal, append-oriented, provenance-rich clinical memory
substrate for an AI agent operating under partial observability.

## Core thesis

> The chart is canonical. Current state is a query. Derived summaries are disposable.

There is no separate "memory" system. The chart *is* the agent's long-term memory
for a patient. Short-term memory is whatever's in the agent's current context
window. Long-term memory is whatever has been durably written here.

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

The envelope schema (`schemas/event.schema.json`) is the ontology. Markdown and
NDJSON are carriers.

## Directory layout

```
pi-chart/
├── README.md                 # this file
├── CLAIM-TYPES.md            # event types, subtypes, data shapes
├── chart.yaml                # chart-level metadata (subject, clock, mode)
├── patient.md                # baseline
├── constraints.md            # allergies, code status, preferences (structured + narrative)
├── timeline/
│   └── YYYY-MM-DD/
│       ├── encounter_NNN.md  # encounter header (one per encounter)
│       ├── events.ndjson     # atomic structured events, one per line
│       ├── vitals.jsonl      # monitor stream, one sample per line
│       └── notes/
│           └── HHMM_<slug>.md
├── artifacts/                # native files referenced from events
├── _derived/                 # disposable views — DO NOT hand-edit
├── schemas/                  # JSON Schemas for validation
├── scripts/                  # TS CLIs (validate, rebuild)
└── src/                      # TS API surface (read/write/derived/validate)
```

## The five invariants

These are non-negotiable. The validator enforces the machine-checkable subset
of these invariants; the rest depend on author discipline and Git review.

1. **pi-sim truth is never written directly.** Only observed monitor outputs,
   patient reports, agent assessments, and documented actions enter the chart.
   Every event carries `source.kind` identifying the provenance chain.

2. **pi-chart is append-oriented.** Corrections create new events with
   `links.supersedes` or `links.corrects`. No mutation of prior claims.
   `writeNote` rejects overwrites.

3. **Derived files are not authoritative.** Anything under `_derived/` can be
   deleted and rebuilt from canonical sources.

4. **Every claim has `source`, `effective_at`, `recorded_at`, `author`, and
   `status`.** Clinical types also require `encounter_id`, `certainty`, `data`,
   and `links`. `appendEvent` raises if any are missing.

5. **Assessments link to supporting observations or vitals evidence.**
   Validator enforces: an `assessment` event's `links.supports[]` must include
   at least one `observation` event, `vitals://` URI, or `artifact_ref` event.

## The write boundary

Even though the backing store is a filesystem, the agent writes through `src/`
— not arbitrary file edits. The API is intentionally tiny:

```ts
import {
  // reads
  readPatientContext,
  readActiveConstraints,    // returns { structured, body }
  readRecentEvents,         // sim-time aware
  readRecentNotes,
  readLatestVitals,
  latestEffectiveAt,

  // writes (raise on contract violation)
  appendEvent,              // validates finalized payload + subject + explicit id
  writeNote,                // refuses overwrite; validates before persistence
  writeCommunicationNote,   // rollback-safe single-writer note + matching comm event
  writeArtifactRef,
  nextEventId,
  nextNoteId,

  // derived + validate
  rebuildDerived,           // inline; no subprocess
  validateChart,            // returns { ok, errors, warnings }
} from "./src/index.js";
```

## Clock source

`chart.yaml` declares the chart's clock via `clock: sim_time | wall_time`
plus an optional `sim_start`. `readRecentEvents` defaults its `asOf` to the
latest `effective_at` in the chart, so simulation events remain "recent"
relative to themselves regardless of how much wall-clock time has elapsed
since authoring. Pass an explicit `asOf` to override.

Write-time generation is separate from read clock selection:
- generated write timestamps, generated IDs, and generated day directories use
  `chart.yaml.timezone` when present;
- if `timezone` is absent, generated write timestamps fall back to UTC;
- caller-supplied timestamps are preserved verbatim;
- `readRecentEvents` returns only events within the inclusive window
  `cutoff <= effective_at <= asOf`, and skips invalid timestamps.

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

- **v0 (now):** filesystem + NDJSON + markdown + ajv validator. No database.
- **When reads get slow:** add SQLite as a generated, disposable index over
  `events.ndjson`. Never a source of truth.
- **When retrieval gets fuzzy:** add a vector index as a generated retrieval
  layer over notes and assessments.
- **When interop is needed:** FHIR as a boundary adapter, not an internal model.

## Getting started

```bash
npm install
npm run check     # rebuild derived + validate
npm test          # run unit suites
```

## The pi-sim boundary

`pi-sim` is the hidden simulator. The agent does not have access to it. An
extension observes monitor output from `pi-sim` (the public `vitals/current.json`
surface only — never internals like `timeline.json`) and appends vitals events
into this chart with `source.kind: "monitor_extension"`. Patient-reported symptoms
arrive via `source.kind: "patient_statement"`. Agent-derived conclusions carry
`source.kind: "agent_inference"` or `"agent_reasoning"`.

This asymmetry is the point. The agent only knows what has been observed,
reported, inferred, or documented — never ground truth. That's how clinical
work actually operates.
