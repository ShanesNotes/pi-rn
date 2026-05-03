# Lock README and lane-manifest consistency checks

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-contract-lock/PRD.md`

## What to build

Add or document checks that prove `pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json` describe the same public telemetry Interface.

## Acceptance criteria

- [x] Check covers every lane in `.lanes.json`.
- [x] Check verifies README mentions each public lane path or intentionally documents why it is not consumer-facing.
- [x] Check reports mismatches without changing lane schema semantics in the same slice.
- [x] Check can run from `pi-sim` without sibling project internals.
- [x] Verification command is recorded in the issue comments or follow-up handoff.

## Blocked by

- `.scratch/pi-sim-public-telemetry-contract-lock/issues/01-inventory-contract-authority.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed by adding `.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py` and `.scratch/pi-sim-public-telemetry-contract-lock/readme-manifest-consistency.md`. Verification command from `pi-sim/`: `python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py`; result: 10 lanes checked, README path coverage OK for every lane, mismatches none. No telemetry schema semantics changed.
