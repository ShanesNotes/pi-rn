# K6 synthetic fixture closeout and boundary checks

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Close out the Phase 1 kernel proof with a deterministic synthetic fixture corpus, package reconciliation evidence, and mechanical boundary checks that prevent prototype fixture capture, hidden simulator coupling, package authority leaks, migration creep, direct agent writes, and premature backend/access/runtime expansion.

## Acceptance criteria

- [ ] Starts with failing or pending Rust/check rows mapped to T-K6-01, T-K6-02, T-NEG-07 through T-NEG-09, and T-BOUNDARY-01 through T-BOUNDARY-05 in `test-spec.md`.
- [ ] Fixture inventory contains one generated patient, one encounter, four shape claims, one correction, at least two ledger entries, and seeded predicates.
- [ ] Fixture generator is deterministic enough for stable hash, sequence, known-time, and boundary assertions.
- [ ] Fixtures do not use `patient_001`, `patient_002`, committed patient-directory authority, hidden `pi-sim` internals, real PHI, `pi-chart` source layout, or generated cockpit UI assumptions.
- [ ] Generated docs/test labels cite archived research packages as `pkg-NNN:<path>`; bare ADR references mean accepted repo ADRs only.
- [ ] Mechanical checks reject or flag package ADR authority leakage, current-patient fixture capture, hidden simulator references, Phase 1 migration creep, direct agent-write shortcuts, and accidental `pi-chart/src/claim-ledger` authority.
- [ ] Manual closeout confirms no fifth shape, no content-hash-as-only-id, no new global `links.*` fields, no timeline-date files as canonical storage, and no FHIR/openEHR/CAS/internal database commitment.
- [ ] Package reconciliation notes list useful `pkg-018` items adopted into K0-K6 and useful package items deferred to later phases: compatibility mappers, relation claims, reference extraction, range queries, migration, ContextPacket, access plane, runtime proposals, and orchestrator worklists.
- [ ] Phase 1 does not introduce MCP, capture, review queues, semantic search, agent append tools, production backend selection, relation claims, current patient migration, legal signatures, key management, or external anchoring.
- [ ] Closeout records verification commands and evidence in this issue or final handoff.

## Blocked by

- `.scratch/pi-ledger-claim-ledger-kernel/issues/05-k5-bitemporal-read.md`

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
