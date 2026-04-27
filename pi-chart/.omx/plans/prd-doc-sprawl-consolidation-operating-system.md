# PRD — Document-sprawl consolidation operating system

## Status

- Workflow: `$ralplan` consensus plan
- Source spec: `.omx/specs/deep-interview-doc-sprawl-to-executable-prds.md`
- Scope: planning/consolidation artifacts only
- Execution posture: do not change product code in this PRD

## Requirements summary

pi-chart has several overlapping planning layers: roadmap, ADRs, Phase A clinical-reference briefs, large research/proposal memos, existing `.omx/plans` PRD/test-spec artifacts, `.omx/context` snapshots, `.omx/specs`, and wiki-derived summaries. The user wants these consolidated into an executable planning system that can later feed PRDs, thin tracer-bullet implementation slices, TDD execution, and HITL QA.

This PRD defines the first consolidation deliverable: an approval-grade planning artifact set containing a source map, authority hierarchy, PRD backlog table, and conflict register. It explicitly does not implement product code or fully automate execution.

## Brownfield evidence

- `ROADMAP.md:25` identifies current broad-EHR focus; `ROADMAP.md:42` and `ROADMAP.md:51` split clinical-depth research and synthetic-patient build tracks.
- `ROADMAP.md:69` calls out unresolved seams that block agent integration.
- `clinical-reference/phase-a/PHASE-A-CHARTER.md:16` defines Phase A purpose; `clinical-reference/phase-a/PHASE-A-CHARTER.md:268` defines acceptance criteria; `clinical-reference/phase-a/PHASE-A-CHARTER.md:298` defines hard scope limits.
- `clinical-reference/phase-a/PHASE-A-EXECUTION.md:41` defines Phase A batches; `clinical-reference/phase-a/PHASE-A-EXECUTION.md:118` defines the mandatory calibration stop; `clinical-reference/phase-a/PHASE-A-EXECUTION.md:284` defines deliverables.
- `memos/pi-chart-v03-memo.md:13` states the v0.3 organizing claim; `memos/pi-chart-v03-memo.md:851` lists reject/do-not-implement items; `memos/pi-chart-v03-memo.md:876` sequences v0.3 implementation tiers.
- `memos/Workstream A PRD test.md:451` defines acceptance tests; `memos/Workstream A PRD test.md:604` states do-not-build-yet constraints; `memos/Workstream A PRD test.md:623` sketches an implementation plan.
- `memos/deep-research-alignment-revised-2026-04-25.md:31` contains a source artifact register; `memos/deep-research-alignment-revised-2026-04-25.md:62` defines updated workstreams; `memos/deep-research-alignment-revised-2026-04-25.md:265` defines implementation sequence; `memos/deep-research-alignment-revised-2026-04-25.md:360` lists do-not-build-yet items.
- `.omx/plans/` already contains PRD/test-spec pairs for ADR 015 phases, foundation hardening, memory-proof, review remediation, and reviewed-issues integrity planning.

## RALPLAN-DR summary

### Principles

1. **Authority before execution:** define which document layer wins before agents derive implementation work.
2. **Planning artifacts are executable contracts:** every proposed PRD candidate must include source inputs, acceptance checks, dependencies, and open questions.
3. **Non-destructive consolidation:** classify, map, and propose archive/merge candidates without deleting or materially rewriting source docs.
4. **HITL at phase and QA gates:** agents may prepare decisions, but the user approves phase order and execution closure.
5. **TDD-ready slices later:** tracer bullets must be narrow enough to receive failing tests first, but detailed implementation belongs to the next phase.

### Decision drivers

1. **Reduce ambiguity from overlapping sources** without losing ADR/Phase A/research intent.
2. **Create agent-consumable planning contracts** that can later feed `$ralph`, `$team`, or `$ultraqa`.
3. **Avoid adding another vague meta-doc** by requiring concrete tables, registers, and verification checks.

### Viable options

#### Option A — Source-map-first consolidation

