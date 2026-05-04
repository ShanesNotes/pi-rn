# Publication responsibility inventory

## Executive summary

This is a planning inventory for the current `pi-sim` public telemetry publication path. It does not promote a new Module seam, change public JSON/JSONL semantics, or edit runtime source.

The current responsibility split is:

- `pi-sim` hidden runtime owns provider orchestration, scenario/action progression, canonical simulation clock values, and event-order creation.
- Public telemetry construction currently lives mostly in `pi-sim/scripts/runtime/runner.ts`, with provider-facing public DTOs in `pi-sim/scripts/runtime/provider.ts` and scalar frame construction delegated to `buildVitalFrame`.
- Public file-lane publication currently lives in `PublicTelemetryPublisher` in `pi-sim/scripts/runtime/publisher.ts`.
- `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` remain the producer-side public telemetry Interface authority.
- Runtime tests and public-contract fixtures are regression evidence only; fixtures are not ABI authority.

No urgent regression gap was found that should move Issue 02 ahead of Issue 04. Issue 04 should map lane construction/write semantics next, while Issue 02 should later absorb the non-blocking coverage follow-ups noted below.

## Authority statement

`pi-sim/vitals/README.md` and `pi-sim/vitals/.lanes.json` are the public telemetry Interface authority for sibling consumers. This follows `pi-sim/CONTEXT.md` (`Public contract authority`) and `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md` (`Decision`).

Public contract fixtures under `pi-sim/vitals/fixtures/public-contract/**` are regression examples. They are not a second ABI authority and must not be used to overrule the README or lane manifest.

Canonical simulation clock values belong to `pi-sim`. Sibling consumers may preserve and display public `simTime_s`, `t`, `wallTime`, and public envelope timestamps, but must not rewrite simulation time or become clock authorities.

This inventory may cite internal `pi-sim` source as maintainer evidence. Those source paths and provider/runtime details are not public consumer dependencies.

## Responsibility inventory table

Bucket values are intentionally singular; each responsibility below is classified into exactly one bucket.

