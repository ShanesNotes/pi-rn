# pi-chart DESIGN

Planning document for pi-chart v0.2. Intended audience: a human operator
and Claude Code, working together. This is the spec; `README.md` is the
primer.

**Revision:** v0.2 draft, council-reviewed 2026-04-19. All council
amendments are integrated in place. A summary of changes is appended
at the end (§11).

Scope:

1. How pi-chart becomes a **multi-patient EHR substrate** without losing
   the single-patient-chart primitive.
2. How imported historical data (Synthea primary; MIMIC-IV optional-later
   per `decisions/001-mimic-to-synthea.md`) and runtime data (pi-sim +
   pi-agent) live in the same chart as one stream of claims, not two
   modes.
3. The **view primitives** — the six projections over the claim graph
   that any agent or UI consumes.
4. **Session and author** ergonomics.
5. A staged roadmap for implementation.

Out of scope: UI stack selection, pi-sim integration, pi-agent wiring,
FHIR interop. Those get their own docs when ready.

Status: decisions below are committed unless flagged `(open)`. Claude
Code can treat committed decisions as final and open items as places to
ask.

---

## 1. Primitives — the load-bearing foundation

> **§0-level invariant.** This section is the foundation pi-chart reduces
> to. Changes here require an ADR in `decisions/` and a version bump of
> `schema_version`. Everything below §1 is implementation over these
> primitives.

> **A chart is one stream of claims. Different patients start that
> stream at different historical points. Writers differ in provenance;
> the substrate does not.**

A MIMIC lab from 2178 and a live vital from pi-sim are both envelopes.
They differ in three fields:

| Field          | MIMIC-IV ingest                          | pi-sim / pi-agent runtime             |
|----------------|------------------------------------------|---------------------------------------|
| `effective_at` | rebased historical timestamp             | ≈ now                                 |
| `recorded_at`  | time of ingestion                        | ≈ now                                 |
| `source.kind`  | `mimic_iv_import`                        | `monitor_extension`, `agent_*`, etc.  |
| `source.*`     | original MIMIC ids/timestamp structurally preserved | runtime-specific fields       |

There is no "MIMIC mode" and no "live mode." There is a MIMIC writer and
a pi-sim writer; both emit envelopes. The chart sees envelopes. This is
the core invariant and it is not broken by any downstream feature.

### Envelope disciplines (post ADRs 002–011, 2026-04-22)

The six clinical types and six view primitives remain. ADRs 002–011
refine the envelope grammar with seven link surfaces
(`supports`, `supersedes`, `corrects`, `fulfills`, `addresses`,
`resolves`, `contradicts`) plus an optional `transform` provenance
block:

- **Envelope `status` remains graph-lifecycle.** Domain lifecycle
  (`preliminary`, `on_hold`, `failed`, `declined`, `cancelled`, etc.)
  moves to optional `data.status_detail`, scoped per subtype (ADR 002).
- **Fulfillment via intermediate action.** Data-producing intents are
  closed by an acquisition action (`specimen_collection`,
  `imaging_acquired`, `procedure_performed`, `measurement`); the
  resulting observation `supports` that action. Invariant 10 stays
  intact — observations do not carry `fulfills` (ADR 003).
- **`effective_at` meaning is per-type.** Observation = physiologic
  truth-time; action = performed-at; intent = ordered-at (may be
  future-dated); communication = sent-at; artifact_ref = captured-at;
  assessment = time-of-writing. `recorded_at ≥ effective_at` except
  for scheduled intents (ADR 004).
- **Interval events via `effective_period`.** Exactly one of
  `effective_at` or `effective_period: { start, end? }` per event.
  Interval usage allow-listed per subtype (context segments, care
  plans, infusion administrations, stable device settings). Open
  intervals close via supersession (ADR 005).
- **Closed `source.kind` taxonomy.** Enumerated in §1.1 below;
  validator warn-on-unknown, promotes to error in the next minor.
  `agent_reasoning` collapses into `agent_inference` (ADR 006).
- **Link taxonomy expands and narrows.** `addresses` is now
  problem-targeting only; `resolves` closes open loops and contradiction
  chains; `contradicts` records later-written structural disagreement
  with a prior peer claim (ADR 009).
- **`EvidenceRef` has one canonical shape.** Structured refs use
  `{ ref, kind, role?, basis?, selection?, derived_from? }`; `kind`
  adds `vitals_window` and `external`, with `vitals` retained as a
  one-release alias. Bare-string support refs remain valid on the wire
  (ADR 010).
- **Optional `transform` provenance.** `transform: { activity, tool,
  version?, run_id?, input_refs? }` records processing-path provenance
  without changing `source.kind` semantics. `transform.input_refs`
  reuses the `EvidenceRef` definition (ADR 011).

These disciplines keep the §0 claim-stream model intact. They remove
ambiguity and add envelope precision so the type/link/view grammar can
carry more semantic load without introducing a second data model.

### 1.1 `source.kind` registry

Canonical, closed taxonomy (ADR 006). The validator loads the
allowed values from this table (v0.2 = warn on unknown, v0.3 =
error). Adding a new kind requires an ADR amendment updating this
registry; no schema change needed.

