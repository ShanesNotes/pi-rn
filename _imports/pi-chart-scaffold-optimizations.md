Yes. I unpacked `pi-chart-scaffold.zip` and walked the scaffold file-by-file.

## Overall verdict

This is a **very strong v0 scaffold**. It matches the distilled direction well:

> **pi-chart is a filesystem-native, append-oriented, provenance-rich clinical memory substrate, not an EHR clone.**

The core architecture is right:

```text
canonical:
  patient.md
  constraints.md
  timeline/**/events.ndjson
  timeline/**/vitals.jsonl
  timeline/**/notes/*.md
  artifacts/

derived:
  _derived/*.md
```

I also checked the validator/rebuild logic. The scaffold validates cleanly, and the derived files rebuild as expected. The only derived diff is the timestamp inside `_derived/current.md`, which is expected but may create noisy Git diffs.

My council stance: **greenlight the scaffold, but harden the write/validation boundary before integrating it deeply with pi-agent.**

---

# File-by-file review

## `.gitignore`

**Verdict: good.**

It ignores Python/cache/IDE noise and intentionally does **not** ignore `_derived/`.

That is defensible for early development because it lets you see generated diffs. Longer term, I would decide explicitly between:

```text
Track _derived/ examples for demos
```

or:

```text
Ignore _derived/*.md and regenerate locally
```

Right now the README says `_derived/` is disposable, while `.gitignore` says it is tracked so diffs are visible. That is not wrong, but it is a small philosophical tension.

My recommendation:

```gitignore
_derived/*.md
!_derived/README.md
```

Then keep example derived files only in a separate fixture/demo branch if needed.

---

## `chart.yaml`

**Verdict: good minimal chart metadata.**

Current:

```yaml
chart_version: 0.1.0
subject: patient_001
created_at: 2026-04-18T06:00:00-05:00
timezone: America/Chicago
schema_version: 0.1.0
```

I would keep this.

Add soon:

```yaml
chart_id: chart_patient_001
mode: simulation
clock: sim_time
```

The important missing concept is **clock source**. The agent should know whether “now” means wall-clock time or simulation time. This matters because `read_recent_events()` currently defaults to actual system time, which can diverge from the simulated encounter timeline.

---

## `README.md`

**Verdict: excellent thesis and architecture document.**

The strongest parts are:

```text
The chart is canonical.
Current state is a query.
Derived summaries are disposable.
```

That is exactly the right center of gravity for pi-chart and matches the earlier synthesis direction. 

One caveat: the README says the validator enforces the five invariants, but the current validator only partially enforces them.

For example:

```text
Every claim has source, effective_at, recorded_at, author, and status.
```

Yes, mostly.

But:

```text
Assessments link to supporting observations when possible.
```

Only weakly. The validator checks that assessments have `links.supports`, but it does not verify that those support links are actually observations.

Also:

```text
pi-chart is append-oriented.
```

The validator catches duplicate IDs, but it cannot detect mutation of existing lines unless Git/audit comparison is involved.

So I would rephrase from:

```text
The validator enforces them.
```

to:

```text
The validator enforces the machine-checkable subset of these invariants.
```

---

## `CLAIM-TYPES.md`

**Verdict: strong conceptual core.**

The six clinical event types are right:

```text
observation
assessment
intent
action
communication
artifact_ref
```

This is the correct level of abstraction. Do not expand this too quickly.

One wording issue: `CLAIM-TYPES.md` says every structured event is one of six type values, but `event.schema.json` also allows:

```text
encounter
subject
constraint_set
```

That is fine, but I would distinguish:

```text
clinical event types:
  observation
  assessment
  intent
  action
  communication
  artifact_ref

structural chart types:
  subject
  encounter
  constraint_set
```

That keeps the six-type ontology clean while acknowledging chart scaffolding artifacts.

Biggest conceptual improvement: add a section for **evidence references** to vitals streams. Right now assessments can cite event IDs, but the respiratory assessment is actually supported by `vitals.jsonl` samples that do not have IDs. More on that below.

---

## `Makefile`

**Verdict: good developer ergonomics.**

Targets are right:

```text
install
validate
rebuild
check
clean-derived
```

Small recommendation: make Python configurable.

Instead of:

```make
python scripts/validate.py .
```

use:

```make
PYTHON ?= python3

validate:
	$(PYTHON) scripts/validate.py .
```

That avoids environment ambiguity.

---

## `patient.md`

**Verdict: good human-readable baseline.**

