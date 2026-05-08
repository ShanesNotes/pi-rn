# Care clustering and handoff carry-forward

Status: needs-triage
Type: AFK
User stories covered: 49-58

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define care clustering and handoff carry-forward as derived projections over per-patient workflow items and canonical chart memory. Care clustering should group compatible tasks by patient, location, and time window while respecting urgency and incompatibilities. Handoff carry-forward should propose unresolved safety-critical tasks, blocked tasks, delayed relevant care, watch items, major changes, medication/order issues, pending labs/scans/consults, clinician-deferred items, and care-cluster suggestions.

The slice must preserve that clusters are advisory and that humans own final handoff content.

## Acceptance criteria

- [ ] Defines care clustering as advisory grouping that does not alter underlying task source or authority.
- [ ] Defines urgency and incompatibility checks for clustering.
- [ ] Allows the nurse to accept, modify, or ignore a cluster.
- [ ] Defines which unresolved items can carry into handoff/watch.
- [ ] States that handoff carry-forward is derived/proposed content and final handoff is human-owned.
- [ ] Uses supportive language and avoids punitive framing for delayed/deferred work.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/08-clinical-risk-prioritization-and-supportive-language.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/09-medication-timing-retiming-and-clustered-assessment.md`
