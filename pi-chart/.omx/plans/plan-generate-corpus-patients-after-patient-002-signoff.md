# Plan — Generate corpus patients after patient_002 signoff

## Status

- Date: 2026-04-28
- Repo: `/home/ark/pi-rn/pi-chart`
- Mode: planning only; no patient fixture generation in this artifact.
- Trigger: same-thread operator signed off `patient_002` as the golden seed.
- Recommended next execution mode: `$ralph` for one patient at a time; use `$team` only if generating multiple rows in parallel after the first new row proves the pattern.

## Requirements summary

Generate enough reviewed patient rows to move CORP-019 from a strong seed state toward corpus readiness without confusing CORP-019 with ADR019.

Current count:

1. `patient_002` is now signed off as the golden seed, but it is still only one respiratory/sepsis-shock-family row.
2. CORP-019 still requires `>=5` reviewed patients plus ADR018 spike input before ADR019 can rely on the corpus.
3. `patient_001` exists but has known breadth gaps and should not be counted as a pass row unless explicitly upgraded and reviewed.
4. Minimum practical path: generate `patient_003`, `patient_004`, and `patient_005`, then either upgrade/review `patient_001` or generate `patient_006` if patient_001 remains too thin.

## Grounding facts

- CORP-019 is a prerequisite gate, not ADR019, and it does not authorize rewrite/importer/schema/fixture changes except in separately approved implementation lanes (`docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md:21-23`, `:43-58`).
- The gate requires all six observable surfaces per qualifying scenario: flowsheets/vitals, nursing assessment, notes/narrative, orders/meds/interventions, labs/diagnostics, and care plan/handoff (`docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md:80-91`).
- The matrix requires `>=5 patients`, varied admits, some multi-day encounters, provenance/timing, chain depth, follow-up notes, memory-proof output, and operator review (`docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md:93-110`).
- Memory-proof readiness requires six sections: what happened, why it mattered, evidence/provenance, uncertainty, open loops, and next-shift handoff (`docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md:112-123`).
- One-entry/many-projection proof requires one fact to be charted once and reused by review, narrative, open-loop, handoff, and corpus-packet evidence (`docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md:125-134`).
- Synthea is baseline/seeding evidence only; Synthea seed/version/parameters and hand-crafted acute augmentation must be distinguished, with no hidden simulator physiology counted as chart truth (`docs/plans/prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md:136-145`).
- `patient_002` has the current golden pattern: 96 event rows, 56 vitals samples, 10 timeline notes, indexed artifacts, memory-proof output, hidden-state exclusion, and tests around six-surface coverage and one-entry/many-projection reuse (`docs/plans/patient-002-golden-seed-review-packet.md:39-51`, `src/views/memoryProof.test.ts:61-72`, `:151-208`).
- `pi-chart.yaml` currently registers only `patient_001` and `patient_002`, while rebuild and validate scripts walk on-disk patient directories by default and accept `--patient` scoping (`pi-chart.yaml:4-14`, `scripts/rebuild-derived.ts:1-6`, `scripts/validate.ts:1-6`).
- Current scripts support rebuild/validate/check/typecheck/test gates (`package.json:7-18`).

## Decision

Adopt an incremental corpus-generation lane:

1. Use `patient_002` as the reference quality bar and signed golden seed.
2. Generate `patient_003` first as the pilot new corpus row.
3. After `patient_003` passes machine checks and operator review, generate `patient_004` and `patient_005` using the same pattern.
4. Decide whether to upgrade/review `patient_001` or generate `patient_006` to reach five reviewed rows.

Do not start ADR019, clean-slate rewrite, storage-port work, importer work, schema changes, or `../pi-sim` work in this lane.

## Target patient set

| Patient | Scenario family | Why this row exists | Required distinguishing evidence |
|---|---|---|---|
| `patient_002` | Respiratory worsening / sepsis-shock-adjacent golden seed | Signed reference row and memory-proof stress case | Already signed off for golden-seed use; not enough corpus alone. |
| `patient_003` | Infection escalation / sepsis physiology with ED-to-ICU transition | Broadens diagnostics, antimicrobial timing, fluids/pressors, reassessment, result-review loops | Multi-day or at least multi-shift course; cultures/lactate/antibiotics/fluids/pressor watch; order-action-result-review chain. |
| `patient_004` | Cardiac/renal medication-management | Forces MAR/reconciliation/hold/continue/admin semantics outside respiratory trend data | Home meds, renal labs, diuretic/ACE/anticoagulation decisions, held/administered meds, follow-up plan. |
| `patient_005` | Post-op/frailty/delirium/fall-risk continuity | Forces nursing assessment, functional baseline, safety constraints, handoff continuity, uncertainty | Baseline function, fall precautions, pain/delirium scoring, PT/OT/nursing notes, shift-to-shift open loops. |
| `patient_001` or `patient_006` | Upgrade existing respiratory seed or add a non-respiratory row | Reaches five reviewed rows without pretending patient_001 already passes | If patient_001: add/review missing labs/diagnostics, MAR/order semantics, handoff depth. If patient_006: choose a scenario not covered above, e.g. DKA, GI bleed, stroke/TIA, or COPD readmission with social constraints. |

