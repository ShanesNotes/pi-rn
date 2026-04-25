# PRD - Deep Research Operating System

Status: staged PRD, no implementation code.
Canonical index: `plans/deep-research-operating-system.md`.

## Problem

Dense research and model-generated planning artifacts are accumulating across
ignored memos, OMX context, ADRs, roadmap docs, and clinical-reference files.
Without a tracked operating layer, agents can overfit to the latest memo,
re-open settled ADRs, miss conflicts, or jump into implementation before human
approval.

## Goal

Create and maintain a tracked planning artifact that turns dense research into
four durable surfaces:

1. Complete source map.
2. Authority hierarchy.
3. PRD/backlog table.
4. Conflict register / status index.

The output should be usable by the user, Codex, and subagents without requiring
the user to manage a literal Kanban board.

Operating mode: prioritized hybrid. Backlog and conflict items must carry a
priority, while authority remains hybrid: accepted ADRs/current code constrain
decisions, ignored memos provide evidence, and human gates settle conflicts.

Current priority tracks: `phase-a`, `v03`, `adr17`, `boundary`, and
`omx-promotion`. These are provisional triage tracks, not a final priority lock.

Allowed no-code actions: choose depth, add docs/plans, update statuses, edit
source docs lightly, and recommend order.

## Non-goals

- No implementation code.
- No full automation.
- No full deep-all analysis across every artifact.
- No final priority lock from this pass.
- No autonomous execution launch.
- No broad doc rewrite outside the staged planning artifacts.
- No FHIR/openEHR/adapter implementation.
- No speculative adapter design or scope expansion.
- No UI, auth, compliance platform, full EHR, or simulator-coupling work.

## Users

- Project lead: needs a readable control surface over research, planning, and
  conflict decisions.
- Codex leader: needs authority and backlog rules before planning/execution.
- Subagents: need source roles, conflict status, and acceptance gates.

## Requirements

### R1 - Source Map

The artifact must list source documents that affect the deep-research report
operationalization. Each row must include path, authority tier, status, and role.

### R2 - Authority Hierarchy

The artifact must define a default source hierarchy and conflict policy.
Accepted ADRs/current code outrank ignored memos. Ignored memos remain evidence
until promoted into tracked docs/plans/ADRs.

### R3 - Backlog Table

The artifact must map material claims/recommendations into backlog rows with
source, bucket, disposition, lane, dependencies, acceptance evidence, and next
gate.

### R4 - Conflict Register

The artifact must track contradictions, stale sources, scope conflicts, and
missing-authority cases in a flat Markdown status index. It must include
proposed resolution and a human or plan-mode gate.

### R5 - Staged Handoff

The operating artifact must separate planning from implementation:

- Stage 1: tracked operating index.
- Stage 2: PRD/test-spec handoff.
- Stage 3: later implementation only after explicit approval.

### R6 - Prioritized Hybrid Mode

The operating artifact must rank backlog/conflict rows by priority:

- P0: blocks safe planning or contradicts active user constraints.
- P1: unlocks the next accepted lane or prevents implementation drift.
- P2: useful governance/adapter/docs work sequenced behind proof.
- P3: speculative or future work without a current consumer.

Priority is not authority. A P1 ignored memo can inform a plan, but it cannot
override a P2 accepted ADR without a conflict row and human gate.

### R7 - Priority Track Coverage

The operating artifact must explicitly cover the current priority tracks:

- `omx-promotion`: promote durable ignored `.omx`/memo decisions into tracked
  plans/docs before relying on them.
- `adr17`: reconcile actor/attestation/review work against accepted ADR 017.
- `phase-a`: map clinical-reference syntheses into PRD candidates.
- `v03`: reconcile the v0.3 memo against accepted ADRs/current code.
- `boundary`: keep FHIR/openEHR/adapter decisions as future constraints, not
  current implementation scope.

Coverage means bounded triage: identify sources, obvious conflicts, and next
gates. It does not mean exhaustive deep analysis of every source.

### R8 - Agent Operating Permissions

The agent may make no-code planning calls without asking for every step:

- choose analysis depth by priority/risk;
- add tracked docs/plans;
- update statuses in the source map, backlog, and conflict register;
- edit source docs lightly when it reduces planning drift;
- recommend the next order of work.

Recommended order:

1. `omx-promotion`
2. `adr17`
3. `v03`
4. `phase-a`
5. `boundary`

## Acceptance Criteria

1. `plans/deep-research-operating-system.md` exists and contains the four
   required surfaces.
2. The source map covers the original report, revised alignment, Workstream A
   materials, FHIR/openEHR/adapter/attestation memos, key ADRs, core docs, and
   relevant context snapshots.
3. The authority hierarchy explicitly handles ignored memos and `.omx` artifacts.
4. The backlog table includes Workstreams A-D and defers implementation.
5. Backlog and conflict rows include priorities.
6. The backlog and conflict register include the five priority tracks:
   `phase-a`, `v03`, `adr17`, `boundary`, and `omx-promotion`.
7. The artifacts state that those priorities are provisional, not a final lock.
8. The artifacts prohibit full deep-all analysis and speculative adapter work in
   this pass.
9. The artifacts document the allowed no-code actions and recommended order.
10. The conflict register includes at least the ignored-memos authority issue,
   no-code-vs-build-now issue, Workstream A fixture target mismatch, and
   actor-attestation status check.
11. No implementation source files are changed by this planning pass.
12. The user can choose a next planning or execution lane without reconstructing
   source authority from chat history.

## Staged Backlog

| Stage | Work item | Output | Gate |
| --- | --- | --- | --- |
| 1 | Create operating index | `plans/deep-research-operating-system.md` | User reviews. |
| 2 | Maintain PRD/test spec | `plans/prd-*`, `plans/test-spec-*` | User approves plan-mode lane. |
| 3 | Promote selected decisions | ADR/docs updates if needed | User approves doc changes. |
| 4 | Implement selected lane | Code/test changes | Explicit execution request. |

## Risks

| Risk | Mitigation |
| --- | --- |
| Operating artifact becomes another stale document | Keep conflict/status rows small and tied to gates. |
| Agents treat ignored memos as canonical | Authority hierarchy says ignored memos are evidence only. |
| User is forced into Kanban process | Use flat Markdown status table. |
| Planning pass sneaks into implementation | No-code constraint is explicit acceptance criterion. |
| Priority tracks are treated as final sequence | Mark priorities provisional until a human gate accepts a lane. |
| Boundary work expands into adapter design | Keep boundary as future constraint; no speculative adapter work. |

## Recommended Next Planning Lane

Default next lane remains Workstream A planning/execution readiness, but only
after the user explicitly moves from no-code planning to implementation. Until
then, use this PRD to refine tracked planning artifacts and source authority.