| # | Responsibility name | Bucket | Current owner/surface | Evidence citation | Hidden/public boundary note | Future issue impact (04/02/03/05/06) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Provider capability seam and hidden input boundary | Hidden runtime implementation | `pi-sim/scripts/runtime/provider.ts` internal producer-facing interfaces | `PhysiologyProvider`, `ProviderSnapshot`, `ProviderAction`, optional `waveformWindow`, `encounterContext`, `assess`, `ProviderUnavailableError` | This is not sibling-consumer ABI. Providers may know hidden state, but only allowed public snapshots/capabilities may flow into telemetry construction. | 04: N; 02: Y; 03: Y; 05: Y; 06: N |
| 2 | Canonical simulation clock and scheduled runtime progression | Hidden runtime implementation | `pi-sim/scripts/runtime/runner.ts` with `SimClock` | `runProviderRuntime`, `ScheduledProviderAction`, `validateRunOptions`, `SimClock.advance`, `SimClock.markEnded`; ADR 004 `Decision` | `pi-sim` owns clock progression and run sequencing. Consumers may preserve/display public times but must not rewrite them. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 3 | Scalar latest-frame and monitor-extension construction | Public telemetry construction | `runner.ts` delegates to scalar frame builder | `runProviderRuntime` local `publish`; `buildVitalFrame`; `computeAlarms`; README `Schema — current.json` and `monitor extension` | Public scalar frames are exposed telemetry. The `monitor` extension is display-only and not chart/EHR truth. | 04: Y; 02: Y; 03: Y; 05: N; 06: Y |
| 4 | Public event vocabulary, event envelope construction, and event index ownership | Public telemetry construction | `provider.ts` DTOs plus `runner.ts` event construction | `PublicTelemetryEventKind`, `PublicTelemetryEvent`, `runProviderRuntime` local `appendEvent`, `eventFor`, `nextEventIndex`; README `Schema — events.jsonl` | Public `eventIndex` is run-local ordering evidence. Event payloads must remain public allowlists, not hidden schedules or scoring data. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 5 | Encounter context construction | Public telemetry construction | `runner.ts` transforms provider encounter context into public envelope | `ProviderEncounterContext`, `PublicEncounterContext`, `publicEncounterContextFor`, `sanitizeDisplayContext`; README `Schema — encounter/current.json` | Encounter output may expose chart-visible identity/phase/display anchors only; no latent findings, expected chart ids, scoring targets, or future truth. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 6 | Assessment request, reveal, replay, unavailable status, and digest construction | Public telemetry construction | `runner.ts` assessment queue and public envelope functions | `AssessmentRequest`, `ProviderAssessmentResult`, `PublicAssessmentStatus`, `PublicAssessmentEnvelope`, `queueAssessment`, `assessmentRequestFromAction`, `publicAssessmentEnvelopeFor`, `assessmentRevealPayload`, `digestPublicJson`; README `Schema — assessments/status.json and assessments/current.json` | Assessment output is reveal-only after public request. Structural allowlists drop hidden root/finding keys; provider-supplied public text still must be treated as boundary-sensitive. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 7 | Waveform availability and waveform window construction | Public telemetry construction | `runner.ts` waveform lane construction from optional provider capability | `ProviderWaveformWindow`, `WaveformStatus`, `WaveformEnvelope`, `publishWaveformLane`, `waveformEnvelope`; README `Schema — waveforms/status.json and waveforms/current.json` | Availability is explicit public status. Waveform source/fidelity/synthetic labels must prevent consumers from inferring hidden provider state or treating demo/fixture data as clinical truth. | 04: Y; 02: Y; 03: Y; 05: N; 06: Y |
| 8 | Provider-unavailable fallback public telemetry | Public telemetry construction | `runner.ts` catch path and unavailable conversion | `runProviderRuntime` `catch`, `toUnavailable`, fallback snapshot with `PROVIDER_UNAVAILABLE`, terminal `provider_unavailable`; README `Terminal semantics`; runtime test `testPulseRunnerUnavailable` | Failure exposes public unavailable state and terminal reason, not provider internals, stack traces, Pulse state, or hidden runtime paths. | 04: Y; 02: Y; 03: N; 05: Y; 06: Y |
| 9 | Latest-frame, status, and timeline file writes | Public file-lane publication | `PublicTelemetryPublisher.publish` | `publish`, `PublisherStatus`, `atomicWrite`, `timeline.jsonl` append; `.lanes.json` lanes `current`, `timeline-compat-array`, `timeline-append-jsonl`, `status` | Writer owns public files under the selected output directory. Consumers read lanes; they do not write or reinterpret producer reset semantics. | 04: Y; 02: Y; 03: Y; 05: N; 06: Y |
| 10 | Append-lane reset and event appends | Public file-lane publication | `PublicTelemetryPublisher` constructor and `appendEvent` | Constructor `rmSync` for `events.jsonl` and `timeline.jsonl`; `appendEvent`; `.lanes.json` lanes `events` and `timeline-append-jsonl`; README `events.jsonl` and `timeline.jsonl` sections | Append lanes are run-local after publisher construction. Event order is public evidence, but not a license for consumers to own simulator ordering. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 11 | Optional current-lane stale clearing | Public file-lane publication | `PublicTelemetryPublisher.publishEncounter`, `publishAssessment`, `publishWaveform` | `publishEncounter`, `publishAssessment`, `publishWaveform`; `.lanes.json` lanes `encounter-current`, `assessments-current`, `waveforms-current`; README optional lane schema sections | Absence/clearing is part of the public contract. Consumers must check status/current consistency instead of using stale files or hidden provider knowledge. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 12 | Atomic write primitive and output-directory scoping | Public file-lane publication | `pi-sim/scripts/runtime/publisher.ts` | `atomicWrite`, constructor directory setup with `mkdirSync`, path joins for lane files | Future Module work should preserve atomic latest-lane writes and stay scoped to the explicit output directory. | 04: Y; 02: Y; 03: Y; 05: N; 06: N |
| 13 | Human-readable public telemetry ABI | Public contract authority | `pi-sim/vitals/README.md` | README sections `Files`, `Public contract fixtures`, `Schema — current.json`, `Schema — events.jsonl`, `Schema — timeline.jsonl`, encounter/assessment/waveform schema sections, `Agent boundary` | This is producer-side public authority. It must not expose hidden provider internals, and `monitor` metadata remains display-only. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 14 | Machine-readable lane manifest authority | Public contract authority | `pi-sim/vitals/.lanes.json` | Top-level `producer` and `resetSemantics`; lane entries for `current`, `timeline-*`, `status`, `events`, `encounter-current`, `assessments-*`, `waveforms-*` | Manifest metadata is part of the public Interface authority and must stay aligned with README/source semantics. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 15 | Public contract fixture corpus | Regression evidence | `pi-sim/vitals/fixtures/public-contract/**` | README `Public contract fixtures`; `pi-sim/vitals/fixtures/public-contract/README.md` `Fixture cases` and `Refresh policy` | Fixtures are consumer examples and regression evidence only. They must not contain hidden scenario truth, scoring keys, future findings, provider internals, or sibling/runtime import paths. | 04: N; 02: Y; 03: N; 05: N; 06: Y |
| 16 | Runtime source-freshness regression checks | Regression evidence | `pi-sim/scripts/runtime/test.ts` | `testFrameAndPublisher`, `testSharedRunnerScripted`, `testSharedRunnerActionOrder`, `testM4AssessmentRevealReplayAndBoundary`, `testM4UnavailableAndStaleClearing`, `testLaneManifest`, waveform and provider-unavailable tests | Tests may instantiate internal providers, but their public-output assertions are evidence, not ABI authority. | 04: Y; 02: Y; 03: Y; 05: Y; 06: Y |
| 17 | Consumer-style public contract reader checks | Regression evidence | `pi-sim/scripts/public-contract-reader-test.ts` | `selfAuditImports`, `assertManifestCoverage`, `assertScriptedDemoContract`, `assertScriptedAlarmContract`, `assertProviderUnavailableContract`, `assertLiveDemoWaveformContract`, `assertFixtureDenylist` | Reader checks intentionally avoid runtime imports and sibling source. They validate fixtures as public files, not hidden implementation. | 04: N; 02: Y; 03: N; 05: N; 06: Y |

