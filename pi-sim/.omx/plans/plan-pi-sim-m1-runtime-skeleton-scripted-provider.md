# RALPLAN — pi-sim M1 runtime skeleton with deterministic scripted provider

Generated: 2026-04-27
Last revised: 2026-04-27 after Architect review
Status: **APPROVED CONSENSUS PLAN — ready for `$ralph` execution**
Mode: `$ralplan` / `$plan --consensus` short mode
Context snapshot: `.omx/context/pi-sim-next-phase-development-20260427T134838Z.md`
Parent authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`, `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`
Paired PRD: `.omx/plans/prd-pi-sim-m1-runtime-skeleton-scripted-provider.md`
Paired test spec: `.omx/plans/test-spec-pi-sim-m1-runtime-skeleton-scripted-provider.md`

## Requirements summary

Build the next concrete `pi-sim` development phase after the doc quarantine: a small, no-Pulse patient-runtime skeleton that proves the new architecture in code without pretending to solve physiology fidelity or waveform production.

The deliverable is **M1**: canonical simulation clock + run state + provider interface + deterministic scripted scalar provider + atomic public publisher + CLI + tests. It must continue to publish a `vitals/current.json` shape that `../pi-monitor` can consume through the existing public boundary. The current Pulse harness remains available as a compatibility path in this phase; it is not removed or rewritten wholesale.

## RALPLAN-DR summary

### Principles

1. **Architecture in code, not only docs:** implement the smallest runtime seam that demonstrates ADR 003.
2. **No-Pulse development path:** local runtime and tests must pass without Docker/Pulse.
3. **Compatibility while migrating:** preserve `current.json` legacy scalar keys and existing Pulse commands during M1.
4. **Truthful telemetry:** scripted provider is deterministic scalar scenario telemetry; it must not advertise high-fidelity physiology or real waveforms.
5. **Future portability:** keep core runtime boundaries clean enough to port to Rust later, but do not start with a Rust rewrite unless TypeScript boundaries cannot support M1.

### Decision drivers

1. **De-risk the rebase:** prove patient-runtime/provider architecture before wrapping Pulse or adding chart/agent seams.
2. **Unblock development:** Docker/Pulse instability should not block core runtime, clock, scenario, publisher, or monitor-boundary tests.
3. **Limit churn:** repo already has dirty `pi-monitor`, `pi-chart`, docs, and M2 monitor-extension work; next lane must be stage-safe and reviewable.

### Viable options

| Option | Verdict | Pros | Cons / invalidation rationale |
|---|---|---|---|
| A. TypeScript-first runtime skeleton inside existing `scripts/` package | **Chosen** | Reuses current package/test tooling; no new dependencies; shortest path to proving ADR 003; preserves Pulse compatibility; easy for `$ralph` to execute in small slices | Not the final high-performance architecture; must keep boundaries clean to avoid entrenching ad hoc TS harness |
| B. Rust-first `pi-sim` runtime core now | Deferred | Stronger long-term systems language fit; aligns with Rust `pi-monitor`; good for kiosk/runtime reliability later | Too much migration surface before contracts are proven; new workspace/build decisions; risks stalling on FFI/Pulse integration rather than runtime shape |
| C. Pulse-provider wrap first | Rejected for M1 | Directly addresses current live provider | Keeps Docker/Python shim central; fails the no-Pulse development path; provider interface would be designed under legacy constraints |
| D. Chart/agent seam work next | Rejected for M1 | Visible end-to-end product progress | Builds on runtime foundations not yet implemented; risks reintroducing adapter/display coupling before patient runtime exists |
| E. Spec-only planning/documentation | Rejected | Low risk | The repo already has enough direction; the next value is executable architecture |

## Consensus review snapshot

### Architect review — ITERATE

The Architect approved the direction but required tighter execution handoff details before approval. Steelman antithesis: a TypeScript scripted runtime could become the new accidental architecture center before the real provider contract is proven. Tradeoff tension: TypeScript-first M1 is fastest and lowest-churn, while Rust-first has stronger long-term fit but too much setup risk before contracts stabilize. Required revisions: add an explicit runtime test command, include it in minimum verification, clarify generated telemetry staging, strengthen sibling-boundary checks, and clarify Pulse regression expectations.

Planner revision response: this version adds `test:runtime`, generated-output staging rules, explicit sibling dirty-work checks, and command-preservation verification.

### Critic evaluation — APPROVE

The Critic approved the revised plan as execution-ready. Rationale: the plan directly addresses the Architect's testability and staging concerns, has concrete acceptance criteria, preserves fair alternatives, and gives enough detail for `$ralph` or `$team` without architectural rediscovery. Watch items: enforce Phase 0 staging guard around dirty sibling work, keep TypeScript M1 as reference seam rather than final architecture, label scripted provider as deterministic/demo scalar telemetry, and preserve Pulse command discoverability even when Docker execution is skipped.

## Recommended decision

Execute **Option A** as the next development phase: a bounded TypeScript-first M1 runtime skeleton under the existing `pi-sim` package. Treat it as an architectural proving slice, not the permanent full simulator.

The implementation should create clean module seams under `scripts/runtime/` (or equivalent) rather than expanding `scripts/monitor.ts`. The legacy Pulse path should be renamed/aliased as compatibility (`monitor:pulse`) while a new `sim:run`/`sim:replay` path publishes from the scripted provider.

## Current evidence base

- `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` accepts provider-based patient runtime; Pulse is provider/backend, not center.
- `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md` Phase 1 calls for canonical clock, provider trait/interface, deterministic scripted provider, atomic publisher, CLI, and no-Pulse `current.json` publishing.
- `vitals/README.md` defines `current.json` as the scalar/latest-frame boundary with optional `monitor` display extension.
- `scripts/client.ts` is already the only TS module that knows about the Pulse shim.
- `scripts/monitor.ts` currently mixes scenario loading, Pulse setup, action dispatch, frame creation, alarm computation, atomic writes, terminal rendering, and runtime pacing; M1 should extract new seams instead of deepening this monolith.
- `scripts/types.ts` already has `MonitorExtension`, `VitalFrame`, `Scenario`, `TimelineEntry`, and checkpoint types that can seed the first public contracts.
- `package.json` still describes the repo as a bedside monitor and exposes `monitor:ui`; metadata/script truth should be updated in M1 without deleting legacy commands.

## Scope

### In scope

- Canonical runtime types: clock, sequence, run state, scenario phase, public source metadata.
- Provider interface: `init`, `advance(dt)`, `applyAction`, `snapshot`, optional `waveformWindow` returning unavailable/absent by default.
- Deterministic scripted scalar provider for baseline and simple deterioration/recovery scenarios.
- Atomic public publisher for `vitals/current.json`, `vitals/timeline.json`, and optional `vitals/status.json`.
- CLI entrypoint for scripted no-Pulse runs and replay/smoke workflows.
- Compatibility with the current `current.json` scalar + `monitor` extension shape.
- Tests for clock monotonicity, provider determinism, publisher atomicity/shape, CLI smoke, and boundary greps.
- README/vitals/package script updates needed to make M1 discoverable.

### Out of scope

- Real waveform generation, waveform synthesis as production truth, or Pulse waveform claims.
- Wrapping the current Pulse shim behind the provider interface; that is M2 / Phase 2.
- Chart/EHR ingestion adapter work.
- pi-agent `<Assess>` / alarm channel work.
- Full Rust rewrite or new monorepo/build system.
- Deleting the current Pulse harness or legacy `monitor-ui/` code.

## Architecture target

Preferred file layout for execution:

```text
scripts/
  runtime/
    clock.ts            # canonical sim clock, sequence/run state helpers
    provider.ts         # Provider interface and provider snapshot/action contracts
    scriptedProvider.ts # deterministic scalar provider
    publisher.ts        # atomic current/timeline/status writer
    scenario.ts         # scenario loading/normalization for M1
    frame.ts            # public-frame assembly + alarms + monitor extension
  sim-run.ts            # no-Pulse CLI entrypoint
  monitor.ts            # legacy Pulse monitor path; keep working
  client.ts             # Pulse HTTP client; unchanged except maybe comments/types
