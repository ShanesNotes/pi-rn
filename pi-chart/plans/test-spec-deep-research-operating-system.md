# Test Spec - Deep Research Operating System

Status: staged verification plan, no implementation code.
PRD: `plans/prd-deep-research-operating-system.md`.

## Objective

Verify that the deep-research operating system creates a tracked, source-grounded
planning surface without implementation code or full automation.

## Acceptance Matrix

| Criterion | Evidence |
| --- | --- |
| Source map exists | `plans/deep-research-operating-system.md` has a source map table with path, tier, status, and role. |
| Authority hierarchy exists | The artifact ranks user instructions, code/tests, ADRs, docs, tracked plans, ignored memos, OMX context, and external outputs. |
| PRD/backlog table exists | The artifact maps Workstream A-D and future/deferred items to dispositions and gates. |
| Conflict register exists | The artifact has a flat Markdown conflict/status table, not a literal Kanban board requirement. |
| Prioritized hybrid mode exists | Backlog and conflict tables include priorities, and priority is distinguished from authority. |
| Priority tracks covered | The artifact names `phase-a`, `v03`, `adr17`, `boundary`, and `omx-promotion` and maps each to a next gate. |
| Priority tracks are provisional | The artifact states there is no final priority lock. |
| No full deep-all | The artifact limits the pass to bounded triage unless a track is approved for deep planning. |
| No speculative adapter | Boundary rows are future constraints only and do not start adapter design or implementation. |
| Agent no-code permissions captured | The artifact permits choosing depth, adding docs/plans, updating statuses, light source-doc edits, and recommending order. |
| Recommended order exists | The artifact orders `omx-promotion`, `adr17`, `v03`, `phase-a`, then `boundary`. |
| No-code honored | `git diff --name-only` for this pass contains only planning/docs paths, not `src/`, `schemas/`, `scripts/`, or patient fixture files. |
| Ignored sources handled | The artifact explicitly states `memos/` and `.omx/` are evidence unless promoted. |
| Human gate preserved | Conflicts and implementation lanes require human or plan-mode approval. |

## Manual Review Checks

1. Read `plans/deep-research-operating-system.md`.
2. Confirm the source map includes the original report, revised alignment,
   Workstream A material, FHIR/openEHR/adapter memos, actor-attestation memo,
   key ADRs, and core docs.
3. Confirm no row says to implement code now.
4. Confirm backlog and conflict rows have P0-P3 priority values.
5. Confirm the five priority tracks are represented.
6. Confirm the artifact says the priority set is provisional.
7. Confirm it does not require full deep analysis of all sources.
8. Confirm boundary/adapter work remains deferred and non-speculative.
9. Confirm no-code operating permissions are explicit.
10. Confirm recommended order is explicit.
11. Confirm conflicts are status-indexed with proposed resolution and next gate.
12. Confirm Workstream A is treated as a future execution lane, not started.

## Shell Verification

Use these checks when closing the planning pass:

```bash
git check-ignore -v plans/deep-research-operating-system.md \
  plans/prd-deep-research-operating-system.md \
  plans/test-spec-deep-research-operating-system.md

git status --short
```

Expected:

- `git check-ignore` prints nothing for the `plans/` files.
- `git status --short` may show the new `plans/` files.
- Any unrelated source/test changes are treated as pre-existing or separate
  work, not part of this planning pass.

No `npm test` is required for this docs-only pass.

## Deferred Verification

When the user later approves implementation:

- A Workstream A PRD/test-spec should be reconciled into tracked `plans/`.
- Implementation diffs should get their own test plan.
- Any FHIR/adapter/governance work should get separate PRD/test-spec artifacts.
