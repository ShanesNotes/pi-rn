# pi-chart planning summary

This public-facing planning summary captures the durable roadmap direction for `pi-chart` without exposing unpublished planning history, private traces, or internal process details.

## Project boundary

`pi-chart` is the bounded chart/EHR subsystem in the parent `pi-rn` workspace.

- It should model chart-visible clinical facts, derived views, validation rules, and safe read/write surfaces.
- It must not depend on hidden simulator internals.
- It must not create direct coupling between `pi-agent` and `pi-sim`.
- New product behavior should be introduced through small, test-backed slices.

## Current planning posture

The project has enough design material to move from broad research into thin implementation cards. The next work should avoid large rewrites and instead convert specific clinical or governance questions into executable test-first changes.

## Near-term roadmap lanes

### 1. Phase A completion bridge

Convert Phase A clinical-reference material into implementation-ready slices.

Expected work shape:

- classify open schema questions touched by the selected slice,
- choose one clinical behavior at a time,
- write characterization or failing tests first,
- update schema, validators, views, fixtures, or docs only where the selected card requires it,
- capture acceptance evidence before moving to the next slice.

Initial candidate areas include ordered result behavior, ICU nursing assessment findings, and individual order semantics.

### 2. v0.3 foundation reconciliation

Reconcile prior v0.3 roadmap claims against current repository behavior.

Expected work shape:

- identify what is already implemented and covered by tests,
- mark stale or superseded claims clearly,
- separate accepted behavior from deferred proposals,
- avoid reopening completed foundations unless a failing test or concrete clinical slice requires it.

### 3. Actor attribution and attestation governance

Clarify future policy for human, agent, import, review, and attestation semantics.

Expected work shape:

- keep proposed governance policy separate from accepted implementation behavior,
- characterize current source/provenance validation before changing it,
- decide whether review and professional attestation should be one policy lane or separate lanes,
- do not add schema or validator policy until the decision is explicit.

### 4. Adapter and external boundary future work

Define future interface boundaries without prematurely building adapters.

Expected work shape:

- name the future consumer before designing a contract,
- keep chart-visible facts as the only safe default export substrate,
- document forbidden coupling to simulator or agent internals,
- defer FHIR, openEHR, production EHR, or runtime adapter choices until there is a concrete use case.

### 5. Planning-document hygiene

Promote only durable planning knowledge into tracked project docs.

Expected work shape:

- summarize decisions rather than copying local planning history,
- preserve source authority and current/stale status,
- avoid tracking runtime state, local logs, private notes, or duplicated drafts,
- keep public docs concise enough for future contributors to use.

## Execution principles

- Prefer narrow vertical slices over horizontal architecture work.
- Start with tests or executable validation where possible.
- Treat current repository behavior and accepted ADRs as authoritative.
- Treat research notes and proposals as inputs, not policy.
- Avoid new dependencies unless explicitly justified.
- Keep changes reviewable, reversible, and scoped to the selected card.

## Public/private split

This summary is suitable for public roadmap discussion. Detailed local planning artifacts and private process notes should remain unpublished unless intentionally sanitized and promoted.
