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
| PHA-TB-0 Inventory and source-map refresh | Keep Phase A status current. | `docs/plans/phase-a-status-matrix.md`; board snippet emitted for integration owner | Exact-once check over current `clinical-reference/phase-a/*.md` paths in the status matrix. | Docs only; no code. | Python exact-once structural check plus `git diff -- docs/plans` review. |
| PHA-TB-1 Open-schema decision triage | Convert open schema questions into accepted/proposed/deferred/HITL-needed decisions. | `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`; possible future ADR draft only with HITL | Characterization table maps every touched open question to one status. | Do not accept proposed ADR 017 or memo-only v0.3 policy by implication. | Table completeness check; HITL review. |
| PHA-TB-2 A0–A2 calibration slice | Turn foundation/labs/results-review research into one implementation-ready TDD card. | Future: `schemas/*.json`, `src/validate.ts`, `src/views/*`, selected `patients/**`, focused tests | First failing/characterization test proves current fixture/validators support or reject one selected A0–A2 behavior. | No broad schema rewrite; one clinical behavior. | `npm test`, `npm run typecheck`, `npm run check`. |
| PHA-TB-3 A8/A9a heavy-surface slice | Convert ICU nursing assessment + order primitive docs into bounded work cards. | Future: likely `schemas/event.schema.json`, `src/validate.ts`, `src/views/openLoops.ts`, `src/views/timeline.ts`, selected fixture tests | First test proves one order/assessment loop behavior using chart-visible facts only. | No hidden simulator state; no full CPOE/MAR product build. | Focused node test, then `npm test`, `npm run check`. |
| PHA-TB-4 Acceptance report and next gate | Convert execution evidence into next board movement. | `docs/plans/kanban-prd-board.md`; future report under `docs/plans/` | Report lists tests run, pass/fail, deferred items, and next recommended card. | Report-only unless active execution card includes product implementation. | Markdown structural check plus HITL QA. |

## Backlog converted to thin PRD/test-spec surfaces

| Card | PRD | Test spec | Status | Next action | HITL gate |
|---|---|---|---|---|---|
| V03-001 v0.3 foundation reconciliation | [`prd-v03-foundation-reconciliation.md`](prd-v03-foundation-reconciliation.md) | [`test-spec-v03-foundation-reconciliation.md`](test-spec-v03-foundation-reconciliation.md) | Thin decision/backlog PRD. | Bucket v0.3 memo content into accepted/current, stale/superseded, deferred, needs-ADR, or rejected. | Human approves any promotion from memo proposal to ADR/implementation lane. |
| ADR17-001 actor attestation decision | [`prd-adr17-actor-attestation-decision.md`](prd-adr17-actor-attestation-decision.md) | [`test-spec-adr17-actor-attestation-decision.md`](test-spec-adr17-actor-attestation-decision.md) | Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. | Decide accept, revise, split, defer, or reject. | Human records ADR17 disposition before product behavior changes. |
| BND-001 adapter/boundary future work | [`prd-adapter-boundary-future-work.md`](prd-adapter-boundary-future-work.md) | [`test-spec-adapter-boundary-future-work.md`](test-spec-adapter-boundary-future-work.md) | Deferred boundary PRD, not an adapter build plan. | Keep readiness/deferral conditions visible without polluting chart core. | Human names concrete consumer and boundary mode before adapter PRD/implementation. |
| DOC-002 `.omx` planning history promotion | [`prd-omx-planning-history-promotion.md`](prd-omx-planning-history-promotion.md) | [`test-spec-omx-planning-history-promotion.md`](test-spec-omx-planning-history-promotion.md) | Thin maintenance/promotion PRD. | Promote only durable, non-duplicative, source-linked, current, non-runtime-churn `.omx/plans` summaries. | Human approves candidate `.omx` artifact or class before tracked promotion. |

## Parallelization notes

- V03-001, ADR17-001, BND-001, and DOC-002 PRD/test-spec creation can run in parallel because each owns distinct new files.
- The integration/verifier lane owns this board, final link reconciliation, exact Phase A status-matrix validation, and product-root baseline comparison.
- Later implementation cards likely share `schemas/event.schema.json` and `src/validate.ts`; do not run schema-heavy implementation lanes in parallel without one integration owner.

## HITL checkpoints

1. Approve this board as the canonical planning entrypoint.
2. Choose the first implementation path: A0–A2 calibration, A8/A9a heavy-surface, or docs-only triage first.
3. Decide whether any v0.3 or ADR17 proposal graduates to accepted ADR/policy.
4. Decide whether any `.omx/plans` artifact should be promoted into tracked `docs/plans` summaries.
