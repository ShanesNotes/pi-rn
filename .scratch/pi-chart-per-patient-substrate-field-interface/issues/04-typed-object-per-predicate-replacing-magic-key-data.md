# Typed `object` per predicate (replace magic-key `data`)

Status: ready-for-human
Type: AFK (SPEC artifact — field-definition doc, not source edit)
Reconciliation posture: `revise`
PRD user stories covered: 9 (supports 1, 8, 16, 30)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§Solution 2.C `object`; Impl. Decision: "payload (`object`, typed per predicate)").

This is the **third and final link of the `type → shape → predicate → object` chain** (issues 02/03/04). Every typed `object` here is keyed by a `predicateId` from **issue 03**, whose declared `shape` equals the `factShape` from **issue 02**. The typed fields below are what the kernel's `validate_object` enforces as the predicate's `RequiredFields`. Keep all three row-aligned.

## Reconciliation posture: `revise`

The actual clinical fact today lives in `data: Record<string, unknown>` — a schema-less bag mined by ~20 ad-hoc magic keys with **no required-key contract per `(type, subtype)`** (PRD Problem Statement). We **revise**: each predicate gets a **typed `object`** with named `RequiredFields` (name/JSON-type). We do not reject the loose `data` bag — it is **retained inside the fixture/export format** (ADR 018 pt 4) — but the **field contract** is the typed object, and every contract field must round-trip to/from `data.*` (issue 13). No magic key remains load-bearing-yet-untyped: each is **accounted-for** (promoted to a typed object field) or **explicitly deferred** below.

## What to specify

1. A first-class `object: Object` field per fact (the kernel `Claim.object`), whose admissible keys are fixed by the fact's `predicateId`.
2. Per-predicate `RequiredFields` (name + JSON type) and optional fields, replacing the `data.*` keys.
3. A **disposition row for every current `data.*` consumer key** (accounted-for or deferred — no silent dead key).

### Field spec (envelope)

| Attribute | Value |
| --- | --- |
| Field name | `object` |
| JSON type | `Object` whose keys are the predicate's declared `RequiredFields` (+ declared optionals) |
| Cardinality | exactly one per fact producing a Claim (all except `artifact_ref`) |
| Canonical-memory role | The clinical content payload, typed per predicate |
| Current pi-chart representation | `data?: Record<string, unknown>` (loose; ~20 magic keys) |
| Kernel-Claim target | **`object`** — kernel `validate_object` enforces the predicate's typed `RequiredFields`: `MissingObjectField` if a required key absent, `InvalidObjectField` if wrong JSON type (ledger-core public interface; `predicates::PredicateDefinition`). |

**Cross-cutting (per PRD, do not re-decide):** `encounterId` is **not** in `subject`; it is a predicate `RequiredField` in `object` (`object.encounterId: String`) — per the PRD Impl. Decision ("`encounterId` maps to kernel `object.encounterId:string`"; issue 01). Every clinical/structural predicate below therefore additionally requires `encounterId: String` (or declares cross-encounter status explicitly). Identity/time/actor/source/integrity are **not** object fields — they are top-level Claim fields owned by issues 01/05/06/07/08/09. The `object` carries only clinical content.

## Per-predicate typed `object` (RequiredFields)

Keyed by issue 03's `predicateId` (shape = issue 02 `factShape`). `R` = required, `O` = optional. JSON types: `String`/`Number`/`Boolean`/`Object`/`Array`.

