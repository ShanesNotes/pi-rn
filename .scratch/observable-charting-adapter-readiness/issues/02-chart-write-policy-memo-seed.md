# Chart-write policy memo seed

Status: needs-triage
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Create a contract-only memo seed for future `pi-chart` review of draft
flowsheet observations and clinician/user validation events. The memo must stay
outside `pi-chart` ADRs until the `pi-chart` rebase names stable chart-write
ownership.

## Acceptance criteria

- [ ] Memo defines draft flowsheet observations as unvalidated staging records,
      not chart truth.
- [ ] Memo lists required draft fields: mapping state, metric/value/unit,
      effective chart time, source sample identity, source lane, selection
      policy, tolerance, quality flags, adapter version, run id, and replay
      offset.
- [ ] Memo lists validation fields: validator identity, attestation time,
      effective chart time, accepted/corrected/rejected decision, and link back
      to draft/source telemetry provenance.
- [ ] Memo requires `pi-chart/CONTEXT.md` and ADRs 006, 010, 011, and 017 to be
      reviewed before chart-write implementation.
- [ ] Memo states that a new `pi-chart` ADR is allowed only after the rebase if
      existing vocabulary cannot represent draft observations and validation
      without ambiguity.
- [ ] Memo states: do not promote this seed to a `pi-chart` ADR until after the
      `pi-chart` rebase names stable chart-write ownership.
- [ ] No chart-write implementation issue is created in this phase.

## Blocked by

- Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.
- Post-rebase `pi-chart` ownership for ADR promotion or implementation.

## Comments

- 2026-05-03: This is a PRD/memo seed only. It intentionally does not edit
  `pi-chart` authority files.
