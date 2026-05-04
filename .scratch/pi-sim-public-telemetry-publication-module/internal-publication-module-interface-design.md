# Internal public telemetry publication Module Interface design — Issue 03

Status: completed planning proposal
Date: 2026-05-04
Parent issue: `.scratch/pi-sim-public-telemetry-publication-module/issues/03-design-internal-publication-module-interface.md`
Input evidence:

- `.scratch/pi-sim-public-telemetry-publication-module/publication-responsibility-inventory.md`
- `.scratch/pi-sim-public-telemetry-publication-module/lane-construction-and-write-semantics-map.md`
- `.scratch/pi-sim-public-telemetry-publication-module/publication-regression-lock.md`
- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`
- `pi-sim/scripts/runtime/runner.ts`
- `pi-sim/scripts/runtime/publisher.ts`
- `pi-sim/scripts/runtime/provider.ts`
- `pi-sim/scripts/runtime/test.ts`
- `pi-sim/scripts/public-contract-reader-test.ts`

## Executive decision

The evidence supports a **minimal internal publication-cycle seam** for future source work, but it does **not** support a new package, public adapter, sibling-facing API, or broad `Module` abstraction today.

Recommended posture:

1. Treat `Module` as a planning name for a private producer-side boundary, not as a required source directory, class, package, or exported public API.
2. If implementation proceeds later, first extract a small private helper around a single publication tick/cycle from `runProviderRuntime`; do not extract provider routing, scenario orchestration, clock progression, or scheduling.
3. Keep `PublicTelemetryPublisher` as the low-level file-lane writer and keep `runProviderRuntime` as the owner of provider lifecycle, canonical simulation clock, frame sequence, and per-run event index.
4. Permit a **no-new-module** result if the eventual source diff has to pass `PhysiologyProvider`, `SimClock`, action scheduling, hidden scenario state, or consumer-facing assumptions through the seam.

The clearest maintainer name for the seam is **public telemetry publication cycle**. Avoid overloading `Module` in source names until implementation evidence proves a stronger abstraction is necessary.

## Authority and non-negotiable invariants

Public Interface authority remains:

- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`

Regression evidence remains:

- `pi-sim/scripts/runtime/test.ts`
- `pi-sim/scripts/public-contract-reader-test.ts`
- `pi-sim/vitals/fixtures/public-contract/**`
- scratch artifacts in `.scratch/pi-sim-public-telemetry-publication-module/`

The design must not change:

- lane names, paths, schema versions, or record schema versions;
- event kinds, event ordering guarantees already locked by tests, or per-run monotonic `eventIndex`;
- append-vs-overwrite semantics;
- `events.jsonl` and `timeline.jsonl` reset-on-construction behavior;
- stale optional-current clearing for encounter, assessment, and waveform lanes;
- sanitized provider-unavailable public payloads;
- provider-unavailable fallback behavior: public unavailable frame/status/event evidence, force-cleared optional current lanes, and no `run_ended` event;
- sibling consumer boundaries for `pi-agent`, `pi-chart`, and `pi-monitor`.

## Boundary shape

The future seam should be a private producer-side helper with one job:

> Given a runner-owned public tick context and already-resolved public-safe optional inputs, build and commit the public telemetry lane updates for that tick without changing the public ABI.

It may own:

- public scalar frame construction through the existing `buildVitalFrame` path;
- public frame metadata derivation from the produced frame;
- public encounter envelope construction and stale clearing decision;
- public assessment status/envelope/replay/unavailable publication decisions after the runner has produced public-safe assessment outcomes;
- public waveform status/envelope construction from an already-resolved public-safe waveform window;
- public event draft construction for publication-side events such as encounter, assessment, alarm, terminal, and provider-unavailable events;
- the current cross-lane commit order, as locked or intentionally preserved by tests;
- the call sequence into `PublicTelemetryPublisher`.

It must not own:

- provider selection, provider lifecycle, or provider routing;
- scenario scripts, hidden future schedules, latent findings, scoring keys, answer keys, validation evidence, or Pulse internals;
- `SimClock`, canonical clock advancement, wall-clock pacing, or frame `sequence` assignment;
- per-run `eventIndex` state;
- action scheduling or action application;
- chart/EHR truth, pi-chart ingestion policy, or pi-monitor display policy;
- public ABI authority.

## Proposed private interface vocabulary

This is intentionally pseudocode. It names future source boundaries without committing the repo to these exact type names.

