import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SimClock } from "./clock.js";
import { buildVitalFrame } from "./frame.js";
import { PublicTelemetryPublisher } from "./publisher.js";
import { PulseProvider, type PulseTransport } from "./pulseProvider.js";
import { loadPulseScenario } from "./pulseScenario.js";
import { loadScriptedScenario } from "./scenario.js";
import {
  ProviderUnavailableError,
  isProviderUnavailableError,
  type AssessmentRequest,
  type PhysiologyProvider,
  type ProviderAction,
  type ProviderAssessmentResult,
  type ProviderEncounterContext,
  type ProviderMetadata,
  type ProviderSnapshot,
  type ProviderWaveformWindow,
  type PublicAssessmentEnvelope,
  type PublicAssessmentStatus,
  type PublicEncounterContext,
  type PublicTelemetryEvent,
  type WaveformEnvelope,
  type WaveformStatus,
} from "./provider.js";
import { runProviderRuntime } from "./runner.js";
import { ScriptedProvider, type ScriptedScenario } from "./scriptedProvider.js";
import { DemoWaveformProvider } from "./demoWaveformProvider.js";
import type { AlarmThresholds, MonitorExtension, TimelineEntry, VitalFrame } from "../types.js";
import type { RawVitals } from "../client.js";

const thresholds: AlarmThresholds = { map: { low: 65 }, spo2: { low: 90 } };

const scenario: ScriptedScenario = {
  name: "test_scripted",
  provider: "scripted",
  duration_s: 60,
  initial: { hr: 78, map: 82, bp_sys: 118, bp_dia: 70, rr: 16, spo2: 98, temp_c: 37 },
  waypoints: [
    { t: 30, phase: "deteriorating", vitals: { hr: 96, map: 64, bp_sys: 92, bp_dia: 52, rr: 24, spo2: 89, temp_c: 37.4 } },
    { t: 60, phase: "recovering", vitals: { hr: 88, map: 72, bp_sys: 106, bp_dia: 62, rr: 20, spo2: 94, temp_c: 37.2 } },
  ],
};

function testClock(): void {
  const clock = new SimClock();
  assert.deepEqual(clock.snapshot(), { simTime_s: 0, sequence: 0, runState: "running" });
  assert.deepEqual(clock.advance(2), { simTime_s: 2, sequence: 1, runState: "running" });
  assert.throws(() => clock.advance(0), /positive finite/);
  assert.deepEqual(clock.markEnded(), { simTime_s: 2, sequence: 2, runState: "ended" });
  assert.deepEqual(clock.advance(2), { simTime_s: 2, sequence: 2, runState: "ended" });
}

function testProviderDeterminism(): void {
  const run = (): unknown[] => {
    const provider = new ScriptedProvider(scenario);
    const snapshots = [provider.init(), provider.advance(15), provider.advance(15), provider.advance(30)];
    return snapshots.map((snapshot) => ({ t: snapshot.t, phase: snapshot.phase, vitals: snapshot.vitals, events: snapshot.events }));
  };
  assert.deepEqual(run(), run());
}

function frameFor(
  provider: ScriptedProvider,
  snapshot: ReturnType<ScriptedProvider["snapshot"]>,
  sequence: number,
  runState: MonitorExtension["runState"],
  wallTime: string,
): VitalFrame {
  return buildVitalFrame({ snapshot, metadata: provider.metadata, sequence, runState, thresholds, wallTime });
}

