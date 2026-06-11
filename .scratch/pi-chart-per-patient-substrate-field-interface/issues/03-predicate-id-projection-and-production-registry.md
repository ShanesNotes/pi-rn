# `predicateId` projection + production `PredicateRegistry` prerequisite

Status: completed
Type: AFK (SPEC artifact — field-definition doc, not source edit)
Reconciliation posture: `revise`
PRD user stories covered: 8, 27 (supports 1, 6, 9, 30)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§Solution 2.B `predicateId`; Impl. Decision: "`predicateId` is a deterministic projection of `(type, subtype)`… a production `PredicateRegistry` must be authored").

This is the **second link of the `type → shape → predicate → object` chain** (issues 02/03/04). Every row here:
- consumes a `factShape` from **issue 02's collapse table** — the predicate's declared `shape` **must equal** that `factShape` (kernel `ShapeMismatch` otherwise);
- declares the `predicateId` whose typed `RequiredFields` **issue 04** enumerates as the `object`.
Keep the three tables row-aligned.

## Reconciliation posture: `revise`

The current model makes `subtype` the load-bearing category axis but gives it **no enum** — a wrong/missing `subtype` silently drops a fact from its clinical axis (PRD Problem Statement). The PRD **revises** this: a registered **`predicateId`** becomes the load-bearing axis, computed as a *deterministic projection of `(type, subtype)`*. `subtype` survives as a chart-internal sub-axis (fixture/export, ADR 018 pt 4) but is no longer the silent gate. We neither adopt the untyped `subtype` nor reject the `(type, subtype)` corpus — we project it onto a typed predicate namespace.

## What to specify

1. A new first-class field `predicateId: String` on every charted-clinical-fact (a registered predicate id, dotted-namespace form `domain.name`).
2. The **deterministic `(type, subtype) → predicateId` projection table** below.
3. The rule that each predicate's **declared `shape` equals the `factShape`** issue 02 assigns to that `(type, subtype)`.
4. The **production `PredicateRegistry` prerequisite**: the kernel ships only `predicates::phase1_registry` (fixtures-only; "Production Adapters should load their own registry definitions" — ledger-core public interface). pi-chart must author/own a production registry whose definitions match this table. This is named as a prerequisite, **not built here**.

### Field spec

| Attribute | Value |
| --- | --- |
| Field name | `predicateId` |
| JSON type | `String` (registered predicate id, e.g. `vital.sign`, `assessment.problem`) |
| Cardinality | exactly one, required on every fact that produces a Claim (i.e. all except `artifact_ref`, which is evidence per issue 02) |
| Canonical-memory role | The typed category axis; gate for predicate-policy admission and the key for the typed `object` contract (issue 04) |
| Clinician-facing label(s) | none directly; predicates resolve to concrete labels (Order/Plan/Goal, Problem/Assessment, vital sign/lab/exam) |
| Current pi-chart representation | untyped `subtype?: string` magic string (no enum), gated ad-hoc in views |
| Kernel-Claim target | **`predicate`** — must be a **registered** id whose `PredicateDefinition.shape == Claim.shape` and whose typed `RequiredFields` the kernel enforces via `validate_object` (ledger-core public interface; `predicates::PredicateDefinition`, `PredicateRegistry::validate_validated_claim`). |

## The `(type, subtype) → predicateId` projection table

Derived from the real corpus (`patients/patient_002` + the 9-type union). `shape` column **must** equal issue 02's `factShape` for that source `type`. The `object` for each predicate is specified in **issue 04** (column "object spec → issue 04").

