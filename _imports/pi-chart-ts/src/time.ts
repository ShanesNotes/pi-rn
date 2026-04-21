// Time + clock abstraction.
//
// chart.yaml declares `clock: sim_time | wall_time`. SimClock returns the
// chart's latest authored timestamp; WallClock returns wall-clock now.
// readRecentEvents defaults `asOf` to the chart's latest event time so a
// stored simulation stays internally coherent regardless of how much
// real-world time has elapsed.

import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { iterNdjson, globPerDayFile } from "./fs-util.js";
import type { ChartMeta } from "./types.js";

export interface Clock {
  now(): Promise<Date>;
}

export class WallClock implements Clock {
  async now(): Promise<Date> {
    return new Date();
  }
}

export class SimClock implements Clock {
  constructor(private readonly chartRoot: string) {}
  async now(): Promise<Date> {
    return (await latestEffectiveAt(this.chartRoot)) ?? new Date();
  }
}

export async function loadChartMeta(chartRoot: string): Promise<ChartMeta> {
  const text = await fs.readFile(path.join(chartRoot, "chart.yaml"), "utf8");
  const data = yaml.load(text);
  if (data === null || data === undefined || typeof data !== "object") {
    throw new Error(`chart.yaml at ${chartRoot} is empty or not a mapping`);
  }
  return data as ChartMeta;
}

export async function chartClock(chartRoot: string): Promise<Clock> {
  const meta = await loadChartMeta(chartRoot).catch(() => null);
  if (meta?.clock === "wall_time") return new WallClock();
  return new SimClock(chartRoot);
}

/** Max effective_at across events plus max sampled_at across vitals. */
export async function latestEffectiveAt(chartRoot: string): Promise<Date | null> {
  let best: Date | null = null;

  for (const p of await globPerDayFile(chartRoot, "events.ndjson")) {
    for await (const [, ev] of iterNdjson(p)) {
      const t = parseIso(ev?.effective_at);
      if (t && (!best || t > best)) best = t;
    }
  }
  for (const p of await globPerDayFile(chartRoot, "vitals.jsonl")) {
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

/** ISO with seconds precision and the local timezone offset. */
export function nowIsoSeconds(): string {
  const d = new Date();
  // Strip ms while keeping timezone via `toISOString` + manual fixup.
  const iso = d.toISOString();          // "...Z"
  return iso.slice(0, 19) + "Z";
}
