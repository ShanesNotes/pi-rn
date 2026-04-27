# Test Spec — ADR 015 Phase 2 ADR 010 validator rules

## Objective

Prove that Phase 2 adds only the requested ADR 010 validator rules, keeps the
validator/test-only scope intact, and does not pull ADR 009 / ADR 011 logic or
other validator-family changes forward.

## Required Proof Points

1. `V-EVIDENCE-01`
   - warns for agent-family inferred assessments with bare-string
     `links.supports[]` entries
   - stays silent for human-authored, non-inferred, or non-assessment events
   - warns only on the bare-string entries in mixed bare-string/object support
     arrays
2. `V-EVIDENCE-02`
   - errors when two object-form supports carry `role:"primary"`
   - stays silent for one primary plus many non-primary refs
   - stays silent for zero primary refs
   - ignores bare strings entirely
3. `V-EVIDENCE-03`
   - errors on a cycle at depth 2
   - stays silent for a linear chain whose deepest node is depth 8
   - errors for a linear chain whose deepest node is depth 9
   - stays silent for empty / absent `derived_from`
   - uses normalized `kind + ref` identity in cycle detection
4. External-ref compatibility
   - structurally valid `external` refs remain acceptable in supports
   - new evidence rules do not accidentally force local target-id resolution
     for `external`
5. Existing validator behavior
   - new fixtures do not accidentally fail because of the pre-existing
     assessment-evidence rule; cycle/depth tests preserve one valid
     observation/vitals/artifact support or use a non-assessment event when the
     rule under test does not require assessment semantics

## Global Gates

- `npm test`
- `npm run check`
- `npm run typecheck`

## Phase-Boundary Checks

- `git diff --name-only` shows only `src/validate.ts` and
  `src/validate.test.ts` changed for the implementation phase.
- Final grep confirms only `V-EVIDENCE-01|V-EVIDENCE-02|V-EVIDENCE-03` were
  added and no new `V-TRANSFORM|V-CONTRA|V-RESOLVES` strings appear.
- Final review confirms no unintended edits to `V-SRC`, `V-TIME`, `V-STATUS`,
  `V-INTERVAL`, or `V-FULFILL`.
