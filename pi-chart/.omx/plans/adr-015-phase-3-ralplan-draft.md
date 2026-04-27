# ADR 015 Phase 3 — ADR 011 validator rules in `src/validate.ts`

## RALPLAN-DR Summary

### Principles

- Keep Phase 3 additive and validator-only: modify only `src/validate.ts` and
  `src/validate.test.ts`.
- Preserve existing validator behavior outside the two new ADR 011 rules:
  `checkSupportsTargets()` stays unchanged and no existing validator rule body
  is edited.
- Reuse current EvidenceRef normalization and existing patient-local /
  sample-lookup behavior rather than inventing a parallel ADR 011 resolver,
  while still emitting the exact new `V-TRANSFORM-*` messages.
- Treat `IMPORT_SOURCE_KINDS` as an intentionally narrow, validator-local
  subset of `SOURCE_KIND_CANONICAL`, commented against DESIGN §1.1.
- Exclude ADR 009 logic entirely from this phase.

### Decision Drivers

1. `checkReferentialIntegrity()` already provides the exact insertion seam for
   one local `validateTransformRules(...)` helper without widening scope.
2. ADR 011 requires supports-style resolution semantics for
   `transform.input_refs[*]`, but the user explicitly forbids changing
   `checkSupportsTargets()` or pulling schema/parser/view work into this phase.
3. The approved request fixes the exact rule surface, exact messages, exact
   tests, and exact file boundary, so the best plan is the smallest
   validator-local implementation that preserves all existing rule families.

### Viable Options

1. **Chosen: add `validateTransformRules(...)` and reuse the existing
   EvidenceRef normalization plus patient-local / sample-lookup behavior
   through local shared/wrapper logic.**  
   Pros:
   - satisfies the exact two-file scope
   - keeps `checkSupportsTargets()` unchanged
   - preserves existing rule bodies
   - keeps the ADR 011 change reviewable and fresh-session executable  
   Cons:
   - `V-TRANSFORM-02` cannot call the current `links.supports` emitters
     directly, because that would produce the wrong messages

2. **Refactor supports resolution into a new generic shared abstraction used by
   both supports and transform refs.**  
   Pros:
   - cleaner long-term architecture
   - less local duplication  
   Cons:
   - broader than the approved phase
   - risks incidental edits to existing validator rule bodies
   - puts the “keep `checkSupportsTargets()` unchanged” constraint at risk

3. **Inline all ADR 011 logic directly inside `checkReferentialIntegrity()`
   without a helper.**  
   Pros:
   - mechanically small  
   Cons:
   - violates the explicit helper requirement
   - makes later ADR 015 phases harder to review

### Why option 2 is rejected

- The user approved a validator-only phase with `checkSupportsTargets()`
  unchanged; a broader resolver refactor spends scope on architecture cleanup
  rather than the requested Phase 3 rules.

### Chosen Approach

Add one inline constant:

```ts
// Import-family source.kind values per DESIGN §1.1.
// Subset of SOURCE_KIND_CANONICAL consumed by V-TRANSFORM-01.
const IMPORT_SOURCE_KINDS = new Set<string>([
  "synthea_import",
  "mimic_iv_import",
]);
```

Then add one local `validateTransformRules(...)` helper called from
`checkReferentialIntegrity()` after the current supports checks. Implement:

- `V-TRANSFORM-01` as a simple local cross-check between
  `transform.activity` and `source.kind`
- `V-TRANSFORM-02` as transform-only validation that reuses the existing
  EvidenceRef normalization plus patient-local/sample lookup behavior for
  patient-local refs and encounter-bearing vitals-window refs, while adding the
  ADR 011 structural scheme gate for `kind:"external"`

No schema, type, parser, view, migration, or ADR 009 work lands here.

## Requirements Summary

- Modify only `src/validate.ts` and `src/validate.test.ts`.
- Add one new inline constant `IMPORT_SOURCE_KINDS`, narrower than
  `SOURCE_KIND_CANONICAL`, commented with DESIGN §1.1 as its source.
- `V-TRANSFORM-01` (err):
  - predicate: `event.transform?.activity ∈ {"import", "normalize"}`
  - requirement: `event.source.kind ∈ IMPORT_SOURCE_KINDS`
  - exact message:
    `V-TRANSFORM-01: transform.activity={activity} requires import-family source.kind; got source.kind={kind}.`
