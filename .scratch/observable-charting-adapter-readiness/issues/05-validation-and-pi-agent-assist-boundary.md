# Validation and pi-agent assist boundary

Status: needs-triage
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Document the clinician/user validation boundary and the allowed `pi-agent`
assistant role for draft telemetry review bundles. This work is contract-only
and must not create final attestation behavior.

## Acceptance criteria

- [ ] Contract states that final chart truth requires explicit human
      clinician/user action.
- [ ] Contract allows `pi-agent` to summarize, flag gaps/outliers, match drafts
      to orders, and prepare validation bundles.
- [ ] Contract forbids `pi-agent` from silently validating, attesting,
      overriding clinician corrections, inferring future vitals, or using hidden
      `pi-sim` internals.
- [ ] Contract records validation decisions as accepted unchanged, corrected, or
      rejected.
- [ ] Contract requires validation provenance to link back to source draft and
      public telemetry provenance.
- [ ] Contract preserves append-only correction/rejection history.
- [ ] No chart-write implementation, ingest adapter implementation, or
      post-rebase `pi-chart` ADR promotion is performed.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-05-03: Seeded from the readiness artifact clinician validation and
  `pi-agent` assistant-only policy.
