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

Phase A exact source coverage now lives in [`phase-a-status-matrix.md`](phase-a-status-matrix.md). A8/A9a/A9b are current inputs there, not future/missing work.

## Current repo reality snapshot

- Workstream A memory-proof has been executed/hardened per `.omx/plans/workstream-a-memory-proof-acceptance-report.md`.
- Modified implementation-test files are already present from Workstream A: `src/views/memoryProof.test.ts`, `src/validate.test.ts`.
- Product-root baseline must be captured before any later execution because the repo is not clean.

## Done / accepted evidence

| Card | Outcome | Evidence | Follow-up |
|---|---|---|---|
| DOC-001 Document-sprawl source map | Local `.omx` source map, hierarchy, backlog, and conflict register exist. | `.omx/plans/doc-sprawl-source-map.md`; `.omx/plans/prd-doc-sprawl-consolidation-operating-system.md`; `.omx/plans/test-spec-doc-sprawl-consolidation-operating-system.md` | Durable surface promoted into `docs/plans`. |
| WSA-001 Workstream A memory-proof hardening | Memory-proof acceptance gaps hardened; hidden simulator opacity and canonical WOB reuse covered. | `.omx/plans/workstream-a-memory-proof-acceptance-report.md`; changed `src/views/memoryProof.test.ts`; changed `src/validate.test.ts` | Use as proof seam for Phase A bridge. |
| PHA-001 Phase A bridge execution | A9b source coverage, open-schema canonical merge, TB-2/TB-3 characterization, TB-V validator guard, and TB-4 report landed. | `docs/plans/phase-a-bridge-acceptance-report.md`; `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`; `src/views/evidenceChain.test.ts`; `src/views/openLoops.test.ts`; `src/validate.test.ts` | A9b implementation, ADR17, and dashboard/prototype disposition remain separate HITL lanes. |

## Ready for PRD execution

| Card | PRD | Test spec | Source inputs | Why now | Dependencies | HITL gate |
|---|---|---|---|---|---|---|
| PHA-001 Phase A completion-to-implementation bridge | [`prd-phase-a-completion-to-implementation-bridge.md`](prd-phase-a-completion-to-implementation-bridge.md) | [`test-spec-phase-a-completion-to-implementation-bridge.md`](test-spec-phase-a-completion-to-implementation-bridge.md) | Phase A charter/execution/template; [`phase-a-status-matrix.md`](phase-a-status-matrix.md); open schema questions; Workstream A acceptance report; ADR 016 | Workstream A now gives a hardened proof seam; Phase A docs are near-complete enough to convert into execution cards. | DOC-001, WSA-001 | User approves which first tracer bullet moves from planning to implementation. |

## Ready for tracer execution after HITL selection

These execution-ready slices live inside PHA-001. They are listed here so agents can parallelize later without rediscovering the PRD.

**Execution order (hard DAG).** PHA-TB-1 is a hard gate before any code-touching card. TB-2 and TB-3 are view-layer slices that emit failing tests; PHA-TB-V is the single lane that edits the validator and schema. PHA-TB-4 reports after at least one TB lands green.

| Card | Purpose | Owned files | First test / validation | Boundary | Verification |
|---|---|---|---|---|---|
| PHA-TB-0 Inventory and source-map refresh | Keep Phase A status and backlog links current. | `docs/plans/kanban-prd-board.md`; `docs/plans/phase-a-status-matrix.md`; `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md` | Structural check proves every current `clinical-reference/phase-a/*.md` path appears exactly once and the board links PRD/spec/matrix. | Docs only; no product-root edits. | Python exact-once/link structural check plus `git diff -- docs/plans` review. |
| PHA-TB-1 Open-schema decision triage (hard gate) | Classify all 30 A8/A9a candidate anchors plus A9b disposition anchors, and merge `accepted` / `accepted-direction` into canonical `OPEN-SCHEMA-QUESTIONS.md`. | `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`; `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`; `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` | Ledger completeness across all 30 A8/A9a anchors plus A9b disposition anchors; canonical-merge check on accepted/accepted-direction subset. | No `decisions/` edits without HITL; no proposed ADR 017 acceptance by implication; no A9b product implementation in PHA-001. | Python ledger + canonical-merge check; HITL review. |
| PHA-TB-2 A0–A2 ordered-result view characterization | Characterize evidence chain `intent.order ← action.specimen_collection ← observation.lab_result` in the view layer; emit failing test for TB-V. | `src/views/evidenceChain.ts(.test).ts`; `src/views/currentState.ts(.test).ts`; append-only fixture under `patients/patient_001/timeline/2026-04-18/events.ndjson`. **NOT** `validate.ts` / `event.schema.json`. | Failing test asserts the chain reaches the order via `action.specimen_collection`, never directly. Failure is the deliverable for TB-V. | View layer only; no STATUS_RULES edits; fixture additions append-only. | `node --test --import tsx src/views/evidenceChain.test.ts src/views/currentState.test.ts && npm run typecheck`. |
| PHA-TB-3 A8/A9a focused reassessment-order loop view characterization | Characterize that `observation.exam_finding` is evidence not closure; fulfillment/closure remains action-only. Nursing-scope `assessment.*` may support/address/interpret but must not fulfill an intent unless HITL/ADR changes Invariant 10. | `src/views/openLoops.ts(.test).ts`; `src/views/timeline.ts(.test).ts`; append-only fixture extension. **NOT** `validate.ts` / `event.schema.json` / `currentState.*` (TB-2 owns currentState). | Two-scenario failing test: finding alone leaves loop open; finding + closure action closes it. | View layer only; no new event subtypes; no source-kind expansion. | `node --test --import tsx src/views/openLoops.test.ts src/views/timeline.test.ts && npm run typecheck`. |
| PHA-TB-V Validator + schema integration | Land `V-FULFILL-02/03` enforcement and new `V-EXAMFIND-01`; enforce `action.specimen_collection` / `observation.exam_finding.finding_state` in validator unless a narrow existing schema hook is already present. Consumes failing tests from TB-2/TB-3. | `src/validate.ts`; `src/validate.test.ts`; `schemas/event.schema.json` only for narrow existing-hook edits | Existing failing TB-2/TB-3 tests run RED before, GREEN after. | Edits restricted to listed STATUS_RULES, the named new rule, and narrow existing schema hooks only; no broad conditional schema machinery, new top-level types, or new properties. | `npm test && npm run typecheck && npm run check` plus boundary-check `git diff` filter. |
| PHA-TB-4 Acceptance report and next gate | Convert execution evidence into next board movement. | `docs/plans/kanban-prd-board.md`; future `docs/plans/phase-a-bridge-acceptance-report.md` | Report-section check + evidence-linkage check (literal verification command + stdout excerpt). | Report-only unless active execution card includes product implementation. | Python structural + evidence-linkage check; HITL QA. |

