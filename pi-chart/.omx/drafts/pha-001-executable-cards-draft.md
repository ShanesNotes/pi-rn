# Draft RALPLAN — PHA-001 executable implementation cards

## RALPLAN-DR summary

### Principles
1. Keep PHA-001 a bridge from Phase A research to implementation cards, not a new research memo or code pass.
2. Preserve chart/EHR boundaries: pi-chart owns chart-visible facts, validators, views, and fixtures; no pi-agent -> pi-sim coupling.
3. Prefer test-first tracer bullets with one clinical behavior each and explicit file ownership.
4. Do not promote memo-only or proposed ADR17 policy; actor/attestation remains non-canonical until HITL/ADR approval.
5. Defer breadth in favor of context-efficient cards that a later executor can start from one failing/characterization test.

### Decision drivers
1. Existing PHA-001 artifacts already identify Phase A coverage and ready bullets, but TB-2/TB-3 are still broad enough to invite implementation sprawl.
2. A8/A9a introduced explicit open-schema deltas not present in the canonical `OPEN-SCHEMA-QUESTIONS.md` table; execution needs a delta ledger before schema edits.
3. Current repo seams are narrow and testable: `src/validate.ts`, `src/views/currentState.ts`, `src/views/openLoops.ts`, `src/views/timeline.ts`, schemas, and selected patient fixtures.

### Viable options
| Option | Summary | Pros | Cons | Verdict |
|---|---|---|---|---|
| A. Deepen PHA-001 into 6 thin cards now | Update the PRD/test-spec/board with executable card contracts, then stop at HITL selection. | Best matches user request; no product code; preserves backlog entrypoint. | Adds planning detail before implementation. | Chosen. |
| B. Write only a separate `.omx/plans` handoff | Avoid tracked docs churn and leave current docs intact. | Low risk to docs. | Durable backlog remains under-specified; future agents may miss it. | Rejected. |
| C. Collapse directly to first implementation lane | Pick A0-A2 or A8/A9a and code. | Faster code feedback. | Violates explicit “Do not implement yet” and bypasses HITL. | Rejected. |

## Refined acceptance criteria
1. `docs/plans/kanban-prd-board.md` remains the durable entrypoint for PHA-001 and points to the PRD, test spec, and status matrix.
2. The PHA-001 PRD defines 3-6 thin tracer bullets; each bullet has purpose, owned files, first failing/characterization test, verification command, boundary, and explicit deferrals.
3. The paired test spec contains executable structural checks proving every ready tracer bullet has the required fields and that no product-root files are modified during the planning-only pass.
4. `docs/plans/phase-a-status-matrix.md` continues to represent each current Phase A source exactly once; A8/A9a remain current inputs, not future work.
5. Open-schema questions touched by the first selected implementation card are classified as `accepted`, `accepted-direction`, `proposed`, `deferred`, or `HITL-needed` before product code changes.
6. A8/A9a open-schema entries that are not yet in `OPEN-SCHEMA-QUESTIONS.md` are treated as a delta ledger, not silently canonical policy.
7. Product implementation cards start from a named failing or characterization test and may edit only their owned files.
8. No card introduces a new dependency, top-level event type, source kind, adapter boundary, hidden simulator read, or pi-agent/pi-sim coupling.
9. ADR17/actor-attestation behavior stays deferred to ADR17-001 unless the human explicitly approves it.
10. A HITL checkpoint selects exactly one first implementation path before `$ralph`, `$team`, or manual implementation begins.

## Tracer bullets

### PHA-TB-0 — Board/status-matrix contract hardening
- Purpose: prove the durable backlog and Phase A exact-once matrix are synchronized before implementation cards run.
- Owned files: `docs/plans/kanban-prd-board.md`, `docs/plans/phase-a-status-matrix.md`, `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`.
- First characterization test: structural Python check that every current Phase A source appears exactly once in the matrix and that the board links the PHA-001 PRD/spec/matrix.
- Verification command: embedded Python structural check in the test spec plus `git diff -- docs/plans` review.
- Boundary/deferrals: docs only; no clinical source rewrites; no product source edits.

### PHA-TB-1 — Open-schema delta decision ledger
- Purpose: convert the open-schema deltas touched by the selected first card into explicit statuses before any schema/view code changes.
- Owned files: `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`, `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`; optional later source-doc update only if HITL selects a docs-maintenance implementation card.
- First failing/characterization test: a Python ledger check fails until required touched anchors (for example A8 exam finding shape/session/trigger/cadence and A9a canonical order/order-kind/auth/lifecycle/fulfillment anchors) are listed with status and deferral.
- Verification command: `python3` ledger check from the test spec.
- Boundary/deferrals: does not make A8/A9a deltas canonical; does not accept ADR17; does not edit decisions or Phase A source docs without HITL.

### PHA-TB-2 — A0-A2 ordered-result calibration slice
- Purpose: make one lower-risk vertical card around identity/constraint/problem context plus lab/result-review lifecycle.
- Owned files for future implementation: `src/validate.test.ts`, `src/validate.ts`, `src/views/evidenceChain.test.ts`, `src/views/evidenceChain.ts`, `src/views/currentState.test.ts`, `src/views/currentState.ts`, `schemas/event.schema.json`, selected `patients/patient_001/**` fixture files only if needed.
- First failing/characterization test: add a test that an `intent.order` for a lab is fulfilled only through an acquisition action (`action.specimen_collection`) and that an `observation.lab_result` must support that action rather than directly fulfilling the order; characterize current V-FULFILL-02/V-FULFILL-03 behavior before any schema change.
- Verification command: `node --test --import tsx src/validate.test.ts src/views/evidenceChain.test.ts src/views/currentState.test.ts && npm run typecheck && npm run check`.
- Boundary/deferrals: one lab/order/review behavior only; no broad A0 schema rewrite; no new structural patient/encounter primitive; no direct observation-to-order fulfillment.

