# Specify runner event and assessment reveal subordinate work

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

Specify the runner-owned public event and assessment reveal behavior as subordinate work inside the publication Module lane.

## Acceptance criteria

- [ ] Specification covers public event kinds: `run_started`, `action_applied`, `encounter_started`, `encounter_phase_changed`, `assessment_requested`, `assessment_revealed`, `assessment_unavailable`, `alarm_observed`, `provider_unavailable`, and `run_ended`.
- [ ] Specification preserves per-run monotonic `eventIndex`, frame `sequence` correlation, public `simTime_s`, `wallTime`, `source`, and `runState` context.
- [ ] Specification preserves terminal semantics: normal completion ends with terminal `run_ended`; provider failure ends with terminal `provider_unavailable` and no terminal `run_ended`.
- [ ] Specification preserves reveal-only assessment output: `assessments/current.json` exists only after public reveal, replay emits replay metadata instead of hidden data, and unavailable clears stale current output.
- [ ] Specification preserves the generic `action_applied` audit event while keeping reveal data sourced from provider assessment capability and allowlist serialization.
- [ ] Specification forbids hidden scenario truth, scoring keys, future findings, provider internals, and validation-only evidence from public event/reveal output.

## Blocked by

- `issues/01-inventory-publication-responsibilities.md`.
- `issues/02-lock-publication-regression-tests.md`.

## Comments

- 2026-05-03: This issue satisfies the architecture-deepening requirement to keep runner event/reveal behavior subordinate to the publication Module lane rather than creating a separate top-level PRD.