- `V-TRANSFORM-02` (err):
  - each `event.transform?.input_refs[i]` must resolve
  - reuse the existing EvidenceRef normalization plus patient-local/sample
    lookup behavior under the current supports resolver surface; do not invent
    new per-kind meaning
  - per-kind Phase 3 behavior:
    - `event` / `note` / `artifact`: resolve within the same patient directory
      per existing supports semantics
    - `vitals_window`: require a well-formed **encounter-bearing**
      `vitals://` URI with a parseable encounter host, reusing
      `parseEvidenceRef` URI validation
    - `external`: structural-only, not resolved; accepted schemes in this phase
      are `synthea://` and `mimic://`
    - `vitals` legacy alias: accepted and normalized to `vitals_window` via
      `parseEvidenceRef`; encounterless legacy vitals refs remain valid in
      `links.supports[]` only, not in `transform.input_refs[]`
  - exact unresolved message:
    `V-TRANSFORM-02: transform.input_refs[{i}] does not resolve: {kind}:{ref}`
  - exact external-scheme message:
    `V-TRANSFORM-02: transform.input_refs[{i}] has unrecognized external scheme: {ref}`
- Keep `checkSupportsTargets()` unchanged.
- Add one local helper such as `validateTransformRules(...)` from
  `checkReferentialIntegrity()` after the existing checks.
- Keep external refs in `links.supports[]` on the existing Phase 1/2 policy:
  they still bypass patient-local resolution there.
- Do not change any existing `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`,
  `V-FULFILL`, or `V-EVIDENCE` rule body.
- Do not add ADR 009 rule logic in this phase.

## Implementation Plan

1. **Add the Phase 3 constant and helper hook in `src/validate.ts`.**
   - Insert `IMPORT_SOURCE_KINDS` adjacent to the existing source-kind
     registry constants.
   - Use the exact comment requested in the approved prompt, and add an inline
     note that `manual_scenario` is intentionally excluded from this
     phase-local import-family subset.
   - Call `validateTransformRules(state, where, ev)` from
     `checkReferentialIntegrity()` after the current supports extraction and
     target checks, while leaving `checkSupportsTargets()` unchanged.

2. **Implement `V-TRANSFORM-01`.**
   - Read `ev.transform?.activity`.
   - Fire only for `import` and `normalize`.
   - Check `ev.source.kind` against `IMPORT_SOURCE_KINDS`.
   - Exclude `infer`, `summarize`, `extract`, and `transcribe`, plus events
     with no `transform` block.
   - Emit the exact required message:
     `V-TRANSFORM-01: transform.activity={activity} requires import-family source.kind; got source.kind={kind}.`

3. **Implement `V-TRANSFORM-02` using current resolver behavior plus a bounded
   external-scheme check.**
   - Iterate `transform.input_refs ?? []`; empty arrays are silent.
   - Reuse `parseEvidenceRef()` normalization so `kind:"vitals"` aliases
     normalize to `vitals_window`.
   - For transform vitals refs, explicitly validate that `ref` itself is an
     encounter-bearing `vitals://` URI; do not rely only on
     `expandVitalsWindowRef()` because it can succeed from selection data
     alone.
   - For `event` / `note` / `artifact` / `vitals_window`, route through the
     same effective patient-local / sample-lookup behavior already used by
     supports checking.
   - Require `transform.input_refs[*]` vitals refs to remain
     **encounter-bearing**; encounterless legacy vitals refs stay valid in
     `links.supports[]` only and must error in `transform.input_refs[]`.
   - For `external`, skip patient-local resolution and enforce only:
     non-empty ref plus approved scheme set `{synthea://, mimic://}`.
   - Emit only the two exact Phase 3 messages:
     - `V-TRANSFORM-02: transform.input_refs[{i}] does not resolve: {kind}:{ref}`
     - `V-TRANSFORM-02: transform.input_refs[{i}] has unrecognized external scheme: {ref}`

4. **Add targeted tests in `src/validate.test.ts`.**
   - `V-TRANSFORM-01` positives:
     - `activity:"import"` + `source.kind:"clinician_chart_action"` → err
     - `activity:"normalize"` + non-import kind → err
   - `V-TRANSFORM-01` negatives:
     - `activity:"import"` + `source.kind:"synthea_import"` → silent
     - `activity:"infer" | "summarize" | "extract" | "transcribe"` with any
       source kind → silent
     - no `transform` block → silent
   - `V-TRANSFORM-02` positives:
     - `input_refs:[{kind:"event",ref:"evt_nonexistent"}]` → err
     - `input_refs:[{kind:"external",ref:"ftp://unknown"}]` → err
   - `V-TRANSFORM-02` negatives:
     - existing `event` id → silent
     - `external` `synthea://...` → silent
     - valid `vitals_window` ref → silent
     - no `transform` block → silent
   - `V-TRANSFORM-02` edge:
     - `input_refs: []` → silent
     - encounterless legacy vitals ref in `transform.input_refs[]` → err

