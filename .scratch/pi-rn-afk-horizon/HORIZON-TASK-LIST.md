# pi-rn AFK horizon task list

Status: active queue for autonomous agent work
Branch: `reentry-substrate-field-spec`
Updated: 2026-06-11

This file is the repo-wide long-horizon AFK queue. Agents should read `CONTEXT-MAP.md` first, then pick the next executable slice from the current phase unless a human instruction overrides priority.

## How to use

1. Work top-to-bottom within the current phase; skip items marked `blocked`, `ready-for-human`, or `wontfix`.
2. After closing a slice: update issue `Status:`, record verification commands in issue comments, refresh this file's phase status, commit, and push with `ALLOW_PUBLIC_PUSH=1` when pushing to origin.
3. Do not start production `pi-chart`→`pi-ledger` adapter code until Phase D gates close (fixture quarantine ✅, PredicateRegistry, canonicalization-id agreement).

---

## Phase A — Mechanical doc sync and scratch hygiene

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| A1 | Normalize V0.5 artifact authority banners | `.scratch/pi-chart-v0-5/issues/01-...` | **completed** |
| A2 | Refresh substrate AFK run state | `.scratch/pi-chart-per-patient-substrate-field-interface/AFK-RUN-STATE.md` | **completed** |
| A3 | Close ledger deepening issue 02 | `.scratch/pi-ledger-kernel-interface-deepening/issues/02-...` | **completed** |
| A4 | Close pi-sim contract-lock issue 02 | `.scratch/pi-sim-public-telemetry-contract-lock/issues/02-...` | **completed** |
| A5 | pi-sim rebase grounding closeout | `.scratch/pi-sim-rebase-grounding/PRD.md` | **completed** |
| A6 | Polish project-organization issue 03 | `.scratch/project-organization-consistency/issues/03-...` | **completed** |
| A7 | Banner stale planning surfaces | `.scratch/project-organization-consistency/issues/04-...` | ready-for-human |

---

## Phase B — pi-sim public contract and monitor depth

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| B1 | Wire docs-boundary checks into pi-sim npm test | `.scratch/pi-sim-public-telemetry-contract-lock/issues/03-wire-...` | **completed** |
| B2 | pi-monitor public consumer boundary checks | `.scratch/pi-sim-public-telemetry-contract-lock/issues/03-pi-monitor-...` | **completed** |
| B3 | Defer ingest adapter readiness stub | `.scratch/pi-sim-public-telemetry-contract-lock/issues/04-...` | **completed** |
| B4 | pi-monitor public-lane ingest depth PRD slices | `.scratch/pi-monitor-public-lane-ingest-depth/` | needs-triage |

---

## Phase C — Ledger kernel deepening (pre-adapter)

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| C1 | Public interface inventory | `.scratch/pi-ledger-kernel-interface-deepening/issues/01-...` | **completed** |
| C2 | Deterministic claim fixture locality | `.scratch/pi-ledger-kernel-interface-deepening/issues/02-...` | **completed** |
| C3 | Fixture export quarantine | `.scratch/pi-ledger-kernel-interface-deepening/issues/07-...` | **completed** |
| C4 | Query trusted-entry projection facts | `.scratch/pi-ledger-kernel-interface-deepening/issues/04-...` | **completed** |
| C5 | Admission proof lifecycle naming/docs | `.scratch/pi-ledger-kernel-interface-deepening/issues/03-...` | **completed** |
| C6 | Trusted history rebuild seam | `.scratch/pi-ledger-kernel-interface-deepening/issues/05-...` | **completed** |
| C7 | Adapter-facing error vocabulary | `.scratch/pi-ledger-kernel-interface-deepening/issues/06-...` | **completed** |
| C8 | K11 revision admission correction target | `.scratch/pi-ledger-claim-ledger-kernel/issues/11-...` | ready-for-human |

**Phase C verification:** `cd pi-ledger && cargo test --workspace --features ledger-core/test-support`

---

## Phase D — Substrate field spec → implementation gates

Spec lane **15/15 complete**. Reentry audit Phase 1 spec cleanup **completed**.