| `predicateId` (shape) | RequiredFields (name : JSON-type) | Optional fields | Replaces `data.*` |
| --- | --- | --- | --- |
| `vital.sign` (obs) | `code:String`, `value:Number`, `unit:String`, `encounterId:String` | `quality:String`, `profile:String` | `data.name`→`code`, `data.value`, `data.unit` (+ `VitalSample.name/value/unit`) |
| `lab.result` (obs) | `code:String`, `value:(Number\|String)`, `unit:String`, `encounterId:String` | `resulted_at:String`, `reference_range:String`, `finding_state:String` | `data.name`, `data.value`, `data.unit`, `data.resulted_at` |
| `exam.finding` (obs) | `code:String`, `finding_state:String`, `encounterId:String` | `description:String`, `value:String` | `data.name`, `data.finding_state`, `data.description` |
| `io.measurement` (obs) | `code:String`, `value:Number`, `unit:String`, `encounterId:String` | `direction:String` | `data.name`, `data.value`, `data.unit` |
| `context.segment` (obs†) | `segment_type:String`, `summary:String`, `encounterId:String` | — | `data.segment_type`, `data.summary` |
| `assessment.problem` (interp) | `name:String`, `encounterId:String` | `summary:String`, `differential:Array`, `uncertainty:String`, `status_detail:String` | `data.name`, `data.summary`, `data.differential`, `data.uncertainty`, `data.status_detail` |
| `assessment.impression` (interp) | `impression:String`, `encounterId:String` | `summary:String`, `differential:Array`, `rationale:String`, `limitations:String` | `data.impression`, `data.summary`, `data.differential`, `data.rationale`, `data.limitations` |
| `assessment.trend` (interp) | `metric:String`, `summary:String`, `encounterId:String` | `direction:String`, `basis:String` | `data.summary`, `data.basis` |
| `order.request` / `order.verbal` (act) | `name:String`, `encounterId:String` | `goal:String`, `due_by:String`, `rationale:String`, `on_behalf_of:String`, `status_detail:String` | `data.name`, `data.goal`, `data.due_by`, `data.rationale`, `data.on_behalf_of`, `data.status_detail` |
| `plan.care` (act) | `goal:String`, `encounterId:String` | `summary:String`, `rationale:String` | `data.goal`, `data.summary`, `data.rationale` |
| `plan.monitoring` (act) | `metric:String`, `required_cadence:String`, `encounterId:String` | `goal:String`, `basis:String` | `data.required_cadence` (+ `metric`/`metrics`), `data.goal`, `data.basis` |
| `order.disposition` (act) | `name:String`, `encounterId:String` | `due_by:String`, `rationale:String` | `data.name`, `data.due_by`, `data.rationale` |
| `act.medication_administration` (act) | `name:String`, `encounterId:String` | `value:Number`, `unit:String`, `outcome:String`, `status_detail:String`, `on_behalf_of:String` | `data.name`, `data.value`, `data.unit`, `data.outcome`, `data.status_detail`, `data.on_behalf_of` |
| `act.specimen_collection` / `act.imaging_acquired` / `act.intervention` / `act.evaluation` / `act.pharmacy_verification` / `act.transfer` (act) | `action:String`, `encounterId:String` | `outcome:String`, `status_detail:String`, `note_ref:String` | `data.action`, `data.outcome`, `data.status_detail`, `data.note_ref` |
| `review.result` / `comm.cosign` (act‡) | `action:String`, `encounterId:String` | `attests_to:Array`, `attestation_role:String`, `review:Object`, `reviewed_refs:Array`, `verified_at:String`, `closes:Array` | `data.action`, `data.attests_to`, `data.attestation_role`, `data.review`, `data.reviewed_refs`, `data.verified_at`, `data.closes` |
| `comm.note` (context) | `summary:String`, `encounterId:String` | `audience:String`, `note_ref:String` | `data.summary`, `data.audience`, `data.note_ref` |
| `context.patient` (context) | `name:String` | `description:String` | `data.name` (subject demographics) |
| `context.encounter` (context) | `encounterId:String` | `summary:String` | (encounter metadata) |
| `constraint.allergy` (context) | `substance:String`, `encounterId:String` | `reaction:String`, `severity:String`, `status_detail:String` | `ConstraintsBlock.allergies[*]`, `data.status_detail` |
| `constraint.code_status` (context) | `code_status:String`, `encounterId:String` | `rationale:String` | `ConstraintsBlock.code_status` |
| `constraint.care` (context) | `summary:String`, `encounterId:String` | `kind:String` | `ConstraintsBlock.preferences/access_constraints/advance_directive`, `data.kind` |
| generic catch-alls (`*.generic`) | `summary:String`, `encounterId:String` | (free `notes:String`) | fallback for unknown `subtype` (issue 03 totality) |
| `artifact_ref` | — **no object, no Claim** (evidence; issue 02 Res. B) | — | resolves to `EvidenceRef` (issue 07) |

