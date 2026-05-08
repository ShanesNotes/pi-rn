# Care clustering and handoff carry-forward

Status: ready-for-human
Type: AFK
User stories covered: 49-58

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define care clustering and handoff carry-forward as derived projections over per-patient workflow items and canonical chart memory. Care clustering should group compatible tasks by patient, location, and time window while respecting urgency and incompatibilities. Handoff carry-forward should propose unresolved safety-critical tasks, blocked tasks, delayed relevant care, watch items, major changes, medication/order issues, pending labs/scans/consults, clinician-deferred items, and care-cluster suggestions.

The slice must preserve that clusters are advisory and that humans own final handoff content.

## Acceptance criteria

- [x] Defines care clustering as advisory grouping that does not alter underlying task source or authority.
- [x] Defines urgency and incompatibility checks for clustering.
- [x] Allows the nurse to accept, modify, or ignore a cluster.
- [x] Defines which unresolved items can carry into handoff/watch.
- [x] States that handoff carry-forward is derived/proposed content and final handoff is human-owned.
- [x] Uses supportive language and avoids punitive framing for delayed/deferred work.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/08-clinical-risk-prioritization-and-supportive-language.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/09-medication-timing-retiming-and-clustered-assessment.md`

## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/care-clustering-and-handoff-carry-forward.md`.
- Defined care clustering as an advisory derived projection over source-linked workflow items and canonical chart memory.
- Defined compatibility, urgency, and incompatibility checks so grouping cannot hide safety-critical work or alter task authority.
- Preserved nurse control to accept, modify, ignore, defer, block, bundle, or carry forward cluster suggestions.
- Defined handoff/watch carry-forward eligibility for unresolved safety-critical tasks, blocked tasks, delayed relevant care, watch items, major changes, medication/order issues, pending labs/scans/consults, clinician-deferred items, care-cluster suggestions, and report-only/source-needed items.
- Stated that handoff carry-forward is derived/proposed content and final handoff remains human-owned.
- Used supportive, nonpunitive language for delayed/deferred/blocked/bundled/carry-forward states.
- Excluded backend/storage/adapter/vector/runtime/access-plane work, hidden `pi-sim` coupling, and `pi-ledger` kernel expansion.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, advisory derived cluster posture, source/authority preservation, urgency/incompatibility checks, nurse control, handoff/watch eligibility, human-owned final handoff, supportive language, assistant limits, and scope exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers.
- AI slop cleanup pass — PASS: scoped to changed issue 12 docs; fallback-like scan found only intentional prohibited-word examples and clinical-term caveat; duplicate scan found no repeated prose; no cleanup edits required.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
