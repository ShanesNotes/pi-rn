# Plan — Normalize and split `patient_002_chart_v4.zip` across pi-chart / pi-sim

Date: 2026-04-28
Mode: `$plan` direct
Status: ready for execution handoff; no source/import changes made by this planning pass

## Requirements summary

Import the useful `patient_002_chart_v4.zip` draft without violating the project boundary between visible chart truth and hidden simulation truth.

The desired outcome is a normalized `pi-chart` patient fixture that can replace or supersede the current small `patients/patient_002` broad-EHR skeleton, plus a separately owned `pi-sim` hidden physiology/vitals-driver fixture. The import must preserve the v4 layer model:

1. initial visible backend chart at `2026-04-19T06:45:00-05:00`,
2. latent non-RN/system/provider EHR releases,
3. hidden expected RN/pi-agent charting for replay/scoring,
4. hidden physiology/reference truth for simulator/evaluator use only.

The plan intentionally starts with normalization/reporting and guardrail tests before moving files.

## Evidence base

- `README.md:53-72` defines `patients/<id>/` as a complete self-contained chart package with `chart.yaml`, `patient.md`, `constraints.md`, `timeline/`, `artifacts/`, and `_derived/`.
- `README.md:140-154` lists validation invariants, including patient isolation, link integrity, assessment support, import provenance, and typed fulfillment/closure.
- `README.md:210-224` states `pi-sim` is hidden, chart writes come from public monitor/patient/agent surfaces, and the agent never sees ground truth.
- `pi-chart.yaml:10-14` already registers `patient_002` as a synthetic broad EHR skeleton.
- `decisions/016-broad-ehr-skeleton-clinical-memory.md:35-42` requires the six observable EHR surfaces: vitals, nursing assessment, notes, orders/meds/interventions, labs/diagnostics, care/handoff.
- `decisions/016-broad-ehr-skeleton-clinical-memory.md:52-67` says hidden physiology never enters `pi-chart` or `pi-agent` context and must cross only explicit public adapters.
- `../pi-sim/README.md:146-152` assigns hidden patient-state/physiology to `pi-sim`, chart/EHR truth to `pi-chart`, and forbids `pi-agent` from scenario secrets.
- `schemas/event.schema.json:174-182` currently restricts `certainty` and envelope `status` to canonical enums.
- `src/validate.ts:107-132` defines the canonical source kind registry; `src/validate.ts:471-480` warns on unknown source kinds.
- `schemas/note.schema.json:7-23` requires note frontmatter `references` and `note_YYYYMMDDT...` style IDs.
- `schemas/vitals.schema.json:7-23` requires row-wise vitals with `sampled_at`, `subject`, `encounter_id`, `source`, `name`, and `value`, with `recorded_at`/`sample_key` as chart-ingest identity fields.
- `src/validate.ts:943-956` requires valid `chart.yaml` subject identity for each patient directory.
- `src/read.ts:41-66`, `src/read.ts:113-137`, `src/read.ts:172-188`, and `src/fs-util.ts:94-103` show read paths are centered on `patient.md`, `constraints.md`, `timeline/*/events.ndjson`, `timeline/*/vitals.jsonl`, and `timeline/*/notes`; no current read contract consumes `simulation/` layers.
- `src/validate.ts:1010-1012`, `src/validate.ts:1082-1209`, and `src/validate.ts:2626-2642` validate structural files, `timeline/`, notes/vitals, and `_derived/`, but not a layered `simulation/` package contract.
- Zip review found the draft's own validator passes, but current `pi-chart` schema rejects/flags major normalization gaps: noncanonical certainty/status/source kinds, note IDs/frontmatter, vitals row shape, missing `chart.yaml`, constraints type, encounter interval shape, and status-detail rules.

## RALPLAN-style decision summary

### Principles

1. Preserve the chart/simulator boundary before preserving directory convenience.
2. Make visible chart state valid under current `pi-chart` contracts before replacing the existing fixture.
3. Treat hidden expected charting and hidden physiology as evaluation/runtime assets, not ordinary chart truth.
4. Prefer explicit manifests/tests over convention-only exclusions.
5. Keep the first import reversible: stage under a candidate path or branch before replacing `patients/patient_002`.

### Decision drivers

1. Boundary safety: `pi-agent` must not see `hidden_truth`, `live_expected`, or reference completed chart material.
2. Validator compatibility: imported visible chart must pass current `npm run validate -- --patient patient_002` semantics before becoming canonical.
3. Fixture value: preserve the richer ICU story and six-surface broad EHR skeleton rather than reducing it to a few rows.

