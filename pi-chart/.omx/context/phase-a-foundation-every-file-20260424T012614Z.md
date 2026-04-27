# Context Snapshot: Phase A Foundation Every-File Pass

## Task Statement

Continue preparing the `pi-chart` foundational codebase for Phase A implementation, with a repo-wide pass through every file.

## Desired Outcome

- The foundational implementation supports Phase A research outputs, especially A0a-A0c, A1-A2, and in-progress A3.
- Gaps between Phase A artifacts and code are identified, fixed when low-risk, and documented when still open.
- All changes are verified with typecheck, tests, chart rebuild, and chart validation.

## Known Facts / Evidence

- A0-A2 are complete; A3 is in progress.
- Prior pass added an initial bridge for canonical `assessment.subtype = "constraint"` events:
  - `currentState(axis:"constraints")` prefers event-stream constraint assessments over `constraint_set` cache.
  - `readActiveConstraints()` now exposes active constraint events and review actions.
  - Validator allows `assessment:constraint`, `action:constraint_review`, and `action:problem_review` status/interval forms.
- The repo has 90 tracked non-binary files excluding node_modules and image/PDF assets.
- Full verification from the prior pass was green:
  - `npm run typecheck`
  - `npm test`
  - `npm run check`

## Constraints

- Follow Ralph gate: context snapshot exists before execution; PRD and test spec exist before implementation.
- Preserve append-only/provenance semantics and patient isolation.
- No new dependencies without explicit request.
- Keep diffs small and reversible.
- Do not couple `pi-chart` to hidden `pi-sim`.
- Treat Phase A research as schema slot proposals; do not silently finalize high-impact open-schema choices.

## Unknowns / Open Questions

- V-CON-01 read-receipt mechanism is still open schema design.
- `constraints.schema.json` still represents the legacy cache shape.
- A3 may introduce vital-sign-specific gaps not yet reflected in schema, views, or validation.
- Need confirm all docs, schemas, source files, fixtures, and scripts align after repo-wide inspection.

## Likely Codebase Touchpoints

- Phase A docs: `clinical-reference/phase-a/*.md`
- Primitive docs: `CLAIM-TYPES.md`, `DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`
- Schemas: `schemas/*.schema.json`
- Types/API: `src/types.ts`, `src/index.ts`, `src/read.ts`, `src/write.ts`
- Validation: `src/validate.ts`, `src/schema.ts`, tests
- Views: `src/views/*.ts`, tests
- Derived output: `src/derived.ts`, scripts
- Seed chart: `patients/patient_001/**`

