# PRD: pi-chart V0.5 claim-ledger kernel

Status: needs-triage
Program status: active workstream under the V0.5 pi-chart rebase.
Retargeting status: implementation ownership moved to `pi-ledger`; existing issue paths must be re-triaged before AFK source work.

## Problem Statement

The maintainer wants to start implementing the pi-chart V0.5 claim-ledger kernel, but only after the work has passed through the Matt Pocock skills flow rather than jumping straight from prior planning into code.

The current pi-chart brownfield substrate already proves useful clinical-memory ideas, but ADR 019 says the V0.5 kernel must be clean-canvas. The risk is context poison: future agents could accidentally import current `EventEnvelope` assumptions, current patient fixtures, generated cockpit UI assumptions, package-internal ADR statuses, or hidden simulator knowledge into the new kernel.

The project needs a small, behavior-tested claim-ledger kernel that protects chart truth guardrails while staying narrow enough to implement through tracer-bullet TDD slices. It must prove stable claim identity, content hashing, append-only ledger order, predicate validation, valid-time/known-time reads, and deterministic synthetic fixtures before any migration, access plane, runtime, agent write path, production backend, or service rewrite begins.

## Solution

Build a clean V0.5 claim-ledger kernel as a set of deep modules with small, testable interfaces:

- a canonicalization and content-hash module;
- a minimal Claim validation module;
- an append-only ledger module;
- a minimal predicate registry module;
- a point-in-time read module for valid time and known time;
- a deterministic synthetic fixture and boundary-check module.

The kernel will use generated local fixtures only. It will not migrate current patient directories, retrofit the brownfield event schema, import hidden simulator internals, introduce direct agent-accepted clinical writes, or choose a production storage/backend architecture.

The PRD enters the local markdown issue tracker with `needs-triage`. Existing issue slices should be re-triaged under this PRD before implementation. The first implementation candidate remains the canonicalization/hash behavior, but its implementation home has moved to `pi-ledger`; all issue slices require retargeting before becoming `ready-for-agent`.

## User Stories

1. As a maintainer, I want the kernel work captured in the local issue tracker, so that implementation follows the same PRD-to-issues-to-triage flow as the rest of the repo.
2. As a maintainer, I want the V0.5 kernel to be clean-canvas, so that brownfield prototype structure does not become production architecture by accident.
3. As a future coding agent, I want one active PRD for the kernel, so that I do not mine runtime plans or historical memos as implementation authority.
4. As a future coding agent, I want explicit source-authority rules, so that package research is used as evidence rather than copied wholesale.
5. As a clinical-memory architect, I want stable claim identity, so that future chart references can cite both a claim id and its content hash.
6. As a clinical-memory architect, I want deterministic canonicalization, so that independent runtime layers can recompute the same claim hash.
7. As a clinical-memory architect, I want hash calculation to exclude self-reference fields, so that a stored hash does not recursively change the payload it proves.
8. As a clinical-memory architect, I want claim hashes to be sensitive to clinical payload changes, so that tampering or accidental mutation is detectable.
9. As a test author, I want the canonicalization input domain to be explicit JSON data, so that unsupported values fail deterministically instead of producing ambiguous hashes.
10. As a maintainer, I want the hash algorithm and encoding locked by tests, so that later references are not invalidated by an implementation detail change.
11. As a clinician-safety reviewer, I want append-only clinical truth preserved, so that corrections never erase the prior charted claim.
12. As a clinician-safety reviewer, I want corrections represented as new claims that target prior id/hash pairs, so that the audit trail remains inspectable.
13. As a clinician-safety reviewer, I want provenance on every claim, so that each chart fact records who or what produced it and when it became known.
14. As a clinician-safety reviewer, I want patient identity explicit in every kernel fixture and API call, so that no cross-patient leakage is normalized.
15. As a simulation-boundary reviewer, I want fixtures to avoid hidden simulator internals, so that the kernel cannot gain oracle knowledge unavailable to chart users.
16. As a chart reader, I want valid time and known time kept distinct, so that backdated corrections do not leak future knowledge into earlier views.
17. As a future ContextPacket author, I want point-in-time read semantics now, so that replay and drift checks can later build on the kernel rather than redefining time.
18. As a future access-plane author, I want kernel outputs to expose ids, hashes, sequence numbers, and accepted times, so that tools do not need raw filesystem identity.
19. As a future runtime author, I want actor and provenance hooks without direct agent append behavior, so that later proposal/review flows can attach attribution safely.
20. As a predicate registry maintainer, I want unknown predicates rejected, so that untyped claims cannot silently enter the kernel.
21. As a predicate registry maintainer, I want predicate-declared shape checks, so that a claim cannot masquerade as a different clinical shape.
22. As a predicate registry maintainer, I want minimal object validation for seeded predicates, so that Phase 1 proves ontology enforcement without freezing full policy.
23. As a fixture maintainer, I want a tiny deterministic synthetic corpus, so that hash, ledger, predicate, and bitemporal behavior can be tested without current patient fixtures.
24. As a future migration author, I want current patient data excluded from Phase 1, so that migration design waits until the kernel substrate proves itself.
25. As a future backend author, I want Phase 1 to stay storage-neutral, so that the kernel does not prematurely choose a production database or service shape.
26. As a reviewer, I want each implementation phase to name the clinical truth guardrail it protects, so that tracer-bullet issues do not import prototype details under vague “invariant” language.
27. As a reviewer, I want boundary tests for package authority leakage, hidden simulator coupling, migration creep, and direct agent writes, so that later phases cannot silently widen scope.
28. As an implementation agent, I want each phase to start with failing behavior tests, so that the kernel is specified by externally visible behavior rather than internal helper structure.
29. As a maintainer, I want readiness gaps recorded before implementation, so that triage can fix them without derailing TDD.
30. As a future maintainer, I want the kernel modules to be deep, so that deleting one would reintroduce real complexity across callers rather than just removing pass-through code.

