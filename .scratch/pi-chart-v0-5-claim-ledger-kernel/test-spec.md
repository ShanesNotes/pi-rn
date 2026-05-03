# Workstream Test Spec: pi-chart V0.5 claim-ledger kernel

Status: active planning mirror; implementation authority only through approved issue slices.

Mirrored from `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md` for Matt-compatible TDD planning. This is not source-edit authorization until issue slices are approved.

---

# Test Spec — V0.5 Claim Ledger Kernel

Date: 2026-05-03
Mirrored source status: draft planning artifact; no implementation authority.
Phase: 1 — small claim-ledger kernel substrate.
PRD: `.omx/plans/prd-v0-5-claim-ledger-kernel.md`

## 1. Purpose

This test spec defines the verification shape for the Phase 1 V0.5 claim-ledger kernel. It is a planning artifact only. It does not authorize source, schema, fixture, package, lockfile, package-archive, accepted ADR, or patient-data edits.

Current repo tests and fixtures are brownfield evidence only. Future implementation may reuse patterns, but this spec intentionally uses a fresh synthetic kernel fixture and does not bind itself to current `EventEnvelope` behavior.

## 2. Source anchors

Primary planning artifacts:
- `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md`
- `pi-chart/memos/v0-5-spec-prep-synthesis-20260503.md`
- `pi-chart/memos/adr-numbering-reconciliation-20260503.md`
- `pi-chart/memos/package-archive-adoption-map-20260503.md`
- `.omx/plans/prd-v0-5-claim-ledger-kernel.md`

Package research inputs:
- `pkg-018:plans/test-spec-018-kernel-predicate-bitemporal-ledger.md`
- `pkg-018:plans/prd-018a-claim-kernel-and-compat.md`
- `pkg-018:plans/prd-018b-predicate-registry-and-validation.md`
- `pkg-018:plans/prd-018c-bitemporal-ledger-and-integrity.md`

Package test rows are research inputs, not accepted repo test obligations until implemented through a reviewed Phase 1 slice.

## 3. Fixture inventory

Phase 1 MUST use generated synthetic/local fixtures only.

| Fixture ID | Fixture | Requirements |
| --- | --- | --- |
| F-KERNEL-01 | Generated patient | Stable synthetic ID such as `patient_kernel`; no `patient_001`; no `patient_002`; no hidden simulator source. |
| F-KERNEL-02 | Generated encounter | One deterministic encounter tied to the generated patient. |
| F-KERNEL-03 | Four shape claims | Exactly one minimum claim for each shape: `context`, `observation`, `interpretation`, `act`. |
| F-KERNEL-04 | Backdated correction | One correction whose valid time precedes its accepted time and changes known-time visibility. |
| F-KERNEL-05 | Ledger chain | At least two sequential ledger entries so hash-chain and head checks can fail meaningfully. |
| F-KERNEL-06 | Predicate registry seed | Minimal seeded predicates for the four shape claims and the correction fixture. |

The fixture generator MUST be deterministic enough for hash, sequence, and known-time assertions.

## 4. Invariant test rows

