# ADR 010 — Typed `EvidenceRef` with roles

- **Status:** accepted (2026-04-22)
- **Date:** 2026-04-22 (drafted and accepted in one pass; implementation authorized under a forthcoming ADR 010 implementation contract)
- **Deciders:** Shane (operator)
- **Touches:** DESIGN §4.5 (views — evidence), §1 (envelope — `links.supports`), schemas/event.schema.json, CLAIM-TYPES, validator, views (`evidenceChain`, downstream `narrative`)
- **Source convergence:** v0.3 foundational-augmentation memo §2.5, §3.5, §10 (Tier 1 #1); A0b counterevidence semantics (assessment constraint graph); A1 Q2 (lab resulted-vs-collected) evidence-grade pressure; autoresearch P2 (typed evidence for provenance-preserving agents)
- **Depends on:** ADRs 002 (status lifecycle), 003 (fulfillment-intermediate action), 007 (implementation contract precedent). Enables ADRs 009 (contradicts) and 011 (transform) by establishing the reusable `EvidenceRef` definition.

## Revisions

_None. Authored after v0.3 memo pass; accepted without further review passes because the substrate change is strictly additive, the v0.2 wire format remains valid, and downstream consumers (ADRs 009 and 011) are already specified against this shape in the memo._

## Context

`links.supports` is the epistemic backbone of the chart. Every reasoning event — assessments, communications of clinical judgment, agent-authored inferences — cites evidence through this field. `evidenceChain` traverses it. `narrative` cites it. `currentState` relies on supersession-plus-evidence to decide what is currently believed true.

The v0.2 shape (`src/types.ts`, `src/evidence.ts`, `schemas/event.schema.json`) admits two forms:

- **Bare strings** — an event id, a note id, or a `vitals://` URI. Back-compat-friendly; human-pleasant; structurally opaque to the validator beyond id-resolution.
- **Structured `EvidenceRef` objects** — a discriminated union with per-kind fields: `{kind: "event", id}`, `{kind: "vitals", metric, from, to, encounterId?}`, `{kind: "note", id}`, `{kind: "artifact", id}`. Canonical form; readable by validator and views.

Three semantic gaps have accumulated under real use:

1. **No role.** A counterevidence citation looks identical to a confirmatory citation. A trigger ("this is the 08:15 lactate that tripped the threshold") looks identical to context ("this is the baseline from the prior shift"). Reasoning chains cannot surface author intent, and `narrative` cannot phrase them differently.
2. **No `basis`.** When an evidence ref requires a short human rationale ("chose the 5-minute median to smooth the artifact"), the author has nowhere to put it short of spilling into the event payload or a separate note.
3. **No non-defeasible provenance.** An inferred assessment may rest on a derived observation that itself rests on a normalization of an imported sample. `evidenceChain` walks `supports` backward one level at a time, but has no typed chain for _how this particular ref was itself produced_.

Beyond the gaps, the v0.2 object shape is inconsistent: event/note/artifact carry `id`, vitals carries `metric/from/to/encounterId`, and future kinds (ADR 011 imports, §3.2 of the memo, need `kind: external` for `synthea://` / `mimic://` URIs) would add a third per-kind convention. The union has not scaled.

Two downstream ADRs assume this is fixed. ADR 009 (`contradicts`) requires a stable role semantics so that `role: counterevidence` on `supports` reads distinctly from a `contradicts` link — one is an author acknowledging disconfirming data inside a single claim, the other is a structural disagreement between two peer claims. ADR 011 (`transform.input_refs`) requires `kind: external` for cross-system import refs. Both must cite a reusable `EvidenceRef` definition, which v0.2 does not cleanly provide.

This ADR settles the shape, the role vocabulary, and the validator surface. It does not implement — by ADR 007 precedent, implementation lands under a follow-on "ADR 010 implementation" contract that moves the schema, types, `parseEvidenceRef`, validator rules, and `evidenceChain` role threading in one coherent phase.

## Decision

**Refactor `EvidenceRef` to a single canonical object shape with a unified `ref` string, an extended `kind` enum (adding `vitals_window` and `external`; retaining `vitals` as a deprecated alias for one release), and four new optional fields: `role`, `basis`, `selection`, `derived_from`.** Keep bare strings valid on the wire for human-authored events (back-compat). Agent-authored inferred events are tightened to the object form under V-EVIDENCE-01.

### Shape

Canonical form:

```jsonc
// Bare-string form (human-authored, back-compat)
"supports": [
  "evt_20260420T0815_03",
  "note_20260420T0845_sbar",
  "vitals://enc_001?name=spo2&from=2026-04-20T08:00Z&to=2026-04-20T08:30Z"
]

// Structured form (agent-authored canonical)
"supports": [
  {
    "ref":   "evt_20260420T0815_03",
    "kind":  "event",
    "role":  "primary",
    "basis": "specimen drawn ten minutes before the handoff"
  },
  {
    "ref":  "vitals://enc_001?name=lactate&from=2026-04-20T06:00Z&to=2026-04-20T08:15Z",
    "kind": "vitals_window",
    "role": "trigger",
    "selection": { "stat": "median", "window_s": 300 }
  },
  {
    "ref":          "synthea://enc_abc?resource=Observation/obs_71",
    "kind":         "external",
    "role":         "context",
    "derived_from": [
      { "ref": "run_20260420_synthea_import_001", "kind": "artifact", "role": "primary" }
    ]
  }
]
```

Field semantics (all fields optional except `ref` + `kind` when the object form is used):

| Field | Type | Purpose |
|---|---|---|
| `ref` | `string` | Bare id (event/note/artifact) or URI (`vitals://`, `synthea://`, `mimic://`). One field covers every kind. |
| `kind` | `enum` | `event` \| `vitals_window` \| `note` \| `artifact` \| `external`. `vitals` accepted as a back-compat alias for `vitals_window` for one release. |
| `role` | `enum` | `primary` \| `context` \| `counterevidence` \| `trigger` \| `confirmatory`. See §Role semantics below. |
| `basis` | `string` (≤500) | Short author-written rationale for this ref specifically. Not a replacement for `statusReason`. |
| `selection` | `object` | Per-kind free-form aggregation / selection params. For `vitals_window`, typical keys are `metric`, `from`, `to`, `encounterId`, `stat`, `window_s`; validator does not enforce sub-schema at the envelope layer (profiles MAY, ADR 008). |
| `derived_from` | `EvidenceRef[]` | Non-defeasible provenance chain: how _this ref itself_ was produced. Distinct from `supports` (the claim's evidence). Recursive, acyclic, bounded depth. |

### Role semantics

Five roles are the minimum set that preserves the distinctions observed in Phase A Batch 0 and Batch 1 research:

- **`primary`** — the observation or fact on which this claim principally rests. At most one per `supports[]` array; multiple primaries indicate a poorly-factored claim and should be split into separate assessments (V-EVIDENCE-02).
- **`context`** — background that conditions interpretation but does not itself drive the assertion. Prior baselines, historical allergies, the fact that the patient is on chronic dialysis, etc.
- **`counterevidence`** — disconfirming data the author acknowledges and is asserting their claim _anyway_. Records epistemic honesty inside one reasoned assertion. Distinct from the ADR 009 `contradicts` link; see §Interaction with ADR 009.
- **`trigger`** — the specific threshold-crossing observation or event that prompted this claim. Useful for protocol-driven assessments ("lactate ≥ 4 triggered sepsis-bundle assessment") and for `narrative` rendering to lead with the prompting datum.
- **`confirmatory`** — additional evidence consistent with the claim, neither primary nor a trigger. Supports narrative depth and `evidenceChain` breadth without inflating the primary cite.

Why five, not three: the A0b constraint graph and A1 lab-review sequence both distinguish the observation that _prompted_ a claim from the observation that _grounds_ it, and separately from background context. Collapsing trigger into primary loses the protocol linkage; collapsing context into confirmatory loses the "this is frame, not evidence" distinction that `narrative` relies on for readable phrasing. Three roles would under-specify; seven or more would be indistinguishable in practice.

### Back-compat

- Bare strings remain valid. Bare event/note ids and `vitals://` URIs parse through the existing `parseEvidenceRef` logic and are treated as `{kind: <inferred>, ref: <string>}` with no role.
- `kind: "vitals"` remains acceptable on the wire for one release. `parseEvidenceRef` normalizes it to `kind: "vitals_window"` on read; the v0.3 migration script (§Consequences) rewrites structured vitals refs in-place for the seed corpus. The back-compat alias is removed in v0.4.
- Structured v0.2 vitals refs (`{kind: "vitals", metric, from, to, encounterId}`) are migrated to the new shape (`{kind: "vitals_window", ref: <vitals:// URI>, selection: {metric, from, to, encounterId}}`). The `ref` field for vitals windows is the canonical URI form so human readers can resolve the ref without the `selection` block.
- Existing structured event/note/artifact refs (`{kind, id}`) migrate to `{kind, ref}` via a mechanical rename of `id` → `ref`. No semantic change.

### Schema rule

`schemas/event.schema.json` factors the object form into a reusable `$defs.EvidenceRef` and rewrites `links.supports.items.oneOf[1]` to reference it. ADR 009 and ADR 011 reuse the same definition for their link schemas (`contradicts[].ref`, `transform.input_refs[]`).

```jsonc
"$defs": {
  "EvidenceRef": {
    "type": "object",
    "required": ["ref", "kind"],
    "properties": {
      "ref":   { "type": "string", "minLength": 1 },
      "kind":  {
        "type": "string",
        "enum": ["event", "vitals_window", "note", "artifact", "external", "vitals"]
      },
      "role": {
        "type": "string",
        "enum": ["primary", "context", "counterevidence", "trigger", "confirmatory"]
      },
      "basis":        { "type": "string", "maxLength": 500 },
      "selection":    { "type": "object" },
      "derived_from": { "type": "array", "items": { "$ref": "#/$defs/EvidenceRef" } }
    },
    "additionalProperties": false
  }
}

// links.supports.items becomes:
"supports": {
  "type": "array",
  "items": {
    "oneOf": [
      { "type": "string", "minLength": 1 },
      { "$ref": "#/$defs/EvidenceRef" }
    ]
  }
}
```

`kind: "vitals"` is retained in the enum so v0.2 events remain schema-valid through one v0.3 release; the deprecation is recorded in a schema-level `description` comment and in CLAIM-TYPES.

### Validator changes

All new rules follow the `V-<AREA>-<NN>` convention from ADR 007.

- **V-EVIDENCE-01.** Agent-authored assessments with `certainty: inferred` MUST use the object form of `EvidenceRef` for every entry in `supports[]`. Bare strings are rejected in this case. Severity: **warn in v0.3**, promotes to **err** after Phase A Batch 2 fixtures pass under the warn-only rule (follows the V-SRC-01 promotion pattern from ADR 006). Human-authored events and non-inferred certainties are unaffected.
- **V-EVIDENCE-02.** An event's `supports[]` array MUST contain at most one entry with `role: primary`. Severity: err. Multiple primaries are a modeling smell and should be surfaced, not silently accepted. Roles other than `primary` are unconstrained in count.
- **V-EVIDENCE-03.** `derived_from` chains MUST be acyclic and bounded at depth 8. Severity: err. Depth bound mirrors the existing `evidenceChain` view depth cap so cycles-or-runaway-chains in provenance cannot starve the view's traversal budget.

Error messages name the rule code and the invariant position. V-EVIDENCE-01 cites DESIGN §4.5; V-EVIDENCE-02 cites DESIGN §1 invariant 4 (epistemic honesty); V-EVIDENCE-03 cites DESIGN §4.5 depth cap.

### View updates (documented, implemented in follow-up ADR)

- **`evidenceChain`** — `EvidenceNode` gains an optional `role?: EvidenceRole` field populated from the source ref. Traversal is unchanged in this ADR; ADR 009 adds the `contradicts` fork at the same view.
- **`narrative`** — role-aware phrasing is _deferred_ to a follow-up ADR. The view can read `role` once implementation lands, but the prose templates that consume it are a separate concern and ship with profiles (ADR 008).
- **`currentState`, `trend`, `timeline`, `openLoops`** — unchanged. Evidence roles are an epistemic decoration, not a temporal or state property.

### Interaction with ADR 009 (`contradicts`)

`role: counterevidence` and the `contradicts` link record two distinct epistemic acts and MUST NOT be conflated:

- **`role: counterevidence` on `supports`** — one author, one claim, disconfirming data acknowledged. "I see this lactate trending down; I am still asserting worsening sepsis because of the mottled skin and the pressor requirement." Epistemic honesty inside a single reasoned assertion.
- **`contradicts` link (ADR 009)** — two authors, two peer claims, no retraction. "RN at 14:00 documented pain 3/10; RN at 14:15 documents 8/10 with no intervening analgesia." Structural tension between claims, resolution deferred.

A single event MAY carry both: an agent-authored assessment MAY have `supports: [{ref: F, role: counterevidence}]` and `contradicts: [{ref: F, basis: ...}]` if the author wishes to both acknowledge the data and mark an active disagreement. In practice, one or the other applies. Profiles (ADR 008) MAY constrain per subtype — e.g., `assessment.problem.v1` might forbid `contradicts` against the author's own prior same-problem assessments (use `supersedes` or `corrects` instead).

ADR 009's `contradicts[].ref` field reuses `$defs.EvidenceRef`'s `ref` shape but not the full object — `contradicts` entries are a bare `{ref, basis}` pair, not a full `EvidenceRef`, because role semantics do not apply to structural disagreement.

## Tradeoffs

| Axis                                   | (a) Five-role typed `EvidenceRef` with unified `ref` (chosen) | (b) Narrow role enum (primary/supporting/counter) | (c) Free-form `role: string` |
|----------------------------------------|---------------------------------------------------------------|---------------------------------------------------|------------------------------|
| Expressiveness                         | matches Phase A A0b/A1 use cases                              | loses trigger / context distinction               | arbitrary                    |
| Validator determinism                  | enum-gated, V-EVIDENCE-02 enforceable                         | enum-gated                                        | none — cannot enforce primary-count |
| Profile reuse (ADR 008)                | profiles can whitelist roles per subtype                      | same                                              | profiles cannot constrain meaningfully |
| Narrative phrasing                     | role-aware templates feasible                                 | coarse                                            | unusable without a canonical enum |
| Churn on v0.2 fixtures                 | low — structured refs migrate mechanically; bare strings untouched | low                                               | lowest (nothing to validate)  |
| Downstream ADR 009/011 reuse           | single `$defs.EvidenceRef` definition                         | same                                              | same                         |
| Back-compat cost                       | one-release `kind: vitals` alias + `id`→`ref` rename          | one-release alias                                 | no shape change              |

(a) is the minimum enumeration that carries the distinctions Phase A research has surfaced without bloating. (b) is easier to ship but forces trigger- and context-shaped evidence into an "other" bucket that `narrative` cannot render distinctly. (c) sacrifices validator authority and downstream profile leverage for a convenience that saves no implementation time.

## Consequences

- **DESIGN.md §4.5** — rewrite the `EvidenceRef` type signature; document the five roles; document `derived_from` acyclic-bounded-depth invariant; note the `kind: vitals` → `kind: vitals_window` rename with a one-release alias.
- **DESIGN.md §1** — `links.supports` table row footnote updated to point at the new `$defs.EvidenceRef` and mention role semantics briefly.
- **DESIGN.md §8** — add invariant note (or fold into existing invariant 4) that `role: primary` count is at most one per claim.
- **schemas/event.schema.json** — factor `$defs.EvidenceRef`; rewrite `links.supports.items.oneOf[1]` to `$ref`; add `description` comments flagging the `vitals` alias.
- **CLAIM-TYPES.md** — `links.supports` entry gets the new shape; role enum documented with one-line examples; back-compat alias noted.
- **src/types.ts** — `EvidenceRef` becomes a single interface with optional fields (not a discriminated union of per-kind shapes); `Links.supports` stays `Array<string | EvidenceRef>`.
- **src/evidence.ts** — `parseEvidenceRef` normalizes `kind: vitals` → `kind: vitals_window`, folds v0.2 `metric/from/to/encounterId` into `selection`, renames `id` → `ref`.
- **src/validate.ts** — V-EVIDENCE-01/02/03 as above. V-EVIDENCE-01 is wired against the existing `certainty`/`author`-source cross-check (reuse the inferred-assessment predicate).
- **src/views/evidenceChain.ts** — `EvidenceNode` gains `role?: EvidenceRole`; `derived_from` traversal added alongside existing supports walk, sharing the depth budget.
- **scripts/migrate-v02-to-v03.ts** — rewrite structured vitals refs' kind and field layout; rename `id` → `ref` on structured event/note/artifact refs; leave bare-string supports alone. Idempotent; re-running is a no-op.
- **Seed `patient_001`** — audit: any agent-authored assessment with `certainty: inferred` using bare-string supports is migrated to the object form under V-EVIDENCE-01; structured vitals refs are rewritten by the migration script; no semantic change.
- **Repo-owned tests/examples** — `src/evidence.test.ts` and `src/views/evidenceChain.test.ts` get new cases exercising role threading, `derived_from` traversal, and the three validator rules.
- **ROADMAP.md** — mark ADR 010 accepted; implementation pending under follow-on contract.

## Not decided here

- **Whether `role: primary` becomes _required_ on inferred assessments** (not just the object form required). Defer until Phase A Batch 2 fixtures supply empirical data on how often authors skip role annotation. Lean: yes, post-Batch 2.
- **Whether `selection` for `vitals_window` gets a closed sub-schema.** Current freedom (any object) lets profiles (ADR 008) constrain per subtype. Revisit if two profiles converge on identical `selection` shapes; extract at that point.
- **Whether `derived_from` carries its own `role`.** In v0.3, the outer ref's role applies to the whole chain. Roles inside `derived_from` are set to the default (unset). Revisit if a concrete use case emerges where a provenance step needs an independent role.
- **Whether `kind: external` gains a `source_kind` hint aligned with the ADR 006 taxonomy** (e.g., `source_kind: "synthea_import"`). Deferred to ADR 011 per division of labor — `transform.activity` already carries the import-family signal, and double-encoding on the ref adds no validator authority.
- **Whether the `kind: vitals` back-compat alias is removed in v0.4 or held for two minors.** Lean: removed in v0.4; the seed migration runs idempotently and repo-owned fixtures migrate in one pass.
- **Interaction with pi-agent evidence emission.** pi-agent is not modified by this ADR. When pi-agent consumes the new shape, whether it writes `role: primary` on every inferred assessment is a pi-agent policy, not a pi-chart policy.
