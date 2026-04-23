# Claim types

The event envelope (`id`, `subject`, `effective_at`, `recorded_at`, `author`,
`source`, `status`, plus the conditional `encounter_id`, `certainty`, `data`,
`links`) is shared by two type families:

**Clinical event types (six)** — appear in `events.ndjson`:

- `observation`
- `assessment`
- `intent`
- `action`
- `communication`
- `artifact_ref`

These require the full envelope including `encounter_id`, `certainty`,
`data`, and `links` (enforced by `schemas/event.schema.json`).

**Structural chart types (three)** — appear as YAML frontmatter on the
chart's structural markdown files:

- `subject` (used by `patient.md`)
- `encounter` (used by `timeline/<day>/encounter_*.md`)
- `constraint_set` (used by `constraints.md`)

Structural types use a lighter envelope; `data`/`links`/`encounter_id`/`certainty`
are not required.

This file documents the payload conventions for the six clinical types. See
`schemas/event.schema.json` for the formal envelope schema and
`schemas/constraints.schema.json` for the structured constraint block.

## Envelope recap

```jsonc
{
  "id": "evt_YYYYMMDDTHHMM_NN",
  "type": "<one of the six below>",
  "subtype": "<conventional subtype>",
  "subject": "patient_001",
  "encounter_id": "enc_001",

  // exactly one of these two is present (invariant 11, ADR 005):
  "effective_at": "2026-04-18T08:15:00-05:00",       // point event; meaning per-type (see §effective_at per type)
  "effective_period": {                               // interval event; allow-listed per subtype (see table)
    "start": "2026-04-18T06:30:00-05:00",
    "end":   "2026-04-18T08:45:00-05:00"              // omit for open (ongoing) intervals; close via supersession
  },
  "recorded_at":  "2026-04-18T08:15:03-05:00",        // ≥ effective_at except for future-dated intents

  "author": { "id": "pi-agent", "role": "rn_agent", "run_id": "run_..." },
  "source": { "kind": "patient_statement", "ref": "bedside" },   // kind drawn from closed taxonomy in DESIGN §1.1 (ADR 006)
  "transform": { "activity": "infer", "tool": "agent-inference-engine", "run_id": "run_..." }, // OPTIONAL processing-path provenance (ADR 011)

  "certainty": "observed | reported | inferred | planned | performed",
  "status":    "draft | active | final | superseded | entered_in_error",  // graph lifecycle only (ADR 002)

  "data": {
    /* type-specific, see below */
    "status_detail": "...",                           // OPTIONAL, per-subtype domain lifecycle (ADR 002; see table)
    /* other payload fields */
  },

  "links": {
    "supports":    ["evt_..."],   // evidence — bare ids, vitals:// URIs, or structured EvidenceRef objects
    "supersedes":  ["evt_..."],   // what this replaces (new version); also used to close open intervals + detail transitions
    "corrects":    ["evt_..."],   // narrower than supersedes — flags prior error
    "fulfills":    ["evt_..."],   // SOURCES must be action; TARGETS must be intent (invariant 10, ADR 003)
    "addresses":   ["evt_..."],   // intent/action → problem-subtype assessment only (ADR 009)
    "resolves":    ["evt_..."],   // loop-closing or contradiction-resolution target ids (ADR 009)
    "contradicts": [{ "ref": "evt_...", "basis": "..." }] // later-written structural disagreement (ADR 009)
  }
}
```

Link semantics:

| Link | Payload | Meaning |
|---|---|---|
| `supports` | `Array<string \| EvidenceRef>` | Reasoning support for the current claim. Bare ids / URIs stay valid; structured refs are canonical. |
| `supersedes` | `string[]` | Replaces a prior claim while keeping the old claim in the audit trail. |
| `corrects` | `string[]` | Narrows `supersedes` to "the prior claim was wrong / entered in error." |
| `fulfills` | `string[]` | `action` → `intent` closure only (ADR 003). |
| `addresses` | `string[]` | Problem-targeting only: intent/action → `assessment.problem` (ADR 009). |
| `resolves` | `string[]` | Loop-closing or contradiction-resolution targets (ADR 009). |
| `contradicts` | `Array<{ref, basis}>` | Later-written peer-claim tension with a prior event; both claims remain until resolved (ADR 009). |

---

## 1. `observation`

Something seen, measured, heard, reported, or detected.

Conventional subtypes: `vital_sign`, `patient_report`, `exam_finding`,
`lab_result`, `device_reading`, `screening`, `negative` (for denials like
"no known allergies").

### Vital sign (single point — streamed vitals go in `vitals.jsonl` instead)

```jsonc
"data": {
  "name": "spo2",
  "value": 89,
  "unit": "%",
  "context": { "o2_device": "nasal_cannula", "o2_flow_lpm": 2 }
}
```