Approach: create the source map, authority hierarchy, PRD backlog, and conflict register as one bounded consolidation artifact set before drafting detailed slice cards.

Pros:
- Best matches the deep-interview acceptance criteria.
- Reduces conflict risk before execution planning.
- Easy to verify without touching product code.

Cons:
- Defers detailed tracer-bullet execution cards until after user review.
- May feel slower than jumping into Workstream A implementation.

#### Option B — PRD-backlog-first consolidation

Approach: group all docs into PRD candidates immediately, then backfill authority hierarchy and conflicts only where needed.

Pros:
- Produces implementation-looking outputs faster.
- Helps reveal duplicates through workstream grouping.

Cons:
- Risks encoding stale or conflicting sources into PRDs.
- Weakens the user's stated desire for confidence in source consolidation.

#### Option C — Tracer-bullet-first consolidation

Approach: select the highest-priority apparent workstream and generate TDD slice cards now.

Pros:
- Fastest path toward implementation agents.
- Concrete and motivating.

Cons:
- Violates the first-pass acceptance criteria if source map/hierarchy/conflicts remain unresolved.
- Higher chance of rework from hidden ADR/Phase A/memo conflicts.

### Recommendation

Choose **Option A: Source-map-first consolidation**. It is the only option that directly satisfies the approved first-pass acceptance criteria while preserving later PRD and tracer-bullet execution.

## Product output

Create two planning artifacts in `.omx/plans/`:

1. `prd-doc-sprawl-consolidation-operating-system.md` — this PRD and final consensus plan.
2. `test-spec-doc-sprawl-consolidation-operating-system.md` — verification contract for the later consolidation work.

The later execution phase should create a separate consolidation artifact, tentatively:

- `.omx/plans/doc-sprawl-source-map.md`

That artifact should be a **minimum viable source map**, not a new narrative memo. It should contain compact tables for:

1. Source map.
2. Authority hierarchy.
3. PRD backlog.
4. Conflict register.
5. Archive/merge/rewrite candidate list.
6. First-pass tracer-bullet planning notes only where they clarify PRD shape.

### Generated-artifact inventory rule

Generated consolidation artifacts must not create self-referential inventory churn. The later source map should either:

- include `.omx/plans/doc-sprawl-source-map.md` as one `generated-self` row, or
- list it in an explicit exclusions section with rationale: `generated by this pass; not an upstream source`.

Transient `.omx` logs, indexes, and runtime state files should be excluded unless they carry decision-bearing planning content. Exclusions must be explicit, not silent.

## In scope

- Inventory and categorize planning/research documents under:
  - `ROADMAP.md`
  - `decisions/`
  - `clinical-reference/phase-a/`
  - `memos/`
  - `.omx/plans/`
  - `.omx/context/`
  - `.omx/specs/`
  - `wiki/`
  - `.omx/wiki/`
- Define authority/status categories.
- Define conflict-resolution hierarchy.
- Group candidate PRDs/workstreams.
- Capture conflicts, duplicates, stale inputs, and unresolved decisions.
- Propose archive/merge/rewrite candidates without performing moves/deletes.
- Prepare later TDD tracer-bullet slicing rules.

## Out of scope

- Product-code changes under `src/`, `patients/`, schema files, or test suites.
- Deleting, moving, or rewriting source documents.
- Final prioritization or phase order without user review.
- Launching implementation agents.
- Importing external skill repos.

## Authority hierarchy

Use this default hierarchy for the later consolidation artifact unless a conflict register item recommends HITL override:

1. **Direct user instruction in current workflow** — highest authority for current planning pass.
2. **Accepted ADRs in `decisions/`** — canonical architecture and governance policy only when the ADR status is explicitly accepted.
3. **Phase A charter/execution/template docs** — canonical Phase A research workflow and scope controls.
4. **Roadmap** — macro sequencing and deferred/future scope.
5. **Recent decision/research memos** — evidence and proposals, authoritative only after reconciled with ADRs and Phase A controls.
6. **Existing `.omx/plans` PRD/test-spec pairs** — executable planning history; authoritative for their completed/approved slice, not global policy.
7. **`.omx/context`, `.omx/specs`, `wiki/`, `.omx/wiki`** — derived memory and traceability layers; useful evidence but lower authority than source docs.

