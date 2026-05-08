# Cold-history retrieval eligibility boundary

Status: ready-for-human
Type: AFK
User stories covered: 12-13, 71

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define how cold history, prior encounters, H&P, old consults, discharge summaries, and longitudinal narrative/background context can be source-linked and citation-ready without choosing vector, semantic search, OpenBrain, backend, storage, service, runtime, or access-plane architecture.

The slice should support the incoming nurse's need to skim why the patient is here and understand relevant background while preserving that cold history is not hot current-care truth until explicitly promoted or linked through canonical chart memory.

## Acceptance criteria

- [x] Defines cold-history categories relevant to shift-start chart digging.
- [x] Defines source-linked citation expectations for cold history.
- [x] Explains when cold context can become warm supporting evidence or hot current-care truth through explicit promotion or current relevance.
- [x] Supports clinician-facing plain-language summaries with source links.
- [x] Supports in-chart-agent reasoning over cold history without making retrieval output canonical truth.
- [x] Explicitly avoids backend/vector/OpenBrain/retrieval architecture selection.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/04-shift-start-chart-digging-packet.md`

## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/cold-history-retrieval-eligibility-boundary.md`.
- Defined cold-history categories for shift-start chart digging, including H&P, prior encounters, old consults, discharge summaries, longitudinal narrative/background, baseline/social context, prior procedures/devices, allergies/constraints, and external/report-only context.
- Defined source-linked citation expectations for source type, author/provenance, encounter/date/time, addressable note/ref, lifecycle/review state, source age, uncertainty, and hot/warm/cold posture.
- Defined cold → warm supporting evidence and cold → hot current-care truth boundaries through explicit promotion, current relevance, or sanctioned chart actions.
- Supported clinician-facing plain-language summaries that keep source links, source age, and caveats visible.
- Allowed bounded in-chart-agent reasoning over cold history while keeping retrieval output derived/provisional rather than canonical chart truth.
- Explicitly avoided backend, storage, vector, semantic search, OpenBrain, retrieval service, runtime, access-plane, adapter, hidden `pi-sim`, and `pi-ledger` kernel scope.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, cold-history categories, citation expectations, hot/warm/cold promotion behavior, explicit promotion boundary, plain-language summaries, agent reasoning boundary, retrieval-eligibility non-selection, and scope exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers.
- AI slop cleanup pass — PASS: scoped to changed issue 13 docs; fallback/boundary scan found only intentional architecture-exclusion and canonical-truth boundary language; duplicate scan found no repeated prose; no cleanup edits required.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
