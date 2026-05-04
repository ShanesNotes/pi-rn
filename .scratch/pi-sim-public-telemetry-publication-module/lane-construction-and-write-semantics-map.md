# Lane construction and write semantics map

## Executive summary

This Issue 04 artifact maps the current public telemetry lane construction and write behavior before any internal publication Module seam is designed. It is scratch-only planning evidence: no source, README, manifest, ADR, fixture, test, or issue-status changes are made here.

Key conclusions:

- `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` remain the public telemetry Interface authority.
- The provider-runtime lane writer is `PublicTelemetryPublisher` in `pi-sim/scripts/runtime/publisher.ts`; public event/envelope construction is coordinated by `runProviderRuntime` in `pi-sim/scripts/runtime/runner.ts`.
- Latest-state lanes use per-file atomic rename overwrite. JSONL lanes append records and are reset by `PublicTelemetryPublisher` construction. `timeline.json` is a compatibility array rewritten as a whole file from publisher-local in-memory history.
- Optional current lanes clear stale files when unavailable or not applicable: `encounter/current.json`, `assessments/current.json`, and `waveforms/current.json`.
- Cross-lane writes are not transactional. Source order matters and should be regression-locked before source refactor.
- `scripts/monitor.ts` is a legacy compatibility publisher for only `current.json` and `timeline.json`; it is not evidence that the full provider-runtime lane contract is implemented outside `PublicTelemetryPublisher`.
- Provider-unavailable public event payloads currently include `payload.message` from provider/shim errors. This is a privacy/boundary follow-up for Issue 02 before Module design.

## Authority and scope

Authoritative public surfaces:

- `pi-sim/vitals/README.md` sections `Files`, `Schema — current.json`, `Schema — events.jsonl`, `Schema — timeline.jsonl`, encounter/assessment/waveform schema sections, terminal semantics, and `Agent boundary`.
- `pi-sim/vitals/.lanes.json` top-level `producer`/`resetSemantics` and each lane entry.
- `pi-sim/CONTEXT.md` sections `Hard boundaries` and `Public contract authority`.
- `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md` section `Decision` for `.scratch` planning authority, producer-side public contract authority, and `pi-sim` clock ownership.

Maintainer evidence, not consumer ABI:

- `pi-sim/scripts/runtime/publisher.ts` symbols `PublicTelemetryPublisher`, `publish`, `appendEvent`, `publishEncounter`, `publishAssessment`, `publishWaveform`, and `atomicWrite`.
- `pi-sim/scripts/runtime/runner.ts` symbol `runProviderRuntime` and local helpers `eventFor`, `publicEncounterContextFor`, `publicAssessmentStatusFor`, `publicAssessmentEnvelopeFor`, `publishWaveformLane`, and `toUnavailable`.
- `pi-sim/scripts/runtime/frame.ts` symbols `buildVitalFrame` and `computeAlarms`.
- `pi-sim/scripts/monitor.ts` legacy compatibility writer.

Out of scope for this artifact:

- Changing public lane names, paths, schemas, write behavior, or reset behavior.
- Editing runtime source, tests, fixtures, README, `.lanes.json`, ADRs, or issue statuses.
- Treating fixtures as ABI authority.
- Authorizing sibling consumers to import hidden `pi-sim` source or rewrite simulator time.

## Lane-by-lane manifest and write map

`pi-sim/vitals/.lanes.json` contains ten lanes. The table below preserves the manifest fields and adds current construction/write-order notes from source evidence.