function testFrameAndPublisher(): void {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-runtime-"));
  try {
    const provider = new ScriptedProvider(scenario);
    const publisher = new PublicTelemetryPublisher(dir);
    const clock = new SimClock();
    const first = provider.init();
    publisher.publish(frameFor(provider, first, clock.snapshot().sequence, "running", "2026-04-27T00:00:00.000Z"));
    const clockEnd = clock.advance(60);
    const ended = frameFor(provider, provider.advance(60), clock.markEnded().sequence, "ended", "2026-04-27T00:01:00.000Z");
    assert.equal(clockEnd.simTime_s, 60);
    publisher.publish(ended);

    const current = JSON.parse(readFileSync(join(dir, "current.json"), "utf8")) as VitalFrame;
    assert.equal(current.monitor?.source, "pi-sim-scripted");
    assert.equal(current.monitor?.runState, "ended");
    assert.equal(current.monitor?.sequence, 2);
    assert.equal(Object.hasOwn(current.monitor ?? {}, "waveforms"), false);
    assert.deepEqual(current.alarms, []);

    const timeline = JSON.parse(readFileSync(join(dir, "timeline.json"), "utf8")) as VitalFrame[];
    assert.equal(timeline.length, 2);
    assert.equal(timeline[0].t, 0);
    assert.equal(timeline[1].t, 60);
    const timelineJsonl = readJsonLines<VitalFrame>(join(dir, "timeline.jsonl"));
    assert.equal(timelineJsonl.length, timeline.length);
    assert.deepEqual(
      timelineJsonl.map((frame) => ({ t: frame.t, wallTime: frame.wallTime, sequence: frame.monitor?.sequence })),
      timeline.map((frame) => ({ t: frame.t, wallTime: frame.wallTime, sequence: frame.monitor?.sequence })),
    );

    const status = JSON.parse(readFileSync(join(dir, "status.json"), "utf8")) as { runState: string; sequence: number; source: string };
    assert.deepEqual(status, { runState: "ended", sequence: 2, source: "pi-sim-scripted", schemaVersion: 1, simTime_s: 60, updatedAt: "2026-04-27T00:01:00.000Z" });

    const resetPublisher = new PublicTelemetryPublisher(dir);
    resetPublisher.publish(frameFor(provider, provider.snapshot(), 99, "running", "2026-04-27T00:02:00.000Z"));
    assert.equal(readJsonLines<VitalFrame>(join(dir, "timeline.jsonl")).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function testSharedRunnerScripted(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-runner-"));
  try {
    const provider = new ScriptedProvider({ ...scenario, duration_s: 20 });
    const result = await runProviderRuntime({
      provider,
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 20,
      dt_s: 10,
      now: deterministicNow(),
    });
    assert.equal(result.frames.length, 4);
    assert.deepEqual(result.frames.map((frame) => frame.monitor?.sequence), [0, 1, 2, 3]);
    assert.equal(result.finalFrame.monitor?.runState, "ended");
    assert.equal(result.finalFrame.monitor?.source, "pi-sim-scripted");
    assert.equal(Object.hasOwn(result.finalFrame.monitor ?? {}, "waveforms"), false);
    assert.ok(existsSync(join(dir, "current.json")));
    assert.ok(existsSync(join(dir, "timeline.json")));
    assert.ok(existsSync(join(dir, "timeline.jsonl")));
    assert.ok(existsSync(join(dir, "status.json")));
    assert.ok(existsSync(join(dir, "events.jsonl")));
    assert.ok(existsSync(join(dir, "waveforms", "status.json")));
    assert.equal(existsSync(join(dir, "waveforms", "current.json")), false);

    const waveformStatus = readJson<WaveformStatus>(join(dir, "waveforms", "status.json"));
    assert.deepEqual(
      { available: waveformStatus.available, reason: waveformStatus.reason, sequence: waveformStatus.sequence, runState: waveformStatus.runState },
      { available: false, reason: "provider_does_not_supply_waveforms", sequence: 3, runState: "ended" },
    );

    const events = readEvents(dir);
    assert.equal(events[0].kind, "run_started");
    assert.equal(events.at(-1)?.kind, "run_ended");
    assert.equal(events.at(-1)?.payload.terminal, true);
    assert.equal(events.at(-1)?.payload.terminalReason, "normal_end");
    assertEventIndexes(events);
    for (const event of events) assertPublicEventFields(event);
    assert.equal(readJsonLines<VitalFrame>(join(dir, "timeline.jsonl")).length, result.frames.length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function testSharedRunnerActionOrder(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-actions-"));
  try {
    const provider = new RecordingProvider();
    const actions: TimelineEntry[] = [
      { t: 10, action: { type: "later", params: { n: 2 } } },
      { t: 5, action: { type: "midtick", params: { n: 1.5 } } },
      { t: 30, action: { type: "final", params: { n: 3 } } },
      { t: 0, action: { type: "first", params: { n: 1 } } },
    ];
    await runProviderRuntime({
      provider,
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 30,
      dt_s: 10,
      actions,
      now: deterministicNow(),
    });
    assert.deepEqual(provider.calls, [
      "init",
      "action:first",
      "advance:5",
      "action:midtick",
      "advance:5",
      "action:later",
      "advance:10",
      "advance:10",
      "action:final",
    ]);
    const events = readEvents(dir);
    assertEventIndexes(events);
    const kinds = events.map((event) => event.kind);
    assert.deepEqual(kinds.filter((kind) => kind === "action_applied"), ["action_applied", "action_applied", "action_applied", "action_applied"]);
    assert.ok(kinds.includes("alarm_observed"));
    assert.deepEqual(
      events.filter((event) => event.kind === "action_applied").map((event) => event.payload.action),
      [...actions].sort((a, b) => a.t - b.t).map((entry) => ({ type: entry.action.type })),
    );
    assert.ok(kinds.indexOf("action_applied") < kinds.indexOf("alarm_observed"));
    const alarmPayloads = events.filter((event) => event.kind === "alarm_observed").map((event) => event.payload.alarm);
    assert.equal(alarmPayloads.length % 2, 0);
    for (let i = 0; i < alarmPayloads.length; i += 2) assert.deepEqual(alarmPayloads.slice(i, i + 2), ["MAP_LOW", "SPO2_LOW"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function testM4AssessmentRevealReplayAndBoundary(): Promise<void> {
  const dirNoRequest = mkdtempSync(join(tmpdir(), "pi-sim-m4-norequest-"));
  const dirReveal = mkdtempSync(join(tmpdir(), "pi-sim-m4-reveal-"));
  try {
    const providerNoRequest = new M4AssessmentProvider();
    await runProviderRuntime({
      provider: providerNoRequest,
      publisher: new PublicTelemetryPublisher(dirNoRequest),
      thresholds,
      duration_s: 0,
      dt_s: 10,
      now: deterministicNow(),
    });
    assert.ok(existsSync(join(dirNoRequest, "encounter", "current.json")));
    assert.equal(existsSync(join(dirNoRequest, "assessments", "current.json")), false);
    assertPublicTextOmits(dirNoRequest, [M4_REVEALED_FINDING, M4_FUTURE_FINDING, M4_ROOT_MARKER, M4_FINDING_MARKER]);
    const noRequestStatus = readJson<PublicAssessmentStatus>(join(dirNoRequest, "assessments", "status.json"));
    assert.equal(noRequestStatus.available, true);
    assert.equal(noRequestStatus.lastRequestId, null);

    const providerReveal = new M4AssessmentProvider();
    await runProviderRuntime({
      provider: providerReveal,
      publisher: new PublicTelemetryPublisher(dirReveal),
      thresholds,
      duration_s: 20,
      dt_s: 10,
      actions: [
        { t: 10, action: assessmentAction("assess_m4_001") },
        { t: 10, action: assessmentAction("assess_m4_001") },
      ],
      now: deterministicNow(),
    });
    assert.equal(providerReveal.assessCalls, 1);

    const encounter = readJson<PublicEncounterContext>(join(dirReveal, "encounter", "current.json"));
    assert.equal(encounter.patientId, "patient_test_m4");
    assert.equal(encounter.encounterId, "enc_test_m4");
    assert.equal(encounter.visibleChartAsOf, "2026-04-19T06:45:00-05:00");
    assert.equal(encounter.source, "pi-sim-m4-fixture");
    assert.equal(Object.hasOwn(encounter, "futureFinding"), false);

    const envelope = readJson<PublicAssessmentEnvelope>(join(dirReveal, "assessments", "current.json"));
    assert.equal(envelope.requestId, "assess_m4_001");
    assert.equal(envelope.assessmentType, "focused_respiratory");
    assert.equal(envelope.bodySystem, "respiratory");
    assert.equal(envelope.visibility, "revealed");
    assert.equal(envelope.findings[0].value, M4_REVEALED_FINDING);
    assert.equal(typeof envelope.envelopeDigest, "string");
    assert.ok(envelope.envelopeDigest.length > 20);

    const status = readJson<PublicAssessmentStatus>(join(dirReveal, "assessments", "status.json"));
    assert.equal(status.available, true);
    assert.equal(status.lastRequestId, "assess_m4_001");
    assert.equal(status.lastRevealSequence, envelope.sequence);

    const outputText = publicOutputText(dirReveal);
    assert.match(outputText, new RegExp(M4_REVEALED_FINDING));
    assert.doesNotMatch(outputText, new RegExp(`${M4_FUTURE_FINDING}|${M4_ROOT_MARKER}|${M4_FINDING_MARKER}`));

    const events = readEvents(dirReveal);
    assertEventIndexes(events);
    const kinds = events.map((event) => event.kind);
    assert.equal(kinds.filter((kind) => kind === "encounter_started").length, 1);
    assert.equal(kinds.filter((kind) => kind === "encounter_phase_changed").length, 1);
    assert.equal(kinds.filter((kind) => kind === "assessment_revealed").length, 2);
    assert.equal(kinds.includes("assessment_replayed" as never), false);
    const actionIndex = kinds.indexOf("action_applied");
    const requestIndex = kinds.indexOf("assessment_requested");
    const revealIndex = kinds.indexOf("assessment_revealed");
    assert.ok(actionIndex >= 0 && actionIndex < requestIndex && requestIndex < revealIndex);
    const appliedAssessmentAction = events.find((event) => event.kind === "action_applied" && event.payload.action && typeof event.payload.action === "object");
    assert.deepEqual(appliedAssessmentAction?.payload.action, {
      type: "assessment_request",
      params: { requestId: "assess_m4_001", assessmentType: "focused_respiratory", bodySystem: "respiratory" },
    });
    const replay = events.find((event) => event.kind === "assessment_revealed" && event.payload.replay === true);
    assert.ok(replay);
    assert.equal(replay.payload.requestId, "assess_m4_001");
    assert.equal(replay.payload.replayOfSequence, envelope.sequence);
    assert.equal(replay.payload.envelopeDigest, envelope.envelopeDigest);
    const originalReveal = events.find((event) => event.kind === "assessment_revealed" && event.payload.replay !== true);
    assert.ok(originalReveal);
    assert.notEqual(replay.eventIndex, originalReveal.eventIndex);
    assert.ok(!events.some((event) => event.kind === "assessment_unavailable" && event.payload.requestId === "assess_m4_001"));

    const draft = chartEventDraftFromAssessment(envelope);
    assert.equal(draft.type, "assessment");
    assert.equal(draft.status, "final");
    assert.equal(draft.certainty, "observed");
    assert.equal(draft.source.kind, "monitor_extension");
    assert.notEqual(draft.status, "completed");
    assert.notEqual(draft.certainty, "high");

    const builderSources = ["scripts/runtime/provider.ts", "scripts/runtime/publisher.ts", "scripts/runtime/runner.ts"]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    assert.doesNotMatch(builderSources, /hidden_truth|live_expected|scoringKey|expectedNurseEventId|referenceCompletedChartId/);
  } finally {
    rmSync(dirNoRequest, { recursive: true, force: true });
    rmSync(dirReveal, { recursive: true, force: true });
  }
}

async function testM4UnavailableAndStaleClearing(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-m4-stale-"));
  try {
    await runProviderRuntime({
      provider: new M4AssessmentProvider(),
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 10,
      dt_s: 10,
      actions: [{ t: 10, action: assessmentAction("assess_m4_stale") }],
      now: deterministicNow(),
    });
    assert.ok(existsSync(join(dir, "encounter", "current.json")));
    assert.ok(existsSync(join(dir, "assessments", "current.json")));

    await runProviderRuntime({
      provider: new M4AssessmentProvider(),
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 10,
      dt_s: 10,
      now: deterministicNow(),
    });
    assert.equal(existsSync(join(dir, "assessments", "current.json")), false);

    await runProviderRuntime({
      provider: new RecordingProvider(),
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 10,
      dt_s: 10,
      actions: [{ t: 10, action: assessmentAction("assess_m4_unavailable") }],
      now: deterministicNow(),
    });
    const unavailableEvents = readEvents(dir);
    assertEventIndexes(unavailableEvents);
    assert.ok(unavailableEvents.some((event) => event.kind === "assessment_requested" && event.payload.requestId === "assess_m4_unavailable"));
    assert.ok(unavailableEvents.some((event) => event.kind === "assessment_unavailable" && event.payload.reason === "provider_does_not_supply_assessments"));
    assert.equal(existsSync(join(dir, "encounter", "current.json")), false);
    assert.equal(existsSync(join(dir, "encounter", "status.json")), false);
    assert.equal(existsSync(join(dir, "assessments", "current.json")), false);
    const status = readJson<PublicAssessmentStatus>(join(dir, "assessments", "status.json"));
    assert.equal(status.available, false);
    assert.equal(status.reason, "provider_does_not_supply_assessments");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const M4_REVEALED_FINDING = "moderate accessory muscle use";
const M4_FUTURE_FINDING = "future crackles must stay latent";
const M4_ROOT_MARKER = "score-key-marker";
const M4_FINDING_MARKER = "expected-rn-event-marker";

function assessmentAction(requestId: string): ProviderAction {
  return {
    type: "assessment_request",
    params: { requestId, assessmentType: "focused_respiratory", bodySystem: "respiratory", scoringKey: M4_ROOT_MARKER },
  };
}

function publicOutputText(dir: string): string {
  const paths = [
    "current.json",
    "timeline.json",
    "timeline.jsonl",
    "status.json",
    "events.jsonl",
    join("encounter", "current.json"),
    join("assessments", "status.json"),
    join("assessments", "current.json"),
  ];
  return paths
    .filter((relativePath) => existsSync(join(dir, relativePath)))
    .map((relativePath) => readFileSync(join(dir, relativePath), "utf8"))
    .join("\n");
}

function assertPublicTextOmits(dir: string, markers: readonly string[]): void {
  const text = publicOutputText(dir);
  for (const marker of markers) assert.doesNotMatch(text, new RegExp(marker));
}

function chartEventDraftFromAssessment(envelope: PublicAssessmentEnvelope): {
  type: "assessment";
  status: "final";
  certainty: "observed";
  source: { kind: "monitor_extension" };
  supports: { ref: string }[];
} {
  return {
    type: "assessment",
    status: "final",
    certainty: "observed",
    source: { kind: "monitor_extension" },
    supports: envelope.findings.flatMap((finding) => finding.evidence ?? []).map((evidence) => ({ ref: evidence.ref })),
  };
}

class M4AssessmentProvider implements PhysiologyProvider {
  readonly metadata: ProviderMetadata = { name: "m4 assessment fixture", source: "pi-sim-m4-fixture", fidelity: "fixture" };
  assessCalls = 0;
  private t = 0;
  private actionEvents: string[] = [];

  init(): ProviderSnapshot {
    this.t = 0;
    this.actionEvents = [];
    return this.snapshot();
  }

  advance(dtSeconds: number): ProviderSnapshot {
    this.t += dtSeconds;
    return this.snapshot();
  }

  applyAction(action: ProviderAction): ProviderSnapshot {
    this.actionEvents = [...this.actionEvents, `ACTION_${action.type.toUpperCase()}`];
    return this.snapshot();
  }

  snapshot(): ProviderSnapshot {
    return {
      t: this.t,
      phase: this.t >= 10 ? "focused_assessment" : "arrival",
      vitals: { hr: 92, map: 74, rr: 24, spo2: 92 },
      events: [...this.actionEvents],
    };
  }

  encounterContext(): ProviderEncounterContext {
    return {
      patientId: "patient_test_m4",
      encounterId: "enc_test_m4",
      visibleChartAsOf: "2026-04-19T06:45:00-05:00",
      phase: this.snapshot().phase,
      display: { oxygenDevice: "nasal cannula" },
    };
  }

  assess(request: AssessmentRequest): ProviderAssessmentResult | undefined {
    this.assessCalls += 1;
    const result = {
      requestId: request.requestId,
      assessmentType: request.assessmentType,
      bodySystem: request.bodySystem,
      findings: [
        {
          id: "finding_work_of_breathing",
          label: "work of breathing",
          value: M4_REVEALED_FINDING,
          severity: "moderate",
          evidence: [{ kind: "event", ref: `events.jsonl#requestId=${request.requestId}`, role: "primary" }],
          expectedNurseEventId: M4_FINDING_MARKER,
          futureFinding: M4_FUTURE_FINDING,
        },
      ],
      summary: "Increased work of breathing with moderate accessory muscle use.",
      evidence: [{ kind: "vitals_window", ref: "vitals://enc_test_m4?name=spo2", role: "context" }],
      scoringKey: M4_ROOT_MARKER,
      referenceCompletedChartId: "reference-chart-marker",
    };
    return result as ProviderAssessmentResult;
  }
}

async function testPulseProviderFakeTransport(): Promise<void> {
  const transport = new FakePulseTransport([
    { t: 0, hr: 70, map: 82, bp_sys: 120, bp_dia: 72, rr: 14, spo2: 99, temp_c: 37, ignored: 1 },
    { t: 10, hr: 72, map: 80, bp_sys: 118, bp_dia: 70, rr: 15, spo2: 98, temp_c: 37.1 },
  ]);
  const provider = new PulseProvider({ stateFile: "./states/StandardMale@0s.pbb", transport });
  const initial = await provider.init();
  assert.equal(provider.metadata.source, "pi-sim-pulse");
  assert.equal(provider.metadata.fidelity, "physiology-provider");
  assert.deepEqual(initial.vitals, { hr: 70, map: 82, bp_sys: 120, bp_dia: 72, rr: 14, spo2: 99, temp_c: 37 });
  assert.equal(provider.waveformWindow(), undefined);
  await provider.applyAction({ type: "position_change", params: { position: "sitting" } });
  const advanced = await provider.advance(10);
  assert.equal(advanced.t, 10);
  assert.deepEqual(transport.actions, [{ type: "position_change", params: { position: "sitting" } }]);
  assert.deepEqual(advanced.events, ["ACTION_POSITION_CHANGE"]);
}

async function testPulseRunnerUnavailable(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-unavailable-"));
  try {
    const provider = new PulseProvider({ stateFile: "missing", transport: new UnavailablePulseTransport() });
    await assert.rejects(
      runProviderRuntime({
        provider,
        publisher: new PublicTelemetryPublisher(dir),
        thresholds,
        duration_s: 10,
        dt_s: 10,
        now: deterministicNow(),
      }),
      (error: unknown) => isProviderUnavailableError(error),
    );
    const current = JSON.parse(readFileSync(join(dir, "current.json"), "utf8")) as VitalFrame;
    assert.equal(current.monitor?.source, "pi-sim-pulse");
    assert.equal(current.monitor?.runState, "unavailable");
    assert.equal(Object.hasOwn(current.monitor ?? {}, "waveforms"), false);
    const status = JSON.parse(readFileSync(join(dir, "status.json"), "utf8")) as { runState: string; source: string };
    assert.deepEqual({ runState: status.runState, source: status.source }, { runState: "unavailable", source: "pi-sim-pulse" });
    const events = readEvents(dir);
    assertEventIndexes(events);
    assert.equal(events.at(-1)?.kind, "provider_unavailable");
    assert.equal(events.at(-1)?.payload.terminal, true);
    assert.equal(events.at(-1)?.payload.terminalReason, "provider_unavailable");
    assert.equal(events.some((event) => event.kind === "run_ended"), false);
    const waveformStatus = readJson<WaveformStatus>(join(dir, "waveforms", "status.json"));
    assert.deepEqual(
      { available: waveformStatus.available, reason: waveformStatus.reason, runState: waveformStatus.runState, source: waveformStatus.source },
      { available: false, reason: "provider_unavailable", runState: "unavailable", source: "pi-sim-pulse" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function testPulseRunnerFakeSuccess(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-pulse-success-"));
  try {
    const transport = new FakePulseTransport([
      { t: 0, hr: 70, map: 82, bp_sys: 120, bp_dia: 72, rr: 14, spo2: 99, temp_c: 37 },
      { t: 5, hr: 71, map: 81, bp_sys: 119, bp_dia: 71, rr: 15, spo2: 99, temp_c: 37 },
      { t: 10, hr: 72, map: 80, bp_sys: 118, bp_dia: 70, rr: 15, spo2: 98, temp_c: 37.1 },
    ]);
    const provider = new PulseProvider({ stateFile: "./states/StandardMale@0s.pbb", transport });
    const result = await runProviderRuntime({
      provider,
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 10,
      dt_s: 10,
      actions: [{ t: 5, action: { type: "position_change", params: { position: "sitting" } } }],
      now: deterministicNow(),
    });
    assert.equal(result.finalFrame.monitor?.source, "pi-sim-pulse");
    assert.equal(result.finalFrame.monitor?.runState, "ended");
    assert.equal(result.finalFrame.monitor?.sequence, 3);
    assert.equal(Object.hasOwn(result.finalFrame.monitor ?? {}, "waveforms"), false);
    assert.deepEqual(transport.actions, [{ type: "position_change", params: { position: "sitting" } }]);
    const waveformStatus = readJson<WaveformStatus>(join(dir, "waveforms", "status.json"));
    assert.equal(waveformStatus.available, false);
    assert.equal(existsSync(join(dir, "waveforms", "current.json")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function testFixtureWaveformLaneAndStaleClearing(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-waveforms-"));
  try {
    const fixtureProvider = new FixtureWaveformProvider();
    const fixtureResult = await runProviderRuntime({
      provider: fixtureProvider,
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 10,
      dt_s: 10,
      now: deterministicNow(),
    });

    const currentPath = join(dir, "waveforms", "current.json");
    const statusPath = join(dir, "waveforms", "status.json");
    assert.ok(existsSync(currentPath));
    const current = readJson<WaveformEnvelope>(currentPath);
    const status = readJson<WaveformStatus>(statusPath);
    assert.equal(status.available, true);
    assert.equal(status.sequence, current.sequence);
    assert.equal(status.simTime_s, current.simTime_s);
    assert.equal(status.source, current.source);
    assert.equal(status.sourceKind, "fixture");
    assert.equal(status.fidelity, "fixture");
    assert.equal(status.synthetic, true);
    assert.equal(current.synthetic, true);
    assert.equal(current.sourceKind, "fixture");
    assert.equal(current.fidelity, "fixture");
    assert.deepEqual(Object.keys(current.windows), ["ECG_LeadII"]);
    assert.equal(current.sequence, fixtureResult.finalFrame.monitor?.sequence);

    await runProviderRuntime({
      provider: new ScriptedProvider({ ...scenario, duration_s: 10 }),
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 10,
      dt_s: 10,
      now: deterministicNow(),
    });

    const clearedStatus = readJson<WaveformStatus>(statusPath);
    assert.equal(clearedStatus.available, false);
    assert.equal(clearedStatus.reason, "provider_does_not_supply_waveforms");
    assert.equal(existsSync(currentPath), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function testDemoWaveformProviderUsesCausalStableSampleGrid(): void {
  const provider = new DemoWaveformProvider({ duration_s: 2 });
  provider.init();
  const initial = provider.waveformWindow();
  for (const window of Object.values(initial.windows)) {
    assert.equal(window.t0_s, 0);
    assert.equal(window.values.length, 1, "initial waveform must not include future samples");
  }

  provider.advance(0.1);
  const atPointOne = provider.waveformWindow();
  const ecg = atPointOne.windows.ECG_LeadII;
  assert.equal(ecg.t0_s, 0);
  assert.equal(ecg.values.length, 13);
  const lastEcgSampleTime = ecg.t0_s + (ecg.values.length - 1) / ecg.sampleRate_Hz;
  assert.ok(lastEcgSampleTime <= 0.1, `last ECG sample ${lastEcgSampleTime} must be <= provider time`);
  assert.equal(Math.round(lastEcgSampleTime * ecg.sampleRate_Hz), 12);

  provider.advance(0.1);
  const atPointTwo = provider.waveformWindow().windows.ECG_LeadII;
  assert.equal(atPointTwo.t0_s, 0);
  assert.equal(atPointTwo.values.length, 26);
  const nextLastTime = atPointTwo.t0_s + (atPointTwo.values.length - 1) / atPointTwo.sampleRate_Hz;
  assert.equal(Math.round(nextLastTime * atPointTwo.sampleRate_Hz), 25);
}

async function testDemoWaveformProviderPublishesReferenceWaveformsAndLabels(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-demo-waveforms-"));
  try {
    const result = await runProviderRuntime({
      provider: new DemoWaveformProvider({ duration_s: 2 }),
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: 2,
      dt_s: 0.5,
      now: deterministicNow(),
    });
    const current = readJson<WaveformEnvelope>(join(dir, "waveforms", "current.json"));
    const status = readJson<WaveformStatus>(join(dir, "waveforms", "status.json"));
    assert.equal(status.available, true);
    assert.equal(status.sequence, current.sequence);
    assert.equal(status.simTime_s, current.simTime_s);
    assert.equal(status.source, current.source);
    assert.equal(status.runState, current.runState);
    assert.equal(status.sourceKind, "demo");
    assert.equal(status.fidelity, "demo");
    assert.equal(status.synthetic, true);
    assert.equal(current.sourceKind, "demo");
    assert.equal(current.fidelity, "demo");
    assert.equal(current.synthetic, true);
    assert.deepEqual(Object.keys(current.windows).sort(), ["ArterialPressure", "CO2", "ECG_LeadII", "Pleth"]);
    assert.equal(current.windows.ECG_LeadII.sampleRate_Hz, 125);
    assert.equal(current.windows.Pleth.sampleRate_Hz, 50);
    assert.equal(current.windows.ArterialPressure.sampleRate_Hz, 50);
    assert.equal(current.windows.CO2.sampleRate_Hz, 50);
    assert.ok(current.windows.ECG_LeadII.values.some((value) => value !== current.windows.ECG_LeadII.values[0]));
    assert.ok(current.windows.Pleth.values.some((value) => value !== current.windows.Pleth.values[0]));
    assert.ok(current.windows.ArterialPressure.values.some((value) => value !== current.windows.ArterialPressure.values[0]));
    assert.ok(current.windows.CO2.values.some((value) => value !== current.windows.CO2.values[0]));
    assert.ok(result.frames.length >= 3);
    assert.notDeepEqual(result.frames[0].hr, result.frames.at(-1)?.hr);
    assert.notDeepEqual(result.frames[0].spo2, result.frames.at(-1)?.spo2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function testPatient002ScriptedScenarioLoading(): void {
  const patient002 = loadScriptedScenario("vitals/scenarios/patient_002_septic_shock_recovery.scripted.json");
  assert.equal(patient002.provider, "scripted");
  assert.equal(patient002.name, "patient_002_septic_shock_recovery");
  assert.equal(patient002.initial.spo2, 94);
  assert.ok(patient002.waypoints.some((point) => point.events?.some((event) => event.startsWith("NOREPI_"))));
}

async function testScriptedAlarmSmokeScenario(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-alarm-smoke-"));
  try {
    const alarmScenario = loadScriptedScenario("vitals/scenarios/scripted_alarm_smoke.json");
    const result = await runProviderRuntime({
      provider: new ScriptedProvider(alarmScenario),
      publisher: new PublicTelemetryPublisher(dir),
      thresholds,
      duration_s: alarmScenario.duration_s,
      dt_s: 10,
      actions: alarmScenario.timeline,
      now: deterministicNow(),
    });
    const events = readEvents(dir);
    assertEventIndexes(events);
    const alarmEvents = events.filter((event) => event.kind === "alarm_observed");
    assert.ok(alarmEvents.length >= 2);
    assert.ok(alarmEvents.some((event) => event.payload.alarm === "MAP_LOW"));
    assert.ok(alarmEvents.some((event) => event.payload.alarm === "SPO2_LOW"));
    const timeline = readJsonLines<VitalFrame>(join(dir, "timeline.jsonl"));
    const frameSequences = new Set(timeline.map((frame) => frame.monitor?.sequence));
    for (const event of alarmEvents) assert.ok(frameSequences.has(event.sequence));
    assert.equal(timeline.length, result.frames.length);
    assert.equal(events.at(-1)?.kind, "run_ended");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function testLaneManifest(): void {
  const manifest = readJson<{ lanes: Array<Record<string, unknown>> }>("vitals/.lanes.json");
  const required = [
    "current.json",
    "timeline.json",
    "timeline.jsonl",
    "status.json",
    "events.jsonl",
    "encounter/current.json",
    "assessments/status.json",
    "assessments/current.json",
    "waveforms/status.json",
    "waveforms/current.json",
  ];
  for (const path of required) {
    const lane = manifest.lanes.find((entry) => entry.path === path);
    assert.ok(lane, `missing lane ${path}`);
    assert.equal(typeof lane.schemaVersion, "number");
    assert.ok(Array.isArray(lane.writeSemantics));
    assert.equal(typeof lane.producer, "string");
    assert.equal(typeof lane.preferredConsumerMode, "string");
  }
  const events = manifest.lanes.find((entry) => entry.path === "events.jsonl");
  assert.ok((events?.writeSemantics as string[]).includes("append-jsonl"));
  assert.ok((events?.writeSemantics as string[]).includes("reset-on-construction"));
  assert.equal(events?.schemaVersion, 2);
  const timelineJsonl = manifest.lanes.find((entry) => entry.path === "timeline.jsonl");
  assert.ok((timelineJsonl?.writeSemantics as string[]).includes("append-jsonl"));
  const timelineJson = manifest.lanes.find((entry) => entry.path === "timeline.json");
  assert.ok((timelineJson?.writeSemantics as string[]).includes("compat-array"));
}

function testScenarioValidationFailures(): void {
  const dir = mkdtempSync(join(tmpdir(), "pi-sim-scenario-validation-"));
  try {
    const writeScenario = (name: string, value: unknown): string => {
      const path = join(dir, name);
      writeFileSync(path, `${JSON.stringify(value)}\n`);
      return path;
    };
    assert.throws(() => loadScriptedScenario(writeScenario("missing-provider.json", { name: "x", duration_s: 1, initial: {}, waypoints: [] })), /not a scripted/);
    assert.throws(() => loadScriptedScenario(writeScenario("wrong-provider.json", { provider: "pulse", name: "x", duration_s: 1, initial: {}, waypoints: [] })), /not a scripted/);
    assert.throws(() => loadScriptedScenario(writeScenario("bad-duration.json", { provider: "scripted", name: "x", duration_s: -1, initial: {}, waypoints: [] })), /duration_s/);
    assert.throws(() => loadScriptedScenario(writeScenario("bad-initial.json", { provider: "scripted", name: "x", duration_s: 1, waypoints: [] })), /initial/);
    assert.throws(() => loadScriptedScenario(writeScenario("bad-waypoint.json", { provider: "scripted", name: "x", duration_s: 1, initial: {}, waypoints: [{ t: -1, vitals: {} }] })), /waypoints\[0\]\.t/);
    assert.throws(() => loadPulseScenario(writeScenario("missing-state.json", { provider: "pulse", name: "x", duration_s: 1, timeline: [], checkpoints: [] })), /state_file/);
    assert.throws(() => loadPulseScenario(writeScenario("scripted-provider.json", { provider: "scripted", name: "x", state_file: "./states/x", duration_s: 1, timeline: [], checkpoints: [] })), /not a Pulse scenario/);
    assert.throws(() => loadPulseScenario(writeScenario("bad-timeline.json", { provider: "pulse", name: "x", state_file: "./states/x", duration_s: 1, timeline: [{ t: 1, action: {} }], checkpoints: [] })), /timeline\[0\]\.action\.type/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function testPulseScenarioLoading(): void {
  const stable = loadPulseScenario("vitals/scenarios/pulse_stable_observation.json");
  assert.equal(stable.provider, "pulse");
  assert.equal(stable.purpose, "stable-observation");
  assert.match(stable.description ?? "", /Low-acuity stable observation/);
  const acute = loadPulseScenario("vitals/scenarios/hemorrhagic_shock.json");
  assert.equal(acute.provider, "pulse");
  assert.equal(acute.timeline[0].t, 60);
  assert.throws(() => loadPulseScenario("vitals/scenarios/scripted_m1_demo.json"), /not a Pulse scenario|state_file/);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function readEvents(dir: string): PublicTelemetryEvent[] {
  return readJsonLines<PublicTelemetryEvent>(join(dir, "events.jsonl"));
}

function readJsonLines<T>(path: string): T[] {
  const text = readFileSync(path, "utf8").trim();
  if (text.length === 0) return [];
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
}

function assertEventIndexes(events: readonly PublicTelemetryEvent[]): void {
  events.forEach((event, index) => {
    assert.equal(event.schemaVersion, 2);
    assert.equal(event.eventIndex, index);
  });
}

function assertPublicEventFields(event: PublicTelemetryEvent): void {
  assert.equal(event.schemaVersion, 2);
  assert.equal(typeof event.eventIndex, "number");
  assert.equal(typeof event.sequence, "number");
  assert.equal(typeof event.simTime_s, "number");
  assert.match(event.wallTime, /^2026-04-27T00:00:\d{2}\.000Z$/);
  assert.equal(typeof event.source, "string");
  assert.ok(["running", "paused", "ended", "unavailable"].includes(event.runState));
  assert.ok([
    "run_started",
    "action_applied",
    "alarm_observed",
    "provider_unavailable",
    "run_ended",
    "encounter_started",
    "encounter_phase_changed",
    "assessment_requested",
    "assessment_revealed",
    "assessment_unavailable",
  ].includes(event.kind));
}

class RecordingProvider implements PhysiologyProvider {
  readonly metadata = { name: "recording", source: "recording", fidelity: "fixture" as const };
  readonly calls: string[] = [];
  private t = 0;
  private events: string[] = [];

  init(): ProviderSnapshot {
    this.calls.push("init");
    return this.snapshot();
  }

  advance(dtSeconds: number): ProviderSnapshot {
    this.calls.push(`advance:${dtSeconds}`);
    this.t += dtSeconds;
    return this.snapshot();
  }

  applyAction(action: ProviderAction): ProviderSnapshot {
    this.calls.push(`action:${action.type}`);
    this.events = [...this.events, `ACTION_${action.type.toUpperCase()}`];
    return this.snapshot();
  }

  snapshot(): ProviderSnapshot {
    return { t: this.t, vitals: { hr: 80, map: 60, spo2: 88 }, events: [...this.events] };
  }
}

class FixtureWaveformProvider implements PhysiologyProvider {
  readonly metadata: ProviderMetadata = { name: "fixture waveform provider", source: "pi-sim-fixture-waveform", fidelity: "fixture" };
  private t = 0;

  init(): ProviderSnapshot {
    this.t = 0;
    return this.snapshot();
  }

  advance(dtSeconds: number): ProviderSnapshot {
    this.t += dtSeconds;
    return this.snapshot();
  }

  applyAction(action: ProviderAction): ProviderSnapshot {
    return { ...this.snapshot(), events: [`ACTION_${action.type.toUpperCase()}`] };
  }

  snapshot(): ProviderSnapshot {
    return { t: this.t, vitals: { hr: 80, map: 82, spo2: 99 }, events: [] };
  }

  waveformWindow(): ProviderWaveformWindow {
    return {
      sourceKind: "fixture",
      fidelity: "fixture",
      synthetic: true,
      windows: {
        ECG_LeadII: {
          unit: "mV",
          sampleRate_Hz: 125,
          t0_s: Math.max(0, this.t - 1),
          values: [0, 0.8, -0.1],
        },
      },
    };
  }
}

class FakePulseTransport implements PulseTransport {
  readonly actions: { type: string; params: Record<string, unknown> }[] = [];
  private readonly frames: RawVitals[];
  private index = 0;

  constructor(frames: RawVitals[]) {
    this.frames = frames;
  }

  async init(): Promise<RawVitals> {
    return this.frames[0];
  }

  async advance(): Promise<RawVitals> {
    this.index = Math.min(this.index + 1, this.frames.length - 1);
    return this.frames[this.index];
  }

  async action(type: string, params: Record<string, unknown>): Promise<{ ok: boolean; t: number; type: string }> {
    this.actions.push({ type, params });
    return { ok: true, t: this.frames[this.index].t, type };
  }
}

class UnavailablePulseTransport implements PulseTransport {
  async init(): Promise<RawVitals> {
    throw new ProviderUnavailableError("shim offline");
  }

  async advance(): Promise<RawVitals> {
    throw new ProviderUnavailableError("shim offline");
  }

  async action(): Promise<{ ok: boolean; t: number; type: string }> {
    throw new ProviderUnavailableError("shim offline");
  }
}

function deterministicNow(): () => string {
  let sequence = 0;
  return () => `2026-04-27T00:00:${String(sequence++).padStart(2, "0")}.000Z`;
}

async function main(): Promise<void> {
  testClock();
  testProviderDeterminism();
  testFrameAndPublisher();
  await testSharedRunnerScripted();
  await testSharedRunnerActionOrder();
  await testM4AssessmentRevealReplayAndBoundary();
  await testM4UnavailableAndStaleClearing();
  await testScriptedAlarmSmokeScenario();
  testLaneManifest();
  testScenarioValidationFailures();
  await testPulseProviderFakeTransport();
  await testPulseRunnerUnavailable();
  await testPulseRunnerFakeSuccess();
  testPulseScenarioLoading();
  testPatient002ScriptedScenarioLoading();
  await testFixtureWaveformLaneAndStaleClearing();
  testDemoWaveformProviderUsesCausalStableSampleGrid();
  await testDemoWaveformProviderPublishesReferenceWaveformsAndLabels();
  console.log("runtime tests passed");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
