// memoryProof(params) — deterministic, replay-safe composition over the
// six view primitives. It is a proof projection, not a seventh primitive:
// one bounded read answers what changed, why, evidence/provenance,
// uncertainty, open loops, and next-shift handoff.

import { expandVitalsWindowRef, formatVitalsUri, parseEvidenceRef } from "../evidence.js";
import { eventStartIso } from "../time.js";
import type {
  ClinicalType,
  CurrentState,
  EventEnvelope,
  EvidenceKind,
  MemoryProof,
  MemoryProofEvidence,
  MemoryProofItem,
  MemoryProofOpenLoop,
  MemoryProofParams,
  NarrativeEntry,
  OpenLoop,
  Source,
  TimelineEntry,
} from "../types.js";
import { resolveAsOfMs } from "./active.js";
import { currentState } from "./currentState.js";
import { narrative } from "./narrative.js";
import { openLoops } from "./openLoops.js";
import { timeline } from "./timeline.js";

type CurrentStateAll = Extract<CurrentState, { axis: "all" }>;

const CLINICAL_TYPES: ClinicalType[] = [
  "observation",
  "assessment",
  "intent",
  "action",
  "communication",
  "artifact_ref",
];

export async function memoryProof(
  params: MemoryProofParams,
): Promise<MemoryProof> {
  const asOfMs = await resolveAsOfMs(params.scope, params.asOf);
  const asOf = new Date(asOfMs).toISOString();
  const dayStart = startOfUtcDay(asOfMs);
  const from = new Date(dayStart).toISOString();

  const [entries, state, loops, notes] = await Promise.all([
    timeline({
      scope: params.scope,
      from,
      to: asOf,
      types: CLINICAL_TYPES,
      encounterId: params.encounterId,
    }),
    currentState({
      scope: params.scope,
      axis: "all",
      asOf,
      encounterId: params.encounterId,
    }) as Promise<CurrentStateAll>,
    openLoops({ scope: params.scope, asOf, encounterId: params.encounterId }),
    narrative({
      scope: params.scope,
      to: asOf,
      encounterId: params.encounterId,
    }),
  ]);

  const visibleEvents = entries.map((entry) => entry.raw);
  const byId = new Map(visibleEvents.map((event) => [event.id, event]));
  const visibleIds = new Set(byId.keys());
  const notesByRef = indexNotesByReference(notes);

  const whatHappened = entries
    .filter((entry) => entry.type !== "communication")
    .map((entry) => itemFromTimeline(entry, "timeline"));

  const whyItMattered = entries
    .filter((entry) => entry.type === "assessment")
    .map((entry) => itemFromEvent(entry.raw, byId, visibleIds, "currentState/timeline"));

  const evidence = collectEvidence(visibleEvents, byId, visibleIds);
  const uncertainty = collectUncertainty(visibleEvents);
  const openLoopItems = collectOpenLoops(loops, byId, visibleIds);
  const handoff = collectHandoff(entries, notes, notesByRef, byId, visibleIds);

  return {
    patient_id: params.scope.patientId,
    asOf,
    sections: {
      what_happened: whatHappened,
      why_it_mattered: whyItMattered,
      evidence,
      uncertainty,
      open_loops: openLoopItems,
      next_shift_handoff: handoff,
    },
    source_view_refs: [
      "timeline(to=asOf)",
      "currentState(axis=all,asOf)",
      "openLoops(asOf)",
      "narrative(to=asOf)",
      `currentState.observations=${state.observations.length}`,
    ],
  };
}

