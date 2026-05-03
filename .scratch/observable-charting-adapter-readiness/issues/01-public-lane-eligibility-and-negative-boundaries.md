# Public lane eligibility and negative boundaries

Status: needs-triage
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Create a readiness memo that turns the PRD lane-eligibility table into an
adapter planning checklist. The memo must distinguish primary replay lanes,
trigger/context lanes, smoke-only lanes, deferred waveform lanes, and forbidden
inputs without creating adapter code.

## Acceptance criteria

- [ ] Memo names `timeline.jsonl` as the primary scalar replay source.
- [ ] Memo names `events.jsonl` as public trigger/context evidence, with public
      alarms as allowed v1 auto-staging triggers.
- [ ] Memo classifies `status.json`, `encounter/current.json`,
      `assessments/status.json`, and `assessments/current.json` as context-only
      or mapping-support lanes, not standalone chart truth.
- [ ] Memo classifies `current.json` as smoke/read-latest only and
      `timeline.json` as deferred compatibility evidence.
- [ ] Memo defers waveform chart ingest while preserving a future
      sub-minute/artifact review path.
- [ ] Memo explicitly forbids hidden `pi-sim` internals, future scripted data,
      `pi-monitor` display internals, raw chart files, and `pi-agent` private
      reasoning as adapter inputs.
- [ ] No `pi-rn/ingest/` directory, adapter implementation, chart write, or
      `pi-chart` ADR is created.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-05-03: Seeded from the HITL-approved readiness artifact under
  `.scratch/pi-sim-public-telemetry-contract-lock/`.
