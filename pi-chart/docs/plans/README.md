# pi-chart legacy planning surface

> **Status:** Historical/promoted planning surface from the pre-Matt-skills workflow. Not the default active PRD or issue tracker.
> New active work should start in `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`. Durable decisions belong in `pi-chart/docs/adr/`.

This directory preserves useful PRDs, test specs, reports, and planning boards as lineage. Future agents should not add new active planning scratchpads here unless a current `.scratch` PRD or accepted ADR explicitly says to promote a durable summary.

## Current use

Use this directory for:

- historical evidence;
- accepted reports that are already linked from canonical docs;
- old PRD/test-spec pairs when a `.scratch` issue cites them as source inputs;
- generated or legacy board artifacts that need banner/archive review.

Do not treat file existence here as implementation approval.

## Source authority rule

Use this hierarchy unless a current `.scratch` issue says otherwise:

1. Current user instruction for the active workflow.
2. Accepted ADRs in `docs/adr/` with explicit accepted status.
3. Subproject `CONTEXT.md` plus canonical architecture docs.
4. `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` for active work.
5. These legacy `docs/plans/*` files only when explicitly cited.
6. `/memos` and research reports as evidence/proposals, not accepted policy by default.
7. `.omx/plans` PRD/test-spec/report artifacts as execution history unless promoted into `.scratch`, an ADR, or canonical docs.
8. `.omx/context`, `.omx/specs`, `/wiki`, `.omx/wiki` as derived traceability.

## How agents should use this surface

1. Start from `.scratch/<feature>/PRD.md` or the user's cited issue.
2. Read files in this directory only when the active PRD/issue names them as source inputs.
3. If useful content here needs to drive implementation, summarize it into `.scratch/<feature>/` first.
4. Keep changes inside files owned by the active issue.
5. Run the active issue's verification command.
6. Report evidence and unresolved HITL questions.

## Standing guardrails

- Product code changes are allowed only when a selected `.scratch` issue explicitly owns the files and starts from tests or executable validation.
- Planning-surface maintenance cards are docs-only unless the card says otherwise.
- Do not couple `pi-chart` or `pi-agent` to hidden `pi-sim` internals.
- Do not add dependencies unless the active card or user explicitly approves them.
- Do not move, delete, or archive source documents without HITL approval.

## Dashboard

`dashboard.html` is a legacy generated planning artifact. Treat it as historical/promoted evidence unless a current `.scratch` issue re-authorizes dashboard work.
