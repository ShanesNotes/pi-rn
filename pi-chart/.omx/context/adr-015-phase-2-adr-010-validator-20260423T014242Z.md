# Context Snapshot — ADR 015 Phase 2 / ADR 010 validator rules

## Task statement

Plan Phase 2 of ADR 015: implement ADR 010 validator rules only, additive to
the current Phase 1 substrate. The requested scope is three new rules in
`src/validate.ts` plus matching tests in `src/validate.test.ts`, with no
schema, type, parser, view, or migration changes.

## Desired outcome

Produce a consensus-approved implementation plan that lands:

- `V-EVIDENCE-01` as a warning for bare-string `links.supports[]` entries on
  agent-authored inferred assessments
- `V-EVIDENCE-02` as an error for multiple `role:"primary"` supports on one
  event
- `V-EVIDENCE-03` as an error for cyclic or too-deep `derived_from` chains,
  reusing the existing evidence-chain depth cap

The plan must keep Phase 2 bounded to validator/test changes, preserve existing
rules, and define concrete verification gates.

## Known facts / evidence

- Current baseline is commit `115255b` (`Phase 1 — schema + types + parser for
  ADRs 009/010/011 (ADR 015)`).
- `src/validate.ts` already owns:
  - canonical source kind registry in `SOURCE_KIND_CANONICAL`
  - support traversal and referential integrity checks in
    `checkReferentialIntegrity()`, `checkSupportsTargets()`,
    `resolveSupportsString()`, `resolveSupportsObject()`
  - current assessment evidence gate in `hasObservationEvidence()`
  - fulfillment/status/interval rules that must remain unchanged in this phase
- `src/evidence.ts` Phase 1 substrate already normalizes `EvidenceRef` input
  and preserves `role`, `basis`, `selection`, `derived_from`, and
  `kind:"external"`.
- `src/views/evidenceChain.ts` currently applies the only obvious repo-local
  evidence depth cap via `const depth = params.depth ?? 3`; no shared named
  constant is exported yet from that file.
- `src/validate.test.ts` already contains Phase 1 compatibility coverage for:
  - legacy and canonical vitals refs
  - structural `external` refs
  - existing validator rule families (`V-SRC`, `V-TIME`, `V-STATUS`,
    `V-INTERVAL`, `V-FULFILL`)
- There are currently no `V-EVIDENCE-*`, `V-TRANSFORM-*`, `V-CONTRA-*`, or
  `V-RESOLVES-*` rule strings in `src/validate.ts`.

## Constraints

- No schema changes.
- No type changes.
- No parser changes.
- No view changes.
- No migration or fixture-format changes.
- No changes to existing validator rule behavior outside the three new
  `V-EVIDENCE-*` rules.
- `kind:"external"` stays structurally valid and continues to bypass local
  supports-target resolution.
- Verification gates must include `npm test`, `npm run check`, `npm run typecheck`,
  and a final grep boundary check that Phase 2 did not pull ADR 009/011 logic
  forward.

## Unknowns / open questions

- Whether Phase 2 should extract and export a shared named depth-cap constant
  from `src/views/evidenceChain.ts` or another module so `src/validate.ts` can
  reuse it without introducing unintended view coupling. The user explicitly
  asked to reuse the existing constant instead of redefining `8`, but the
  current grounded code only shows an inline view default of `3`.
- Exact rule placement inside `src/validate.ts`: inline within
  `checkReferentialIntegrity()` versus small helper functions invoked from that
  pass.
- Best way to count `V-EVIDENCE-01` warnings when multiple bare strings appear
  in a qualifying inferred assessment.

## Likely touchpoints

- `src/validate.ts`
- `src/validate.test.ts`
- possibly a tiny constant-export site if a shared evidence depth-cap must be
  surfaced explicitly for Phase 2
- `.omx/plans/prd-adr-015-phase-2-adr-010-validator.md`
- `.omx/plans/test-spec-adr-015-phase-2-adr-010-validator.md`
