import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SimClock } from "./clock.js";
import { buildVitalFrame } from "./frame.js";
import { PublicTelemetryPublisher } from "./publisher.js";
import { ScriptedProvider, type ScriptedScenario } from "./scriptedProvider.js";
import type { AlarmThresholds, MonitorExtension, VitalFrame } from "../types.js";

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

testClock();
testProviderDeterminism();
testFrameAndPublisher();
console.log("runtime tests passed");
