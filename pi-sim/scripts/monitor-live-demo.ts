import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MONITOR_ROOT = join(ROOT, "..", "pi-monitor");
const LIVE_TCP = "127.0.0.1:8791";
const LIVE_TCP_PORT = "8791";
const STARTUP_TIMEOUT_MS = 5_000;

const sim = spawn(
  process.execPath,
  ["--import", "tsx", "scripts/sim-run-live-demo.ts", "--duration", "300", "--dt", "0.1", "--time-scale", "1", "--tcp-port", LIVE_TCP_PORT],
  {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let app: ReturnType<typeof spawn> | undefined;
let shuttingDown = false;
let appStarted = false;

const startupTimer = setTimeout(() => {
  if (appStarted || shuttingDown) return;
  console.error(`live TCP startup timed out waiting for ${LIVE_TCP}; not launching monitor fallback`);
  shutdown("SIGTERM");
  process.exitCode = 1;
}, STARTUP_TIMEOUT_MS);

sim.stdout?.on("data", (chunk: Buffer) => handleSimOutput(chunk, false));
sim.stderr?.on("data", (chunk: Buffer) => handleSimOutput(chunk, true));

function handleSimOutput(chunk: Buffer, stderr: boolean): void {
  const text = chunk.toString("utf8");
  if (stderr) process.stderr.write(text);
  else process.stdout.write(text);
  if (!appStarted && text.includes(`live TCP NDJSON stream listening on ${LIVE_TCP}`)) {
    startMonitorApp();
  }
}

function startMonitorApp(): void {
  if (appStarted || shuttingDown) return;
  appStarted = true;
  clearTimeout(startupTimer);
  app = spawn("cargo", ["run", "-p", "monitor-app", "--", "--live-tcp", LIVE_TCP, "--windowed"], {
    cwd: MONITOR_ROOT,
    stdio: "inherit",
  });
  app.on("exit", (code, signal) => {
    shutdown(signal ?? undefined);
    process.exitCode = code ?? 0;
  });
}

function shutdown(signal?: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(startupTimer);
  if (signal) console.log(`shutting down live demo after ${signal}`);
  sim.kill(signal ?? "SIGTERM");
  app?.kill(signal ?? "SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

sim.on("exit", (code) => {
  if (!shuttingDown && code !== 0) {
    shutdown();
    process.exitCode = code ?? 1;
    return;
  }
  if (!shuttingDown && !appStarted) {
    clearTimeout(startupTimer);
    process.exitCode = code ?? 0;
  }
});