This is exactly where Markdown shines: demographics, PMH, surgical history, baseline functional status.

Current content is clear and useful.

The only thing I would eventually add is a small structured frontmatter block for safety-critical or frequently queried baseline values. For example:

```yaml
baseline:
  spo2_room_air: 94
  functional_status: independent
  smoking_history_pack_years: 25
  smoking_status: former
```

Do not overdo this. The body can remain narrative. But anything the agent will repeatedly query should eventually be structured.

---

## `constraints.md`

**Verdict: clinically important, but should be hardened earlier than most files.**

The Markdown body is good. The penicillin allergy, code status, goals of care, and sedation preference are all exactly the kind of constraints pi-agent needs.

However, this is currently only narrative. For safety, I would make constraints machine-readable in frontmatter while keeping the human body.

Example:

```yaml
constraints:
  allergies:
    - substance: penicillin
      reaction: anaphylaxis
      severity: severe
      source: patient_report
      status: active
  code_status: full_code
  preferences:
    - minimize_sedation_if_possible
```

Why this matters: the agent should not have to parse prose to avoid penicillins.

This is one of the few places where adding structure early is not bloat. It is a safety primitive.

---

## `timeline/2026-04-18/encounter_001.md`

**Verdict: good encounter header.**

This does the right job:

```text
what encounter is this?
why is the patient here?
what is the initial impression?
what is the initial plan?
```

The frontmatter includes extra fields:

```yaml
location
visit_type
chief_complaint
```

That is good. The schema currently allows those extra fields because it does not prohibit additional properties.

One possible future change: if you expect multiple encounters in one day, either nest by encounter or ensure every event/vital row has `encounter_id`. Right now `events.ndjson` has `encounter_id`, but `vitals.jsonl` does not.

---

## `timeline/2026-04-18/events.ndjson`

**Verdict: good example event ledger.**

This file demonstrates the model well:

```text
patient report
bedside observation
assessment/trend
active care plan
notification action
SBAR communication
```

The distinction between `intent`, `action`, and `communication` is especially good.

The most important issue: the assessment says SpO2 trends from 94 to 89, HR 88 to 108, RR 18 to 24, but its `links.supports` only references:

```text
evt_20260418T0815_01
evt_20260418T0820_01
```

Those are the patient report and bedside observation. The actual vital trend lives in `vitals.jsonl`, but individual vital rows have no IDs and cannot be linked.

You need one of these:

### Option A: give vitals samples IDs

```json
{
  "id": "vital_20260418T0840_spo2",
  "sampled_at": "2026-04-18T08:40:00-05:00",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "source": {"kind": "monitor_extension", "ref": "pi-sim-monitor"},
  "name": "spo2",
  "value": 89,
  "unit": "%"
}
```

Then assessments can link to `vital_*` IDs.

### Option B: allow interval evidence refs

```json
"links": {
  "supports": [
    "evt_20260418T0815_01",
    "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00"
  ]
}
```

Option B is lighter. Option A is more rigorous.

For v0, I would probably use **Option B**.

---

## `timeline/2026-04-18/vitals.jsonl`

**Verdict: correct format choice; needs a slightly stronger row schema.**

Using JSONL for vitals is absolutely right. Do not turn monitor streams into Markdown.

Current rows are clean:

```json
{"sampled_at":"2026-04-18T08:40:00-05:00","source":"pi-sim-monitor","name":"spo2","value":89,"unit":"%"}
```

I would add:

```json
{
  "sampled_at": "2026-04-18T08:40:00-05:00",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "source": {
    "kind": "monitor_extension",
    "ref": "pi-sim-monitor"
  },
  "name": "spo2",
  "value": 89,
  "unit": "%",
  "context": {
    "o2_device": "nasal_cannula",
    "o2_flow_lpm": 2
  }
}
```

The current format is fine for a single-patient/single-encounter demo. But since pi-chart is all about provenance and context, vitals should eventually carry the same provenance shape as events.

Also consider adding:

```json
"quality": "valid"
```

or:

```json
"artifact": "motion_possible"
```

Later, monitor artifacts will matter.

---

## `timeline/2026-04-18/notes/0845_nursing-note.md`

**Verdict: very good note artifact.**

This is exactly the right use of Markdown:

```text
structured frontmatter
human-readable SBAR body
references back to supporting events
```

The note is readable, clinically coherent, and linked.

Two validator gaps:

1. The note has `references`, but the validator does not currently check that note references exist.
2. The schema README says every note should have a matching `communication` event, but the validator only checks communication event → note. It does not check note → communication event.

