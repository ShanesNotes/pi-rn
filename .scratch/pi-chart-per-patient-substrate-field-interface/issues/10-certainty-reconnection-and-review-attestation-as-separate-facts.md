# certainty reconnection + review/attestation as separate facts

Status: ready-for-human
Type: AFK
Reconciliation posture: revise
User stories covered: 20, 21 (supports 5, 24)
Slice: Issue 10 of the per-patient charted-clinical-fact substrate field contract

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`

PRD source-of-truth for cross-cutting choices (do not re-decide here): see PRD §2.F (`certainty`, **Review/attestation as separate facts**), and the Implementation Decisions: "`certainty` is reconnected to the uncertainty surface"; "Review/attestation (Reviewed/Verified/Signed/Co-signed) are **separate facts**, never mutations. Done (view-level) and Charted (sanctioned source) are never collapsed."

## Scaling posture (architect, 2026-05-29)

In a hugely data-rich, multi-provider setting, the **same fact will be reviewed, verified, and co-signed by many different clinicians and authoring agents over time**. Modeling review as a *mutation* of the target fact (a boolean `reviewed=true`) cannot represent that: it loses *who* reviewed, *when*, *against what evidence*, and it creates write contention on the target under concurrent reviewers. Modeling each review/attestation as **its own append-only charted clinical fact** (own `id`, `actor`, `time`, `evidence` linking the target) lets review facts from N distinct clinicians/agents **compose** without contention — the review-state label is then a *projection* over the set of review facts. This is the same append-only discipline as Issue 09: never mutate, always add a new fact. Multi-actor attribution stays first-class — **source** (origin), **actor** (asserter of the review), and **authority** (what kind of attestation: Reviewed vs Signed) stay separable per review fact.

## What to build

A SPEC artifact (field-definition doc, NOT a source edit) with two coupled reconnections (posture `revise`):

1. **Reconnect the typed `certainty` field to the uncertainty surface.** `certainty` is modeled and required on `ClinicalEvent` but consumed by **zero** views today; the actual uncertainty signal is read from ad-hoc `data.differential`/`data.uncertainty`. The spec wires `certainty` (and graded assessment certainty) so the clinician labels **Concern / Uncertain / Working diagnosis / Resolved** are a projection over a **named** field, and states **Pi may surface source-linked Concern/Uncertain but never upgrade to a diagnosis.**
2. **Model Reviewed / Verified / Signed / Co-signed as SEPARATE charted clinical facts**, each with its own `id`, `actor`, `time`, and `evidence` linking the reviewed fact — **never a mutation** of the target. The clinician-facing **review-state label** (Needs review / Source mismatch / May be outdated / Report only / Source needed) is a projection over these review facts plus freshness. **Done (view-level) and Charted (sanctioned source) are never collapsed.**

## A. `certainty` reconnection (field spec)

Current `Certainty` enum (`src/types.ts`): `observed | reported | inferred | planned | performed`. This is **epistemic modality** (how the fact came to be known), not graded clinical certainty. The clinician uncertainty vocabulary (CONTEXT.md, terminology map) is **Concern | Uncertain | Working diagnosis | Resolved** — a different axis. The spec reconnects both and states which drives which.

| Substrate field | Axis | Values | Drives clinician label | Kernel target | Posture |
| --- | --- | --- | --- | --- | --- |
| `certainty` (existing) | epistemic modality | `observed`/`reported`/`inferred`/`planned`/`performed` | informs source-trust + `predicateId`/`object` choice (e.g. `reported` → "Report only"; `inferred` → `[inferred]` tag; `performed` → an `act`) | **chart-internal — no direct kernel field**; it shapes which `predicateId`/`object`/`factShape` is chosen | revise (reconnect; was dead) |
| graded clinical certainty (the uncertainty surface) | clinical confidence on an assessment/problem | **Concern** < **Uncertain** < **Working diagnosis** < (resolved) | the **certainty/uncertainty label** on problems/assessments | chart-internal; expressed via `predicateId` (e.g. `assessment.concern` vs `assessment.working-diagnosis`) + typed `object` | revise |
| `data.differential` / `data.uncertainty` (today's de-facto signal) | ad-hoc payload keys | free-form | currently the *only* uncertainty signal | **deprecate as the signal**: fold into typed `object` of the graded-certainty predicate (see Issue 04) | revise |

### How certainty reconnects (the `revise`)

- `certainty` (epistemic modality) becomes a **consumed** field: the uncertainty/source-trust projection reads it instead of mining `data.*`. `reported` epistemics drive **Report only** / **From handoff**; `inferred` drives the `[inferred]` provenance tag (with Issue 06/07 transform/evidence); `observed`/`performed` drive trusted/charted posture.
- Graded clinical certainty (Concern/Uncertain/Working diagnosis) is expressed through the **assessment predicate + typed object** (Issue 03/04), NOT as a free `data.differential` bag. The label is then a deterministic projection: `predicateId` family + `object` confidence content → Concern | Uncertain | Working diagnosis.
- **Resolved** on this axis is the *uncertainty closing* — and it is the **same clinical close** as the **Resolved** lifecycle label in Issue 09, projected on the certainty axis rather than the lifecycle axis. The two issues must agree: a resolution fact (`links.resolves`, Issue 09) both closes the open loop (lifecycle) and collapses the uncertainty (certainty). Neither mutates the original assessment.
- **Pi boundary (hard):** Pi may author or surface a source-linked **Concern** or **Uncertain** fact, but **Pi never upgrades certainty to a Working diagnosis or a diagnosis.** Promotion across the certainty ladder toward a diagnosis is a clinician action (consistent with Issue 12 suggestion state and the terminology map: "Pi can surface source-linked concern/uncertainty, not upgrade to diagnosis").

## B. Review / attestation as separate facts (field spec)

Each review/attestation is its **own** charted clinical fact, never a field flipped on the target.

| Review fact | Clinician label | What it asserts | Required fields (own fact) | Authority | Posture |
| --- | --- | --- | --- | --- | --- |
| review:reviewed | **Reviewed** | a clinician looked at the target fact/view content | `id`, `actor`, `time`, `evidence`→target | lowest; not bedside-verified, not signed | revise |
| review:verified | **Verified** | bedside/source verification of the target (e.g. checked the monitor, the med, the bedside) | `id`, `actor`, `time`, `evidence`→target (+ source of verification) | higher; implies real-world check | revise |
| review:signed | **Signed** | formal documentation/order signature authority exercised | `id`, `actor` (with sign authority), `time`, `evidence`→target | formal; provider/sign authority | revise |
| review:cosigned | **Co-signed** | a countersign authority action exists (e.g. co-sign a verbal/telephone order) | `id`, `actor` (co-sign authority), `time`, `evidence`→target (+ the signed fact) | formal countersign | revise |

Rules (from CONTEXT.md + terminology map, restated as field-contract):

- **Reviewed, Verified, and Signed are DISTINCT authority states.** Review does not imply bedside verification; verification does not imply signature. They never collapse into one boolean.
- A review fact **never mutates** the target. The target stays append-only; the review-state of the target is the *projection* over the set of review facts pointing at it (via `evidence`) plus freshness/as-of.
- The clinician-facing **review-state label** (**Needs review / Source mismatch / May be outdated / Report only / Source needed**) is a **review prompt, not a truth decision**: it is derived from (absence of) review facts + source state + freshness, and surfaces as a prompt the clinician resolves through sanctioned workflow (Reconcile/Resolve stay clinician-owned).
- **Done vs Charted never collapse.** **Done** is a view-level work marker (the nurse marked a care item handled in a view); **Charted** requires a sanctioned chart source (an actual charted clinical fact). A review fact may make a fact **Reviewed**, but **Done ≠ Charted ≠ Reviewed ≠ Verified ≠ Signed** — the spec keeps all of these as separate, non-collapsing states.
- **Composition at scale:** because each review is its own fact with its own `actor`, review facts from many distinct clinicians/agents compose into the projection without contention. "Reviewed by 3 of the care team" or "Verified at bedside 08:10 by RN-A, Co-signed 09:00 by MD-B" is a *fan-in over review facts*, not a mutable counter.

## Kernel-mapping note

- A **review/attestation fact is itself a Claim.** Its `factShape` is most naturally `act` (an attestation is an action taken) or `interpretation` (a judgment about the target); its `predicateId` (e.g. `review.reviewed`, `review.verified`, `attestation.signed`, `attestation.cosigned`) must be a registered predicate whose declared shape equals `factShape` (Issue 03). Its link to the target rides the **one** evidence edge (`EvidenceRef`, Issue 07), role `primary`/`confirmatory`, NOT `revises` — a review is **not** a correction and must not be Revision-admissible plumbing (it asserts nothing wrong about the target).
- The reviewing **`actor`** maps to kernel `actor`; the verification **`source`** (e.g. bedside/monitor) maps to the controlled provenance vocabulary (Issue 06). Source (origin of the verification) stays separable from actor (who attested) and authority (Reviewed vs Signed).
- `certainty` (epistemic modality) and graded clinical certainty are **chart-internal — no direct kernel field**; they inform the choice of `predicateId`/`object`/`factShape` of the *assessment* fact. The kernel sees the resulting Claim, not a `certainty` column.
- **Append-only, never mutate:** consistent with the kernel ("prior entry remains append-only history"), review facts and certainty changes are new Claims; the original assessment/observation is never edited. This is what lets concurrent multi-clinician review at volume be safe — assuming the **proposed, not-yet-accepted** shared clinical-truth service runtime; cite `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` (proposed).

## Connector parameterization

A review-state/certainty projection connector stays **`(patientId, encounterId, asOf)`-parameterized** and never hardcodes a patient. Review-state "as of t" is the fan-in of review facts visible at `asOf` (`eventCoversAsOf`). Demo target `patient_002`/`enc_p002_001`; regression `patient_001`.

```
reviewState(patientId, encounterId, asOf) -> { factId, reviewFacts[], label }   // label ∈ {Needs review, Source mismatch, May be outdated, Report only, Source needed, Reviewed, Verified, Signed, Co-signed}
uncertaintyLabel(patientId, encounterId, asOf) -> { factId, label }              // label ∈ {Concern, Uncertain, Working diagnosis, Resolved}
```

## Open questions for the architect (do NOT pre-answer)

- **OQ-1 (revise/open-question):** Is a review/attestation fact's `factShape` `act` or `interpretation`? An attestation is arguably an act (something a clinician *did*), but a "Reviewed/Verified" judgment about a target is arguably an interpretation. This sets the registered predicate's declared shape (Issue 03). Surface for decision; do not silently pick.
- **OQ-2 (open-question):** Does graded clinical certainty live as **distinct predicates** (`assessment.concern` / `assessment.uncertain` / `assessment.working-diagnosis`) or as **one assessment predicate with a typed `object.certainty` field**? The former makes the certainty axis a `predicateId` projection; the latter keeps one predicate with graded content. Recommend distinct predicates for deterministic projection, but this couples to Issue 03/04 — needs joint sign-off.
- **OQ-3 (open-question):** The relationship between epistemic `certainty` (modality) and graded clinical certainty (confidence) — are they two independent fields kept both, or does one subsume the other? They are currently conflated under one word. The spec treats them as two axes; confirm both are retained or collapse them deliberately.
- **OQ-4 (defer-candidate):** Co-sign workflow depth (countersign chains, who may co-sign what) is real but risks pulling in role-registry/authority-engine scope explicitly **out of scope** in the PRD. Recommend `defer` co-sign *authorization rules* to a later slice; this issue only models Co-signed as a *separate fact shape*, not the authorization policy.

## Acceptance criteria

- [ ] Shows the typed **`certainty`** field **driving** the uncertainty projection (Concern / Uncertain / Working diagnosis / Resolved), replacing `data.differential`/`data.uncertainty` mining — a projection over a **named** field.
- [ ] States **Pi may surface source-linked Concern/Uncertain but never upgrades to a Working diagnosis or diagnosis** (clinician-owned promotion).
- [ ] Distinguishes epistemic modality `certainty` (observed/reported/inferred/planned/performed) from graded clinical certainty, and states each is **chart-internal (no direct kernel field)** that shapes `predicateId`/`object`/`factShape`.
- [ ] Models **Reviewed / Verified / Signed / Co-signed as separate charted clinical facts**, each with its own `id`, `actor`, `time`, and `evidence` linking the reviewed fact.
- [ ] States review/attestation facts are **never a mutation** of the target; review-state is a **projection** over the set of review facts + freshness.
- [ ] Keeps **Reviewed / Verified / Signed distinct** authority states (review ≠ bedside verification ≠ signature).
- [ ] Keeps **Done (view-level) vs Charted (sanctioned source) never collapsed**, and distinct from Reviewed/Verified/Signed.
- [ ] States the review-state label set (Needs review / Source mismatch / May be outdated / Report only / Source needed) is a **review prompt, not a truth decision**; Reconcile/Resolve stay clinician-owned.
- [ ] States review facts ride the **one evidence edge** (`EvidenceRef`, Issue 07), NOT `revises` (a review is not a correction).
- [ ] States review facts from **many distinct clinicians/agents compose** (fan-in, not a mutable counter) and keeps **source/actor/authority separable** per review fact.
- [ ] Surfaces **OQ-1–OQ-4** as explicit open questions for the architect (no invented answers).
- [ ] Connector examples stay `(patientId, encounterId, asOf)`-parameterized with no hardcoded patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).
- [ ] Marks shared-truth-service-dependent claims as assuming the **proposed** clinical-truth-service runtime and cites the proposal doc.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicateId-projection-and-production-registry.md` — assessment-certainty predicates and review/attestation predicates need ids + declared shapes.
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate.md` — graded-certainty content moves from `data.differential`/`data.uncertainty` into a typed `object`.
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/07-unified-evidence-edge-and-dead-field-closure.md` — review facts link to their target via the one `EvidenceRef` edge.

## Related (consistency)

- Issue 09 (lifecycle + correction Record-hash) — **Resolved** is shared: a resolution fact closes the open loop (lifecycle, Issue 09) AND collapses the uncertainty (certainty, this issue); both are append-only, neither mutates the original. A **review** is explicitly **not** a **correction** (`revises`, Issue 09).
- Issue 12 (human-agent suggestion state) — Pi-`Suggested` certainty/review facts are provisional until a human action; promotion across the certainty ladder is clinician-owned.
- Issue 06 (source/authorship/provenance) — verification `source` and reviewing `actor` use the controlled provenance vocabulary and keep source/actor/authority separable.

## Comments
