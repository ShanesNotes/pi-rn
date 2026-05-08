# Downstream adapter and boundary closeout

Status: needs-triage
Type: AFK
User stories covered: 7-9, 15-21, 69-73, 79-80

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Close out the lean v0.5 substrate + shift-brain strategy issue set by verifying boundaries, reconciliation states, and adapter readiness. The closeout should confirm that downstream issue outputs preserve canonical-versus-derived framing, clinician/in-chart-agent usefulness, nonpunitive workflow support, no hidden simulator coupling, no backend/vector/OpenBrain/storage/runtime/access-plane selection, no direct agent accepted-writes, no autonomous task completion, and no `pi-ledger` kernel expansion.

It should also identify which future adapter-safe PRDs/issues can be created only after chart substrate fields are explicit enough to map cleanly.

## Acceptance criteria

- [ ] Verifies each prior issue has `Status: needs-triage` or an updated triage state and references the parent PRD.
- [ ] Verifies each prior issue preserves clinician-reader and bounded in-chart assistant framing.
- [ ] Verifies no issue selects backend, vector, OpenBrain, storage, runtime, service, graph/index, semantic search, access-plane, or adapter architecture.
- [ ] Verifies no issue couples to hidden `pi-sim` internals or simulator oracle truth.
- [ ] Verifies no issue expands `pi-ledger` kernel scope; any ledger language remains future adapter-only.
- [ ] Verifies no issue authorizes direct agent accepted-writes or autonomous task completion.
- [ ] Lists future PRD/issue candidates that are safe only after substrate fields and workflow semantics are explicit.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/01-per-patient-shift-start-workflow-tracer.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/03-one-page-nursing-report-projection.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/04-shift-start-chart-digging-packet.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/05-bedside-verification-and-mismatch-prompts.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/07-human-agent-workflow-boundary.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/08-clinical-risk-prioritization-and-supportive-language.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/09-medication-timing-retiming-and-clustered-assessment.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/10-verbal-telephone-order-minimal-semantics.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/11-policy-order-set-cadence-derived-work.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/12-care-clustering-and-handoff-carry-forward.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/13-cold-history-retrieval-eligibility-boundary.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/14-rendered-prototype-report-visual-authority-boundary.md`
