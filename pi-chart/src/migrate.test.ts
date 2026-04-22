import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import yaml from "js-yaml";
import { migrateV01ToV02 } from "../scripts/migrate-v01-to-v02.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

async function buildV01Fixture(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-v01-"));
  await fs.writeFile(
    path.join(dir, "chart.yaml"),
    "subject: patient_001\nmode: simulation\nclock: sim_time\ntimezone: America/Chicago\n",
  );
  await fs.writeFile(
    path.join(dir, "patient.md"),
    "---\nid: patient_001\ntype: subject\nsubject: patient_001\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n\n# Baseline\n",
  );
  await fs.writeFile(
    path.join(dir, "constraints.md"),
    "---\nid: cst_001\ntype: constraint_set\nsubject: patient_001\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n\n# Constraints\n",
  );
  await fs.mkdir(path.join(dir, "timeline/2026-04-18"), { recursive: true });
  await fs.writeFile(
    path.join(dir, "timeline/2026-04-18/events.ndjson"),
    "",
  );
  await fs.mkdir(path.join(dir, "artifacts"), { recursive: true });
  await fs.mkdir(path.join(dir, "_derived"), { recursive: true });
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(dir, "schemas"), {
    recursive: true,
  });
  return dir;
}

test("migrate moves v0.1 layout under patients/<subject>/", async () => {
  const root = await buildV01Fixture();
  const result = await migrateV01ToV02(root);
  assert.equal(result.alreadyMigrated, false);
  assert.equal(result.patientId, "patient_001");
  for (const leaf of ["patient.md", "constraints.md", "timeline", "artifacts", "_derived"]) {
    const moved = await fs.stat(path.join(result.patientRoot, leaf)).then(
      (s) => s.isDirectory() || s.isFile(),
    );
    assert(moved, `${leaf} should exist at ${result.patientRoot}`);
  }
  // Registry written
  const registryText = await fs.readFile(path.join(root, "pi-chart.yaml"), "utf8");
  const registry = yaml.load(registryText) as any;
  assert.equal(registry.system_version, "0.2.0");
  assert.equal(registry.patients[0].id, "patient_001");
  assert.equal(registry.patients[0].directory, "patients/patient_001");
  // Per-patient chart.yaml written with schema_version bump
  const patientChart = yaml.load(
    await fs.readFile(path.join(result.patientRoot, "chart.yaml"), "utf8"),
  ) as any;
  assert.equal(patientChart.subject, "patient_001");
  assert.equal(patientChart.schema_version, "0.2.0");
  // Legacy root chart.yaml removed
  await assert.rejects(fs.access(path.join(root, "chart.yaml")));
  // Session template committed
  await fs.access(path.join(root, "sessions/current.example.yaml"));
});

test("migrate is idempotent on re-run", async () => {
  const root = await buildV01Fixture();
  await migrateV01ToV02(root);
  const registryBefore = await fs.readFile(path.join(root, "pi-chart.yaml"), "utf8");
  const patientChartBefore = await fs.readFile(
    path.join(root, "patients/patient_001/chart.yaml"),
    "utf8",
  );
  const second = await migrateV01ToV02(root);
  assert.equal(second.alreadyMigrated, true);
  const registryAfter = await fs.readFile(path.join(root, "pi-chart.yaml"), "utf8");
  const patientChartAfter = await fs.readFile(
    path.join(root, "patients/patient_001/chart.yaml"),
    "utf8",
  );
  assert.equal(registryBefore, registryAfter);
  assert.equal(patientChartBefore, patientChartAfter);
});

test("migrate resumes safely after a partial move", async () => {
  const root = await buildV01Fixture();
  // Simulate: the patient.md rename happened, but the rest was killed.
  const patientDir = path.join(root, "patients/patient_001");
  await fs.mkdir(patientDir, { recursive: true });
  await fs.rename(
    path.join(root, "patient.md"),
    path.join(patientDir, "patient.md"),
  );
  // Re-run from this state. Should complete without error.
  const result = await migrateV01ToV02(root);
  assert.equal(result.alreadyMigrated, false);
  for (const leaf of ["patient.md", "constraints.md", "timeline"]) {
    await fs.access(path.join(patientDir, leaf));
  }
  await assert.rejects(fs.access(path.join(root, "patient.md")));
});

test("migrate completes sessions template + legacy removal even when registry already exists", async () => {
  // Regression: the old early-exit gate saw a registry + patient chart and
  // short-circuited past the remaining steps. Now every step guards itself.
  const root = await buildV01Fixture();
  const patientDir = path.join(root, "patients/patient_001");
  await fs.mkdir(patientDir, { recursive: true });

  // Prestage the gate-satisfying files without writing the session
  // template or deleting the legacy root chart.yaml.
  await fs.writeFile(
    path.join(root, "pi-chart.yaml"),
    "system_version: 0.2.0\nschema_version: 0.2.0\npatients:\n  - id: patient_001\n    directory: patients/patient_001\n",
  );
  await fs.writeFile(
    path.join(patientDir, "chart.yaml"),
    "subject: patient_001\nschema_version: 0.2.0\n",
  );

  // Also pre-move the data so the migrator has something to work with.
  for (const leaf of ["patient.md", "constraints.md", "timeline", "artifacts", "_derived"]) {
    const from = path.join(root, leaf);
    try {
      await fs.rename(from, path.join(patientDir, leaf));
    } catch {
      // some may already be moved or missing
    }
  }

  // Legacy root chart.yaml still present; session template still missing.
  const legacyChart = "subject: patient_001\nclock: sim_time\n";
  await fs.writeFile(path.join(root, "chart.yaml"), legacyChart);

  const result = await migrateV01ToV02(root);
  assert.equal(result.alreadyMigrated, false);
  await fs.access(path.join(root, "sessions/current.example.yaml"));
  await assert.rejects(fs.access(path.join(root, "chart.yaml")));
});

