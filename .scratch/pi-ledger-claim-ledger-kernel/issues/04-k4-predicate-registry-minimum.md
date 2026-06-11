# K4 predicate registry minimum

Status: wontfix
Type: AFK

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Add the smallest predicate registry seam needed to prevent untyped synthetic kernel claims: seeded predicate loading, duplicate detection, unknown predicate rejection, shape mismatch rejection, and object validation for seeded predicates.

## Acceptance criteria

- [ ] Starts with failing Rust tests mapped to T-K4-01 through T-K4-04 and T-NEG-01 through T-NEG-03 in `test-spec.md`.
- [ ] Implementation lives in `pi-ledger/crates/ledger-core/src/predicates.rs` with Rust test coverage; update `lib.rs` only to expose the minimal K4 interface.
- [ ] Minimal registry fixture loads with no duplicate predicate ids.
- [ ] Registry rejects duplicate predicate ids.
- [ ] Registry rejects predicate definitions whose declared shape is outside `context`, `observation`, `interpretation`, and `act`.
- [ ] Claim using an unregistered predicate fails validation.
- [ ] Claim shape inconsistent with predicate-declared shape fails validation.
- [ ] Invalid object for a seeded predicate fails validation.
- [ ] Object validation uses the smallest safe local Rust validation path or dependencies already introduced by earlier `pi-ledger` slices; net-new schema-validation crates require triage.
- [ ] Object validation must not import `pi-chart/schemas/event.schema.json` or old event-envelope schema semantics.
- [ ] Seed predicates cover only the Phase 1 synthetic fixture claims and correction fixture unless this issue is explicitly widened during triage.
- [ ] Full predicate-tier policy, relation/cardinality/exclusivity rules, reference extraction, capture routing, legacy event surface coverage, and playbook policy remain deferred.

## Blocked by

None — K3 append-only ledger was committed green on 2026-05-03.

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Guardrail application

- Protects: predicate validation as the ontology seam; provenance-rich chart truth without untyped claims.
- Source: `pi-ledger` ADR 001; workstream PRD K4; `pkg-018` D3.
- Not imported: current profile registry behavior as authority, full legacy predicate seed set, relation predicates, old event schemas, package-internal issue statuses, playbook or capture policy.
- Test proof: failing Rust behavior tests for registry load, duplicate ids, invalid predicate shape, unknown predicate rejection, claim/predicate shape mismatch, and object validation.
