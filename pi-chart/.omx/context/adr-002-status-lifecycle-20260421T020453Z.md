# Context snapshot — ADR 002 status lifecycle

## Task statement
Produce a consensus ralplan for `decisions/002-status-lifecycle.md`, specifically the two-layer status model: envelope graph-lifecycle plus `data.status_detail` per subtype.

## Desired outcome
A grounded plan that either ratifies the current ADR as-is or identifies the minimum edits needed before acceptance/implementation handoff, with concrete follow-up execution lanes.

## Known facts / evidence
- `decisions/002-status-lifecycle.md` already exists and proposes the two-layer model.
- `ROADMAP.md` marks seam #4 as closed by ADR 002, pending implementation.
- `CLAIM-TYPES.md` already contains the two-layer status table and consistency rules.
- `DESIGN.md` already references ADR 002 and frames envelope `status` as graph lifecycle only.
- `src/views/openLoops.ts` still contains the pre-ADR workaround: failure inferred from `entered_in_error` or `data.outcome` due to missing first-class lifecycle detail.

## Constraints
- Stay in planning mode; do not implement.
- Reuse existing ADR text where possible; prefer minimal deltas.
- No new dependencies.
- Final plan should include ADR structure, risks, verification path, and staffing guidance for later execution.

## Unknowns / open questions
- Is the goal acceptance/ratification of ADR 002, or a follow-up implementation plan anchored by ADR 002?
- Which validator/seed/view changes are truly phase-one minimums versus later hardening?
- Does any current schema or sample data already contradict the proposed `status_detail` rules?

## Likely codebase touchpoints
- `decisions/002-status-lifecycle.md`
- `CLAIM-TYPES.md`
- `DESIGN.md`
- `ROADMAP.md`
- `src/views/openLoops.ts`
- `src/validate.ts`
- `schemas/event.schema.json`
- patient seed fixtures / derived tests
