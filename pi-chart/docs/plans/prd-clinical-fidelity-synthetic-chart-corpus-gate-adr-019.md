# PRD — Clinical-fidelity Synthetic Chart Corpus Gate for ADR 019

## Status and authority

- Status: planned docs/test-contract gate; first execution slice only.
- Source plan: `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Prior context: `.omx/context/clinical-fidelity-synthetic-chart-corpus-gate-adr-019-20260427T144845Z.md`.
- Paired test spec: `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
- Source decisions and references:
  - `decisions/001-mimic-to-synthea.md`
  - `decisions/016-broad-ehr-skeleton-clinical-memory.md`
  - `decisions/018-architecture-rebase-clinical-truth-substrate.md`
  - `docs/architecture/source-authority.md`
  - `clinical-reference/broad-ehr-skeleton.md`
  - `ROADMAP.md`
- Scope: define the ADR 019 Corpus Readiness Gate, corpus readiness packet, operator review contract, waiver policy, and future machine-check backlog.
- First-slice boundary: no source/fixture edits. This lane creates documentation and test-contract artifacts only.

## Problem

ADR 018 keeps a clean-slate service/event-store architecture as a serious candidate but requires spike evidence and ADR 019 before any rewrite commitment. The existing ADR018 spike input can compare a candidate architecture against current projections, but ADR 019 also needs evidence that those projections are exercised by a clinically meaningful synthetic chart corpus, not a toy fixture or a single respiratory scenario.

This PRD defines a **prerequisite gate** for ADR 019. It is **not ADR 019**, does not choose hybrid migration versus clean-slate rewrite versus deferral, and does not authorize implementation of a rewrite, storage-port migration, importer, validator, schema, generated artifact, or patient fixture change.

## Users / consumers

- Human operator deciding whether ADR 019 has enough clinical-fidelity evidence.
- Future ADR 019 author citing the corpus readiness packet and ADR018 spike input.
- Future fixture/importer/validator agents implementing later corpus and machine-gate lanes.
- Architect/verifier agents checking that clean-slate enthusiasm did not bypass clinical fidelity or hidden-state boundaries.

## Goals

1. Define corpus readiness as a prerequisite gate, not ADR 019.
2. Require ADR 019 evidence to include both the existing clean-slate projection comparison and the corpus readiness packet.
3. Define a six-surface corpus contract rooted in ADR 016 and `clinical-reference/broad-ehr-skeleton.md`.
4. Define a minimum corpus matrix for at least five patients with varied admits, multi-day encounters, follow-up notes, six-surface coverage, provenance/timing, open loops, and evidence-chain stress.
5. Require memory-proof projection readiness and one-entry/many-projection reuse.
6. Treat Synthea as deterministic baseline/seeding evidence that needs hand-crafted ICU acute augmentation and operator review.
7. Name the operator review artifact and signoff fields.
8. Define future executable validator candidates without implementing them in this first slice.

## Non-goals for this first slice

- No ADR 019 creation and no `decisions/019-*` file.
- No clean-slate rewrite.
- No production storage-port migration.
- No `src/**` edits.
- No validators or validation-source edits.
- No schemas edits.
- No patient fixture changes under `patients/**`.
- No generated `_derived/**` or generated artifact edits.
- No Synthea importer implementation.
- No `scripts/**` edits.
- No package or lockfile edits.
- No new dependencies.
- No hidden `pi-sim` source inspection or dependency.

## ADR 019 evidence rule

ADR 019 evidence must include both:

1. **ADR018 spike input** — the clean-slate projection comparison result from the ADR 018 next-phase spike lane.
2. **Corpus readiness packet** — this gate's packet proving the projection comparison was run against clinically meaningful chart evidence.

ADR 019 must not recommend a clean-slate rewrite unless the corpus readiness packet passes. A waiver is allowed only as an explicit operator-level exception, **not a normal bypass**.

### Operator waiver policy

A waiver must record:

