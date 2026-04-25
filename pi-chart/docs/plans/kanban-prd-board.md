# Kanban PRD board — pi-chart

Status: canonical tracked planning index.
Last updated: 2026-04-25.

## Board policy

Cards are staged:

- **PRD cards** carry source inputs, authority/conflict context, dependency order, and HITL gates.
- **Tracer-bullet cards** carry purpose, owned files, first test, implementation boundary, and verification command.
- One integration/verifier lane owns final edits to this board during parallel planning work. Other lanes emit row snippets in their own PRD/test-spec artifacts.

A future agent should not need to read all `/memos`. It should read the card, linked PRD/test-spec, and explicitly named source docs.

## Answer: are `/memos` and research reports captured?

Yes. The existing consolidation pass captured `/memos` and research reports as evidence/proposal layers, not accepted policy by default.

Evidence inputs represented in this planning surface:

- `.omx/plans/doc-sprawl-source-map.md`
- `memos/Workstream A PRD test.md`
- `memos/deep-research-alignment-24042026.md`
- `memos/deep-research-alignment-revised-2026-04-25.md`
- `memos/deep-research-report24042026.md`
- `memos/pi-chart-v03-memo.md`
- `memos/Actor-attestation-taxonomy.md`
- `memos/definitive-fhir-boundary-pi-chart.md`
- `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
- `memos/pi-chart-openEHR-cycle-decision-synthesis.md`

Phase A exact source coverage now lives in [`phase-a-status-matrix.md`](phase-a-status-matrix.md). A8/A9a are current inputs there, not future/missing work.

## Current repo reality snapshot

- Workstream A memory-proof has been executed/hardened per `.omx/plans/workstream-a-memory-proof-acceptance-report.md`.
- Modified implementation-test files are already present from Workstream A: `src/views/memoryProof.test.ts`, `src/validate.test.ts`.
- Product-root baseline must be captured before any later execution because the repo is not clean.

## Done / accepted evidence

| Card | Outcome | Evidence | Follow-up |
|---|---|---|---|
| DOC-001 Document-sprawl source map | Local `.omx` source map, hierarchy, backlog, and conflict register exist. | `.omx/plans/doc-sprawl-source-map.md`; `.omx/plans/prd-doc-sprawl-consolidation-operating-system.md`; `.omx/plans/test-spec-doc-sprawl-consolidation-operating-system.md` | Durable surface promoted into `docs/plans`. |
| WSA-001 Workstream A memory-proof hardening | Memory-proof acceptance gaps hardened; hidden simulator opacity and canonical WOB reuse covered. | `.omx/plans/workstream-a-memory-proof-acceptance-report.md`; changed `src/views/memoryProof.test.ts`; changed `src/validate.test.ts` | Use as proof seam for Phase A bridge. |

## Ready for PRD execution

| Card | PRD | Test spec | Source inputs | Why now | Dependencies | HITL gate |
|---|---|---|---|---|---|---|
| PHA-001 Phase A completion-to-implementation bridge | [`prd-phase-a-completion-to-implementation-bridge.md`](prd-phase-a-completion-to-implementation-bridge.md) | [`test-spec-phase-a-completion-to-implementation-bridge.md`](test-spec-phase-a-completion-to-implementation-bridge.md) | Phase A charter/execution/template; [`phase-a-status-matrix.md`](phase-a-status-matrix.md); open schema questions; Workstream A acceptance report; ADR 016 | Workstream A now gives a hardened proof seam; Phase A docs are near-complete enough to convert into execution cards. | DOC-001, WSA-001 | User approves which first tracer bullet moves from planning to implementation. |

## Ready for tracer execution after HITL selection

These execution-ready slices live inside PHA-001. They are listed here so agents can parallelize later without rediscovering the PRD.

| Card | Purpose | Owned files | First test / validation | Boundary | Verification |
|---|---|---|---|---|---|
| PHA-TB-0 Inventory and source-map refresh | Keep Phase A status and backlog links current. | `docs/plans/kanban-prd-board.md`; `docs/plans/phase-a-status-matrix.md`; `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md` | Structural check proves every current `clinical-reference/phase-a/*.md` path appears exactly once and the board links PRD/spec/matrix. | Docs only; no product-root edits. | Python exact-once/link structural check plus `git diff -- docs/plans` review. |
| PHA-TB-1 Open-schema decision triage | Convert touched open-schema and A8/A9a delta questions into accepted/accepted-direction/proposed/deferred/HITL-needed statuses. | `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`; `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`; possible future ADR draft only with HITL | Ledger completeness check covers the selected card's anchors before code changes. | Do not accept proposed ADR 017, memo-only v0.3 policy, or A8/A9a candidate deltas by implication. | Python ledger completeness check; HITL review. |
| PHA-TB-2 A0–A2 ordered-result calibration slice | Turn foundation/labs/results-review research into one implementation-ready TDD card. | Future: `src/validate.test.ts`, `src/validate.ts`, `src/views/evidenceChain.test.ts`, `src/views/evidenceChain.ts`, `src/views/currentState.test.ts`, `src/views/currentState.ts`, `schemas/event.schema.json`, selected `patients/patient_001/**` only if needed | First failing/characterization test proves lab-producing `intent.order` fulfillment goes through acquisition action and result support, not direct observation fulfillment. | No broad A0 schema rewrite; one lab/order/review behavior; no new primitive without HITL. | `node --test --import tsx src/validate.test.ts src/views/evidenceChain.test.ts src/views/currentState.test.ts && npm run typecheck && npm run check`. |
| PHA-TB-3 A8/A9a focused reassessment-order loop slice | Convert ICU nursing assessment + individual order docs into one bounded chart-visible loop. | Future: `src/validate.test.ts`, `src/validate.ts`, `src/views/openLoops.test.ts`, `src/views/openLoops.ts`, `src/views/timeline.test.ts`, `src/views/timeline.ts`, `src/views/currentState.test.ts`, `src/views/currentState.ts`, `schemas/event.schema.json`, selected `patients/patient_001/**` only if needed | First failing/characterization test proves raw `observation.exam_finding` cannot fulfill/address directly; accepted action/assessment path closes the loop with A8 evidence. | No hidden simulator state; no nursing-assessment event type; no source-kind expansion; no CPOE/MAR/A9b build. | `node --test --import tsx src/validate.test.ts src/views/openLoops.test.ts src/views/timeline.test.ts src/views/currentState.test.ts && npm run typecheck && npm run check`. |
| PHA-TB-4 Acceptance report and next gate | Convert execution evidence into next board movement. | `docs/plans/kanban-prd-board.md`; future `docs/plans/phase-a-bridge-acceptance-report.md` | Report-section check requires tests run, pass/fail evidence, deferred items, boundary confirmation, and next recommended card. | Report-only unless active execution card includes product implementation. | Report-section structural check plus HITL QA. |

## Backlog converted to thin PRD/test-spec surfaces

| Card | PRD | Test spec | Status | Next action | HITL gate |
|---|---|---|---|---|---|
| V03-001 v0.3 foundation reconciliation | [`prd-v03-foundation-reconciliation.md`](prd-v03-foundation-reconciliation.md) | [`test-spec-v03-foundation-reconciliation.md`](test-spec-v03-foundation-reconciliation.md) | Execution-plan ready; HITL-gated. | Execute `V03-TB-1` through `V03-TB-5` as docs-only validation/planning bullets; then choose exact next authority lane. | Human chooses keep deferred, promote ADR17 decision work, open ADR012/013, open profiles, open context-bundle, or reject/defer remaining v0.3 proposals before implementation. |
| ADR17-001 actor attestation decision | [`prd-adr17-actor-attestation-decision.md`](prd-adr17-actor-attestation-decision.md) | [`test-spec-adr17-actor-attestation-decision.md`](test-spec-adr17-actor-attestation-decision.md) | Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. | Decide accept, revise, split, defer, or reject. | Human records ADR17 disposition before product behavior changes. |
| BND-001 adapter/boundary future work | [`prd-adapter-boundary-future-work.md`](prd-adapter-boundary-future-work.md) | [`test-spec-adapter-boundary-future-work.md`](test-spec-adapter-boundary-future-work.md) | Deferred boundary PRD with planning-only tracer bullets, not an adapter build plan. | Use BND-TB-0..4 to validate source authority, HITL readiness, chart-visible source eligibility, FHIR/openEHR deferrals, and promotion gates. | Human names concrete consumer, boundary mode, representation, fingerprint scope, and allowed/forbidden sources before adapter PRD/implementation. |
| DOC-002 `.omx` planning history promotion | [`prd-omx-planning-history-promotion.md`](prd-omx-planning-history-promotion.md) | [`test-spec-omx-planning-history-promotion.md`](test-spec-omx-planning-history-promotion.md) | Thin maintenance/promotion PRD. | Promote only durable, non-duplicative, source-linked, current, non-runtime-churn `.omx/plans` summaries. | Human approves candidate `.omx` artifact or class before tracked promotion. |

## BND-001 planning tracer bullets

These planning-only slices live inside BND-001. They are listed here so future agents can deepen or verify the boundary lane without treating it as implementation approval.

| Card | Purpose | Owned files | First validation | Boundary | Verification |
|---|---|---|---|---|---|
| BND-TB-0 Authority quarantine and source inventory | Keep source authority, proposal-only inputs, concrete memo API/file/test proposals, and current repo seams visible. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/test-spec-adapter-boundary-future-work.md` | Structural check requires source inputs, brownfield reality, and accepted/proposal status. | Docs only; no source ownership. | PRD/test-spec structural command. |
| BND-TB-1 Consumer/readiness and boundary-mode matrix | Require named consumer, boundary mode, rejected surfaces, and HITL owner before adapter PRD. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/kanban-prd-board.md` | HITL checklist must include consumer, directionality, representation, fingerprint scope, and hidden-simulator exclusion. | Export-only remains default until HITL changes it. | PRD/test-spec structural command plus board diff review. |
| BND-TB-2 Chart-visible source eligibility | Define future export inputs without leaking simulator or agent internals. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/test-spec-adapter-boundary-future-work.md` | Check requires may-expose and must-not-know lists. | Only public chart facts can cross. | PRD/test-spec structural command and baseline-aware product-root status check. |
| BND-TB-3 FHIR/openEHR decision ledger | Keep external-boundary decisions visible while deferring contracts. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/test-spec-adapter-boundary-future-work.md` | Check forbids FHIR/openEHR as internal model or implementation-ready contract. | Research/decision only; no adapter module/API. | PRD/test-spec structural command. |
| BND-TB-4 Promotion split and deferral guard | Make promotion paths explicit without assigning product files. | `docs/plans/prd-adapter-boundary-future-work.md`; `docs/plans/kanban-prd-board.md` | Check requires promotion options and explicit deferrals. | HITL approval required before product-root ownership. | PRD/test-spec structural command plus board row review. |

## Parallelization notes

- V03-001, ADR17-001, BND-001, and DOC-002 PRD/test-spec creation can run in parallel because each owns distinct new files.
- The integration/verifier lane owns this board, final link reconciliation, exact Phase A status-matrix validation, and product-root baseline comparison.
- Later implementation cards likely share `schemas/event.schema.json` and `src/validate.ts`; do not run schema-heavy implementation lanes in parallel without one integration owner.

## HITL checkpoints

1. Approve this board as the canonical planning entrypoint.
2. Choose the first implementation path: PHA-TB-1 docs-only triage, PHA-TB-2 A0–A2 ordered-result calibration, or PHA-TB-3 A8/A9a focused reassessment-order loop.
3. Decide whether any v0.3 or ADR17 proposal graduates to accepted ADR/policy.
4. Decide whether any `.omx/plans` artifact should be promoted into tracked `docs/plans` summaries.
