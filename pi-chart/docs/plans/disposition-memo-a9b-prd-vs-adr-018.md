# Disposition memo: A9B PRD vs ADR-018

**Date:** 2026-04-26
**Author:** worker-recon (phase-a-staging-r1)
**Subject:** Whether `prd-a9b-product-implementation.md` should ship as a PRD or be superseded by ADR-018.

---

## Background

`prd-a9b-product-implementation.md` was authored as a planning surface for A9b orderset
invocation. After HITL review (decision #6, 2026-04-26), the operator disposition for A9b
is **plan-only ADR lane**: write `docs/adr/018-orderset-invocation.md` capturing direction
without authorizing implementation. No PRD or test-spec ships until a separate HITL go-ahead.

The PRD was moved to `docs/plans/.draft/` by LANE-0c pending this disposition.

---

## Options considered

**Option A — Retire the PRD draft; proceed with ADR-018 only.**
The PRD and its companion test-spec remain in `.draft/` (gitignored). ADR-018 becomes the
sole canonical surface for A9b direction. A future HITL gate re-authorizes a PRD if/when
implementation becomes warranted.

**Option B — Land the PRD as a docs-only planning artifact alongside ADR-018.**
Both documents ship; the PRD cross-links ADR-018 and is marked "planning-only, no code
authorized." Test-spec also ships but is gated on ADR-018 acceptance.

---

## Recommendation: Option A

Retire the PRD draft; ADR-018 is the correct and sufficient surface.

**Rationale:**

1. **HITL #6 is explicit.** Decision #6 (hitl-decisions-26042026.md) states "No PRD/test-spec
   until separate HITL go-ahead." Landing the PRD now — even as docs-only — would contradict
   the operator's recorded disposition.

2. **ADRs are the canonical policy surface for direction without code authorization.** The
   `.gitignore` rule for `/memos/` and the existing ADR pattern (ADR012, ADR013, ADR017)
   confirm that direction capture belongs in `docs/adr/`, not `docs/plans/`.

3. **All six accepted-direction anchors are already merged into OPEN-SCHEMA-QUESTIONS.md.**
   The anchors (`a9b-invocation-as-event-vs-derived`, `a9b-parent-child-link-convention`,
   `a9b-orderset-modification-mid-invocation`, `a9b-set-level-openloops-vs-child-level`,
   `orderset-cds-suggestion-boundary`, `a9b-protocol-decision-branch-boundary`) were landed
   via PHA-TB-1. ADR-018 references them from their authoritative location; the PRD would
   duplicate this surface.

4. **The test-spec has no active failing tests to anchor.** A9B tracer bullets TB-2 and TB-3
   specify *failing* tests as their deliverable; those tests belong in a future code-authorized
   lane, not in a planning doc shipped now. Landing the test-spec prematurely creates a
   misleading audit trail.

5. **Option B adds maintenance surface without consumer.** No active code lane consumes the
   PRD. A second planning document alongside the ADR would require keeping both in sync
   through any direction change at zero product benefit.

6. **Future re-authorization path is clear.** When implementation is warranted, the HITL
   gate produces a new disposition record, the PRD draft can be promoted from `.draft/`, and
   the test-spec updated — all in one authorized lane. Nothing is lost by retiring now.

---

## Follow-up actions (user-action items)

- [ ] Author `docs/adr/018-orderset-invocation.md` referencing all six anchors and HITL #6.
- [ ] Update kanban A9B-001 row to reflect "ADR-018 pending; PRD retired to .draft/".
- [ ] Delete `.draft/` contents after ADR-018 lands (or keep gitignored indefinitely — low risk).
