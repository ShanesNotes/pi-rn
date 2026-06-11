# Deepen source-dir public fixture regression coverage

Status: completed
Type: AFK

## Parent

`.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`

## What to build

Add or tighten future `pi-monitor` regression tests around `--source-dir <vitals-dir>` and fixture-directory replay using producer public contract fixtures plus monitor-only invalid-lane fixtures where needed.

This issue is about consumer coverage. It must not patch producer fixture semantics ad hoc or treat mirrored monitor fixtures as ABI authority.

## Acceptance criteria

- [x] Source-directory ingest tests cover scalar/latest frame, `status.json`, `events.jsonl`, encounter context, assessment status/current, waveform status/current, `timeline.json`, and `timeline.jsonl` where public fixtures expose them.
- [x] Positive waveform display remains covered with demo source labels: `sourceKind=demo`, `fidelity=demo`, and `synthetic=true`.
- [x] Waveform-unavailable and stale/mismatched waveform-current/status cases produce explicit display warnings instead of silent synthesis.
- [x] Tests run against public JSON/JSONL files only and do not import `pi-sim/scripts`, `pi-sim/pulse`, or provider internals.
- [x] Fixture gaps are recorded as producer-contract or monitor-regression follow-ups, not hidden runtime reads.

## Blocked by

Maintainer triage of `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`.

## Closeout commands

```bash
cd pi-monitor
cargo test -p monitor-ingest source_dir
cargo test --workspace
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py
```

## Comments

- 2026-06-11: Added `source_dir_regression_matrix_covers_public_lane_manifest` and optional `reads_pi_sim_live_demo_waveform_public_fixture_when_present` in `monitor-ingest`. Documented matrix in `source-dir-fixture-regression-depth.md`.