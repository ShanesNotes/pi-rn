# Kernel-mappability closeout + boundary register

Status: ready-for-human
Type: AFK / SPEC artifact (closeout + boundary register, not a source edit)
Reconciliation posture: open-question
PRD user stories covered: 1, 11, 12, 17, 19, 27, 28, 29 (closeout of the field set)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§4 "The kernel-mappability guarantee"; Implementation Decisions: "The kernel is **not widened**; mapping bends the chart to the frozen Claim target.").

## What to build

The closeout doc that (a) **enumerates the SEVEN things pi-chart must make explicit to be mappable** to the frozen kernel Claim target, (b) **asserts NO kernel widening**, and (c) records the **integration mechanism** as the **accepted shared clinical-truth service north star** (contract-first; private/internal service; private/local gRPC/UDS first transport; per-patient append-only WAL/log first storage posture; many entry points mediated through app/backend with one patient-scoped append order) plus all remaining deferrals. Posture is **open-question** because two of the seven prerequisites (production registry; agreed canonicalization id) and service ADR promotion is recorded — this doc surfaces them for the architect, it does not resolve them.

### Scaling posture (architect mandate 2026-05-29)

The seven prerequisites are exactly what makes the substrate mappable into a **shared, concurrent, high-volume, multi-provider clinical-truth service**: explicit predicates/shapes/objects let the service shard and route by `(patient, predicate)`; canonical-UTC time + Record-hash corrections + integrity make **append-only, correction-by-new-fact** safe under many concurrent authoring agents; an agreed canonicalization id is what lets multiple processes/languages agree on a single cryptographic truth. None of this widens the kernel — it bends the chart to the frozen target.

## The seven mappability prerequisites (against the frozen public interface)

Verified against `pi-ledger/docs/ledger-core-public-interface.md` (frozen K0-K12 Claim target).

| # | Prerequisite | Chart gap today | Kernel target it satisfies | Status |
| --- | --- | --- | --- | --- |
| 1 | **`predicateId` deterministic from `(type, subtype)` + a production `PredicateRegistry`** | `subtype` is an untyped magic string; kernel `phase1_registry` is fixtures-only | `predicates::PredicateRegistry::validate_validated_claim`; predicate's declared shape must equal `factShape` (else `ShapeMismatch`) | **OPEN** — production registry must be authored (out of scope here; Issue 03) |
| 2 | **Explicit `factShape` per fact (6 ClinicalTypes + 3 StructuralTypes → 4 kernel shapes), incl. `communication`/`artifact_ref` resolution** | 9 source types, no explicit shape; `communication`/`artifact_ref` have no native kernel shape | `claim` `shape` ∈ {context, observation, interpretation, act} | Decided in PRD (Issue 02); table is the field contract |
| 3 | **Typed `object` per predicate (RequiredFields name/JSON-type)** | `data: Record<string, unknown>` mined by ~20 magic keys | `claim::validate_object` → `MissingObjectField`/`InvalidObjectField`; `object.encounterId:string` is a RequiredField | Decided in PRD (Issue 04) |
| 4 | **Canonical-UTC timestamps `YYYY-MM-DDTHH:MM:SSZ`** | chart strings carry offsets/fractional seconds/zone names | `time::CanonicalTimestamp` — **rejected, not normalized**, if non-canonical; `time.valid` instant XOR interval; `time.recorded_at` | Decided in PRD (Issue 05); adapter owns normalization |
| 5 | **Record hash on every correction target (`revises.target.{id, sha256:<64hex>}`)** | `links.corrects` carries id arrays only, no target hash | `admission::RevisionAdmissibleClaim::admit` — proves target by id **plus** `record_hash` recomputing against stored target | Decided in PRD (Issue 09) |
| 6 | **Top-level `integrity` block** | chart has no `integrity` field | `claim` `integrity` present; whole Claim must canonicalize | Decided in PRD (Issue 08) |
| 7 | **Agreed canonicalization id between chart and kernel** | chart `jcs-rfc8785-pi-chart-v1` not yet agreed with kernel `canonical_json`/`record_hash` | `canonical::canonical_json` / `canonical::record_hash` — cross-side hashes must match | **OPEN** — agreement is a named prerequisite, not implemented (Issue 08) |