test("migrate converges a stale session template left by an earlier buggy run", async () => {
  // Regression: an earlier bug hardcoded current_patient: patient_001 into
  // the template. On re-migrate, writeSessionsExample used to see the file
  // and skip, leaving the stale ghost reference intact.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-stale-template-"));
  await fs.writeFile(
    path.join(root, "chart.yaml"),
    "subject: patient_mimic_10000032\nmode: simulation\nclock: sim_time\ntimezone: America/Chicago\n",
  );
  await fs.writeFile(
    path.join(root, "patient.md"),
    "---\nid: patient_mimic_10000032\ntype: subject\nsubject: patient_mimic_10000032\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n",
  );
  await fs.writeFile(
    path.join(root, "constraints.md"),
    "---\nid: cst_001\ntype: constraint_set\nsubject: patient_mimic_10000032\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n",
  );
  await fs.mkdir(path.join(root, "timeline/2026-04-18"), { recursive: true });
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(root, "schemas"), {
    recursive: true,
  });
  // Simulate the pre-existing bad template.
  await fs.mkdir(path.join(root, "sessions"), { recursive: true });
  await fs.writeFile(
    path.join(root, "sessions/current.example.yaml"),
    "author:\n  id: rn_shane\n  role: rn\ncurrent_patient: patient_001\n",
  );

  await migrateV01ToV02(root);
  const template = await fs.readFile(
    path.join(root, "sessions/current.example.yaml"),
    "utf8",
  );
  assert(
    template.includes("current_patient: patient_mimic_10000032"),
    `expected stale template to be rewritten, got:\n${template}`,
  );
});

test("migrate preserves a session template that points at another on-disk patient", async () => {
  // A valid customization — e.g. a multi-patient repo with the template
  // intentionally aimed at a secondary patient — must not be clobbered.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-template-keep-"));
  await fs.writeFile(
    path.join(root, "chart.yaml"),
    "subject: patient_001\nmode: simulation\nclock: sim_time\ntimezone: America/Chicago\n",
  );
  await fs.writeFile(
    path.join(root, "patient.md"),
    "---\nid: patient_001\ntype: subject\nsubject: patient_001\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n",
  );
  await fs.writeFile(
    path.join(root, "constraints.md"),
    "---\nid: cst_001\ntype: constraint_set\nsubject: patient_001\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n",
  );
  await fs.mkdir(path.join(root, "timeline/2026-04-18"), { recursive: true });
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(root, "schemas"), {
    recursive: true,
  });
  // Another patient also exists on disk.
  const otherDir = path.join(root, "patients/patient_042");
  await fs.mkdir(otherDir, { recursive: true });
  await fs.writeFile(
    path.join(otherDir, "chart.yaml"),
    "subject: patient_042\nclock: sim_time\n",
  );
  // User has customized the template to point at patient_042.
  await fs.mkdir(path.join(root, "sessions"), { recursive: true });
  const customised =
    "# Custom workspace — points at patient_042 on purpose.\n" +
    "author:\n  id: rn_shane\n  role: rn\ncurrent_patient: patient_042\n";
  await fs.writeFile(path.join(root, "sessions/current.example.yaml"), customised);

  await migrateV01ToV02(root);
  const template = await fs.readFile(
    path.join(root, "sessions/current.example.yaml"),
    "utf8",
  );
  assert.equal(template, customised);
});

test("migrate writes the session template pointing at the actual patient id", async () => {
  // Regression: hardcoded patient_001 default would silently break charts
  // whose subject is something else.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-v01-altid-"));
  await fs.writeFile(
    path.join(root, "chart.yaml"),
    "subject: patient_mimic_10000032\nmode: simulation\nclock: sim_time\ntimezone: America/Chicago\n",
  );
  await fs.writeFile(
    path.join(root, "patient.md"),
    "---\nid: patient_mimic_10000032\ntype: subject\nsubject: patient_mimic_10000032\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n\n# Baseline\n",
  );
  await fs.writeFile(
    path.join(root, "constraints.md"),
    "---\nid: cst_001\ntype: constraint_set\nsubject: patient_mimic_10000032\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n",
  );
  await fs.mkdir(path.join(root, "timeline/2026-04-18"), { recursive: true });
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(root, "schemas"), {
    recursive: true,
  });

  const result = await migrateV01ToV02(root);
  assert.equal(result.patientId, "patient_mimic_10000032");
  const template = await fs.readFile(
    path.join(root, "sessions/current.example.yaml"),
    "utf8",
  );
  assert(
    template.includes("current_patient: patient_mimic_10000032"),
    `expected template to reference the migrated patient id, got:\n${template}`,
  );
});
