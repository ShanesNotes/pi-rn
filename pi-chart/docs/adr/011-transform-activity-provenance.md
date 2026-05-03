# ADR 011 — `transform` block: activity-centric provenance

- **Status:** accepted (2026-04-22)
- **Date:** 2026-04-22 (drafted and accepted in one pass; implementation authorized under a forthcoming ADR 011 implementation contract)
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §1 (envelope), §5.7 (import provenance), schemas/event.schema.json, CLAIM-TYPES, validator
- **Source convergence:** v0.3 foundational-augmentation memo §3.2 (ADR 011); ADR 006 pass 2 (import-family `source.kind` values); A0a/A0b/A0c Phase A ingest discussions flagged repeat processing-path ambiguity; autoresearch P5 (PROV-O alignment; rejected as internal model, kept as pattern borrow)
- **Depends on:** ADR 006 (closed `source.kind` taxonomy — `transform.activity` cross-references the import-family values), ADR 010 (typed `EvidenceRef` — `transform.input_refs` reuses the `$defs.EvidenceRef` definition, especially `kind: external`). Adjacent: ADR 007 (implementation contract precedent).

## Revisions

_None. The scope is one optional envelope field with a six-value enum and two validator rules. Memo §3.2 specifies it end-to-end; the decision is narrow and the review burden is dominated by consistency checks against ADRs 006 and 010._

## Context

`source.kind` (ADR 006) answers **who or what authored this event** — the actor boundary between human bedside observation, agent action, import, and so on. It does not answer **what processing path produced the payload**. Two distinct questions routinely collapse today:

- An assessment authored by `agent_inference` may have been produced by a rule-engine, an LLM, or a pattern-match extractor over narrative. `source.kind` says "agent"; nothing says "infer vs extract."
- An imported Synthea observation carries `source.kind: synthea_import`, but whether the event was a raw-shape import or a unit-normalized variant is not discoverable from the envelope.
- A summary event authored by an agent may aggregate over tens of prior events; without a typed processing-path field, evidence for the summary is indistinguishable from evidence _consumed by_ the summarization.

The memo initially borrowed three candidate fields from W3C PROV-O (`agent`, `on_behalf_of`, `informed_by`). Keeping all three on the envelope is overkill: `author` already encodes the agent, `author.on_behalf_of` already exists for delegation, and `informed_by` duplicates `supports`. The useful residue is a **typed activity** — a short enum describing the processing path — plus a small amount of tool-identification metadata so reruns are reproducible.

An orthogonal pressure lands at the same field: `scripts/import/` (synthea, future mimic) and future agent-authored events (summaries, extractions, inferences) all need to declare provenance beyond `source.kind`. Rather than add a dedicated field per tool, one `transform` block covers all of them.

This ADR adds the optional `transform` block. It does not change `source.kind` semantics (ADR 006 remains authoritative). It does not introduce runtime cryptography or external provenance standards (`prev_hash` and `fingerprint` are separate concerns in ADR 012). It does not borrow the full PROV-O reference model — the borrow is pattern-level only.

## Decision

**Add an optional envelope field `transform: { activity, tool, version?, run_id?, input_refs? }` with a closed six-value `activity` enum. The field is allowed on any event type; its primary consumers are imports and agent-authored events. Two validator rules (V-TRANSFORM-01, V-TRANSFORM-02) constrain internal coherence and evidence resolution.**

### Shape

```jsonc
{
  "transform": {
    "activity":    "infer",                            // one of six enum values
    "tool":        "agent-inference-engine",           // short identifier
    "version":     "0.4.2",                            // optional, tool-provided
    "run_id":      "run_20260422T1415_001",            // optional, stable per invocation
    "input_refs": [                                    // optional, $defs.EvidenceRef entries
      { "ref": "evt_20260422T1410_02", "kind": "event", "role": "primary" },
      { "ref": "vitals://enc_001?name=lactate&from=...&to=...", "kind": "vitals_window" }
    ]
  }
}
```