| Lane | Path | Artifact kind | Schema version | Record schema version | Manifest write semantics | Manifest reset semantics | Manifest producer | Preferred consumer mode | Current construction and writer notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `current` | `current.json` | `latest-frame` | 1 | n/a | `atomic-rename`, `overwrite-latest` | Overwritten on each published frame | `PublicTelemetryPublisher.publish` | `read-latest` | Constructed by `buildVitalFrame` from `ProviderSnapshot`, `ProviderMetadata`, runner `sequence`, `runState`, thresholds, and wall time. Written first inside `PublicTelemetryPublisher.publish` via `atomicWrite`. |
| `timeline-compat-array` | `timeline.json` | `frame-history-compat-array` | 1 | 1 | `atomic-rename`, `whole-file-rewrite`, `compat-array` | Publisher instance starts a new in-memory history and rewrites this file | `PublicTelemetryPublisher.publish` | `compat-array` | `PublicTelemetryPublisher.history` appends the frame in memory, then rewrites the whole array via `atomicWrite` after `current.json`. Constructor does not delete old `timeline.json`; first publish replaces it. |
| `timeline-append-jsonl` | `timeline.jsonl` | `frame-history-jsonl` | 1 | 1 | `append-jsonl`, `reset-on-construction` | Removed by `PublicTelemetryPublisher` constructor before appending run-local frames | `PublicTelemetryPublisher.publish` | `tail-jsonl` | Constructor removes the file with `rmSync(..., { force: true })`. Each `publish` appends one compact JSON frame line after `timeline.json` rewrite and before `status.json`. |
| `status` | `status.json` | `latest-run-status` | 1 | n/a | `atomic-rename`, `overwrite-latest` | Overwritten on each published frame | `PublicTelemetryPublisher.publish` | `read-latest` | Constructed inside `publish` as `PublisherStatus` from `frame.monitor` source/sequence/runState plus `frame.t` as `simTime_s` and `frame.wallTime` as `updatedAt`. Written by `atomicWrite` after `timeline.jsonl` append. |
| `events` | `events.jsonl` | `event-history-jsonl` | 2 | 2 | `append-jsonl`, `reset-on-construction` | Removed by `PublicTelemetryPublisher` constructor before appending run-local events; `eventIndex` is per-run and starts at 0 | `Runtime runner event lane` | `tail-jsonl` | Constructor removes the file with `rmSync(..., { force: true })`. Runner owns `nextEventIndex` and constructs `PublicTelemetryEvent` records via `eventFor`; `appendEvent` appends compact JSON lines. Events can be written before or after frame lanes depending on event kind. |
| `encounter-current` | `encounter/current.json` | `latest-encounter-context` | 1 | n/a | `atomic-rename`, `overwrite-latest`, `clears-when-unavailable` | Removed when a provider supplies no public encounter context | `PublicTelemetryPublisher.publishEncounter` | `read-latest` | Runner reads optional `provider.encounterContext`, converts with `publicEncounterContextFor`, then calls `publishEncounter`. If context is present, publisher creates `encounter/` and atomic-writes current; otherwise it removes stale current if present. No `encounter/status.json` exists. |
| `assessments-status` | `assessments/status.json` | `latest-assessment-status` | 1 | n/a | `atomic-rename`, `overwrite-latest` | Overwritten on each frame with current assessment capability/request status | `PublicTelemetryPublisher.publishAssessment` | `read-latest` | Runner constructs `PublicAssessmentStatus` every frame with `publicAssessmentStatusFor`. Publisher creates `assessments/` and writes status before writing or clearing `assessments/current.json`. |
| `assessments-current` | `assessments/current.json` | `latest-revealed-assessment` | 1 | n/a | `atomic-rename`, `overwrite-latest`, `clears-when-unavailable` | Absent until assessment reveal; removed before request, when unavailable, or when a request has no reveal | `PublicTelemetryPublisher.publishAssessment` | `read-latest` | Runner creates `PublicAssessmentEnvelope` only after an assessment request/reveal. Publisher atomic-writes the envelope if present. If no envelope and `clearCurrent` is true, publisher removes stale current. Replays append an event but preserve the original current envelope. |
| `waveforms-status` | `waveforms/status.json` | `latest-waveform-status` | 1 | n/a | `atomic-rename`, `overwrite-latest` | Overwritten on every provider-runtime frame with availability truth | `PublicTelemetryPublisher.publishWaveform` | `read-latest` | Runner calls `publishWaveformLane` after scalar frame publication. It writes unavailable status when optional `provider.waveformWindow` is absent, or available status with source/fidelity/synthetic labels when a window exists. Publisher writes status before current/clear. |
| `waveforms-current` | `waveforms/current.json` | `latest-waveform-window` | 1 | n/a | `atomic-rename`, `overwrite-latest`, `clears-when-unavailable` | Absent unless provider supplies waveform samples; removed on unavailable/no-window frames | `PublicTelemetryPublisher.publishWaveform` | `read-latest` | Runner builds `WaveformEnvelope` from `ProviderWaveformWindow` only when supplied. Publisher atomic-writes current after status if envelope exists; otherwise removes stale current after writing unavailable status. |

