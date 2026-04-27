# Test spec: reviewed issues integrity-first remediation

## Purpose
Executable verification companion for `prd-reviewed-issues-integrity-plan.md`.

## Baseline evidence captured
- `npm test` passed on 2026-04-19 (45 tests).
- `npm run check` passed on 2026-04-19 with `0 error(s), 0 warning(s)`.

## Test matrix by priority step

### Step 1 — write preflight invariants
**Targets:** `src/write.test.ts`, possibly fixtures in temp charts.

Add tests that prove each rejection happens **before persistence**:
1. schema-invalid event rejected before `events.ndjson` append.
2. schema-invalid note rejected before note file creation.
3. wrong-subject event/note rejected against `chart.yaml.subject`.
4. explicit event ID collision against existing event rejected.
5. explicit note ID collision against existing note rejected even when filename differs.
6. explicit event/note ID collision against structural markdown ID rejected, matching validator global uniqueness model (`src/validate.ts:177-178`, `479-485`).

**Evidence to capture**
- Before/after file counts.
- Before/after `events.ndjson` line count.
- Error messages identify violated invariant.

### Step 2 — `readRecentEvents` upper bound
**Targets:** `src/read.test.ts`, `src/read.ts`.

Required tests:
1. add one event earlier than cutoff -> excluded.
2. add one event exactly at cutoff -> included.
3. add one event exactly at `asOf` -> included.
4. add one future event later than `asOf` -> excluded.
5. explicit `asOf` earlier than latest chart event still constrains results.

### Step 3 — `writeCommunicationNote` consistency
**Targets:** `src/write.ts`, `src/write.test.ts`, `README.md`.

Required test seam:
- Add a test-only hook/setter exported from `src/write.ts` but not from `src/index.ts`, with explicit reset behavior in `afterEach`/finally logic.
- Hook must be able to force failure after note persistence and before successful event append.

Required tests:
1. induced second-step failure leaves no note file and no communication event.
2. cleanup failure surfaces both the original persistence failure and rollback failure.
3. success path still returns `{ notePath, eventId }` and writes both artifacts.

### Step 4 — time contract
**Targets:** `src/time.test.ts`, `src/write.test.ts`, `src/time.ts`, `src/write.ts`.

Required tests:
1. generated `recorded_at` uses `chart.yaml.timezone` rather than host-local offset.
2. generated event ID timestamp fragment matches chart-timezone wall time.
3. generated note path/day directory use chart-timezone date when library generates the timestamp.
4. caller-supplied `effective_at` / `recorded_at` remain unchanged.
5. missing `chart.yaml.timezone` falls back to UTC.

### Step 5 — project typecheck
**Targets:** `package.json`, `tsconfig.json`, lockfile if needed.

Required checks:
1. `npm run typecheck` exists.
2. clean checkout with local install can run it successfully.
3. no dependence on global `tsc`.

### Step 6 — validator path-date parity
**Targets:** `src/validate.test.ts`, `src/validate.ts`.

Required tests:
1. note frontmatter `effective_at` day mismatch emits warning.
2. encounter frontmatter `effective_at` day mismatch emits warning.
3. existing event/vitals warning behavior remains unchanged.

### Step 7 — docs drift
**Targets:** `README.md`, `artifacts/README.md`.

Manual review checks:
1. `writeCommunicationNote` wording matches narrowed single-writer rollback guarantee.
2. time semantics mention chart timezone for generated write timestamps and latest event/vitals default `asOf` behavior.
3. artifact docs use `writeArtifactRef` or explicitly document naming context.

## Command verification sequence
1. `npm test`
2. `npm run check`
3. `npm run typecheck`

## Exit criteria
Implementation is complete only when:
- all new regression tests exist and pass,
- command suite exits 0,
- docs match actual behavior,
- no known orphan-note, future-event, timezone, or path-date mismatch regressions remain unverified.
