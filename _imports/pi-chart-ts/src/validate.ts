// Chart validator. Returns a structured ValidationReport.
//
// Mirrors scripts/validate.py from the Python design reference. AJV's
// format-checker covers what the Python validator left to a future
// `FormatChecker` call.

import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import {
  ajvErrorsTo,
  loadValidator,
} from "./schema.js";
import {
  globEncounters,
  globNotes,
  globPerDayFile,
  iterNdjson,
  parseFrontmatter,
  readTextIfExists,
} from "./fs-util.js";
import { parseEvidenceRef, isVitalsUri } from "./evidence.js";
import { parseIso, loadChartMeta } from "./time.js";
import type { ReportEntry, ValidationReport } from "./types.js";

interface State {
  errors: ReportEntry[];
  warnings: ReportEntry[];
  allIds: Map<string, string>;             // id -> first seen at
  noteIds: Set<string>;
  communicationNoteRefs: Set<string>;
  eventTypes: Map<string, string>;          // id -> type
  expectedSubject: string | null;
  chartRoot: string;
}

function err(s: State, where: string, message: string) {
  s.errors.push({ where, message });
}
function warn(s: State, where: string, message: string) {
  s.warnings.push({ where, message });
}

export async function validateChart(chartRoot: string): Promise<ValidationReport> {
  const state: State = {
    errors: [],
    warnings: [],
    allIds: new Map(),
    noteIds: new Set(),
    communicationNoteRefs: new Set(),
    eventTypes: new Map(),
    expectedSubject: null,
    chartRoot,
  };

  // chart.yaml subject for subject-match
  try {
    const meta = await loadChartMeta(chartRoot);
    state.expectedSubject = meta.subject ?? null;
  } catch {
    warn(state, "chart.yaml", "missing or invalid — subject-match check skipped");
  }

  const eventValidator = await loadValidator(chartRoot, "event.schema.json");
  let noteValidator: Awaited<ReturnType<typeof loadValidator>> | null = null;
  let constraintsValidator: Awaited<ReturnType<typeof loadValidator>> | null = null;
  let vitalsValidator: Awaited<ReturnType<typeof loadValidator>> | null = null;
  try {
    noteValidator = await loadValidator(chartRoot, "note.schema.json");
  } catch { /* optional */ }
  try {
    constraintsValidator = await loadValidator(chartRoot, "constraints.schema.json");
  } catch { /* optional */ }
  try {
    vitalsValidator = await loadValidator(chartRoot, "vitals.schema.json");
  } catch { /* optional */ }

  // structural markdown
  for (const name of ["patient.md", "constraints.md"]) {
    const p = path.join(chartRoot, name);
    const text = await readTextIfExists(p);
    if (text === null) {
      err(state, name, "missing");
      continue;
    }
    await validateStructuralMarkdown(state, p, text, eventValidator);
  }

  // structured constraints block
  if (constraintsValidator) {
    const text = await readTextIfExists(path.join(chartRoot, "constraints.md"));
    if (text !== null) {
      let fm: Record<string, unknown> | null = null;
      try {
        [fm] = parseFrontmatter(text);
      } catch {
        // already reported
      }
      const block = fm?.constraints;
      if (block !== undefined) {
        const ok = constraintsValidator(block);
        if (!ok) {
          for (const e of constraintsValidator.errors ?? []) {
            err(
              state,
              "constraints.md",
              `constraints${e.instancePath || ""}: ${e.message ?? "validation error"}`,
            );
          }
        }
      }
    }
  }

  // timeline walk
  await validateTimeline(state, eventValidator, noteValidator, vitalsValidator);

  // referential integrity + assessment-evidence rule
  await checkReferentialIntegrity(state);

  // bidirectional note ↔ communication
  for (const nid of [...state.noteIds].sort()) {
    if (!state.communicationNoteRefs.has(nid)) {
      err(
        state,
        "notes",
        `note '${nid}' has no matching communication event ` +
          `(no events.ndjson row with data.note_ref == '${nid}')`,
      );
    }
  }

  // _derived/ hand-edit warning
  await checkDerivedNotEdited(state);

  return {
    ok: state.errors.length === 0,
    errors: state.errors,
    warnings: state.warnings,
  };
}