| Group                | `source.kind`              | Meaning                                                                 |
|----------------------|----------------------------|-------------------------------------------------------------------------|
| **Patient-origin**   | `patient_statement`        | Patient or surrogate self-report at bedside or via portal.              |
| **Clinician-origin** | `admission_intake`         | Structured admission H&P data; written by intake clinician.             |
|                      | `nurse_charted`            | Nurse-authored at the chart (observations, assessments, notes).         |
|                      | `clinician_chart_action`   | Clinical chart interaction (order entry, result review, note). Role-agnostic by design — `author.role` differentiates provider / APP / RN / RT / PharmD. |
|                      | `protocol_standing_order`  | Clinician action under a standing protocol (RN titration, RT weaning, pharmacy dosing). |
|                      | `manual_lab_entry`         | Result transcribed manually at the chart (outside-hospital result, faxed, phoned-in). |
| **Device-origin**    | `monitor_extension`        | pi-sim or equivalent live monitor ingest extension.                     |
|                      | `poc_device`               | Bedside point-of-care device (iSTAT, Accu-Chek, ACT, POCUS probe).      |
|                      | `lab_analyzer`             | Direct lab instrument interface (rare in routine flow).                 |
| **Interface-origin** | `lab_interface_hl7`        | LIS → chart via HL7 ORU (standard lab result path).                     |
|                      | `pacs_interface`           | PACS/RIS → chart interface (imaging metadata + pointers).               |
|                      | `dictation_system`         | Dictation/transcription system feed (radiology, pathology, clinic notes). |
|                      | `pathology_lis`            | Pathology LIS (anatomic and clinical pathology reports).                |
|                      | `cardiology_reporting`     | Cardiology reporting system (echo, cath, EP).                           |
|                      | `endoscopy_reporting`      | Endoscopy reporting system.                                             |
| **Agent-origin**     | `agent_inference`          | Agent-authored conclusion drawn from observed chart data.               |
|                      | `agent_bedside_observation`| Agent-authored directly observed bedside finding or environment check.  |
|                      | `agent_action`             | Agent-authored performed action in the workflow or chart.               |
|                      | `agent_synthesis`          | Agent-authored narrative or structured synthesis composed from evidence.|
|                      | `agent_reasoning`          | Deprecated synonym for `agent_inference`; validator warns and suggests migration (ADR 006). |
|                      | `agent_review`             | Agent-authored `action.result_review` (may require human confirmation). |
| **Import-origin**    | `synthea_import`           | Synthea-generated historical corpus (primary per ADR 001).              |
|                      | `mimic_iv_import`          | MIMIC-IV historical corpus (optional-later per ADR 001).                |
|                      | `manual_scenario`          | Hand-authored scenario fixture (teaching cases, Phase A fixtures).      |

Per-kind structured `source.*` field conventions (e.g.,
`lab_interface_hl7` carries `system` / `verified_by` / `raw_ref?`;
`synthea_import` carries `generator_version` / `seed` / original-ids)
are documented in CLAIM-TYPES.md. Import-origin kinds are required to
carry structured provenance per invariant 9.

Writers do not invent a generic `artifact_ingest` provenance bucket.
An `artifact_ref` event carries the canonical origin-channel that
actually produced or introduced the artifact (for example
`pacs_interface`, `lab_interface_hl7`, `manual_scenario`,
`agent_synthesis`, `clinician_chart_action`).

**Separation of concerns.** `source.kind` describes the
origin-channel (where the event entered the chart); `author.role`
describes the actor type (`provider`, `rn`, `rt`, `pharmd`,
`rn_agent`, etc.). They are orthogonal: a POC K+ drawn under an
order and one drawn ad-hoc both carry `source.kind: poc_device`; the
differentiator is `data.origin` (see ADR 003 on fulfillment
exceptions).

---

## 2. Multi-patient architecture

### 2.1 Target layout

```
pi-chart/
├── pi-chart.yaml                 # system registry (patient ids, defaults)
├── sessions/
│   ├── current.yaml              # GITIGNORED — transient workspace state
│   └── current.example.yaml      # COMMITTED — template for collaborators
├── patients/
│   └── patient_001/              # one patient's complete chart
│       ├── chart.yaml            # this patient's metadata (subject, tz)
│       ├── patient.md
│       ├── constraints.md
│       ├── timeline/
│       │   └── YYYY-MM-DD/
│       │       ├── encounter_NNN.md
│       │       ├── events.ndjson
│       │       ├── vitals.jsonl
│       │       └── notes/
│       │           └── HHMM_<slug>.md
│       ├── artifacts/
│       ├── _imports/             # import manifests; see §5.8
│       │   └── mimic-iv/
│       │       └── manifest.yaml
│       └── _derived/
├── schemas/
├── scripts/
└── src/
```

Every patient directory is a complete, self-contained pi-chart at the
same structural level v0.1 had at the repo root. You can copy a patient
directory elsewhere and it still works. The repo-level addition is the
`patients/` parent directory, a `pi-chart.yaml` registry, and a
`sessions/` workspace directory.

### 2.2 `pi-chart.yaml` (system registry)

Replaces the v0.1 root-level `chart.yaml`. Each patient has its own
`chart.yaml` that keeps the v0.1 shape.

```yaml
system_version: 0.2.0
default_timezone: America/Chicago
schema_version: 0.2.0
patients:
  - id: patient_001
    directory: patients/patient_001
    display_name: "Patient 001"
    created_at: "2026-04-18T06:00:00-05:00"
    source: synthetic            # synthetic | mimic_iv_import | manual
```

The registry is maintained by write-side library code when patients are
created or imported. It is not a source of truth — the canonical list is
`ls patients/`. The registry records creation metadata and import
source.

### 2.3 Migration from v0.1

Single-patient v0.1 becomes `patients/patient_001/`. The migration is
mechanical:

1. `mkdir -p patients/patient_001`
2. Move `patient.md`, `constraints.md`, `timeline/`, `artifacts/`,
   `_derived/`, and the per-patient portion of `chart.yaml` into it.
3. Write the new `pi-chart.yaml` at the root with one registry entry.
4. Update every library call site that takes `chartRoot: string` to also
   take a `PatientScope`. See 2.5.

A script — `scripts/migrate-v01-to-v02.ts` — does this idempotently and
in-place. The validator rejects a v0.1 layout after migration runs.

### 2.4 `sessions/` directory

- `sessions/current.yaml` is **gitignored**. It may carry an operator
  identity and current patient context and should not accrue in project
  history.
- `sessions/current.example.yaml` is **committed**. It is the template
  collaborators copy on checkout.
- `.gitignore` explicitly lists `sessions/current.yaml` (see §3).

### 2.5 Library API changes

Current write/read APIs take `chartRoot`. They gain a `PatientScope`:

```ts
interface PatientScope {
  chartRoot: string;      // repo root
  patientId: string;      // e.g. "patient_001"
}

function patientRoot(scope: PatientScope): string {
  return path.join(scope.chartRoot, "patients", scope.patientId);
}
```

The existing `assertSubjectMatches` logic stays — it just resolves the
`chart.yaml` inside the patient directory instead of the repo root. The
invariant is now *per-patient*: events written to `patients/001/` must
have `subject: patient_001`.

### 2.6 Isolation invariants

These make pi-chart an EHR rather than a chart:

1. **No cross-patient reads.** No read function takes a list of patient
   ids or walks across `patients/`. Scope is always exactly one patient.
2. **No cross-patient writes.** An event's `subject` must match the
   directory it is being written into.
3. **No cross-patient links.** `links.supports` / `supersedes` /
   `corrects` / `fulfills` / `addresses` / `resolves` /
   `contradicts[].ref` only resolve within the same patient directory.
4. **Per-patient `_derived/`.** Each patient has their own disposable
   views. Deleting one patient's `_derived/` has no effect on any other.
