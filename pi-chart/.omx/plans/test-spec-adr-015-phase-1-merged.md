# Test Spec — ADR 015 Phase 1 merged substrate update

## Objective

Prove that the Phase 1 substrate change is additive, backward-compatible at the
runtime boundary, and does not pull later ADR 015 phases forward.

## Required Proof Points

1. Schema acceptance
   - `src/schema.test.ts` accepts canonical structured `EvidenceRef`.
   - `src/schema.test.ts` accepts additive `transform`, `links.resolves`, and
     `links.contradicts` fields.
2. Parser normalization
   - `src/evidence.test.ts` proves bare ids normalize to `{kind, ref}`.
   - `src/evidence.test.ts` proves legacy structured vitals normalize to
     `kind:"vitals_window"` plus `selection`.
   - `src/evidence.test.ts` proves canonical object refs preserve `role`,
     `basis`, `selection`, `derived_from`, and `kind:"external"`.
3. Write compatibility
   - `src/write.test.ts` proves current write-side support validation accepts
     canonical refs and still accepts legacy structured vitals refs.
4. Validator compatibility
   - `src/validate.test.ts` proves both legacy structured vitals refs and
     canonical `vitals_window` refs validate through the current compatibility
     path.
   - `src/validate.test.ts` does not introduce new Phase 2+ rule assertions.
5. View stability
   - `src/views/evidenceChain.test.ts` proves legacy vitals refs and canonical
     `vitals_window` refs produce the same `EvidenceNode` output shape:
     `{kind:"vitals", metric, points}`.

## Global Gates

- `npm test`
- `npm run check`
- `npm run typecheck`

## Phase-Boundary Checks

- Grep the final diff for `V-EVIDENCE|V-TRANSFORM|V-CONTRA|V-RESOLVES`; expect
  no new hits outside unchanged docs/ADRs.
- Inspect changed view code for unintended `role` or `contradicts` surface
  additions; expect none in Phase 1.
