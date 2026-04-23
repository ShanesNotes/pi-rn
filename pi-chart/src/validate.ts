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
import {
  expandVitalsWindowRef,
  isVitalsUri,
  parseEvidenceRef,
} from "./evidence.js";
import {
  eventCoversAsOf,
  eventStartIso,
  eventStartMs,
  loadChartMeta,
  parseIso,
} from "./time.js";
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

type StatusRule = {
  allowed: readonly string[];
  terminal: readonly string[];
  transitions: Readonly<Record<string, readonly string[]>>;
};

const SOURCE_KIND_CANONICAL = new Set([
  "patient_statement",
  "admission_intake",
  "nurse_charted",
  "clinician_chart_action",
  "protocol_standing_order",
  "manual_lab_entry",
  "monitor_extension",
  "poc_device",
  "lab_analyzer",
  "lab_interface_hl7",
  "pacs_interface",
  "dictation_system",
  "pathology_lis",
  "cardiology_reporting",
  "endoscopy_reporting",
  "agent_inference",
  "agent_bedside_observation",
  "agent_action",
  "agent_synthesis",
  "agent_reasoning",
  "agent_review",
  "synthea_import",
  "mimic_iv_import",
  "manual_scenario",
]);

// Import-family source.kind values per DESIGN §1.1.
// Subset of SOURCE_KIND_CANONICAL consumed by V-TRANSFORM-01.
// manual_scenario is intentionally excluded: it is fixture provenance, not machine import provenance.
const IMPORT_SOURCE_KINDS = new Set<string>([
  "synthea_import",
  "mimic_iv_import",
]);

const DEPRECATED_SOURCE_KIND_MIGRATIONS: Readonly<Record<string, string>> = {
  agent_reasoning: "agent_inference",
};

const IMPORT_SOURCE_REQUIRED_FIELDS: Readonly<Record<string, readonly string[]>> = {
  synthea_import: ["generator_version", "seed", "original_time", "rebase_delta_ms"],
  mimic_iv_import: [
    "table",
    "subject_id",
    "hadm_id",
    "row_id",
    "original_time",
    "rebase_delta_ms",
  ],
};

const INTERVAL_ALLOWED = new Set([
  "intent:monitoring_plan",
  "intent:care_plan",
  "action:administration",
  "observation:device_reading",
  "observation:context_segment",
]);

const OPEN_INTERVAL_ALLOWED = new Set([
  "intent:monitoring_plan",
  "intent:care_plan",
  "action:administration",
  "observation:device_reading",
  "observation:context_segment",
]);

const ACQUISITION_ACTION_SUBTYPES = new Set([
  "specimen_collection",
  "imaging_acquired",
  "procedure_performed",
  "measurement",
]);

const RESULT_OBSERVATION_SUBTYPES = new Set([
  "lab_result",
  "diagnostic_result",
]);

const EVIDENCE_DERIVED_FROM_MAX_DEPTH = 8;

const STATUS_RULES: Readonly<Record<string, StatusRule>> = {
  "intent:order": {
    allowed: ["pending", "active", "on_hold", "cancelled", "completed", "failed", "declined"],
    terminal: ["cancelled", "completed", "failed", "declined"],
    transitions: {
      pending: ["active", "on_hold", "cancelled", "completed", "failed", "declined"],
      active: ["on_hold", "cancelled", "completed", "failed", "declined"],
      on_hold: ["active", "cancelled", "completed", "failed", "declined"],
      cancelled: [],
      completed: [],
      failed: [],
      declined: [],
    },
  },
  "intent:care_plan": {
    allowed: ["pending", "active", "on_hold", "completed", "failed", "cancelled"],
    terminal: ["completed", "failed", "cancelled"],
    transitions: {
      pending: ["active", "on_hold", "completed", "failed", "cancelled"],
      active: ["on_hold", "completed", "failed", "cancelled"],
      on_hold: ["active", "completed", "failed", "cancelled"],
      completed: [],
      failed: [],
      cancelled: [],
    },
  },
  "intent:monitoring_plan": {
    allowed: ["pending", "active", "on_hold", "completed", "failed", "cancelled"],
    terminal: ["completed", "failed", "cancelled"],
    transitions: {
      pending: ["active", "on_hold", "completed", "failed", "cancelled"],
      active: ["on_hold", "completed", "failed", "cancelled"],
      on_hold: ["active", "completed", "failed", "cancelled"],
      completed: [],
      failed: [],
      cancelled: [],
    },
  },
  "action:administration": {
    allowed: ["performed", "held", "refused", "failed", "deferred"],
    terminal: ["performed", "held", "refused", "failed", "deferred"],
    transitions: {
      performed: [],
      held: [],
      refused: [],
      failed: [],
      deferred: [],
    },
  },
  "action:result_review": {
    allowed: ["acknowledged", "deferred"],
    terminal: ["acknowledged", "deferred"],
    transitions: {
      acknowledged: [],
      deferred: [],
    },
  },
  "observation:lab_result": {
    allowed: ["preliminary", "final", "corrected", "amended", "addendum", "cancelled"],
    terminal: ["final", "corrected", "amended", "addendum", "cancelled"],
    transitions: {
      preliminary: ["final", "corrected", "amended", "addendum", "cancelled"],
      final: ["corrected", "amended", "addendum"],
      corrected: ["amended", "addendum"],
      amended: ["addendum"],
      addendum: [],
      cancelled: [],
    },
  },
  "observation:diagnostic_result": {
    allowed: ["preliminary", "final", "corrected", "amended", "addendum", "cancelled"],
    terminal: ["final", "corrected", "amended", "addendum", "cancelled"],
    transitions: {
      preliminary: ["final", "corrected", "amended", "addendum", "cancelled"],
      final: ["corrected", "amended", "addendum"],
      corrected: ["amended", "addendum"],
      amended: ["addendum"],
      addendum: [],
      cancelled: [],
    },
  },
  "communication:*": {
    allowed: ["sent", "acknowledged", "timeout", "failed"],
    terminal: ["sent", "acknowledged", "timeout", "failed"],
    transitions: {
      sent: ["acknowledged", "timeout", "failed"],
      acknowledged: [],
      timeout: [],
      failed: [],
    },
  },
  "assessment:problem": {
    allowed: ["active", "resolved", "inactive", "ruled_out"],
    terminal: ["resolved", "inactive", "ruled_out"],
    transitions: {
      active: ["resolved", "inactive", "ruled_out"],
      resolved: [],
      inactive: [],
      ruled_out: [],
    },
  },
};

