# Audit ADR triggers after PRD lane decisions crystallize

Status: needs-triage
Type: HITL

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

After the downstream PRD lanes are drafted and triaged, audit whether any accepted decisions need immediate ADR promotion. The audit must distinguish durable, hard-to-reverse Interface or invariant decisions from ordinary implementation-depth issue work.

## Acceptance criteria

- [x] The audit lists each downstream lane and its current ADR trigger status.
- [x] The audit preserves `pi-sim` ADR 004 and `pi-monitor` ADR 003 as existing authority constraints rather than duplicating them.
- [x] The audit creates no ADR for speculative or still-untriaged work.
- [x] The audit defers any `pi-chart` chart-write or validation ADR until the rebase names stable ownership.
- [x] If an ADR is recommended, the audit names the owning subproject path, decision driver, rejected alternative, and verification evidence needed before creation.

## Blocked by

None for the audit artifact. Actual ADR creation remains blocked by downstream lane triage and, for `pi-chart`, post-rebase ownership.

## Comments

- 2026-05-03: Seeded from the RALPLAN decision that ADRs are outputs of clarified PRD decisions, not substitutes for PRD scoping.
- 2026-05-03: Completed by adding `.scratch/architecture-deepening-placement/adr-trigger-audit.md`. Conclusion: no immediate ADRs. Existing `pi-sim` ADR 004 and `pi-monitor` ADR 003 remain sufficient authority; downstream lanes are drafted but still `needs-triage`; `pi-chart` chart-write and validation ADRs remain deferred until the rebase names stable ownership.
