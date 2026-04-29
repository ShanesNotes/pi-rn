# RALPLAN — Revise CORP-019 corpus after only `patient_002` and `patient_004` signoff

> **SUPERSEDED:** Use `.omx/plans/ralplan-deepen-existing-corp019-nonpassing-rows.md` instead. User clarified they do not want replacement patients; deepen existing non-passing rows in place.

## Status

- Date: 2026-04-28/29
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: `$ralplan` continuation; planning only.
- Context snapshot: `.omx/context/revise-corp019-corpus-two-signed-off-20260429T014725Z.md`
- Trigger: operator indicates only `patient_002` and `patient_004` will be signed off from the current five-row group.

## RALPLAN-DR summary

### Principles

1. **Operator signoff is the gate**: generated/machine-verified rows are useful, but they are not reviewed corpus pass evidence.
2. **Keep work repo-local for canonical state**: use this repo for edits, validation, provenance, and packet updates; external AI may critique but cannot replace in-repo verification or operator signoff.
3. **Do not overclaim ADR019 readiness**: two signed anchors are progress, not readiness.
4. **Replace unknown-bad rows instead of patching blindly**: if rejection reasons for `patient_003`/`patient_005` are not explicit, create cleaner replacement rows rather than guessing repairs.
5. **Stabilize before expanding**: confirm/freeze `patient_004` as a reviewed, validation-stable anchor before generating more rows; repair only if validation drift reproduces.

### Decision drivers

1. Need five reviewed/signoff-ready rows; current operator-approved set is only `patient_002` + `patient_004`.
2. Recent validation may be green again, but prior `patient_004` drift was observed; `patient_004` must be confirmed/frozen as a validation-stable anchor before counting as the second reviewed row.
3. External web ChatGPT/Claude lacks repo-local validation, dirty-state, and ADR boundary context.

### Viable options

#### Option A — Recommended: repo-local Ralph lane, stabilize anchors then generate three replacement candidates

Use this repo to record `patient_002` and `patient_004` as accepted anchors, mark `patient_003`/`patient_005` as not accepted for CORP-019 reviewed evidence, stabilize `patient_004` validation drift, then create replacement candidates `patient_006`, `patient_007`, and `patient_008` with distinct clinical axes.

Pros:
- Fastest path to five reviewed candidates without guessing why rejected rows failed.
- Keeps canonical docs/tests/validation in one place.
- Preserves rejected rows for learning without counting them.
- Avoids external context loss.

Cons:
- More generated rows to review.
- Requires operator review of three new rows.
- If `patient_003`/`patient_005` failed for fixable small reasons, replacement may be more work than repair.

#### Option B — Repair `patient_003` and `patient_005` in-place after operator rejection notes

Collect concrete operator objections, then revise the existing generated rows to address them.

Pros:
- Potentially less fixture volume.
- Preserves existing row IDs and prior machine-proof tests.
- Best if rejection reasons are narrow and objective.

Cons:
- Current user signal says only `patient_002` and `patient_004` will be signed off, so repair without detailed objection notes risks guessing.
- In-place repairs can blur rejected-vs-accepted evidence history unless docs are carefully updated.

#### Option C — Send to external ChatGPT/Claude for clinical critique first

Export de-identified patient packets and ask external AI for realism critique before repo work.

Pros:
- May catch clinical narrative weaknesses.
- Useful as a second-opinion critique on row realism.

Cons:
- Cannot update repo docs/tests or validate.
- Cannot replace operator signoff.
- High risk of stale/incomplete context unless the full corpus packet and patient artifacts are pasted.
- Adds latency before canonical work.

## ADR

### Decision

Proceed **in this repo** with a repo-local Ralph execution plan. External ChatGPT/Claude is optional for secondary critique only, not the source of truth.

### Drivers

- Canonical corpus state lives in `pi-chart` docs, patient packages, tests, and validation output.
- Operator signoff is human/accountable; model critique is advisory.
- The current two signed anchors require three more reviewed rows, not just generic advice.

### Alternatives considered

- External-only critique: rejected because it cannot maintain repo state or validate.
- Blindly repair `patient_003`/`patient_005`: deferred until operator supplies specific rejection notes.
- Claim readiness with two signed rows: rejected; violates CORP-019 gate.