5. **Verification and boundary proof.**
   - Run:
     - `npm test`
     - `npm run check`
     - `npm run typecheck`
   - Boundary proof:
     - `git diff --name-only -- src/validate.ts src/validate.test.ts`
     - `git diff --name-only`
     - grep proof only `V-TRANSFORM-01|V-TRANSFORM-02` were added and no
       `V-CONTRA|V-RESOLVES` codes landed
     - grep proof no edits to `V-SRC|V-TIME|V-STATUS|V-INTERVAL|V-FULFILL|V-EVIDENCE`
       rule bodies

## Acceptance Criteria

- `src/validate.ts` adds only the Phase 3 ADR 011 validator logic for
  `V-TRANSFORM-01` and `V-TRANSFORM-02`.
- `IMPORT_SOURCE_KINDS` exists as the exact local inline constant requested
  for this phase.
- `validateTransformRules(...)` is called from
  `checkReferentialIntegrity()` after the existing checks.
- `V-TRANSFORM-01` fires only for `transform.activity` of `import` or
  `normalize` with non-import-family `source.kind`, using the exact message.
- `V-TRANSFORM-02` enforces the current EvidenceRef normalization plus
  patient-local/sample lookup behavior for transform input refs, while keeping
  `external` refs structural-only with accepted schemes `synthea://` and
  `mimic://`, using the exact messages.
- Encounterless legacy vitals refs remain acceptable in `links.supports[]` but
  fail in `transform.input_refs[]`.
- `checkSupportsTargets()` is unchanged.
- No ADR 009 logic lands.
- No existing `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, `V-FULFILL`, or
  `V-EVIDENCE` rule body is edited.
- `src/validate.test.ts` contains the exact requested positive, negative, and
  edge tests for both Phase 3 rules.
- `npm test`, `npm run check`, and `npm run typecheck` all pass.
- Boundary proof confirms only `src/validate.ts` and
  `src/validate.test.ts` changed.

## Risks and Mitigations

- Risk: “reuse the existing supports-target resolver” conflicts with the exact
  new `V-TRANSFORM-02` message contract.  
  Mitigation: keep `checkSupportsTargets()` unchanged and reuse the current
  EvidenceRef normalization plus patient-local/sample lookup behavior through
  local shared/wrapper logic that preserves existing semantics while
  formatting the new rule messages.

- Risk: `manual_scenario` appears under DESIGN §1.1’s broader Import-origin
  group.  
  Mitigation: treat the Phase 3 inline `IMPORT_SOURCE_KINDS` subset as an
  intentional **import-family** subset rather than a copy of the full group;
  `manual_scenario` remains excluded because it is a hand-authored fixture
  source, not an ADR 011 import/normalize provenance kind for this phase.

- Risk: `V-TRANSFORM-02` accidentally changes `links.supports[]` behavior for
  `external` refs.  
  Mitigation: keep transform-only structural scheme checks inside
  `validateTransformRules(...)`; supports keep the current bypass policy.

## ADR

### Decision

Implement Phase 3 as a validator-only ADR 011 addition in `src/validate.ts`
with matching tests in `src/validate.test.ts`, using one new local helper and
one new local `IMPORT_SOURCE_KINDS` constant.

### Drivers

- user-approved validator-only scope
- existing referential-integrity seam in `checkReferentialIntegrity()`
- hard requirement to preserve current supports behavior and existing rule
  bodies

### Alternatives considered

- additive helper-based wrapper over current resolver behavior
- broader shared-resolver refactor
- direct in-loop implementation without a helper

### Why chosen

It is the only option that satisfies all hard constraints while still keeping
Phase 3 fresh-session executable and grounded in the repo’s current validator
structure.

### Consequences

- Phase 3 should stay a two-file diff.
- The implementation may add local shared/wrapper resolution plumbing inside
  `src/validate.ts`, but it must not widen scope or alter existing rule bodies.
- The narrower `IMPORT_SOURCE_KINDS` is an intentional phase-local contract.

### Follow-ups

- Later ADR 015 phases can add ADR 009 validator rules separately.
- If maintainers later want a broader generic resolver abstraction, that should
  be a separate scoped change, not bundled into Phase 3.

## Copy-paste ready fresh-session prompt

```text
Implement ADR 015 Phase 3 as a validator-only ADR 011 change. Modify only `src/validate.ts` and `src/validate.test.ts`.

