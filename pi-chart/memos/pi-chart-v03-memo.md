# pi-chart v0.3 Foundational Augmentation Memo

**Audience.** Claude Code operating inside `pi-rn/`, with full context on `pi-chart/DESIGN.md`, `ARCHITECTURE.md`, `CLAIM-TYPES.md`, `ROADMAP.md`, and ADRs 001–007.

**Status.** Synthesis of three independent architectural reviews. Specifies the v0.2 → v0.3 foundational tightening pass. Maps to ADRs 008–014 and one module-tree addition.

**Conventions.** RFC 2119 (MUST/SHOULD/MAY). Validator rule IDs use `V-<DOMAIN>-<NN>` per ADR 007 precedent (e.g. V-STATUS-01, V-FULFILL-01). Schema paths are JSON Pointer fragments relative to `schemas/event.schema.json` unless noted. File paths relative to `pi-chart/`.

**Preconditions.** All ADR 002–006 implementation (landed 2026-04-21 under ADR 007) is in place. Seams 1–3 in `ROADMAP.md` remain open and are out of scope here (pi-sim vitals schema, encounter_id resolution, chart-tools extension).

---

## 0. Organizing claim

The 6/5/6 core is load-bearing and correct. It needs **one** primitive-level change (a sixth link type, `contradicts`). Everything else is layered around it through three backbones:

1. **Evidence layer** — typed `EvidenceRef` with roles; `contradicts` link; `contested_claim` openLoop kind.
2. **Provenance layer** — `transform` block; `logical_id` + `fingerprint` + `prev_hash`; `invalidated_at` denormalization; incident snapshots.
3. **Governance layer** — `profiles/` registry; attestation, suppression, protocol invocation as typed subtypes bound to profiles.

The `profiles/` registry is the **keystone**. It is the default answer to every future "should we add a type/subtype/link/state field?" pressure — if a profile can express it, the envelope does not grow.

**What this memo does not do.** It does not expand the 6 clinical event types. It does not adopt FHIR/openEHR internals. It does not introduce crypto in the hot path. It does not change storage format. It does not touch the two-clock model, patient isolation, or `_derived/` disposability. It does not touch pi-sim or pi-agent.

---

## 1. Kept without change (load-bearing, convergent across reviews)

| Concern | Status | Reference |
|---|---|---|
| 6 clinical event types | keep | DESIGN §1.1, CLAIM-TYPES |
| 6 view primitives | keep (extend outputs, not set) | DESIGN §4 |
| Closed `source.kind` taxonomy | keep (add 2 values, §7.3) | ADR 006 |
| Append-only via supersession | keep | DESIGN §1 invariant 2 |
| Patient isolation | keep | DESIGN §8 invariant 6 |
| Session transparency | keep | DESIGN §8 invariant 7 |
| File-native NDJSON + MD + YAML | keep | DESIGN §2 |
| Two-clock model (`sim_time`/`wall_time`) | keep | DESIGN §7 |
| `_derived/` disposability | keep (strengthen via blue/green; Tier 3) | DESIGN §8 invariant 3 |
| FHIR at boundary only | keep | DESIGN §10 |
| Synthea as historical corpus | keep | ADR 001 |
| 10 existing invariants | keep; additive only | DESIGN §8 |

**Link count changes 5 → 6 (`contradicts` added). No other primitive changes.**

---

## 2. Primitive change — the sixth link

### 2.1 `contradicts` link (proposed ADR 009)

**Semantics.** Two peer claims in mutual tension; both honestly authored; no winner asserted at write time. Structurally distinct from `corrects` (winner chosen) and from `counterevidence` role on `supports` (disconfirming data inside the case being built for one claim).

**Clinical cases that MUST use this link:**

- Two nurses document pain scores 15 min apart with no intervening analgesia (3/10 at 14:00; 8/10 at 14:15).
- Patient-stated "no allergies" vs pharmacy record "documented PCN reaction."
- "Hemodynamically stable" assessment vs BP 72/40 ten minutes later (no intervening event).
- Two sources disagree on home medication list.

**Schema diff** (`schemas/event.schema.json`):

```json5
{
  "properties": {
    "links": {
      "properties": {
        "contradicts": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["ref", "basis"],
            "properties": {
              "ref":   { "type": "string", "description": "event id within same patient" },
              "basis": { "type": "string", "maxLength": 500 }
            },
            "additionalProperties": false
          }
        }
      }
    }
  }
}
```

**TypeScript** (`src/types.ts`):

```ts
export interface ContradictsLink {
  ref: string;      // event id, same-patient only
  basis: string;    // short operator-authored rationale, required
}

export interface Link {
  supports?:    EvidenceRef[];     // §3.5
  supersedes?:  string[];
  corrects?:    string[];
  fulfills?:    string[];
  addresses?:   string[];
  contradicts?: ContradictsLink[]; // new
}
```

**Direction convention.** The later-written event (higher `recorded_at`) MUST carry the link pointing at the earlier. Validator derives the symmetric `contradicted_by` index for view consumption; it is not stored.

**Resolution pattern** (how contradictions close without destroying evidence):

Emit a resolving event (typically `assessment`) that:

1. `supersedes` one of the two contradicting events (or authors a third superseding both),
2. carries a `resolves` link to the earlier event in the contradiction pair (see §2.3 for `addresses` → `resolves` rename),
3. includes non-empty `statusReason` / `basis`.

The original `contradicts` link is never deleted or rewritten. It lives in the chain as permanent audit surface.

### 2.2 Invariants

**V-CONTRA-01.** `contradicts[*].ref` MUST resolve to an event in the same patient directory. Error: `contradicts.ref out-of-patient or nonexistent: {ref}`.

