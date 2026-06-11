# Mapping and unassigned staging queue contract

Status: readiness memo
Parent: `.scratch/observable-charting-adapter-readiness/PRD.md`

## Allowed mapping inputs

- Public encounter context (`encounter/current.json`)
- Clinician/user-selected patient and encounter
- Explicit test-harness mapping for a simulation run

## Forbidden identity inputs

- Bed-label guessing alone
- Hidden scenario ids, provider internals, latent patient truth
- Future schedules and hidden simulator state

## Unassigned staging queue

When mapping is missing, monitor vitals enter an **unassigned staging queue only**. They must not become patient chart truth until:

1. explicitly mapped to patient/encounter, and
2. validated by a clinician/user.

## Review questions (HITL follow-up)

- Stale mapping detection and remapping policy
- Correction/rejection history preservation
- Provenance preservation across remap events

No patient-scoped chart writes or ingest adapter implementation in this phase.