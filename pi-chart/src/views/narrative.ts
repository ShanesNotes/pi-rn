// narrative(params) — notes + communications sorted by recorded_at
// (DESIGN §4.7). The reading view: shift-change context loading.
//
// Notes carry a frontmatter envelope + body; this view normalizes both
// sources into `NarrativeEntry` so a UI can iterate uniformly.

import { promises as fs } from "node:fs";
import path from "node:path";
import { parseEvidenceRef } from "../evidence.js";
import { globNotes, parseFrontmatter } from "../fs-util.js";
import { patientRoot } from "../types.js";
import { loadAllEvents } from "./active.js";
import type {
  EventEnvelope,
  NarrativeEntry,
  NarrativeParams,
  NoteFrontmatter,
} from "../types.js";

export async function narrative(params: NarrativeParams): Promise<NarrativeEntry[]> {
  const pr = patientRoot(params.scope);
  const fromMs = params.from ? Date.parse(params.from) : Number.NEGATIVE_INFINITY;
  const toMs = params.to ? Date.parse(params.to) : Number.POSITIVE_INFINITY;
  const subtypeSet = params.subtypes ? new Set(params.subtypes) : null;
  const events = await loadAllEvents(params.scope);
  const communicationByNoteRef = indexCommunicationEventsByNoteRef(events);

  const out: NarrativeEntry[] = [];
  for (const notePath of await globNotes(pr)) {
    const text = await fs.readFile(notePath, "utf8");
    let fm: Record<string, unknown> | null = null;
    let body = "";
    try {
      [fm, body] = parseFrontmatter(text);
    } catch {
      continue;
    }
    if (!fm) continue;
    const fmTyped = fm as unknown as NoteFrontmatter;
    const rt = Date.parse(fmTyped.recorded_at ?? "");
    const ef = Date.parse(fmTyped.effective_at ?? "");
    if (!Number.isFinite(rt) || !Number.isFinite(ef)) continue;
    if (rt < fromMs || rt > toMs) continue;
    if (params.encounterId && fmTyped.encounter_id !== params.encounterId) continue;
    if (params.authorId && fmTyped.author?.id !== params.authorId) continue;
    const subtype = fmTyped.subtype ?? "communication";
    if (subtypeSet && !subtypeSet.has(subtype)) continue;
    const backingEvent = communicationByNoteRef.get(fmTyped.id);
    out.push({
      id: fmTyped.id,
      effective_at: fmTyped.effective_at,
      recorded_at: fmTyped.recorded_at,
      author: fmTyped.author,
      subtype,
      body: annotateNarrativeBody(body.trim(), backingEvent),
      references: Array.isArray(fmTyped.references) ? fmTyped.references : [],
      path: path.relative(pr, notePath),
    });
  }
  out.sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at) || a.id.localeCompare(b.id),
  );
  return out;
}

function indexCommunicationEventsByNoteRef(
  events: EventEnvelope[],
): Map<string, EventEnvelope> {
  const out = new Map<string, EventEnvelope>();
  for (const event of events) {
    if (event.type !== "communication") continue;
    const noteRef = (event.data as Record<string, unknown> | undefined)?.note_ref;
    if (typeof noteRef !== "string" || noteRef.length === 0) continue;
    if (!out.has(noteRef)) out.set(noteRef, event);
  }
  return out;
}

function annotateNarrativeBody(
  body: string,
  event: EventEnvelope | undefined,
): string {
  if (!event) return body;
  const tags: string[] = [];
  const transformTag = transformActivityTag(event);
  if (transformTag) tags.push(transformTag);
  const roleTag = supportRoleTag(event);
  if (roleTag) tags.push(roleTag);
  if (!tags.length) return body;
  return `${tags.join(" ")} ${body}`.trim();
}

function transformActivityTag(event: EventEnvelope): string | null {
  switch (event.transform?.activity) {
    case "extract":
    case "transcribe":
      return "[extracted]";
    case "infer":
    case "summarize":
      return "[inferred]";
    default:
      return null;
  }
}

function supportRoleTag(event: EventEnvelope): string | null {
  for (const raw of event.links?.supports ?? []) {
    const ref = parseEvidenceRef(raw);
    if (!ref?.role) continue;
    if (ref.role === "primary") return "(primary)";
    if (ref.role === "counterevidence") return "(counterevidence)";
  }
  return null;
}
