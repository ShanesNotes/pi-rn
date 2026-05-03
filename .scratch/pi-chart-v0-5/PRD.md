# PRD: pi-chart V0.5 project-surface normalization and claim-ledger kernel handoff

Status: needs-triage
Lineage status: superseded for kernel implementation by `.scratch/pi-ledger-claim-ledger-kernel/`; use this surface as pre-`pi-ledger` V0.5 planning/front-door evidence only.

## Problem Statement

The pi-chart rebase has strong planning work, but it is spread across chat context, `.omx`, `memos/`, `docs/plans/`, `docs/planning/`, and legacy ADR path references. Agents can easily treat stale plans as active authority or miss the reviewed V0.5 claim-ledger kernel plan.

The project needs Matt-skills-compatible work surfaces before implementation: a V0.5 program/front-door in `.scratch`, separate implementation workstreams in `.scratch`, durable decisions in `docs/adr/`, and stale surfaces bannered or archived only after review.

## Solution

Normalize project artifacts around the Matt engineering workflow:

- Use `.scratch/pi-chart-v0-5/` as the active V0.5 program/front-door surface, with implementation workstreams split into their own `.scratch/<workstream>/` directories.
- Treat `.omx` as runtime/planning lineage and mirror durable outcomes into `.scratch`.
- Treat `pi-chart/docs/plans/` and root `PLANNING.md` as historical/promoted planning evidence, not active scratchpads.
- Use `pi-chart/docs/adr/` as the single accepted ADR authority.
- Keep `pi-chart/docs/planning/v0.5/README.md` as the durable index, pointing to `.scratch` and evidence surfaces.
- Proceed to V0.5 implementation only through approved issue slices and Matt `$tdd` red-green-refactor discipline.

## User Stories

1. As a future coding agent, I want one active V0.5 work surface, so that I do not mine `.omx` or stale planning docs for current instructions.
2. As a maintainer, I want ADRs under `docs/adr/`, so that durable decisions are easy to find across subprojects.
3. As a reviewer, I want V0.5 implementation split into tracer-bullet issues, so that each slice is independently verifiable.
4. As a clinical-memory architect, I want stale prototype and planning artifacts bannered before archive, so that evidence is preserved without becoming authority.
5. As an implementation agent, I want the claim-ledger kernel PRD/test-spec surfaced from `.omx` into `.scratch`, so that I can implement only reviewed scope.

## Implementation Decisions

- Active V0.5 planning is split into a **program/front-door surface** (`.scratch/pi-chart-v0-5/`) and an **implementation workstream surface** now retargeted to `.scratch/pi-ledger-claim-ledger-kernel/`. The program surface owns rebase organization and governance; the `pi-ledger` workstream owns the Phase 1 K0-K6 claim-ledger kernel PRD, test spec, and TDD issues.
- **Archived research package** is the canonical term for V0.5 preserved package-bundle inputs. Use `pkg-NNN:<path>` citations; do not treat package-internal ADRs, statuses, or issue lists as repo authority.
- Active planning and issue state lives under `.scratch/<feature>/`.
- Accepted decisions live under subproject `docs/adr/` directories.
- Root `PLANNING.md` is historical/transitional, not a front door.
- Existing `docs/plans/` content is legacy/promoted planning evidence.
- `pi-chart/docs/planning/v0.5/README.md` remains a lightweight index, not a scratchpad.
- V0.5 Phase 1 implementation scope remains K0-K6 from the reviewed claim-ledger kernel PRD/test-spec, now owned under `.scratch/pi-ledger-claim-ledger-kernel/` after the `pi-ledger` decision.
- Package ADR numbers remain package-source labels, not accepted repo ADR numbers.

## Testing Decisions

- Documentation normalization is verified with grep-style structural checks for stale active-authority references.
- Future source implementation must use Matt `$tdd`: one vertical behavior test, one minimal implementation, then repeat.
- Tests should verify public behavior of the claim-ledger kernel, not internal helper structure.
- Phase 1 behavior comes from `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md` until mirrored into executable slices.

## Out of Scope

- No source, schema, fixture, package, lockfile, or patient-data edits in this PRD.
- No bulk deletion of historical planning files.
- No package archive edits.
- No clean-slate service/event-store rewrite.
- No migration of current `patients/` data.
- No final acceptance of a new V0.5 kernel ADR.

## Prior-work mining language

Use **clinical truth guardrail** for a source-cited, domain-level rule that protects chart truth and is re-justified for V0.5. Prototype implementation details are not guardrails.

## Further Notes

- `.scratch/pi-chart-v0-5/foundation-decision-register.md` — draft re-distillation surface for broad prior decisions before clean-canvas coding.

- `.scratch/pi-chart-v0-5-salvage-mining/README.md` — locked future marker for post-kernel salvage mining; prevents deep prototype mining during Phase 1.

Primary evidence:

- `docs/agents/work-surface.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/skill-interoperability.md`
- `pi-chart/docs/planning/v0.5/README.md`
- `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md`
- `pi-chart/memos/v0-5-spec-prep-synthesis-20260503.md`
- `.omx/plans/prd-v0-5-claim-ledger-kernel.md`
- `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md`
- `.omx/plans/review-v0-5-claim-ledger-kernel-20260503.md`
