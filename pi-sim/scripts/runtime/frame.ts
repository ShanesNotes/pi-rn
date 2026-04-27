import type { AlarmThresholds, MonitorExtension, VitalFrame } from "../types.js";
import type { ProviderMetadata, ProviderSnapshot, RunState } from "./provider.js";

export interface FrameBuildInput {
  readonly snapshot: ProviderSnapshot;
  readonly metadata: ProviderMetadata;
  readonly sequence: number;
  readonly runState: RunState;
  readonly thresholds: AlarmThresholds;
  readonly wallTime?: string;
}

export function computeAlarms(frame: Record<string, unknown>, thresholds: AlarmThresholds): string[] {
  const alarms: string[] = [];
  for (const [field, bands] of Object.entries(thresholds)) {
    const val = frame[field];
    if (typeof val !== "number" || !Number.isFinite(val)) continue;
    if (bands.low !== undefined && val < bands.low) alarms.push(`${field.toUpperCase()}_LOW`);
    if (bands.high !== undefined && val > bands.high) alarms.push(`${field.toUpperCase()}_HIGH`);
  }
  return alarms;
}

export function buildVitalFrame(input: FrameBuildInput): VitalFrame {
  const partial: Record<string, unknown> = {
    t: input.snapshot.t,
    simTime_s: input.snapshot.t,
    wallTime: input.wallTime ?? new Date().toISOString(),
    ...input.snapshot.vitals,
  };
  const alarms = computeAlarms(partial, input.thresholds);
  const events = [...new Set([...alarms, ...input.snapshot.events])];
  const monitor: MonitorExtension = {
    schemaVersion: 1,
    source: input.metadata.source,
    sequence: input.sequence,
    runState: input.runState,
    events,
    heartRhythm: "unavailable",
  };
  if (input.snapshot.phase) partial.scenarioPhase = input.snapshot.phase;
  return { ...(partial as object), alarms, monitor } as VitalFrame;
}