| Source `type` | `subtype` | → `predicateId` | declared `shape` (= issue 02 `factShape`) | object spec |
| --- | --- | --- | --- | --- |
| `observation` | `vital_sign` | `vital.sign` | `observation` | issue 04 |
| `observation` | `lab_result` | `lab.result` | `observation` | issue 04 |
| `observation` | `exam_finding` | `exam.finding` | `observation` | issue 04 |
| `observation` | `intake_output` | `io.measurement` | `observation` | issue 04 |
| `observation` | `context_segment` | `observation.context_segment` | `observation` | issue 04 |
| `assessment` | `problem` | `assessment.problem` | `interpretation` | issue 04 |
| `assessment` | `impression` | `assessment.impression` | `interpretation` | issue 04 |
| `assessment` | `trend` | `assessment.trend` | `interpretation` | issue 04 |
| `intent` | `order` / `medication_order` | `order.request` | `act` | issue 04 |
| `intent` | `care_plan` | `plan.care` | `act` | issue 04 |
| `intent` | `monitoring_plan` | `plan.monitoring` | `act` | issue 04 |
| `intent` | `discharge` / `icu_transfer` / `transfer` | `order.disposition` | `act` | issue 04 |
| `action` | `medication_administration` | `act.medication_administration` | `act` | issue 04 |
| `action` | `specimen_collection` | `act.specimen_collection` | `act` | issue 04 |
| `action` | `imaging_acquired` | `act.imaging_acquired` | `act` | issue 04 |
| `action` | `intervention` | `act.intervention` | `act` | issue 04 |
| `action` | `provider_evaluation` | `act.evaluation` | `act` | issue 04 |
| `action` | `pharmacy_verification` | `act.pharmacy_verification` | `act` | issue 04 |
| `action` | `result_review` | `review.reviewed` / `review.verified` | `act` | issue 10 / issue 04 object fields |
| `action` | `transfer_performed` | `act.transfer` | `act` | issue 04 |
| `communication` | `verbal_order` / `telephone_order` | `order.verbal` | `act` (issue 02 Res. A) | issue 04 |
| `communication` | `readback` / `co_sign` | `attestation.readback` / `attestation.cosigned` | `act` (issue 02 + issue 10) | issue 10 / issue 04 object fields |
| `communication` | `sbar` / `handoff` / `consult_note` / `discharge_summary` / `*_note` / `advance_care_planning` / `notification` / `message` / `call` / `family_update` | `comm.note` | `context` (issue 02 Res. A default) | issue 04 |
| `communication` | `radiology_report` / `echo_report` (mentions or contains a finding) | communication stays `comm.note`/context; discrete findings become separate observation predicates owned by the registry (for example existing lab/exam observations or a future diagnostic-measurement predicate if Issue 03 adds one) | context for the communication; observation for extracted finding facts | issue 04 / registry decision |
| `subject` | (any) | `context.patient` | `context` | issue 04 |
| `encounter` | (any) | `context.encounter` | `context` | issue 04 |
| `constraint_set` | `allergy` | `constraint.allergy` | `context` | issue 04 |
| `constraint_set` | `code_status` | `constraint.code_status` | `context` | issue 04 |
| `constraint_set` | `access` / `preference` / `advance_directive` | `constraint.care` | `context` | issue 04 |
| `artifact_ref` | (any) | **— none —** (evidence, not a fact; issue 02 Res. B) | n/a | n/a (→ `EvidenceRef`, issue 07) |

† `observation + context_segment` was resolved by Issue 02: keep `factShape=observation` and use `observation.context_segment` so predicate namespace and shape agree.
‡ `result_review`/`co_sign`/`attestation` are **separate review/attestation facts** with `factShape=act` (Issue 10). Their predicate ids are standardized as `review.reviewed`, `review.verified`, `attestation.signed`, `attestation.cosigned`, and `attestation.readback`; each must be registered as act-shaped, not target mutation fields.

### Determinism & default rules

- The projection is a **pure function** `predicateOf(type, subtype) → predicateId`. Same `(type, subtype)` always yields the same `predicateId` regardless of authoring actor/provider/agent — required for cross-actor correction (issue 10) at scale.
- **Unknown `subtype` for a known `type`:** project to a `type`-level catch-all predicate (`observation.generic`, `assessment.generic`, `act.generic`, `context.generic`) whose declared shape equals the type's `factShape`. This guarantees totality: no `(type, subtype)` is unmappable, so a wrong/missing `subtype` no longer drops the fact from its axis — it lands on the generic predicate of the correct shape and surfaces as `Needs review` (review-state projection), never silently dropped.
- **Unknown `type`:** rejected at the contract boundary (cannot pick a shape); not projected to a Claim.

## Production `PredicateRegistry` prerequisite

Per the ledger-core public interface, `predicates::phase1_registry` "Covers generated kernel fixtures only… Production Adapters should load their own registry definitions." Therefore:

- pi-chart must author a **production `PredicateRegistry`** whose `PredicateDefinition`s are exactly the `predicateId`s in the table above, each declaring (a) its `shape` (= issue 02 `factShape`) and (b) its typed `RequiredFields` (= issue 04 object spec).
- This registry is the **policy gate**: `PredicateRegistry::validate_validated_claim` rejects an unregistered predicate or a `shape`/`object` mismatch. Without it, no chart fact is append-admissible.
- **Named as a prerequisite, not built here** (PRD Impl. Decision; Out of Scope: "authoring the production `PredicateRegistry` (named as prerequisite, not built here)"). This issue delivers the *table the registry must encode*, not the registry.

