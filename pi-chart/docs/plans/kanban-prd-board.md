# Kanban PRD board — pi-chart

Status: canonical tracked planning index.
Last updated: 2026-04-27.

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
| PHA-001 Phase A bridge execution | A9b source coverage, open-schema canonical merge, TB-2/TB-3 characterization, TB-V validator guard, and TB-4 report landed. | `docs/plans/phase-a-bridge-acceptance-report.md`; `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`; `src/views/evidenceChain.test.ts`; `src/views/openLoops.test.ts`; `src/validate.test.ts` | A9b implementation, ADR17, and dashboard/prototype disposition remain separate HITL lanes; per-TB evidence in [phase-a-status-matrix.md#phase-a-tracer-slice-status](phase-a-status-matrix.md#phase-a-tracer-slice-status). |

## Ready for PRD execution

| Card | PRD | Test spec | Source inputs | Why now | Dependencies | HITL gate |
|---|---|---|---|---|---|---|
| A9B-001 A9b product implementation | _retired to `.draft/` per [`disposition-memo-a9b-prd-vs-adr-018.md`](disposition-memo-a9b-prd-vs-adr-018.md)_ | _retired to `.draft/` per disposition memo_ | `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md`; `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` | A9b stays plan-only ADR per HITL #6; PRD/test-spec drafts live in gitignored `docs/plans/.draft/` until a future HITL re-authorizes implementation. | PHA-001 | Pending `decisions/018-orderset-invocation.md` authorship; PRD re-promotion gated on a separate HITL. |
| ADR17-002 Dashboard disposition | [`prd-adr17-002-dashboard-disposition.md`](prd-adr17-002-dashboard-disposition.md) | [`test-spec-adr17-002-dashboard-disposition.md`](test-spec-adr17-002-dashboard-disposition.md) | `docs/plans/dashboard.html`; `scripts/dashboard.ts`; `scripts/dashboard.test.ts`; `scripts/dashboard-dev.ts`; `package.json` `dashboard` / `dashboard:dev` scripts; `docs/plans/README.md` lines 48–52; `decisions/018-architecture-rebase-clinical-truth-substrate.md` UI-status decision and non-deletion non-goal; `docs/architecture/source-authority.md` lines 55–65, 86, 105–111; `.omx/specs/deep-interview-kanban-dashboard.md`; `.omx/plans/ralplan-kanban-dashboard.md`; `docs/plans/disposition-memo-a9b-prd-vs-adr-018.md` | Narrowed from earlier dashboard/prototype card to `docs/plans/dashboard.html` only; agent-canvas baseline split out to `ADR17-003`. ADR17-001 accepted and PHA-001 closed; deferral from PHA-001 acceptance report (line 34) unblocked. Planning-only; presents accept/banner/retire/promote/defer with no PRD recommendation. | PHA-001, ADR17-001 | Planning-only; HITL gate before any banner injection, `.draft/` retirement, CI wiring, package-manifest change, or canonical edit. |
| ADR17-003 Agent-canvas disposition | _pending; gated on ADR 018 spike acceptance_ | _pending; gated on ADR 018 spike acceptance_ | `scripts/agent-canvas.ts`; `scripts/agent-canvas-context.ts`; `scripts/agent-canvas-connector.ts`; `scripts/agent-canvas-constants.ts`; `scripts/agent-canvas-types.ts`; `scripts/agent-canvas-fixtures.ts`; `scripts/agent-canvas.test.ts`; `scripts/agent-canvas-context.test.ts`; `scripts/agent-canvas-types.test.ts`; `scripts/agent-canvas-connector.test.ts`; `tests/e2e/agent-canvas-smoke.mjs`; `docs/prototypes/pi-chart-agent-canvas.html`; `tests/fixtures/agent-canvas-context.json`; `package.json` `agent-canvas` / `test:prototype` scripts; `.omx/plans/prd-agent-canvas-ralph-fixes.md`; `.omx/plans/test-spec-agent-canvas-ralph-fixes.md`; `.omx/context/agent-canvas-ralph-fixes-20260427T002403Z.md`; `memos/pi-chart-agent-canvas-plan-26042026.md`; `memos/pi-chart-vitals-connector-unblock-plan-26042026.md` | Agent-canvas disposition is materially entangled with the ADR 018 hybrid-vs-clean-slate spike. Park as planning placeholder until spike output settles which prototype surfaces survive. | ADR17-001, ADR17-002, ADR 018 spike acceptance | Pending ADR 018 spike acceptance; no PRD/test-spec authorship until then. |

## Backlog converted to thin PRD/test-spec surfaces

| Card | PRD | Test spec | Status | Next action | HITL gate |
|---|---|---|---|---|---|
| V03-001 v0.3 foundation reconciliation | [`prd-v03-foundation-reconciliation.md`](prd-v03-foundation-reconciliation.md) | [`test-spec-v03-foundation-reconciliation.md`](test-spec-v03-foundation-reconciliation.md) | Reconciliation complete; HITL selected S5 successor with `s5-read-only` boundary. | Use [`v03-foundation-reconciliation-acceptance-report.md`](v03-foundation-reconciliation-acceptance-report.md) and S5-001 as the successor planning surface. | No V03 successor implementation until its own PRD/test-spec is approved. |
| S5-001 read-side context-bundle | [`prd-s5-read-side-context-bundle.md`](prd-s5-read-side-context-bundle.md) | [`test-spec-s5-read-side-context-bundle.md`](test-spec-s5-read-side-context-bundle.md) | HITL selected; planning-ready; boundary `s5-read-only`. | Authorize docs-only S5 planning; no `src/views/bundle.ts` product implementation in this lane. | HITL approval required before any future read-side bundle implementation; S5 does not include deterministic fingerprint/profile/hash scope. |
| CB-001 context-bundle implementation | [`prd-context-bundle-implementation.md`](prd-context-bundle-implementation.md) | [`test-spec-context-bundle-implementation.md`](test-spec-context-bundle-implementation.md) | **Accepted (2026-04-26).** Distinct lane from S5-001 per HITL `memos/hitl-decisions-26042026.md` #3. Implementation realized as `src/views/bundle.ts`, `src/views/bundle.test.ts`, and `src/views/index.ts` re-export. Acceptance report at [`s5-read-side-context-bundle-acceptance-report.md`](s5-read-side-context-bundle-acceptance-report.md) (header rewritten to reference CB-001). | Closed for first lane. Future CB-002..CB-005 successors gated on separate HITL. | Future CB successors need their own PRDs; deterministic fingerprint, hash, profile-aware filtering, and consumer-specific shaping all remain forbidden in this lane. |
| NOTES-001 a6/a7 notes validator slice | [`prd-a6-a7-notes-validator.md`](prd-a6-a7-notes-validator.md) | [`test-spec-a6-a7-notes-validator.md`](test-spec-a6-a7-notes-validator.md) | **Accepted (2026-04-26).** Legitimizes already-on-disk validator implementation per HITL `memos/hitl-decisions-26042026.md` #5. Implementation realized as `src/validate.ts` + `src/validate.test.ts` deltas: `V-NOTES-01` substrate integrity (hard), `V-NOTES-02` nursing-scope (warn), `V-NOTES-03` frontmatter discoverability (warn). | Closed for first lane. NOTES-002 view-layer translation, NOTES-003 SBAR/action.notification, NOTES-004 nurse_practitioner allowlist remain deferred. | Future NOTES successors need their own PRDs; no schema, fixture, view, or notification-surface edits in this lane. |
| ADR17-001 actor attestation decision | [`prd-adr17-actor-attestation-decision.md`](prd-adr17-actor-attestation-decision.md) | [`test-spec-adr17-actor-attestation-decision.md`](test-spec-adr17-actor-attestation-decision.md) | **Accepted (2026-04-26).** ADR `017-actor-attestation-review-taxonomy.md` moved from `proposed` to `accepted`; HITL disposition recorded in `memos/hitl-decisions-26042026.md` #1. Implementation already realized in commit `ab559f9` (`reviewState.ts`, `attestationState.ts`, V-REVIEW-01..07, V-ATTEST-01..04). | TB-3a, TB-3b unblocked for refinement work; TB-V-EQ remains deferred. | Closed; future ADR17 refinements need a new HITL-approved successor lane. |
| BND-001 adapter/boundary future work | [`prd-adapter-boundary-future-work.md`](prd-adapter-boundary-future-work.md) | [`test-spec-adapter-boundary-future-work.md`](test-spec-adapter-boundary-future-work.md) | Deferred boundary PRD with planning-only tracer bullets, not an adapter build plan. | Use BND-TB-0..4 to validate source authority, HITL readiness, chart-visible source eligibility, FHIR/openEHR deferrals, and promotion gates. | Human names concrete consumer, boundary mode, representation, fingerprint scope, and allowed/forbidden sources before adapter PRD/implementation. |
| ARCH-001 architecture rebase clinical truth substrate | [`prd-architecture-rebase-clinical-truth-substrate.md`](prd-architecture-rebase-clinical-truth-substrate.md) | [`test-spec-architecture-rebase-clinical-truth-substrate.md`](test-spec-architecture-rebase-clinical-truth-substrate.md) | **Docs/source-authority lane complete (2026-04-27).** ADR 018 and source-authority map establish clinical truth substrate over prototype cockpit, hybrid immediate path, and clean-slate spike gate. | Decide clean-slate spike scope before any product-code refactor. | No `src/`, `schemas/`, `patients/`, or `scripts/` edits until a later approved implementation ADR/PRD. |
| CORP-019 ADR 019 corpus readiness gate | [`prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`](prd-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md) | [`test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md`](test-spec-clinical-fidelity-synthetic-chart-corpus-gate-adr-019.md) | Planned docs/test-contract gate. Defines prerequisite corpus readiness packet for ADR 019; not ADR 019 and no source/fixture edits. | Run structural command in paired test spec, then `npm run check`; later corpus/validator/importer work requires separate approval. | ADR 019 cannot recommend clean-slate rewrite unless ADR018 spike input and corpus readiness packet pass, except explicit operator waiver. |
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
- Within ADR17-001, TB-3a (per-disposition successor scaffolds) and TB-3b (envelope-conflict analysis) are disjoint sub-sections of the PRD and may run in parallel after TB-1 hard gate; TB-V-EQ stays deferred behind HITL and never executes in this lane.

## HITL checkpoints

1. Approve this board as the canonical planning entrypoint.
2. PHA-TB-1 landed (canonical merge in `OPEN-SCHEMA-QUESTIONS.md`); next gate is A9B-001 / ADR17-002 PRD authorship.
3. PHA-TB-2, PHA-TB-3, and PHA-TB-V landed; per-TB evidence in [`phase-a-status-matrix.md#phase-a-tracer-slice-status`](phase-a-status-matrix.md#phase-a-tracer-slice-status).
4. Decide whether any v0.3 or ADR17 proposal graduates to accepted ADR/policy.
5. Decide whether any `.omx/plans` artifact should be promoted into tracked `docs/plans` summaries.
