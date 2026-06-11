# Projection-facing fields: authority, attention/risk, timing, access tier

Status: completed
Type: AFK / SPEC artifact (field-definition doc, not a source edit)
Reconciliation posture: adopt
PRD user stories covered: 22, 23 (and supports 5)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§2.G "Authority, attention, timing & access-tier — projection-facing fields"; Implementation Decisions, the projection-facing field group).

Deliverable: `field-specs/11-projection-facing-fields.md`

## What to build

A field-definition doc that names the **projection-facing** fields letting clinician surfaces derive the strategy PRD's workflow labels **without storing new truth**: care-item **authority posture**, **attention/clinical-risk** cue, nonpunitive **timing/workflow state**, and the **hot/warm/cold ACCESS/priority tier**. For each clinician label, state its source field(s) and whether the label is **derived** (computed from already-named substrate fields) or **must-be-explicit** (a fact must carry the value because it is not inferable).

This slice does not add new clinician copy — it traces the labels already named in `pi-chart/CONTEXT.md` and the clinician-facing terminology map back to the charted-clinical-fact fields defined in Issues 01-10. It adopts the PRD's posture; it does not re-decide any cross-cutting choice.

### Scaling posture (architect mandate 2026-05-29)

This is an agent-native workspace that must run in a hugely data-rich, multi-provider setting with many concurrent authoring agents. Every projection-facing field below is **derived per (patientId, encounterId, asOf)** so projections can shard/route by scope and rebuild deterministically at high volume. None of these fields is a mutable status flag on a fact — where a posture must be explicit, it is carried as the **content of a new append-only fact** (correction-by-new-fact), never an in-place edit, so concurrent authorship stays safe. Authority posture is computed from `predicateId`+`source`+`certainty`, which keeps **source (origin) vs actor (asserter) vs authority (posture)** separable even when many distinct providers and many distinct agents touch the same patient.

## Connector contract

Any connector or projection that reads these fields stays `(patientId, encounterId, asOf)`-parameterized and **never hardcodes a patient**. Demo target `patient_002`/`enc_p002_001`; modularity regression target `patient_001`.

```
deriveProjectionFacing(patientId, encounterId, asOf) -> { authority, attention, timing, accessTier } per fact
```

## Field group 1 — Authority posture (Care item authority label)

Authority answers "how must the clinician treat this?" It is **distinct from `source`** (origin): "Ordered" (source) is never read as "Required" (authority). Authority is **derived** from `predicateId` + `source` + `certainty`, except the `Suggested` posture, which is **explicit** (carried by the human-agent suggestion state — see Issue 12) and the `Watch/Handoff` posture, which is **explicit** when set as carry-forward (see Issue 14 Handoff View).

| Clinician authority label | Derivation source field(s) | Derived vs explicit | Notes |
| --- | --- | --- | --- |
| Required | `predicateId` (act/order-class predicate) + `source.kind` ∈ {`ordered`, `protocol`, `unit_policy`} (Issue 06 machine values, not display labels) | derived | Obligation posture; only orderable/sanctioned-source acts read as Required |
| Time-sensitive | authority=Required AND timing ∈ {Due now, Due soon} (see group 3) | derived | Required + timing pressure; not a separate stored value |
| Routine | `predicateId` (act predicate) + `source.kind` ∈ {`nursing_plan`, `chart_derived`} (Issue 06 machine values) with no timing pressure | derived | Standing/recurring work without acute pressure |
| Suggested | human-agent suggestion state = `Suggested` (Issue 12) | **explicit** | Pi-authored provisional fact; never an obligation until promoted |
| Info | `factShape`=observation/context AND no act/order predicate | derived | Awareness only; no action posture |
| Watch/Handoff | carry-forward fact OR `certainty` ∈ {Concern, Uncertain} flagged for next shift | **explicit when carry-forward** | Nonurgent continuity; see Handoff View (Issue 14) |

