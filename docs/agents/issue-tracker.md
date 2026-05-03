# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## PRD shape

When a skill says "publish a PRD", write `.scratch/<feature-slug>/PRD.md` using the Matt `$to-prd` sections unless a domain-specific PRD already has a stricter template:

1. Problem Statement
2. Solution
3. User Stories
4. Implementation Decisions
5. Testing Decisions
6. Out of Scope
7. Further Notes

PRDs may link to `.omx`, `memos/`, or `docs/plans/` as evidence, but the `.scratch` PRD is the active work surface.

## Issue shape

When a skill says "publish issues", write each file under `.scratch/<feature-slug>/issues/` using the Matt `$to-issues` vertical-slice shape:

1. Parent
2. What to build
3. Acceptance criteria
4. Blocked by

Prefer tracer bullets: a thin vertical slice that is independently verifiable, not a horizontal layer-only task.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## What not to use as the active issue tracker

Do not use root `PLANNING.md`, subproject `docs/plans/`, `.omx/plans/`, or chat transcript text as the active issue tracker. Promote from those surfaces into `.scratch/<feature-slug>/` first.
