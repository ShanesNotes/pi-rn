# Context snapshot — pi-sim M2 Pulse provider runtime

Task: `$ralplan next phase of development` after M1 runtime skeleton.

Desired outcome: produce a consensus-reviewed, execution-ready next-phase plan for `pi-sim`, grounded in the completed M1 no-Pulse scripted runtime and current architecture direction.

## Known facts and evidence

- Current authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` and `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`.
- M1 plan executed: `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`.
- M1 code exists under `scripts/runtime/` plus `scripts/sim-run.ts` and `vitals/scenarios/scripted_m1_demo.json`.
- M1 verification evidence exists in `.omx/evidence/pi-sim-m1-runtime-skeleton-20260427.md` and post-deslop evidence.
- M1 proves canonical clock, provider interface, deterministic scripted scalar provider, public frame assembly, atomic publisher, CLI, and `../pi-monitor` render compatibility without Pulse/Docker.
- Existing Pulse code remains in `scripts/client.ts` and `scripts/monitor.ts`; it is still a legacy monitor/publisher path, not yet behind the M1 `PhysiologyProvider` interface.
- Existing Pulse scenarios use legacy `Scenario` shape in `scripts/types.ts` with `state_file`, optional `state_bake`, `duration_s`, `timeline`, and `checkpoints`.
- Current Pulse shim output is scalar-only; runtime waveforms must remain absent unless provider-supplied truth exists or fixtures are explicitly labeled demo/test.
- Working tree has many pre-existing uncommitted changes across `pi-sim`, `pi-monitor`, and `pi-chart`; next execution must use path-limited staging and avoid broad commits.

## Constraints

- `pi-sim` remains hidden patient runtime; Pulse is a provider/backend, not architecture center.
- `pi-monitor` consumes public telemetry only and must not write chart truth.
- `pi-chart` adapter path is separate and must not constrain monitor/display path.
- `pi-agent` must not import hidden `pi-sim/scripts`, `pi-sim/pulse`, provider internals, or scenario secrets.
- No fake production waveforms.
- No new dependencies without explicit user approval.
- Keep M1 scripted no-Pulse runtime green while adding Pulse provider work.

## Consensus hypothesis

Next phase should be M2: wrap the existing Pulse client/shim path behind the M1 `PhysiologyProvider` boundary, route Pulse scenarios through the same runtime clock/frame/publisher path as the scripted provider, and leave the old `scripts/monitor.ts` path as a compatibility shim or thin alias until parity is proven.

## Open planning questions

1. Should M2 prioritize a full Pulse-provider CLI path over refactoring/removing legacy `scripts/monitor.ts`?
2. How should Pulse unavailability be represented: failed CLI exit, `runState: unavailable` output, or both?
3. How much scenario schema normalization should happen now versus later encounter-depth phases?
4. What verification can be required when Docker/Pulse may be unavailable in developer environments?
