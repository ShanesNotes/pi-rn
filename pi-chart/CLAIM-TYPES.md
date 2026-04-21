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

  "effective_at": "2026-04-18T08:15:00-05:00",   // when it was true/happened
  "recorded_at":  "2026-04-18T08:15:03-05:00",   // when it was written

  "author": { "id": "pi-agent", "role": "rn_agent", "run_id": "run_..." },
  "source": { "kind": "patient_statement", "ref": "bedside" },

  "certainty": "observed | reported | inferred | planned | performed",
  "status":    "draft | active | final | superseded | entered_in_error",

  "data": { /* type-specific, see below */ },

  "links": {
    "supports":    ["evt_..."],   // evidence — bare ids, vitals:// URIs, or structured EvidenceRef objects
    "supersedes":  ["evt_..."],   // what this replaces (new version)
    "corrects":    ["evt_..."],   // narrower than supersedes — flags prior error
    "fulfills":    ["evt_..."],   // action → intent; closes the loop (invariant 10)
    "addresses":   ["evt_..."]    // intent → problem-subtype assessment or parent intent (invariant 10)
  }
}
```

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
`measurement`, `intervention`.

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
type EvidenceRef =
  | { kind: "event"; id: string }
  | { kind: "note"; id: string }
  | { kind: "artifact"; id: string }
  | { kind: "vitals"; metric: string; from: string; to: string; encounterId?: string };
```

Per-row vitals samples don't carry ids, so the URI/object forms let
assessments refer to trends without forcing every sample to be addressable.
Structured note/artifact refs are the canonical way to cite narrative notes
and artifact events inside `links.supports[]`.

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
`{ kind: "vitals", ... }`), or `artifact_ref` event. Structured `note` refs
may appear for context, but they do not satisfy invariant 5 by themselves.
Pure unsupported inference is rejected.
