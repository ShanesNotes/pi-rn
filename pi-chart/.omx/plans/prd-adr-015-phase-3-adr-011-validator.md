# PRD — ADR 015 Phase 3 ADR 011 validator rules

## Goal

Land the Phase 3 ADR 011 validator rules as one bounded additive change:

- `V-TRANSFORM-01` (err): import/normalize transform activities require an
  import-family `source.kind`
- `V-TRANSFORM-02` (err): `transform.input_refs[*]` must resolve under ADR 011
  semantics

## Scope

In scope:

- `src/validate.ts`
- `src/validate.test.ts`

Out of scope:

- schema changes
- type changes
- parser changes
- view changes
- migration changes
- ADR 009 logic
- changes to `checkSupportsTargets()`
- changes to any existing validator rule body

## User Story

As the ADR 015 maintainer, I want ADR 011’s transform validator rules to land
as a validator-only follow-on to the already-landed transform substrate, so
transform provenance is enforceable before later ADR 015 phases.

## Requirements

1. Add one inline constant in `src/validate.ts`:
   ```ts
   // Import-family source.kind values per DESIGN §1.1.
   // Subset of SOURCE_KIND_CANONICAL consumed by V-TRANSFORM-01.
   const IMPORT_SOURCE_KINDS = new Set<string>([
     "synthea_import",
     "mimic_iv_import",
   ]);
   ```
   If DESIGN §1.1 has grown additional import-family values since ADR 006 pass
   2, extend the set to match.
2. Add one local helper `validateTransformRules(...)` and call it from
   `checkReferentialIntegrity()` after the existing checks.
3. `V-TRANSFORM-01` fires only when `transform.activity` is `import` or
   `normalize` and `source.kind` is not in `IMPORT_SOURCE_KINDS`.
4. `V-TRANSFORM-01` uses this exact message:
   `V-TRANSFORM-01: transform.activity={activity} requires import-family source.kind; got source.kind={kind}.`
5. `V-TRANSFORM-02` validates `transform.input_refs[*]` using the current
   EvidenceRef normalization plus patient-local/sample lookup behavior already
   present under the supports resolver surface.
6. `V-TRANSFORM-02` per-kind behavior:
   - `event` / `note` / `artifact`: resolve within the same patient directory
     per existing supports semantics
   - `vitals_window`: require a well-formed **encounter-bearing** `vitals://`
     URI with a parseable encounter host, reusing `parseEvidenceRef` URI
     validation
   - `external`: structural-only, not resolved; accepted schemes in this phase
     are `synthea://` and `mimic://`
   - `vitals` legacy alias: accepted and normalized to `vitals_window`
   - encounterless legacy vitals refs remain valid in `links.supports[]` only,
     not in `transform.input_refs[]`
7. `V-TRANSFORM-02` uses these exact messages:
   - `V-TRANSFORM-02: transform.input_refs[{i}] does not resolve: {kind}:{ref}`
   - `V-TRANSFORM-02: transform.input_refs[{i}] has unrecognized external scheme: {ref}`
8. `checkSupportsTargets()` remains unchanged.
9. Existing `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, `V-FULFILL`, and
   `V-EVIDENCE` rule bodies remain unchanged.
10. No ADR 009 rule logic lands in this phase.
11. `supports[]` external refs keep the existing bypass behavior; only
    `transform.input_refs[]` external refs get the new structural scheme gate.
12. `manual_scenario` remains excluded from `IMPORT_SOURCE_KINDS` as an
    intentional phase-local choice even though DESIGN §1.1 places it in the
    broader Import-origin group; the code comment should make that exclusion
    explicit.
13. Transform vitals refs must validate the `ref` string as an
    encounter-bearing `vitals://` URI explicitly; do not rely only on
    selection-derived expansion.

## Acceptance Criteria

1. Only `src/validate.ts` and `src/validate.test.ts` change.
2. `src/validate.ts` adds only the Phase 3 ADR 011 validator behavior.
3. `IMPORT_SOURCE_KINDS` exists exactly as the new local inline constant for
   this phase.
4. `validateTransformRules(...)` is called from
   `checkReferentialIntegrity()` after the existing checks.
5. `V-TRANSFORM-01` behaves exactly as specified and uses the exact approved
   message.
6. `V-TRANSFORM-02` behaves exactly as specified and uses the exact approved
   messages.
7. Encounterless legacy vitals refs remain acceptable in `links.supports[]`
   but fail in `transform.input_refs[]`.
8. `checkSupportsTargets()` is unchanged.
9. No ADR 009 logic lands.
10. No existing validator rule body changes.
11. `src/validate.test.ts` contains the requested positive, negative, and edge
    tests for both new rules.
12. `npm test`, `npm run check`, and `npm run typecheck` all pass.
14. Boundary proof confirms no schema/type/parser/view/migration drift and no
    unintended rule-family edits.