Add both checks.

---

## `artifacts/README.md`

**Verdict: good.**

The rule is correct:

```text
binary/native file in artifacts/
artifact_ref event in events.ndjson
```

I would eventually add a tiny `artifacts/manifest.ndjson` only if artifact volume grows. For now, `artifact_ref` events are enough.

---

# `_derived/` files

## `_derived/README.md`

**Verdict: good and clear.**

The philosophy is right:

```text
delete freely
rebuild from canonical sources
canonical wins if disagreement exists
```

Keep this.

---

## `_derived/current.md`

**Verdict: useful, but timestamp may cause noisy diffs.**

The generated file includes:

```text
_as of 2026-04-19T03:27:04+00:00_
```

Because this is generated from wall-clock time, rebuilding changes it even if canonical chart content did not change.

Better:

```text
_as of latest chart event: 2026-04-18T08:45:10-05:00_
```

or:

```text
_generated_at: ...
_chart_as_of: ...
```

Separate generation time from clinical time.

For agent context, clinical time matters more.

---

## `_derived/active-constraints.md`

**Verdict: fine as a passthrough view.**

It duplicates headings:

```text
# Active constraints
# Constraints
```

Not a big deal, but I would clean it up.

The larger issue is upstream: `constraints.md` is not structured enough yet. Once constraints get structured frontmatter, this derived file can become much more useful.

---

## `_derived/open-intents.md`

**Verdict: excellent.**

This is exactly the kind of generated view pi-agent should read:

```text
active plan
rationale
due_by
success criteria
contingencies
```

This is a strong feature of the scaffold.

One future issue: intent lifecycle is under-modeled. Current event `status` is doing two jobs:

```text
claim lifecycle
intent lifecycle
```

For example, an intent can be a final documented claim but an active plan. Later you may want:

```json
"status": "final",
"data": {
  "intent_state": "active"
}
```

or expand `status` to include:

```text
completed
cancelled
expired
```

For now, `status: active` is okay.

---

## `_derived/latest-vitals.md`

**Verdict: good.**

It gives latest value per metric.

Minor improvement: use clinical order instead of alphabetical order:

```text
temperature
heart_rate
blood_pressure
respiratory_rate
spo2
pain
```

Right now it sorts alphabetically, so BP diastolic/systolic appear before HR/RR/SpO2. Not a big deal, but clinical readability matters.

---

# `schemas/` files

## `schemas/README.md`

**Verdict: good, but slightly overpromises.**

It says:

```text
Every note ID should have a matching communication event.
```

Correct principle, but the validator does not enforce that inverse relationship yet.

Add that check.

---

## `schemas/event.schema.json`

**Verdict: solid first schema; needs conditional hardening.**

The basic envelope is right.

Current required fields:

```json
[
  "id",
  "type",
  "subject",
  "effective_at",
  "recorded_at",
  "author",
  "source",
  "status"
]
```

But the docs imply that clinical events also require:

```text
certainty
data
links
encounter_id
```

Right now the schema does not require those.

I would add conditional requirements:

```text
For clinical types:
  observation
  assessment
  intent
  action
  communication
  artifact_ref

Require:
  encounter_id
  certainty
  data
  links
```

But for structural types:

```text
subject
encounter
constraint_set
```

allow a lighter schema.

Also: `format: date-time` is present, but Python `jsonschema` does not enforce date-time format unless you pass a `FormatChecker`. So malformed timestamps may pass unless the validator is updated.

Add:

```python
from jsonschema import Draft202012Validator, FormatChecker

Draft202012Validator(schema, format_checker=FormatChecker())
```

That is a high-value fix.

---

## `schemas/note.schema.json`

**Verdict: good.**

The note ID pattern is helpful:

```regex
^note_[0-9]{8}T[0-9]{4,6}(_[A-Za-z0-9_-]+)?$
```

I would add either:

```text
references required, can be empty list
```

or keep it optional but have the validator check references when present.

I would not add too much here yet.

---

# `scripts/` files

## `scripts/requirements.txt`

**Verdict: fine.**

```text
jsonschema>=4.21
pyyaml>=6.0
```

Good minimal dependency set.

---

## `scripts/README.md`

**Verdict: good.**

It correctly frames `validate.py` as the first real tool before FHIR, SQLite, or vector memory. That is exactly right.

---

## `scripts/validate.py`

**Verdict: good MVP validator; this should be the next hardening target.**

It already checks:

```text
schema validity
duplicate IDs
link targets
communication note_ref existence
basic vitals required fields
assessment has some support link
derived marker
```

That is strong for v0.

Important improvements:

### 1. Enforce date-time formats

As above, add `FormatChecker`.

### 2. Validate subject against `chart.yaml`

Every event/note should match:

```yaml
subject: patient_001
```

from `chart.yaml`.

### 3. Validate day directory against timestamp

If an event is in:

```text
timeline/2026-04-18/events.ndjson
```

then `effective_at` should usually start with:

```text
2026-04-18
```

At least warn if not.

### 4. Validate note references

For each note:

```yaml
references:
  - evt_...
```

make sure each ID exists.

### 5. Validate inverse communication link

For each note ID:

```text
note_...
```

make sure there is a communication event with:

```json
"data": {"note_ref": "note_..."}
```

### 6. Validate assessments are supported by observations or evidence refs

Current check only verifies non-empty `links.supports`.

Better:

```text
assessment supports must include at least one:
  observation event
  vitals evidence ref
  artifact_ref
```

### 7. Add stronger vitals validation

Require:

```text
sampled_at
subject
encounter_id
source.kind
name
value
unit
```

Maybe allow the current simple source string during v0, but warn.

### 8. Fix dormant missing-field logic

In `_validate_markdown_frontmatter()`, this logic is brittle:

```python
if err.validator == "required" and err.validator_value[0] in {
    "data",
    "links",
    "encounter_id",
}:
```

`err.validator_value[0]` is the first item in the schema’s required list, not necessarily the missing field. It works only because those fields are not currently required. If you later add them, this exemption will not behave as intended.

Use conditional schema instead.

---

## `scripts/rebuild_derived.py`

**Verdict: good and appropriately dumb.**

The derived views are useful and not too clever.

Main improvement: make `current.md` deterministic by using latest chart timestamp instead of rebuild time.

Also consider adding:

```text
latest note
latest assessment
latest communication
recent vital trend summary
```

But do not make it an LLM summarizer yet. Keep it mechanical.

---

# `pi_chart/` package

## `pi_chart/__init__.py`

**Verdict: good tiny API surface.**

The exported functions are exactly the right shape:

```python
read_patient_context
read_active_constraints
read_recent_events
read_recent_notes
read_latest_vitals
append_event
write_note
write_artifact_ref
rebuild_derived
validate_chart
```

This is a good boundary. The agent should use this package, not arbitrary file writes.

---

## `pi_chart/read.py`

**Verdict: useful, but simulation-time handling needs fixing.**

Good functions:

```python
read_patient_context()
read_active_constraints()
read_recent_events()
read_recent_notes()
read_latest_vitals()
```

Main issue:

```python
as_of = as_of or datetime.utcnow()
```

For pi-chart, default “now” should probably be **latest chart time** or **sim time**, not wall-clock UTC.

Otherwise, a simulation from 2026-04-18 can look “not recent” if the actual runtime clock differs.

Better:

```python
as_of = as_of or latest_effective_at(chart_root)
```

Also, `read_latest_vitals()` compares timestamp strings. This works as long as formatting is consistent, but parsing timestamps would be safer.

---

## `pi_chart/write.py`

**Verdict: right file, right idea, but it needs hardening before agent autonomy.**

This is the most important implementation file.

Good:

```text
append_event()
write_note()
write_artifact_ref()
ID helpers
day-sharded writes
```

But there are several important issues.

### 1. It claims to enforce provenance, but does not

Docstring says:

```text
provenance required on every write
```

But `append_event()` does not check for:

```text
author
source
effective_at
status
subject
```

It simply appends.

Minimum fix:

```python
REQUIRED_EVENT_FIELDS = [
    "type", "subject", "effective_at", "author", "source", "status"
]
```

and fail before writing if missing.

Better: run schema validation before append.

### 2. `write_note()` can overwrite an existing note

This violates append-oriented discipline.

Current:

```python
path.write_text(...)
```

Should become:

```python
if path.exists():
    raise FileExistsError(path)
```

### 3. ID generation is not persistent

The comment acknowledges this:

```text
Not persistent across processes — good enough for a single-agent sim
```

For early v0, okay. But if the agent restarts in the same minute, duplicate IDs are possible.

Better: probe existing IDs in the target day file before choosing suffix.

### 4. `append_event()` mutates the caller’s dict

It fills in `recorded_at` and `id` directly on the input object.

Not terrible, but safer:

```python
event = dict(event)
```

### 5. `write_note()` does not create the matching communication event

