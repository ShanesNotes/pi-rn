# Context Snapshot — ADR 015 Phase 3 / ADR 011 validator rules

## Task statement

Plan Phase 3 of ADR 015: implement ADR 011 validator rules only, additive to the current validator surface, with code changes restricted to `src/validate.ts` and `src/validate.test.ts`.

## Desired outcome

Produce a consensus-approved execution plan, PRD, and test spec for landing:
- `V-TRANSFORM-01` (err) — import/normalize transform activities require import-family `source.kind`
- `V-TRANSFORM-02` (err) — `transform.input_refs[*]` must resolve under ADR 011 semantics

No schema, type, parser, view, or migration changes in this phase.

## Known facts / evidence

- Phase 1 already landed the `transform` substrate in schema/types/parser.
- Phase 2 added only `V-EVIDENCE-01..03` in `src/validate.ts` via `validateEvidenceRules(...)` called from `checkReferentialIntegrity()` after `checkSupportsTargets(...)`.
- `src/validate.ts` already contains:
  - `SOURCE_KIND_CANONICAL`
  - `checkReferentialIntegrity()`
  - `checkSupportsTargets()` with current supports resolution behavior
  - `resolveSupportsString()` / `resolveSupportsObject()`
- Current supports semantics:
  - bare strings resolve as event ids or `vitals://` URIs
  - structured refs normalize through `parseEvidenceRef()`
  - `event` / `note` / `artifact` resolve patient-locally
  - `vitals_window` validates shape and requires matching samples
  - `external` currently bypasses local resolution
- `parseEvidenceRef()` in `src/evidence.ts` already normalizes legacy `kind: "vitals"` to canonical `kind: "vitals_window"` and validates/expands `vitals://` URIs.
- `src/types.ts` already defines `TransformActivity = "import" | "normalize" | "extract" | "summarize" | "infer" | "transcribe"` and optional `transform?: TransformBlock` with `input_refs?: EvidenceRef[]`.
- DESIGN §1.1 import-family values currently present in repo inspection:
  - `synthea_import`
  - `mimic_iv_import`
- ADR 011 validator contract (`decisions/011-transform-activity-provenance.md`) states:
  - `V-TRANSFORM-01` fires when `transform.activity` is `import` or `normalize` and `source.kind` is not import-family
  - `V-TRANSFORM-02` reuses supports-style resolution semantics, except `kind: external` is structural-only and accepted schemes are bounded
- ADR 015 implementation contract (`decisions/015-adr-009-011-implementation.md`) says Phase 4 / ADR 011 validator work should add:
  - a narrower `IMPORT_SOURCE_KINDS` constant derived from DESIGN §1.1
  - inline transform-activity handling
  - reuse of the supports resolver for V-TRANSFORM-02

## Constraints

- Modify only `src/validate.ts` and `src/validate.test.ts`.
- Add exactly one new inline constant in `src/validate.ts`:
  `IMPORT_SOURCE_KINDS = new Set(["synthea_import", "mimic_iv_import"])`, extended only if DESIGN §1.1 now lists more import-family values.
- Keep `checkSupportsTargets` unchanged.
- Add one local helper such as `validateTransformRules(...)` called from `checkReferentialIntegrity()` after existing checks.
- No ADR 009 rule logic in this phase.
- No changes to existing `V-SRC|V-TIME|V-STATUS|V-INTERVAL|V-FULFILL|V-EVIDENCE` rule bodies.
- In `supports[]`, external refs still bypass patient-local resolution.
- In `transform.input_refs[]`, external refs gain the new structural scheme check for this phase only.

## Unknowns / open questions

- Best low-duplication shape for reusing existing supports-target resolution in `transform.input_refs[]` without modifying `checkSupportsTargets()`.
- Whether to factor a small shared local resolver helper under `checkSupportsTargets()` versus wrapping existing functions with transform-specific message formatting.
- Exact test fixture mutations needed to exercise `transform.input_refs[]` without expanding file scope.

## Likely code touchpoints

- `src/validate.ts`
  - `SOURCE_KIND_CANONICAL`
  - `checkReferentialIntegrity()`
  - `checkSupportsTargets()` / `resolveSupportsString()` / `resolveSupportsObject()`
  - `validateEvidenceRules()` as the nearest existing local-helper pattern
- `src/validate.test.ts`
  - existing `copyFixture()` / timeline mutation helpers
  - Phase 2 validator-rule test block as style precedent

## Risk notes

- Reusing supports resolution while preserving the exact requested `V-TRANSFORM-02` messages is the main implementation tension.
- `manual_scenario` is listed in DESIGN §1.1 under the Import-origin group, but the Phase 3 prompt explicitly narrows `IMPORT_SOURCE_KINDS` to a subset containing `synthea_import` and `mimic_iv_import`; plan should treat that narrower constant as intentional for this phase.
