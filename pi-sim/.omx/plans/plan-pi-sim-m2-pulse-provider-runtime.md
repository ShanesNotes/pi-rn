# RALPLAN — pi-sim M2 Pulse provider behind patient-runtime boundary

Generated: 2026-04-27
Status: **APPROVED CONSENSUS PLAN — ready for `$ralph` execution**
Mode: `$ralplan` / `$plan --consensus` short mode
Context snapshot: `.omx/context/pi-sim-m2-pulse-provider-runtime-20260427T142543Z.md`
Parent authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`, `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`
Depends on: completed M1 runtime skeleton `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`
Paired PRD: `.omx/plans/prd-pi-sim-m2-pulse-provider-runtime.md`
Paired test spec: `.omx/plans/test-spec-pi-sim-m2-pulse-provider-runtime.md`

## Requirements summary

Build the next concrete `pi-sim` development phase after M1: route the existing Pulse shim/client path through the same provider-based patient-runtime boundary proven by the deterministic scripted provider.

The deliverable is **M2**: a Pulse-backed `PhysiologyProvider`, provider-agnostic runtime runner, provider scenario loading/normalization, Pulse CLI path, compatibility wrapper/alias for the existing Pulse monitor command, and verification that scripted and Pulse providers publish the same public telemetry contract.

M2 must **not** make Pulse the architecture center again. Pulse remains a provider/backend. It may be unavailable in local environments; M2 must represent provider unavailability cleanly and keep M1 scripted runtime fully green.

## RALPLAN-DR summary

### Principles

1. **Provider parity over feature expansion:** M2 proves Pulse can sit behind the same runtime seam as scripted telemetry before adding waves, chart, or agent surfaces.
2. **Scripted stays first-class:** M1 no-Pulse runs/tests remain the reliable local development path.
3. **One public publisher:** Pulse and scripted providers must assemble/publish through shared frame/publisher code, not duplicate `current.json` logic.
4. **Truthful capability reporting:** Pulse output is scalar-only in this integration; runtime waveforms stay absent and Pulse unavailability is explicit.
5. **Migration without cliff edges:** preserve the legacy `monitor:pulse` path as a compatibility wrapper/alias until the new provider path reaches parity.

### Decision drivers

1. **De-risk ADR 003:** the provider architecture is not real until the legacy Pulse path is wrapped by it.
2. **Preserve physiology value:** Pulse scenarios and action mappings are hard-won assets and should be salvaged behind the provider boundary.
3. **Avoid dual runtime drift:** current `scripts/monitor.ts` duplicates clock/frame/publish behavior; M2 should converge runtime semantics.
4. **Keep execution reviewable:** working tree has unrelated dirty sibling/doc work, so M2 must be a bounded file set with path-limited staging.

### Viable options

| Option | Verdict | Pros | Cons / invalidation rationale |
|---|---|---|---|
| A. Wrap Pulse as a provider and add provider-agnostic runner while preserving legacy wrapper | **Chosen** | Directly validates ADR 003; keeps M1 green; salvages Pulse mappings/actions; converges public output path; reversible and testable | Requires careful async provider handling and unavailability semantics; some legacy duplication remains until wrapper is retired |
| B. Delete/refactor `scripts/monitor.ts` wholesale into the new runner now | Deferred | Removes duplication faster; clearer final shape | Higher regression risk while Pulse/Docker availability may vary; makes review harder in a dirty tree; unnecessary before parity proof |
| C. Skip Pulse and build waveform/event lanes next | Rejected for M2 | Visible monitor fidelity progress | Risks fake waveform pressure and leaves Pulse outside provider boundary; violates provider-parity priority |
| D. Jump to Rust `pi-sim` core now | Deferred | Stronger long-term runtime fit; aligns with Rust monitor | Contracts are still stabilizing; would conflate language migration with Pulse wrapping and scenario normalization |
| E. Build chart/agent adapter next | Rejected for M2 | Product-facing integration progress | Adapters should consume stable provider-agnostic telemetry; doing them before Pulse parity reintroduces display/chart coupling risk |


## Consensus review snapshot

### Architect review — APPROVE

The architecture is sound: M2 should wrap Pulse behind the M1 provider boundary before waveform, chart, agent, or Rust migration work. Strongest steelman antithesis: wrapping Pulse next could quietly re-center the legacy Docker/Python/CSV shim as the real architecture, especially if `scripts/monitor.ts` remains the path people run. The plan mitigates this by making the shared runner/publisher canonical, keeping scripted first-class, and treating `monitor:pulse` as compatibility until parity is proven.

Real tradeoff tension: preserving legacy Pulse command compatibility lowers migration risk, but it temporarily keeps dual paths alive. Removing the legacy monitor path now would be cleaner but riskier before provider-runner parity and fake-transport tests exist. The plan chooses compatibility plus a clear retirement path.

Required fixes: none. Watch items: keep async provider changes minimal, avoid moving runtime policy into `scripts/client.ts`, and require fake/no-Docker Pulse tests so Docker availability does not become the acceptance gate.

### Critic evaluation — APPROVE

The plan is execution-ready. It has fair alternatives, clear invalidation rationale, explicit phase gates, measurable acceptance criteria, and concrete verification commands. The strongest quality risk is that live low-acuity Pulse smoke could be skipped too casually; the paired test spec mitigates this by making fake Pulse transport tests mandatory and treating live Docker/Pulse smoke as conditional evidence, not the only proof.

No principle-option inconsistency found. M2 directly follows ADR 003 and M1 evidence: Pulse becomes one provider behind the shared public telemetry path; scripted remains the local baseline; the chosen Pulse scenario is deliberately non-acute/continuous-observation, and runtime waveforms remain absent unless provider-supplied truth exists.

## Consensus recommendation

Execute **Option A** as M2: implement a Pulse provider behind `PhysiologyProvider` and a provider-agnostic runtime runner/CLI. Keep `scripts/client.ts` as the only Pulse HTTP transport module initially, but move Pulse-specific scenario/action lifecycle into a provider module under `scripts/runtime/` or an equivalent provider directory. Preserve legacy commands, with docs naming them compatibility surfaces.

## Current evidence base

- M1 runtime provides `SimClock`, `PhysiologyProvider`, `ScriptedProvider`, shared frame assembly, atomic publisher, and `sim-run.ts`.
- `scripts/client.ts` is already the sole TypeScript module that knows Pulse shim HTTP endpoints.
- `scripts/monitor.ts` currently mixes Pulse init/action/advance with frame assembly, terminal rendering, pacing, and file publishing.
- Existing acute Pulse scenarios in `vitals/scenarios/hemorrhagic_shock.json` and `vitals/scenarios/sepsis_norepi.json` remain compatibility/reference evidence for schema and action mapping. They are **not** the M2 smoke target; M2 should add or designate a stable observation scenario for calm continuous vital streaming.
- `pulse/README.md` and `pulse/shim/app.py` remain source/reference for current action payloads and scalar output behavior.
- M1 evidence proves `../pi-monitor` can render shared public output and that runtime output omits fake waveforms.

## Scope

### In scope

- Add an async-capable provider execution path without breaking the existing synchronous scripted provider tests.
- Add `PulseProvider` or equivalent provider wrapper for shim `init`, `advance`, `applyAction`, `snapshot`/last snapshot, metadata, and unavailable/error state.
- Normalize legacy Pulse scenario loading into a provider selection path such as `provider: "pulse"` inferred or explicit.
- Add a provider-agnostic runtime runner used by both scripted and Pulse CLI paths.
- Add CLI/scripts such as `sim:run:pulse`, `sim:run:pulse:stable` or final equivalents.
- Preserve `monitor:pulse` as compatibility, either as old monitor path or as a thin wrapper over the new runner if parity is proven.
- Document M2 provider selection, Pulse availability expectations, and scalar-only/no-waveform limits.
- Add tests using a fake Pulse shim/client or injected transport so Pulse provider mapping/action scheduling can be verified without Docker.
- Add optional Docker/Pulse smoke commands that run only when the shim is available.
- Add or select a **low-acuity stable observation Pulse scenario** for M2 smoke. It should emit a logically variable vital stream continuously, but must not model ACLS/code blue, shock, sepsis, pressors, hemorrhage, bolus rescue, or decompensation/recovery as its primary story.

### Out of scope

- Real waveform generation or waveform public lanes.
- Chart/EHR adapter implementation.
- pi-agent assessment/action interface.
- Rust rewrite.
- Removal of legacy `scripts/monitor.ts` before parity is proven.
- Reworking Pulse Python shim internals except for small compatibility fixes discovered by tests.
- Broad scenario schema redesign beyond minimal provider selection/normalization.
- Acute scenario validation (`hemorrhagic_shock`, `sepsis_norepi`) as the primary M2 demonstration; those stay compatibility/reference cases until the calm provider path is proven.

## Architecture target

Preferred execution layout:

```text
scripts/
  runtime/
    runner.ts          # provider-agnostic clock/action/publish loop
    provider.ts        # provider contracts; async-compatible if needed
    pulseProvider.ts   # Pulse provider wrapper over scripts/client.ts transport
    pulseScenario.ts   # legacy Pulse scenario loading/normalization
    scriptedProvider.ts
    frame.ts
    publisher.ts
    test.ts            # M1 + M2 no-Docker contract tests
  sim-run.ts           # scripted/default provider CLI, may delegate to runner
  sim-run-pulse.ts     # Pulse provider CLI, or one sim-run.ts with --provider pulse
  monitor.ts           # compatibility wrapper/path; do not deepen monolith
  client.ts            # Pulse HTTP transport only
