# pi-chart ARCHITECTURE

How the pi-chart v0.2 spec (`DESIGN.md`) is realized in code. This doc
is a map, not a spec — when the code moves, this doc moves with it.
When the contract moves, `DESIGN.md` moves first.

**Invariant layering:**

```
PRIMITIVES        DESIGN.md §1              foundation; changes via ADR
SPEC              DESIGN.md §2–§10          schemas, invariants, views
CODE MAP          ARCHITECTURE.md (this)    modules, flow
ROADMAP           ROADMAP.md                phases, deferrals
DECISIONS         decisions/NNN-*.md        ADRs for pivots
```

---

## 1. Module map

All paths relative to `pi-chart/`. Tests are colocated (`*.test.ts`).

### 1.1 Public surface — `src/index.ts`

The only module pi-agent, extensions, and scripts are allowed to import
from. Re-exports reads, writes, views, validate, session helpers, and
types. Internal modules must not be imported directly by callers outside
`src/`.

### 1.2 Reads — `src/read.ts`

Lightweight projections used by tests and bootstrapping. Prefer view
primitives (§1.6) for agent-facing reads.

| Function              | Returns                                                      |
|-----------------------|--------------------------------------------------------------|
| `readPatientContext`  | `patient.md` + `constraints.md` parsed + latest encounter id |
| `readActiveConstraints` | active constraint events                                   |
| `readRecentEvents`    | last N envelopes from `events.ndjson` (time-desc)            |
| `readRecentNotes`     | last N notes across timeline directories                     |
| `readLatestVitals`    | most recent vitals frame                                     |
| `latestEffectiveAt`   | max `effective_at` across claims (drives sim-clock "now")    |

### 1.3 Writes — `src/write.ts`

Every write takes a `PatientScope` (`{chartRoot, patientId}`) and an
`author`. Raises on local contract violation (schema shape, patient
isolation, explicit id/path collisions). Graph-wide link typing,
referential integrity, and support sufficiency still land in
`validateChart()` today.

| Function                  | Writes to                                          |
|---------------------------|----------------------------------------------------|
| `appendEvent`             | `timeline/YYYY-MM-DD/events.ndjson`                |
| `writeNote`               | low-level `timeline/YYYY-MM-DD/notes/HHMM_<slug>.md` write only |
| `writeCommunicationNote`  | sanctioned note + associated communication event pair |
| `writeArtifactRef`        | `artifacts/` + `artifact_ref` event                |
| `nextEventId`/`nextNoteId`| id allocator (stable, locally-unique per patient)  |

### 1.4 Validate — `src/validate.ts`

Implements DESIGN §8 invariants 1–10. Entry: `validateChart(scope?)`.
Walks patient dirs (all or scoped), checks schemas, resolves links,
enforces patient isolation, note↔communication binding, assessment
support sufficiency, supersession monotonicity, and fulfillment
/ addresses target typing. CLI wrapper: `scripts/validate.ts`.

### 1.5 Derived — `src/derived.ts`

Rebuilds `_derived/` per patient. Disposable. Deleting and regenerating
must be a no-op (invariant 3). CLI wrapper: `scripts/rebuild-derived.ts`.

### 1.6 Views — `src/views/`

The six view primitives (DESIGN §4). Pure, JSON-serializable, axis-aware.
No `Date` objects, no streams — ISO strings and plain objects only.

| Primitive      | File                  | Purpose                                   |
|----------------|-----------------------|-------------------------------------------|
| `timeline`     | `timeline.ts`         | chronological claim list / flowsheet row  |
| `currentState` | `currentState.ts`     | active problems, constraints, intents     |
| `trend`        | `trend.ts`            | numeric series over a metric              |
| `evidenceChain`| `evidenceChain.ts`    | collapsible supports/supersedes tree      |
| `openLoops`    | `openLoops.ts`        | pending/overdue intents                   |
| `narrative`    | `narrative.ts`        | notes pane                                |

`views/active.ts` is shared supersession/correction logic consumed by
`currentState` and `openLoops`.

### 1.7 Time — `src/time.ts`

Chart-clock abstraction (DESIGN §7). Each patient's `chart.yaml`
declares `clock: sim_time | wall_time`. `chartClock(meta)` returns a
`Clock` whose `now()` is `latestEffectiveAt` for sim charts, real time
for wall charts. View primitives default `asOf` to `clock.now()`.

### 1.8 Session — `src/session.ts`

Reads `sessions/current.yaml` (gitignored, DESIGN §3). Returns
best-effort defaults for `author`, `patientId`, `chartRoot`. All
`try*` functions — never throws on missing session. Agents pass
explicit scope; CLIs fall back to session autofill.

### 1.9 Evidence / URIs — `src/evidence.ts`