## Publisher method responsibility map

| Method / symbol | Lanes touched | Write class | Current source behavior | Boundary note |
| --- | --- | --- | --- | --- |
| `new PublicTelemetryPublisher(outDir)` | `events.jsonl`, `timeline.jsonl` | reset-on-construction for append lanes | Creates `outDir`; records lane subdirectories; removes `events.jsonl` and `timeline.jsonl` with `force: true`; initializes empty in-memory `history`. | Does not remove latest-state lanes or optional current lanes on construction. Those are overwritten/cleared during publish methods. |
| `publish(frame)` | `current.json`, `timeline.json`, `timeline.jsonl`, `status.json` | latest overwrite + whole-file rewrite + append | Pushes frame to `history`; atomic-writes `current.json`; atomic-writes whole `timeline.json`; appends one JSONL frame; atomic-writes `status.json`. | Per-file atomicity only. If a write fails mid-method, earlier lanes may already be updated. |
| `appendEvent(event)` | `events.jsonl` | append JSONL | Appends one compact JSON event line. Runner, not publisher, owns event construction and `eventIndex`. | Append lane is public event evidence, but provider/runtime internals remain hidden. |
| `publishEncounter(context?)` | `encounter/current.json` | latest overwrite or stale clear | With context: creates `encounter/` and atomic-writes current. Without context: removes stale current if present. | No status lane. Absence means no public encounter context; consumers must not infer hidden state. |
| `publishAssessment(status, envelope?, clearCurrent)` | `assessments/status.json`, `assessments/current.json` | status overwrite; current overwrite or conditional stale clear | Creates `assessments/`; atomic-writes status. With envelope: atomic-writes current. Without envelope and `clearCurrent`: removes stale current. | Current is reveal-only. Status is always written by provider-runtime frames. |
| `publishWaveform(status, envelope?)` | `waveforms/status.json`, `waveforms/current.json` | status overwrite; current overwrite or stale clear | Creates `waveforms/`; atomic-writes status. With envelope: atomic-writes current. Without envelope: removes stale current if present. | Status is the availability source of truth; consumers must not treat stale current as live. |
| `atomicWrite(path, content)` | All latest/compat JSON lanes | temp write + rename | Creates parent directory, writes `${path}.tmp`, then renames temp path to target. | Atomic per path, not a cross-lane transaction and no explicit fsync. |

## Append vs overwrite behavior

Append lanes:

- `events.jsonl`: reset on construction, then one event JSON line per `appendEvent` call. Record schema version is 2. Runner event index starts at `0` per run.
- `timeline.jsonl`: reset on construction, then one frame JSON line per `publish(frame)` call. Record schema version is 1.

Overwrite/latest lanes:

- `current.json`: latest scalar frame, atomic overwrite per published frame.
- `status.json`: latest run status, atomic overwrite per published frame.
- `encounter/current.json`: latest public encounter context, atomic overwrite when context exists; remove when unavailable.
- `assessments/status.json`: latest assessment capability/request/reveal status, atomic overwrite every provider-runtime frame.
- `assessments/current.json`: latest revealed assessment envelope, atomic overwrite after reveal; conditional remove.
- `waveforms/status.json`: latest waveform availability, atomic overwrite every provider-runtime frame.
- `waveforms/current.json`: latest waveform envelope, atomic overwrite when available; remove when unavailable/no window.

Whole-file compatibility lane:

- `timeline.json`: not append-only. It is rewritten as the entire in-memory frame history on each `publish(frame)` call. Consumers needing durable offsets should prefer `timeline.jsonl` per README `Schema — timeline.jsonl`.

## Reset-on-construction behavior

`PublicTelemetryPublisher` construction performs only these reset writes:

1. Ensure the output directory exists.
2. Remove `events.jsonl` if present.
3. Remove `timeline.jsonl` if present.
4. Start an empty in-memory `history` for future `timeline.json` rewrites.

It does not immediately remove or rewrite:

- `current.json`
- `timeline.json`
- `status.json`
- `encounter/current.json`
- `assessments/status.json`
- `assessments/current.json`
- `waveforms/status.json`
- `waveforms/current.json`

