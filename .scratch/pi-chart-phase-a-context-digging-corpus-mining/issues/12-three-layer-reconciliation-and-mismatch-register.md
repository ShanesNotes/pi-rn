# Three-layer reconciliation and mismatch register

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Assemble the three-layer reconciliation register that decides, for every meaningful mined substrate recommendation, whether v0.5 should adopt, revise, defer, reject, or ask about it. This is the main anti-prototype-gravity and anti-source-fragmentation gate before final substrate recommendation.

## Acceptance criteria

- [ ] Register rows compare source intent, brownfield behavior, patient corpus need, caveats, and v0.5 implication.
- [ ] Every row has one of: `adopt`, `revise`, `defer`, `reject`, or `open-question`.
- [ ] No recommendation can be marked `adopt` without source citation plus code/test citation or explicit `not-covered` plus corpus citation or explicit `not-covered`.
- [ ] Captures conflicts where brownfield code diverges from Phase A intent, patient corpus diverges from source planning, or source artifacts propose broader scope than v0.5 should carry.
- [ ] Explicitly protects pi-ledger kernel scope, hidden pi-sim boundary, no patient migration, no vector/backend commitment, no direct agent accepted-writes, and no EHR clone framing.
- [ ] Produces a concise list of open questions that truly need maintainer/HITL decision before final substrate recommendation.
- [ ] Does not edit source, patients, ADRs, or implementation files.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/05-hot-current-state-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/06-trajectory-evidence-labs-diagnostics-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/07-orders-mar-medrec-io-lda-open-loop-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/08-notes-narrative-history-prior-encounters-handoff-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/09-review-attestation-authorship-lifecycle-accountability-substrate-pack.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/10-rendered-chart-digging-and-prototype-design-evidence-pass.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/11-hot-warm-cold-context-access-model.md`

## Comments

- 2026-05-04: Maintainer approved issue 11 hot/warm/cold context-access model; issue 12 is unblocked for AFK reconciliation. Issues 13-14 remain gated.
