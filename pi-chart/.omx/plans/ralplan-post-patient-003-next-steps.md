# RALPLAN — post-patient_003 next steps for CORP-019 corpus generation

## Status

- Date: 2026-04-28
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan` consensus planning only; this plan does **not** execute fixture generation.
- Current state: `patient_002` is signed off for golden-seed use; `patient_003` is generated and machine-verified but still needs operator clinical realism review before it becomes a reviewed corpus row.
- Existing execution plan to reuse after review: `.omx/plans/plan-patient-004-cardiac-renal-med-management.md`.
- Existing operator gate artifact: `docs/plans/patient-003-operator-review-checklist.md`.

## Boundary constraints

This is a CORP-019 corpus-development plan, not ADR019.

Do not:

- touch `../pi-sim`,
- create `decisions/019-*`,
- start a clean-slate rewrite,
- generate `patient_004` before the `patient_003` review verdict is known or corrections are resolved,
- claim ADR019 readiness from `patient_002` + `patient_003` alone,
- use hidden simulator/private state as chart truth.

## Requirements summary

The next development move should maintain momentum without propagating a flawed patient-generation pattern. The highest-value path is to treat `patient_003` as the pilot pattern gate, then execute `patient_004` as the next one-patient corpus row if the operator review is clean.

Concrete repo facts this plan depends on:

- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` marks `patient_003` as generated/operator-review-pending and `patient_004` as the proposed cardiac/renal medication-management target row.
- `docs/plans/patient-003-operator-review-checklist.md` defines pass / conditional pass / fail decision rules for whether `patient_004` may proceed.
- `.omx/plans/plan-patient-004-cardiac-renal-med-management.md` already defines the patient_004 fixture scope, test extension, corpus-packet update, and verification commands.
- Recent completed machine verification for `patient_003`: `npm run rebuild`, `npm run validate`, `npm run typecheck`, `npm test`, and `find decisions -maxdepth 1 -name '019-*' -print` all passed / produced no forbidden decision files per the supplied Ralph completion report.

## RALPLAN-DR summary

### Principles

1. **Review gate before replication** — do not let an unreviewed clinical pattern become the template for additional generated patients.
2. **One corpus row at a time** — preserve small, reversible diffs and clear attribution of clinical changes.
3. **Chart-visible truth only** — semantic proof must come from patient chart artifacts and derived views, never hidden simulator/private state.
4. **Scenario diversity with continuity** — each new row should stress a different clinical memory axis, not merely clone patient_002 or patient_003.
5. **ADR019 boundary discipline** — CORP-019 can build evidence for a future decision but must not create `decisions/019-*` or imply rewrite authorization.

### Decision drivers

1. **Risk of pattern propagation:** if `patient_003` has clinical realism defects, generating `patient_004` first may multiply cleanup work.
2. **Need for visible progress:** the project needs forward motion beyond patient_002 without reopening broad ADR018/019 uncertainty.
3. **Need for corpus breadth:** cardiac/renal medication management is the right next axis because it stresses reconciliation, MAR hold/admin semantics, renal trend interpretation, and medication-risk handoff.

### Viable options

#### Option A — Gate on patient_003 review, then run patient_004 (recommended)

Approach: Use `docs/plans/patient-003-operator-review-checklist.md` as the immediate gate. If the external reviewer passes `patient_003`, execute `.omx/plans/plan-patient-004-cardiac-renal-med-management.md` via `$ralph`.

Pros:

- Preserves momentum with a ready patient_004 plan.
- Prevents obvious pattern mistakes from spreading.
- Keeps scope narrow and verifiable.
- Aligns with the current corpus packet, where patient_003 is pending and patient_004 is proposed.

Cons:

- Temporarily waits on reviewer output.
- If review is slow, code-generation progress pauses.

#### Option B — Patch patient_003 first if review is conditional/fail, then re-run the gate

Approach: If review returns corrections, apply only patient_003-owned corrections plus required semantic-test/corpus-packet updates, re-run full verification, then reconsider patient_004.

Pros:

- Converts clinical review feedback into a better reusable fixture pattern.
- Keeps the corpus evidence clean.
- Prevents patient_004 from inheriting package/test defects.

Cons:

- Delays scenario breadth.
- May require reworking patient_003 artifacts and tests before any new row appears.

#### Option C — Generate patient_004 immediately while review runs (rejected for now)

Approach: Execute the patient_004 plan now in parallel with external patient_003 review.

Pros:

- Fastest visible corpus expansion.
- Uses the already prepared patient_004 plan.

Cons:

- Risks duplicating a flawed pattern before operator feedback.
- Makes future corrections broader and less attributable.
- Violates the review-gate principle unless the user explicitly chooses speed over quality.

#### Option D — Skip to broad backlog/PRD cleanup before patient_004 (defer)

Approach: Stop corpus generation and return to backlog/PRD/ADR018-019 reconciliation work.

Pros:

- May reduce strategic confusion.
- Could clean up board state before more fixtures are added.

Cons:

- Loses the current patient-generation momentum.
- Does not use the fresh patient_003 implementation learning.
- Provides less concrete progress today than one more reviewed/gated corpus row.

