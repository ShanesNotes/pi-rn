# Plan — Clinical-Fidelity Synthetic Chart Corpus Gate for ADR 019

## Status

- Date: 2026-04-27
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan` consensus planning only; no implementation in this turn.
- Source context snapshot: `.omx/context/clinical-fidelity-synthetic-chart-corpus-gate-adr-019-20260427T144845Z.md`
- Plan artifact: `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- Recommended execution mode after approval: `$ralph` for the first docs/test-contract slice; `$team` only if later execution splits corpus fixtures, validators, and evidence-packet work into separate lanes.

## Problem statement

ADR 018 leaves ADR 019 pending until spike evidence can choose one of three paths: continue hybrid storage-port migration, commit to clean-slate service/event-store rewrite, or defer rewrite (`decisions/018-architecture-rebase-clinical-truth-substrate.md:56-63`, `:93-100`). The source-authority map also marks future `decisions/019-*` as pending and forbids starting a clean-slate rewrite before spike evidence plus ADR 019 (`docs/architecture/source-authority.md:35-42`, `:80-92`, `:123-125`).

The existing ADR 018 next-phase spike lane compares a clean-slate candidate against current projections, especially patient_002. That is necessary but not sufficient for ADR 019. ADR 019 also needs evidence that the comparison is being made against a clinically meaningful synthetic chart corpus, not a toy or single-scenario fixture.

This plan creates the **ADR 019 Corpus Readiness Gate**: a prerequisite artifact that defines when the synthetic chart corpus is clinically faithful enough to inform ADR 019. It is not ADR 019, does not authorize a rewrite, and does not itself implement fixtures, validators, importers, or production storage changes.

## Grounding evidence

- ADR 016 requires a broad, shallow EHR skeleton across flowsheets/vitals, nursing assessment, notes, orders/meds/interventions, labs/diagnostics, and care plan/handoff; it also requires a coherent fixture story, provenance/timing, memory-proof projection, one-entry/many-projection documentation relief, and no hidden simulator physiology (`decisions/016-broad-ehr-skeleton-clinical-memory.md:30-67`, `:105-115`).
- `clinical-reference/broad-ehr-skeleton.md` defines the six-surface contract and pass condition (`clinical-reference/broad-ehr-skeleton.md:26-56`) and states `patient_001` is a narrow respiratory seed that lacks broad-skeleton breadth (`:89-109`).
- ROADMAP Track B targets at least five hand-crafted plus Synthea-seeded patients, varied admit contexts, multi-day encounters, follow-up notes, and deep order/assessment/intent chains stressing `evidenceChain` and `openLoops` (`ROADMAP.md:51-65`).
- ADR 001 accepts Synthea because it is open and deterministic, while acknowledging lower realism and weaker ICU depth mitigated by hand-crafted ICU acute portions and operator clinical validation (`decisions/001-mimic-to-synthea.md:15-27`, `:47-64`).
- Current validation exists at the patient structural level: `validateChart()` loads schema validators, validates structural Markdown, walks the timeline, checks referential integrity, note rules, and derived edit warnings (`src/validate.ts:919-1027`). The CLI validates all patient directories and exits non-zero on errors (`scripts/validate.ts:1-61`). Baseline `npm run check` passed on 2026-04-27 with 0 errors / 0 warnings across 2 patients.
- External grounding supplied for this plan: Synthea is an open-source synthetic patient generator producing realistic-but-not-real records with FHIR/C-CDA/CSV exports; validation literature identifies limitations around deviations in care and heterogeneous post-intervention outcomes; HL7 US Core provides relevant profile families for observations, clinical notes, medication, service requests, diagnostic reports, and provenance.

## RALPLAN-DR summary

### Principles

1. **Prerequisite, not decision.** The gate supplies readiness evidence for ADR 019; it must not decide ADR 019 or authorize clean-slate rewrite work.
2. **Clinical fidelity over synthetic volume.** Synthea-seeded scale is useful only when paired with hand-crafted ICU acute portions and explicit operator clinical review.
3. **Observable chart truth only.** Pass criteria must be based on chart-visible artifacts with source, timing, and provenance, never hidden simulator physiology.
4. **One-entry/many-projection proof.** Corpus readiness requires evidence that one charted clinical fact can feed review, note, open-loop, and handoff projections without duplicative manual prose.
5. **Operator-reviewable first, machine-checkable next.** The initial gate may be documentation/test-contract work, but it must define future executable validator hooks so it does not remain subjective clinical vibes.

### Top decision drivers