```

If execution finds this layout conflicts with TypeScript config or existing conventions, it may choose an equivalent layout, but it must preserve the same conceptual boundaries.

## Public contract direction for M1

M1 writes both legacy top-level scalar keys and the monitor extension:

```json
{
  "t": 30,
  "wallTime": "2026-04-27T00:00:00.000Z",
  "hr": 78,
  "map": 82,
  "bp_sys": 118,
  "bp_dia": 70,
  "rr": 16,
  "spo2": 98,
  "temp_c": 37,
  "alarms": [],
  "monitor": {
    "schemaVersion": 1,
    "source": "pi-sim-scripted",
    "sequence": 15,
    "runState": "running",
    "events": [],
    "heartRhythm": "unavailable"
  }
}
```

Rules:

- `monitor.sequence` is monotonic from zero/one for a run.
- `t`/`simTime_s` handling must be documented. For M1, legacy `t` remains required; if `simTime_s` is added, it must mirror `t` and be tested.
- When the run ends, final output must show `runState: "ended"`.
- No `monitor.waveforms` in runtime output unless the provider supplies truthful samples; scripted M1 should normally omit waveforms.

## Implementation plan

### Phase 0 — Safety preflight and stage guard

1. Record `git status --short` and separate prior dirty work into: unrelated sibling changes, doc-quarantine changes, M2 monitor-extension changes, and new M1 changes.
2. Confirm docs from Phase 0 architecture rebase are committed or intentionally left as pre-existing dirty; do not stage unrelated `pi-chart`/`pi-monitor` changes during M1.
3. Snapshot current `vitals/current.json` shape and current `npm run typecheck` status.
4. Update only volatile OMX state/context for execution notes; durable plan/PRD/test-spec are this lane's control artifacts.

Exit gate: execution agent has a file-level staging map before edits.

### Phase 1 — Runtime contracts and clock

1. Add runtime types for `RunState`, `SimClock`, `RuntimeFrame`, `ProviderSnapshot`, `ProviderAction`, and provider metadata.
2. Add monotonic clock/sequence helper with deterministic advancement.
3. Add unit tests for: start, advance, pause/unpause if implemented, end, sequence monotonicity, invalid `dt` rejection.
4. Add an explicit no-dependency package script for runtime tests. Preferred shape: `npm run test:runtime` backed by `tsx scripts/runtime/test.ts` or equivalent Node `assert`-based runner.

Exit gate: `npm run typecheck` and `npm run test:runtime` pass.

### Phase 2 — Scripted scalar provider

1. Add deterministic scripted provider that reads a small M1 scenario definition or built-in fixture.
2. Provider should support at least:
   - baseline stable vitals
   - a simple deterioration/recovery segment driven by scheduled waypoints or simple interpolation
   - action acceptance as logged/no-op where actions are not implemented, with explicit event output
3. Label source as `pi-sim-scripted` and fidelity as scripted/demo in docs.
4. Keep the provider deterministic with no random noise unless a seeded deterministic generator is explicitly added and tested.

Exit gate: provider tests prove repeatable snapshots for the same scenario/time and no hidden Pulse/Docker dependency.

### Phase 3 — Public frame assembly and publisher

1. Extract/reuse alarm computation without importing monitor/display code.
2. Assemble public frame with legacy scalar keys plus monitor extension.
3. Add atomic writer for `current.json`; append/replace `timeline.json` in the current compatibility shape; write optional `status.json` if useful.
4. Add tests using a temp directory to verify atomic write shape, ended state, timeline ordering, and no fake waveform output.
5. Keep smoke/generated telemetry out of committed public files by default: tests and CLI smoke should write to a temp dir or `.omx/evidence/pi-sim-m1-runtime-skeleton-<date>/vitals/`. If execution intentionally writes `vitals/current.json` or `vitals/timeline.json`, it must either restore them before staging or record an explicit reason to stage generated outputs.

Exit gate: `npm run test:runtime` passes; temp-dir publisher tests pass; output validates against documented M1 shape; `git status --short vitals/current.json vitals/timeline.json` is understood before staging.

### Phase 4 — CLI and package scripts

1. Add `scripts/sim-run.ts` (name can vary) with flags:
   - `--scenario <path>`
   - `--duration <seconds>`
   - `--dt <seconds>`
   - `--time-scale <n>` or `--no-pacing`
   - `--out-dir <path>` defaulting to `vitals/`
2. Add `npm run sim:run` and `npm run sim:run:demo` scripts.
3. Keep existing `npm run monitor`, but consider making it explicitly Pulse-compatible in docs and adding `monitor:pulse` alias.
4. Update `package.json` description away from “bedside-monitor backed…” toward “hidden patient simulation runtime”.

Exit gate: CLI can produce `vitals/current.json` without Docker/Pulse.

### Phase 5 — Monitor-boundary smoke and docs

1. Run the scripted CLI into a temp or `.omx/evidence/...` output directory by default. Avoid changing tracked `vitals/current.json` / `vitals/timeline.json` during smoke unless the execution note says why.
2. Verify `../pi-monitor` can parse/render that `current.json` if the sibling workspace is available; otherwise run the strongest local schema/grep proof and document why monitor smoke was skipped.
3. Update `README.md` and `vitals/README.md` with the new no-Pulse scripted runtime path and clarify that Pulse remains a provider path for acute physiology.
4. Add a short M1 completion note to this plan or an evidence file.

Exit gate: docs and smoke evidence prove a no-Pulse patient-runtime path exists.

## Acceptance criteria

1. `npm run test:runtime` exists and passes using no new dependencies unless the user explicitly approves one.
2. `npm run sim:run:demo` (or final equivalent) runs with no Docker/Pulse process and writes `vitals/current.json` plus timeline/status outputs.
3. Generated `current.json` includes legacy scalar keys, `wallTime`, `alarms`, and `monitor.schemaVersion/source/sequence/runState/events/heartRhythm`.
4. `monitor.sequence` and sim time are monotonic over the run; final frame is `ended` when duration completes.
5. Scripted provider output is deterministic across two identical runs.
6. Pulse path remains available through existing or alias command and is not silently removed.
7. No runtime waveform samples are emitted unless explicitly labeled fixture/demo and tested; preferred M1 behavior is no `monitor.waveforms`.
8. `pi-monitor` can consume the public output, or a documented skip explains why the sibling smoke could not run.
9. Boundary greps show no hidden `pi-monitor`/`pi-chart` imports in `pi-sim` runtime modules and no new direct `pi-agent` coupling.

## Verification commands

Minimum local verification after M1:

```bash
npm run typecheck
npm run test:runtime
npm run sim:run:demo -- --out-dir .omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals
node -e "const f=require('fs').readFileSync('.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json','utf8'); const j=JSON.parse(f); if (!j.monitor || j.monitor.source !== 'pi-sim-scripted') process.exit(1); console.log(j.monitor.runState, j.monitor.sequence)"
rg -n "from .*pi-monitor|from .*pi-chart|from .*pi-agent|require\(.*pi-monitor|require\(.*pi-chart|require\(.*pi-agent" scripts || true
git diff --name-only -- ../pi-monitor ../pi-chart
```

If `../pi-monitor` is available and buildable:

```bash
cd ../pi-monitor && cargo test && cargo run -p monitor-cli -- render --source ../pi-sim/.omx/evidence/pi-sim-m1-runtime-skeleton-smoke/vitals/current.json
```

Pulse regression is not required for M1 because M1's point is no-Pulse execution. Execution must still verify command/script preservation (`npm run | sed -n '/monitor/p;/pulse/p;/sim:/p'`) and docs. If Pulse code is touched or Docker is available, run Pulse checks opportunistically and document Docker availability.

## Embedded ADR for M1

### Decision

For M1, implement the patient-runtime skeleton in the existing TypeScript package with explicit runtime/provider/publisher seams and a deterministic scripted scalar provider. Defer a Rust `pi-sim` core and Pulse-provider wrapper until after the runtime contract is proven.

### Drivers

- ADR 003 requires provider-based patient runtime to become executable.
- Development must not be blocked by Docker/Pulse.
- Existing TypeScript package can prove the public contract with least churn and no new dependencies.
- Rust remains attractive later, but only after the scenario/provider/public-telemetry contracts stop moving.

### Alternatives considered

- Rust-first runtime core: deferred due migration/build surface.
- Pulse wrapper first: rejected because it keeps legacy provider central.
- Chart/agent seam first: rejected because it depends on a stable patient runtime.
- Spec-only follow-up: rejected because architecture direction is already settled.

### Consequences

- TypeScript runtime modules become the reference contract for M1, not necessarily the final implementation language.
- Future Rust work should port clean runtime seams, not the old `monitor.ts` monolith.
- The scripted provider is explicitly deterministic/scalar/demo-grade; Pulse or later providers own higher-fidelity physiology.

### Follow-ups

1. M2: wrap current Pulse path behind the provider interface.
2. M3: public event/waveform lanes only after truthful provider samples/events exist.
3. M4: assessment/latent findings and chart/agent seams once patient-runtime clocks and scenarios are stable.

## Available agent types roster

- `explore`: fast repo lookup and staging maps.
- `executor`: primary implementation for runtime modules and CLI.
- `test-engineer`: test matrix, smoke scripts, determinism checks.
- `verifier`: completion evidence and validation.
- `architect`: boundary review when M1 touches public contracts.
- `critic` / `code-reviewer`: final acceptance and context-poison guard.
- `writer`: docs and completion/evidence notes.
- `build-fixer`: if TypeScript, cargo, or package script failures block verification.

## Staffing guidance

### Sequential `$ralph`

Recommended for M1 unless the user wants high-throughput parallel work. Launch:

```bash
$ralph .omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md
```

Suggested reasoning: high for leader; medium executor; high verifier. Ralph should execute phases in order because each phase depends on the previous contract.

### Parallel `$team`

Use only after Phase 0 staging map if parallel throughput is desired. Suggested lanes:

1. Executor A: runtime contracts + clock (`scripts/runtime/clock.ts`, `provider.ts`).
2. Executor B: scripted provider (`scripts/runtime/scriptedProvider.ts`, scenario fixture).
3. Executor C: publisher/frame assembly (`scripts/runtime/publisher.ts`, `frame.ts`).
4. Test-engineer: tests and smoke scripts after modules land.
5. Writer: README/vitals/package docs after CLI stabilizes.
6. Verifier/code-reviewer: final boundary and acceptance pass.

Launch hint:

```bash
$team "Execute .omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md with disjoint file ownership; preserve existing dirty sibling work; verify npm typecheck, scripted CLI, and pi-monitor smoke where available."
```

Team verification path: leader integrates, runs full local verification, records skipped Pulse/pi-monitor checks explicitly, and stages only M1-owned files.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TypeScript skeleton becomes accidental final architecture | Medium | Plan labels it M1/reference contract; keep provider/publisher seams clean; future Rust ADR after contract stabilizes |
| Scripted provider is mistaken for clinical fidelity | High | Source label `pi-sim-scripted`; docs say deterministic/demo scalar provider; no fake waveforms |
| Dirty working tree causes accidental staging | High | Phase 0 staging map; path-limited staging; generated telemetry written to temp/evidence by default; no unrelated sibling commits |
| Legacy Pulse path breaks | Medium | Do not refactor `client.ts`/`monitor.ts` unless required; keep aliases; verify scripts/docs even when Docker runtime is unavailable |
| `pi-monitor` smoke blocked by sibling dirty build | Medium | Attempt smoke; if blocked, document reason and verify JSON contract locally |
| Scope creep into chart/agent seams | High | Explicitly out of scope; M1 only publishes public telemetry |
