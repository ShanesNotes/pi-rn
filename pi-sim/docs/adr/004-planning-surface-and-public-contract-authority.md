# ADR 004 — Planning Surface and Public Contract Authority

Status: Accepted
Date: 2026-05-03

## Decision

`pi-sim` planning authority is layered as follows:

1. Root `CONTEXT-MAP.md` and `docs/agents/*` define the shared Matt Pocock skill workflow and cross-agent work surfaces.
2. `pi-sim/CONTEXT.md` defines simulator domain language; `pi-sim/docs/adr/` defines durable simulator decisions.
3. Root `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` are the active Matt-skill planning and issue surfaces for new implementation work.
4. `docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` classifies current, extended, superseded, and historical planning artifacts; it is a ledger, not the issue tracker.
5. `.omx/plans/*` artifacts are OMX runtime evidence/lineage. Project-relevant implementation intent must be mirrored into `.scratch/<feature>/` before new execution.
6. Public contract authority for sibling consumers is producer-side in `vitals/README.md` and `vitals/.lanes.json`.

ADR-003 extends ADR-002 for canonical simulation clock ownership: `pi-sim` owns the canonical simulation clock for patient-runtime publication. Sibling consumers may preserve and display `simTime_s` / timestamps from public envelopes, but they do not own or rewrite the simulation clock.

## Drivers

- Future AI coding agents were forced to infer current direction from many historical PRDs, RALPLANs, tombstones, and sibling plans.
- `pi-agent` isolation and hidden-patient secrecy require public contracts to be explicit.
- ADR-002 left canonical clock ownership open; ADR-003 resolved it in practice by assigning the patient runtime and canonical simulation clock to `pi-sim`.
- Planning artifacts must prevent stale monitor-first or shim-first paths from being revived.
- Commit `fa7b278` established `.scratch` as the shared durable PRD/issue surface; pi-sim planning docs must not route new active work back through root `PLANNING.md` or `.omx/plans/`.

## Consequences

- `docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` becomes the canonical planning ledger for pi-sim/pi-monitor AI-agent alignment.
- Root `CONTEXT-MAP.md` plus `docs/agents/work-surface.md` are the fresh-agent routing front door for workflow surfaces.
- New implementation lanes must use `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`; `.omx/plans/*` may be cited as evidence but is not the default issue queue.
- Clock-sensitive adapters must preserve `pi-sim` simulation time and define any chart-side wall-clock or `asOf` mapping before writing chart truth.

## Alternatives considered

- Rely only on existing M-series plans: rejected because too many historical files look current to fresh agents.
- Add only a short index: rejected because it does not resolve public-contract and clock authority.
- Keep root `PLANNING.md` as an active front door: rejected because the shared Matt-skill workflow now routes active work through `CONTEXT-MAP.md`, `docs/agents/*`, and `.scratch/<feature>/`.
- Start implementation now: rejected because it would codify planning drift.

## Follow-ups

- Keep `docs/plans/INDEX.md`, `CONTEXT-MAP.md`, and `docs/agents/work-surface.md` consistent with the 007 ledger.
- Create the public ABI lock as a `.scratch/<feature>/PRD.md` plus issue slices before implementation.
- Defer `pi-rn/ingest/` implementation until chart provenance/idempotency/write policy are specified.
