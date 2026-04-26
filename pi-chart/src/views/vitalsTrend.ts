// vitalsTrend(scope) — projection of `assessment.trend` events whose
// reasoning concerns vital signs, classified by the shape of the
// vital-evidence link in `links.supports[]`.
//
// Phase A bridge follow-up for a3 vitals (TB-style, view-only). The
// projection characterizes the candidate invariant that a vital-topic
// trend MUST cite vital evidence; strict-vs-permissive between
// `vitals_window` and event-refs to `observation.vital_sign` is
// HITL-pending and resolved by a future TB-V slice (proposed
// V-VITALS-01). This view does not edit `validate.ts` or schemas.
//
// Shape classification, per support strength:
//   - 'vitals_window' : at least one supports[] entry is a vitals_window
//                       (or vitals://) evidence-ref.
//   - 'event_ref'     : no vitals_window present, but at least one
//                       supports[] entry resolves to an event of type
//                       observation / subtype vital_sign.
//   - 'none'          : trend data references a vital metric in text but
//                       no vital evidence is linked.

import { loadAllEvents } from "./active.js";
import { parseEvidenceRef } from "../evidence.js";
import type { EventEnvelope, PatientScope } from "../types.js";

export type VitalEvidenceShape = "vitals_window" | "event_ref" | "none";

export interface VitalsTrendEntry {
  id: string;
  shape: VitalEvidenceShape;
  vital_metrics: string[];
}

export interface VitalsTrendParams {
  scope: PatientScope;
}

const VITAL_METRICS = [
  "spo2",
  "heart_rate",
  "respiratory_rate",
  "blood_pressure",
  "temperature",
] as const;

const VITAL_TEXT_TOKENS: ReadonlyArray<{ token: RegExp; metric: string }> = [
  { token: /\bspo2\b/i, metric: "spo2" },
  { token: /\bo2\s*sat(uration)?\b/i, metric: "spo2" },
  { token: /\bheart[\s_-]?rate\b/i, metric: "heart_rate" },
  { token: /\bhr\b/i, metric: "heart_rate" },
  { token: /\brespiratory[\s_-]?rate\b/i, metric: "respiratory_rate" },
  { token: /\brr\b/i, metric: "respiratory_rate" },
  { token: /\bblood[\s_-]?pressure\b/i, metric: "blood_pressure" },
  { token: /\bbp\b/i, metric: "blood_pressure" },
  { token: /\btemperature\b/i, metric: "temperature" },
  { token: /\btemp\b/i, metric: "temperature" },
];

export async function vitalsTrend(
  params: VitalsTrendParams,
): Promise<VitalsTrendEntry[]> {
  const events = await loadAllEvents(params.scope);
  const byId = new Map<string, EventEnvelope>();
  for (const ev of events) byId.set(ev.id, ev);

  const entries: VitalsTrendEntry[] = [];
  for (const ev of events) {
    if (ev.type !== "assessment" || ev.subtype !== "trend") continue;

    const linkedMetrics = collectLinkedVitalMetrics(ev, byId);
    const textMetrics = collectTextVitalMetrics(ev);
    const all = unique([...linkedMetrics.metrics, ...textMetrics]);
    if (all.length === 0) continue;

    const shape = classifyShape(linkedMetrics);
    entries.push({ id: ev.id, shape, vital_metrics: all });
  }
  return entries;
}

interface LinkedClassification {
  metrics: string[];
  hasVitalsWindow: boolean;
  hasVitalEventRef: boolean;
}

function collectLinkedVitalMetrics(
  ev: EventEnvelope,
  byId: Map<string, EventEnvelope>,
): LinkedClassification {
  const out: LinkedClassification = {
    metrics: [],
    hasVitalsWindow: false,
    hasVitalEventRef: false,
  };
  const supports = ev.links?.supports ?? [];
  for (const raw of supports) {
    const parsed = parseEvidenceRef(raw);
    if (!parsed) continue;

    if (parsed.kind === "vitals_window") {
      out.hasVitalsWindow = true;
      const metric =
        typeof parsed.selection?.metric === "string"
          ? (parsed.selection.metric as string).toLowerCase()
          : null;
      if (metric && isVitalMetric(metric)) out.metrics.push(metric);
      continue;
    }

    if (parsed.kind === "event") {
      const target = byId.get(parsed.ref);
      if (!target) continue;
      if (target.type !== "observation" || target.subtype !== "vital_sign") continue;
      out.hasVitalEventRef = true;
      const name =
        typeof target.data?.name === "string"
          ? (target.data.name as string).toLowerCase()
          : null;
      if (name && isVitalMetric(name)) out.metrics.push(name);
    }
  }
  return out;
}

function collectTextVitalMetrics(ev: EventEnvelope): string[] {
  const summary = readTextField(ev.data?.summary);
  const differentialText = differentialAsText(ev.data?.differential);
  const text = `${summary} ${differentialText}`;
  if (!text.trim()) return [];
  const found = new Set<string>();
  for (const { token, metric } of VITAL_TEXT_TOKENS) {
    if (token.test(text)) found.add(metric);
  }
  return [...found];
}

function classifyShape(linked: LinkedClassification): VitalEvidenceShape {
  if (linked.hasVitalsWindow) return "vitals_window";
  if (linked.hasVitalEventRef) return "event_ref";
  return "none";
}

function isVitalMetric(name: string): boolean {
  return (VITAL_METRICS as ReadonlyArray<string>).includes(name);
}

function readTextField(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function differentialAsText(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return v
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const cond = (item as Record<string, unknown>).condition;
        return typeof cond === "string" ? cond : "";
      }
      return "";
    })
    .join(" ");
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
