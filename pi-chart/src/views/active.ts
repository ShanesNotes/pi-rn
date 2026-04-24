// Shared supersession/correction evaluator. Single source of truth for
// "which claims are live as of t." Every view that filters on active
// status routes through this module so the semantics stay consistent
// (and the circular-supersession invariant is enforced in one place).

import path from "node:path";
import { promises as fs } from "node:fs";
import {
  globEncounters,
  globPerDayFile,
  iterNdjson,
  parseFrontmatter,
  readTextIfExists,
} from "../fs-util.js";
import {
  chartClock,
  eventStartDate,
} from "../time.js";
import { patientRoot } from "../types.js";
import type { EventEnvelope, PatientScope } from "../types.js";

export interface SupersessionIndex {
  /** supersededId → set of events that claim to supersede it. */
  supersededBy: Map<string, Set<string>>;
  /** correctedId → set of events that claim to correct it. */
  correctedBy: Map<string, Set<string>>;
}

export interface ActiveContext {
  events: EventEnvelope[];
  byId: Map<string, EventEnvelope>;
  supersession: SupersessionIndex;
  /** Epoch ms; defaults to +Infinity (all time). */
  asOfMs: number;
}

/**
 * Load every event for a patient — both NDJSON rows under `timeline/`
 * and structural events that live in markdown frontmatter (`patient.md`,
 * `constraints.md`, `timeline/<day>/encounter_*.md`). Views that filter
 * on `constraint_set`, `encounter`, or `subject` need the structural
 * rows or their output is incomplete.
 */
export async function loadAllEvents(
  scope: PatientScope,
): Promise<EventEnvelope[]> {
  const pr = patientRoot(scope);
  const events: EventEnvelope[] = [];
  for (const p of await globPerDayFile(pr, "events.ndjson")) {
    for await (const [, ev] of iterNdjson(p)) {
      events.push(ev as EventEnvelope);
    }
  }
  for (const ev of await loadStructuralEvents(pr)) events.push(ev);
  return events;
}

/**
 * Read structural events from markdown frontmatter. Mirrors what the
 * validator already walks — patient.md, constraints.md, encounter
 * headers — so view output sees the full claim stream.
 */
export async function loadStructuralEvents(
  patientDir: string,
): Promise<EventEnvelope[]> {
  const out: EventEnvelope[] = [];
  for (const name of ["patient.md", "constraints.md"] as const) {
    const text = await readTextIfExists(path.join(patientDir, name));
    if (text === null) continue;
    const [fm] = safeParseFrontmatter(text);
    const ev = toEnvelope(fm);
    if (ev) out.push(ev);
  }
  for (const encounterPath of await globEncounters(patientDir)) {
    let text: string;
    try {
      text = await fs.readFile(encounterPath, "utf8");
    } catch {
      continue;
    }
    const [fm] = safeParseFrontmatter(text);
    const ev = toEnvelope(fm);
    if (ev) out.push(ev);
  }
  return out;
}

function safeParseFrontmatter(
  text: string,
): [Record<string, unknown> | null, string] {
  try {
    return parseFrontmatter(text);
  } catch {
    return [null, text];
  }
}

function toEnvelope(fm: Record<string, unknown> | null): EventEnvelope | null {
  if (!fm) return null;
  if (typeof fm.id !== "string" || typeof fm.type !== "string") return null;
  // js-yaml materializes ISO timestamps as Date; coerce back to strings
  // so downstream comparisons and JSON.stringify behave uniformly with
  // the NDJSON path. Nested temporal fields such as
  // `effective_period.start` need the same normalization.
  return normalizeDates(fm) as EventEnvelope;
}

function normalizeDates(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = normalizeDates(inner);
    }
    return out;
  }
  return value;
}

