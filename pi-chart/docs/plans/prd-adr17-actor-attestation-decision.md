Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.

# PRD — ADR17 actor attestation decision

## Source inputs

Primary:

- `decisions/017-actor-attestation-review-taxonomy.md`
- `memos/Actor-attestation-taxonomy.md`

Supporting:

- `.omx/plans/workstream-a-memory-proof-acceptance-report.md`
- `.omx/plans/prd-kanban-backlog-expansion.md` Consensus review addendum

## Authority and proposal status

- Board card: `ADR17-001`.
- Scope: thin decision/backlog PRD only.
- Authority: existing accepted ADRs and implemented Workstream A behavior remain canonical.
- Proposal status: ADR 017 is proposed, pending operator/HITL review.
- Constraint: no schema, validator, projection, write-path, or policy implementation may treat ADR 017 as accepted until HITL/ADR approval.
- Ownership note: this lane provides the PRD/test-spec pair only; the integration/verifier lane owns `docs/plans/kanban-prd-board.md` updates.

## Problem

Workstream A proved chart-visible clinical memory without hidden simulator coupling and explicitly deferred actor/attestation/review policy. ADR 017 and its source memo propose a governance model for human review, rejection, and attestation of agent-authored or reviewed claims. The project now needs a small decision surface that lets a human choose whether and how to promote that proposal before any implementation lane changes product behavior.

## Decision options

| Option | Meaning | When to choose |
|---|---|---|
| Accept | Promote ADR 017 as the governing policy for later implementation. | HITL agrees with append-only governance events, derived review state, and proposed validation direction. |
| Revise | Keep ADR 017 active but require edits before acceptance. | Core direction is right, but terms, validation rules, or projection semantics need correction. |
| Split | Separate actor classification, review events, and professional attestation into multiple ADRs/cards. | The policy is too broad to approve or implement safely as one decision. |
| Defer | Keep ADR 017 non-canonical and revisit after more fixture/projection evidence. | Workstream A evidence is enough to identify the gap but not enough to choose policy. |
| Reject | Close ADR 017 and preserve current accepted behavior. | The proposed taxonomy conflicts with desired governance, clinical semantics, or implementation boundaries. |

## Current recommendation for review

Present ADR 017 to HITL as a **proposal to revise or split unless the operator explicitly accepts the full taxonomy**. The durable proposal has coherent principles: append-only governance events, no mutable `review_status` on target claims, review state computed by backlinks/projections, and explicit rejection as an auditable event. The memo is narrower in one important way: it recommends no JSON schema change now and favors using existing `action` review conventions until fixture evidence justifies a profile-backed implementation.

## Intended board row snippet

Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. `ADR17-001` — decide whether to accept, revise, split, defer, or reject ADR 017 actor/attestation/review taxonomy before any implementation lane changes schema, validation, projection, write behavior, or policy. Sources: `decisions/017-actor-attestation-review-taxonomy.md`, `memos/Actor-attestation-taxonomy.md`, `.omx/plans/workstream-a-memory-proof-acceptance-report.md`. Owned artifacts: `docs/plans/prd-adr17-actor-attestation-decision.md`, `docs/plans/test-spec-adr17-actor-attestation-decision.md`. Next gate: HITL/ADR approval.

## HITL gate

Before implementation, a human reviewer must record one option: accept, revise, split, defer, or reject. If the decision is accept or revise, the reviewer must also answer:

1. Is `action.claim_review.v1` accepted now, or only a provisional convention?
2. Is `communication.attestation.v1` accepted now, split into a later ADR, or deferred?
3. Should projection expose review state before dedicated validation rules exist?
4. Which source is binding when ADR 017 and the memo differ: the ADR text, the memo's no-schema-change recommendation, or a new revised ADR?

## Acceptance criteria

1. The PRD begins with the proposed/non-canonical status warning.
2. Source inputs and authority boundaries are explicit.
3. The decision options include accept, revise, split, defer, and reject.
4. The intended board row snippet also begins with the proposed/non-canonical status warning.
5. The HITL gate blocks product-code, schema, validator, view, projection, or write-path implementation until approval.
6. Explicit deferrals are listed so future agents do not accidentally implement proposed policy.
7. Verification can be run with a structural command and does not require product tests.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-adr17-actor-attestation-decision.md').read_text()
spec = Path('docs/plans/test-spec-adr17-actor-attestation-decision.md').read_text()
required = [
    'Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.',
    'decisions/017-actor-attestation-review-taxonomy.md',
    'memos/Actor-attestation-taxonomy.md',
    'accept, revise, split, defer, or reject',
    'HITL gate',
    'Explicit deferrals',
]
missing = [item for item in required if item not in prd]
if not prd.startswith(required[0]):
    missing.append('PRD first-line status')
if 'Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. `ADR17-001`' not in prd:
    missing.append('board row status snippet')
if 'no product-root changes' not in spec:
    missing.append('test spec product-root guard')
if missing:
    print('Missing:', missing)
    raise SystemExit(1)
PY
```

## Explicit deferrals

- Implementing `action.claim_review.v1`.
- Implementing `communication.attestation.v1`.
- Adding top-level `attestation`, `review_status`, or `attested_by` fields.
- Adding validator rules `V-REVIEW-*` or `V-ATTEST-*`.
- Adding projection fields such as `review_state`, `review_chain`, `authorship_class`, or `accountable_actor`.
- Enforcing cosign, countersign, witness, scribe, rejection, or review gates in write paths.
- Mapping the policy to FHIR, openEHR, legal signature, retention, redaction, archive, or UI workflows.
