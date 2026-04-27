import { readFileSync } from "node:fs";
import type { Scenario, TimelineEntry } from "../types.js";

export interface PulseScenario extends Scenario {
  readonly provider?: "pulse";
  readonly purpose?: "stable-observation" | "compatibility-reference";
}

export function loadPulseScenario(path: string): PulseScenario {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<PulseScenario> & Record<string, unknown>;
  if (parsed.provider !== undefined && parsed.provider !== "pulse") {
    throw new Error(`scenario ${path} is not a Pulse scenario`);
  }
  if (typeof parsed.state_file !== "string" || parsed.state_file.length === 0) {
    throw new Error(`scenario ${path} does not declare a Pulse state_file`);
  }
  if (typeof parsed.name !== "string" || parsed.name.length === 0) {
    throw new Error(`scenario ${path} does not declare a name`);
  }
  const duration_s = Number(parsed.duration_s);
  if (!Number.isFinite(duration_s) || duration_s < 0) {
    throw new Error(`scenario ${path} has invalid duration_s: ${String(parsed.duration_s)}`);
  }
  const timeline = normalizeTimeline(Array.isArray(parsed.timeline) ? parsed.timeline : []);
  return {
    name: parsed.name,
    description: typeof parsed.description === "string" ? parsed.description : undefined,
    provider: parsed.provider ?? "pulse",
    purpose: parsed.purpose,
    state_file: parsed.state_file,
    state_bake: parsed.state_bake,
    duration_s,
    timeline,
    checkpoints: Array.isArray(parsed.checkpoints) ? parsed.checkpoints : [],
  };
}

export function normalizeTimeline(entries: readonly unknown[]): TimelineEntry[] {
  return entries
    .map((entry) => parseTimelineEntry(entry))
    .filter((entry): entry is TimelineEntry => entry !== undefined)
    .sort((a, b) => a.t - b.t);
}

function parseTimelineEntry(entry: unknown): TimelineEntry | undefined {
  if (typeof entry !== "object" || entry === null) return undefined;
  const candidate = entry as { t?: unknown; action?: { type?: unknown; params?: unknown } };
  const t = Number(candidate.t);
  if (!Number.isFinite(t) || t < 0) return undefined;
  if (typeof candidate.action?.type !== "string") return undefined;
  const params = isRecord(candidate.action.params) ? candidate.action.params : {};
  return { t, action: { type: candidate.action.type, params } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
