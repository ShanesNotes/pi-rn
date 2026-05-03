# K4 predicate registry minimum

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-v0-5-claim-ledger-kernel/PRD.md`

## What to build

Add the smallest predicate registry seam needed to prevent untyped synthetic kernel claims: seeded predicate loading, duplicate detection, unknown predicate rejection, shape mismatch rejection, and object validation for seeded predicates.

Package reconciliation included from `pkg-018`: predicate registry as the ontology seam, predicate id/version/shape/object schema, duplicate rejection, unknown predicate rejection, object schema validation, and explicit deferral of reference extraction, relation predicates, full legacy coverage, and validator integration with brownfield chart files.

## Acceptance criteria

- [ ] Starts with failing Node tests mapped to T-K4-01 through T-K4-04 and T-NEG-01 through T-NEG-03 in `test-spec.md`.
- [ ] Minimal registry fixture loads with no duplicate predicate ids.
- [ ] Registry rejects duplicate predicate ids.
- [ ] Registry rejects predicate definitions whose declared shape is outside `context`, `observation`, `interpretation`, and `act`.
- [ ] Claim using an unregistered predicate fails validation.
- [ ] Claim shape inconsistent with predicate-declared shape fails validation.
- [ ] Invalid object for a seeded predicate fails validation.
- [ ] Object validation may reuse pi-chart's existing `ajv` / `ajv-formats` dependency for seeded predicate object schemas, or ship a tiny local validator if importing AJV would pull brownfield `EventEnvelope` semantics; net-new dependencies are forbidden.
- [ ] AJV reuse must not import `schemas/event.schema.json` or old event-envelope schema semantics.
- [ ] Seed predicates cover only the Phase 1 synthetic fixture claims and correction fixture unless this issue is explicitly widened during triage.
- [ ] Full predicate-tier policy, relation/cardinality/exclusivity rules, reference extraction, capture routing, legacy event surface coverage, and playbook policy remain deferred.

## Blocked by

- `.scratch/pi-chart-v0-5-claim-ledger-kernel/issues/02-k1-minimal-claim-validation.md`

## Closeout commands

Run from the repository root unless the command itself changes directory:

```bash
cd pi-chart && npm test
cd pi-chart && npm run typecheck
# Run only if this slice affects validation, derived output, fixtures, or whole-chart checks:
cd pi-chart && npm run check
```

## Guardrail application

- Protects: predicate validation as the ontology seam; provenance-rich chart truth without untyped claims.
- Source: ADR 019; workstream PRD K4; `pkg-018:decisions/018-kernel-predicate-bitemporal-ledger.md` D3; `pkg-018:plans/prd-018b-predicate-registry-and-validation.md` predicate registry research.
- Not imported: current profile registry behavior as authority, full legacy predicate seed set, relation predicates, old event schemas, package-internal issue statuses, playbook or capture policy.
- Test proof: failing behavior tests for registry load, duplicate ids, invalid predicate shape, unknown predicate rejection, claim/predicate shape mismatch, and object schema validation.