## Implementation Decisions

- The work remains a clean-canvas V0.5 kernel, not a brownfield retrofit.
- The kernel is divided into six deep modules: canonicalization/hash, Claim validation, append-only ledger, predicate registry, bitemporal read, and deterministic fixture/boundary checks.
- The canonicalization identifier is `jcs-rfc8785-pi-chart-v1`.
- Content hashing excludes hash and signature self-fields from the record payload.
- Hash behavior must be property-order invariant and value-sensitive, with output encoded as `sha256:<64 lowercase hex characters>`.
- The concrete hash algorithm and output encoding are locked for Phase 1 as SHA-256 over canonical payloads, encoded as `sha256:<64 lowercase hex characters>`, before downstream id/hash references depend on it.
- Canonicalization applies to JSON-compatible values only; unsupported values such as non-finite numbers, missing/undefined values, functions, or cyclic objects should fail deterministically rather than be silently normalized.
- The minimal Claim vocabulary has four shapes: `context`, `observation`, `interpretation`, and `act`.
- Minimal Claim validation requires claim identity, shape, predicate, subject, object, time, actor/provenance, and integrity data.
- Corrections use a minimal revision link with mode `corrects` and target both id and hash.
- Append assigns store-owned accepted metadata, including accepted time, monotonic sequence, and batch identity.
- Ledger entries maintain a hash chain and expose enough metadata to validate the current head and rebuild deterministically.
- Bitemporal reads support point queries for clinical valid time and accepted known time.
- The predicate registry is the ontology seam for Phase 1; it rejects unknown predicates, shape mismatches, and invalid seeded predicate objects.
- The fixture corpus is generated, local, synthetic, deterministic, and tiny: one generated patient, one encounter, four shape claims, one correction, at least two ledger entries, and seeded predicates.
- Phase 1 public kernel identity must be based on claim ids, content hashes, sequence, and accepted metadata, not raw filesystem paths.
- Actor and provenance hooks are allowed; direct agent/orchestrator acceptance of clinical truth is not allowed.
- Current event-envelope structure, current patient directories, generated cockpit UI assumptions, package-internal statuses, FHIR resource identity, and hidden simulator state are not implementation authority.
- No new dependency should be introduced unless a later issue explicitly justifies it; existing project dependencies may be reused only when they do not import brownfield event semantics.
- Existing source modules may be inspected for test-command convention or narrow reusable utilities, but Phase 1 behavior must not depend on the old chart envelope, old schemas, or old patient fixtures.
- Each phase issue must include a filled guardrail application before it can become `ready-for-agent`.

## Testing Decisions

