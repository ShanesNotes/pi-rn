// Write-side tool surface. The only sanctioned way to mutate the chart.
//
// Contracts:
//   - `appendEvent` requires base envelope fields, plus the four
//     clinical-only fields when type is observation/assessment/intent/
//     action/communication/artifact_ref. Throws on missing.
//   - Inputs are not mutated; the function works on a copy.
//   - `writeNote` refuses to overwrite an existing path. Corrections must
//     be new notes that link supersedes/corrects.
//   - `writeCommunicationNote` writes the note and matching communication
//     event with rollback-safe single-writer semantics.
//   - `nextEventId` file-probes the day's events.ndjson for the max
//     suffix; safe across process restarts within a single writer.
//   - Every public entry point takes a `PatientScope` so writes are
//     confined to a single patient directory. Session autofill for
//     `author` runs only when the caller omits one (DESIGN §3.4).

import { promises as fs } from "node:fs";
import path from "node:path";
import { parseEvidenceRef } from "./evidence.js";
import {
  appendNdjsonLine,
  atomicWriteFile,
  ensureDir,
  fileExists,
  formatFrontmatterMarkdown,
  globEncounters,
  globNotes,
  globPerDayFile,
  iterNdjson,
  parseFrontmatter,
  readTextIfExists,
} from "./fs-util.js";
import { resolveArtifactPath } from "./artifacts.js";
import { ajvErrorsTo, loadValidator, normalizeForSchema } from "./schema.js";
import {
  eventStartIso,
  loadChartMeta,
  nowIsoForChart,
  nowIsoSeconds,
} from "./time.js";
import { tryLoadSessionAuthor } from "./session.js";
import { patientRoot } from "./types.js";
import type {
  Author,
  ClinicalType,
  EventEnvelope,
  EventInput,
  NoteFrontmatter,
  NoteFrontmatterInput,
  PatientScope,
  Source,
} from "./types.js";