```ts
type PublicEventDraft = Omit<PublicTelemetryEvent, "schemaVersion" | "eventIndex">;

type PublicationEventSink = (event: PublicEventDraft) => void;

type PublicationTickInput = {
  readonly runState: RunState;
  readonly snapshot: ProviderSnapshot;
  readonly providerMetadata: ProviderMetadata;
  readonly sequence: number;       // runner-owned
  readonly wallTime: string;       // runner-owned source of this tick's public wall time
  readonly thresholds?: VitalThresholds;
  readonly unavailableReason?: WaveformAvailabilityReason;
  readonly providerUnavailableFallback: boolean;

  // Already resolved by the runner; no provider object crosses this seam.
  readonly encounterContext?: ProviderEncounterContext;
  readonly waveformWindow?: ProviderWaveformWindow;
  readonly pendingPublicEvents: readonly PendingPublicEventInput[];
  readonly pendingAssessmentPublications: readonly PendingAssessmentPublicationInput[];
  readonly assessmentState: PublicationAssessmentState;
  readonly encounterState: PublicationEncounterState;
};

type PublicationTickOutput = {
  readonly frame: VitalFrame;
  readonly nextAssessmentState: PublicationAssessmentState;
  readonly nextEncounterState: PublicationEncounterState;
};

function publishTelemetryTick(
  input: PublicationTickInput,
  publisher: PublicTelemetryPublisher,
  appendEvent: PublicationEventSink,
): PublicationTickOutput;
```

Design notes:

- `appendEvent` is supplied by `runProviderRuntime` so the runner keeps sole ownership of `nextEventIndex` and the final `schemaVersion: 2` event envelope stamp.
- `sequence`, `wallTime`, `runState`, and `snapshot.t` are supplied by the runner; the helper must preserve them, not recompute simulator time.
- The provider object is not passed through the seam. Provider optional capabilities are resolved by the runner into public-safe DTOs or omitted for provider-unavailable fallback.
- The helper can return updated publication-local state, but state that affects scheduling, provider calls, or clock progression stays in the runner.
- Exact type names can be deferred. The important boundary is data ownership, not nomenclature.

## Responsibility split

| Responsibility | Stays in `runProviderRuntime` | Candidate publication-cycle helper | Stays in `PublicTelemetryPublisher` |
| --- | --- | --- | --- |
| Provider `init`, `advance`, `applyAction` | Yes | No | No |
| Scenario/action sorting and scheduling | Yes | No | No |
| Canonical `SimClock` advancement and `markEnded` | Yes | No | No |
| Frame `sequence` assignment | Yes | No, receives assigned sequence | No |
| Per-run `eventIndex` counter | Yes | No, emits unstamped event drafts only | No |
| Provider-unavailable catch and private error wrapping | Yes | No | No |
| Public provider-unavailable terminal payload shape | Yes for trigger/terminal policy | May build generic event draft | No |
| Public scalar frame construction | May delegate | Yes, through existing `buildVitalFrame` behavior | No |
| Encounter public envelope construction | May delegate | Yes | Writes/clears file only |
| Assessment reveal/replay/unavailable public envelopes | Runner owns provider `assess` call and queue trigger | May own public envelope/status/digest construction from safe outcomes | Writes/clears files only |
| Waveform optional capability call | Yes | No, receives window/undefined | No |
| Waveform status/envelope construction | May delegate | Yes | Writes/clears files only |
| `current.json`, `status.json`, `timeline*`, `events.jsonl`, optional current file I/O | No | Coordinates existing order only | Yes |
| Append-lane reset-on-construction | No | No | Yes |
| Public ABI docs/manifest authority | No | No | No |

## Provider optional capability flow

The seam must use an **already-resolved optional public input** pattern.

### Encounter

1. Runner decides whether encounter resolution is allowed for this tick.
2. During provider-unavailable fallback, runner passes `encounterContext: undefined` to preserve the Issue 02 force-clear policy.
3. Otherwise runner may call `provider.encounterContext?.()`.
4. Helper converts `ProviderEncounterContext` into `PublicEncounterContext`, preserving allowlisted fields only and sanitizing display context to primitive public values.
5. Helper coordinates `publisher.publishEncounter(contextOrUndefined)`, which writes or clears `encounter/current.json`.

No hidden provider, scenario, expected chart, scoring, or future-finding state crosses the seam.

### Assessments

