# Evidence authority ladder and mining templates

Status: ready-for-agent
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

## Reusable mining template (workstream artifact)

### Canonical row template (copy per recommendation)

| Field | Required | Definition |
| --- | --- | --- |
| `recommendation_id` | required | Short unique identifier (e.g., `v0p5-<family>-<slug>`). |
| `substrate_family` | required | Parent family from PRD (`vitals`, `orders`, `notes`, etc.). |
| `recommendation` | required | What is being recommended for v0.5. |
| `source_artifact_citation` | required | Path to Phase A source artifact(s) and clause(s). |
| `brownfield_citation` | required | Code/test path(s) plus behavior evidence, or explicit `not-covered`. |
| `corpus_citation` | required | Patient fixture/corpus path(s) and scenario coverage, or explicit `not-covered`. |
| `reconciliation_state` | required | One of `adopt`, `revise`, `defer`, `reject`, `open-question`. |
| `v0.5_implication` | required | Why this recommendation is/should be in v0.5 and expected effect. |
| `context_class` | required | `canonical` / `derived` / `rendered` / combination for each assertion. |
| `access_class` | required | `hot` / `warm` / `cold` classification and rationale. |
| `boundary_check` | required | Explicit pass/fail against boundary rules (see below). |
| `notes` | optional | Caveats, assumptions, unresolved questions. |

### Authority ladder

1. **Accepted ADRs / source-authority map** (highest authority): resolve conflicts.
2. **Phase A planning artifacts**: intended clinical/function direction, scope, and primitive intent.
3. **Brownfield code/tests**: implementation evidence only; do not become architecture authority.
4. **Patient corpus**: fixture/scenario behavior evidence only.

If two layers conflict, mark `reconciliation_state=open-question` and route to mismatch register unless a boundary-validated exception is explicitly documented.

### Boundary checks (hard stops)

- Do not require source implementation in this lane.
- Do not edit patient fixtures/corpus.
- Do not depend on hidden `pi-sim` internals/oracle truth.
- Do not commit vector/OpenBrain/backend choices.
- Do not frame work as full EHR-clone reconstruction.
- Do not define patient-migration behavior.
- Do not add direct agent accepted-writes.
- Do not add new `pi-ledger` kernel requirements.

### Closeout evidence: downstream template reuse

- Issues that must use this template unchanged (same field set and authority ladder):  
  `02-phase-a-source-artifact-mining-map.md`,  
  `03-brownfield-implementation-crosswalk.md`,  
  `04-patient-001-005-corpus-atlas.md`,  
  `05-hot-current-state-substrate-pack.md`,  
  `06-trajectory-evidence-labs-diagnostics-substrate-pack.md`,  
  `07-orders-mar-medrec-io-lda-open-loop-substrate-pack.md`,  
  `08-notes-narrative-history-prior-encounters-handoff-substrate-pack.md`,  
  `09-review-attestation-authorship-lifecycle-accountability-substrate-pack.md`,  
  `10-rendered-chart-digging-and-prototype-design-evidence-pass.md`,  
  `11-hot-warm-cold-context-access-model.md`,  
  `12-three-layer-reconciliation-and-mismatch-register.md`,  
  `13-lean-dense-v0-5-substrate-recommendation.md`,  
  `14-closeout-verification-and-downstream-handoff.md`.

### Example row

| recommendation_id | substrate_family | recommendation | source_artifact_citation | brownfield_citation | corpus_citation | reconciliation_state | v0.5_implication | context_class | access_class | boundary_check | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| v0p5-problem-list-001 | problem_list | Preserve active problem list as canonical care memory with source-of-truth provenance. | `pi-chart/clinical-reference/phase-a/A0a-....md` | `pi-chart/.../problem-list.test.ts` | `patient_001/.../encounter.md` | revise | Keep clinically stable framing while narrowing scope. | canonical; derived snapshots for projections | hot | Pass: no source impl/sim/kernel/external commitments | Treat contested problems as derived evidence only until attestation aligns. |
