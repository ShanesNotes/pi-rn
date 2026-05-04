# ADR 006 — Revision admission proves correction target existence before append

Date: 2026-05-04
Status: accepted
Decision maker: operator direction during candidate 5 architecture grilling.
Related:
- `../../CONTEXT.md`
- `001-reusable-claim-ledger-kernel.md`
- `003-typed-hash-value-module.md`
- `004-validated-claim-field-authority.md`
- `005-append-admission-separates-predicate-policy.md`
- `../../../.scratch/pi-ledger-claim-ledger-kernel/`

## Context

K10 introduced append admission so normal appends consume an **Append-admissible Claim** rather than raw JSON or a merely **Validated Claim**. ADR 005 explicitly deferred correction target existence and conflict policy because predicate-aware append admission should not become a general correction graph engine.

Current correction validation proves only the shape of `revises.target.id` and `revises.target.hash`. Current point-read behavior hides a visible target when a visible correction points at matching Claim id plus Record hash. That is enough for projection behavior, but it still allows a correction Claim to enter the ledger even when its target does not exist in the current patient ledger. Future adapters should not be able to persist dangling correction references through the normal append path.

## Decision

Correction Claims require **Revision admission** before normal append. A **Revision-admissible Claim** is an Append-admissible correction Claim whose revision target matches an already accepted entry in the same patient ledger by Claim id and Record hash.

Revision admission belongs in the existing Admission module for K11 because it is still append eligibility, not a broad correction graph engine. Base Claims continue to use Append admission only. Correction Claims must flow through Revision admission and then through a revision-admitted append API.

Revision admission proves target identity by inspecting the current ledger/snapshot entry surface supplied by the caller:

- validate the target candidate entry record as a Ledger-acceptable Claim;
- parse the stored candidate `record_hash` as a Record hash;
- recompute the Record hash from candidate record content;
- require recomputed and stored Record hash to match;
- match the correction's `revises.target` by candidate Claim id plus Record hash.

Revision admission does not own whole-chain or head validation. Callers should supply entries from the current patient ledger or a validated snapshot. Snapshot re-read/head validation remains a Ledger concern.

## Rejected

- Letting correction target existence remain query-time-only. This is rejected because the normal append path should not accept dangling correction references.
- Making Query own correction target validation. This is rejected because Query is a trusted-entry projection, not an append-admission authority.
- Creating a separate revision Module for K11. This is rejected because the accepted K11 behavior is append eligibility only; a separate module would imply broader correction graph semantics than currently accepted.
- Implementing conflict policy, replacement policy, clinical visibility requirements, graph-wide correction semantics, or registry-versioned re-audit in K11. Those are separate future decisions.

## Consequences

- K11 should add a Revision-admissible value and admission error cases under the Admission module.
- Normal fixture generation should append base Claims through Append admission and correction Claims through Revision admission.
- The normal correction append API should consume a Revision-admissible Claim.
- Append admission alone should not silently append Claims that carry a revision target.
- Lower-level test/trusted-entry bypass seams may remain only with loud names that state omitted predicate and/or revision admission checks.
