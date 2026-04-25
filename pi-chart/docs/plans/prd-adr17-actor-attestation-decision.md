Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.

# PRD — ADR17 actor attestation decision

## RALPLAN-DR summary

### Principles

1. Decision before implementation: this lane decides ADR17 disposition; it does not accept ADR17 or change product behavior.
2. Brownfield reality wins: accepted ADRs, current schemas, validators, fixtures, and Workstream A behavior outrank proposal/memo text.
3. Append-only governance stays testable: any future policy must preserve chart-visible claims and avoid hidden simulator or pi-agent/pi-sim coupling.
4. Thin, owned tracer bullets: each card names owned files, first validation, verification command, and stop boundary.
5. HITL for canonical authority: a human must record the disposition before canonical ADR edits or implementation changes.

### Decision drivers

1. Avoid silently turning proposed ADR17 taxonomy into schema, validator, projection, fixture, package, or write-path policy.
2. Preserve a way to characterize current behavior with executable checks before adopting any new actor/review/attestation rule.
3. Resolve the tension between ADR17's profile-backed future and the memo's no-schema-change-now recommendation.

### Viable options

| Option | Tradeoff | When to choose |
|---|---|---|
| Accept ADR17 | Fastest route to implementation, but canonizes review and attestation scope together. | HITL agrees the proposed taxonomy is policy-ready as written. |
| Revise ADR17 | Keeps one ADR but requires edits before implementation; slower but safer. | Direction is right, but terminology, validation rules, or projection semantics need correction. |
| Split ADR17 | Separates actor classification, claim review, and professional attestation; lower blast radius but more artifacts. | Review policy is plausible, but attestation/cosign is too broad or premature. |
| Defer ADR17 | Avoids premature policy; leaves future implementation blocked. | Current fixtures/projections do not yet prove a safe policy shape. |
| Reject ADR17 | Clears the backlog item; may lose a useful governance direction. | Proposal conflicts with accepted architecture or clinical policy goals. |

## Source inputs and brownfield authority

Primary inputs:

- `docs/plans/kanban-prd-board.md`
- `decisions/017-actor-attestation-review-taxonomy.md`
- `memos/Actor-attestation-taxonomy.md`
- `.omx/plans/workstream-a-memory-proof-acceptance-report.md`
- `.omx/plans/prd-kanban-backlog-expansion.md` consensus review addendum

Brownfield reality to preserve:

- Accepted ADR 016 and Workstream A prove chart-visible memory without actor/attestation/review policy.
- `schemas/event.schema.json` has a closed event `type`, open `subtype`, existing `author`, `source`, `transform`, `certainty`, `status`, `data`, and `links`; no top-level `attestation`, `review_status`, or `attested_by` policy exists.
- `src/validate.ts` recognizes human/agent/import source-kind families and status-detail rules for existing review-like subtypes (`action:result_review`, `action:constraint_review`, `action:problem_review`) but has no `V-REVIEW-*`, `V-ATTEST-*`, `action.claim_review.v1`, or `communication.attestation.v1` implementation.
- Proposed ADR17 remains evidence/proposal only. It cannot authorize product changes until HITL records the disposition.
- This lane must not edit `decisions/017-actor-attestation-review-taxonomy.md`, change canonical ADR status, alter package manifests/lockfiles, or create successor ADR files unless HITL explicitly approves that decision branch.
- `pi-chart` remains a bounded chart/EHR subsystem; this lane must not add `pi-agent` to `pi-sim` coupling or depend on hidden simulator state.

## Problem

Workstream A deliberately deferred actor, review, rejection, and professional attestation semantics. ADR17 proposes append-only governance events and future profile-backed validation, while the memo recommends no JSON schema change now and using existing `action` review conventions until fixtures prove the shape. The project needs an executable decision lane that lets a human choose the policy direction and lets future agents characterize current behavior without implementing policy by accident.

## Refined acceptance criteria

