# Mapping and unassigned staging queue contract

Status: completed
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Specify the readiness contract for explicit patient/encounter mapping and the
unassigned staging queue. This is a planning artifact only; it must not create
patient-scoped chart writes.

## Acceptance criteria

- [x] Contract lists allowed mapping inputs: public encounter context,
      clinician/user-selected patient and encounter, and explicit test-harness
      mapping for a simulation run.
- [x] Contract forbids bed-label guessing alone, hidden scenario ids, provider
      internals, latent patient truth, future schedules, and hidden simulator
      state as identity inputs.
- [x] Contract states that missing mapping routes monitor vitals to an
      unassigned staging queue only.
- [x] Contract states that unassigned staged values must not become patient
      chart truth until mapped and validated by a clinician/user.
- [x] Contract includes review questions for stale mapping, remapping,
      correction/rejection history, and provenance preservation.
- [x] No chart write or ingest adapter implementation is created.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-06-11: Delivered `.scratch/observable-charting-adapter-readiness/memos/03-mapping-and-unassigned-staging-queue.md`.