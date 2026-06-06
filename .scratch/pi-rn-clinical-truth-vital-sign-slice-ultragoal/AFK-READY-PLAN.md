# AFK-ready next ultragoal plan — clinical-truth vital-sign vertical slice

Date: 2026-05-31

## Target result

Move from documentation-only clinical-truth service planning to a narrow, executable, test-first vertical slice for one charted fact family: accepted `vital.sign` observation Claims. The slice must keep Rust/kernel authority for canonicalization, hashes, admission, append order, revision target proofs, and point reads, while `pi-chart` only maps chart fixtures into backend-mediated service requests.

## First slice decision

Chosen first fact family: **vital sign observation**.

Reason: both subprojects already have vital-sign fixtures/helpers, `ledger-core` already has a `vital.sign` predicate in fixture policy, and `pi-chart` has `VitalSample`/vitals tests. This maximizes executable progress while preserving the final readiness gate requirement that the first source slice choose one narrow fact family with explicit Claim identity, idempotency behavior, registry fixture, and retry/conflict semantics.

## Non-negotiable constraints

- No hidden `pi-sim` imports or simulator/oracle state.
- No browser/UI/EHR/`pi-agent` direct clinical-truth service writes.
- No TypeScript canonicalization/hash authority; `pi-chart` may compare Rust-generated vector outputs only.
- No ledger-core dependency on `pi-chart` schemas, patient directories, UI artifacts, or generated chart output.
- No production gRPC/auth/key-management promise in this run; implement transport-agnostic service-core semantics first.
- Every source edit must have targeted tests and final verification.

## Unblockers to surface and prep

1. **Codex goal freshness**: previous aggregate goal may need `/goal clear`; if the hidden goal surface blocks creation, continue using `.omx/ultragoal` ledger and record the blocker rather than losing state.
2. **Registry authority**: add version/hash/content-summary APIs in Rust before service/client tests assume registry behavior.
3. **Golden vectors before adapter runtime**: Rust-generated vectors must exist before any `pi-chart` runtime adapter seam is considered done.
4. **Idempotency semantics**: define and test `client_request_id` duplicate same-payload replay vs duplicate different-payload conflict.
5. **Storage durability**: start with an explicit service storage seam and file/WAL prototype only after in-memory semantics are green.
6. **Boundary tests**: before client implementation, add tests that fail if UI/agent/browser-style code bypasses the backend-mediated adapter seam.
7. **Final quality gate**: verification + ai-slop-cleaner + independent code-reviewer APPROVE + architect CLEAR are required before terminal completion.

## AFK execution posture

- Execute story-by-story in `.omx/ultragoal`; checkpoint after each with fresh evidence.
- Prefer tests first or tests in the same patch for every source story.
- Keep write sets narrow:
  - `pi-ledger/crates/clinical-truth-service/**` for service-core semantics.
  - `pi-ledger/crates/ledger-core/**` only for registry/vector kernel support.
  - `pi-chart/src/clinical-truth/**` and `pi-chart/src/**/*.test.ts` for adapter slice.
  - `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/**` for run evidence.
- If a broad blocker appears, write a blocker artifact and checkpoint failure/review-blocked rather than asking unless human authority is genuinely required.
