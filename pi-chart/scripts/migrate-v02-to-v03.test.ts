import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import yaml from "js-yaml";
import { migrateV02ToV03 } from "./migrate-v02-to-v03.js";
import { validateChart } from "../src/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

async function buildV02Fixture(): Promise<{ root: string; patientId: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-v02-"));
  const patientId = "patient_001";
  const patientRoot = path.join(root, "patients", patientId);

  await fs.mkdir(path.join(patientRoot, "timeline", "2026-04-18"), { recursive: true });
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(root, "schemas"), {
    recursive: true,
  });

  await fs.writeFile(
    path.join(root, "pi-chart.yaml"),
    [
      "system_version: 0.2.0",
      "schema_version: 0.2.0",
      "patients:",
      `  - id: ${patientId}`,
      `    directory: patients/${patientId}`,
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(patientRoot, "chart.yaml"),
    [
      "chart_id: chart_patient_001",
      "chart_version: 0.2.0",
      "schema_version: 0.2.0",
      "subject: patient_001",
      "mode: simulation",
      "clock: sim_time",
      "timezone: America/Chicago",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(patientRoot, "patient.md"),
    [
      "---",
      "id: patient_001",
      "type: subject",
      "subject: patient_001",
      "effective_at: '2026-04-18T06:00:00-05:00'",
      "recorded_at: '2026-04-18T06:00:00-05:00'",
      "author: { id: x, role: rn }",
      "source: { kind: admission_intake, ref: admission_2026-04-18 }",
      "status: active",
      "---",
      "",
      "# Patient",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(patientRoot, "constraints.md"),
    [
      "---",
      "id: constraints_patient_001",
      "type: constraint_set",
      "subject: patient_001",
      "effective_at: '2026-04-18T06:05:00-05:00'",
      "recorded_at: '2026-04-18T06:05:00-05:00'",
      "author: { id: x, role: rn }",
      "source: { kind: admission_intake, ref: admission_2026-04-18 }",
      "status: active",
      "constraints:",
      "  allergies: []",
      "  code_status: full_code",
      "  preferences: []",
      "  access_constraints: []",
      "  advance_directive: ''",
      "---",
      "",
      "# Constraints",
      "",
    ].join("\n"),
  );

  const events = [
    {
      id: "evt_obs_01",
      type: "observation",
      subtype: "lab_result",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      recorded_at: "2026-04-18T08:00:30-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: {
        name: "lactate",
        value: 3.2,
        unit: "mmol/L",
        status_detail: "final",
        origin: "ad_hoc",
      },
      links: { supports: [] },
    },
    {
      id: "evt_problem_01",
      type: "assessment",
      subtype: "problem",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:05:00-05:00",
      recorded_at: "2026-04-18T08:05:00-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "agent_inference", ref: "run_problem" },
      certainty: "inferred",
      status: "active",
      data: { summary: "problem" },
      links: {
        supports: [
          {
            kind: "event",
            id: "evt_obs_01",
          },
        ],
      },
    },
    {
      id: "evt_intent_01",
      type: "intent",
      subtype: "care_plan",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:10:00-05:00",
      recorded_at: "2026-04-18T08:10:00-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "manual_scenario" },
      certainty: "planned",
      status: "active",
      data: { goal: "watch", due_by: "2026-04-18T09:00:00-05:00" },
      links: { supports: [] },
    },
    {
      id: "evt_comm_01",
      type: "communication",
      subtype: "sbar",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:15:00-05:00",
      recorded_at: "2026-04-18T08:15:00-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "agent_synthesis", ref: "run_comm" },
      certainty: "performed",
      status: "final",
      data: {
        note_ref: "note_20260418T0815_sbar",
        audience: "covering_md",
        summary: "SBAR",
        status_detail: "sent",
      },
      links: {
        supports: [
          {
            kind: "note",
            id: "note_20260418T0815_sbar",
          },
        ],
      },
    },
    {
      id: "evt_alert_01",
      type: "observation",
      subtype: "alert",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:16:00-05:00",
      recorded_at: "2026-04-18T08:16:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "active",
      data: { name: "sepsis_alert", value: "triggered" },
      links: { supports: [] },
    },
    {
      id: "evt_artifact_01",
      type: "artifact_ref",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:18:00-05:00",
      recorded_at: "2026-04-18T08:18:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: {
        path: "artifacts/artifact_row_01",
        kind: "pdf",
        description: "supporting artifact",
      },
      links: { supports: [] },
    },
    {
      id: "evt_assessment_01",
      type: "assessment",
      subtype: "trend",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:20:00-05:00",
      recorded_at: "2026-04-18T08:20:00-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "agent_inference", ref: "run_assessment" },
      certainty: "inferred",
      status: "active",
      data: { summary: "trend" },
      links: {
        supports: [
          {
            kind: "event",
            id: "evt_obs_01",
          },
          {
            kind: "artifact",
            id: "evt_artifact_01",
          },
          {
            kind: "vitals",
            metric: "spo2",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:10:00-05:00",
            encounterId: "enc_001",
          },
        ],
        addresses: ["evt_intent_01", "evt_problem_01"],
      },
      transform: {
        activity: "extract",
        tool: "fixture-builder",
        input_refs: [
          {
            kind: "note",
            id: "note_20260418T0815_sbar",
          },
          {
            kind: "artifact",
            id: "evt_artifact_01",
          },
          {
            kind: "vitals",
            metric: "heart_rate",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:10:00-05:00",
            encounterId: "enc_001",
          },
        ],
      },
    },
  ];
  await fs.writeFile(
    path.join(patientRoot, "timeline", "2026-04-18", "events.ndjson"),
    events.map((event) => JSON.stringify(event)).join("\n") + "\n",
  );
  await fs.writeFile(
    path.join(patientRoot, "timeline", "2026-04-18", "vitals.jsonl"),
    [
      {
        sampled_at: "2026-04-18T08:00:00-05:00",
        subject: "patient_001",
        encounter_id: "enc_001",
        source: { kind: "monitor_extension" },
        name: "spo2",
        value: 94,
      },
      {
        sampled_at: "2026-04-18T08:05:00-05:00",
        subject: "patient_001",
        encounter_id: "enc_001",
        source: { kind: "monitor_extension" },
        name: "spo2",
        value: 92,
      },
      {
        sampled_at: "2026-04-18T08:00:00-05:00",
        subject: "patient_001",
        encounter_id: "enc_001",
        source: { kind: "monitor_extension" },
        name: "heart_rate",
        value: 88,
      },
      {
        sampled_at: "2026-04-18T08:05:00-05:00",
        subject: "patient_001",
        encounter_id: "enc_001",
        source: { kind: "monitor_extension" },
        name: "heart_rate",
        value: 92,
      },
    ].map((sample) => JSON.stringify(sample)).join("\n") + "\n",
  );
  await fs.mkdir(path.join(patientRoot, "timeline", "2026-04-18", "notes"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(patientRoot, "timeline", "2026-04-18", "notes", "2026-04-18-0815-sbar.md"),
    [
      "---",
      "id: note_20260418T0815_sbar",
      "type: communication",
      "subject: patient_001",
      "encounter_id: enc_001",
      "effective_at: '2026-04-18T08:15:00-05:00'",
      "recorded_at: '2026-04-18T08:15:00-05:00'",
      "author: { id: x, role: rn }",
      "source: { kind: manual_scenario }",
      "status: final",
      "references:",
      "  - evt_obs_01",
      "---",
      "",
      "SBAR body",
      "",
    ].join("\n"),
  );
  await fs.mkdir(path.join(patientRoot, "artifacts"), { recursive: true });
  await fs.writeFile(path.join(patientRoot, "artifacts", "artifact_row_01"), "artifact bytes");

  return { root, patientId };
}

async function readEvents(root: string, patientId: string) {
  const text = await fs.readFile(
    path.join(root, "patients", patientId, "timeline", "2026-04-18", "events.ndjson"),
    "utf8",
  );
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("migrate-v02-to-v03 rewrites every mechanical rule and validates green", async () => {
  const { root, patientId } = await buildV02Fixture();
  const result = await migrateV02ToV03(root, patientId);

  assert.equal(result.validation.errors, 0);
  assert.equal(result.addressesToResolves, 1);

  const registry = yaml.load(await fs.readFile(path.join(root, "pi-chart.yaml"), "utf8")) as any;
  const chart = yaml.load(
    await fs.readFile(path.join(root, "patients", patientId, "chart.yaml"), "utf8"),
  ) as any;
  assert.equal(registry.schema_version, "0.3.0-partial");
  assert.equal(chart.schema_version, "0.3.0-partial");

  const events = await readEvents(root, patientId);
  const assessment = events.find((event) => event.id === "evt_assessment_01");
  assert(assessment);
  assert.deepEqual(assessment.links.supports[0], {
    ref: "evt_obs_01",
    kind: "event",
  });
  assert.deepEqual(assessment.links.supports[1], {
    ref: "evt_artifact_01",
    kind: "artifact",
  });
  assert.deepEqual(assessment.links.supports[2], {
    ref: "vitals://enc_001?name=spo2&from=2026-04-18T08%3A00%3A00-05%3A00&to=2026-04-18T08%3A10%3A00-05%3A00",
    kind: "vitals_window",
    selection: {
      metric: "spo2",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:10:00-05:00",
      encounterId: "enc_001",
    },
  });
  assert.deepEqual(assessment.links.addresses, ["evt_problem_01"]);
  assert.deepEqual(assessment.links.resolves, ["evt_intent_01"]);
  assert.deepEqual(assessment.transform.input_refs[0], {
    ref: "note_20260418T0815_sbar",
    kind: "note",
  });
  assert.deepEqual(assessment.transform.input_refs[1], {
    ref: "evt_artifact_01",
    kind: "artifact",
  });
  assert.deepEqual(assessment.transform.input_refs[2], {
    ref: "vitals://enc_001?name=heart_rate&from=2026-04-18T08%3A00%3A00-05%3A00&to=2026-04-18T08%3A10%3A00-05%3A00",
    kind: "vitals_window",
    selection: {
      metric: "heart_rate",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:10:00-05:00",
      encounterId: "enc_001",
    },
  });

  const report = await validateChart({ chartRoot: root, patientId });
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors, null, 2));
});

