# Ralph context snapshot — ADR17 views + 17V integration

## Task statement
Execute approved OMX plan `.omx/plans/ralplan-adr17-views-17v-integration.md` in `/home/ark/pi-rn/pi-chart`.

## Desired outcome
Implement 17b review-state view, 17c attestation-state view, then gated 17V profile/validator integration. Final verification: `npm test`, `npm run typecheck`, `npm run check`, rule-code grep in `src/validate.ts` and `src/validate.test.ts`, and ADR17 diff limited to expected files.

## Known facts/evidence
- Preflight base ref recorded in `/tmp/adr17-base-ref.txt` before ADR17 edits.
- Preflight dirty status recorded in `/tmp/adr17-preflight-status.txt`.
- Current unrelated dirty files: `docs/prototypes/pi-chart-agent-canvas.html`, `package.json`, `package-lock.json`, `scripts/agent-canvas.ts`.
- Plan source: `.omx/plans/ralplan-adr17-views-17v-integration.md`.
- Handoff source: `docs/plans/handoff-adr17-17b-17c-views-and-17v-integration.md`.

## Constraints
- Do not touch unrelated dirty files, docs/plans, decisions, patients, package files, event schema, `src/views/projection.ts`, pi-agent, or pi-sim.
- Preserve lane ownership: 17b view files only; 17c view files only; 17V only `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`.
- Full 17V starts only after both view lanes exist, focused tests pass, and rule markers are grepable.
- `V-ATTEST-03` warning, `V-REVIEW-05` error.

## Unknowns/open questions
- Existing validator helper/test patterns must be inspected before implementation.
- Existing event shapes may require local helper normalization.

## Likely codebase touchpoints
- `src/views/reviewState.ts`, `src/views/reviewState.test.ts`
- `src/views/attestationState.ts`, `src/views/attestationState.test.ts`
- `schemas/profiles/index.json`, `src/validate.ts`, `src/validate.test.ts`