Default: generate `patient_006` rather than forcing `patient_001` to pass if patient_001 needs heavy surgery. Keep patient_001 as seed evidence unless the upgrade is narrow and clinically honest.

## Patient package contract

Each generated patient must include at minimum:

1. `patients/patient_NNN/chart.yaml` with stable subject, sim-time clock, timezone, source-mix notes, and no hidden-state dependency.
2. `patients/patient_NNN/patient.md` with demographics/baseline context visible to the chart.
3. `patients/patient_NNN/constraints.md` with active constraints, allergies, code/status/relevant safety constraints where clinically relevant.
4. `patients/patient_NNN/timeline/<date>/encounter_*.md` for encounter metadata.
5. `patients/patient_NNN/timeline/<date>/events.ndjson` with typed events carrying `effective_at`/`recorded_at`, source, author, status/certainty, and links.
6. `patients/patient_NNN/timeline/<date>/vitals.jsonl` where vitals or flowsheet trend matters.
7. Narrative notes via chart-visible note files/events, enough to support memory-proof and handoff review.
8. `patients/patient_NNN/artifacts/index.json` plus labs/imaging/diagnostic/medication artifacts as needed.
9. Optional `patients/patient_NNN/scenario-blueprints/*.yaml` documenting generation intent.
10. Generated `_derived/**` only from `npm run rebuild`, never hand-edited as chart truth.

Registry note: because `listPatientIds` currently uses on-disk patient directories for rebuild/validation, new patients can be validated once their directories exist. Still update `pi-chart.yaml` so registry/session surfaces do not lag behind the generated corpus.

## Implementation plan

### Step 0 — Preserve state and boundaries

Actions:
- Capture `git status --short -- .` and classify pre-existing dirty files.
- Do not touch `../pi-sim`.
- Do not create `decisions/019-*`.
- Do not edit schemas, importers, package files, or source unless the specific execution lane authorizes machine tests for generated patients.

Acceptance:
- Execution report lists owned files before edits.
- `find decisions -maxdepth 1 -name '019-*' -print` is empty.

### Step 1 — Convert patient_002 signoff into the planning baseline

Actions:
- Treat `docs/plans/patient-002-golden-seed-review-packet.md` as the quality bar.
- Keep corpus packet language clear: `patient_002` is signed, CORP-019 still fail/incomplete.
- Use `patient_002` event/vital/note/artifact density as target shape, not exact clinical content.

Acceptance:
- `docs/plans/clinical-fidelity-corpus-review-adr-019.md` says patient_002 is signed only as golden seed and still not sufficient readiness.

### Step 2 — Build `patient_003` as the pilot row

Actions:
- Create infection/sepsis escalation package under `patients/patient_003/**`.
- Add `patient_003` to `pi-chart.yaml` with display name, directory, created date, and source metadata.
- Include at least two chart days or multiple shifts in one day if two days would be artificial.
- Include six surfaces: vitals/flowsheet trend, bedside nursing assessment, serial notes, orders/meds/interventions, labs/diagnostics, care plan/handoff.
- Include one-entry/many-projection proof fact, e.g. one documented hypotension/lactate/perfusion finding reused across review, narrative, open loop, handoff, and evidence chain.
- Run `npm run rebuild`, `npm run validate`, `npm run typecheck`, and targeted tests.

Acceptance:
- `patient_003` appears in `patients/` with valid chart files.
- `_derived/memory-proof.md` exists after rebuild and has all six required review sections.
- Validation passes with zero errors.
- Operator can review patient_003 from a packet row without hidden simulator state.

### Step 3 — Add machine guardrails for multi-patient corpus rows

Actions:
- Add or extend tests near `src/views/memoryProof.test.ts` to cover each generated patient's six-surface presence, memory-proof required sections, hidden-state exclusion, and one-entry/many-projection reuse.
- Prefer table-driven tests keyed by patient id and scenario-specific proof event ids.
- Avoid brittle full-output snapshots; assert semantic presence of event types, notes, sections, and reuse links.

Acceptance:
- Tests fail if a generated patient lacks any required surface.
- Tests fail if hidden simulator/private state leaks into memory-proof output.
- Tests pass for patient_002 and the new pilot row.

### Step 4 — Generate `patient_004` and `patient_005`

