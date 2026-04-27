# Deep Interview Spec - Deep Research Operating System

## Metadata

- Profile: standard
- Rounds: 4
- Final ambiguity: 18%
- Threshold: 20%
- Context type: brownfield
- Context snapshot: `.omx/context/deep-research-report-operationalization-20260424T153014Z.md`
- Related context: `.omx/context/doc-sprawl-to-executable-prds-20260425T162650Z.md`
- Transcript: `.omx/interviews/deep-research-operating-system-20260425T193424Z.md`

## Intent

Create a human-in-the-loop operating system for converting dense research and
planning artifacts into repo-grounded decisions, prompt packets, PRD/backlog
items, conflict registers, and plan-mode handoff inputs.

This is broader than simply operationalizing one report. The immediate source
is `memos/deep-research-report24042026.md`, but the reusable pattern should
also cover follow-up artifacts such as revised alignment memos, Workstream A
PRD/test material, FHIR boundary decisions, openEHR cycle-decision synthesis,
adapter ergonomics synthesis, actor-attestation analysis, ADRs, roadmap entries,
and Phase A clinical-reference syntheses.

## Desired Outcome

Before implementation or full automation, produce one source-grounded operating
artifact with four required surfaces:

1. Complete source map.
2. Authority hierarchy.
3. PRD/backlog table.
4. Conflict register.

That artifact should let a human decide what moves into plan mode, what stays
advisory, what needs research, and what is blocked by conflict or missing
authority.

Follow-up clarification: the user does not need or want to operate an actual
Kanban board. OMX should choose the most useful agent-facing shape. Default to
a flat Markdown status index that gives agents enough structure to triage,
propose, and gate conflicts without forcing Kanban workflow knowledge on the
user.

Follow-up clarification: `tracked-docs-plans`. The output should land as tracked
documentation/planning artifacts, not only as chat, transient OMX question
state, or scratch notes. Prefer a canonical memo plus optional `.omx/plans/`
handoff artifacts when entering plan mode.

Follow-up clarification: `both-staged`. Produce both documentation and planning
artifacts, staged so the canonical operating index comes first and the PRD/test
handoff comes second. Because `memos/` and `.omx/` are ignored in this repo,
tracked artifacts should live under `plans/`.

## In Scope

- Inventory source artifacts that affect the deep-research report and its
  follow-up planning lane.
- Classify each source by authority, status, scope, freshness, and downstream
  use.
- Build an authority hierarchy that distinguishes accepted policy, current
  code, planning artifacts, research memos, prompts, and derived context.
- Produce a PRD/backlog table that converts recommendations into plan-mode
  candidates, research prompts, ADR candidates, defers, or no-ops.
- Produce a conflict register as a Kanban index.
- Preserve existing accepted ADRs and shipped code as evidence, not items to
  re-litigate by default.
- Keep human approval gates for conflict resolution and implementation launch.

## Out Of Scope / Non-goals

- No implementation code yet.
- No full automation yet.
- No code changes in this pass.
- No autonomous execution mode launch from this pass.
- No broad repo rewrite or doc cleanup as a side effect.
- No speculative FHIR/openEHR/adapter implementation from research alone.
- No relitigation of accepted ADRs unless a conflict register item explicitly
  shows a contradiction with current code or newer accepted authority.
- No production EHR, compliance platform, RBAC/auth, UI, or simulator-coupling
  expansion.

## Decision Boundaries

OMX may decide without further confirmation:

- How to structure the source map, hierarchy, backlog table, and conflict
  register.
- How to classify sources by authority when the hierarchy is explicit.
- How to mark lower-authority sources as advisory, superseded, stale, or
  deferred when they do not conflict with accepted policy.
- How to propose plan-mode lanes and research prompts.
- How to keep existing Workstream A/C/D decisions visible without starting
  implementation.

OMX must not decide without confirmation:

- To implement code.
- To launch full automation.
- To treat a conflict as settled when two high-authority sources disagree.
- To override accepted ADRs or current code based only on a research memo.
- To widen Workstream A with FHIR, openEHR, adapter, attestation, UI, or
  compliance scope.

## Authority Hierarchy

Default hierarchy for the operating artifact:

1. System/developer/user instructions in the active session.
2. Current code and tests, where behavior is directly observable.
3. Accepted ADRs in `decisions/`.
4. Current roadmap and architecture/spec docs: `ROADMAP.md`, `DESIGN.md`,
   `ARCHITECTURE.md`, `README.md`.
5. Current PRD/test-spec artifacts under `.omx/plans/` when they are explicitly
   selected for a lane.
6. Active alignment or decision memos in `memos/`, especially revised artifacts
   that explicitly supersede prior versions.
7. Phase A clinical-reference syntheses and open schema question files.
8. Context snapshots, wiki/session logs, and generated summaries.
9. External research prompts and model outputs until promoted by a human or
   decision artifact.