function ruleErr(state: State, where: string, code: string, message: string) {
  err(state, where, `${code}: ${message}`);
}

function ruleWarn(state: State, where: string, code: string, message: string) {
  warn(state, where, `${code}: ${message}`);
}

function eventKindKey(ev: any): string {
  return `${String(ev?.type ?? "")}:${String(ev?.subtype ?? "")}`;
}

function getStatusRule(ev: any): StatusRule | null {
  if (ev?.type === "communication") return STATUS_RULES["communication:*"] ?? null;
  return STATUS_RULES[eventKindKey(ev)] ?? null;
}

function validateSourceKind(state: State, where: string, ev: any) {
  const kind = ev?.source?.kind;
  if (typeof kind !== "string") return;
  if (!SOURCE_KIND_CANONICAL.has(kind)) {
    ruleWarn(
      state,
      where,
      "V-SRC-01",
      `source.kind '${kind}' is not in the DESIGN §1.1 canonical registry`,
    );
  }
  const replacement = DEPRECATED_SOURCE_KIND_MIGRATIONS[kind];
  if (replacement) {
    ruleWarn(
      state,
      where,
      "V-SRC-02",
      `source.kind '${kind}' is deprecated; use '${replacement}'`,
    );
  }
  const required = IMPORT_SOURCE_REQUIRED_FIELDS[kind];
  if (!required) return;
  const missing = required.filter(
    (field) => ev?.source?.[field] === undefined || ev?.source?.[field] === null,
  );
  if (missing.length) {
    ruleErr(
      state,
      where,
      "V-SRC-03",
      `import source.kind '${kind}' is missing required source fields: ${missing.join(", ")} (invariant 9: structured import provenance)`,
    );
  }
}

function validateTimeSemantics(state: State, where: string, ev: any) {
  const recordedAt = parseIso(ev?.recorded_at);
  const effectiveStartIso = eventStartIso(ev);
  const effectiveStart = parseIso(effectiveStartIso);
  if (!recordedAt || !effectiveStart || !effectiveStartIso) return;

  if (ev?.type !== "intent") {
    if (recordedAt.getTime() < effectiveStart.getTime()) {
      ruleErr(
        state,
        where,
        "V-TIME-01",
        `recorded_at '${ev.recorded_at}' is earlier than event start '${effectiveStartIso}'`,
      );
    }
  } else if (recordedAt.getTime() < effectiveStart.getTime() && !ev?.effective_period) {
    const dueByRaw = ev?.data?.due_by;
    const dueBy = parseIso(dueByRaw);
    if (!dueBy) {
      ruleErr(
        state,
        where,
        "V-TIME-02",
        `future-dated point intent '${effectiveStartIso}' requires data.due_by`,
      );
    } else if (dueBy.getTime() < effectiveStart.getTime()) {
      ruleErr(
        state,
        where,
        "V-TIME-02",
        `data.due_by '${dueByRaw}' is earlier than future effective_at '${effectiveStartIso}'`,
      );
    }
  }

  if (ev?.type !== "observation") return;
  const resultedAt = parseIso(ev?.data?.resulted_at);
  const verifiedAt = parseIso(ev?.data?.verified_at);
  if (resultedAt && resultedAt.getTime() < effectiveStart.getTime()) {
    ruleWarn(
      state,
      where,
      "V-TIME-03",
      `data.resulted_at '${ev.data.resulted_at}' is earlier than event start '${effectiveStartIso}'`,
    );
  }
  if (verifiedAt && verifiedAt.getTime() < effectiveStart.getTime()) {
    ruleWarn(
      state,
      where,
      "V-TIME-03",
      `data.verified_at '${ev.data.verified_at}' is earlier than event start '${effectiveStartIso}'`,
    );
  }
  if (resultedAt && verifiedAt && resultedAt.getTime() > verifiedAt.getTime()) {
    ruleWarn(
      state,
      where,
      "V-TIME-03",
      `data.resulted_at '${ev.data.resulted_at}' is later than data.verified_at '${ev.data.verified_at}'`,
    );
  }
}