5. **Per-patient ids are locally unique; globally they are
   `(patientId, eventId)` tuples.** The existing event id format stays.

---

## 3. Session and author ergonomics

### 3.1 The problem

Every write requires an `author`. Typing
`{ id: "rn_shane", role: "rn" }` on every call is toil. Autofill solves
this without weakening the schema requirement.

### 3.2 `sessions/current.yaml`

```yaml
author:
  id: rn_shane
  role: rn
current_patient: patient_001     # default patient for scoped calls
current_encounter: enc_001       # default encounter; optional
```

This file is transient workspace state, singular (one session per
checkout) because v0.2 is single-user. Multi-user is later. It is **not**
part of any chart: it lives outside `patients/`, the validator ignores
it, and it can be deleted without data loss. Gitignored per §2.4.

### 3.3 `chartRoot` and session resolution — where each lives

The council flagged ambient-working-directory as a footgun. Explicit
boundaries:

- **Low-level library functions** (`appendEvent`, `writeNote` / `writeCommunicationNote`, view
  primitives): `chartRoot` is **required**. No `process.cwd()` fallback
  at this layer.
- **CLI wrappers** (`scripts/*.ts`, any future `npx pi-chart ...` bin):
  `chartRoot` defaults to `process.cwd()`. Human callers expect that.
- **Agents and tests**: **always** pass `chartRoot` + `patientId` +
  `author` explicitly. No session fallback. This is a hard rule; see
  invariant 7.

Stated as a single rule:

> **Session fallback is for humans and CLI tools. Explicit `PatientScope`
> is for agents and tests.**

### 3.4 Autofill semantics

The write-side library picks up the session at the top of each write
**only when author is not supplied by the caller**:

```ts
async function appendEvent(
  input: EventInput,
  scope: PatientScope,                     // required
): Promise<EventEnvelope> {
  const resolved = {
    ...input,
    author: input.author ?? (await tryLoadSessionAuthor(scope.chartRoot)),
  };
  // existing contract validation — throws if still missing
  checkProvenance(resolved);
  // ...
}
```

`tryLoadSessionAuthor` reads `sessions/current.yaml` if present and
returns undefined otherwise. Agents pass their own `author` and never
hit this path. The schema requirement for `author` remains unchanged —
the session is a convenience, not a weakening.

---

## 4. View primitives

The read surface is six functions. Every UI control, every agent context
pull, every export is a composition of these.

### 4.1 Principles

- Pure reads. No side effects, no writes to `_derived/`.
- Take a `PatientScope` explicitly.
- Return typed structures, not pre-rendered strings. Callers format.
- JSON-serializable return values (no functions, no class instances, no
  Node streams, no Dates — only ISO strings).
- Respect supersession: if event E is superseded by E', views treat E as
  superseded regardless of its stored `status`.
- Never cross patients.

### 4.2 `timeline(params)`

Claims between t₁ and t₂, filtered, sorted by `effective_at`.

```ts
interface TimelineParams {
  scope: PatientScope;
  from?: string;                           // ISO; default: start of day
  to?: string;                             // ISO; default: now
  types?: ClinicalType[];                  // default: all clinical types
  subtypes?: string[];                     // exact-match set
  subtypePrefix?: string;                  // e.g. "medication_"
  encounterId?: string;
  includeSuperseded?: boolean;             // default: false
}

interface TimelineEntry {
  id: string;
  type: ClinicalType;
  subtype?: string;
  effective_at: string;
  author: Author;
  summary: string;                         // type-specific one-liner
  raw: EventEnvelope;
}

async function timeline(p: TimelineParams): Promise<TimelineEntry[]>;
```

A "Labs" tab is `timeline({ types: ["observation"], subtypes:
["lab_result"] })`. A "Meds" tab is `timeline({ types: ["intent",
"action"], subtypePrefix: "medication_" })`. No `RegExp` in the public
contract — strings serialize; regexes don't.

### 4.3 `currentState(params)` — axis-specific active semantics

The set of active claims along a named axis, as of a time.

```ts
type Axis = "constraints" | "problems" | "intents" | "vitals" | "all";

interface CurrentStateParams {
  scope: PatientScope;
  asOf?: string;                           // default: now
  axis: Axis;
}

type CurrentState =
  | { axis: "constraints"; items: EventEnvelope[] }
  | { axis: "problems";    items: EventEnvelope[] }
  | { axis: "intents";     items: OpenLoop[] }
  | { axis: "vitals";      items: Record<string, TrendPoint> }
  | { axis: "all"; constraints: EventEnvelope[]; problems: EventEnvelope[];
                   intents: OpenLoop[]; vitals: Record<string, TrendPoint> };

async function currentState(p: CurrentStateParams): Promise<CurrentState>;
```

**"Active" is axis-specific.** There is a shared supersession filter
(`src/views/active.ts`) and then axis-specific lifecycle rules on top:

| Axis          | Active if                                                           |
|---------------|---------------------------------------------------------------------|
| `constraints` | not superseded/corrected AND status ∈ {active, final}               |
| `problems`    | explicitly `active` or `unresolved` AND not superseded/corrected    |
| `intents`     | pending/in_progress/active AND no action links via `fulfills` (§6)  |
| `vitals`      | latest valid sample per metric as of `asOf` (no supersession check — vitals don't supersede; they're just replaced by later samples) |

A *final lab* is finalized, not "currently active." A *completed action*
is final, not an open intent. A *final nursing note* is not current
state at all — it shows up in `narrative`, not `currentState`. The
old rule (`status ∈ {active, final}`) was too broad and is replaced by
this table.

This view replaces `_derived/current.md` as a live query. `_derived/`
becomes a cached render of `currentState({ axis: "all", asOf: now })` —
useful for grep, never authoritative.

### 4.4 `trend(params)`

A single metric over time. Pulls from `vitals.jsonl` for vitals and from
`events.ndjson` for event-recorded observations.

```ts
interface TrendParams {
  scope: PatientScope;
  metric: string;                          // e.g. "spo2", "heart_rate"
  from: string;
  to: string;
  source?: string;                         // filter to one source
}

interface TrendPoint {
  sampled_at: string;
  value: number | string;
  unit?: string;
  source: string;
  context?: Record<string, unknown>;
}

async function trend(p: TrendParams): Promise<TrendPoint[]>;
```

What agents reason over to detect deterioration and what a UI charts.
Distinct from `timeline` because vitals are not events — they live in
`vitals.jsonl` keyed by metric name, not id. Critical for evidence (§4.5).