† `context.segment` shape is OQ-2 (issue 03). ‡ `review.result`/`comm.cosign` may be review facts (issue 10, OQ-3).

## Every current `data.*` consumer key — accounted-for or deferred

Full disposition of the ~20+ magic keys observed in `src/` (no silent dead key):

| `data.*` key | Disposition | Target |
| --- | --- | --- |
| `data.name` | accounted | `object.code`/`object.name` per predicate |
| `data.value` / `data.unit` | accounted | `object.value` / `object.unit` |
| `data.summary` / `data.impression` / `data.goal` / `data.action` | accounted | predicate-specific object fields above |
| `data.segment_type` | accounted | `context.segment.segment_type` |
| `data.due_by` | accounted | `order.*.due_by` |
| `data.required_cadence` | accounted | `plan.monitoring.required_cadence` |
| `data.differential` / `data.uncertainty` / `data.limitations` / `data.rationale` / `data.rationale_text` | accounted | `assessment.*` fields; **`certainty` reconnection is issue 10** (these inform `certainty`, not duplicate it) |
| `data.resulted_at` / `data.verified_at` | accounted | `lab.result.resulted_at`; `verified_at` → **review fact** (issue 10), not raw object key |
| `data.finding_state` | accounted | `exam.finding.finding_state` (enum: present/absent/not_assessed) |
| `data.outcome` | accounted | `act.*.outcome` |
| `data.status_detail` | accounted | per-predicate optional `status_detail:String` (validator-gated today; stays typed per predicate) |
| `data.basis` | accounted | `assessment.trend.basis` / `plan.monitoring.basis` |
| `data.audience` | accounted | `comm.note.audience` |
| `data.on_behalf_of` | accounted | `order.*`/`act.medication_administration.on_behalf_of` |
| `data.note_ref` | accounted | `*.note_ref` (cross-ref to a note fact) |
| `data.attests_to` / `data.attestation_role` / `data.review` / `data.reviewed_refs` / `data.closes` | accounted-**pending issue 10** | `review.result`/`comm.cosign` object fields **or** review-fact fields (OQ-3); listed in both, final home = issue 10 |
| `data.origin` | **deferred** | provenance/source — issue 06 (`source`/`actor`), not a clinical object field |
| `data.path` | **deferred** | artifact/note file path — issue 07 (`EvidenceRef.ref`) / issue 13 (export crosswalk), not a Claim object field |
| `data.event` / `data.nested` | **deferred** | structural/back-compat wrappers — issue 13 round-trip, not promoted |
| `data.runtime_note` | **deferred — boundary** | runtime/sim annotation; must **not** become chart truth (Observable charting seam; no hidden `pi-sim` coupling) |
| `data.hidden_lung_fluid_ml` | **deferred — REJECT as substrate** | hidden simulator/oracle state; explicitly excluded (PRD Out of Scope: no hidden `pi-sim` coupling/oracle truth). Never a Claim object field. |
| `data.reference_expected_end_do_not_preload` | **deferred** | retrieval-hint metadata; out of scope (no retrieval-tech decision), not a clinical object field |
| `data.training_label` (`VitalSample`) | **deferred** | ML label; not chart truth, not a Claim object field |

## Scale posture (architect mandate 2026-05-29)

