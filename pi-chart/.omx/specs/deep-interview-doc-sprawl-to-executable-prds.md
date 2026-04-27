# Deep Interview Spec — Document sprawl to executable PRDs

## Metadata

- Profile: standard
- Rounds: 4
- Final ambiguity: 15.0%
- Threshold: 20.0%
- Context type: brownfield
- Context snapshot: `.omx/context/doc-sprawl-to-executable-prds-20260425T162650Z.md`
- Transcript: `.omx/interviews/doc-sprawl-to-executable-prds-20260425T163544Z.md`

## Clarity breakdown

| Dimension | Score | Notes |
|---|---:|---|
| Intent | 0.90 | User wants document sprawl converted into a usable operating system for planning and execution. |
| Outcome | 0.85 | First deliverable is an approval-grade consolidation artifact: source map, authority hierarchy, PRD backlog, conflict register. |
| Scope | 0.85 | Planning/consolidation only; no implementation-code changes and no full automation. |
| Constraints | 0.80 | Preserve HITL gates; OMX may make non-destructive planning classifications and templates. |
| Success | 0.80 | Completion judged by complete source map, hierarchy, PRD backlog, and conflict register. |
| Context | 0.85 | Key document roots inventoried from repo. |

## Intent

Reduce pi-chart planning/document sprawl by consolidating ADRs, Phase A research briefs, large memos, roadmap/v03 artifacts, and existing `.omx` planning outputs into an executable planning system. The system should help the user stay involved in phase planning and QA while allowing agents to implement later slices with TDD.

## Desired outcome

Create a first-pass consolidation artifact that lets the user approve the next planning/execution phase. It should not implement code yet. It should make the document landscape navigable and convert source material into candidate PRDs.

## In scope

1. Build a complete source map across:
   - `decisions/`
   - `clinical-reference/phase-a/`
   - `memos/`
   - `ROADMAP.md`
   - `.omx/plans/`
   - `.omx/context/`
   - `.omx/specs/`
   - `wiki/` and `.omx/wiki/` where relevant
2. Define an authority hierarchy for conflicts between ADRs, Phase A docs, memos, roadmap/v03, existing plans, and wiki/context layers.
3. Group source material into candidate PRDs/workstreams.
4. Produce a PRD backlog table with source inputs, intended outcome, acceptance criteria, dependencies, and open questions.
5. Create a conflict register for stale docs, duplicates, unresolved contradictions, and HITL decisions.
6. Define artifact templates for later PRD/test-spec/slice-card work if needed.
7. Propose archive/merge/rewrite candidates without deleting files.
8. Slice tracer bullets at planning level only when they clarify candidate PRD shape; do not start implementation.

## Out of scope / non-goals

- No implementation-code changes in this pass.
- No full automation of planning, execution, or QA closure.
- No deletion of documents unless a later HITL approval explicitly authorizes it.
- No direct execution of tracer bullets inside deep-interview.

## Decision boundaries

OMX may decide without further approval:

- Classify document authority/status.
- Propose archive candidates.
- Group PRD candidates.
- Draft tracer-bullet slices as planning artifacts.
- Define artifact templates.

OMX should stop for user approval before:

- Deleting, moving, or materially rewriting source documents.
- Treating priorities or phase order as final.
- Starting implementation-code changes.
- Fully automating agent execution or QA closure.

## Constraints

- Preserve ADRs as high-authority policy unless the conflict register identifies a specific issue for HITL review.
- Keep user involved at phase-planning and QA/testing gates.
- Future execution should use TDD: failing/regression tests first, thin vertical slices, then evidence-backed implementation.
- No new dependencies or external skill imports are required for the first pass unless the user later opts in.
- Respect project boundary: do not couple `pi-agent` directly to `pi-sim` source code.

## Testable acceptance criteria

A consolidation pass is complete when:

1. **Complete source map:** every known planning/research source in the listed roots is categorized.
2. **Authority hierarchy:** the artifact states which doc layer wins when ADRs, Phase A, memos, roadmap, and existing plans conflict.
3. **PRD backlog table:** candidate PRDs include source inputs, outcome, acceptance criteria, dependencies, and open questions.
4. **Conflict register:** conflicts, stale docs, duplicate briefs, and unresolved decisions are listed for HITL review.
5. **Non-implementation proof:** changed files are limited to planning/consolidation artifacts.

## Assumptions exposed and resolutions

- Assumption: A full operating system might become another meta-doc. Resolution: OMX is allowed to make concrete non-destructive planning decisions so the output becomes approval-ready.
- Assumption: Tracer bullets are the immediate deliverable. Resolution: first acceptance gate is source map + hierarchy + PRD backlog + conflict register; detailed execution cards can follow after approval.
- Assumption: External Matt Pocock skills may be needed. Resolution: not needed for first pass unless later chosen; existing OMX/deep-interview/ralplan/team patterns are enough.

## Pressure-pass findings

Round 3 revisited the Round 1 desire for an end-to-end operating system. The pressure question forced the distinction between non-destructive planning authority and HITL-gated implementation/automation. That reduced the risk of producing a vague meta-plan.

## Brownfield evidence vs inference

Evidence:

- ADRs exist under `decisions/001...017*.md`.
- Phase A docs exist under `clinical-reference/phase-a/`, including charter, execution plan, template, open questions, and A0a-A7 syntheses.
- Memos exist under `memos/`, including deep-research alignment, boundary/adaptor/openEHR syntheses, actor-attestation taxonomy, Workstream A PRD/test, and `pi-chart-v03-memo.md`.
- Existing PRD/test-spec/RALPLAN planning artifacts exist under `.omx/plans/`.
- Existing context/spec/wiki layers exist under `.omx/context/`, `.omx/specs/`, `wiki/`, and `.omx/wiki/`.

Inference:

- The safest first executable planning step is a consolidation artifact that precedes PRD finalization and implementation.

## Recommended handoff

Recommended next lane: `$ralplan` using this spec as source of truth.

Suggested invocation:

```bash
$plan --consensus --direct .omx/specs/deep-interview-doc-sprawl-to-executable-prds.md
```

Expected `$ralplan` output:

- `prd-doc-sprawl-consolidation-operating-system.md`
- `test-spec-doc-sprawl-consolidation-operating-system.md`
- A thin first work package to generate the source map, authority hierarchy, PRD backlog table, and conflict register.

## Condensed transcript

See `.omx/interviews/doc-sprawl-to-executable-prds-20260425T163544Z.md`.
