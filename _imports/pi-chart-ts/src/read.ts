// Read-side tool surface. Pure queries over canonical chart files.
//
// Default time semantics: when callers don't supply `asOf`, the read API
// uses the latest event's `effective_at` (sim-time semantics) instead of
// wall-clock now. Otherwise simulations look "not recent" simply because
// real-world time has advanced since the encounter was authored.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  iterNdjson,
  parseFrontmatter,
  globPerDayFile,
  globNotes,
  globEncounters,
  readTextIfExists,
} from "./fs-util.js";
import { latestEffectiveAt as _latestEffectiveAt, parseIso } from "./time.js";
import type {
  ConstraintsBlock,
  EventEnvelope,
  EventType,
  NoteFrontmatter,
  VitalSample,
} from "./types.js";

export const latestEffectiveAt = _latestEffectiveAt;

export async function readPatientContext(chartRoot: string): Promise<{
  "patient.md"?: { frontmatter: Record<string, unknown> | null; body: string };
  "constraints.md"?: { frontmatter: Record<string, unknown> | null; body: string };
  encounter?: { path: string; frontmatter: Record<string, unknown> | null; body: string };
}> {
  const out: Awaited<ReturnType<typeof readPatientContext>> = {};
  for (const name of ["patient.md", "constraints.md"] as const) {
    const text = await readTextIfExists(path.join(chartRoot, name));
    if (text !== null) {
      const [fm, body] = parseFrontmatter(text);
      out[name] = { frontmatter: fm, body };
    }
  }
  const encounters = await globEncounters(chartRoot);
  if (encounters.length) {
    const latest = encounters[encounters.length - 1];
    const text = await fs.readFile(latest, "utf8");
    const [fm, body] = parseFrontmatter(text);
    out.encounter = {
      path: path.relative(chartRoot, latest),
      frontmatter: fm,
      body,
    };
  }
  return out;
}

export async function readActiveConstraints(chartRoot: string): Promise<{
  structured: ConstraintsBlock | null;
  body: string;
}> {
  const text = await readTextIfExists(path.join(chartRoot, "constraints.md"));
  if (text === null) return { structured: null, body: "" };
  const [fm, body] = parseFrontmatter(text);
  const block = (fm as any)?.constraints as ConstraintsBlock | undefined;
  return { structured: block ?? null, body };
}

export interface ReadRecentEventsOpts {
  chartRoot: string;
  withinMinutes?: number;
  types?: EventType[];
  asOf?: Date;
}

export async function readRecentEvents(
  opts: ReadRecentEventsOpts,
): Promise<EventEnvelope[]> {
  const { chartRoot, withinMinutes = 120, types } = opts;
  const asOf = opts.asOf ?? (await latestEffectiveAt(chartRoot)) ?? new Date();
  const cutoff = new Date(asOf.getTime() - withinMinutes * 60_000);
  const results: EventEnvelope[] = [];
  const typeSet = types ? new Set(types) : null;
  for (const p of await globPerDayFile(chartRoot, "events.ndjson")) {
    for await (const [, ev] of iterNdjson(p)) {
      if (typeSet && !typeSet.has(ev.type)) continue;
      const t = parseIso(ev.effective_at);
      if (t && t < cutoff) continue;
      results.push(ev as EventEnvelope);
    }
  }
  return results;
}

export async function readRecentNotes(opts: {
  chartRoot: string;
  limit?: number;
}): Promise<Array<{
  path: string;
  frontmatter: NoteFrontmatter | null;
  body: string;
}>> {
  const limit = opts.limit ?? 10;
  const notes = await globNotes(opts.chartRoot);
  const tail = notes.slice(-limit);
  const out: Array<{
    path: string;
    frontmatter: NoteFrontmatter | null;
    body: string;
  }> = [];
  for (const p of tail) {
    const text = await fs.readFile(p, "utf8");
    const [fm, body] = parseFrontmatter(text);
    out.push({
      path: path.relative(opts.chartRoot, p),
      frontmatter: (fm as NoteFrontmatter | null) ?? null,
      body,
    });
  }
  return out;
}

export async function readLatestVitals(
  chartRoot: string,
): Promise<Record<string, VitalSample>> {
  const latest: Record<string, { t: Date; sample: VitalSample }> = {};
  for (const p of await globPerDayFile(chartRoot, "vitals.jsonl")) {
    for await (const [, v] of iterNdjson(p)) {
      const sample = v as VitalSample;
      const t = parseIso(sample.sampled_at);
      if (!t) continue;
      const prior = latest[sample.name];
      if (!prior || t > prior.t) latest[sample.name] = { t, sample };
    }
  }
  const out: Record<string, VitalSample> = {};
  for (const [name, { sample }] of Object.entries(latest)) out[name] = sample;
  return out;
}
