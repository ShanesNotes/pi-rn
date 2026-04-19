// trend(params) — a single metric's samples over time (DESIGN §4.4).
//
// Draws from two sources:
//   - vitals.jsonl, keyed by `name`
//   - events.ndjson observation rows with data.name === metric (for
//     event-recorded observations like lab results that don't live in
//     vitals.jsonl).

import { iterNdjson, globPerDayFile } from "../fs-util.js";
import { patientRoot } from "../types.js";
import type { TrendParams, TrendPoint } from "../types.js";

export async function trend(params: TrendParams): Promise<TrendPoint[]> {
  const pr = patientRoot(params.scope);
  const fromMs = Date.parse(params.from);
  const toMs = Date.parse(params.to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return [];
  const points: TrendPoint[] = [];

  for (const p of await globPerDayFile(pr, "vitals.jsonl")) {
    for await (const [, v] of iterNdjson(p)) {
      if (v?.name !== params.metric) continue;
      const t = Date.parse(v?.sampled_at ?? "");
      if (!Number.isFinite(t) || t < fromMs || t > toMs) continue;
      const source = formatSource(v?.source);
      if (params.source && source !== params.source) continue;
      points.push({
        sampled_at: v.sampled_at,
        value: v.value,
        unit: v.unit,
        source,
        context: v.context,
      });
    }
  }

  for (const p of await globPerDayFile(pr, "events.ndjson")) {
    for await (const [, ev] of iterNdjson(p)) {
      if (ev?.type !== "observation") continue;
      const name = ev?.data?.name;
      if (name !== params.metric) continue;
      const t = Date.parse(ev?.effective_at ?? "");
      if (!Number.isFinite(t) || t < fromMs || t > toMs) continue;
      const source = formatSource(ev?.source);
      if (params.source && source !== params.source) continue;
      points.push({
        sampled_at: ev.effective_at,
        value: ev.data?.value,
        unit: ev.data?.unit,
        source,
        context: ev.data?.context,
      });
    }
  }

  points.sort((a, b) => a.sampled_at.localeCompare(b.sampled_at));
  return points;
}

function formatSource(src: unknown): string {
  if (src && typeof src === "object") {
    const ref = (src as any).ref;
    const kind = (src as any).kind;
    if (typeof ref === "string" && ref.length) return ref;
    if (typeof kind === "string" && kind.length) return kind;
  }
  if (typeof src === "string") return src;
  return "unknown";
}
