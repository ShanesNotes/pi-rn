# PRD — ADR 015 Phase 7 migration script + corpus sweep

## Goal

Finish ADR 015 with a deterministic v0.2->v0.3 partial migration script and a
repo-owned corpus sweep that leaves the chart green at:

- `npm test`
- `npm run typecheck`
- `npm run check` -> `0 errors, 0 warnings`

## Scope

In scope:
- `scripts/migrate-v02-to-v03.ts`
- `scripts/migrate-v02-to-v03.test.ts`
- `patients/patient_001/**`
- `pi-chart.yaml`
- `src/**/*.test.ts`
- `src/test-helpers/**`
- committed example/seed files still using v0.2 authoring shapes, if any

Out of scope:
- `src/types.ts`
- `src/evidence.ts`
- `src/validate.ts`
- `schemas/event.schema.json`
- `src/views/*.ts`
- `src/derived.ts`
- `src/write.ts`
- `decisions/*.md`
- any new validator rule
- `transform` backfill
- synthesized `contradicts` events

## User Story

As the ADR 015 maintainer, I want one final migration-and-sweep phase that
canonicalizes repo-owned v0.2 literals, preserves explicit compatibility
coverage, and drives the seed chart to zero warnings so ADRs 009/010/011 are
fully shipped end-to-end.

## Requirements

1. Add `scripts/migrate-v02-to-v03.ts`.
2. Add `scripts/migrate-v02-to-v03.test.ts`.
3. The script is deterministic.
4. The script is idempotent.
5. The script is per-patient.
6. The script stages writes and validates before mutating the live tree.
7. On validation failure the live tree is untouched.
8. Structured vitals refs rewrite from legacy object form to canonical
   `vitals_window + ref + selection`.
9. Structured event refs rewrite from `{kind:"event", id}` to `{kind:"event", ref}`.
10. Structured note refs rewrite from `{kind:"note", id}` to `{kind:"note", ref}`.
11. Structured artifact refs rewrite from `{kind:"artifact", id}` to
    `{kind:"artifact", ref}`.
12. Bare-string supports remain unchanged by the script.
13. `links.addresses[*]` rewrites to `links.resolves[*]` only when the target is
    open-loop-kind.
14. `links.addresses[*]` is preserved when the target is an `assessment/problem`.
15. `links.contradicts` receives no backfill.
16. `transform` receives no backfill.
17. `pi-chart.yaml` schema version bumps to `0.3.0-partial`.
18. `patients/<id>/chart.yaml` schema version bumps to `0.3.0-partial`.
19. Running the migrator twice produces byte-identical staged output.
20. Post-migration `validateChart` on staged output returns zero errors before
    any live-path rename.
21. Staged warnings may be reported during 7a/7b and do not block rename when
    they are the known pre-sweep `V-EVIDENCE-01` warnings the script is not
    authorized to rewrite.
22. `patient_001` is normalized to remove the exact five current
    `V-EVIDENCE-01` warnings.
23. `patient_001` normalization does not change authored clinical meaning.
24. No new validator output appears after the sweep.
25. Repo-owned current-fixture helpers/tests are rewritten to canonical
    v0.3 authoring where they represent current behavior.
26. Intentional legacy compatibility tests are kept and labeled
    `// v0.2 back-compat`.
27. Historical tests that explicitly assert v0.2 migration output may stay
    historical and should be labeled rather than rewritten.
28. Full verification ends at `0 errors, 0 warnings`.
29. Final diff scope is confined to approved files.
30. Final commit body includes the one-line audit report with counts.

## Acceptance Criteria

1. The final implementation is split into 7a/7b/7c or otherwise proves the same
   isolation of script, seed sweep, and repo sweep.
2. The migrator test suite covers every rewrite rule plus idempotency.
3. `patient_001` no longer emits any `V-EVIDENCE-01` warning.
4. `npm run check` ends at `0 errors, 0 warnings`.
5. No frozen boundary files are changed.
6. Explicit v0.2 compatibility tests remain in place and are clearly marked.
7. The final commit message includes the audit-count sentence.