const REQUIRED_BASE = [
  "type",
  "subject",
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

interface FinalizedEventWrite {
  event: EventEnvelope;
  dayDir: string;
  eventsPath: string;
}

interface FinalizedNoteWrite {
  frontmatter: NoteFrontmatter;
  target: string;
  content: string;
  dayDir: string;
}

interface ExistingTargets {
  ids: Map<string, string>;
  noteIds: Set<string>;
  eventsById: Map<string, { type?: string; subtype?: string }>;
}

interface CommunicationNoteTestHooks {
  afterNotePersisted?: (notePath: string) => void | Promise<void>;
  removeNoteFile?: (notePath: string) => Promise<void>;
}

let communicationNoteTestHooks: CommunicationNoteTestHooks = {};

export function __setWriteCommunicationNoteTestHooksForTests(
  hooks: CommunicationNoteTestHooks | null,
): void {
  communicationNoteTestHooks = hooks ?? {};
}

function checkProvenance(ev: EventInput | EventEnvelope): void {
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
  const hasEffectiveAt = typeof (ev as any).effective_at === "string";
  const hasEffectivePeriod =
    !!(ev as any).effective_period &&
    typeof (ev as any).effective_period === "object";
  if (!hasEffectiveAt && !hasEffectivePeriod) {
    throw new Error(
      "event missing required temporal field: provide exactly one of effective_at or effective_period",
    );
  }
  if (hasEffectiveAt && hasEffectivePeriod) {
    throw new Error(
      "event has conflicting temporal fields: effective_at and effective_period are mutually exclusive",
    );
  }
}

function ymdHmFromIso(iso: string): string {
  const cleaned = iso.replace(/[-:]/g, "");
  return cleaned.slice(0, 13);
}

function dayDirFromIso(patientDir: string, iso: string): string {
  return path.join(patientDir, "timeline", iso.slice(0, 10));
}

function formatSchemaFailure(
  kind: "event" | "note",
  errors: Parameters<typeof ajvErrorsTo>[1],
): string {
  const details = ajvErrorsTo(kind, errors).map((entry) => entry.message);
  return `${kind} failed schema validation: ${details.join("; ")}`;
}

/**
 * Enforces invariant 6 at the write boundary: a record's `subject` must
 * match the patient directory (`scope.patientId`) it's being written
 * into. Per DESIGN §2.6, the directory is the authoritative identity;
 * chart.yaml.subject is redundant metadata. This also cross-checks the
 * directory's chart.yaml.subject so a mutated or stale chart.yaml can't
 * silently accept writes for another patient.
 */
async function assertSubjectMatches(
  scope: PatientScope,
  patientDir: string,
  subject: string,
  kind: "event" | "note",
): Promise<void> {
  if (subject !== scope.patientId) {
    throw new Error(
      `${kind} subject '${subject}' does not match patient directory '${scope.patientId}' (invariant 6: patient isolation)`,
    );
  }
  const meta = await loadChartMeta(patientDir);
  if (meta.subject !== scope.patientId) {
    throw new Error(
      `chart.yaml subject '${meta.subject}' does not match patient directory '${scope.patientId}' (invariant 6: chart.yaml is out of sync with directory identity)`,
    );
  }
}

function trackFirstId(ids: Map<string, string>, id: unknown, where: string): void {
  if (typeof id === "string" && !ids.has(id)) ids.set(id, where);
}

async function collectExistingTargets(patientDir: string): Promise<ExistingTargets> {
  const ids = new Map<string, string>();
  const noteIds = new Set<string>();
  const eventsById = new Map<string, { type?: string; subtype?: string }>();

  const rememberEvent = (
    id: unknown,
    type: unknown,
    subtype: unknown,
  ): void => {
    if (typeof id !== "string" || eventsById.has(id)) return;
    eventsById.set(id, {
      ...(typeof type === "string" ? { type } : {}),
      ...(typeof subtype === "string" ? { subtype } : {}),
    });
  };

  for (const name of ["patient.md", "constraints.md"] as const) {
    const text = await readTextIfExists(path.join(patientDir, name));
    if (text === null) continue;
    const [frontmatter] = parseFrontmatter(text);
    trackFirstId(ids, frontmatter?.id, name);
    rememberEvent(frontmatter?.id, frontmatter?.type, frontmatter?.subtype);
  }
  for (const encounterPath of await globEncounters(patientDir)) {
    const text = await fs.readFile(encounterPath, "utf8");
    const [frontmatter] = parseFrontmatter(text);
    trackFirstId(ids, frontmatter?.id, path.relative(patientDir, encounterPath));
    rememberEvent(frontmatter?.id, frontmatter?.type, frontmatter?.subtype);
  }
  for (const eventsPath of await globPerDayFile(patientDir, "events.ndjson")) {
    for await (const [lineno, event] of iterNdjson(eventsPath)) {
      trackFirstId(
        ids,
        event?.id,
        `${path.relative(patientDir, eventsPath)}:${lineno}`,
      );
      rememberEvent(event?.id, event?.type, event?.subtype);
    }
  }
  for (const notePath of await globNotes(patientDir)) {
    const text = await fs.readFile(notePath, "utf8");
    const [frontmatter] = parseFrontmatter(text);
    trackFirstId(ids, frontmatter?.id, path.relative(patientDir, notePath));
    if (typeof frontmatter?.id === "string") noteIds.add(frontmatter.id);
  }
  return { ids, noteIds, eventsById };
}

async function assertExplicitIdAvailable(
  patientDir: string,
  id: string | undefined,
  existingTargets?: ExistingTargets,
): Promise<void> {
  if (!id) return;
  const targets = existingTargets ?? (await collectExistingTargets(patientDir));
  const prior = targets.ids.get(id);
  if (prior) {
    throw new Error(`duplicate id '${id}' (first seen at ${prior})`);
  }
}

function assertKnownTargetId(
  targets: ExistingTargets,
  targetId: string,
  field: string,
): void {
  if (!targets.ids.has(targetId)) {
    throw new Error(`${field}: unknown target id '${targetId}'`);
  }
}

function assertTargetType(
  targets: ExistingTargets,
  targetId: string,
  field: string,
  predicate: (target: { type?: string; subtype?: string }) => boolean,
  message: string,
): void {
  assertKnownTargetId(targets, targetId, field);
  const target = targets.eventsById.get(targetId);
  if (!predicate(target ?? {})) {
    throw new Error(`${field}: ${message}`);
  }
}

async function assertEventIntegrityAtWrite(
  event: EventEnvelope,
  patientDir: string,
  targets: ExistingTargets,
  opts?: { allowStandaloneCommunicationEvent?: boolean },
): Promise<void> {
  if (event.type === "communication" && !opts?.allowStandaloneCommunicationEvent) {
    throw new Error(
      "communication events must be authored through writeCommunicationNote()",
    );
  }

  const links = event.links ?? {};
  for (const field of ["supersedes", "corrects"] as const) {
    for (const targetId of links[field] ?? []) {
      if (typeof targetId !== "string") {
        throw new Error(`links.${field}: non-string target`);
      }
      assertKnownTargetId(targets, targetId, `links.${field}`);
    }
  }

  for (const targetId of links.fulfills ?? []) {
    if (typeof targetId !== "string") {
      throw new Error("links.fulfills: non-string target");
    }
    assertTargetType(
      targets,
      targetId,
      "links.fulfills",
      (target) => target.type === "intent",
      `target '${targetId}' must be an intent`,
    );
  }

  for (const targetId of links.addresses ?? []) {
    if (typeof targetId !== "string") {
      throw new Error("links.addresses: non-string target");
    }
    assertTargetType(
      targets,
      targetId,
      "links.addresses",
      (target) =>
        target.type === "intent" ||
        (target.type === "assessment" && target.subtype === "problem"),
      `target '${targetId}' must be an assessment/problem or intent`,
    );
  }

  for (const raw of links.supports ?? []) {
    const ref = parseEvidenceRef(raw as string);
    if (!ref) {
      throw new Error("links.supports: malformed evidence reference");
    }
    switch (ref.kind) {
      case "event":
        assertKnownTargetId(targets, ref.id, "links.supports");
        break;
      case "note":
        assertKnownTargetId(targets, ref.id, "links.supports");
        if (!targets.noteIds.has(ref.id)) {
          throw new Error(`links.supports: target '${ref.id}' is not a note`);
        }
        break;
      case "artifact":
        assertTargetType(
          targets,
          ref.id,
          "links.supports",
          (target) => target.type === "artifact_ref",
          `target '${ref.id}' must be an artifact_ref`,
        );
        break;
      case "vitals":
        break;
    }
  }

  if (event.type === "artifact_ref") {
    const data = event.data as Record<string, unknown> | undefined;
    const artifactPath = data?.path;
    if (typeof artifactPath !== "string") {
      throw new Error("artifact_ref.data.path must be a string");
    }
    data!.path = resolveArtifactPath(patientDir, artifactPath).storedPath;
  }
}

function assertNoteReferencesExist(
  note: NoteFrontmatter,
  targets: ExistingTargets,
): void {
  for (const ref of note.references) {
    assertKnownTargetId(targets, ref, "references");
  }
}

async function finalizeEventForWrite(
  event: EventInput,
  scope: PatientScope,
  opts?: { allowStandaloneCommunicationEvent?: boolean },
): Promise<FinalizedEventWrite> {
  const patientDir = patientRoot(scope);
  // Session autofill (§3.4): only when caller did not supply author.
  const ev: Record<string, unknown> = { ...event };
  if (ev.author === undefined || ev.author === null) {
    const sessionAuthor = await tryLoadSessionAuthor(scope.chartRoot);
    if (sessionAuthor) ev.author = sessionAuthor;
  }
  checkProvenance(ev as EventInput);
  const explicitId = typeof ev.id === "string" && (ev.id as string).length > 0;
  if (!ev.recorded_at) ev.recorded_at = await nowIsoForChart(patientDir);
  if (!ev.id) {
    const effectiveStart = eventStartIso(ev as EventInput);
    if (!effectiveStart) {
      throw new Error(
        "event missing required temporal field: provide exactly one of effective_at or effective_period",
      );
    }
    ev.id = await nextEventId({
      scope,
      effectiveStart,
    });
  }
  checkProvenance(ev as EventInput);

  const validator = await loadValidator(scope.chartRoot, "event.schema.json");
  const normalized = normalizeForSchema(ev);
  if (!validator(normalized)) {
    throw new Error(formatSchemaFailure("event", validator.errors));
  }
  const finalized = normalized as EventEnvelope;
  await assertSubjectMatches(scope, patientDir, finalized.subject, "event");
  const existingTargets = await collectExistingTargets(patientDir);
  if (explicitId) {
    await assertExplicitIdAvailable(patientDir, finalized.id, existingTargets);
  }
  await assertEventIntegrityAtWrite(finalized, patientDir, existingTargets, opts);

  const effectiveStart = eventStartIso(finalized);
  if (!effectiveStart) {
    throw new Error(
      "event missing required temporal field after schema validation",
    );
  }
  const dayDir = dayDirFromIso(patientDir, effectiveStart);
  return {
    event: finalized,
    dayDir,
    eventsPath: path.join(dayDir, "events.ndjson"),
  };
}

async function persistEvent(write: FinalizedEventWrite): Promise<string> {
  await ensureDir(write.dayDir);
  await appendNdjsonLine(write.eventsPath, write.event);
  return write.event.id;
}

async function finalizeNoteForWrite(opts: WriteNoteOpts): Promise<FinalizedNoteWrite> {
  const patientDir = patientRoot(opts.scope);
  const frontmatter: Record<string, unknown> = { ...opts.frontmatter };
  // Session autofill mirrors the event path.
  if (frontmatter.author === undefined || frontmatter.author === null) {
    const sessionAuthor = await tryLoadSessionAuthor(opts.scope.chartRoot);
    if (sessionAuthor) frontmatter.author = sessionAuthor;
  }
  const explicitId =
    typeof frontmatter.id === "string" && (frontmatter.id as string).length > 0;
  if (!frontmatter.recorded_at) {
    frontmatter.recorded_at = await nowIsoForChart(patientDir);
  }
  if (!frontmatter.effective_at) {
    frontmatter.effective_at = frontmatter.recorded_at;
  }
  const effectiveAt = frontmatter.effective_at as string;
  if (!frontmatter.id) {
    frontmatter.id = nextNoteId({ effectiveAt, slug: opts.slug });
  }
  if (!frontmatter.references) frontmatter.references = [];

  const validator = await loadValidator(opts.scope.chartRoot, "note.schema.json");
  const normalized = normalizeForSchema(frontmatter);
  if (!validator(normalized)) {
    throw new Error(formatSchemaFailure("note", validator.errors));
  }
  const finalized = normalized as NoteFrontmatter;
  await assertSubjectMatches(opts.scope, patientDir, finalized.subject, "note");
  const existingTargets = await collectExistingTargets(patientDir);
  if (explicitId) {
    await assertExplicitIdAvailable(patientDir, finalized.id, existingTargets);
  }
  assertNoteReferencesExist(finalized, existingTargets);

  const dayDir = dayDirFromIso(patientDir, effectiveAt);
  const notesDir = path.join(dayDir, "notes");
  const hhmm = effectiveAt.slice(11, 16).replace(":", "");
  const idTail = finalized.id.split("_").pop() ?? "note";
  const filenameSlug = opts.slug ?? idTail;
  const target = path.join(notesDir, `${hhmm}_${filenameSlug}.md`);

  if (await fileExists(target)) {
    throw new Error(
      `note already exists at ${target} — chart is append-only; ` +
        `write a new note that links supersedes/corrects to the prior id`,
    );
  }

  return {
    frontmatter: finalized,
    target,
    dayDir,
    content: formatFrontmatterMarkdown(
      finalized as unknown as Record<string, unknown>,
      opts.body,
    ),
  };
}

async function persistNote(write: FinalizedNoteWrite): Promise<string> {
  await ensureDir(write.dayDir);
  await ensureDir(path.dirname(write.target));
  await atomicWriteFile(write.target, write.content);
  return write.target;
}

async function rollbackNoteOrThrow(
  notePath: string,
  originalError: unknown,
): Promise<never> {
  try {
    if (communicationNoteTestHooks.removeNoteFile) {
      await communicationNoteTestHooks.removeNoteFile(notePath);
    } else {
      await fs.unlink(notePath);
    }
  } catch (rollbackError) {
    throw new Error(
      `writeCommunicationNote failed: ${String(originalError)}; ` +
        `rollback failed: ${String(rollbackError)}`,
    );
  }
  throw originalError;
}

/** Probe `<patientRoot>/timeline/<day>/events.ndjson` for max NN given ymdHm. */
export async function nextEventId(opts: {
  scope: PatientScope;
  effectiveStart?: string;
}): Promise<string> {
  const patientDir = patientRoot(opts.scope);
  const eff = opts.effectiveStart ?? (await nowIsoForChart(patientDir));
  const ymdHm = ymdHmFromIso(eff);
  const dayPath = dayDirFromIso(patientDir, eff);
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
  const eff = opts.effectiveAt ?? nowIsoSeconds();
  const ymdHm = ymdHmFromIso(eff);
  return `note_${ymdHm}` + (opts.slug ? `_${opts.slug}` : "");
}

export async function appendEvent(
  event: EventInput,
  scope: PatientScope,
): Promise<string> {
  const finalized = await finalizeEventForWrite(event, scope);
  return persistEvent(finalized);
}

export interface WriteNoteOpts {
  frontmatter: NoteFrontmatterInput;
  body: string;
  scope: PatientScope;
  slug?: string;
}

export async function writeNote(opts: WriteNoteOpts): Promise<string> {
  throw new Error(
    "writeNote() is deprecated for sanctioned authoring; use writeCommunicationNote()",
  );
}

export interface WriteCommunicationNoteOpts extends WriteNoteOpts {
  communicationData?: Record<string, unknown>;
}

export async function writeCommunicationNote(
  opts: WriteCommunicationNoteOpts,
): Promise<{ notePath: string; eventId: string }> {
  const finalizedNote = await finalizeNoteForWrite(opts);
  const note = finalizedNote.frontmatter;
  const finalizedEvent = await finalizeEventForWrite(
    {
      type: "communication",
      subtype: note.subtype ?? "progress_note",
      subject: note.subject,
      encounter_id: note.encounter_id,
      effective_at: note.effective_at,
      author: note.author,
      source: note.source,
      certainty: "performed",
      status: note.status ?? "final",
      data: { note_ref: note.id, ...(opts.communicationData ?? {}) },
      links: { supports: [...note.references], supersedes: [] },
    },
    opts.scope,
    { allowStandaloneCommunicationEvent: true },
  );

  const notePath = await persistNote(finalizedNote);
  try {
    await communicationNoteTestHooks.afterNotePersisted?.(notePath);
    const eventId = await persistEvent(finalizedEvent);
    return { notePath, eventId };
  } catch (error) {
    return rollbackNoteOrThrow(notePath, error);
  }
}

export async function writeArtifactRef(opts: {
  artifactPath: string;
  kind: string;
  description: string;
  encounterId: string;
  subject: string;
  source: Source;
  effectiveAt?: string;
  scope: PatientScope;
  author?: Author;
}): Promise<string> {
  const patientDir = patientRoot(opts.scope);
  const event = {
    type: "artifact_ref" as const,
    subtype: opts.kind,
    subject: opts.subject,
    encounter_id: opts.encounterId,
    effective_at: opts.effectiveAt ?? (await nowIsoForChart(patientDir)),
    author: opts.author ?? { id: "pi-agent", role: "rn_agent" },
    source: opts.source,
    certainty: "observed" as const,
    status: "final" as const,
    data: {
      kind: opts.kind,
      path: opts.artifactPath,
      description: opts.description,
    },
    links: { supports: [], supersedes: [] },
  };
  return appendEvent(event, opts.scope);
}
