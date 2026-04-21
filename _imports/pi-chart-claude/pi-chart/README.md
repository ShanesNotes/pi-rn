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
├── chart.yaml                # chart-level metadata
├── patient.md                # baseline
├── constraints.md            # allergies, code status, preferences, goals
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
├── scripts/                  # validate.py, rebuild_derived.py
└── pi_chart/                 # Python tool surface (read/write boundary)
```

## The five invariants

These are non-negotiable. The validator enforces the machine-checkable subset
of these invariants; the rest depend on author discipline and Git review.

1. **pi-sim truth is never written directly.** Only observed monitor outputs,
   patient reports, agent assessments, and documented actions enter the chart.
   Every event carries `source.kind` identifying the provenance chain.

2. **pi-chart is append-oriented.** Corrections create new events with
   `links.supersedes` or `links.corrects`. No mutation of prior claims.

3. **Derived files are not authoritative.** Anything under `_derived/` can be
   deleted and rebuilt from canonical sources.

4. **Every claim has `source`, `effective_at`, `recorded_at`, `author`, and
   `status`.** No orphan claims.

5. **Assessments link to supporting observations when possible.** Prevents the
   agent from smuggling unsupported conclusions into the chart.

## The write boundary

Even though the backing store is a filesystem, the agent writes through
`pi_chart/` — not arbitrary file edits. The API is intentionally tiny:

```python
from pi_chart import (
    read_patient_context,
    read_recent_events,
    read_recent_notes,
    read_active_constraints,
    append_event,
    write_note,
    write_artifact_ref,
    rebuild_derived,
    validate_chart,
)
```

See `pi_chart/__init__.py` for signatures.

## Commit discipline

One commit per **agent decision cycle**, not per claim.

A cycle is a coherent clinical transaction — for example:
```
read monitor → append vitals observations → append assessment →
append intent/plan → write note → commit
```

Commit messages should reflect the cycle's clinical meaning:
```
cycle: escalation trigger met; SpO2 89% sustained, SBAR to provider
```

## Clock source

`chart.yaml` declares the chart's clock via `clock: sim_time | wall_time`
plus an optional `sim_start`. The read API (`read_recent_events`) defaults
its `as_of` to the latest `effective_at` in the chart, so simulation events
remain "recent" relative to themselves regardless of how much wall-clock
time has elapsed since authoring. Pass an explicit `as_of` to override.

## Growth path

- **v0 (now):** filesystem + NDJSON + markdown + validator. No database.
- **When reads get slow:** add SQLite as a generated, disposable index over
  `events.ndjson`. Never a source of truth.
- **When retrieval gets fuzzy:** add a vector index as a generated retrieval
  layer over notes and assessments.
- **When interop is needed:** FHIR as a boundary adapter, not an internal model.
  No Medplum dependency inside the primitive core.

## Getting started

```bash
# validate the chart against schemas + invariants
python scripts/validate.py

# rebuild _derived/ views from canonical sources
python scripts/rebuild_derived.py
```

## The pi-sim boundary

`pi-sim` is the hidden simulator. The agent does not have access to it. An
extension observes monitor output from `pi-sim` and writes vitals events into
this chart with `source.kind: "monitor_extension"`. Patient-reported symptoms
arrive via `source.kind: "patient_statement"`. Agent-derived conclusions carry
`source.kind: "agent_inference"` or `"agent_reasoning"`.

This asymmetry is the point. The agent only knows what has been observed,
reported, inferred, or documented — never ground truth. That's how clinical
work actually operates.
