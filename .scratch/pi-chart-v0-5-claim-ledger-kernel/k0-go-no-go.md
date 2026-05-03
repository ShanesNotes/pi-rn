# K0 GO/NO-GO handoff — docs consistency validation

> **Superseded gate:** Later on 2026-05-03, the operator moved kernel ownership to `pi-ledger`. This GO applied only to the former `pi-chart/src/claim-ledger/` implementation home. Do not use this file as AFK authorization until the issue paths, package/tooling, and closeout commands are re-triaged for `pi-ledger`.

Date: 2026-05-03
Validated by: `$ralph` docs-only pass
Runtime ledger: `.omx/plans/docs-consistency-validation-before-k0-ledger.md`

## Gate

**GO WITH NOTED NON-BLOCKERS** for K0+K2 TDD against:

- `.scratch/pi-chart-v0-5-claim-ledger-kernel/issues/01-k0-k2-canonical-hash.md`

Do not start K1-K6. Do not mine patient fixtures or old prototype modules except for a narrow lookup explicitly named by the K0 issue.

## What was resolved

- PRD/test-spec mirror statuses now have one top-level `Status:` each.
- `patients/patient_002/` no longer carries fixture-authority wording; it is historical prototype/product-story evidence for later salvage/testing only.
- Archived research package `pkg-NNN:decisions/...` anchors are explicitly package-internal paths, not accepted repo ADRs.
- Brownfield canonical docs now carry V0.5 clean-canvas banners so `EventEnvelope`, `schemas/event.schema.json`, `patients/`, `patient_001`, Synthea/MIMIC, and legacy `decisions/` wording cannot override ADR019/K0 workstream authority.
- Test-spec planning acceptance boxes were checked only where the planning document itself satisfies them; implementation issue boxes remain unchecked.

## Non-blockers to remember

1. Brownfield docs still contain old examples; banners + `source-authority.md` classify them as prototype/historical evidence for K0.
2. `.scratch/pi-chart-v0-5/issues/01-normalize-project-artifact-authority.md` is also `ready-for-agent`, but it is an admin/docs issue, not a kernel implementation issue.
3. Baseline workspace already had broad non-Ralph changes. K0 agents should work from the named issue and avoid interpreting unrelated dirty files as K0 authority.

## Issue gate evidence

- Exactly one kernel implementation issue is ready: `issues/01-k0-k2-canonical-hash.md`.
- Kernel issues `02` through `06` remain `needs-triage`.
- Parent promotion issue `.scratch/pi-chart-v0-5/issues/03-promote-claim-ledger-kernel-plan.md` remains `ready-for-human`.
- FDR-001 through FDR-006 remain resolved.

## K0 implementation constraints

K0+K2 must stay inside the issue scope:

- implementation home: `pi-chart/src/claim-ledger/`;
- no current `EventEnvelope` or `schemas/event.schema.json` retrofit;
- no current `patients/` migration or `patient_001`/`patient_002` fixture capture;
- no hidden `pi-sim` internals;
- archived research packages are cited reference designs only;
- no source/schema/fixture/package/lockfile/patient-data/accepted-ADR/archived-package edits beyond what the K0 issue later authorizes through TDD.

## Further sessions before K0

None required now.

Run `$grill-with-docs` only if a contradiction reappears in active authority surfaces. Run `$deep-interview` only if K0 needs a new product/clinical decision outside FDR-001..006, ADR019, guardrails, and the K0 issue.

## Fresh verification evidence

- `git diff --check` passed with no output.
- `cd pi-chart && npm test` passed: 389 tests, 389 pass, 0 fail.
- `cd pi-chart && npm run typecheck` passed: `tsc --noEmit` exited 0.
- Validation grep checks confirmed one ready kernel issue, six resolved FDR rows, V0.5 banners in canonical docs, and no stale fixture-authority phrase in validation surfaces.