export function indexSupersession(events: EventEnvelope[]): SupersessionIndex {
  const supersededBy = new Map<string, Set<string>>();
  const correctedBy = new Map<string, Set<string>>();
  for (const ev of events) {
    const links = ev.links ?? {};
    for (const target of links.supersedes ?? []) {
      if (!supersededBy.has(target)) supersededBy.set(target, new Set());
      supersededBy.get(target)!.add(ev.id);
    }
    for (const target of links.corrects ?? []) {
      if (!correctedBy.has(target)) correctedBy.set(target, new Set());
      correctedBy.get(target)!.add(ev.id);
    }
  }
  return { supersededBy, correctedBy };
}

export async function loadContext(
  scope: PatientScope,
  asOf?: string,
): Promise<ActiveContext> {
  const events = await loadAllEvents(scope);
  const byId = new Map<string, EventEnvelope>();
  for (const ev of events) byId.set(ev.id, ev);
  const asOfMs = await resolveAsOfMs(scope, asOf);
  return {
    events,
    byId,
    supersession: indexSupersession(events),
    asOfMs,
  };
}

/**
 * Resolve the default "now" for a view. Callers that pass an explicit
 * `asOf` bypass this. Otherwise we honor the chart's declared clock:
 * sim_time charts use the latest authored timestamp (so a replayed
 * simulation stays coherent); wall_time charts use real time.
 */
export async function resolveAsOfMs(
  scope: PatientScope,
  asOf?: string,
): Promise<number> {
  if (asOf) {
    const ms = Date.parse(asOf);
    return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
  }
  const clock = await chartClock(patientRoot(scope));
  return (await clock.now()).getTime();
}

/** The event is visible in the chart as of `ctx.asOfMs`. */
export function isVisibleAsOf(ev: EventEnvelope, ctx: ActiveContext): boolean {
  const t = eventStartDate(ev);
  if (!t) return false;
  return t.getTime() <= ctx.asOfMs;
}

/**
 * Returns true when `ev` has been replaced by a later supersession or
 * correction whose own `effective_at` is on or before `asOfMs`.
 * Excludes chain links whose supersessor isn't yet effective.
 */
export function isSuperseded(ev: EventEnvelope, ctx: ActiveContext): boolean {
  return findReplacement(ev.id, ctx, "supersedes") !== null;
}

export function isCorrected(ev: EventEnvelope, ctx: ActiveContext): boolean {
  return findReplacement(ev.id, ctx, "corrects") !== null;
}

type Kind = "supersedes" | "corrects";

function findReplacement(
  targetId: string,
  ctx: ActiveContext,
  kind: Kind,
): string | null {
  const index =
    kind === "supersedes" ? ctx.supersession.supersededBy : ctx.supersession.correctedBy;
  const replacements = index.get(targetId);
  if (!replacements) return null;
  for (const id of replacements) {
    const r = ctx.byId.get(id);
    if (!r) continue;
    if (!isVisibleAsOf(r, ctx)) continue;
    return id;
  }
  return null;
}

/** Walk the supersession chain from ev forward; the tail is the "live" event. */
export function effectiveClaim(
  ev: EventEnvelope,
  ctx: ActiveContext,
): EventEnvelope {
  const seen = new Set<string>();
  let cur = ev;
  while (true) {
    if (seen.has(cur.id)) return cur; // cycle — bail; validator will flag
    seen.add(cur.id);
    const nextId = findReplacement(cur.id, ctx, "supersedes");
    if (!nextId) return cur;
    const next = ctx.byId.get(nextId);
    if (!next) return cur;
    cur = next;
  }
}

/**
 * Collect every prior event in a supersession chain ending at `ev`. Used
 * by the evidence-chain view so an agent's reasoning history remains
 * auditable even after a claim has been superseded.
 */
export function supersededPriors(
  ev: EventEnvelope,
  ctx: ActiveContext,
): EventEnvelope[] {
  const priors: EventEnvelope[] = [];
  const seen = new Set<string>([ev.id]);
  const stack = [...(ev.links?.supersedes ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const prior = ctx.byId.get(id);
    if (!prior) continue;
    priors.push(prior);
    for (const next of prior.links?.supersedes ?? []) stack.push(next);
  }
  return priors;
}
