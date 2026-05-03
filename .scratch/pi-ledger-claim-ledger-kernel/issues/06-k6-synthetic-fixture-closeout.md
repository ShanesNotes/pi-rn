# K6 synthetic fixture closeout and boundary checks

Status: ready-for-human
Type: AFK
Resolution: implemented in `68409aa`; merge/admin close pending human confirmation.

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Close out the Phase 1 kernel proof with a deterministic synthetic fixture corpus, package reconciliation evidence, and mechanical boundary checks that prevent prototype fixture capture, hidden simulator coupling, package authority leaks, migration creep, direct agent writes, and premature backend/access/runtime expansion.

## Acceptance criteria

- [x] Starts with failing or pending Rust/check rows mapped to T-K6-01, T-K6-02, T-NEG-07 through T-NEG-09, and T-BOUNDARY-01 through T-BOUNDARY-05 in `test-spec.md`.
- [x] Implementation lives in `pi-ledger/crates/ledger-core/src/fixture.rs` for deterministic fixture helpers and Rust coverage; update `lib.rs` only to expose the minimal K6 fixture interface. Any non-Rust mechanical boundary checks must be documented in this issue's closeout evidence rather than hidden in ad hoc scripts.
- [x] Fixture inventory contains one generated patient, one encounter, four shape claims, one correction, at least two ledger entries, and seeded predicates.
- [x] Fixture generator is deterministic enough for stable hash, sequence, known-time, and boundary assertions.
- [x] Fixtures do not use `patient_001`, `patient_002`, committed patient-directory authority, hidden `pi-sim` internals, real PHI, `pi-chart` source layout, or generated cockpit UI assumptions.
- [x] Generated docs/test labels cite archived research packages as `pkg-NNN:<path>`; bare ADR references mean accepted repo ADRs only.
- [x] Mechanical checks reject or flag package ADR authority leakage, current-patient fixture capture, hidden simulator references, Phase 1 migration creep, direct agent-write shortcuts, and accidental `pi-chart/src/claim-ledger` authority.
- [x] Manual closeout confirms no fifth shape, no content-hash-as-only-id, no new global `links.*` fields, no timeline-date files as canonical storage, and no FHIR/openEHR/CAS/internal database commitment.
- [x] Package reconciliation notes list useful `pkg-018` items adopted into K0-K6 and useful package items deferred to later phases: compatibility mappers, relation claims, reference extraction, range queries, migration, ContextPacket, access plane, runtime proposals, and orchestrator worklists.
- [x] Phase 1 does not introduce MCP, capture, review queues, semantic search, agent append tools, production backend selection, relation claims, current patient migration, legal signatures, key management, or external anchoring.
- [x] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

None — K5 bitemporal point reads landed green as commit `b6b1469` on 2026-05-03.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
git status --short
```

## Guardrail application

- Protects: patient isolation, no hidden simulator/oracle truth, disposable derived views, source-authority hygiene, and Phase 1 scope control.
- Source: `pi-ledger` ADR 001; `pi-chart` ADR 020; `docs/architecture/source-authority.md`; workstream PRD K6; workstream future-runtime constraints; package archive adoption map; `pkg-018` through `pkg-024` package archive summaries.
- Not imported: patient_001/patient_002 fixtures, package-internal ADR status, compatibility migration backlog, relation-claim backlog, ContextPacket/access/runtime/orchestrator implementation, hidden simulator internals, FHIR/CAS/backend commitments.
- Test proof: failing or pending checks for deterministic synthetic fixture inventory, no prototype fixture capture, no package authority leak, no hidden simulator coupling, no backend/access shortcut, no migration creep, and no direct agent-write channel.

## Closeout evidence

- Baseline: `cd pi-ledger && cargo test --workspace` — PASS, 63 tests before K6 source edits.
- Red/green summary:
  - RED `t_k6_01_fixture_inventory_is_tiny_and_generated`: missing `phase1_fixture` interface; GREEN added deterministic Phase 1 fixture generator.
  - RED `t_k6_02_fixture_avoids_current_patient_capture`: missing boundary text helper; GREEN added generated-fixture boundary checks.
  - RED `t_neg_07_t_boundary_01_package_citations_do_not_leak_package_adr_authority`: missing package citation surface; GREEN added `pkg-018:<path>` citations only.
  - RED `t_k6_01_fixture_supports_k5_known_time_correction_behavior`: missing query-entry id helper; GREEN proved before/after correction known-time visibility.
- Focused check: `cd pi-ledger && cargo test -p ledger-core fixture::tests` — PASS, 13 K6 fixture/boundary tests.
- Final checks:
  - `cd pi-ledger && cargo fmt --all -- --check` — PASS.
  - `cd pi-ledger && cargo test --workspace` — PASS, 76 tests.
  - `cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings` — PASS.
  - `git status --short` — checked before commit; only K6 files staged for commit, with pre-existing unrelated untracked files preserved.
- Package reconciliation:
  - Adopted from `pkg-018` into K0-K6: stable claim identity, canonical hash, append-only entries, bitemporal valid/known time, predicate registry seed, correction semantics, fixture boundary discipline.
  - Deferred: compatibility mappers, relation claims, reference extraction, range queries, migration, ContextPacket, access plane, runtime proposals, orchestrator worklists.
- Manual confirmations:
  - No fifth shape.
  - No content-hash-as-only-id.
  - No new global `links.*` fields.
  - No timeline-date files as canonical storage.
  - No FHIR/openEHR/CAS/internal database commitment.
  - No direct agent accepted-writes.
  - No current patient migration.
  - No hidden `pi-sim` coupling.

## Review follow-up

- Follow-up review verdict for `68409aa`: COMMENT / MERGEABLE; no CRITICAL or HIGH blockers.
- K6 boundary tests are scoped as generated-fixture payload/citation guards, not whole-repo grep proof. Repo/API-surface boundary enforcement is deferred to later adapter/source-authority work rather than expanding K6.
- The pre-existing untracked `pi-chart/src/claim-ledger/` tree remains explicitly deferred brownfield/shadow-authority evidence; it was not touched, staged, or committed in K6.
