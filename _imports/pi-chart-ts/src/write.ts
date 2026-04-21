// Write-side tool surface. The only sanctioned way to mutate the chart.
//
// Contracts:
//   - `appendEvent` requires base envelope fields, plus the four
//     clinical-only fields when type is observation/assessment/intent/
//     action/communication/artifact_ref. Throws on missing.
//   - Inputs are not mutated; the function works on a copy.
//   - `writeNote` refuses to overwrite an existing path. Corrections must
//     be new notes that link supersedes/corrects.
//   - `writeCommunicationNote` writes the note AND appends the matching
//     communication event so the bidirectional note ↔ comm validator
//     check passes by construction.
//   - `nextEventId` file-probes the day's events.ndjson for the max
//     suffix; safe across process restarts within a single writer.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  appendNdjsonLine,
  atomicWriteFile,
  ensureDir,
  fileExists,
  formatFrontmatterMarkdown,
  iterNdjson,
  parseFrontmatter,
} from "./fs-util.js";
import type {
  Author,
  ClinicalType,
  EventInput,
  NoteFrontmatter,
  NoteFrontmatterInput,
} from "./types.js";

const REQUIRED_BASE = [
  "type",
  "subject",
  "effective_at",
  "author",
  "source",
  "status",
] as const;

const CLINICAL_TYPES: ReadonlySet<ClinicalType> = new Set([
  "observation",
  "assessment",
  "intent",
  "action",
  "communication",
  "artifact_ref",
]);

const REQUIRED_CLINICAL = [
  "encounter_id",
  "certainty",
  "data",
  "links",
] as const;

function checkProvenance(ev: EventInput): void {
  const missing = REQUIRED_BASE.filter(
    (k) => (ev as any)[k] === undefined || (ev as any)[k] === null,
  );
  if (missing.length) {
    throw new Error(
      `event missing required envelope fields: ${missing.join(", ")}`,
    );
  }
  if (CLINICAL_TYPES.has(ev.type as ClinicalType)) {
    const cMissing = REQUIRED_CLINICAL.filter(
      (k) => (ev as any)[k] === undefined,
    );
    if (cMissing.length) {
      throw new Error(
        `clinical event (${ev.type}) missing required fields: ${cMissing.join(", ")}`,
      );
    }
  }
}

function nowIsoWithOffset(): string {
  // Local time with offset; matches Python's
  // `datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")`.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  const tzMin = -d.getTimezoneOffset();
  const sign = tzMin >= 0 ? "+" : "-";
  const tzH = pad(Math.floor(Math.abs(tzMin) / 60));
  const tzM = pad(Math.abs(tzMin) % 60);
  return `${y}-${M}-${D}T${h}:${m}:${s}${sign}${tzH}:${tzM}`;
}

function ymdHmFromIso(iso: string): string {
  // "2026-04-18T08:30:00-05:00" → "20260418T0830"
  const cleaned = iso.replace(/[-:]/g, "");
  return cleaned.slice(0, 13);
}

function dayDirFromIso(chartRoot: string, iso: string): string {
  return path.join(chartRoot, "timeline", iso.slice(0, 10));
}

