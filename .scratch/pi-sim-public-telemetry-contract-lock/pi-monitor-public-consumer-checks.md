# pi-monitor public consumer checks

Status: needs-triage
Date: 2026-05-03
Parent issue: `.scratch/pi-sim-public-telemetry-contract-lock/issues/03-pi-monitor-public-consumer-checks.md`

## Purpose

These checks prove `pi-monitor` can consume `pi-sim` public telemetry as a display-only Module without importing hidden simulator internals, touching `pi-chart` internals, or writing producer/chart/patient truth.

## Runnable check

Run from `pi-monitor/`:

```bash
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py
```

Machine-readable form:

```bash
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py --json
```

## What it verifies

- Uses producer public fixtures under `../pi-sim/vitals/fixtures/public-contract/**`:
  - `scripted-demo/`
  - `scripted-alarm/`
  - `provider-unavailable/`
  - `live-demo-waveform/`
- Runs `monitor-cli replay-dir` against public fixture directories for scalar/latest-frame, public status/freshness, event/alarm, and explicit waveform-unavailable behavior.
- Runs `monitor-cli render --source-dir` against the public live-demo waveform fixture for positive waveform display labels.
- Scans `pi-monitor/crates/**/*.rs` and `Cargo.toml` files for forbidden coupling tokens such as hidden `pi-sim` source paths, `pi-chart`, `pi-agent`, or forbidden write intent to chart/patient/producer truth.
- Reports missing fixtures or boundary findings as failures; it does not patch fixtures or schema semantics.

## Current result

```text
pi-monitor public consumer check
fixture root: /home/ark/pi-rn/pi-sim/vitals/fixtures/public-contract
- scripted-demo: 6 evidence strings matched
- scripted-alarm: 5 evidence strings matched
- provider-unavailable: 5 evidence strings matched
- live-demo-waveform: 5 evidence strings matched
boundary files scanned: 13
boundary findings: none
```

## Minimum behavior coverage

| Concern | Evidence |
| --- | --- |
| Scalar/latest frame | `scripted-demo` replay output includes HR/BP/MAP numeric display. |
| Status/freshness | Public status lane output includes `runState=ended`; provider-unavailable output includes `runState=unavailable`. |
| Event/alarm display | `scripted-alarm` output includes `MAP_LOW` and `SPO2_LOW`; provider-unavailable output includes `PROVIDER_UNAVAILABLE`. |
| Explicit waveform-unavailable behavior | `scripted-demo`, `scripted-alarm`, and `provider-unavailable` output include `waveform feed unavailable` with public lane reasons. |
| Positive waveform display | `live-demo-waveform` output includes `waveform feed available`, `sourceKind=demo`, `fidelity=demo`, and `synthetic=true`. |
| Display-only boundary | Output includes `not charted`; boundary scan finds no forbidden coupling/write tokens. |

## Fixture coverage notes

No missing public producer fixture coverage was found for this minimum check set. The existing monitor-only `stale-waveform/` fixture remains a monitor regression case for invalid waveform-current/status mismatch; it is not promoted to producer ABI authority by this issue.

## Non-goals

- No public telemetry schema semantics changed.
- No hidden `pi-sim` provider/runtime/scenario/validation internals inspected as consumer inputs.
- No `pi-chart` internals or chart writes added.
- No fixture files patched ad hoc.
