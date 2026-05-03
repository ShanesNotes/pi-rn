# Mapping and unassigned staging queue contract

Status: needs-triage
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Specify the readiness contract for explicit patient/encounter mapping and the
unassigned staging queue. This is a planning artifact only; it must not create
patient-scoped chart writes.

## Acceptance criteria

- [ ] Contract lists allowed mapping inputs: public encounter context,
      clinician/user-selected patient and encounter, and explicit test-harness
      mapping for a simulation run.
- [ ] Contract forbids bed-label guessing alone, hidden scenario ids, provider
      internals, latent patient truth, future schedules, and hidden simulator
      state as identity inputs.
- [ ] Contract states that missing mapping routes monitor vitals to an
      unassigned staging queue only.
- [ ] Contract states that unassigned staged values must not become patient
      chart truth until mapped and validated by a clinician/user.
- [ ] Contract includes review questions for stale mapping, remapping,
      correction/rejection history, and provenance preservation.
- [ ] No chart write or ingest adapter implementation is created.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-05-03: Seeded from the readiness artifact patient/encounter mapping
  policy.