### Why chosen

The safest next move is to freeze the two accepted anchors, explicitly downgrade rejected/unaccepted generated rows, and generate replacement candidates with clean provenance and tests.

### Consequences

- `patient_003` and `patient_005` remain useful generated evidence but are not counted as reviewed pass evidence.
- `patient_004` becomes a reviewed anchor only after current validation drift is stabilized and signoff is recorded.
- Three additional rows are needed for the five-reviewed-row gate.

### Follow-ups

- Operator should review replacement rows with checklist pass / conditional pass / fail.
- If operator later provides concrete objections for `patient_003`/`patient_005`, add a separate repair lane.

## Recommended execution sequence

### Phase 0 — Boundary + validation preflight

Capture current dirty ledger before edits:

```bash
git status --short -- . ../pi-sim
find decisions -maxdepth 1 -name '019-*' -print
npm run validate
npm run validate -- --patient patient_004
```

Expected now: validation may already be green. If `patient_004` drift does not reproduce, do not perform unnecessary fixture surgery; freeze the passing package and proceed to signoff-ledger updates. If it does reproduce, repair only `patient_004` validation errors before expanding.

### Phase 1 — Confirm/freeze signed anchors

Execution gate: this plan uses the existing CORP-019 PRD/test-spec pair as the planning gate unless a future `$ralph --prd` launch explicitly creates a new PRD pair:

- `docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`
- `docs/plans/test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`

Write set:

- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-004-operator-review-checklist.md`
- `patients/patient_004/**` only as needed to make the signed-off package validate
- generated `patients/patient_004/_derived/**` from rebuild

Tasks:

1. Record `patient_004` operator signoff only if the user explicitly confirms pass/conditional pass text.
2. Run `npm run validate -- --patient patient_004` and `npm run validate`.
3. If `patient_004` validation is green, freeze it and avoid fixture surgery.
4. If `patient_004` validation drift reproduces, repair only the reproduced errors, such as duplicate structural IDs, invalid fulfillments, missing note bodies, and derived outputs after rebuild.
5. Keep `patient_002` signed-off golden seed unchanged unless only docs need cross-reference updates.

Acceptance:

- `npm run validate -- --patient patient_004` passes with 0 errors.
- Packet signoff ledger explicitly says: accepted anchors are `patient_002` and `patient_004`; not accepted for reviewed evidence are `patient_003` and `patient_005`; pending review are `patient_006`, `patient_007`, and `patient_008` after generation. It must still say this is not full readiness.

### Phase 2 — Mark non-accepted generated rows honestly

Write set:

- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-003-operator-review-checklist.md`
- `docs/plans/patient-005-operator-review-checklist.md`

Tasks:

1. Mark `patient_003` as generated/machine-verified but **not operator accepted for reviewed corpus evidence**.
2. Mark `patient_005` the same way.
3. Add explicit signoff-ledger fields: `operator_status: not_accepted_for_reviewed_corpus_evidence` or equivalent prose in checklists/packet.
4. Do not delete rows; retain them as generated artifacts and learning material.
5. Add a field for rejection reason if operator later supplies one.

Acceptance:

- No doc wording implies `patient_003`/`patient_005` count toward reviewed five-row readiness.
- The corpus packet shows the explicit ledger: accepted (`patient_002`, `patient_004`), not accepted (`patient_003`, `patient_005`), pending (`patient_006`-`patient_008`).

### Phase 3 — Generate three replacement candidates

Preferred new rows:

1. `patient_006` — neurologic/medication safety row: acute stroke/TIA mimic vs metabolic encephalopathy, anticoagulation/bleed-risk, neuro checks, imaging/lab review, handoff uncertainty.
2. `patient_007` — endocrine/infection row: DKA/HHS or severe hypoglycemia with infection trigger, insulin/fluids/electrolyte chain, nursing monitoring, next-shift electrolyte/glucose loops.
3. `patient_008` — surgical/complex discharge row: post-op complication or wound/drain/antibiotic/discharge planning row with PT/OT, home support, medication reconciliation, and follow-up handoff.

Write set per row:

- `.omx/plans/plan-patient-00X-*.md`
- `patients/patient_00X/**`
- `pi-chart.yaml`
- `src/views/memoryProof.test.ts`
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md`
- `docs/plans/patient-00X-operator-review-checklist.md`
- generated `patients/patient_00X/_derived/**`

Constraints:

- No `../pi-sim/**`.
- No `decisions/019-*`.
- No package/schema/importer/runtime changes.
- Each row gets one proof fact reused across assessment, evidence, open loop, narrative note, handoff, and corpus packet.

Acceptance per row:

- Scoped rebuild passes.
- Scoped validate passes.
- `memoryProof.test.ts` corpus table covers it.
- Checklist exists and says operator-review-pending until human signoff.

### Phase 4 — Review packet readiness gate

After operator reviews replacements:

- If five rows pass/conditional pass: update corpus packet as reviewed-ready evidence, still pending ADR018 spike input.
- If fewer than five rows pass: generate another replacement row or repair a failed row with explicit operator objections.

## Verification commands

Run at each execution pass:

```bash
find decisions -maxdepth 1 -name '019-*' -print
git status --short -- . ../pi-sim
npm run rebuild -- --patient patient_004
npm run validate -- --patient patient_004
npm run rebuild -- --patient patient_006
npm run validate -- --patient patient_006
npm run rebuild -- --patient patient_007
npm run validate -- --patient patient_007
npm run rebuild -- --patient patient_008
npm run validate -- --patient patient_008
npm run typecheck
npm test
npm run validate
```

`npm run validate` must be green before claiming corpus build health. If unrelated dirty rows fail, report them separately and do not claim full readiness.

## Available-agent-types roster

- `executor` — fixture/docs/test edits.
- `test-engineer` — verification and regression coverage.
- `verifier` — boundary and acceptance validation.
- `architect` — review clinical-corpus structure and overclaim risks.
- `critic` — challenge plan honesty and readiness wording.
- `writer` — operator checklist and packet wording.
- `explore` — read-only mapping of current patient package state.

## Follow-up staffing guidance

### Recommended `$ralph` path

Use one sequential owner because shared files are central and operator-signoff wording is sensitive.

Suggested launch:

```text
$ralph Execute .omx/plans/ralplan-revise-corp019-two-signed-anchors.md in /home/ark/pi-rn/pi-chart. First confirm/freeze patient_004 validation, repairing it only if drift reproduces, and record only explicitly confirmed patient_002/patient_004 signoff using the existing CORP-019 PRD/test-spec gate. Mark patient_003 and patient_005 as generated but not accepted for reviewed CORP-019 evidence. Then generate replacement candidates patient_006, patient_007, and patient_008 with distinct clinical axes and operator-review checklists. Do not touch ../pi-sim, do not create decisions/019-*, and do not claim ADR019 readiness. Verify scoped rebuild/validate for each touched patient, typecheck, tests, full validate, boundary git status, and forbidden-decision check.
```

### Optional `$team` path

Use only if speed matters and shared-file ownership is explicit.

- Worker 1: stabilize `patient_004` only.
- Worker 2: replacement row `patient_006` only.
- Worker 3: replacement row `patient_007` only.
- Worker 4: replacement row `patient_008` only.
- Leader/writer: owns shared `pi-chart.yaml`, `src/views/memoryProof.test.ts`, corpus packet, and checklist wording.
- Verifier: runs final commands and boundary checks.

Team verification path: each worker proves scoped rebuild/validate; leader runs full typecheck/tests/validate and confirms no `../pi-sim` / `decisions/019-*` changes.

## External AI guidance

Use web ChatGPT/Claude only for a **secondary clinical realism critique** after exporting a bounded, de-identified packet. Do not use it as canonical state or signoff. Any useful critique must be brought back into this repo as operator-reviewed correction notes.

## Consensus iteration changelog

- Applied Architect ITERATE feedback: made `patient_004` drift repair conditional on reproduced validation failure.
- Added explicit signoff-ledger acceptance criteria: accepted `patient_002`/`patient_004`, not accepted `patient_003`/`patient_005`, pending `patient_006`-`patient_008`.
- Referenced the existing CORP-019 PRD/test-spec pair as the execution planning gate for future `$ralph` handoff.
