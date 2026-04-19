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
    const t = Date.parse(ev.effective_at);
    if (!Number.isFinite(t)) continue;
    if (t < fromMs || t > toMs) continue;
    if (!params.includeSuperseded && (isSuperseded(ev, ctx) || isCorrected(ev, ctx))) continue;
    out.push({
      id: ev.id,
      type: ev.type as ClinicalType,
      subtype: ev.subtype,
      effective_at: ev.effective_at,
      author: ev.author,
      summary: summarize(ev),
      raw: ev,
    });
  }
  out.sort((a, b) =>
    a.effective_at.localeCompare(b.effective_at) ||
    a.id.localeCompare(b.id),
  );
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
      const name = (data as any).name ?? ev.subtype ?? "observation";
      const value = (data as any).value;
      const unit = (data as any).unit ?? "";
      if (value !== undefined) return `${name} = ${value}${unit ? " " + unit : ""}`.trim();
      return `${name}`;
    }
    case "assessment": {
      const summary = (data as any).summary ?? (data as any).impression;
      if (typeof summary === "string" && summary.length) return summary;
      return ev.subtype ?? "assessment";
    }
    case "intent": {
      const goal = (data as any).goal ?? ev.subtype ?? "intent";
      return typeof goal === "string" ? goal : String(goal);
    }
    case "action": {
      const what = (data as any).action ?? (data as any).name ?? ev.subtype ?? "action";
      return typeof what === "string" ? what : String(what);
    }
    case "communication": {
      const audience = (data as any).audience;
      const subtype = ev.subtype ?? "communication";
      return audience ? `${subtype} → ${audience}` : subtype;
    }
    case "artifact_ref": {
      const kind = (data as any).kind ?? ev.subtype ?? "artifact";
      const desc = (data as any).description ?? "";
      return desc ? `${kind}: ${desc}` : String(kind);
    }
    default:
      return ev.subtype ?? String(ev.type);
  }
}