function validateIntervalSemantics(state: State, where: string, ev: any) {
  const hasEffectiveAt = typeof ev?.effective_at === "string";
  const hasEffectivePeriod = !!ev?.effective_period && typeof ev.effective_period === "object";
  if (hasEffectiveAt === hasEffectivePeriod) {
    ruleErr(
      state,
      where,
      "V-INTERVAL-01",
      "provide exactly one of effective_at or effective_period",
    );
  }

  if (hasEffectivePeriod) {
    const key = eventKindKey(ev);
    if (!INTERVAL_ALLOWED.has(key)) {
      ruleErr(
        state,
        where,
        "V-INTERVAL-02",
        `effective_period is not permitted on ${key || String(ev?.type ?? "unknown")}`,
      );
    }
    const start = parseIso(ev?.effective_period?.start);
    const end = parseIso(ev?.effective_period?.end);
    if (start && end && start.getTime() > end.getTime()) {
      ruleErr(
        state,
        where,
        "V-INTERVAL-03",
        `effective_period.start '${ev.effective_period.start}' is later than end '${ev.effective_period.end}'`,
      );
    }
    if (!ev?.effective_period?.end && !OPEN_INTERVAL_ALLOWED.has(key)) {
      ruleErr(
        state,
        where,
        "V-INTERVAL-02",
        `open effective_period is not permitted on ${key || String(ev?.type ?? "unknown")}`,
      );
    }
    return;
  }

  if (typeof ev?.data?.closes === "string") {
    ruleErr(
      state,
      where,
      "V-INTERVAL-04",
      "point events may not claim to close another event's interval via data.closes",
    );
  }
  if (typeof ev?.data?.event === "string" && ev.data.event.toLowerCase() === "stop") {
    ruleErr(
      state,
      where,
      "V-INTERVAL-04",
      "stop-event closure is not permitted; close intervals by superseding them with a new interval event",
    );
  }
}