### Viable options

#### Option A — Normalize in place as `patients/patient_002` with `simulation/` sublayers

- Pros: one self-contained patient package; aligns with zip shape; easier to reason about one fixture story.
- Cons: co-located hidden/eval material requires explicit guardrails because current `pi-chart` has no `simulation/` layer loader contract.

#### Option B — Split visible chart under `patients/patient_002`, eval material under `tests/fixtures` or `.omx/evidence`, hidden physiology under `pi-sim`

- Pros: strongest boundary by directory; less risk of accidental agent-visible hidden material.
- Cons: fixture story becomes fragmented; relative references from manifest/release schedules need rewriting.

#### Option C — Keep zip only as external draft/reference until schema work is done

- Pros: safest near-term; no repo churn.
- Cons: loses momentum and does not upgrade `patient_002` into the richer clinical-memory proof surface.

### Chosen direction

Use a hybrid of A and B:

- Make the normalized visible chart canonical under `pi-chart/patients/patient_002`.
- Keep `simulation/latent_release` and `simulation/live_expected` either under `patients/patient_002/simulation/` **only after** guardrail tests exist, or under a clearly non-agent-visible evaluation fixture path if the guardrail tests reveal leakage risk.
- Move/mirror `simulation/hidden_truth` and future vitals-driver material to `pi-sim` ownership.
- Keep `reference_completed_chart` out of visible chart state; allow it only as evaluator/reference material.

## Acceptance criteria

### Boundary and placement

1. `patients/patient_002/chart.yaml` exists and `subject: patient_002` matches the directory; `npm run validate -- --patient patient_002` no longer reports the `chart.yaml` identity error described by `src/validate.ts:943-956`.
2. Visible startup chart paths contain only initial backend material as of `2026-04-19T06:45:00-05:00`; no RN-owned future MAR, I&O, nursing assessment, nursing note, or handoff events appear in `patients/patient_002/timeline/`.
3. Hidden physiology/vitals-driver material is not available through any `pi-chart` read or view API used by `pi-agent`.
4. A regression test proves current read/view APIs do not traverse `patients/patient_002/simulation/` if that directory remains inside the patient package.
5. `pi-sim` receives an explicit patient_002 scenario/vitals fixture or documented handoff artifact for hidden physiology ownership.

### Schema normalization

6. All visible `timeline/*/events.ndjson` rows validate against `schemas/event.schema.json` with canonical `certainty` and envelope `status` values.
7. Domain lifecycle values such as `completed`, `in_progress`, `preliminary`, `resolved`, and `resolving` are moved to `data.status_detail` where the current validator permits them, or mapped to a supported representation with documented exceptions.
8. All `source.kind` values are canonical or intentionally added through an ADR/update to `DESIGN.md:106-150` and `src/validate.ts:107-132`.
9. Notes under `timeline/*/notes/` have schema-valid IDs, `references`, and matching communication events, satisfying `schemas/note.schema.json:7-23` and `src/validate.ts:1350-1380`.
10. Vitals rows are reshaped from compact multi-metric rows into current row-wise `schemas/vitals.schema.json` format, including deterministic `sample_key` and `recorded_at` where expected by `src/validate.ts` warnings.
11. `constraints.md` uses `type: constraint_set` and includes a valid structured `constraints:` block compatible with existing fixtures.
12. Encounter headers avoid current unsupported open `effective_period` shape unless the validator is intentionally extended with tests.

### Validation and quality

13. `npm run validate -- --patient patient_002` exits 0.
14. `npm run check` exits 0 after derived rebuild.
15. `npm test` exits 0.
16. A normalization report is committed or generated under `.omx/evidence/` or `_derived/` showing counts before/after for events, latent events, expected events, notes, artifacts, and vitals rows.
17. The prior small `patient_002` fixture is preserved as git history or archived reference until the replacement passes validation.

## Implementation steps

### 1. Create a read-only normalization gap report script or one-off evidence artifact

Scope:

- Input: `/home/ark/Downloads/patient_002_chart_v4.zip`.
- Output: `.omx/evidence/patient-002-v4-normalization-gap.json` and/or markdown summary.

Report at minimum:

- event counts by layer: initial timeline, latent release, live expected,
- noncanonical `certainty` values vs `schemas/event.schema.json:174-178`,
- noncanonical envelope `status` values vs `schemas/event.schema.json:179-183`,
- noncanonical `source.kind` values vs `src/validate.ts:107-132`,
- note frontmatter issues vs `schemas/note.schema.json:7-23`,
- vitals compact rows vs `schemas/vitals.schema.json:7-23`,
- missing/invalid chart package metadata vs `src/validate.ts:943-956`,
- path/layer leakage risks for `simulation/`.

Why first: this locks the import diff against a measurable baseline and prevents silent lossy conversion.

### 2. Decide staging path and preserve reversibility

Preferred execution shape:

1. Extract the zip to a temp workspace.
2. Create a candidate import path such as `.omx/evidence/patient_002_v4_candidate/` or a git branch-local scratch path.
3. Do **not** overwrite `patients/patient_002` until the normalized candidate passes focused validation.

If execution uses direct replacement, first save a copy of the current small fixture outside the canonical `patients/` walk, e.g. `.omx/archive/patient_002_pre_v4/`, so `listPatientIds()` remains unaffected by extra directories under `patients/` (`src/session.ts:107+` lists patient dirs on disk).

### 3. Normalize chart package metadata and structural markdown

Files likely affected:

- `patients/patient_002/chart.yaml`
- `patients/patient_002/patient.md`
- `patients/patient_002/constraints.md`
- `patients/patient_002/timeline/*/encounter_*.md`

Tasks:

- Add/retain valid `chart.yaml` with `schema_version: 0.3.0-partial`, `subject: patient_002`, `mode: simulation`, `clock: sim_time`, and timezone `America/Chicago`.
- Change zip `constraints.md` frontmatter from `type: constraints_snapshot` to current `type: constraint_set` and add/normalize the structured `constraints:` block following `patients/patient_001/constraints.md:14-26` and `patients/patient_002/constraints.md:14-20`.
- Ensure encounter headers validate under `schemas/event.schema.json`; avoid `effective_period.end: null` because current schema requires string when present and validator disallows encounter intervals.
- Preserve rich narrative body content from the zip where possible.

### 4. Normalize event envelopes for initial visible timeline

Files likely affected:

- `patients/patient_002/timeline/*/events.ndjson`

Tasks:

- Map `certainty`:
  - `high` on observed facts/results/actions -> `observed` or `performed` depending on type.
  - `probable` / `medium` on assessments -> `inferred` with uncertainty retained in `data` where clinically meaningful.
  - orders/plans -> `planned`.
- Map envelope `status`:
  - completed/performed historical actions -> `final` plus appropriate `data.status_detail` where rule exists.
  - active ongoing intervals/plans/problems -> `active` plus `data.status_detail: active` only where allowed.
  - preliminary lab/diagnostic results -> envelope `final` or `active` only if compatible; retain `preliminary` in `data.status_detail` for `observation:lab_result` / `observation:diagnostic_result`, where `src/validate.ts:379-402` permits it.
  - resolved/resolving problem states -> canonical envelope status plus `assessment:problem` `data.status_detail` where permitted by `src/validate.ts:413-422`.
- Normalize source kinds:
  - `monitor` -> `monitor_extension` for public pi-sim/bedside monitor samples.
  - `lab_interface` -> `lab_interface_hl7` unless there is a specific reason to add a new registry kind.
  - `radiology_workflow` -> likely `pacs_interface` for imaging metadata/artifacts or `dictation_system` for reports.
  - `echo_lab` -> `cardiology_reporting` for echo reports.
  - `rt_charted` -> likely `clinician_chart_action` with `author.role: rt`, unless the team chooses to add an RT-specific source kind by ADR.
  - `pharmacy_workflow` -> likely `clinician_chart_action` with `author.role: pharmacist`, unless a pharmacy-specific source kind is added by ADR.
- Preserve link integrity and ID uniqueness. Run focused validation after this step.

### 5. Normalize notes and communication linkage

Files likely affected:

- `patients/patient_002/timeline/*/notes/*.md`
- matching rows in `events.ndjson`
- latent/live reference notes if those layers stay in repo

Tasks:

- Rename note IDs to `note_YYYYMMDDTHHMM_slug` format.
- Add `references: []` or concrete references to note frontmatter.
- Ensure every note has exactly the required matching communication event via `data.note_ref`; current validator enforces this in `src/validate.ts:1350-1380`.
- Update markdown citations and event `data.note_ref` fields after renames.
- For latent/live expected layers, either normalize to the same schema or keep them in a separately validated evaluator format with an explicit manifest explaining they are not `timeline/` chart events.

### 6. Normalize vitals rows