### Patient-reported symptom

```jsonc
"data": {
  "name": "dyspnea_self_report",
  "value": "increased work of breathing since waking",
  "severity": "moderate",
  "onset": "2026-04-18T07:30:00-05:00"
}
```

### Negative observation

```jsonc
"data": {
  "name": "chest_pain",
  "value": "denies",
  "as_of": "2026-04-18T08:15:00-05:00"
}
```

---

## 2. `assessment`

A clinical interpretation — diagnosis, impression, risk score, trend summary.
Distinct from observation. Should have `links.supports` pointing to the
observations it rests on.

Conventional subtypes: `impression`, `differential`, `trend`, `risk_score`,
`severity`, `problem`.

```jsonc
"data": {
  "summary": "Worsening respiratory status: SpO2 94→89 on stable O2, HR 88→108, RR 18→24 over 40 min",
  "severity": "moderate",
  "differential": [
    { "condition": "worsening pneumonia", "likelihood": "high" },
    { "condition": "new PE",              "likelihood": "low-moderate" },
    { "condition": "mucus plugging",      "likelihood": "moderate" }
  ]
}
```

---

## 3. `intent`

Something proposed or planned. Includes orders, but also richer care plans.

Conventional subtypes: `order`, `care_plan`, `referral`, `follow_up`,
`monitoring_plan`.

### Simple order

```jsonc
"data": {
  "order": "obtain arterial blood gas",
  "indication": "evaluate respiratory failure",
  "priority": "stat"
}
```

### Structured care plan (recommended payload for `subtype: care_plan`)

This is where pi-agent earns its keep — plans with follow-through.

```jsonc
"data": {
  "goal": "Maintain SpO2 >= 90% and avoid acute decompensation",
  "rationale": "Vitals trend suggests progressing hypoxia; patient stable on current O2 but trajectory concerning",
  "responsible": "pi-agent",
  "due_by": "2026-04-18T09:00:00-05:00",
  "success_criteria": [
    "SpO2 >= 90% sustained",
    "RR <= 24",
    "HR < 110"
  ],
  "contingencies": [
    { "trigger": "SpO2 < 88% for >2 min",           "action": "escalate to covering provider; consider FiO2 increase" },
    { "trigger": "RR > 28 or accessory muscle use", "action": "urgent provider notification; consider NIV" },
    { "trigger": "SpO2 stabilizes >= 92% sustained","action": "continue current plan; reassess in 1h" }
  ]
}
```

---

## 4. `action`

Something actually performed. Distinct from `intent`. When an action
closes an intent, use `links.fulfills` (not `links.supports`) —
invariant 10 requires `fulfills` targets to be `intent` events.
`links.supports` still carries evidence the action rests on (e.g. the
observations that triggered it).

Conventional subtypes: `administration`, `procedure`, `notification`,
`measurement`, `intervention`, and — for **acquisition actions** that
fulfill data-producing orders (ADR 003) — `specimen_collection`,
`imaging_acquired`, `procedure_performed`. Acquisition actions carry
`links.fulfills → intent.order`; the resulting `observation` then
`supports` the acquisition action.

### Acquisition action (fulfills a data-producing order)

```jsonc
{
  "type": "action",
  "subtype": "specimen_collection",
  "effective_at": "2026-04-18T05:14:00-05:00",       // when the specimen was collected (performed-at)
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "status": "final",
  "data": {
    "specimen_id": "spec_01J8Q...",
    "specimen_type": "blood",
    "specimen_source": "venous",
    "origin": "routine"                               // "routine" | "ad_hoc" | "standing_protocol"
  },
  "links": {
    "fulfills": ["evt_order_bmp_01"]                  // the originating lab order intent
  }
}
```

```jsonc
"data": {
  "action": "provider_notification",
  "channel": "sbar_note",
  "recipient": "covering_md",
  "note_ref": "note_20260418T0845_sbar"
}
```

---

## 5. `communication`

A note, message, or document. The structured event points to the narrative
body, which lives in `timeline/YYYY-MM-DD/notes/HHMM_<slug>.md` with its own
frontmatter.

Conventional subtypes: `sbar`, `progress_note`, `handoff`, `portal_message`,
`phone_note`.

```jsonc
"data": {
  "note_ref": "note_20260418T0845_sbar",
  "audience": "covering_md",
  "summary": "SBAR: worsening respiratory trend; requesting bedside eval"
}
```

The note file itself follows `schemas/note.schema.json`. Sanctioned paired
authoring goes through `writeCommunicationNote()` so the markdown note and
matching `communication` event land together. `writeNote()` is lower-level:
it only writes the note file, so callers must preserve the note↔communication
invariant themselves.

