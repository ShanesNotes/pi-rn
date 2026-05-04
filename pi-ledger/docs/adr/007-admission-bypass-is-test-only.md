# ADR 007 — Admission bypass is test-only, not public Interface

Date: 2026-05-04
Status: accepted
Decision maker: operator direction during post-K11 architecture grilling.
Related:
- `../../CONTEXT.md`
- `005-append-admission-separates-predicate-policy.md`
- `006-revision-admission-proves-correction-target-existence.md`
- `../../../.scratch/pi-ledger-claim-ledger-kernel/`

## Context

K10 and K11 made normal append paths consume **Append-admissible Claims** for base Claims and **Revision-admissible Claims** for correction Claims. The remaining lower-level append bypass is loudly named, but as a public method it is still visible to future crate consumers and could become an accidental adapter path.

## Decision

Admission bypass append support is test-only, not part of the public adapter-facing `ledger-core` Interface. K12 should remove public lower-level append bypass methods from crate consumers and keep bypass append capability only as `#[cfg(test)] pub(crate)` Append ledger support for trusted kernel-internal construction and negative tests.

Public consumers should append through `append_admissible`, `append_revision_admissible`, or rebuild trusted history through `from_snapshot`. K12 should prove this without adding a compile-fail test dependency: use a lightweight public-interface/source guard plus behavior tests that exercise only safe public append paths.

## Rejected

- Keeping the loud bypass as a public method. This is rejected because loud naming helps reviewers but does not prevent adapter code from depending on the unsafe path.
- Adding a compile-fail test dependency for K12. This is rejected because the workspace has no compile-fail harness today and a source guard plus public behavior tests is sufficient for this narrow Interface decision.
- Refactoring Query revision-target parsing in K12. This is rejected because Query remains a trusted-entry projection; projection cleanup is a separate candidate from public append Interface governance.

## Consequences

- Unit tests may retain bypass construction under test compilation.
- Integration tests and future adapters should see only safe append paths.
- Normal fixtures and examples must continue to teach Append admission and Revision admission, not bypass append.