Files likely affected:

- `patients/patient_002/timeline/*/vitals.jsonl`
- possibly `pi-sim` fixture files for hidden future vitals feed

Tasks:

- Convert each compact row such as `{t, hr, sbp, dbp, map, rr, spo2, temp_c, o2, loc}` into row-wise samples with:
  - `sampled_at`,
  - `recorded_at`,
  - deterministic `sample_key`,
  - `subject`,
  - `encounter_id`,
  - `source: { kind: "monitor_extension", ref: ... }`,
  - `name`, `value`, `unit`, `context`.
- Preserve oxygen/device/location context using `context`, not ad-hoc top-level `o2`/`loc` fields.
- Move future hidden vitals feed rows to `pi-sim` scenario ownership or an explicit hidden fixture path not loaded by `pi-chart` APIs.

### 7. Add layer guardrails before committing co-located `simulation/`

Files likely affected:

- `src/read.test.ts` or a new focused test under `src/`/`tests/`
- possibly `src/validate.ts` if adding simulation-manifest validation
- `patients/patient_002/simulation/demo_config.json`
- `patients/patient_002/simulation/chart_surface_manifest.json`

Tasks:

- Add a regression test that creates a patient fixture with sentinel event/note IDs under `simulation/hidden_truth`, `simulation/live_expected`, and `simulation/reference_completed_chart`, then asserts read/view APIs do not return them.
- Add a validation or smoke test for `simulation/demo_config.json` if co-location is kept:
  - `initial_load.include_paths` may include only startup-safe visible chart paths,
  - `initial_load.exclude_paths` must include hidden/eval/reference paths,
  - `chart_surface_manifest.layers.hidden_truth.loaded_at_start` must be false.
- Decide whether latent release events should be schema-normalized now or treated as runtime release payloads with separate validation.

### 8. Split or mirror hidden physiology into `pi-sim`

Files likely affected outside current repo:

- `../pi-sim/vitals/scenarios/README.md`
- `../pi-sim/vitals/scenarios/<patient_002...>.json` or another runtime fixture path chosen by pi-sim conventions
- possibly `../pi-sim/docs/adr/` or `../pi-sim/docs/plans/` if the new hidden truth shape changes pi-sim contracts

Tasks:

- Move/mirror zip `simulation/hidden_truth/pi_sim_state_plan.yaml` and `pi_sim_vitals_feed_reference.jsonl` into a pi-sim-owned scenario fixture.
- Document that these are scenario secrets and must not be mounted into `pi-agent`.
- If pi-chart keeps a pointer, use a non-secret reference/manifest only, not full hidden truth.

### 9. Rebuild derived views and validate the final candidate

Commands:

```bash
npm run validate -- --patient patient_002
npm run rebuild
npm run check
npm test
```

Expected result:

- zero validation errors,
- no unexpected validation warnings except consciously accepted warning-first registry items,
- regenerated `_derived/` files use current generator markers,
- no hidden/eval sentinel appears in read/view outputs.

### 10. Replace canonical fixture and document the decision

Files likely affected:

- `patients/patient_002/**`
- `pi-chart.yaml` only if display name/source changes are desired
- `decisions/017-...` or a new ADR if source taxonomy or layer contract changes
- optional `README.md`/`DESIGN.md` updates if layered simulation packages become a first-class pi-chart fixture concept

Tasks:

- Replace current small `patients/patient_002` only after candidate passes validation.
- Update `pi-chart.yaml` display name if useful, e.g. `Patient 002 — ICU live charting fixture`.
- Add ADR if any of the following are true:
  - new source kinds are added,
  - `simulation/` sublayers become first-class pi-chart package shape,
  - hidden/eval material is intentionally co-located with chart packages.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Hidden truth leaks into agent-visible context | Invalidates simulation boundary | Sentinel tests for read/view APIs; manifest validation; prefer pi-sim ownership for hidden physiology |
| Lossy schema mapping changes clinical meaning | Fixture becomes less useful or misleading | Generate before/after normalization report; preserve original values in `data.status_detail` or provenance notes where valid |
| Current validator rejects imported rich content | Import stalls | Normalize visible timeline first; decide ADR-backed validator extension only when mapping would be semantically wrong |
| Co-located `simulation/` creates future loader ambiguity | Later agents may accidentally load hidden/eval refs | Document layer contract; add tests; consider separate eval fixture path for `live_expected`/`reference_completed_chart` |
| Existing patient_002 tests/prototypes assume small fixture IDs | UI/tests may break | Search references to old `evt_p002_*`/`enc_p002_*`; update tests or preserve a small fixture elsewhere if still needed |
| `source.kind` mapping too broad | Provenance loses fidelity | Prefer existing role fields (`author.role`) for RT/pharmacy specificity; add ADR only if existing registry cannot express a needed provenance channel |

