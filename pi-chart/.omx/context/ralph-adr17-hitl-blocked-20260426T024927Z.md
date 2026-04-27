# Context snapshot — Ralph ADR17 blocked pending HITL

Task statement:
- User invoked `$ralph` without an implementation target after ADR17 decision planning.

Desired outcome:
- Do not implement until the ADR17 HITL checkpoint records a disposition.
- Preserve Ralph terminal state as blocked on user/HITL rather than running product changes.

Known facts/evidence:
- `docs/plans/prd-adr17-actor-attestation-decision.md` starts with proposed/non-canonical status.
- The PRD says: "Before any canonical ADR or implementation change, a human reviewer must record one disposition: accept, revise, split, defer, or reject."
- The test spec says the ADR17 plan is not implementation authorization.
- Current `$ralph` prompt has no concrete task, PRD path, disposition, or approval.

Constraints:
- ADR17 is non-canonical unless explicitly approved.
- Do not modify schema, validators, projections, write paths, fixtures, canonical ADRs, package manifests, or product implementation.
- No pi-agent to pi-sim coupling.
- No new dependencies.

Unknowns/open questions:
- Which ADR17 disposition should be recorded: accept, revise, split, defer, or reject?
- If split/revise/accept, which branch and first implementation slice is approved?

Likely codebase touchpoints after approval only:
- `decisions/017-actor-attestation-review-taxonomy.md` or successor ADRs
- `schemas/event.schema.json`
- `src/validate.ts`, `src/validate.test.ts`
- view helpers/tests and selected `patients/**` fixtures