1. PRD and test spec begin from the proposed/non-canonical ADR17 status and never promote ADR17 to accepted policy.
2. The lane separates: **HITL decision work**, **brownfield characterization/validation**, and **post-approval implementation only**.
3. Decision options include accept, revise, split, defer, and reject, each with tradeoffs and downstream consequences.
4. Every tracer bullet names owned files, first failing/characterization test or validation, verification command, and a stop boundary.
5. Current schema/validator behavior is described as brownfield reality, not desired policy.
6. Canonical ADR edit/status change, schema edit, validator rule, projection helper, fixture policy change, package/dependency change, or write-path behavior change is blocked until HITL approval.
7. Explicit deferrals list all ADR17 implementation concepts that must not be implemented by this lane.
8. Verification proves no canonical ADR, product-root, package-manifest, lockfile, or untracked implementation files were introduced by this planning lane; if the repo is already dirty, the ADR17 lane must compare against the pre-existing baseline.

## Thin tracer bullets

| Card | Purpose | Owned files | First failing/characterization test or validation | Verification command | Stop boundary |
|---|---|---|---|---|---|
| ADR17-TB-0 Authority/source conflict lock | Capture sources, repo authority, and proposal/memo divergence before any decision. | `docs/plans/prd-adr17-actor-attestation-decision.md`; `docs/plans/test-spec-adr17-actor-attestation-decision.md` | Structural validation requires all source inputs, brownfield reality, and proposal/non-canonical warning. | Embedded Python validation in the test spec. | Docs-only; no canonical ADR or product/package change. |
| ADR17-TB-1 HITL disposition packet | Present accept/revise/split/defer/reject choices and required follow-up answers. | Same PRD/test-spec; possible future HITL note or successor ADR only after approval. | Completeness check proves all options, required answers, and consequences are present. | Embedded Python validation plus human review of `## HITL checkpoint`. | Stop until human records one disposition. |
| ADR17-TB-2 Brownfield schema/validator characterization | Prove current behavior has no accepted ADR17 policy and identify safe future test seams. | Planning docs only; read-only references to `schemas/event.schema.json`, `src/validate.ts`, `src/validate.test.ts`. | Read-only grep characterizes absence/presence of ADR17 policy markers without editing code. | `grep -RIn "V-REVIEW\|V-ATTEST\|claim_review\|attestation\|review_status\|attested_by" schemas src patients || true` | If HITL wants implementation, create tests in a later lane first. |
| ADR17-TB-3 Split/revision design card | Decide whether review events and professional attestations must be separate ADRs/cards. | PRD decision tables; future successor PRDs only after HITL. | Validation requires separate downstream branches for `action.claim_review.v1` and `communication.attestation.v1`. | Embedded Python validation checks both concepts are present and still deferred. | No successor ADR file unless HITL chooses revise/split. |
| ADR17-TB-4 Post-approval implementation handoff | Define implementation that would follow only after approval. | PRD/test-spec only now; future owned files would include `decisions/**`, `schemas/event.schema.json`, `src/validate.ts`, view helpers/tests, and selected fixtures. | First future failing tests must be characterization tests: one validator acceptance/rejection test and one projection/backlink test for a minimal review event. | Future lane runs `npm test`, `npm run typecheck`, and `npm run check` after HITL-approved edits. Current guard: `git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock`. | Explicitly blocked in this lane. |

## HITL checkpoint

Before any canonical ADR or implementation change, a human reviewer must record one disposition: **accept**, **revise**, **split**, **defer**, or **reject**.

Required HITL answers:

1. Should ADR17 become accepted policy now, remain proposed, or be revised/split before adoption?
2. Is `action.claim_review.v1` accepted now, provisional-only, split into a successor ADR, or deferred?
3. Is `communication.attestation.v1` accepted now, split into a successor ADR, or deferred?
4. Should future projections expose review state before dedicated validator rules exist?
5. Which source is binding if ADR17 and the memo conflict: the ADR text, the memo's no-schema-change recommendation, or a new revised ADR?
6. If the disposition is split, which branch is first-class: actor classification, claim review, professional attestation, or no branch yet?
7. What is the first approved implementation slice, if any: profile docs, validator rules, projection helper, fixture characterization, or no implementation?