---

## 6. `artifact_ref`

A pointer to a native file in `artifacts/` — PDF lab report, image, waveform.

Conventional subtypes: `lab_report`, `imaging`, `ecg`, `waveform`,
`scanned_document`.

```jsonc
"data": {
  "kind": "imaging",
  "path": "artifacts/imaging/2026-04-18_cxr.png",
  "description": "Portable AP chest X-ray; left lower lobe consolidation",
  "reported_at": "2026-04-18T06:30:00-05:00"
}
```

Stored `data.path` is patient-root-relative (for example `artifacts/...`),
not an absolute filesystem path. Readers resolve it against the patient
directory before opening the file.

---

## Choosing `type` vs. `subtype`

- `type` is closed (six values). Don't invent new ones.
- `subtype` is open. Use descriptive, snake_case, stable strings.
- If you find yourself wanting a seventh `type`, reach for `subtype` first, or
  model it as `status` on an existing `type`.

## Choosing `certainty` vs. `status`

- `certainty` = epistemic grade of the claim itself. *Is this observed, or inferred?*
- `status`    = lifecycle of the claim within the chart. *Is this active, superseded, retracted?*

They don't mean the same thing and they can vary independently.

---

## Evidence references

`links.supports[]` items can be bare ids / `vitals://` URIs or structured
`EvidenceRef` objects:

```ts
type EvidenceRole =
  | "primary"
  | "context"
  | "counterevidence"
  | "trigger"
  | "confirmatory";

interface EvidenceRef {
  ref: string; // event/note/artifact id, vitals:// URI, or external URI
  kind: "event" | "note" | "artifact" | "vitals_window" | "external" | "vitals";
  role?: EvidenceRole;
  basis?: string;
  selection?: Record<string, unknown>;
  derived_from?: EvidenceRef[];
}
```

Bare strings remain valid on the wire. The object form is the canonical
shape for structured authoring and is reused by `transform.input_refs[]`
(ADR 011). `kind: "vitals"` is a one-release deprecated alias for
`kind: "vitals_window"`. `role` distinguishes how the ref is being used,
`basis` carries a short rationale specific to that ref, `selection`
captures per-kind window/aggregation params, and `derived_from` records
how the ref itself was produced. `derived_from` is provenance for the ref,
not an alias for the current claim's `supports[]`.

Per-row vitals samples don't carry ids, so the URI/object forms let
assessments refer to trends without forcing every sample to be addressable.
Structured note/artifact/external refs are the canonical way to cite
narrative notes, artifact events, and imported resources.

URI grammar:

```
vitals://<encounter_id>?name=<metric>&from=<iso8601>&to=<iso8601>[&unit=<unit>]
```

Example, citing a 40-minute SpO2 trend:

```
vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00
```

The validator parses the URI, locates the named metric in the named
encounter's vitals files, and confirms at least one sample exists in the
window. An empty window is a validation error.

The validator also enforces the assessment-evidence rule: every
`assessment` event's `links.supports[]` must include at least one
`observation` event, vitals window (`vitals://` shorthand or structured
`{ kind: "vitals_window", ref: "vitals://...", selection?: ... }`, with
legacy `kind: "vitals"` accepted for one release), or `artifact_ref`
event. Structured `note` refs may appear for context, but they do not
satisfy invariant 5 by themselves. Pure unsupported inference is rejected.
Assessments cannot cite other assessments as support — the validator
(`hasObservationEvidence` in `src/validate.ts`) narrows bare-id support
targets to `observation` and `artifact_ref`.

---

## `effective_at` per type (ADR 004)

`effective_at` means different things per event type. The single
meaning is "when the claim was true in the world relative to the
patient." Pick the timestamp that best carries that per type:

| Event type       | `effective_at` means                                                        | Notes                                                                                                     |
|------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `observation`    | Physiologic truth-time — specimen collected, study performed, exam observed | Drives `trend` alignment. `data.resulted_at` / `data.verified_at` may appear as informational payload.    |
| `action`         | Performed-at — the moment the action occurred                                | For acquisition actions, this is typically specimen-collected or scan-performed time.                     |
| `intent`         | Ordered-at — when the intent came into force                                | May be **future-dated** when `data.due_by` or `effective_period.start` is present (scheduled/cadence).   |
| `communication`  | Sent-at — when the message left the sender                                   | Callback windows measure from here.                                                                        |
| `artifact_ref`   | Captured-at — when the native artifact was generated                         | Correlates with the originating observation's `effective_at`.                                             |
| `assessment`     | Time-of-writing (≈ `recorded_at`)                                            | Reasoning payload may carry `data.reasoned_asOf` for the clinical as-of the reasoning targets.            |