Those lanes are updated by subsequent publish methods. In normal provider-runtime starts, the first frame or fallback unavailable frame overwrites/clears them quickly. If a process constructs a publisher and exits before publishing, stale latest-state lanes can remain while JSONL lanes have been reset. This is a current failure-window characteristic to consider for Issue 02/04 regression-lock language; it is not changed here.

## Stale optional-current clearing

| Optional current lane | Clear trigger in source | Status companion | Current behavior |
| --- | --- | --- | --- |
| `encounter/current.json` | `publishEncounter(undefined)` when provider supplies no public encounter context | None | Removes stale current if present. No status file is written. |
| `assessments/current.json` | `publishAssessment(..., clearCurrent = true)` | `assessments/status.json` | Removes stale current before any request (`lastAssessmentRequestId === null`), when provider has no assessment capability, or when pending request has unavailable/no reveal. Does not clear after a successful reveal unless later unavailable/no-request run asks to clear. |
| `waveforms/current.json` | `publishWaveform(status)` without envelope | `waveforms/status.json` | Writes unavailable status first, then removes stale current if present. Used when provider has no waveform capability/window or when fallback unavailable reason is `provider_unavailable`. |

Consumer rule: optional current files are not self-authorizing. Consumers must check public status metadata where present, and must not use stale files or hidden provider state to infer current availability.

## Cross-lane write ordering

### Provider-runtime frame publish order

Within `runProviderRuntime` local `publish(...)`, current source order is:

1. Construct `VitalFrame` via `buildVitalFrame` and derive public frame metadata.
2. Drain pending queued events such as `run_started` and `action_applied` to `events.jsonl`.
3. Build and publish/clear `encounter/current.json`.
4. Append `encounter_started` or `encounter_phase_changed` event if applicable.
5. Append assessment request/reveal/unavailable events for pending assessment work.
6. Publish `assessments/status.json` and write/clear `assessments/current.json`.
7. Publish scalar frame lanes via `PublicTelemetryPublisher.publish`: `current.json`, `timeline.json`, `timeline.jsonl`, then `status.json`.
8. Publish waveform lanes via `publishWaveformLane`: `waveforms/status.json`, then `waveforms/current.json` write or clear.
9. Append `alarm_observed` events for alarms in the frame.
10. Add frame to the returned in-memory `frames` array and invoke `onFrame` if supplied.

### Terminal normal completion order

Normal completion does a final `clock.markEnded()`, publishes the ended frame through the same frame publish order, then appends terminal `run_ended` to `events.jsonl` with `payload.terminal: true` and `payload.terminalReason: "normal_end"`.

Implications:

- The terminal `run_ended` event is appended after the final ended frame and status lanes.
- `run_ended` does not cause another scalar frame write.

### Provider-unavailable order

On caught provider/runtime errors, `runProviderRuntime`:

1. Converts the error with `toUnavailable` unless it is already `ProviderUnavailableError`.
2. Builds a fallback snapshot using the latest known snapshot or the clock snapshot, adding `PROVIDER_UNAVAILABLE` to public frame events.
3. Publishes an unavailable frame through the same frame publish path, passing waveform unavailable reason `provider_unavailable`.
4. Appends terminal `provider_unavailable` to `events.jsonl` with `payload.terminal: true` and `payload.terminalReason: "provider_unavailable"`.
5. Throws the unavailable error to the caller.

Implications:

- Provider failure has a public fallback frame/status and terminal event when fallback publication succeeds.
- Provider failure does not append `run_ended`.
- If provider initialization fails before `run_started` is queued, `events.jsonl` can contain only the terminal `provider_unavailable` event. The `provider-unavailable` fixture demonstrates this shape.
- `provider_unavailable` is appended after fallback scalar and waveform lanes, so consumers tailing `events.jsonl` may see terminal evidence after latest-state files are already unavailable.

### Ordering hazards to preserve or test before refactor

- Event writes are interleaved with lane writes. Some same-frame events precede `current.json`; alarm and terminal events follow frame publication.
- `current.json` is written before `status.json`; `waveforms/status.json` is written after scalar `status.json`.
- `assessments/status.json` is written before scalar frame lanes.
- There is no multi-file transaction. Per-file atomic rename does not protect readers from cross-lane skew.
- Issue 02 should regression-lock the public ordering semantics that consumers depend on, and explicitly avoid locking accidental intra-method implementation order unless it is accepted as contract.

