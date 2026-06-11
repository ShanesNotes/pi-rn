# Define pi-monitor public consumer checks

Status: completed
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-contract-lock/PRD.md`

## What to build

Define the minimum `pi-monitor` checks that prove display-only public telemetry consumption against `pi-sim` fixtures and lane semantics.

## Acceptance criteria

- [x] Checks use public files/fixtures under `pi-sim/vitals/` only.
- [x] Checks assert `pi-monitor` does not write chart truth, simulator state, patient truth, or `vitals.jsonl`.
- [x] Checks cover scalar/latest frame, status/freshness, event/alarm display, and explicit waveform-unavailable behavior.
- [x] Checks do not import hidden `pi-sim` internals or `pi-chart` internals.
- [x] Any missing fixture coverage is recorded as a follow-up fixture issue, not patched ad hoc.

## Blocked by

- `.scratch/pi-sim-public-telemetry-contract-lock/issues/01-inventory-contract-authority.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed by adding `.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py` and `.scratch/pi-sim-public-telemetry-contract-lock/pi-monitor-public-consumer-checks.md`. Verification command from `pi-monitor/`: `python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py`; result: producer public fixtures checked for scripted-demo, scripted-alarm, provider-unavailable, and live-demo-waveform; boundary files scanned: 13; boundary findings: none. No schema semantics or hidden internals changed.