| # | Task | Entry | Gate |
| --- | --- | --- | --- |
| D1 | `eventMatchesEncounter` wildcard fix | `pi-chart/src/views/active.ts` | **shipped** |
| D2 | Production `PredicateRegistry` | field-spec 03 | ready-for-human |
| D3 | Canonicalization id agreement | field-spec 08 | ready-for-human |
| D4 | Reentry audit Phase 1 spec cleanup | `.scratch/pi-rn-reentry-audit-28052026/IMPLEMENTATION-READY-PLAN.md` | **completed** |
| D5 | Chart→ledger adapter strategy slices | `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-...` | inventory **completed**; implementation blocked on D2/D3 |

---

## Phase E — Observable charting and shift-brain planning

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| E1 | Observable charting adapter readiness memos | `.scratch/observable-charting-adapter-readiness/` | **completed** |
| E2 | Shift-brain strategy PRD issues 01–15 | `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/` | mostly ready-for-human |
| E3 | Phase-A context digging corpus mining | `.scratch/pi-chart-phase-a-context-digging-corpus-mining/` | ready-for-human |

---

## Phase F — Cross-agent surface and architecture placement

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| F1 | Shared skill alias plane | `.scratch/shared-agent-surface/issues/01-...` | ready-for-agent — **not repo-committable** |
| F2 | Cross-subproject seam matrix | `.scratch/project-organization-consistency/issues/06-...` | **completed** (CONTEXT-MAP matrix) |
| F3 | ADR style normalization follow-up | `.scratch/project-organization-consistency/issues/07-...` | needs-triage |
| F4 | Architecture deepening placement audit | `.scratch/architecture-deepening-placement/` | needs-triage |

---

## Phase G — Next autonomous queue (pick one)

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| G1 | Ledger deepening issue 03 admission docs | `.scratch/pi-ledger-kernel-interface-deepening/issues/03-...` | **completed** |
| G2 | Ledger deepening issue 05 rebuild seam | `.scratch/pi-ledger-kernel-interface-deepening/issues/05-...` | **completed** |
| G3 | Chart→ledger adapter consumer inventory | `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/02-...` | **completed** |
| G4 | pi-monitor source-dir fixture regression | `.scratch/pi-monitor-public-lane-ingest-depth/issues/01-...` | **completed** |
| G5 | Project org issue 06 seam matrix | `.scratch/project-organization-consistency/issues/06-...` | **completed** |
| G6 | Substrate field-spec sync issues 05,11–14 | `field-specs/05,11–14` | **completed** |

## Phase H — Next autonomous queue

| # | Task | Entry | Notes |
| --- | --- | --- | --- |
| H1 | Adapter brownfield reconciliation | `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/03-...` | docs-only |
| H2 | Adapter integration mechanism decision | `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/04-...` | ready-for-human |
| H3 | pi-monitor ingest depth issues 02–06 | `.scratch/pi-monitor-public-lane-ingest-depth/` | needs-triage |
| H4 | Ledger K11 revision admission | `.scratch/pi-ledger-claim-ledger-kernel/issues/11-...` | ready-for-human |
| H5 | Project org banner stale surfaces | `.scratch/project-organization-consistency/issues/04-...` | ready-for-human |
| H6 | Substrate implementation gates D2/D3 | field-specs 03, 08 | ready-for-human — blocks adapter code |

---

## Completed / wontfix (do not re-open without new PRD)

- `pi-ledger-claim-ledger-kernel/issues/01–05` → `wontfix` (K0–K12 shipped)
- Substrate field specs 01–15 → `field-specs/*.md` delivered
- `pi-sim-public-telemetry-contract-lock/issues/01–04` → completed
- `pi-sim-public-telemetry-publication-module/issues/01,04,05,06` → completed
- `observable-charting-adapter-readiness/issues/01–05` → completed
- `project-organization-consistency/issues/01,03,06` → completed
- `pi-ledger-kernel-interface-deepening/issues/03,04,05,06,07` → completed
- `pi-chart-pi-ledger-adapter-strategy/issues/01,02` → completed
- `pi-monitor-public-lane-ingest-depth/issues/01` → completed

---

## Default verification bundle (after code-touching slices)

```bash
cd pi-chart && npm test
cd pi-ledger && cargo test --workspace --features ledger-core/test-support
cd pi-sim && npm run test:docs-boundary
```