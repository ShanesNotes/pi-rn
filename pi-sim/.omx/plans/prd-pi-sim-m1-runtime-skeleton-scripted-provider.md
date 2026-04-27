# PRD — pi-sim M1 runtime skeleton with deterministic scripted provider

Status: **APPROVED — paired with consensus plan**
Parent plan: `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`
Parent authority: `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`
Paired test spec: `.omx/plans/test-spec-pi-sim-m1-runtime-skeleton-scripted-provider.md`

## Goal

Create the first executable patient-runtime skeleton for `pi-sim`: a no-Pulse deterministic scripted provider that publishes public scalar vitals through the same `vitals/current.json` boundary consumed by sibling projects.

## User / project value

- Developers can run and verify `pi-sim` patient-runtime behavior without Docker/Pulse.
- `pi-monitor` has a truthful public telemetry producer for display integration.
- The repo moves from doc-only architecture direction to testable code seams.
- Future Pulse wrapping, event lanes, chart adapters, and assessment queries have a stable runtime contract to build on.

## Non-goals

- No real waveform production.
- No chart/EHR adapter.
- No pi-agent hidden-state query or alarm transport.
- No Pulse provider wrapper in M1.
- No Rust rewrite in M1.
- No removal of existing Pulse monitor path.

## Functional requirements

1. Add an explicit `npm run test:runtime` (or final equivalent) script using existing dependencies only.
2. Provide a runtime/provider interface with deterministic `init`, `advance`, `snapshot`, and action-handling semantics.
3. Provide a scripted scalar provider that can run baseline and simple deterioration/recovery trajectories without Pulse.
4. Publish `vitals/current.json` atomically with legacy scalar fields and `monitor` extension metadata.
5. Maintain monotonic sim time and monitor sequence.
6. Write timeline/status output sufficient for replay/debugging.
7. Add package scripts for no-Pulse run/smoke.
8. Preserve current Pulse commands or provide explicit compatibility aliases.
9. Document the new no-Pulse path and the scripted provider's fidelity limits.

## Acceptance criteria

- `npm run typecheck` passes.
- `npm run test:runtime` exists and passes.
- `npm run sim:run:demo` or final equivalent exits 0 without Pulse/Docker.
- Generated smoke output writes to a temp/evidence directory by default; tracked `vitals/current.json` and `vitals/timeline.json` are restored or explicitly staged with rationale.
- Generated `current.json` includes `monitor.source: "pi-sim-scripted"`, monotonic `monitor.sequence`, and final `monitor.runState: "ended"` for completed runs.
- Two identical scripted runs produce equivalent deterministic scalar timelines after ignoring wall-clock timestamps if wall time is intentionally real-time.
- No generated runtime frame contains production `monitor.waveforms`.
- Current Pulse path remains discoverable by command name or alias; actual Pulse execution is subject to Docker availability and is only required if Pulse code is touched.
- Docs identify ADR 003 and M1 scripted provider status.

## Execution notes

Use `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md` as the authoritative execution plan. Stage only M1-owned files and avoid unrelated sibling dirty work.
