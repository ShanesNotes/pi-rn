# K1 minimal Claim validation

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Define and validate the smallest V0.5 `Claim` shape in `ledger-core`, independently of `pi-chart` and the brownfield event envelope. This slice gives later ledger, predicate, and bitemporal slices a stable claim record to accept or reject.

## Acceptance criteria

- [ ] Starts with failing Rust tests mapped to T-K1-01 through T-K1-04 in `test-spec.md`.
- [ ] Only four claim shapes are accepted: `context`, `observation`, `interpretation`, and `act`.
- [ ] Validation requires `id`, `shape`, `predicate`, `subject`, `object`, `time`, `actor`, and `integrity`.
- [ ] K1 validates only `time.valid` and `time.recorded_at`; `time.accepted_at`, `time.seq`, and `time.batch_id` are owned by K3 and MUST be absent from K1 input or ignored by K1 validation.
- [ ] Validation requires `time.valid` to be exactly one instant or interval representation.
- [ ] Validation requires correction links, when present, to use `revises` with mode `corrects` and target both `id` and `hash`.
- [ ] Validation rejects revision modes beyond `corrects` in Phase 1.
- [ ] Validation can run against synthetic claim fixtures without importing or depending on `pi-chart`, `EventEnvelope`, `schemas/event.schema.json`, current patients, or legacy compatibility mappers.
- [ ] `inputs[]`, relation claims, predicate reference extraction, current-patient migration, and hidden `pi-sim` coupling remain out of scope.

## Blocked by

- `.scratch/pi-ledger-claim-ledger-kernel/issues/01-k0-k2-canonical-hash.md`

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Guardrail application

- Protects: provenance on every claim, explicit valid time and known time, correction by new claim, patient isolation by explicit subject.
- Source: `pi-ledger/CONTEXT.md`; `pi-ledger` ADR 001; workstream PRD K1; `pkg-018` D1/D2/D5/D10.
- Not imported: current `EventEnvelope` type graph, old global `links.*`, compatibility mapper, migration script, FHIR/openEHR shape, current patient fixture assumptions.
- Test proof: failing Rust behavior tests for four-shape allowlist, required fields, valid-time shape, correction target id/hash, rejection of unsupported revision modes, and no `pi-chart` dependency.
