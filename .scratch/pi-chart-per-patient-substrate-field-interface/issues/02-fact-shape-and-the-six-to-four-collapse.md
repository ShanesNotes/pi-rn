# `factShape` and the 6→4 collapse decision

Status: completed
Type: AFK (SPEC artifact — field-definition doc, not source edit)
Reconciliation posture: `revise`
PRD user stories covered: 6, 7 (supports 1, 8, 30)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§Solution 2.B; Implementation Decision: "The 6→4 shape collapse is decided here once").

This issue is the **first link of the `type → shape → predicate → object` chain** owned by issues 02/03/04. The shape decided here is the single fact attribute that every `predicateId` (issue 03) must agree with (`PredicateDefinition.shape == factShape`, else kernel `ShapeMismatch`), and the shape that bounds which typed `object` (issue 04) is admissible. Read all three together; do not let any one re-decide the collapse.

## Reconciliation posture: `revise`

The PRD does **not** adopt the current 9-member `EventType` union as-is, nor reject it. It **revises** it: the 9 source types survive as a chart-internal authoring axis, but each fact gains an **explicit, kernel-aligned `factShape`** drawn from the kernel's frozen four (`context | observation | interpretation | act`). The collapse is many-to-four and lossy *as a category axis* — which is why `subtype`/`predicateId` (issue 03) carry the finer distinction. The two members with **no native kernel shape** (`communication`, `artifact_ref`) are the chief semantic decision and are resolved here once, per the PRD, so no view re-decides them silently.

## What to specify

Define a new first-class field, `factShape`, on the charted-clinical-fact contract: exactly one of the four kernel shapes, declared per fact, equal to the registered predicate's declared shape. It replaces the implicit "the view infers a shape from `type`" behavior. `type` (the current `ClinicalType | StructuralType`) is retained **only** as a fixture/export authoring axis (ADR 018 point 4); `factShape` is the contract value and the kernel-Claim `shape` source.

### Field spec

| Attribute | Value |
| --- | --- |
| Field name | `factShape` |
| JSON type | `String` enum: `"context" | "observation" | "interpretation" | "act"` |
| Cardinality | exactly one, required on every charted-clinical-fact (envelope, vital, note) |
| Canonical-memory role | Kernel-aligned category axis; the single attribute that gates which kernel shape the fact projects to |
| Clinician-facing label(s) | none directly — `factShape` is substrate language. It feeds concrete labels (Problem/Assessment → interpretation; Order/Plan/Action → act; vital sign/exam/lab → observation; patient banner/encounter/code-status → context) via `predicateId` (issue 03) |
| Current pi-chart representation | implicit: derived ad-hoc from `EventEnvelope.type` / `VitalSample` rows / `NoteFrontmatter.type:"communication"`; never named |
| Kernel-Claim target | **`shape`** (exactly one of `context|observation|interpretation|act`). Kernel rejects with `ShapeMismatch` if `shape != PredicateDefinition.shape` (see `predicates::PredicateRegistry::validate_validated_claim`, ledger-core public interface). |

## The exhaustive 6→4 collapse table (no unmapped case)

All 9 source `EventType` members (`ClinicalType` ×6 + `StructuralType` ×3) map as follows. This is the authoritative table; issue 03 keys every `predicateId` off the same rows.

| # | Source `type` | Kind | → `factShape` | Rationale (per PRD §2.B / Impl. Decision) |
| --- | --- | --- | --- | --- |
| 1 | `observation` | clinical | `observation` | Direct: a recorded clinical observation (vital, exam finding, lab result, intake/output). |
| 2 | `assessment` | clinical | `interpretation` | Direct: a clinician/agent interpretation of observations (problem, impression, trend, working diagnosis). |
| 3 | `intent` | clinical | `act` | Orders/plans/goals are speech-acts that direct future care. |
| 4 | `action` | clinical | `act` | A performed act (administration, specimen collection, intervention, review). |
| 5 | `communication` | clinical | **`act`** *(orderable)* / `context` *(otherwise)* | **Resolved below.** No native kernel shape; orderable communications are acts; narrative/report communications are context. Discrete findings mentioned in them become separate observation facts. |
| 6 | `artifact_ref` | clinical | **no substrate shape — resolves to `evidence`/`source` ref, not a fact** | **Resolved below.** Report visuals/documents are evidence, not substrate (ADR 018 pts 5–7; accepted "report visuals as evidence not substrate"). |
| 7 | `subject` | structural | `context` | Patient-level standing fact (banner identity, demographics). |
| 8 | `encounter` | structural | `context` | Encounter-level standing fact (current visit, admission/transfer context). |
| 9 | `constraint_set` | structural | `context` | Allergies, code status, access constraints, preferences — standing patient constraints. |