### 4.5 `evidenceChain(params)` — multi-kind evidence

An assessment's support often includes a **trend**, not just discrete
event ids. The evidence chain must admit this or agent reasoning
silently fails its audit contract.

References and node shapes:

```ts
type EvidenceRef =
  | { kind: "event";    id: string }
  | { kind: "vitals";   metric: string; from: string; to: string; encounterId?: string }
  | { kind: "note";     id: string }
  | { kind: "artifact"; id: string };

type EvidenceNode =
  | { kind: "event";    event: EventEnvelope; supports: EvidenceNode[]; supersedes: EventEnvelope[] }
  | { kind: "vitals";   metric: string; points: TrendPoint[] }
  | { kind: "note";     note: NarrativeEntry }
  | { kind: "artifact"; artifact: ArtifactPointer };

interface EvidenceChainParams {
  scope: PatientScope;
  eventId: string;                         // entry point is always an event
  depth?: number;                          // default: 3; -1 for full
}

async function evidenceChain(p: EvidenceChainParams): Promise<EvidenceNode>;
```

**Schema implications.** `links.supports` entries become one of:

- a **string** (bare id) — back-compat for event/note references
- an **object** `EvidenceRef` — required for vitals windows and artifacts

JSON Schema:

```jsonc
"supports": {
  "type": "array",
  "items": {
    "oneOf": [
      { "type": "string", "minLength": 1 },
      { "type": "object",
        "required": ["kind"],
        "properties": {
          "kind": { "enum": ["event", "vitals", "note", "artifact"] }
          // kind-specific required fields checked by validator code
        }
      }
    ]
  }
}
```

The validator's referential-integrity pass resolves each ref:

- `{ kind: "event", id }` or bare string `evt_*` / `note_*` → check id exists in patient
- `{ kind: "vitals", metric, from, to }` → check `from ≤ to`, at least one sample exists
- `{ kind: "artifact", id }` → check artifact file exists

`evidenceChain` is the single most important view for auditability of
agent reasoning. When pi-agent writes "patient is deteriorating,"
`evidenceChain` walks `links.supports` backward — and can now cite the
actual vitals trend, not just the discrete observations it was derived
from.

### 4.6 `openLoops(params)` — explicit fulfillment links

Intents without matching actions; plans past `due_by`; orders without
results. The council correctly flagged that inferring "matching action"
from subtype + time is brittle. Fix: explicit link semantics.

New link types (§6):

```jsonc
"links": {
  "supports":   [...],
  "supersedes": [...],
  "corrects":   [...],
  "fulfills":   ["evt_intent_123"],        // NEW: this action fulfills that intent
  "addresses":  ["evt_problem_456"]        // NEW: this intent/action addresses that problem
}
```

Contract:

```ts
interface OpenLoopsParams {
  scope: PatientScope;
  asOf?: string;
}

interface OpenLoop {
  intent: EventEnvelope;
  state: "pending" | "in_progress" | "overdue" | "failed";
  fulfillments: EventEnvelope[];           // actions linking via fulfills
  dueDeltaMinutes?: number;                // negative = overdue
  addressesProblems: EventEnvelope[];      // problems linked via addresses
}

async function openLoops(p: OpenLoopsParams): Promise<OpenLoop[]>;
```

State machine:

- `pending`      — no fulfillments yet, no `due_by` or `due_by > asOf`.
- `in_progress`  — at least one fulfillment that is `status: active` and
                   no terminal fulfillment.
- `overdue`      — no terminal fulfillment AND `due_by < asOf`.
- `failed`       — a fulfillment with `status: failed` OR an outcome
                   event linking via `fulfills` with a failure subtype.

"Closed" intents (completed, cancelled, resolved) do not appear in
`openLoops` output at all.

### 4.7 `narrative(params)`

Notes and communications, sorted by `recorded_at`.

```ts
interface NarrativeParams {
  scope: PatientScope;
  from?: string;
  to?: string;
  encounterId?: string;
  authorId?: string;
  subtypes?: string[];                     // e.g. ["sbar", "progress_note"]
}

interface NarrativeEntry {
  id: string;
  effective_at: string;
  recorded_at: string;
  author: Author;
  subtype: string;
  body: string;                            // markdown body without frontmatter
  references: string[];                    // event ids from frontmatter
  path: string;                            // relative to patient root
}

async function narrative(p: NarrativeParams): Promise<NarrativeEntry[]>;
```

The reading view. Context-loading at shift change.

### 4.8 Mapping view primitives to UI components

| View          | UI rendering                                        |
|---------------|-----------------------------------------------------|
| timeline      | chronological list / flowsheet row                  |
| currentState  | sidebar panels (problems, constraints, open intents, latest vitals) |
| trend         | line chart                                          |
| evidenceChain | collapsible tree / breadcrumb from any claim        |
| openLoops     | task list / shift summary                           |
| narrative     | notes pane / document viewer                        |

None of these are tabs. Any chart UI will compose them.

---

## 5. MIMIC-IV ingestion

> **Status note (post ADR 001).** The mechanics below were written for
> MIMIC-IV. Per `decisions/001-mimic-to-synthea.md`, **Synthea is now
> the primary historical corpus**; MIMIC-IV is optional-later and
> requires credentialed access. This section is retained as structural
> reference — rebase logic, provenance preservation, manifest writer,
> and invariants 4 & 9 are corpus-agnostic and will be reused. A
> Synthea-specific mapping (`src/importers/synthea/`) will replace
> §5.2–§5.9 when Phase 3 begins. Primitives (§1) and the envelope are
> unchanged.

### 5.1 Goal

Load a MIMIC-IV subject into `patients/<id>/` such that the resulting
chart is indistinguishable from a live-simulation chart: same envelope
shape, validator passes, view primitives work.

### 5.2 Decisions

- **Rebase to synthetic now.** Admission happens at `--target-time`
  (default: now at import). Original timestamps preserved in the
  envelope's `source` object, structurally (§5.7).
- **Minimum viable subset for v0.2:**
  - `patients` (demographics)
  - `admissions` (encounters)
  - `chartevents` (vitals → `vitals.jsonl`; other charted observations → events)
  - `labevents` (lab observations)
  - `prescriptions` (medication **intents** — not administrations; see §5.6)
  - `emar` / `emar_detail` (medication **administrations** when present)
  - **MIMIC-IV-Note** (discharge summaries, radiology reports — a
    *linked* companion dataset to MIMIC-IV hosp/icu, handled via its
    own mapper)