/** Probe `chartRoot/timeline/<day>/events.ndjson` for max NN given ymdHm. */
export async function nextEventId(opts: {
  chartRoot: string;
  effectiveAt?: string;
}): Promise<string> {
  const eff = opts.effectiveAt ?? nowIsoWithOffset();
  const ymdHm = ymdHmFromIso(eff);
  const dayPath = dayDirFromIso(opts.chartRoot, eff);
  const eventsPath = path.join(dayPath, "events.ndjson");
  let max = 0;
  if (await fileExists(eventsPath)) {
    const re = new RegExp(`^evt_${ymdHm}_(\\d{2,})$`);
    for await (const [, ev] of iterNdjson(eventsPath)) {
      const id: unknown = ev?.id;
      if (typeof id !== "string") continue;
      const m = id.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  }
  return `evt_${ymdHm}_${String(max + 1).padStart(2, "0")}`;
}

export function nextNoteId(opts: {
  effectiveAt?: string;
  slug?: string;
}): string {
  const eff = opts.effectiveAt ?? nowIsoWithOffset();
  const ymdHm = ymdHmFromIso(eff);
  return `note_${ymdHm}` + (opts.slug ? `_${opts.slug}` : "");
}

export async function appendEvent(
  event: EventInput,
  opts: { chartRoot: string },
): Promise<string> {
  checkProvenance(event);
  // Immutable input: never mutate caller's object.
  const ev: any = { ...event };
  if (!ev.recorded_at) ev.recorded_at = nowIsoWithOffset();
  if (!ev.id) {
    ev.id = await nextEventId({
      chartRoot: opts.chartRoot,
      effectiveAt: ev.effective_at,
    });
  }
  const dayDir = dayDirFromIso(opts.chartRoot, ev.effective_at);
  await ensureDir(dayDir);
  await appendNdjsonLine(path.join(dayDir, "events.ndjson"), ev);
  return ev.id as string;
}

export interface WriteNoteOpts {
  frontmatter: NoteFrontmatterInput;
  body: string;
  chartRoot: string;
  slug?: string;
}

export async function writeNote(opts: WriteNoteOpts): Promise<string> {
  const fm: any = { ...opts.frontmatter };
  if (!fm.recorded_at) fm.recorded_at = nowIsoWithOffset();
  const eff: string = fm.effective_at ?? fm.recorded_at;
  if (!fm.id) fm.id = nextNoteId({ effectiveAt: eff, slug: opts.slug });
  if (!fm.references) fm.references = [];

  const dayDir = dayDirFromIso(opts.chartRoot, eff);
  await ensureDir(dayDir);
  const notesDir = path.join(dayDir, "notes");
  await ensureDir(notesDir);

  const hhmm = eff.slice(11, 16).replace(":", "");
  const idTail = (fm.id as string).split("_").pop() ?? "note";
  const filenameSlug = opts.slug ?? idTail;
  const filename = `${hhmm}_${filenameSlug}.md`;
  const target = path.join(notesDir, filename);

  if (await fileExists(target)) {
    throw new Error(
      `note already exists at ${target} — chart is append-only; ` +
        `write a new note that links supersedes/corrects to the prior id`,
    );
  }

  const content = formatFrontmatterMarkdown(fm, opts.body);
  await atomicWriteFile(target, content);
  return target;
}

export interface WriteCommunicationNoteOpts extends WriteNoteOpts {
  communicationData?: Record<string, unknown>;
}

export async function writeCommunicationNote(
  opts: WriteCommunicationNoteOpts,
): Promise<{ notePath: string; eventId: string }> {
  const notePath = await writeNote(opts);
  const text = await fs.readFile(notePath, "utf8");
  const [fm] = parseFrontmatter(text);
  const note = fm as NoteFrontmatter;

  const commEvent = {
    type: "communication" as const,
    subtype: note.subtype ?? "progress_note",
    subject: note.subject,
    encounter_id: note.encounter_id,
    effective_at: note.effective_at,
    author: note.author,
    source: note.source,
    certainty: "performed" as const,
    status: note.status ?? "final",
    data: { note_ref: note.id, ...(opts.communicationData ?? {}) },
    links: { supports: [...note.references], supersedes: [] },
  };
  const eventId = await appendEvent(commEvent, { chartRoot: opts.chartRoot });
  return { notePath, eventId };
}

export async function writeArtifactRef(opts: {
  artifactPath: string;
  kind: string;
  description: string;
  encounterId: string;
  subject: string;
  effectiveAt?: string;
  chartRoot: string;
  author?: Author;
}): Promise<string> {
  const event = {
    type: "artifact_ref" as const,
    subtype: opts.kind,
    subject: opts.subject,
    encounter_id: opts.encounterId,
    effective_at: opts.effectiveAt ?? nowIsoWithOffset(),
    author: opts.author ?? { id: "pi-agent", role: "rn_agent" },
    source: { kind: "artifact_ingest" },
    certainty: "observed" as const,
    status: "final" as const,
    data: {
      kind: opts.kind,
      path: opts.artifactPath,
      description: opts.description,
    },
    links: { supports: [], supersedes: [] },
  };
  return appendEvent(event, { chartRoot: opts.chartRoot });
}
