# Test Spec — pi-chart review remediation

## Required Proof

1. Unit tests cover invalid patient ids with path traversal or separators.
2. Unit tests cover `openLoops()` failure from `data.status_detail`.
3. Existing legacy `data.outcome` behavior is either removed or explicitly limited to back-compat without contradicting ADR 002.
4. Unit tests cover `writeArtifactRef()` missing artifact rejection.
5. Unit tests cover `writeArtifactRef()` valid patient-local artifact path success with explicit author.
6. Typecheck passes.
7. Full test suite passes.
8. Chart rebuild + validation passes with zero errors and warnings.

## Manual Review Checks

1. Search docs for “clinician-review artifact” and ensure it is not the named focus.
2. Search docs for “code phases pending” and stale ADR 015 Phase 0 language.
3. Confirm README growth path points to broad EHR skeleton / clinical memory direction and current `0.3.0-partial` status.
