# Source-dir fixture regression depth

Status: active regression reference
Date: 2026-06-11
Related issue: `.scratch/pi-monitor-public-lane-ingest-depth/issues/01-source-dir-fixture-regression-depth.md`

## Coverage matrix

| Public lane | Fixture cases exercising ingest | Test anchor |
| --- | --- | --- |
| `current.json` | all public-contract cases | `reads_scripted_demo_public_dir`, regression matrix |
| `status.json` | all cases | regression matrix `status.is_some()` |
| `events.jsonl` | scripted-demo, scripted-alarm, provider-unavailable | `reads_scripted_alarm_public_dir`, matrix |
| `timeline.json` + `timeline.jsonl` | all cases with timelines | matrix length equality |
| `encounter/current.json` | scripted-demo | `reads_scripted_demo_public_dir` |
| `assessments/status.json` | scripted-demo | `reads_scripted_demo_public_dir` |
| `assessments/current.json` | scripted-demo | `reads_scripted_demo_public_dir` |
| `waveforms/status.json` | available-waveform, stale-waveform | matrix + stale/available tests |
| `waveforms/current.json` | available-waveform (display), stale-waveform (ignored+warn) | `contract_shaped_available_waveform_windows_are_displayed`, `stale_waveform_current_is_ignored_and_warned` |

## Producer fixture (optional)

`pi-sim/vitals/fixtures/public-contract/live-demo-waveform` — exercised when present by `reads_pi_sim_live_demo_waveform_public_fixture_when_present`.

## Display semantics verified

- Demo waveforms: `sourceKind=demo`, `fidelity=demo`, `synthetic=true`
- Waveform unavailable: explicit compatibility notes, not silent synthesis
- Stale waveform mismatch: `lane_warnings` contains `mismatch`

## Verification

```bash
cd pi-monitor
cargo test -p monitor-ingest source_dir
cargo test --workspace
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py
```

Producer ABI authority remains `pi-sim/vitals/README.md` plus `.lanes.json`. Monitor fixtures are regression evidence only.