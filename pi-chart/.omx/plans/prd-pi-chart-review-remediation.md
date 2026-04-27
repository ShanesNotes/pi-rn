# PRD — pi-chart review remediation

## Goal

Resolve the actionable whole-project review findings so pi-chart remains a simple, patient-scoped clinical memory substrate with truthful ADR/docs status and verified write/view boundaries.

## Requirements

1. Add patient-id/path containment so `PatientScope.patientId` cannot escape `patients/`.
2. Make open-loop failure semantics honor ADR 002 `data.status_detail`.
3. Remove silent `pi-agent` authorship from artifact references.
4. Validate artifact references point to existing patient-local artifact files.
5. Update stale ADR/status docs for ADR 009-011 and current `0.3.0-partial` behavior.
6. Reframe “clinician-review artifact” language as a derived/proof projection, not the project focus.
7. Preserve existing public product shape: chart files, write APIs, six view primitives, migration/validation, derived disposable markdown.
8. Do not introduce new dependencies or new clinical primitives.

## Acceptance Criteria

1. Traversal-style patient ids fail before reads/writes/validation/rebuild can access paths outside `patients/`.
2. A final action fulfillment with `data.status_detail: "failed"` produces an open-loop `failed` state.
3. A final action fulfillment with successful terminal detail closes the loop.
4. `writeArtifactRef()` requires explicit author or uses the same normal write/session behavior without hardcoded authorship.
5. Artifact refs fail when the target file is missing and pass when present.
6. ROADMAP/README/ARCHITECTURE/schema descriptions no longer claim implemented ADR 015 phases are pending.
7. ADR 016/reference language does not make “clinician-review artifact” the focus.
8. `npm test`, `npm run typecheck`, and `npm run check` pass.
