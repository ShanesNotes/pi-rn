# K5 minimal bitemporal read

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-v0-5-claim-ledger-kernel/PRD.md`

## What to build

Implement minimal point-query read semantics over synthetic ledger entries for clinical valid time and accepted known time. The slice proves that a backdated correction is invisible before it is accepted and visible after it is known, without changing brownfield view APIs or cached projection authority.

Package reconciliation included from `pkg-018`: `validAt`/`knownAt` query minimum, known-time safety, correction visibility by accepted time, rebuildability from ledger entries, and explicit deferral of `validFrom`/`validTo`, `asOf` compatibility adapters, evidence-chain/view integration, and relation-claim migration.

## Acceptance criteria

- [ ] Starts with failing Node tests mapped to T-K5-01 through T-K5-03, T-NEG-06, and T-REBUILD-03 in `test-spec.md`.
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

- `.scratch/pi-chart-v0-5-claim-ledger-kernel/issues/03-k3-append-only-ledger.md`
- `.scratch/pi-chart-v0-5-claim-ledger-kernel/issues/04-k4-predicate-registry-minimum.md`

## Closeout commands

Run from the repository root unless the command itself changes directory:

```bash
cd pi-chart && npm test
cd pi-chart && npm run typecheck
# Run only if this slice affects validation, derived output, fixtures, or whole-chart checks:
cd pi-chart && npm run check
```

## Guardrail application

- Protects: explicit valid time and known time, disposable derived views, correction by new claim without future-knowledge leakage.
- Source: `pi-chart/CONTEXT.md`; ADR 019; workstream PRD K5; `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` D5; `pkg-018:plans/prd-018d-query-and-relation-migration.md` bitemporal query research, limited to Phase 1 point-query minimum.
- Not imported: current view parameter changes, `asOf` compatibility adapter, evidence-chain integration, relation claims, current patient fixtures, cached derived projections.
- Test proof: failing behavior tests for `validAt`, `knownAt`, future-known correction invisibility, after-acceptance corrected view, and rebuild from ledger entries.
