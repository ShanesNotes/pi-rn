# Test Spec — ADR 015 Phase 7 migration script + corpus sweep

## Objective

Prove that the final ADR 015 phase:

1. migrates v0.2 literals deterministically and idempotently,
2. preserves declared v0.2 compatibility where intended,
3. removes the five baseline `V-EVIDENCE-01` warnings from `patient_001`, and
4. does so without touching frozen policy/runtime surfaces.

## Required Proof Points

### 7a — migrator correctness

- structured vitals ref rewrite:
  - legacy `{kind:"vitals", metric, from, to, encounterId?}`
  - canonical `{kind:"vitals_window", ref, selection}`
- structured `event` ref rewrite:
  - `{kind:"event", id}` -> `{kind:"event", ref}`
- structured `note` ref rewrite:
  - `{kind:"note", id}` -> `{kind:"note", ref}`
- structured `artifact` ref rewrite:
  - `{kind:"artifact", id}` -> `{kind:"artifact", ref}`
- open-loop `addresses -> resolves` rewrite fires only when target semantics
  match ADR 009 / V-RESOLVES-01
- `addresses` to `assessment/problem` is preserved
- `pi-chart.yaml` bumps to `0.3.0-partial`
- `patients/<id>/chart.yaml` bumps to `0.3.0-partial`
- migrated staged output passes `validateChart`
- staged migration success is defined as `0 errors`; pre-sweep warnings may be
  reported and are closed later by the corpus sweep
- second migration run is byte-identical
- failure-path proof:
  - if validation fails, canonical tree remains untouched

### 7b — seed/corpus normalization

- `patients/patient_001/timeline/2026-04-18/events.ndjson` no longer contains
  the five bare-string supports that trigger `V-EVIDENCE-01`
- those supports are rewritten to canonical object-form EvidenceRefs
- `patient_001` clinical narrative is unchanged:
  - no synthetic `contradicts`
  - no synthetic `transform`
- `pi-chart.yaml` and `patients/patient_001/chart.yaml` both report
  `schema_version: 0.3.0-partial`
- `npm run check` after the sweep reports `0 errors, 0 warnings`

### 7c — repo-owned test/example sweep

- generic current-fixture builders emit `schema_version: 0.3.0-partial`
- canonical-authoring tests use `{kind, ref}` rather than `{kind, id}`
- canonical-authoring tests use `vitals_window` literals where they are testing
  current v0.3 output/input shapes
- explicit legacy compatibility tests remain and are marked
  `// v0.2 back-compat`
- historical migration tests that assert v0.2 output remain historical and are
  marked rather than rewritten
- any old-shape open-loop closure examples use `resolves`, not `addresses`
- no new validator rule codes appear in diffs

## Verification Matrix

### 7a gates

- `node --test --import tsx scripts/migrate-v02-to-v03.test.ts`
- `npm run typecheck`
- script-local rerun proves byte-identical second output

### 7b gates

- `npm run check`
- inspect exact warning count:
  - before: `0 errors, 5 warnings`
  - after: `0 errors, 0 warnings`
- `git diff --name-only` limited to script + seed/config files so far

### 7c / final gates

- `node --test --import tsx scripts/migrate-v02-to-v03.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run check`
- run the migrator against the target chart/patient, then run it again, and
  prove the second run is byte-identical
- `git diff --name-only`
- `git diff -U0 | rg "V-"` shows no new validator rule codes
- `git diff --name-only | rg 'src/types.ts|src/evidence.ts|src/validate.ts|schemas/event.schema.json|src/views/|src/derived.ts|src/write.ts|decisions/'`
  returns no matches

## Regression Expectations

- the five baseline `V-EVIDENCE-01` warnings are gone
- no new warnings appear
- no frozen boundary files change
- explicit legacy parser compatibility remains covered
- final commit body includes:
  - `patient_001 normalized <N> refs; <M> addresses→resolves rewrites; <K> V-EVIDENCE-01 warns → 0.`