- operator identity and role,
- waiver date,
- rationale for proceeding despite failed or incomplete corpus readiness,
- documented clinical, architectural, and evidence risks,
- mitigation and follow-up lane,
- explicit statement that the waiver is not a normal bypass,
- why ADR 019 can proceed despite the failed or incomplete gate.

## Six-surface corpus contract

Each qualifying corpus scenario must evaluate all six observable surfaces. Each surface must contribute at least one of: agent-visible context, clinician review value, avoided duplicate documentation, open-loop visibility, or explicit uncertainty.

| Surface | Pass evidence | Fail / gap evidence |
|---|---|---|
| Flowsheets / vitals | Timed trend or flowsheet facts show trajectory and monitor context with source/provenance. | Only static vitals, no timing, no source/provenance, or no contribution to interpretation. |
| Nursing assessment | Bedside findings add chart-visible context not inferable from monitors alone. | Hidden physiology, implied assessment, or no explicit assessment artifact. |
| Notes / narrative charting | Narrative summarizes what happened, actions, response, evidence, and uncertainty. | Duplicative prose only, no evidence links, or no reviewable narrative. |
| Orders / medications / interventions | Intended/performed clinical work creates fulfillment links or open loops. | No order/action status, no fulfillment semantics, or no pending-loop visibility. |
| Labs / diagnostics | Asynchronous result or diagnostic artifact changes, confirms, or contradicts interpretation. | No diagnostic/lab evidence where scenario requires it, or no provenance/timing. |
| Care plan / handoff | Next-shift concern, watch items, pending work, and contingency are reviewable. | No handoff/care continuity output or no actionable next step. |

## Minimum corpus matrix

Before ADR 019 readiness, the corpus matrix must contain **>=5 patients**. `patient_001` and `patient_002` may be seed evidence only; neither is sufficient corpus breadth by itself.

| Column | Required content |
|---|---|
| Patient ID | Existing or proposed patient identifier. |
| Scenario/admit type | Varied admit context; no overfitting to one respiratory scenario. |
| Encounter shape | Single-day or multi-day; at least some multi-day encounters. |
| Source mix | Synthea-seeded baseline, hand-crafted ICU acute portion, or fully hand-crafted; include Synthea version/seed/parameters when applicable. |
| Six-surface coverage | Pass / partial / fail per surface. |
| Provenance/timing | Effective/recorded time or interval semantics plus source/author/transform provenance. |
| Chain depth | Order/assessment/intent/action/fulfillment chain that stresses `evidenceChain` and `openLoops`. |
| Follow-up notes | Follow-up documentation that demonstrates scenario evolution, not one-shot charting. |
| Memory proof output | Whether required projection sections exist and are reviewable. |
| Operator review | Named review artifact and signoff status. |
| Gaps | Missing clinical fidelity or machine-check gaps. |
| ADR 019 implication | Whether this row supports rewrite, hybrid, defer, or more corpus work. |

## Memory-proof projection readiness

The gate requires a derived memory-proof projection, or a documented equivalent until implementation exists, with these reviewable sections:

1. What happened.
2. Why it mattered.
3. Evidence/provenance.
4. Uncertainty.
5. Open loops.
6. Next-shift handoff.

Pass condition: the operator can answer what changed, what was done, what is pending, and what should be watched next from the projection alone.

## One-entry/many-projection proof

At least one clinical fact per qualifying scenario must prove documentation relief:

1. The fact is charted once with source, author, timing, and provenance.
2. Review projection reuses it.
3. Note or narrative projection reuses it.
4. Open-loop projection reuses it when it creates pending work or uncertainty.
5. Handoff projection reuses it.
6. The corpus packet documents that the same fact was not manually duplicated across surfaces to fake breadth.

## Synthea realism guardrails

Synthea is deterministic baseline/seeding evidence, not sufficient clinical truth. For each Synthea-seeded patient, the matrix must capture:

- Synthea seed, version, and parameters, or an explicit placeholder until importer work exists.
- Which clinical content came from Synthea baseline data.
- Which ICU acute portions were hand-crafted.
- Known realism limitations requiring operator review or hand-authored augmentation.
- Confirmation that no hidden simulator physiology was used as chart truth.

## Operator clinical review artifact

The gate names `docs/plans/clinical-fidelity-corpus-review-adr-019.md` as the future operator review artifact. This first slice does not create that review artifact unless separately authorized; it defines the required fields.

Minimum fields:

- reviewer identity,
- reviewer role,
- review date,
- patient/scenario reviewed,
- six-surface checklist result,
- memory-proof pass/fail,
- one-entry/many-projection proof status,
- Synthea baseline versus hand-crafted augmentation notes,
- realism notes,
- required corrections,
- explicit signoff: pass / conditional pass / fail.

## ADR 019 corpus readiness packet template

Future corpus packets should include:

1. ADR018 spike input summary: clean-slate projection comparison result.
2. Corpus readiness packet summary: matrix status and operator review status.
3. Combined decision implication: hybrid migration / clean-slate rewrite / defer rewrite / more corpus work.
4. Blocking gaps and follow-up lanes.
5. Waiver / operator exception if used, with all waiver policy fields and explicit not-a-normal-bypass language.

## Future machine-check backlog

Later executable validation may add checks for:

- gate metadata file exists per patient or corpus,
- all matrix-required fields are present,
- six-surface coverage has no unreviewed fail rows,
- memory-proof projection or documented equivalent contains all required sections,
- source/timing/provenance fields are present for qualifying events,
- Synthea seed/version/parameters or explicit placeholders are present when applicable,
- source tags distinguish Synthea baseline from hand-crafted ICU acute portions,
- open-loop and evidence-chain stress cases exist,
- no generated `_derived/**` artifact is treated as chart truth,
- no hidden simulator state is serialized into pi-chart or pi-agent context,
- waiver, if present, includes required operator-level risk/mitigation/follow-up fields.

These are backlog candidates only. This first docs/test-contract slice does not edit validators, schemas, importers, scripts, patients, generated artifacts, or package files.

## Owned files for this slice

- `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`

Optional board indexing, allowed by the source plan:

- `docs/plans/kanban-prd-board.md`

## Acceptance criteria

1. This PRD exists and includes the exact concepts: `prerequisite gate`, `not ADR 019`, `ADR018 spike input`, `corpus readiness packet`, `operator review`, and `no source/fixture edits`.
2. The paired test spec exists and includes a pass/fail checklist table for six surfaces, memory-proof sections, provenance/timing, source tags, Synthea augmentation, and no-hidden-state boundary.
3. The PRD states that ADR 019 evidence must include both the existing clean-slate projection comparison and the corpus readiness packet.
4. The corpus matrix minimums include `>=5` patients, varied admits, multi-day encounters, follow-up notes, six-surface coverage, provenance/timing, open loops, and evidence-chain stress.
5. The operator review artifact is named and has explicit pass / conditional pass / fail fields.
6. Non-goals explicitly forbid ADR 019 creation, fixture changes, validators, Synthea importer implementation, clean-slate rewrite, and storage-port migration in the first slice.
7. Structural verification confirms only intended planning/test-contract files changed, allowing the optional board row.
8. This PRD and paired test spec define the waiver policy as an operator-level exception with documented risk, mitigation/follow-up, and explicit not-a-normal-bypass language.
9. `npm run check` remains passing after the docs/test-contract slice.

## Risks

- ADR 019 could overfit patient_001 or patient_002 and treat seed evidence as corpus breadth.
- Synthea volume could be mistaken for ICU clinical fidelity.
- Operator review could remain subjective unless later machine checks are implemented.
- A waiver could become a normal bypass unless explicitly recorded as exceptional.
- Future agents could mistake this gate for rewrite authorization; this PRD intentionally forbids that.

## Verification

Use paired test spec: `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`.
