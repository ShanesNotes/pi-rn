# Audit ADR triggers after PRD lane decisions crystallize

Status: needs-triage
Type: HITL

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

After the downstream PRD lanes are drafted and triaged, audit whether any accepted decisions need immediate ADR promotion. The audit must distinguish durable, hard-to-reverse Interface or invariant decisions from ordinary implementation-depth issue work.

## Acceptance criteria

- [ ] The audit lists each downstream lane and its current ADR trigger status.
- [ ] The audit preserves `pi-sim` ADR 004 and `pi-monitor` ADR 003 as existing authority constraints rather than duplicating them.
- [ ] The audit creates no ADR for speculative or still-untriaged work.
- [ ] The audit defers any `pi-chart` chart-write or validation ADR until the rebase names stable ownership.
- [ ] If an ADR is recommended, the audit names the owning subproject path, decision driver, rejected alternative, and verification evidence needed before creation.

## Blocked by

- Drafting and triage of the downstream PRD lanes.
- Post-rebase `pi-chart` ownership for chart-write or validation ADRs.

## Comments

- 2026-05-03: Seeded from the RALPLAN decision that ADRs are outputs of clarified PRD decisions, not substitutes for PRD scoping.
