# Context snapshot — document sprawl to executable PRDs

- Timestamp: 20260425T162650Z
- Task statement: Consolidate sprawling planning/research documents into structured PRDs, thin tracer-bullet vertical slices, and TDD-ready agent execution lanes with human planning/QA involvement.
- Desired outcome: A phased consolidation workflow that preserves ADR/Phase A/research intent, reduces document sprawl, and creates executable implementation slices for agents.
- Stated solution: Use HITL `$deep-interview` to clarify planning boundaries, then likely `$ralplan`/PRD artifacts and agent execution with TDD.
- Probable intent hypothesis: User wants confidence that foundational decisions and research artifacts become tested implementation work without losing human control over phase planning and QA gates.
- Known facts/evidence:
  - ADRs live under `decisions/001...017*.md`.
  - Phase A source artifacts live under `clinical-reference/phase-a/` with charter, execution plan, template, open schema questions, and A0a-A7 syntheses.
  - Research/proposal artifacts live under `memos/`, including deep-research alignment, Workstream A PRD/test, FHIR boundary, adapter synthesis, openEHR cycle decision, actor-attestation, and `pi-chart-v03-memo.md`.
  - Existing execution/planning artifacts live under `.omx/plans/` as PRD/test-spec pairs and RALPLAN drafts.
  - Existing context snapshots live under `.omx/context/`; autoresearch bundle exists under `.omx/specs/autoresearch-pi-chart-agent-native-ehr-primitives/`.
  - Wiki-derived knowledge exists under `wiki/` and OMX wiki session logs under `.omx/wiki/`.
- Constraints:
  - No direct implementation in deep-interview mode.
  - Preserve user HITL involvement in planning phases and QA/testing.
  - Prefer executable PRDs and thin vertical tracer bullets with TDD agent execution.
  - Do not couple `pi-agent` directly to `pi-sim` source.
- Unknowns/open questions:
  - Canonical source-of-truth hierarchy for ADRs vs Phase A docs vs memos vs roadmap/v03.
  - Whether first deliverable should be an inventory/index, a PRD factory template, an actual first PRD, or a multi-phase execution program.
  - Which docs are authoritative and which should be archived, summarized, or treated as evidence only.
  - Human decision gates required before agents implement slices.
- Decision-boundary unknowns:
  - What OMX may decide autonomously when deduplicating/reclassifying docs.
  - Whether to modify docs now or only produce plan/spec artifacts.
  - How much phase sequencing can be proposed without user approval.
- Likely codebase touchpoints:
  - `decisions/`, `clinical-reference/phase-a/`, `memos/`, `.omx/plans/`, `.omx/specs/`, `.omx/context/`, `ROADMAP.md`, `wiki/`.
- Prompt-safe initial-context summary status: not_needed

## Initial document inventory summary

Primary source layers appear to be: ADR policy (`decisions/`), Phase A clinical/reference briefs (`clinical-reference/phase-a/`), large research/proposal memos (`memos/`), roadmap/v03 synthesis (`ROADMAP.md`, `memos/pi-chart-v03-memo.md`), existing PRD/test-spec/RALPLAN execution artifacts (`.omx/plans/`), and derived wiki/context snapshots (`wiki/`, `.omx/context/`).
