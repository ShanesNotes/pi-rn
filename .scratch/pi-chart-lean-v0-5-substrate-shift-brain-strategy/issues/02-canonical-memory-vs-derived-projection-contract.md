# Canonical memory vs derived projection contract

Status: ready-for-human
Type: AFK
User stories covered: 3-4, 11-13, 61-64, 74

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the v0.5 contract that chart facts, actions, notes, communications, artifact refs, evidence/provenance refs, source/authorship, timing, lifecycle, review, and attestation facts are canonical chart memory, while current packet, trends, evidence chains, open loops, review state, handoff, care clusters, and shift-brain views are derived projections.

The slice should help both a clinician reading the chart and an agent operating inside the chart understand which material is authoritative, which material is a projection, and how derived views must remain rebuildable and non-authoritative.

## Acceptance criteria

- [x] Lists canonical chart memory categories using `pi-chart` domain vocabulary.
- [x] Lists derived projection categories and states that they are rebuildable and non-authoritative.
- [x] Explains how the clinician can trust projections without treating them as competing chart truth.
- [x] Explains how the in-chart agent can reason over projections without writing or accepting clinical truth.
- [x] Preserves hot/warm/cold as access behavior and prioritization, not backend/vector/OpenBrain/storage/runtime architecture.
- [x] Includes boundary checks for no hidden `pi-sim`, no direct agent accepted-writes, no autonomous task completion, and no `pi-ledger` kernel expansion.

## Blocked by

None - can start immediately


## Completion evidence

- Artifact: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`
- Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-01-02-20260504T145349Z.md`
- Verification: structural docs checks run in Ralph iteration 1.
