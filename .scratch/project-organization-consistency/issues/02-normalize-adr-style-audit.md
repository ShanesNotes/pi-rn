# Normalize ADR style audit

Status: needs-triage
Type: AFK

## Parent

`.scratch/project-organization-consistency/PRD.md`

## What to build

Audit `pi-chart`, `pi-monitor`, and `pi-sim` ADRs for filename convention, status spelling, date placement, supersedes/extends links, and cross-subproject references. Produce a minimal patch plan before changing any accepted decision text.

## Acceptance criteria

- [x] Every subproject ADR file is listed with filename, title, status line, date line, and relationship metadata when present.
- [x] Non-conforming ADR style is classified as cosmetic, routing-risk, or decision-risk.
- [x] Proposed edits do not change accepted decisions unless a HITL follow-up is created.
- [x] Old-path references such as `decisions/` or `ADR-000N` are classified before rewriting.
- [x] A follow-up issue exists for any ADR edit that could alter durable authority.

## Blocked by

- `.scratch/project-organization-consistency/issues/01-lock-work-surface-interface.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed audit in `.scratch/project-organization-consistency/adr-style-audit.md`. Inventory covers 22 ADR files across `pi-chart`, `pi-monitor`, and `pi-sim`; classifications distinguish cosmetic metadata style, routing-risk old path/provenance references, and decision-risk edits. Created HITL follow-up `.scratch/project-organization-consistency/issues/07-normalize-adr-style-follow-up.md` for normalization that could touch durable authority.
