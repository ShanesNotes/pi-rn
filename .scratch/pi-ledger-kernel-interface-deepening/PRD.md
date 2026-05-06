# PRD: pi-ledger kernel Interface deepening before adapters

Status: needs-triage
Program status: proposed next `pi-ledger` refinement phase after K12.
Recommended first slice: `01-ledger-core-public-interface-inventory-and-adapter-boundary-examples.md`.
Related decision: `pi-ledger/docs/adr/008-kernel-public-interface-inventory-before-adapters.md`.

## Problem Statement

`pi-ledger` now has a proven claim-ledger kernel from K0 through K12: canonical Claim content, typed hash values, canonical UTC time, append-only ledger history, bitemporal reads, Append admission, Revision admission, and a public append Interface that no longer exposes the Admission bypass.

The next risk is not that the admission work was fruitless. The next risk is that future adapter work, especially the `pi-chart` v0.5 rebase, learns the kernel through scattered public Rust symbols and test patterns instead of a small, intentional Interface. That would make the kernel harder for clinical-agent workflows to trust, harder for future agents to modify safely, and more likely to regain chart-specific assumptions by accident.

From a clinician perspective: the ledger has the right safety bones. The next phase should make its safe use obvious, boring, and hard to misuse before clinical workflow adapters start depending on it.

## Solution

Run a narrow architecture-deepening phase that improves **Depth**, **Locality**, and **Leverage** without expanding clinical policy or coupling `pi-ledger` to `pi-chart` internals.

The phase should prioritize these outcomes:

1. Publish a `ledger-core` public **Interface** inventory that names what future **Adapters** may call, what is trusted rebuild support, and what remains test-only.
2. Consolidate deterministic synthetic Claim fixtures so tests and examples stop copying Claim JSON details across modules.
3. Make the admission proof lifecycle clinician-readable: Ledger-acceptable Claim → Validated Claim → Append-admissible Claim → Revision-admissible Claim.
4. Deepen Query as a trusted-entry projection **Module** without making it own Admission decisions.
5. Clarify the trusted-history rebuild **Seam** around snapshots and `from_snapshot`.
6. Align adapter-facing error vocabulary while preserving current module-local error ownership.

This is not a broad rewrite. Each issue should preserve external behavior unless its acceptance criteria explicitly prove that a safer Interface shape is required.

## User Stories

1. As a clinician-founder, I want the claim-ledger kernel to stay understandable, so that I can judge whether its complexity supports clinical trust rather than engineering ceremony.
2. As a future `pi-chart` adapter author, I want one public Interface inventory, so that I do not infer safe usage from scattered tests or internal helpers.
3. As a future agent author, I want the safe append path to be obvious, so that an AI worker cannot accidentally write clinical truth without admission proof.
4. As a patient-safety reviewer, I want correction Claims to keep requiring target proof, so that corrections cannot point at nonexistent or mismatched prior content.
5. As a kernel maintainer, I want Query cleanup to stay projection-only, so that point reads do not become hidden admission or chain-validation logic.
6. As a storage/rebuild maintainer, I want the snapshot rebuild seam to be explicit, so that trusted history can be reloaded without weakening append admission.
7. As an adapter debugger, I want consistent failure vocabulary, so that a rejected Claim can be explained as a validation, predicate, patient-scope, revision-target, hash, or rebuild failure.
8. As a test author, I want deterministic fixture helpers, so that behavior tests focus on clinical ledger behavior rather than repeated JSON shape details.
9. As a future workflow designer, I want ledger terms to match the domain glossary, so that clinical review language and code review language do not drift apart.
10. As an AFK coding agent, I want small issues with clear blocked-by relationships, so that I can complete one refinement without touching chart source, patient fixtures, or hidden simulator internals.
11. As a reviewer, I want every refinement to preserve K0-K12 behavior, so that architecture cleanup does not become feature churn.
12. As a future port/binding author, I want public examples to use only the safe Interface, so that a TypeScript, WASM, CLI, or chart adapter can copy the right pattern.
13. As a maintainer, I want no sacred cows in the current Implementation, so that shallow seams can be replaced when tests prove a deeper Module is better.
14. As a project lead, I want this work captured as PRD plus issues, so that other agents and humans can see why the next work is refinement, not a detour.
15. As a boundary reviewer, I want `pi-ledger` to remain independent from `pi-chart`, `pi-agent`, and hidden `pi-sim`, so that the kernel remains reusable.