async function validateStructuralMarkdown(
  state: State,
  filePath: string,
  text: string,
  eventValidator: Awaited<ReturnType<typeof loadValidator>>,
) {
  const rel = path.relative(state.chartRoot, filePath);
  let fm: Record<string, unknown> | null = null;
  try {
    [fm] = parseFrontmatter(text);
  } catch (e: any) {
    err(state, rel, e?.message ?? String(e));
    return;
  }
  if (!fm) {
    err(state, rel, "no frontmatter block (expected leading ---)");
    return;
  }
  const normalized = normalizeYaml(fm);
  const ok = eventValidator(normalized);
  if (!ok) {
    state.errors.push(...ajvErrorsTo(rel, eventValidator.errors));
  }
  if (
    state.expectedSubject &&
    typeof normalized.subject === "string" &&
    normalized.subject !== state.expectedSubject
  ) {
    err(
      state,
      rel,
      `subject '${normalized.subject}' does not match chart.yaml subject '${state.expectedSubject}'`,
    );
  }
  const evid = normalized.id;
  if (typeof evid === "string") trackId(state, evid, rel);
}

async function validateTimeline(
  state: State,
  eventValidator: Awaited<ReturnType<typeof loadValidator>>,
  noteValidator: Awaited<ReturnType<typeof loadValidator>> | null,
  vitalsValidator: Awaited<ReturnType<typeof loadValidator>> | null,
) {
  const timelineRoot = path.join(state.chartRoot, "timeline");
  let dayEntries: string[];
  try {
    dayEntries = await fs.readdir(timelineRoot);
  } catch {
    warn(state, "timeline/", "no timeline directory yet");
    return;
  }
  for (const day of dayEntries.sort()) {
    const dayDir = path.join(timelineRoot, day);
    const stat = await fs.stat(dayDir);
    if (!stat.isDirectory()) continue;

    // encounter headers
    for (const enc of await listEncounters(dayDir)) {
      const text = await fs.readFile(enc, "utf8");
      await validateStructuralMarkdown(state, enc, text, eventValidator);
    }

    // events.ndjson
    const evPath = path.join(dayDir, "events.ndjson");
    try {
      for await (const [lineno, ev] of iterNdjson(evPath)) {
        const where = `${path.relative(state.chartRoot, evPath)}:${lineno}`;
        const ok = eventValidator(ev);
        if (!ok) state.errors.push(...ajvErrorsTo(where, eventValidator.errors));
        if (typeof ev.id === "string") {
          trackId(state, ev.id, where);
          if (typeof ev.type === "string") state.eventTypes.set(ev.id, ev.type);
        }
        if (
          state.expectedSubject &&
          typeof ev.subject === "string" &&
          ev.subject !== state.expectedSubject
        ) {
          err(
            state,
            where,
            `subject '${ev.subject}' does not match chart.yaml subject '${state.expectedSubject}'`,
          );
        }
        if (
          typeof ev.effective_at === "string" &&
          !ev.effective_at.startsWith(day)
        ) {
          warn(
            state,
            where,
            `effective_at '${ev.effective_at}' does not start with day directory prefix '${day}'`,
          );
        }
        if (ev.type === "communication") {
          const ref = ev?.data?.note_ref;
          if (typeof ref === "string") state.communicationNoteRefs.add(ref);
        }
      }
    } catch (e: any) {
      err(state, path.relative(state.chartRoot, evPath), `invalid JSON: ${e?.message ?? e}`);
    }

    // vitals.jsonl
    const vPath = path.join(dayDir, "vitals.jsonl");
    try {
      for await (const [lineno, v] of iterNdjson(vPath)) {
        const where = `${path.relative(state.chartRoot, vPath)}:${lineno}`;
        if (vitalsValidator) {
          const ok = vitalsValidator(v);
          if (!ok) state.errors.push(...ajvErrorsTo(where, vitalsValidator.errors));
        }
        if (
          state.expectedSubject &&
          typeof v.subject === "string" &&
          v.subject !== state.expectedSubject
        ) {
          err(
            state,
            where,
            `subject '${v.subject}' does not match chart.yaml subject '${state.expectedSubject}'`,
          );
        }
        if (typeof v.sampled_at === "string" && !v.sampled_at.startsWith(day)) {
          warn(
            state,
            where,
            `sampled_at '${v.sampled_at}' does not start with day directory prefix '${day}'`,
          );
        }
      }
    } catch (e: any) {
      err(state, path.relative(state.chartRoot, vPath), `invalid JSON: ${e?.message ?? e}`);
    }

    // notes
    if (noteValidator) {
      for (const notePath of await listNotes(dayDir)) {
        await validateNote(state, notePath, noteValidator);
      }
    }
  }
}

