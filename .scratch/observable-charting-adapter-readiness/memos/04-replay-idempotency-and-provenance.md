# Replay, idempotency, and provenance contract

Status: readiness memo
Parent: `.scratch/observable-charting-adapter-readiness/PRD.md`

## Draft idempotency key (seed)

Deterministic from:

- explicit patient/encounter mapping
- metric
- effective chart time
- selected source sample identity
- source lane
- adapter version

Re-running the adapter should update the same draft, not create duplicates.

## Validated truth protection

Validated chart truth must not be overwritten by later ingest. Corrections and rejections are append-only review/correction events preserving draft and validation history.

## Replay offsets (define before code)

- Offset/key strategy for `timeline.jsonl` and `events.jsonl`
- Per-run reset semantics from `pi-sim/vitals/.lanes.json`
- Behavior when source files are replaced, truncated, or replayed
- Replay idempotency across adapter restarts
- Protection for already validated chart truth during replay

## Provenance layers

**Device-source provenance (draft):** lane path, sequence/event index, telemetry timestamp or `simTime_s`, metric/value/unit, public encounter id when available, selection policy/tolerance, quality flags, adapter name/version/run id.

**Chart-validation provenance (validated):** validator identity, attestation time, effective chart time, validation decision, link to draft/source telemetry, optional `pi-agent` assist provenance.