1. **ADR 019 evidence quality.** A rewrite/hybrid/defer decision must not rest on a toy corpus or one respiratory scenario.
2. **Boundary and provenance safety.** The corpus gate must preserve ADR 016/018 hidden-state boundaries and keep source/timing/provenance first-class.
3. **Rewrite-risk containment.** The gate must improve decision evidence without creating a backdoor rewrite, production storage-port migration, or Synthea importer implementation.

### Viable options

| Option | Core idea | Pros | Cons | Disposition |
|---|---|---|---|---|
| A. ADR 019 Corpus Readiness Gate, docs-first with machine-check backlog | Create PRD/test-spec/gate docs that define pass/fail checklist, corpus matrix, operator-review artifact, ADR 019 evidence packet, and future validator requirements. | Fast, reversible, aligns with ADR 018 source-authority discipline, avoids code churn, prevents ADR 019 from relying on toy corpus. | Initial artifact is not executable by itself; requires follow-through to fixtures/validators. | **Recommended.** |
| B. Immediate fixture + validator implementation | Build the ≥5-patient corpus and extend `validateChart()`/CLI now. | Produces executable evidence earlier; reduces subjectivity. | Too broad for this planning-only task; risks schema/fixture churn before gate is agreed. | Viable later execution lane after A. |
| C. Fold corpus readiness into ADR 018 clean-slate spike only | Let the existing spike plan own all evidence for ADR 019. | Fewer artifacts; simpler coordination. | Risks overfitting patient_002/golden projection evidence and missing ROADMAP breadth. | Rejected as insufficient alone. |
| D. Defer corpus gate until after ADR 019 | Decide architecture first, then improve corpus fidelity. | Speeds architecture decision. | Contradicts ADR 001/016/018 evidence discipline; ADR 019 could bless rewrite/hybrid work on weak clinical evidence. | Rejected. |

## Recommended decision

Adopt **Option A: ADR 019 Corpus Readiness Gate, docs-first with machine-check backlog**.

This gate integrates with, but does not duplicate, `docs/plans/prd-adr018-next-phase-clean-slate-spike.md`. ADR 019 evidence should require two packets:

1. **ADR 018 clean-slate projection comparison result** from the existing spike lane.
2. **Corpus readiness packet** from this gate proving the projection comparison was clinically meaningful and not based on a toy corpus.

The corpus gate may block a clean-slate rewrite recommendation even if the projection spike succeeds.

## Scope and owned paths for execution

### Planning artifact already owned by this turn

- `.omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`

### Proposed first execution slice owned paths

Execution should create or update only durable planning/test-contract artifacts such as:

- `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- Optional: `docs/plans/kanban-prd-board.md` row linking the gate lane, if board maintenance is in scope.

### Explicitly out of scope for the first execution slice

- No `decisions/019-*` file.
- No clean-slate rewrite.
- No production storage-port migration.
- No Synthea importer implementation.
- No fixture edits under `patients/**`.
- No validator/source edits under `src/**` or `scripts/**`.
- No schema edits.
- No generated `_derived/**` edits.
- No hidden `pi-sim` source inspection or dependency.

## Requirements

### R1 — Gate identity and ADR 019 dependency

The durable PRD/test-spec must state that this is a **prerequisite gate**, not ADR 019. ADR 019 must not recommend clean-slate rewrite unless the corpus readiness packet passes. A waiver is allowed only as an explicit operator-level exception, not a normal bypass. The waiver must record operator identity/role, date, rationale, documented risks, mitigation/follow-up, and why ADR 019 can proceed despite failed or incomplete corpus readiness.

### R2 — Six-surface corpus contract

The gate must define pass/fail criteria for the six surfaces from ADR 016 and `clinical-reference/broad-ehr-skeleton.md`:

1. Flowsheets / vitals.
2. Nursing assessment.
3. Notes / narrative charting.
4. Orders / medications / interventions.
5. Labs / diagnostics.
6. Care plan / handoff.

Each surface must contribute at least one of: agent-visible context, clinician review value, avoided duplicate documentation, open-loop visibility, or explicit uncertainty.

### R3 — Minimum corpus matrix

The gate must define a corpus matrix with at least five patients before ADR 019 readiness:

| Column | Required content |
|---|---|
| Patient ID | Existing/proposed patient identifier. |
| Scenario/admit type | Varied admit context; no overfitting to one respiratory scenario. |
| Encounter shape | Single-day or multi-day; at least some multi-day encounters. |
| Source mix | Synthea-seeded baseline, hand-crafted ICU acute portion, or fully hand-crafted; include Synthea version/seed/parameters when applicable. |
| Six-surface coverage | Pass/partial/fail per surface. |
| Provenance/timing | Effective/recorded time or interval semantics and source/author/transform provenance. |
| Chain depth | Order/assessment/intent/action/fulfillment chain that stresses `evidenceChain` and `openLoops`. |
| Memory proof output | Whether required projection sections exist and are reviewable. |
| Operator review | Named review artifact/signoff status. |
| Gaps | Missing clinical fidelity or machine-check gaps. |
| ADR 019 implication | Whether this row supports rewrite, hybrid, defer, or more corpus work. |

`patient_001` and `patient_002` may be seed evidence only; neither should be treated as sufficient corpus breadth by itself.

### R4 — Memory-proof projection readiness

The gate must require a derived memory-proof projection, or a documented equivalent until implementation exists, with these reviewable sections:

1. What happened.
2. Why it mattered.
3. Evidence/provenance.
4. Uncertainty.
5. Open loops.
6. Next-shift handoff.

Pass condition: the operator can answer what changed, what was done, what is pending, and what should be watched next from the projection alone.

### R5 — One-entry/many-projection proof

At least one clinical fact per qualifying scenario must demonstrate documentation relief: charted once with source/timing/provenance, then reused through review, note/narrative, open-loop, and handoff projections.

### R6 — Synthea realism guardrails

The gate must treat Synthea as deterministic baseline/seeding evidence, not sufficient clinical truth. For each Synthea-seeded patient, the matrix must capture:

- Synthea seed/version/parameters or explicit placeholder until importer exists.
- What clinical content came from Synthea baseline versus hand-crafted ICU acute portions.
- Which known limitations require operator review or hand-authored augmentation.
- Confirmation that no hidden simulator physiology was used as chart truth.

### R7 — Operator clinical review artifact

The gate must name the review artifact and required fields. A suggested artifact is:

- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`

Minimum fields:

- reviewer identity/role,
- review date,
- patient/scenario reviewed,
- six-surface checklist result,
- memory-proof pass/fail,
- realism notes,
- required corrections,
- explicit signoff: pass / conditional pass / fail.

### R8 — Future machine-check backlog

The PRD/test-spec must separate first-slice docs acceptance from later executable validation. Future validator candidates should include:

- gate metadata file exists per patient or corpus,
- all matrix-required fields present,
- six-surface coverage has no unreviewed fail rows,
- memory-proof projection contains required sections,
- source/timing/provenance fields are present for qualifying events,
- open-loop/evidence-chain stress cases exist,
- no generated `_derived/**` is treated as chart truth.

## Acceptance criteria

### First execution slice: docs/test-contract gate

1. `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md` exists and includes the exact concepts: `prerequisite gate`, `not ADR 019`, `ADR018 spike input`, `corpus readiness packet`, `operator review`, and `no source/fixture edits`.
2. `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md` exists and includes a pass/fail checklist table for six surfaces, memory-proof sections, provenance/timing, source tags, Synthea augmentation, and no-hidden-state boundary.
3. The PRD states that ADR 019 evidence must include both the existing clean-slate projection comparison and the corpus readiness packet.
4. The corpus matrix minimums include `>=5` patients, varied admits, multi-day encounters, follow-up notes, six-surface coverage, provenance/timing, open loops, and evidence-chain stress.
5. The operator review artifact is named and has explicit pass / conditional pass / fail fields.
6. Non-goals explicitly forbid ADR 019 creation, fixture changes, validators, Synthea importer implementation, clean-slate rewrite, and storage-port migration in the first slice.
7. Structural verification confirms only intended planning/test-contract files changed.
8. PRD/test-spec define the waiver policy as an operator-level exception with documented risk, mitigation/follow-up, and explicit “not a normal bypass” language.

### Later execution lanes: corpus and machine gate

1. At least five patient rows exist in the corpus matrix.
2. Each qualifying patient has chart-visible evidence for all six surfaces or a documented gate fail/gap.
3. At least one scenario proves one-entry/many-projection reuse.
4. Memory-proof projection output or documented equivalent covers all six required sections.
5. Operator review is complete for each gate-passing patient.
6. `npm run check` remains passing after any later fixture/validator work.
7. ADR 019 evidence packet can cite both the spike comparison and corpus readiness packet.

## Implementation / work packages

### WP0 — Confirm authority and create durable docs

- Read the current source-authority map and ADR 018/016/001 references.
- Create the PRD and test-spec files under `docs/plans/`.
- Add a board row only if the existing board convention supports it and execution scope includes board maintenance.

Acceptance: durable docs exist, cite the authority files above, and keep this lane as a prerequisite gate.

### WP1 — Define the gate checklist and corpus matrix

- Add the six-surface pass/fail checklist.
- Add minimum corpus matrix columns listed in R3.
- Label `patient_001` and `patient_002` as seed evidence only unless later corpus work proves broader coverage.

Acceptance: a reviewer can determine whether the corpus is toy, partial, or ADR-ready without reading source code.

### WP2 — Define operator clinical review

- Create or specify the review artifact.
- Add reviewer/signoff fields.
- Require hand-crafted ICU acute augmentation evidence for Synthea-seeded patients.

Acceptance: the gate cannot pass on generated data alone; clinical review status is explicit.

### WP3 — Define ADR 019 evidence packet template

Template sections:

1. ADR 018 clean-slate projection comparison result.
2. Corpus readiness packet.
3. Combined decision implication: hybrid migration / clean-slate rewrite / defer rewrite.
4. Blocking gaps and follow-up lanes.
5. Gate waiver / operator exception, if applicable: operator, date, rationale, documented risks, mitigations, follow-up lane, and statement that waiver is not normal bypass.

Acceptance: ADR 019 authors can copy the template into `decisions/019-*` only after evidence exists.

### WP4 — Define future executable validator backlog

- Specify future checks for corpus metadata, memory-proof required sections, provenance/timing, source mix, and open-loop/evidence-chain stress.
- Keep backlog non-implemented in the first slice.

Acceptance: implementation agents later know exactly where `src/validate.ts` and `scripts/validate.ts` might expand without guessing.

### WP5 — Verify the planning slice

- Run structural file diff review.
- Run `npm run check` only if docs edits could have affected repo scripts or if execution policy requires it; otherwise document that no code/fixture files changed.
- Confirm no forbidden paths changed.

Acceptance: planning artifacts are complete and no implementation happened.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Gate becomes subjective clinical vibes. | Require hard matrix minimums, pass/fail checklists, named operator review artifact, and future machine-check backlog. |
| Gate duplicates ADR 018 spike lane. | Treat `docs/plans/prd-adr018-next-phase-clean-slate-spike.md` as an input and require its projection comparison packet separately. |
| Synthea volume is mistaken for realism. | Require source mix, hand-crafted ICU augmentation, and operator review for each gate-passing scenario. |
| Patient_002 overfits ADR 019 evidence. | Mark patient_002 as golden spike evidence, not corpus breadth; require at least five varied patients before readiness. |
| Future validator backlog is ignored. | Put backlog in test-spec with owned later lanes and explicit acceptance hooks. |
| Hidden simulator truth leaks into corpus. | Make no-hidden-physiology a hard fail criterion. |
| Gate waiver becomes a backdoor rewrite bypass. | Waiver requires explicit operator-level exception, documented risk, mitigation/follow-up, and ADR 019 evidence packet traceability. |
| Planning artifacts become architecture authority prematurely. | Keep docs under `docs/plans/`; promote only through ADR 019 after evidence. |

## Verification plan

### Planning-slice verification

1. Inspect the PRD/test-spec for required phrases and sections.
2. Check changed files are limited to approved docs/plans paths.
3. Confirm no `decisions/019-*`, `src/**`, `scripts/**`, `schemas/**`, `patients/**`, or generated `_derived/**` files changed.
4. Confirm PRD/test-spec cite ADR 018, source-authority, ADR 016, broad skeleton reference, ROADMAP Track B, and ADR 001.
5. Confirm ADR 019 packet template has both required evidence sections.
6. Fail verification if waiver language exists without operator-level exception fields, documented risk, and mitigation/follow-up.

### Later executable verification

1. `npm run check` after fixture/validator work.
2. Targeted tests for any new validator rules.
3. Golden review of memory-proof projection sections.
4. Operator clinical review artifact complete for each gate-passing patient.
5. ADR 019 packet includes explicit pass/fail/gap rows, not prose-only claims.

## ADR section for this plan

### Decision

Create an **ADR 019 Corpus Readiness Gate** as a prerequisite docs/test-contract artifact before ADR 019 uses corpus evidence to choose hybrid migration, clean-slate rewrite, or deferral.

### Drivers

- ADR 019 needs clinically meaningful evidence, not just projection equivalence on a narrow fixture.
- ADR 016 requires six-surface observable clinical memory proof with provenance/timing and no hidden simulator physiology.
- ADR 001 makes Synthea acceptable only with hand-crafted acute portions and operator validation.
- ADR 018 requires rewrite-risk containment and spike evidence before any clean-slate commitment.

### Alternatives considered

- Immediate fixture/validator build: useful later, too broad for this planning-only gate.
- Fold into ADR 018 spike: too narrow; risks patient_002 overfit.
- Defer until after ADR 019: unsafe; allows architecture decision on weak corpus evidence.

### Why chosen

A docs-first corpus gate is the smallest reversible step that prevents ADR 019 from being decided on toy evidence while preserving the existing ADR 018 spike lane. It defines the clinical fidelity standard before implementation agents expand fixtures or validators.

### Consequences

- ADR 019 evidence must include a corpus readiness packet.
- The existing clean-slate spike remains necessary but not sufficient.
- Later fixture/validator work has a clear target.
- The gate can block a clean-slate rewrite recommendation even if projection equivalence succeeds.

### Follow-ups

1. Execute WP0-WP5 as a docs/test-contract slice.
2. Run a later corpus expansion lane to build/fill the >=5 patient matrix.
3. Run a later validator lane to convert the gate backlog into executable checks.
4. Use the final corpus readiness packet as an input to ADR 019.

## Available-agent-types roster

Use only roles available in the current OMX/Codex prompt catalog:

- `planner` — sequencing, PRD/test-spec structure, risk shaping.
- `architect` — ADR 018/019 integration, boundary design, spike/gate separation.
- `critic` — acceptance criteria, alternatives fairness, verification strictness.
- `executor` — docs/test-contract edits or later bounded implementation.
- `test-engineer` — test-spec and future validator design.
- `verifier` — changed-file guard, evidence validation, completion proof.
- `researcher` — official Synthea/HL7/reference confirmation if execution needs citations beyond the supplied facts.
- `dependency-expert` — only if later work proposes new importer/tooling dependencies; not needed for first slice.

## Staffing / role-allocation guidance

### Recommended `$ralph` path

Use `$ralph` for the first slice because the write set is small and sequential:

1. `executor` medium — create PRD/test-spec docs under `docs/plans/`.
2. `test-engineer` medium — strengthen checklist and future validator backlog.
3. `verifier` high — confirm file guard, required phrases, and no implementation changes.

Suggested launch hint:

```bash
$ralph "Execute .omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md WP0-WP5 only. Planning/test-contract docs only; no source, fixture, validator, schema, ADR019, or importer implementation."
```

### Optional `$team` path

Use `$team` only for later broader execution after the docs/test-contract gate is approved and the work splits cleanly:

- Lane 1: `executor` — PRD/test-spec/gate docs.
- Lane 2: `test-engineer` — validator backlog and later tests.
- Lane 3: `researcher` — official Synthea/HL7/clinical-reference citation packet, if needed.
- Lane 4: `verifier` — team verification and no-hidden-state/file-guard checks.

Suggested launch hint:

```bash
$team "Implement the approved ADR 019 corpus readiness gate from .omx/plans/plan-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md. Split docs, test-spec, research citations, and verification. Do not create ADR019 or edit source/fixtures unless a later approved lane expands scope."
```

## Team verification path

Before shutdown, a team must prove:

1. PRD/test-spec files exist and contain required gate language.
2. ADR 018 spike plan is referenced as input, not duplicated.
3. Corpus matrix and operator-review artifact are defined.
4. Future machine-check backlog is explicit but not implemented in the first slice.
5. Changed files are limited to approved paths.
6. If any source/fixture files changed, team stops and escalates because scope was violated.

Ralph follow-up should then run final verification and prepare a concise report with changed files, simplifications made, remaining risks, and any test gaps.

## Consensus review notes

- Architect verdict: APPROVE. Steelman antithesis accepted as a watchpoint: docs-first can become process theater unless follow-through produces matrix, operator review, and explicit pass/fail/gap rows. Applied guardrail: ADR 018 spike packet and corpus readiness packet are separate evidence inputs; projection success alone is necessary but not sufficient.
- Critic verdict: ITERATE on first pass, then APPROVE after mandatory waiver guardrail. Applied improvements: explicit operator-level exception waiver language, waiver acceptance criterion, waiver verification step, waiver risk row, and ADR 019 packet waiver field; prior guardrails also applied: explicit owned paths, corpus matrix minimums, operator-review artifact, ADR 019 evidence packet template, strict non-goals, structural verification checks, and future machine-check backlog.