## Backlog converted to thin PRD/test-spec surfaces

| Card | PRD | Test spec | Status | Next action | HITL gate |
|---|---|---|---|---|---|
| V03-001 v0.3 foundation reconciliation | [`prd-v03-foundation-reconciliation.md`](prd-v03-foundation-reconciliation.md) | [`test-spec-v03-foundation-reconciliation.md`](test-spec-v03-foundation-reconciliation.md) | Execution-plan ready; HITL-gated. | Execute `V03-TB-0 through V03-TB-6` as docs-only validation/planning bullets; then choose exact successor scaffold S1–S6. | Human cites R-* ledger rows and chooses S1 keep-deferred, S2 ADR17, S3 identity/hash, S4 profiles, S5 context-bundle, or S6 reject/defer before any V03 successor implementation. |
| ADR17-001 actor attestation decision | [`prd-adr17-actor-attestation-decision.md`](prd-adr17-actor-attestation-decision.md) | [`test-spec-adr17-actor-attestation-decision.md`](test-spec-adr17-actor-attestation-decision.md) | Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. Deepened with seven tracer bullets ADR17-TB-0, TB-1 (HARD GATE), TB-2, TB-3a, TB-3b, TB-V-EQ (INTENTIONALLY DEFERRED), TB-4; eleven-row taxonomy ledger T01–T11; six load-bearing memo/ADR constraints with literal line citations; per-disposition successor scaffolds (accept/revise/split/defer/reject; successor files NOT created); envelope-conflict analysis (memo `action:claim_review` vs ADR `communication.attestation.v1`); evidence-linkage acceptance with literal grep stdout excerpt and Python validation banner. | Decide accept, revise, split, defer, or reject. ADR17-TB-1 is the HARD GATE; TB-3a, TB-3b, TB-V-EQ blocked until HITL records disposition. | Human records ADR17 disposition before product behavior changes. |
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
- Within PHA-001, the validator/schema collision is resolved by isolating those edits to PHA-TB-V. PHA-TB-2 and PHA-TB-3 own disjoint view files and may run in parallel; their only shared write target is the patient fixture file (use `tb2-` / `tb3-` event-id prefixes or serialize fixture edits).
- Within ADR17-001, TB-3a (per-disposition successor scaffolds) and TB-3b (envelope-conflict analysis) are disjoint sub-sections of the PRD and may run in parallel after TB-1 hard gate; TB-V-EQ stays deferred behind HITL and never executes in this lane. The only shared write target with PHA-001 is `docs/plans/kanban-prd-board.md`, where ADR17-001 owns a different row from PHA-001 and a different parallelization-notes line.

## HITL checkpoints

1. Approve this board as the canonical planning entrypoint.
2. Approve PHA-TB-1 as the next card. (TB-1 is a hard gate; it is not a choice among parallel options; A9b source coverage/triage is included, but A9b product implementation remains deferred.)
3. After TB-1 lands, pick TB-2, TB-3, or both-in-parallel (their owned files are now disjoint). PHA-TB-V auto-schedules after at least one failing test.
4. Decide whether any v0.3 or ADR17 proposal graduates to accepted ADR/policy.
5. Decide whether any `.omx/plans` artifact should be promoted into tracked `docs/plans` summaries.