| ID | PRD slice | Requirement | Verification intent |
| --- | --- | --- | --- |
| T-K0-01 | K0 | Canonicalization identifier is `jcs-rfc8785-pi-chart-v1`. | Assert the kernel exposes or documents the canonicalization string used for hashes. |
| T-K0-02 | K0 | Hash excludes self fields. | Changing `integrity.hash` or `integrity.signature` does not change the computed record hash. |
| T-K0-03 | K0 | Canonical JSON is property-order invariant. | Same clinical object with reordered properties hashes identically. |
| T-K0-04 | K0 | Canonical JSON is value-sensitive. | Changing a clinical value changes the computed hash. |
| T-K1-01 | K1 | Four shapes only. | Claims with shapes outside `context`, `observation`, `interpretation`, `act` are rejected. |
| T-K1-02 | K1 | Minimal claim fields required. | Claim without `id`, `shape`, `predicate`, `subject`, `object`, `time`, `actor`, or `integrity` fails validation. |
| T-K1-03 | K1 | Minimal correction link is explicit. | Correction fixture uses `revises` with mode `corrects` and a `(id, hash)` target. |
| T-K1-04 | K1 | No `EventEnvelope` dependency. | Kernel validation can run against the synthetic claim fixture without current event envelopes. |
| T-K2-01 | K2 | Record hash is stable. | Recomputing hash for the same claim payload returns the same hash. |
| T-K2-02 | K2 | Hash uses clinical payload. | Mutation to `object`, `predicate`, `subject`, valid time, or actor changes the record hash. |
| T-K3-01 | K3 | Append assigns accepted metadata. | Appended claim has store-assigned `accepted_at`, `seq`, and `batch_id`. |
| T-K3-02 | K3 | Sequence is monotonic. | Two appends produce sequence `N` and `N+1`. |
| T-K3-03 | K3 | Entry hash chain validates. | Fresh synthetic ledger passes hash-chain validation. |
| T-K3-04 | K3 | Old-entry mutation is detected. | Mutating an older entry causes validation failure. |
| T-K3-05 | K3 | Head mismatch is detected. | Changing ledger head without matching entries causes validation failure. |
| T-K4-01 | K4 | Predicate registry loads. | Minimal registry fixture loads with no duplicate predicate IDs. |
| T-K4-02 | K4 | Unknown predicate rejected. | Claim using an unregistered predicate fails validation. |
| T-K4-03 | K4 | Shape mismatch rejected. | Claim shape inconsistent with predicate-declared shape fails validation. |
| T-K4-04 | K4 | Predicate object schema applied. | Invalid object for a seeded predicate fails validation. |
| T-K5-01 | K5 | `validAt` filters clinical valid time. | Query excludes claims not valid at the requested valid time. |
| T-K5-02 | K5 | `knownAt` filters accepted knowledge. | Backdated correction is invisible before its accepted time and visible after it. |
| T-K5-03 | K5 | Backdated correction changes current view by known time. | Query before correction acceptance returns original claim; query after correction acceptance returns corrected view. |
| T-K6-01 | K6 | Fixture corpus is tiny and generated. | Fixture inventory contains one generated patient, one encounter, four shape claims, and one correction. |
| T-K6-02 | K6 | Prototype fixture capture avoided. | Test fixtures do not use `patient_001`, `patient_002`, or committed patient directory authority. |

## 5. Negative tests

| ID | Boundary | Negative case | Expected result |
| --- | --- | --- | --- |
| T-NEG-01 | Shape boundary | Claim has a fifth shape. | Validation fails. |
| T-NEG-02 | Predicate boundary | Claim uses missing predicate definition. | Validation fails. |
| T-NEG-03 | Predicate/schema boundary | Claim object violates predicate object schema. | Validation fails. |
| T-NEG-04 | Hash boundary | Old ledger line is edited after append. | Ledger validation fails. |
| T-NEG-05 | Head boundary | Ledger head no longer matches final entry. | Ledger validation fails. |
| T-NEG-06 | Time boundary | Query requests `knownAt` before claim acceptance. | Claim is not visible. |
| T-NEG-07 | Authority boundary | Test or docs cite package ADR 018 as accepted repo ADR 018. | Review/test-doc gate fails. |
| T-NEG-08 | Scope boundary | Implementation tries to migrate current `patients/` data in Phase 1. | Review gate fails. |
| T-NEG-09 | Agent-write boundary | Agent output is accepted as clinical truth without proposal/review. | Review gate fails. |

## 6. Replay/rebuild tests

Full ContextPacket replay belongs to Phase 2. Phase 1 still needs substrate rebuild checks:

| ID | Requirement | Verification intent |
| --- | --- | --- |
| T-REBUILD-01 | Ledger can be re-read deterministically. | Reading the generated ledger twice yields identical claim order and head hash. |
| T-REBUILD-02 | Hashes are reproducible from stored records. | Recompute all record hashes and entry hashes from stored entries. |
| T-REBUILD-03 | Known-time view can be recalculated. | Rebuild point-in-time view from ledger entries without cached projection authority. |

## 7. Boundary tests

| ID | Boundary | Verification intent |
| --- | --- | --- |
| T-BOUNDARY-01 | No package authority leak | Generated docs/test labels use `pkg-018:` or `package ADR 018`; bare `ADR 018` means accepted repo ADR 018 only. |
| T-BOUNDARY-02 | No hidden simulator coupling | Fixtures are generated locally and do not read `pi-sim` internals or hidden state. |
| T-BOUNDARY-03 | No backend commitment | Test fixture does not require production database, service framework, or non-local PHI path. |
| T-BOUNDARY-04 | No access-plane shortcut | Phase 1 tests do not introduce MCP, capture, review, semantic search, or agent append tools. |
| T-BOUNDARY-05 | No current patient migration | Tests do not depend on existing `patients/` directories or patient-specific prototype assumptions. |