function validateStatusDetailSemantics(state: State, where: string, ev: any) {
  const detail = ev?.data?.status_detail;
  const hasDetail = detail !== undefined && detail !== null;
  const rule = getStatusRule(ev);

  if ((ev?.status === "entered_in_error" || ev?.status === "superseded") && hasDetail) {
    ruleErr(
      state,
      where,
      "V-STATUS-02",
      `status '${ev.status}' forbids data.status_detail`,
    );
    return;
  }

  if (!hasDetail) {
    if (rule && ev?.status === "final") {
      ruleErr(
        state,
        where,
        "V-STATUS-02",
        `status 'final' requires terminal data.status_detail for ${ev?.type}:${ev?.subtype ?? "*"}`,
      );
    }
    return;
  }

  if (typeof detail !== "string") {
    ruleErr(state, where, "V-STATUS-01", "data.status_detail must be a string when present");
    return;
  }
  if (!rule) {
    ruleErr(
      state,
      where,
      "V-STATUS-01",
      `data.status_detail is not allowed on ${ev?.type}:${ev?.subtype ?? "*"}`,
    );
    return;
  }
  if (!rule.allowed.includes(detail)) {
    ruleErr(
      state,
      where,
      "V-STATUS-01",
      `data.status_detail '${detail}' is not allowed on ${ev?.type}:${ev?.subtype ?? "*"}`,
    );
    return;
  }
  if (ev?.status === "final" && !rule.terminal.includes(detail)) {
    ruleErr(
      state,
      where,
      "V-STATUS-02",
      `status 'final' requires terminal data.status_detail for ${ev?.type}:${ev?.subtype ?? "*"}`,
    );
  }
  if (ev?.status === "active" && rule.terminal.includes(detail)) {
    ruleErr(
      state,
      where,
      "V-STATUS-02",
      `status 'active' cannot carry terminal data.status_detail '${detail}'`,
    );
  }
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
  if (typeof normalized.id === "string" && typeof normalized.type === "string") {
    state.eventTypes.set(normalized.id, normalized.type);
  }
  validateSourceKind(state, rel, normalized);
  validateTimeSemantics(state, rel, normalized);
  validateIntervalSemantics(state, rel, normalized);
  validateStatusDetailSemantics(state, rel, normalized);
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
        const effectiveStart = eventStartIso(ev);
        if (typeof effectiveStart === "string" && !effectiveStart.startsWith(day)) {
          warn(
            state,
            where,
            `event start '${effectiveStart}' does not start with day directory prefix '${day}'`,
          );
        }
        // Invariant 7 (session transparency): warn if author id looks like a
        // session template sentinel that leaked into agent-authored events.
        checkAuthorSentinel(state, where, ev?.author);
        validateSourceKind(state, where, ev);
        validateTimeSemantics(state, where, ev);
        validateIntervalSemantics(state, where, ev);
        validateStatusDetailSemantics(state, where, ev);
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
  const envelopesById = new Map<string, any>();
  for (const evPath of await globPerDayFile(state.patientRoot, "events.ndjson")) {
    try {
      for await (const [lineno, ev] of iterNdjson(evPath)) {
        const where = `${path.relative(state.patientRoot, evPath)}:${lineno}`;
        envelopes.push({ where, ev });
        if (typeof ev?.id === "string") envelopesById.set(ev.id, ev);
      }
    } catch {
      // schema-level error already reported
    }
  }

  for (const { where, ev } of envelopes) {
    const links = ev.links ?? {};
    const supports: unknown[] = links.supports ?? [];
    await checkSupportsTargets(state, where, supports);
    validateEvidenceRules(state, where, ev, supports);
    await validateTransformRules(state, where, ev);

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

    validateStatusTransitions(state, where, ev, envelopesById);
    validateIntervalClosure(state, where, ev, envelopesById);

    // Invariant 10 / ADR 003: fulfillment typing.
    if ((links.fulfills ?? []).length && ev.type !== "action") {
      ruleErr(
        state,
        where,
        "V-FULFILL-01",
        `links.fulfills is only permitted on action events, not type '${ev.type ?? "unknown"}' (invariant 10: fulfillment typing)`,
      );
    }
    for (const target of links.fulfills ?? []) {
      if (typeof target !== "string") {
        ruleErr(state, where, "V-FULFILL-01", "links.fulfills: non-string target");
        continue;
      }
      if (!state.allIds.has(target)) {
        ruleErr(
          state,
          where,
          "V-FULFILL-01",
          `links.fulfills: unknown target id '${target}' (invariant 6: cross-patient links rejected)`,
        );
        continue;
      }
      const ttype = state.eventTypes.get(target);
      if (ttype !== "intent") {
        ruleErr(
          state,
          where,
          "V-FULFILL-01",
          `links.fulfills: target '${target}' is type '${ttype ?? "unknown"}'; must be 'intent' (invariant 10: fulfillment typing)`,
        );
      }
    }

    validateAcquisitionAction(state, where, ev, envelopesById);
    validateResultObservationFulfillment(state, where, ev, envelopesById);

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
      if (!isProblem) {
        err(
          state,
          where,
          `links.addresses: target '${target}' must be an assessment/problem (invariant 10: fulfillment typing)`,
        );
      }
    }

    validateContradictsRules(state, where, ev, envelopes, envelopesById);
    validateResolvesRules(state, where, ev, envelopes, envelopesById);

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

function validateStatusTransitions(
  state: State,
  where: string,
  ev: any,
  envelopesById: Map<string, any>,
) {
  const rule = getStatusRule(ev);
  if (!rule) return;
  const nextDetail = ev?.data?.status_detail;
  if (typeof nextDetail !== "string") return;
  for (const target of ev?.links?.supersedes ?? []) {
    if (typeof target !== "string") continue;
    if ((ev?.links?.corrects ?? []).includes(target)) continue;
    const prior = envelopesById.get(target);
    if (!prior) continue;
    if (prior?.type !== ev?.type || prior?.subtype !== ev?.subtype) continue;
    const priorDetail = prior?.data?.status_detail;
    if (typeof priorDetail !== "string") continue;
    const allowedNext = rule.transitions[priorDetail];
    if (allowedNext && !allowedNext.includes(nextDetail)) {
      ruleErr(
        state,
        where,
        "V-STATUS-03",
        `${ev.type}:${ev.subtype ?? "*"} may not transition data.status_detail '${priorDetail}' -> '${nextDetail}' via supersedes`,
      );
    }
  }
}

function validateIntervalClosure(
  state: State,
  where: string,
  ev: any,
  envelopesById: Map<string, any>,
) {
  if (ev?.effective_period) return;
  for (const target of ev?.links?.supersedes ?? []) {
    if (typeof target !== "string") continue;
    const prior = envelopesById.get(target);
    if (!prior?.effective_period) continue;
    ruleErr(
      state,
      where,
      "V-INTERVAL-04",
      `point event '${ev.id ?? "unknown"}' may not supersede interval '${target}' to close it; closure must be via a new interval event`,
    );
  }
}

function validateEvidenceRules(
  state: State,
  where: string,
  ev: any,
  supports: unknown[],
) {
  const sourceKind = typeof ev?.source?.kind === "string" ? ev.source.kind : null;
  const requiresObjectEvidenceRef =
    ev?.type === "assessment" &&
    ev?.certainty === "inferred" &&
    !!sourceKind &&
    SOURCE_KIND_CANONICAL.has(sourceKind) &&
    sourceKind.startsWith("agent_");

  let primaryCount = 0;
  for (const [index, raw] of supports.entries()) {
    if (typeof raw === "string") {
      if (requiresObjectEvidenceRef) {
        ruleWarn(
          state,
          where,
          "V-EVIDENCE-01",
          `agent-inferred assessment must use object-form EvidenceRef; got bare string at supports[${index}]: ${raw}.`,
        );
      }
      continue;
    }
    if (!raw || typeof raw !== "object") continue;

    const ref = parseEvidenceRef(raw);
    if (!ref) continue;

    if (ref.role === "primary") primaryCount += 1;
    validateDerivedFromChain(state, where, ref, 0, new Set<string>());
  }

  if (primaryCount > 1) {
    ruleErr(
      state,
      where,
      "V-EVIDENCE-02",
      `multiple role:primary entries in supports (found ${primaryCount}); split into separate assessments.`,
    );
  }
}

async function validateTransformRules(
  state: State,
  where: string,
  ev: any,
) {
  const transform = ev?.transform;
  if (!transform || typeof transform !== "object" || Array.isArray(transform)) return;

  const activity = transform.activity;
  const sourceKind = typeof ev?.source?.kind === "string" ? ev.source.kind : "unknown";
  if ((activity === "import" || activity === "normalize") && !IMPORT_SOURCE_KINDS.has(sourceKind)) {
    ruleErr(
      state,
      where,
      "V-TRANSFORM-01",
      `transform.activity=${activity} requires import-family source.kind; got source.kind=${sourceKind}.`,
    );
  }

  const inputRefs: unknown[] = Array.isArray(transform.input_refs) ? transform.input_refs : [];
  for (const [index, raw] of inputRefs.entries()) {
    await validateTransformInputRef(state, where, raw, index);
  }
}

function validateContradictsRules(
  state: State,
  where: string,
  ev: any,
  envelopes: Array<{ where: string; ev: any }>,
  envelopesById: Map<string, any>,
) {
  const contradicts = Array.isArray(ev?.links?.contradicts) ? ev.links.contradicts : [];
  if (contradicts.length === 0) return;

  const corrects = new Set(
    Array.isArray(ev?.links?.corrects)
      ? ev.links.corrects.filter((target: unknown): target is string => typeof target === "string")
      : [],
  );
  const sourceRecordedAt = Date.parse(String(ev?.recorded_at ?? ""));

  for (const raw of contradicts) {
    const targetRef = contradictsTargetRef(raw);
    if (!targetRef) continue;

    const target = envelopesById.get(targetRef);
    if (!target) {
      ruleErr(
        state,
        where,
        "V-CONTRA-01",
        `contradicts.ref out-of-patient or nonexistent: ${targetRef}.`,
      );
      continue;
    }

    if (corrects.has(targetRef)) {
      ruleErr(
        state,
        where,
        "V-CONTRA-02",
        `contradicts and corrects target same event: ${targetRef}.`,
      );
    }

    const targetRecordedAt = Date.parse(String(target?.recorded_at ?? ""));
    if (!Number.isFinite(sourceRecordedAt) || !Number.isFinite(targetRecordedAt) || targetRecordedAt >= sourceRecordedAt) {
      ruleErr(
        state,
        where,
        "V-CONTRA-03",
        `contradicts.ref newer than source event: ${targetRef}.`,
      );
    }

    for (const superseding of envelopes) {
      const supersedes = Array.isArray(superseding.ev?.links?.supersedes) ? superseding.ev.links.supersedes : [];
      if (!supersedes.includes(targetRef)) continue;
      const supersedingRecordedAt = Date.parse(String(superseding.ev?.recorded_at ?? ""));
      if (Number.isFinite(sourceRecordedAt) && Number.isFinite(supersedingRecordedAt) && supersedingRecordedAt < sourceRecordedAt) {
        continue;
      }
      if (hasContradictionBackReference(superseding.ev, ev?.id) || hasResolveTarget(superseding.ev, ev?.id)) continue;
      ruleWarn(
        state,
        superseding.where,
        "V-CONTRA-04",
        `event ${superseding.ev?.id ?? "unknown"} supersedes contradicted event ${targetRef} without contradicts or resolves pointing at ${String(ev?.id ?? "unknown")}.`,
      );
    }
  }
}

function validateResolvesRules(
  state: State,
  where: string,
  ev: any,
  envelopes: Array<{ where: string; ev: any }>,
  envelopesById: Map<string, any>,
) {
  const resolves = Array.isArray(ev?.links?.resolves) ? ev.links.resolves : [];
  if (resolves.length === 0) return;

  const rejectResolveTarget = (target: string) =>
    ruleErr(
      state,
      where,
      "V-RESOLVES-01",
      `resolves target is neither an open loop nor a contradiction-bearing event: ${target}.`,
    );

  const anchorMs = Date.parse(String(ev?.recorded_at ?? ""));
  for (const target of resolves) {
    if (typeof target !== "string") continue;

    const targetEvent = envelopesById.get(target);
    if (!targetEvent || !isVisibleAtAnchor(targetEvent, anchorMs)) {
      rejectResolveTarget(target);
      continue;
    }

    if (hasContradictsEntries(targetEvent)) continue;
    if (isResolvableIntent(targetEvent, envelopes, anchorMs)) continue;
    if (isUnacknowledgedCommunication(targetEvent, envelopes, anchorMs)) continue;
    if (isActiveAlertPlaceholder(targetEvent)) continue;

    rejectResolveTarget(target);
  }
}

async function validateTransformInputRef(
  state: State,
  where: string,
  raw: unknown,
  index: number,
) {
  const unresolved = (kind: string, ref: string) =>
    ruleErr(
      state,
      where,
      "V-TRANSFORM-02",
      `transform.input_refs[${index}] does not resolve: ${kind}:${ref}`,
    );

  const parsed = parseEvidenceRef(raw);
  if (!parsed) {
    unresolved(transformInputKind(raw), transformInputRef(raw));
    return;
  }

  if (parsed.kind === "external") {
    if (!hasRecognizedExternalScheme(parsed.ref)) {
      ruleErr(
        state,
        where,
        "V-TRANSFORM-02",
        `transform.input_refs[${index}] has unrecognized external scheme: ${parsed.ref}`,
      );
    }
    return;
  }

  if (parsed.kind === "vitals_window") {
    if (!hasEncounterBearingVitalsRef(parsed.ref)) {
      unresolved(parsed.kind, parsed.ref);
      return;
    }
    const window = expandVitalsWindowRef(parsed);
    if (!window || Date.parse(window.from) > Date.parse(window.to)) {
      unresolved(parsed.kind, parsed.ref);
      return;
    }
    const has = await vitalsWindowHasSamples(state.patientRoot, window);
    if (!has) {
      unresolved(parsed.kind, parsed.ref);
    }
    return;
  }

  if (!state.allIds.has(parsed.ref)) {
    unresolved(parsed.kind, parsed.ref);
    return;
  }

  if (parsed.kind === "note" && !state.noteIds.has(parsed.ref)) {
    unresolved(parsed.kind, parsed.ref);
    return;
  }

  if (parsed.kind === "artifact") {
    const ttype = state.eventTypes.get(parsed.ref);
    if (ttype && ttype !== "artifact_ref") {
      unresolved(parsed.kind, parsed.ref);
    }
  }
}

function transformInputKind(raw: unknown): string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return typeof raw === "string" && isVitalsUri(raw) ? "vitals_window" : "unknown";
  }
  const ref = raw as Record<string, unknown>;
  return typeof ref.kind === "string" ? ref.kind : "unknown";
}

