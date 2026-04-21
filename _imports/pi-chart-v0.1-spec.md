# pi-chart v0.1 optimization manifest

Single source of truth for the v0.1 hardening pass. Reconciles `pi-chart-scaffold-optimizations.md` (file-by-file review + council ranking) into a deduplicated, ranked, phase-tagged change list.

**Decisions baked in** (from user):

- Vitals evidence link mechanism: **interval URI ref** (`vitals://enc_id?name=…&from=…&to=…`)
- `_derived/` git policy: **ignore `_derived/*.md`, keep `_derived/README.md`**
- Phase B scope: **design changes only** — skip Python-impl-only polish (Makefile vars, FormatChecker syntax, persistent ID counter rewrite, dict-copy nit)
- Target language: **TypeScript** (Python = design reference; pi-impl polish translates naturally during port)
- Boundary: `pi-chart/` canonical; `pi-agent/chart/` already deleted
- Sim integration: monitor surface only (`pi-sim/vitals/current.json`); never `timeline.json` or sim internals

---

## Section 1 — Schema changes

### 1.1 New: `schemas/constraints.schema.json`

Structured frontmatter for `constraints.md`. Author-time optional; once authored the validator enforces shape. Intent: agent should not parse prose to avoid penicillin.

```jsonc
{
  "$id": "https://pi-rn.local/schemas/constraints.schema.json",
  "type": "object",
  "properties": {
    "allergies": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["substance", "status"],
        "properties": {
          "substance": { "type": "string" },
          "reaction":  { "type": "string" },
          "severity":  { "enum": ["mild", "moderate", "severe", "anaphylaxis", "unknown"] },
          "source":    { "type": "string" },   // e.g. patient_report, chart_history
          "status":    { "enum": ["active", "inactive", "entered_in_error"] }
        }
      }
    },
    "code_status": { "enum": ["full_code", "dnr", "dni", "dnr_dni", "comfort_only", "unspecified"] },
    "preferences":         { "type": "array", "items": { "type": "string" } },
    "access_constraints":  { "type": "array", "items": { "type": "string" } },
    "advance_directive":   { "type": "string" }   // free-text or doc ref
  }
}
```

### 1.2 `schemas/event.schema.json` — conditional requirements + URI in supports

- Split required-fields by `type` via `allOf` + `if/then`.
- **Clinical types** (`observation`, `assessment`, `intent`, `action`, `communication`, `artifact_ref`): also require `encounter_id`, `certainty`, `data`, `links`.
- **Structural types** (`subject`, `encounter`, `constraint_set`): keep current minimal required set.
- `links.supports[]` items: allow either an event-id string OR a string starting with `vitals://`. Document the URI grammar in the schema description.
- Removes the need for the brittle `err.validator_value[0]` exemption in the validator.

### 1.3 `schemas/note.schema.json` — references required

- Make `references` required (may be empty array). Documents the validator's referential integrity intent and removes the "did the author mean to leave it out?" ambiguity.

### 1.4 New: `schemas/vitals.schema.json`

Per-row schema for `vitals.jsonl`. Used by validator + (later) ajv in TS port.

```jsonc
{
  "$id": "https://pi-rn.local/schemas/vitals.schema.json",
  "type": "object",
  "required": ["sampled_at", "subject", "encounter_id", "source", "name", "value"],
  "properties": {
    "sampled_at":   { "type": "string", "format": "date-time" },
    "subject":      { "type": "string" },
    "encounter_id": { "type": "string" },
    "source": {
      "type": "object",
      "required": ["kind"],
      "properties": {
        "kind": { "type": "string" },        // e.g. monitor_extension, lab_instrument
        "ref":  { "type": "string" }
      }
    },
    "name":    { "type": "string" },
    "value":   {},                            // permit number/string/bool by metric
    "unit":    { "type": "string" },
    "context": { "type": "object" },          // e.g. o2_device, o2_flow_lpm
    "quality": { "enum": ["valid", "questionable", "invalid"] },
    "artifact": { "type": "string" }          // e.g. motion_possible
  }
}
```

---

## Section 2 — Write-boundary contracts

