import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createShimClient, waitForShim } from "./client.js";
import { PublicTelemetryPublisher } from "./runtime/publisher.js";
import { PulseProvider } from "./runtime/pulseProvider.js";
import { loadPulseScenario } from "./runtime/pulseScenario.js";
import { isProviderUnavailableError } from "./runtime/provider.js";
import { runProviderRuntime } from "./runtime/runner.js";
import type { AlarmThresholds } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VITALS_DIR = join(ROOT, "vitals");
const DEFAULT_EVIDENCE_DIR = join(ROOT, ".omx", "evidence", "pi-sim-m2-pulse-provider", "pulse-stable", "vitals");

interface Args {
  scenarioPath: string;
  outDir: string;
  duration?: number;
  dt: number;
  timeScale: number;
  shimUrl?: string;
  waitForShimMs: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    scenarioPath: join(VITALS_DIR, "scenarios", "pulse_stable_observation.json"),
    outDir: DEFAULT_EVIDENCE_DIR,
    dt: 10,
    timeScale: 0,
    waitForShimMs: 0,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--scenario" && args[i + 1]) parsed.scenarioPath = resolve(args[++i]);
    else if (arg === "--out-dir" && args[i + 1]) parsed.outDir = resolve(args[++i]);
    else if (arg === "--duration" && args[i + 1]) parsed.duration = Number(args[++i]);
    else if (arg === "--dt" && args[i + 1]) parsed.dt = Number(args[++i]);
    else if (arg === "--time-scale" && args[i + 1]) parsed.timeScale = Number(args[++i]);
    else if (arg === "--no-pacing") parsed.timeScale = 0;
    else if (arg === "--shim-url" && args[i + 1]) parsed.shimUrl = args[++i];
    else if (arg === "--wait-for-shim-ms" && args[i + 1]) parsed.waitForShimMs = Number(args[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(parsed.dt) || parsed.dt <= 0) throw new Error(`--dt must be positive, got ${parsed.dt}`);
  if (!Number.isFinite(parsed.timeScale) || parsed.timeScale < 0) throw new Error(`--time-scale must be >= 0, got ${parsed.timeScale}`);
  if (!Number.isFinite(parsed.waitForShimMs) || parsed.waitForShimMs < 0) throw new Error(`--wait-for-shim-ms must be >= 0, got ${parsed.waitForShimMs}`);
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
  const scenario = loadPulseScenario(args.scenarioPath);
  const duration = args.duration ?? scenario.duration_s;
  const thresholds = loadJson<AlarmThresholds>(join(VITALS_DIR, "alarms.json"));
  const shimUrl = args.shimUrl ?? process.env.PULSE_SHIM ?? "http://localhost:8765";
  const client = createShimClient(shimUrl);
  if (args.waitForShimMs > 0) {
    await waitForShim(args.waitForShimMs, client, shimUrl).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[sim-run-pulse] shim wait failed; continuing to bounded provider run: ${message}`);
    });
  }
  const provider = new PulseProvider({ stateFile: scenario.state_file, transport: client });
  const publisher = new PublicTelemetryPublisher(args.outDir);
  const result = await runProviderRuntime({
    provider,
    publisher,
    thresholds,
    duration_s: duration,
    dt_s: args.dt,
    timeScale: args.timeScale,
    actions: scenario.timeline,
  });
  console.log(`Pulse run complete: ${scenario.name} t=${result.finalFrame.t}s sequence=${result.finalFrame.monitor?.sequence ?? 0} out=${args.outDir}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${isProviderUnavailableError(error) ? "[sim-run-pulse] unavailable" : "[sim-run-pulse] error"}: ${message}`);
  process.exit(1);
});