**V-CONTRA-02.** An event MUST NOT simultaneously `contradict` and `correct` the same target. (Correction is a resolved contradiction.) Error: `contradicts and corrects target same event: {ref}`.

**V-CONTRA-03.** `contradicts[*].ref` MUST point at an event with `recorded_at < source.recorded_at`. (Direction convention; later carries the link.) Error: `contradicts.ref newer than source event`.

**V-CONTRA-04 (warning only in v0.3).** If A contradicts B, no event C should supersede B without either (a) itself contradicting A, or (b) carrying `resolves: [<contradiction-event-id>]`. Warning (not error) because retrospective resolution without reference is common in legacy data.

### 2.3 Companion refactor — rename `addresses` → `resolves` OR narrow it

`addresses` in v0.2 carries two semantics:
- problem-targeting (intent → assessment; communication → assessment),
- loop-closing (communication/action → open-loop source).

Pick one of:

**Option A** (recommended): **narrow `addresses` to problem-targeting only**; introduce `resolves` as the loop-closing link. `resolves` is also the link the contradiction-resolver uses per §2.1. Two disjoint relations, two names.

**Option B**: rename `addresses` → `targets` for problem-targeting; `resolves` for loop-closing. Clean but higher churn.

Option A is preferred. Migration is mechanical: v0.2 `addresses` where target `type` is `assessment` with `subtype: problem` stays; where target is an open-loop-source event (intent with unfulfilled status, observation that raised an alert), rewrite to `resolves`.

**V-RESOLVES-01.** `resolves` targets MUST be either an open-loop-kind event (pending intent, active alert, contradicts-link-carrying event) OR a contradiction-carrying event.

### 2.4 View effects

**`currentState`** — when two active (non-superseded) events contradict each other, return BOTH in the relevant axis payload with `contested: true` and `contested_with: [<event_ids>]`. **Never pick a silent winner.** The contested flag is the clinical surface for "someone needs to look at this."

**`evidenceChain`** — when traversal hits a contradicts edge, the returned tree forks. Both branches are traversable. Max-depth bound applies to each branch.

**`openLoops`** — new openLoop kind `contested_claim`:

```ts
type OpenLoopKind =
  | "pending_intent"
  | "overdue_intent"
  | "unacknowledged_communication"
  | "contested_claim";    // new in v0.3

type ContestedClaimLoop = {
  kind: "contested_claim";
  events: [string, string];          // ordered pair (older, newer)
  basis: string;                     // from contradicts link
  age_seconds: number;               // since newer event's recorded_at
  threshold_seconds: number;         // from profile or default
  severity?: "low"|"medium"|"high";  // from profile, if any
};
```

Unresolved contradictions older than a threshold (default 3600s wall-clock / one sim-tick-hour) surface as clinical tasks. The threshold MAY be set per-profile (e.g. medication contradictions have lower threshold than pain-score contradictions).

**`timeline`** — contradictions render as paired entries with symmetric linking affordance.

**`narrative`** — contested claims annotated at render time in `_derived/current.md`.

### 2.5 Why not collapse into `counterevidence` role (§3.5)?

Different grain:

- `counterevidence` role on `supports`: "I am building a claim and I am aware of disconfirming data. Here it is. I am still asserting my claim." Epistemic honesty inside one reasoned assertion.
- `contradicts` link: "Someone else asserted X. I am asserting Y. Neither of us is retracting. Resolution deferred." Structural tension between two peer claims.

A nurse can `supports` with `role: counterevidence` when writing an assessment. A nurse cannot `supports:counterevidence` someone else's already-written assessment — that would be mutation. The second case is exactly where `contradicts` lives.

---

## 3. Envelope additions

All optional in v0.3 for backwards compatibility with v0.2 events. The migration script (§8) backfills computable fields (`fingerprint`, `logical_id` for supersession chain heads, `prev_hash`).

### 3.1 `profile` — reference to governance registry (ADR 008)

```json5
{
  "properties": {
    "profile": {
      "type": "string",
      "pattern": "^[a-z_]+\\.[a-z_]+(\\.[a-z_]+)*\\.v[0-9]+$"
    }
  }
}
```

TypeScript:

```ts
export type ProfileId = string; // e.g. "intent.order.medication.v1"
export interface EventEnvelopeV03 extends EventEnvelopeV02 {
  profile?: ProfileId;
}
```

Format: `<type>.<subtype>[.<qualifier>...].v<n>`. Lowercase, underscore-separated segments.

Resolution: `profiles/<type>/<subtype>/[<qualifier>/]<name>.v<n>.md`. Example: `intent.order.medication.v1` → `profiles/intent/order/medication.v1.md`.

**V-PROFILE-01.** If `profile` is present, the profile file MUST exist.

**V-PROFILE-02.** Profile's `type` and `subtype` (in frontmatter) MUST match the event's `type` and `subtype`.

**V-PROFILE-03.** If profile declares `required_data_fields`, they MUST be present in `data`. If profile declares `lifecycle_transitions` and the event has `data.lifecycle_state` alongside a prior event (supersession chain head) with `data.lifecycle_state`, the transition MUST be declared valid.

See §4 for the governance layer spec.

### 3.2 `transform` — activity-centric provenance (ADR 011)

Answers: what processing path produced this claim? Collapses three earlier candidate fields (`agent`, `on_behalf_of`, `informed_by` from the PROV-O borrow) into one activity-centric block aligned with W3C PROV's model.