## Scale posture (architect mandate 2026-05-29)

- **Registry must admit many predicates across providers and specialties.** The dotted-namespace form (`domain.name`) is chosen so new specialties add predicates under new domains (`cardiology.*`, `renal.*`) without colliding — the registry is an open, growable namespace, not a fixed enum. The table above is the v0 seed, not the closed set.
- **Deterministic projection is concurrency-safe:** because `predicateOf` is pure and actor-independent, many concurrent authoring agents projecting the same clinical content converge on the same `predicateId` — so a later correction fact (issue 10) can target it by the same key regardless of which agent/provider authored the original.
- **Sharding:** `predicateId` (with `factShape` and `subject.patientId`) is a routing coordinate for high-volume fan-out; predicate policy stays outside append storage (ledger-core: "Predicate policy stays outside Append ledger storage"), so the registry can be replicated/cached at each writer without serializing through the log.
- Where the production registry is loaded by the shared clinical-truth service rather than embedded per client, that is the **accepted north star, ADR-promoted** runtime (`.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, accepted north star; ADR-promoted). This table is transport-agnostic.

## Kernel-mapping note

- `predicateId` → kernel `Claim.predicate`. Must be **registered** and its `PredicateDefinition.shape` **must equal** `Claim.shape` (= issue 02 `factShape`) → else `ShapeMismatch`.
- The kernel enforces the predicate's typed `RequiredFields` against `Claim.object` via `validate_object` (`MissingObjectField`/`InvalidObjectField`) — those fields are specified in **issue 04**.
- Kernel is **not widened**: pi-chart authors its own registry definitions; it does not ask the kernel to add predicates.
- `artifact_ref` rows produce no predicate and no Claim (issue 02 Res. B).

## Acceptance checks

- [ ] `predicateId` named as a first-class `String` field replacing untyped `subtype` as the category axis.
- [ ] An exhaustive `(type, subtype) → predicateId` table including **`observation + vital_sign → vital.sign`**, covering every corpus `(type, subtype)` pair plus catch-all rules.
- [ ] Each predicate's declared `shape` column **equals** issue 02's `factShape` for that `(type, subtype)` (row-aligned across issues 02/03/04).
- [ ] Totality rule stated: unknown-`subtype` projects to a same-shape generic predicate (no silent axis-drop), surfacing as `Needs review`.
- [ ] The production `PredicateRegistry` is named as a prerequisite, with the kernel `phase1_registry`-is-fixtures-only citation, and explicitly **not built here**.
- [ ] Scale posture present: open dotted namespace; deterministic actor-independent projection; predicate policy shardable outside append storage.
- [ ] Kernel-not-widened stated.

## Open questions for the architect

1. **RESOLVED (from issue 02):** a finding-bearing report/note communication remains context/source narrative; discrete findings become separate `observation` facts with evidence/source links to the ordered report/read. Passing mentions in notes are evidentiary context, not documentation authority for the fact.
2. **RESOLVED:** `observation + context_segment` uses `factShape=observation` and predicate `observation.context_segment`, inheriting Issue 02's decision.
3. **RESOLVED:** `result_review` / `co_sign` / `readback` / `attestation` are separate review/attestation facts per Issue 10, with `factShape=act`. Predicate-id spelling is standardized here: `review.reviewed`, `review.verified`, `attestation.signed`, `attestation.cosigned`, and `attestation.readback`.
4. **OQ-4 (registry ownership at scale):** does the production registry live in pi-chart and ship to the service, or is it authored against the service contract and owned service-side? Depends on the accepted clinical-truth-service north star; exact registry ownership remains a service/adapter sub-decision. Surfaced, not decided.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/02-fact-shape-and-the-six-to-four-collapse.md` (provides the `factShape` each predicate's declared shape must equal).

## Boundary register

- SPEC artifact only: no `pi-chart/src/` edits, no fixture migration, **no building the registry**.
- No kernel widening; accepted clinical-truth-service/access north star only; no storage/backend-framework/vector/OpenBrain/retrieval/runtime/full-access-plane selection; no hidden `pi-sim` coupling.
- Connectors stay `(patientId, encounterId, asOf)`-parameterized and never hardcode a patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).
