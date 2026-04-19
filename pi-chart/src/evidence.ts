// Evidence references. `links.supports[]` items may be bare strings
// (event id, note id, or a vitals:// URI — back-compat) or structured
// `EvidenceRef` objects (canonical form, see DESIGN §4.5). `parseEvidenceRef`
// normalizes either input into the canonical union defined in types.ts.

import type { EvidenceRef } from "./types.js";

const VITALS_PREFIX = "vitals://";
const NOTE_ID_PREFIX = "note_";
const EVENT_ID_PREFIX = "evt_";

export type { EvidenceRef } from "./types.js";

/** Accepts a bare id string, a vitals:// URI, or a structured EvidenceRef. */
export function parseEvidenceRef(s: string | EvidenceRef): EvidenceRef | null {
  if (typeof s === "object" && s !== null) {
    return normalizeEvidenceRefObject(s);
  }
  if (typeof s !== "string" || s.length === 0) return null;
  if (s.startsWith(VITALS_PREFIX)) return parseVitalsUri(s);
  if (s.startsWith(NOTE_ID_PREFIX)) return { kind: "note", id: s };
  if (s.startsWith(EVENT_ID_PREFIX)) return { kind: "event", id: s };
  // Structural ids (patient_*, enc_*, cst_*, etc.) stay as `event` refs —
  // validator resolves them against state.allIds.
  return { kind: "event", id: s };
}

function normalizeEvidenceRefObject(ref: EvidenceRef): EvidenceRef | null {
  switch (ref.kind) {
    case "event":
      return typeof ref.id === "string" && ref.id.length > 0 ? ref : null;
    case "note":
      return typeof ref.id === "string" && ref.id.length > 0 ? ref : null;
    case "artifact":
      return typeof ref.id === "string" && ref.id.length > 0 ? ref : null;
    case "vitals": {
      if (
        typeof ref.metric !== "string" ||
        typeof ref.from !== "string" ||
        typeof ref.to !== "string"
      ) {
        return null;
      }
      return ref;
    }
    default:
      return null;
  }
}

function parseVitalsUri(s: string): EvidenceRef | null {
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const encounterId = url.host || url.pathname.replace(/^\//, "") || undefined;
  const metric = url.searchParams.get("name");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!encounterId || !metric || !from || !to) return null;
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return null;
  return { kind: "vitals", metric, from, to, encounterId };
}

export function formatVitalsUri(opts: {
  encounterId: string;
  metric?: string;
  name?: string;                     // legacy alias, accepted for back-compat
  from: Date | string;
  to: Date | string;
  unit?: string;
}): string {
  const metric = opts.metric ?? opts.name;
  if (!metric) throw new Error("formatVitalsUri: metric is required");
  const from = opts.from instanceof Date ? opts.from.toISOString() : opts.from;
  const to = opts.to instanceof Date ? opts.to.toISOString() : opts.to;
  const url = new URL(`vitals://${opts.encounterId}`);
  url.searchParams.set("name", metric);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (opts.unit) url.searchParams.set("unit", opts.unit);
  return url.toString();
}

export function isVitalsUri(s: unknown): s is string {
  return typeof s === "string" && s.startsWith(VITALS_PREFIX);
}
