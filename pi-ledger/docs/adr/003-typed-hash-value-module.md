# ADR 003 — Typed hash values live in a dedicated kernel hash module

Date: 2026-05-03
Status: accepted
Decision maker: operator direction during architecture deepening review.
Related:
- `../../CONTEXT.md`
- `001-reusable-claim-ledger-kernel.md`
- `002-canonical-utc-time-input-invariant.md`
- `../../../.scratch/pi-ledger-claim-ledger-kernel/`

## Context

K0-K7 proved deterministic canonicalization, Claim validation, append-chain validation, bitemporal reads, fixture closeout, and shared time rules. The remaining hash API surface is stringly and spread across modules: `canonical.rs` formats record hashes, `claim.rs` validates correction target hashes, `ledger.rs` formats entry hashes and stores previous/head hashes as raw strings, and `query.rs` compares correction targets as raw strings.

That makes it too easy for future Claim, Ledger, Query, and adapter work to duplicate `sha256:<64 lowercase hex>` validation or blur two different integrity concepts: Record hash as proof of Claim content, and Entry hash as proof of append-chain envelope.

## Decision

Create a dedicated kernel hash module for typed hash values.

- `hash.rs` owns shared `sha256:<64 lowercase hex>` parsing, formatting, validation, and digest-to-prefixed-hash construction.
- `RecordHash` is the typed proof of canonical Claim record content.
- `EntryHash` is the typed proof of a ledger entry envelope and append-chain link.
- `RecordHash` and `EntryHash` should be distinct public value types, even if they share private formatting/parsing helpers.
- `canonical.rs` continues to own JCS/I-JSON canonical bytes and record-hash canonicalization policy, but record-hash computation should return `RecordHash` rather than a raw `String`.
- `claim.rs`, `ledger.rs`, and `query.rs` should consume the typed hash values instead of reimplementing string-shape checks.

## Consequences

- Claim correction links should parse `revises.target.hash` through `RecordHash`.
- Ledger append, rebuild, previous-entry links, and head validation should use `EntryHash` for entry identity and `RecordHash` for stored record identity.
- Query correction hiding should compare typed `(claim id, RecordHash)` targets instead of raw `(String, String)` pairs where practical.
- Public API shape may still expose strings at serialization boundaries, but conversion into kernel operations should pass through typed hash values.

## Rejected

- Keeping `RecordHash` in `claim.rs`. This is rejected because record hashes are kernel identity values used by Claim, Ledger, Query, corrections, and later adapters, not a Claim-only validation detail.
- Keeping entry hash formatting private in `ledger.rs`. This is rejected because entry hashes define append-chain integrity and head validation, and future rebuild/storage code should not duplicate hash-string construction.
- Using one public generic hash type for both record and entry hashes. This is rejected because the two values have the same encoding but different domain meaning and should not be accidentally interchangeable.