## Hidden/public boundary findings

- Provider-facing interfaces in `pi-sim/scripts/runtime/provider.ts` are internal producer seams, not sibling-consumer contracts.
- Public DTO/type names in source are useful maintainer evidence, but the public Interface authority remains README plus `.lanes.json`.
- `runner.ts` is currently the main public telemetry construction surface; it must not leak action params, assessment hidden keys, future findings, scenario secrets, scoring keys, validation evidence, or provider/Pulse internals.
- Assessment publication is reveal-only and request-bound. Duplicate request handling replays public digest evidence instead of performing a second hidden reveal.
- Encounter context is limited to chart-visible identity, phase, display, and clock anchors.
- Waveform lanes expose explicit availability and source/fidelity/synthetic labels. Consumers must not infer availability from hidden provider state.
- `PublicTelemetryPublisher` owns public file writes and stale-file clearing; consumers should never treat stale optional current files as current evidence without matching status metadata.
- The `monitor` extension in `current.json` is display-only and must not become chart/EHR truth.
- The public contract fixtures and tests are regression evidence only. They cannot override README/manifest authority.

## Simulation clock and event-order ownership

- Canonical simulation clock ownership is in `pi-sim`, as stated by ADR 004 and implemented by `SimClock` use inside `runProviderRuntime`.
- `SimClock.advance` increments `simTime_s` and `sequence` during runtime progression; `SimClock.markEnded` produces the terminal ended sequence.
- Public frames carry `t` and `simTime_s` from provider snapshots through `buildVitalFrame`; event records carry `simTime_s` from the event snapshot and a runner-owned per-run `eventIndex`.
- `sequence` is the frame-correlation key. `eventIndex` is the total-order key for same-frame and cross-frame public events within one run.
- Normal completion publishes an ended frame and appends terminal `run_ended`; provider failure publishes unavailable fallback telemetry and appends terminal `provider_unavailable` without `run_ended`.
- Cross-lane write order and failure semantics are important enough to map explicitly in Issue 04 before any Module seam is proposed.
- Sibling consumers may store, preserve, and display public timestamps, but must not rewrite `simTime_s`, synthesize alternate simulator time, or treat chart wall-clock mapping as simulator clock ownership.