Source: `pi_chart/write.py` review. The most important hardening target. Council priority #1.

### 2.1 `appendEvent` — required-field enforcement

Before any append:

- Raise on missing: `type`, `subject`, `effective_at`, `author`, `source`, `status`.
- For clinical types (per 1.2), also raise on missing `encounter_id`, `certainty`, `data`, `links`.
- (Optional but recommended) Run schema validator on the event before append; raise with the validation error.

### 2.2 `writeNote` — no silent overwrite

- If target file exists, raise `FileExistsError`/equivalent. Append-oriented discipline forbids overwrite; corrections are new notes that link `supersedes`.

### 2.3 New: `writeCommunicationNote` helper

Single call performs both atomic steps:

1. Write the note file (via `writeNote`).
2. Append the matching `communication` event whose `data.note_ref` cites the note id.

Caller still has access to the low-level pieces; this is the recommended default to prevent forgetting the inverse link.

### 2.4 Deferred (Python-impl polish, picked up in TS port)

- Persistent cross-process ID counter — TS port uses file-probe per write.
- Don't mutate caller's dict — TS port is functional by default (immutable inputs).

---

## Section 3 — Read API contracts

Source: `pi_chart/read.py` review.

### 3.1 Sim-time defaults

- Add helper `latestEffectiveAt(chartRoot)`.
- `readRecentEvents` defaults `asOf` to `latestEffectiveAt` (or chart-clock `now`) instead of wall-clock `utcnow`. Otherwise simulation events look "not recent" because real time has moved on.

### 3.2 Parse timestamps for comparison

- `readLatestVitals` currently compares ISO strings. Works only if formats are byte-identical. Parse to `Date`/`datetime` and compare.

### 3.3 Structured constraints output

- `readActiveConstraints` returns `{ structured: Constraints | null, body: string }` — both the parsed frontmatter (per 1.1) and the narrative body. Agent picks which it needs.

---

## Section 4 — Validator semantics

Source: `scripts/validate.py` review + council priorities #5–#7.

### 4.1 Bidirectional note ↔ communication

- For every note id `note_*`: there must exist a `communication` event whose `data.note_ref` points to it. (Currently only the inverse direction is checked.)
- For every `communication` event with `data.note_ref`: the referenced note must exist. (Already checked; keep.)

### 4.2 Note `references[]` resolution

- Each id in a note's `references` must resolve to an existing event or note id. (Currently unchecked.)

### 4.3 Subject match

- Every event/note `subject` field must equal `chart.yaml.subject`. Catches multi-patient mixing early.

### 4.4 Day-directory prefix warning

- If an event lives in `timeline/YYYY-MM-DD/events.ndjson`, warn (not error) when `effective_at` doesn't start with `YYYY-MM-DD`. Common authoring mistake.

### 4.5 Vitals URI parser + window check

- When a `links.supports` item starts with `vitals://`, parse it.
- Verify at least one matching vitals sample exists in the named encounter, with the named metric, within `[from, to]`. Empty window → error.

URI grammar:

```
vitals://<encounter_id>?name=<metric>&from=<iso8601>&to=<iso8601>[&unit=<unit>]
```

### 4.6 Assessment evidence rule

- An `assessment` event's `links.supports` must include at least one of:
  - an `observation` event id
  - a `vitals://` URI
  - an `artifact_ref` event id

Currently the check only verifies `links.supports` is non-empty.

### 4.7 Vitals row validation

- Apply `schemas/vitals.schema.json` per row.
- Enforce required `subject`, `encounter_id`, structured `source`.

### 4.8 Brittle exemption block — replace

- Replace `err.validator_value[0] in {…}` exemption logic with the conditional schema introduced in 1.2. The exemption block was only correct by coincidence (and would silently break when fields became required).

### 4.9 Deferred (Python-impl polish, baked into TS port)

- `FormatChecker` for `date-time` — TS port uses `ajv-formats` which enforces by default.

---

## Section 5 — Structured validation report

Source: `pi_chart/validate.py` review.

### 5.1 Return shape