`parseEvidenceRef` accepts bare ids / `vitals://` shorthand plus
structured `EvidenceRef` objects for event, vitals, note, and artifact
references. `formatVitalsUri`/`isVitalsUri` use the
`vitals://<encounter_id>?name=<metric>&from=<iso8601>&to=<iso8601>`
shape (DESIGN §4.5), and artifact refs resolve patient-root-relative
paths under the patient directory.

### 1.10 Types & schemas

- `src/types.ts` — `PatientScope`, `Event`, `Note`, `Author`, `Source`,
  `Link`, status/certainty enums.
- `src/schema.ts` — AJV loader for `schemas/*.schema.json`.
- `schemas/event.schema.json` — the canonical envelope, with conditional
  `allOf` for clinical types; `links.supports[]` admits bare ids /
  vitals:// shorthand plus structured `EvidenceRef` objects.
- `schemas/note.schema.json` — note frontmatter, including required
  `references[]` and the bidirectional note↔communication contract that
  validator code checks.
- `schemas/vitals.schema.json` — vitals rows, including `quality`
  (`invalid` samples are dropped by `currentState`; `questionable` stays visible).
- Other schemas: `constraints`, `pi-chart` (registry), `session`.

### 1.11 Scripts (`scripts/`)

Thin `tsx` wrappers over library code. No business logic.

| Script                     | Wraps                       |
|----------------------------|-----------------------------|
| `migrate-v01-to-v02.ts`    | v0.1 → v0.2 layout migration|
| `rebuild-derived.ts`       | `rebuildDerived`            |
| `validate.ts`              | `validateChart`             |

---

## 2. Data flow

### 2.1 Write path (agent / extension → disk)

```
caller (agent, monitor-extension, CLI, test)
   │
   ▼  import from src/index.ts
appendEvent(event, scope) / writeCommunicationNote(...) / writeArtifactRef(...)
   │
   ▼  enforces locally: schema valid, subject matches scope, append-only/id guardrails
write.ts
   │
   ▼  graph-wide integrity (links resolve, note binding, target typing, support rules)
validateChart
   │
   ▼  atomic append
patients/<id>/timeline/YYYY-MM-DD/{events.ndjson | notes/*.md | vitals.jsonl}
   │
   ▼  out-of-band
scripts/rebuild-derived  →  patients/<id>/_derived/   (disposable cache)
scripts/validate         →  green/red; invariants 1–10
```

### 2.2 Read path (agent / UI → view)

```
caller
   │
   ▼
views/{timeline | currentState | trend | evidenceChain | openLoops | narrative}
   │
   ▼  read.ts primitives + schema load + clock resolution
events.ndjson + notes/*.md + vitals.jsonl + chart.yaml
   │
   ▼  pure projection, no I/O beyond load
JSON-serializable view payload  →  agent context / UI / derived render
```

### 2.3 Ingest path (pi-sim monitor → chart)

Target shape (not yet implemented; see ROADMAP + `_imports/pi-monitor-ingest-spec.md`):

```
pi-sim/vitals/current.json   (ground-truth physiology output)
   │
   ▼  monitor-extension (Pi extension; lives in pi-agent/.pi/extensions/)
translate fields (hr→heart_rate, t→effective_at resolution, etc.)
   │
   ▼  src/index.ts  →  appendEvent(observation w/ source.kind="monitor_extension")
patients/<id>/timeline/YYYY-MM-DD/events.ndjson + vitals.jsonl
```

Schema contract between pi-sim and the ingest translator is **not yet
locked**. Tracked in ROADMAP §"Seams."

### 2.4 Import path (Synthea → chart) — Phase 3, deferred

```
Synthea CSV/FHIR output
   │
   ▼  src/importers/synthea/   (not yet implemented; see decisions/001)
normalize → envelopes with source.kind="synthea_import"
   │
   ▼  appendEvent(...) — same write path as runtime
patients/<id>/timeline/.../events.ndjson + _imports/synthea/manifest.yaml
```

See `decisions/001-mimic-to-synthea.md` for the pivot rationale.

---

## 3. Boundaries

### 3.1 Internal

- Callers outside `src/` import **only** from `src/index.ts`.
- `src/views/` modules do not write. Writes flow through `src/write.ts`.
- `_derived/` is never read by write-path code, never treated as source
  of truth (invariant 3).

### 3.2 External

- **pi-sim** never imports pi-chart code. Pi-chart never reads pi-sim
  files directly — only through an ingest extension that translates
  `vitals/current.json`.
- **pi-agent** consumes pi-chart only via `src/index.ts` exports bound
  as Pi tools. No raw file access.
- **FHIR / external EHR** — boundary adapters only, never internal
  model. Deferred.

---

## 4. Testing

128 tests, colocated (`*.test.ts`). Strong coverage on active
semantics, supersession, evidence chain depth/cycles, openLoops state
machine, write-side invariants, cross-patient link rejection, session
autofill, determinism.

Run: `npm test`. Integration check: `npm run check` (rebuild derived +
validate all patients).

Gap: no fuzz/property tests on claim graphs; no perf tests over large
import volumes (relevant once Synthea import lands).
