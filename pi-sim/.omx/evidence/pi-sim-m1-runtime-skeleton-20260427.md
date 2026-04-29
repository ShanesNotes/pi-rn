# Evidence — pi-sim M1 runtime skeleton

Generated: 2026-04-27

## Verification commands
\n### npm run typecheck

> pi-sim@0.2.0 typecheck
> tsc --noEmit

\n### npm run test:runtime

> pi-sim@0.2.0 test:runtime
> tsx scripts/runtime/test.ts

runtime tests passed
\n### npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals

> pi-sim@0.2.0 sim:run:demo
> tsx scripts/sim-run.ts --scenario vitals/scenarios/scripted_m1_demo.json --duration 30 --dt 10 --no-pacing --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals

scripted run complete: scripted_m1_demo t=30s sequence=4 out=/home/ark/pi-rn/pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals
\n### node -e const fs=require('fs'); const j=JSON.parse(fs.readFileSync('.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json','utf8')); const out={source:j.monitor?.source,state:j.monitor?.runState,seq:j.monitor?.sequence,t:j.t,waveforms:Object.hasOwn(j.monitor??{},'waveforms')}; console.log(JSON.stringify(out)); if (j.monitor?.source !== 'pi-sim-scripted' || j.monitor?.runState !== 'ended' || Object.hasOwn(j.monitor??{}, 'waveforms')) process.exit(1);
{"source":"pi-sim-scripted","state":"ended","seq":4,"t":30,"waveforms":false}
\n### npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/a

> pi-sim@0.2.0 sim:run:demo
> tsx scripts/sim-run.ts --scenario vitals/scenarios/scripted_m1_demo.json --duration 30 --dt 10 --no-pacing --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/a

scripted run complete: scripted_m1_demo t=30s sequence=4 out=/home/ark/pi-rn/pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/a
\n### npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/b

> pi-sim@0.2.0 sim:run:demo
> tsx scripts/sim-run.ts --scenario vitals/scenarios/scripted_m1_demo.json --duration 30 --dt 10 --no-pacing --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/b

scripted run complete: scripted_m1_demo t=30s sequence=4 out=/home/ark/pi-rn/pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/b
\n### node -
deterministic timelines matched (5 frames)
\n### bash -lc rg -n 'from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent' scripts || true
\n### bash -lc git diff --name-only -- ../pi-monitor ../pi-chart
pi-chart/docs/design/pi-agent-connector-contract.md
pi-chart/docs/design/pi-sim-vitals-write-contract.md
pi-chart/docs/plans/kanban-prd-board.md
pi-chart/memos/definitive-fhir-boundary-pi-chart.md
pi-chart/memos/pi-chart-agent-canvas-plan-26042026.md
pi-chart/memos/pi-chart-boundary-adapter-definitive-synthesis.md
pi-chart/memos/pi-chart-vitals-connector-unblock-plan-26042026.md
pi-monitor/Cargo.lock
pi-monitor/Cargo.toml
pi-monitor/README.md
pi-monitor/crates/monitor-core/src/lib.rs
pi-monitor/crates/monitor-ui/src/lib.rs
pi-monitor/crates/pulse-public-frame/src/lib.rs
\n### bash -lc rg -n 'waveforms' '.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json' || true
\n### bash -lc npm run | sed -n '/monitor/p;/pulse/p;/sim:/p'
  monitor
    tsx scripts/monitor.ts
  monitor:shock
    tsx scripts/monitor.ts --scenario vitals/scenarios/hemorrhagic_shock.json
  monitor:sepsis
    tsx scripts/monitor.ts --scenario vitals/scenarios/sepsis_norepi.json
  monitor:ui
    monitor-ui/.venv/bin/python monitor-ui/app.py
  pulse:up
    docker compose -f pulse/docker-compose.yml up -d
  pulse:down
    docker compose -f pulse/docker-compose.yml down
  pulse:logs
    docker compose -f pulse/docker-compose.yml logs -f pulse
  pulse:health
  monitor:pulse
  monitor:pulse
    tsx scripts/monitor.ts
  sim:run
  sim:run:demo