Kernel-mapping note: authority posture is **chart-internal — no direct kernel field**. It is a projection over `predicateId` (→ kernel `predicate`/`shape`), `source` (chart provenance, not a kernel field), and `certainty` (chart-internal). It must never be persisted as a kernel object field; the adapter maps the underlying `predicateId`/`shape`/`object`, and authority is recomputed view-side. This keeps the kernel unwidened (PRD §4).

## Field group 2 — Attention / clinical-risk cue (Attention cue label)

Attention answers "why is this surfaced with elevated relevance?" It is **derived** from `certainty` + `time` freshness + access tier + open-loop/contested state. `Safety flag` is reserved for safety-critical/current-risk posture and is the one cue that may be **explicit** when a fact asserts a safety constraint.

| Clinician attention label | Derivation source field(s) | Derived vs explicit | Notes |
| --- | --- | --- | --- |
| Needs attention | open-loop/overdue state (intent unfulfilled past due) OR `certainty`=Concern | derived | General elevated relevance |
| Review priority | review-state mismatch (Issue 10/14) OR freshness (`time.recorded_at` stale vs asOf) | derived | Prompts review, not action |
| Safety flag | `predicateId` safety-constraint class (e.g. allergy, code status) OR explicit safety assertion | **explicit when asserted** | Reserved for safety-critical/current-risk; never inferred from volume alone |
| Watch | carry-forward / nonurgent continuity (group 1 Watch/Handoff) | derived | Nonurgent; pairs with access tier = warm/cold |

Kernel-mapping note: attention cue is **chart-internal — no kernel field**. Inputs trace to `certainty` (chart-internal), `time` (→ kernel `time.valid`/`time.recorded_at`, canonical UTC), and lifecycle/contested state (`status`, `links.contradicts`). `Safety flag` content, when explicit, lives in the typed `object` of a constraint-class predicate (e.g. allergy/code-status) and maps through `object`, not through any new kernel field. Avoid `Alert` (interruptive alerting is out of scope).

## Field group 3 — Nonpunitive timing / workflow state (Care timing label)

Timing answers "when, and what is the current workflow posture?" It is **derived** from `time.valid` (due window) + open-loop/fulfillment state + lifecycle `status`, EXCEPT clinician-judgment states (`Deferred`, `Not appropriate now`, `Blocked`, `Waiting on...`, `Carry forward`) which are **explicit** — each is a clinician-authored fact recording judgment, never an inferred failure. Language stays nonpunitive: no `failed`, `noncompliant`, or `nurse-failed` framing; prefer `Delayed`/`Due now` over routine `overdue` blame.

| Clinician timing label | Derivation source field(s) | Derived vs explicit | Notes |
| --- | --- | --- | --- |
| Due now / Due soon | `time.valid` due window vs `asOf` | derived | Pressure within authority tier |
| Scheduled | `time.valid` future window | derived | Not yet due |
| Delayed | due window passed, no fulfillment fact, no judgment fact | derived | Nonpunitive; not "overdue" blame |
| Deferred (by clinician) | explicit clinician judgment fact | **explicit** | Preserves clinical judgment |
| Not appropriate now | explicit clinician judgment fact | **explicit** | Judgment, not failure; not "skip" |
| Waiting on... | explicit dependency fact (e.g. pharmacy) | **explicit** | Names the blocker |
| Blocked | explicit dependency fact | **explicit** | Clinician-owned reason |
| Held / Refused / Omitted | explicit med-state fact | **explicit** | Reserve Held for actual med/order hold |
| Given / Administered | fulfillment fact (`links.fulfills`) | derived | Given in quick view; Administered for MAR/chart |
| Carry forward | carry-forward fact (Issue 14 Handoff View) | **explicit** | Proposed until clinician finalizes |

Kernel-mapping note: timing state is **chart-internal — no kernel field**. Derived inputs trace to `time.valid` (→ kernel `time.valid`, instant XOR interval, canonical UTC) and fulfillment/lifecycle (`links.fulfills`, `status`). Explicit judgment/dependency states are **separate append-only facts** with their own `id`, `actor`, `time`, and `predicateId`; they map to the kernel as ordinary Claims (typically `act`/`context` shape) — never as a mutation of the target fact.

