# clinical-reference/

Domain research on what a real EHR / ICU chart contains. Feeds pi-chart
design; is not itself code or spec.

## Purpose

pi-chart's load-bearing primitives are fixed (DESIGN.md §1). What
*content* flows over those primitives — note types, flowsheet cadence,
order conventions, handoff structure, assessment patterns — is still
being discovered. This folder is where that discovery lives.

## Current accepted reference

- `broad-ehr-skeleton.md` — accepted first-pass breadth contract for
  clinical-memory usefulness across flowsheets/vitals, nursing assessment,
  notes, orders/meds/interventions, labs/diagnostics, and care
  plan/handoff.
- `phase-a/` — active artifact research for the broad EHR skeleton.
  Current local state: A0a-A4b are present; A5-A9b remain unproduced;
  `OPEN-SCHEMA-QUESTIONS.md` is the compilation surface for unresolved
  schema questions. `patients/patient_001` is still a narrow respiratory
  seed, not the completed broad EHR fixture.

## What goes here

- Notes from external research (web iteration with Opus, papers,
  professional-association guidance, operator's ICU-nursing experience).
- Annotated examples of note formats (SBAR, I-SBAR-R, SOAP, focus
  charting, narrative nursing notes).
- Flowsheet conventions: what gets charted every hour vs. per event vs.
  per shift. ICU vitals vs. floor vitals vs. OR anesthesia record.
- Order lifecycle: how a medication order moves from written → verified
  → dispensed → administered → MAR signature → effect observed.
- Assessment patterns: system-based review vs. focused assessment vs.
  rapid response narrative.
- Handoff structures: bedside shift report, SBAR to provider, transfer
  summary, discharge summary.
- Regulatory / safety artifacts: restraint documentation, pressure
  injury staging, fall-risk scoring, code-status attestation.

Anything that informs "what the chart must be able to express" — without
yet committing pi-chart to expressing it.

## What does NOT go here

- Code, schemas, or API contracts — those live in `src/` and `schemas/`.
- Committed design decisions — those live in `DESIGN.md`.
- Pivots / choice rationale — those live in `decisions/`.
- Synthea or MIMIC import mechanics — Phase 3 importer concern.

## Flow into the project

```
clinical-reference/   (noisy, discovery)
    │
    ▼  something durable emerges
decisions/NNN-*.md    (ADR — we chose this)
    │
    ▼  spec update required
DESIGN.md             (spec — this is now load-bearing)
    │
    ▼  code follows
src/ + schemas/
    │
    ▼  map updates
ARCHITECTURE.md
```

A reference document that never produces an ADR is still useful — it's
background for authoring realistic seed patients (ROADMAP Track B).

## Naming

No strict convention. Suggested:

- `notes/<topic>.md` — individual research notes
- `formats/<note-type>.md` — annotated note-format examples
- `flowsheet/<context>.md` — charting-cadence references
- `sources.md` — running bibliography

Reorganize freely; this folder is a notebook, not an API.
