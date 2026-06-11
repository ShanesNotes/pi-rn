# AFK run state — substrate field interface

Status: active
Started: 2026-06-11
Branch: `reentry-substrate-field-spec`
Last commit slice: 2026-06-11 — issues 01, 05, 11–14

## Queue (ready-for-agent, ordered)

| # | Issue | Deliverable | State |
| --- | --- | --- | --- |
| 01 | identity & scope | `field-specs/01-identity-and-scope.md` | **completed** |
| 05 | bitemporal time | `field-specs/05-bitemporal-time.md` | **completed** |
| 11 | projection-facing fields | `field-specs/11-projection-facing-fields.md` | **completed** |
| 12 | human-agent suggestion | `field-specs/12-human-agent-suggestion-state.md` | **completed** |
| 13 | fixture export round-trip | `field-specs/13-fixture-export-round-trip.md` | **completed** |
| 14 | clinician surface derivation | `field-specs/14-clinician-surface-derivation.md` | **completed** |

## Next AFK slices (not yet ready-for-agent)

Issues 02–04, 06–10, 15 are `ready-for-human` — triage to `ready-for-agent` before AFK execution.

## Deferred (stale or out of lane)

- `pi-ledger-claim-ledger-kernel/issues/01–05` — K0–K12 already shipped; retriage
- `shared-agent-surface/issues/01–02` — machine-local symlinks
- `pi-chart-v0-5/issues/01` — blocked on PRD triage

## Rules

- Spec artifacts only unless issue authorizes implementation
- One issue → one `field-specs/*.md` → update issue status → commit