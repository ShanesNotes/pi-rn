# pi-rn

pi-rn is a research workspace for a simulated bedside workflow. It holds a hidden patient simulator, a monitor display, a file-based chart, and a small agent scaffold. The patients are synthetic.

This is not a medical device, not a hospital record system, and not for use with real patients.

## What this project is

Four directories, with a hard boundary between them:

- [`pi-sim/`](pi-sim/README.md) builds a synthetic patient encounter and publishes observations as JSON files.
- [`pi-monitor/`](pi-monitor/README.md) draws those public observations as a bedside-style monitor. It does not write the chart.
- [`pi-chart/`](pi-chart/README.md) stores a chart as files: events, vitals, notes, and generated summaries.
- [`pi-agent/`](pi-agent/README.md) is a local scaffold for the Pi coding agent. It does not call the chart or the simulator.

The simulator may keep physiology that a clinician would not see directly. The monitor and the chart are supposed to see only published observations, such as monitor readings, assessment findings, orders, results, notes, and handoff. That split is the point of the layout. The agent is not connected to it yet. A short boundary note is in [`AGENTS.md`](AGENTS.md).

## Why it matters

At the bedside, a nurse works from the monitor, the chart, and a hands-on assessment. Those sources can disagree, arrive late, or leave gaps. The body's underlying state is not on the screen. This repo is a place to study that limit with synthetic cases. Hidden simulator state stays inside `pi-sim`. Anything a monitor, a chart, or a future agent uses has to come through an explicit public output.

Charting has a second practical problem. The same fact is often written again into a flowsheet, a progress note, and a shift handoff. `pi-chart` stores a claim once, with who wrote it, when it applies, where it came from, and which other claims it supports or closes. Review functions are queries over that record. One of them, `memoryProof`, is meant to answer what changed, why it mattered, what evidence supports it, what is still uncertain, and what the next shift should watch. The function is in the code. The checked-in charts do not yet pass every test written for it.

The chart work targets six ordinary parts of a nursing record. The accepted direction is [ADR 016](pi-chart/decisions/016-broad-ehr-skeleton-clinical-memory.md), with notes in the [broad EHR skeleton](pi-chart/clinical-reference/broad-ehr-skeleton.md):

1. Flowsheets and vitals.
2. Nursing assessment.
3. Notes and narrative charting.
4. Orders, medications, and interventions.
5. Labs and diagnostics.
6. Care plan and handoff.

That list is a research target for clinical memory. It is not a full electronic health record.

## How it is built

Languages and runtimes:

- TypeScript on Node.js for `pi-chart`, the `pi-sim` harness, and the `pi-agent` scaffold.
- Rust 2024 edition for `pi-monitor`. [`pi-monitor/Cargo.toml`](pi-monitor/Cargo.toml) sets `rust-version` to 1.95.
- Python, standard library only, for the optional Pulse shim in `pi-sim/pulse/shim/`.
- Docker, optional, for the Kitware Pulse Physiology Engine 4.3.1 sidecar.

There is no root package. Each directory installs and runs on its own. `_imports/` holds earlier specs and an older chart snapshot. Run the directories above, not `_imports/`.

```text
pi-sim
  hidden synthetic patient
  publishes public JSON under pi-sim/vitals/

pi-monitor
  reads that public JSON
  display only

pi-chart
  separate files under pi-chart/patients/
  not fed by a live simulator run today

pi-agent
  Pi scaffold
  no chart or simulator calls today
```

### pi-sim

`pi-sim` is the patient runtime. The TypeScript runner in `pi-sim/scripts/runtime/` owns the clock, the scenario, and publication of public files. Three providers sit behind that runner:

- A scripted scalar provider. It runs with no Docker and does not supply waveform samples.
- A demo waveform provider. It writes synthetic ECG, arterial-pressure, pleth, and respiration windows. The public status file labels them `sourceKind: "demo"`, `fidelity: "demo"`, and `synthetic: true`.
- A Pulse provider. It talks to a Docker sidecar. The current shim exposes scalar vitals only. Pulse is one physiology backend, not the center of the design. See [ADR 002](pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md) and [ADR 003](pi-sim/docs/adr/003-pi-sim-patient-runtime-provider-architecture.md).

Public outputs live under `pi-sim/vitals/`: `current.json`, `timeline.json`, `timeline.jsonl`, `events.jsonl`, `status.json`, plus encounter, assessment, and waveform files. Other projects are expected to read those files and not import `pi-sim/scripts/` or `pi-sim/pulse/`.

`pi-sim/monitor-ui/` is an older Python/PySide6 monitor. Its README marks it as superseded by `pi-monitor`.

### pi-monitor

`pi-monitor` is a display-only Rust workspace:

- `pulse-public-frame` parses public telemetry frames.
- `monitor-core` turns frames into freshness, alarm, numeric, and waveform display state.
- `monitor-ingest` reads a file, a public directory, or a local TCP stream.
- `monitor-ui` renders terminal text and static HTML.
- `monitor-cli` provides `render`, `watch`, `replay`, and related commands.
- `monitor-app` is a native window built with eframe and egui.

It does not import the simulator, the chart, or the agent, and it does not write chart files.

### pi-chart

`pi-chart` is a TypeScript library over one directory per patient. The spec in [`DESIGN.md`](pi-chart/DESIGN.md) is schema version `0.3.0-partial`. [`ARCHITECTURE.md`](pi-chart/ARCHITECTURE.md) maps the code. [`ROADMAP.md`](pi-chart/ROADMAP.md) records what has landed and what is still open.