TypeScript:

```ts
export type TransformActivity =
  | "import"
  | "normalize"
  | "extract"
  | "summarize"
  | "infer"
  | "transcribe";

export interface TransformBlock {
  activity:     TransformActivity;
  tool:         string;
  version?:     string;
  run_id?:      string;
  input_refs?:  EvidenceRef[];
}

export interface EventEnvelopeBase {
  // ... existing fields ...
  transform?:   TransformBlock;
}
```

Field semantics:

| Field | Required | Purpose |
|---|---|---|
| `activity` | yes | Closed-enum processing-path marker. Validator and views reason on it. |
| `tool` | yes | Short identifier (not a URI). Stable across versions of the same tool. Human-readable; not validated against a registry. |
| `version` | no | Tool-declared version string. Opaque to the validator; consumed by reproducibility tooling. |
| `run_id` | no | Stable identifier for one invocation of the tool. Useful for pairing imports with logs and for idempotent retries. |
| `input_refs` | no | Reusable `$defs.EvidenceRef` entries (ADR 010). For imports: `kind: external` URIs. For agent transforms: `kind: event` / `vitals_window` / `note` / `artifact` refs at the inputs consumed. |

### Activity enum — definitional table

| `activity` | Used when | Typical tool |
|---|---|---|
| `import` | External source → pi-chart envelope (no semantic change beyond schema projection) | `synthea-to-pi-chart`, `mimic-to-pi-chart` |
| `normalize` | Re-shape an existing event (unit conversion, code crosswalk, time-zone canonicalization) | `loinc-normalizer`, `units-canonicalizer` |
| `extract` | Structured fact pulled from narrative text | `agent-narrative-extractor`, `agent-verbal-order-extractor` |
| `summarize` | Aggregate or digest over an evidence set | `agent-shift-summary`, `agent-problem-digest` |
| `infer` | Assessment derived from observations by rule, heuristic, or model | `agent-inference-engine`, `rule-severity-scorer` |
| `transcribe` | Speech / handwriting / image → structured | `agent-verbal-order-transcriber`, `ocr-note-transcriber` |

The enum is closed; extending it requires a future ADR. Rationale: six activities cover every processing-path pattern the roadmap anticipates through v0.4; adding more without empirical pressure invites overlap (e.g., a hypothetical `translate` activity is a `normalize` variant at machine level, a `transcribe` variant at human level).

### Relationship to `source.kind` and `author`

- **`source.kind` (ADR 006)** — the actor taxonomy boundary. Answers "who produced this?" in coarse terms.
- **`author`** — the specific identifier of that actor.
- **`transform.activity`** — the processing-path taxonomy. Answers "what path produced this?"

The three are independent axes. A single event carries at most one value per axis:

- `source.kind: clinician_chart_action`, `author.id: rn_smith`, no `transform` (typed human chart entry).
- `source.kind: synthea_import`, `author.id: system`, `transform.activity: import`, `transform.tool: synthea-to-pi-chart` (import).
- `source.kind: agent_inference`, `author.id: agent_severity_v1`, `transform.activity: infer`, `transform.tool: rule-severity-scorer` (agent-authored assessment).

### Back-compat

`transform` is strictly optional. v0.2 events without a `transform` block remain valid. No migration touches pre-existing events; the v0.3 migration script (ADR 010 + ADR 012 + this ADR) does not backfill `transform` — historical processing-path is not reconstructible without the tool metadata that was not captured at write time.

Future imports and agent-authored events SHOULD emit `transform`. Profiles (ADR 008) MAY require it per subtype once the profile layer lands.

### Schema rule

`schemas/event.schema.json` adds one property on the root event object:

```jsonc
"properties": {
  "transform": {
    "type": "object",
    "required": ["activity", "tool"],
    "properties": {
      "activity": {
        "type": "string",
        "enum": ["import", "normalize", "extract", "summarize", "infer", "transcribe"]
      },
      "tool":       { "type": "string", "minLength": 1 },
      "version":    { "type": "string" },
      "run_id":     { "type": "string" },
      "input_refs": {
        "type": "array",
        "items": { "$ref": "#/$defs/EvidenceRef" }
      }
    },
    "additionalProperties": false,
    "description": "Activity-centric provenance. Declares the processing path that produced the payload. Distinct from source.kind (who) and author (which identifier). See ADR 011 and ADR 006."
  }
}
```

`$defs.EvidenceRef` is the definition introduced in ADR 010. No duplication.

### Validator changes

All new rules follow the `V-<AREA>-<NN>` convention.

- **V-TRANSFORM-01.** If `transform.activity` ∈ `{import, normalize}`, then `source.kind` MUST be one of the import-family values per ADR 006 §7.4 (`synthea_import`, future `mimic_import`, `loinc_normalize`, etc.). Severity: **err**. Rationale: an event declared as an import-activity with a non-import `source.kind` has a self-contradictory provenance claim. Error: `V-TRANSFORM-01: transform.activity={activity} requires import-family source.kind; got source.kind={kind}`.
- **V-TRANSFORM-02.** `transform.input_refs[*]` MUST resolve per the same resolution semantics as `links.supports[*]`. `kind: event` / `note` / `artifact` refs MUST resolve within the same patient; `kind: vitals_window` MUST have a well-formed URI with a resolvable encounter; `kind: external` MUST carry a non-empty URI with a recognizable scheme (`synthea://`, `mimic://`, etc.) but the external resource itself is not validated. Severity: **err**. Error message includes the unresolved ref and the kind.

Both rules are err by default — they are additive (only fire when `transform` is present) and their violation indicates a write-path bug, not legacy data drift.

### View impact (minimal; implementation in follow-up ADR)

- **`narrative`** — when `transform` is present, MAY prefix or annotate the rendered sentence with a short provenance tag (e.g., "[extracted from handoff note]", "[inferred by severity scorer]"). Profile-driven phrasing is deferred to ADR 008.
- **`evidenceChain`** — no traversal change. `input_refs` describes the inputs to the transformation, not evidence for the claim; evidence lives in `links.supports` (which may coincide with `input_refs` for inference events, but the two fields encode different epistemic commitments).
- **`currentState`, `trend`, `timeline`, `openLoops`** — unchanged. `transform` is a provenance decoration, not a temporal or state property.

The deliberate choice **not** to conflate `transform.input_refs` with `links.supports` is load-bearing: `supports` is the author's epistemic claim about what evidence the assertion rests on; `input_refs` is the processing-path record of what the tool consumed. An inference engine might consume twenty observations but the author's stated evidence could reasonably be three; an import consumes a single external resource but the imported event does not cite that resource as evidence for its clinical content. Two fields, two meanings.

## Tradeoffs

| Axis                                       | (a) Single `transform` block with closed activity enum (chosen) | (b) Three separate fields (`transform_activity`, `transform_tool`, `transform_input_refs`) | (c) Expand `source.kind` with processing-path values |
|--------------------------------------------|------------------------------------------------------------------|--------------------------------------------------------------------------------------------|------------------------------------------------------|
| Envelope growth                            | one optional object                                              | three optional scalars                                                                     | no envelope change                                   |
| Orthogonality with `source.kind`           | clean — three independent axes                                   | clean                                                                                      | muddied — `source.kind` carries two questions        |
| PROV-O pattern alignment                   | yes (activity-centric, W3C PROV style)                           | partial (loses grouping)                                                                   | no                                                   |
| Validator authority                        | V-TRANSFORM-01/02 enforceable                                    | same                                                                                       | would require enum explosion and per-value special-casing |
| Profile reuse (ADR 008)                    | profiles can require/forbid `transform` per subtype              | same but with three fields to coordinate                                                   | no grouping for profiles to constrain                 |
| Input refs as typed structure              | reuses `$defs.EvidenceRef` (ADR 010)                             | same                                                                                       | no structured inputs                                 |
| Back-compat                                | additive optional field                                          | additive                                                                                   | would require ADR 006 re-open                        |

