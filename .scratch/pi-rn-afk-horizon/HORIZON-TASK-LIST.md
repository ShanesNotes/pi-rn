# pi-rn AFK horizon task list

Status: active queue for autonomous agent work
Branch: `reentry-substrate-field-spec`
Updated: 2026-06-11

This file is the repo-wide long-horizon AFK queue. Agents should read `CONTEXT-MAP.md` first, then pick the next **ready-for-agent** slice from Phase A unless a human instruction overrides priority.

## How to use

1. Work top-to-bottom within the current phase; skip items marked `blocked`, `ready-for-human`, or `wontfix`.
2. After closing a slice: update issue `Status:`, record verification commands in issue comments, refresh this file's phase status, commit, and push with `ALLOW_PUBLIC_PUSH=1` when pushing to origin.
3. Do not start production `pi-chart`→`pi-ledger` adapter code until Phase D gates close (fixture quarantine ✅, PredicateRegistry, canonicalization-id agreement).

---

## Phase A — Mechanical doc sync and scratch hygiene (now)

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| A1 | Normalize V0.5 artifact authority banners | `.scratch/pi-chart-v0-5/issues/01-normalize-project-artifact-authority.md` | **completed** |
| A2 | Refresh substrate AFK run state | `.scratch/pi-chart-per-patient-substrate-field-interface/AFK-RUN-STATE.md` | **completed** |
| A3 | Close ledger deepening issue 02 (fixture locality shipped) | `.scratch/pi-ledger-kernel-interface-deepening/issues/02-...` | **completed** |
| A4 | Close pi-sim contract-lock issue 02 (README/manifest check shipped) | `.scratch/pi-sim-public-telemetry-contract-lock/issues/02-...` | **completed** |
| A5 | pi-sim rebase grounding closeout | `.scratch/pi-sim-rebase-grounding/PRD.md` | **completed** |
| A6 | Polish project-organization issue 03 (active PRD/issue statuses) | `.scratch/project-organization-consistency/issues/03-...` | needs-triage |
| A7 | Banner stale planning surfaces (org consistency 04) | `.scratch/project-organization-consistency/issues/04-...` | ready-for-human |

**Phase A verification:** doc-only changes; run targeted checks named in each issue; no source behavior edits unless an issue explicitly authorizes them.

---

## Phase B — pi-sim public contract and monitor depth

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| B1 | Lock README/manifest regression in pi-sim package scripts | `.scratch/pi-sim-public-telemetry-contract-lock/issues/03-...` | **completed** |
| B2 | pi-monitor public consumer boundary checks | `.scratch/pi-sim-public-telemetry-contract-lock/issues/03-...` | **completed** |
| B3 | Defer ingest adapter readiness stub | `.scratch/pi-sim-public-telemetry-contract-lock/issues/04-...` | needs-triage |
| B4 | pi-monitor public-lane ingest depth PRD slices | `.scratch/pi-monitor-public-lane-ingest-depth/` | needs-triage |

**Phase B verification:** `cd pi-sim && python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py`; `cd pi-sim && npm test` (public-contract subset as applicable).

---

## Phase C — Ledger kernel deepening (pre-adapter)

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| C1 | Public interface inventory | `.scratch/pi-ledger-kernel-interface-deepening/issues/01-...` | **completed** |
| C2 | Deterministic claim fixture locality | `.scratch/pi-ledger-kernel-interface-deepening/issues/02-...` | implemented — close in A3 |
| C3 | Fixture export quarantine | `.scratch/pi-ledger-kernel-interface-deepening/issues/07-...` | **completed** |
| C4 | Admission proof lifecycle naming/docs | `.scratch/pi-ledger-kernel-interface-deepening/issues/03-...` | ready-for-human |
| C5 | Query trusted-entry projection facts | `.scratch/pi-ledger-kernel-interface-deepening/issues/04-...` | needs-triage |
| C6 | Trusted history rebuild seam | `.scratch/pi-ledger-kernel-interface-deepening/issues/05-...` | ready-for-human |
| C7 | Adapter-facing error vocabulary | `.scratch/pi-ledger-kernel-interface-deepening/issues/06-...` | needs-triage |
| C8 | K11 revision admission correction target | `.scratch/pi-ledger-claim-ledger-kernel/issues/11-...` | ready-for-human |

**Phase C verification:** `cd pi-ledger && cargo test --workspace --features ledger-core/test-support`; `cargo fmt --all -- --check`; `cargo clippy --workspace --all-targets -- -D warnings`.

---

## Phase D — Substrate field spec → implementation gates

Spec lane **15/15 complete**. Implementation is gated on human/triage decisions.

| # | Task | Entry | Gate |
| --- | --- | --- | --- |
| D1 | `eventMatchesEncounter` wildcard fix | `pi-chart/src/views/active.ts` | **shipped** — document in AFK-RUN-STATE |
| D2 | Production `PredicateRegistry` | field-spec 03 / substrate issue 03 | ready-for-human |
| D3 | Canonicalization id agreement | field-spec 08 / substrate issue 08 | ready-for-human |
| D4 | Reentry audit doc/spec cleanup (issues 01,05,11–14) | `.scratch/pi-rn-reentry-audit-28052026/` | interlocked — blocked on D2/D3 |
| D5 | Chart→ledger adapter strategy slices | `.scratch/pi-chart-pi-ledger-adapter-strategy/` | needs-triage; blocked on C3+ |

**Phase D verification:** `cd pi-chart && npm test`; clinical-truth slice: `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/verify-vital-sign-slice.sh`.

---

## Phase E — Shift-brain and observable charting (planning-heavy)

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| E1 | Shift-brain strategy PRD issues 01–15 | `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/` | mostly ready-for-human |
| E2 | Phase-A context digging corpus mining | `.scratch/pi-chart-phase-a-context-digging-corpus-mining/` | ready-for-human |
| E3 | Observable charting adapter readiness | `.scratch/observable-charting-adapter-readiness/` | needs-triage |

Human review required before promoting these to `ready-for-agent` implementation slices.

---

## Phase F — Cross-agent surface and architecture placement

| # | Task | Entry | Status |
| --- | --- | --- | --- |
| F1 | Shared skill alias plane (machine-local symlinks) | `.scratch/shared-agent-surface/issues/01-...` | ready-for-agent — **not repo-committable** |
| F2 | Document Matt/OMX interoperability | `.scratch/shared-agent-surface/issues/02-...` | completed |
| F3 | Cross-subproject seam matrix | `.scratch/project-organization-consistency/issues/06-...` | needs-triage (CONTEXT-MAP matrix may satisfy) |
| F4 | ADR style normalization follow-up | `.scratch/project-organization-consistency/issues/07-...` | needs-triage |
| F5 | Architecture deepening placement audit | `.scratch/architecture-deepening-placement/` | needs-triage |

---

## Completed / wontfix (do not re-open without new PRD)

- `pi-ledger-claim-ledger-kernel/issues/01–05` → `wontfix` (K0–K12 shipped)
- Substrate field specs 01–15 → `field-specs/*.md` delivered
- `pi-sim-public-telemetry-publication-module/issues/01,04,05,06` → completed
- `project-organization-consistency/issues/01` → completed
- `pi-sim-public-telemetry-contract-lock/issues/01` → completed

---

## Default verification bundle (after code-touching slices)

```bash
cd pi-chart && npm test
cd pi-ledger && cargo test --workspace --features ledger-core/test-support
cd pi-sim && python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py
```