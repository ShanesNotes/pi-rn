# PRD: pi-sim public telemetry publication Module

Status: ready-for-agent
Owner: pi-sim
Date: 2026-05-03

## Problem Statement

`pi-sim` publishes public patient-runtime telemetry through `pi-sim/vitals/`. That public boundary now carries scalar frames, run status, event history, encounter context, assessment request/reveal status, and optional waveform lanes. The publication behavior is already useful, but its responsibilities are spread across the runtime runner, provider interfaces, publisher file writer, README contract, lane manifest, fixtures, and tests.

Future work needs a maintainer-facing publication Module plan so agents can deepen the producer implementation without confusing hidden patient runtime internals with public telemetry output. Without this lane, agents may revive historical monitor-first plans, treat fixtures as ABI authority, or change sibling consumer semantics while trying to refactor internal publication code.

## Solution

Create a planning lane for the internal `pi-sim` public telemetry publication Module. The lane inventories and later designs the producer-side Module seam around public telemetry construction and file-lane publication while preserving the current public contract.

`Module` is a planning hypothesis in this lane, not a commitment to create a new source directory, class, function, package, or abstraction. The accepted outcome may be to keep the current runner/publisher structure if the inventory, write-semantics map, and regression-lock work do not prove that a new seam reduces risk.

This PRD seeds planning only. It does not edit `pi-sim` runtime source, change JSON/JSONL schema semantics, rename lanes, create sibling adapters, or authorize chart/EHR writes.

## Authority and constraints

- `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` are the public telemetry Interface authority for sibling consumers.
- `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md` requires new implementation lanes to use `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md`, not `.omx/plans/*`, as the active planning and issue surface.
- ADR 004 also assigns canonical simulation clock ownership to `pi-sim`; sibling consumers may preserve and display public `simTime_s` and timestamps but must not own or rewrite simulation time.
- Hidden patient runtime Implementation remains private. Consumers and sibling Modules must not import provider internals, scenario secrets, validation evidence, latent findings, future schedules, scoring keys, or Pulse internals.
- Public contract fixtures under `pi-sim/vitals/fixtures/public-contract/**` are regression evidence, not a second ABI authority.
- The `monitor` extension in `current.json` is display-only and must not become chart/EHR truth.
- `events.jsonl` is an append-only public event lane within a run, reset on `PublicTelemetryPublisher` construction, with schema version 2 records and per-run monotonic `eventIndex`.
- Assessment reveal output is reveal-only: `assessments/current.json` exists only after a public request/reveal and must not expose hidden future truth.
- Waveform lanes must preserve explicit availability and source/fidelity/synthetic labeling; absence must be visible as unavailable status, not inferred from hidden provider state.

## Current responsibility inventory

| Surface | Current responsibility | Module implication |
| --- | --- | --- |
| `pi-sim/scripts/runtime/provider.ts` | Defines public provider-facing types: event kinds, encounter context, assessment request/result/envelope shapes, waveform status/envelopes, and provider optional capabilities. | Inventory type ownership before extracting any Module API. |
| `pi-sim/scripts/runtime/runner.ts` | Owns canonical `SimClock`, action scheduling, event ordering, encounter publication, assessment request/reveal/replay/unavailable behavior, waveform publication calls, terminal run events, and provider-unavailable fallback. | Runner event/reveal behavior must be subordinate issue work in this lane, not a separate top-level PRD. |
| `pi-sim/scripts/runtime/publisher.ts` | Writes public files atomically or by append, resets append lanes on construction, clears stale optional current lanes, and preserves run-local timeline history. | Candidate internal Module boundary likely wraps writer semantics while keeping public lanes unchanged. |
| `pi-sim/vitals/README.md` | Documents the producer-owned public contract, file meanings, schema examples, terminal semantics, reveal-only assessment behavior, and fixture posture. | Stays ABI authority; updates only when accepted Module design changes maintainer-relevant publication semantics. |
| `pi-sim/vitals/.lanes.json` | Machine-readable lane manifest: names, paths, artifact kinds, schema versions, write/reset semantics, producers, and preferred consumer modes. | Must remain consistent with README and any future source tests. |
| `pi-sim/scripts/runtime/test.ts` | Source-freshness checks for runner/publisher behavior, event ordering, lane manifest expectations, unavailable paths, waveform lanes, and assessment reveal/replay. | Future source edits must keep or expand these tests before refactor. |
| `pi-sim/scripts/public-contract-reader-test.ts` | Consumer-style checks against public contract fixtures, terminal event semantics, manifest coverage, monotonic event indexes, and fixture safety. | Future Module work must preserve fixture readability without importing hidden internals. |

## User Stories

- As a `pi-sim` maintainer, I can see where public telemetry publication responsibilities live before accepting an internal Module seam.
- As a runtime contributor, I can refactor runner/publisher code without changing public lane names, JSON/JSONL semantics, reset behavior, or clock ownership.
- As a `pi-monitor` consumer author, I can continue reading display-only public lanes without importing hidden `pi-sim` internals or treating monitor metadata as chart truth.
- As a future `pi-chart` ingest planner, I can rely on `timeline.jsonl`, `events.jsonl`, and reveal-safe public lanes as observed public evidence while chart-write policy remains separate and gated.
- As a `pi-agent` boundary reviewer, I can verify assessment reveal output is request-bound and public, not leaked hidden simulator truth.

