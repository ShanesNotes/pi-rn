# ADR 015 Phase 7 — migration script + corpus sweep

## RALPLAN-DR Summary

### Principles

- Separate **mechanical migration logic** from **manual corpus normalization**:
  ADR 015 explicitly keeps bare-string supports unchanged in the script, so the
  `patient_001` `V-EVIDENCE-01` cleanup must be a repo-sweep task, not hidden
  inside migration behavior.
- Prove the migrator in isolation before touching tracked corpus files. The
  final phase should not discover idempotency or validation bugs while editing
  the real seed.
- Preserve the already-approved policy substrate literally: no schema, parser,
  validator, view, derived, write-path, or ADR text edits.
- Treat legacy-shape parser coverage as a supported back-compat surface, not as
  stale test debt; keep explicit back-compat tests, but label them clearly.
- Validate every boundary with evidence: staged migration success, zero-warning
  repo validation, idempotent second run, and confined diff scope.

### Decision Drivers

1. The new migrator has the highest correctness bar of any ADR 015 phase:
   filesystem staging, deterministic rewrites, validator integration, and
   byte-identical re-run proof.
2. Repo inspection shows the current five warnings come from one seed event in
   `patient_001`, but the migration script is **not** allowed to rewrite
   bare-string supports globally. That creates an intentional two-lane phase:
   script + direct corpus normalization.
3. Several test files currently use legacy literals for different reasons:
   some are current-fixture defaults that should move to `0.3.0-partial`, while
   others are intentional compatibility assertions that should stay and be
   commented as such.

### Viable Options

1. **Chosen: split into 7a / 7b / 7c.**
   Pros:
   - isolates script correctness/idempotency before touching tracked corpus
   - makes the patient seed audit reviewable as a separate semantic diff
   - leaves the repo-wide test/example sweep as a bounded cleanup pass
   - matches the user’s recommended seams and Phase-verification discipline
   Cons:
   - three verification rounds instead of one
   - requires explicit distinction between script rewrites and manual sweeps

2. **One large Phase 7 implementation/verification pass.**
   Pros:
   - one landing point for the final ADR 015 phase
   - no handoff risk between sub-phases
   Cons:
   - hardest diff to review
   - muddles script bugs with patient/test corpus edits
   - weakens blame isolation if idempotency or zero-warning proof fails late

3. **Script-only phase now, defer repo-owned corpus sweep.**
   Pros:
   - smallest immediate implementation surface
   - leaves compatibility tests/examples untouched
   Cons:
   - fails the explicit zero-warning gate
   - leaves `patient_001` and current fixtures emitting stale v0.2 authoring
     patterns
   - does not complete ADR 015’s final accepted implementation contract

### Why option 3 is rejected

- ADR 015 phase 7 and the user prompt both require the migration **and** the
  seed/test/example sweep, with `npm run check` reaching `0 errors, 0 warnings`.
  Script-only would knowingly leave the five `V-EVIDENCE-01` warnings behind.

## Chosen Approach

Recommend **three sub-phases**:

- **7a — migrator + synthetic tests**
- **7b — `patient_001` sweep + seed validation**
- **7c — repo-owned test/example sweep + final zero-warning verification**

### Exact Phase 7 execution rules

- The migration script rewrites only the ADR 015 mechanical table:
  - structured vitals refs:
    - `{kind:"vitals", metric, from, to, encounterId?}`
    - ->
      `{kind:"vitals_window", ref:<vitals://...>, selection:{metric,from,to,encounterId?}}`
  - structured id-like refs:
    - `{kind:"event"|"note"|"artifact", id}`
    - ->
      `{kind, ref}`
  - `links.addresses[*]` -> `links.resolves[*]` **only** when the referenced
    target is open-loop-kind at migration time
  - `schema_version`:
    - `pi-chart.yaml`
    - `patients/<id>/chart.yaml`
    - `0.2.x -> 0.3.0-partial`
- The script does **not**:
  - backfill `transform`
  - synthesize `contradicts`
  - rewrite bare-string supports
- Therefore the `patient_001` inferred-assessment warning cleanup is a direct
  corpus edit in 7b, not a script side effect.

### Recommended script contract

Files:
- `scripts/migrate-v02-to-v03.ts`
- `scripts/migrate-v02-to-v03.test.ts`

CLI recommendation:
- `tsx scripts/migrate-v02-to-v03.ts <chartRoot> <patientId>`
- Keep patient id explicit rather than defaulting to “all patients”; the ADR
  calls this a **per-patient** migrator and explicit targeting keeps the final
  phase safer.

Filesystem strategy:
- Create a staging root as a sibling temp directory of `<chartRoot>` via
  `mkdtemp`, copy the chart tree into it, perform all rewrites there, then run
  validation against the staged tree.
