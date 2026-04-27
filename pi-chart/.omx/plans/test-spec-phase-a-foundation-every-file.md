# Test Spec: Phase A Foundation Every-File Pass

## Required Verification

- `npm run typecheck`
- `npm test`
- `npm run check`

## Focused Regression Expectations

- Constraint foundation:
  - `assessment.subtype = "constraint"` is readable as an active constraint.
  - Legacy `constraint_set` cache remains backward-compatible.
  - `action.subtype = "constraint_review"` is accepted as a review action.
- Problem foundation:
  - `activeProblems()` aliases `currentState(axis:"problems")`.
  - `assessment.subtype = "problem"` remains active-state filtered and supersession-aware.
- Validation:
  - Phase A foundational subtypes have explicit status/detail and interval behavior.
  - Existing referential integrity, patient isolation, and evidence rules remain green.

## Completion Evidence

- Fresh command outputs must show zero test failures and zero chart validation errors.
- Any known non-implemented Phase A design choices must be listed as remaining risks.

