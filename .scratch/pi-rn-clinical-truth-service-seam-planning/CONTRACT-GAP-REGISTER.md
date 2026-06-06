# Contract inventory and gap register

Date: 2026-05-31
Ultragoal story: `G002-contract-inventory-and-gap-register`

## Purpose

Crosswalk the `pi-chart` per-patient charted-clinical-fact field contract against the safe `pi-ledger` kernel interface and the accepted clinical-truth-service/client boundary before any source/runtime seam work.

This is a planning artifact, not an implementation authorization.

## Authority baseline

- `pi-ledger/docs/adr/008-kernel-public-interface-inventory-before-adapters.md` says adapters must target intentional safe consumer paths, not scattered Rust exports or fixture helpers.
- `pi-ledger/docs/ledger-core-public-interface.md` defines the current safe lifecycle: `validate_claim` -> `AppendAdmissibleClaim::admit` -> optional `RevisionAdmissibleClaim::admit` -> `AppendLedger` append -> trusted-entry `point_read`.
- `pi-ledger/docs/adr/009-clinical-truth-service.md` accepts a private/internal service around `ledger-core`, private/local gRPC over UDS as first transport, and per-patient append-only WAL/log as first storage posture.
- `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md` accepts the access path: clinical entry points -> Pi-RN/pi-chart app/backend -> private internal clinical-truth service.
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` and issues 01-15 define the charted-clinical-fact field contract to be mapped.

## Kernel safe paths inventory

| Need | Safe kernel/service path | Adapter implication |
| --- | --- | --- |
| Canonical Claim bytes | `canonical::canonical_json`, `canonical::canonical_json_from_str` | Contract must expose canonicalization result or hash result from Rust authority; `pi-chart` must not clone canonicalization. |
| Record hash | `canonical::record_hash`, `hash::RecordHash` | Service must provide/return Record hash for accepted entries and correction-target proofs. |
| Entry/head hash | `hash::EntryHash`, `AppendLedger` entry/head metadata | Store/service owns append-chain identity; client may inspect but not assign. |
| Canonical time | `time::CanonicalTimestamp`, `time::ValidTimeExpression` | Adapter must normalize before submission or receive explicit canonical-time validation errors. |
| Claim validation | `claim::validate_claim`, `ValidatedClaim` accessors | Service contract should validate raw Claim-like request payloads before admission. |
| Predicate policy | `PredicateRegistry::load`, `validate_validated_claim` | Production registry loading/versioning is a hard open gate. |
| Base append admission | `AppendAdmissibleClaim::admit` | Service owns target-ledger patient-scope/predicate admission before append. |
| Correction admission | `RevisionAdmissibleClaim::admit` | Service must recheck target id + Record hash against current same-patient ledger at append time. |
| Append order | `AppendLedger::{append_admissible, append_revision_admissible}` | Service assigns `accepted_at`, `seq`, `batch_id`, Record hash, Entry hash, prev link, and head. |
| Point read | `query::point_read` | Service can expose bitemporal point-read views over trusted entries, not raw client-side replay as authority. |
| Snapshot/rebuild | `AppendLedger::{snapshot, from_snapshot, validate}` | Storage plan must define trusted replay/rebuild and corruption behavior without rerunning mutable predicate policy by accident. |

## Issue-by-issue crosswalk

| Issue | Chart field-contract concern | Kernel/service mapping | Gap status for seam planning |
| --- | --- | --- | --- |
| 01 identity/scope | `id`, `subject.patientId`, `encounterId`, no hardcoded patient | Claim `id`; Claim `subject.patientId`; predicate object `encounterId`; ledger patient id admission | Needs contract fields for target ledger patient id vs Claim subject; cross-encounter declaration remains open. |
| 02 factShape collapse | Resolve chart types into kernel shapes; communication/report/note handling; artifact refs as evidence | Claim `shape`; predicate declared shape must match | Mostly decision-resolved; service contract should reject shape mismatch and never coerce report mentions into observations. |
| 03 predicateId registry | Deterministic predicate id and production registry | `PredicateRegistry` policy before append admission | Hard gate: production registry ownership, loading, versioning, and distribution across service deploys. |
| 04 typed object | Required object fields per predicate, no magic `data` authority | Claim `object`; predicate `RequiredFields` validation | Needs typed object contract and error vocabulary for missing/invalid fields; status_detail/coding/differential details remain planning gaps. |
| 05 bitemporal time | `time.valid` instant XOR interval; `time.recorded_at`; canonical UTC | `CanonicalTimestamp`, `ValidTimeExpression`; store-assigned known time | Needs adapter normalization policy and negative vectors for offsets/fractions/caller-supplied accepted metadata. |
| 06 source/authorship/provenance | `actor`, `source`, source != authority | Claim `actor`; source/provenance largely object/evidence/export policy | Needs vocabulary finalization and mapping of source/actor/run_id to service payloads without turning source into authority. |
| 07 EvidenceRef edge | One `evidence: EvidenceRef[]`; transform lineage; no parallel references edge | Kernel has no direct evidence edge field unless encoded in object/claim payload; adapter/service contract must preserve evidence payload | Needs contract rule for evidence carriage and round-trip; transform block must be consumed or deferred explicitly. |
| 08 integrity/canonicalization | Top-level integrity and canonicalization id | Rust canonicalization and Record hash authority | Hard gate: hash acquisition agreement; `integrity` self-field exclusion; avoid TS canonicalization clone. |
| 09 lifecycle/correction | status vocabulary, `revises` with target id + Record hash, `links.resolves` consumer | Revision admission requires target claim id + Record hash; append-only correction | Needs service operation/error for stale or missing correction target; service must assign new entry while preserving prior history. |
| 10 certainty/review facts | Certainty projection; review/attestation as separate `act` facts with evidence targets | Claim shape `act`; predicates `review.*`/`attestation.*`; evidence target in payload | Needs review-target evidence encoding and projection rules; no mutation of reviewed target. |
| 11 projection-facing fields | authority, attention, timing, access tier as projections or explicit fields | Mostly chart/app projection over accepted entries | Needs clear split: service stores facts; `pi-chart` derives labels; service must not own Shift Brain/Handoff truth. |
| 12 suggestion state | `Suggested by Pi`, promotion/dismissal facts, no autonomous write/complete | Suggestions may be pre-accepted workflow facts or app-layer proposal records; accepted writes still go through service only after policy | Needs proposal/review boundary before accepted ledger writes; no direct `pi-agent` accepted-write authority. |
| 13 fixture/export round-trip | EventEnvelope/VitalSample/NoteFrontmatter retained as fixture/export/archive | Service contract is not the brownfield schema; vectors must prove round-trip where needed | Needs export crosswalk fixtures and loss/gap register, especially VitalSample ids and NoteFrontmatter references. |
| 14 clinician-surface derivation | Current Snapshot, Shift Brain, Report View, Handoff View, Chart Review Packet are projections | Query/point-read may feed projections; chart owns surface labels | Needs projection test plan proving no surface stores truth or makes autonomous decisions. |
| 15 mappability/boundary | Seven prerequisites and accepted service north star | ADR-008/009/021 combined | Tracks remaining hard gates: registry, hash acquisition, versioned contract, conformance vectors, storage/rebuild. |

## Gap register

| Gap | Owner | Why it blocks source/runtime seam work | Required planning output in this ultragoal |
| --- | --- | --- | --- |
| Production `PredicateRegistry` ownership/loading/versioning | `pi-ledger` service with `pi-chart` contract input | Append admission cannot validate real chart predicates from fixture-only registry. | Registry section in service PRD/test spec; versioning and mismatch errors. |
| Canonicalization/hash acquisition | `pi-ledger` service | Corrections need Record hash; client cannot safely recompute with a TS clone. | Hash/canonicalization operation or response contract; golden vectors. |
| Versioned service contract | `pi-ledger` service and `pi-chart` backend client | ADRs choose service boundary but no operation schema exists. | PRD/test spec for private gRPC/UDS-compatible operations. |
| Transport-agnostic conformance | Shared, with `pi-ledger` as source of cryptographic truth | gRPC/UDS should be replaceable; tests must not be transport-specific. | Golden-vector suite design with positive/negative vectors. |
| Per-patient WAL/log storage/rebuild | `pi-ledger` service | Service must own durable patient ledger state, not in-memory only. | WAL/log plan with replay, head validation, corruption behavior. |
| Multi-entry-point concurrency | `pi-ledger` service for ordering; `pi-chart` backend for auth/session/workflow | Many clinicians/agents may submit concurrently; stale correction/review targets must be rechecked. | Contract semantics for compare-current-target and append-order assignment. |
| Pi-chart adapter boundary | `pi-chart` backend | Direct UI/EHR/browser calls would violate ADR 021. | Adapter test plan and boundary/access plan. |
| Suggestion/review policy | `pi-chart` app/backend; future clinical policy | Pi may suggest/explain/cite but cannot chart/verify/sign/decide. | Boundary/security/access plan; adapter tests for proposal vs accepted fact. |
| Observable charting seam | `pi-chart` adapter over `pi-sim` public telemetry | Public monitor values are not chart truth merely by visibility. | Boundary plan stating explicit adapter/clinician validation requirements. |
| Bounded-agent runtime | `pi-agent` plus exposed interfaces | Agent must not depend on hidden sim or private ledger internals. | Boundary plan and future smoke-test criteria. |

## Recommended artifact dependency order

1. Service PRD/test spec should define operations and error vocabulary.
2. Golden-vector design should instantiate those operations without depending on gRPC details.
3. WAL/log plan should define durable state backing the operations.
4. Pi-chart adapter test plan should target the contract and vectors, not private Rust internals.
5. Boundary/security/access plan should assert the caller/exposure policy around all of the above.

## Explicit non-decisions

This register does not select a backend framework, production auth scheme, vector/retrieval/OpenBrain architecture, embedded database, public API shape, or full clinical write-review workflow. Those remain separate decisions unless a later ultragoal scopes them.