```json5
{
  "properties": {
    "transform": {
      "type": "object",
      "required": ["activity", "tool"],
      "properties": {
        "activity": {
          "type": "string",
          "enum": ["import", "normalize", "extract", "summarize", "infer", "transcribe"]
        },
        "tool":       { "type": "string" },
        "version":    { "type": "string" },
        "run_id":     { "type": "string" },
        "input_refs": { "type": "array", "items": { "$ref": "#/definitions/EvidenceRef" } }
      },
      "additionalProperties": false
    }
  }
}
```

TypeScript:

```ts
export type TransformActivity =
  | "import" | "normalize" | "extract" | "summarize" | "infer" | "transcribe";

export interface TransformBlock {
  activity:    TransformActivity;
  tool:        string;
  version?:    string;
  run_id?:     string;
  input_refs?: EvidenceRef[];
}
```

**Activity guidance:**

| activity | Used when | Typical tool |
|---|---|---|
| `import` | External source → pi-chart envelope | `synthea-to-pi-chart`, `mimic-to-pi-chart` |
| `normalize` | Re-shape existing event (unit conversion, code crosswalk) | `loinc-normalizer` |
| `extract` | Structured fact pulled from narrative | `agent-narrative-extractor` |
| `summarize` | Aggregate/digest over evidence set | `agent-shift-summary` |
| `infer` | Assessment derived from observations by rule or model | `agent-inference-engine` |
| `transcribe` | Speech/handwriting → structured | `agent-verbal-order-transcriber` |

**V-TRANSFORM-01.** If `transform.activity` ∈ `{import, normalize}`, `source.kind` MUST be `synthea_import` or another import-family kind (see §7.3). Rule prevents transform/source disagreement.

**V-TRANSFORM-02.** `transform.input_refs[*]` MUST resolve (same resolution as `supports`).

### 3.3 Identity & integrity — `logical_id`, `fingerprint`, `prev_hash` (ADR 012)

```json5
{
  "properties": {
    "logical_id":  { "type": "string", "pattern": "^lgc_[a-z0-9_]+$" },
    "fingerprint": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    "prev_hash":   { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$|^reset$" }
  }
}
```

**`logical_id`.** Stable identifier for a clinical-assertion lineage. All events in a supersession/correction chain share `logical_id`. Allocated at chain head; inherited by `supersedes`/`corrects` successors. Distinct from `id` (which is immutable per-event).

**`fingerprint`.** `sha256(canonical_json(data))` per RFC 8785 JSON Canonicalization Scheme. Deterministic from payload. Enables idempotent imports and agent retry safety.

**`prev_hash`.** `sha256(canonical_json(prior_line))` within the same NDJSON file. First line per file carries `prev_hash: "reset"` OR is preceded by a `chain_reset` marker event (see below). Tamper-evident line-chain.

**Chain reset marker.** When a backup is restored or a file is legitimately rebuilt, emit as the first line:

```json
{"type":"_chain_reset","effective_at":"...","recorded_at":"...","reason":"backup_restore_2026-04-22","prev_hash":"reset"}
```

Chain-reset markers are the only lines permitted to carry `prev_hash: "reset"` after the file's first-ever line.

**Module additions:**

```
src/
  hash.ts           # canonicalJson() [RFC 8785], sha256(), computeFingerprint(), computePrevHash()
  identity.ts       # allocateLogicalId(), inheritLogicalId()
```

**Invariants:**

**V-HASH-01.** Every event MUST serialize deterministically under RFC 8785 canonical JSON. (Functional check: re-serialize and byte-compare.)

**V-HASH-02.** `prev_hash` chain MUST be unbroken within each `events.ndjson` file (modulo `_chain_reset` markers).

**V-HASH-03.** If `fingerprint` is present, it MUST equal `sha256(canonical_json(data))`.

**V-ID-01.** `supersedes` and `corrects` targets MUST share `logical_id` with the source event.

**V-ID-02.** `logical_id` values MUST be unique per lineage (two unrelated chain heads cannot share a `logical_id`). Implied by lineage inheritance; checked at allocation.

### 3.4 `invalidated_at` — denormalized bitemporal field (ADR 013)

Answers: "what was believed true at time X?" without walking the supersession chain.

```json5
{
  "properties": {
    "invalidated_at": { "type": "string", "format": "date-time" }
  }
}
```

**Semantics.** Non-null only when the event is superseded, corrected, or closed-by-interval. Value = `effective_at` of the superseding/correcting event, OR `effective_period.end` of a closed interval. The `supersedes`/`corrects` link is the authoritative source; the field is a derived cache.

**V-INVALIDATED-01.** If `invalidated_at` is present on event E, there MUST exist an event E' with E' ∈ `{events superseding E, events correcting E}` AND `E'.effective_at === E.invalidated_at`. If both are present, equality check fires.

**V-INVALIDATED-02.** `rebuildDerived` MUST be capable of recomputing `invalidated_at` for every event from link-graph walk alone. The field is disposable; the link is authoritative.

**Query affordance.** `readActiveAt(t: string)` becomes `events where effective_at ≤ t AND (invalidated_at is null OR invalidated_at > t)` — O(N) scan with no chain-walk.

### 3.5 Typed `EvidenceRef` with roles (ADR 010)

Replaces the current `supports[]` admission of bare IDs + vitals URIs + structured objects with a single polymorphic-but-typed shape.