1. Runner remains responsible for detecting `assessment_request` actions, calling `provider.assess`, de-duplicating request IDs, and deciding reveal/replay/unavailable outcomes.
2. Runner passes only public-safe pending assessment publication records into the helper.
3. Helper may construct:
   - `assessment_requested` event drafts;
   - `assessment_unavailable` event drafts;
   - `assessment_revealed` event drafts;
   - `PublicAssessmentEnvelope` with digest;
   - `PublicAssessmentStatus`.
4. During provider-unavailable fallback, runner passes no pending assessment publications and sets `providerUnavailableFallback: true`; helper clears `assessments/current.json` and publishes status reason `provider_unavailable`.
5. `ProviderAssessmentResult` remains an internal producer input. The helper must structurally allowlist public fields and must not expose extra provider keys, latent findings, scoring evidence, or future truth.

### Waveforms

1. Runner decides whether waveform resolution is allowed for this tick.
2. During provider-unavailable fallback, runner passes `waveformWindow: undefined` and unavailable reason `provider_unavailable`.
3. Otherwise runner may call `provider.waveformWindow?.()`.
4. Helper constructs `WaveformStatus` and optional `WaveformEnvelope` from the public-safe `ProviderWaveformWindow`.
5. Helper coordinates `publisher.publishWaveform(status, envelopeOrUndefined)`, which writes status and writes or clears `waveforms/current.json`.

The helper must preserve explicit `available`, `reason`, `sourceKind`, `fidelity`, and `synthetic` labels so consumers do not infer hidden provider state.

## Commit order to preserve

A future implementation should preserve the current order unless an accepted issue explicitly changes it and updates tests/docs:

1. Drain already queued public event drafts.
2. Publish/clear encounter current and append encounter events.
3. Publish assessment events/status/current.
4. Publish scalar frame lanes: `current.json`, `timeline.json`, `timeline.jsonl`, `status.json`.
5. Publish waveform status/current.
6. Append alarm events for the published frame.
7. Let the runner append terminal `run_ended` after the ended frame, or append sanitized terminal `provider_unavailable` after fallback publication.

This ordering is not a cross-file transaction. Per-file atomic writes remain in `PublicTelemetryPublisher`; cross-lane skew remains possible and should be treated as a known public runtime property unless later work introduces an explicit reader strategy.

## Rollback and no-new-module path

Use the no-new-module outcome if any future implementation attempt requires one of these compromises:

- passing the whole `PhysiologyProvider` into the publication helper;
- moving `SimClock`, action scheduling, `nextEventIndex`, or provider lifecycle into the helper;
- changing public lanes, schemas, event kinds, reset semantics, stale-clearing semantics, or consumer contracts;
- making tests less direct or hiding public behavior behind mocks that no longer resemble `vitals/` files;
- creating a broad abstraction that mostly renames `runProviderRuntime` without reducing boundary risk.

Rollback path:

1. Keep `runProviderRuntime` and `PublicTelemetryPublisher` as the source structure.
2. Preserve the Issue 02 regression locks.
3. Promote only documentation clarifications through Issue 06.
4. Revisit extraction only after Issue 05 isolates event/assessment complexity or after repeated source edits show the same publication construction risk.

## ADR trigger

Do not create an ADR from this issue alone.

Create `pi-sim/docs/adr/005-public-telemetry-publication-module.md` only if maintainers accept this as durable architecture or if a later implementation issue changes how future agents should reason about public telemetry publication ownership.

If created later, ADR 005 should record:

- README plus `.lanes.json` remain public ABI authority;
- the publication-cycle helper is private producer implementation;
- runner owns provider lifecycle, simulator time, sequence, and event indexing;
- `PublicTelemetryPublisher` owns file I/O and append-lane reset;
- hidden simulator internals remain outside sibling consumer contracts.

## Recommended next gate

Proceed to Issue 05 next:

`.scratch/pi-sim-public-telemetry-publication-module/issues/05-runner-event-and-assessment-reveal-subordinate-work.md`

Rationale: Issue 03 identifies event and assessment reveal/replay/unavailable handling as the main complexity that could justify or reject extraction. Issue 05 should decide whether those behaviors stay in `runProviderRuntime`, move into a private publication-cycle helper, or remain intentionally unextracted.

Issue 06 should follow after Issue 05 or any accepted source-refactor decision so README/manifest/fixture wording can close over the actual chosen architecture rather than the planning hypothesis.