The docstring says the caller is responsible. That is acceptable, but easy to forget.

I would add a higher-level helper:

```python
write_communication_note(...)
```

that does both:

```text
write note file
append communication event
```

Keep the low-level functions, but give pi-agent a safer default.

---

## `pi_chart/derived.py`

**Verdict: acceptable wrapper.**

It shells out to:

```text
scripts/rebuild_derived.py
```

That is fine for v0.

Longer term, I would import a library function rather than shelling out. Subprocess wrappers are harder to unit test and return less structured information.

---

## `pi_chart/validate.py`

**Verdict: acceptable wrapper.**

It returns a boolean. Good enough for now.

Eventually, the agent will need structured validation feedback:

```python
{
  "ok": false,
  "errors": [...],
  "warnings": [...]
}
```

That lets the agent repair invalid writes.

---

# Structural directory review

## `timeline/`

**Verdict: right spine.**

Date-sharded timeline is correct.

Potential future layout if you have multiple encounters per day:

```text
timeline/
  2026-04-18/
    encounters/
      enc_001.md
    events.ndjson
    vitals.jsonl
    notes/
```

or:

```text
timeline/
  2026-04-18/
    enc_001/
      encounter.md
      events.ndjson
      vitals.jsonl
      notes/
```

I would not change it yet. Just make sure `encounter_id` appears in every row that needs it.

---

## `artifacts/`

**Verdict: right placeholder.**

No issue.

---

## `schemas/`

**Verdict: necessary and correctly lightweight.**

Good that schemas exist this early. This is not bloat. This is a guardrail.

---

## `scripts/`

**Verdict: right place for CLI utilities.**

Eventually, shared parsing/validation logic should move into `pi_chart/` and scripts should become thin CLI wrappers.

---

## `pi_chart/`

**Verdict: exactly the right idea.**

This package is the agent boundary.

The biggest architectural win in the scaffold is that the agent has an API surface even though the backend is just files.

That means you can evolve storage later without rewriting agent logic.

---

# Highest-priority changes before pi-agent writes to this

I would do these first.

## 1. Harden `append_event()`

Make it fail if required provenance is missing.

```python
def append_event(event: dict, *, chart_root=".") -> str:
    event = dict(event)

    required = ["type", "subject", "effective_at", "author", "source", "status"]
    missing = [k for k in required if k not in event]
    if missing:
        raise ValueError(f"event missing required fields: {missing}")

    ...
```

## 2. Prevent note overwrite

```python
if path.exists():
    raise FileExistsError(f"note already exists: {path}")
```

## 3. Add note-reference validation

Validate:

```text
note.references -> existing IDs
communication.data.note_ref -> existing note
each note -> matching communication event
```

## 4. Make vitals linkable

Either add sample IDs or allow interval evidence refs.

I prefer interval refs for v0:

```json
"vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00"
```

## 5. Use sim/chart time, not wall-clock time

Fix:

```python
read_recent_events()
build_current()
```

so “recent” means recent relative to latest chart/sim timestamp.

## 6. Structure safety-critical constraints

Keep `constraints.md`, but add machine-readable frontmatter for allergies/code status/preferences.

---

# My final assessment

This scaffold is not bloated. It is the right size.

The files I would preserve almost exactly:

```text
README.md
CLAIM-TYPES.md
chart.yaml
patient.md
encounter_001.md
events.ndjson
notes/0845_nursing-note.md
scripts/rebuild_derived.py
pi_chart/__init__.py
```

The files I would harden first:

```text
pi_chart/write.py
scripts/validate.py
schemas/event.schema.json
timeline/2026-04-18/vitals.jsonl
constraints.md
```

The single most important architectural correction:

> **The scaffold says the write boundary enforces provenance and append-only behavior, but the current code only partially enforces that. Before pi-agent becomes autonomous, make invalid writes impossible, not merely detectable later.**

The single most important conceptual correction:

> **Assessments need to be able to cite vitals evidence. Right now the most clinically important evidence stream is not addressable by ID or interval reference.**

Once those are patched, this is a solid primitive foundation for pi-chart.


**✅ Council Review: pi-chart Scaffold + Other Agent’s Report**

I walked the entire unpacked scaffold + the detailed council report you pasted.  

**Overall verdict**: This is an **excellent v0**. It is not bloated, philosophically coherent, and already implements the core primitives we converged on (time-indexed, provenance-rich claims with append-only discipline, markdown + NDJSON carriers, derived views as disposable, pi-sim epistemic boundary intact).