function transformInputRef(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "[invalid]";
  const ref = raw as Record<string, unknown>;
  if (typeof ref.ref === "string") return ref.ref;
  if (typeof ref.id === "string") return ref.id;
  return "[missing]";
}

function hasRecognizedExternalScheme(ref: string): boolean {
  return ref.startsWith("synthea://") || ref.startsWith("mimic://");
}

function hasEncounterBearingVitalsRef(ref: string): boolean {
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return false;
  }
  if (url.protocol !== "vitals:") return false;
  const encounterId = url.host || url.pathname.replace(/^\//, "");
  return encounterId.length > 0 && encounterId !== "window";
}

function contradictsTargetRef(raw: unknown): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return typeof (raw as { ref?: unknown }).ref === "string" ? (raw as { ref: string }).ref : null;
}

function hasContradictionBackReference(ev: any, targetId: unknown): boolean {
  if (typeof targetId !== "string") return false;
  const contradicts = Array.isArray(ev?.links?.contradicts) ? ev.links.contradicts : [];
  return contradicts.some((raw: unknown) => contradictsTargetRef(raw) === targetId);
}

function hasResolveTarget(ev: any, targetId: unknown): boolean {
  if (typeof targetId !== "string") return false;
  const resolves = Array.isArray(ev?.links?.resolves) ? ev.links.resolves : [];
  return resolves.includes(targetId);
}