async function validateNote(
  state: State,
  filePath: string,
  noteValidator: Awaited<ReturnType<typeof loadValidator>>,
) {
  const rel = path.relative(state.chartRoot, filePath);
  let text: string;
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch (e: any) {
    err(state, rel, e?.message ?? String(e));
    return;
  }
  let fm: Record<string, unknown> | null = null;
  let body = "";
  try {
    [fm, body] = parseFrontmatter(text);
  } catch (e: any) {
    err(state, rel, e?.message ?? String(e));
    return;
  }
  if (!fm) {
    err(state, rel, "no frontmatter block");
    return;
  }
  const normalized = normalizeYaml(fm);
  const ok = noteValidator(normalized);
  if (!ok) state.errors.push(...ajvErrorsTo(rel, noteValidator.errors));

  if (
    state.expectedSubject &&
    typeof normalized.subject === "string" &&
    normalized.subject !== state.expectedSubject
  ) {
    err(
      state,
      rel,
      `subject '${normalized.subject}' does not match chart.yaml subject '${state.expectedSubject}'`,
    );
  }
  if (!body.trim()) warn(state, rel, "note body is empty");
  const nid = normalized.id;
  if (typeof nid === "string") {
    trackId(state, nid, rel);
    state.noteIds.add(nid);
  }
}

async function checkReferentialIntegrity(state: State) {
  // events
  for (const evPath of await globPerDayFile(state.chartRoot, "events.ndjson")) {
    try {
      for await (const [lineno, ev] of iterNdjson(evPath)) {
        const where = `${path.relative(state.chartRoot, evPath)}:${lineno}`;
        const links = ev.links ?? {};
        const supports: string[] = links.supports ?? [];
        await checkLinkTargets(state, where, "supports", supports);
        for (const fname of ["supersedes", "corrects"] as const) {
          for (const target of links[fname] ?? []) {
            if (!state.allIds.has(target)) {
              err(state, where, `links.${fname}: unknown target id '${target}'`);
            }
          }
        }
        if (ev.type === "communication") {
          const ref = ev?.data?.note_ref;
          if (typeof ref === "string" && !state.noteIds.has(ref)) {
            err(state, where, `data.note_ref: unknown note id '${ref}'`);
          }
        }
        if (ev.type === "assessment") {
          if (!hasObservationEvidence(supports, state.eventTypes)) {
            err(
              state,
              where,
              "assessment links.supports must include at least one " +
                "observation event, vitals:// URI, or artifact_ref event",
            );
          }
        }
      }
    } catch {
      // already reported
    }
  }
  // notes references
  for (const np of await globNotes(state.chartRoot)) {
    const text = await fs.readFile(np, "utf8");
    let fm: Record<string, unknown> | null = null;
    try {
      [fm] = parseFrontmatter(text);
    } catch {
      continue;
    }
    if (!fm) continue;
    const rel = path.relative(state.chartRoot, np);
    const refs = (fm.references as unknown[]) ?? [];
    for (const ref of refs) {
      if (typeof ref === "string" && !state.allIds.has(ref)) {
        err(state, rel, `references: unknown id '${ref}'`);
      }
    }
  }
}

