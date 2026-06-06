# Human grill-with-docs decision log

Date: 2026-05-31
Mode: human interview, no `--auto`, no Claude validator.

## D001 — `context_segment` keeps observation shape

Decision: `observation + context_segment` uses `factShape=observation` and predicate `observation.context_segment`.

Rejected: `factShape=context` with `context.segment` because it reclassifies existing observation-authored rows and makes migration heavier.

Docs updated:

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/02-fact-shape-and-the-six-to-four-collapse.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D002 — Report/note mentions are context; discrete findings are separate observations

Decision: finding-bearing report/note communications remain context/source narrative. Discrete measured findings are represented as separate `observation` facts with evidence/source links to the ordered diagnostic/lab/read.

Example: an echo note mentioning `EF 30%` does not itself become the authoritative EF fact. The EF observation comes from the ordered echocardiogram and cardiologist read; other notes that mention EF in passing may be contextual or confirmatory evidence with lower weight.

Rejected: making the communication itself an `observation` fact, because notes can mention facts incidentally and would blur source context with fact authority.

Docs updated:

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/02-fact-shape-and-the-six-to-four-collapse.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/07-unified-evidence-edge-and-dead-field-closure.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D003 — Review/attestation facts use `factShape=act`

Decision: Reviewed, Verified, Signed, Co-signed, readback, and order co-sign are separate append-only review/attestation facts with `factShape=act`.

Rationale: a review/attestation is an accountable clinical action. The target may be an observation or interpretation, but the review fact itself is not a diagnosis/certainty interpretation and never mutates the target.

Open follow-up: Issue 03 still owns the exact predicate-id spelling for review/attestation facts.

Docs updated:

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/02-fact-shape-and-the-six-to-four-collapse.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/09-lifecycle-vocabulary-and-correction-record-hash.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-attestation-as-separate-facts.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D004 — Standard review/attestation predicate IDs

Decision: Standardize review/attestation predicate IDs as `review.reviewed`, `review.verified`, `attestation.signed`, `attestation.cosigned`, and `attestation.readback`.

Rationale: these names keep ordinary review separate from formal attestation, preserve `factShape=act`, and retire ambiguous provisional names like `review.result` / `comm.cosign`.

Docs updated:

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-attestation-as-separate-facts.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D005 — Review/attestation target links use the single evidence edge

Decision: review/attestation target linkage uses `evidence: EvidenceRef[]`. Legacy `attests_to` / `reviewed_refs` source keys map into evidence, not duplicate object fields.

Rationale: this follows existing repo invariants from Issue 07 and Issue 10: one evidence edge, review is not correction, and target links should not drift between object and evidence fields.

Note: this was resolved from existing docs because it is a low-level consistency rule, not a product/domain decision requiring human judgment.

Docs updated:

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-attestation-as-separate-facts.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D006 — Shared clinical-truth service is the accepted north-star architecture

Decision: Accept the shared clinical-truth service shape as the north-star architecture: grow `pi-ledger` into a long-lived service owning durable per-patient append-only clinical truth, with `pi-chart` as a client over a versioned contract.

Still open after D006: transport choice, durable storage engine, concurrency/consistency model, and ADR promotion timing/content.

Rejected: per-agent embedded truth, spawn-per-call CLI as the source-of-truth mechanism, and TypeScript reimplementation of kernel canonicalization.

Docs updated:

- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/*.md` references from proposed runtime to accepted north star where applicable
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`


## D007 — Many entry points, one patient-scoped append order

Decision: the clinical workspace may expose Pi-RN from many entry points — EHR chart, task list, specialty workflow, background agent queue, or other clinician surfaces — but those entry points are clients, not local truth owners. For a given patient ledger, the shared clinical-truth service provides one authoritative service-side append/order path.

Rationale: this preserves a multi-provider workspace while avoiding divergent truth copies. Multiple clinicians and agents may submit concurrently; the service assigns `seq`/`accepted_at`/head, rechecks correction/review target hashes against current ledger state, and publishes one ordered patient truth stream to all readers/subscribers.

Rejected: interpreting "single writer" as one clinician, one UI, or one workspace. The settled meaning is one patient-scoped ordering authority under many clinical entry points.

Docs updated:

- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/01-charted-clinical-fact-identity-and-scope-fields.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/05-bitemporal-time-fields-and-canonical-utc-contract.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/09-lifecycle-vocabulary-and-correction-record-hash.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/15-kernel-mappability-closeout-and-boundary-register.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D008 — Clinical entry points are mediated through app/backend

Decision: browser, EHR, task-list, specialty-workflow, and other clinical entry points talk to the normal Pi-RN/pi-chart app/backend surface. They do not connect directly to the clinical-truth service. The backend/service layer mediates auth/session/workflow concerns and calls the clinical-truth service.

Rationale: this keeps many clinical entry points compatible with one patient truth stream and makes private/local backend-to-service transport (for example gRPC over UDS, if confirmed) plausible. It also avoids exposing ledger-service semantics directly to every UI or external workflow integration.

Rejected: each browser/workflow entry point connecting directly to the ledger service or owning a local truth copy.

Docs updated:

- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/13-eventenvelope-ndjson-markdown-fixture-export-round-trip.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/14-clinician-surface-derivation-guarantee.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/15-kernel-mappability-closeout-and-boundary-register.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D009 — Clinical-truth service is private/internal, not public API

Decision: the clinical-truth service is a private internal service, not a public/external clinical API. Browser, EHR, task-list, and specialty workflow entry points do not call it directly; only the Pi-RN/pi-chart backend/service layer calls it.

Rationale: this keeps the ledger contract behind auth/session/workflow mediation, avoids exposing source-of-truth semantics to every integration surface, and keeps local/private transport options plausible while preserving future deployment flexibility.

Rejected: exposing the ledger service directly as a public clinical API to browsers, EHR plugins, or external workflow tools.

Docs updated:

- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/clinician-facing-terminology-map.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/12-human-agent-suggestion-state-on-the-substrate.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/14-clinician-surface-derivation-guarantee.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/15-kernel-mappability-closeout-and-boundary-register.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D010 — First transport is private/local gRPC over UDS

Decision: the first backend-to-clinical-truth-service transport is private/local gRPC over Unix-domain socket, behind a versioned contract. The transport remains swappable; Cap'n Proto or custom framing are reserved for later profiling-driven optimization only.

Rationale: this matches the accepted private/internal exposure boundary and app/backend mediation, gives a typed contract and streaming support, and avoids making browser/EHR/workflow clients speak ledger-service protocol directly.

Meta-decision from the human: future low-level technical questions of this kind should not be escalated; assume agreement with the agent's recommendation unless the question changes clinical/product direction.

Docs updated:

- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/01-charted-clinical-fact-identity-and-scope-fields.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/05-bitemporal-time-fields-and-canonical-utc-contract.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/07-unified-evidence-edge-and-dead-field-closure.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/08-integrity-field-and-agreed-canonicalization-id.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/12-human-agent-suggestion-state-on-the-substrate.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/13-eventenvelope-ndjson-markdown-fixture-export-round-trip.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/14-clinician-surface-derivation-guarantee.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/15-kernel-mappability-closeout-and-boundary-register.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D011 — First storage posture is per-patient append-only WAL/log

Decision: the first durable storage posture for the clinical-truth service is a per-patient append-only WAL/log. Embedded stores such as `redb`, `sled`, or SQLite remain later options only if indexing, compaction, or operational needs justify them behind the same service contract.

Rationale: the clinical truth model is append-only by construction, so the simplest first storage shape should match the domain invariant before adding database machinery. This follows the human instruction to assume agreement on low-level technical recommendations.

Docs updated:

- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/01-charted-clinical-fact-identity-and-scope-fields.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/05-bitemporal-time-fields-and-canonical-utc-contract.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/07-unified-evidence-edge-and-dead-field-closure.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/08-integrity-field-and-agreed-canonicalization-id.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/13-eventenvelope-ndjson-markdown-fixture-export-round-trip.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/14-clinician-surface-derivation-guarantee.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/15-kernel-mappability-closeout-and-boundary-register.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`

## D012 — Promote accepted service/access decisions to ADRs before implementation

Decision: promote the accepted service/access/transport and storage posture into durable ADRs before implementation begins. `pi-ledger` owns the service ADR; `pi-chart` owns the client-boundary ADR.

Rationale: the clinical-truth service boundary is hard to reverse, surprising without context, and selects among real alternatives. ADR promotion prevents future agents from reopening the old Rust↔TS mechanism framing or treating scratch notes as the only source of truth. This follows the human instruction to assume agreement on low-level procedural recommendations.

Docs created/updated:

- `pi-ledger/docs/adr/009-clinical-truth-service.md`
- `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`
- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/15-kernel-mappability-closeout-and-boundary-register.md`
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/RECONCILIATION.md`
