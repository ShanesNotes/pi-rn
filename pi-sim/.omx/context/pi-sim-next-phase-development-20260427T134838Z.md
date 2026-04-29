# Context snapshot — pi-sim next phase development

Task: `$ralplan the next phase of development`.

Desired outcome: produce a consensus-reviewed, execution-ready next-phase plan for `pi-sim` after the patient-runtime/provider architecture rebase and documentation quarantine.

## Known facts and evidence

- `README.md` now frames `pi-sim` as the hidden patient simulation runtime. It owns encounter timeline/state, hidden/latent clinical facts, physiology/provider routing, validation, and public telemetry publication.
- `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` is accepted and says Pulse is a provider/backend, not the architecture center.
- `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md` is the current detailed architecture spine. Phase 0 is documentation/direction freeze; Phase 1 is a runtime skeleton with deterministic scripted provider; Phase 2 wraps Pulse behind provider boundary; Phase 3 adds public waveform/event lanes; Phase 4 deepens clinical surfaces.
- `.omx/plans/plan-pi-sim-doc-quarantine-canonical-direction.md` has been executed and is no longer architecture authority.
- `vitals/README.md` documents `current.json` as backward-compatible scalar/latest-frame public boundary and the optional `monitor` display extension.
- `pulse/README.md` labels the Docker/Python shim as current/legacy Pulse provider implementation notes.
- Current code is a TypeScript harness under `scripts/`: `client.ts` talks to Pulse, `monitor.ts` publishes `current.json` and `timeline.json`, `validate.ts` validates Pulse scenarios, `types.ts` owns current frame/scenario types.
- `package.json` still contains stale description/scripts naming bedside-monitor and monitor-ui; next code lane should address public script/metadata truth carefully.
- Validation recovery gates are documented as passed in `.omx/plans/prd-validation-recovery.md`; `npm run validate` can still be blocked in fresh environments by Pulse/Docker runtime availability.
- Dirty working tree contains unrelated sibling `pi-chart` and `pi-monitor` changes plus prior `pi-sim` doc/runtime WIP. Execution plan must include a staging/preflight guard and avoid broad staging.

## Constraints

- `pi-agent` must not import hidden `pi-sim` internals.
- `pi-monitor` is display-only and consumes public telemetry only; it must not write chart truth.
- `pi-chart` chart/EHR adapter is separate and must not constrain monitor/display path.
- No fake production clinical waveforms. Runtime waveform lanes require truthful provider samples or explicit fixture/demo labeling.
- No new dependencies without explicit request.
- Keep current Pulse path available during the first runtime skeleton phase unless explicitly superseded by a later plan.
- Prefer small, reversible, testable slices with durable plans/PRD/test-spec artifacts.

## Likely next development direction

Consensus hypothesis before review: execute Phase 1 from the architecture rebase plan — a no-Pulse patient-runtime skeleton with canonical clock, sequence/run-state, scenario phase, provider interface, deterministic scripted scalar provider, atomic publisher, CLI, tests, and compatibility with `vitals/current.json` + `../pi-monitor`.

## Open questions for consensus review

1. Should Phase 1 be TypeScript-first inside the existing package, Rust-first as a new runtime core, or spec-first only?
2. How much legacy `scripts/monitor.ts` should be touched versus left as `monitor:pulse` compatibility?
3. What is the minimum useful scripted provider that is clearly not pretending to be high-fidelity Pulse physiology?
4. Which PRD/test-spec artifacts should become the next `$ralph` target?
