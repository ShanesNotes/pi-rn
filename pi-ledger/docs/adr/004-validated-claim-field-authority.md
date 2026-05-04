# ADR 004 — Validated Claim is the Claim field authority

Date: 2026-05-03
Status: accepted
Decision maker: operator direction during architecture deepening review.
Related:
- `../../CONTEXT.md`
- `001-reusable-claim-ledger-kernel.md`
- `002-canonical-utc-time-input-invariant.md`
- `003-typed-hash-value-module.md`
- `../../../.scratch/pi-ledger-claim-ledger-kernel/`

## Context

K0-K8 proved canonicalization, typed time values, typed hash values, Claim validation, append-chain validation, predicate validation, query behavior, and fixture closeout. Claim fields are still re-read from raw `serde_json::Value` in multiple modules: Claim validation reads id/shape/time/revision fields, Ledger re-reads patient id, Query re-reads id/time/revision fields, and Predicate validation re-reads predicate/shape/object fields.

That spread makes it easy for field rules to drift and for later adapter work to treat arbitrary JSON as if it were a Ledger-acceptable Claim.

## Decision

`ValidatedClaim` is the kernel authority for extracting Claim fields after validation.

- K9 should deepen `ValidatedClaim` with accessors for stable Claim fields such as id, shape, predicate, patient id, valid time, recorded time, revision target, and raw record.
- `ValidatedClaim` accessors should be backed by borrowed or typed values captured during validation rather than by repeated JSON pointer parsing.
- Ledger, Predicate, and append-time code should consume `ValidatedClaim` instead of independently reinterpreting Claim JSON where validation has already occurred.
- The kernel should not introduce a separate public raw `ClaimView` as the primary field authority.
- K9 should focus on Claim, Ledger, Predicate, and append-time paths; Query over already validated ledger entries may keep a narrow trusted-entry read path where necessary, but that path is not the general Claim authority.

## Rejected

- Creating a general raw JSON `ClaimView` as the main extraction interface. This is rejected because it would make unvalidated JSON look like a first-class Claim and would weaken the Ledger-acceptable Claim boundary.
- Leaving each module to re-read Claim fields independently. This is rejected because field semantics for id, predicate, patient, time, and revision links would keep drifting across Claim, Ledger, Query, and Predicate code.
