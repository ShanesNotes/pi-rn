# Cold-history retrieval eligibility boundary

Status: needs-triage
Type: AFK
User stories covered: 12-13, 71

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define how cold history, prior encounters, H&P, old consults, discharge summaries, and longitudinal narrative/background context can be source-linked and citation-ready without choosing vector, semantic search, OpenBrain, backend, storage, service, runtime, or access-plane architecture.

The slice should support the incoming nurse's need to skim why the patient is here and understand relevant background while preserving that cold history is not hot current-care truth until explicitly promoted or linked through canonical chart memory.

## Acceptance criteria

- [ ] Defines cold-history categories relevant to shift-start chart digging.
- [ ] Defines source-linked citation expectations for cold history.
- [ ] Explains when cold context can become warm supporting evidence or hot current-care truth through explicit promotion or current relevance.
- [ ] Supports clinician-facing plain-language summaries with source links.
- [ ] Supports in-chart-agent reasoning over cold history without making retrieval output canonical truth.
- [ ] Explicitly avoids backend/vector/OpenBrain/retrieval architecture selection.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/04-shift-start-chart-digging-packet.md`