## Implementation Decisions

- This lane starts with inventory and regression-lock work, then designs an internal Module Interface only if evidence shows it improves maintainability.
- `Module` remains a planning hypothesis until evidence shows that a new seam is safer than preserving the current runner/publisher structure.
- Initial issues are documentation/planning/test-shape slices only. Source edits require later triage.
- Public lane names, paths, schema versions, event kinds, event ordering guarantees, reset semantics, and preferred consumer modes are preserved during PRD creation.
- Runner event/reveal behavior is subordinate work in this lane because it is part of public telemetry publication, not an independent consumer-facing PRD.
- Module design must preserve runner-owned simulation clock and per-run event index ownership.
- Any future public telemetry publication Module may own public telemetry construction and file-lane publication, but must not own scenario orchestration, provider routing, or canonical simulation clock progression.
- Optional current lanes keep stale-file clearing semantics: encounter/current clears when unavailable, assessments/current is absent until reveal or cleared when unavailable/no request, and waveforms/current clears when unavailable/no window.

## Initial issue slices

1. `issues/01-inventory-publication-responsibilities.md` — inventory runner/provider/publisher/docs/tests ownership and hidden/public boundaries.
2. `issues/04-lane-construction-and-write-semantics.md` — map lane construction, reset, append/atomic write, stale-clear, and failure semantics.
3. `issues/02-lock-publication-regression-tests.md` — define regression-lock coverage before any source refactor.
4. `issues/03-design-internal-publication-module-interface.md` — propose a maintainer-facing internal Module seam without changing public ABI.
5. `issues/05-runner-event-and-assessment-reveal-subordinate-work.md` — subordinate slice for event ordering, terminal semantics, assessment request/reveal/replay/unavailable behavior, and reveal-safe output.
6. `issues/06-docs-manifest-fixture-closeout.md` — close README/manifest/fixture/test documentation consistency after any accepted internal Module design.

Default gate order: Issue 04 should normally follow Issue 01 so write semantics are mapped before regression-lock design, unless Issue 01 finds an urgent regression gap that should move Issue 02 first.

## Testing Decisions

- Future source-edit verification command: `npm test --prefix pi-sim`.
- Regression-lock work should focus on source tests for `PublicTelemetryPublisher`, `runProviderRuntime`, lane manifest expectations, public contract fixtures, terminal events, per-run event indexes, assessment reveal/replay, unavailable provider behavior, and waveform availability labeling.
- Planning-only changes in this lane are verified with file existence, scope review, Markdown readability, and absence of edits outside `.scratch/pi-sim-public-telemetry-publication-module/`.
- Any future code refactor must show no hidden simulator imports in sibling consumer checks and no public fixture exposure of scenario secrets, latent findings, future truth, scoring keys, or runtime paths.

## Out of Scope

- Changing public telemetry JSON/JSONL schema semantics.
- Renaming or removing lanes in `pi-sim/vitals/.lanes.json`.
- Implementing `pi-rn/ingest/` or any sibling consumer adapter.
- Adding `pi-chart` chart writes or EHR truth.
- Treating `pi-monitor` display metadata as clinical/chart authority.
- Exposing hidden provider internals, scenario secrets, latent findings, scoring keys, validation evidence, or future schedules.
- Creating a new ADR during PRD seeding. ADR trigger: create `pi-sim/docs/adr/005-public-telemetry-publication-module.md` only if triage accepts a durable Module Interface or changes how maintainers reason about public publication semantics.

## Acceptance Criteria

- [ ] This PRD exists under `.scratch/pi-sim-public-telemetry-publication-module/PRD.md`.
- [ ] Initial issues exist under `.scratch/pi-sim-public-telemetry-publication-module/issues/`.
- [ ] The PRD states that `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` remain the public telemetry Interface authority.
- [ ] The PRD distinguishes hidden patient runtime Implementation from public telemetry publication output.
- [ ] Initial issues cover inventory, regression-lock tests, internal publication Module Interface design, lane construction/write semantics, runner event/reveal subordinate work, and documentation/fixture closeout.
- [ ] The lane does not change JSON/JSONL semantics, public lane names, sibling consumer contracts, hidden runtime code, or chart/EHR write policy during PRD creation.
- [ ] Future source-edit verification names `npm test --prefix pi-sim`.

## Further Notes

Primary evidence:

- `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md`.
- `pi-sim/vitals/README.md`.
- `pi-sim/vitals/.lanes.json`.
- `pi-sim/scripts/runtime/provider.ts`.
- `pi-sim/scripts/runtime/runner.ts`.
- `pi-sim/scripts/runtime/publisher.ts`.
- `pi-sim/scripts/runtime/test.ts`.
- `pi-sim/scripts/public-contract-reader-test.ts`.
- `.scratch/pi-sim-public-telemetry-contract-lock/PRD.md`.
- `.scratch/pi-sim-public-telemetry-contract-lock/ingest-adapter-readiness.md`.