test("migrate-v02-to-v03 is byte-identical on re-run", async () => {
  const { root, patientId } = await buildV02Fixture();
  await migrateV02ToV03(root, patientId);

  const files = [
    "pi-chart.yaml",
    path.join("patients", patientId, "chart.yaml"),
    path.join("patients", patientId, "timeline", "2026-04-18", "events.ndjson"),
  ];
  const before = new Map<string, string>();
  for (const file of files) {
    before.set(file, await fs.readFile(path.join(root, file), "utf8"));
  }

  const rerun = await migrateV02ToV03(root, patientId);
  assert.equal(rerun.alreadyMigrated, true);

  for (const file of files) {
    assert.equal(await fs.readFile(path.join(root, file), "utf8"), before.get(file));
  }
});

test("migrate-v02-to-v03 leaves the live tree untouched on validation failure", async () => {
  const { root, patientId } = await buildV02Fixture();
  const eventsPath = path.join(
    root,
    "patients",
    patientId,
    "timeline",
    "2026-04-18",
    "events.ndjson",
  );
  const originalEvents = await fs.readFile(eventsPath, "utf8");
  const invalid = JSON.parse(originalEvents.trim().split("\n").at(-1)!);
  invalid.links.supports = ["vitals://enc_001?missing=fields"];
  await fs.writeFile(
    eventsPath,
    originalEvents.trim().split("\n").slice(0, -1).concat(JSON.stringify(invalid)).join("\n") + "\n",
  );

  const beforeRegistry = await fs.readFile(path.join(root, "pi-chart.yaml"), "utf8");
  const beforeChart = await fs.readFile(
    path.join(root, "patients", patientId, "chart.yaml"),
    "utf8",
  );
  const beforeEvents = await fs.readFile(eventsPath, "utf8");

  await assert.rejects(
    () => migrateV02ToV03(root, patientId),
    /migration validation failed/,
  );

  assert.equal(await fs.readFile(path.join(root, "pi-chart.yaml"), "utf8"), beforeRegistry);
  assert.equal(
    await fs.readFile(path.join(root, "patients", patientId, "chart.yaml"), "utf8"),
    beforeChart,
  );
  assert.equal(await fs.readFile(eventsPath, "utf8"), beforeEvents);
});