- **Stable ids.** Deterministic hashes of
  `(subject_id, hadm_id, source_table, row_id)` — re-imports do not
  duplicate.
- **One MIMIC subject → one pi-chart patient** (`patient_mimic_<subject_id>`).
- **One admission → one encounter** (`enc_<hadm_id>`).
- **ICU stays are nested contexts within the admission encounter, not
  parallel encounters.** Representation: `(open)` — candidates at
  implementation time are (a) an `observation` with subtype
  `care_location`, (b) a new `context` event type, or (c) a
  `care_location_segments` field on the encounter header. The principle
  — nested, not parallel — is committed; the encoding decision is
  Phase 3 work.

### 5.3 Library shape

```
src/importers/mimic-iv/
├── index.ts                 # public importMimicPatient(options)
├── rebase.ts                # timestamp shifting
├── stable-ids.ts            # deterministic id generation
├── manifest.ts              # read/write imports/mimic-iv/manifest.yaml
├── map-patients.ts          # → patient.md
├── map-admissions.ts        # → encounter_NNN.md
├── map-chartevents.ts       # → vitals.jsonl / events.ndjson
├── map-labevents.ts         # → events.ndjson (observations)
├── map-prescriptions.ts     # → events.ndjson (medication intents)
├── map-emar.ts              # → events.ndjson (medication actions)
├── map-mimic-iv-note.ts     # → notes/*.md + events.ndjson (communications)
└── dictionaries/            # itemid → LOINC/SNOMED lookups (d_items, d_labitems)
```

### 5.4 Entry point

```ts
interface ImportMimicOptions {
  chartRoot: string;
  mimicCsvDir: string;                     // unzipped MIMIC-IV hosp/icu CSVs
  mimicNoteDir?: string;                   // unzipped MIMIC-IV-Note CSVs (optional)
  subjectId: number;
  targetTime?: string;                     // ISO; default: now()
  importedAt?: string;                     // ISO; default: now() — FIXED in tests
  patientId?: string;                      // default: patient_mimic_<subjectId>
  subset?: MimicTable[];                   // default: the v0.2 subset
  mimicVersion?: string;                   // recorded in manifest; default: read from hosp/version.txt
}

interface ImportMimicResult {
  patientId: string;
  patientRoot: string;
  deltaMillis: number;                     // rebase offset applied
  eventsWritten: number;
  notesWritten: number;
  vitalsWritten: number;
  warnings: string[];
  manifestPath: string;
}

async function importMimicPatient(opts: ImportMimicOptions): Promise<ImportMimicResult>;
```

### 5.5 Rebase logic

```ts
// 1. find the anchor in MIMIC frame
const admissionRow = findPrimaryAdmission(admissions, subjectId);
const anchorMimic = Date.parse(admissionRow.admittime);

// 2. compute delta
const anchorTarget = Date.parse(opts.targetTime ?? new Date().toISOString());
const deltaMillis = anchorTarget - anchorMimic;

// 3. apply to every MIMIC-frame timestamp
function rebase(mimicIso: string): string {
  return new Date(Date.parse(mimicIso) + deltaMillis).toISOString();
}
```

Invariants:

- `effective_at` is rebased. `recorded_at` is `opts.importedAt` (default
  now). Never rebase `recorded_at`.
- Original `charttime` / `starttime` / `admittime` preserved structurally
  in `source.original_time` (see §5.7).
- `deltaMillis` is recorded in both `patient.md` frontmatter
  (`mimic_rebase_delta_ms`) and in the import manifest (§5.8).

### 5.6 Prescriptions vs. administrations

MIMIC-IV separates medication ordering (`prescriptions`) from medication
administration (`emar`, `emar_detail`, and ICU `inputevents`). pi-chart
mirrors this:

- A `prescriptions` row → `intent` event with subtype `medication_order`.
  Carries drug, dose, route, frequency, period.
- An `emar_detail` row that records an actual administration → `action`
  event with subtype `medication_administration`, **linked to the intent
  via `links.fulfills`**. Dose/time reflect the actual administration,
  not the order.
- If `emar` data is absent, prescriptions produce intents only. No
  action events are synthesized from orders alone. An intent without
  fulfillments will appear as `openLoops` output, which is correct.

### 5.7 Preserving MIMIC provenance structurally

MIMIC-IV deidentifies timestamps via subject-level date shifting. That
shift is inside MIMIC's data; pi-chart's rebase is on top. Both must be
recoverable from the envelope.

ADR 011 adds a second provenance axis for imports: `source.kind` names
the import family, while `transform` records the processing path that
materialized the event in pi-chart. Imported events SHOULD pair the
structured `source` object below with
`transform: { activity: "import", tool, version?, run_id?, input_refs? }`.
`source` remains the authoritative home for corpus ids/timestamps;
`transform` records how the import ran. Historical v0.2 imports are not
backfilled when the field is absent.

Use a structured `source` object for every MIMIC-imported event:

```jsonc
"source": {
  "kind":           "mimic_iv_import",
  "version":        "3.1",                 // MIMIC-IV version
  "table":          "labevents",
  "subject_id":     10000032,
  "hadm_id":        22595853,
  "row_id":         123456,
  "stay_id":        31552122,              // when from icu.*
  "original_time":  "2180-07-23T21:00:00", // MIMIC frame; still deidentified
  "rebase_delta_ms": 1234567890123         // applied by this import
}
```

`source.ref` may be kept as a compact `subject_id=X;hadm_id=Y;row_id=Z`
string for legacy compatibility, but it is not the parseable audit
channel — these structured fields are.

### 5.8 Import manifest

Every import writes a durable manifest:

```
patients/<id>/_imports/mimic-iv/manifest.yaml
```

```yaml
source:
  kind: mimic_iv
  version: "3.1"                          # or whatever hosp/version.txt said
  subject_id: 10000032
  hadm_ids: [22595853, 28234563]
  tables: [patients, admissions, chartevents, labevents, prescriptions, emar, emar_detail]
  note_source: mimic_iv_note              # or: omitted if no notes imported
  note_version: "2.2"

import:
  importer_version: "0.2.0"
  imported_at: "2026-04-18T14:22:05-05:00"
  target_time:  "2026-04-18T06:00:00-05:00"
  delta_millis: 5234567890000
  row_counts:
    chartevents: 15342
    labevents: 821
    prescriptions: 47
    emar: 103
    mimic_iv_note: 3
  warnings:
    - "12 chartevents rows had null valuenum; stored as text only"
```