## Field group 4 — Hot/warm/cold ACCESS/priority tier (relevance section)

**Hot/warm/cold is an ACCESS/priority tier — a relevance ranking — NOT a storage, retrieval, vector, OpenBrain, or disease-course decision.** It says how relevant a fact is to current-care reasoning as of `asOf`; it does not choose where bytes live, how they are fetched, or whether a condition is acute/subacute/chronic (a chronic condition becomes hot when linked to current care).

| Access tier (internal) | Clinician relevance section | Derivation source field(s) | Derived vs explicit | Notes |
| --- | --- | --- | --- | --- |
| Hot | Current / acute care | `time` recency vs `asOf` + active `status` + attention/authority pressure + current-encounter scope | derived | Current, safety-relevant, immediate shift reasoning |
| Warm | Recent course | recent `time.valid` trajectory + review history + open loops | derived | Recent trends/plans/actions; supports review |
| Cold | Baseline / history | older `time.valid` / prior-encounter facts, no current-care link | derived | Background; does not become current truth without current relevance + source |

Kernel-mapping note: access tier is **chart-internal — no kernel field, and explicitly not a retrieval-technology choice** (PRD Out of Scope: "Choosing hot/warm/cold *retrieval* technology"). It is a deterministic ranking over `time` (→ kernel `time.*`), `status`, `encounterId` scope, and the attention/authority projections above. The adapter persists the underlying facts; the tier is recomputed view-side per `asOf`. At scale this ranking is the routing/prioritization signal a multi-agent reader uses to bound context — still a projection, never stored truth.

## Derived-vs-explicit summary (the load-bearing distinction)

- **Derived (recomputed per asOf, never stored):** Required, Time-sensitive, Routine, Info; Needs attention, Review priority, Watch; Due now/soon, Scheduled, Delayed, Given/Administered; all three access tiers.
- **Must-be-explicit (carried as the content of an append-only fact):** Suggested (Issue 12 suggestion state); Watch/Handoff carry-forward; Safety flag when asserted; Deferred, Not appropriate now, Waiting on..., Blocked, Held/Refused/Omitted (clinician judgment/dependency/med-state facts).

No projection-facing label mutates an existing fact. Explicit postures are new facts; derived postures are pure functions of named fields.

## Acceptance checks

- [ ] Names all four field groups: authority posture, attention/clinical-risk cue, nonpunitive timing/workflow state, hot/warm/cold access tier.
- [ ] Maps **each** clinician label to its source field(s) and marks it derived vs must-be-explicit.
- [ ] States authority is distinct from `source` ("Ordered" ≠ "Required").
- [ ] States hot/warm/cold is an **access/priority tier**, explicitly **not** storage, retrieval, vector, OpenBrain, or disease-course.
- [ ] Every explicit posture is specified as the content of a **new append-only fact**, never an in-place mutation (concurrency-safe at scale).
- [ ] Carries a kernel-mapping note per group; all four groups are chart-internal with no new kernel field (no kernel widening).
- [ ] Connector signature shown as `(patientId, encounterId, asOf)` with no hardcoded patient (demo `patient_002`, regression `patient_001`).
- [ ] Reconciliation posture (adopt) and `Status: ready-for-agent` present.

## Open questions (surface, do not answer)

- None blocking adoption. The PRD's open-question postures live in Issues 02/03/04/08/15; this slice adopts already-named labels and does not re-decide them.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicateId-projection-and-production-registry.md` (authority derives from `predicateId`)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/06-source-authorship-and-provenance-vocabulary.md` (authority derives from `source`; source≠authority)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-as-separate-facts.md` (attention/authority derive from `certainty`)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/12-human-agent-suggestion-state-on-the-substrate.md` (the explicit `Suggested` authority posture)
