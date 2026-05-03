# Lock public telemetry publication regression tests

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

Define and, when later approved for source edits, lock regression tests before any internal publication Module refactor.

## Acceptance criteria

- [ ] Test plan preserves `current.json`, `timeline.json`, `timeline.jsonl`, `status.json`, `events.jsonl`, `encounter/current.json`, `assessments/status.json`, `assessments/current.json`, `waveforms/status.json`, and `waveforms/current.json` semantics from README and `.lanes.json`.
- [ ] Test plan covers reset-on-construction for append lanes, atomic overwrite for latest-state lanes, and stale-current clearing for optional lanes.
- [ ] Test plan covers normal terminal `run_ended` and abnormal terminal `provider_unavailable` behavior, including the rule that provider-unavailable runs do not also emit `run_ended`.
- [ ] Test plan covers per-run monotonic `eventIndex`, frame `sequence` correlation, and preservation of runner-owned `simTime_s`.
- [ ] Test plan covers assessment request/reveal/replay/unavailable behavior without exposing hidden future truth.
- [ ] Future source-edit verification command is `npm test --prefix pi-sim`.

## Blocked by

- `issues/01-inventory-publication-responsibilities.md`.

## Comments

- 2026-05-03: Current evidence points to `pi-sim/scripts/runtime/test.ts` and `pi-sim/scripts/public-contract-reader-test.ts` as the primary regression-lock surfaces.
