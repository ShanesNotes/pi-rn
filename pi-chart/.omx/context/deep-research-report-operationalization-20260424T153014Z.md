# Deep Research Report Operationalization Context

Task statement: operationalize `memos/deep-research-report24042026.md` through a multi-turn prompt/response workflow with Claude Code in this repo, then hand off to planning or focused research.

Desired outcome: a disciplined sequence that teases apart implications without re-litigating settled ADRs, producing at most one compact artifact per turn and ending with concrete plan-mode inputs.

Stated solution: use a seven-turn flow: alignment matrix, positioning lock, must-have gap analysis, differentiating-bets audit, standards/boundary scoping, OSS study triage, then plan mode.

Probable intent hypothesis: the user wants to convert a dense external-style research report into repo-grounded decisions and prompts, preserving product strategy while avoiding doc sprawl and stale recommendations.

Known facts/evidence:
- `memos/deep-research-report24042026.md` recommends pi-chart as an agent-native/provenance-native clinical record substrate, not a full EHR or generic AI gateway.
- `decisions/016-broad-ehr-skeleton-clinical-memory.md` already accepts the broad EHR skeleton as the clinical-memory proof surface.
- `ROADMAP.md` says the current focus is broad shallow EHR skeleton before integration and lists actor/attestation enrichment as deferred.
- `decisions/015-adr-009-011-implementation.md` phases 0-6 are recorded as shipped; phase 7 migration/corpus sweep remains a key interaction surface in the user's prompt.
- `README.md` and `ARCHITECTURE.md` already position FHIR as a boundary adapter, never the internal model.

Constraints:
- Deep-interview must clarify intent and boundaries before execution.
- Do not implement directly from this mode.
- One question per interview round via `omx question`.
- Keep outputs compact; avoid generating a memo for every implication unless explicitly useful.
- No new dependencies.
- Existing ADRs and shipped decisions should be treated as evidence, not reopened by default.

Unknowns/open questions:
- Whether the first artifact should be a neutral alignment matrix, a Claude-ready prompt, or both in one bounded artifact.
- Which decisions the user wants Claude Code to make autonomously versus escalate.
- How much current-code inspection is required before each turn.
- Whether external research should update facts from the report or only produce prompts for the user to run in Claude.ai/ChatGPT.com.

Decision-boundary unknowns:
- Can the workflow mark a report recommendation as stale/contradicted without asking first?
- Can it draft ADR/ticket/research prompts, or only classify candidates?
- Can it change repo docs during the eventual plan-mode phase, or must initial outputs stay read-only?

Likely codebase touchpoints:
- `memos/deep-research-report24042026.md`
- `README.md`
- `ROADMAP.md`
- `DESIGN.md`
- `ARCHITECTURE.md`
- `decisions/015-adr-009-011-implementation.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`
- `clinical-reference/broad-ehr-skeleton.md`
- `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`

Prompt-safe initial-context summary status: recorded.
