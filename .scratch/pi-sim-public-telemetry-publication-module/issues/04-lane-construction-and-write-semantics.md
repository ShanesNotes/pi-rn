# Map lane construction and write semantics

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

Create a lane-by-lane publication map for how public telemetry files are constructed, overwritten, appended, reset, or cleared.

## Acceptance criteria

- [ ] Map all lanes from `pi-sim/vitals/.lanes.json` with lane name, path, artifact kind, schema version, record schema version where present, write semantics, reset semantics, producer, and preferred consumer mode.
- [ ] Map `PublicTelemetryPublisher.publish`, `appendEvent`, `publishEncounter`, `publishAssessment`, and `publishWaveform` responsibilities without changing code.
- [ ] Document reset-on-construction behavior for `events.jsonl` and `timeline.jsonl`.
- [ ] Document atomic overwrite behavior for latest-state lanes and whole-file compatibility array behavior for `timeline.json`.
- [ ] Document stale-current clearing for encounter, assessment, and waveform optional current files.
- [ ] Flag any README/manifest/source mismatch as follow-up; do not silently change semantics.

## Blocked by

- `issues/01-inventory-publication-responsibilities.md`.

## Comments

- 2026-05-03: This issue is a planning/documentation slice. Source edits require separate implementation approval.
- 2026-05-03: Default next gate after Issue 01 so lane write semantics are mapped before regression-lock design, unless Issue 01 finds an urgent regression gap.
