# K1 minimal Claim validation

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-v0-5-claim-ledger-kernel/PRD.md`

## What to build

Define and validate the smallest V0.5 `Claim` shape independently of the current brownfield event envelope. This slice gives later ledger, predicate, and bitemporal slices a stable claim record to accept or reject without depending on prototype schemas.

Package reconciliation included from `pkg-018`: four kernel shapes, minimal claim fields, actor/activity provenance hooks, valid-time/known-time field separation, correction by `revises`, and explicit deferral of `inputs[]`, relation claims, migration, and revision modes beyond `corrects`.

## Acceptance criteria

- [ ] Starts with failing Node tests mapped to T-K1-01 through T-K1-04 in `test-spec.md`.
- [ ] Only four claim shapes are accepted: `context`, `observation`, `interpretation`, and `act`.
- [ ] Validation requires `id`, `shape`, `predicate`, `subject`, `object`, `time`, `actor`, and `integrity`.
- [ ] Validation requires `time.valid` to be exactly one instant or interval representation.
- [ ] K1 validates only `time.valid` and `time.recorded_at`; `time.accepted_at`, `time.seq`, and `time.batch_id` are owned by K3 and MUST be absent from K1 input or ignored by K1 validation.
- [ ] Validation requires correction links, when present, to use `revises` with mode `corrects` and target both `id` and `hash`.
- [ ] Validation rejects revision modes beyond `corrects` in Phase 1.
- [ ] Validation exposes deterministic failure messages or rule tags for missing fields, invalid shape, invalid valid time, invalid correction target, and unsupported revision mode.
- [ ] Validation can run against synthetic claim fixtures without importing or depending on current `EventEnvelope`, `schemas/event.schema.json`, current patients, or legacy compatibility mappers.
- [ ] `inputs[]`, relation claims, predicate reference extraction, current-patient migration, and hidden `pi-sim` coupling remain out of scope and are documented as deferred.

## Blocked by

- `.scratch/pi-chart-v0-5-claim-ledger-kernel/issues/01-k0-k2-canonical-hash.md`

## Closeout commands

Run from the repository root unless the command itself changes directory:

```bash
cd pi-chart && npm test
cd pi-chart && npm run typecheck
# Run only if this slice affects validation, derived output, fixtures, or whole-chart checks:
cd pi-chart && npm run check
```

## Guardrail application

- Protects: provenance on every claim, explicit valid time and known time, correction by new claim, patient isolation by explicit subject.
- Source: `pi-chart/CONTEXT.md`; ADR 019; workstream PRD K1; `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` D1/D2/D5/D10; `pkg-018:plans/prd-018a-claim-kernel-and-compat.md` claim model research.
- Not imported: current `EventEnvelope` type graph, old global `links.*` expansion, compatibility mapper, migration script, FHIR/openEHR shape, current patient fixture assumptions.
- Test proof: failing behavior tests for four-shape allowlist, required fields, valid-time shape, correction target id/hash, rejection of unsupported revision modes, and no `EventEnvelope` dependency.