```json5
{
  "definitions": {
    "EvidenceRef": {
      "oneOf": [
        { "type": "string", "description": "bare event id or vitals:// URI — legacy/human-quick-entry only" },
        {
          "type": "object",
          "required": ["ref", "kind"],
          "properties": {
            "ref":          { "type": "string" },
            "kind":         { "type": "string", "enum": ["event","vitals_window","note","artifact","external"] },
            "role":         { "type": "string", "enum": ["primary","context","counterevidence","trigger","confirmatory"] },
            "basis":        { "type": "string", "maxLength": 500 },
            "selection":    { "type": "object" },
            "derived_from": { "type": "array", "items": { "$ref": "#/definitions/EvidenceRef" } }
          },
          "additionalProperties": false
        }
      ]
    }
  }
}
```

TypeScript:

```ts
export type EvidenceRefKind = "event" | "vitals_window" | "note" | "artifact" | "external";
export type EvidenceRole =
  | "primary"          // the observation/fact on which this claim principally rests
  | "context"          // background that conditions interpretation
  | "counterevidence"  // disconfirming data acknowledged by the author
  | "trigger"          // the threshold/event that prompted this claim
  | "confirmatory";    // additional evidence consistent with the claim

export interface TypedEvidenceRef {
  ref:          string;
  kind:         EvidenceRefKind;
  role?:        EvidenceRole;
  basis?:       string;
  selection?:   Record<string, unknown>; // e.g. { stat: "median", window_s: 300 }
  derived_from?: EvidenceRef[];          // non-defeasible provenance chain
}

export type EvidenceRef = string | TypedEvidenceRef;
```

**`kind: external`** supports `transform.input_refs` for Synthea/MIMIC imports (e.g. `ref: "synthea://enc_abc?resource=Observation/obs_71"`).

**V-EVIDENCE-01.** Agent-authored assessments with `certainty: inferred` MUST use `TypedEvidenceRef` (object form) for every entry in `supports`. Bare strings permitted only for human-authored events.

**V-EVIDENCE-02.** At most one `role: primary` per `supports[]` array per event. (Multiple primaries indicate a poorly-factored claim; split into separate assessments.)

**V-EVIDENCE-03.** `derived_from` chains MUST be acyclic. Max depth 8 (same as existing `evidenceChain` depth cap).

**Interaction with `contradicts`:** if event E has `supports[*].role: counterevidence` referencing event F, E MAY also carry `contradicts: [{ref: F, basis: ...}]` if the author intends to mark a live disagreement (not merely acknowledge). Usually one or the other — counterevidence signals "I see it and I assert X anyway"; contradicts signals "I am asserting Y against their X and resolution is deferred." Profiles MAY constrain per subtype.

---

## 4. Governance layer — `profiles/` (ADR 008)

### 4.1 Directory

```
pi-chart/
├── profiles/
│   ├── README.md                              # registry overview + authoring guide
│   ├── schema.md                              # frontmatter spec (authoritative)
│   ├── intent/
│   │   ├── order/
│   │   │   ├── lab.v1.md
│   │   │   ├── imaging.v1.md
│   │   │   └── medication.v1.md
│   │   ├── orderset/
│   │   │   └── sepsis_bundle.v1.md
│   │   └── protocol/
│   │       └── titration_norepi.v1.md
│   ├── action/
│   │   ├── medication_administration/
│   │   │   ├── single_dose.v1.md
│   │   │   └── infusion.v1.md
│   │   ├── procedure/
│   │   │   └── central_line_placement.v1.md
│   │   └── suppression.v1.md
│   ├── assessment/
│   │   ├── problem.v1.md
│   │   ├── constraint/
│   │   │   ├── allergy.v1.md
│   │   │   └── code_status.v1.md
│   │   └── respiratory_status.v1.md
│   ├── communication/
│   │   ├── handoff.v1.md
│   │   ├── sbar.v1.md
│   │   ├── attestation.v1.md
│   │   └── provider_notification.v1.md
│   └── observation/
│       └── vitals_window.v1.md
```

### 4.2 Profile file format

Markdown file with YAML frontmatter. Frontmatter is the machine contract; prose is clinical rationale, openEHR archetype cross-references, example events.

**Frontmatter schema** (`profiles/schema.md` authoritative; JSON Schema below for the validator):

```yaml
---
profile_id:      intent.order.medication.v1   # MUST match filename
type:            intent                       # one of the 6 clinical types (or structural type)
subtype:         order                        # MUST match event.subtype when used
schema_version:  0.1.0                        # profile's own version (semver)
status:          draft | accepted | deprecated | superseded_by:<profile_id>

# Data shape contract
required_data_fields:  [medication, dose, route, frequency, indication_ref]
optional_data_fields:  [titration_bounds, hold_parameters, max_duration]
data_field_types:
  medication:
    type: object
    required: [name, rxnorm_code]
  dose:
    type: object
    required: [amount, unit]

# Lifecycle (for intents and long-running actions)
valid_lifecycle_states:
  - draft
  - requested
  - accepted
  - in_progress
  - on_hold
  - completed
  - failed
  - cancelled
  - entered_in_error
lifecycle_transitions:
  draft:        [requested, cancelled, entered_in_error]
  requested:    [accepted, cancelled, on_hold, entered_in_error]
  accepted:     [in_progress, cancelled, on_hold]
  in_progress:  [completed, failed, on_hold]
  on_hold:      [in_progress, cancelled]
  completed:    []    # terminal
  failed:       []    # terminal
  cancelled:    []    # terminal
  entered_in_error: []
status_reason_required_when: [cancelled, failed, on_hold, entered_in_error]

# Relational contract
fulfillment_rule: |
  One or more action events with links.fulfills → this intent.
  Terminal state completed requires at least one fulfilling action with status != failed.
attestation:
  required_roles: [cosign]     # see §7.1
  required_count: 1
  required_before_state: accepted
evidence:
  allowed_roles: [primary, context, trigger]
  counterevidence_permitted: true
contradicts_threshold_seconds: 1800   # for contested_claim openLoop

# Contested-claim severity
contested_severity: medium

# Cross-references (non-authoritative; for human clinical validation)
references:
  - openEHR-EHR-INSTRUCTION.medication_order.v1
  - FHIR R5 Task state machine
  - institution: pi-chart/clinical-reference/phase-a/a9b-medication-order.md  # future

# Deprecation
deprecated_at:      # ISO8601, present only if status=deprecated
superseded_by:      # profile_id, present only if status=superseded_by
---

# Medication order intent

Clinical contract and rationale. This is documentation; the frontmatter is the machine contract.

## What this profile covers

- One-time doses, scheduled doses, PRN orders, and infusion initiation orders.
- Excluded: titration-step actions (see `action.medication_administration.infusion.v1` for per-titration events).

## Lifecycle detail
...
## Attestation detail
...
## Evidence discipline
...
## Cross-references
...
```

