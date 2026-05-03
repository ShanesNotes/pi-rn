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

## Closeout / downstream reuse record

### Reusable artifact
- Created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md`
- Status: implemented and ready for immediate reuse by downstream issues.

### Required template re-use mapping
- Downstream issues 02-14 should reference this template for every recommendation row.
- Required row fields already mandated by this template:
  - source artifact citation
  - brownfield code/test citation or `not-covered`
  - corpus citation or `not-covered`
  - reconciliation state
  - v0.5 implication
- Required classification terms required by this template:
  - reconciliation state (`adopt|revise|defer|reject|open-question`)
  - context typing (`canonical|derived|rendered`)
  - access layer (`hot|warm|cold`)

### Boundary lock
- All downstream issue authors must keep existing workstream scope unchanged:
  - no source implementation edits
  - no patient fixture edits
  - no hidden `pi-sim` coupling
  - no vector/OpenBrain/backend commitment
  - no EHR-clone framing
  - no patient migration
  - no direct agent accepted-writes
  - no `pi-ledger` kernel expansion

### Status of issues 02-14
- Issues 02-14 remain unpromoted (`needs-triage`) pending completion of this template adoption and their own mined evidence.
