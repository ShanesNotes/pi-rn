# PRD — BND-001 Adapter Boundary Future Work

## Status and source inputs

- Card: BND-001.
- Artifact depth: thin deferred-boundary PRD; not an adapter build plan.
- Current status: deferred / future work.
- Planning authority: `.omx/plans/prd-kanban-backlog-expansion.md`, especially the Consensus review addendum thin-PRD guardrail.
- Source inputs:
  - `memos/definitive-fhir-boundary-pi-chart.md`
  - `memos/pi-chart-boundary-adapter-definitive-synthesis.md`
  - `memos/pi-chart-openEHR-cycle-decision-synthesis.md`
  - `ROADMAP.md`
  - `.omx/plans/workstream-a-memory-proof-acceptance-report.md`

## Authority / proposal status

Accepted project constraints for this card:

- FHIR is a read/export boundary, never pi-chart's internal ontology, storage model, view model, or write API.
- The chart remains canonical; external projections are transient, deterministic exports.
- openEHR contributes transaction/audit semantics at the Git commit boundary only; openEHR archetypes and COMPOSITION semantics are rejected as internal model.
- Workstream A has accepted the memory-proof seam and explicitly deferred fingerprint/export, FHIR/Medplum/HealthChain/SMART/CDS Hooks adapters, read-path audit, legal export, UI rendering, and proposed ADR17 policy.

Proposal-only / non-authoritative items:

- Any concrete adapter API shape, TypeScript module layout, file ownership, public signature, test file list, or documentation tree from the adapter synthesis memo.
- Any external conformance target beyond the already named FHIR R4 / 4.0.1 first-boundary research direction.
- Any generated cycle manifest or export packet until a concrete replay/export/audit consumer exists.

## Boundary summary

The boundary direction is visible but deliberately not executable yet:

- Candidate FHIR semantic boundary: `Composition`, `Observation`, `ServiceRequest`, `DocumentReference`, and `Provenance` for a future Workstream A memory-proof export.
- Infrastructure-only resources: `Bundle` and minimal synthetic `Patient` anchor.
- Operational companion only: `AuditEvent`, outside the canonical clinical projection/fingerprint unless a later decision scopes it.
- Internal model guardrail: no FHIR resources, openEHR archetypes, adapter runtime, server/search API, auth platform, workflow engine, CDS Hooks listener, or agent runtime inside chart core.

## Deferral / readiness decision options

A HITL reviewer must choose one of these before any implementation card exists:

1. **Keep deferred** — default. Boundary remains documented future work while Phase A / chart-core work proceeds.
2. **Promote to research spike** — allowed only to answer unresolved profile/canonicalization questions without product code.
3. **Promote to adapter PRD** — allowed only after a concrete consumer exists and Workstream A export/fingerprint semantics are stable enough to define acceptance tests.
4. **Split by boundary type** — separate FHIR export, openEHR transaction metadata, audit/fingerprint, and UI/CDS surfaces if one area becomes ready before the others.
5. **Reject / supersede** — close BND-001 if a later accepted ADR chooses a different external-boundary strategy.

## HITL gate

Before any adapter implementation or product-root ownership is assigned, HITL must confirm:

- Which consumer needs the boundary: pi-agent container handoff, external EHR export, replay/audit packet, clinical UI, regulator/data partner, or another named consumer.
- Whether the boundary is export-only, import-capable, or bidirectional; export-only remains the default.
- Whether FHIR R4 document Bundle remains the first external representation.
- Whether fingerprint scope includes the Bundle, memory-proof JSON, Markdown projection, AuditEvent, or only selected canonical fields.
- That no hidden simulator state may cross the boundary.

## Acceptance criteria

This deferred-boundary PRD is complete when:

1. Source inputs and their authority/proposal status are explicit.
2. Boundary work is visible without becoming immediate implementation scope.
3. Future readiness is tied to named prerequisites and a HITL decision, not vague integration interest.
4. FHIR/openEHR remain external-boundary concepts and do not pollute chart-core Phase A execution.
5. The PRD contains no adapter build plan, no product-code ownership, and no implementation file list.
6. Explicit deferrals preserve Workstream A's current focus and acceptance report.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-adapter-boundary-future-work.md')
test = Path('docs/plans/test-spec-adapter-boundary-future-work.md')
text = prd.read_text()
required = [
  'memos/definitive-fhir-boundary-pi-chart.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/pi-chart-openEHR-cycle-decision-synthesis.md',
  'ROADMAP.md',
  '.omx/plans/workstream-a-memory-proof-acceptance-report.md',
  'Authority / proposal status',
  'Deferral / readiness decision options',
  'HITL gate',
  'Explicit deferrals',
]
missing = [s for s in required if s not in text]
if missing:
    print('Missing:', missing)
    raise SystemExit(1)
if not test.exists():
    print('Missing paired test spec')
    raise SystemExit(1)
if len(text.splitlines()) > 200:
    print('PRD too long')
    raise SystemExit(1)
PY
```

## Explicit deferrals

- Adapter implementation, module layout, public API signatures, and product-root file ownership.
- FHIR import, write-back, public FHIR API, search, history, `_revinclude`, subscriptions, SMART/OAuth, CDS Hooks, GraphQL, Bulk Data, and platform auth.
- Pharmacy/MAR, Task, CarePlan, DiagnosticReport grouping, Encounter/ADT, scheduling, billing, claims, and production EHR workflows.
- openEHR archetypes, internal COMPOSITION object model, authoritative cycle manifests, and schema changes for transaction metadata.
- Fingerprint/export contract until payload scope, timestamp rules, and downstream verification semantics are selected.
- Proposed ADR17 actor/attestation/review policy until HITL/ADR approval.
