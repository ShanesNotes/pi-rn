# Replay, idempotency, and provenance contract

Status: needs-triage
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Create a readiness contract for durable replay offsets, deterministic draft
identity, and two-layer provenance. The output should be sufficient for later
test planning, but it must not implement an adapter.

## Acceptance criteria

- [ ] Contract defines replay questions for `timeline.jsonl` and `events.jsonl`
      offsets or keys.
- [ ] Contract accounts for per-run resets described by `pi-sim/vitals/.lanes.json`.
- [ ] Contract covers replaced, truncated, or replayed public source files and
      adapter restarts.
- [ ] Contract defines draft idempotency from explicit patient/encounter
      mapping, metric, effective chart time, selected source sample identity,
      source lane, and adapter version.
- [ ] Contract states that later replay must not overwrite validated chart truth.
- [ ] Contract lists device-source provenance and chart-validation provenance
      fields from the PRD.
- [ ] Contract preserves quality/warning flags and missing-value reasons.
- [ ] No `pi-rn/ingest/` code, chart write, or raw `pi-chart` mutation is added.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-05-03: This issue prepares future replay/idempotency tests without
  authorizing implementation.
