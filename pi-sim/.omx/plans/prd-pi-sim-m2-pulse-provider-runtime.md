# PRD — pi-sim M2 Pulse provider behind patient-runtime boundary

Status: **APPROVED — paired with consensus plan**
Parent plan: `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`
Parent authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`
Paired test spec: `.omx/plans/test-spec-pi-sim-m2-pulse-provider-runtime.md`

## Goal

Wrap the existing Pulse shim/client/scenario path as a physiology provider behind the M1 patient-runtime boundary, so scripted and Pulse-backed runs share one runtime clock, public frame assembly, publisher, and monitor-facing telemetry contract.

## User / project value

- Preserves hard-won Pulse physiology/action work without making Pulse the architecture center.
- Reduces drift between scripted and Pulse runs by converging on the same runner/publisher.
- Gives `pi-monitor` one public telemetry contract regardless of provider.
- Keeps local development reliable through M1 scripted tests while enabling optional live low-acuity Pulse smoke.

## Non-goals

- No real waveform generation.
- No chart/EHR adapter.
- No pi-agent interface.
- No Rust rewrite.
- No broad Pulse Python shim rewrite unless required for compatibility.
- No deletion of legacy `monitor:pulse` before parity is proven.

## Functional requirements

1. Add a provider-agnostic runtime runner or equivalent shared execution loop for clock, action scheduling, frame assembly, and publishing.
2. Preserve existing scripted provider behavior through the shared runner.
3. Add a Pulse provider wrapper with metadata source `pi-sim-pulse` and fidelity `physiology-provider`.
4. Keep `scripts/client.ts` as transport-only or clearly separate transport from runtime policy.
5. Load/normalize Pulse scenarios, including a new or designated low-acuity stable observation scenario plus legacy action timelines and optional baked-state metadata as compatibility references.
6. Add a Pulse provider CLI/package script path for the low-acuity stable observation scenario.
7. Provide fake/no-Docker tests for Pulse provider scalar mapping, action dispatch, unavailable state, and no waveform output.
8. Preserve and document `monitor:pulse` compatibility.
9. Document provider selection and Pulse scalar-only limits.
10. Record final verification evidence under `.omx/evidence/`.

## Acceptance criteria

- `npm run typecheck` passes.
- `npm run test:runtime` passes and includes M2 runner/Pulse provider fake-transport coverage.
- Scripted CLI smoke still passes without Docker/Pulse.
- Pulse provider CLI path exists for a non-acute stable/observation scenario and either runs against a live shim or fails with clear provider-unavailable behavior.
- Generated Pulse frames use shared `PublicTelemetryPublisher` and `buildVitalFrame` semantics.
- Generated Pulse frames include `monitor.source: "pi-sim-pulse"`, monotonic `monitor.sequence`, and no `monitor.waveforms`.
- The selected Pulse smoke scenario is non-acute: continuous logical vital variability only, no ACLS/code blue, no shock/sepsis/pressor/resuscitation/decompensation schema. Any timeline events/actions are non-acute and fire in sim-time order through provider `applyAction`.
- `monitor:pulse` remains discoverable in `npm run` output.
- Tracked `vitals/current.json`, `vitals/timeline.json`, and `vitals/status.json` are not accidentally staged from smoke runs.
- Boundary grep shows no direct sibling implementation imports.

## Execution notes

Use `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md` as the authoritative execution plan. If M1 changes are still uncommitted, start with a staging guard and path-limited ownership map before editing.
