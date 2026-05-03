# ADR 016 — Broad EHR skeleton as clinical-memory proof surface

Date: 2026-04-23
Status: accepted
Decision maker: user (project lead) via deep-interview + ralplan consensus.
Supersedes: none.
Related:
- `../clinical-reference/broad-ehr-skeleton.md`
- `../ROADMAP.md`
- `../../.omx/specs/deep-interview-strategic-direction.md`
- `../../.omx/plans/prd-strategic-direction-clinical-memory-ehr-skeleton.md`

## Context

The project direction was clarified through a deep interview on 2026-04-23.
The durable bet is **clinical memory**: an agent-native chart/context
substrate that reduces documentation burden, preserves provenance, and
helps bedside clinicians spend more attention in direct patient care.

The user explicitly rejected a too-narrow “demo slice” as the next
strategic shape. A clinically useful agent harness needs enough EHR
breadth to test what context the agent has, when it has it, and how that
context changes the usefulness of the agent’s role.

This does **not** mean pi-chart should become a full production EHR. EHR
fullness matters only where it supplies clinically meaningful observable
context for memory, documentation relief, and downstream review
projections.

## Decision

Adopt a **broad, shallow EHR skeleton** as the next proof surface for
pi-chart clinical memory.

The first-pass skeleton must cover six observable surfaces:

1. Flowsheets / vitals.
2. Nursing assessment.
3. Notes / narrative charting.
4. Orders / medications / interventions.
5. Labs / diagnostics.
6. Care plan / handoff.

The skeleton must be anchored by one coherent fixture story, not six
unrelated examples. Each surface must change at least one of:

- what the agent can know,
- what the clinician can review,
- what documentation burden is avoided,
- what open loop or uncertainty is made explicit.

## Boundary rule

Hidden physiology never enters pi-chart or pi-agent context. Pi-sim may
own hidden patient state internally, but it must emit public clinical
observations through explicit artifacts/adapters:

- History already present in chart.
- Physical findings only after an assessment action.
- Vitals/alarms through monitor outputs.
- Labs, orders, notes, and care-plan updates through chart events or
  EHR-like scenario rollout artifacts.

`pi-chart` must not read pi-sim source files directly. `pi-agent` must
not inspect pi-sim internals. Boundary adapters translate public emitted
observations into chart events with source, timestamp, and transform
provenance.

## Consequences

- The near-term roadmap shifts from “deepen generic clinical content” to
  “prove clinical-memory usefulness through a broad EHR skeleton.”
- Existing claim-stream primitives remain the foundation. New primitives
  require fixture evidence and a follow-up ADR.
- A deterministic memory proof projection becomes an acceptance target,
  but the product focus remains the clinical memory substrate.
- Documentation-burden relief must be shown by projection/reuse over the
  claim stream, not by duplicating prose across note, handoff, flowsheet,
  and review surfaces.
- Agent integration remains gated by explicit observable-context
  contracts.

## Alternatives considered

### Context-complete narrow scenario

A narrow respiratory-decompensation scenario would be easier to polish and
could demonstrate timing/causality well. It was rejected as the primary
next shape because it can hide whether the agent harness has enough EHR
breadth to be clinically useful.

### Disease-realism-first simulator work

More simulator fidelity could improve hidden-state coherence. It was
rejected as the primary next shape because clinical-memory value must be
proved through observable chart context, not simulator internals.

### Full production EHR product

A full EHR would maximize realism but would expand into scheduling,
billing, authentication, broad CRUD, and hospital operations. It was
rejected. EHR breadth is valuable only as an observable context substrate
for clinical memory.

## Verification

A downstream implementation satisfies this ADR only when:

1. all six surfaces are represented in one coherent fixture contract,
2. every represented item has source/provenance and timing,
3. a derived memory proof projection can answer what happened, why,
   evidence, uncertainty, open loops, and next-shift handoff,
4. a bedside observation can be entered once and reused through review /
   note / handoff projections,
5. hidden simulator physiology is not exposed to pi-agent or pi-chart.