A chart is append-only. A correction is a new event that points at an older one. Files under `_derived/` are generated caches. The public API is `pi-chart/src/index.ts`. Writes go through `appendEvent`, `writeCommunicationNote`, and `writeArtifactRef`, each limited to one patient. The six review functions are `timeline`, `currentState`, `trend`, `evidenceChain`, `openLoops`, and `narrative`. `memoryProof` composes those functions into one review projection.

Five synthetic patients are checked in, `patient_001` through `patient_005`. A validator checks links, patient isolation, time fields, provenance, and related rules.

### pi-agent

`pi-agent` is a project-local Pi setup: `AGENTS.md`, `.pi/settings.json`, and directories for extensions, skills, prompts, and themes. The only checked-in extension is a no-op. Skills, prompts, and themes are placeholders. Nothing in this directory reads `pi-chart` or `pi-sim`. The dependency in `pi-agent/package.json` is `@mariozechner/pi-coding-agent`.

The module README still tells you to `cd ~/pi-rn`. That path is not this repository. Use the commands below.

## Build and run

These commands were run on this tree with Node.js 22.23.4. The monitor commands were run with Rust 1.95.0. Start each block from the repository root.

Docker is not required here. The optional Pulse sidecar is described in [`pi-sim/README.md`](pi-sim/README.md) and was not run for this file, because Docker was not available in the check.

### Chart

```bash
cd pi-chart
npm ci
npm run typecheck
npm run check
npm test
```

`npm ci`, `npm run typecheck`, and `npm run check` completed successfully. `npm run check` rebuilds derived summaries and validates all five patients: 0 errors and 0 warnings on this run. `npm test` runs, and it currently fails: 313 tests passed and 5 failed, all in `src/views/memoryProof.test.ts`.

### Simulator

```bash
cd pi-sim
npm ci
npm test
npm run sim:run:demo -- --out-dir /tmp/pi-rn-scripted-demo
npm run sim:run:live-demo -- --out-dir /tmp/pi-rn-live-demo --duration 1 --dt 0.5 --no-pacing
```

`npm test` completed successfully. It typechecks, runs the runtime tests, validates the scripted scenarios, and checks the public-contract fixtures. The two demo commands write under `/tmp` so they do not overwrite tracked files in `pi-sim/vitals/`.

On this run, the scripted demo finished at 30 simulated seconds with waveform status `available: false` and reason `provider_does_not_supply_waveforms`. The short live-demo command finished at 1 simulated second and wrote a waveform window labeled demo and synthetic. Leaving off `--out-dir` writes into `pi-sim/vitals/` instead.

### Monitor

```bash
cd pi-monitor
cargo test --workspace
cargo run -p monitor-cli -- render --source fixtures/stable-current.json
```

Both commands completed successfully with Rust 1.95.0. `cargo test --workspace` passed 39 library tests. The app and CLI crates contain no unit tests. The render command prints one terminal frame from a fixture. The native window in `monitor-app` was not launched in this headless check. Further commands are in [`pi-monitor/README.md`](pi-monitor/README.md).

### Agent scaffold

```bash
cd pi-agent
npm install
npx pi --help
```

`pi-agent` has no lockfile, so this block uses `npm install`. `npx pi --help` prints the Pi CLI usage and exits. `npx pi` without `--help` starts an interactive session and needs a model provider configured for Pi. That session was not started here. It would not be connected to the chart or the simulator.

## Current status

Working on this tree:

- The chart library typechecks, rebuilds derived files, and validates the five synthetic patients with no validator errors.
- The simulator can publish public JSON with no Docker, both as scalar scripted telemetry and as a short demo waveform.
- The monitor test suite passes, and the CLI can render a fixture in the terminal.
- The agent directory installs, and the Pi CLI answers `--help`.

In progress, or not built:

- The four parts do not yet run as one loop. Live simulator output is not ingested into the chart. The agent does not read or write the chart. Those seams are still open in [`pi-chart/ROADMAP.md`](pi-chart/ROADMAP.md).
- `memoryProof` is implemented, and `npm test` in `pi-chart` fails five assertions about the checked-in charts and about replay behavior.
- The five-patient set is not signed off as a finished corpus. In the [corpus review packet](pi-chart/docs/plans/clinical-fidelity-corpus-review-adr-019.md), `patient_002` and `patient_004` are accepted anchors. `patient_001`, `patient_003`, and `patient_005` are revised candidates still waiting on operator review. The packet's own outcome is fail / incomplete.
- No Synthea importer exists under `pi-chart/src/`. Historical import is still a later roadmap item. The checked-in patients are hand-authored synthetic charts.
- A product chart screen is not part of the run path above. `pi-chart` has planning-board and HTML prototype scripts, and the roadmap still treats a product UI as later work.
- Pulse-backed physiology needs Docker. It was not exercised here. Repo notes say Pulse validation can still fail for scenario tuning after the runtime itself starts, and the current Pulse path does not supply real waveform samples.
- The PySide6 monitor in `pi-sim/monitor-ui/` is superseded.

## Not for clinical use

Use this repository for research, software design, and simulation only. Do not use it to monitor, diagnose, treat, or document a real patient. The waveforms, vitals, notes, and orders here are synthetic. Nothing in this repo has been tested as a clinical device.

## License

Apache License 2.0. See [`LICENSE`](LICENSE). The license allows use, modification, and redistribution, includes a patent grant, and provides no warranty.
