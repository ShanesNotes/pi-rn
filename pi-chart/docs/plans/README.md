# pi-chart planning surface

This directory is the durable planning surface for pi-chart work. Future agents should start here, then follow links outward only when a card tells them to.

## Canonical entrypoints

1. [`kanban-prd-board.md`](kanban-prd-board.md) — current board of PRD/workstream cards.
2. [`phase-a-status-matrix.md`](phase-a-status-matrix.md) — exact-once Phase A source coverage for PHA-001.
3. [`prd-phase-a-completion-to-implementation-bridge.md`](prd-phase-a-completion-to-implementation-bridge.md) — deepest immediate execution PRD.
4. [`test-spec-phase-a-completion-to-implementation-bridge.md`](test-spec-phase-a-completion-to-implementation-bridge.md) — paired PHA-001 verification contract.
5. Thin backlog PRD/test-spec pairs:
   - [`prd-v03-foundation-reconciliation.md`](prd-v03-foundation-reconciliation.md) / [`test-spec-v03-foundation-reconciliation.md`](test-spec-v03-foundation-reconciliation.md)
   - [`prd-adr17-actor-attestation-decision.md`](prd-adr17-actor-attestation-decision.md) / [`test-spec-adr17-actor-attestation-decision.md`](test-spec-adr17-actor-attestation-decision.md)
   - [`prd-adapter-boundary-future-work.md`](prd-adapter-boundary-future-work.md) / [`test-spec-adapter-boundary-future-work.md`](test-spec-adapter-boundary-future-work.md)
   - [`prd-omx-planning-history-promotion.md`](prd-omx-planning-history-promotion.md) / [`test-spec-omx-planning-history-promotion.md`](test-spec-omx-planning-history-promotion.md)

## Source authority rule

Use this hierarchy unless a card says otherwise:

1. Current user instruction for the active workflow.
2. Accepted ADRs in `decisions/` with explicit accepted status.
3. Phase A charter/execution/template docs for Phase A process and scope.
4. `ROADMAP.md` for macro sequencing.
5. `/memos` and research reports as evidence/proposals, not accepted policy by default.
6. `.omx/plans` PRD/test-spec/report artifacts as execution history unless promoted here.
7. `.omx/context`, `.omx/specs`, `/wiki`, `.omx/wiki` as derived traceability.

## How agents should use this surface

1. Pick a card from `Ready for PRD execution` or `Ready for tracer execution`.
2. Read only that card, its linked PRD/test-spec, and named source inputs.
3. Start with the card's first failing or characterization test.
4. Keep changes inside the owned files listed by the card.
5. Run the card's verification command.
6. Report evidence and unresolved HITL questions.

## Standing guardrails

These are not a ban on implementation. They describe how agents should move from planning into code safely.

- Product code changes are allowed only when a selected PRD/tracer card explicitly owns the files and starts from tests or executable validation.
- Planning-surface maintenance cards are docs-only unless the card says otherwise.
- Do not couple `pi-chart` or `pi-agent` to hidden `pi-sim` internals.
- Do not add dependencies unless the active card or user explicitly approves them.
- Do not move, delete, or archive source documents without HITL approval.

## Dashboard

`dashboard.html` is a generated, gitignored build artifact. Regen via `npm run dashboard` from `pi-chart/`. Source of truth is `kanban-prd-board.md`. Open the resulting file via `file://` in a browser for a 4-column glance view.

For live development, `npm run dashboard:dev` starts a local server at `http://localhost:5173` that rebuilds the page in memory on each request and auto-reloads the browser via Server-Sent Events whenever `kanban-prd-board.md` changes. No disk write; the static `dashboard.html` is unaffected.
