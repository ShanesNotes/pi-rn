# Context snapshot — ADR17 actor attestation decision

Task: Deepen `ADR17-001` into executable, context-efficient decision/implementation cards without implementing or canonizing ADR17.

Desired outcome:
- Refine `docs/plans/prd-adr17-actor-attestation-decision.md` and `docs/plans/test-spec-adr17-actor-attestation-decision.md`.
- Preserve `docs/plans/kanban-prd-board.md` as durable backlog entrypoint; update only if needed for this card.
- Separate human decision work, characterization/validation work, and implementation that may follow only after HITL approval.

Known facts/evidence:
- `decisions/017-actor-attestation-review-taxonomy.md` is Status: proposed; it says it does not implement schema, validator, profile, or write-path enforcement.
- ADR17 proposal favors append-only governance events, no generic `review_status`/`attested_by`, computed review state via backlinks, candidate `action.claim_review.v1` and `communication.attestation.v1`, and reserved future `V-REVIEW-*`/`V-ATTEST-*` rules.
- `memos/Actor-attestation-taxonomy.md` recommends no JSON schema change now, using existing `action` envelope/review conventions and projection-only metadata until fixture evidence proves shape.
- Workstream A acceptance report says proposed ADR17 remains non-canonical and actor/attestation/review workflow is deferred to avoid converting proposal into policy without HITL.
- Current schema has closed event `type` enum but open `subtype`; `author` and `source` schema are permissive; no top-level attestation/review fields exist.
- Current validator has canonical source kinds including agent/human families and status-detail rules for `action:result_review`, `action:constraint_review`, and `action:problem_review`; no `action:claim_review` or `communication.attestation` policy rules are implemented.

Constraints:
- Planning/docs-only lane. Do not modify schema, validators, projections, write paths, fixtures, or product implementation.
- Do not accept ADR17 or silently convert proposal text into canonical policy.
- No new dependencies.
- Keep pi-chart bounded; no pi-agent to pi-sim coupling.
- Current repo behavior is authoritative over stale memo/proposal text.
- HITL checkpoint required before canonical ADR or implementation changes.

Unknowns/open questions:
- Whether user will accept, revise, split, defer, or reject ADR17.
- Whether `action.claim_review.v1` should be accepted, provisional, split, or deferred.
- Whether `communication.attestation.v1` belongs in ADR17 or a successor ADR.
- Whether implementation should start with characterization tests only, profile docs, validator rules, projection helpers, fixtures, or none.

Likely touchpoints for future approved implementation (not this lane):
- `schemas/event.schema.json`
- `src/validate.ts`, `src/validate.test.ts`
- `src/views/memoryProof.ts`, related view tests
- `patients/**/timeline/**/events.ndjson` fixtures
- `decisions/017-actor-attestation-review-taxonomy.md` or successor ADR docs after HITL
