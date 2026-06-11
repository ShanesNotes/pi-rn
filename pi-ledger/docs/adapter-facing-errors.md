# Adapter-facing error vocabulary

Status: active adapter-readiness reference
Related deepening issue: `.scratch/pi-ledger-kernel-interface-deepening/issues/06-adapter-facing-error-vocabulary-consistency.md`

Module-local error enums retain ownership. This page names the consistent vocabulary a future Adapter can use to explain **what failed**, **where**, and **why** without collapsing every failure into one generic ledger error.

## Failure layers

| Layer | Typical module | Meaning for adapters |
| --- | --- | --- |
| `claim_structure` | `claim` | Raw Claim JSON failed structural validation before canonicalization. |
| `canonicalization` | `canonical`, wrapped by `claim`/`admission`/`ledger` | Canonical JSON or Record hash computation failed. |
| `canonical_time` | `time`, `query` | Timestamp or Valid time expression is missing or not canonical UTC. |
| `hash_parse` | `hash`, `query`, `ledger` | `sha256:<64hex>` Record or Entry hash parsing failed. |
| `predicate_policy` | `predicates` | Predicate registry rejected shape, object fields, or registration. |
| `patient_scope_admission` | `admission`, `ledger` | Claim patient does not match the target ledger patient. |
| `revision_target_admission` | `admission` | Correction Claim failed target proof against trusted entries. |
| `append_chain_integrity` | `ledger` | Stored sequence, previous link, Record hash, Entry hash, or head failed rebuild validation. |
| `trusted_entry_projection` | `query` | Trusted-entry fact extraction or point-read projection failed. |

Rust classification helpers live in `ledger_core::adapter_diagnosis` (`FailureLayer` plus `*_error_layer` functions). Tests classify variants by layer without brittle full-string matching.

## Module inventory

| Module | Error enum | Adapter-facing? | Notes |
| --- | --- | --- | --- |
| `claim` | `ClaimError` | yes | Structural Claim validation and Validated Claim extraction. |
| `time` | `TimeError` | yes | Canonical UTC and Valid time expression parsing. |
| `hash` | `HashError` | yes | Typed hash parsing only; not append-chain diagnosis. |
| `predicates` | `PredicateError` | yes | Predicate registry and object-field policy. |
| `admission` | `AdmissionError` | yes | Patient scope and revision-target admission proof. |
| `ledger` | `LedgerError` | yes | Append, rebuild, and chain/head integrity. |
| `query` | `QueryError` | yes | Trusted-entry projection and point-read time/hash facts. |
| `fixture` | `FixtureError` | no | Test/example utility only (`test-support` feature). |

## Diagnosis flow (happy path failures)

```text
raw Claim JSON
  -> ClaimError?           (claim_structure / canonicalization / canonical_time / hash_parse)
  -> AdmissionError?       (patient_scope_admission / predicate_policy / revision_target_admission)
  -> LedgerError?          (append_chain_integrity on rebuild or append)
trusted entries
  -> QueryError?           (trusted_entry_projection: canonical_time / hash_parse)
  -> PointReadView
```

## Boundary reminders

- Do not add chart-specific error types or clinician UI copy in `ledger-core`.
- Successful append, admission, revision, Query, and rebuild behavior is unchanged by this vocabulary layer.
- `adapter_diagnosis` classifies errors; it does not replace module-local enums or merge them into one catch-all type.