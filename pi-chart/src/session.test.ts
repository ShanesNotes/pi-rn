import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import {
  listPatientIds,
  tryLoadSessionAuthor,
  tryLoadSessionChartRoot,
  tryLoadSessionPatientId,
  tryLoadSessionState,
  tryLoadSystemRegistry,
} from "./session.js";

async function tmpWorkspace(sessionYaml: string | null): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-session-"));
  await fs.writeFile(
    path.join(dir, "pi-chart.yaml"),
    "system_version: 0.2.0\nschema_version: 0.2.0\npatients:\n  - id: patient_001\n    directory: patients/patient_001\n",
  );
  if (sessionYaml !== null) {
    await fs.mkdir(path.join(dir, "sessions"), { recursive: true });
    await fs.writeFile(path.join(dir, "sessions", "current.yaml"), sessionYaml);
  }
  return dir;
}

test("tryLoadSessionAuthor round-trips valid session yaml", async () => {
  const dir = await tmpWorkspace(
    "author:\n  id: rn_shane\n  role: rn\ncurrent_patient: patient_001\n",
  );
  const author = await tryLoadSessionAuthor(dir);
  assert.deepEqual(author, { id: "rn_shane", role: "rn" });
});

test("tryLoadSessionAuthor returns undefined when session file is absent", async () => {
  const dir = await tmpWorkspace(null);
  const author = await tryLoadSessionAuthor(dir);
  assert.equal(author, undefined);
});

test("tryLoadSessionAuthor returns undefined on malformed yaml", async () => {
  const dir = await tmpWorkspace("author: [not a mapping\n");
  const author = await tryLoadSessionAuthor(dir);
  assert.equal(author, undefined);
});

test("tryLoadSessionAuthor returns undefined when author fields missing", async () => {
  const dir = await tmpWorkspace("author:\n  id: rn_shane\n");
  const author = await tryLoadSessionAuthor(dir);
  assert.equal(author, undefined);
});

test("tryLoadSessionAuthor preserves run_id when present", async () => {
  const dir = await tmpWorkspace(
    "author:\n  id: pi-agent\n  role: rn_agent\n  run_id: abc123\n",
  );
  const author = await tryLoadSessionAuthor(dir);
  assert.deepEqual(author, { id: "pi-agent", role: "rn_agent", run_id: "abc123" });
});

test("tryLoadSessionPatientId returns current_patient when set", async () => {
  const dir = await tmpWorkspace(
    "author:\n  id: x\n  role: rn\ncurrent_patient: patient_042\n",
  );
  const id = await tryLoadSessionPatientId(dir);
  assert.equal(id, "patient_042");
});

test("tryLoadSessionState returns full object", async () => {
  const dir = await tmpWorkspace(
    "author:\n  id: x\n  role: rn\ncurrent_patient: patient_001\ncurrent_encounter: enc_007\n",
  );
  const state = await tryLoadSessionState(dir);
  assert.equal(state?.current_encounter, "enc_007");
});

test("tryLoadSessionChartRoot walks up to pi-chart.yaml", async () => {
  const dir = await tmpWorkspace(null);
  const deep = path.join(dir, "patients", "patient_001", "timeline", "2026-04-18");
  await fs.mkdir(deep, { recursive: true });
  const found = await tryLoadSessionChartRoot(deep);
  assert.equal(found, dir);
});

test("tryLoadSessionChartRoot returns undefined when no pi-chart.yaml above", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-nohome-"));
  const found = await tryLoadSessionChartRoot(dir);
  assert.equal(found, undefined);
});

test("tryLoadSystemRegistry reads pi-chart.yaml", async () => {
  const dir = await tmpWorkspace(null);
  const registry = await tryLoadSystemRegistry(dir);
  assert(registry);
  assert.equal(registry!.patients[0].id, "patient_001");
});

test("tryLoadSystemRegistry returns null when pi-chart.yaml absent", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-no-registry-"));
  const registry = await tryLoadSystemRegistry(dir);
  assert.equal(registry, null);
});

test("listPatientIds reads patients/ directory as truth, not pi-chart.yaml", async () => {
  // Regression for CLI traversal bug: with an empty registry but a real
  // patient dir on disk, the canonical list must still include it.
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-ls-"));
  await fs.writeFile(
    path.join(dir, "pi-chart.yaml"),
    "system_version: 0.2.0\nschema_version: 0.2.0\npatients: []\n",
  );
  const pdir = path.join(dir, "patients", "patient_777");
  await fs.mkdir(pdir, { recursive: true });
  await fs.writeFile(
    path.join(pdir, "chart.yaml"),
    "subject: patient_777\nclock: sim_time\n",
  );
  const ids = await listPatientIds(dir);
  assert.deepEqual(ids, ["patient_777"]);
});

test("listPatientIds ignores stray entries without chart.yaml", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-ls-stray-"));
  await fs.mkdir(path.join(dir, "patients", "not_a_patient"), { recursive: true });
  await fs.writeFile(path.join(dir, "patients", "README.md"), "stray");
  const real = path.join(dir, "patients", "patient_001");
  await fs.mkdir(real, { recursive: true });
  await fs.writeFile(
    path.join(real, "chart.yaml"),
    "subject: patient_001\nclock: sim_time\n",
  );
  const ids = await listPatientIds(dir);
  assert.deepEqual(ids, ["patient_001"]);
});

test("listPatientIds returns [] when patients/ does not exist", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-ls-empty-"));
  const ids = await listPatientIds(dir);
  assert.deepEqual(ids, []);
});
