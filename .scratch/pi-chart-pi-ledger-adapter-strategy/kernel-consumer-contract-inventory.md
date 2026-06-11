# Kernel consumer contract inventory

Status: active planning reference (not implementation authority)
Date: 2026-06-11
Related issue: `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-kernel-consumer-contract-inventory.md`
Kernel authority: `pi-ledger/docs/ledger-core-public-interface.md`
Service authority: `pi-ledger/docs/adr/009-clinical-truth-service.md`, `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`

## Purpose

Inventory the public `pi-ledger` interface a future `pi-chart` adapter may consume after K0–K12 and kernel-deepening quarantine (issue 07). This is consumer-facing contract evidence, not adapter implementation.

## Promotion gate (still closed)

Adapter **implementation** remains blocked until:

1. Production `PredicateRegistry` ownership is decided (substrate field-spec 03).
2. Canonicalization/hash acquisition is agreed across service/client boundary (field-spec 08).
3. Versioned clinical-truth-service transport contract and conformance vectors are promoted.
4. HITL mechanism-decision issue 04 selects Rust/TypeScript integration path.

Planning and read/projection proofs may proceed against this inventory.

## Ledger facts the chart may rely on

| Fact | Kernel source | Adapter use | Stable? |
| --- | --- | --- | --- |
| Claim id | `claim::ValidatedClaim::id`, `LedgerEntry.record.id` | Chart fact identity, correction targets | yes |
| Content Record hash | `canonical::record_hash`, `LedgerEntry.record_hash` | Tamper evidence, revision `revises.target.hash` | yes |
| Shape | `ValidatedClaim.shape` / Claim `shape` | Maps to chart `factShape` | yes |
| Predicate id | `ValidatedClaim.predicate_id` | Maps to chart `predicateId` | yes (registry is adapter-owned in prod) |
| Subject patient id | `ValidatedClaim.patient_id` | Shard key / patient scope | yes |
| Object payload | `ValidatedClaim` + predicate `RequiredFields` | Typed clinical content | yes per predicate registry |
| Valid time | `time::ValidTimeExpression`, Claim `time.valid` | Occurred/Effective/As-of projections | yes |
| Recorded time | Claim `time.recorded_at` | Charted/Last charted provenance | yes |
| Known time (accepted) | `LedgerEntry.accepted.accepted_at` | Bitemporal `knownAt` reads | yes (store-assigned) |
| Sequence | `LedgerEntry.accepted.seq` | Ordering within patient ledger | yes |
| Batch id | `LedgerEntry.accepted.batch_id` | Append grouping metadata | yes |
| Entry hash | `LedgerEntry.entry_hash` | Append-chain integrity | yes |
| Previous entry hash | `LedgerEntry.previous_entry_hash` | Chain linkage | yes |
| Ledger head | `AppendLedger::head_hash` | Integrity checkpoint | yes |
| Predicate validation result | `PredicateRegistry::validate_validated_claim` | Pre-append policy gate | yes |
| Point-read view | `query::point_read`, `query::TrustedEntryFacts` | Bitemporal chart projections | yes |
| Revision target proof | `admission::RevisionAdmissibleClaim` | Correction lineage | yes |

## Safe consumer API paths (production)

| Need | Public path | Do not use |
| --- | --- | --- |
| Validate Claim | `claim::validate_claim` | Raw JSON field scraping after validation |
| Append base Claim | `AppendAdmissibleClaim::admit` → `append_admissible` | `append_without_predicate_or_revision_admission` |
| Append correction | `RevisionAdmissibleClaim::admit` → `append_revision_admissible` | Admission bypass |
| Point read | `query::point_read` | Re-validate chain inside Query |
| Rebuild history | `from_snapshot` after `snapshot` | Snapshot as write permission |
| Error diagnosis | `adapter_diagnosis::FailureLayer` | String-matching private errors |
| Service transport | `clinical-truth-service` v1alpha1 contract | Private `ledger-core` internals in chart |

## Test/example only (not adapter contracts)

| Item | Gate |
| --- | --- |
| `ledger_core::fixture::*` | `test-support` feature only; issue 07 quarantine |
| `predicates::phase1_registry` | Fixture registry; production adapter loads own registry |
| Admission bypass append | Crate-private test seam only |

## Implementation details chart must not depend on

- Private append helper after admission
- Internal `PredicateRegistry` storage layout
- Query internal JSON pointer helpers (use `TrustedEntryFacts` / service responses)
- Mutating `LedgerEntry` copies as trusted without rebuild validation
- Chart brownfield `EventEnvelope` shape inside kernel

## Missing interface evidence (follow-up in pi-ledger, not chart reimplementation)

| Gap | Owner | Status |
| --- | --- | --- |
| Production `PredicateRegistry` load path | `pi-chart` adapter + service contract | ready-for-human |
| Canonicalization id agreement (`jcs-rfc8785-pi-chart-v1` ↔ kernel) | cross-boundary ADR | ready-for-human |
| Versioned gRPC/UDS service contract promotion | `clinical-truth-service` | partial (v1alpha1 slice exists) |
| Transport-agnostic conformance vectors in chart tests | adapter issue 05 | needs-triage |

## Boundary confirmations

- No `pi-chart` schema imported into `pi-ledger`.
- No hidden `pi-sim` internals in adapter evidence.
- No current patient directory migration in first adapter phase.
- No `pi-agent` direct accepted-write through adapter planning.