If two sources in adjacent tiers disagree, prefer the higher tier but record
the conflict. If two sources in the same tier disagree, do not settle silently;
create a conflict-register item.

## Conflict Register / Status Index

Conflicts are indexed rather than hidden. Each item should include:

- `id`
- `title`
- `sources_in_conflict`
- `authority_tiers`
- `conflict_type`: stale, contradiction, scope creep, implementation drift,
  research-unverified, duplicate, or missing-owner
- `proposed_resolution`
- `status`: inbox, triaged, needs-human, accepted, deferred, superseded,
  blocked, or closed
- `owner_or_gate`
- `next_action`
- `evidence`

Default policy: use the hierarchy to propose a resolution, then keep the item
in the status index until a human gate or plan-mode artifact accepts it.

Recommended representation: a single Markdown table grouped by status. This is
more valuable than a literal Kanban board for the current repo because agents
can search, diff, cite, and update it in normal review flow.

## PRD / Backlog Table

The backlog table should convert report recommendations and follow-up artifacts
into concrete rows. Required columns:

- `id`
- `source`
- `recommendation_or_claim`
- `authority`
- `bucket`: shipping, partial-shipping, planned, new, stale, contradicted,
  external-unverified, or deferred
- `disposition`: no-op, docs-alignment, ADR-candidate, plan-candidate,
  ticket-candidate, research-prompt, defer, or conflict
- `lane`: Workstream A/B/C/D or future
- `dependencies`
- `acceptance_evidence`
- `next_gate`

The table should not be a code execution plan. It is a planning index that
feeds later `$ralplan`, direct research prompts, or human approval.

## Complete Source Map

The source map should include at least:

- `memos/deep-research-report24042026.md`
- `memos/deep-research-alignment-24042026.md`
- `memos/deep-research-alignment-revised-2026-04-25.md`
- `memos/Workstream A PRD test.md`
- `memos/definitive-fhir-boundary-pi-chart.md`
- `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
- `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
- `memos/Actor-attestation-taxonomy.md`
- `memos/pi-chart-v03-memo.md`
- `.omx/plans/prd-memory-proof-six-surface-broad-ehr.md`
- `.omx/plans/test-spec-memory-proof-six-surface-broad-ehr.md`
- `.omx/context/deep-research-report-operationalization-20260424T153014Z.md`
- `.omx/context/doc-sprawl-to-executable-prds-20260425T162650Z.md`
- `decisions/015-adr-009-011-implementation.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`
- `README.md`, `ROADMAP.md`, `DESIGN.md`, `ARCHITECTURE.md`
- `clinical-reference/broad-ehr-skeleton.md`
- relevant `clinical-reference/phase-a/` syntheses and open schema question
  files when they affect backlog rows.

## Testable Acceptance Criteria

The operating-system pass is ready for plan mode when:

1. A complete source map exists and every source has role, authority tier,
   freshness/status, and downstream use.
2. An authority hierarchy exists and defines how conflicts are proposed, not
   silently settled.
3. A PRD/backlog table maps all material report recommendations and follow-up
   artifacts into lanes, dispositions, dependencies, and next gates.
4. A Kanban conflict register exists with every known contradiction, stale
   source, duplicated decision, or unresolved authority issue indexed.
5. Existing accepted ADRs and current code are not relitigated without an
   explicit conflict-register item.
6. Workstream A remains the next implementation lane only as a planning output;
   no code is written in this pass.
7. Workstream C decisions are treated as future constraints, not Workstream A
   implementation scope.
8. The artifact can hand off to `$ralplan` or another planning lane without
   asking the user to reconstruct the source hierarchy from memory.

## Assumptions Exposed + Resolutions

- Assumption: the original seven-turn sequence should be followed literally.
  Resolution: use it as raw material for a broader operating system.
- Assumption: a successful pass could be just a prompt packet or plan-mode
  handoff. Resolution: success requires four operating surfaces: source map,
  hierarchy, backlog table, and conflict register.
- Assumption: source conflicts can be solved automatically. Resolution:
  conflicts become status-index items with proposed resolution and human-gated
  movement.

## Pressure-Pass Findings

The pressure pass focused on authority and conflict handling. The answer
`kanban-index` changes the default from "resolve by hierarchy and move on" to
"propose by hierarchy, index visibly, and require a gate before settlement."
Follow-up clarification changes the format: use a simple conflict-status table,
not a literal Kanban board. This preserves human control while still allowing
the system to organize work.

## Handoff Recommendation

Do not implement code next. Use `$ralplan` or a direct planning pass to produce
the operating artifact itself:

```text
Source-map + authority-hierarchy + PRD/backlog table + Kanban conflict register
for deep-research report operationalization.
```

Treat this spec as the requirements source of truth for that planning pass.
Do not write implementation code in that pass unless the user explicitly
switches from operating-artifact work to execution.

Recommended artifact target:

```text
plans/deep-research-operating-system.md
plans/prd-deep-research-operating-system.md
plans/test-spec-deep-research-operating-system.md
```
