# Wire README/manifest check into pi-sim npm test

Status: completed

## Parent

`.scratch/pi-sim-public-telemetry-contract-lock/PRD.md`

## What to build

Add `pi-sim/package.json` scripts so README/manifest consistency and authority-ledger completeness checks run as part of the default `npm test` gate.

## Acceptance criteria

- [x] `test:readme-manifest-consistency` runs the existing Python check from `pi-sim/`.
- [x] `test:authority-ledger` runs the pi-sim rebase grounding ledger check from `pi-sim/`.
- [x] Default `npm test` includes both checks via `test:docs-boundary`.
- [x] Checks remain read-only (no schema or lane semantics changes).

## Blocked by

- `.scratch/pi-sim-public-telemetry-contract-lock/issues/02-lock-readme-manifest-consistency.md` (completed)

## Comments

- 2026-06-11: Wired in `pi-sim/package.json` as `test:docs-boundary` = readme-manifest + authority-ledger; included in default `npm test`.