**JSON Schema for frontmatter** lives at `schemas/profile.schema.json`. Validator MUST load and check every profile.

### 4.3 Resolution

`src/profiles.ts`:

```ts
export interface Profile {
  id:               string;
  filepath:         string;
  frontmatter:      ProfileFrontmatter;
  prose:            string;
}

export function loadProfile(id: ProfileId): Profile;
export function resolveProfileForEvent(event: Event): Profile | null;  // matches on event.profile or (type,subtype)
export function listProfiles(): Profile[];
```

Profile lookup order:

1. `event.profile` field (exact profile_id match) — preferred, authoritative.
2. `(event.type, event.subtype)` → default profile (`<type>/<subtype>.v<max>.md` where one exists with `status: accepted`). Fallback only; warning in validator.

### 4.4 Initial profile set (v0.3 deliverable)

Ship in v0.3. Order reflects which profiles exercise the most downstream invariants (and therefore are the best test harness for the whole profile layer).

| Profile | Type/subtype | Exercises |
|---|---|---|
| `intent.order.medication.v1` | intent/order | lifecycle, attestation, fulfillment rule |
| `intent.order.lab.v1` | intent/order | lifecycle, fulfillment (result observation) |
| `assessment.problem.v1` | assessment | longitudinal thread via derived index |
| `assessment.constraint.allergy.v1` | assessment/constraint | openEHR archetype adaptation |
| `assessment.constraint.code_status.v1` | assessment/constraint | constraint activation lifecycle |
| `action.medication_administration.infusion.v1` | action | fulfillment, interval primitive (ADR 005) |
| `communication.handoff.v1` | communication | required fields (`to`, `context_ref`, `accepted_at`) |
| `communication.attestation.v1` | communication | §7.1 |
| `action.suppression.v1` | action | §7.2 |

### 4.5 Invariants

(V-PROFILE-01 through V-PROFILE-03 defined in §3.1.)

**V-PROFILE-04.** Every accepted profile MUST validate against `schemas/profile.schema.json`.

**V-PROFILE-05.** Profiles with `status: deprecated` MAY be referenced by existing events; new events MUST NOT reference them (write-path rejection). Profiles with `status: superseded_by` behave the same; `superseded_by` MUST point to an accepted profile.

**V-PROFILE-06.** Profile filename MUST match `profile_id` (mechanical check).

---

## 5. View-level changes

### 5.1 `currentState` additions

```ts
// views/currentState.ts — additions
export interface CurrentStatePanel<T> {
  active:    T[];
  contested: Array<{ events: [string, string]; basis: string; axis: string }>;
}
```

Every axis panel (problems, constraints, intents, observations) returns both `active` and `contested`. UI surfaces `contested` prominently; agents see both.

**Logic:** two active (non-superseded) events with a `contradicts` link between them appear in `contested`. Either side being superseded removes them from `contested` (supersession may or may not resolve the contradiction — resolution requires the `resolves` link per §2.1, but an axis stops being actively contested when one side is no longer active).

### 5.2 `evidenceChain` additions

```ts
export interface EvidenceNode {
  event_id:     string;
  role?:        EvidenceRole;
  children:     EvidenceNode[];
  contradicts?: EvidenceNode[];   // fork point — new in v0.3
  depth_cap_reached?: boolean;
}
```

Traversal forks at contradicts edges. Depth cap applies to each branch independently. Cycle detection uses a visited set across branches (contradicts does not loop by construction, but `derived_from` within an EvidenceRef might).

### 5.3 `openLoops` additions

New kind `contested_claim` (definition in §2.4). Update `views/openLoops.ts` union; update `views/active.ts` supersession/correction logic to compute contested state.

**Ordering.** Default openLoops output orders by `severity` (from profile, default `medium`) then `age_seconds` descending. Contested claims with `severity: high` surface above overdue intents.

### 5.4 New composition — `contextBundle`

A read-side composition helper over the existing six primitives. Not a new view.

```ts
// src/views/bundle.ts
export interface ContextBundleSelection {
  axes?:           ("problems"|"constraints"|"intents"|"observations"|"notes")[];
  timeWindow?:     { from?: string; to?: string };
  includeEvidenceClosure?: boolean;  // default true
  includeContradictions?:  boolean;  // default true
  includeProfiles?:        boolean;  // default true
  maxDepth?:       number;           // evidence-chain depth cap, default 8
}

export interface ContextBundle {
  scope:         PatientScope;
  as_of:         string;
  selection:     ContextBundleSelection;
  views: {
    currentState?:  ReturnType<typeof currentState>;
    timeline?:      ReturnType<typeof timeline>;
    openLoops?:     ReturnType<typeof openLoops>;
    narrative?:     ReturnType<typeof narrative>;
  };
  evidence_closure: Event[];         // all events reachable via link graph
  profiles:         Profile[];       // profiles referenced by any included event
  transforms:       TransformBlock[]; // transform provenance for included events
  fingerprint:      string;          // bundle-level hash for reproducibility
}

export function contextBundle(
  scope: PatientScope,
  selection: ContextBundleSelection,
): ContextBundle;
```