Scope:
- Add `V-TRANSFORM-01` (err) to `src/validate.ts`.
- Add `V-TRANSFORM-02` (err) to `src/validate.ts`.
- Add positive / negative / edge tests for both rules in `src/validate.test.ts`.
- Add one new inline constant `IMPORT_SOURCE_KINDS` in `src/validate.ts`.

New constant:
// Import-family source.kind values per DESIGN §1.1.
// Subset of SOURCE_KIND_CANONICAL consumed by V-TRANSFORM-01.
const IMPORT_SOURCE_KINDS = new Set<string>([
  "synthea_import",
  "mimic_iv_import",
]);
If DESIGN §1.1 has grown additional import-family values since ADR 006 pass 2, extend the set to match.

Hard constraints:
- No schema, type, parser, view, or migration changes.
- No ADR 009 rule logic in this phase.
- Keep `checkSupportsTargets` unchanged.
- Add one local helper `validateTransformRules(...)` and call it from `checkReferentialIntegrity()` after existing checks.
- Do not change any existing validator rule body.
- In `supports[]`, `kind:"external"` still bypasses patient-local resolution.
- In `transform.input_refs[]`, `kind:"external"` gets the new structural scheme check for this phase only.
- Encounterless legacy vitals refs remain allowed in `links.supports[]` only; they must fail in `transform.input_refs[]`.

Rules:
- `V-TRANSFORM-01` (err): if `event.transform?.activity ∈ {"import", "normalize"}`, then `event.source.kind` MUST be a member of `IMPORT_SOURCE_KINDS`.
- Exact `V-TRANSFORM-01` message:
  `V-TRANSFORM-01: transform.activity={activity} requires import-family source.kind; got source.kind={kind}.`
- `V-TRANSFORM-02` (err): each `event.transform?.input_refs[i]` MUST resolve, reusing the current EvidenceRef normalization plus patient-local/sample lookup behavior.
- Per-kind resolution:
  - `event` / `note` / `artifact`: resolve within the same patient directory per existing supports semantics.
  - `vitals_window`: require a well-formed **encounter-bearing** `vitals://` URI with a parseable encounter host; reuse `parseEvidenceRef` URI validation.
  - `external`: structural check only; accepted schemes in this phase: `synthea://`, `mimic://`.
  - `vitals` legacy alias: accepted and normalized to `vitals_window` via `parseEvidenceRef`.
- Exact `V-TRANSFORM-02` messages:
  - `V-TRANSFORM-02: transform.input_refs[{i}] does not resolve: {kind}:{ref}`
  - `V-TRANSFORM-02: transform.input_refs[{i}] has unrecognized external scheme: {ref}`

Tests:
- `V-TRANSFORM-01` positive: `activity:"import"` with `source.kind:"clinician_chart_action"` → err.
- `V-TRANSFORM-01` positive: `activity:"normalize"` with non-import kind → err.
- `V-TRANSFORM-01` negative: `activity:"import"` with `source.kind:"synthea_import"` → silent.
- `V-TRANSFORM-01` negative: `activity:"infer" / "summarize" / "extract" / "transcribe"` with any `source.kind` → silent.
- `V-TRANSFORM-01` negative: no `transform` block → silent.
- `V-TRANSFORM-02` positive: `input_refs:[{kind:"event",ref:"evt_nonexistent"}]` → err.
- `V-TRANSFORM-02` positive: `input_refs:[{kind:"external",ref:"ftp://unknown"}]` → err.
- `V-TRANSFORM-02` negative: `input_refs:[{kind:"event",ref:<existing id>}]` → silent.
- `V-TRANSFORM-02` negative: `input_refs:[{kind:"external",ref:"synthea://enc_abc?resource=Observation/obs_71"}]` → silent.
- `V-TRANSFORM-02` negative: `input_refs:[{kind:"vitals_window",ref:"vitals://enc_001?name=lactate&from=...&to=..."}]` → silent.
- `V-TRANSFORM-02` negative: no `transform` block → silent.
- `V-TRANSFORM-02` edge: `input_refs: []` → silent.
- `V-TRANSFORM-02` edge: encounterless legacy vitals ref in `transform.input_refs[]` → err.

Verification:
- `npm test`
- `npm run check`
- `npm run typecheck`
- `git diff --name-only -- src/validate.ts src/validate.test.ts`
- grep proof only `V-TRANSFORM-01|V-TRANSFORM-02` were added and no `V-CONTRA|V-RESOLVES` codes landed
- grep proof no edits to `V-SRC|V-TIME|V-STATUS|V-INTERVAL|V-FULFILL|V-EVIDENCE` rule bodies

Commit message:
- `Phase 3 — ADR 011 validator (V-TRANSFORM-01..02) (ADR 015)`
```
