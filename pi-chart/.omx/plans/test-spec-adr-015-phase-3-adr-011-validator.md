# Test Spec — ADR 015 Phase 3 ADR 011 validator rules

## Objective

Prove that Phase 3 adds only the requested ADR 011 validator rules, keeps the
change additive and validator-local, preserves current supports behavior, and
does not pull ADR 009 logic forward.

## Required Proof Points

### `V-TRANSFORM-01`

- positive: `activity:"import"` with `source.kind:"clinician_chart_action"`
  → err
- positive: `activity:"normalize"` with non-import kind → err
- negative: `activity:"import"` with `source.kind:"synthea_import"` → silent
- negative: `activity:"infer"` / `"summarize"` / `"extract"` /
  `"transcribe"` with any source kind → silent
- negative: no `transform` block → silent
- assert the exact message:
  `V-TRANSFORM-01: transform.activity={activity} requires import-family source.kind; got source.kind={kind}.`

### `V-TRANSFORM-02`

- positive: `input_refs:[{kind:"event",ref:"evt_nonexistent"}]` → err
- positive: `input_refs:[{kind:"external",ref:"ftp://unknown"}]` → err
- negative: `input_refs:[{kind:"event",ref:<existing id>}]` → silent
- negative:
  `input_refs:[{kind:"external",ref:"synthea://enc_abc?resource=Observation/obs_71"}]`
  → silent
- negative:
  `input_refs:[{kind:"vitals_window",ref:"vitals://enc_001?name=lactate&from=...&to=..."}]`
  → silent
- negative: no `transform` block → silent
- edge: `input_refs: []` → silent
- edge: encounterless legacy vitals ref in `transform.input_refs[]` → err
- prove the vitals-ref failure is caused by missing encounter-bearing
  `vitals://` ref semantics, not by unrelated selection parsing
- assert the exact messages:
  - `V-TRANSFORM-02: transform.input_refs[{i}] does not resolve: {kind}:{ref}`
  - `V-TRANSFORM-02: transform.input_refs[{i}] has unrecognized external scheme: {ref}`

## Global Regression Expectations

- `checkSupportsTargets()` behavior is unchanged.
- `supports[]` `kind:"external"` items still bypass patient-local resolution.
- Encounterless legacy vitals refs remain acceptable in `links.supports[]`.
- No `V-CONTRA` or `V-RESOLVES` codes land.
- No edits to `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, `V-FULFILL`, or
  `V-EVIDENCE` rule bodies land.

## Global Gates

- `npm test`
- `npm run check`
- `npm run typecheck`

## Phase-Boundary Checks

- `git diff --name-only -- src/validate.ts src/validate.test.ts`
- `git diff --name-only`
- grep proof only `V-TRANSFORM-01|V-TRANSFORM-02` were added and no
  `V-CONTRA|V-RESOLVES` codes landed
- grep proof no edits to
  `V-SRC|V-TIME|V-STATUS|V-INTERVAL|V-FULFILL|V-EVIDENCE` rule bodies
