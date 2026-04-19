// Time + clock abstraction.
//
// Per-patient `chart.yaml` declares `clock: sim_time | wall_time`.
// SimClock returns the patient chart's latest authored timestamp;
// WallClock returns wall-clock now. readRecentEvents defaults `asOf`
// to the patient's latest event time so a stored simulation stays
// internally coherent regardless of how much real-world time has
// elapsed.
//
// All functions here take a `patientRoot` (absolute path to a single
// patient directory). Callers holding a `PatientScope` compute
// `patientRoot(scope)` at the public API boundary.

import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { iterNdjson, globPerDayFile, readTextIfExists } from "./fs-util.js";
import type { ChartMeta, SystemRegistry } from "./types.js";

export interface Clock {
  now(): Promise<Date>;
}

export class WallClock implements Clock {
  async now(): Promise<Date> {
    return new Date();
  }
}

export class SimClock implements Clock {
  constructor(private readonly patientRoot: string) {}
  async now(): Promise<Date> {
    return (await latestEffectiveAt(this.patientRoot)) ?? new Date();
  }
}

let nowProvider = () => new Date();

export function __setTimeNowForTests(provider: (() => Date) | null): void {
  nowProvider = provider ?? (() => new Date());
}

export async function loadChartMeta(patientRoot: string): Promise<ChartMeta> {
  const text = await fs.readFile(path.join(patientRoot, "chart.yaml"), "utf8");
  const data = yaml.load(text);
  if (data === null || data === undefined || typeof data !== "object") {
    throw new Error(`chart.yaml at ${patientRoot} is empty or not a mapping`);
  }
  return data as ChartMeta;
}

/** Read the repo-level pi-chart.yaml registry, or throw if absent/invalid. */
export async function loadSystemRegistry(
  chartRoot: string,
): Promise<SystemRegistry> {
  const text = await readTextIfExists(path.join(chartRoot, "pi-chart.yaml"));
  if (text === null) {
    throw new Error(`pi-chart.yaml missing at ${chartRoot}`);
  }
  const data = yaml.load(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`pi-chart.yaml at ${chartRoot} is empty or not a mapping`);
  }
  return data as SystemRegistry;
}

export async function chartClock(patientRoot: string): Promise<Clock> {
  const meta = await loadChartMeta(patientRoot).catch(() => null);
  if (meta?.clock === "wall_time") return new WallClock();
  return new SimClock(patientRoot);
}

/** Max effective_at across events plus max sampled_at across vitals. */
export async function latestEffectiveAt(patientRoot: string): Promise<Date | null> {
  let best: Date | null = null;

  for (const p of await globPerDayFile(patientRoot, "events.ndjson")) {
    for await (const [, ev] of iterNdjson(p)) {
      const t = parseIso(ev?.effective_at);
      if (t && (!best || t > best)) best = t;
    }
  }
  for (const p of await globPerDayFile(patientRoot, "vitals.jsonl")) {
    for await (const [, v] of iterNdjson(p)) {
      const t = parseIso(v?.sampled_at);
      if (t && (!best || t > best)) best = t;
    }
  }
  return best;
}

/** Strict-ish ISO 8601 parse. Returns null on garbage. */
export function parseIso(s: unknown): Date | null {
  if (typeof s !== "string" || s.length === 0) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function offsetFromTimeZoneName(label: string): string {
  if (label === "GMT" || label === "UTC") return "Z";
  const match = label.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return "Z";
  const [, sign, hours, minutes] = match;
  return `${sign}${hours.padStart(2, "0")}:${(minutes ?? "00").padStart(2, "0")}`;
}

export function formatIsoSecondsInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const offset = offsetFromTimeZoneName(values.timeZoneName ?? "UTC");
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}${offset}`;
}

export async function chartWriteTimeZone(patientRoot: string): Promise<string> {
  try {
    const meta = await loadChartMeta(patientRoot);
    return meta.timezone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function nowIsoForChart(patientRoot: string): Promise<string> {
  const timeZone = await chartWriteTimeZone(patientRoot);
  return formatIsoSecondsInTimeZone(nowProvider(), timeZone);
}

/** ISO with seconds precision in UTC. */
export function nowIsoSeconds(): string {
  const iso = nowProvider().toISOString();
  return iso.slice(0, 19) + "Z";
}
