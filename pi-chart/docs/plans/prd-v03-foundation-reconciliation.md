# PRD — V03 foundation reconciliation

## Status

- Board card: `V03-001`
- Artifact depth: thin decision/backlog PRD.
- Scope: reconcile v0.3 foundation proposals against current accepted authority.
- Execution posture: docs-only decision surface; no product-code implementation.
- Authority rule: accepted ADRs are canonical; v0.3 memo content is evidence/proposal unless already promoted by accepted ADR.

## Source inputs

Canonical/current:

- `ROADMAP.md`
- `decisions/009-contradicts-link-and-resolves.md` — accepted 2026-04-22.
- `decisions/010-evidence-ref-roles.md` — accepted 2026-04-22.
- `decisions/011-transform-activity-provenance.md` — accepted 2026-04-22.
- `decisions/015-adr-009-011-implementation.md` — accepted implementation contract for ADRs 009/010/011.
- `decisions/016-broad-ehr-skeleton-clinical-memory.md` — accepted broad-EHR skeleton direction.

Evidence/proposal:

- `memos/pi-chart-v03-memo.md` — synthesis memo; proposals must be bucketed before use.
- `decisions/017-actor-attestation-review-taxonomy.md` — proposed only; pending operator review.
- `.omx/plans/prd-kanban-backlog-expansion.md` — planning input for this thin PRD.

## Problem

The v0.3 memo contains a mixed set of already-accepted substrate decisions, still-proposed governance ideas, deferred primitives, and explicit reject-list boundaries. Future agents need a small reconciliation surface so memo proposals do not silently become implementation scope and accepted ADRs are not re-litigated.

## Authority status to preserve

| Surface | Status | Treatment |
|---|---|---|
| `contradicts`, `resolves`, contested views | Accepted by ADR 009 and implemented under ADR 015 | Current foundation; do not reopen here. |
| Typed `EvidenceRef` roles | Accepted by ADR 010 and implemented under ADR 015 | Current foundation; reconcile only stale memo wording. |
| `transform` activity provenance | Accepted by ADR 011 and implemented under ADR 015 | Current foundation. |
| Broad EHR skeleton and hidden-sim boundary | Accepted by ADR 016 | Current roadmap driver. |
| Actor/review/attestation taxonomy | Proposed ADR 017 | Non-canonical until HITL/ADR acceptance. |
| Profiles registry, protocols, problem threads, ordersets | Memo proposals / deferred roadmap items | Backlog candidates; need separate ADR or PRD before implementation. |
| FHIR/openEHR internals | Explicitly rejected as internal model by memo/roadmap | Boundary-adapter-only future work. |

## Decision output required

The reconciliation lane must classify each v0.3 memo section into one bucket:

1. **Accepted/current** — covered by accepted ADRs or shipped roadmap state.
2. **Stale/superseded** — memo wording was overtaken by accepted ADR implementation details.
3. **Deferred/backlog** — valid future topic, not current implementation scope.
4. **Needs ADR/HITL** — policy or primitive decision cannot be accepted by implication.
5. **Rejected/out of scope** — conflicts with explicit boundary/reject-list constraints.

## Decision options

| Option | Approach | Use when | Consequence |
|---|---|---|---|
| A. Reconcile memo into buckets only | Produce classification table and follow-up backlog links. | Default for this card. | Fast, prevents scope leak, no implementation. |
| B. Promote one deferred item into ADR drafting | Select exactly one bucketed item, e.g. ADR17 revision. | HITL chooses a decision branch. | Creates a new ADR/planning lane; still no code. |
| C. Treat memo as implementation spec | Implement unaccepted v0.3 proposals directly. | Never without separate approval. | Rejected because it violates authority ordering. |

## HITL gate

Before any deferred/proposed item becomes implementation work, the operator must choose one of:

- accept/revise/reject proposed ADR 017;
- draft a new ADR for a specific profile/protocol/problem-thread/orderset item;
- leave the item deferred and continue Phase A / broad-EHR skeleton execution.

No agent may use the v0.3 memo alone as authorization for schema, validator, profile-registry, attestation, protocol, or adapter implementation.

## Acceptance criteria

1. Reconciliation output names every source input above and preserves its authority status.
2. Accepted ADR 009/010/011/015/016 decisions are treated as canonical and not downgraded to proposals.
3. Proposed ADR 017 is labeled proposed/non-canonical everywhere it influences future work.
4. The lane identifies any v0.3 memo tension that can block Phase A or ADR17 work.
5. Deferred items are explicit and cannot be mistaken for current implementation scope.
6. No product roots (`src`, `schemas`, `patients`, `scripts`) are changed by this decision lane.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-v03-foundation-reconciliation.md').read_text()
spec = Path('docs/plans/test-spec-v03-foundation-reconciliation.md').read_text()
required = [
  'memos/pi-chart-v03-memo.md', 'ROADMAP.md',
  'decisions/009-contradicts-link-and-resolves.md',
  'decisions/010-evidence-ref-roles.md',
  'decisions/011-transform-activity-provenance.md',
  'decisions/015-adr-009-011-implementation.md',
  'decisions/016-broad-ehr-skeleton-clinical-memory.md',
  'decisions/017-actor-attestation-review-taxonomy.md',
  'proposed/non-canonical', 'HITL', 'Deferred',
]
missing = [item for item in required if item not in prd + '\n' + spec]
if missing:
    print('Missing required V03 reconciliation terms:')
    print('\n'.join(missing))
    raise SystemExit(1)
PY
git diff --name-only -- src schemas patients scripts
```

Pass condition: the Python check exits zero and the product-root diff command prints no new paths from this lane.

## Explicit deferrals

- No profile registry implementation.
- No actor/review/attestation implementation until ADR17 or successor is accepted.
- No protocol, orderset, longitudinal problem-thread, hash/identity, invalidation-cache, incident-snapshot, or context-bundle implementation.
- No FHIR/openEHR internal-model work; boundary adapters remain future work.
- No ROADMAP or kanban board edit in this lane.
