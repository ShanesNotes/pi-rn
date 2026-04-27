# Deep Interview Spec — PRD kanban backlog expansion

## Metadata

- Profile: standard
- Rounds: 4
- Final ambiguity: 16%
- Threshold: 20%
- Context type: brownfield
- Context snapshot: `.omx/context/prd-kanban-backlog-expansion-20260425T195000Z.md`
- Transcript: `.omx/interviews/prd-kanban-backlog-expansion-20260425T195000Z.md`

## Clarity breakdown

| Dimension | Score | Notes |
|---|---:|---|
| Intent | 0.90 | User wants to escape document-load transition state by converting docs into executable PRDs/backlog cards. |
| Outcome | 0.86 | Prioritized hybrid: expand durable PRD/test-spec coverage and tighten kanban for parallel agents. |
| Scope | 0.82 | Cover all five backlog areas, but right-size depth to avoid another huge planning layer. |
| Constraints | 0.82 | No implementation in this pass; no speculative adapter build; no final priority lock. |
| Success | 0.80 | Board has enough durable PRD/test-spec coverage that agents can pick cards without rereading all memos. |
| Context | 0.90 | Existing `docs/plans` board, Phase A PRD/test-spec, `.omx` history, memos, A8/A9a, and backlog candidates inspected. |

## Intent

Move pi-chart out of a transition state where clinical/research/planning documents are abundant but not sufficiently converted into context-efficient, agent-executable work surfaces.

## Desired outcome

Create a prioritized hybrid backlog expansion:

1. Deepen the immediate Phase A bridge enough for execution.
2. Add durable PRD/test-spec pairs for every current backlog candidate.
3. Keep deferred/decision areas thinner than immediate execution areas.
4. Update the kanban board so future agents can parallelize safely.

## In scope

- Expand `docs/plans/kanban-prd-board.md`.
- Add or revise `docs/plans/prd-*.md` and `docs/plans/test-spec-*.md` files.
- Convert these backlog candidates into durable PRD/test-spec surfaces:
  - `PHA-001` / Phase A bridge deepening.
  - `V03-001` / v0.3 foundation reconciliation.
  - `ADR17-001` / actor-attestation decision path.
  - `BND-001` / adapter-boundary future work.
  - `DOC-002` / durable promotion of `.omx` planning history.
- Choose PRD depth per area: deeper for immediate execution, thinner for deferred/decision PRDs.
- Update kanban statuses based on source evidence.
- Recommend execution order while preserving HITL final approval.
- Lightly edit source docs for link/status clarity if needed.

## Out of scope / non-goals

- No implementation/product-code changes in the backlog-expansion pass.
- No full deep PRD for every area when a thinner decision/backlog PRD is enough.
- No final priority lock; sequencing recommendations remain HITL-reviewable.
- No speculative adapter/FHIR/openEHR implementation.

## Decision boundaries

OMX may decide without further approval:

- Which PRDs are full execution PRDs vs thinner decision/backlog PRDs.
- New durable `docs/plans` file names and structure.
- Kanban status movements.
- Source-evidence classification and conflict notes.
- Recommended execution order.
- Light source-doc cleanup for links/status clarity.

OMX must stop or preserve HITL gate before:

- Starting implementation/code changes.
- Treating proposed ADR 017 as accepted policy.
- Finalizing execution priority as binding.
- Starting adapter/boundary implementation.
- Making destructive source-document moves/deletes.

## Constraints

- Preserve source authority hierarchy from `docs/plans/README.md`.
- Keep `/memos` and research reports as evidence/proposal layers unless accepted by ADR/HITL.
- Keep `pi-chart` bounded; no hidden `pi-sim` coupling.
- Keep cards context-efficient: agents should read board + card + linked source subset, not all memos.
- Use tests/executable validation as first step for implementation cards.

## Testable acceptance criteria

1. `docs/plans/kanban-prd-board.md` lists all five backlog areas with clear statuses and next actions.
2. Every current backlog candidate has a durable PRD/test-spec pair or an explicit reason for being represented by a thinner decision PRD.
3. Phase A bridge remains the deepest immediate execution surface.
4. v0.3, ADR17, boundary, and `.omx` promotion areas are right-sized so they reduce sprawl rather than expanding it.
5. Each ready or near-ready card names source inputs, owner files/surfaces, first test/validation, boundary, and verification command where applicable.
6. Board states which cards can parallelize and where shared-file conflicts require sequencing.
7. No product-code implementation occurs during this expansion pass.

## Assumptions exposed + resolutions

- Assumption: converting every backlog area means full detailed PRDs for all. Resolution: no; choose depth per area and keep decision/deferred PRDs thinner.
- Assumption: all backlog areas must be done before any code. Resolution: user selected all areas for durable PRD/test-spec conversion before implementation resumes, but not all require deep execution detail.
- Assumption: source docs are untouchable. Resolution: user allowed light source-doc edits for link/status clarity, but destructive moves/deletes still require HITL.

## Pressure-pass findings

Round 3 challenged the all-areas selection as a risk of recreating document load. The resulting boundary is the central design rule: **prioritized hybrid, right-sized depth**. Phase A should be deeper; other backlog candidates should be durable enough to guide decisions and later execution without becoming another research-memo layer.

## Brownfield evidence vs inference

Evidence:

- `docs/plans/kanban-prd-board.md` already contains PHA-001 plus backlog candidates V03-001, ADR17-001, BND-001, DOC-002.
- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md` and paired test spec exist.
- `.omx/plans` contains historical PRD/test-spec/report artifacts.
- Memos/research and Phase A A8/A9a are represented in the durable board.

Inference:

- The next best pass should not be pure planning or pure execution. It should create enough durable backlog surface to allow HITL selection and later parallelization.

## Recommended handoff

Recommended next lane: `$ralplan --direct` using this spec as source of truth.

Suggested invocation:

```bash
$plan --consensus --direct .omx/specs/deep-interview-prd-kanban-backlog-expansion.md
```

Expected output:

- Updated `docs/plans/kanban-prd-board.md`.
- PRD/test-spec or right-sized decision-PRD pairs for:
  - v0.3 foundation reconciliation.
  - ADR17 actor-attestation decision path.
  - adapter/boundary future work.
  - `.omx` promotion policy.
- Tightened Phase A bridge status/depth where needed.
