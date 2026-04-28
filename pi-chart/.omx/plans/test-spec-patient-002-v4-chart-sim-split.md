# Test spec — patient_002 v4 chart/sim split

## Baseline/gap evidence
- Generate or preserve a normalization gap report from the zip showing draft vocabulary and schema mismatches before/while importing.

## Required checks
1. `npm run validate` must pass.
2. `npm run rebuild` must either be included in `npm run check` or run separately before final validation evidence.
3. `npm run test` must pass.
4. `npm run typecheck` must pass.
5. A focused regression test must prove ordinary pi-chart patient loading/view code ignores hidden/evaluation/simulation-only material if such material is retained under the patient package.
6. If pi-sim fixture files are changed, run the relevant pi-sim validation/test command discovered from pi-sim package/scripts; otherwise document why only file-level handoff validation was possible.

## Manual/file assertions
- `patients/patient_002/chart.yaml` exists and identifies patient_002.
- No `simulation/hidden_truth` path is included by chart-visible manifests, active index, read API output, derived current state, or agent-visible bundle output.
- Future live expected/reference completed chart material is not included in startup-visible chart state.
- Source-kind/status/certainty mappings are documented in an import report or README section.
