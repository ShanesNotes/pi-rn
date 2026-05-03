# Inventory public telemetry contract authority

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-contract-lock/PRD.md`

## What to build

Create a concise inventory of the current public telemetry contract authority and regression evidence without changing schema semantics.

## Acceptance criteria

- [x] Inventory names `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json` as producer-side authority.
- [x] Inventory distinguishes public contract fixtures from ABI authority.
- [x] Inventory lists lane names, paths, schema versions, write/reset semantics, producers, and preferred consumer modes from `.lanes.json`.
- [x] Inventory flags any README/manifest mismatch as follow-up work rather than silently changing semantics.
- [x] Inventory excludes hidden `pi-sim` provider/scenario/validation internals.

## Blocked by

None - can start immediately.

## Comments

- 2026-05-03: Completed inventory in `.scratch/pi-sim-public-telemetry-contract-lock/contract-authority-inventory.md`. Evidence: parsed 10 lanes from `pi-sim/vitals/.lanes.json`; confirmed every lane path appears in `pi-sim/vitals/README.md`; documented fixture directories as regression evidence only; excluded hidden `pi-sim` internals and deferred detailed semantic consistency to issue 02.
