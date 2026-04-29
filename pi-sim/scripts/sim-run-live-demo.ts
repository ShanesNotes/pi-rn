import { createServer, type Socket } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PublicTelemetryPublisher } from "./runtime/publisher.js";
import { DemoWaveformProvider } from "./runtime/demoWaveformProvider.js";
import { runProviderRuntime } from "./runtime/runner.js";
import type { AlarmThresholds, VitalFrame } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VITALS_DIR = join(ROOT, "vitals");
const MAX_TCP_CLIENT_BUFFER_BYTES = 512 * 1024;

interface Args {
  readonly outDir: string;
  readonly duration: number;
  readonly dt: number;
  readonly timeScale: number;
  readonly tcpPort?: number;
}

function parseArgs(): Args {
  const parsed: { outDir: string; duration: number; dt: number; timeScale: number; tcpPort?: number } = {
    outDir: VITALS_DIR,
    duration: 300,
    dt: 0.1,
    timeScale: 1,
  };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out-dir" && args[i + 1]) parsed.outDir = resolve(args[++i]);
    else if (arg === "--duration" && args[i + 1]) parsed.duration = Number(args[++i]);
    else if (arg === "--dt" && args[i + 1]) parsed.dt = Number(args[++i]);
    else if (arg === "--time-scale" && args[i + 1]) parsed.timeScale = Number(args[++i]);
    else if (arg === "--tcp-port" && args[i + 1]) parsed.tcpPort = Number(args[++i]);
    else if (arg === "--no-pacing") parsed.timeScale = 0;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(parsed.duration) || parsed.duration < 0) throw new Error(`--duration must be >= 0, got ${parsed.duration}`);
  if (!Number.isFinite(parsed.dt) || parsed.dt <= 0) throw new Error(`--dt must be positive, got ${parsed.dt}`);
  if (!Number.isFinite(parsed.timeScale) || parsed.timeScale < 0) throw new Error(`--time-scale must be >= 0, got ${parsed.timeScale}`);
  if (parsed.tcpPort !== undefined && (!Number.isInteger(parsed.tcpPort) || parsed.tcpPort <= 0 || parsed.tcpPort > 65535)) {
    throw new Error(`--tcp-port must be an integer TCP port, got ${parsed.tcpPort}`);
  }
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const thresholds: AlarmThresholds = { map: { low: 65 }, spo2: { low: 90 } };
  const provider = new DemoWaveformProvider({ duration_s: args.duration });
  const tcp = args.tcpPort ? await startLiveTcpBroadcaster(args.tcpPort) : undefined;
  try {
    const result = await runProviderRuntime({
      provider,
      publisher: new PublicTelemetryPublisher(args.outDir),
      thresholds,
      duration_s: args.duration,
      dt_s: args.dt,
      timeScale: args.timeScale,
      onFrame: (frame) => tcp?.broadcast(frameWithMonitorWaveforms(frame, provider)),
    });
    console.log(`live demo waveform run complete: t=${result.finalFrame.t}s sequence=${result.finalFrame.monitor?.sequence ?? 0} out=${args.outDir}`);
  } finally {
    await tcp?.close();
  }
}

interface LiveTcpBroadcaster {
  broadcast(frame: VitalFrame): void;
  close(): Promise<void>;
}

async function startLiveTcpBroadcaster(port: number): Promise<LiveTcpBroadcaster> {
  const clients = new Set<Socket>();
  const server = createServer((socket) => {
    socket.setNoDelay(true);
    clients.add(socket);
    socket.on("close", () => clients.delete(socket));
    socket.on("error", () => clients.delete(socket));
  });
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  console.log(`live TCP NDJSON stream listening on 127.0.0.1:${port}`);
  return {
    broadcast(frame: VitalFrame): void {
      const sequence = frame.monitor?.sequence ?? 0;
      const line = `${JSON.stringify({ schemaVersion: 1, kind: "frame", sequence, payload: frame })}\n`;
      for (const client of clients) {
        if (client.destroyed) continue;
        if (client.writableLength > MAX_TCP_CLIENT_BUFFER_BYTES) {
          client.destroy(new Error(`live TCP client backpressure exceeded ${MAX_TCP_CLIENT_BUFFER_BYTES} bytes before write`));
          clients.delete(client);
          continue;
        }
        const accepted = client.write(line);
        if (!accepted && client.writableLength > MAX_TCP_CLIENT_BUFFER_BYTES) {
          client.destroy(new Error(`live TCP client backpressure exceeded ${MAX_TCP_CLIENT_BUFFER_BYTES} bytes after write`));
          clients.delete(client);
        }
      }
    },
    close(): Promise<void> {
      for (const client of clients) client.destroy();
      return new Promise((resolveClose) => server.close(() => resolveClose()));
    },
  };
}

function frameWithMonitorWaveforms(frame: VitalFrame, provider: DemoWaveformProvider): VitalFrame {
  const waveform = provider.waveformWindow();
  return {
    ...frame,
    monitor: {
      ...frame.monitor,
      schemaVersion: frame.monitor?.schemaVersion ?? 1,
      source: frame.monitor?.source ?? provider.metadata.source,
      sequence: frame.monitor?.sequence ?? 0,
      runState: frame.monitor?.runState ?? "running",
      events: frame.monitor?.events ?? frame.alarms,
      heartRhythm: frame.monitor?.heartRhythm ?? "unavailable",
      waveforms: Object.fromEntries(
        Object.entries(waveform.windows).map(([signal, window]) => [
          signal,
          { ...window, values: [...window.values] },
        ]),
      ),
    },
  };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
