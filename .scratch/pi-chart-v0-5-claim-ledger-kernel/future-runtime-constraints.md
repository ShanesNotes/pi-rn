# V0.5 future-runtime constraints for the claim-ledger kernel

Status: active pre-coding constraint surface for `.scratch/pi-chart-v0-5-claim-ledger-kernel/`.

## Purpose

The V0.5 claim-ledger kernel is clean-canvas, but it must not be near-sighted. This document mines all five archived research packages for long-horizon compatibility constraints that the Phase 1 kernel must not violate.

These constraints do not expand Phase 1 scope. They prevent foundational code from blocking later ContextPacket, access-plane, runtime, and orchestrator work.

## Source anchors

Archived research packages are evidence only and must be cited with `pkg-NNN:<path>` labels. Any `decisions/` segment in a `pkg-NNN:` citation is a package-internal path, not an accepted repo ADR under `pi-chart/docs/adr/`.

- `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` — claim, predicate, bitemporal ledger substrate.
- `pkg-019:decisions/019-context-engineering.md` — TaskFrame, ContextPacket, context receipt/replay substrate.
- `pkg-022:decisions/022-pi-chart-access-plane.md` — read/index/MCP/capture/access-plane substrate.
- `pkg-023:decisions/023-pi-agent-runtime-shape.md` — bounded pi-agent runtime, proposals, sandbox grants.
- `pkg-024:decisions/024-pi-orchestrator.md` — worklist/playbook/lease/attempt/reasoning-bundle orchestration.
- `pi-chart/memos/package-archive-adoption-map-20260503.md` — repo-visible adoption/defer/reject map.

## Kernel constraints that must hold from day one

| Constraint | Future package pressure | Phase 1 implication | Deferred scope |
| --- | --- | --- | --- |
| Stable claim identity uses both `id` and content `hash`. | `pkg-019` packets, `pkg-022` indexes/tools, and `pkg-024` work items cite claims by id+hash. | K0/K2 must make deterministic content hash reusable as a reference proof, not the only identifier. | ContextPacket replay, indexes, worklists. |
| Hashes must be deterministic across runtime layers. | Packets, access indexes, behavior bindings, and reasoning bundles need repeatable hash checks. | Canonicalization must be property-order invariant, value-sensitive, and self-field excluding. | Embedding/versioned render hashes, packet hashes, bundle hashes. |
| Ledger append order must expose stable sequence and accepted time. | Access freshness, `knownAt`, work reconciliation, and audit need ledger position. | K3 must preserve monotonic `seq` and accepted-time metadata without choosing a production backend. | Batch APIs, access-plane freshness metadata, production storage. |
| Valid time and known time must remain distinct. | `pkg-019` compile/replay and `pkg-022` query tools must avoid future-knowledge leakage. | K5 must support point-query `validAt`/`knownAt`. | Range queries, context replay drift reports, watch triggers. |
| Claim references must be usable without raw filesystem access. | Runtime, MCP, and orchestrator must not mount raw chart ledger paths. | Public kernel outputs should expose referenceable ids/hashes/seqs rather than file paths as identity. | MCP gateway, role-scoped tools, reasoning-bundle path policy. |
| Predicate validation is the ontology seam. | Access/runtimes/playbooks rely on predicates but must not define ontology themselves. | K4 must provide minimal registry hooks and reject unknown predicate/shape mismatch. | Predicate tiers, playbook policy checks, capture routing. |
| Agent and orchestrator outputs are proposals, not direct clinical truth. | `pkg-022`, `pkg-023`, and `pkg-024` reject generic `append_claim`, auto-accept, orchestrator-authored clinical claims, and transcript/session-as-memory behavior. | Phase 1 must not bake in `agentAppendClaim`, direct orchestrator append, raw chart filesystem mutation, or runtime transcript as patient memory. Preserve actor/provenance hooks for later attribution. | Capture artifacts, proposal review, work attempts, reconciliation. |
| Derived surfaces are rebuildable and non-authoritative. | Access indexes, ContextPackets, runtime bundles, and scheduler state are derived/audit surfaces. | Kernel API should make canonical record/hash/ledger data sufficient for later rebuilds. | Index plane, packet artifact persistence, scheduler recovery. |
| Patient isolation is non-negotiable. | Future runtime/context/orchestrator work must never mix patient context. | Synthetic fixtures and APIs must keep patient identity explicit even before production storage exists. | Multi-patient access policy, PHI/deployment controls. |
| Monitor telemetry becomes chart truth only through **Observable charting seam**. | Future pi-sim/pi-monitor adapters should mimic real monitor-to-EHR flowsheet workflows without giving pi-agent hidden foresight. | Kernel must distinguish accepted/charted claim time from raw observable telemetry source time and avoid hidden simulator dependencies. | Telemetry ingest adapter, flowsheet validation UI/workflow, live monitor integration. |
| FHIR and external EHR formats remain boundary concerns. | Future import/export/interoperability work should map to kernel truth without redefining it. | K0-K6 must not encode FHIR resources, FHIR ids, FHIR server/search assumptions, or adapter-specific serialization into core claim identity/hash behavior. | FHIR adapter/export/import PRD, mapping tests, deployment interoperability. |
| Kernel is import/export-neutral and provenance-rich. | Future adapters and curated patient-case testing need source/actor/time hooks without source-specific core assumptions. | Do not encode old importer layouts, historical source labels, or `patient_001`-`patient_005` structure into Phase 1 identity/hash/storage behavior. | External EHR import/export PRDs, FHIR mapping, curated patient-case salvage/testing. |
| Kernel is broad-EHR-capable but context-curation-agnostic. | Broad EHR skeleton and `pkg-019` ContextPacket work need many clinical surfaces to be selectable later. | Claim shape/predicate/time/provenance/stable refs must support varied clinical content without hardcoded Orders/MAR/Labs/Nursing/Handoff modules. | ContextPacket curation, task profiles, safety floors, EHR fixture mining, surface-specific PRDs. |
| Kernel exposes hooks, not evidence/review policies. | ADR 009-011, ADR 017, access/runtime/review-plane work need provenance and stable refs, but not hardcoded kernel subsystems. | Phase 1 preserves actor/provenance/time and stable references while avoiding mutable review status, attestation fields, contradiction/resolution subsystems, or transform graphs. | Evidence roles, contradiction/resolution predicates, transform provenance, review/attestation projections. |

## Explicit non-goals for Phase 1

Do not implement these while satisfying the constraints above:

- ContextPacket, TaskFrame, context receipt, replay, or compression.
- MCP gateway, access index, semantic search, capture router, proposal/review queue, or tool audit.
- Pi-agent runtime sessions, behavior hashing, sandbox grants, or typed output pipeline.
- Orchestrator worklists, playbooks, work leases, work attempts, reasoning bundles, reconciliation, or cancellation.
- Production database/service/backend choice, PHI retention/redaction policy, external provider policy, or hosted deployment.
- Direct agent/orchestrator append channels or auto-accept behavior.

## K0+K2 pre-coding check

The first canonical-hash slice must answer:

1. Does the hash work as future `(id, hash)` reference proof?
2. Is the canonicalization deterministic enough for ContextPacket/access/runtime/orchestrator layers to recompute?
3. Does it avoid binding identity to current filesystem or `EventEnvelope` structure?
4. Does it leave packet hashes, index hashes, behavior hashes, and reasoning-bundle hashes as later separate concerns?

## Package usage rule

Archived research package fragments may be used as cited reference designs where relevant. Adapt only the minimum needed for the current issue. Do not wholesale copy/import package artifacts, issue lists, ADR statuses, or broad type graphs as implementation authority.