Actions:
- Use the patient_003 package/test pattern.
- `patient_004`: prioritize medication reconciliation, MAR/hold/admin/order semantics, renal/cardiac lab timing, and follow-up plan changes.
- `patient_005`: prioritize nursing continuity, functional baseline, safety/fall/delirium constraints, therapy/nursing/provider notes, and shift handoff.
- Add each generated patient to `pi-chart.yaml` as part of the same patient-specific lane.
- Rebuild and validate after each patient, not only at the end.

Acceptance:
- Each row passes validation independently.
- Each row has a corpus matrix update and operator-review checklist.
- Each row includes a distinct one-entry/many-projection proof fact.

### Step 5 — Decide fifth reviewed row: upgrade `patient_001` or generate `patient_006`

Decision rule:
- Upgrade `patient_001` only if the missing surfaces can be fixed without turning it into a second patient_002 clone.
- Generate `patient_006` if patient_001 would need broad artificial surgery or remains too respiratory-focused.

Acceptance:
- Five reviewed rows exist or the corpus packet clearly records why readiness remains blocked.
- No row passes by waiver unless the operator explicitly records waiver fields required by the PRD.

### Step 6 — Update corpus review packet

Actions:
- Update `docs/plans/clinical-fidelity-corpus-review-adr-019.md` matrix rows with actual status, surfaces, provenance/timing, chain depth, memory proof, operator review, gaps, and ADR019 implication.
- Add per-patient review packet docs if a single file becomes too dense.
- Keep ADR019 language defensive: the packet can support future ADR019, but it is not ADR019.

Acceptance:
- A reader can identify pass/partial/gap per patient and per surface.
- The packet still says CORP-019 cannot pass without ADR018 spike input.

### Step 7 — Verification and closeout

Run, read, and report:

```bash
npm run rebuild
npm run validate
npm run typecheck
npm test
```

Also run:

```bash
find decisions -maxdepth 1 -name '019-*' -print
```

Acceptance:
- Rebuild/validate/typecheck/tests pass.
- No `decisions/019-*` exists.
- Final report lists changed files, patient rows generated, operator review state, and remaining risks.

## Acceptance criteria

1. `patient_002` remains signed golden seed, not sufficient corpus.
2. At least three new patient packages are generated before claiming corpus breadth progress.
3. Every generated patient has all six surfaces represented by chart-visible evidence.
4. Every generated patient has memory-proof output with six required sections.
5. Every generated patient has one charted fact reused across multiple projections.
6. Every generated patient has source/timing/provenance and no hidden-state leakage.
7. `docs/plans/clinical-fidelity-corpus-review-adr-019.md` reflects current pass/partial/gap state.
8. `npm run rebuild`, `npm run validate`, `npm run typecheck`, and `npm test` pass before completion.
9. No `../pi-sim` work, no clean-slate rewrite, and no `decisions/019-*` work occurs in this lane.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| New patients become copy-paste variants of patient_002 | Lock different scenario families and proof facts before fixture edits. |
| Synthea-like volume gets mistaken for clinical fidelity | Require operator review and hand-crafted acute augmentation notes. |
| Patient generation bloats into schema/importer work | Generate using existing chart package shape first; defer importer/schema changes. |
| Tests become brittle snapshots | Use semantic table-driven tests for surfaces, sections, proof facts, and hidden-state exclusion. |
| Five-row pressure causes weak patient_001 overclaim | Use patient_006 if patient_001 cannot honestly pass. |
| ADR019 confusion returns | Keep every packet labeled CORP-019 gate / not ADR019 / no rewrite authorization. |

## Recommended execution handoff

Use Ralph for the pilot row:

```bash
$ralph Execute .omx/plans/plan-generate-corpus-patients-after-patient-002-signoff.md in /home/ark/pi-rn/pi-chart. Implement Step 2 and Step 3 only: generate patient_003 as the pilot corpus row and add semantic tests for patient_002 + patient_003. Do not touch ../pi-sim, do not create decisions/019-*, do not start clean-slate rewrite, and verify with npm run rebuild, npm run validate, npm run typecheck, and npm test.
```

After patient_003 passes, repeat for patient_004 and patient_005. Do not parallelize fixture generation until patient_003 proves the pattern and tests.

## Staffing guidance

Solo/Ralph path:
- `executor`: generate patient package and docs row.
- `test-engineer`: add semantic corpus tests after patient_003 shape is stable.
- `verifier`: run rebuild/validate/typecheck/tests and no-ADR019/no-pi-sim checks.
- `critic` or `architect`: check no overclaim, no hidden-state leak, no ADR019/rewrite drift.

Team path after pilot:
- 1 executor per patient row, with disjoint ownership under `patients/patient_004/**` and `patients/patient_005/**`.
- 1 test-engineer owning shared tests.
- 1 verifier owning final full-suite gates and corpus packet consistency.

Do not run multiple patient executors before patient_003 establishes the accepted package/test pattern.