## RALPLAN-DR decision record

This is a planning decision record inside `.omx/plans/`; it is **not an ADR**, is not architecture authority, and does not create or imply `decisions/019-*`. Accepted architecture decisions remain under `decisions/` only.

### Decision

Use `patient_003` as the pilot gate. The next executable lane is **patient_004 cardiac/renal medication-management corpus row**, but only after the patient_003 operator review is pass/clean conditional pass, or after required patient_003 corrections are resolved.

### Drivers

- The corpus needs breadth beyond respiratory and infection/sepsis scenarios.
- Clinical realism review is now the scarce quality signal; machine checks alone are insufficient for declaring reviewed corpus progress.
- The patient_004 plan is already scoped, bounded, and aligned to the matrix gap around medication/MAR/reconciliation depth.

### Alternatives considered

- Generate patient_004 immediately: rejected because it can propagate patient_003 defects before review.
- Return to ADR018/019 planning/backlog cleanup first: rejected as lower momentum for today and not necessary before the patient_003 gate result.
- Create `decisions/019-*` now: rejected by explicit boundary and because corpus readiness remains incomplete.
- Touch `../pi-sim`: rejected by project boundary and user instruction.

### Why chosen

This plan turns the current uncertainty into a gate instead of a stall: review `patient_003`; if clean, generate exactly one new diverse row; if not, patch the pilot pattern before replication.

### Consequences

- No patient_004 fixture should be created during this planning lane.
- The external reviewer result for patient_003 becomes the next branch point.
- The project should maintain a one-row review rhythm until at least five reviewed rows exist.
- CORP-019 evidence improves incrementally without prematurely converting into ADR019.

### Patient_004 source-mix requirement

Before any future patient_004 generation, the Ralph lane must choose and document one source-mix posture:

- **Synthea-seeded**: record Synthea seed, version, parameters, what came from baseline Synthea content, and what was hand-crafted acute/EHR augmentation.
- **Fully hand-authored**: state explicitly that no Synthea seed was used and preserve operator clinical realism review as the quality gate.

Either posture is acceptable for the next row, but ambiguity is not: the corpus packet and patient package must identify the source mix so ADR019 readiness evidence is auditable later.

### Follow-ups

1. Collect patient_003 review verdict in `docs/plans/patient-003-operator-review-checklist.md` or a clearly linked review artifact.
2. If pass/clean conditional pass, execute patient_004 with `$ralph` using the command below.
3. If conditional/fail with structural concerns, patch patient_003 first using the correction command below.
4. After patient_004 is generated and machine-verified, create or update a patient_004 operator-review checklist/artifact before generating patient_005.
5. Require patient_004 operator review/signoff before patient_005 generation; the corpus packet row alone is not sufficient unless it explicitly records the same checklist fields.
6. Later, once patient_003 and patient_004 are both reviewed, revisit whether a small team lane is warranted for patient_005/patient_006 breadth.

## Acceptance criteria

This planning lane is complete when:

- A final plan is saved in `.omx/plans/ralplan-post-patient-003-next-steps.md`.
- The plan has a RALPLAN-DR summary, decision record, branch logic, executable handoff commands, and verification path.
- Architect and Critic review approve the plan or their required improvements are incorporated.
- No patient fixture/source files are modified by this planning lane.
- `find decisions -maxdepth 1 -name '019-*' -print` returns no output.

The future patient_004 execution lane is complete only when:

- `patients/patient_004/**` exists with chart-visible six-surface evidence.
- `pi-chart.yaml`, `src/views/memoryProof.test.ts`, and `docs/plans/clinical-fidelity-corpus-review-adr-019.md` are updated only for patient_004 scope.
- `npm run rebuild`, `npm run validate`, `npm run typecheck`, `npm test`, and `find decisions -maxdepth 1 -name '019-*' -print` pass / produce no forbidden decision output.
- Patient_004 is marked generated/operator-review-pending, not reviewed/pass.

## Boundary-audit preflight for any future Ralph lane

Every future execution handoff from this plan must start and finish with auditable boundary evidence:

```bash
git status --short -- . ../pi-sim
find decisions -maxdepth 1 -name '019-*' -print
```

Execution owner must:

1. Capture the preflight dirty tree before edits.
2. Classify pre-existing dirty files, especially all `../pi-sim` entries, as unowned unless explicitly brought into scope by the user.
3. Keep the lane's allowed write set narrow and list it before editing.
4. Repeat the same commands at the end.
5. Final report must prove no new `../pi-sim` changes, no `decisions/019-*`, and no unexpected scope expansion.

## Implementation steps for next executable work

### Branch 1 — patient_003 review passes or has no structural corrections

Run:

```bash
$ralph Execute .omx/plans/plan-patient-004-cardiac-renal-med-management.md in /home/ark/pi-rn/pi-chart. First capture git status --short -- . ../pi-sim and classify pre-existing dirty files. Generate patient_004 only as the cardiac/renal medication-management corpus row and extend semantic corpus tests to patient_004. Document patient_004 source mix: either Synthea seed/version/parameters plus baseline-vs-hand-crafted augmentation, or explicitly fully hand-authored/no Synthea seed. Do not touch ../pi-sim, do not create decisions/019-*, do not start clean-slate rewrite, and verify with npm run rebuild, npm run validate, npm run typecheck, npm test, final git status --short -- . ../pi-sim, and find decisions -maxdepth 1 -name '019-*' -print.
```

### Branch 2 — patient_003 review returns corrections first

Run:

```bash
$ralph Apply the patient_003 external review corrections in /home/ark/pi-rn/pi-chart before generating patient_004. First capture git status --short -- . ../pi-sim and classify pre-existing dirty files. Scope only to patient_003-owned files, corpus packet language, and semantic tests if required by the review. Do not touch ../pi-sim, do not create decisions/019-*, do not start clean-slate rewrite, and verify with npm run rebuild, npm run validate, npm run typecheck, npm test, final git status --short -- . ../pi-sim, and find decisions -maxdepth 1 -name '019-*' -print.
```

### Branch 3 — patient_003 review fails the generation pattern

Stop corpus generation and create a new `$ralplan` focused on repairing the patient package/test pattern before any patient_004 work.

## Verification plan

### For this planning lane

```bash
git diff --check -- .omx/plans/ralplan-post-patient-003-next-steps.md .omx/plans/plan-patient-004-cardiac-renal-med-management.md docs/plans/patient-003-operator-review-checklist.md
find decisions -maxdepth 1 -name '019-*' -print
```

### For the future patient_004 Ralph lane

```bash
npm run rebuild
npm run validate
npm run typecheck
npm test
git status --short -- . ../pi-sim
find decisions -maxdepth 1 -name '019-*' -print
```

Expected validation notes:

- `npm run validate` should report zero errors.
- Existing patient_002 day-prefix warnings may remain only if unrelated and pre-existing.
- `npm test` should remain fully green.
- The forbidden decisions find command should print nothing.

## Available-agent-types roster

Use these roles only when their lane materially helps:

- `executor` — implement a bounded fixture/test/docs lane such as patient_004.
- `test-engineer` — strengthen semantic guardrails if proof coverage becomes complex.
- `verifier` — independently check completion evidence after a Ralph lane.
- `architect` — review plan boundaries and whether the clinical-data architecture remains coherent.
- `critic` — challenge option consistency, scope creep, and verification sufficiency.
- `code-reviewer` — use after multiple patient rows or if fixture/test changes become broad.

## Follow-up staffing guidance

### Recommended `$ralph` path

Use one sequential `$ralph` owner for patient_004 after patient_003 gate passes.

Suggested lane allocation:

1. `executor` (medium reasoning): create patient_004 package, registry update, semantic test table addition, corpus packet row update.
2. `verifier` or architect review (high reasoning): inspect generated chart surfaces, hidden-state boundary, and verification output before cancellation.
3. Optional `test-engineer` (medium reasoning): only if semantic tests require new helper shape beyond the existing table-driven pattern.

Why Ralph: patient_004 is a single cohesive fixture lane with shared files (`pi-chart.yaml`, memory-proof tests, corpus packet). Sequential ownership reduces conflict and keeps clinical narrative consistent.

### Possible `$team` path later

Do not use team mode for immediate patient_004 unless patient_003 review is clean and the user explicitly chooses speed over simplicity. Team mode becomes useful later when generating multiple reviewed rows or splitting independent review/correction lanes.

Potential future team staffing after patient_004 is reviewed:

- Worker/executor lane A: patient_005 fixture package.
- Worker/test-engineer lane B: reusable semantic corpus-test expansion.
- Worker/writer lane C: corpus packet/review checklist updates.
- Verifier lane: aggregate rebuild/validate/typecheck/test evidence and forbidden-boundary checks.

Launch hint if that later becomes appropriate:

```bash
$team Execute the reviewed corpus expansion plan for patient_005/patient_006 only after patient_003 and patient_004 are reviewed. Keep fixture generation, semantic tests, and review docs in separate lanes; do not touch ../pi-sim, do not create decisions/019-*, and verify with npm run rebuild, npm run validate, npm run typecheck, npm test, and forbidden-decision checks before shutdown.
```

Team verification path:

1. Each lane reports changed files and local checks.
2. Team verifier runs aggregate rebuild/validate/typecheck/test.
3. Leader checks `find decisions -maxdepth 1 -name '019-*' -print` and `git status --short` for boundary violations.
4. Ralph or leader performs final clinical consistency review before declaring completion.

## Plan changelog

- 2026-04-28: Architect re-review APPROVED after boundary/source-mix/operator-review changes; Critic APPROVED the consensus plan.
- 2026-04-28: Initial consensus draft created after patient_003 Ralph completion report.
- 2026-04-28: Incorporated architect ITERATE feedback: renamed ADR-like heading, added source-mix requirement, patient_004 review artifact expectation, and preflight/final dirty-tree boundary audits.
- 2026-04-28: Applied architect non-blocking cleanup to replace residual “ADR” wording with “decision record” in acceptance criteria.
