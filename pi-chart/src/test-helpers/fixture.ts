// Shared test-only helpers. Not a test file — the test runner glob is
// `src/**/*.test.ts`, so this path is invisible to it.
//
// Factory for a minimal v0.3-partial multi-patient chart: pi-chart.yaml, a
// patient dir with chart.yaml, and a local copy of schemas/ so AJV
// picks up the canonical definitions.

import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import yaml from "js-yaml";
import type { PatientScope } from "../types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

export async function makeEmptyPatient(opts?: {
  patientId?: string;
  subject?: string;
  timezone?: string;
}): Promise<PatientScope> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-fixture-"));
  const patientId = opts?.patientId ?? "patient_001";
  const subject = opts?.subject ?? patientId;
  await fs.writeFile(
    path.join(dir, "pi-chart.yaml"),
    `system_version: 0.2.0\nschema_version: 0.3.0-partial\npatients:\n  - id: ${patientId}\n    directory: patients/${patientId}\n`,
  );
  const patientDir = path.join(dir, "patients", patientId);
  await fs.mkdir(path.join(patientDir, "timeline"), { recursive: true });
  const lines = [`subject: ${subject}`, "schema_version: 0.3.0-partial", "clock: sim_time"];
  if (opts?.timezone) lines.push(`timezone: ${opts.timezone}`);
  await fs.writeFile(path.join(patientDir, "chart.yaml"), `${lines.join("\n")}\n`);
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(dir, "schemas"), {
    recursive: true,
  });
  return { chartRoot: dir, patientId };
}

export function patientDir(scope: PatientScope): string {
  return path.join(scope.chartRoot, "patients", scope.patientId);
}

export function dayDir(scope: PatientScope, day: string): string {
  return path.join(patientDir(scope), "timeline", day);
}

export async function appendRawEvent(
  scope: PatientScope,
  day: string,
  event: Record<string, unknown>,
): Promise<void> {
  const dir = dayDir(scope, day);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(
    path.join(dir, "events.ndjson"),
    JSON.stringify(event) + "\n",
  );
}

export async function appendRawVital(
  scope: PatientScope,
  day: string,
  sample: Record<string, unknown>,
): Promise<void> {
  const dir = dayDir(scope, day);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(
    path.join(dir, "vitals.jsonl"),
    JSON.stringify(sample) + "\n",
  );
}

export async function writeRawNote(
  scope: PatientScope,
  day: string,
  filename: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<string> {
  const dir = path.join(dayDir(scope, day), "notes");
  await fs.mkdir(dir, { recursive: true });
  const fm = yaml.dump(frontmatter, { sortKeys: false, lineWidth: 0 }).trimEnd();
  const content = `---\n${fm}\n---\n\n${body.trimEnd()}\n`;
  const target = path.join(dir, filename);
  await fs.writeFile(target, content);
  return target;
}
