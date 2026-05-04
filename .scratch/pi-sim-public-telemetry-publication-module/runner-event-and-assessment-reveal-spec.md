# Runner event and assessment reveal subordinate specification — Issue 05

Status: completed planning specification
Date: 2026-05-04
Parent issue: `.scratch/pi-sim-public-telemetry-publication-module/issues/05-runner-event-and-assessment-reveal-subordinate-work.md`
Input evidence:

- `.scratch/pi-sim-public-telemetry-publication-module/PRD.md`
- `.scratch/pi-sim-public-telemetry-publication-module/publication-responsibility-inventory.md`
- `.scratch/pi-sim-public-telemetry-publication-module/lane-construction-and-write-semantics-map.md`
- `.scratch/pi-sim-public-telemetry-publication-module/publication-regression-lock.md`
- `.scratch/pi-sim-public-telemetry-publication-module/internal-publication-module-interface-design.md`
- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`
- `pi-sim/scripts/runtime/provider.ts`
- `pi-sim/scripts/runtime/runner.ts`
- `pi-sim/scripts/runtime/publisher.ts`
- `pi-sim/scripts/runtime/test.ts`
- `pi-sim/scripts/public-contract-reader-test.ts`

## Executive decision

Runner event and assessment reveal behavior should remain **runner-owned subordinate work** inside the public telemetry publication lane.

Do not create a separate top-level PRD for this behavior, and do not extract a broad event/reveal Module yet. The behavior is tightly coupled to provider lifecycle, scheduled action application, canonical simulation clock progression, frame `sequence`, and the runner-local per-run `eventIndex` counter.

The safe future extraction posture is:

- keep event queueing, provider assessment calls, reveal/replay state, terminal decisions, `SimClock`, frame `sequence`, and `eventIndex` in `runProviderRuntime`;
- optionally extract only pure public serializers later, such as event payload builders or assessment envelope/status builders, if tests show that reduces risk;
- pass only public-safe event drafts or public-safe assessment outcomes across any helper seam;
- never pass scenario truth, scoring keys, provider internals, future findings, validation-only evidence, or a whole `PhysiologyProvider` into a publication helper.

## Authority and scope

Public event and reveal authority remains:

- `pi-sim/vitals/README.md` for human-readable public schemas and terminal/reveal semantics;
- `pi-sim/vitals/.lanes.json` for lane metadata and reset/write semantics.

Regression evidence remains:

- `pi-sim/scripts/runtime/test.ts` for source-fresh runtime behavior;
- `pi-sim/scripts/public-contract-reader-test.ts` for consumer-style fixture behavior;
- `pi-sim/vitals/fixtures/public-contract/**` for non-authoritative public examples.

This specification does not change public ABI, source code, event kinds, lane paths, schemas, write/reset behavior, chart/EHR truth policy, or sibling consumer contracts.

## Public event envelope invariants

Every public event record uses `schemaVersion: 2` and must preserve these fields:

| Field | Owner | Invariant |
| --- | --- | --- |
| `eventIndex` | `runProviderRuntime` | Per-run monotonic integer starting at `0`; assigned only when appending to `events.jsonl`. |
| `sequence` | `runProviderRuntime` / `SimClock` publication boundary | Frame-correlation key for the public frame boundary associated with the event. |
| `simTime_s` | provider snapshot selected by the runner | Public simulator time for the event snapshot; sibling consumers may preserve/display it but must not rewrite it. |
| `wallTime` | runner publication tick | Public wall-clock timestamp used at the publication boundary. |
| `source` | provider metadata / public frame metadata | Public source label, not provider internals. |
| `runState` | runner publication state | One of the public run states: `running`, `paused`, `ended`, or `unavailable`. |
| `kind` | `PublicTelemetryEventKind` | Must stay one of the documented event kinds below. |
| `payload` | public event-specific builder | Must be an allowlisted public object for that event kind. |

`PublicTelemetryPublisher` appends the finalized event record. It does not own event meaning, event ordering, `eventIndex`, or payload policy.

## Event kind specification

| Event kind | Trigger / timing | Public payload policy | Ownership boundary |
| --- | --- | --- | --- |
| `run_started` | Queued after successful `provider.init()` and appended during the first publish boundary. | `{ provider: <public provider metadata name> }`. | Runner owns the trigger. Payload must not include provider internals, scenario path, Pulse shim state, or hidden setup evidence. |
| `action_applied` | Queued after `provider.applyAction(action)` for each scheduled action and appended at the next publish boundary. | `{ action: publicActionFor(action) }`. Assessment actions are reduced to `type`, `requestId`, `assessmentType`, and optional `bodySystem`; non-assessment actions expose `type` only. | Runner owns scheduled action ordering. This is a generic audit record, not a reveal channel. |
| `encounter_started` | Appended when public encounter context first appears for an `encounterId`. | Public encounter payload: `patientId`, `encounterId`, `visibleChartAsOf`, optional public `phase`, and optional sanitized primitive `display`. | Encounter context remains chart-visible public context only. No hidden findings, scoring targets, expected chart IDs, or future truth. |
| `encounter_phase_changed` | Appended when a known encounter publishes a changed public phase key. | Same public encounter payload as `encounter_started`. | Runner tracks public encounter publication state; helper extraction must not own hidden encounter truth. |
| `assessment_requested` | Appended for each pending assessment publication before reveal/replay/unavailable event handling. | Request payload only: `requestId`, `assessmentType`, optional `bodySystem`. | Confirms a public request boundary. It must not include action scoring keys, hidden parameters, or provider result data. |
| `assessment_revealed` | Appended after provider assessment capability returns a public result, or for duplicate request replay. | New reveal: request fields, `visibility: "revealed"`, allowlisted public `findings`, optional `summary`/`evidence`, and `envelopeDigest`. Replay: request fields, `replay: true`, `replayOfSequence`, and `envelopeDigest`. | Reveal data comes from `provider.assess(request)` and allowlist serialization, not from the scheduled action snapshot. Replay must not call provider for a second hidden reveal. |
| `assessment_unavailable` | Appended when the provider has no assessment capability or returns no result for the request. | Request fields plus public `reason` such as `provider_does_not_supply_assessments` or `assessment_not_available`. | Clears stale public assessment current output and preserves absence as public evidence. |
| `alarm_observed` | Appended once per active alarm after a public frame is published. | `{ alarm: <public alarm string> }`. | Alarms are public frame-derived observations. They are not latent findings or chart truth. |
| `provider_unavailable` | Appended after provider-unavailable fallback publication succeeds. | `{ message: "provider unavailable", terminal: true, terminalReason: "provider_unavailable" }`. | Abnormal terminal event. Message stays generic; no provider/shim error details, paths, Pulse internals, or private validation evidence. |
| `run_ended` | Appended after the final ended frame on normal completion. | `{ frames: <published frame count>, terminal: true, terminalReason: "normal_end" }`. | Normal terminal event. Must not be emitted for provider-unavailable failure runs. |

## Event ordering and terminal semantics

The current ordering is part of the source behavior that future refactors should preserve unless a later issue explicitly changes tests and documentation:

1. `events.jsonl` is reset when `PublicTelemetryPublisher` is constructed.
2. `eventIndex` starts at `0` inside `runProviderRuntime` for each run.
3. Queued `run_started` and `action_applied` events are drained at publish boundaries before encounter, assessment, scalar frame, waveform, and alarm append work.
4. Encounter events are appended after `encounter/current.json` is written or cleared for that boundary.
5. Assessment request/reveal/unavailable events are appended before `assessments/status.json` and optional `assessments/current.json` are written.
6. Scalar frame lanes are then published through `PublicTelemetryPublisher.publish(frame)`.
7. Waveform status/current lanes are published after scalar frame lanes.
8. `alarm_observed` events are appended after the frame and waveform publication for that boundary.
9. Normal completion publishes an ended frame and then appends terminal `run_ended`.
10. Provider-unavailable failure publishes fallback public unavailable telemetry and then appends terminal `provider_unavailable`; it must not append `run_ended`.

This is not a multi-file transaction. Consumers should treat `eventIndex` as the total-order key within `events.jsonl`, `sequence` as the frame-correlation key, and public `simTime_s`/`wallTime` as producer-owned timestamps.

## Assessment reveal-only state machine

Assessment output is a public request/reveal state machine, not direct chart truth and not hidden simulator truth.

### Before any request

- `assessments/status.json` can report `available: true` when provider assessment capability exists.
- `assessments/current.json` remains absent.
- No reveal data is public.

### On scheduled assessment request action

1. Runner applies the scheduled action through `provider.applyAction(action)`.
2. Runner emits generic `action_applied` audit payload with an allowlisted public request shape for assessment actions.
3. Runner derives an `AssessmentRequest` from action params using only `requestId`, `assessmentType`, and optional `bodySystem`.
4. Runner calls `provider.assess(request)` only after the public request boundary exists.
5. Hidden action params such as scoring keys or validation markers are not copied into public payloads.

### New reveal

- If `provider.assess(request)` returns a result, runner serializes a public `PublicAssessmentEnvelope`.
- The envelope includes only allowlisted public fields: schema/version/request/type/body-system/visibility/sequence/time/source/run-state/findings/summary/evidence/digest.
- Findings include only `id`, `label`, `value`, optional `severity`, and optional public evidence refs.
- The envelope digest is computed over public JSON, not hidden provider data.
- `assessments/current.json` is written with the latest revealed envelope.
- `assessments/status.json` records public availability and latest request/reveal pointers.

### Duplicate request / replay

- Duplicate request IDs reuse the already published public reveal record.
- Replay appends `assessment_revealed` with `replay: true`, `replayOfSequence`, and `envelopeDigest`.
- Replay must not call `provider.assess` again and must not expose a second hidden reveal or hidden result body.
- Replay preserves public auditability while keeping the same public digest as the original reveal.

### Unavailable assessment

- If the provider has no `assess` capability, reason is `provider_does_not_supply_assessments`.
- If the provider returns no result, reason is `assessment_not_available`.
- The runner appends `assessment_requested`, then `assessment_unavailable` with the public reason.
- `assessments/current.json` is cleared if stale.
- `assessments/status.json` records public availability and reason.

### Provider-unavailable fallback

- Provider-unavailable fallback does not process pending hidden assessment work.
- It publishes `assessments/status.json` with `available: false`, `reason: "provider_unavailable"`, and `runState: "unavailable"`.
- It clears `assessments/current.json`.
- It appends terminal `provider_unavailable` with a generic message and no terminal `run_ended`.

## Hidden/public boundary rules

The following must never appear in public event payloads, assessment envelopes, status files, fixtures, or sibling consumer contracts:

- scenario secrets or hidden schedules;
- latent/future findings that have not passed a public request/reveal boundary;
- scoring keys, expected nurse/chart IDs, reference completed chart IDs, answer keys, or validation-only evidence;
- provider-private DTOs, provider internals, Pulse/Docker/shim details, private URLs, transport responses, stack traces, or local paths;
- hidden root/finding markers used by tests;
- `PhysiologyProvider` object identity or implementation-specific class names as consumer dependencies.

Assessment event and envelope builders must use structural allowlists. A provider can still supply public text values, so future source work should keep fixture denylist and boundary tests in place rather than trusting provider output blindly.

## Extraction decision for future implementation

Recommended implementation posture after Issue 05:

- **Keep in `runProviderRuntime`:** event queueing, `nextEventIndex`, provider assessment calls, reveal/replay maps, terminal event decisions, provider-unavailable fallback trigger, `SimClock`, frame `sequence`, action scheduling, provider lifecycle.
- **May extract later as pure helpers:** `publicActionFor`, `assessmentRequestPayload`, `assessmentRevealPayload`, `publicAssessmentStatusFor`, `publicAssessmentEnvelopeFor`, `publicEvidenceRefFor`, `encounterEventPayload`, and possibly a typed `PublicEventDraft` builder.
- **Must not extract into helper:** any code that calls provider lifecycle methods, owns `SimClock`, increments `eventIndex`, schedules actions, rewrites public time, or decides chart/EHR truth.

This means the next source implementation, if any, should start with pure serialization helpers only. A broader publication-cycle helper should wait until there is repeated source-edit evidence that the full `publish` body is too risky to maintain in place.

## Regression policy for future source work

Any future source edit in this area should preserve or expand tests for:

- all public event kinds listed in `PublicTelemetryEventKind`;
- per-run monotonic `eventIndex` starting at `0`;
- frame `sequence` correlation and producer-owned public `simTime_s`/`wallTime`/`source`/`runState` context;
- normal terminal `run_ended` and provider-unavailable terminal `provider_unavailable` with no `run_ended`;
- generic `action_applied` audit event that drops hidden params;
- assessment request/reveal/replay/unavailable event order;
- replay metadata without a second hidden reveal;
- stale `assessments/current.json` clearing on unavailable/no-request/provider-unavailable paths;
- denylist coverage for hidden keys in public fixtures.

Verification command for source edits remains:

```bash
npm test --prefix pi-sim
```

## Recommended next gate

Proceed to Issue 06:

`.scratch/pi-sim-public-telemetry-publication-module/issues/06-docs-manifest-fixture-closeout.md`

Rationale: Issues 01, 04, 02, 03, and 05 now establish the planning evidence, regression locks, seam posture, and event/reveal subordinate semantics. Issue 06 should close README/manifest/fixture wording so future agents see the accepted authority model and legacy-monitor scope without re-opening the extraction question.
