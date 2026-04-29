# Plan — pi-sim architecture rebase as patient runtime

Generated: 2026-04-27
Status: **AUTHORITATIVE PROJECT DIRECTION — backed by ADR 003**
Scope: `pi-sim/` post-`pi-monitor` split architecture direction
Depends on: `pi-monitor` M1 commit `918e7be` and M2 monitor-extension work-in-progress
Durable decision record: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`

## Authority and intent

This document captures the preferred first-principles direction for overhauling `pi-sim` after the standalone `pi-monitor` split.

When this document conflicts with older shim-first, PySide-monitor-first, or chart-display-first planning artifacts, treat this document as the newer architectural direction unless a later plan explicitly supersedes it.

The durable decision is:

> `pi-sim` should become a scenario-driven **patient simulation runtime** with provider-based physiology. Pulse is a valuable provider/backend, not the architecture itself. `pi-monitor` owns live display; `pi-chart` owns clinical memory/chart truth; `pi-agent` reaches `pi-sim` only through explicit clinical/public interfaces.

## Current evidence base

- `README.md:3` currently frames `pi-sim` as a bedside monitor backed by Pulse Docker + Python shim + TypeScript harness.
- `README.md:45` says the current harness writes `vitals/current.json` and `vitals/timeline.json` each tick.
- `README.md:82` says clinician-facing workspaces consume explicit interfaces only and must not see Pulse container, Python shim, or TS harness internals.
- `README.md:88-93` says `pi-sim` owns patient-state generation, physiology, monitoring, and validation, while `pi-agent` reads only `vitals/*.json` and Pulse internals remain implementation details.
- `pulse/README.md:3` says Pulse is currently an opaque Docker HTTP service for the rest of `pi-sim`.
- `pulse/README.md:7-9` says pi-agent never reaches the Pulse process; scenario action schedules live in `vitals/scenarios/*.json`, while the Node harness calls `/action`.
- `pulse/README.md:17-19` documents the current shim as stdlib HTTP that drives `/pulse/bin/PulseScenarioDriver` per generated scenario.
- `pulse/README.md:73-75` documents the current Pulse output schema as scalar vitals only.
- `pulse/README.md:108-126` documents the shim as a pragmatic rewrite away from FastAPI/uvicorn/Pulse Python wrapper because the pinned image lacks expected dependencies; each `/advance` spawns the driver and parses a CSV last row.
- `scripts/client.ts:1-3` explicitly localizes Pulse-sidecar knowledge to the TS HTTP client.
- `scripts/client.ts:20` types shim output as scalar `RawVitals` plus `t`.
- `scripts/monitor.ts:45-61` wraps scalar Pulse output into `VitalFrame` and currently sets monitor metadata such as `sequence`, `runState`, events, and `heartRhythm: "unavailable"`.
- `vitals/README.md:69-82` defines the new optional `monitor` extension and says current shim output does not expose real waveform samples.
- `docs/adr/002-pi-sim-as-patient-three-stream-topology.md:39-47` already reframes `pi-sim` as the patient, not the monitor, and Pulse as an optional injector/backend.
- `docs/adr/002-pi-sim-as-patient-three-stream-topology.md:63-68` defines vitals as a continuous stream rendered live and later aggregated/promoted to chart state.
- `docs/adr/002-pi-sim-as-patient-three-stream-topology.md:110-116` says Pulse can stay dormant for MVP and should reactivate at scenario level, not globally.
- `docs/adr/002-pi-sim-as-patient-three-stream-topology.md:127-143` names a patient-engine layer, a chart state machine, skills, and a canonical clock/event model as implied subsystems.
- `.omx/plans/plan-pulse-live-vitals-monitor.md:33-44` settles standalone display-only `pi-monitor`, no hidden `pi-sim` internals, no fake clinical signals, and plan durability.
- `.omx/plans/plan-pulse-live-vitals-monitor.md:88-108` defines the post-split monitor path and keeps chart truth on a separate future path.
- `../pi-monitor/README.md:3-16` shows the new monitor is a standalone Rust display-only consumer of public `pi-sim` telemetry and must not import hidden `pi-sim` internals or write chart truth.
- `../pi-monitor/README.md:44` states the live Pulse shim is scalar-only and waveform fixtures are synthetic demo/test data only.
- `../pi-monitor/docs/ADR-0002-current-json-monitor-extension.md:5-19` keeps `current.json` as the live monitor boundary, adds optional monitor metadata, and states live `monitor.waveforms` remains absent until a future public publisher exposes real samples.

## Requirements summary

Rebase `pi-sim` around a clean patient-runtime architecture instead of extending the existing Pulse shim/TypeScript harness as the center of the system.

Binding direction:

1. **`pi-sim` is the patient runtime.** It owns scenario timeline, patient state, physiology progression, hidden/latent clinical facts, assessment findings, lab/result rollout, and public telemetry publication.
2. **Pulse is a provider.** Pulse remains valuable for acute physiology, drug response, and validation, but it sits behind a provider boundary and may be swapped, bypassed, or dormant per scenario.
3. **`pi-monitor` is the display.** The monitor consumes public telemetry and remains display-only. It does not drive simulation, write chart truth, or import hidden `pi-sim` internals.
4. **`pi-chart` is chart truth / clinical memory.** Chart/EHR adapter work consumes public/latent telemetry separately and must not constrain monitor fidelity.
5. **`pi-agent` only sees explicit clinical surfaces.** No direct access to hidden `pi-sim` source, Pulse internals, or scenario secrets.
6. **Canonical time is first-class.** Every emitted frame/event/assessment/result must share a coherent sim-time, sequence, wall-time, and run-state contract.
7. **Telemetry separates scalar vitals from waveform samples.** `current.json` remains the simplest public scalar/latest-frame boundary; waveform windows/events can become separate public files when needed rather than hidden sockets or monitor-owned synthesis.
8. **Current shim is prototype/reference, not destiny.** Salvage hard-won Pulse mappings, action payload knowledge, baked-state procedure, validation curves, and boundary lessons. Do not preserve the shim-first shape merely because it exists.

## RALPLAN-DR summary

### Principles

1. **Patient-first:** build the synthetic patient substrate before optimizing display, charting, or agent ergonomics.
2. **Provider isolation:** no consumer should care whether vitals came from Pulse, a scripted provider, fixtures, or a future waveform-capable engine.
3. **Public boundaries:** sibling projects consume documented public outputs only.
4. **Truthful telemetry:** no fake runtime clinical signals; synthetic data is fixture/demo-only and labeled.
5. **Durable clocks:** sim time, sequence, and run state must be coherent across monitor, chart, validation, and agent action timestamps.

### Decision drivers

1. **Post-split clarity:** `pi-monitor` now owns monitor behavior, so `pi-sim` should stop carrying stale monitor/UI assumptions.
2. **Future physiology flexibility:** Pulse is useful but scalar-only in the current integration; provider isolation avoids locking the whole architecture to Docker/CSV/subprocess constraints.
3. **Clinical simulation depth:** the long-term system needs coherent history, physical, vitals, labs, events, and assessment surfaces, not only latest scalar vitals.

### Viable options considered

| Option | Status | Pros | Cons / invalidation rationale |
|---|---|---|---|
| Rebase `pi-sim` into a provider-based patient runtime | **Chosen** | Cleanest boundaries; aligns with ADR 002; isolates Pulse; supports scenario rollout, canonical clock, monitor, chart, and agent seams | Requires staged migration and new runtime skeleton |
| Incrementally extend current TS + Python shim | Rejected as final architecture | Lowest short-term cost; preserves current commands | Keeps shim-first mental model, scalar limitations, Docker/subprocess/CSV constraints, and stale monitor assumptions at the center |
| Make Pulse the authoritative global runtime | Rejected | Good for acute physiology fidelity where Pulse is strong | Pulse is currently scalar-only here; ADR 002 says Pulse is optional/scenario-level; over-centralizes around a difficult integration |
| Move simulation into `pi-monitor` | Rejected | Might make live display easier | Violates patient/display separation; monitor would become simulation truth and chart/agent seams would drift |
| Move simulation into `pi-chart` | Rejected | Could simplify chart persistence | Collapses hidden-patient state into chart truth and undermines partial observability |

## Target architecture

```text
patient encounter definition
  ├─ demographics/history/chart preload references
  ├─ hidden physical findings and assessment responses
  ├─ scenario timeline and disclosure schedule
  ├─ physiology backend selection per segment/scenario
  └─ expected validation checkpoints
        ↓
pi-sim runtime / canonical clock
  ├─ scenario state machine
  ├─ hidden patient state
  ├─ event scheduler
  ├─ assessment/query responder
  └─ provider router
        ↓
physiology providers
  ├─ scripted-scalar provider
  ├─ Pulse scalar provider
  ├─ fixture/replay provider
  └─ future waveform-capable provider
        ↓
public telemetry publisher
  ├─ vitals/current.json                latest scalar frame + monitor extension
  ├─ vitals/waveforms/current.json      optional bounded waveform windows
  ├─ vitals/events.jsonl                alarms/rhythm/scenario events
  ├─ vitals/frames.jsonl                optional replay/debug stream
  └─ scenario/status.json               phase, run-state, clock, source metadata
        ↓
consumers
  ├─ pi-monitor                         display-only live monitor
  ├─ pi-chart telemetry adapter          latent/charted clinical memory
  └─ pi-agent clinical interfaces        read/assess/write/alarm response only
```

## Proposed package shape

The exact folder layout may be adjusted during execution, but the preferred direction is a new provider-oriented runtime surface rather than extending the TS harness as the permanent center.

```text
pi-sim/
  crates/ or runtime/
    sim-core/             canonical clock, scenario state, event queue, run-state
    sim-scenario/         encounter definition schema + loader + validation
    sim-physiology/       provider traits and shared telemetry model
    sim-provider-scripted/ deterministic scalar provider for fixtures/MVP
    sim-provider-pulse/   wrapper around current or rewritten Pulse sidecar
    sim-publisher/        atomic public file publisher
    sim-cli/              run, replay, validate, inspect, export
  pulse-legacy/ or pulse/
    shim/                 retained initially as legacy provider implementation/reference
  vitals/
    current.json
    waveforms/current.json
    events.jsonl
    frames.jsonl
    status.json
    scenarios/*.json
  docs/adr/
    003-pi-sim-patient-runtime-provider-architecture.md
```

If the repo keeps TypeScript for the first migration step, the same boundaries still apply: provider interfaces, scenario runtime, and publisher must be explicit modules, not ad hoc coupling through `scripts/client.ts` and `scripts/monitor.ts`.

## Public telemetry contract direction

### Scalar/latest frame

`vitals/current.json` remains the compatibility anchor. It should converge toward a shape that includes:

```json
{
  "schemaVersion": 1,
  "source": "pi-sim/provider-name",
  "sequence": 42,
  "runState": "running",
  "simTime_s": 123.5,
  "wallTime": "2026-04-27T00:00:00.000Z",
  "scenarioPhase": "moderate_shock",
  "vitals": {
    "HeartRate": { "value": 88.0, "unit": "1/min" },
    "MeanArterialPressure": { "value": 71.0, "unit": "mmHg" }
  },
  "events": ["MAP_LOW"],
  "heartRhythm": "unavailable",
  "monitor": {
    "schemaVersion": 1,
    "events": ["MAP_LOW"]
  }
}
```

Backward-compatible lower-case scalar fields may continue during migration. `pi-monitor` already supports legacy and extension shapes; future migration should be explicit and tested.

### Waveform windows

Do not force high-frequency samples into scalar compatibility forever. Add a separate public waveform boundary when ready:

```text
vitals/waveforms/current.json
```

Minimum shape:

```json
{
  "schemaVersion": 1,
  "source": "pi-sim/provider-name",
  "sequence": 42,
  "simTime_s": 123.5,
  "windows": {
    "ECG_LeadII": { "unit": "mV", "sampleRate_Hz": 125, "t0_s": 121.5, "values": [] },
    "Pleth": { "unit": "unitless", "sampleRate_Hz": 50, "t0_s": 121.5, "values": [] }
  }
}
```

Rules:

- Runtime waveforms must be provider-supplied or absent.
- Synthetic waveforms are allowed only in fixtures/tests/demo mode and must be labeled.
- `pi-monitor` may render unavailable strips when windows are absent.

### Events

Use public event output for alarms/rhythm/scenario milestones once scalar frame metadata becomes too cramped:

```text
vitals/events.jsonl
```

Each event should carry `sequence`, `simTime_s`, `wallTime`, `kind`, `source`, and payload. This path should feed both monitor attention and future chart/agent workflows without making either consumer the event owner.

## Implementation plan

### Phase 0 — Freeze direction and inventory current assets

Files likely touched:

- `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`
- `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`
- `README.md`
- `pulse/README.md`
- relevant stale plan tombstones under `docs/plans/` and `.omx/plans/`

Work:

1. Promote this plan or a refined successor as the controlling `pi-sim` architecture direction.
2. Add a real ADR under `docs/adr/` with the decision, drivers, alternatives, and consequences.
3. Inventory current assets into buckets:
   - **keep:** scenario fixtures, validation observations, scalar field mappings, public boundary docs.
   - **salvage/reference:** Pulse action payloads, sepsis bake procedure, state resolution, Docker notes.
   - **archive/tombstone:** old PySide monitor direction, shim-first docs that conflict with provider runtime direction, chart-display-first monitor docs.
4. Document that the current shim remains available as a legacy provider until replaced.

Acceptance criteria:

- New ADR exists and points to this plan.
- Stale docs either point to the new plan or are moved to an archive path.
- No runtime behavior changes in Phase 0.
- `git diff --name-only` shows documentation-only changes for Phase 0.

Verification:

- `rg "patient runtime|provider-based|Pulse is a provider" README.md docs .omx/plans`
- `rg "shim-first|PySide|monitor-ui" docs .omx/plans` confirms stale references are marked historical where applicable.

### Phase 1 — Runtime skeleton with deterministic scripted provider

Files likely touched/created:

- New runtime package/crate/module surface under `pi-sim/`
- `vitals/scenarios/*.json` or new `scenarios/*.json`
- `vitals/current.json` generation path
- tests/fixtures for scripted scenarios

Work:

1. Add `sim-core` concepts: canonical clock, sequence, run state, scenario phase, event queue.
2. Add a provider trait/interface with `init`, `advance(dt)`, `apply_action`, `snapshot`, and optional `waveform_window`.
3. Add a deterministic scripted scalar provider for baseline and simple deterioration scenarios.
4. Add an atomic public publisher that writes `vitals/current.json` and optional `status.json` without depending on Pulse.
5. Add CLI commands for `run`, `replay`, and `validate` using the scripted provider.

Acceptance criteria:

- A no-Pulse scenario can run and publish `current.json` with `sequence`, `runState`, `simTime_s`, source metadata, and scalar vitals.
- `pi-monitor` can render the generated `current.json` without hidden imports.
- Missing/paused/ended states are visible in generated public output.
- Existing Pulse path remains available during this phase unless explicitly removed by a later plan.

Verification:

- Unit tests for clock/sequence/run-state monotonicity.
- CLI smoke: run scripted scenario and render with `../pi-monitor`.
- Boundary grep: no `pi-monitor` imports hidden `pi-sim` internals; no `pi-sim` imports `pi-monitor` implementation internals.

### Phase 2 — Wrap current Pulse path behind provider boundary

Files likely touched:

- Pulse provider module/crate
- `pulse/shim/app.py` only if needed for compatibility fixes
- `scripts/client.ts` or replacement provider client if TS remains during migration
- scenario definitions that select `provider: "pulse"`

Work:

1. Move current Pulse HTTP client behavior behind the provider interface.
2. Keep scalar field mapping explicit and versioned.
3. Preserve known action mappings: hemorrhage, fluid bolus, norepinephrine, stops.
4. Preserve baked-state behavior for sepsis but expose it as provider setup metadata, not global `pi-sim` architecture.
5. Ensure Pulse provider emits the same public telemetry contract as scripted provider.

Acceptance criteria:

- Scripted provider and Pulse provider both publish through the same `sim-publisher` contract.
- Existing `hemorrhagic_shock` and `sepsis_norepi` scenarios can be expressed as provider-selected scenarios.
- Pulse Docker/shim failure reports provider unavailable rather than crashing unrelated runtime surfaces.

Verification:

- Provider contract tests with scripted fake provider.
- Pulse smoke when Docker is available: init, advance, action, publish, render in `pi-monitor`.
- Type/schema tests ensure Pulse scalar output maps to public frame fields exactly once.

### Phase 3 — Public waveform/event lanes

Files likely touched:

- `vitals/README.md`
- public frame/schema docs
- publisher module
- `pi-monitor` fixtures if needed for compatibility

Work:

1. Add `vitals/waveforms/current.json` public contract with bounded windows.
2. Add fixture/demo waveform provider that is clearly labeled non-clinical/synthetic.
3. Add event publisher for alarms, rhythm labels, scenario milestones, and source-state changes.
4. Connect `pi-monitor` to optional waveform/event sources only through public files.
5. Do not claim real Pulse waveforms unless an actual provider supplies them.

Acceptance criteria:

- `pi-monitor` can render waveform windows from public files and unavailable state when absent.
- Synthetic waveform fixtures are visibly labeled as fixtures/demo mode.
- Scalar-only Pulse provider remains valid.

Verification:

- Schema tests for waveform/event files.
- Replay tests with fixture waveform windows.
- Boundary grep for no hidden socket/import coupling.

### Phase 4 — Patient encounter depth and clinical surfaces

Files likely touched:

- scenario schema/docs
- assessment/query responder
- lab/result rollout definitions
- pi-chart adapter plan/docs, not necessarily implementation in this plan

Work:

1. Extend scenario definitions to include history/chart preload references, physical findings, hidden state, lab/result rollout, and encounter phases.
2. Add assessment response interface that reveals physical findings according to sim time and patient state.
3. Add latent clinical event outputs for future chart adapter and agent skills.
4. Keep intervention write-back frozen unless a separate plan opens it.

Acceptance criteria:

- A scenario can describe vitals + hidden assessment findings + timed lab/result rollout from one coherent patient definition.
- The monitor display path remains independent from chart persistence.
- No pi-agent hidden access is introduced.

Verification:

- Scenario schema validation tests.
- Assessment responder unit tests for time-gated findings.
- End-to-end dry run: scenario advances, monitor telemetry emits, assessment query returns expected finding for current sim time.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Overbuilding a runtime before proving scenario value | Slow progress | Phase 1 is intentionally small: clock + scripted provider + publisher + CLI only |
| Losing hard-won Pulse knowledge | Regression in acute physiology | Inventory/salvage before edits; keep current shim as legacy provider until replacement is proven |
| Public contract churn breaks `pi-monitor` | Display regressions | Preserve legacy `current.json` compatibility while adding versioned target fields |
| Waveform ambition causes fake truth | Clinical/display mismatch | Runtime waveforms must be provider-supplied or absent; fixtures must be labeled |
| Docker/Pulse unavailability blocks all work | Development bottleneck | Scripted provider is first-class and can run without Pulse |
| Clock drift across monitor/chart/agent | Inconsistent clinical timeline | Canonical clock, sequence, sim time, run state, and source metadata are Phase 1 requirements |

## Verification strategy

Minimum recurring gates for implementation work:

- `npm run typecheck` for current TS surfaces while they remain.
- Runtime package tests once introduced.
- `../pi-monitor` render/replay smoke against generated public telemetry.
- Boundary grep:
  - `pi-monitor` must not reference `pi-sim/scripts` or `pi-sim/pulse`.
  - `pi-agent` must not reference hidden `pi-sim` internals.
  - monitor path must not write chart truth such as `vitals.jsonl`.
- Scenario schema validation for every scenario artifact.
- Public telemetry fixture compatibility tests for legacy and target shapes.

## ADR

### Decision

Rebase `pi-sim` around a scenario-driven patient runtime with isolated physiology providers. Pulse becomes one provider/backend, not the architectural center. `pi-monitor` remains a standalone display-only consumer; `pi-chart` remains the clinical memory/chart-truth path; `pi-agent` uses only explicit public/clinical interfaces.

### Drivers

- The current Pulse Docker/Python/TS shim predates the standalone `pi-monitor` split and is scalar-only.
- ADR 002 already says `pi-sim` is the patient and Pulse is optional/scenario-level.
- Long-term clinical simulation requires coherent history, physical, vitals, labs, monitor events, chart promotion, and agent assessment surfaces.
- A provider boundary protects future Rust/native work and avoids over-coupling to Docker/subprocess/CSV constraints.

### Alternatives considered

1. **Extend current shim-first architecture.** Rejected as final architecture because it preserves accidental constraints and keeps Pulse transport mechanics central.
2. **Make Pulse globally authoritative.** Rejected because Pulse is valuable but not sufficient for all patient/encounter data and current integration is scalar-only.
3. **Move simulation truth into `pi-monitor`.** Rejected because it collapses display into patient state generation.
4. **Move simulation truth into `pi-chart`.** Rejected because hidden/latent patient state must remain separate from charted clinical truth.
5. **Provider-based patient runtime.** Chosen because it matches the post-split architecture and keeps all seams explicit.

### Why chosen

This direction gives the project a stable first-principles shape: `pi-sim` generates patient reality, `pi-monitor` displays public telemetry, `pi-chart` records/promotes clinical truth, and `pi-agent` acts through constrained clinical tools. It also lets Pulse improve or change without forcing every consumer to understand Pulse internals.

### Consequences

- Current Pulse shim work is not wasted, but becomes legacy provider/reference material.
- Some existing docs and `monitor-ui` surfaces become historical or superseded.
- A new runtime skeleton is needed before deeper Pulse/waveform work.
- Public telemetry schemas become more important and should be versioned/tested.

### Follow-ups

1. Create `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` from this ADR section.
2. Archive/tombstone stale monitor/UI and shim-first planning artifacts.
3. Draft Phase 1 PRD/test-spec for the runtime skeleton.
4. Investigate Pulse waveform/event capabilities separately before promising live ECG/pleth/capnogram truth.
5. Coordinate `pi-monitor` fixture/schema updates as public telemetry evolves.

## Available-agent-types roster and staffing guidance

Known useful native roles:

- `explore` — fast codebase mapping and stale-doc inventory.
- `planner` — PRD/test-spec and milestone sequencing.
- `architect` — provider boundary, canonical clock, scenario/runtime shape review.
- `executor` — implementation of bounded runtime/docs slices.
- `test-engineer` — schema, provider contract, CLI, and boundary tests.
- `verifier` — final evidence and acceptance validation.
- `code-reviewer` — cross-cutting review after implementation.
- `writer` — ADR/tombstone/docs migration.

### Recommended `$ralph` handoff

Use Ralph for Phase 0 or Phase 1 when single-owner continuity matters:

```bash
$ralph .omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md
```

Suggested Ralph first target:

1. Phase 0 documentation/ADR/tombstone pass.
2. Then a separate Phase 1 plan for runtime skeleton implementation.

### Recommended `$team` handoff

Use Team only once execution splits into independent lanes:

```bash
$team .omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md
```

Suggested lanes:

1. **Explore lane:** inventory current docs/code into keep/salvage/archive.
2. **Writer lane:** draft ADR 003 and README direction updates.
3. **Architect lane:** refine provider interface, canonical clock, telemetry contract.
4. **Test-engineer lane:** define Phase 1 test/verification matrix.
5. **Executor lane:** implement docs/tombstones or later runtime skeleton once approved.

Team verification path:

- Team proves every touched doc points to the new authority and no source behavior changed in Phase 0.
- Ralph or verifier then checks line references, stale-doc coverage, and final git diff scope before commit.

## Plan changelog

- 2026-04-27: Initial durable direction artifact created from user-approved first-principles architecture discussion and current repository evidence.