### PHA-TB-3 — A8 focused assessment slice
- Purpose: make one ICU nursing assessment behavior executable without building a nursing flowsheet module.
- Owned files for future implementation: `src/validate.test.ts`, `src/validate.ts`, `src/views/timeline.test.ts`, `src/views/timeline.ts`, `src/views/currentState.test.ts`, `src/views/currentState.ts`, `schemas/event.schema.json`, selected `patients/patient_001/**` fixture files only if needed.
- First failing test: assert that raw `observation.exam_finding` cannot close a problem/order by `links.addresses` or `links.fulfills`; focused reassessment closure must use an accepted action/assessment path while the finding remains supporting evidence.
- Verification command: `node --test --import tsx src/validate.test.ts src/views/timeline.test.ts src/views/currentState.test.ts && npm run check`.
- Boundary/deferrals: no `nursing_assessment` event type; no source-kind expansion such as `human_assessor`; no global hard-coded ICU cadence; session shell remains HITL/open-schema.

### PHA-TB-4 — A9a individual-order primitive slice
- Purpose: make one order-obligation behavior executable without building CPOE/MAR.
- Owned files for future implementation: `src/validate.test.ts`, `src/validate.ts`, `src/views/openLoops.test.ts`, `src/views/openLoops.ts`, `src/views/timeline.test.ts`, `src/views/timeline.ts`, `schemas/event.schema.json`, selected `patients/patient_001/**` fixture files only if needed.
- First failing test: assert `intent.order` requires minimal payload (`data.order_kind`, `data.orderable`, timing/status detail, and expected fulfillment/disposition path for open-loop use), and an active order without closing fulfillment remains visible in `openLoops()`.
- Verification command: `node --test --import tsx src/validate.test.ts src/views/openLoops.test.ts src/views/timeline.test.ts && npm run typecheck && npm run check`.
- Boundary/deferrals: no CPOE UI, no full MAR, no order-set/protocol parent (A9b), no blood-product/restraint policy implementation unless HITL selects it later.

### PHA-TB-5 — Bridge acceptance report and next gate
- Purpose: convert completed planning/execution evidence into board movement and the next selected card.
- Owned files: `docs/plans/kanban-prd-board.md`, optional `docs/plans/phase-a-bridge-acceptance-report.md`.
- First characterization test: report template/check requires `Tests run`, `Pass/fail evidence`, `Deferred items`, `Boundary confirmation`, and `Next recommended card` sections.
- Verification command: `python3` report-section check from the test spec plus `git diff -- docs/plans` review.
- Boundary/deferrals: report only; no product behavior changes in this bullet.

## Explicit deferrals
- Implementation of product code until HITL selects the first tracer bullet.
- ADR17 actor/attestation/review policy and `communication.attestation.v1`.
- FHIR/adapter/export/legal/audit boundary work.
- Full CPOE, MAR, order-set/protocol parent, blood-product policy, restraint policy, and institutional profile systems.
- New dependencies, new top-level event types, and source-kind expansion.
- Edits to pi-agent or pi-sim, and any hidden simulator state access.

## HITL checkpoint before implementation
Human must choose one first implementation path after this planning pass:
1. `PHA-TB-1` docs-only open-schema delta ledger first (lowest risk).
2. `PHA-TB-2` A0-A2 ordered-result calibration first (lower product risk).
3. `PHA-TB-3` A8 focused assessment first (medium risk; clarifies nursing assessment boundary).
4. `PHA-TB-4` A9a individual-order primitive first (highest leverage; highest scope-control risk).

## ADR
- Decision: deepen PHA-001 into six test-first tracer bullets and stop before implementation.
- Drivers: context efficiency, Phase A source breadth, A8/A9a delta freshness, no hidden coupling, test-first execution.
- Alternatives considered: separate `.omx` only handoff; direct implementation; broad Phase A rewrite.
- Why chosen: updates durable tracked planning surfaces while preserving a human branch point.
- Consequences: future executor can start from named tests; product code remains untouched; docs become stricter about deferrals.
- Follow-ups: HITL selects first tracer; selected execution mode captures baseline and runs command for that bullet.

## Staffing and launch hints
- Solo/$ralph: one executor for selected bullet, one verifier/reviewer after tests. Use medium/high reasoning for schema/validator lanes.
- `$team`: executor for selected bullet, test-engineer for test-first lock, verifier for commands/boundaries. Do not run TB-2/TB-3/TB-4 together if they share `src/validate.ts` or `schemas/event.schema.json` without a single integration owner.
- Launch hint after HITL: `$ralph implement PHA-TB-N from docs/plans/prd-phase-a-completion-to-implementation-bridge.md; start with the named first test; do not expand beyond owned files.`
- Team verification path: selected lane proves its command passes, then integration owner runs `npm test && npm run typecheck && npm run check` and updates the board/report.