```jsonc
{
  "ok": false,
  "errors":   [ { "where": "timeline/.../events.ndjson:3", "message": "..." } ],
  "warnings": [ { "where": "...", "message": "..." } ]
}
```

CLI script (`scripts/validate.py` / `scripts/validate.ts`) maps `ok=false` → exit code 1.

Lets the agent inspect failures and self-repair, instead of reading a boolean.

---

## Section 6 — Derived view fixes

Source: `scripts/rebuild_derived.py` review.

### 6.1 `_derived/current.md` — deterministic timestamp

- Replace `_as of <wall-clock now>_` with `_as of latest chart event: <max effective_at>_`. Eliminates noisy diffs.

### 6.2 `_derived/active-constraints.md` — drop duplicate heading

- The passthrough body retains its `# Constraints` heading; the derived file already prepends `# Active constraints`. Drop one to avoid double-titling.

### 6.3 `_derived/latest-vitals.md` — clinical ordering

- Order: `temperature`, `heart_rate`, `bp_systolic`, `bp_diastolic`, `respiratory_rate`, `spo2`, `pain`, then any others alphabetical.

---

## Section 7 — Sample data updates

Demonstrates every new pattern so the validator exercises the rules.

### 7.1 `chart.yaml`

Add fields:

```yaml
chart_id: chart_patient_001
mode: simulation
clock: sim_time
sim_start: 2026-04-18T06:00:00-05:00
```

### 7.2 `constraints.md`

Add structured frontmatter conforming to `constraints.schema.json`:

```yaml
constraints:
  allergies:
    - substance: penicillin
      reaction: anaphylaxis
      severity: anaphylaxis
      source: patient_report
      status: active
  code_status: full_code
  preferences:
    - minimize_sedation_if_possible
    - return_to_work_priority
  access_constraints: []
```

Body unchanged.

### 7.3 `timeline/2026-04-18/vitals.jsonl`

Every row gets: `subject`, `encounter_id`, structured `source: { kind, ref }`. One row carries `quality: "valid"` to demonstrate the optional field.

### 7.4 `timeline/2026-04-18/events.ndjson`

The existing `assessment` event (`evt_20260418T0830_01`) gets a `vitals://` URI added to `links.supports` so the assessment-evidence rule (4.6) and URI parser (4.5) are exercised on real data.

Each note also receives `references: []` (or a populated list) per 1.3 — actually that's note frontmatter, see 7.5.

### 7.5 `timeline/2026-04-18/notes/0845_nursing-note.md`

Frontmatter gets `references: [...]` (use the supporting evt ids the note discusses).

---

## Section 8 — Documentation tightening

### 8.1 `README.md`

- Rephrase "validator enforces them" → "validator enforces the machine-checkable subset of these invariants".
- Add a short "Clock source" paragraph explaining `chart.yaml.clock`.

### 8.2 `CLAIM-TYPES.md`

- Split the type list into "Clinical event types (six)" and "Structural chart types (three)".
- Add an "Evidence references" subsection documenting the `vitals://` URI grammar.

### 8.3 `.gitignore`

```
_derived/*.md
!_derived/README.md
```

(Plus existing Python noise — unchanged.)

### 8.4 `_derived/README.md` — verify untouched

The current text already says "delete freely / rebuild from canonical sources / canonical wins on disagreement." No change.

---

## Section 9 — Phase tagging

| Section | Phase B (Python design ref) | Phase D (TS port) | Phase E (canonical) |
|---------|-----------------------------|-------------------|---------------------|
| 1 Schemas | apply | port verbatim (JSON shared) | promote |
| 2 Write boundary | apply (raises + helper) | reimplement TS-idiomatic, immutable inputs, file-probe IDs | promote |
| 3 Read API | apply | reimplement async; structured constraints output | promote |
| 4 Validator | apply | reimplement using ajv; ajv-formats covers 4.9 | promote |
| 5 Structured report | apply | mirror | promote |
| 6 Derived | apply | reimplement inline (no subprocess) | promote |
| 7 Sample data | apply | copy across | promote |
| 8 Docs | apply | copy + light TS-port rewrite | promote |

---

## Section 10 — Deferred (NOT in v0.1)

