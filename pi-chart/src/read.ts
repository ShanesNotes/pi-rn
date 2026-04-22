// Read-side tool surface. Pure queries over canonical chart files.
//
// Default time semantics: when callers don't supply `asOf`, the read API
// uses the latest event start (sim-time semantics) instead of
// wall-clock now. Otherwise simulations look "not recent" simply because
// real-world time has advanced since the encounter was authored.
//
// Every function takes a `PatientScope`; reads never cross patients.

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
import {
  eventStartDate,
  latestEffectiveAt as _latestEffectiveAt,
  parseIso,
} from "./time.js";
import { patientRoot } from "./types.js";
import type {
  ConstraintsBlock,
  EventEnvelope,
  EventType,
  NoteFrontmatter,
  PatientScope,
  VitalSample,
} from "./types.js";

export async function latestEffectiveAt(scope: PatientScope): Promise<Date | null> {
  return _latestEffectiveAt(patientRoot(scope));
}

export async function readPatientContext(scope: PatientScope): Promise<{
  "patient.md"?: { frontmatter: Record<string, unknown> | null; body: string };
  "constraints.md"?: { frontmatter: Record<string, unknown> | null; body: string };
  encounter?: { path: string; frontmatter: Record<string, unknown> | null; body: string };
}> {
  const pr = patientRoot(scope);
  const out: Awaited<ReturnType<typeof readPatientContext>> = {};
  for (const name of ["patient.md", "constraints.md"] as const) {
    const text = await readTextIfExists(path.join(pr, name));
    if (text !== null) {
      const [fm, body] = parseFrontmatter(text);
      out[name] = { frontmatter: fm, body };
    }
  }
  const encounters = await globEncounters(pr);
  if (encounters.length) {
    const latest = encounters[encounters.length - 1];
    const text = await fs.readFile(latest, "utf8");
    const [fm, body] = parseFrontmatter(text);
    out.encounter = {
      path: path.relative(pr, latest),
      frontmatter: fm,
      body,
    };
  }
  return out;
}

export async function readActiveConstraints(scope: PatientScope): Promise<{
  structured: ConstraintsBlock | null;
  body: string;
}> {
  const pr = patientRoot(scope);
  const text = await readTextIfExists(path.join(pr, "constraints.md"));
  if (text === null) return { structured: null, body: "" };
  const [fm, body] = parseFrontmatter(text);
  const block = (fm as any)?.constraints as ConstraintsBlock | undefined;
  return { structured: block ?? null, body };
}

export interface ReadRecentEventsOpts {
  scope: PatientScope;
  withinMinutes?: number;
  types?: EventType[];
  asOf?: Date;
}

export async function readRecentEvents(
  opts: ReadRecentEventsOpts,
): Promise<EventEnvelope[]> {
  const pr = patientRoot(opts.scope);
  const { withinMinutes = 120, types } = opts;
  const asOf = opts.asOf ?? (await _latestEffectiveAt(pr)) ?? new Date();
  const cutoff = new Date(asOf.getTime() - withinMinutes * 60_000);
  const results: EventEnvelope[] = [];
  const typeSet = types ? new Set(types) : null;
  for (const p of await globPerDayFile(pr, "events.ndjson")) {
    for await (const [, ev] of iterNdjson(p)) {
      if (typeSet && !typeSet.has(ev.type)) continue;
      const t = eventStartDate(ev as EventEnvelope);
      if (!t) continue;
      if (t < cutoff || t > asOf) continue;
      results.push(ev as EventEnvelope);
    }
  }
  return results;
}

export async function readRecentNotes(opts: {
  scope: PatientScope;
  limit?: number;
}): Promise<Array<{
  path: string;
  frontmatter: NoteFrontmatter | null;
  body: string;
}>> {
  const pr = patientRoot(opts.scope);
  const limit = opts.limit ?? 10;
  const notes = await globNotes(pr);
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
      path: path.relative(pr, p),
      frontmatter: (fm as unknown as NoteFrontmatter | null) ?? null,
      body,
    });
  }
  return out;
}

export async function readLatestVitals(
  scope: PatientScope,
): Promise<Record<string, VitalSample>> {
  const pr = patientRoot(scope);
  const latest: Record<string, { t: Date; sample: VitalSample }> = {};
  for (const p of await globPerDayFile(pr, "vitals.jsonl")) {
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