### ADR status rule

Only `decisions/*.md` files with explicit accepted status count as accepted ADR policy. The status check must parse either `Status: accepted` or `**Status:** accepted`, with optional parenthetical dates/details. `Status: proposed`, draft, missing status, memo-proposed ADRs, absent ADR numbers, and v0.3 memo sections that describe future ADRs must be classified as `proposal`, `research-evidence`, or `stale-or-superseded` until backed by accepted decision status or later HITL approval. Current known example: `decisions/017-actor-attestation-review-taxonomy.md` is present under `decisions/` but has `Status: proposed`, so it is not accepted policy yet.

### Required worked example

The later consolidation artifact must include one worked hierarchy example using this real tension:

- `memos/deep-research-alignment-revised-2026-04-25.md` and `memos/Workstream A PRD test.md` push Workstream A toward immediate build momentum.
- `.omx/specs/deep-interview-doc-sprawl-to-executable-prds.md` requires a source-map-first gate before implementation.

Expected disposition: Workstream A may be marked the likely first PRD candidate, but not final execution priority until the source map, conflict register, and HITL review are complete.

## Source status taxonomy

Use these statuses in the source map:

- `source-of-truth` — accepted policy or canonical process.
- `phase-contract` — authoritative for a specific phase or batch.
- `execution-plan` — PRD/test/spec slice intended for implementation.
- `research-evidence` — memo or report that informs decisions.
- `proposal` — not accepted yet; needs ADR/PRD conversion or rejection.
- `derived-summary` — wiki/context/summary derived from other docs.
- `stale-or-superseded` — candidate for archive/merge after HITL review.
- `open-question` — unresolved issue requiring HITL or further research.

## Candidate PRD backlog seed

| Candidate PRD | Primary source inputs | Intended outcome | Acceptance criteria | Dependencies | Open questions | Proposed next gate |
|---|---|---|---|---|---|---|
| Document-sprawl source map | Deep-interview spec, `ROADMAP.md`, `decisions/`, Phase A docs, `memos/`, `.omx/plans`, wiki/context | Produce minimum viable source map, authority hierarchy, conflict register, and PRD backlog | All target files mapped or excluded; hierarchy applied to Workstream A tension; conflict register complete | This PRD/test-spec | Exact final path and whether to include `.omx/wiki` session logs | HITL approval of consolidation artifact shape |
| Phase A completion-to-implementation bridge | Phase A charter/execution, A0a-A7 syntheses, open-schema questions | Convert Phase A briefs into approved implementation PRDs/tracer bullets | Phase A docs grouped by artifact/batch; open-schema blockers listed; tracer-bullet candidates have test proof and QA gate | Source map and conflict register | Whether almost-done A8/9a/9b land before bridge work starts | HITL decision on Phase A completion boundary |
| Workstream A memory-proof execution | `memos/Workstream A PRD test.md`, deep-research alignment, accepted ADR 016, proposed ADR 017, existing memory-proof PRD/test spec | Create TDD implementation plan for memory-proof broad-EHR slice | Existing memo tests reconciled with current PRD/test-spec; proposed ADR 017 actor/attestation assumptions marked non-canonical until accepted; implementation slices identify failing tests first | Source hierarchy and PRD conflict review | Whether existing `.omx/plans/prd-memory-proof-six-surface-broad-ehr.md` supersedes memo sections; whether ADR 017 is accepted before execution | HITL selection as first tracer-bullet workstream |
| v0.3 foundation reconciliation | `memos/pi-chart-v03-memo.md`, ADR 009/010/011/015/017, roadmap | Decide what v0.3 memo content is accepted, deferred, or rejected | Accepted ADR-backed items separated from memo-only proposals; missing ADR numbers marked proposal/stale | ADR source hierarchy | Which proposed ADR 008/012/013/014 content is obsolete or still pending | HITL review of v0.3 disposition table |
| Adapter/boundary future workstream | FHIR boundary memo, adapter synthesis, openEHR cycle decision memo, roadmap seams | Defer or shape external-boundary work without polluting immediate chart core | Boundary docs classified as future/deferred unless tied to Workstream A acceptance | Current source map | What minimum adapter skeleton is allowed after Workstream A | HITL defer/plan decision after Workstream A |