\n### bash -lc git status --short vitals/current.json vitals/timeline.json

## pi-monitor smoke

Command: cd ../pi-monitor && cargo test --workspace
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.45s
     Running unittests src/main.rs (target/debug/deps/monitor_app-d4e3d2a8b377b500)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/monitor_cli-b042eb671c59e7a8)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/monitor_core-f848fa89ee0bd808)

running 8 tests
test tests::formats_sim_time ... ok
test tests::renders_fresh_display_and_hr_tick ... ok
test tests::exposes_waveform_strip_models_when_samples_arrive ... ok
test tests::missing_alarm_feed_is_not_normal ... ok
test tests::stale_offline_and_invalid_are_distinct ... ok
test tests::live_frame_update_changes_display_without_restart ... ok
test tests::suppresses_tick_for_asystole ... ok
test tests::waveform_samples_update_with_frame_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/monitor_ingest-db289cda083cf2c8)

running 3 tests
test tests::missing_file_is_offline ... ok
test tests::parse_failure_is_invalid_candidate_not_offline ... ok
test tests::reads_valid_current_json ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/monitor_ui-5e547175d66ddf3b)

running 2 tests
test tests::html_renders_frame_provided_waveform_svg ... ok
test tests::html_contains_not_chart_truth_and_no_save_affordance ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/pulse_public_frame-bb40ae380ab40464)

running 6 tests
test tests::missing_alarms_means_unavailable ... ok
test tests::parses_legacy_current_and_normalizes_spo2_percent ... ok
test tests::rejects_impossible_spo2 ... ok
test tests::rejects_malformed_monitor_waveform ... ok
test tests::parses_legacy_current_with_monitor_extension ... ok
test tests::parses_target_frame ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests monitor_core

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests monitor_ingest

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests monitor_ui

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests pulse_public_frame

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s


Command: cd ../pi-monitor && cargo run -p monitor-cli -- render --source ../pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.12s
     Running `target/debug/monitor-cli render --source ../pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json`
[2J[H╔══════════════════════════════════════════════════════════════════════════════╗
║ LIVE SIM MONITOR               SIM 00:00:30  STATE FRESH      ║
║ Source: pi-sim-scripted                                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ WAVEFORMS                                    │ NUMERICS                    ║
║ waveform feed unavailable — no synthetic EC… │ HR 89 bpm                   ║
║ [ECG] unavailable                            │ BP/MAP 107/62 (73) mmHg     ║
║ [Pleth] unavailable                          │ SpO2 95 %                   ║
║ [ABP] unavailable                            │ RR 20 /min                  ║
║ ♥ HR tick active                             │ TEMP 37.1 °C                ║
║                                              │ EtCO2 --- mmHg              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Alarms: No active frame-provided alarms                                     ║
║ Rhythm: unavailable                                                         ║
║ Live simulation display · not charted · not part of the medical record       ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Notes

- `git diff --name-only -- ../pi-monitor ../pi-chart` reports pre-existing sibling dirty work from earlier lanes. M1 did not edit those paths; this lane uses path-limited staging.
- `npm run validate` is intentionally not part of M1 verification because M1 proves the no-Pulse runtime path. Pulse command discoverability was verified; Pulse execution remains provider/runtime availability dependent.

## Post-deslop regression verification
\n### npm run typecheck

> pi-sim@0.2.0 typecheck
> tsc --noEmit

\n### npm run test:runtime

> pi-sim@0.2.0 test:runtime
> tsx scripts/runtime/test.ts

runtime tests passed
\n### npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke-post-deslop/vitals

> pi-sim@0.2.0 sim:run:demo
> tsx scripts/sim-run.ts --scenario vitals/scenarios/scripted_m1_demo.json --duration 30 --dt 10 --no-pacing --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke-post-deslop/vitals

scripted run complete: scripted_m1_demo t=30s sequence=4 out=/home/ark/pi-rn/pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke-post-deslop/vitals
\n### node -e const fs=require('fs'); const j=JSON.parse(fs.readFileSync('.omx/evidence/pi-sim-m1-runtime-skeleton-smoke-post-deslop/vitals/current.json','utf8')); const out={source:j.monitor?.source,state:j.monitor?.runState,seq:j.monitor?.sequence,t:j.t,waveforms:Object.hasOwn(j.monitor??{},'waveforms')}; console.log(JSON.stringify(out)); if (j.monitor?.source !== 'pi-sim-scripted' || j.monitor?.runState !== 'ended' || Object.hasOwn(j.monitor??{}, 'waveforms')) process.exit(1);
{"source":"pi-sim-scripted","state":"ended","seq":4,"t":30,"waveforms":false}
\n### bash -lc rg -n 'from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent' scripts || true
\n### bash -lc git status --short vitals/current.json vitals/timeline.json vitals/status.json
\n### bash -lc git diff --check -- package.json README.md vitals/README.md scripts/sim-run.ts scripts/runtime/provider.ts scripts/runtime/clock.ts scripts/runtime/scriptedProvider.ts scripts/runtime/frame.ts scripts/runtime/publisher.ts scripts/runtime/scenario.ts scripts/runtime/test.ts vitals/scenarios/scripted_m1_demo.json .omx/evidence/pi-sim-m1-runtime-skeleton-20260427.md .omx/evidence/pi-sim-m1-runtime-skeleton-deslop-20260427.md

## Post-deslop pi-monitor smoke
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.19s
     Running unittests src/main.rs (target/debug/deps/monitor_app-d4e3d2a8b377b500)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/monitor_cli-b042eb671c59e7a8)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/monitor_core-f848fa89ee0bd808)

