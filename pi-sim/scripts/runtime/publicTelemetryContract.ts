import { readFileSync } from "node:fs";

export const PUBLIC_TELEMETRY_CONTRACT_PATH = "vitals/.lanes.json";

export const PUBLIC_TELEMETRY_LANE_PATHS = [
  "current.json",
  "timeline.json",
  "timeline.jsonl",
  "status.json",
  "events.jsonl",
  "encounter/current.json",
  "assessments/status.json",
  "assessments/current.json",
  "waveforms/status.json",
  "waveforms/current.json",
] as const;

export type PublicTelemetryLanePath = (typeof PUBLIC_TELEMETRY_LANE_PATHS)[number];

export const PUBLIC_TELEMETRY_APPEND_LANES = new Set<PublicTelemetryLanePath>([
  "timeline.jsonl",
  "events.jsonl",
]);

export const PUBLIC_TELEMETRY_OPTIONAL_CURRENT_LANES = new Set<PublicTelemetryLanePath>([
  "encounter/current.json",
  "assessments/current.json",
  "waveforms/current.json",
]);

export interface PublicTelemetryLaneContract {
  name: string;
  path: PublicTelemetryLanePath;
  artifactKind: string;
  schemaVersion: number;
  recordSchemaVersion?: number;
  writeSemantics: string[];
  resetSemantics: string;
  producer: string;
  preferredConsumerMode: string;
}

export interface PublicTelemetryContractManifest {
  schemaVersion: 1;
  producer: string;
  resetSemantics: string;
  lanes: PublicTelemetryLaneContract[];
}

export function readPublicTelemetryContractManifest(
  path = PUBLIC_TELEMETRY_CONTRACT_PATH,
): PublicTelemetryContractManifest {
  return JSON.parse(readFileSync(path, "utf8")) as PublicTelemetryContractManifest;
}

export function assertPublicTelemetryContractManifest(
  manifest: PublicTelemetryContractManifest,
): void {
  const expected: ReadonlySet<string> = new Set(PUBLIC_TELEMETRY_LANE_PATHS);
  const actual = new Set<string>(manifest.lanes.map((lane) => lane.path));
  for (const path of expected) {
    if (!actual.has(path)) throw new Error(`missing public telemetry lane ${path}`);
  }
  for (const lane of manifest.lanes) {
    if (!expected.has(lane.path)) throw new Error(`unknown public telemetry lane ${lane.path}`);
    if (PUBLIC_TELEMETRY_APPEND_LANES.has(lane.path as PublicTelemetryLanePath) && !lane.writeSemantics.includes("append-jsonl")) {
      throw new Error(`append lane ${lane.path} must declare append-jsonl`);
    }
    if (
      PUBLIC_TELEMETRY_OPTIONAL_CURRENT_LANES.has(lane.path as PublicTelemetryLanePath) &&
      !lane.writeSemantics.includes("clears-when-unavailable")
    ) {
      throw new Error(`optional current lane ${lane.path} must declare clears-when-unavailable`);
    }
  }
}