`patient.md` carries a summary field (`mimic_rebase_delta_ms`) for
quick-glance; the manifest is the durable audit object. Re-imports
update the manifest; prior manifests rotate into
`manifest-<timestamp>.yaml` alongside.

### 5.9 Determinism vs. idempotency (two different tests)

- **Determinism**: same inputs + same `targetTime` + same `importedAt`
  produce byte-identical output. Tests pass fixed values for both
  clocks.
- **Idempotency**: re-running import on the same inputs does not
  duplicate entries. Stable ids make this automatic; re-imports update
  the manifest in place.

These were conflated in an earlier draft. They are separate test cases:

```ts
test("deterministic output with fixed clocks", async () => {
  const a = await importMimicPatient({ ..., targetTime: FIXED_T, importedAt: FIXED_I });
  const b = await importMimicPatient({ ..., targetTime: FIXED_T, importedAt: FIXED_I });
  assertChartsByteIdentical(a.patientRoot, b.patientRoot);
});

test("idempotent on re-import", async () => {
  await importMimicPatient({ ... });
  const beforeCount = countEvents(patientRoot);
  await importMimicPatient({ ... });           // no fixed clock — recorded_at drifts
  const afterCount  = countEvents(patientRoot);
  assertEquals(beforeCount, afterCount);       // stable ids prevent duplicates
});
```

### 5.10 Other tests

- Round-trip: import a known subject, run `validate`, assert zero errors.
- Partial subset: import with `subset: ["patients", "admissions"]` only,
  assert chart validates but has no timeline events.
- Rebase correctness: import with fixed `targetTime`, assert earliest
  `effective_at` in chart equals `targetTime`.

### 5.11 Runtime continuation

After import, pi-sim / pi-agent may append further events to the same
patient directory. Because rebasing placed admission at `target_time`,
"now" (or shortly after) is the natural seam. No boundary marker is
needed — the seam is implicit in `source.kind` changing from
`mimic_iv_import` to runtime sources.

---

## 6. Corrections, supersession, and fulfillment

Append-only stays a v0.1 invariant. This section specifies how views
interpret the append-only log as coherent current state.

### 6.1 Link taxonomy (post ADR 009 docs gate)

```jsonc
"links": {
  "supports":   [EvidenceRef, ...],   // reasoning support (§4.5)
  "supersedes": [eventId, ...],       // replaces prior claim
  "corrects":   [eventId, ...],       // flags prior claim as error
  "fulfills":   [eventId, ...],       // action→intent only
  "addresses":  [eventId, ...],       // intent/action→problem assessment only
  "resolves":   [eventId, ...],       // loop-closing or contradiction resolution
  "contradicts": [{ ref, basis }]     // later-written structural disagreement
}
```

- `supports` items may be `EvidenceRef` objects or bare id strings (§4.5).
- `supersedes`, `corrects`, `fulfills`, `addresses`, and `resolves` are
  arrays of event-id strings referencing events within the same patient.
- `contradicts` is an array of `{ref, basis}` objects. The later-written
  event carries the link; the earlier event gains only a read-time
  `contradicted_by` decoration in views.
- **`fulfills` sources are `action` events.** Observations and
  assessments do not carry `links.fulfills`; their relation to an
  upstream intent is indirect — expressed as `supports` on an
  intermediate acquisition action (`specimen_collection`,
  `imaging_acquired`, `procedure_performed`, `measurement`). See
  ADR 003.
- **`addresses` is problem-targeting only.** Loop-closing semantics move
  to `resolves`, which targets open-loop or contradiction-bearing
  events. `contradicts` requires a short non-empty `basis`.

### 6.2 Writing corrections

A correction is a new event that carries the corrected information and
references the prior event:

```jsonc
{
  "id": "evt_20260418T0900_01",
  "type": "observation",
  "subtype": "vital_sign",
  "data": { "name": "spo2", "value": 91, "unit": "%" },
  "status": "final",
  "links": {
    "supersedes": ["evt_20260418T0830_01"]
  }
}
```

`supersedes` means "this replaces the prior claim." `corrects` is
narrower: "the prior claim was wrong and should be treated as
entered-in-error." Views distinguish them.

### 6.3 View-layer semantics

- `currentState`, `openLoops` hide events superseded or corrected.
- `timeline` with `includeSuperseded: false` (default) also hides them.
- `evidenceChain` **does** include superseded events under
  `node.supersedes` — the agent's reasoning may have rested on the
  original claim and hiding it would hide the actual basis at the time.
- `narrative` shows all notes; notes don't typically supersede.
- The raw filesystem never lies. Views compute effective state.

### 6.4 Write-side constraints

- `links.*` targets must be real ids within the same patient directory
  (validator enforces).
- Circular supersession rejected: if A supersedes B, B cannot later
  supersede A.
- At most one supersessor per event. Two supersessors for one target is
  rejected.
- `fulfills` **sources** must be events of type `action`; **targets**
  must be events of type `intent` (ADR 003).
- `addresses` targets must be events of type `assessment` with subtype
  `problem` (ADR 009).
- `resolves` targets must be open-loop-kind events or events that carry
  a `contradicts` link (ADR 009).
- `contradicts` entries must target earlier same-patient events and
  carry a non-empty `basis` rationale (ADR 009).
- **Acquisition actions required for data-producing orders** (ADR 003).
  An `intent.subtype = order` that produces a result is closed by an
  `action` with subtype in `{specimen_collection, imaging_acquired,
  procedure_performed, measurement}` carrying `links.fulfills`. The
  result `observation` then `supports` the acquisition action.
  Exceptions (ad-hoc POC, standing-protocol ticks) are documented on
  the action via `data.origin` + `data.rationale_text`.
- **`data.status_detail` transitions use supersession** (ADR 002). A
  lifecycle change (e.g., `on_hold → active` for an intent) is a new
  event carrying the new `status_detail` value and
  `links.supersedes: [<prior>]`. No in-place mutation.
- **Interval events close via supersession** (ADR 005). An open
  `effective_period` (no `end`) is closed by a new event carrying the
  same payload with a populated `effective_period.end` and
  `links.supersedes: [<open-interval-event-id>]`.

---

## 7. Durability — the full promise

Per-patient isolation and session persistence are *part* of durability,
not the whole of it. The full promise:

> **A patient directory survives process restarts, repo moves, schema
> migrations, imports, derived-view rebuilds, and repeated writes while
> preserving provenance, isolation, and append-only clinical history.**

Concretely, pi-chart v0.2 guarantees:

- **Session shutdown and restart preserves state.** Writes land on disk
  before the write function returns. No write-ahead buffer that could
  be lost.
- **Schema migration is explicit.** Breaking schema changes bump
  `schema_version` in `pi-chart.yaml` and require a migration script.
- **Imports are auditable.** Every imported event carries structured
  provenance (§5.7) and every import session has a manifest (§5.8).
- **Writes are append-oriented.** Corrections are new events; prior
  claims are never silently mutated.
- **Views can be rebuilt.** `_derived/` is disposable; deleting it
  reconstructs from canonical sources.
- **Provenance survives copying a patient directory.** Every patient
  dir is self-contained — `source`, `author`, `links` all resolve
  within the directory.
- **Validation catches corruption.** The validator enforces every
  invariant below and fails loudly on broken references.

---

## 8. Invariants cheat sheet (canonical list)

For the validator. Each invariant has an explicit check with an error
message naming its number.

1. Every claim has `source`, exactly one of (`effective_at` | `effective_period`) (ADR 005), `recorded_at`, `author`, `status`. Optional `data.status_detail` admits a per-subtype enum (ADR 002).
2. pi-chart is append-oriented; no mutation of prior claims. `status_detail` and `effective_period.end` transitions use supersession, not in-place mutation.
3. Derived files are not authoritative and may be hand-marked as such.
4. No orphan claims — every `links.*` target, every `links.contradicts[*].ref`, and every patient-local `transform.input_refs[*]` entry exists within the same patient when its kind expects local resolution.
5. Assessments must link to supporting observation / vitals / artifact evidence; missing support is a validator error. Bare-id support targets are narrowed to `observation` and `artifact_ref` (enforced by `hasObservationEvidence` in `validate.ts`); assessments cannot cite other assessments as support.
6. **Patient isolation**: writes match `patients/<id>/chart.yaml.subject`; cross-patient links rejected.
7. **Session transparency**: `author` is captured at write time; agents pass explicit author; session never retroactively rewrites.
8. **Supersession monotonicity**: no circular supersession; at most one supersessor per event.
9. **Import provenance**: imported events (e.g. `source.kind: synthea_import`, `source.kind: mimic_iv_import`) carry origin ids + timestamps (corpus-specific: e.g. `subject_id`, `hadm_id`, `row_id`, `original_time`, `rebase_delta_ms`) structurally on `source` — not only in `source.ref`.
10. **Fulfillment and closure typing** (ADRs 003, 009): `links.fulfills` **sources** must be `action` events; **targets** must be `intent` events. Observations and assessments do not carry `fulfills` — they relate to an intent indirectly via an intermediate acquisition `action` (`specimen_collection`, `imaging_acquired`, `procedure_performed`, `measurement`). `links.addresses` targets must be problem-subtype assessments; `links.resolves` targets must be open-loop-kind or contradiction-bearing events (§6.4).
11. **Temporal shape** (ADR 005): exactly one of `effective_at` / `effective_period` per event. `effective_period` is allow-listed per `(type, subtype)` (CLAIM-TYPES). `recorded_at ≥ effective_at` except for future-dated `intent` events carrying `data.due_by` or `effective_period.start`.
12. **`source.kind` taxonomy** (ADR 006): closed canonical list enumerated in §1.1. Validator warns on unknown kind in v0.2; errors in v0.3. `agent_reasoning` accepted with deprecation notice, migrates to `agent_inference`.
13. **EvidenceRef discipline** (ADR 010): structured refs use the unified `{ref, kind, role?, basis?, selection?, derived_from?}` shape. At most one `role: primary` may appear per `supports[]` array, and `derived_from` provenance chains are acyclic and depth-bounded.
14. **Transform coherence** (ADR 011): when `transform` is present, `transform.activity` and `source.kind` must be coherent. `transform.input_refs` resolves under the same semantics as `links.supports`, but records tool inputs rather than the author's stated evidence.
15. **Contradiction direction** (ADR 009): the later-written event carries `links.contradicts` and supplies a non-empty `basis`; contradiction resolution happens via a later `resolves` link, not by mutating or silently deleting the original tension.

---

## 9. Path to UI

Not committing a stack. Recording the shape so the view primitives are
built UI-aware rather than retrofitted.

Whatever the UI is — web, desktop, agent-facing — it will be a pure
consumer of the six view primitives on read and a caller of
`appendEvent` / `writeCommunicationNote` on write. `writeNote` remains a
low-level helper for callers that manage the matching communication event themselves. UI never reaches into the
filesystem. Same contract pi-agent uses.

Practical implication for the view layer: returned structures are
`JSON.stringify`-able, no Node streams, no class instances, ISO strings
instead of Dates. If a view needs to be served over HTTP, it should be
trivial. v0.1 reads already work this way — keep it.

---

## 10. Roadmap

Four phases. Each produces a reviewable, testable increment. Phases are
strictly ordered by dependency.

### Phase 1 — Multi-patient + sessions (foundational)

**Goal:** single-patient v0.1 becomes multi-patient v0.2 with
autofill-from-session, zero regressions. One patient imported; layout
is multi-patient-ready.

- `scripts/migrate-v01-to-v02.ts` — idempotent migration.
- New `pi-chart.yaml` at root; new `sessions/current.yaml` schema in
  `schemas/`.
- `.gitignore` adds `sessions/current.yaml`. Commit
  `sessions/current.example.yaml`.
- Every `src/*.ts` that takes `chartRoot` gains `PatientScope`.
  `assertSubjectMatches` moves to per-patient.
- `src/session.ts` — load/save/resolve. Auto-fill `author` on writes
  (library functions) or `chartRoot` (CLI wrappers only).
- Validator: invariants 6, 7 added.
- All existing tests updated; new tests for isolation (writes to wrong
  patient throw; cross-patient links rejected).

### Phase 2 — View primitives

**Goal:** the six views are real, tested, composable.

- `src/views/` with one function per primitive (or flat `src/views.ts`
  if smaller — not committed).
- Supersession evaluator (`src/views/active.ts`) as single source of
  truth for "which events are live as of t."
- **Schema change:** `links.supports` accepts `EvidenceRef` objects in
  addition to strings. Bump `schema_version`.
- **Schema change:** add `links.fulfills` and `links.addresses` arrays
  to the event envelope. Bump `schema_version`.
- `src/evidence.ts` moves under `views/`; signature aligns with
  `evidenceChain` contract (§4.5). Preserve existing tests; extend to
  cover vitals/note/artifact evidence.
