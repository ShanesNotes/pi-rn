# Pi-chart adapter test plan before adapter code

Date: 2026-05-31
Ultragoal story: `G006-pi-chart-adapter-test-plan-before-adapter-co`
Status: planning artifact; no adapter implementation authorized yet.

## Purpose

Define the `pi-chart` test obligations that must exist before implementing a backend client adapter to the private clinical-truth service. These tests keep the adapter a translation layer over the charted-clinical-fact field contract rather than a redesign of chart truth or a clone of ledger logic.

## Scope

The adapter test plan covers:

- EventEnvelope / NDJSON / Markdown / VitalSample fixture-export round trips.
- Predicate and typed-object mapping fixtures.
- EvidenceRef, transform lineage, review/attestation, and correction target mapping.
- Clinician-surface derivation assertions from accepted fields.
- Boundary tests preventing direct UI/browser/EHR/agent accepted writes.

It does not implement the adapter, choose a backend framework, or create service transport code.

## Test fixture families

### Family A — EventEnvelope to service Claim candidate

Use representative `EventEnvelope` fixtures for:

- vital observation -> `shape=observation`, predicate `vital.sign`, object code/value/unit/encounterId;
- lab result -> `lab.result` with source/evidence;
- `observation.context_segment` per D001;
- assessment/problem/impression/trend -> `shape=interpretation` predicates;
- intent/order/plan -> `shape=act` or configured predicate shape per issue 03;
- communication note as context/source narrative, not authoritative observation when it merely mentions a finding;
- report-derived discrete finding as a separate observation with evidence link to report/read.

Assertions:

- patient id maps to Claim subject and target ledger patient;
- encounter id maps to object field, not subject;
- factShape and predicate id match the production registry fixture;
- typed object contains no magic undeclared `data.*` authority;
- source/actor/provenance survive mapping.

### Family B — VitalSample round trip

Use `vitals.jsonl` style fixtures for:

- canonical vital sample with generated/stable fact identity policy once issue 01 is resolved;
- sample quality values including `invalid` and `questionable`;
- sampled_at -> `time.valid.instant`;
- source device/import labels.

Assertions:

- `VitalSample` does not become accepted chart truth by visibility alone;
- any accepted vital Claim has a stable id, patient scope, canonical UTC time, predicate/object mapping, and source/evidence;
- quality belongs to the typed object policy, not EvidenceRef;
- public telemetry adapter path is explicit and testable separately from hidden `pi-sim` internals.

### Family C — NoteFrontmatter / Markdown round trip

Use note fixtures for:

- note frontmatter references converging onto `evidence: EvidenceRef[]`;
- communication note event paired with Markdown source;
- report/note mentions that are contextual evidence only;
- discrete clinical observations extracted from an ordered read/report as separate facts.

Assertions:

- `references: string[]` is fixture/export shape only, not a second contract evidence edge;
- evidence roles such as source/context/confirmatory are preserved;
- note body remains source narrative and does not silently become authoritative observation payload;
- source trail can explain why a derived observation is shown.

### Family D — Review and attestation facts

Use fixtures for:

- `review.reviewed`;
- `review.verified`;
- `attestation.signed`;
- `attestation.cosigned`;
- `attestation.readback`.

Assertions:

- review/attestation facts use `shape=act`;
- reviewed/signed targets are linked via `evidence: EvidenceRef[]`;
- no target fact is mutated by review;
- review state labels are projections over these facts plus freshness/source state.

### Family E — Correction and lifecycle

Use fixtures for:

- base accepted fact;
- correction fact carrying `revises.target.{id,hash}`;
- problem resolution versus wrong-claim correction;
- `links.resolves` relationship where applicable.

Assertions:

- correction requests acquire target Record hash from service-returned entry data;
- adapter does not recompute Record hash in TypeScript;
- stale correction target errors become review/retry prompts, not silent mutation;
- lifecycle labels such as Corrected/Replaced/Resolved derive from append-only history.

### Family F — Suggestion and promotion

Use fixtures for:

- `Suggested by Pi` care item proposal;
- clinician `Add to Shift Brain` promotion as a separate human-owned fact/action;
- dismissal/disable-ability.

Assertions:

- suggestion does not become accepted clinical truth by itself;
- Pi cannot chart, complete, verify, sign, co-sign, or decide;
- promotion is backend-mediated and human-owned;
- source label and authority label remain distinct.

## Service client contract tests

The adapter test harness should use a fake or in-process service implementing the v1alpha1 contract semantics and later run the same tests against gRPC/UDS.

Required cases:

- build `ValidateClaim` request from chart field fixture;
- build `AppendClaim` request only for accepted base facts;
- build `AppendRevisionClaim` request only when target Record hash is known from service;
- handle all required negative error codes from `SERVICE-CONTRACT-TEST-SPEC.md`;
- never call service directly from view/UI test surfaces.

## Clinician-surface derivation assertions

For each surface, tests must prove labels are projections over chart/service facts, not stored new truth.

| Surface | Required assertions |
| --- | --- |
| Current Snapshot | Source, review state, and As-of labels derive from accepted facts, source/evidence, review facts, and query time. |
| Shift Brain | authority, timing, attention, suggested/promotion state derive from fields and human actions; view completion is not chart documentation. |
| Report View | report context is source-linked and does not become a chart note/final handoff/paper-sheet authority. |
| Handoff View | carry-forward and watch labels remain source-linked; final handoff authority is human-owned. |
| Chart Review Packet | packet content cites source/evidence and records context-accountability without becoming accepted truth. |
| Source trail / Why am I seeing this? | explanation can trace predicate/object/source/evidence/review lineage. |

## Negative boundary tests

- Direct browser/EHR/workflow client cannot construct or send clinical-truth service request in test harness.
- `pi-agent` cannot access service UDS path or credentials in bounded-runtime fixture.
- Adapter rejects hidden `pi-sim` source paths; only documented public telemetry fixtures may be consumed by telemetry adapter tests.
- Adapter does not import private `ledger-core` internals or fixture helpers; it uses the service contract/vector fixtures.
- Adapter does not emit store-owned K3 metadata.
- Adapter does not canonicalize/hash in TypeScript for authority; it requests/receives service hashes.

## Test file placement proposal

```text
.scratch/pi-rn-clinical-truth-service-seam-planning/
  PI-CHART-ADAPTER-TEST-PLAN.md

future source ultragoal may add:
pi-chart/tests/clinical-truth-adapter/
  fixtures/
  event-envelope-mapping.test.ts
  vital-sample-mapping.test.ts
  note-frontmatter-evidence.test.ts
  review-attestation-facts.test.ts
  correction-target-hash.test.ts
  clinician-surface-derivation.test.ts
  boundary-no-direct-service-access.test.ts
```

## Exit criteria before adapter implementation

- Production registry contract has at least a fixture version.
- Rust-generated service conformance vectors exist for the chosen first vertical slice; stubbed vectors are allowed only for UI/test-harness scaffolding and do not authorize runtime seam implementation.
- All adapter tests can run against a fake contract implementation before real transport, and at least the first vertical slice also runs against Rust-generated vector expectations.
- Boundary tests fail if direct UI/browser/EHR/agent accepted-write paths appear.
- The first vertical slice chooses one narrow fact family with explicit Claim identity, idempotency behavior, registry fixture, and retry/conflict semantics.
