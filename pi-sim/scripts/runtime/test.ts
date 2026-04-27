import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SimClock } from "./clock.js";
import { buildVitalFrame } from "./frame.js";
import { PublicTelemetryPublisher } from "./publisher.js";
import { PulseProvider, type PulseTransport } from "./pulseProvider.js";
import { loadPulseScenario } from "./pulseScenario.js";
import { ProviderUnavailableError, isProviderUnavailableError, type ProviderAction, type ProviderSnapshot } from "./provider.js";
import { runProviderRuntime } from "./runner.js";
import { ScriptedProvider, type ScriptedScenario } from "./scriptedProvider.js";
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

    const status = JSON.parse(readFileSync(join(dir, "status.json"), "utf8")) as { runState: string; sequence: number; source: string };
    assert.deepEqual(status, { runState: "ended", sequence: 2, source: "pi-sim-scripted", schemaVersion: 1, simTime_s: 60, updatedAt: "2026-04-27T00:01:00.000Z" });
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
    assert.ok(existsSync(join(dir, "status.json")));
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
  } finally {
    rmSync(dir, { recursive: true, force: true });
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

class RecordingProvider {
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
    return { t: this.t, vitals: { hr: 80, map: 80, spo2: 98 }, events: [...this.events] };
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
  await testPulseProviderFakeTransport();
  await testPulseRunnerUnavailable();
  await testPulseRunnerFakeSuccess();
  testPulseScenarioLoading();
  console.log("runtime tests passed");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
