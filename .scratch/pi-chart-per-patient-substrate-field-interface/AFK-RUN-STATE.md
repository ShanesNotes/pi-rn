# AFK run state — substrate field interface

Status: **spec lane complete** (15/15 field specs delivered)
Branch: `reentry-substrate-field-spec`
Updated: 2026-06-11

## Completed spec deliverables

All issues `01–15` → `field-specs/*.md` (see `field-specs/` directory).

## Completed implementation prep (2026-06-11)

| Item | Evidence |
| --- | --- |
| Ledger fixture quarantine | `.scratch/pi-ledger-kernel-interface-deepening/issues/07-...` → `completed`; `ledger-core` `test-support` feature |
| `eventMatchesEncounter` wildcard fix | `pi-chart/src/views/active.ts` — no wildcard match on missing `encounter_id`; `npm test` 399/399 |
| Ledger deepening issue 02 (fixture locality) | `fixture_observation_claim` / `fixture_correction_claim` helpers shipped |

## Next lane (implementation — gated)

| Priority | Work | Entry | Gate |
| --- | --- | --- | --- |
| 1 | Production PredicateRegistry | field-spec 03 / substrate issue 03 | ready-for-human |
| 2 | Canonicalization id agreement | field-spec 08 / substrate issue 08 | ready-for-human |
| 3 | Chart→ledger adapter slices | `.scratch/pi-chart-pi-ledger-adapter-strategy/` | blocked on PredicateRegistry + canonicalization id |

## Repo-wide AFK queue

See `.scratch/pi-rn-afk-horizon/HORIZON-TASK-LIST.md`.

## Closed / wontfix scratch issues

- `pi-ledger-claim-ledger-kernel/issues/01–05` → `wontfix` (K0–K12 shipped)
- `shared-agent-surface/issues/01` — machine-local symlinks (not repo-committable)
- `pi-sim-public-telemetry-contract-lock/issues/01–02` → completed
- `project-organization-consistency/issues/01` → completed