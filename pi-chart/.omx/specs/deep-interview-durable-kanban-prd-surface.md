# Deep Interview Spec — durable kanban PRD surface

## Metadata

- Profile: standard continuation
- Rounds: 5
- Final ambiguity: 12%
- Threshold: 20%
- Context type: brownfield
- Context snapshot: `.omx/context/durable-kanban-prd-surface-20260425T193700Z.md`
- Transcript: `.omx/interviews/durable-kanban-prd-surface-20260425T193700Z.md`

## Clarity breakdown

| Dimension | Score | Notes |
|---|---:|---|
| Intent | 0.95 | User wants sprawl turned into durable, agent-usable planning surfaces. |
| Outcome | 0.90 | Canonical tracked kanban PRD index with next-workstream PRD/test-spec context. |
| Scope | 0.85 | Planning artifacts only; no product code changes. |
| Constraints | 0.90 | Use tracked `docs/plans`; no code changes; preserve HITL priority gate. |
| Success | 0.90 | Future agents can pick cards from source-linked staged PRD/tracer cards without re-reading all memos. |
| Context | 0.88 | Existing source map, memos, Workstream A report, and Phase A files inspected. |

## Intent

Create a durable, consolidated planning surface that prevents `.omx`, `/memos`, roadmap, and Phase A research sprawl from forcing every future agent to rediscover context.

## Desired outcome

A tracked `docs/plans` work surface containing:

1. A canonical README for how agents use the planning surface.
2. A kanban-style PRD board.
3. A next-workstream PRD for Phase A completion-to-implementation bridge.
4. A paired test spec for that PRD.

## In scope

- Summarize existing source-map conclusions.
- Confirm that `/memos` and research reports are included as evidence/proposal layers.
- Reflect current repo delta: A8 and A9a Phase A docs are now present.
- Create staged cards: PRD cards for source/conflict context, Ready tracer-bullet cards for execution details.
- Keep HITL decision gates explicit.

## Out of scope / non-goals

- Product code changes.
- Final irreversible source document moves/deletes.
- Treating proposed ADRs or memo-only proposals as accepted policy.
- Hidden `pi-sim` coupling.

## Decision boundaries

OMX may decide without further approval:

- Kanban/card shape.
- PRD grouping and recommended order.
- Source/status classifications for planning purposes.
- Creation of tracked planning docs under `docs/plans`.

OMX must stop for user approval before:

- Product code implementation.
- Moving/deleting source docs.
- Locking final priority order.
- Accepting proposed ADR 017 or memo-only v0.3 proposals as canonical policy.

## Acceptance criteria

- `docs/plans` exists and is the canonical durable planning surface.
- Board records source inputs, status, dependencies, HITL gates, and next actions.
- Phase A bridge PRD/test-spec include 3–6 context-efficient tracer bullets with purpose, owned files, first test, implementation boundary, and verification command.
- `/memos` and research-report capture status is explicit.
- No product code files are modified by this pass.