**Uses:**
- pi-agent run input (deterministic context for an agent invocation).
- MedAgentBench/AgentClinic fixture generation.
- Case export (nurse reviewing a shift).
- `_derived/` cache key (bundle fingerprint stable under reordering).

---

## 6. Structural v0.3 additions — protocols, problem threads, ordersets

None require new event types; all express via profiles + derived indices.

### 6.1 Protocol invocation

Profile: `intent.protocol.v1`. Emits an `intent` event with `subtype: protocol`, `data: { protocol_id, parameters, ... }`. Per-step actions carry `links.fulfills: [<protocol intent id>]` and may carry their own profile (e.g. `action.medication_administration.infusion.v1`). Derived view: `_derived/protocol_executions.json` indexes protocol intents and their fulfilling actions.

### 6.2 Longitudinal problem thread

Profile: `assessment.problem.v1`. Problem-subtype assessments carry `data: { problem_name, onset_at, severity, status, snomed_code?, ... }`. Threading is computed: events with the same `logical_id` form one thread. Derived view: `_derived/problem_threads.json` = `{ [problem_name]: { thread_id, events: [ids], active: bool, ... } }`. No new primitive.

### 6.3 Orderset invocation

Profile: `intent.orderset.v1`. Parent intent emits first; child intents carry `links.fulfills: [<orderset parent id>]` (reusing fulfills for parent/child; see V-FULFILL guidance from ADR 003). Derived view: `_derived/ordersets.json`.

---

## 7. Operational events via subtype + profile

### 7.1 Attestation (ADR 014 — section 1)

Profile: `communication.attestation.v1`.

```jsonc
{
  "type": "communication",
  "subtype": "attestation",
  "profile": "communication.attestation.v1",
  "effective_at": "...",
  "recorded_at": "...",
  "author": { "id": "rn_smith", "role": "RN" },
  "source": { "kind": "agent_action" },
  "status": "active",
  "data": {
    "attests_to":    "evt_20260422T0830_03",
    "attestation_role": "cosign",        // cosign | witness | countersign | scribe
    "on_behalf_of":  "md_jones"          // optional; scribe / verbal-order pattern
  },
  "links": {
    "supports": [{ "ref": "evt_20260422T0830_03", "kind": "event", "role": "primary" }]
  }
}
```

**V-ATTEST-01.** When an event's resolved profile declares `attestation.required_count: N` with `attestation.required_before_state: <state>`, a state transition into `<state>` MUST NOT be permitted until ≥N attestation events with the required role and distinct `author.id` exist. (Runtime write rejection.)

**V-ATTEST-02.** `data.on_behalf_of` MUST differ from `author.id`.

**V-ATTEST-03.** Attestation events MUST `supports` their target event (redundant with `data.attests_to`; both carried for query affordance).

### 7.2 Suppression (ADR 014 — section 2)

Profile: `action.suppression.v1`. Any dismissal of an alert, open-loop surface, or agent recommendation MUST be a typed event. UI MUST NOT dismiss silently.

```jsonc
{
  "type": "action",
  "subtype": "suppression",
  "profile": "action.suppression.v1",
  "data": {
    "suppression_kind": "dismiss" | "snooze" | "ignore",
    "duration_seconds": 3600,              // for snooze
    "rationale": "patient expected post-op Hb drop; not pursuing"
  },
  "links": {
    "addresses": [{ "ref": "<suppressed event id>" }]
  }
}
```

(ISA-18.2 alarm-shelving pattern.)

**V-SUPPRESS-01.** `addresses` MUST resolve. `rationale` MUST be non-empty for `suppression_kind: ignore`.

**V-SUPPRESS-02.** Suppression does NOT supersede or correct the target. View layer honors active suppressions for rendering; `currentState` with `include_suppressed: true` overrides.

### 7.3 Incident snapshots (ADR 014 — section 3)

New `source.kind` values:
- `incident_code`
- `incident_med_error`
- `incident_rapid_response`
- `incident_snapshot` (the bundle event itself)

When a `source.kind` ∈ {incident_code, incident_med_error, incident_rapid_response} event is written, the write-path MUST emit a companion event within N seconds (default 300):

```jsonc
{
  "type": "artifact_ref",
  "subtype": "incident_snapshot",
  "source": { "kind": "incident_snapshot" },
  "data": {
    "incident_event_id": "<id of triggering event>",
    "window_before_seconds": 1200,
    "window_after_seconds":  1200,
    "event_ids": [/* full ring-buffer list */]
  },
  "links": {
    "supports": [{ "ref": "<incident event id>", "kind": "event", "role": "primary" }]
  }
}
```

The snapshot is an artifact_ref pointing at a generated bundle file under `patients/<id>/artifacts/incidents/<incident_id>.json` — full event copies, profile references, rendered contextBundle. Nuclear SPDS post-trip-buffer pattern.

**V-INCIDENT-01.** Any event with `source.kind` ∈ incident-family MUST have a matching `incident_snapshot` artifact_ref event within 300s wall-time (or equivalent sim-time) of `recorded_at`. Warning in v0.3; error in v0.4.