## Failure and provider-unavailable behavior

Current provider-runtime failure behavior is public and deliberate, but has privacy follow-ups.

Current Pulse/provider-unavailable fixture shape when fallback publication succeeds:

- `current.json`: unavailable frame with public `PROVIDER_UNAVAILABLE` monitor event.
- `timeline.json`: whole-file compatibility history including fallback frame.
- `timeline.jsonl`: appended fallback frame; JSONL lane was reset on publisher construction.
- `status.json`: `runState: "unavailable"`.
- `events.jsonl`: terminal `provider_unavailable`, schema version 2, monotonic event index, no `run_ended`.
- `assessments/status.json`: unavailable because the current Pulse provider path lacks assessment support; `assessments/current.json` is cleared/absent in that fixture shape.
- `waveforms/status.json`: unavailable with reason `provider_unavailable` because the current Pulse provider path supplies no waveform envelope; `waveforms/current.json` is cleared/absent in that fixture shape.
- `encounter/current.json`: cleared/absent because the current Pulse provider-unavailable fixture supplies no public encounter context.

General fallback source behavior is more conditional than the fixture shape:

- Fallback uses the same `publish("unavailable", ...)` path as ordinary frames rather than a dedicated force-clear-all-optional-lanes path.
- `encounter/current.json` is written if `provider.encounterContext?.()` returns public context during fallback; it is cleared only when no context is supplied.
- `assessments/current.json` clears only when `publishAssessment` receives `clearCurrent = true` (`!assessmentAvailable`, `clearAssessmentCurrent`, or `lastAssessmentRequestId === null`). A capability-present provider with a prior reveal can preserve the latest public assessment current during fallback unless policy changes.
- `waveforms/current.json` clears only when `publishWaveform` is called without an envelope. A capability-present provider that returns a waveform window during fallback can write an unavailable-runState waveform envelope/status instead of clearing current.

Issue 02 must decide whether provider-unavailable fallback should force-clear optional current lanes as a policy, or preserve capability-present public outputs produced through the normal fallback publish path.

Evidence:

- README `Public contract fixtures` and `Schema — events.jsonl` terminal semantics.
- `runProviderRuntime` catch path and `toUnavailable`.
- Runtime test `testPulseRunnerUnavailable`.
- Public contract reader `assertProviderUnavailableContract`.
- Fixture `pi-sim/vitals/fixtures/public-contract/provider-unavailable/events.jsonl`.

Provider-unavailable message privacy concern:

- `runProviderRuntime` currently writes `payload.message: unavailable.message` in the public `provider_unavailable` event.
- `PulseProvider.callShim` wraps transport errors as `Pulse shim <operation> failed: <message>`.
- `client.ts` `req` can include HTTP response text in thrown messages for non-2xx shim responses.
- The current fixture shows a benign public value (`Pulse shim init failed: fetch failed`), but the path can expose provider/shim detail if an upstream error includes hidden paths, transport responses, Docker/Pulse details, scenario paths, or validation evidence.

Recommendation: treat this as an Issue 02 regression-lock decision before source refactor. Decide whether public unavailable events should keep a sanitized message, replace it with a generic public message, or omit `payload.message` and rely on `terminalReason` plus private logs.

## Legacy `scripts/monitor.ts` scope

README `vitals/` names `scripts/monitor.ts` as a legacy interactive Pulse compatibility surface. Current source behavior:

- It does not use `PublicTelemetryPublisher`.
- It writes only `vitals/current.json` and `vitals/timeline.json`.
- It atomic-writes those two lanes with a local `atomicWrite` helper.
- It initializes `timeline.json` to `[]` on startup and rewrites the whole history array.
- It does not write or reset `timeline.jsonl`, `events.jsonl`, `status.json`, `encounter/current.json`, `assessments/*`, or `waveforms/*`.
- It does not implement provider-runtime fallback publication on errors; the catch path logs to stderr and exits non-zero.
- It does not publish a terminal `ended` frame/status on Ctrl-C; cleanup renders terminal UI output and exits.

Scope finding:

- The future publication Module should be scoped first to the shared provider runtime (`scripts/sim-run.ts`, `scripts/sim-run-pulse.ts`, and `scripts/sim-run-live-demo.ts` callers using `runProviderRuntime` + `PublicTelemetryPublisher`).
- `scripts/monitor.ts` should be treated as compatibility evidence, not as a second implementation of the full `.lanes.json` contract.
- If maintainers want the Module to subsume or deprecate `scripts/monitor.ts`, that should be an explicit later design decision; it should not be silently inferred during Issue 03.

