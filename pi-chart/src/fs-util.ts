// File-system helpers shared across read/write/derived/validate.
//
// Atomic write strategy (mirrors pi-sim convention): write to a randomly
// suffixed tmp file, then `rename` onto the target. Guarantees readers
// never see a partial file. POSIX `appendFile` is atomic per call for
// short writes, so events.ndjson uses appendFile rather than tmp+rename.

import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import yaml from "js-yaml";

export async function atomicWriteFile(target: string, data: string | Buffer): Promise<void> {
  const tmp = `${target}.tmp.${randomBytes(6).toString("hex")}`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, target);
}

/** Append one NDJSON record + newline. */
export async function appendNdjsonLine(filePath: string, obj: unknown): Promise<void> {
  await fs.appendFile(filePath, JSON.stringify(obj) + "\n");
}

/**
 * Split `text` into [frontmatter, body]. Returns [null, text] when no
 * leading `---` block is present. Throws on YAML parse error so callers
 * can surface validator-style messages.
 */
export function parseFrontmatter(text: string): [Record<string, unknown> | null, string] {
  if (!text.startsWith("---")) return [null, text];
  const end = text.indexOf("\n---", 3);
  if (end === -1) return [null, text];
  const fmText = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n+/, "");
  const data = yaml.load(fmText);
  if (data === null || data === undefined) return [null, body];
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter is not a YAML mapping");
  }
  return [data as Record<string, unknown>, body];
}

/** Render `frontmatter` as YAML between --- fences with a trailing body. */
export function formatFrontmatterMarkdown(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const fmYaml = yaml.dump(frontmatter, { sortKeys: false, lineWidth: 0 }).trimEnd();
  return `---\n${fmYaml}\n---\n\n${body.trimEnd()}\n`;
}

export async function* iterNdjson(filePath: string): AsyncGenerator<[number, any]> {
  let text: string;
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch (err: any) {
    if (err?.code === "ENOENT") return;
    throw err;
  }
  let lineno = 0;
  for (const raw of text.split("\n")) {
    lineno++;
    const line = raw.trim();
    if (!line) continue;
    yield [lineno, JSON.parse(line)];
  }
}

export async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

// Tiny purpose-built glob helpers. Pulling in a glob library would be
// overkill for the chart's fixed timeline layout.

/** List per-day leaf files like `timeline/<day>/events.ndjson` or vitals.jsonl. */
export async function globPerDayFile(chartRoot: string, leaf: string): Promise<string[]> {
  return globAtFixedDepth(path.join(chartRoot, "timeline"), [leaf]);
}

/** List markdown notes under `timeline/<day>/notes/`. */
export async function globNotes(chartRoot: string): Promise<string[]> {
  const out: string[] = [];
  const baseDir = path.join(chartRoot, "timeline");
  let days: string[] = [];
  try {
    days = await fs.readdir(baseDir);
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
  for (const day of days.sort()) {
    const notesDir = path.join(baseDir, day, "notes");
    let entries: string[];
    try {
      entries = await fs.readdir(notesDir);
    } catch {
      continue;
    }
    for (const f of entries.sort()) {
      if (f.endsWith(".md")) out.push(path.join(notesDir, f));
    }
  }
  return out;
}

/** List `encounter_*.md` headers under `timeline/<day>/`. */
export async function globEncounters(chartRoot: string): Promise<string[]> {
  const out: string[] = [];
  const baseDir = path.join(chartRoot, "timeline");
  let days: string[] = [];
  try {
    days = await fs.readdir(baseDir);
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
  for (const day of days.sort()) {
    let entries: string[];
    try {
      entries = await fs.readdir(path.join(baseDir, day));
    } catch {
      continue;
    }
    for (const f of entries.sort()) {
      if (f.startsWith("encounter_") && f.endsWith(".md")) {
        out.push(path.join(baseDir, day, f));
      }
    }
  }
  return out;
}

async function globAtFixedDepth(baseDir: string, tail: string[]): Promise<string[]> {
  let dayEntries: string[];
  try {
    dayEntries = await fs.readdir(baseDir);
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
  const out: string[] = [];
  for (const day of dayEntries.sort()) {
    const candidate = path.join(baseDir, day, ...tail);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) out.push(candidate);
    } catch {
      // not present; skip
    }
  }
  return out;
}