## Implementation Decisions

- This phase is a `pi-ledger` kernel refinement phase, not `pi-chart` adapter implementation.
- ADR 008 records the durable decision that public Interface inventory is the first adapter-readiness refinement after K12.
- The first implementation slice should inventory the public Interface before changing deeper internals.
- The public Interface inventory should distinguish safe consumer APIs, trusted rebuild APIs, test-only seams, and not-yet-promised internals.
- Deterministic fixtures should be centralized for tests/examples, but this phase should not add a production Claim builder unless a later issue proves the need.
- Fixture export quarantine is a pre-adapter gate: before any `pi-chart` or other Adapter treats `ledger-core` as production-facing API, close `issues/07-fixture-export-quarantine-and-adapter-api-boundary-tests.md`.
- Query may get a deeper projection value or helper, but Query must remain a trusted-entry projection and must not own Append admission, Revision admission, predicate policy, or whole-chain validation.
- Snapshot rebuild cleanup should deepen the rebuild Seam without making snapshot re-read perform predicate registry re-audit.
- Error vocabulary should be made consistent for adapter-facing diagnosis without flattening all module-local errors into one generic ledger error.
- All work must use the `pi-ledger` glossary terms: Claim ledger kernel, Ledger-acceptable Claim, Validated Claim, Append-admissible Claim, Revision-admissible Claim, Append ledger, Record hash, Entry hash, Valid time, Recorded time, Known time, Adapter.
- No issue in this phase may import chart brownfield source, chart patient directories, generated UI artifacts, hidden simulator internals, or `pi-agent` runtime code.

## Testing Decisions

- Preserve the K0-K12 regression suite with `cargo test --workspace` in `pi-ledger`.
- For code slices, start with behavior or public-Interface tests that fail for the specific risk being removed.
- Prefer public examples and module-level tests over tests that lock private Implementation details.
- Fixture-locality work should prove existing public examples and query/admission tests still use safe admission paths.
- Query projection work should prove point-read behavior, valid-time/known-time behavior, and correction visibility remain unchanged.
- Snapshot seam work should prove rebuild/head validation behavior remains unchanged and bypass append does not become public again.
- Error-vocabulary work should test error classification without brittle full-string matching.
- Closeout for code changes should run `cargo fmt --all -- --check`, `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, and `git diff --check` where applicable.
- Documentation-only issue closeout should at minimum verify file paths, links, status labels, and no unintended source changes.

## Out of Scope

- `pi-chart` v0.5 rebase implementation.
- Any direct dependency from `pi-ledger` to `pi-chart`, chart patient fixtures, chart UI, brownfield `EventEnvelope`, generated artifacts, or package archives.
- Any dependency from `pi-ledger` to hidden `pi-sim` internals or `pi-agent` runtime code.
- New clinical correction conflict policy, replacement policy, latest-correction-wins behavior, or clinical visibility policy.
- Predicate registry versioning or historical predicate-policy re-audit.
- Production storage backend selection.
- FHIR, openEHR, signatures, key management, blockchain/CAS anchoring, external repository extraction, or write-authority workflow policy.
- A broad renaming/rewrite of the kernel without a narrow failing regression.

## Further Notes

Best first move: public Interface inventory. It gives the other `pi-chart` rebase agent a clean adapter boundary without requiring this agent to touch chart code.

Second-best move after that: fixture locality, because it lowers the cost and risk of the deeper Query and snapshot seam refactors.

Pre-adapter gate: close Issue 07 before any Adapter imports `ledger-core` as production API. Fixture helpers are teaching props until that boundary is hardened.

This phase should be allowed to delete or simplify current code if tests prove the Interface stays safe. There are no sacred cows, but there is one boundary: do not make the kernel easier to misuse in clinical truth paths.
