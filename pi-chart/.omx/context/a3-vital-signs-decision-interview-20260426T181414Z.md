# Deep Interview Context Snapshot: A3 vital signs decision interview

- Task statement: User changed scope: the seven A3 blocker prompts should be researched/decided in this context by GPT-5.5 with user input, presented as deep-interview questions.
- Desired outcome: Ask the seven A3 decisions one at a time via OMX structured questions, capture user choices, and crystallize an updated decision/spec artifact.
- Stated solution: Present the seven prompts as deep interview questions and let user respond.
- Probable intent hypothesis: Convert prior HITL/research prompt bundle into actionable architecture decisions, with GPT recommending defaults and user confirming/overriding.
- Known facts/evidence: Prior spec exists at `.omx/specs/deep-interview-a3-vital-signs-blocking-questions.md`; it contains seven prioritized A3 decision prompts with repo-lean notes.
- Constraints: Deep-interview only; use OMX structured question path; no direct implementation; preserve other agents' uncommitted code.
- Unknowns/open questions: Specific user decisions for oxygen context, alarms/artifacts, stream identity, cadence/staleness, early-warning scores, pi-sim ingest boundary, vital metric registry/shared metrics.
- Decision-boundary unknowns: Whether user accepts GPT/repo recommendations per question, and whether unresolved items should default to GPT recommendation.
- Likely touchpoints: `clinical-reference/phase-a/*.md`, `OPEN-SCHEMA-QUESTIONS.md`, `schemas/vitals.schema.json`, `src/views/currentState.ts`, `src/views/openLoops.ts`, pi-sim ingest boundary.
- Prompt-safe initial-context summary status: not_needed
