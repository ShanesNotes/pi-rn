# ADR 005 — Append admission separates predicate policy from append-chain storage

Date: 2026-05-04
Status: accepted
Decision maker: operator direction during candidate 4 architecture grilling.
Related:
- `../../CONTEXT.md`
- `001-reusable-claim-ledger-kernel.md`
- `003-typed-hash-value-module.md`
- `004-validated-claim-field-authority.md`
- `../../../.scratch/pi-ledger-claim-ledger-kernel/`

## Context

K0-K9 proved structural Claim validation, canonicalizability, typed hashes, patient-scoped append-chain validation, predicate registry checks, bitemporal reads, and `ValidatedClaim` as the Claim field authority. Current fixture code performs predicate validation before append, but `AppendLedger::append` itself only requires a Ledger-acceptable Claim and patient-scope checks. That leaves a tempting path where future adapters could append a structurally valid and hashable Claim that bypasses predicate policy.

## Decision

Append admission is a distinct kernel seam. A **Ledger-acceptable Claim** remains the structural and canonicalizable/hashable Claim boundary. An **Append-admissible Claim** is stricter: it is a `ValidatedClaim` proven eligible for a specific patient-scoped ledger after patient-scope and predicate-registry checks pass.

K10 should introduce a small `admission.rs` module that owns the `AppendAdmissibleClaim` value and `AdmissionError`. The admission function should consume `&ValidatedClaim`, a target ledger patient id, and a `PredicateRegistry`; it should not consume raw JSON and should not make `AppendLedger` own the registry. `AppendLedger` should expose `append_admissible(&AppendAdmissibleClaim)` as the preferred append path. The current raw or merely validated append path should be removed as the main interface or renamed with explicit bypass language such as `without_predicate_admission`; fixtures and normal tests should use the admission path so examples do not teach predicate bypass.

Snapshot re-read validation remains a chain-integrity check. Predicate-admission re-audit against a registry is separate until predicate registry versioning exists and is deferred out of K10. Correction target existence and conflict policy are also deferred; K10 admission covers patient scope plus predicate policy, not correction graph semantics.

## Rejected

- Making `AppendLedger` silently own a `PredicateRegistry`. This is rejected because the registry is ontology/predicate policy, while the append ledger owns patient-local ordering, store metadata, record hashes, entry hashes, previous-entry links, and head validation.
- Treating `validate_claim` success as sufficient for append. This is rejected because a hashable Claim can still use an unregistered predicate or violate predicate object policy.
- Making `from_snapshot` depend on the current predicate registry. This is rejected until predicate registry versioning exists, because otherwise old ledgers could become unreadable when policy evolves.
- Expanding K10 into correction target existence or conflict semantics. Correction graph policy is a separate admission problem.
