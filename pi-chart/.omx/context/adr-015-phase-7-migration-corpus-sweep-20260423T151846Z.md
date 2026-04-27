## Task statement

Plan ADR 015 Phase 7: final migration-script + corpus-sweep phase for ADRs 009,
010, and 011. Deliver a new `scripts/migrate-v02-to-v03.ts` plus tests, direct
seed/test/example rewrites, and a verification plan that drives the current five
`V-EVIDENCE-01` warnings in `patient_001` to zero without changing validator,
schema, parser, view, or write-policy surfaces beyond the already-approved
Phase 6 state.

## Desired outcome

- Consensus-approved execution plan for a deterministic, idempotent, per-patient
  migration script plus the repo-owned corpus sweep that closes the remaining
  v0.2-shape drift.
- Concrete file boundaries, sub-phase split, verification gates, and watch-items
  for the final ADR 015 implementation phase.

## Known facts / evidence

### Preflight evidence

- `git log --oneline -5` confirms repo tip is `821119c`:
  - `821119c Phase 6 (view updates) + review-pass type promotions (ADR 015)`
- `npm run check` baseline is clean except for exactly **five**
  `V-EVIDENCE-01` warnings, all from:
  - `patients/patient_001/timeline/2026-04-18/events.ndjson:3`
  - event id `evt_20260418T0830_01`
  - bare-string supports:
    1. `evt_20260418T0815_01`
    2. `evt_20260418T0820_01`
    3. `vitals://enc_001?...spo2...`
    4. `vitals://enc_001?...heart_rate...`
    5. `vitals://enc_001?...respiratory_rate...`

### Authoritative ADR / code touchpoints inspected

- `decisions/015-adr-009-011-implementation.md`
  - phase 7 rewrite table
  - phase 7 fixture/seed guidance
  - phase 6 retrospective
- `decisions/009-contradicts-link-and-resolves.md`
  - `addresses` narrowing and `resolves` semantics
- `decisions/010-evidence-ref-roles.md`
  - canonical `EvidenceRef` shape
  - one-release `kind:"vitals"` back-compat
  - `id -> ref` mechanical rewrite guidance
- `decisions/011-transform-activity-provenance.md`
  - `transform` is optional and explicitly **not** backfilled
- `src/evidence.ts`
  - `parseEvidenceRef()` already accepts both v0.2 and canonical forms
  - normalizes `kind:"vitals"` / encounter-bearing or encounterless legacy
    structured vitals refs into canonical `vitals_window`
  - accepts `{kind, id}` for id-like refs by normalizing `id -> ref`
- `scripts/migrate-v01-to-v02.ts`
  - existing migration pattern in repo
  - useful precedent for idempotency tests and staged filesystem operations
- `src/fs-util.ts`
  - reusable atomic file write helper exists

### Repo-scan findings relevant to Phase 7

- Direct seed-corpus edit target:
  - `patients/patient_001/timeline/2026-04-18/events.ndjson`
- Version-bump targets:
  - `pi-chart.yaml`
  - `patients/patient_001/chart.yaml`
- Current-fixture/test helpers still emitting `schema_version: 0.2.0`:
  - `src/test-helpers/fixture.ts`
  - `src/write.test.ts`
  - `src/session.test.ts`
  - `src/read.test.ts`
  - `src/migrate.test.ts`
- Legacy-shape tests/example literals likely needing case-by-case review:
  - `src/evidence.test.ts`
  - `src/validate.test.ts`
  - `src/write.test.ts`
  - `src/views/evidenceChain.test.ts`

## Constraints

- Do not modify:
  - `src/types.ts`
  - `src/evidence.ts`
  - `src/validate.ts`
  - `schemas/event.schema.json`
  - `src/views/*.ts`
  - `src/derived.ts`
  - `src/write.ts`
  - `decisions/*.md`
- Phase 7 adds **no new validator rules**.
- Migration script must be:
  - deterministic
  - idempotent
  - per-patient
  - safe to re-run
  - staged + atomic on success
  - non-destructive on validation failure
- Bare-string supports stay unchanged by the migration script itself per ADR 015;
  the `patient_001` `V-EVIDENCE-01` cleanup is a separate corpus-sweep edit.

## Unknowns / open questions

- Whether any committed non-test example markdown outside the runtime/test corpus
  should be refreshed in this phase if it still shows v0.2 canonical examples.
- Which existing tests should remain on legacy literals as explicit back-compat
  assertions versus being updated to canonical v0.3 authoring shapes.
- Exact CLI surface for the new migrator:
  - positional `<chartRoot> <patientId>` versus flags
  - whether defaulting to all patients should be disallowed to preserve the
    “per-patient” contract

## Likely codebase touchpoints

- New:
  - `scripts/migrate-v02-to-v03.ts`
  - `scripts/migrate-v02-to-v03.test.ts`
- Repo seed/config:
  - `patients/patient_001/timeline/2026-04-18/events.ndjson`
  - `pi-chart.yaml`
  - `patients/patient_001/chart.yaml`
- Test/helper sweep:
  - `src/test-helpers/fixture.ts`
  - `src/evidence.test.ts`
  - `src/validate.test.ts`
  - `src/write.test.ts`
  - `src/views/evidenceChain.test.ts`
  - `src/read.test.ts`
  - `src/session.test.ts`
  - `src/migrate.test.ts`