- Validation gate after rewrites:
  - current schema load succeeds
  - `validateChart({chartRoot: stagedRoot, patientId})` returns **zero errors**
  - warnings are reported but do not block 7a/7b rename success, because the
    script is not allowed to rewrite bare-string supports and the final
    zero-warning gate is satisfied only after the separate corpus sweep
- Success path:
  - atomically replace each touched live path only after staged validation
    passes:
    - `patients/<id>/...`
    - `patients/<id>/chart.yaml`
    - `pi-chart.yaml`
  - use rename-based swaps per touched path; keep the touched-path set minimal
    because plain filesystem renames are atomic per path, not a multi-path
    transaction
  - clean up staging directory
- Failure path:
  - print the validation report
  - leave the live tree untouched
  - keep or clean staging as an implementation choice, but canonical tree must
    remain unchanged

Determinism / idempotency requirements:
- Output key ordering and newline style must be stable
- Second run must produce byte-identical staged contents
- Rewrites must be canonicalizing, not “toggle”-style

### 7a — migrator + synthetic tests

Scope:
- author `scripts/migrate-v02-to-v03.ts`
- author `scripts/migrate-v02-to-v03.test.ts`

Plan:
- Reuse the existing migration-test style from `src/migrate.test.ts`:
  build temp fixtures under `/tmp`, copy `schemas/`, assert exact file content.
- Synthetic fixture matrix must cover:
  - structured vitals ref rewrite
  - structured event ref rewrite
  - structured note ref rewrite
  - structured artifact ref rewrite
  - `addresses -> resolves` when the target is open-loop-kind
  - `addresses` preserved when the target is `assessment/problem`
  - root + patient `schema_version` bump
  - post-migration `validateChart` pass
  - rerun byte-identical proof
- Keep one focused synthetic fixture rather than cloning the whole repo.

### 7b — `patient_001` sweep + seed validation

Scope:
- `patients/patient_001/timeline/2026-04-18/events.ndjson`
- `patients/patient_001/chart.yaml`
- `pi-chart.yaml`

Plan:
- Run the new migrator against `patient_001` in a disposable copy first if
  needed to inspect its exact output shape, then apply the canonical result in
  the tracked tree.
- Normalize the single offending inferred assessment
  `evt_20260418T0830_01` to object-form supports:
  - two event refs -> `{kind:"event", ref:...}`
  - three vitals URIs -> `{kind:"vitals_window", ref:<same-uri>, selection:{...}}`
- Preserve authored clinical meaning; do **not** synthesize contradictions or
  transforms.
- Bump `pi-chart.yaml` and `patients/patient_001/chart.yaml` to
  `schema_version: 0.3.0-partial`.
- Record audit counts for the final commit body:
  - normalized refs in `patient_001`
  - addresses->resolves rewrites
  - `V-EVIDENCE-01` warnings from 5 -> 0

### 7c — repo-owned test/example sweep + final verification

Scope:
- current-fixture helpers and tests
- any other committed fixture/example files still using v0.2 authoring shapes

Plan:
- Split test/example literals into two buckets:
  1. **Current-shape fixtures** — rewrite to canonical v0.3 authoring
     - generic fixture builders should emit `schema_version: 0.3.0-partial`
     - canonical authoring tests should use `{kind, ref}` and
       `vitals_window` where they are testing current authoring
     - any open-loop closure examples should use `resolves`, not `addresses`
  2. **Intentional back-compat tests** — keep legacy shapes and mark them with
     `// v0.2 back-compat`
     - `parseEvidenceRef({kind, id})`
     - `parseEvidenceRef({kind:"vitals", metric, from, to, encounterId?})`
     - validator/write/evidence-chain tests that intentionally prove legacy
       acceptance should stay legacy and be labeled
     - historical migration tests that explicitly assert v0.2 output remain
       historical and should be labeled rather than “upgraded”
- Likely review targets from repo scan:
  - `src/test-helpers/fixture.ts`
  - `src/read.test.ts`
  - `src/session.test.ts`
  - `src/write.test.ts`
  - `src/validate.test.ts`
  - `src/views/evidenceChain.test.ts`
  - `src/evidence.test.ts`
  - `src/migrate.test.ts` only if a literal is meant to represent the current
    schema rather than historical v0.2 migration expectations

## Requirements Summary

- New files:
  - `scripts/migrate-v02-to-v03.ts`
  - `scripts/migrate-v02-to-v03.test.ts`
- Allowed tracked edits:
  - `patients/patient_001/**`
  - `pi-chart.yaml`
  - `src/**/*.test.ts`
  - `src/test-helpers/**`
  - other committed example/seed files only if they are true repo-owned
    fixtures/examples still using v0.2 shapes