No source type is left unmapped. Five map directly (1,2,3,4 by kind; 7,8,9 to `context`); two require the explicit resolutions below.

### Sub-case — `observation + subtype=context_segment` (the `observation.context_segment` predicate)

Row 1 maps `type=observation` to `factShape=observation` generically. The narrative context-axis subtype `context_segment` remains an observation-shaped charted clinical fact, but its predicate is renamed to `observation.context_segment`. This preserves the existing observation-type authoring path while removing the old namespace-vs-shape mismatch created by `context.segment` carrying `shape=observation`. Issues 03/04 inherit this choice; they must not carry an independent `†`/OQ-2 for this seam.

## Resolution A — `communication` (assigned a shape; never "no shape")

Per the PRD Implementation Decision, `communication` **must be assigned a shape**; it is never dropped and never silently shape-defaulted per view. The shape is chosen from the communication subtype's clinical force:

| Communication subtype (observed in corpus) | → `factShape` | Why |
| --- | --- | --- |
| `verbal_order`, `telephone_order` | `act` | Orderable communications carry the force of an order (a speech-act directing care) until co-signed; same shape as `intent`. |
| `readback`, `co_sign`, `attestation` of an order | `act` | Confirms/ratifies an orderable act. Review/attestation is modeled as a separate append-only `act` fact, not a mutation of the target (Issue 10). |
| `sbar`, `handoff`, `consult_note`, `discharge_summary`, `ed_provider_note`, `ed_triage_note`, `outpatient_visit_note`, `advance_care_planning`, `notification`, `family_update`, `message`, `call` | `context` | Narrative/communication context that orients care without being an observation or an act. |
| `radiology_report`, `echo_report`, `lab_report`-as-narrative (the *interpretation* text, e.g. an impression) | `context` for the communication/narrative itself; separate `observation` facts for discrete findings | A report/note can mention clinical facts in passing, but the communication remains source/context. A discrete observation such as EF comes from the ordered diagnostic result and cardiologist/lab read as its own observation fact, with the report/note/artifact as evidence (Resolution B). |

**Default when subtype is unknown/missing:** `context` (the safe, non-actionable, non-asserting shape). A communication never defaults to `act` or directly to `observation`; order force requires an explicit orderable subtype, and discrete clinical findings are extracted/represented as separate observation facts with source/evidence links.

## Resolution B — `artifact_ref` and report-visual content (evidence, not substrate)

