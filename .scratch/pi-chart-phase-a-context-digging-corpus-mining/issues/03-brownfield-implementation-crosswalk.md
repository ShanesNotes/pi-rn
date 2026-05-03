# Brownfield implementation crosswalk

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Create a crosswalk from current `pi-chart` brownfield code and tests to Phase A/v0.5 chart-digging intent. Treat code/tests as evidence of attempted behavior, not as canonical authority. The output should tell future agents which implemented behaviors appear worth preserving, revising, deferring, rejecting, or asking about.

## Acceptance criteria

- [ ] Covers public/API surfaces, reads, writes, validation, derived rebuild, evidence refs, time/chart-clock, types/schemas, and session helpers.
- [ ] Covers view/context surfaces: timeline, currentState, trend, evidenceChain, openLoops, narrative, memoryProof, contextBundle, reviewState, attestationState, vitalsTrend, projection/source helpers, and active-state logic.
- [ ] Links each mined behavior to relevant tests where tests exist, or marks `not-tested` / `not-covered` explicitly.
- [ ] Classifies each behavior as `adopt`, `revise`, `defer`, `reject`, or `open-question` for v0.5 planning.
- [ ] Identifies prototype-gravity risks such as old EventEnvelope assumptions, filesystem layout coupling, current patient overfit, UI-derived concepts, and chart-local claim-ledger leftovers.
- [ ] Does not edit `pi-chart/src/`, schemas, patients, package files, ADRs, or tests.
- [ ] Uses issue 01 template fields for every crosswalk row.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/01-evidence-authority-ladder-and-mining-templates.md`
