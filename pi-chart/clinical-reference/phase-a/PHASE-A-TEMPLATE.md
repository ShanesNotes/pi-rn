# pi-chart Phase A — Per-Artifact Template

**Revision:** v3.1. This is the mandatory output shape for every artifact
file under `clinical-reference/phase-a/a{N}-{slug}.md`. Copy this template
verbatim; fill each section.

**v3.1 changes from v3:** §16 clarified — open schema questions appear
inline (short form) and in the collected `OPEN-SCHEMA-QUESTIONS.md`
(durable home); output location moved under `clinical-reference/`.

**Read first:** `PHASE-A-CHARTER.md` for the stance, tags, and failure
modes this template enforces.

**Section rules:**

- Every section is mandatory. Thin content is fine; empty sections are not.
- Section ordering is required. Do not reorder.
- Tables use markdown tables, not HTML.
- JSON examples use `jsonc` for comment support.

---

# Template starts here — copy from this line down

```markdown
# A{N}. {Artifact name}

## 1. Clinical purpose

One paragraph. What this artifact is and what clinical work it performs
in patient care. Written from function, not form.

## 2. Agent-native transposition

What this artifact *becomes* in pi-chart, stated as function not form.

Shape:
- Legacy artifact: {what a clinician calls it}
- pi-chart primitive: {type/subtype, or composition of primitives}
- Supporting views: {from timeline, currentState, trend, evidenceChain, openLoops, narrative}

Example form:
> MAR is not a medication tab. In pi-chart it is a fulfillment ledger
> connecting medication intents to administration actions, holds,
> refusals, and monitoring evidence.

This is the load-bearing section. If this is weak, the rest drifts.

## 3. Regulatory / professional floor

Up to 5 anchors. One line each. Cite with enough specificity to verify.

- {Source code} — {what it mandates}
- {Source code} — {what it mandates}

Flag deeper regulatory questions as `[phase-b-regulatory]`.

## 4. Clinical function

Who consumes this artifact, when, and what specific decisions or
handoffs depend on it? Be concrete.

## 5. Who documents

Primary: {RN / MD / APP / RT / PharmD / device / importer / agent}
Secondary: {others who may contribute}
Owner of record: {who is ultimately accountable}

## 6. When / how often

Frequency class: {continuous | periodic | event-driven | one-shot |
per-shift | per-encounter}

- Regulatory minimum: {e.g. "Q4h per Joint Commission PC.01.02.03"}
- Clinical practice norm: {e.g. "Q1h in MICU"}
- Note divergence when regulatory ≠ practice.

## 7. Candidate data elements

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| `field_name` | [clinical] | ✓ | number, % | cannot detect hypoxia trend | pi-sim / MIMIC chartevents | high |
| `other_field` | [cruft] | ✗ | text | n/a — captured for billing | — | high |

**Tag values:** `[regulatory]` `[clinical]` `[agent]` `[cruft]`
`[verify-with-nurse]` `[open-schema]`

**Sourceability values:** `pi-sim` `Synthea` `MIMIC` `pi-agent` `human`
`device` `derived` `manual-scenario` — or a combination.

**Decision test:** every row tagged `[regulatory]` / `[clinical]` /
`[agent]` must have a concrete answer in "What fails if absent?". If
blank or generic ("good to know," "helpful"), the row is `[cruft]`.

Aim for 8–20 included rows. Aggressive filtering is expected.

## 8. Excluded cruft — with rationale

Up to 10 common legacy fields deliberately excluded. Each:

- **Field:** {name}
- **Why it exists in current EHRs:** {billing / legacy / defensive / habit}
- **Why pi-chart excludes it:** {one line}

The "why it exists" reasoning validates the exclusion and protects the
thesis.

## 9. Canonical / derived / rendered

- **Canonical** (lives in claim stream): {events, notes, artifacts}
- **Derived** (computed by view primitives): {which view produces what}
- **Rendered** (UI-only affordance, not pi-chart's concern): {badges,
  colors, grouping, sorting}

Three short sub-lists. This section is usually 10–20 lines but is
required — it prevents UI concepts from leaking into the substrate.

## 10. Provenance and lifecycle

### Provenance
- Source(s) of truth: {patient-reported / device / clinician-authored /
  imported / derived / multiple}
- `source.kind` proposals for pi-chart: {list}

### Lifecycle — answer each:
- **Created by:** {what event creates the artifact}
- **Updated by:** {what can modify or extend it}
- **Fulfilled by:** {what closes the loop, if applicable}
- **Cancelled / discontinued by:** {what terminates it}
- **Superseded / corrected by:** {how errors are handled}
- **Stale when:** {time or condition that makes it expire}
- **Closes the loop when:** {what event downstream resolves it}

Not all apply to every artifact. When an axis doesn't apply, say "n/a"
with one line of why.

### Contradictions and reconciliation
Known ways this artifact conflicts with other artifacts. For each:
- What pi-chart should do: `preserve both` / `warn` / `supersede` /
  `require review`.

Chart-as-claims, not chart-as-truth.

## 11. Missingness / staleness

Agent-native. Answer each:

- **What missing data matters clinically?** {absence that changes care}
- **What missing data is merely unknown?** {absence that doesn't}
- **When does this artifact become stale?** {time window or trigger}
- **Should staleness create an `openLoop`?** {yes/no and why}

Examples the researcher may reference:
- No recent vitals in unstable patient → openLoop
- No pain reassessment after opioid → openLoop
- No allergy documentation → unsafe missing constraint

## 12. Agent read-before-write context

What should an agent read from pi-chart before writing or modifying
this artifact? List specific view calls or chart slices.

Example form:
> Before writing a MAR action, agent reads:
> - `currentState(axis: "intents")` for active medication orders
> - `read_active_constraints` for allergies
> - `timeline(types: ["observation"], subtypes: ["vital_sign"], from: T-1h)`
> - `openLoops()` to confirm no conflicting holds

This section directly feeds future pi-agent implementation.

## 13. Related artifacts

Which other artifacts in this research set reference, trigger, fulfill,
or depend on this one? Use A{N} references.

## 14. Proposed pi-chart slot shape

### Event type + subtype
- **Existing:** `type: {x}, subtype: {y}` (preferred path)
- **OR New (flag to OPEN-SCHEMA):** `type: {proposed}, subtype: {proposed}`
  — justify against the schema entropy budget (charter §3.3).

### Payload shape

```jsonc
{
  "name": "example",
  "value": 0,
  "unit": "",
  "context": { }
}
```

### Link conventions

Which of `supports`, `fulfills`, `addresses`, `supersedes`, `corrects`
apply naturally. Propose new link types only if necessary — flag
`[open-schema]`.

### Evidence addressability

How other claims should cite this artifact as evidence. One or more of:

- `event id`
- `note id`
- `artifact id`
- `interval ref` (from/to window)
- `section ref`
- `child event ids` (for parent artifacts like ordersets)

### Storage placement

`events.ndjson` / `vitals.jsonl` / `notes/*.md` / `artifacts/` / new file.
Justify in one line.

### Frequency class

`continuous` / `periodic` / `event-driven` / `one-shot` / `per-shift` /
`per-encounter`

### View consumers

Which of the six views consume it:
`timeline` / `currentState` / `trend` / `evidenceChain` / `openLoops` /
`narrative`

### Schema confidence

`high` / `medium` / `low` — researcher's confidence the proposal is
correct as stated.

### Schema impact

`none` / `new subtype` / `new payload shape` / `new link convention` /
`new storage pattern` / `new event type`

High-impact + low-confidence proposals are the ones the project owner
will scrutinize first.

## 15. Validator and fixture implications

### Validator rules

Propose at least one rule, or say "none" with justification.

Example:

> - `action.subtype = medication_admin` must carry `links.fulfills`
> pointing to an `intent.subtype = medication_order`, unless
> `data.override_reason` is present.

### Minimal fixture

What examples should exist to prove this artifact works? Aim for 3–6
rows covering normal + edge cases.

Example for A1 Lab result:

- one normal lab
- one critical lab
- one amended lab superseding an earlier result
- one result reviewed via `action.subtype = result_review`

## 16. Open schema questions

Each question appears in two places:

1. **Here** (short form, inline): one-line question + "see
  `OPEN-SCHEMA-QUESTIONS.md#a{N}-<slug>`" anchor.
2. **In `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`** (full
  form, durable home): grouped by artifact, using the shape below.

Durable-home shape:

- **Question:** one sentence
- **Context:** which artifact surfaced it, why it matters
- **Options:** 2–3 candidate resolutions
- **Researcher's lean:** if any; not authoritative

Up to 5 per artifact (A9b exempt).

## 17. Sources

Primary sources used. APA, MLA, or plain-URL acceptable. Just enough
that a reviewer can verify.

```

# Template ends here

---

## Notes for the researcher

- **If a section is genuinely empty for an artifact, say so with one line
  of why.** "n/a — this artifact has no amendment lifecycle" is fine.
  Skipping the section is not.
- **If a section balloons past a page, something is off.** Probably
  drift toward EHR-style exhaustive documentation. Cut and re-anchor on
  clinical function.
- **When in doubt about inclusion, exclude.** Cruft documented with
  "why it exists in EHRs" is more valuable than borderline fields
  included defensively.

*End of template. Next: `PHASE-A-EXECUTION.md` for the work plan.*
```
