# Test Spec — Document-sprawl consolidation operating system

## Scope

Verification contract for the planning-only consolidation pass defined in `.omx/plans/prd-doc-sprawl-consolidation-operating-system.md`.

## Test strategy

This is a docs/planning artifact, so tests are structural, evidence-based, and non-implementation-focused. The later consolidation artifact should be validated by scripted inventory checks plus manual spot-checks against high-authority sources.

## Required fixtures / inputs

- `.omx/specs/deep-interview-doc-sprawl-to-executable-prds.md`
- `ROADMAP.md`
- `decisions/*.md`
- `clinical-reference/phase-a/*.md`
- `memos/*.md`
- `.omx/plans/*.md`
- `.omx/context/*.md`
- `.omx/specs/**/*.md`
- `wiki/**/*.md`
- `.omx/wiki/*.md` where present

## Acceptance tests

### 1. `sourceMap_coversTargetRoots`

**Given** the target roots listed in the PRD
**When** the consolidation artifact source map is generated
**Then** every Markdown/JSON planning source is either present in the source map or listed in an explicit exclusions section with rationale.

Verification:

```bash
find ROADMAP.md decisions clinical-reference/phase-a memos .omx/plans .omx/context .omx/specs wiki .omx/wiki \
  -type f \( -name '*.md' -o -name '*.json' \) | sort
```

Compare the command output with source-map rows plus exclusions. Generated artifacts such as `.omx/plans/doc-sprawl-source-map.md` must either appear as a single `generated-self` row or be listed in explicit exclusions with rationale. Transient `.omx` logs/index/runtime files may be excluded only when they are not decision-bearing.

### 2. `sourceMap_rowsHaveRequiredColumns`

Every source-map row must include:

- path
- title
- layer
- status
- purpose
- disposition
- source-of-truth relationship
- related PRD candidate or `none`

### 3. `authorityHierarchy_isExplicitAndApplied`

The artifact must include the authority hierarchy and at least one worked example showing how it resolves a conflict or overlap among source layers. The required worked example is Workstream A build momentum from the research memos versus the deep-interview source-map-first gate.

Minimum hierarchy to verify:

1. current user/workflow instruction
2. accepted ADRs
3. Phase A charter/execution/template
4. roadmap
5. recent memos/research proposals
6. existing `.omx/plans`
7. derived context/wiki layers

Also verify the ADR status rule: only `decisions/*.md` files with explicit `Status: accepted` or `**Status:** accepted` count as accepted ADRs. `Status: proposed`, draft, missing status, memo-proposed ADRs, and absent ADR numbers remain proposals until accepted by later decision. `decisions/017-actor-attestation-review-taxonomy.md` is a known proposed ADR and must not be treated as accepted policy unless its status changes.

### 4. `prdBacklog_hasExecutableFields`

Every PRD backlog row must include:

- candidate PRD name
- source inputs
- intended outcome
- acceptance criteria
- dependencies
- open questions
- proposed next gate

### 5. `conflictRegister_capturesHitlReviewNeeds`

Every conflict-register row must include:

- severity: `low`, `medium`, `high`
- affected source paths
- conflict/overlap summary
- proposed disposition
- HITL required: `yes` or `no`
- rationale

### 6. `archiveCandidates_areNonDestructive`

Archive/merge/rewrite candidate rows must be proposals only. Verification passes only if no source document was deleted, moved, or materially rewritten during the pass.

### 7. `nonImplementationProof_hasCleanBoundary`

Run:

```bash
git status --short
```

Pass condition: changed files are limited to planning/consolidation artifacts or pre-existing unrelated user changes. No `src/`, `patients/`, schema, or test implementation files may be modified by this pass.

### 8. `hitlNextQuestion_isPresent`

The artifact must end with one concrete HITL review question, such as:

> Which PRD candidate should enter tracer-bullet TDD planning first?

## Manual spot-checks

Spot-check at least these sources against the source map and conflict register:

- `ROADMAP.md`
- `clinical-reference/phase-a/PHASE-A-CHARTER.md`
- `clinical-reference/phase-a/PHASE-A-EXECUTION.md`
- `memos/pi-chart-v03-memo.md`
- `memos/deep-research-alignment-revised-2026-04-25.md`
- `memos/Workstream A PRD test.md`
- `decisions/002-status-lifecycle.md`
- `decisions/015-adr-009-011-implementation.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`
- `decisions/017-actor-attestation-review-taxonomy.md` (known proposed status)

## Failure handling

- Missing source rows: rerun inventory and add rows or exclusions.
- Self-referential generated artifact ambiguity: add a `generated-self` row or explicit exclusion rationale.
- Missing required columns: revise table schema before review.
- Unresolved authority conflict: add conflict-register row and mark HITL required.
- Product-code change detected: stop; revert or isolate change before proceeding.
- Vague PRD candidate: add acceptance criteria, dependencies, and open questions before approval.

## Verification command checklist

```bash
# 1. Inventory target roots
find ROADMAP.md decisions clinical-reference/phase-a memos .omx/plans .omx/context .omx/specs wiki .omx/wiki \
  -type f \( -name '*.md' -o -name '*.json' \) | sort

# 2. Check working-tree boundary
git status --short

# 3. Search for required sections in final artifact
grep -nE 'Source map|Authority hierarchy|PRD backlog|Conflict register|HITL' .omx/plans/doc-sprawl-source-map.md
```
