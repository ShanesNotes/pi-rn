# Test Spec — pi-sim M2 Pulse provider behind patient-runtime boundary

Status: **APPROVED — paired with consensus plan**
Related PRD: `.omx/plans/prd-pi-sim-m2-pulse-provider-runtime.md`

## Test objectives

1. Prove M1 scripted runtime remains green.
2. Prove a shared runner owns clock, sequence, action scheduling, frame assembly, and publish semantics.
3. Prove Pulse provider maps shim scalar output into the provider/public telemetry contract exactly once.
4. Prove Pulse action timelines dispatch in deterministic sim-time order.
5. Prove Pulse unavailability is explicit and bounded.
6. Prove no fake waveform output and no hidden sibling coupling.

## Test matrix

### A. TypeScript compile

```bash
npm run typecheck
```

Pass: exits 0.

### B. Runtime test command

```bash
npm run test:runtime
```

Pass: exits 0 and covers existing M1 tests plus M2 shared runner/Pulse provider fake-transport tests.

### C. Scripted parity smoke

```bash
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals
```

Pass:
- no Pulse/Docker required
- final frame has `monitor.source: "pi-sim-scripted"`
- final frame has `runState: "ended"`
- no `monitor.waveforms`

### D. Shared runner tests

Cases:
- initializes provider once
- publishes initial frame
- advances monotonic sim time/sequence
- fires due actions before/at the correct sim tick
- marks final completed run ended
- writes current/timeline/status through `PublicTelemetryPublisher`

### E. Pulse provider fake transport tests

Use injected/fake shim transport rather than Docker.

Cases:
- `init(state_file)` maps raw scalar vitals to provider snapshot
- `advance(dt)` maps updated raw scalar vitals
- `applyAction(action)` calls transport with type/params and records/provider-events as designed
- unavailable transport error yields typed provider-unavailable outcome
- no waveform window is emitted
- metadata source is `pi-sim-pulse`

### F. Pulse scenario loader tests

Cases:
- low-acuity stable observation scenario with `provider: "pulse"` or compatible `state_file` is accepted as the primary M2 smoke scenario
- acute legacy scenarios remain loadable as compatibility references but are not the primary M2 smoke target
- scripted scenario is not misloaded as Pulse
- non-acute timeline entries are sorted or processed deterministically
- optional `state_bake` metadata is preserved/documented without executing unexpectedly during unit tests

### G. Pulse CLI smoke

When live Pulse shim is unavailable, command may exit non-zero but must produce clear unavailable output and evidence note.

When available:

```bash
npm run pulse:health
npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/live-pulse-stable/vitals --duration 60 --dt 10 --no-pacing
```

Pass:
- selected scenario is non-acute/stable-observation, not ACLS/code/decompensation
- output parses
- `monitor.source === "pi-sim-pulse"`
- `monitor.runState` is `running` or `ended` as expected
- no `monitor.waveforms`

### H. Public monitor smoke

If sibling `../pi-monitor` is buildable:

```bash
cd ../pi-monitor && cargo test --workspace
cd ../pi-monitor && cargo run -p monitor-cli -- render --source ../pi-sim/.omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals/current.json
```

Additionally render live low-acuity Pulse output if live low-acuity Pulse smoke ran.

Pass: monitor parses/renders public output without hidden imports.

### I. Boundary and generated-output checks

```bash
rg -n "from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent" scripts || true
git status --short vitals/current.json vitals/timeline.json vitals/status.json
git diff --check -- .omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md .omx/plans/prd-pi-sim-m2-pulse-provider-runtime.md .omx/plans/test-spec-pi-sim-m2-pulse-provider-runtime.md
npm run | sed -n '/monitor/p;/pulse/p;/sim:/p'
```

Pass:
- no hidden sibling imports introduced
- tracked generated vitals files unchanged or intentionally staged with rationale
- diff has no whitespace errors
- Pulse and sim command paths are discoverable

## Required evidence artifact

Execution should record final command outputs and any live Pulse skip reason in:

- `.omx/evidence/pi-sim-m2-pulse-provider-20260427.md`, or
- the completion section of `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`
