# Ralph context snapshot — patient_002 v4 chart/sim split

## Task statement
Execute `.omx/plans/plan-patient-002-v4-chart-sim-split.md` for `/home/ark/Downloads/patient_002_chart_v4.zip`: normalize the patient_002 v4 synthetic ICU chart fixture into pi-chart while preserving strict chart-visible vs simulator-hidden boundaries, and split/mirror hidden physiology inputs into pi-sim where appropriate.

## Desired outcome
- `pi-chart/patients/patient_002` becomes a validator-compatible richer synthetic chart fixture derived from the v4 zip, with canonical `chart.yaml`, normalized events, notes, vitals, constraints, artifacts, and derived outputs.
- Hidden physiology / vitals-driver truth does not become chart-visible or pi-agent-visible context.
- Any retained latent/evaluation/reference simulation layers are explicitly excluded from ordinary pi-chart loaders/views by tests and manifests.
- pi-sim receives (or is handed off an explicit fixture location for) patient_002 hidden physiology/vitals driver material.
- Fresh validation/test/build evidence exists, plus architect verification and post-deslop regression evidence.

## Known facts/evidence
- The prior read-only analysis found the zip is primarily a pi-chart synthetic patient/chart corpus fixture, not a pi-sim runtime-only asset.
- The zip root is `patient_002/` and contains `patient.md`, `constraints.md`, `timeline/`, `artifacts/`, `_derived/`, `simulation/latent_release`, `simulation/live_expected`, `simulation/hidden_truth`, `simulation/reference_completed_chart`, and `scripts/validate-chart.mjs`.
- Zip README says initial backend load excludes future RN-owned documentation; latent releases and hidden expected live events drive simulation/evaluation.
- Zip manifest/demo config split layers into `initial_backend`, `latent_release`, `live_expected`, and `hidden_truth`, excluding all but initial backend from initial load.
- Current pi-chart expects complete chart packages under `patients/<id>/` with `chart.yaml`, `patient.md`, `constraints.md`, `timeline/`, `artifacts/`, and `_derived/`.
- Current pi-chart event schema expects certainty enum `observed|reported|inferred|planned|performed` and status enum `draft|active|final|superseded|entered_in_error`.
- Prior custom probe found many draft incompatibilities: noncanonical status/certainty/source kinds, note frontmatter gaps, vitals missing `recorded_at`/`sample_key`, invalid constraints type, encounter interval shape, and final lab/communication rows needing `data.status_detail`.

## Constraints
- Do not expose `simulation/hidden_truth` or future live expected/reference completed chart content through pi-chart read/view APIs or pi-agent-visible surfaces.
- Keep diffs reversible and avoid touching unrelated dirty files in sibling projects.
- No new dependencies unless explicitly requested.
- Must satisfy Ralph planning gate before implementation: current task PRD and test-spec artifacts must exist.
- Run validation/tests and read outputs before claiming completion.

## Unknowns/open questions
- Exact target pi-sim hidden fixture path must be inferred from existing pi-sim vitals/scenarios layout.
- Whether to co-locate latent/live_expected/reference layers under `patients/patient_002/simulation/` depends on guardrail tests and current loaders.
- Normalization may reveal additional schema constraints not found in the initial probe.

## Likely codebase touchpoints
- `patients/patient_002/**`
- `pi-chart.yaml`
- `schemas/*.schema.json`
- `src/read.ts`, `src/fs-util.ts`, validators/tests if loader guardrails need tests
- `src/views/**` tests if view surfaces need sentinel coverage
- `../pi-sim/vitals/scenarios/**` and/or docs/README if hidden physiology is split there
- `.omx/plans/plan-patient-002-v4-chart-sim-split.md`