function hasContradictsEntries(ev: any): boolean {
  return Array.isArray(ev?.links?.contradicts) && ev.links.contradicts.length > 0;
}

function isVisibleAtAnchor(ev: any, anchorMs: number): boolean {
  if (!Number.isFinite(anchorMs)) return false;
  const recordedAt = Date.parse(String(ev?.recorded_at ?? ""));
  if (!Number.isFinite(recordedAt) || recordedAt > anchorMs) return false;
  const start = eventStartMs(ev);
  if (start === null || start > anchorMs) return false;
  return eventCoversAsOf(ev, anchorMs);
}

function isReplacedAtAnchor(
  targetId: string,
  envelopes: Array<{ where: string; ev: any }>,
  anchorMs: number,
): boolean {
  for (const { ev } of envelopes) {
    if (!isVisibleAtAnchor(ev, anchorMs)) continue;
    const supersedes = Array.isArray(ev?.links?.supersedes) ? ev.links.supersedes : [];
    if (supersedes.includes(targetId)) return true;
    const corrects = Array.isArray(ev?.links?.corrects) ? ev.links.corrects : [];
    if (corrects.includes(targetId)) return true;
  }
  return false;
}

function isResolvableIntent(
  target: any,
  envelopes: Array<{ where: string; ev: any }>,
  anchorMs: number,
): boolean {
  if (target?.type !== "intent") return false;
  if (!isVisibleAtAnchor(target, anchorMs)) return false;
  if (isReplacedAtAnchor(String(target.id ?? ""), envelopes, anchorMs)) return false;
  if (
    target.status === "final" ||
    target.status === "superseded" ||
    target.status === "entered_in_error"
  ) {
    return false;
  }

  const fulfillments = envelopes
    .map(({ ev }) => ev)
    .filter((candidate) => fulfillsTarget(candidate, target.id))
    .filter((candidate) => isVisibleAtAnchor(candidate, anchorMs))
    .filter((candidate) => !isReplacedAtAnchor(String(candidate.id ?? ""), envelopes, anchorMs));

  if (fulfillments.some((candidate) => candidate.status === "final")) return false;
  if (fulfillments.some(isFailureFulfillment)) return false;
  if (fulfillments.some((candidate) => candidate.status === "active")) return false;

  return true;
}

