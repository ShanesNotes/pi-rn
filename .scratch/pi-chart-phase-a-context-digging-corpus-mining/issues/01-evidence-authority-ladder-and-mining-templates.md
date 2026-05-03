# Evidence authority ladder and mining templates

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Create the reusable docs-only mining frame for this workstream: an explicit authority ladder, row templates, evidence-field definitions, reconciliation states, and boundary checks that every downstream mining issue must use. This slice should make the later AFK issues mechanically consistent and prevent any single evidence layer from becoming automatic authority.

## Acceptance criteria

- [x] A workstream mining template exists in this issue or a clearly named workstream artifact under `.scratch/pi-chart-phase-a-context-digging-corpus-mining/`.
- [x] The template requires each recommendation row to include: source artifact citation, brownfield code/test citation or `not-covered`, corpus citation or `not-covered`, reconciliation state, and v0.5 implication.
- [x] The authority ladder is explicit: accepted ADRs/source-authority map govern conflicts; Phase A artifacts express intended clinical/function direction; brownfield code/tests are implementation evidence only; patient corpus is fixture/scenario evidence only.
- [x] Reconciliation states are defined as `adopt`, `revise`, `defer`, `reject`, and `open-question`.
- [x] Boundary rules forbid source implementation, patient edits, hidden `pi-sim` coupling, vector/OpenBrain/backend commitment, EHR clone framing, patient migration, direct agent accepted-writes, and pi-ledger kernel expansion.
- [x] The template distinguishes canonical, derived, rendered, hot, warm, and cold context.
- [x] The issue closeout records which future issues must reuse this template.

## Blocked by

None - can start immediately.

## Closeout evidence

- Canonical workstream template: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md`.
- The template defines the required row fields, authority ladder, evidence-layer definitions, reconciliation states, hard boundary checks, context taxonomy, downstream closeout checklist, and mismatch-register discipline for downstream mining.
- Issues 02-14 must reuse `mining-template.md` without narrowing the field set or weakening the authority ladder.
- Issues 02-14 remain `needs-triage` until issue 01 is reviewed and the next fan-out lane is explicitly promoted.

### Downstream reuse list

- `02-phase-a-source-artifact-mining-map.md`
- `03-brownfield-implementation-crosswalk.md`
- `04-patient-001-005-corpus-atlas.md`
- `05-hot-current-state-substrate-pack.md`
- `06-trajectory-evidence-labs-diagnostics-substrate-pack.md`
- `07-orders-mar-medrec-io-lda-open-loop-substrate-pack.md`
- `08-notes-narrative-history-prior-encounters-handoff-substrate-pack.md`
- `09-review-attestation-authorship-lifecycle-accountability-substrate-pack.md`
- `10-rendered-chart-digging-and-prototype-design-evidence-pass.md`
- `11-hot-warm-cold-context-access-model.md`
- `12-three-layer-reconciliation-and-mismatch-register.md`
- `13-lean-dense-v0-5-substrate-recommendation.md`
- `14-closeout-verification-and-downstream-handoff.md`

### Verification

- Worker reported docs-template field checks passed.
- Leader validation passed: required fields present in `mining-template.md`, issue 01 acceptance checked, issues 02-14 remain `needs-triage`, and markdown diff has no whitespace errors.
- Source code, patient fixtures/corpus, accepted ADRs, lockfiles, design assets, `pi-ledger`, and `pi-sim` internals were not edited by this issue.
