import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VitalFrame } from "../types.js";
import type { RunState } from "./provider.js";

export interface PublisherStatus {
  readonly schemaVersion: 1;
  readonly source: string;
  readonly sequence: number;
  readonly runState: RunState;
  readonly simTime_s: number;
  readonly updatedAt: string;
}

export class PublicTelemetryPublisher {
  private readonly outDir: string;
  private readonly history: VitalFrame[] = [];

  constructor(outDir: string) {
    this.outDir = outDir;
    mkdirSync(outDir, { recursive: true });
  }

  publish(frame: VitalFrame): void {
    this.history.push(frame);
    atomicWrite(join(this.outDir, "current.json"), `${JSON.stringify(frame, null, 2)}\n`);
    atomicWrite(join(this.outDir, "timeline.json"), `${JSON.stringify(this.history, null, 2)}\n`);
    const status: PublisherStatus = {
      schemaVersion: 1,
      source: frame.monitor?.source ?? "unknown",
      sequence: frame.monitor?.sequence ?? 0,
      runState: frame.monitor?.runState ?? "unavailable",
      simTime_s: frame.t,
      updatedAt: frame.wallTime,
    };
    atomicWrite(join(this.outDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`);
  }
}

export function atomicWrite(path: string, content: string): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, path);
}