```

Equivalent layouts are acceptable if the same boundaries are preserved: transport, provider, runner, frame assembly, publisher, and display rendering must remain separated.

## Public contract direction for M2

Pulse and scripted providers must publish the same latest-frame/timeline/status surface:

```json
{
  "t": 30,
  "simTime_s": 30,
  "wallTime": "2026-04-27T00:00:00.000Z",
  "hr": 92,
  "map": 70,
  "bp_sys": 104,
  "bp_dia": 58,
  "rr": 22,
  "spo2": 95,
  "temp_c": 37.2,
  "alarms": [],
  "monitor": {
    "schemaVersion": 1,
    "source": "pi-sim-pulse",
    "sequence": 15,
    "runState": "running",
    "events": [],
    "heartRhythm": "unavailable"
  }
}
```

Rules:

- `monitor.source` distinguishes `pi-sim-scripted` from `pi-sim-pulse`.
- `monitor.sequence` is owned by the shared runner clock, not by Pulse raw `t` alone.
- Final completed runs publish `runState: "ended"`.
- Pulse unavailability should produce a clear CLI failure and, when an output directory is requested and safe, a `status.json`/last frame with `runState: "unavailable"` rather than corrupting prior `current.json`.
- `monitor.waveforms` remains absent for Pulse until the provider truly supplies samples.

## Implementation plan

### Phase 0 — Baseline and staging guard

1. Record `git status --short` and identify pre-existing dirty groups: M1 runtime, doc quarantine/ADR, M2 monitor WIP, sibling `pi-chart` changes, sibling `pi-monitor` changes.
2. Prefer committing or otherwise freezing M1 before M2 execution. If not possible, maintain a path-limited staging map for M2-owned files.
3. Run and record baseline:
   - `npm run typecheck`
   - `npm run test:runtime`
   - `npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider-baseline/scripted/vitals`
4. Confirm no tracked `vitals/current.json`, `vitals/timeline.json`, or `vitals/status.json` churn before editing.

Exit gate: executor has an explicit M2 file ownership/staging map and M1 baseline is green.

### Phase 1 — Async provider contract and shared runner

1. Decide minimal async contract shape: either allow `PhysiologyProvider` methods to return `T | Promise<T>`, or create `AsyncPhysiologyProvider` with adapter helpers. Prefer the least disruptive shape that preserves M1 tests.
2. Extract the clock/action/publish loop from `sim-run.ts` into `scripts/runtime/runner.ts`.
3. Add action scheduling to the shared runner so legacy Pulse scenario timelines can fire actions at sim time.
4. Keep scripted provider working through the same runner.
5. Extend tests to prove runner monotonicity, action firing order, ended state, and scripted parity.

Exit gate: M1 scripted CLI still works, `npm run test:runtime` covers runner behavior, and no Pulse/Docker dependency is introduced into local tests.

### Phase 2 — Pulse provider wrapper

1. Add `PulseProvider` around `scripts/client.ts` transport with metadata `{ source: "pi-sim-pulse", fidelity: "physiology-provider" }`.
2. Implement `init`, `advance`, `applyAction`, and `snapshot`/last-snapshot semantics.
3. Keep `scripts/client.ts` transport-focused; avoid moving scenario/runtime policy into it.
4. Convert raw Pulse vitals to `ProviderSnapshot` exactly once in provider code.
5. Represent unavailable shim errors with clear typed errors or status metadata; do not crash after partially writing misleading frames.
6. Preserve action payload pass-through as provider capability, but do not use hemorrhage, fluid bolus, norepinephrine, or stop/resuscitation actions as the primary M2 smoke scenario. M2 smoke should use a low-acuity continuous-vitals scenario with no ACLS/decompensation schema.

Exit gate: fake/injected Pulse transport tests pass without Docker and prove init/advance/action mapping plus unavailable behavior.

### Phase 3 — Pulse scenario loading and CLI

1. Add `pulseScenario.ts` or equivalent loader for legacy scenario shape.
2. Add or designate a low-acuity stable Pulse scenario, preferably `vitals/scenarios/pulse_stable_observation.json`, whose purpose is continuous variable vitals rather than acute deterioration.
3. Support explicit `provider: "pulse"` in new/updated scenario files or infer Pulse when `state_file` exists and `provider` is absent; document the inference as compatibility.
4. Add `sim-run-pulse.ts` or extend `sim-run.ts --provider pulse` with flags:
   - `--scenario <path>`
   - `--out-dir <path>`
   - `--duration <seconds>` override
   - `--dt <seconds>`
   - `--time-scale <n>` / `--no-pacing`
   - optional `--shim-url <url>` only if transport supports it cleanly
5. Add package scripts for Pulse provider smoke, e.g. `sim:run:pulse:stable`.
6. Ensure CLI smoke writes to `.omx/evidence/...` by default in verification examples, not tracked `vitals/`.

Exit gate: CLI can select scripted or Pulse provider path; scripted remains no-Docker; Pulse path fails clearly if shim unavailable.

### Phase 4 — Legacy monitor compatibility and docs

1. Preserve `monitor:pulse` command. If safe, make `scripts/monitor.ts` a compatibility wrapper over the shared Pulse runner plus terminal render; otherwise leave it but mark it legacy and avoid adding logic.
2. Update `README.md`, `vitals/README.md`, and `pulse/README.md` to show:
   - M1 scripted provider path
   - M2 Pulse provider path
   - legacy compatibility command
   - scalar-only/no-waveform truth
   - provider unavailability behavior
3. Add an M2 evidence note under `.omx/evidence/` with verification results and any Docker/Pulse smoke skip reason.

Exit gate: docs route future agents to provider runner as canonical and to `monitor:pulse` only as compatibility.

### Phase 5 — Optional live low-acuity Pulse smoke when environment supports it

1. If Docker/shim is available, run Pulse health and one short scenario into evidence output.
2. Render the Pulse-generated `current.json` with `../pi-monitor` if sibling build is available.
3. If unavailable, record exact skip reason and rely on fake transport tests + command preservation.

Exit gate: either live low-acuity Pulse smoke evidence exists or a precise unavailability skip is recorded.

## Acceptance criteria

1. M1 scripted path still passes unchanged: `npm run typecheck`, `npm run test:runtime`, `npm run sim:run:demo -- --out-dir ...`.
2. A shared runtime runner exists and is used by scripted and new Pulse provider CLI paths, or a documented equivalent proves duplicated runtime semantics were not deepened.
3. Pulse provider maps shim `init`/`advance` raw scalar output into `ProviderSnapshot` and shared `buildVitalFrame` output exactly once.
4. The selected M2 Pulse scenario is a stable/observation scenario with continuous logically variable scalar vitals and no ACLS/code/decompensation semantics.
5. Non-acute Pulse scenario timelines fire actions through provider `applyAction` in deterministic sim-time order.
6. Fake/no-Docker Pulse provider tests cover init, advance, action, unavailable shim, scalar mapping, no waveform output, and final ended state.
7. Pulse CLI path writes `current.json`, `timeline.json`, and `status.json` through `PublicTelemetryPublisher`.
8. Pulse unavailability is explicit and bounded; no misleading stale successful `current.json` is left as if live.
9. `monitor:pulse` remains discoverable and documented as compatibility.
10. No new direct `pi-monitor`, `pi-chart`, or `pi-agent` imports are introduced in `pi-sim` runtime modules.
11. Optional live low-acuity Pulse smoke either passes or is skipped with exact Docker/shim availability evidence.

## Verification commands

Minimum local verification after M2:

```bash
npm run typecheck
npm run test:runtime
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals
npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/pulse-stable/vitals --duration 60 --dt 10 --no-pacing || true
node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('.omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals/current.json','utf8')); if(j.monitor?.source!=='pi-sim-scripted'||Object.hasOwn(j.monitor??{},'waveforms')) process.exit(1); console.log(j.monitor.source,j.monitor.runState,j.monitor.sequence)"
rg -n "from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent" scripts || true
git status --short vitals/current.json vitals/timeline.json vitals/status.json
npm run | sed -n '/monitor/p;/pulse/p;/sim:/p'
```

Pulse-live verification when Docker/shim is available:

```bash
npm run pulse:health
npm run sim:run:pulse:stable -- --out-dir .omx/evidence/pi-sim-m2-pulse-provider/live-pulse-stable/vitals --duration 60 --dt 10 --no-pacing
node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('.omx/evidence/pi-sim-m2-pulse-provider/live-pulse-stable/vitals/current.json','utf8')); if(j.monitor?.source!=='pi-sim-pulse'||Object.hasOwn(j.monitor??{},'waveforms')) process.exit(1); console.log(j.monitor.source,j.monitor.runState,j.monitor.sequence)"
```

If `../pi-monitor` is available:

```bash
cd ../pi-monitor && cargo test --workspace
cd ../pi-monitor && cargo run -p monitor-cli -- render --source ../pi-sim/.omx/evidence/pi-sim-m2-pulse-provider/scripted/vitals/current.json
cd ../pi-monitor && cargo run -p monitor-cli -- render --source ../pi-sim/.omx/evidence/pi-sim-m2-pulse-provider/live-pulse-stable/vitals/current.json
```

The final Pulse render command is conditional on live low-acuity Pulse smoke availability.

## ADR

### Decision

M2 will wrap the current Pulse shim/client path as a `pi-sim` physiology provider behind the M1 patient-runtime boundary. A shared runtime runner and public publisher will become the canonical execution path for both scripted and Pulse providers. Legacy Pulse monitor commands remain compatibility surfaces until parity and evidence support retirement.

### Drivers

- ADR 003 requires Pulse to be a provider/backend, not the architecture center.
- M1 proved the provider seam only with scripted scalar telemetry; Pulse must now prove the seam against the real legacy backend.
- Existing Pulse scenarios/actions preserve valuable physiology work that should be kept, but not as a separate monitor-centric runtime.
- Public consumers need one telemetry contract regardless of provider.

### Alternatives considered

1. **Pulse provider behind shared runner.** Chosen because it validates the architecture and reduces dual-runtime drift.
2. **Delete/rewrite the legacy monitor path now.** Deferred because compatibility risk is too high before provider parity is proven.
3. **Waveform/event lanes next.** Rejected for M2 because Pulse is not yet behind the runtime boundary and real waveform truth is not available.
4. **Rust rewrite now.** Deferred because language migration should follow stable provider contracts.
5. **Chart/agent adapters next.** Rejected because adapters should consume provider-agnostic telemetry after Pulse parity.

### Consequences

- Provider contracts may need async support or adapter helpers.
- Tests must include fake Pulse transport so Docker availability does not block local confidence.
- Some legacy duplication may remain temporarily in `scripts/monitor.ts`.
- Future M3 can safely choose between waveform/event lanes, scenario schema normalization, or encounter-depth work based on a provider-agnostic runtime.

### Follow-ups

1. After M2, decide whether to retire or thin `scripts/monitor.ts`.
2. Decide whether M3 should add public waveform/event lanes or deeper encounter/scenario schema.
3. Consider a later Rust runtime migration only after provider and public telemetry contracts stabilize.
4. Add project wiki pages for provider contracts and Pulse migration once `.omx/wiki/` is available.

## Available-agent-types roster and staffing guidance

Useful native roles:

- `explore` — map current Pulse shim/client/action/schema usage before edits.
- `planner` — keep PRD/test spec aligned with ADR 003 and M1 evidence.
- `architect` — review async provider contract, runner boundary, and compatibility strategy.
- `executor` — implement bounded provider/runner/CLI/docs slices.
- `test-engineer` — design fake Pulse transport, runner tests, unavailable-state tests, and smoke evidence.
- `verifier` — validate final evidence, boundary greps, and skip rationale.
- `code-reviewer` — final cross-file review for dual-runtime drift and hidden coupling.
- `writer` — docs/evidence/wiki updates.

### Recommended `$ralph` handoff

Use Ralph for the default M2 execution because provider wrapping is sequential and benefits from one owner preserving staging discipline:

```bash
$ralph .omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md
```

Suggested Ralph lane order:

1. Phase 0 staging guard and M1 baseline.
2. Phase 1 runner extraction with scripted parity tests.
3. Phase 2 Pulse provider fake-transport tests.
4. Phase 3 Pulse CLI and package scripts.
5. Phase 4 docs/evidence.
6. Phase 5 optional live Pulse/monitor smoke.

Suggested reasoning: high for architecture/runner extraction, medium for straightforward docs/scripts, high for final verification.

### Recommended `$team` handoff

Use Team only if the user wants parallel speed and accepts coordination overhead:

```bash
$team .omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md
```

Suggested lanes:

1. **Explore lane:** map Pulse shim endpoints/actions and scenario schema.
2. **Executor lane A:** shared runner + scripted parity.
3. **Executor lane B:** Pulse provider + fake transport tests.
4. **Test-engineer lane:** unavailability tests, deterministic action schedule tests, smoke assertions.
5. **Writer lane:** README/vitals/pulse/evidence updates.
6. **Verifier/code-reviewer lane:** final boundary, staging, and monitor smoke review.

Team verification path:

- Do not merge executor lanes until runner contract and provider tests agree.
- Verifier must run the full minimum verification set, inspect `git status --short`, and confirm no sibling hidden coupling or generated vitals churn before completion.

## Plan changelog

- 2026-04-27: Initial M2 consensus draft created after M1 runtime skeleton completion.
