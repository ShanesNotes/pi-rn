import { appendFileSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { VitalFrame } from "../types.js";
import type {
  PublicAssessmentEnvelope,
  PublicAssessmentStatus,
  PublicEncounterContext,
  PublicTelemetryEvent,
  RunState,
  WaveformEnvelope,
  WaveformStatus,
} from "./provider.js";

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
  private readonly waveformDir: string;
  private readonly encounterDir: string;
  private readonly assessmentsDir: string;
  private readonly history: VitalFrame[] = [];

  constructor(outDir: string) {
    this.outDir = outDir;
    this.waveformDir = join(outDir, "waveforms");
    this.encounterDir = join(outDir, "encounter");
    this.assessmentsDir = join(outDir, "assessments");
    mkdirSync(outDir, { recursive: true });
    rmSync(join(outDir, "events.jsonl"), { force: true });
    rmSync(join(outDir, "timeline.jsonl"), { force: true });
  }

  publish(frame: VitalFrame): void {
    this.history.push(frame);
    atomicWrite(join(this.outDir, "current.json"), `${JSON.stringify(frame, null, 2)}\n`);
    atomicWrite(join(this.outDir, "timeline.json"), `${JSON.stringify(this.history, null, 2)}\n`);
    appendFileSync(join(this.outDir, "timeline.jsonl"), `${JSON.stringify(frame)}\n`);
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

  appendEvent(event: PublicTelemetryEvent): void {
    appendFileSync(join(this.outDir, "events.jsonl"), `${JSON.stringify(event)}\n`);
  }

  publishWaveform(status: WaveformStatus, envelope?: WaveformEnvelope): void {
    mkdirSync(this.waveformDir, { recursive: true });
    atomicWrite(join(this.waveformDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`);

    const currentPath = join(this.waveformDir, "current.json");
    if (envelope) {
      atomicWrite(currentPath, `${JSON.stringify(envelope, null, 2)}\n`);
      return;
    }

    if (existsSync(currentPath)) rmSync(currentPath, { force: true });
  }

  publishEncounter(context?: PublicEncounterContext): void {
    const currentPath = join(this.encounterDir, "current.json");
    if (!context) {
      if (existsSync(currentPath)) rmSync(currentPath, { force: true });
      return;
    }

    mkdirSync(this.encounterDir, { recursive: true });
    atomicWrite(currentPath, `${JSON.stringify(context, null, 2)}\n`);
  }

  publishAssessment(status: PublicAssessmentStatus, envelope?: PublicAssessmentEnvelope, clearCurrent = false): void {
    mkdirSync(this.assessmentsDir, { recursive: true });
    atomicWrite(join(this.assessmentsDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`);

    const currentPath = join(this.assessmentsDir, "current.json");
    if (envelope) {
      atomicWrite(currentPath, `${JSON.stringify(envelope, null, 2)}\n`);
      return;
    }

    if (clearCurrent && existsSync(currentPath)) rmSync(currentPath, { force: true });
  }
}

export function atomicWrite(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, path);
}