## Decision consequences and follow-on boundaries

| Disposition | Immediate outcome | Implementation that may follow only after approval |
|---|---|---|
| Accept | ADR17 may be promoted by a canonical ADR edit. | Add tests first, then implement the approved review/attestation subset. |
| Revise | ADR17 remains non-canonical until revised text is reviewed. | Draft revised ADR and tests; no schema/validator/projection change until revision approved. |
| Split | ADR17 remains proposed; create successor decision cards for actor classification, claim review, and/or professional attestation. | Implement only the accepted successor slice. |
| Defer | Keep current behavior; leave ADR17 as proposal/reference. | Characterization docs/tests may be prepared, but policy implementation remains blocked. |
| Reject | Close this lane as non-adopted policy. | Preserve current accepted behavior; mark future ADR17 implementation cards rejected/deferred. |

## Post-approval implementation outline (not authorized now)

If HITL approves an implementation branch, execution should start with characterization/failing tests, then code:

1. Write a validator characterization test for a minimal existing-envelope review event and the current expected result.
2. Write a projection/backlink characterization test for one target event plus one review/governance event.
3. Only after those tests exist, modify approved files: likely `schemas/event.schema.json`, `src/validate.ts`, relevant view helpers/tests, and selected `patients/**` fixtures.
4. Run `npm test`, `npm run typecheck`, and `npm run check`; document deferrals in an acceptance report.

## Explicit deferrals

- Accepting ADR17 or changing `decisions/017-actor-attestation-review-taxonomy.md` status.
- Editing canonical ADR files or creating successor ADRs without HITL disposition.
- Implementing `action.claim_review.v1` or `communication.attestation.v1`.
- Adding top-level `attestation`, `review_status`, or `attested_by` fields.
- Adding validator rules `V-REVIEW-*` or `V-ATTEST-*`.
- Adding projection fields such as `review_state`, `review_chain`, `authorship_class`, `accountable_actor`, or `needs_human_review`.
- Enforcing cosign, countersign, witness, scribe, rejection, review, or write-path gates.
- Adding fixtures that imply ADR17 policy is accepted.
- Changing package manifests, lockfiles, or dependencies.
- Mapping ADR17 policy to FHIR, openEHR, legal signature, retention, redaction, archive, or UI workflows.
- Coupling `pi-agent` directly to `pi-sim` or hidden simulator state.

## Intended board row snippet

Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. `ADR17-001` — refined decision lane with tracer bullets ADR17-TB-0 through ADR17-TB-4. Decide accept, revise, split, defer, or reject ADR17 before any schema, validator, projection, fixture, write-path, canonical ADR, package, or product behavior change. Sources: `decisions/017-actor-attestation-review-taxonomy.md`, `memos/Actor-attestation-taxonomy.md`, `.omx/plans/workstream-a-memory-proof-acceptance-report.md`, `.omx/plans/prd-kanban-backlog-expansion.md`. Owned artifacts: `docs/plans/prd-adr17-actor-attestation-decision.md`, `docs/plans/test-spec-adr17-actor-attestation-decision.md`. Next gate: HITL disposition.

## Available-agent-types roster and staffing guidance for future handoff

- `$ralph` path: one sequential owner should run HITL-approved tests-first implementation after disposition; use `executor` for edits and `verifier` for evidence review.
- `$team` path: use only after HITL approves multiple independent successor lanes. Suggested roles: `planner` for successor card shaping, `architect` for authority boundaries, `executor` for one approved code slice, `test-engineer` for characterization tests, `verifier` for final no-policy-leak review.
- Suggested launch hint after approval only: `$ralph <approved ADR17 implementation card>` for sequential execution, or `$team <approved split-card set>` if review and attestation become separate lanes.

## Verification command

Use the validation command in `docs/plans/test-spec-adr17-actor-attestation-decision.md`. It must pass and canonical/product/package guard output must be empty for this lane, or explicitly reconciled against a pre-existing dirty baseline. Guard: `git status --short -- decisions src schemas patients scripts package.json package-lock.json pnpm-lock.yaml yarn.lock`.
