#!/usr/bin/env tsx
// Migrate a v0.1 single-patient chart to v0.2 multi-patient layout.
//
// Idempotent, in-place. Safe to re-run on a partially-migrated tree.
// See DESIGN.md §2.3 for the committed migration shape.

import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { loadChartMeta } from "../src/index.js";
import type { ChartMeta, SystemRegistry } from "../src/index.js";

interface MigrateResult {
  chartRoot: string;
  patientId: string;
  patientRoot: string;
  alreadyMigrated: boolean;
  movedPaths: string[];
}

const MOVE_CANDIDATES = [
  "patient.md",
  "constraints.md",
  "timeline",
  "artifacts",
  "_derived",
] as const;

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function dumpYaml(data: unknown): string {
  return yaml.dump(data, { sortKeys: false, lineWidth: 0 });
}

async function readV01ChartMeta(chartRoot: string): Promise<ChartMeta | null> {
  const oldChart = path.join(chartRoot, "chart.yaml");
  if (!(await exists(oldChart))) return null;
  try {
    return await loadChartMeta(chartRoot);
  } catch {
    return null;
  }
}

async function inferPatientIdFromRegistry(
  chartRoot: string,
): Promise<string | null> {
  const registryPath = path.join(chartRoot, "pi-chart.yaml");
  if (!(await exists(registryPath))) return null;
  try {
    const data = yaml.load(await fs.readFile(registryPath, "utf8")) as
      | SystemRegistry
      | null;
    const first = data?.patients?.[0]?.id;
    return typeof first === "string" ? first : null;
  } catch {
    return null;
  }
}

async function moveIfPresent(
  from: string,
  to: string,
  moved: string[],
): Promise<boolean> {
  if (!(await exists(from))) return false;
  if (await exists(to)) {
    // destination already in place; skip without error (covers
    // interrupted-migration resumption).
    return false;
  }
  await ensureDir(path.dirname(to));
  await fs.rename(from, to);
  moved.push(path.basename(from));
  return true;
}

async function writePatientChartYaml(
  patientDir: string,
  meta: ChartMeta,
): Promise<boolean> {
  const patientChartPath = path.join(patientDir, "chart.yaml");
  if (await exists(patientChartPath)) return false;
  const shape: Record<string, unknown> = {
    chart_id: meta.chart_id ?? `chart_${meta.subject}`,
    chart_version: "0.2.0",
    schema_version: "0.2.0",
    subject: meta.subject,
    ...(meta.mode ? { mode: meta.mode } : {}),
    ...(meta.clock ? { clock: meta.clock } : {}),
    ...(meta.sim_start ? { sim_start: meta.sim_start } : {}),
    ...(meta.created_at ? { created_at: meta.created_at } : {}),
    ...(meta.timezone ? { timezone: meta.timezone } : {}),
  };
  await fs.writeFile(patientChartPath, dumpYaml(shape));
  return true;
}

async function writeRootRegistry(
  chartRoot: string,
  meta: ChartMeta,
  patientId: string,
): Promise<boolean> {
  const registryPath = path.join(chartRoot, "pi-chart.yaml");
  if (await exists(registryPath)) return false;
  const registry: SystemRegistry = {
    system_version: "0.2.0",
    schema_version: "0.2.0",
    ...(meta.timezone ? { default_timezone: meta.timezone } : {}),
    patients: [
      {
        id: patientId,
        directory: `patients/${patientId}`,
        display_name: `Patient ${patientId.replace(/^patient_/, "")}`,
        ...(meta.created_at ? { created_at: meta.created_at } : {}),
        source: "synthetic",
      },
    ],
  };
  await fs.writeFile(registryPath, dumpYaml(registry));
  return true;
}

async function deleteLegacyRootChartYaml(chartRoot: string): Promise<boolean> {
  const old = path.join(chartRoot, "chart.yaml");
  if (!(await exists(old))) return false;
  await fs.unlink(old);
  return true;
}

async function listOnDiskPatientIds(chartRoot: string): Promise<string[]> {
  const dir = path.join(chartRoot, "patients");
  try {
    const entries = await fs.readdir(dir);
    const out: string[] = [];
    for (const name of entries) {
      if (name.startsWith(".")) continue;
      if (await exists(path.join(dir, name, "chart.yaml"))) out.push(name);
    }
    return out;
  } catch {
    return [];
  }
}