running 8 tests
test tests::formats_sim_time ... ok
test tests::exposes_waveform_strip_models_when_samples_arrive ... ok
test tests::missing_alarm_feed_is_not_normal ... ok
test tests::live_frame_update_changes_display_without_restart ... ok
test tests::stale_offline_and_invalid_are_distinct ... ok
test tests::renders_fresh_display_and_hr_tick ... ok
test tests::suppresses_tick_for_asystole ... ok
test tests::waveform_samples_update_with_frame_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/monitor_ingest-db289cda083cf2c8)

running 3 tests
test tests::missing_file_is_offline ... ok
test tests::parse_failure_is_invalid_candidate_not_offline ... ok
test tests::reads_valid_current_json ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/monitor_ui-5e547175d66ddf3b)

running 2 tests
test tests::html_renders_frame_provided_waveform_svg ... ok
test tests::html_contains_not_chart_truth_and_no_save_affordance ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/lib.rs (target/debug/deps/pulse_public_frame-bb40ae380ab40464)

running 6 tests
test tests::missing_alarms_means_unavailable ... ok
test tests::parses_legacy_current_and_normalizes_spo2_percent ... ok
test tests::parses_legacy_current_with_monitor_extension ... ok
test tests::rejects_impossible_spo2 ... ok
test tests::parses_target_frame ... ok
test tests::rejects_malformed_monitor_waveform ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests monitor_core

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests monitor_ingest

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests monitor_ui

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests pulse_public_frame

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.16s
     Running `target/debug/monitor-cli render --source ../pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke-post-deslop/vitals/current.json`
[2J[H╔══════════════════════════════════════════════════════════════════════════════╗
║ LIVE SIM MONITOR               SIM 00:00:30  STATE FRESH      ║
║ Source: pi-sim-scripted                                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ WAVEFORMS                                    │ NUMERICS                    ║
║ waveform feed unavailable — no synthetic EC… │ HR 89 bpm                   ║
║ [ECG] unavailable                            │ BP/MAP 107/62 (73) mmHg     ║
║ [Pleth] unavailable                          │ SpO2 95 %                   ║
║ [ABP] unavailable                            │ RR 20 /min                  ║
║ ♥ HR tick active                             │ TEMP 37.1 °C                ║
║                                              │ EtCO2 --- mmHg              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Alarms: No active frame-provided alarms                                     ║
║ Rhythm: unavailable                                                         ║
║ Live simulation display · not charted · not part of the medical record       ║
╚══════════════════════════════════════════════════════════════════════════════╝
