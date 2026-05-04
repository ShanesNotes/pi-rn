# Map lane construction and write semantics

Status: completed
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

Create a lane-by-lane publication map for how public telemetry files are constructed, overwritten, appended, reset, or cleared.

## Acceptance criteria

- [x] Map all lanes from `pi-sim/vitals/.lanes.json` with lane name, path, artifact kind, schema version, record schema version where present, write semantics, reset semantics, producer, and preferred consumer mode.
- [x] Map `PublicTelemetryPublisher.publish`, `appendEvent`, `publishEncounter`, `publishAssessment`, and `publishWaveform` responsibilities without changing code.
- [x] Document reset-on-construction behavior for `events.jsonl` and `timeline.jsonl`.
- [x] Document atomic overwrite behavior for latest-state lanes and whole-file compatibility array behavior for `timeline.json`.
- [x] Document stale-current clearing for encounter, assessment, and waveform optional current files.
- [x] Flag any README/manifest/source mismatch as follow-up; do not silently change semantics.

## Blocked by

- `issues/01-inventory-publication-responsibilities.md`.

## Comments

- 2026-05-03: This issue is a planning/documentation slice. Source edits require separate implementation approval.
- 2026-05-03: Default next gate after Issue 01 so lane write semantics are mapped before regression-lock design, unless Issue 01 finds an urgent regression gap.
- 2026-05-03: Completed by adding `.scratch/pi-sim-public-telemetry-publication-module/lane-construction-and-write-semantics-map.md`. Code review approved with architectural WATCH follow-ups for Issue 02/06: provider-unavailable message privacy, optional-current force-clear vs preserve policy, selected cross-lane ordering guarantees, optional capability throw behavior during fallback, legacy monitor compatibility scope, and stale README authority wording.
- 2026-05-04: Tracker hygiene aligned status to completed; all acceptance criteria were already checked and the lane semantics map exists.
