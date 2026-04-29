# RALPLAN-DR Draft — One-day Progress Plan After ADR018 / “ADR019” Confusion

## Status

- Date: 2026-04-28
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan` planner draft; planning only, no implementation in this artifact.
- Source context: `.omx/context/day-plan-after-adr018-019-20260428T145323Z.md`
- Recommended execution mode after approval: `$ralph` for a single-owner day lane; `$team` is unnecessary unless the user wants simultaneous docs + patient-review + verifier lanes.

## Grounding facts

- ADR018 is the accepted architecture rebase. It chooses hybrid migration now, keeps clean-slate service/event-store as a serious candidate, and requires a bounded spike plus ADR019 before rewrite commitment (`decisions/018-architecture-rebase-clinical-truth-substrate.md:26-36`, `:56-63`, `:93-107`).
- No `decisions/019-*` exists. `docs/architecture/source-authority.md` marks future ADR019 as pending and says the next gate is ADR019 after a clean-slate spike against current `patient_002` projections (`docs/architecture/source-authority.md:35-42`, `:123-125`).
- CORP-019 / corpus readiness is not ADR019. It is a prerequisite gate and explicitly says it is not rewrite authorization (`docs/plans/clinical-fidelity-corpus-review-adr-019.md:3-9`).
- `patient_002` is the strongest current golden scenario: local inventory shows 96 event rows, 56 vital samples, 10 timeline notes, and 10 top-level artifact files including `artifacts/index.json` (9 indexed artifact payloads if the index is excluded), plus simulation/reference-completed-chart material.
- `patient_002` is not enough corpus breadth. The corpus packet says `patient_001` and `patient_002` are useful seed evidence but do not establish ADR019 breadth, and the packet remains fail/incomplete until at least five reviewed patients and ADR018 spike input exist (`docs/plans/clinical-fidelity-corpus-review-adr-019.md:34-44`, `:57-65`, `:67-77`).
- Current dirty work includes `patient_002` imaging artifacts, clinical-reference/phase-a docs, broader planning docs, and unrelated `../pi-sim` files. Preserve this context; do not casually overwrite or normalize it.
- Prior verification evidence supplied by user: `npm test` passed 389/0 and `npm run typecheck` passed.

## RALPLAN-DR

### Principles

1. **Visible progress beats architecture churn.** Today must leave a concrete reviewed artifact or executable handoff, not another broad rebase discussion.
2. **Use `patient_002`, but label it correctly.** Treat it as the golden scenario for projection/spike proof; never treat it as sufficient corpus readiness or product ontology.
3. **Gate ADR019, do not impersonate it.** CORP-019 can prepare evidence for ADR019 but must not become a stealth ADR019 decision.
4. **Protect the dirty tree.** Start by inventorying and classifying existing edits; do not make broad source, fixture, or pi-sim changes under a scattered state.
5. **End the day with verifiable evidence.** The day is successful only if a human or agent can point to accepted files, commands, and pass/fail criteria.

### Decision drivers

1. **Focus restoration:** the user feels scattered after ADR018 / “019”; the plan must reduce branches, not add them.
2. **Evidence leverage:** `patient_002` has the richest current signal and should produce real progress fastest.
3. **Rewrite-risk containment:** clean-slate enthusiasm must stay behind the spike + ADR019 gate.

### Options

| Option | Summary | Pros | Cons | Disposition |
|---|---|---|---|---|
| A. `patient_002` golden review packet today | Freeze/curate `patient_002` as the golden scenario for ADR018 spike input and CORP-019 seed evidence; classify dirty artifact edits; update review packet/handoff only. | Highest leverage; visible progress in one day; aligns with ADR018 and CORP-019; does not overpromise corpus breadth. | Does not create the >=5-patient corpus; may feel narrow unless clearly framed. | **Recommended.** |
| B. Start `patient_003` today | Begin corpus breadth by adding a new scenario row/fixture plan. | Moves toward >=5-patient target. | Too large for one day under a dirty tree; risks abandoning the strongest available evidence. | Defer until `patient_002` golden packet is stable. |
| C. Resume clean-slate spike today | Start isolated event-store/projection comparison work. | Direct ADR019 input. | Premature if golden baseline and dirty-tree classification are unstable. | Defer unless day plan finishes early. |
| D. Docs cleanup / ADR numbering cleanup only | Clean up A9b/ADR018/019 terminology. | Reduces confusion. | Low clinical/product progress; can become avoidance work. | Do a small terminology note only if needed for handoff clarity. |

## Recommended one-day decision

Adopt **Option A: `patient_002` golden review packet today**.

Answer to the user’s key question: **yes, use deeply developed `patient_002` today**. Use it as the golden scenario for projection comparison, memory-proof review, and operator-facing clinical story. Do **not** count it as sufficient ADR019 corpus readiness; it remains one strong seed in a future >=5-patient corpus.

## One-day time blocks

Assume a normal workday. Compress or expand the blocks, but preserve the order.

### Block 1 — 45 min — Dirty-tree triage and lane lock

Goal: stop the scattered state from driving accidental work.

Actions for execution agent:
- Record current `git status --short`.
- Classify each dirty file into: `patient_002 golden evidence`, `corpus/ADR docs`, `unrelated pi-sim`, or `defer/unknown`.
- Do not edit `../pi-sim` from this `pi-chart` lane.
- Decide today’s owned file list before any edits.

Acceptance:
- A short triage note exists in the execution report.
- No source/fixture edits happen before owned paths are declared.

### Block 2 — 90 min — `patient_002` golden evidence review

Goal: turn “patient_002 is deeply developed” into citable evidence.

Actions:
- Review `patients/patient_002/chart.yaml`, timeline events/vitals/notes, artifact index, `_derived/memory-proof.md`, and reference-completed-chart material.
- Summarize why `patient_002` is golden: event/vital/note/artifact depth, timing/provenance, six-surface coverage, order/action/result/handoff chain, hidden-state boundary.
- Note its limits: respiratory family, limited corpus variety, operator review pending, not >=5-patient breadth.

Acceptance:
- A compact “patient_002 golden scenario” section exists in the chosen docs/handoff artifact.
- The section includes both strengths and insufficiency language.

### Block 3 — 75 min — CORP-019 / ADR019 terminology repair in handoff

Goal: remove the false “ADR019 already exists” mental model.

Actions:
- Make the execution artifact state: `decisions/019-*` absent; CORP-019 is a readiness gate; ADR019 comes after ADR018 spike input + corpus readiness.
- If editing durable docs, prefer narrow updates to `docs/plans/clinical-fidelity-corpus-review-adr-019.md` or a new day-handoff under `docs/plans/` only if the executor confirms it is in scope.
- Do not create `decisions/019-*` today.

Acceptance:
- A reader can distinguish ADR018, CORP-019, and future ADR019 in under one minute.
- No file implies clean-slate rewrite authorization.

### Block 4 — 90 min — Golden packet / operator-review handoff

Goal: create the artifact that counts as real progress.

Actions:
- Produce or update a compact operator-facing handoff/checklist for `patient_002` golden review.
- Include review prompts: six surfaces, memory-proof sections, one-entry/many-projection proof, provenance/timing, open loops, hidden-state exclusion, and corpus limitation.
- Include next-lane recommendation: after patient_002 review, either build `patient_003` or run ADR018 spike baseline capture.

Acceptance:
- The handoff has explicit pass / conditional pass / fail semantics.
- It can be used by a human reviewer without reading all prior plans.

### Block 5 — 45 min — Verification and closeout

Goal: prove no regression and leave the next step obvious.

Actions:
- Run at minimum: `npm run typecheck` and `npm test`.
- If docs/fixtures affecting derived outputs changed, run `npm run check` or explain why not.
- Capture final `git status --short`.
- Write final report: changed files, patient_002 decision, verification evidence, remaining risks, next recommended lane.

Acceptance:
- Tests/typecheck pass or failures are documented with exact command output and next action.
- Remaining work is split into `today done`, `next patient_003/corpus`, and `later ADR018 spike / ADR019`.

## Day acceptance criteria

1. `patient_002` is explicitly classified as **golden scenario / strongest seed**, not sufficient corpus.
2. CORP-019 is explicitly classified as **corpus-readiness gate**, not ADR019.
3. No `decisions/019-*` file is created.
4. No clean-slate rewrite, production storage-port migration, schema migration, or pi-sim coupling starts today.
5. Dirty files are classified before edits, and unrelated `../pi-sim` changes are not modified by this lane.
6. A human-readable operator review / golden packet handoff exists or is updated.
7. Verification includes `npm test` and `npm run typecheck` unless execution reports a concrete blocker.

## Verification plan

- Repository state: `git status --short` before and after.
- Structural checks:
  - `find decisions -maxdepth 1 -name '019-*'` returns no ADR019 unless a future explicit ADR task authorizes it.
  - Handoff text contains: `patient_002`, `golden`, `not sufficient`, `>=5`, `CORP-019`, `not ADR 019`, `ADR018 spike input`.
- Test commands:
  - `npm run typecheck`
  - `npm test`
  - Optional if derived/corpus docs require it: `npm run check`

## Execution handoff

Recommended handoff:

```bash
$ralph Execute .omx/plans/ralplan-one-day-after-adr018-019.md in /home/ark/pi-rn/pi-chart. Planning is complete; implement only the one-day patient_002 golden review packet lane. Do not touch ../pi-sim, do not create decisions/019-*, do not start clean-slate rewrite, and verify with npm run typecheck plus npm test.
```

If using `omx team`, keep it small:

```bash
omx team start --task "One-day patient_002 golden packet after ADR018/CORP-019" --workers 3
```

Suggested lanes:
- `executor` / medium: own narrow docs/handoff edits only.
- `verifier` / high: check ADR018/CORP-019 language, path boundaries, and commands.
- `critic` / high: review that `patient_002` is not overclaimed as corpus readiness.

Team verification path:
- Executor reports changed files and intended semantics.
- Critic confirms no ADR019/rewrite overclaim.
- Verifier runs typecheck/tests and checks final dirty tree.
- Leader closes with final user-facing status and next recommended lane.

## ADR-style planning record

### Decision

Spend today on a `patient_002` golden scenario review packet / handoff, not on clean-slate implementation or new patient corpus construction.

### Drivers

- Fastest path to visible progress.
- Highest leverage evidence already exists in `patient_002`.
- ADR018 and CORP-019 both require disciplined gates before ADR019/rewrite decisions.

### Alternatives considered

- Start `patient_003`: deferred until golden seed handoff is stable.
- Start clean-slate spike: deferred until baseline/golden evidence is ready and dirty tree is controlled.
- Do only terminology cleanup: insufficient progress by itself.

### Why chosen

This plan converts existing depth into reviewable evidence while preserving the architecture gates. It gives the user real progress today without pretending one respiratory scenario answers the whole ADR019 corpus question.

### Consequences

- Good: concrete progress, less confusion, safer handoff.
- Cost: corpus breadth and clean-slate spike remain next-lane work.
- Guardrail: any executor must repeat that `patient_002` is golden but not sufficient.

### Follow-ups

1. After golden packet acceptance, choose next lane: `patient_003` corpus breadth or ADR018 spike baseline capture.
2. Later, combine ADR018 spike result + passing CORP-019 packet into actual ADR019.
3. Keep A9b/ADR018 numbering collision cleanup as a small docs hygiene task, not today’s main progress.


## Consensus review notes

- Architect verdict: APPROVE. Main tension: `patient_002` depth versus >=5-patient corpus breadth; packet must not become another abstract artifact.
- Critic verdict: APPROVE. Required changes: none. Non-blocking guardrail applied: precise artifact count wording.
- Applied improvement: clarified artifact count as 10 top-level artifact files including `index.json`, or 9 indexed payloads excluding the index.