- `_derived/` rebuild becomes a wrapper around the views — no
  independent query code under `scripts/`.
- Validator: invariants 8, 10 added; integrity check resolves all five
  link kinds.
- Tests: every view, every supersession case, empty chart, vitals-
  supported assessments, large timeline (performance smoke test).

### Phase 3 — MIMIC-IV ingestion

**Goal:** `npx tsx scripts/import-mimic.ts --subject-id X --csv-dir ...`
produces a valid multi-patient chart with full audit trail.

- `src/importers/mimic-iv/` per §5.3 layout.
- Dictionary tables (`d_items`, `d_labitems`) loaded once and cached.
- `scripts/import-mimic.ts` thin CLI over `importMimicPatient`.
- Import manifest writer (§5.8).
- MIMIC-IV-Note mapper handled separately from hosp/icu tables.
- Prescriptions → intents only; emar → actions linked via `fulfills`.
- Validator: invariant 9.
- Determinism and idempotency as separate test cases (§5.9).
- Round-trip integration test against a known public-subset subject.
- **Close `(open)`** before coding: ICU stay encoding — pick (a), (b),
  or (c) from §5.2.

### Phase 4 — UI (separate planning)

Not specified here. When ready, open a new design doc. All UI work goes
through the view primitives and write functions from Phases 1–2.

---

## 11. Changes from v0.2-draft to this revision

Council-approved amendments, all integrated above.

**Phase 1**
- §2.4, §3.2, §10: `sessions/current.yaml` is gitignored;
  `sessions/current.example.yaml` is committed.
- §3.3: explicit boundary between CLI (cwd fallback) and library
  (explicit `chartRoot`); agents and tests always pass explicit
  `PatientScope`.

**Phase 2**
- §4.2: added `subtypes?: string[]` and `subtypePrefix?: string` to
  `TimelineParams`. Removed `RegExp` example — not JSON-serializable.
- §4.3: "active" semantics are axis-specific, not `status ∈ {active,
  final}`. Added per-axis lifecycle table.
- §4.5: **evidence chain admits non-event evidence.** Introduced
  `EvidenceRef` and `EvidenceNode` discriminated unions covering event,
  vitals-window, note, and artifact kinds. `links.supports` schema
  extended.
- §4.6, §6.1: **new `fulfills` and `addresses` link types.** Explicit
  structural links replace time+subtype inference for intent/action
  matching.

**Phase 3**
- §5.2, §5.3, §5.8: **import manifest** at
  `patients/<id>/_imports/mimic-iv/manifest.yaml` as durable audit object.
- §5.4, §5.9: **determinism and idempotency are separate tests.**
  `importedAt` exposed as a parameter so tests can pass fixed clocks.
- §5.2, §5.3: **MIMIC-IV-Note** (the linked notes dataset) handled by
  its own mapper, not conflated with legacy NOTEEVENTS naming.
- §5.2, §5.6: **prescriptions produce intents; administrations require
  `emar` / `inputevents`.** No synthesizing actions from orders alone.
- §5.7: **structured source provenance** — `subject_id`, `hadm_id`,
  `row_id`, `original_time`, `rebase_delta_ms` as fields on `source`,
  not just strings in `source.ref`.

**Cross-cutting**
- §5.2: **ICU stay granularity** — committed to nested-within-encounter;
  specific encoding flagged `(open)` and resolved in Phase 3.
- §7: **durability definition broadened** beyond multi-patient
  isolation to cover imports, migrations, view rebuilds, and provenance
  preservation under directory copy.

**Appendix: deferred to later docs**
- Multi-user session directory.
- FHIR boundary adapter.
- SQLite indexing when grep performance degrades.
- UI stack selection (Phase 4).

---

**Post-revision amendments (tracked in `decisions/`)**
- **2026-04-20:** §1 renamed from "The load-bearing principle" to
  "Primitives — the load-bearing foundation" with a §0-invariant
  callout. Changes to §1 now require an ADR + `schema_version` bump.
  Companion docs added: `ARCHITECTURE.md` (code map), `ROADMAP.md`
  (phases + seams), `decisions/` (ADRs), `clinical-reference/` (domain
  research).
- **2026-04-20 — ADR 001:** Phase 3 importer pivots from MIMIC-IV to
  Synthea as primary corpus; MIMIC-IV optional-later. §0 scope, §5
  banner, and invariant 9 updated in place. §5.2–§5.9 mechanics
  retained as structural reference pending Synthea-specific rewrite at
  Phase 3 start.
- **2026-04-20 — ADR 002 (status lifecycle):** envelope `status`
  reserved for graph lifecycle; domain lifecycle moves to optional
  `data.status_detail` with per-subtype allowed values (registered in
  CLAIM-TYPES). Invariant 1 extended. Validator rules V-STATUS-01/02/03
  follow in the implementation ADR.
- **2026-04-20 — ADR 003 (fulfillment via intermediate action):**
  data-producing intents are closed by an acquisition `action`
  (`specimen_collection`, `imaging_acquired`, `procedure_performed`,
  `measurement`); the resulting observation `supports` that action.
  Invariant 10 tightened — `fulfills` sources are `action`,
  observations/assessments do not carry `fulfills`. §6.1 and §6.4
  updated; CLAIM-TYPES `action` subtypes extended.
- **2026-04-20 — ADR 004 (`effective_at` per type):** per-type
  convention replaces the single under-specified definition.
  Observation = truth-time; action = performed; intent = ordered (may
  be future-dated); communication = sent; artifact_ref = captured;
  assessment = time-of-writing. Invariant 1 extended;
  V-TIME-01/02/03 follow.
- **2026-04-20 — ADR 005 (interval primitive):** optional envelope
  field `effective_period: { start, end? }` alongside `effective_at`;
  exactly one per event. Interval use is allow-listed per subtype.
  Open intervals close via supersession. New invariant 11; resolves
  §5.2 ICU-stay-granularity open seam via
  `observation.context_segment`. Schema adds `oneOf` constraint;
  V-INTERVAL-01/02/03 follow.
- **2026-04-20 — ADR 006 (`source.kind` taxonomy):** closed canonical
  taxonomy enumerated in §1 subsection; schema stays permissive,
  validator warns on unknown kind in v0.2 and errors in v0.3.
  `agent_reasoning` deprecated in favor of `agent_inference`.
  New invariant 12; V-SRC-01/02/03 follow.

---

*End of DESIGN.md. Changes to committed decisions should be made by
amendment with dated rationale, not silent rewrite.*