- Forbidden edits:
  - `src/types.ts`
  - `src/evidence.ts`
  - `src/validate.ts`
  - `schemas/event.schema.json`
  - `src/views/*.ts`
  - `src/derived.ts`
  - `src/write.ts`
  - `decisions/*.md`
- Final gates must prove:
  - `npm test` green
  - `npm run typecheck` green
  - `npm run check` -> `0 errors, 0 warnings`
  - second migration run is byte-identical
  - diff scope is confined to approved files
  - final commit message body includes:
    - `patient_001 normalized <N> refs; <M> addresses→resolves rewrites; <K> V-EVIDENCE-01 warns → 0.`

## Implementation Plan

1. **Land 7a first.**
   - Create the new migrator and synthetic tests.
   - Prove rewrite-table coverage and idempotency on temp fixtures.
   - Verify staged validation/rollback behavior before touching tracked corpus.

2. **Land 7b second.**
   - Apply the deterministic migration output to `patient_001`.
   - Manually normalize the single inferred assessment that still uses bare
     string supports.
   - Bump root + patient schema versions to `0.3.0-partial`.
   - Re-run `npm run check` and confirm the five warnings are gone.

3. **Land 7c third.**
   - Sweep current-fixture helpers/tests to canonical v0.3 authoring.
   - Keep explicit legacy parser/validator coverage with `// v0.2 back-compat`
     comments.
   - Re-run full verification and byte-identical migration proof.

4. **Verification matrix**
   - **7a gates**
     - `node --test --import tsx scripts/migrate-v02-to-v03.test.ts`
     - targeted rerun-idempotency proof inside the test suite
     - `npm run typecheck`
   - **7b gates**
   - `npm run check` with `0 errors, 0 warnings`
   - diff review confined to script + patient/config files
  - **7c / final gates**
    - `node --test --import tsx scripts/migrate-v02-to-v03.test.ts`
    - `npm test`
    - `npm run typecheck`
    - `npm run check`
     - migration run, then migration re-run, then byte-identical diff proof
     - `git diff --name-only`
     - `git diff -U0 | rg "V-"` shows no new validator rule codes
     - `git diff --name-only | rg 'src/types.ts|src/evidence.ts|src/validate.ts|schemas/event.schema.json|src/views/|src/derived.ts|src/write.ts|decisions/'`
       returns no matches

## Risks / watch-items

- The biggest semantic trap is confusing “migration rewrites” with
  “manual warning cleanup.” ADR 015 only authorizes the script to rewrite the
  mechanical table; bare-string support cleanup is a separate sweep.
- Migration success before the corpus sweep means **schema-valid + validator
  zero errors**, not necessarily zero warnings. Final zero-warning proof lands
  only after 7b/7c complete the manual normalization work.
- Root `schema_version` bump must not be treated as permission to touch frozen
  policy surfaces; current parser/validator back-compat makes the bump safe.
- The success path is validation-gated and rename-based, but not a true
  multi-path filesystem transaction; execution should minimize touched live
  paths and verify diff scope carefully.
- Historical tests that intentionally assert v0.2 compatibility should stay
  legacy and be annotated, not silently “upgraded away.”
- If the migrator exposes any need to edit frozen files, stop; that indicates a
  policy gap, not an execution detail.

## Fresh-session execution prompt

Implement ADR 015 Phase 7 as a three-step final phase.

Scope:
- NEW `scripts/migrate-v02-to-v03.ts`
- NEW `scripts/migrate-v02-to-v03.test.ts`
- `patients/patient_001/**`
- `pi-chart.yaml`
- `src/**/*.test.ts`
- `src/test-helpers/**`
- other committed example/seed files only if they are true repo-owned fixtures
  still using v0.2 shapes

Hard constraints:
- Do not modify `src/types.ts`, `src/evidence.ts`, `src/validate.ts`,
  `schemas/event.schema.json`, `src/views/*.ts`, `src/derived.ts`,
  `src/write.ts`, or `decisions/*.md`.
- The migration script is per-patient, deterministic, idempotent, staged, and
  leaves the live tree untouched on validation failure.
- Follow the ADR 015 rewrite table exactly.
- Do not rewrite bare-string supports in the script.
- Do not backfill `transform`.
- Do not synthesize `contradicts`.
- Keep explicit legacy compatibility tests, but mark them `// v0.2 back-compat`.

Verification:
- `node --test --import tsx scripts/migrate-v02-to-v03.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run check` -> `0 errors, 0 warnings`
- run the migrator, then run it again, and prove the second run is
  byte-identical
- `git diff --name-only`
- `git diff -U0 | rg "V-"`
- grep proof that frozen boundaries were untouched

Commit message subject:
- `Phase 7 — migration script + corpus sweep (ADR 015)`

Commit body must include:
- `patient_001 normalized <N> refs; <M> addresses→resolves rewrites; <K> V-EVIDENCE-01 warns → 0.`