async function existingTemplateIsStale(
  examplePath: string,
  onDiskIds: string[],
): Promise<boolean> {
  try {
    const text = await fs.readFile(examplePath, "utf8");
    const data = yaml.load(text) as { current_patient?: unknown } | null;
    const current = data?.current_patient;
    if (typeof current !== "string" || current.length === 0) return false;
    // Stale = the template references a patient that is not on disk. A user
    // who legitimately pointed the template at a valid patient other than
    // the migrated one keeps their choice; a template pointing at a ghost
    // (often left over from an earlier buggy migration) is rewritten.
    return !onDiskIds.includes(current);
  } catch {
    return false;
  }
}

async function writeSessionsExample(
  chartRoot: string,
  patientId: string,
): Promise<boolean> {
  const dir = path.join(chartRoot, "sessions");
  await ensureDir(dir);
  const examplePath = path.join(dir, "current.example.yaml");
  if (await exists(examplePath)) {
    // Don't overwrite a template that still points at a real patient —
    // users may customize it intentionally. But do converge templates
    // that reference a patient id absent from disk (ghost references
    // from earlier buggy migrations of this script).
    const onDiskIds = await listOnDiskPatientIds(chartRoot);
    // The just-migrated patient's directory is already in place, so
    // include it even if the directory walk hasn't re-listed yet.
    if (!onDiskIds.includes(patientId)) onDiskIds.push(patientId);
    if (!(await existingTemplateIsStale(examplePath, onDiskIds))) {
      return false;
    }
  }
  const example =
    "# Template for sessions/current.yaml (gitignored).\n" +
    "# Copy to sessions/current.yaml and fill in operator identity.\n" +
    "author:\n" +
    "  id: rn_shane\n" +
    "  role: rn\n" +
    `current_patient: ${patientId}\n` +
    "# current_encounter: enc_001\n";
  await fs.writeFile(examplePath, example);
  return true;
}

export async function migrateV01ToV02(
  chartRoot: string,
): Promise<MigrateResult> {
  chartRoot = path.resolve(chartRoot);

  // Determine patientId: prefer v0.1 chart.yaml.subject; fall back to
  // existing registry; otherwise fail loudly.
  const v01Meta = await readV01ChartMeta(chartRoot);
  const registryPatientId = await inferPatientIdFromRegistry(chartRoot);
  const patientId = v01Meta?.subject ?? registryPatientId;
  if (!patientId) {
    throw new Error(
      `cannot determine patient id — neither ${chartRoot}/chart.yaml nor ` +
        `${chartRoot}/pi-chart.yaml yields a subject`,
    );
  }

  // No early gate: every step below checks its own preconditions, so a
  // partially-migrated tree resumes cleanly on re-entry. `alreadyMigrated`
  // is computed from whether any step actually did work.
  const patientDir = path.join(chartRoot, "patients", patientId);
  await ensureDir(patientDir);

  const moved: string[] = [];
  for (const name of MOVE_CANDIDATES) {
    await moveIfPresent(
      path.join(chartRoot, name),
      path.join(patientDir, name),
      moved,
    );
  }

  // At this point, v01Meta may be null if a prior run had moved chart.yaml
  // already. Fall back to per-patient chart.yaml if present.
  let meta: ChartMeta;
  if (v01Meta) {
    meta = v01Meta;
  } else {
    try {
      meta = await loadChartMeta(patientDir);
    } catch {
      throw new Error(
        `migration inconsistent: no chart.yaml at ${chartRoot} or ${patientDir}`,
      );
    }
  }

  const wroteChart = await writePatientChartYaml(patientDir, meta);
  const wroteRegistry = await writeRootRegistry(chartRoot, meta, patientId);
  const wroteSession = await writeSessionsExample(chartRoot, patientId);
  const deletedLegacy = await deleteLegacyRootChartYaml(chartRoot);

  const didWork =
    moved.length > 0 ||
    wroteChart ||
    wroteRegistry ||
    wroteSession ||
    deletedLegacy;

  return {
    chartRoot,
    patientId,
    patientRoot: patientDir,
    alreadyMigrated: !didWork,
    movedPaths: moved,
  };
}

const isMain = (() => {
  try {
    const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
    return entry.endsWith("migrate-v01-to-v02.ts");
  } catch {
    return false;
  }
})();

if (isMain) {
  const chartRoot = path.resolve(process.argv[2] ?? ".");
  const result = await migrateV01ToV02(chartRoot);
  if (result.alreadyMigrated) {
    console.log(`already migrated: ${result.patientRoot}`);
  } else {
    console.log(
      `migrated patient '${result.patientId}' to ${result.patientRoot}`,
    );
    if (result.movedPaths.length) {
      console.log(`  moved: ${result.movedPaths.join(", ")}`);
    }
  }
}