## Implementation plan for later execution phase

1. **Inventory pass**
   - Enumerate all target docs and record path, title, layer, status, owning source type, last-known purpose, and referenced workstream.
   - Include known untracked Phase A files in the map without mutating them.

2. **Authority pass**
   - Apply the hierarchy above to classify source-of-truth vs evidence/proposal/derived layers.
   - For each conflict candidate, state which source currently wins and why.

3. **Backlog pass**
   - Cluster docs into PRD candidates with source inputs, intended outcome, acceptance criteria, dependencies, and open questions.
   - Keep priorities as proposed, not final.

4. **Conflict-register pass**
   - Capture stale, duplicate, contradicted, superseded, and unresolved items.
   - Mark items requiring HITL decisions.

5. **Tracer-bullet readiness pass**
   - For each PRD candidate, add only enough vertical-slice notes to show it can become TDD work later: test proof, touched layers, and QA gate.
   - Do not write implementation cards that imply approval to execute.

6. **Review package pass**
   - Produce a compact user-facing approval summary: what is canonical, what is proposed, what is blocked, and what should be planned next.

## Acceptance criteria

1. The later consolidation artifact lists every known file from the target roots or explicitly excludes it with rationale.
2. Every mapped file has a status from the source status taxonomy.
3. The authority hierarchy is included and used in at least one worked conflict/disposition example.
4. The PRD backlog table includes source inputs, outcome, acceptance criteria, dependencies, and open questions for each candidate.
5. The conflict register includes severity, affected sources, proposed disposition, and HITL-required flag.
6. Archive/merge/rewrite candidates are proposals only; no files are deleted or moved.
7. A non-implementation proof confirms only `.omx/plans/`, `.omx/context/`, `.omx/specs/`, `wiki/`, or docs explicitly approved for planning artifacts changed.
8. The output identifies the next recommended HITL review question before any `$ralph` or `$team` execution.

## Verification steps

- Run `git status --short` before and after the later consolidation work to prove no product-code mutations.
- Run `find`/scripted inventory against target roots and compare against the source map count.
- Validate every source-map row has non-empty `path`, `title`, `layer`, `status`, `purpose`, `disposition`, `source-of-truth relationship`, and `related PRD candidate` fields.
- Validate every PRD backlog row has `source inputs`, `outcome`, `acceptance criteria`, `dependencies`, and `open questions`.
- Validate every conflict-register row has `severity`, `sources`, `conflict`, `proposed disposition`, and `HITL required`.
- Manually spot-check high-authority docs: `decisions/`, Phase A charter/execution, roadmap, v03 memo, and deep-research alignment memo.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The consolidation artifact becomes another sprawling document | Use tables with required columns and acceptance checks; split only if a table becomes unreadable. |
| Existing untracked Phase A work is accidentally overwritten | Treat current working tree as user-owned; read only unless later explicitly authorized. |
| Memos are mistaken for accepted policy | Apply the authority hierarchy; memos default to evidence/proposal unless backed by accepted ADR/PRD. |
| PRD candidates imply execution approval | Mark priorities as proposed and require HITL review before `$ralph`/`$team`. |
| Derived wiki/context entries conflict with source docs | Treat derived layers as evidence, not canonical policy. |

## ADR — choose source-map-first consolidation

### Decision

Use a source-map-first consolidation pass before writing detailed implementation slice cards or launching agents.

### Drivers

- The user asked for confidence before agent execution.
- The repo contains overlapping source, derived, and proposal layers.
- The deep-interview acceptance checks prioritize source map, authority hierarchy, PRD backlog, and conflict register.

