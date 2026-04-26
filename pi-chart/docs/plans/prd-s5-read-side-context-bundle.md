# PRD — S5 read-side context-bundle

## Status and authority

- Board card: `S5-001`
- Origin: V03-001 HITL successor selection.
- HITL selection: **S5 read-side context-bundle**.
- Boundary: **`s5-read-only`**.
- Artifact depth: planning PRD/test-spec surface only; no product implementation authority until this PRD and its paired test spec are accepted.
- Source interview/spec: `.omx/specs/deep-interview-v03-hitl-successor.md`.
- Source acceptance report: `docs/plans/v03-foundation-reconciliation-acceptance-report.md`.
- Source reconciliation PRD: `docs/plans/prd-v03-foundation-reconciliation.md`.
- Brownfield implementation authority remains `decisions/015-adr-009-011-implementation.md` and the current `schema_version: 0.3.0-partial` posture.

This lane exists because V03-001 reconciled the v0.3 memo and HITL selected S5 as the next successor scaffold. The operator then constrained S5 to a narrow read-only planning lane: use existing IDs and existing projections, do not add fingerprint, identity/hash-chain, profile-registry expansion, schema/validator work, or product code in this lane.

## HITL supersession note

`docs/plans/v03-foundation-reconciliation-acceptance-report.md` listed S5 as a context-bundle lane and mentioned bundle fingerprint helper planning. The later HITL deep-interview narrowed that option: **the context-bundle successor survives; deterministic/bundle fingerprint scope does not**.

Required boundary phrase for this lane and successor implementations: **No deterministic bundle fingerprint**.

## Problem / consumer

The future product need is a bounded pi-chart read-side context bundle for an agent/context-loader consumer. The bundle should give a downstream reader one deterministic, explainable read package derived from pi-chart-visible chart facts and existing read-side projections.

This PRD does not define a pi-agent API contract. The initial consumer is only: a reader that consumes a serialized context bundle produced by pi-chart. No pi-agent direct coupling is authorized.

## Brownfield read-side input inventory

Current read-side surfaces that a future S5 implementation should inventory before writing code:

| Surface | Current role in brownfield repo | S5 planning use |
|---|---|---|
| `src/views/index.ts` | Public read-side export surface for existing projections. | Future bundle should integrate through established view export conventions if implemented. |
| `src/views/active.ts` | Shared event loading, visibility, supersession, and correction context. | Candidate source for consistent as-of and active-event semantics. |
| `src/views/timeline.ts` | Timeline projection. | Candidate recent-event / chronological section source. |
| `src/views/currentState.ts` | Current state axis projection and `activeProblems` alias. | Candidate current-state section source. |
| `src/views/trend.ts` | Trend-series projection from vitals and observations. | Candidate trend or vitals context source if selected by future tests. |
| `src/views/evidenceChain.ts` | Recursive evidence-chain projection. | Candidate evidence/uncertainty section source. |
| `src/views/openLoops.ts` | Pending, in-progress, overdue, failed, and contested loop projection. | Candidate open-work section source. |
| `src/views/narrative.ts` | Narrative notes projection with annotation support. | Candidate handoff/narrative section source. |
| `src/views/memoryProof.ts` | Composed proof projection over current views. | Candidate reuse/composition seam; avoid duplicating proof logic. |
| `src/views/projection.ts` | Shared authorship projection helper. | Candidate authorship/source metadata helper. |
| `src/views/reviewState.ts` | Review-state projection helper. | Candidate review signal source if already derivable. |
| `src/views/attestationState.ts` | Attestation-state projection helper. | Candidate attestation signal source if already derivable. |
| `src/views/source.ts` | Source display formatting. | Candidate source-label normalization helper. |

Current absent future surface: **`src/views/bundle.ts` is absent**. It is only a candidate future implementation surface after PRD/test-spec acceptance and a separate implementation lane.

Current profile-registry reality: `schemas/profiles/index.json` exists and `src/validate.ts` loads `PROFILE_REGISTRY`. S5 does not modify, depend on, or expand the existing profile registry.

## Future candidate bundle contract

A later implementation lane may propose a read-only function such as `contextBundle(params)` in candidate future file `src/views/bundle.ts`. This PRD does not authorize creating it now.

Candidate future inputs:

- patient scope / patient ID from existing chart conventions
- optional `asOf` timestamp or existing time filters
- optional bounded section selectors that only choose among existing pi-chart-visible read-side projections

Candidate future output shape must include, at minimum:

- `patient_id`
- `asOf`
- `source_view_refs`
- bounded summary sections derived from existing views

Candidate future summary sections may include only already-derivable read-side facts, for example:

- current state from `currentState`
- recent timeline or selected events from `timeline`
- open loops from `openLoops`
- narrative or handoff context from `narrative`
- evidence or uncertainty context from `evidenceChain`
- memory proof or composed context from `memoryProof`
- review/attestation signals only where already derivable from `reviewState` / `attestationState`

Forbidden output fields in the first S5 scope:

- deterministic bundle fingerprint
- bundle hash
- identity/hash-chain fields
- profile-registry expansion fields
- hidden simulator physiology
- pi-agent runtime internals

## Boundaries and non-goals

- No product code in this planning lane.
- Do not create `src/views/bundle.ts` during planning.
- Do not create `src/views/bundle.test.ts` during planning.
- No deterministic bundle fingerprint.
- No identity/hash-chain.
- No `src/hash.ts`.
- No `src/identity.ts`.
- No root `profiles/` directory.
- No `schemas/profile.schema.json`.
- S5 does not modify, depend on, or expand the existing profile registry.
- No `schemas/profiles/index.json` edits.
- No `schemas/event.schema.json` edits.
- No `src/validate.ts` edits.
- No schema, validator, event-model, migration, or dependency changes.
- No pi-agent direct coupling.
- No hidden simulator state.
- No pi-sim source access or hidden physiology leakage.

## Future successor tracer bullets

These bullets are **not current product authorization**. Product files listed here are candidate future ownership only after HITL accepts this PRD/test spec and opens a separate implementation lane.

| Bullet | Purpose | Candidate future owned files | First validation | Boundary |
|---|---|---|---|---|
| `S5-TB-0` Authority and deferral guard | Keep S5 selection, `s5-read-only`, and forbidden scope explicit. | S5 PRD, S5 test spec, optional board row | Structural docs check proves source authority, boundary, and deferrals. | Docs only. |
| `S5-TB-1` Bundle contract characterization | Define the future read-side output contract from existing projections. | Candidate future `src/views/bundle.test.ts`; candidate future `src/views/bundle.ts` | Failing test names required bundle keys, `source_view_refs`, and absent forbidden keys. | No deterministic bundle fingerprint; no profile/hash/identity fields. |
| `S5-TB-2` Existing-view composition | Compose bundle sections from established projections before adding new read logic. | Candidate future `src/views/bundle.ts(.test)` | Test proves fixture bundle sections derive from existing views such as current state, timeline, open loops, narrative, evidence, or memory proof. | Read-only; no schema/validator/fixture mutation unless separately authorized. |
| `S5-TB-3` Boundary exclusion tests | Prove the future bundle excludes hidden simulator, pi-agent, profile-registry expansion, fingerprint, and identity/hash surfaces. | Candidate future `src/views/bundle.test.ts` | Test asserts forbidden keys and forbidden source categories are absent. | No S3/S4 scope. |
| `S5-TB-4` Acceptance report and board closure | Convert later implementation evidence into a HITL-visible completion record. | Future `docs/plans/s5-read-side-context-bundle-acceptance-report.md`; optional board row | Report-section check plus literal verification-output excerpts. | Docs report only. |

## Ready-to-apply board snippet

If `docs/plans/kanban-prd-board.md` is not edited in the S5 planning execution lane due to board ownership conflict, apply this row later under the backlog/planning section:

```markdown
| S5-001 read-side context-bundle | [`prd-s5-read-side-context-bundle.md`](prd-s5-read-side-context-bundle.md) | [`test-spec-s5-read-side-context-bundle.md`](test-spec-s5-read-side-context-bundle.md) | HITL selected; planning-ready; boundary `s5-read-only`. | Authorize docs-only S5 planning; no product implementation until PRD/test-spec acceptance. | Human approval required before any future `src/views/bundle.ts` implementation. |
```

## Acceptance criteria

1. PRD states HITL selected S5 and boundary `s5-read-only`.
2. PRD cites `.omx/specs/deep-interview-v03-hitl-successor.md` and `docs/plans/v03-foundation-reconciliation-acceptance-report.md`.
3. PRD states the HITL supersession: context bundle remains selected; deterministic/bundle fingerprint does not.
4. PRD names `src/views/bundle.ts` as absent and candidate future surface only.
5. PRD inventories existing read-side view surfaces and explains how S5 should reuse or compose them before adding new read logic.
6. PRD defines consumer, input, output-shape, and `source_view_refs` expectations before product code.
7. PRD includes exact boundaries: `No deterministic bundle fingerprint`, `No identity/hash-chain`, `No pi-agent direct coupling`, `No hidden simulator state`, and `S5 does not modify, depend on, or expand the existing profile registry`.
8. PRD keeps root `profiles/`, `schemas/profile.schema.json`, `src/hash.ts`, and `src/identity.ts` absent.
9. PRD includes `S5-TB-0` through `S5-TB-4` as future successor tracer bullets only.
10. PRD requires a later HITL gate before product implementation.
