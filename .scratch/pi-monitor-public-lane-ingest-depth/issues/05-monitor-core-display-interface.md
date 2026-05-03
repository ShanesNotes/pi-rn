# Stabilize monitor-core display Interface expectations

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`

## What to build

Define the display Interface that `monitor-core` provides to terminal, HTML, and native UI renderers after any Adapter accepts public telemetry. This Interface should be stable enough for renderer parity checks without exposing hidden simulator or chart-write semantics.

## Acceptance criteria

- [ ] Display model covers numeric vitals, freshness/offline/invalid states, public alarms/events, encounter/assessment context notes, waveform availability/current labels, and lane warnings.
- [ ] Renderers keep explicit display-only language: not charted, not part of the medical record, and not a certified medical device where applicable.
- [ ] Display model does not include chart-write intent, patient truth mutation, hidden provider state, or future scenario truth.
- [ ] Terminal, HTML, and native UI smoke tests assert the same core authority language and no-save/no-chart affordance.
- [ ] Any renderer-specific fields remain presentation details, not new telemetry authority.

## Blocked by

Maintainer triage of `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`.

## Closeout commands

```bash
cd pi-monitor
cargo test -p monitor-core
cargo test -p monitor-ui
cargo test -p monitor-app
```

## Comments

- 2026-05-03: Seeded by team planning pass from `.scratch/architecture-deepening-placement/`.
