# RALPLAN draft: ADR 002 — two-layer status lifecycle (revision 3)

## Plan Summary

**Plan saved to:** `.omx/plans/adr-002-status-lifecycle-ralplan-draft.md`

**Scope**
- 2 phases across 8 primary files.
- Estimated complexity: MEDIUM.
- Primary touchpoints: `decisions/002-status-lifecycle.md`, `CLAIM-TYPES.md`, `DESIGN.md`, `ROADMAP.md`, `clinical-reference/phase-a/a1-lab-results.md`, `clinical-reference/phase-a/a2-results-review.md`, `src/types.ts`, `src/validate.ts`, `src/validate.test.ts`.
- Explicitly unchanged in slice 1: `src/views/openLoops.ts`, `src/views/openLoops.test.ts`, `schemas/event.schema.json`.

**Key deliverables**
1. Ratifiable ADR 002 text with contradictions removed and slice-1 scope pinned.
2. Slice-1 handoff limited to typed-validator adoption for the exact stable subtype set.
3. Explicit fixture/example audit deliverable for legacy lifecycle proxies.

## Grounding Evidence

1. `decisions/002-status-lifecycle.md` still says `src/views/openLoops.ts` will move `failed` detection to `data.status_detail`, but the same ADR also leaves notification-failure ownership unresolved.
2. `src/views/openLoops.ts` is the seam where notification failure matters today, so keeping `openLoops` in slice 1 while deferring ownership is contradictory.
3. `CLAIM-TYPES.md`, `ROADMAP.md`, and the Phase A docs support the two-layer direction; the remaining issue is narrowing ratification and first-slice scope.
4. `schemas/event.schema.json` currently does not encode per-subtype `data.status_detail` rules; schema/write-time parity is broader than the narrow validator handoff requested here.

## RALPLAN-DR summary

### Principles
1. Ratify the two-layer model without reopening the architecture.
2. Keep slice 1 strictly to ratification + typed-validator handoff.
3. Do not migrate `openLoops` until notification-failure ownership is decided.
4. Name the exact subtype surface now; defer all other subtype graphs.
5. Keep schema/write-path parity as a later tranche, not hidden slice-1 scope.

### Top decision drivers
1. **Contradiction removal:** slice 1 cannot both defer notification-failure ownership and migrate `openLoops`.
2. **Stable first seam:** the strongest converged non-notification subtype set is `observation.lab_result`, `observation.diagnostic_result`, and `action.result_review`.
3. **Scope control:** validator/type adoption is enough to prove the direction without widening into schema or view migration.

### Options
- **Option A — chosen:** remove `openLoops` migration from slice 1; make slice 1 ratification + typed-validator handoff only.
- **Option B — rejected:** keep `openLoops` in slice 1 and treat notification-failure ownership as implicit.
- **Option C — rejected:** block ratification until notification ownership and all subtype transition graphs are complete.

## Exact slice-1 subtype set

Slice 1 is limited to the currently stable, non-notification subtypes with strongest doc convergence:
- `observation.lab_result`
- `observation.diagnostic_result`
- `action.result_review`

Out of scope for slice 1:
- `communication.*`
- `action.notification`
- any `openLoops` migration
- repo-wide subtype transition graphs
- `schemas/event.schema.json` changes
- write-time/schema parity

## Phases

### Phase 1 — ratification edits
Goal: make ADR 002 approve-ready with minimum textual change.

1. Remove slice-1 `openLoops` migration language from ADR consequences/follow-ups.
2. Add explicit defer text: notification-failure ownership remains unresolved and `openLoops` migration waits on that decision.
3. Pin slice 1 to the exact subtype set above.
4. State plainly that `schemas/event.schema.json` remains unchanged in slice 1; schema/write-time parity is a later tranche.
5. Make the fixture/example audit deliverable explicit.

### Phase 2 — typed-validator handoff
Goal: define the narrow first execution slice without overclaiming.

1. `src/types.ts`: add subtype-scoped `data.status_detail` typing only for `observation.lab_result`, `observation.diagnostic_result`, and `action.result_review`.
2. `src/validate.ts`: implement V-STATUS-01 and V-STATUS-02 for that exact subtype set.
3. `src/validate.ts`: keep V-STATUS-03 limited to structural consistency for the touched subtype set; full transition-graph enforcement stays deferred.
4. `src/validate.test.ts`: add subtype-specific regressions for allowed values and envelope/detail consistency.
5. Produce the audit deliverable for fixtures/examples still using legacy lifecycle proxies.

## Audit deliverable

**Deliverable:** `.omx/drafts/adr-002-slice-1-fixture-example-audit.md`

