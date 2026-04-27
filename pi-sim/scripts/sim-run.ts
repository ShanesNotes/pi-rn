import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SimClock } from "./runtime/clock.js";
import { buildVitalFrame } from "./runtime/frame.js";
import { PublicTelemetryPublisher } from "./runtime/publisher.js";
import { loadScriptedScenario } from "./runtime/scenario.js";
import { ScriptedProvider } from "./runtime/scriptedProvider.js";
import type { AlarmThresholds } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VITALS_DIR = join(ROOT, "vitals");

interface Args {
  scenarioPath: string;
  outDir: string;
  duration?: number;
  dt: number;
  timeScale: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    scenarioPath: join(VITALS_DIR, "scenarios", "scripted_m1_demo.json"),
    outDir: VITALS_DIR,
    dt: 2,
    timeScale: 0,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--scenario" && args[i + 1]) parsed.scenarioPath = resolve(args[++i]);
    else if (arg === "--out-dir" && args[i + 1]) parsed.outDir = resolve(args[++i]);
    else if (arg === "--duration" && args[i + 1]) parsed.duration = Number(args[++i]);
    else if (arg === "--dt" && args[i + 1]) parsed.dt = Number(args[++i]);
    else if (arg === "--time-scale" && args[i + 1]) parsed.timeScale = Number(args[++i]);
    else if (arg === "--no-pacing") parsed.timeScale = 0;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(parsed.dt) || parsed.dt <= 0) throw new Error(`--dt must be positive, got ${parsed.dt}`);
  if (!Number.isFinite(parsed.timeScale) || parsed.timeScale < 0) throw new Error(`--time-scale must be >= 0, got ${parsed.timeScale}`);
  if (parsed.duration !== undefined && (!Number.isFinite(parsed.duration) || parsed.duration < 0)) {
    throw new Error(`--duration must be >= 0, got ${parsed.duration}`);
  }
  return parsed;
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const scenario = loadScriptedScenario(args.scenarioPath);
  const duration = args.duration ?? scenario.duration_s;
  const thresholds = loadJson<AlarmThresholds>(join(VITALS_DIR, "alarms.json"));
  const provider = new ScriptedProvider({ ...scenario, duration_s: duration });
  const publisher = new PublicTelemetryPublisher(args.outDir);
  const clock = new SimClock();
  const wallStart = Date.now();

  let snapshot = provider.init();
  publisher.publish(buildVitalFrame({ snapshot, metadata: provider.metadata, sequence: clock.snapshot().sequence, runState: "running", thresholds }));

  while (clock.snapshot().simTime_s < duration) {
    const remaining = duration - clock.snapshot().simTime_s;
    const dt = Math.min(args.dt, remaining);
    const tick = clock.advance(dt);
    snapshot = provider.advance(dt);
    publisher.publish(buildVitalFrame({ snapshot, metadata: provider.metadata, sequence: tick.sequence, runState: "running", thresholds }));
    if (args.timeScale > 0) {
      const wallTarget = wallStart + (clock.snapshot().simTime_s * 1000) / args.timeScale;
      const slack = wallTarget - Date.now();
      if (slack > 0) await new Promise((resolveSleep) => setTimeout(resolveSleep, slack));
    }
  }

  const ended = clock.markEnded();
  publisher.publish(buildVitalFrame({ snapshot, metadata: provider.metadata, sequence: ended.sequence, runState: "ended", thresholds }));
  console.log(`scripted run complete: ${scenario.name} t=${snapshot.t}s sequence=${ended.sequence} out=${args.outDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
