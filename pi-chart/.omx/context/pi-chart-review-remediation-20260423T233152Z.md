# Context Snapshot — pi-chart review remediation

Task statement: Run Ralph on the whole-pi-chart code review findings and finish the concrete remediation work.

Desired outcome:
- Correct actual implementation gaps found by review.
- Remove misleading clinician-review-as-focus language.
- Bring ADR/roadmap/docs status in line with current code.
- Keep the product focus on pi-chart as a clinical memory substrate.
- Verify with tests, typecheck, and chart validation.

Known facts/evidence:
- `npm test`, `npm run typecheck`, and `npm run check` passed before remediation.
- Review found ROADMAP still says ADR 009-011 code phases are pending, while schema/types/parser/validator/views/migration exist and chart files are `0.3.0-partial`.
- Review found ADR 002 is not fully honored in `openLoops`: failed fulfillments still use legacy `data.outcome` instead of `data.status_detail`.
- Review found `patientRoot()` joins raw `patientId`, which can escape `patients/`.
- Review found `writeArtifactRef()` defaults missing authorship to `pi-agent` and does not verify artifact file existence.
- User does not want an explicit “clinician-review artifact” to be the focus; they are the clinician planting project seeds.

Constraints:
- Work inside `pi-chart`; do not modify unrelated `pi-sim` dirty files.
- Preserve user/previous dirty changes unless directly needed.
- No new dependencies.
- Keep diffs small and reversible.
- Use existing primitives before adding new abstractions.

Unknowns/open questions:
- Whether a future dedicated memory-proof projection should exist remains fixture-driven. This pass should only remove over-promoted artifact language, not design a new output.
- Whether artifact references should copy bytes or remain pointer-only. This pass should enforce existence for pointer safety without expanding API scope.

Likely codebase touchpoints:
- `src/types.ts`
- `src/write.ts`
- `src/views/openLoops.ts`
- related tests under `src/**/*.test.ts`
- `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`
- `clinical-reference/broad-ehr-skeleton.md`
- `schemas/event.schema.json`
