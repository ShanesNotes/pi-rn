// narrative(params) — notes + communications sorted by recorded_at
// (DESIGN §4.7). The reading view: shift-change context loading.
//
// Notes carry a frontmatter envelope + body; this view normalizes both
// sources into `NarrativeEntry` so a UI can iterate uniformly.

import { promises as fs } from "node:fs";
import path from "node:path";
import { globNotes, parseFrontmatter } from "../fs-util.js";
import { patientRoot } from "../types.js";
import type {
  NarrativeEntry,
  NarrativeParams,
  NoteFrontmatter,
} from "../types.js";

export async function narrative(params: NarrativeParams): Promise<NarrativeEntry[]> {
  const pr = patientRoot(params.scope);
  const fromMs = params.from ? Date.parse(params.from) : Number.NEGATIVE_INFINITY;
  const toMs = params.to ? Date.parse(params.to) : Number.POSITIVE_INFINITY;
  const subtypeSet = params.subtypes ? new Set(params.subtypes) : null;

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
    out.push({
      id: fmTyped.id,
      effective_at: fmTyped.effective_at,
      recorded_at: fmTyped.recorded_at,
      author: fmTyped.author,
      subtype,
      body: body.trim(),
      references: Array.isArray(fmTyped.references) ? fmTyped.references : [],
      path: path.relative(pr, notePath),
    });
  }
  out.sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at) || a.id.localeCompare(b.id),
  );
  return out;
}
