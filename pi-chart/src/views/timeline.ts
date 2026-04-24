// timeline(params) — chronological claim list filtered by type/subtype/
// encounter, hiding superseded events by default (DESIGN §4.2).

import type {
  ClinicalType,
  EventEnvelope,
  TimelineEntry,
  TimelineParams,
} from "../types.js";
import {
  isCorrected,
  isSuperseded,
  loadContext,
  resolveAsOfMs,
} from "./active.js";
import { eventStartIso, eventStartMs } from "../time.js";

const CLINICAL_TYPES: ReadonlySet<ClinicalType> = new Set([
  "observation",
  "assessment",
  "intent",
  "action",
  "communication",
  "artifact_ref",
]);

export async function timeline(params: TimelineParams): Promise<TimelineEntry[]> {
  // Defaults per DESIGN §4.2: `to` = chart-clock now, `from` = start of
  // that day. Explicit callers bypass both.
  const toMs = params.to
    ? Date.parse(params.to)
    : await resolveAsOfMs(params.scope);
  const fromMs = params.from ? Date.parse(params.from) : startOfUtcDay(toMs);
  const ctx = await loadContext(
    params.scope,
    params.to ?? new Date(toMs).toISOString(),
  );

  const typeSet = params.types
    ? new Set(params.types)
    : new Set<ClinicalType>(CLINICAL_TYPES);
  const subtypeSet = params.subtypes ? new Set(params.subtypes) : null;

  const out: TimelineEntry[] = [];
  for (const ev of ctx.events) {
    if (!CLINICAL_TYPES.has(ev.type as ClinicalType)) continue;
    if (!typeSet.has(ev.type as ClinicalType)) continue;
    if (subtypeSet && (!ev.subtype || !subtypeSet.has(ev.subtype))) continue;
    if (params.subtypePrefix && (!ev.subtype || !ev.subtype.startsWith(params.subtypePrefix))) continue;
    if (params.encounterId && ev.encounter_id !== params.encounterId) continue;
    const t = eventStartMs(ev);
    const startIso = eventStartIso(ev);
    if (t === null || !startIso) continue;
    if (t < fromMs || t > toMs) continue;
    if (!params.includeSuperseded && (isSuperseded(ev, ctx) || isCorrected(ev, ctx))) continue;
    out.push({
      id: ev.id,
      type: ev.type as ClinicalType,
      subtype: ev.subtype,
      effective_start: startIso,
      author: ev.author,
      summary: summarize(ev),
      raw: ev,
    });
  }
  out.sort((a, b) =>
    a.effective_start.localeCompare(b.effective_start) ||
    a.id.localeCompare(b.id),
  );
  const byId = new Map<string, TimelineEntry>(out.map((entry) => [entry.id, entry]));
  for (const entry of out) {
    for (const link of entry.raw.links?.contradicts ?? []) {
      const prior = byId.get(link.ref);
      if (!prior) continue;
      if (entry.contradicts_prev_id === undefined) {
        entry.contradicts_prev_id = prior.id;
      }
      if (prior.contradicted_by_next_id === undefined) {
        prior.contradicted_by_next_id = entry.id;
      }
    }
  }
  return out;
}

function startOfUtcDay(ms: number): number {
  if (!Number.isFinite(ms)) return Number.NEGATIVE_INFINITY;
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function summarize(ev: EventEnvelope): string {
  const data = ev.data ?? {};
  switch (ev.type) {
    case "observation": {
      const name = data.name ?? ev.subtype ?? "observation";
      const value = data.value;
      const unit = data.unit ?? "";
      if (value !== undefined) {
        return `${toText(name)} = ${toText(value)}${unit ? " " + toText(unit) : ""}`.trim();
      }
      return toText(name);
    }
    case "assessment": {
      const summary = data.summary ?? data.impression;
      if (typeof summary === "string" && summary.length) return summary;
      return ev.subtype ?? "assessment";
    }
    case "intent": {
      const goal = data.goal ?? ev.subtype ?? "intent";
      return typeof goal === "string" ? goal : String(goal);
    }
    case "action": {
      const what = data.action ?? data.name ?? ev.subtype ?? "action";
      return typeof what === "string" ? what : String(what);
    }
    case "communication": {
      const audience = data.audience;
      const subtype = ev.subtype ?? "communication";
      return audience ? `${subtype} → ${audience}` : subtype;
    }
    case "artifact_ref": {
      const kind = data.kind ?? ev.subtype ?? "artifact";
      const desc = data.description ?? "";
      return desc ? `${kind}: ${desc}` : String(kind);
    }
    default:
      return ev.subtype ?? String(ev.type);
  }
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}
