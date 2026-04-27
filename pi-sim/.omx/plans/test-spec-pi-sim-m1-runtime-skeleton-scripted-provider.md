# Test Spec — pi-sim M1 runtime skeleton with deterministic scripted provider

Status: **APPROVED — paired with consensus plan**
Related PRD: `.omx/plans/prd-pi-sim-m1-runtime-skeleton-scripted-provider.md`

## Test objectives

1. Prove no-Pulse runtime execution.
2. Prove canonical time/sequence/run-state monotonicity.
3. Prove deterministic scripted provider output.
4. Prove public `current.json` compatibility with monitor consumers.
5. Prove no fake production waveform output.
6. Prove boundaries: no hidden imports to sibling implementation internals.

## Test matrix

### A. TypeScript compile

Command:

```bash
npm run typecheck
```

Pass: exits 0.

### B. Runtime test command

Command:

```bash
npm run test:runtime
```

Pass: exits 0 and covers clock, provider determinism, frame assembly, and publisher temp-dir behavior. It must use existing dependencies unless the user explicitly approves a new test dependency.

### C. Clock/sequence unit tests

Scope: runtime clock helper.

Cases:
- starts at configured sim time and sequence zero/one as documented
- advances by positive dt
- rejects zero/negative/non-finite dt unless explicitly allowed
- ending a run marks run state ended and does not regress sequence/time

### D. Scripted provider determinism

Run the same scenario twice with same dt/duration.

Pass:
- same number of frames
- same scalar values at each sim time
- same event labels for same timeline
- wall-time differences are ignored only if documented

### E. Publisher shape and atomicity

Use a temporary output directory or `.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/`, not tracked `vitals/`, by default.

Pass:
- `current.json` parses at every checked point
- latest frame includes legacy scalars, `wallTime`, `alarms`, `monitor` extension
- timeline is ordered by sim time/sequence
- final frame shows `runState: "ended"`
- no `monitor.waveforms` emitted in M1 scripted output

### F. CLI smoke

Command shape:

```bash
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals
```

Pass:
- no Pulse/Docker process required
- exits 0 within bounded wall time
- writes expected output files under the evidence/temp output directory
- leaves tracked `vitals/current.json` and `vitals/timeline.json` unchanged unless explicitly staged with rationale

### G. Public monitor smoke

If sibling `../pi-monitor` is buildable:

```bash
cd ../pi-monitor && cargo test
cd ../pi-monitor && cargo run -p monitor-cli -- render --source ../pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json
```

Pass: monitor parses/renders generated public frame.

If blocked by sibling dirty work or missing binary, record the blocker and run local JSON-contract assertions instead.

### H. Boundary greps

Commands:

```bash
rg -n "from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent" scripts || true
git diff --name-only -- ../pi-monitor ../pi-chart
rg -n "waveforms" .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json
```

Pass:
- no hidden sibling imports introduced in `scripts/runtime/**` or new CLI.
- sibling diff command shows no new M1-caused `../pi-monitor` or `../pi-chart` modifications; pre-existing sibling dirtiness is not staged.
- waveform grep either has no hit or only a deliberately labeled fixture/demo artifact, not production runtime output.

### I. Legacy Pulse command preservation

Command:

```bash
npm run | sed -n '/monitor/p;/pulse/p;/sim:/p'
```

Pass: output still exposes a clear Pulse monitor path and new scripted sim path. Docker-dependent Pulse execution can be skipped with an explicit note if sidecar unavailable and Pulse code was not touched.

## Required evidence artifact

Execution should record final command outputs and any skips in either:

- this plan's completion section, or
- `.omx/evidence/pi-sim-m1-runtime-skeleton-<date>.md`