The other agent’s file-by-file analysis is **spot-on**. I agree with ~95% of it and will only surface the highest-leverage additions or nuances I see.

### Top Architectural Wins (Keep These)
- “Chart = canonical memory” thesis in README.md
- Date-sharded timeline + one-claim-per-file (events.ndjson + notes/*.md)
- Clear separation: canonical vs `_derived/`
- Six clinical claim types (observation / assessment / intent / action / communication / artifact_ref) + structural types
- Structured `data` payloads in CLAIM-TYPES.md (especially the rich `intent`/`care_plan` shape)
- Tiny `pi_chart/` API surface as the agent boundary
- Git + append-only + supersedes/corrects links

### Critical Gaps to Harden Before pi-agent Autonomy

These are the items I would prioritize (ranked by risk to the agent):

| Priority | Issue | Why It Matters | Recommended Fix |
|----------|-------|----------------|-----------------|
| 1 | `pi_chart/write.py` does not enforce provenance | Agent can write invalid events → silent failures later | Add required-field check + optional schema validation before append. Raise on missing `author`, `source`, `effective_at`, `status`, `subject` |
| 2 | Vitals cannot be cited by assessments | Most clinically important evidence (SpO2 trend) has no ID or interval ref | Add interval evidence refs now: `"vitals://enc_001?name=spo2&from=...&to=..."` (lightest) or give vitals rows IDs |
| 3 | `constraints.md` is pure narrative | Agent must parse prose to avoid penicillin → safety risk | Add structured frontmatter block (allergies list, code_status, preferences) while keeping human body |
| 4 | `read_recent_events()` defaults to wall-clock time | Simulation clock can diverge → “recent” becomes meaningless | Default `as_of` to `latest_effective_at(chart_root)` or sim time |
| 5 | Validator misses inverse note ↔ communication link + note.references check | Referential integrity is one-way only | Add both directions in `_check_referential_integrity` |
| 6 | `build_current()` and derived files use wall-clock timestamp | Noisy git diffs + confusing “as of” for agent | Use latest chart event timestamp instead of `datetime.now()` |
| 7 | `vitals.jsonl` rows lack full provenance shape | Inconsistent with events.ndjson | Add `subject`, `encounter_id`, structured `source` object (keep simple string fallback for v0) |

### Additional Nuances I Would Add

**Clock source (sim vs wall)**  
Add to `chart.yaml`:
```yaml
clock: sim_time          # or wall_time
sim_start: 2026-04-18T06:00:00-05:00
```
Then make `read_recent_events` and derived views respect it. This is load-bearing for any realistic simulation.

**Intent lifecycle**  
Current `status` is overloaded. Consider a small expansion later:
```json
"status": "final",
"data": { "intent_state": "active" | "completed" | "cancelled" | "expired" }
```
For now, keep `status: active` on the intent event.

**Artifacts**  
Current `artifact_ref` + `artifacts/` is sufficient. Only add `manifest.ndjson` if you ever have >50 artifacts.

**Validator hardening**  
- Add `FormatChecker` for `date-time`
- Enforce `subject` matches `chart.yaml`
- Day-directory vs `effective_at` prefix warning (nice-to-have)

### My Recommended Immediate Patch Order

1. Harden `pi_chart/write.py` (required fields + no-overwrite note)
2. Update `schemas/event.schema.json` + validator for clinical vs structural types + FormatChecker
3. Add interval vitals evidence refs + update one assessment example
4. Add structured frontmatter to `constraints.md`
5. Fix time handling in `read.py` + `rebuild_derived.py`
6. Add note ↔ communication bidirectional check in validator

### Final Stance

**Greenlight the scaffold** for continued development.  
It is already better than 90% of “minimal EHR” attempts I’ve seen. The remaining gaps are exactly the right size for v0.1 — they are safety and correctness issues, not feature bloat.

Once the 7 items above are closed, this becomes a rock-solid primitive foundation that can later grow into SQLite index, vector retrieval, or FHIR boundary adapter without touching agent logic.

---

**Would you like me to deliver any of the following right now?**

- Patched `pi_chart/write.py` with required-field enforcement + no-overwrite protection
- Updated `schemas/event.schema.json` + validator changes for the top gaps
- Structured frontmatter example for `constraints.md`
- Small diff for vitals interval evidence refs + one updated assessment
- Or just tell me which single file/thread to go deepest on next

This scaffold is ready to become the durable memory layer for pi-agent. Let’s lock the boundary before we wire the agent in.
