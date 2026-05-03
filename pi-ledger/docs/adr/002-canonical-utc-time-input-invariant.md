# ADR 002 — Canonical UTC time is a kernel input invariant

Date: 2026-05-03
Status: accepted
Decision maker: operator direction during architecture deepening review.
Related:
- `../../CONTEXT.md`
- `001-reusable-claim-ledger-kernel.md`
- `../../../.scratch/pi-ledger-claim-ledger-kernel/`

## Context

K0-K6 proved the reusable claim-ledger kernel with deterministic canonicalization, Claim validation, append-only ledger entries, predicate validation, bitemporal point reads, and generated fixture coverage.

During K5, query inputs and ledger entry timestamps were tightened to canonical UTC strings in `YYYY-MM-DDTHH:MM:SSZ` form. K1 Claim validation still accepted `time.valid.*` and `time.recorded_at` as arbitrary strings, and K3 `StoreClock` supplied accepted times as strings. That left an architectural mismatch: a Claim could be structurally valid and hashable, but later fail bitemporal point reads because its time strings were not comparable under the kernel's deterministic timestamp rules.

The kernel must preserve the distinction between valid time, recorded time, and known time while avoiding adapter-local timezone policy inside cryptographic ledger identity.

## Decision

`pi-ledger` treats canonical UTC time as a kernel input invariant.

- A Ledger-acceptable Claim must use canonical UTC timestamps for valid time and recorded time.
- Store-assigned accepted time, which defines known-time visibility, must also use canonical UTC timestamp form.
- The kernel rejects offsets, local timestamps, fractional seconds, timezone names, and other non-canonical timestamp forms instead of normalizing them.
- Consumer adapters, such as `pi-chart`, own adapter-local timestamp normalization before data enters the claim-ledger kernel.
- A dedicated time Module should own the shared timestamp and valid-time expression rules used by Claim validation, Append ledger accepted-time assignment, and Query point reads.
- `time.recorded_at` remains recorded provenance time and is not ledger known time; only store-assigned accepted time controls known-time visibility.

## Consequences

- K1 Claim validation should reject non-canonical `time.valid.instant`, `time.valid.interval.start`, `time.valid.interval.end`, and `time.recorded_at`.
- K3 Append ledger should reject non-canonical store-assigned accepted times before creating entries.
- K5 Query should reuse the same time Module rather than owning timestamp validation privately.
- Adapters must normalize source-system timestamps before calling kernel validation or append interfaces.
- The kernel remains deterministic and avoids daylight-saving, timezone, offset, and source-system interpretation policy.

## Rejected

- Normalizing offsets or local timestamps inside `pi-ledger`. This is rejected because timezone interpretation is adapter/source-system policy, not cryptographic kernel identity policy.
- Keeping timestamp validation only in Query. This is rejected because a Ledger-acceptable Claim must be queryable and hashable without later timestamp-shape surprises.
- Moving `StoreClock` into the time Module. This is rejected because `StoreClock` is a store-authority seam for append behavior; the time Module owns time values and rules, not ledger append sequencing.

## Non-goals

- This ADR does not introduce production clock or backend selection.
- This ADR does not normalize legacy `pi-chart` patient timestamps.
- This ADR does not add timezone conversion, offset support, leap-second support, fractional-second support, or adapter compatibility mappers.
- This ADR does not change valid-time / known-time correction semantics beyond sharing canonical timestamp rules.