### Alternatives considered

- **PRD-backlog-first:** faster to implementation, rejected as too likely to encode unresolved conflicts.
- **Tracer-bullet-first:** most concrete, rejected because it bypasses source authority and conflict review.
- **Full doc rewrite:** rejected because it is high-churn, destructive, and outside first-pass scope.

### Why chosen

Source-map-first is the narrowest non-destructive path that produces actionable planning outputs and preserves HITL approval before execution.

### Consequences

- Implementation starts later, but with less rework.
- Some attractive PRD/tracer-bullet work remains proposed until user review.
- The first execution phase is documentation/planning-heavy, but evidence-backed and testable.

### Follow-ups

- After user approval, execute the consolidation artifact generation.
- Then run `$ralplan` or `$team` on the approved PRD backlog subset.
- Use `$ultraqa`/verifier lanes after implementation slices to check evidence and QA closure.

## Available-agent-types roster

- `explore` — fast repo inventory and source mapping.
- `planner` — PRD grouping, phase sequencing, acceptance criteria.
- `architect` — authority hierarchy, boundary integrity, option tradeoffs.
- `critic` — consistency, risk, and testability review.
- `test-engineer` — TDD slice and verification design.
- `writer` — final artifact polish and user-facing approval package.
- `verifier` — evidence checks and non-implementation proof.
- `code-reviewer` / `quality-reviewer` — later implementation review, not needed for this planning-only pass.

## Follow-up staffing guidance appendix

This section is an execution appendix required by `$ralplan`; it is not part of the core consolidation artifact. The next artifact should keep staffing notes brief unless the user approves execution.

### `$ralph` sequential path

Use when the user wants one persistent owner to generate the consolidation artifact and iterate until acceptance checks pass.

Suggested staffing:

- Leader/Ralph: owns full artifact and verification loop, reasoning high.
- `explore`: inventory target roots, reasoning low.
- `planner`: PRD backlog grouping, reasoning medium.
- `critic` or `verifier`: final acceptance check, reasoning high.

Suggested launch:

```bash
$ralph .omx/plans/prd-doc-sprawl-consolidation-operating-system.md
```

### `$team` parallel path

Use when the user wants faster parallel inventory across document layers.

Suggested lanes:

1. ADR/source-policy lane: `explore` + `architect`, reasoning medium/high.
2. Phase A lane: `explore` + `planner`, reasoning medium.
3. Memos/research lane: `explore` + `planner`, reasoning medium.
4. Existing `.omx`/wiki lane: `explore` + `verifier`, reasoning low/medium.
5. Integration lane: `planner` + `writer`, reasoning medium.
6. QA lane: `critic` + `verifier`, reasoning high.

Suggested launch hints:

```bash
$team .omx/plans/prd-doc-sprawl-consolidation-operating-system.md
# or
omx team --prompt "Generate the document-sprawl source map, authority hierarchy, PRD backlog, and conflict register from .omx/plans/prd-doc-sprawl-consolidation-operating-system.md"
```

## Team verification path

Before shutdown, team must prove:

- Inventory counts match target roots.
- Every target file is mapped or explicitly excluded.
- Authority hierarchy is applied to conflicts.
- PRD backlog has required columns.
- Conflict register has required columns.
- Git status shows no product-code changes.

After team completion, use Ralph/verifier for:

- Final evidence chain review.
- User-facing approval summary.
- Proposed next HITL question: which PRD candidate enters tracer-bullet TDD planning first?

## Consensus changelog

- Initial `$ralplan` draft created from deep-interview spec and repo inventory.
- Architect ITERATE fixes applied: backlog seed table now includes acceptance criteria and proposed next gate; generated-artifact inventory rule added; ADR status handling clarified; Workstream A tension added as required worked example; staffing guidance marked as appendix.
- Critic ITERATE fixes applied: ADR authority now requires explicit accepted status, `decisions/017-actor-attestation-review-taxonomy.md` is treated as proposed, and PRD/test-spec row-field requirements are aligned.