Also enforced by the target but already explicit (not among the seven "to-make-explicit"): `subject.patientId` (→ kernel subject; `PatientMismatch`), and **K3 store-owned metadata the chart must NOT emit** — `accepted_at`/`seq`/`batch_id`/Record+Entry hashes/prev-link/head (kernel `K3OwnedTimeMetadata` / store authority; "callers do not set accepted metadata on Claims").

## No kernel widening (assertion)

The mapping **bends the chart to the frozen Claim target; it never bends the kernel to the chart.** Specifically:
- The 6→4 shape collapse, `predicateId` projection, and typed `object` adapt the chart **into** the four kernel shapes and registered predicates — no new shape, predicate-policy relaxation, or object-rule change is requested of the kernel.
- Chart-internal fields with **no kernel field** (authority posture, attention cue, timing state, access tier, suggestion state, `certainty`, `transform`, `source`) stay view-side/provenance and are **not** pushed into the kernel.
- Per the kernel's own boundary reminders: `pi-ledger` does not import `pi-chart`/`EventEnvelope`/brownfield schemas, does not inspect hidden `pi-sim`, and does not grant `pi-agent` accepted-write authority — this closeout preserves all three.

## Integration mechanism (accepted service north star; ADR-promoted)

The integration mechanism is recorded as the **accepted shared clinical-truth service north star**. The service shape, concurrency/consistency model, app/backend-mediated access shape, private/internal exposure boundary, first transport, first storage posture, and ADR promotion are accepted:

- **Mechanism (accepted north star):** grow `pi-ledger` from a library into a **long-lived shared clinical-truth service** that owns durable per-patient append-only WAL/log storage first and exposes only the ADR-008 safe consumer paths; `pi-chart` (and later `pi-agent`) become **clients**. Canonicalization/hashing runs **once, in Rust** (single cryptographic source of truth).
- **Contract-first + first transport:** the load-bearing artifact is a **versioned service contract** over the ADR-008 interface plus the kernel's golden vectors promoted to a transport-agnostic conformance suite. Private/local gRPC over a Unix-domain socket is the accepted first transport and remains swappable behind the contract; wasm-of-canonicalization is an optional client fast-path only.
- **Concurrency/consistency:** multiple clinicians, workflows, and agents may enter Pi-RN through different UI/workflow entry points, but none is a local truth owner. For a given patient ledger, the service is the single authoritative append/order path: it assigns `seq`/`accepted_at`/head, rechecks target hashes, and exposes one ordered patient truth stream to readers/subscribers.
- **Access/exposure shape:** browser/EHR/task/specialty entry points talk to the Pi-RN/pi-chart app/backend, not directly to the ledger service. The backend/service layer mediates auth/session/workflow concerns and calls the clinical-truth service over private/local gRPC/UDS first transport. The clinical-truth service is private/internal, not a public/external clinical API.
- **Status:** **ACCEPTED (2026-05-31 human grill), ADR-promoted** — `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, `pi-ledger/docs/adr/009-clinical-truth-service.md`, and `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`. Any issue depending on this **assumes the accepted service north star** and must cite it.
- This reshapes the old narrow "Rust↔TS integration mechanism" framing into "client-of-a-truth-service over a versioned contract." The service shape, concurrency/consistency model, app/backend-mediated access shape, private/internal exposure boundary, and first transport are accepted; the old undecided Rust↔TS integration-mechanism framing is closed.

## Boundary register (deferrals / out of scope)

- **Out of scope (not chosen here):** implementing the adapter; authoring the production `PredicateRegistry`; the canonicalization-id agreement; widening/modifying the kernel or its frozen interface; backend framework/vector/OpenBrain/storage/runtime/service/graph-index/semantic-search/full access-plane policy selection; hot/warm/cold **retrieval** technology and cold-history retrieval beyond source-linked citation; hidden `pi-sim` coupling/oracle truth/evaluator labels; agent autonomous accepted-writes or task completion; full CPOE/pharmacy/MAR/drug-dictionary/med-rec/CDS/protocol engines; treating generated UI/design assets/prototype layout as substrate authority (ADR 018 pts 5-7); reopening accepted ADRs without a separate ADR process.
- **Retained per ADR 018 pt 4:** EventEnvelope/VitalSample/NoteFrontmatter NDJSON+Markdown stays the fixture/export/archive format; every contract field must round-trip to/from it (Issue 13).

## Open questions for the architect (surface, do not answer)

1. **Production `PredicateRegistry`** (prereq #1): who authors it, and against what predicate vocabulary? Kernel `phase1_registry` is fixtures-only and cannot satisfy production policy.
2. **Canonicalization-id agreement** (prereq #7): is `jcs-rfc8785-pi-chart-v1` byte-identical to the kernel's `canonical_json`/`record_hash` rule? If not, cross-side Record hashes will not match and corrections will not be Revision-admissible. Agreement is a named prerequisite, **unresolved**.
## Settled service decisions

- **Service ADRs:** accepted in `pi-ledger` ADR 009 and `pi-chart` ADR 021; concurrency is settled as many entry points with one patient-scoped service-side append order, mediated through the app/backend; service exposure is settled as private/internal; transport is settled as private/local gRPC/UDS first transport; storage is settled as per-patient append-only WAL/log first.

## Connector contract

All connectors over this substrate stay `(patientId, encounterId, asOf)`-parameterized and **never hardcode a patient** (demo `patient_002`/`enc_p002_001`; regression `patient_001`). This holds equally when the substrate is hosted behind the accepted shared clinical-truth service north star.

## Acceptance checks

- [ ] Lists the **seven** mappability prerequisites against the frozen public interface, each with chart gap + kernel target + status (incl. #1 registry and #7 canonicalization-id as OPEN).
- [ ] Names the K3 store-owned never-emit metadata and the already-explicit `subject.patientId`.
- [ ] States **"no kernel widening"** and that mapping bends the chart to the frozen target.
- [ ] Records the integration mechanism as the **accepted shared clinical-truth service north star** (contract-first; private/internal service; private/local gRPC/UDS first transport; append-only WAL/log first storage; entry points mediated through app/backend) and cites `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`.
- [ ] States ADR promotion is complete while concurrency, first transport, and first storage posture are settled.
- [ ] Records the boundary register (backend-framework/vector/OpenBrain/retrieval/sim/runtime/full-access-plane non-selection; no autonomous writes/completion) and ADR-018 fixture/export retention.
- [ ] Surfaces the open questions for the architect **without answering** them.
- [ ] Connector signature `(patientId, encounterId, asOf)`, no hardcoded patient.
- [ ] Reconciliation posture (open-question) and `Status: ready-for-human` present.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/01-charted-clinical-fact-identity-and-scope-fields.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/02-fact-shape-and-the-six-to-four-collapse.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/05-bitemporal-time-fields-and-canonical-utc-contract.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/06-source-authorship-and-provenance-vocabulary.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/07-unified-evidence-edge-and-dead-field-closure.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/08-integrity-field-and-agreed-canonicalization-id.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/09-lifecycle-vocabulary-and-correction-record-hash.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-attestation-as-separate-facts.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/11-projection-facing-fields-authority-attention-timing-access-tier.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/12-human-agent-suggestion-state-on-the-substrate.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/13-eventenvelope-ndjson-markdown-fixture-export-round-trip.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/14-clinician-surface-derivation-guarantee.md`