## Forbidden dependency list

Future publication-module work and sibling consumers must not depend on or expose:

- provider internals or provider-private DTOs beyond documented public files;
- scenario secrets, hidden schedules, future truth, latent findings, or validation-only evidence;
- scoring keys, expected nurse/chart ids, reference completed chart ids, or answer keys;
- Pulse internals, Docker/shim state, private localhost streams, or hidden runtime paths;
- public-contract fixtures as ABI authority;
- the `monitor` extension as chart/EHR truth;
- stale optional current files without matching public status metadata;
- rewritten or consumer-owned simulation time.

## Mismatch/follow-up findings

No blocking public-lane schema/runtime mismatch was found in the required inventory surfaces. Lane names, schema-version posture, append/reset semantics, terminal-event semantics, reveal-only assessment posture, and waveform availability labeling are aligned at the planning level. Non-blocking authority-wording and privacy-regression follow-ups are recorded below rather than fixed in this inventory issue.

Follow-up findings for later issues:

1. **Legacy publisher scope needs explicit closeout.** `pi-sim/vitals/README.md` names `scripts/monitor.ts` as a legacy interactive Pulse compatibility publisher, but this Issue 01 inventory evidence set focuses on the shared provider runtime (`runner.ts`/`publisher.ts`). Issue 04 or Issue 06 should explicitly state whether the future publication Module covers that legacy publisher or only preserves it as compatibility evidence.
2. **Provider-unavailable public message privacy needs regression coverage.** `runProviderRuntime` currently appends public `provider_unavailable` events with `payload.message` sourced from the provider unavailable error, and Pulse/client failures may include shim or transport detail. Issue 02/05 should decide and lock whether public unavailable telemetry exposes a sanitized message, a generic message, or only `terminalReason: "provider_unavailable"` so provider internals, Pulse details, hidden paths, or transport responses cannot leak through public JSONL.
3. **README architecture-status authority wording is stale.** `pi-sim/vitals/README.md` still references older authority wording involving ADR 003 and an `.omx/plans/*` artifact. Issue 06 should reconcile that `Architecture status` wording with ADR 004 and the current README plus `.lanes.json` public Interface authority without changing the authority in this inventory issue.
4. **Fixture denylist coverage has a non-urgent gap.** `pi-sim/scripts/public-contract-reader-test.ts` `assertFixtureDenylist` scans `scripted-demo`, `scripted-alarm`, and `provider-unavailable`, but not `live-demo-waveform`. Issue 02 should consider scanning all fixture cases or documenting why synthetic waveform fixtures are separately covered.
5. **Assessment text remains semantic boundary material.** `publicAssessmentEnvelopeFor` structurally allowlists public fields and drops hidden extra keys, but provider-supplied public text values such as finding values and summaries can still encode inappropriate content if a provider violates the boundary. Issue 02/05 should keep this as regression evidence and reveal-flow review material.
6. **Cross-lane write ordering deserves a map before design.** Source behavior appends some events before frame writes and some after frame writes. The public contract requires monotonic event indexes and terminal semantics, but does not fully document cross-file flush order. Issue 04 should inventory write ordering and failure semantics before Issue 03 proposes a Module seam.
7. **Manifest producer strings are human-readable, not exact API boundaries.** `.lanes.json` names producers such as `PublicTelemetryPublisher.publish` and `Runtime runner event lane`. Issue 06 can tighten wording if the accepted design creates a clearer internal Module boundary.

## Next gate recommendation

Proceed next with Issue 04:

`.scratch/pi-sim-public-telemetry-publication-module/issues/04-lane-construction-and-write-semantics.md`

Rationale: the inventory found no urgent regression gap requiring Issue 02 first. The biggest remaining risk is understanding lane construction, cross-lane write order, reset behavior, stale clearing, and failure semantics before designing any internal Module Interface.
