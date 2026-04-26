# PRD — Context bundle implementation (CB-001)

## Status and authority

- Board card: `CB-001`
- Status: **accepted (2026-04-26)**
- HITL disposition source: `memos/hitl-decisions-26042026.md` #3 — operator chose "Open new PRD" to authorize the already-on-disk bundle implementation as a lane distinct from `S5-001`.
- Predecessor planning surface: `docs/plans/prd-s5-read-side-context-bundle.md` (`S5-001`). That PRD remains docs-only and explicitly forbids `src/views/bundle.ts`. CB-001 inherits its boundary phrasing but grants the implementation authority that S5-001 withholds.
- Successor authority for implementation: this PRD.
- Acceptance evidence: `docs/plans/s5-read-side-context-bundle-acceptance-report.md` (header rewritten in this lane to point at CB-001 as authority).
- Brownfield baseline authority remains `decisions/015-adr-009-011-implementation.md` and `schema_version: 0.3.0-partial`.

## Why this lane exists

`src/views/bundle.ts`, `src/views/bundle.test.ts`, and a `src/views/index.ts` re-export landed on disk through a prior workflow but were never legitimized — `S5-001` is gated docs-only. Two clean paths existed: (a) revert the implementation, or (b) open a distinct PRD that authorizes it. HITL chose (b). CB-001 is that PRD.

## Problem / consumer

A bounded read-side composition function gives downstream serialized readers (e.g., agent context loaders, export pipelines) one deterministic snapshot derived from existing pi-chart-visible projections. The first approved consumer is a serialized-bundle reader; no direct pi-agent coupling is authorized.

## Implemented surface (already on disk)

| File | Role | Boundary |
|---|---|---|
| `src/views/bundle.ts` | `contextBundle({ scope, asOf, encounterId })` read-only composition over `currentState`, `openLoops`, `narrative`, `timeline`, `memoryProof`. Returns `{ patient_id, asOf, source_view_refs, current_state, open_loops, narrative_handoff, evidence_context, recent_timeline }`. | No new raw chart loading; no schema/profile/hash/fingerprint scope. |
| `src/views/bundle.test.ts` | Contract / view-derivation / export-surface / forbidden-key tests. | View-only test surface; uses temp fixtures via existing helpers. |
| `src/views/index.ts` | Adds `contextBundle` and three public types (`ContextBundle`, `ContextBundleParams`, `EvidenceContext`) to the views barrel. | No root API export; views barrel only. |

## Boundaries (inherited from S5-001 verbatim)

- **No deterministic bundle fingerprint.**
- **No identity/hash-chain.** No `src/hash.ts`. No `src/identity.ts`.
- **No profile-registry expansion.** No root `profiles/`. No `schemas/profile.schema.json`. No edits to `schemas/profiles/index.json`.
- **No schema/validator changes.** No edits to `schemas/event.schema.json` or `src/validate.ts`.
- **No package/dependency changes.**
- **No fixture mutation.** No edits to `patients/`.
- **No root API export.** Bundle is exposed via `src/views/index.ts` only, not from `src/index.ts`.
- **No pi-agent direct coupling.**
- **No pi-sim / hidden-simulator source access.**

## Acceptance criteria

- [x] `contextBundle` exists in `src/views/bundle.ts` with the signature above and composes only existing projections.
- [x] `src/views/bundle.test.ts` covers contract keys, view-derivation parity (same inputs → bundle sections equal direct projection calls), export-surface presence, and forbidden-wrapper-key absence.
- [x] `src/views/index.ts` re-exports `contextBundle` and the three public types.
- [x] No edits to `schemas/`, `patients/`, `src/validate.ts`, `package.json`, or `package-lock.json` attributable to this lane.
- [x] `npm test` passes (333+).
- [x] `npm run typecheck` passes.
- [x] `npm run check` remains 0/0.

## Non-goals

- Deterministic / hash-based bundle fingerprint.
- Section selectors or section limits.
- Performance optimization or DTO normalization.
- Consumer-specific reshaping (e.g., agent-context-loader-shaped output).
- Root `src/index.ts` API exposure.
- Profile-aware filtering.

## Verification

```bash
node --test --import tsx src/views/bundle.test.ts
npm test
npm run typecheck
npm run check
```

## Future successor lanes (not authorized here)

- **CB-002** Section selectors and limits.
- **CB-003** Deterministic bundle fingerprint (gated on ADR012/013 identity-hash lane).
- **CB-004** Profile-aware filtering (gated on ADR008 / S4 profile-registry lane).
- **CB-005** Consumer-specific output shaping (gated on a named pi-agent / export consumer per BND-001).

Each requires its own HITL disposition.