function fulfillsTarget(ev: any, targetId: unknown): boolean {
  if (typeof targetId !== "string") return false;
  const fulfills = Array.isArray(ev?.links?.fulfills) ? ev.links.fulfills : [];
  return fulfills.includes(targetId);
}

function isFailureFulfillment(ev: any): boolean {
  if (ev?.status === "entered_in_error") return true;
  const outcome = ev?.data?.outcome;
  return typeof outcome === "string" && /^(failed|failure|refused|aborted)$/i.test(outcome);
}

function isUnacknowledgedCommunication(
  target: any,
  envelopes: Array<{ where: string; ev: any }>,
  anchorMs: number,
): boolean {
  return target?.type === "communication" &&
    target?.data?.status_detail === "sent" &&
    !isReplacedAtAnchor(String(target.id ?? ""), envelopes, anchorMs);
}

function isActiveAlertPlaceholder(target: any): boolean {
  return target?.type === "observation" &&
    target?.subtype === "alert" &&
    target?.status === "active" &&
    target?.data?.status_detail === undefined;
}

function validateDerivedFromChain(
  state: State,
  where: string,
  ref: ReturnType<typeof parseEvidenceRef>,
  depth: number,
  ancestry: Set<string>,
) {
  if (!ref) return;

  const identity = `${ref.kind}:${ref.ref}`;
  if (ancestry.has(identity)) {
    ruleErr(
      state,
      where,
      "V-EVIDENCE-03",
      `derived_from cycle detected at ${identity}.`,
    );
    return;
  }
  if (depth > EVIDENCE_DERIVED_FROM_MAX_DEPTH) {
    ruleErr(
      state,
      where,
      "V-EVIDENCE-03",
      `derived_from depth exceeds max ${EVIDENCE_DERIVED_FROM_MAX_DEPTH} at depth ${depth} for ${identity}.`,
    );
    return;
  }
  if (!ref.derived_from?.length) return;

  const nextAncestry = new Set(ancestry);
  nextAncestry.add(identity);
  for (const derived of ref.derived_from) {
    validateDerivedFromChain(state, where, derived, depth + 1, nextAncestry);
  }
}