## 8. Traceability matrix

| PRD item | Test rows | Source anchors |
| --- | --- | --- |
| K0 canonicalization | T-K0-01 through T-K0-04 | `v0.5-synthesis §8 K0`; `pkg-018:plans/prd-018c-bitemporal-ledger-and-integrity.md` |
| K1 minimal Claim type | T-K1-01 through T-K1-04 | `v0.5-synthesis §8 K1`; `pkg-018:plans/prd-018a-claim-kernel-and-compat.md` |
| K2 hash helper | T-K2-01, T-K2-02 | `v0.5-synthesis §8 K2`; `pkg-018:plans/test-spec-018-kernel-predicate-bitemporal-ledger.md` |
| K3 append-only ledger | T-K3-01 through T-K3-05; T-REBUILD-01, T-REBUILD-02 | `v0.5-synthesis §8 K3`; `pkg-018:plans/prd-018c-bitemporal-ledger-and-integrity.md` |
| K4 predicate registry minimum | T-K4-01 through T-K4-04 | `v0.5-synthesis §8 K4`; `pkg-018:plans/prd-018b-predicate-registry-and-validation.md` |
| K5 minimal bitemporal read | T-K5-01 through T-K5-03; T-REBUILD-03 | `v0.5-synthesis §8 K5`; `pkg-018:plans/test-spec-018-kernel-predicate-bitemporal-ledger.md` |
| K6 tiny fixture corpus | T-K6-01, T-K6-02 | `v0.5-synthesis §8 K6`; `v0.5-conventions §6 L2` |
| Authority and scope gates | T-NEG-07 through T-NEG-09; T-BOUNDARY-01 through T-BOUNDARY-05 | ADR numbering memo; package archive adoption map |

## 9. Command plan for future implementation

The future implementation slice SHOULD define exact commands after inspecting repo scripts. Candidate closeout commands, if available, are:

```bash
npm run typecheck
npm test
npm run check
```

Docs/planning-only closeout may use:

```bash
git status --short
```

This test spec does not run implementation tests now because no implementation is authorized.

## 10. Explicit deferrals

- Relation claim fixtures and reference extraction.
- `inputs[]` support.
- Revision modes beyond `corrects`.
- `validFrom`/`validTo` range queries.
- Migration idempotence for current patient data.
- Signature/key-management tests.
- ContextPacket replay and drift reports.
- Access-plane indexes and semantic search.
- Capture/proposal/review routing.
- Runtime episode cancellation.
- Worklist/playbook/reconciliation tests.

## 11. Acceptance criteria for this test spec

This planning test spec is complete when:

- [x] K0-K6 all have mapped test rows.
- [x] Synthetic fixture inventory is explicit.
- [x] Negative tests cover mutation, authority leakage, forbidden migration, and forbidden direct agent writes.
- [x] Replay/rebuild tests are scoped to Phase 1 substrate only.
- [x] Boundary tests prevent package authority leaks and hidden simulator coupling.
- [x] Traceability maps PRD item to test row to source anchor.
- [x] No source/schema/fixture/package/lockfile/package-archive edits are bundled.

## 12. Delta from PRD and synthesis

| Topic | PRD/synthesis stance | Test-spec stance | Reason | Approval |
| --- | --- | --- | --- | --- |
| Fixture corpus | One generated patient, one encounter, four claims, one correction. | Same, with fixture IDs F-KERNEL-01 through F-KERNEL-06. | Makes K6 testable. | Draft; needs Architect+Critic. |
| Query time | `validAt`/`knownAt` minimum. | Same, with T-K5 rows for before/after accepted correction. | Covers bitemporal proof. | Draft; needs Architect+Critic. |
| Package authority | Package ADRs are research only. | Same, with explicit negative/boundary tests. | Prevents authority leak into implementation. | Draft; needs Architect+Critic. |
| Migration | Deferred. | Same, with negative scope gate. | Keeps Phase 1 synthetic. | Draft; needs Architect+Critic. |

## 13. Non-goals and implementation lock

This test spec does not authorize implementation. No source, schema, fixture, package, lockfile, package-archive, accepted ADR, or patient-data edit should be bundled with this planning artifact.
