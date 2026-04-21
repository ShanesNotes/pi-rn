# pi-chart ROADMAP

What is shipped, what is next, what is deferred. Churns freely — update
in the same commit that moves a phase forward.

DESIGN.md is the spec; this doc is the schedule over it.

---

## Shipped — v0.2 (2026-04-19)

- Multi-patient layout (`patients/<id>/`)
- `PatientScope` API; patient isolation invariants (6)
- Session + author ergonomics; `sessions/current.yaml` autofill
- All six view primitives: timeline, currentState, trend,
  evidenceChain, openLoops, narrative
- Write path: `appendEvent`, `writeNote`, `writeCommunicationNote`,
  `writeArtifactRef`
- Validator: invariants 1–10
- Migration script: v0.1 → v0.2 (idempotent)
- Seed: `patient_001` — respiratory decompensation teaching case
- 128 tests passing

---

## Current focus — deepen before integration

The near-term goal is to **thicken pi-chart against realistic clinical
content before wiring pi-agent into it**. Research-heavy, code-light.
Two parallel tracks:

### Track A — clinical depth (research)

- What a real chart actually contains at each phase of an ICU encounter.
- Domain source of truth lives in `clinical-reference/` (intake from
  external research + operator's ICU-nursing experience).
- Output: documented note types, flowsheet conventions, order/assessment
  patterns, handoff structures. Flows into DESIGN.md only when primitive
  gaps surface; otherwise stays as reference.

### Track B — synthetic patients (build)

- Pivot away from MIMIC-IV ingestion (see `decisions/001-mimic-to-synthea.md`).
- Build a small set of hand-crafted + Synthea-seeded patients that
  exercise the view primitives against realistic trajectories.
- Target breadth: ≥5 patients, varied admit contexts, multi-day
  encounters, follow-up notes, order/assessment/intent chains deep
  enough to stress `evidenceChain` and `openLoops`.

Exit criteria for "deepened enough": a nurse (operator) can open any
seeded chart's `_derived/current.md` and recognize it as a plausible ICU
chart, not a demo fixture.

---

## Seams — unresolved boundaries (block agent integration)

| # | Seam                                      | Owner decision needed                         | Status |
|---|-------------------------------------------|-----------------------------------------------|--------|
| 1 | pi-sim vitals schema ↔ ingest translator  | translate in extension vs. rename sim fields  | open   |
| 2 | encounter_id resolution for ingest        | sim emits it, vs. chart lookup from latest    | open   |
| 3 | chart-tools Pi extension against v0.2     | rewrite `_imports/pi-agent-chart-tools-spec.md` for `PatientScope` + session autofill | open   |
| 4 | `Status` enum — missing `"failed"`         | add + bump schema_version                     | open   |
| 5 | ICU stay granularity (DESIGN §5.2)        | context event vs. care_location_segments vs. observation subtype | open   |

None of these block v0.2's existing functionality; all block the
pi-agent ↔ pi-chart ↔ pi-sim loop.

---

## Phase 3 — Synthea import (deferred, not blocked)

- Per `decisions/001`, the historical-data source is Synthea, not MIMIC.
- Scope: `src/importers/synthea/`, provenance preservation
  (`source.kind: "synthea_import"` + structural original ids), manifest
  writer (`_imports/synthea/manifest.yaml` per patient), idempotent
  rebase logic.
- Start only after Track A/B produce a stable picture of what a
  realistic chart looks like — otherwise the importer's target shape
  keeps moving.

---

## Phase 4 — UI (deferred)

Separate design doc. Will compose view primitives. Not started.

---

## Later / speculative

- SQLite index over `events.ndjson` when grep gets slow.
- Vector index over notes for fuzzy retrieval.
- FHIR as boundary adapter (never internal model).
- Multi-user sessions (v0.2 is single-user by design).
- Time-travel queries (`asOf` is already parameterized; expose in UI).
