// Evidence references: either an event id or a vitals:// URI that names a
// stretch of monitor data. Keeps assessments able to cite vitals trends
// without forcing every per-row sample to carry an id.

const VITALS_PREFIX = "vitals://";

export type EvidenceRef =
  | { kind: "event"; id: string }
  | {
      kind: "vitals_interval";
      encounterId: string;
      name: string;
      from: Date;
      to: Date;
      unit?: string;
    };

/** Parse a links.supports[] item. Plain ids → {kind:"event"}. Returns null on malformed vitals URIs. */
export function parseEvidenceRef(s: string): EvidenceRef | null {
  if (!s.startsWith(VITALS_PREFIX)) {
    if (!s) return null;
    return { kind: "event", id: s };
  }
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const encounterId = url.host || url.pathname.replace(/^\//, "");
  const name = url.searchParams.get("name");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const unit = url.searchParams.get("unit") ?? undefined;
  if (!encounterId || !name || !from || !to) return null;
  const fromDt = new Date(from);
  const toDt = new Date(to);
  if (Number.isNaN(fromDt.getTime()) || Number.isNaN(toDt.getTime())) return null;
  return { kind: "vitals_interval", encounterId, name, from: fromDt, to: toDt, unit };
}

export function formatVitalsUri(opts: {
  encounterId: string;
  name: string;
  from: Date | string;
  to: Date | string;
  unit?: string;
}): string {
  const from =
    opts.from instanceof Date ? opts.from.toISOString() : opts.from;
  const to = opts.to instanceof Date ? opts.to.toISOString() : opts.to;
  const url = new URL(`vitals://${opts.encounterId}`);
  url.searchParams.set("name", opts.name);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (opts.unit) url.searchParams.set("unit", opts.unit);
  return url.toString();
}

export function isVitalsUri(s: string): boolean {
  return s.startsWith(VITALS_PREFIX);
}