(a) is the minimum grouping that preserves `source.kind` semantics while giving imports and agent transforms a typed home. (b) is equivalent in information content but harder to require/forbid as a unit. (c) overloads the single axis `source.kind` is trying to stay clean on.

## Consequences

- **DESIGN.md §1** — envelope table adds `transform?` row pointing at the activity enum and cross-referencing ADR 011.
- **DESIGN.md §5.7** — import-provenance section updated to recommend `transform.activity: import` in addition to `source.kind: <import-family>`. The two are now the canonical pair for imports.
- **DESIGN.md §8** — new invariant (or fold into existing invariant 5, author accountability): "when `transform` is present, `transform.activity` and `source.kind` MUST be coherent per V-TRANSFORM-01."
- **schemas/event.schema.json** — add `properties.transform` as specified. Reuse `$defs.EvidenceRef` from ADR 010 — this ADR's implementation MUST land after ADR 010's, in the same or later phase.
- **CLAIM-TYPES.md** — per-type payload table notes that `transform.activity` conventions per type (imports: `import`; summaries: `summarize`; inference events: `infer`; extractions: `extract`). Not enforced at subtype level — that belongs in profiles (ADR 008).
- **src/types.ts** — `TransformActivity` enum, `TransformBlock` interface, optional `transform?` on `EventEnvelopeBase`.
- **src/validate.ts** — V-TRANSFORM-01 (cross-references the ADR 006 import-family source.kind list), V-TRANSFORM-02 (reuses the `supports` resolver).
- **src/views/narrative.ts** — optional provenance-tag annotation when `transform` present; rendering phrasing deferred to ADR 008.
- **scripts/import/** — synthea and future mimic importers emit `transform.activity: import`, `transform.tool: synthea-to-pi-chart` (or equivalent), `transform.run_id` set per invocation, `transform.input_refs` populated with `kind: external` entries pointing at the source identifiers.
- **Seed `patient_001`** — audit: no existing events carry `transform`; no migration churn. Any future imported seed fragments MUST carry `transform` going forward.
- **ROADMAP.md** — mark ADR 011 accepted; implementation pending under follow-on contract (likely batched with ADRs 009 and 010 implementation per memo §10 Tier 1 framing).

## Not decided here

- **Whether `tool` values migrate to a closed registry.** Current decision: open string. Revisit if two tools start emitting overlapping names.
- **Whether `transform.activity: translate`** (source-language → target-language for narrative content) gets its own enum value. Current lean: defer; a translation is a `normalize` at machine level and a `transcribe` at human level. Add if a concrete use case appears.
- **Whether `transform` MAY carry a nested prior `transform` (for composed pipelines).** Current decision: no — compose by emitting one event per transformation step with `supersedes` linkage; the full pipeline is the chain, not a nested field. Revisit if pipeline depth becomes a common pattern.
- **Whether `transform.version` MUST follow SemVer.** Current decision: opaque string. Tool authors choose; reproducibility tooling parses best-effort.
- **Whether profiles (ADR 008) gain a `transform_required_when` predicate.** Deferred to ADR 008. Lean: yes — some subtypes (e.g., imported observations, agent-inferred assessments) should require `transform`; others (human chart entries) should forbid it.
- **Whether `run_id` is cross-referenced with any persisted run log.** Current decision: not yet — a run-log persistence is out of scope for v0.3. Revisit in Tier 2 when pi-agent integration lands.
- **Interaction with ADR 014 incident snapshots.** Incident-snapshot `artifact_ref` events may or may not carry `transform.activity: summarize`. Deferred to ADR 014; not blocking.
