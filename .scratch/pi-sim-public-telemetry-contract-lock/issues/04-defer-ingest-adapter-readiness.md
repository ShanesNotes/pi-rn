# Defer ingest adapter readiness until ABI lock

Status: needs-triage
Type: HITL

## Parent

`.scratch/pi-sim-public-telemetry-contract-lock/PRD.md`

## What to build

Write the readiness criteria for a future `pi-rn/ingest/` or equivalent
telemetry-to-chart adapter without creating the ingest module yet.

## Acceptance criteria

- [x] Criteria name the public telemetry lanes that may be considered for chart ingestion.
- [x] Criteria list unresolved chart-write policies: provenance, idempotency, patient identity mapping, replay offsets, and clinician validation requirements.
- [x] Criteria state that hidden `pi-sim` internals are forbidden inputs.
- [x] Criteria require `pi-chart` ADR/context review before any chart writes.
- [x] `pi-rn/ingest/` remains uncreated until the public ABI lock and chart-write policy are accepted.

## Blocked by

- `.scratch/pi-sim-public-telemetry-contract-lock/issues/02-lock-readme-manifest-consistency.md` (completed 2026-05-03)
- `.scratch/pi-sim-public-telemetry-contract-lock/issues/03-pi-monitor-public-consumer-checks.md` (completed 2026-05-03)

## Comments

- 2026-05-03: Completed after HITL grill decisions by adding
  `.scratch/pi-sim-public-telemetry-contract-lock/ingest-adapter-readiness.md`.
  The artifact names lane eligibility, retrospective-only draft flowsheet
  policy, unresolved chart-write gates, explicit patient/encounter mapping,
  two-layer provenance, replay/idempotency requirements, clinician validation authority,
  `pi-agent` assistant-only role, and required `pi-chart` ADR/context review.
  `pi-rn/ingest/` remains uncreated.