async function checkLinkTargets(
  state: State,
  where: string,
  field: string,
  items: unknown[],
) {
  for (const target of items) {
    if (typeof target !== "string") {
      err(state, where, `links.${field}: non-string target`);
      continue;
    }
    if (isVitalsUri(target)) {
      const ev = parseEvidenceRef(target);
      if (!ev || ev.kind !== "vitals_interval") {
        err(state, where, `links.${field}: malformed vitals URI '${target}'`);
        continue;
      }
      const has = await vitalsWindowHasSamples(state.chartRoot, ev);
      if (!has) {
        err(
          state,
          where,
          `links.${field}: vitals URI '${target}' matches no samples`,
        );
      }
      continue;
    }
    if (!state.allIds.has(target)) {
      err(state, where, `links.${field}: unknown target id '${target}'`);
    }
  }
}

async function vitalsWindowHasSamples(
  chartRoot: string,
  ev: Extract<ReturnType<typeof parseEvidenceRef>, { kind: "vitals_interval" }>,
): Promise<boolean> {
  for (const p of await globPerDayFile(chartRoot, "vitals.jsonl")) {
    for await (const [, v] of iterNdjson(p)) {
      if (v?.encounter_id !== ev.encounterId) continue;
      if (v?.name !== ev.name) continue;
      const t = parseIso(v.sampled_at);
      if (!t) continue;
      if (t >= ev.from && t <= ev.to) return true;
    }
  }
  return false;
}

function hasObservationEvidence(
  supports: string[],
  eventTypes: Map<string, string>,
): boolean {
  for (const s of supports) {
    if (typeof s !== "string") continue;
    if (isVitalsUri(s)) return true;
    const t = eventTypes.get(s);
    if (t === "observation" || t === "artifact_ref") return true;
  }
  return false;
}

async function checkDerivedNotEdited(state: State) {
  const derived = path.join(state.chartRoot, "_derived");
  let entries: string[];
  try {
    entries = await fs.readdir(derived);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "README.md") continue;
    const filePath = path.join(derived, name);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) continue;
    const text = await fs.readFile(filePath, "utf8");
    if (!text.toLowerCase().includes("generated by")) {
      warn(
        state,
        path.relative(state.chartRoot, filePath),
        "derived file is missing 'generated by' marker; may have been hand-edited",
      );
    }
  }
}

function trackId(state: State, id: string, where: string) {
  const prior = state.allIds.get(id);
  if (prior) {
    err(state, where, `duplicate id '${id}' (first seen at ${prior})`);
    return;
  }
  state.allIds.set(id, where);
}

/**
 * js-yaml parses ISO 8601 strings into Date objects automatically. AJV
 * (with ajv-formats) wants strings for `format: date-time`, so normalize
 * Dates back to ISO strings before validating frontmatter.
 */
function normalizeYaml(obj: any): any {
  if (obj instanceof Date) {
    // Prefer second-precision ISO with offset.
    return obj.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  if (Array.isArray(obj)) return obj.map(normalizeYaml);
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = normalizeYaml(v);
    return out;
  }
  return obj;
}

async function listEncounters(dayDir: string): Promise<string[]> {
  const entries = await fs.readdir(dayDir);
  return entries
    .filter((f) => f.startsWith("encounter_") && f.endsWith(".md"))
    .sort()
    .map((f) => path.join(dayDir, f));
}

async function listNotes(dayDir: string): Promise<string[]> {
  const notesDir = path.join(dayDir, "notes");
  try {
    const entries = await fs.readdir(notesDir);
    return entries
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => path.join(notesDir, f));
  } catch {
    return [];
  }
}