- Tests should verify external kernel behavior, not internal helper structure.
- Each implementation issue should start with failing Node tests mapped to the existing test-spec rows.
- Canonicalization/hash tests should cover the canonicalization identifier, self-field exclusion, property-order invariance, clinical value sensitivity, stable recomputation, explicit SHA-256 `sha256:<hex>` encoding, and deterministic rejection of unsupported JSON inputs.
- Claim validation tests should cover the four accepted shapes, required fields, correction links, and independence from the brownfield event envelope.
- Ledger tests should cover store-assigned accepted metadata, monotonic sequence, valid hash-chain validation, old-entry mutation detection, head mismatch detection, deterministic reread, and recomputation of record and entry hashes.
- Predicate tests should cover seeded registry load, duplicate predicate detection, unknown predicate rejection, shape mismatch rejection, and object schema validation for seeded predicates.
- Bitemporal read tests should cover valid-time filtering, known-time filtering, backdated correction invisibility before accepted time, corrected view after accepted time, and rebuild from ledger entries without cached projection authority.
- Fixture tests should cover deterministic generated corpus inventory and absence of current patient fixture capture.
- Boundary tests should cover no package authority leak, no hidden simulator coupling, no backend commitment, no access-plane shortcut, no current patient migration, and no direct agent write channel.
- Tests should run with deterministic clock/batch controls where accepted time, sequence, or hash output would otherwise be flaky.
- Prior art for test style is the existing Node test setup in pi-chart, but test fixtures should be fresh and synthetic rather than borrowed from brownfield patient charts.
- Closeout for implementation slices should run targeted tests first, then typecheck, then the project check command when applicable.

## Out of Scope

- Migrating current patient data.
- Retrofitting the current event-envelope model.
- Changing the brownfield event schema.
- Compatibility mappers between brownfield chart records and V0.5 Claims.
- Hidden simulator integration or oracle-state fixtures.
- Production database, service framework, hosted deployment, or backend selection.
- Agent-accepted clinical writes, generic append-claim tools, capture routers, proposal queues, review queues, or MCP gateways.
- ContextPacket, TaskFrame, replay drift reports, compression, semantic search, access indexes, runtime sessions, sandbox grants, orchestrator worklists, playbooks, leases, attempts, or reasoning bundles.
- Relation claims, `inputs[]`, predicate reference extraction, full predicate-tier policy, relation cardinality/exclusivity, or revision modes beyond `corrects`.
- Valid-time range queries beyond the Phase 1 point-query minimum.
- Legal signatures, key management, external anchoring, or attestation taxonomy expansion.
- FHIR resource shapes, FHIR ids as internal identity, FHIR server/search assumptions, or external EHR adapter contracts.
- Curated clinical case salvage from current patient directories.
- Broad service/event-store rewrite outside the Phase 1 kernel.

## Further Notes

Source authority and work surfaces:

- Accepted architecture authority: ADR 018 and ADR 019 under the pi-chart ADR directory.
- Current source-authority map: the pi-chart architecture source-authority document.
- Active workstream surface: this local markdown tracker directory.
- Active kernel standards: the clinical truth guardrails document and future-runtime constraints document in this workstream.
- Existing test spec: the workstream test spec already maps K0-K6, negative tests, rebuild tests, and boundary tests.
- Existing issue slices: six issue files already exist for K0+K2 through K6.

Readiness scan before proceeding down the phases:

1. K0+K2 was previously closest to AFK pickup, but the `pi-ledger` ownership decision returned all implementation slices to `needs-triage` until paths, package/tooling, and closeout commands are retargeted.
2. The first slice should enforce SHA-256 `sha256:<64 lowercase hex characters>` output before downstream phases depend on `(id, hash)` references.
3. The first slice should explicitly reject unsupported non-JSON canonicalization inputs to avoid ambiguous hash behavior.
4. Ledger phases will need deterministic clock and batch controls in tests, or accepted-time and batch-id assertions may become flaky.
5. Predicate object validation should decide whether it uses an existing validation dependency or a tiny local validator, without importing old event-schema semantics.
6. The bitemporal read phase should preserve “derived views are disposable” by rebuilding from ledger entries, not by trusting cached projections.
7. Fixture closeout should include mechanical checks for package ADR authority leakage and forbidden current-patient fixture references.
8. No source implementation should start from this PRD alone; source edits should start only from a `ready-for-agent` issue and the TDD skill.
