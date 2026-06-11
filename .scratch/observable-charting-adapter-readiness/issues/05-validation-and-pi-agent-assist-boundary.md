# Validation and pi-agent assist boundary

Status: completed
Type: AFK

## Parent

`.scratch/observable-charting-adapter-readiness/PRD.md`

## What to build

Document the clinician/user validation boundary and the allowed `pi-agent`
assistant role for draft telemetry review bundles. This work is contract-only
and must not create final attestation behavior.

## Acceptance criteria

- [x] Contract states that final chart truth requires explicit human
      clinician/user action.
- [x] Contract allows `pi-agent` to summarize, flag gaps/outliers, match drafts
      to orders, and prepare validation bundles.
- [x] Contract forbids `pi-agent` from silently validating, attesting,
      overriding clinician corrections, inferring future vitals, or using hidden
      `pi-sim` internals.
- [x] Contract records validation decisions as accepted unchanged, corrected, or
      rejected.
- [x] Contract requires validation provenance to link back to source draft and
      public telemetry provenance.
- [x] Contract preserves append-only correction/rejection history.
- [x] No chart-write implementation, ingest adapter implementation, or
      post-rebase `pi-chart` ADR promotion is performed.

## Blocked by

Maintainer triage of `.scratch/observable-charting-adapter-readiness/PRD.md`.

## Comments

- 2026-06-11: Delivered `.scratch/observable-charting-adapter-readiness/memos/05-validation-and-pi-agent-assist-boundary.md`.