Minimum contents:
- audited fixture/example sources (`patient_001`, test fixtures, doc examples)
- each legacy proxy still found (`data.outcome`, overloaded envelope `status`, subtype workaround fields)
- keep/defer/migrate recommendation per occurrence
- explicit note that `openLoops`-relevant notification examples remain deferred with ownership resolution

## Acceptance criteria

1. ADR 002 no longer says or implies that `openLoops` migrates in slice 1.
2. ADR 002 explicitly defers `openLoops` migration until notification-failure ownership is resolved.
3. ADR 002 names the exact slice-1 subtype set: `observation.lab_result`, `observation.diagnostic_result`, `action.result_review`.
4. ADR 002 explicitly says `schemas/event.schema.json` stays unchanged in slice 1.
5. Slice-1 handoff text limits implementation to `src/types.ts`, `src/validate.ts`, and `src/validate.test.ts` for the named subtype set.
6. The fixture/example audit deliverable is named and scoped explicitly.
7. Verification text names concrete files, tests, and commands.

## Verification matrix

| Area | Files / tests | Verification command / check | Expected result |
| --- | --- | --- | --- |
| ADR ratification text | `decisions/002-status-lifecycle.md` | manual diff review against this plan | no slice-1 `openLoops` migration language remains |
| Typed subtype scope | `src/types.ts`, `src/validate.ts` | targeted review for only `observation.lab_result`, `observation.diagnostic_result`, `action.result_review` | no notification or `openLoops` subtype creep |
| Validator regressions | `src/validate.test.ts` | `node --test --import tsx src/validate.test.ts` | new subtype-specific V-STATUS-01/02 coverage passes |
| Repo regression suite | all `src/**/*.test.ts` | `npm test` | full suite stays green |
| Derived + validation pass | rebuild + validation scripts | `npm run check` | derived artifacts and repo validation stay green |
| Type safety | TS project | `npm run typecheck` | no type regressions |
| Schema unchanged in slice 1 | `schemas/event.schema.json` | `git diff --exit-code -- schemas/event.schema.json` | no schema diff |
| `openLoops` explicitly deferred | `src/views/openLoops.ts`, `src/views/openLoops.test.ts` | `git diff --exit-code -- src/views/openLoops.ts src/views/openLoops.test.ts` | no slice-1 view diff |
| Fixture/example audit | `.omx/drafts/adr-002-slice-1-fixture-example-audit.md` | manual checklist review | every known legacy proxy occurrence is listed or explicitly deferred |

## ADR framing

### Decision
Ratify ADR 002 with minimum edits and define slice 1 as a typed-validator handoff only for `observation.lab_result`, `observation.diagnostic_result`, and `action.result_review`.

### Drivers
- The two-layer direction is already stable.
- The current contradiction is specifically the `openLoops` slice-1 claim vs deferred notification ownership.
- A narrow validator-first slice proves the model without widening into unresolved notification or schema work.

### Alternatives considered
1. Keep `openLoops` in slice 1 and assume notification ownership later.
2. Delay ratification until notification ownership is decided.
3. Expand slice 1 into schema/write-path parity.

### Why chosen
This is the smallest change set that resolves the critic’s blockers while keeping the plan executable and reviewable.

### Consequences
- Architect/critic can review a contradiction-free ratification path.
- Slice 1 becomes smaller and safer.
- `openLoops` and notification ownership move to the next tranche by design, not omission.
- `schemas/event.schema.json` remains unchanged until a later write-time/schema parity tranche.

### Follow-ups
1. Decide notification-failure ownership (`action.notification` vs `communication` vs both).
2. Plan the `openLoops` migration after that decision.
3. Decide whether and when to encode subtype rules in `schemas/event.schema.json`.
4. Broaden subtype transition graphs only after the narrow slice lands.

## Staffing guidance

- **Leader / planner:** keep ADR edits minimal; protect slice boundary.
- **Architect re-review:** verify contradiction removal, defer boundary, and schema-non-change statement.
- **Critic re-review:** verify exact subtype naming, verification specificity, and audit deliverable clarity.
- **Executor (future slice 1):** own only `src/types.ts`, `src/validate.ts`, `src/validate.test.ts`, plus the audit draft.
- **Verifier (future slice 1):** run the verification matrix in order: targeted validator test -> full tests -> `npm run check` -> `npm run typecheck` -> unchanged-file checks.

## Changes from prior iteration

- Removed `openLoops` migration from slice 1.
- Pinned slice 1 to `observation.lab_result`, `observation.diagnostic_result`, and `action.result_review`.
- Added explicit verification matrix with named files/tests/commands.
- Named the fixture/example audit deliverable and minimum contents.
- Stated directly that `schemas/event.schema.json` stays unchanged in slice 1.
