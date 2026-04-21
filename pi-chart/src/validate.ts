// Chart validator. Returns a structured ValidationReport.
//
// Scoped to one patient directory per call. Schemas live at the repo-level
// `<chartRoot>/schemas/`; patient data lives at
// `<chartRoot>/patients/<patientId>/`. The validator enforces the machine-
// checkable subset of the chart invariants. Invariants 6 and 7 landed here
// in Phase 1; 8 and 10 land in Phase 2.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ajvErrorsTo,
  loadValidator,
  normalizeForSchema,
} from "./schema.js";
import { resolveArtifactPath } from "./artifacts.js";
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
import { patientRoot } from "./types.js";
import type { PatientScope, ReportEntry, ValidationReport } from "./types.js";

interface State {
  errors: ReportEntry[];
  warnings: ReportEntry[];
  allIds: Map<string, string>;             // id -> first seen at
  noteIds: Set<string>;
  communicationNoteRefs: Set<string>;
  eventTypes: Map<string, string>;          // id -> type
  expectedSubject: string | null;
  chartRoot: string;                        // repo root (for schemas/)
  patientRoot: string;                      // patient dir (for data)
  patientId: string;
}

function err(s: State, where: string, message: string) {
  s.errors.push({ where, message });
}
function warn(s: State, where: string, message: string) {
  s.warnings.push({ where, message });
}

export async function validateChart(scope: PatientScope): Promise<ValidationReport> {
  const pr = patientRoot(scope);
  const state: State = {
    errors: [],
    warnings: [],
    allIds: new Map(),
    noteIds: new Set(),
    communicationNoteRefs: new Set(),
    eventTypes: new Map(),
    expectedSubject: null,
    chartRoot: scope.chartRoot,
    patientRoot: pr,
    patientId: scope.patientId,
  };

  // Invariant 6: the directory is the authoritative identity. Every
  // record in this tree — and chart.yaml itself — must carry subject =
  // scope.patientId. The directory name is trusted; chart.yaml.subject
  // is redundant metadata, so a mismatch between them is an error, not
  // a warning — otherwise a corrupted chart.yaml could silently accept
  // another patient's events.
  state.expectedSubject = scope.patientId;
  try {
    const meta = await loadChartMeta(pr);
    if (meta.subject && meta.subject !== scope.patientId) {
      err(
        state,
        "chart.yaml",
        `subject '${meta.subject}' does not match patient directory '${scope.patientId}' (invariant 6: chart.yaml is out of sync with directory identity)`,
      );
    } else if (!meta.subject) {
      err(state, "chart.yaml", "missing subject field (invariant 6)");
    }
  } catch {
    err(state, "chart.yaml", "missing or invalid — cannot establish directory identity (invariant 6)");
  }

  const eventValidator = await loadValidator(scope.chartRoot, "event.schema.json");
  let noteValidator: Awaited<ReturnType<typeof loadValidator>> | null = null;
  let constraintsValidator: Awaited<ReturnType<typeof loadValidator>> | null = null;
  let vitalsValidator: Awaited<ReturnType<typeof loadValidator>> | null = null;
  try {
    noteValidator = await loadValidator(scope.chartRoot, "note.schema.json");
  } catch { /* optional */ }
  try {
    constraintsValidator = await loadValidator(scope.chartRoot, "constraints.schema.json");
  } catch { /* optional */ }
  try {
    vitalsValidator = await loadValidator(scope.chartRoot, "vitals.schema.json");
  } catch { /* optional */ }

  // structural markdown
  for (const name of ["patient.md", "constraints.md"]) {
    const p = path.join(pr, name);
    const text = await readTextIfExists(p);
    if (text === null) {
      err(state, name, "missing");
      continue;
    }
    await validateStructuralMarkdown(state, p, text, eventValidator);
  }

  // structured constraints block
  if (constraintsValidator) {
    const text = await readTextIfExists(path.join(pr, "constraints.md"));
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
  const rel = path.relative(state.patientRoot, filePath);
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
  const normalized = normalizeForSchema(fm) as Record<string, unknown>;
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
      `subject '${normalized.subject}' does not match chart.yaml subject '${state.expectedSubject}' (invariant 6: patient isolation)`,
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
  const timelineRoot = path.join(state.patientRoot, "timeline");
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
        const [frontmatter] = parseFrontmatter(text);
        const normalizedFrontmatter = normalizeForSchema(frontmatter) as
          | Record<string, unknown>
          | null;
        if (
          typeof normalizedFrontmatter?.effective_at === "string" &&
          !normalizedFrontmatter.effective_at.startsWith(day)
        ) {
          warn(
            state,
            path.relative(state.patientRoot, enc),
            `effective_at '${normalizedFrontmatter.effective_at}' does not start with day directory prefix '${day}'`,
          );
        }
      }

    // events.ndjson
    const evPath = path.join(dayDir, "events.ndjson");
    try {
      for await (const [lineno, ev] of iterNdjson(evPath)) {
        const where = `${path.relative(state.patientRoot, evPath)}:${lineno}`;
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
            `subject '${ev.subject}' does not match chart.yaml subject '${state.expectedSubject}' (invariant 6: patient isolation)`,
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
        // Invariant 7 (session transparency): warn if author id looks like a
        // session template sentinel that leaked into agent-authored events.
        checkAuthorSentinel(state, where, ev?.author);
        if (ev.type === "communication") {
          const ref = ev?.data?.note_ref;
          if (typeof ref === "string") state.communicationNoteRefs.add(ref);
        }
      }
    } catch (e: any) {
      err(state, path.relative(state.patientRoot, evPath), `invalid JSON: ${e?.message ?? e}`);
    }

    // vitals.jsonl
    const vPath = path.join(dayDir, "vitals.jsonl");
    try {
      for await (const [lineno, v] of iterNdjson(vPath)) {
        const where = `${path.relative(state.patientRoot, vPath)}:${lineno}`;
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
            `subject '${v.subject}' does not match chart.yaml subject '${state.expectedSubject}' (invariant 6: patient isolation)`,
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
      err(state, path.relative(state.patientRoot, vPath), `invalid JSON: ${e?.message ?? e}`);
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
  const rel = path.relative(state.patientRoot, filePath);
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
  const normalized = normalizeForSchema(fm) as Record<string, unknown>;
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
      `subject '${normalized.subject}' does not match chart.yaml subject '${state.expectedSubject}' (invariant 6: patient isolation)`,
    );
  }
  checkAuthorSentinel(state, rel, normalized.author);
  if (!body.trim()) warn(state, rel, "note body is empty");
  const day = rel.split(path.sep)[1];
  if (
    typeof day === "string" &&
    typeof normalized.effective_at === "string" &&
    !normalized.effective_at.startsWith(day)
  ) {
    warn(
      state,
      rel,
      `effective_at '${normalized.effective_at}' does not start with day directory prefix '${day}'`,
    );
  }
  const nid = normalized.id;
  if (typeof nid === "string") {
    trackId(state, nid, rel);
    state.noteIds.add(nid);
  }
}

