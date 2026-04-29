# RALPLAN — Complete 5-patient CORP-019 corpus buildout

## Status

- Date: 2026-04-28
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan --consensus` initial planner artifact; planning only.
- Grounding snapshot: `.omx/context/complete-5-patient-corpus-buildout-20260428T232336Z.md`
- Prior plans: `.omx/plans/plan-generate-corpus-patients-after-patient-002-signoff.md`, `.omx/plans/ralplan-post-patient-003-next-steps.md`, `.omx/plans/plan-patient-004-cardiac-renal-med-management.md`

## RALPLAN-DR summary

### Principles

1. **Chart-visible truth only**: corpus evidence must come from patient package chart artifacts, not `../pi-sim` or hidden simulator/private state.
2. **Review gates are real gates**: `patient_003` and `patient_004` stay `operator-review-pending`; machine verification is not clinical signoff.
3. **One patient row at a time unless lanes are independent**: create `patient_005` without broadening into ADR019, schema/importer, or cleanup work.
4. **Corpus packet honesty**: update CORP-019 evidence defensively; do not claim ADR019 readiness or create `decisions/019-*`.
5. **Reuse the proven package/test pattern**: follow `patient_003`/`patient_004` structure, extending only the registry, corpus packet, checklist, and semantic proof table needed for `patient_005`.

### Top decision drivers

1. **Reach the minimum 5-row corpus shape** while clearly distinguishing generated rows from reviewed rows.
2. **Add a new clinical memory axis**: post-op/frailty/delirium/fall-risk continuity stresses function, safety, nursing/therapy notes, uncertainty, and handoff continuity beyond respiratory, infection, and cardiac/renal cases.
3. **Keep the execution lane bounded and auditable** with no `../pi-sim`, no `decisions/019-*`, no package/schema/importer changes, and full verification evidence.

### Viable options

#### Option A — Recommended: sequential Ralph lane for `patient_005`, then review-gate triage

Create `patient_005` as a post-op/frailty/delirium/fall-risk continuity row, register it, add memory-proof semantic coverage, update the CORP-019 packet to generated/operator-review-pending, and create a `patient_005` operator-review checklist.

Pros:
- Fastest bounded path to a 5-patient generated corpus shape.
- Lowest coordination overhead and easiest boundary audit.
- Avoids spreading any future operator corrections across parallel edits.
- Preserves the existing green verification baseline.

Cons:
- Leaves `patient_003`, `patient_004`, and `patient_005` pending operator review.
- Does not by itself make CORP-019 pass or ADR019 ready.

#### Option B — Parallel team lane: one delivery worker, one evidence/checklist worker, one verification worker

Run `$team` with separated lanes: generate `patient_005`, update docs/checklists, and independently verify/review boundary evidence.

Pros:
- Faster wall-clock completion for fixture/docs/tests if workers stay inside disjoint write sets.
- Gives independent verification attention while implementation is still fresh.
- Useful if operator wants a same-session corpus packet and review artifact package.

Cons:
- Higher coordination risk in shared files: `pi-chart.yaml`, `src/views/memoryProof.test.ts`, and `docs/plans/clinical-fidelity-corpus-review-adr-019.md` need single-owner edits or careful sequencing.
- More overhead than the actual corpus-row size may justify.

#### Option C — Pause generation until patient_003 and patient_004 operator reviews finish

Wait for clinical review results, patch any corrections, then create `patient_005` from the corrected pattern.

Pros:
- Highest clinical-fidelity discipline.
- Prevents repeated mistakes if reviews find structural problems.

Cons:
- Delays reaching the 5-row generated corpus shape.
- Current machine checks already show patient_003/004 pattern viability; waiting blocks a bounded row that remains honestly review-pending.

### Rejected/deferred alternatives

- **Create `decisions/019-*` now**: rejected. Corpus remains incomplete/review-pending and the user explicitly forbids it.
- **Touch `../pi-sim` or use hidden simulation state**: rejected. Violates project boundary and chart-truth constraint.
- **Upgrade `patient_001` instead of creating `patient_005`**: deferred. It may be useful later, but current plan needs a distinct post-op/frailty/delirium row and should not turn into broad fixture surgery.
- **Generate `patient_006` now**: deferred. Only needed if operator review rejects one of the five rows or breadth remains inadequate after `patient_005`.
- **Schema/importer/package dependency changes**: rejected for this lane. Existing patient package pattern and verification harness are sufficient.

## Recommended implementation sequence

### Exact allowed write set

Execution may write only:

- `.omx/plans/plan-patient-005-postop-frailty-delirium.md`
- `patients/patient_005/**`
- `pi-chart.yaml`
- `src/views/memoryProof.test.ts`
  - Add `patient_005` to the corpus table.
  - Rename any table-driven test wording that says reviewed corpus fixtures to machine-verified/generated corpus fixtures, because `patient_003`/`patient_004`/`patient_005` are not operator-reviewed.
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-005-operator-review-checklist.md`
- generated derived outputs under `patients/patient_005/_derived/**` from `npm run rebuild`

Execution must not write:

- `../pi-sim/**`
- `decisions/019-*`
- package/dependency files
- schema/importer/runtime infrastructure files
- existing patient directories except read-only reference use of `patient_003`/`patient_004`

### Steps

1. **Boundary preflight and dirty-diff ledger**
   - Run and capture:
     ```bash
     git status --short -- . ../pi-sim
     find decisions -maxdepth 1 -name '019-*' -print
     git diff -- pi-chart.yaml src/views/memoryProof.test.ts docs/plans/clinical-fidelity-corpus-review-adr-019.md
     ```
   - Classify pre-existing dirty files as unowned unless in the allowed write set.
   - Before editing allowed shared files, preserve unrelated existing changes from the captured diff; do not overwrite operator or prior-agent work.

2. **Create a patient_005 micro-plan**
   - Save `.omx/plans/plan-patient-005-postop-frailty-delirium.md` with scenario, source-mix posture, required six surfaces, proof fact, and verification checklist.
   - Recommended scenario: older post-op patient with baseline frailty, fluctuating delirium risk, pain/sedation balance, mobility constraints, fall precautions, PT/OT/nursing continuity, and next-shift safety/open-loop handoff.

3. **Build the `patient_005` package**
   - Use `patient_003`/`patient_004` package shape.
   - Include chart-visible provenance and source mix. Either fully hand-authored/no Synthea seed, or Synthea-seeded with seed/version/parameters and baseline-vs-augmentation split.
   - Minimum evidence: vitals/flowsheets; bedside nursing assessment; provider/nursing/PT-or-OT notes; orders/meds/interventions; labs/diagnostics if clinically needed; care plan/handoff.
   - Required proof fact: one charted fall/delirium/functional-safety fact reused by review, evidence, open loop, handoff, narrative note, and corpus packet row.

4. **Register and test semantic memory proof**
   - Add `patient_005` to `pi-chart.yaml`.
   - Extend `src/views/memoryProof.test.ts` corpus table with `patient_005` encounter/asOf/proofFactId/proofFactLabel.
   - Rename the corpus table-driven test from reviewed wording to machine-verified/generated wording if it still says reviewed corpus fixtures.
   - Reuse existing table-driven assertions; avoid brittle full-output snapshots.

5. **Update CORP-019 packet and checklist**
   - Update `docs/plans/clinical-fidelity-corpus-review-adr-019.md` row for `patient_005` from proposed to generated/operator-review-pending after machine checks support it.
   - Create `docs/plans/patient-005-operator-review-checklist.md` with reviewer identity/role/date, pass/conditional/fail, corrections, proceed/stop decision, and specific questions for post-op/frailty/delirium/fall-risk realism.
   - Keep packet status fail/incomplete or review-pending; do not claim ADR019 readiness.

6. **Verify and report boundary evidence**
   - Run the commands below.
   - Final report must state patient_003/004/005 are generated/machine-verified but operator-review-pending unless operator review has actually occurred.
   - Repeat boundary checks and prove no `../pi-sim` edits and no `decisions/019-*`.

## Acceptance criteria

- `patients/patient_005/**` exists and follows existing corpus package conventions.
- `pi-chart.yaml` lists `patient_001` through `patient_005`.
- `src/views/memoryProof.test.ts` covers `patient_002`, `patient_003`, `patient_004`, and `patient_005` in the corpus table.
- `patient_005/_derived/memory-proof.md` exists after rebuild and includes the six required memory-proof sections.
- CORP-019 packet records `patient_005` as generated/operator-review-pending, not reviewed/pass.
- `docs/plans/patient-005-operator-review-checklist.md` exists.
- No `../pi-sim` files are touched by the lane.
- `find decisions -maxdepth 1 -name '019-*' -print` outputs nothing.
- Verification remains green: validate has 0 errors; pre-existing patient_002 warnings may remain if unchanged; typecheck passes; tests pass.

## Verification commands

Run and read output:

```bash
git status --short -- . ../pi-sim
find decisions -maxdepth 1 -name '019-*' -print
npm run rebuild -- --patient patient_005
npm run validate
npm run typecheck
npm test
find decisions -maxdepth 1 -name '019-*' -print
git status --short -- . ../pi-sim
```

Expected current baseline before `patient_005`: `npm run validate` passes with 0 errors / 20 pre-existing patient_002 warnings, `npm run typecheck` passes, and `npm test` passes 389/389. Use scoped rebuild so generated writes stay under `patients/patient_005/_derived/**`; after adding `patient_005`, tests may increase, but all must pass.

## Follow-up staffing guidance

### Available agent-types roster

Use only known session roster types:

- `executor` — implementation and fixture/docs/test edits.
- `test-engineer` — test strategy, regression coverage, verification commands.
- `verifier` — final evidence review and boundary/acceptance validation.
- `architect` — post-plan or post-implementation soundness review if scope grows.
- `critic` — consistency check against RALPLAN-DR principles and no-overclaim boundaries.
- `explore` — read-only file/symbol mapping.
- `writer` — checklist/corpus packet wording if separated from implementation.

### `$ralph` sequential execution recommendation

Best default: one `executor`-owned Ralph lane, with later `verifier` or `architect` signoff.

Suggested launch:

```bash
$ralph Execute .omx/plans/ralplan-complete-5-patient-corpus-buildout.md in /home/ark/pi-rn/pi-chart. Use the exact allowed write set only. Create patient_005 as the post-op/frailty/delirium/fall-risk continuity corpus row; register it; extend memoryProof corpus semantics; update the CORP-019 packet defensively; create patient-005 operator-review checklist. Do not touch ../pi-sim, do not create decisions/019-*, do not change package/schema/importer files, and do not claim ADR019 readiness. Verify with npm run rebuild -- --patient patient_005, npm run validate, npm run typecheck, npm test, boundary git status, dirty-diff ledger preservation, and find decisions -maxdepth 1 -name '019-*' -print.
```

Reasoning guidance:
- Implementation lane: `executor`, medium reasoning.
- Verification/signoff lane: `verifier` or `architect`, high reasoning.
- Use sequential execution because shared files are few and easy to review.

### `$team` parallel execution recommendation

Use only if the operator wants faster wall-clock and accepts coordination overhead. Keep single-owner control over shared files.

Recommended staffing: `omx team 3:executor "Complete the patient_005 CORP-019 corpus row from .omx/plans/ralplan-complete-5-patient-corpus-buildout.md with strict allowed write set, no ../pi-sim, no decisions/019-*, and full verification using scoped rebuild."`

Role allocation inside the team:

1. **Worker 1 — fixture executor, medium reasoning**
   - Owns `patients/patient_005/**` and `.omx/plans/plan-patient-005-postop-frailty-delirium.md`.
2. **Worker 2 — docs/tests executor, medium reasoning**
   - Owns `pi-chart.yaml`, `src/views/memoryProof.test.ts`, `docs/plans/clinical-fidelity-corpus-review-adr-019.md`, and `docs/plans/patient-005-operator-review-checklist.md` after Worker 1 publishes proofFactId/asOf/encounterId.
3. **Worker 3 — verification executor, high reasoning behavior even if launched as executor**
   - Owns command verification, boundary checks, and acceptance report. Does not edit except for a final evidence note if explicitly assigned.

Team verification path:

- Require Worker 1 to report exact proof fact, encounter id, and asOf before Worker 2 edits tests.
- Require Worker 2 to rename reviewed-test wording to machine-verified/generated wording when extending `src/views/memoryProof.test.ts`, then run focused test if available, then full commands.
- Require Worker 3/final leader to run full verification independently and inspect output.
- Shutdown team only after pending=0, in_progress=0, failed=0 and final boundary checks are clean.

## ADR boundary note

This plan is a RALPLAN planning artifact, not an ADR. It completes a generated five-patient CORP-019 corpus shape only if executed successfully. It does not declare CORP-019 pass, does not satisfy operator review, and does not authorize ADR019 readiness or any `decisions/019-*` file.
