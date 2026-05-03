# K5 minimal bitemporal read

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-ledger-claim-ledger-kernel/PRD.md`

## What to build

Implement minimal point-query read semantics over synthetic ledger entries for clinical valid time and accepted known time.

## Acceptance criteria

- [ ] Starts with failing Rust tests mapped to T-K5-01 through T-K5-03, T-NEG-06, and T-REBUILD-03 in `test-spec.md`.
- [ ] `validAt` filters by clinical valid time.
- [ ] `knownAt` filters by accepted knowledge time.
- [ ] Claims accepted after `knownAt` are invisible even when their valid time is before `validAt`.
- [ ] Backdated correction is invisible before its accepted time and visible after it.
- [ ] Query before correction acceptance returns the original claim view.
- [ ] Query after correction acceptance returns the corrected claim view.
- [ ] Replacement/correction only hides a prior claim when the revising claim is itself visible at `knownAt`.
- [ ] Known-time view can be recalculated from ledger entries without cached projection authority.
- [ ] Tests use deterministic synthetic ledger fixtures and do not use current patient directories or brownfield view modules as authority.
- [ ] `validFrom`/`validTo` range semantics, ContextPacket replay/drift reports, `asOf` compatibility adapters, evidence traversal, and current view API changes remain deferred.

## Blocked by

- `.scratch/pi-ledger-claim-ledger-kernel/issues/03-k3-append-only-ledger.md`
- `.scratch/pi-ledger-claim-ledger-kernel/issues/04-k4-predicate-registry-minimum.md`

## Closeout commands

```bash
cd pi-ledger && cargo fmt --all -- --check
cd pi-ledger && cargo test --workspace
cd pi-ledger && cargo clippy --workspace --all-targets -- -D warnings
```

## Guardrail application

- Protects: explicit valid time and known time, disposable derived views, correction by new claim without future-knowledge leakage.
- Source: `pi-ledger/CONTEXT.md`; ADR 001; workstream PRD K5; `pkg-018` D5.
- Not imported: current view parameter changes, `asOf` compatibility adapter, evidence-chain integration, relation claims, current patient fixtures, cached derived projections.
- Test proof: failing Rust behavior tests for `validAt`, `knownAt`, future-known correction invisibility, after-acceptance corrected view, and rebuild from ledger entries.
