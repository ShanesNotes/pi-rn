# ADR 021 — Pi-chart client boundary for clinical-truth service

Date: 2026-05-31
Status: accepted
Decision maker: human grill-with-docs session under maintainer direction.
Related:
- `020-claim-ledger-kernel-owned-by-pi-ledger.md`
- `018-architecture-rebase-clinical-truth-substrate.md`
- `../../../pi-ledger/docs/adr/009-clinical-truth-service.md`
- `../../../.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `../../../.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `../../../.scratch/pi-rn-reentry-audit-28052026/GRILL-WITH-DOCS-HUMAN-DECISIONS.md`

## Context

Pi-RN must be available from many clinical entry points: chart views, task lists, specialty workflows, background agent queues, and other clinician surfaces. Those entry points need a shared patient truth stream without becoming independent truth owners.

`pi-ledger` owns the canonical ledger kernel. `pi-chart` owns clinician-facing workflow, projection, session, and adapter behavior.

## Decision

`pi-chart` consumes the `pi-ledger` clinical-truth service as an app/backend client.

The accepted access boundary is:

```text
clinical entry points -> Pi-RN/pi-chart app/backend -> private internal clinical-truth service
```

Browser, EHR, task-list, and specialty-workflow entry points do not call the ledger service directly. The app/backend mediates auth, session, workflow, suggestion/promotion, and projection concerns, then calls the private/internal service over the selected first transport: local/private gRPC over Unix-domain socket.

For a given patient, many clinicians and agents may submit concurrently through the backend, but the service assigns one authoritative patient-scoped append order.

## Rejected

- Giving each UI/workflow entry point a local truth copy.
- Letting browsers, EHR plugins, or external workflow tools call the ledger service directly.
- Treating the clinical-truth service as a public/external clinical API.
- Reimplementing ledger canonicalization or admission in `pi-chart`.

## Consequences

- `pi-chart` remains the clinician-facing projection and workflow layer.
- `pi-chart` adapter work should target the versioned service contract and conformance fixtures, not private `ledger-core` internals.
- Human-agent suggestion and promotion boundaries remain upstream of accepted ledger writes.
- Backend framework, full access-plane policy, retrieval/vector/OpenBrain choices, and implementation details remain separate future decisions.