Follow-up: README currently says current publishers include both provider runtime and legacy monitor, while `.lanes.json` producer is `pi-sim provider runtime` and most lanes are not produced by the legacy monitor. Issue 06 should clarify this wording after the Module scope is accepted.

## README / manifest / source mismatch and follow-up findings

No blocking lane-schema mismatch was found for the provider-runtime lanes listed in `.lanes.json`. The current provider-runtime source and manifest agree at the planning level on lane names, paths, append vs overwrite behavior, JSONL reset-on-construction, optional current clearing, terminal unavailable semantics, and waveform availability status.

Follow-ups recorded for later issues:

1. **Provider-unavailable message privacy should move into Issue 02.** Public `provider_unavailable` events currently include `payload.message` derived from provider/shim errors. This needs an explicit contract and regression test before source refactor.
2. **Provider-unavailable optional-current policy should move into Issue 02.** Current Pulse unavailable fixtures show optional current lanes cleared/absent, but source behavior is conditional for capability-present providers. Issue 02 must decide whether unavailable fallback should force-clear optional current lanes or preserve capability-present public outputs.
3. **Cross-lane ordering needs regression policy.** Source order is now mapped, but Issue 02 should decide which ordering properties are contractually important versus incidental implementation details.
4. **Constructor-only reset window should be considered.** `events.jsonl` and `timeline.jsonl` reset immediately on construction, while latest-state lanes wait for first publish or clear. If a process dies after construction but before publish, readers can observe reset JSONL lanes alongside stale latest-state lanes.
5. **Legacy monitor scope needs documentation closeout.** `scripts/monitor.ts` only writes `current.json` and `timeline.json`; Issue 06 should clarify that full lane semantics belong to provider-runtime publication unless maintainers explicitly bring legacy monitor into scope.
6. **`timeline.json` stale window before first publish is inherent today.** Constructor creates a fresh in-memory history but does not rewrite `timeline.json` to `[]`; first `publish` rewrites it. This is aligned with manifest wording but worth regression-policy review.
7. **Waveform capability errors are not separately mapped as public unavailable.** `publishWaveformLane` calls `provider.waveformWindow?.()` after scalar publication. If that optional capability throws, fallback publication is attempted, but a provider that keeps throwing from `waveformWindow` during fallback could prevent terminal event publication. Issue 02/05 can decide whether to test this edge.
8. **Status `simTime_s` source is `frame.t`.** `PublisherStatus` uses `frame.t` for `simTime_s`. Current frame construction sets `t` and `simTime_s` together, so no mismatch exists today. If future frame sources diverge these fields, Issue 02 should catch it.
9. **Fixture evidence remains non-authoritative.** Public fixtures confirm current behavior, but README plus `.lanes.json` remain authority. Issue 06 should keep fixture docs aligned without making fixtures the ABI.

## Regression-lock implications

Issue 02 should likely cover these before Issue 03 designs a Module seam:

- Manifest lane coverage for all ten lanes.
- `PublicTelemetryPublisher` constructor resets only `events.jsonl` and `timeline.jsonl`.
- `publish(frame)` write shape: current overwrite, timeline array rewrite, timeline JSONL append, status overwrite.
- Optional current stale clearing for encounter, assessments, and waveforms.
- Provider-unavailable fallback lane set and absence of `run_ended`.
- Provider-unavailable optional-current policy: force-clear all optional current lanes vs preserve capability-present public outputs.
- Provider-unavailable message privacy decision.
- Event index monotonicity and terminal-event ordering.
- Cross-lane ordering properties selected as contract.
- Legacy `scripts/monitor.ts` exclusion or compatibility-only status.

## Next gate recommendation

Proceed next with Issue 02:

`.scratch/pi-sim-public-telemetry-publication-module/issues/02-lock-publication-regression-tests.md`

Rationale: this map found enough ordering, stale-clearing, constructor-reset, legacy-monitor-scope, and provider-unavailable message-privacy details that regression-lock should happen before Issue 03 proposes a Module Interface. No source fix is made in this planning slice.
