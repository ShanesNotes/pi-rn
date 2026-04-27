# Test Spec: integrity-first foundation hardening before seeded-chart expansion

## Purpose

Verification companion for `prd-foundation-hardening-before-seeded-chart-expansion.md`.

## Baseline Evidence

- `npm test` passes in the current repo.
- `npm run check` passes in the current repo.
- `npm run typecheck` passes in the current repo.

## Hard-Gate Test Matrix

### 1. Sanctioned note authoring and note-reference integrity

**Targets**
- `src/write.ts`
- `src/write.test.ts`
- `src/validate.test.ts`
- public-surface docs / exports as needed

**Required regressions**
1. Sanctioned communication-note authoring flows through `writeCommunicationNote()`.
2. `writeNote()` is either removed from the supported public surface or explicitly fails/rejects when used for standalone communication-note persistence under the sanctioned contract.
3. A note with unknown `references[]` does not persist through sanctioned write paths.
4. Failed communication-note persistence leaves no orphan note and no orphan communication event.

**Evidence to capture**
- before/after note file counts
- before/after `events.ndjson` line counts
- explicit assertion about public API / doc posture for `writeNote()`

### 2. Settled graph-invalid link rejection

**Targets**
- `src/write.ts`
- `src/write.test.ts`
- `src/validate.ts`
- `src/validate.test.ts`

**Required regressions**
1. Settled invalid `links.*` targets are rejected before persistence.
2. Settled `links.fulfills` target typing is rejected before persistence.
3. Settled `links.addresses` target typing is rejected before persistence.
4. Invariant 5 write-time behavior is not hoisted until its severity/support contract is frozen.

**Evidence to capture**
- persistence does not occur on rejected writes
- validator and write-path expectations stay aligned after the contract freeze

### 3. Artifact boundary safety

**Targets**
- `src/write.ts`
- `src/views/evidenceChain.ts`
- `src/validate.ts`
- `src/write.test.ts`
- `src/views/evidenceChain.test.ts`
- `src/validate.test.ts`

**Required regressions**
1. Absolute artifact paths are rejected.
2. Normalized `..` escape paths are rejected.
3. Valid in-scope artifact paths resolve successfully.
4. Validator flags artifact refs that violate the chosen path-confinement rule.
5. Read-side artifact resolution cannot escape the patient artifact tree.

**Evidence to capture**
- rejected path examples
- accepted in-scope example
- validation failure for out-of-scope artifact refs

### 4. Stale fulfillment handling

**Targets**
- `src/views/openLoops.ts`
- `src/views/openLoops.test.ts`
- possibly `src/views/active.ts`

**Required regressions**
1. A superseded fulfillment does not close an intent.
2. A corrected fulfillment does not close an intent.
3. A superseded/corrected failure fulfillment does not force `failed`.
4. A live final fulfillment still closes the loop correctly.

### 5. Encounter-scoped vitals evidence

**Targets**
- `src/types.ts`
- `src/views/evidenceChain.ts`
- `src/views/trend.ts`
- `src/views/evidenceChain.test.ts`
- `src/views/trend.test.ts`

**Required regressions**
1. `TrendParams` or equivalent shared type carries encounter scope.
2. `evidenceChain()` passes `encounterId` through to the trend query.
3. Two encounters with the same metric over the same time window produce a result that includes only points from the referenced `encounterId`.

### 6. Single-writer ID contract

**Targets**
- `src/write.ts`
- `src/write.test.ts`
- `README.md`
- `DESIGN.md`

**Required checks**
1. Public docs do not imply multi-writer safety.
2. Tests cover the intended single-writer guardrail / collision story.
3. Any remaining concurrency limitation is explicit in code comments and docs.

### 7. Doc and schema contract alignment

**Targets**
- `README.md`
- `DESIGN.md`
- `CLAIM-TYPES.md`
- `ARCHITECTURE.md`
- `schemas/event.schema.json`
- `schemas/note.schema.json`
- `schemas/vitals.schema.json`

**Required review points**
1. Invariant 5 severity and support-kind semantics match across docs and code.
2. Structured `EvidenceRef` is documented.
3. Note↔communication binding is documented where sanctioned write behavior is described.
4. `links.fulfills` / `links.addresses` target typing is visible in contract docs/schema descriptions.
5. `vitals.quality` is documented where current-state behavior depends on it.
6. `ARCHITECTURE.md` no longer overstates write-time enforcement.

## Command Verification Sequence

1. `npm test`
2. `npm run check`
3. `npm run typecheck`

## Exit Criteria

Implementation is complete only when:
- the hard-gate regressions exist and pass
- the command suite exits 0
- sanctioned communication-note authoring no longer leaks orphan notes
- artifact refs are safe at write, validate, and read time
- encounter-scoped vitals evidence is preserved end to end
- docs and schema descriptions match the final enforced contract
