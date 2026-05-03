# Read-only claim translation proof

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

5, 7, 8, 9, 11, 17, 18, 27, 28, 29

## What to build

Add the first read-only translation path from a ledger claim into a chart-visible clinical concept. This slice should prove that `pi-chart` can understand ledger-backed clinical facts without pushing `EventEnvelope`, patient layout, or UI vocabulary back into `pi-ledger`.

## Acceptance criteria

- [ ] Starts with failing chart-side tests for one synthetic ledger claim shape translated into a chart-visible read concept.
- [ ] Preserves claim id, hash, shape, predicate, subject, object, actor/provenance, valid time, recorded time, accepted time when present, sequence when present, and correction link when present.
- [ ] Keeps translation read-only; it must not append accepted clinical truth or mutate patient files.
- [ ] Treats brownfield `EventEnvelope` compatibility as consumer-side translation only.
- [ ] Produces deterministic, explainable errors for malformed or unsupported ledger claim input.
- [ ] Does not implement full chart migration, broad UI integration, predicate authoring, FHIR/openEHR export, or agent write policy.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/05-ledger-golden-vector-compatibility-harness.md`

## Closeout commands

```bash
cd pi-ledger && cargo test --workspace
cd pi-chart && npm test
cd pi-chart && npm run typecheck
cd pi-chart && npm run check
```