function startOfUtcDay(ms: number): number {
  if (!Number.isFinite(ms)) return Number.NEGATIVE_INFINITY;
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function itemFromTimeline(entry: TimelineEntry, sourceView: string): MemoryProofItem {
  return {
    id: entry.id,
    event_ids: [entry.id],
    summary: entry.summary,
    detail: detailFromEvent(entry.raw),
    source_view: sourceView,
  };
}

function itemFromEvent(
  event: EventEnvelope,
  byId: Map<string, EventEnvelope>,
  visibleIds: Set<string>,
  sourceView: string,
): MemoryProofItem {
  return {
    id: event.id,
    event_ids: [event.id, ...eventSupportClosure(event, byId, visibleIds)],
    summary: summarizeEvent(event),
    detail: detailFromEvent(event),
    source_view: sourceView,
  };
}

function collectEvidence(
  events: EventEnvelope[],
  byId: Map<string, EventEnvelope>,
  visibleIds: Set<string>,
): MemoryProofEvidence[] {
  const out = new Map<string, MemoryProofEvidence>();
  for (const event of events) {
    for (const raw of event.links?.supports ?? []) {
      const ref = parseEvidenceRef(raw);
      if (!ref) continue;
      if (ref.kind === "event" && !visibleIds.has(ref.ref)) continue;
      if (ref.kind === "vitals_window" && !vitalsWindowCoversOnlyPast(ref.ref, event)) continue;
      const supportingEvent = ref.kind === "event" ? byId.get(ref.ref) : undefined;
      const boundedRef = ref.kind === "vitals_window" ? clampVitalsRef(ref.ref, event) : ref.ref;
      const key = `${ref.kind}:${boundedRef}`;
      const prior = out.get(key);
      const eventIds = [...new Set([...(prior?.event_ids ?? []), event.id, ...(supportingEvent ? [supportingEvent.id] : [])])].sort();
      out.set(key, {
        ref: boundedRef,
        kind: ref.kind as EvidenceKind,
        summary: supportingEvent ? summarizeEvent(supportingEvent) : summarizeEvidenceRef(boundedRef),
        ...(ref.role ?? prior?.role ? { role: ref.role ?? prior?.role } : {}),
        ...(supportingEvent?.source ? { source: supportingEvent.source as Source } : {}),
        event_ids: eventIds,
      });
    }
  }
  return [...out.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.ref.localeCompare(b.ref));
}

function collectUncertainty(events: EventEnvelope[]): MemoryProofItem[] {
  const out: MemoryProofItem[] = [];
  for (const event of events) {
    const data = event.data ?? {};
    const differential = data.differential;
    const uncertainty = data.uncertainty ?? data.limitations;
    const contradictions = event.links?.contradicts ?? [];
    if (!Array.isArray(differential) && !uncertainty && contradictions.length === 0) continue;
    const parts: string[] = [];
    if (Array.isArray(differential) && differential.length) {
      parts.push(`Differential: ${differential.map(formatUnknown).join("; ")}`);
    }
    if (uncertainty) parts.push(`Uncertainty: ${formatUnknown(uncertainty)}`);
    if (contradictions.length) {
      parts.push(`Contradicts: ${contradictions.map((c) => c.ref).join(", ")}`);
    }
    out.push({
      id: `${event.id}:uncertainty`,
      event_ids: [event.id],
      summary: summarizeEvent(event),
      detail: parts.join(" | "),
      source_view: "timeline/currentState",
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function vitalsWindowCoversOnlyPast(ref: string, consumer: EventEnvelope): boolean {
  const window = expandVitalsWindowRef({ kind: "vitals_window", ref });
  const consumerMs = Date.parse(eventStartIso(consumer) ?? "");
  const fromMs = Date.parse(window?.from ?? "");
  if (!window || !Number.isFinite(consumerMs) || !Number.isFinite(fromMs)) return true;
  return fromMs <= consumerMs;
}

function clampVitalsRef(ref: string, consumer: EventEnvelope): string {
  const window = expandVitalsWindowRef({ kind: "vitals_window", ref });
  const consumerIso = eventStartIso(consumer);
  if (!window || !consumerIso) return ref;
  const consumerMs = Date.parse(consumerIso);
  const toMs = Date.parse(window.to);
  if (!Number.isFinite(consumerMs) || !Number.isFinite(toMs) || toMs <= consumerMs) return ref;
  return formatVitalsUri({
    encounterId: window.encounterId ?? "",
    metric: window.metric,
    from: window.from,
    to: consumerIso,
  });
}

function collectOpenLoops(
  loops: Awaited<ReturnType<typeof openLoops>>,
  byId: Map<string, EventEnvelope>,
  visibleIds: Set<string>,
): MemoryProofOpenLoop[] {
  const ordinary = loops.filter(
    (loop): loop is OpenLoop => !("kind" in loop) || loop.kind !== "contested_claim",
  );
  return ordinary.map((loop) => ({
    intent_id: loop.intent.id,
    state: loop.state,
    summary: summarizeEvent(loop.intent),
    ...(loop.dueDeltaMinutes !== undefined ? { dueDeltaMinutes: loop.dueDeltaMinutes } : {}),
    evidence_ids: eventSupportClosure(loop.intent, byId, visibleIds),
  })).sort((a, b) => a.intent_id.localeCompare(b.intent_id));
}

function collectHandoff(
  entries: TimelineEntry[],
  notes: NarrativeEntry[],
  notesByRef: Map<string, NarrativeEntry[]>,
  byId: Map<string, EventEnvelope>,
  visibleIds: Set<string>,
): MemoryProofItem[] {
  const out: MemoryProofItem[] = [];
  for (const entry of entries) {
    if (entry.type !== "communication" && entry.type !== "intent") continue;
    const text = `${entry.subtype ?? ""} ${entry.summary} ${formatUnknown(entry.raw.data ?? {})}`.toLowerCase();
    if (!/(handoff|sbar|watch|care|plan|shift)/.test(text)) continue;
    const refs = eventSupportClosure(entry.raw, byId, visibleIds);
    const relatedNotes = notesByRef.get(entry.id) ?? [];
    out.push({
      id: entry.id,
      event_ids: [...new Set([entry.id, ...refs, ...relatedNotes.flatMap((note) => note.references.filter((id) => visibleIds.has(id)))])].sort(),
      summary: entry.summary,
      detail: relatedNotes.map((note) => note.body).join("\n\n") || detailFromEvent(entry.raw),
      source_view: relatedNotes.length ? "narrative/timeline" : "timeline/openLoops",
    });
  }
  for (const note of notes) {
    const text = `${note.subtype} ${note.body}`.toLowerCase();
    if (!/(handoff|sbar|watch|next shift|next-shift)/.test(text)) continue;
    const eventIds = note.references.filter((id) => visibleIds.has(id));
    if (out.some((item) => item.event_ids.some((id) => eventIds.includes(id)))) continue;
    out.push({
      id: note.id,
      event_ids: eventIds,
      summary: `${note.subtype} note`,
      detail: note.body,
      source_view: "narrative",
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function indexNotesByReference(notes: NarrativeEntry[]): Map<string, NarrativeEntry[]> {
  const out = new Map<string, NarrativeEntry[]>();
  for (const note of notes) {
    for (const ref of note.references) {
      if (!out.has(ref)) out.set(ref, []);
      out.get(ref)!.push(note);
    }
  }
  return out;
}

function eventSupportClosure(
  event: EventEnvelope,
  byId: Map<string, EventEnvelope>,
  visibleIds: Set<string>,
): string[] {
  const out = new Set<string>();
  const walk = (ev: EventEnvelope) => {
    for (const raw of ev.links?.supports ?? []) {
      const ref = parseEvidenceRef(raw);
      if (!ref || ref.kind !== "event") continue;
      if (!visibleIds.has(ref.ref) || out.has(ref.ref)) continue;
      out.add(ref.ref);
      const next = byId.get(ref.ref);
      if (next) walk(next);
    }
  };
  walk(event);
  return [...out].sort();
}

function summarizeEvent(event: EventEnvelope): string {
  const data = event.data ?? {};
  if (data.name !== undefined && data.value !== undefined) {
    const unit = data.unit === undefined ? "" : ` ${formatUnknown(data.unit)}`;
    return `${formatUnknown(data.name)} = ${formatUnknown(data.value)}${unit}`;
  }
  const candidate = data.summary ?? data.impression ?? data.goal ?? data.action ?? data.value ?? data.name;
  if (candidate !== undefined) return formatUnknown(candidate);
  return event.subtype ?? event.type;
}

function detailFromEvent(event: EventEnvelope): string {
  const start = eventStartIso(event) ?? "unknown time";
  return `${event.type}${event.subtype ? `:${event.subtype}` : ""} at ${start}; source=${event.source.kind}${event.source.ref ? `/${event.source.ref}` : ""}`;
}

function summarizeEvidenceRef(ref: string): string {
  if (ref.startsWith("vitals://")) return ref.replace(/^vitals:\/\//, "vitals window ");
  return ref;
}

function formatUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatUnknown).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, inner]) => `${key}=${formatUnknown(inner)}`)
      .join(", ");
  }
  return "";
}