**V-INCIDENT-02.** Incident snapshots MUST NOT be superseded, corrected, or contradicted. They are sealed historical evidence.

### 7.4 `source.kind` taxonomy additions

Per ADR 006, `source.kind` is closed. v0.3 amends the registry:

```
// Add to DESIGN §1.1 source.kind registry
incident_code              // rapid clinical event: cardiac/respiratory arrest
incident_med_error         // medication error event
incident_rapid_response    // rapid-response-team activation
incident_snapshot          // ring-buffer bundle event (auto-generated)
```

(V-SRC-* from ADR 006 continues to enforce closed enum.)

---

## 8. Migration — v0.2 → v0.3

`scripts/migrate-v02-to-v03.ts`. Idempotent. Per-patient.

### 8.1 Version bump

- `pi-chart.yaml`: `system_version: 0.3.0`, `schema_version: 0.3.0`.
- `patients/<id>/chart.yaml`: `chart_version: 0.3.0`, `schema_version: 0.3.0`.

### 8.2 Backfills (deterministic, no semantic change)

| Field | Backfill rule |
|---|---|
| `fingerprint` | compute `sha256(canonical_json(data))` per event |
| `logical_id` | allocate new `lgc_*` per chain head (event with no `supersedes`/`corrects` predecessor); inherit along chain via BFS |
| `prev_hash` | compute per-file, sequentially; first line gets `"reset"` |
| `invalidated_at` | compute from supersession/correction links |

Backfills are deterministic — re-running the migration produces byte-identical output.

### 8.3 Rewrites (semantic, one-shot)

- Rewrite `links.addresses` → `links.resolves` where target is an open-loop-kind event per §2.3 Option A narrowing. Leave as `addresses` where target is a `problem`-subtype assessment.
- No rewrite of existing bare-string `supports` entries. They remain valid under v0.3 for human-authored events.

### 8.4 Scaffolding

- Create `profiles/` directory with initial set (§4.4).
- Create `schemas/profile.schema.json`.
- Create `src/profiles.ts`, `src/hash.ts`, `src/identity.ts`.
- Create `src/views/bundle.ts`.
- Update `src/types.ts`, `src/write.ts`, `src/validate.ts`, `src/views/{currentState,evidenceChain,openLoops}.ts`.
- Update `schemas/event.schema.json` with optional additive fields.
- Update `CLAIM-TYPES.md` with new link, new source.kinds, profile references.
- Update `DESIGN.md` §1.1, §4, §8 (new invariants V-CONTRA-*, V-HASH-*, V-ID-*, V-PROFILE-*, V-EVIDENCE-*, V-TRANSFORM-*, V-INVALIDATED-*, V-ATTEST-*, V-SUPPRESS-*, V-INCIDENT-*, V-RESOLVES-*).
- Update `ARCHITECTURE.md` module map.
- Update `ROADMAP.md`: close seams where applicable; move relevant deferred primitives to shipped.

### 8.5 Validation at end

```bash
npm run migrate -- --from 0.2 --to 0.3 .
npm run validate              # all patients, strict mode
npm test                      # unit + colocated
```

Green on validate + test is the acceptance gate.

---

## 9. Reject list (do not implement)

| Rejected | Rationale |
|---|---|
| 7th top-level clinical event type | `profiles/` absorbs every pressure |
| Separate "memory" / "fact" store outside the chart | destroys single-stream invariant (DESIGN §1) |
| Autonomous reasoning artifacts inside pi-chart | belongs in pi-agent, not the substrate |
| LLM-arbitrated supersession or contradiction resolution | non-deterministic; violates ADR 006 author accountability |
| Self-editing core memory (Letta pattern) | MINJA attack class; violates append-only |
| ADD/UPDATE/DELETE mutable memory (Mem0 pattern) | same |
| LLM-generated importance scoring (Generative Agents pattern) | salience MUST be deterministic-rule-driven (profile thresholds, openLoop severities) |
| FHIR resources as internal model | boundary only (DESIGN §10) |
| openEHR reference model, templates, or AQL internally | pattern borrow only (profile format inspiration); platform adoption rejected |
| Merkle trees, Trillian, Sigstore/in-toto DSSE envelopes | third-party-auditor patterns; pi-chart's file IS the evidence |
| DIDs + JSON-LD + W3C Verifiable Credentials | zero value over `prev_hash` + optional detached JWS |
| Dolt, Iroh, Noms, or any content-addressable substrate swap | git + NDJSON + `prev_hash` covers 95% at 0% operational cost |
| Vector DB as core substrate | typed views answer most queries; add embeddings only if `narrative` retrieval measurably fails |
| Synthea state-machine extension for flowsheet granularity | 7-day timestep fights the problem; layer Pulse above |
| Architectural decisions driven by Zep/Mem0 LOCOMO/LongMemEval disputes | benchmarks measure the wrong thing for clinical |
| Per-event schema_version field at this stage | deferred per ROADMAP; profile `schema_version` + event `fingerprint` + chart `schema_version` cover the compatibility question until a genuine schema-breaking change arrives |
| Crypto operations in the hot write path | `prev_hash`/`fingerprint` are SHA-256-only; no signing in write path; any signing is out-of-band attestation event |
| Any "edit" API on `src/write.ts` | mutation is append-only via `supersedes`/`corrects` (DESIGN §1 invariant 2) |

---

## 10. Sequenced implementation plan (ADRs 008–014)

**Dependency graph:**

```
ADR 009 (contradicts) ──────┐
ADR 010 (evidence refs) ────┤
ADR 011 (transform) ────────┼──► ADR 008 (profiles) ──► ADR 014 (attestation/suppression/incident)
ADR 012 (identity/hash) ────┤
ADR 013 (invalidated_at) ───┘
```