async function checkReferentialIntegrity(state: State) {
  // events: pass 1 collects envelopes so we can enforce invariants 8/10
  // after `state.allIds` and `state.eventTypes` are fully populated.
  const envelopes: Array<{ where: string; ev: any }> = [];
  for (const evPath of await globPerDayFile(state.patientRoot, "events.ndjson")) {
    try {
      for await (const [lineno, ev] of iterNdjson(evPath)) {
        const where = `${path.relative(state.patientRoot, evPath)}:${lineno}`;
        envelopes.push({ where, ev });
      }
    } catch {
      // schema-level error already reported
    }
  }

  for (const { where, ev } of envelopes) {
    const links = ev.links ?? {};
    const supports: unknown[] = links.supports ?? [];
    await checkSupportsTargets(state, where, supports);

    for (const fname of ["supersedes", "corrects"] as const) {
      for (const target of links[fname] ?? []) {
        if (typeof target !== "string") {
          err(state, where, `links.${fname}: non-string target`);
          continue;
        }
        if (!state.allIds.has(target)) {
          err(state, where, `links.${fname}: unknown target id '${target}' (invariant 6: cross-patient links rejected)`);
        }
      }
    }

    // Invariant 10: fulfillment typing.
    for (const target of links.fulfills ?? []) {
      if (typeof target !== "string") {
        err(state, where, "links.fulfills: non-string target");
        continue;
      }
      if (!state.allIds.has(target)) {
        err(state, where, `links.fulfills: unknown target id '${target}' (invariant 6: cross-patient links rejected)`);
        continue;
      }
      const ttype = state.eventTypes.get(target);
      if (ttype !== "intent") {
        err(
          state,
          where,
          `links.fulfills: target '${target}' is type '${ttype ?? "unknown"}'; must be 'intent' (invariant 10: fulfillment typing)`,
        );
      }
    }

    for (const target of links.addresses ?? []) {
      if (typeof target !== "string") {
        err(state, where, "links.addresses: non-string target");
        continue;
      }
      if (!state.allIds.has(target)) {
        err(state, where, `links.addresses: unknown target id '${target}' (invariant 6: cross-patient links rejected)`);
        continue;
      }
      const targetEv = findEventEnvelope(envelopes, target);
      const ttype = state.eventTypes.get(target);
      const isProblem =
        ttype === "assessment" &&
        typeof targetEv?.subtype === "string" &&
        targetEv.subtype === "problem";
      const isIntent = ttype === "intent";
      if (!isProblem && !isIntent) {
        err(
          state,
          where,
          `links.addresses: target '${target}' must be an assessment/problem or an intent (invariant 10: fulfillment typing)`,
        );
      }
    }

    if (ev.type === "communication") {
      const ref = ev?.data?.note_ref;
      if (typeof ref === "string" && !state.noteIds.has(ref)) {
        err(state, where, `data.note_ref: unknown note id '${ref}'`);
      }
    }
    if (ev.type === "artifact_ref") {
      const relPath = ev?.data?.path;
      if (typeof relPath !== "string") {
        err(state, where, "artifact_ref.data.path: missing string path");
      } else {
        try {
          resolveArtifactPath(state.patientRoot, relPath);
        } catch (error) {
          err(state, where, String(error));
        }
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

  // Invariant 8: supersession monotonicity. Build target→supersessor
  // index, detect multi-supersessor and cycles in both supersedes and
  // corrects.
  checkSupersessionChain(state, envelopes, "supersedes");
  checkSupersessionChain(state, envelopes, "corrects");

  // notes references
  for (const np of await globNotes(state.patientRoot)) {
    const text = await fs.readFile(np, "utf8");
    let fm: Record<string, unknown> | null = null;
    try {
      [fm] = parseFrontmatter(text);
    } catch {
      continue;
    }
    if (!fm) continue;
    const rel = path.relative(state.patientRoot, np);
    const refs = (fm.references as unknown[]) ?? [];
    for (const ref of refs) {
      if (typeof ref === "string" && !state.allIds.has(ref)) {
        err(state, rel, `references: unknown id '${ref}' (invariant 6: cross-patient references rejected)`);
      }
    }
  }
}

function findEventEnvelope(
  envelopes: Array<{ where: string; ev: any }>,
  id: string,
): any | null {
  for (const { ev } of envelopes) {
    if (ev?.id === id) return ev;
  }
  return null;
}

function checkSupersessionChain(
  state: State,
  envelopes: Array<{ where: string; ev: any }>,
  field: "supersedes" | "corrects",
) {
  const replacers = new Map<string, { by: string; where: string }[]>();
  for (const { where, ev } of envelopes) {
    const links = ev?.links ?? {};
    for (const target of links[field] ?? []) {
      if (typeof target !== "string") continue;
      if (!replacers.has(target)) replacers.set(target, []);
      replacers.get(target)!.push({ by: ev.id, where });
    }
  }

  // Multi-supersessor check (invariant 8): at most one supersessor per
  // target. Multiple concurrent supersessions can't be linearized into a
  // single "current" state, so reject.
  for (const [target, claims] of replacers) {
    if (claims.length > 1) {
      const ids = claims.map((c) => `'${c.by}'`).join(", ");
      err(
        state,
        claims[0].where,
        `${field}: target '${target}' has ${claims.length} ${field}-claims (${ids}); at most one permitted (invariant 8: supersession monotonicity)`,
      );
    }
  }

  // Cycle check (invariant 8): walk from each node following the
  // `field` edges and assert we never revisit the starting id.
  for (const { where, ev } of envelopes) {
    const start = ev?.id;
    if (typeof start !== "string") continue;
    const seen = new Set<string>();
    let cur: string | undefined = start;
    while (cur) {
      if (seen.has(cur)) {
        err(
          state,
          where,
          `${field}: cycle detected starting at '${start}' (invariant 8: supersession monotonicity)`,
        );
        break;
      }
      seen.add(cur);
      const node = findEventEnvelope(envelopes, cur);
      const next = node?.links?.[field];
      cur = Array.isArray(next) && typeof next[0] === "string" ? next[0] : undefined;
      if (cur === start) {
        err(
          state,
          where,
          `${field}: cycle detected starting at '${start}' (invariant 8: supersession monotonicity)`,
        );
        break;
      }
    }
  }
}

async function checkSupportsTargets(
  state: State,
  where: string,
  items: unknown[],
) {
  for (const raw of items) {
    if (typeof raw === "string") {
      await resolveSupportsString(state, where, raw);
      continue;
    }
    if (raw && typeof raw === "object") {
      await resolveSupportsObject(state, where, raw as Record<string, unknown>);
      continue;
    }
    err(state, where, `links.supports: unexpected item (${typeof raw})`);
  }
}

async function resolveSupportsString(
  state: State,
  where: string,
  target: string,
) {
  if (isVitalsUri(target)) {
    const ref = parseEvidenceRef(target);
    if (!ref || ref.kind !== "vitals") {
      err(state, where, `links.supports: malformed vitals URI '${target}'`);
      return;
    }
    const has = await vitalsWindowHasSamples(state.patientRoot, ref);
    if (!has) {
      err(state, where, `links.supports: vitals URI '${target}' matches no samples`);
    }
    return;
  }
  if (!state.allIds.has(target)) {
    err(state, where, `links.supports: unknown target id '${target}' (invariant 6: cross-patient links rejected)`);
  }
}

async function resolveSupportsObject(
  state: State,
  where: string,
  raw: Record<string, unknown>,
) {
  const kind = raw.kind;
  switch (kind) {
    case "event":
    case "note":
    case "artifact": {
      const id = raw.id;
      if (typeof id !== "string" || id.length === 0) {
        err(state, where, `links.supports[kind=${kind}]: missing id`);
        return;
      }
      if (!state.allIds.has(id)) {
        err(
          state,
          where,
          `links.supports[kind=${kind}]: unknown target id '${id}' (invariant 6: cross-patient links rejected)`,
        );
        return;
      }
      if (kind === "note" && !state.noteIds.has(id)) {
        err(state, where, `links.supports[kind=note]: id '${id}' is not a note`);
      }
      if (kind === "artifact") {
        const ttype = state.eventTypes.get(id);
        if (ttype && ttype !== "artifact_ref") {
          err(
            state,
            where,
            `links.supports[kind=artifact]: id '${id}' is type '${ttype}', expected 'artifact_ref'`,
          );
        }
      }
      return;
    }
    case "vitals": {
      const metric = raw.metric;
      const from = raw.from;
      const to = raw.to;
      if (
        typeof metric !== "string" ||
        typeof from !== "string" ||
        typeof to !== "string"
      ) {
        err(state, where, "links.supports[kind=vitals]: requires metric, from, to");
        return;
      }
      if (!Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to))) {
        err(state, where, "links.supports[kind=vitals]: invalid from/to timestamps");
        return;
      }
      if (Date.parse(from) > Date.parse(to)) {
        err(state, where, "links.supports[kind=vitals]: from is after to");
        return;
      }
      const encounterId =
        typeof raw.encounterId === "string" ? raw.encounterId : undefined;
      const has = await vitalsWindowHasSamples(state.patientRoot, {
        kind: "vitals",
        metric,
        from,
        to,
        ...(encounterId ? { encounterId } : {}),
      });
      if (!has) {
        err(
          state,
          where,
          `links.supports[kind=vitals]: metric '${metric}' has no samples in [${from}, ${to}]`,
        );
      }
      return;
    }
    default:
      err(state, where, `links.supports: unknown kind '${String(kind)}'`);
  }
}

async function vitalsWindowHasSamples(
  patientDir: string,
  ref: Extract<ReturnType<typeof parseEvidenceRef>, { kind: "vitals" }>,
): Promise<boolean> {
  const fromMs = Date.parse(ref.from);
  const toMs = Date.parse(ref.to);
  for (const p of await globPerDayFile(patientDir, "vitals.jsonl")) {
    for await (const [, v] of iterNdjson(p)) {
      if (ref.encounterId && v?.encounter_id !== ref.encounterId) continue;
      if (v?.name !== ref.metric) continue;
      const t = parseIso(v.sampled_at);
      if (!t) continue;
      const ts = t.getTime();
      if (ts >= fromMs && ts <= toMs) return true;
    }
  }
  return false;
}

function hasObservationEvidence(
  supports: unknown[],
  eventTypes: Map<string, string>,
): boolean {
  for (const raw of supports) {
    if (typeof raw === "string") {
      if (isVitalsUri(raw)) return true;
      const t = eventTypes.get(raw);
      if (t === "observation" || t === "artifact_ref") return true;
      continue;
    }
    if (raw && typeof raw === "object") {
      const kind = (raw as any).kind;
      if (kind === "vitals") return true;
      if (kind === "artifact") return true;
      if (kind === "event") {
        const id = (raw as any).id;
        if (typeof id === "string") {
          const t = eventTypes.get(id);
          if (t === "observation" || t === "artifact_ref") return true;
        }
      }
    }
  }
  return false;
}

async function checkDerivedNotEdited(state: State) {
  const derived = path.join(state.patientRoot, "_derived");
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
        path.relative(state.patientRoot, filePath),
        "derived file is missing 'generated by' marker; may have been hand-edited",
      );
    }
  }
}

/**
 * Invariant 7 watchdog. sessions/current.yaml is a convenience for humans;
 * it should never bleed into agent-authored events. Warn if an author id
 * looks like a placeholder likely to have slipped through unchecked.
 */
function checkAuthorSentinel(state: State, where: string, author: unknown) {
  if (!author || typeof author !== "object") return;
  const id = (author as any).id;
  if (typeof id !== "string") return;
  const sentinels = ["", "TODO", "todo", "unknown", "placeholder", "<fill-me>"];
  if (sentinels.includes(id)) {
    warn(
      state,
      where,
      `author.id '${id}' looks like a placeholder (invariant 7: session transparency)`,
    );
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
