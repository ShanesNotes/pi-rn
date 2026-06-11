# Replay, idempotency, and provenance contract

Status: completed
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Create a readiness contract for durable replay offsets, deterministic draft
identity, and two-layer provenance. The output should be sufficient for later
test planning, but it must not implement an adapter.

## Acceptance criteria

- [x] Contract defines replay questions for `timeline.jsonl` and `events.jsonl`
      offsets or keys.
- [x] Contract accounts for per-run resets described by `pi-sim/vitals/.lanes.json`.
- [x] Contract covers replaced, truncated, or replayed public source files and
      adapter restarts.
- [x] Contract defines draft idempotency from explicit patient/encounter
      mapping, metric, effective chart time, selected source sample identity,
      source lane, and adapter version.
- [x] Contract states that later replay must not overwrite validated chart truth.
- [x] Contract lists device-source provenance and chart-validation provenance
      fields from the PRD.
- [x] Contract preserves quality/warning flags and missing-value reasons.
- [x] No `pi-rn/ingest/` code, chart write, or raw `pi-chart` mutation is added.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-06-11: Delivered `.scratch/observable-charting-adapter-readiness/memos/04-replay-idempotency-and-provenance.md`.