- **Typed `object` is what makes high-volume writes validatable cheaply:** `validate_object` is a per-fact check against a predicate definition — no cross-fact read — so it scales horizontally with concurrent writers; a schema-less `data` bag would force consumers to defensively re-parse every read.
- **Multi-provider field growth:** predicate objects grow by adding optional fields, never by mutating existing facts (append-only). A new specialty needing a new field adds it as an optional on a new/extended predicate in the registry (issue 03), so many providers can enrich the same predicate family without breaking prior facts.
- **Correction-by-new-fact:** because the object is typed and the predicate is deterministic, a correcting agent (issue 10) can emit a new fact with the same `predicateId` and a corrected `object` rather than mutating — safe under concurrent authorship.
- Where `validate_object` runs inside the shared clinical-truth service rather than client-side, that is the **proposed, not-yet-accepted** runtime (`.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, proposed). This object contract is transport-agnostic.

## Kernel-mapping note

- `object` → kernel `Claim.object`; the predicate's typed `RequiredFields` are enforced by `validate_object` (`MissingObjectField`/`InvalidObjectField`).
- `encounterId` is an **object** `RequiredField` (not subject) per the PRD — closing the wildcard-leak defect at the typed-payload level (issue 01 owns the scoping rule).
- Kernel **not widened**: pi-chart's registry (issue 03) declares these `RequiredFields`; the kernel only enforces them.
- The loose `data` bag survives only as fixture/export (ADR 018 pt 4); it is **not** the contract and must round-trip (issue 13).
- `artifact_ref` produces no object/Claim (issue 02 Res. B).

## Acceptance checks

- [ ] `object` named as a first-class typed field replacing schema-less `data`, mapped to kernel `Claim.object` with `validate_object` enforcement cited.
- [ ] Per-predicate `RequiredFields` table (name + JSON type), keyed by issue 03 `predicateId`, shape-aligned to issue 02 — including `vital.sign` requiring `code:String`, `value:Number`, `unit:String`.
- [ ] **Every** current `data.*` consumer key is in the disposition table as accounted-for or explicitly deferred (no silent dead key).
- [ ] `encounterId` shown as an `object` `RequiredField` (not subject), per the PRD.
- [ ] Hidden-sim/oracle keys (`hidden_lung_fluid_ml`, `runtime_note`) explicitly excluded from substrate; ML/retrieval-hint keys deferred.
- [ ] Scale posture present: per-fact `validate_object` scales with concurrent writers; growth by optional fields/append-only; correction-by-new-fact.
- [ ] Kernel-not-widened stated; loose `data` retained only as fixture/export (round-trip → issue 13).

## Open questions for the architect

1. **OQ-3 (shared with issues 03/10):** do `attests_to` / `attestation_role` / `review` / `reviewed_refs` / `verified_at` / `closes` live as `review.result`/`comm.cosign` **object fields**, or as fields of **separate review facts** (issue 10)? Listed in both pending the architect's review-axis decision; do not duplicate at implementation time.
2. **`status_detail` typing:** today `status_detail` is a validator-gated free string with per-`(type,subtype)` allowed values. Should each predicate declare an **enum** of allowed `status_detail` values in the registry (stronger typing) or keep it `String` with chart-side validation? Assumed `String` here; flagged for the architect.
3. **`code` coding system:** `vital.sign.code`/`lab.result.code` are typed `String` but no coding-system (LOINC/SNOMED) is mandated. Mandating a coding system is a larger ontology decision (PRD Out of Scope: no drug dictionary/ontology). Surfaced, not decided — assumed opaque `String` for now.
4. **`differential` element type:** `assessment.*.differential` is typed `Array`; element shape (free strings vs `{name, likelihood}` objects) is left open pending the certainty-surface reconnection (issue 10).

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/02-fact-shape-and-the-six-to-four-collapse.md` (shape per fact).
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md` (the `predicateId` each object is keyed to; the registry that declares these `RequiredFields`).

## Boundary register

- SPEC artifact only: no `pi-chart/src/` edits, no fixture migration.
- No kernel widening; no Rust↔TS integration-mechanism choice; no backend/vector/OpenBrain/retrieval/runtime/access-plane selection; no hidden `pi-sim` coupling (hidden-sim keys explicitly rejected as substrate).
- Connectors stay `(patientId, encounterId, asOf)`-parameterized and never hardcode a patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).
