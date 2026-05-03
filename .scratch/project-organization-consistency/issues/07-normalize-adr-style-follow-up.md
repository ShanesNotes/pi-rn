# Normalize ADR style and provenance references

Status: needs-triage
Type: HITL

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Use `.scratch/project-organization-consistency/adr-style-audit.md` to normalize ADR metadata/style after maintainer review. Keep the edit set limited to style, parser reliability, and provenance clarity unless a human explicitly approves durable authority changes.

## Acceptance criteria

- [ ] Plain `Status:` and `Date:` metadata is added or normalized where the audit classifies missing or legacy bullet metadata.
- [ ] `ADR-000N` title/reference spellings are normalized only when the existing `NNN-*.md` filename already owns the durable number.
- [ ] `.omx/plans` references are preserved as provenance/history and are not rewritten into active work queues.
- [ ] No accepted decision meaning, supersedes/extends relationship, producer/consumer authority, or implementation posture changes without a separate human-approved decision issue.
- [ ] A focused grep after edits finds no stale ADR path spelling that can misroute a fresh agent.

## Blocked by

- `.scratch/project-organization-consistency/issues/02-normalize-adr-style-audit.md`