ADRs 009–013 are envelope-level and independent. ADR 008 depends on the validator and schema changes from ADRs 009–013 being in place (so profiles can reference the new fields). ADR 014 depends on 008 (uses profiles) and 011/010 (uses transform + evidence refs).

### Tier 1 (v0.3 release — concurrent with Phase A)

Ship as one coherent version bump. Order within the tier reflects implementation dependency and risk:

| # | ADR | Change | LOC (est) | Risk |
|---|---|---|---|---|
| 1 | 010 | Typed `EvidenceRef` + roles | 150 | low (additive) |
| 2 | 009 | `contradicts` link + `contested_claim` openLoop + address/resolves narrowing | 400 | medium (view changes) |
| 3 | 011 | `transform` block | 100 | low (optional field) |
| 4 | 012 | `logical_id`, `fingerprint`, `prev_hash` | 300 | medium (migration) |
| 5 | 013 | `invalidated_at` denormalization | 150 | low (derivable) |
| 6 | 008 | `profiles/` registry + initial 9 profiles + validator | 800 | medium (new module) |
| 7 | 014 | attestation + suppression + incident snapshots | 350 | low (uses profiles) |

Total ≈ 2250 LOC of library code + test suites + 9 profile files + migration script. Feasible as a single `v0.3.0` release.

### Tier 2 (post-v0.3, pre-pi-agent integration)

Close the three open seams from `ROADMAP.md` against the v0.3 substrate:

1. pi-sim vitals schema ↔ ingest translator (Seam 1).
2. encounter_id resolution for ingest (Seam 2).
3. chart-tools Pi extension against v0.3 (Seam 3).

### Tier 3 (scale-driven, deferred)

- Blue/green projection swap for `_derived/` (Marten pattern).
- Snapshot-every-N events for `_derived/<view>/snapshots/<patient>.json`.
- Encounter-scoped stream splitting (`patients/<id>/encounters/<enc_id>/events.ndjson`) once first long-stay ICU patient enters the corpus.

### Tier 4 (product differentiation — parallel track)

- Pulse → pi-chart native ingest + FHIR-boundary emitter. Single largest differentiator. ~500 LOC Python. No OSS equivalent.
- Synthea × Pulse orchestrator (`src/orchestrators/synthea_pulse/`).
- MedAgentBench + AgentClinic validation harness via FHIR-boundary emitter.
- DeepEval G-Eval per-record realism rubric (pre-acceptance gate for seed corpus).
- MEDS exporter (`src/exporters/meds/`). Export only — no internal model collapse.

---

## 11. Test fixture plan

Exercise every new feature against `patient_001` without disrupting its existing respiratory-decompensation teaching narrative. Fixtures live in `patients/patient_001/timeline/YYYY-MM-DD/` or a new fixture-only patient `patient_fixture_v03/` if disruption is unavoidable.

| Feature | Fixture to add |
|---|---|
| `contradicts` link | Two pain assessments 15 min apart, no analgesia; no resolver → surfaces as `contested_claim` openLoop |
| `contested_claim` resolution | Third assessment superseding one side + `resolves` link → openLoop clears |
| Typed EvidenceRef with `counterevidence` role | Assessment with one `primary` + one `counterevidence` → evidenceChain branches |
| `transform` block | One event with `transform.activity: extract` from a note → narrative view shows provenance |
| `logical_id` inheritance | Chain of 3 supersessions → all share `logical_id`; backfill-identical under re-migration |
| `fingerprint` idempotency | Two identical import attempts → second is no-op on fingerprint match |
| `prev_hash` integrity | Tamper test: modify a line mid-file → `npm run validate` fails with V-HASH-02 |
| `invalidated_at` query | `readActiveAt(t_mid_chain)` returns pre-supersession view |
| `profile` binding | Medication intent with explicit profile → lifecycle rejection test (illegal transition) |
| Attestation gate | Verbal order transitions `requested → accepted` only after cosign attestation |
| Suppression | Dismiss an openLoop → typed suppression event exists; re-firing within `duration_seconds` suppressed |
| Incident snapshot | Emit `incident_rapid_response` → companion `incident_snapshot` auto-appended within 300s |

Each fixture has an accompanying test asserting the invariant fires (or doesn't) as specified.

---

## 12. MedBeads flag

One review cited MedBeads as an immutable, agent-native, Merkle-DAG medical substrate with deterministic retrieval. Direction aligned with pi-chart's thesis; specifics unverified in this synthesis. **Action:** independent review of the repo before any pattern adoption. Do not block any Tier 1 work on it.

---

## 13. One architectural claim (closing)

pi-chart v0.3 grows by one primitive (`contradicts`), five optional envelope fields (`profile`, `transform`, `logical_id`, `fingerprint`, `prev_hash`; plus denormalized `invalidated_at`), one governance directory (`profiles/`), and three subtype-plus-profile patterns (attestation, suppression, incident snapshots). Eleven new validator rules. One renamed link. No new event types. No breaking schema changes for v0.2 events. No runtime dependencies added.

The sixth link converts routine clinical disagreement from an awkward silence into first-class, surfaceable, resolvable data. The profiles registry converts every future "should we add a primitive?" pressure into "write a profile." Together they make the substrate capable of carrying ICU-granularity reality without losing its shape.

> **A chart is one stream of claims. Profiles govern what those claims mean. Links capture how they relate. Views answer what is true at a moment. Hashes keep them honest.** The thesis from DESIGN §1 is intact.
