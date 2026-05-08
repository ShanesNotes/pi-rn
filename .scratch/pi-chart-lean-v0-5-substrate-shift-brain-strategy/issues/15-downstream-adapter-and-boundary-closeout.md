# Downstream adapter and boundary closeout

Status: ready-for-human
Type: AFK
User stories covered: 7-9, 15-21, 69-73, 79-80

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Close out the lean v0.5 substrate + shift-brain strategy issue set by verifying boundaries, reconciliation states, and adapter readiness. The closeout should confirm that downstream issue outputs preserve canonical-versus-derived framing, clinician/in-chart-agent usefulness, nonpunitive workflow support, no hidden simulator coupling, no backend/vector/OpenBrain/storage/runtime/access-plane selection, no direct agent accepted-writes, no autonomous task completion, and no `pi-ledger` kernel expansion.

It should also identify which future adapter-safe PRDs/issues can be created only after chart substrate fields are explicit enough to map cleanly.

## Acceptance criteria

- [x] Verifies each prior issue has `Status: ready-for-human` or an updated triage state and references the parent PRD.
- [x] Verifies each prior issue preserves clinician-reader and bounded in-chart assistant framing.
- [x] Verifies no issue selects backend, vector, OpenBrain, storage, runtime, service, graph/index, semantic search, access-plane, or adapter architecture.
- [x] Verifies no issue couples to hidden `pi-sim` internals or simulator oracle truth.
- [x] Verifies no issue expands `pi-ledger` kernel scope; any ledger language remains future adapter-only.
- [x] Verifies no issue authorizes direct agent accepted-writes or autonomous task completion.
- [x] Lists future PRD/issue candidates that are safe only after substrate fields and workflow semantics are explicit.

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

## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/downstream-adapter-and-boundary-closeout.md`.
- Verified issues 01-14 have updated triage states and parent PRD linkage.
- Verified clinician-reader and bounded in-chart-assistant framing across source-linked trust, mismatch prompts, provisional suggestions, human-owned charting/completion/handoff, supportive language, and per-patient-first workflow.
- Verified no issue selects backend, vector, OpenBrain, storage, runtime, service, graph/index, semantic search, access-plane, or adapter architecture.
- Verified hidden `pi-sim` internals/oracle truth, `pi-ledger` kernel expansion, direct agent accepted-writes, and autonomous task completion remain excluded.
- Added future PRD/issue candidates with explicit preconditions: substrate field/interface PRD, projection behavior tests, bounded assistant tests, report/shift-brain UI PRD, policy/order-set research, medication workflow implementation, cold-history citation/retrieval eligibility, `pi-chart` to `pi-ledger` adapter PRD, assignment-level nurse brain, and downstream adapter ADR.
- Preserved that future adapter work is conditional and not authorized by this closeout.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, all prior issue rows, status/parent linkage, clinician-reader and bounded-assistant framing, architecture non-selection, hidden simulator exclusion, future-only ledger boundary, no direct accepted-writes/autonomous completion, reconciliation posture, future candidates, adapter readiness conditions, and scope exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers; architect verified prior issue status/parent linkage, closeout matrix, boundary checklist, complete issue 15 checklist, conditional future candidates, and diff hygiene.
- AI slop cleanup pass — PASS: scoped to changed issue 15 docs; boundary scan found only intentional non-authorizing adapter/architecture exclusion language; duplicate scan found no repeated prose; no cleanup edits required.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
