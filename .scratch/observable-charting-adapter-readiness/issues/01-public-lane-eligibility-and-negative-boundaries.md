# Public lane eligibility and negative boundaries

Status: completed
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Create a readiness memo that turns the PRD lane-eligibility table into an
adapter planning checklist. The memo must distinguish primary replay lanes,
trigger/context lanes, smoke-only lanes, deferred waveform lanes, and forbidden
inputs without creating adapter code.

## Acceptance criteria

- [x] Memo names `timeline.jsonl` as the primary scalar replay source.
- [x] Memo names `events.jsonl` as public trigger/context evidence, with public
      alarms as allowed v1 auto-staging triggers.
- [x] Memo classifies `status.json`, `encounter/current.json`,
      `assessments/status.json`, and `assessments/current.json` as context-only
      or mapping-support lanes, not standalone chart truth.
- [x] Memo classifies `current.json` as smoke/read-latest only and
      `timeline.json` as deferred compatibility evidence.
- [x] Memo defers waveform chart ingest while preserving a future
      sub-minute/artifact review path.
- [x] Memo explicitly forbids hidden `pi-sim` internals, future scripted data,
      `pi-monitor` display internals, raw chart files, and `pi-agent` private
      reasoning as adapter inputs.
- [x] No `pi-rn/ingest/` directory, adapter implementation, chart write, or
      `pi-chart` ADR is created.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-06-11: Delivered `.scratch/observable-charting-adapter-readiness/memos/01-public-lane-eligibility.md`.