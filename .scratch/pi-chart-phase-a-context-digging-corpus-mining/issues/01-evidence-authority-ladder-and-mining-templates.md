# Evidence authority ladder and mining templates

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Create the reusable docs-only mining frame for this workstream: an explicit authority ladder, row templates, evidence-field definitions, reconciliation states, and boundary checks that every downstream mining issue must use. This slice should make the later AFK issues mechanically consistent and prevent any single evidence layer from becoming automatic authority.

## Acceptance criteria

- [ ] A workstream mining template exists in this issue or a clearly named workstream artifact under `.scratch/pi-chart-phase-a-context-digging-corpus-mining/`.
- [ ] The template requires each recommendation row to include: source artifact citation, brownfield code/test citation or `not-covered`, corpus citation or `not-covered`, reconciliation state, and v0.5 implication.
- [ ] The authority ladder is explicit: accepted ADRs/source-authority map govern conflicts; Phase A artifacts express intended clinical/function direction; brownfield code/tests are implementation evidence only; patient corpus is fixture/scenario evidence only.
- [ ] Reconciliation states are defined as `adopt`, `revise`, `defer`, `reject`, and `open-question`.
- [ ] Boundary rules forbid source implementation, patient edits, hidden `pi-sim` coupling, vector/OpenBrain/backend commitment, EHR clone framing, patient migration, direct agent accepted-writes, and pi-ledger kernel expansion.
- [ ] The template distinguishes canonical, derived, rendered, hot, warm, and cold context.
- [ ] The issue closeout records which future issues must reuse this template.

## Blocked by

None - can start immediately.
