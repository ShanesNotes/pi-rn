# Deep Interview Transcript — Document sprawl to executable PRDs

- Profile: standard
- Context type: brownfield
- Final ambiguity: 15.0% (threshold 20.0%)
- Context snapshot: `.omx/context/doc-sprawl-to-executable-prds-20260425T162650Z.md`

## Round 1 — intent/source-of-truth

Question: I found ADRs in decisions/, Phase A briefs in clinical-reference/phase-a/, research/proposal memos in memos/, roadmap/v03 docs, and existing PRD/test-spec/RALPLAN artifacts in .omx/plans/. What should be the primary deliverable of this consolidation pass?

Answer: End-to-end operating system.

Interpretation: The deliverable should cover source hierarchy, PRD factory, tracer bullets, agent lanes, and QA loop.

## Round 2 — non-goals/scope

Question: For the first consolidation pass toward this end-to-end operating system, which items must explicitly stay out of scope?

Answer: No implementation code yet; No full automation yet.

Interpretation: The first pass is planning/consolidation only and preserves HITL approvals.

## Round 3 — decision boundaries / contrarian pressure pass

Question: Contrarian check: if this pass avoids implementation code and full automation, it could become another meta-doc unless OMX can make some hard planning decisions. Which decisions may OMX make without stopping for your approval?

Answer: Classify doc authority; Propose archive candidates; Group PRD candidates; Slice tracer bullets; Define artifact templates.

Interpretation: OMX may make non-destructive planning decisions, but binding prioritization and execution automation remain HITL.

## Round 4 — success criteria

Question: What concrete acceptance checks would make this consolidation artifact good enough for you to approve a later PRD/tracer-bullet execution phase?

Answer: Complete source map; Authority hierarchy; PRD backlog table; Conflict register.

Interpretation: The immediate artifact should be an approval-grade consolidation map and PRD backlog, not yet full slice cards or agent protocol.
