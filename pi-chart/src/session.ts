// Session state loader. Transient workspace data at
// `<chartRoot>/sessions/current.yaml` — gitignored, single-user.
//
// Boundary rule (DESIGN §3.3):
//   - Library write functions autofill `author` from the session *only
//     when the caller did not supply one*. They never override an
//     explicit author, and a missing session file is a no-op.
//   - CLI wrappers may use `tryLoadSessionChartRoot` / `…PatientId` to
//     default arguments when invoked from a human's terminal.
//   - Agents and tests must always pass author + scope explicitly; they
//     should never hit the session helpers.

import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { readTextIfExists } from "./fs-util.js";
import type { Author, SessionState, SystemRegistry } from "./types.js";

function sessionPath(chartRoot: string): string {
  return path.join(chartRoot, "sessions", "current.yaml");
}

/**
 * Load sessions/current.yaml and return its Author, if any. Never throws:
 * ENOENT, malformed YAML, or a malformed shape all return undefined so the
 * schema validator remains the sole source of required-field truth.
 */
export async function tryLoadSessionAuthor(
  chartRoot: string,
): Promise<Author | undefined> {
  const state = await tryLoadSessionState(chartRoot);
  const author = state?.author;
  if (!author) return undefined;
  if (typeof author.id !== "string" || author.id.length === 0) return undefined;
  if (typeof author.role !== "string" || author.role.length === 0) return undefined;
  return {
    id: author.id,
    role: author.role,
    ...(typeof author.run_id === "string" ? { run_id: author.run_id } : {}),
  };
}

/** Full session state, or undefined if absent/unparseable. */
export async function tryLoadSessionState(
  chartRoot: string,
): Promise<SessionState | undefined> {
  const text = await readTextIfExists(sessionPath(chartRoot));
  if (text === null) return undefined;
  let data: unknown;
  try {
    data = yaml.load(text);
  } catch {
    return undefined;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
  return data as SessionState;
}

/** CLI helper: default patientId from the session. Library callers pass explicitly. */
export async function tryLoadSessionPatientId(
  chartRoot: string,
): Promise<string | undefined> {
  const state = await tryLoadSessionState(chartRoot);
  const id = state?.current_patient;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

/**
 * CLI helper: walk up from `startDir` looking for a directory that holds
 * `pi-chart.yaml`. Library callers should take `chartRoot` explicitly.
 */
export async function tryLoadSessionChartRoot(
  startDir: string = process.cwd(),
): Promise<string | undefined> {
  let cur = path.resolve(startDir);
  while (true) {
    const candidate = path.join(cur, "pi-chart.yaml");
    try {
      await fs.access(candidate);
      return cur;
    } catch {
      // not here
    }
    const parent = path.dirname(cur);
    if (parent === cur) return undefined;
    cur = parent;
  }
}

/** Read the repo-level `pi-chart.yaml` registry. Returns null if absent. */
export async function tryLoadSystemRegistry(
  chartRoot: string,
): Promise<SystemRegistry | null> {
  const text = await readTextIfExists(path.join(chartRoot, "pi-chart.yaml"));
  if (text === null) return null;
  const data = yaml.load(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as SystemRegistry;
}

/**
 * List patient ids actually present on disk under `<chartRoot>/patients/`.
 * Per DESIGN §2.2 the directory listing is the canonical patient list;
 * `pi-chart.yaml` is metadata that can drift. Every CLI traversal should
 * resolve patients through this helper rather than trusting the registry.
 */
export async function listPatientIds(chartRoot: string): Promise<string[]> {
  const dir = path.join(chartRoot, "patients");
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
  const out: string[] = [];
  for (const name of entries.sort()) {
    if (name.startsWith(".")) continue;
    const chartYaml = path.join(dir, name, "chart.yaml");
    try {
      await fs.access(chartYaml);
      out.push(name);
    } catch {
      // not a patient dir; skip silently (could be a stray file).
    }
  }
  return out;
}