Per the accepted "report visuals as evidence not substrate" stance and ADR 018 pts 5–7, **`artifact_ref` does not produce a charted-clinical-fact / Claim at all.** It resolves to an **`EvidenceRef`** (issue 07's unified evidence edge) carried by whatever fact cites it:

- A Corewell report image, a rendered PDF, a screenshot, a scanned external record, an imaging file → `EvidenceRef{ kind: "artifact", ref, role: "primary"|"confirmatory" }` attached to the observation/interpretation fact it supports.
- The corpus report-type families (`lab_report`, `imaging_report`, `microbiology_report`, `lab_trajectory`, `immunization_record`, `derived_*_snapshot`) are **report visuals/derived snapshots**: their *discrete findings* are charted as `observation` facts (issue 03 predicates) and the *rendered artifact* rides as an `EvidenceRef`. The visual itself never becomes substrate.
- Therefore `artifact_ref` has **no `factShape`** and **no `predicateId`** and **no kernel Claim**. It is the one source `type` that exits the fact pipeline into the evidence pipeline.

This keeps a single rule ("a report visual is evidence for a fact, not a fact") rather than per-view artifact handling.

## Scale posture (architect mandate 2026-05-29)

- `factShape` is the **shardable category coordinate**: routing/fan-out of high-volume concurrent writes can partition on `(subject.patientId, factShape)` without reading payload. Keeping shape explicit (not view-inferred) is what makes that routing safe at multi-provider, multi-agent volume.
- The 6→4 collapse must hold across **many providers and many authoring agents**: because `factShape` is declared per fact (not derived from the authoring tool), two agents asserting the same clinical content via different `type` authoring paths still land on the same shape — a prerequisite for correction-by-new-fact across actors (issues 03/10).
- The resolution rules (A/B) are **subtype-driven, not actor-driven**, so a new provider/specialty introducing new communication subtypes inherits the default-`context` safety without a code change.

## Kernel-mapping note

- `factShape` → kernel `Claim.shape` (frozen four). The kernel is **not widened** to admit a fifth shape for `communication` or `artifact_ref`; instead the chart bends to the four (PRD §4, Impl. Decision "kernel is not widened").
- `factShape` **must equal** the mapped predicate's declared `shape` (issue 03), or admission fails `ShapeMismatch`.
- `artifact_ref` produces **no Claim** — it maps to the kernel only indirectly, as `EvidenceRef` content inside another Claim's `object`/provenance (issue 07). It is explicitly **not** a kernel shape.
- This issue maps only the shape axis; the predicate (issue 03) and typed `object` (issue 04) complete the mapping to a full admissible Claim.

## Acceptance checks

- [ ] `factShape` is named as a first-class field with JSON-type enum of exactly the four kernel shapes, required on envelope/vital/note facts.
- [ ] The exhaustive table maps all 9 source `EventType` members with **no unmapped case**.
- [ ] `communication` is **assigned a shape** with explicit subtype→shape rules and a safe `context` default; orderable communications → `act`.
- [ ] `artifact_ref`/report-visual content is resolved to **evidence (`EvidenceRef`), not substrate** — no `factShape`, no predicate, no Claim.
- [ ] States `factShape == PredicateDefinition.shape` is required (kernel `ShapeMismatch`) and cites the ledger-core public interface.
- [ ] States the kernel is not widened (chart bends to the four).
- [ ] Carries the scale posture: shape is the shardable coordinate; collapse holds across many providers/agents; resolutions are subtype-driven not actor-driven.

## Open questions for the architect

1. **RESOLVED — report-with-finding shape:** keep the communication/narrative as `context`; represent each discrete measured finding as a separate `observation` fact. Example: an echo report mention of "EF 30%" is evidence/source context; the authoritative EF observation comes from the ordered echocardiogram and cardiologist read. Narrative notes may mention clinical facts in passing with marginal evidentiary weight, but those mentions do not themselves become the documentation authority for the fact.
2. **RESOLVED — co-sign/attestation shape:** order co-sign/readback and Reviewed/Verified/Signed/Co-signed are separate append-only review/attestation facts with `factShape=act`. They are accountable clinical actions, not mutable fields on the target and not diagnosis/certainty interpretations. Issues 03/04/10 inherit this review-axis choice.
3. **Structural `subject`/`encounter` as one `context` shape vs distinct predicates:** all three structural types collapse to `context`; the distinction survives only in `predicateId` (issue 03). Confirm the architect wants no shape-level distinction among them (assumed yes per PRD).
4. **RESOLVED — `context_segment` shape/name:** keep `factShape=observation` and rename the predicate `context.segment → observation.context_segment`. Rationale: lighter migration, no reclassification of existing observation rows, and predicate namespace now matches the kernel shape expected by the registry. Issues 03/04 inherit this resolved choice.

## Blocked by

None — can start immediately. Issues 03 and 04 depend on this table.

## Boundary register

- SPEC artifact only: no `pi-chart/src/` edits, no fixture migration.
- No kernel widening; accepted clinical-truth-service/access north star only; no storage/backend-framework/vector/OpenBrain/retrieval/runtime/full-access-plane selection; no hidden `pi-sim` coupling.
- Connectors over this substrate stay `(patientId, encounterId, asOf)`-parameterized and never hardcode a patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).
- Where a downstream slice depends on the shared clinical-truth service hosting this at scale, that is the **accepted north star, ADR-promoted** runtime (`.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, accepted north star; ADR-promoted); this shape spec is transport-agnostic and does not assume it.