## Verification steps

1. Run gap report against raw zip and confirm counts match known baseline:
   - 89 initial backend events,
   - 81 latent release events,
   - 78 live expected events,
   - 8 startup vitals rows,
   - 72 hidden future vitals rows.
2. Run schema validation on normalized visible timeline only.
3. Run note bidirectional linkage validation.
4. Run vitals validation and confirm no missing `recorded_at` / `sample_key` warnings remain unless explicitly accepted.
5. Run hidden/eval sentinel read tests.
6. Run full `npm run check` and `npm test`.
7. If `pi-sim` files are changed, run the relevant `pi-sim` scenario/vitals validation commands from `../pi-sim/README.md` after confirming the scenario path.

## Follow-up staffing guidance

### Solo `$ralph` path

Use for a conservative one-owner import:

- `debugger`/`executor`: build normalization script and apply fixture conversion.
- `test-engineer`: add sentinel/validator regression tests.
- `verifier`: run full validation and inspect hidden-leakage evidence.

Suggested sequence: normalization report -> visible chart normalization -> guardrail tests -> pi-sim split -> final validation.

### `$team` path

Use if speed matters and multiple lanes can work independently:

1. Lane A — Chart schema normalization (`executor`): `patients/patient_002/{chart.yaml,patient.md,constraints.md,timeline,artifacts}`.
2. Lane B — Vitals and pi-sim split (`executor` or `dependency-expert` if pi-sim contract uncertainty appears): vitals row conversion plus `../pi-sim/vitals/scenarios` handoff.
3. Lane C — Guardrail tests (`test-engineer`): simulation-hidden sentinel tests and validation commands.
4. Lane D — Review (`verifier`/`code-reviewer`): check boundary, validation evidence, and risk closure.

Team verification path:

- Team proves normalized fixture passes focused patient validation and hidden/eval sentinel tests.
- Ralph/verifier then proves repo-wide `npm run check`, `npm test`, and any pi-sim scenario validation required by touched pi-sim files.

Launch hints if using OMX runtime:

```bash
$team implement .omx/plans/plan-patient-002-v4-chart-sim-split.md
# or from shell, if preferred by the runtime:
omx team --plan .omx/plans/plan-patient-002-v4-chart-sim-split.md
```

## ADR

### Decision

Normalize `patient_002_chart_v4.zip` into a `pi-chart` patient_002 candidate for visible chart and staged EHR/evaluation layers, while assigning hidden physiology/vitals-driver truth to `pi-sim` ownership. Co-locate `simulation/` under the patient package only if tests and manifests prove hidden/eval material cannot enter agent-visible read paths.

### Drivers

- `pi-chart` owns chart/EHR truth and broad clinical-memory fixtures.
- `pi-sim` owns hidden patient runtime and physiology.
- `patient_002_chart_v4.zip` is clinically richer than the current small patient_002 fixture but does not satisfy current schemas.

### Alternatives considered

1. Import the whole zip into `pi-chart` unchanged — rejected because current schema validation fails and hidden-truth co-location lacks guardrails.
2. Move the whole zip to `pi-sim` — rejected because most of the package is visible/staged chart corpus and EHR evaluation material, not physiology runtime.
3. Keep zip only as external reference — safe but delays the broad EHR skeleton goal.

### Why chosen

The hybrid preserves the draft's strongest idea — live chart boundary with latent releases and expected charting — while respecting the existing project boundary and current validator contracts.

### Consequences

- Requires normalization work before import.
- May require a new ADR if `simulation/` layers become a formal pi-chart package concept.
- Requires tests that explicitly protect against hidden-truth leakage.

### Follow-ups

- Decide final path for `live_expected`: co-located `patients/patient_002/simulation/live_expected` vs separate eval fixture path.
- Decide whether any new `source.kind` values deserve ADR-backed registry additions or should map to existing kinds plus `author.role`.
- Add a documented pi-sim scenario fixture for patient_002 hidden physiology.

## Changelog

- Created from the `$analyze` findings on `patient_002_chart_v4.zip`.
- Sized as a staged import/normalization plan rather than direct implementation.
- Includes boundary guardrails before canonical replacement.
