# Phase A context digging mining template and authority ladder

Template status: active workstream contract
Parent PRD: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`
Gateway issue: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/01-evidence-authority-ladder-and-mining-templates.md`

## Purpose

This template is the required reusable frame for the downstream Phase A context-digging and corpus-mining issues. It keeps source intent, brownfield implementation evidence, and patient-corpus evidence visible without allowing any one evidence layer to become automatic authority.

Use this file for issues 02-14 before promoting any recommendation into the v0.5 substrate recommendation or mismatch register.

## Authority ladder

When evidence conflicts, resolve in this order and record the conflict instead of smoothing it over:

1. Active task/user/system/developer instructions and scoped issue constraints.
2. In-scope `AGENTS.md` rules.
3. Accepted ADRs in `pi-chart/docs/adr/` plus the current source-authority map in `pi-chart/docs/architecture/source-authority.md`.
4. Canonical architecture/product docs identified by the source-authority map.
5. Active `.scratch/` PRDs/issues and explicitly named current planning artifacts.
6. Phase A source artifacts as clinical/function intent evidence, especially `pi-chart/clinical-reference/phase-a/` and the Phase A status matrix.
7. Brownfield `pi-chart` code/tests as implementation evidence only, not v0.5 architecture authority.
8. `patient_001` through `patient_005` corpus files and generated patient projections as fixture/scenario evidence only, not schema authority.
9. Prototype, rendered, design, archived package, memo, and `.omx/context` material as directional evidence only unless promoted by a current PRD, issue, or ADR.

Required interpretation:

- Accepted ADRs and the source-authority map govern conflicts.
- Phase A artifacts express intended clinical/function direction.
- Brownfield code/tests show attempted behavior, proof points, and prototype gravity only.
- Patient corpus files show scenario coverage, pressure, caveats, and gaps only.
- Lower-authority evidence can influence a recommendation only when cited, classified, and reconciled.

## Evidence layer definitions

| Layer | What it can prove | What it cannot prove | Example citations |
| --- | --- | --- | --- |
| Source intent | Clinical function, minimum data, provenance, lifecycle, primitive/view grammar, open questions. | That current code is correct or that a patient fixture is complete. | `pi-chart/clinical-reference/phase-a/PHASE-A-CHARTER.md`; `pi-chart/docs/plans/phase-a-status-matrix.md`; `pi-chart/clinical-reference/broad-ehr-skeleton.md` |
| Brownfield implementation | Existing behavior, test coverage, validation/write/read/view proof points, prototype risks. | Canonical v0.5 architecture or required schema. | `pi-chart/src/views/*`; `pi-chart/src/validate.ts`; related `*.test.ts` files |
| Patient corpus | Scenario pressure, public chart-facing examples, fixture gaps, caveats, hot/warm/cold examples. | Production schema, hidden simulation truth, migration readiness. | `pi-chart/patients/patient_001` through `pi-chart/patients/patient_005`; `_derived/` only as projection evidence |
| Rendered/prototype | Navigation affordances, clinician-digging questions, product intuition. | Storage primitives, source of chart truth, architecture authority. | `pi-chart/docs/design/`; `pi-chart/docs/prototypes/`; generated cockpit evidence |
| Runtime/context snapshots | Current-session rationale and launch constraints. | Durable architecture authority. | `.omx/context/phase-a-context-digging-corpus-mining-20260503T214931Z.md`; `.omx/context/phase-a-team-issue01-20260503T222435Z.md` |

## Required recommendation row template

Every recommendation, crosswalk row, corpus row, mismatch row, and final substrate row must include these fields.

| Field | Required content |
| --- | --- |
| Row id | Stable local id, for example `SRC-A4-MAR-001`, `BF-OPENLOOPS-002`, `CORPUS-P003-004`, or `MISMATCH-007`. |
| Substrate family | One parent-PRD family such as identity/encounter, constraints, problems/assessments, vitals/trends, nursing assessment, labs/diagnostics, orders/MAR/med-rec, I&O/LDA/device context, notes/narrative, care plan/handoff, review/accountability, provenance/lifecycle, or context access. |
| Clinical chart-digging question | The clinician/nurse/agent question this row helps answer. Avoid EHR module names as the reason. |
| Source artifact citation | Exact source-intent path and heading/row when available, or `not-covered`. |
| Brownfield code/test citation | Exact code/test path and symbol/test name when available, or `not-covered`. |
| Corpus citation | Exact patient/corpus path and scenario/material when available, or `not-covered`. |
| Evidence summary | One or two sentences describing what each cited layer actually supports. |
| Canonical/derived/rendered classification | `canonical`, `derived`, `rendered`, or a precise combination such as `canonical fact + derived projection`. |
| Hot/warm/cold class | `hot`, `warm`, `cold`, or a precise combination, with why. |
| Reconciliation state | One of `adopt`, `revise`, `defer`, `reject`, or `open-question`. |
| Mismatch register input | Conflict/gap/caveat to carry forward, or `none`. |
| v0.5 implication | The lean dense substrate implication, not an implementation task. |
| Boundary check | Explicit note that the row does not require source implementation, patient migration/editing, hidden `pi-sim` coupling, backend/vector/OpenBrain commitment, EHR-clone scope, direct agent accepted-writes, or pi-ledger kernel expansion. |

Markdown copy block:

```markdown
| Row id | Substrate family | Clinical chart-digging question | Source artifact citation | Brownfield code/test citation | Corpus citation | Evidence summary | Canonical/derived/rendered classification | Hot/warm/cold class | Reconciliation state | Mismatch register input | v0.5 implication | Boundary check |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  | adopt/revise/defer/reject/open-question |  |  |  |
```

## Reconciliation states

Use exactly these states:

- `adopt`: Evidence layers align enough to carry the concept into v0.5 recommendation language. `adopt` still requires source citation, brownfield citation or `not-covered`, corpus citation or `not-covered`, and boundary check.
- `revise`: Keep the clinical purpose or proof point but change the shape, authority, scope, primitive mapping, or access tier before v0.5.
- `defer`: Useful but not needed for lean v0.5, lacks enough evidence, or belongs to later UI/backend/FHIR/compliance/pharmacy/CPOE/access-plane work.
- `reject`: Do not carry forward. Use for EHR-clone bloat, hidden simulator truth, prototype-only storage/UI leakage, obsolete code coupling, or contradicted assumptions.
- `open-question`: Requires maintainer/HITL decision or later source/corpus/code reconciliation before recommendation.

Decision discipline:

- No row can be `adopt` only because current code implements it.
- No row can be `adopt` only because a patient fixture happens to contain it.
- No row can be `adopt` only because a source artifact proposes it.
- Any unresolved conflict becomes mismatch-register input.

## Context and projection taxonomy

Use these terms consistently.

| Term | Definition | Authority warning |
| --- | --- | --- |
| Canonical | Immutable chart truth/event/note/review/action/provenance fact that should be replayable and auditable. | Do not promote UI display, generated summaries, hidden simulator state, or patient fixture convenience into canonical truth. |
| Derived | Computed projection from canonical facts, such as current state, trend, evidence chain, open loops, narrative/memory proof, review state, or attestation state. | Derived outputs are rebuildable and must not become independent truth. |
| Rendered | UI/product/prototype/display affordance for human navigation. | Rendered evidence can suggest chart-digging questions but cannot define substrate. |
| Hot | Deterministic, low-latency current-care context needed for immediate reasoning or safety. | Hot truth must not depend on semantic/vector retrieval. |
| Warm | Recent/supporting structured evidence used for deeper chart review, nearby trend windows, recent notes/orders/labs/actions, review history, and provenance expansion. | Warm context supports but should not override hot current truth. |
| Cold | Longitudinal/background material such as prior encounters, H&P, old consults, discharge summaries, disease history, and narrative archives. | Cold/semantic/vector eligibility is a future access requirement, not a backend choice or second source of truth. |

## Boundary rules

Every downstream issue must confirm these boundaries in closeout:

- Docs-only unless a later approved issue explicitly authorizes source edits.
- Do not edit `pi-chart/src/`, schemas, tests, patient files, `_derived/` outputs, package files, lockfiles, ADRs, design assets, `pi-ledger` kernel internals, or `pi-sim` internals.
- Do not use hidden `pi-sim` physiology, evaluator labels, expected actions, private simulation variables, or runtime transcripts as chart truth.
- Do not migrate patients or rewrite patient fixtures during this mining workstream.
- Do not select or implement vector storage, embeddings, graph indexes, OpenBrain architecture, backend services, access-plane tooling, or runtime infrastructure.
- Do not frame v0.5 as a full EHR clone, MAR product, full CPOE/pharmacy workflow, billing/ADT/scheduling platform, legal-signature system, compliance platform, or external EHR implementation.
- Do not authorize direct agent accepted-writes to clinical truth; keep agent-authored material separate from human review/acceptance.
- Do not expand `pi-ledger` kernel requirements; record chart/adapter needs separately.
- Do not let rendered UI/prototype details become canonical or derived substrate without source/corpus/code reconciliation.

## Downstream issue reuse requirements

The following future issues must reuse this template before promotion or closeout:

- `02-phase-a-source-artifact-mining-map.md`
- `03-brownfield-implementation-crosswalk.md`
- `04-patient-001-005-corpus-atlas.md`
- `05-hot-current-state-substrate-pack.md`
- `06-trajectory-evidence-labs-diagnostics-substrate-pack.md`
- `07-orders-mar-medrec-io-lda-open-loop-substrate-pack.md`
- `08-notes-narrative-history-prior-encounters-handoff-substrate-pack.md`
- `09-review-attestation-authorship-lifecycle-accountability-substrate-pack.md`
- `10-rendered-chart-digging-and-prototype-design-evidence-pass.md`
- `11-hot-warm-cold-context-access-model.md`
- `12-three-layer-reconciliation-and-mismatch-register.md`
- `13-lean-dense-v0-5-substrate-recommendation.md`
- `14-closeout-verification-and-downstream-handoff.md`

Issues 02-14 remain `needs-triage` until the maintainer promotes them after this gateway template is reviewed.

## Closeout checklist for each downstream artifact

- [ ] Every recommendation row uses the required row template.
- [ ] Source artifact citation is present or explicitly `not-covered`.
- [ ] Brownfield code/test citation is present or explicitly `not-covered`.
- [ ] Corpus citation is present or explicitly `not-covered`.
- [ ] Reconciliation state is one of `adopt`, `revise`, `defer`, `reject`, or `open-question`.
- [ ] Canonical/derived/rendered and hot/warm/cold classifications are explicit.
- [ ] Boundary checks are recorded.
- [ ] Mismatches and caveats are carried forward rather than silently resolved.
- [ ] `git status --short` is recorded in closeout for docs-only verification when the issue asks for it.
