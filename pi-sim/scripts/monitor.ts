import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { shim, waitForShim, type RawVitals } from "./client.js";
import { renderFrame, renderEnded, CLEAR, HIDE_CURSOR, SHOW_CURSOR } from "./render.js";
import type { AlarmThresholds, Scenario, VitalFrame } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VITALS_DIR = join(ROOT, "vitals");

const DT_SIM = Number(process.env.DT_SIM ?? 2);
const TIME_SCALE = Number(process.env.TIME_SCALE ?? 1);
const BED = process.env.BED ?? "Bed 4";

function parseArgs(): { scenarioPath: string } {
  const args = process.argv.slice(2);
  let scenarioPath = join(VITALS_DIR, "scenario.json");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scenario" && args[i + 1]) scenarioPath = resolve(args[++i]);
  }
  return { scenarioPath };
}

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

function atomicWrite(path: string, content: string): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, path);
}

function computeAlarms(frame: Record<string, unknown>, thresholds: AlarmThresholds): string[] {
  const alarms: string[] = [];
  for (const [field, bands] of Object.entries(thresholds)) {
    const val = frame[field];
    if (typeof val !== "number" || !Number.isFinite(val)) continue;
    if (bands.low !== undefined && val < bands.low) alarms.push(`${field.toUpperCase()}_LOW`);
    if (bands.high !== undefined && val > bands.high) alarms.push(`${field.toUpperCase()}_HIGH`);
  }
  return alarms;
}

function frameFromRaw(raw: RawVitals, thresholds: AlarmThresholds): VitalFrame {
  const partial: Record<string, unknown> = { ...raw, wallTime: new Date().toISOString() };
  const alarms = computeAlarms(partial, thresholds);
  return { ...(partial as object), alarms } as VitalFrame;
}

async function main(): Promise<void> {
  const { scenarioPath } = parseArgs();
  const scenario = loadJson<Scenario>(scenarioPath);
  const thresholds = loadJson<AlarmThresholds>(join(VITALS_DIR, "alarms.json"));

  console.error(`[monitor] waiting for Pulse shim...`);
  await waitForShim();

  console.error(`[monitor] initializing engine from ${scenario.state_file}`);
  const first = await shim.init(scenario.state_file);

  const timeline = [...scenario.timeline].sort((a, b) => a.t - b.t);
  let nextActionIdx = 0;

  const currentPath = join(VITALS_DIR, "current.json");
  const timelinePath = join(VITALS_DIR, "timeline.json");
  const history: VitalFrame[] = [];
  atomicWrite(timelinePath, "[]\n");

  let stopped = false;
  const cleanup = (code: number) => {
    if (stopped) return;
    stopped = true;
    process.stdout.write(SHOW_CURSOR);
    process.stdout.write(renderEnded());
    process.exit(code);
  };
  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));

  process.stdout.write(HIDE_CURSOR);

  // Initial frame at t=0
  let tSim = first.t ?? 0;
  const wallStart = Date.now();
  const initialFrame = frameFromRaw(first, thresholds);
  atomicWrite(currentPath, JSON.stringify(initialFrame, null, 2) + "\n");
  history.push(initialFrame);
  atomicWrite(timelinePath, JSON.stringify(history, null, 2) + "\n");
  process.stdout.write(CLEAR + renderFrame(initialFrame, BED, scenario.name) + "\n");

  while (!stopped && tSim < scenario.duration_s) {
    // Fire any actions due at or before current sim time
    while (nextActionIdx < timeline.length && timeline[nextActionIdx].t <= tSim) {
      const entry = timeline[nextActionIdx++];
      console.error(`[monitor] t=${entry.t.toFixed(0)} action ${entry.action.type} ${JSON.stringify(entry.action.params)}`);
      await shim.action(entry.action.type, entry.action.params);
    }

    const dt = Math.min(DT_SIM, scenario.duration_s - tSim);
    const raw = await shim.advance(dt);
    tSim = raw.t;

    const frame = frameFromRaw(raw, thresholds);
    atomicWrite(currentPath, JSON.stringify(frame, null, 2) + "\n");
    history.push(frame);
    atomicWrite(timelinePath, JSON.stringify(history, null, 2) + "\n");

    process.stdout.write(CLEAR + renderFrame(frame, BED, scenario.name) + "\n");

    // Pace to wall clock if TIME_SCALE > 0 (0 = free-run)
    if (TIME_SCALE > 0) {
      const wallTarget = wallStart + (tSim * 1000) / TIME_SCALE;
      const slack = wallTarget - Date.now();
      if (slack > 0) await new Promise((r) => setTimeout(r, slack));
    }
  }

  cleanup(0);
}

main().catch((e) => {
  process.stdout.write(SHOW_CURSOR);
  console.error("[monitor] error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