function validateAcquisitionAction(
  state: State,
  where: string,
  ev: any,
  envelopesById: Map<string, any>,
) {
  if (ev?.type !== "action" || !ACQUISITION_ACTION_SUBTYPES.has(String(ev?.subtype ?? ""))) {
    return;
  }
  const origin = ev?.data?.origin;
  const rationale = ev?.data?.rationale_text;
  if (origin === "ad_hoc" || origin === "standing_protocol") {
    if (typeof rationale !== "string" || rationale.trim().length === 0) {
      ruleErr(
        state,
        where,
        "V-FULFILL-02",
        `acquisition action with data.origin '${origin}' must populate data.rationale_text`,
      );
    }
    return;
  }

  const fulfills = (ev?.links?.fulfills ?? []).filter((target: unknown) => typeof target === "string");
  if (fulfills.length === 0) {
    ruleErr(
      state,
      where,
      "V-FULFILL-02",
      `action subtype '${ev.subtype}' must carry links.fulfills to intent.order or intent.monitoring_plan unless data.origin is ad_hoc or standing_protocol`,
    );
    return;
  }
  const hasAllowedTarget = fulfills.some((target: string) => {
    const intent = envelopesById.get(target);
    return intent?.type === "intent" &&
      (intent?.subtype === "order" || intent?.subtype === "monitoring_plan");
  });
  if (!hasAllowedTarget) {
    ruleErr(
      state,
      where,
      "V-FULFILL-02",
      `action subtype '${ev.subtype}' must fulfill at least one intent.order or intent.monitoring_plan`,
    );
  }
}

function validateResultObservationFulfillment(
  state: State,
  where: string,
  ev: any,
  envelopesById: Map<string, any>,
) {
  if (ev?.type !== "observation" || !RESULT_OBSERVATION_SUBTYPES.has(String(ev?.subtype ?? ""))) {
    return;
  }
  if (supportsAcquisitionAction(ev?.links?.supports ?? [], envelopesById)) return;
  if (ev?.data?.origin === "ad_hoc") return;
  ruleErr(
    state,
    where,
    "V-FULFILL-03",
    `observation subtype '${ev.subtype}' must support an acquisition action unless data.origin is 'ad_hoc'`,
  );
}

function supportsAcquisitionAction(
  supports: unknown[],
  envelopesById: Map<string, any>,
): boolean {
  for (const raw of supports) {
    const ref = parseEvidenceRef(raw);
    if (!ref || ref.kind !== "event") continue;
    const target = envelopesById.get(ref.ref);
    if (
      target?.type === "action" &&
      ACQUISITION_ACTION_SUBTYPES.has(String(target?.subtype ?? ""))
    ) {
      return true;
    }
  }
  return false;
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
    const window = ref ? expandVitalsWindowRef(ref) : null;
    if (!window) {
      err(state, where, `links.supports: malformed vitals URI '${target}'`);
      return;
    }
    const has = await vitalsWindowHasSamples(state.patientRoot, window);
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
  const inputKind = typeof raw.kind === "string" ? raw.kind : "unknown";
  const ref = parseEvidenceRef(raw);
  if (!ref) {
    err(state, where, `links.supports[kind=${inputKind}]: malformed structured EvidenceRef`);
    return;
  }

  switch (ref.kind) {
    case "event":
    case "note":
    case "artifact": {
      const id = ref.ref;
      if (!state.allIds.has(id)) {
        err(
          state,
          where,
          `links.supports[kind=${inputKind}]: unknown target id '${id}' (invariant 6: cross-patient links rejected)`,
        );
        return;
      }
      if (ref.kind === "note" && !state.noteIds.has(id)) {
        err(state, where, `links.supports[kind=${inputKind}]: id '${id}' is not a note`);
      }
      if (ref.kind === "artifact") {
        const ttype = state.eventTypes.get(id);
        if (ttype && ttype !== "artifact_ref") {
          err(
            state,
            where,
            `links.supports[kind=${inputKind}]: id '${id}' is type '${ttype}', expected 'artifact_ref'`,
          );
        }
      }
      return;
    }
    case "vitals_window": {
      const window = expandVitalsWindowRef(ref);
      if (!window) {
        err(state, where, `links.supports[kind=${inputKind}]: malformed vitals window`);
        return;
      }
      if (Date.parse(window.from) > Date.parse(window.to)) {
        err(state, where, `links.supports[kind=${inputKind}]: from is after to`);
        return;
      }
      const has = await vitalsWindowHasSamples(state.patientRoot, window);
      if (!has) {
        err(
          state,
          where,
          `links.supports[kind=${inputKind}]: metric '${window.metric}' has no samples in [${window.from}, ${window.to}]`,
        );
      }
      return;
    }
    case "external":
      return;
  }
}

async function vitalsWindowHasSamples(
  patientDir: string,
  ref: { metric: string; from: string; to: string; encounterId?: string },
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
    const ref = parseEvidenceRef(raw);
    if (!ref) continue;
    if (ref.kind === "vitals_window" || ref.kind === "artifact") return true;
    if (ref.kind === "event") {
      const t = eventTypes.get(ref.ref);
      if (t === "observation" || t === "artifact_ref") return true;
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