These items appeared in the report but are explicitly out of scope until a future pass.

| Item | Source ref | Reason to defer |
|------|------------|-----------------|
| `patient.md` baseline structured frontmatter | report §patient.md | Useful but not safety-critical; narrative is fine for now. |
| Intent lifecycle expansion (`status` overload split) | report §_derived/open-intents.md | `status: active` works for v0; revisit when first cancellation/completion appears. |
| `artifacts/manifest.ndjson` | report §artifacts/README.md | Only needed if artifact volume > ~50; not yet. |
| `timeline/<date>/<encounter_id>/` subdir layout for multi-encounter days | report §timeline/ | Single-encounter-per-day is current reality. Bridge by ensuring `encounter_id` on every row (which 1.2 + 1.4 enforce). |
| SQLite generated index over `events.ndjson` | report §README §Growth path | Reads are not yet slow. |
| Vector retrieval index over notes | report §Growth path | Premature. |
| FHIR boundary adapter | report §Growth path | Premature. |
| Cross-process ID-counter locking | report §pi_chart/write.py | TS port file-probe is fine for single-agent + single ingest; locking is a v0.2 concern. |
| Pre-publish TS build / .d.ts generation | implicit | tsx-only is fine for v0. |
| Python-only polish (Makefile `PYTHON ?=`, `FormatChecker` call site, dict-copy nit, persistent counter rewrite) | report §Makefile §scripts/validate.py §pi_chart/write.py | Per user decision: design changes only in Python; impl polish lands naturally in TS. |

---

## Section 11 — Coverage check

Every numbered recommendation from `pi-chart-scaffold-optimizations.md` resolves to either a section above OR a Section 10 deferral. Cross-reference summary:

| Report item | Resolved in |
|-------------|-------------|
| `.gitignore` derived policy | 8.3 |
| `chart.yaml` chart_id/mode/clock | 7.1 |
| README "enforces" rephrase | 8.1 |
| README clock paragraph | 8.1 |
| CLAIM-TYPES clinical/structural split | 8.2 |
| CLAIM-TYPES evidence-refs section | 8.2 |
| Makefile PYTHON var | §10 (deferred) |
| `patient.md` baseline frontmatter | §10 (deferred) |
| `constraints.md` structured frontmatter | 1.1 + 7.2 |
| `encounter_id` on every row | enforced via 1.2 + 1.4 |
| Vitals evidence ref (Option B) | 1.2 + 4.5 + 7.4 |
| Vitals row provenance shape | 1.4 + 7.3 |
| Note references validator gap | 4.2 |
| Note ↔ communication bidirectional | 4.1 |
| `_derived/current.md` deterministic timestamp | 6.1 |
| `_derived/active-constraints.md` heading dup | 6.2 |
| `_derived/latest-vitals.md` clinical order | 6.3 |
| `event.schema.json` conditional reqs | 1.2 |
| `event.schema.json` allow URI in supports | 1.2 |
| `note.schema.json` references field semantics | 1.3 |
| Validator FormatChecker | §10 (TS port via ajv-formats) |
| Validator subject-match | 4.3 |
| Validator day-prefix warning | 4.4 |
| Validator stronger vitals row check | 4.7 |
| Validator brittle exemption fix | 4.8 |
| Validator assessment-evidence rule | 4.6 |
| `rebuild_derived.py` deterministic | 6.1 |
| `read.py` sim-time default | 3.1 |
| `read.py` timestamp parsing | 3.2 |
| `write.py` provenance enforcement | 2.1 |
| `write.py` no-overwrite | 2.2 |
| `write.py` write_communication_note helper | 2.3 |
| `write.py` persistent ID counter | §10 (TS port) |
| `write.py` dict-copy | §10 (TS port) |
| `derived.py` inline vs subprocess | TS port (Section 9) |
| `validate.py` structured report | 5.1 |
| Clock source design | 3.1 + 7.1 + 8.1 |
| Intent lifecycle | §10 (deferred) |
| Artifacts manifest | §10 (deferred) |
| Timeline multi-encounter layout | §10 (deferred) |

End of manifest.
