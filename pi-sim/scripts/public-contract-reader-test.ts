import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

type JsonObject = Record<string, unknown>;

interface FixtureCase {
  readonly name: string;
  readonly dir: string;
}

interface LaneEntry {
  readonly name: string;
  readonly path: string;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VITALS_DIR = join(ROOT, "vitals");
const FIXTURE_ROOT = join(VITALS_DIR, "fixtures", "public-contract");

const CASES: Record<string, FixtureCase> = {
  demo: { name: "scripted-demo", dir: join(FIXTURE_ROOT, "scripted-demo") },
  alarm: { name: "scripted-alarm", dir: join(FIXTURE_ROOT, "scripted-alarm") },
  unavailable: { name: "provider-unavailable", dir: join(FIXTURE_ROOT, "provider-unavailable") },
  liveWaveform: { name: "live-demo-waveform", dir: join(FIXTURE_ROOT, "live-demo-waveform") },
};

const HIDDEN_FIXTURE_KEYS = [
  "hidden_truth",
  "live_expected",
  "scoringKey",
  "expectedNurseEventId",
  "referenceCompletedChartId",
  "futureFinding",
  "rootMarker",
  "findingMarker",
];

const PUBLIC_ASSESSMENT_KEYS = new Set([
  "schemaVersion",
  "requestId",
  "assessmentType",
  "bodySystem",
  "visibility",
  "sequence",
  "simTime_s",
  "wallTime",
  "source",
  "runState",
  "findings",
  "summary",
  "evidence",
  "envelopeDigest",
]);

const PUBLIC_FINDING_KEYS = new Set(["id", "label", "value", "severity", "evidence"]);

selfAuditImports();
assertFixtureRoot();
assertFixtureParseability();
assertManifestCoverage();
assertScriptedDemoContract();
assertScriptedAlarmContract();
assertProviderUnavailableContract();
assertLiveDemoWaveformContract();
assertFixtureDenylist();

console.log("public contract reader checks passed");

function selfAuditImports(): void {
  const source = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const forbiddenPaths = [
    ["scripts", "runtime"].join("/"),
    ["scripts", "types"].join("/"),
    ["pul", "se"].join("") + "/",
    ["..", "pi-chart"].join("/"),
    ["..", "pi-monitor"].join("/"),
    ["..", "pi-agent"].join("/"),
  ];
  for (const forbidden of forbiddenPaths) {
    assert.equal(source.includes(forbidden), false, `reader must not mention hidden/sibling path ${forbidden}`);
  }

  const importPattern = /^import\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["'];/gm;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(source)) !== null) {
    const specifier = match[1];
    assert.ok(specifier.startsWith("node:"), `only Node built-ins may be imported, got ${specifier}`);
  }
}

function assertFixtureRoot(): void {
  assert.ok(existsSync(FIXTURE_ROOT), "public-contract fixture root exists");
  for (const fixture of Object.values(CASES)) {
    assert.ok(statSync(fixture.dir).isDirectory(), `${fixture.name} fixture directory exists`);
  }
}


function assertFixtureParseability(): void {
  for (const fixture of Object.values(CASES)) {
    for (const path of fixtureFiles(fixture.dir)) {
      if (path.endsWith(".json")) JSON.parse(readFileSync(path, "utf8"));
      else if (path.endsWith(".jsonl")) readJsonl(path);
    }
  }
}

function assertManifestCoverage(): void {
  const manifest = readJson(join(VITALS_DIR, ".lanes.json"));
  assert.equal(manifest.schemaVersion, 1, "lane manifest schema version");
  const lanes = arrayField(manifest, "lanes").map((entry) => {
    const lane = objectValue(entry, "lane entry");
    return { name: stringField(lane, "name"), path: stringField(lane, "path") } satisfies LaneEntry;
  });

  const expectedLaneNames = new Set([
    "current",
    "timeline-compat-array",
    "timeline-append-jsonl",
    "status",
    "events",
    "encounter-current",
    "assessments-status",
    "assessments-current",
    "waveforms-status",
    "waveforms-current",
  ]);
  assert.deepEqual(new Set(lanes.map((lane) => lane.name)), expectedLaneNames, "all known M4 lanes are represented");

  for (const lane of lanes) {
    const presentIn = Object.values(CASES).filter((fixture) => existsSync(join(fixture.dir, lane.path))).map((fixture) => fixture.name);
    if (lane.name === "waveforms-current") {
      assert.deepEqual(presentIn, ["live-demo-waveform"], "waveforms/current.json has positive ECG/ABP/pleth/CO2 fixture coverage");
      continue;
    }
    assert.ok(presentIn.length > 0, `${lane.name} has positive fixture coverage`);
  }
}

function assertScriptedDemoContract(): void {
  const fixture = CASES.demo;
  requireFiles(fixture, [
    "current.json",
    "timeline.json",
    "timeline.jsonl",
    "status.json",
    "events.jsonl",
    "encounter/current.json",
    "assessments/status.json",
    "assessments/current.json",
    "waveforms/status.json",
  ]);

  assertTimelineLanes(fixture, 2);
  const current = readJson(join(fixture.dir, "current.json"));
  assertCurrentFrame(current, "ended", "pi-sim-scripted");
  const status = readJson(join(fixture.dir, "status.json"));
  assertStatus(status, "ended", "pi-sim-scripted");

  const events = readJsonl(join(fixture.dir, "events.jsonl"));
  assertEventLane(events);
  const terminal = last(events);
  assert.equal(terminal.kind, "run_ended", "demo terminal event is normal end");
  assert.equal(objectField(terminal, "payload").terminal, true, "demo terminal payload flag");
  assert.equal(objectField(terminal, "payload").terminalReason, "normal_end", "demo terminal reason");
  assert.ok(events.some((event) => event.kind === "assessment_revealed"), "demo reveals an assessment");
  assert.ok(events.some((event) => event.kind === "encounter_started"), "demo includes encounter context event");

  assertEncounter(readJson(join(fixture.dir, "encounter", "current.json")));
  assertAssessmentStatus(readJson(join(fixture.dir, "assessments", "status.json")), true);
  assertAssessmentReveal(readJson(join(fixture.dir, "assessments", "current.json")));
  assertWaveformUnavailable(fixture, readJson(join(fixture.dir, "waveforms", "status.json")), "provider_does_not_supply_waveforms");
}

function assertScriptedAlarmContract(): void {
  const fixture = CASES.alarm;
  requireFiles(fixture, ["current.json", "timeline.json", "timeline.jsonl", "status.json", "events.jsonl", "assessments/status.json", "waveforms/status.json"]);
  assertTimelineLanes(fixture, 2);
  const current = readJson(join(fixture.dir, "current.json"));
  assertCurrentFrame(current, "ended", "pi-sim-scripted");
  const events = readJsonl(join(fixture.dir, "events.jsonl"));
  assertEventLane(events);
  const alarmNames = events.filter((event) => event.kind === "alarm_observed").map((event) => objectField(event, "payload").alarm);
  assert.ok(alarmNames.includes("MAP_LOW"), "alarm fixture observes MAP_LOW");
  assert.ok(alarmNames.includes("SPO2_LOW"), "alarm fixture observes SPO2_LOW");
  assert.equal(last(events).kind, "run_ended", "alarm terminal event is normal end");
  assert.equal(existsSync(join(fixture.dir, "assessments", "current.json")), false, "alarm fixture has no assessment reveal");
  assertWaveformUnavailable(fixture, readJson(join(fixture.dir, "waveforms", "status.json")), "provider_does_not_supply_waveforms");
}

function assertProviderUnavailableContract(): void {
  const fixture = CASES.unavailable;
  requireFiles(fixture, ["current.json", "timeline.json", "timeline.jsonl", "status.json", "events.jsonl", "assessments/status.json", "waveforms/status.json"]);
  assertTimelineLanes(fixture, 1);
  const current = readJson(join(fixture.dir, "current.json"));
  assertCurrentFrame(current, "unavailable", "pi-sim-pulse");
  assert.ok(arrayField(objectField(current, "monitor"), "events").includes("PROVIDER_UNAVAILABLE"), "unavailable frame has public unavailable monitor event");
  const status = readJson(join(fixture.dir, "status.json"));
  assertStatus(status, "unavailable", "pi-sim-pulse");
  const events = readJsonl(join(fixture.dir, "events.jsonl"));
  assertEventLane(events);
  assert.equal(events.length, 1, "unavailable fixture has one terminal event");
  const terminal = events[0];
  assert.equal(terminal.kind, "provider_unavailable", "unavailable terminal kind");
  assert.equal(terminal.runState, "unavailable", "unavailable event state");
  assert.equal(objectField(terminal, "payload").terminal, true, "unavailable terminal payload flag");
  assert.equal(objectField(terminal, "payload").terminalReason, "provider_unavailable", "unavailable terminal reason");
  assert.equal(events.some((event) => event.kind === "run_ended"), false, "unavailable fixture does not emit run_ended");
  assertAssessmentStatus(readJson(join(fixture.dir, "assessments", "status.json")), false);
  assertWaveformUnavailable(fixture, readJson(join(fixture.dir, "waveforms", "status.json")), "provider_unavailable");
}

function assertLiveDemoWaveformContract(): void {
  const fixture = CASES.liveWaveform;
  requireFiles(fixture, ["current.json", "timeline.json", "timeline.jsonl", "status.json", "events.jsonl", "assessments/status.json", "waveforms/status.json", "waveforms/current.json"]);
  assertTimelineLanes(fixture, 3);
  assertCurrentFrame(readJson(join(fixture.dir, "current.json")), "ended", "pi-sim-demo-waveform");
  assertStatus(readJson(join(fixture.dir, "status.json")), "ended", "pi-sim-demo-waveform");
  assertAssessmentStatus(readJson(join(fixture.dir, "assessments", "status.json")), false);

  const status = readJson(join(fixture.dir, "waveforms", "status.json"));
  const current = readJson(join(fixture.dir, "waveforms", "current.json"));
  assert.equal(status.available, true, "waveform status is available");
  assert.equal(status.sourceKind, "demo", "waveform status sourceKind");
  assert.equal(status.fidelity, "demo", "waveform status fidelity");
  assert.equal(status.synthetic, true, "waveform status synthetic");
  assert.equal(current.sourceKind, "demo", "waveform current sourceKind");
  assert.equal(current.fidelity, "demo", "waveform current fidelity");
  assert.equal(current.synthetic, true, "waveform current synthetic");
  assert.equal(status.sequence, current.sequence, "waveform sequence matches");
  assert.equal(status.simTime_s, current.simTime_s, "waveform sim time matches");
  assert.equal(status.source, current.source, "waveform source matches");
  assert.equal(status.runState, current.runState, "waveform run state matches");
  const windows = objectField(current, "windows");
  assertWaveformWindow(objectField(windows, "ECG_LeadII"), "ECG_LeadII");
  assertWaveformWindow(objectField(windows, "Pleth"), "Pleth");
}

function assertFixtureDenylist(): void {
  const textPaths = [
    ...fixtureFiles(CASES.demo.dir),
    ...fixtureFiles(CASES.alarm.dir),
    ...fixtureFiles(CASES.unavailable.dir),
  ];
  for (const path of textPaths) {
    const text = readFileSync(path, "utf8");
    for (const hiddenKey of HIDDEN_FIXTURE_KEYS) {
      assert.equal(text.includes(hiddenKey), false, `${relative(ROOT, path)} must not include hidden key ${hiddenKey}`);
    }
  }
}

function assertCurrentFrame(frame: JsonObject, expectedRunState: string, expectedSource: string): void {
  assert.equal(typeof frame.wallTime, "string", "frame wallTime");
  assert.equal(typeof frame.t, "number", "frame t");
  assert.ok(Array.isArray(frame.alarms), "frame alarms array");
  const monitor = objectField(frame, "monitor");
  assert.equal(monitor.schemaVersion, 1, "monitor schema version");
  assert.equal(monitor.source, expectedSource, "monitor source");
  assert.equal(monitor.runState, expectedRunState, "monitor run state");
  assert.equal(typeof monitor.sequence, "number", "monitor sequence");
}

function assertStatus(status: JsonObject, expectedRunState: string, expectedSource: string): void {
  assert.equal(status.schemaVersion, 1, "status schema version");
  assert.equal(status.source, expectedSource, "status source");
  assert.equal(status.runState, expectedRunState, "status run state");
  assert.equal(typeof status.sequence, "number", "status sequence");
  assert.equal(typeof status.simTime_s, "number", "status sim time");
  assert.equal(typeof status.updatedAt, "string", "status update time");
}


function assertTimelineLanes(fixture: FixtureCase, minimumFrames: number): void {
  const timeline = readJsonArray(join(fixture.dir, "timeline.json"));
  assert.ok(timeline.length >= minimumFrames, `${fixture.name} timeline.json has at least ${minimumFrames} frame(s)`);
  const jsonlFrames = assertJsonlFrames(join(fixture.dir, "timeline.jsonl"));
  assert.equal(jsonlFrames.length, timeline.length, `${fixture.name} timeline JSONL line count matches timeline array`);
}

function assertEventLane(events: readonly JsonObject[]): void {
  assert.ok(events.length > 0, "event lane is not empty");
  events.forEach((event, index) => {
    assert.equal(event.schemaVersion, 2, `event ${index} schema version`);
    assert.equal(event.eventIndex, index, `event ${index} has monotonic per-run index`);
    assert.equal(typeof event.sequence, "number", `event ${index} sequence`);
    assert.equal(typeof event.simTime_s, "number", `event ${index} sim time`);
    assert.equal(typeof event.wallTime, "string", `event ${index} wall time`);
    assert.equal(typeof event.source, "string", `event ${index} source`);
    assert.equal(typeof event.runState, "string", `event ${index} run state`);
    assert.equal(typeof event.kind, "string", `event ${index} kind`);
    objectField(event, "payload");
  });
}

function assertJsonlFrames(path: string): JsonObject[] {
  const frames = readJsonl(path);
  assert.ok(frames.length > 0, `${relative(ROOT, path)} has frame records`);
  frames.forEach((frame, index) => {
    assert.equal(typeof frame.t, "number", `timeline jsonl frame ${index} has t`);
    assert.ok(typeof frame.monitor === "object" && frame.monitor !== null, `timeline jsonl frame ${index} has monitor extension`);
  });
  return frames;
}

function assertEncounter(context: JsonObject): void {
  assert.equal(context.schemaVersion, 1, "encounter schema version");
  for (const key of ["patientId", "encounterId", "visibleChartAsOf", "source", "runState"]) {
    assert.equal(typeof context[key], "string", `encounter ${key}`);
  }
  assert.equal(typeof context.sequence, "number", "encounter sequence");
  assert.equal(typeof context.simTime_s, "number", "encounter sim time");
  assert.equal(typeof context.wallTime, "string", "encounter wall time");
}

function assertAssessmentStatus(status: JsonObject, expectedAvailable: boolean): void {
  assert.equal(status.schemaVersion, 1, "assessment status schema version");
  assert.equal(status.available, expectedAvailable, "assessment availability");
  assert.equal(typeof status.sequence, "number", "assessment status sequence");
  assert.equal(typeof status.simTime_s, "number", "assessment status sim time");
  assert.equal(typeof status.wallTime, "string", "assessment status wall time");
  assert.equal(typeof status.source, "string", "assessment status source");
  assert.equal(typeof status.runState, "string", "assessment status run state");
}

function assertAssessmentReveal(envelope: JsonObject): void {
  for (const key of Object.keys(envelope)) assert.ok(PUBLIC_ASSESSMENT_KEYS.has(key), `assessment reveal key is public: ${key}`);
  assert.equal(envelope.schemaVersion, 1, "assessment schema version");
  assert.equal(envelope.visibility, "revealed", "assessment visibility");
  assert.equal(typeof envelope.requestId, "string", "assessment request id");
  assert.equal(typeof envelope.assessmentType, "string", "assessment type");
  assert.equal(typeof envelope.sequence, "number", "assessment sequence");
  assert.equal(typeof envelope.envelopeDigest, "string", "assessment digest");
  for (const finding of arrayField(envelope, "findings")) {
    const findingObject = objectValue(finding, "assessment finding");
    for (const key of Object.keys(findingObject)) assert.ok(PUBLIC_FINDING_KEYS.has(key), `assessment finding key is public: ${key}`);
    assert.equal(typeof findingObject.id, "string", "finding id");
    assert.equal(typeof findingObject.label, "string", "finding label");
    assert.equal(typeof findingObject.value, "string", "finding value");
  }
}

function assertWaveformUnavailable(fixture: FixtureCase, status: JsonObject, expectedReason: string): void {
  assert.equal(status.schemaVersion, 1, "waveform status schema version");
  assert.equal(status.available, false, "waveform unavailable status");
  assert.equal(status.reason, expectedReason, "waveform unavailable reason");
  assert.equal(typeof status.sequence, "number", "waveform status sequence");
  assert.equal(typeof status.simTime_s, "number", "waveform status sim time");
  assert.equal(typeof status.wallTime, "string", "waveform status wall time");
  assert.equal(existsSync(join(fixture.dir, "waveforms", "current.json")), false, "waveform current absent for unavailable status");
}

function assertWaveformWindow(window: JsonObject, signal: string): void {
  assert.equal(typeof window.unit, "string", `${signal} unit`);
  assert.equal(typeof window.sampleRate_Hz, "number", `${signal} sample rate`);
  assert.equal(typeof window.t0_s, "number", `${signal} t0`);
  const values = arrayField(window, "values");
  assert.ok(values.length > 2, `${signal} has samples`);
  assert.ok(values.every((value) => typeof value === "number"), `${signal} samples are numbers`);
}

function requireFiles(fixture: FixtureCase, paths: readonly string[]): void {
  for (const path of paths) assert.ok(existsSync(join(fixture.dir, path)), `${fixture.name}/${path} exists`);
}

function fixtureFiles(dir: string): string[] {
  const output: string[] = [];
  collect(dir);
  return output;

  function collect(path: string): void {
    if (!existsSync(path)) return;
    const stats = statSync(path);
    if (stats.isFile()) {
      output.push(path);
      return;
    }
    if (!stats.isDirectory()) return;
    for (const name of readdirSync(path)) collect(join(path, name));
  }
}

function readJson(path: string): JsonObject {
  return objectValue(JSON.parse(readFileSync(path, "utf8")), relative(ROOT, path));
}

function readJsonArray(path: string): JsonObject[] {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  assert.ok(Array.isArray(parsed), `${relative(ROOT, path)} is an array`);
  return parsed.map((entry, index) => objectValue(entry, `${relative(ROOT, path)}[${index}]`));
}

function readJsonl(path: string): JsonObject[] {
  const text = readFileSync(path, "utf8").trim();
  assert.notEqual(text, "", `${relative(ROOT, path)} is non-empty`);
  return text.split("\n").map((line, index) => objectValue(JSON.parse(line), `${relative(ROOT, path)}:${index + 1}`));
}

function objectField(object: JsonObject, key: string): JsonObject {
  return objectValue(object[key], key);
}

function objectValue(value: unknown, label: string): JsonObject {
  assert.ok(typeof value === "object" && value !== null && !Array.isArray(value), `${label} is an object`);
  return value as JsonObject;
}

function stringField(object: JsonObject, key: string): string {
  assert.equal(typeof object[key], "string", `${key} is a string`);
  return object[key] as string;
}

function arrayField(object: JsonObject, key: string): unknown[] {
  assert.ok(Array.isArray(object[key]), `${key} is an array`);
  return object[key] as unknown[];
}

function last<T>(items: readonly T[]): T {
  assert.ok(items.length > 0, "array is not empty");
  return items[items.length - 1];
}