**Ordering rule.** `recorded_at ≥ effective_at` for all types **except**
`intent`, where future-dated scheduled intents are allowed. Validator
V-TIME-01 enforces the default; V-TIME-02 permits the exemption when
scheduled fields are present.

**Amendments and corrections.** A correction event's `effective_at` is
the physiologic truth-time of the corrected state, **not** the time the
correction was issued. `recorded_at` captures when the correction was
written. This keeps trend and asOf semantics truthful.

---

## Envelope `status` vs. `data.status_detail` (ADR 002)

Envelope `status` governs graph lifecycle (present, replaced, retracted).
Domain lifecycle (held, failed, preliminary, declined, cancelled, …)
moves to optional `data.status_detail`, scoped per `(type, subtype)`.

### Envelope `status` (five values, universal)

| Value              | Meaning                                                           |
|--------------------|-------------------------------------------------------------------|
| `draft`            | Not yet authoritative; agent-provisional before human confirm (rare). |
| `active`           | Current, effective, not yet terminal.                             |
| `final`            | Reached terminal domain state in the normal lifecycle.            |
| `superseded`       | Replaced by a later event via `links.supersedes`.                 |
| `entered_in_error` | Retracted — written in error, not a domain state change. Uses `links.corrects`. |

### `data.status_detail` — per-subtype allowed values

Registered per subtype. Events whose subtype is absent from this table
do not carry `status_detail`.

| Type          | Subtype                              | `status_detail` allowed values                                                     |
|---------------|--------------------------------------|------------------------------------------------------------------------------------|
| `intent`      | `order`                              | `pending \| active \| on_hold \| cancelled \| completed \| failed \| declined`     |
| `intent`      | `care_plan`, `monitoring_plan`       | `pending \| active \| on_hold \| completed \| failed \| cancelled`                 |
| `action`      | `administration`                     | `performed \| held \| refused \| failed \| deferred`                               |
| `action`      | `result_review`                      | `acknowledged \| deferred`                                                         |
| `observation` | `lab_result`, `diagnostic_result`    | `preliminary \| final \| corrected \| amended \| addendum \| cancelled`            |
| `communication` | (any)                              | `sent \| acknowledged \| timeout \| failed`                                        |
| `assessment`  | `problem`                            | `active \| resolved \| inactive \| ruled_out`                                      |

### Consistency rules (validator V-STATUS-01/02/03)

1. `data.status_detail` must be in the subtype's allowed set.
2. `status: entered_in_error` forbids `status_detail`.
3. `status: final` requires a terminal `status_detail` value when one
   is defined for the subtype (e.g., `order` with `final` →
   `status_detail ∈ {completed, cancelled, failed, declined}`).
4. Lifecycle transitions use append+supersede: a new event carrying the
   new `status_detail` and `links.supersedes: [<prior>]`. No in-place
   mutation.

A2's `recommendation_status` (accepted / declined / deferred) is a
**payload field on `result_review`**, not a `status_detail` — it is a
property of the review's content, not the action's lifecycle. Keep
distinct.

---

## `effective_period` — interval events (ADR 005)

Exactly one of `effective_at` (point) or `effective_period` (interval)
is present per event. `effective_period` is allow-listed per
`(type, subtype)`:

| Type          | Subtype                                | Interval semantics                                                               |
|---------------|----------------------------------------|----------------------------------------------------------------------------------|
| `intent`      | `monitoring_plan`, `care_plan`         | The plan's active window.                                                        |
| `action`      | `administration` (infusion/titration)  | The infusion period at a stable rate. New event per rate change (supersedes).    |
| `observation` | `device_reading` (stable setting)      | Vent settings, pressor drip rate, FiO2 epoch.                                    |
| `observation` | `context_segment` (new, ADR 005)       | Care location, NPO, isolation precautions, restraint interval, coverage window.  |

Events outside this allow-list must use `effective_at` (V-INTERVAL-02).

**Open intervals** (`end` absent) close via supersession — a new event
with the same payload plus a populated `effective_period.end` and
`links.supersedes: [<open-interval-id>]` (V-INTERVAL-04 in spirit;
enforced via invariant 2 append-only).

---

## `source.kind` — closed taxonomy

The canonical enumeration lives in DESIGN §1.1 (post ADR 006). Validator
warns on unknown kind in v0.2 and errors in v0.3. New kinds are added
by ADR amendment referencing DESIGN §1.1 plus a kind-specific payload
convention entry here in CLAIM-TYPES. `agent_reasoning` is accepted
with a deprecation notice and migrates to `agent_inference`. Canonical
agent-authored runtime values now include `agent_bedside_observation`,
`agent_action`, `agent_synthesis`, `agent_inference`, and
`agent_review`; repo-owned examples and tests should use those values,
not ad hoc synonyms.
