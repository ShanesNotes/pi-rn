import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import { validateChart } from "./validate.js";
import { patientRoot } from "./types.js";
import type { PatientScope } from "./types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

async function copyFixture(): Promise<PatientScope> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-val-"));
  await fs.cp(REPO_ROOT, dir, {
    recursive: true,
    filter: (src) =>
      !/node_modules|_derived/.test(src),
  });
  return { chartRoot: dir, patientId: "patient_001" };
}

function patientTimelineEvents(scope: PatientScope): string {
  return path.join(patientRoot(scope), "timeline/2026-04-18/events.ndjson");
}

test("baseline fixture validates green", async () => {
  const scope = await copyFixture();
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("subject mismatch surfaces error", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.subject = "wrong_patient";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /does not match chart\.yaml subject/.test(e.message)));
});

test("clinical event missing encounter_id rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  delete ev.encounter_id;
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /encounter_id/.test(e.message)));
});

test("V-SRC-01 warns on unknown source.kind", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.source.kind = "monitor_extention";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => /V-SRC-01/.test(w.message) && /monitor_extention/.test(w.message)));
});

test("V-SRC-02 warns on deprecated agent_reasoning", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const deprecated = {
    id: "evt_deprecated_source",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "pi-agent", role: "rn_agent" },
    source: { kind: "agent_reasoning", ref: "run_test" },
    certainty: "inferred",
    status: "final",
    data: { summary: "test trend" },
    links: {
      supports: ["evt_20260418T0815_01"],
      supersedes: [],
    },
  };
  await fs.appendFile(evPath, JSON.stringify(deprecated) + "\n");
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => /V-SRC-02/.test(w.message) && /agent_reasoning/.test(w.message)));
});

test("V-SRC-03 rejects import events missing structured provenance", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const imported = {
    id: "evt_import_bad",
    type: "observation",
    subtype: "lab_result",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:10:00-05:00",
    author: { id: "importer", role: "system" },
    source: { kind: "synthea_import", ref: "row_1" },
    certainty: "observed",
    status: "final",
    data: { name: "lactate", value: 3.2, unit: "mmol/L", status_detail: "final" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(imported) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-SRC-03/.test(e.message) && /generator_version/.test(e.message)));
});

test("vitals URI window with no samples rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = [
    "evt_20260418T0815_01",
    "evt_20260418T0820_01",
    "vitals://enc_001?name=spo2&from=2030-01-01T00:00:00-05:00&to=2030-01-02T00:00:00-05:00",
  ];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /matches no samples/.test(e.message)));
});

test("vitals URI malformed rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = ["evt_20260418T0815_01", "vitals://enc_001?missing=fields"];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /malformed vitals URI/.test(e.message)));
});

test("V-TIME-02 rejects future-dated point intent missing due_by", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const pointIntent = {
    id: "evt_future_intent_bad",
    type: "intent",
    subtype: "monitoring_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T11:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "active",
    data: { goal: "future cadence" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(pointIntent) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-TIME-02/.test(e.message) && /requires data\.due_by/.test(e.message)));
});

test("future-dated interval intent is permitted without due_by", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const intervalIntent = {
    id: "evt_future_interval_intent",
    type: "intent",
    subtype: "monitoring_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: {
      start: "2026-04-18T11:00:00-05:00",
    },
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "active",
    data: { goal: "future cadence" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(intervalIntent) + "\n");
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => /evt_future_interval_intent/.test(e.where)));
});

test("assessment with no evidence rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = [];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /assessment.*links\.supports/.test(e.message)));
});

test("V-STATUS-02 rejects final order with non-terminal status_detail", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badOrder = {
    id: "evt_status_bad",
    type: "intent",
    subtype: "order",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "final",
    data: { order: "repeat lactate", status_detail: "active" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badOrder) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-STATUS-02/.test(e.message) && /requires terminal/.test(e.message)));
});

test("V-STATUS-03 rejects backtracking status_detail transitions via supersedes", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const prior = {
    id: "evt_problem_resolved",
    type: "assessment",
    subtype: "problem",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "inferred",
    status: "final",
    data: { summary: "resolved hypoxia", status_detail: "resolved" },
    links: { supports: ["evt_20260418T0815_01"] },
  };
  const backtrack = {
    ...prior,
    id: "evt_problem_backtrack",
    effective_at: "2026-04-18T09:10:00-05:00",
    recorded_at: "2026-04-18T09:10:00-05:00",
    status: "active",
    data: { summary: "problem active again", status_detail: "active" },
    links: { supports: ["evt_20260418T0815_01"], supersedes: ["evt_problem_resolved"] },
  };
  await fs.appendFile(evPath, JSON.stringify(prior) + "\n" + JSON.stringify(backtrack) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-STATUS-03/.test(e.message) && /resolved' -> 'active'/.test(e.message)));
});

test("orphan note without communication event rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // drop the communication event (line 6 — last)
  await fs.writeFile(evPath, lines.slice(0, -1).join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /no matching communication event/.test(e.message)));
});

test("note references[] with unknown id rejected", async () => {
  const scope = await copyFixture();
  const np = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/notes/0845_nursing-note.md",
  );
  let text = await fs.readFile(np, "utf8");
  text = text.replace(
    "  - evt_20260418T0815_01",
    "  - evt_20260418T0815_01\n  - nonexistent_id_xyz",
  );
  await fs.writeFile(np, text);
  const r = await validateChart(scope);
  assert(
    r.errors.some(
      (e) =>
        /references: unknown id 'nonexistent_id_xyz'/.test(e.message),
    ),
  );
});

test("day-prefix mismatch produces warning (not error)", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.effective_at = "2026-04-19T08:15:00-05:00";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => /day directory prefix/.test(w.message)));
});

test("encounter day-prefix mismatch produces warning", async () => {
  const scope = await copyFixture();
  const encounterPath = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/encounter_001.md",
  );
  let text = await fs.readFile(encounterPath, "utf8");
  text = text.replace(
    "effective_at: 2026-04-18T06:00:00-05:00",
    "effective_at: 2026-04-19T06:00:00-05:00",
  );
  await fs.writeFile(encounterPath, text);
  const r = await validateChart(scope);
  assert(
    r.warnings.some(
      (w) =>
        w.where === "timeline/2026-04-18/encounter_001.md" &&
        /day directory prefix/.test(w.message),
    ),
  );
});

test("note day-prefix mismatch produces warning", async () => {
  const scope = await copyFixture();
  const notePath = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/notes/0845_nursing-note.md",
  );
  let text = await fs.readFile(notePath, "utf8");
  text = text.replace(
    "effective_at: 2026-04-18T08:45:00-05:00",
    "effective_at: 2026-04-19T08:45:00-05:00",
  );
  await fs.writeFile(notePath, text);
  const r = await validateChart(scope);
  assert(
    r.warnings.some(
      (w) =>
        w.where === "timeline/2026-04-18/notes/0845_nursing-note.md" &&
        /day directory prefix/.test(w.message),
    ),
  );
});

test("chart.yaml subject drifting from patient directory is an error", async () => {
  // Invariant 6: directory is authoritative; a drifted chart.yaml.subject
  // must not silently become a new identity for the tree.
  const scope = await copyFixture();
  const chartPath = path.join(patientRoot(scope), "chart.yaml");
  const original = await fs.readFile(chartPath, "utf8");
  await fs.writeFile(
    chartPath,
    original.replace(/^subject:.*$/m, "subject: patient_999"),
  );
  const r = await validateChart(scope);
  assert(
    r.errors.some(
      (e) =>
        e.where === "chart.yaml" &&
        /does not match patient directory/.test(e.message),
    ),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-INTERVAL-02 rejects effective_period on point-shaped subtype", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badInterval = {
    id: "evt_interval_bad",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: {
      start: "2026-04-18T09:00:00-05:00",
      end: "2026-04-18T10:00:00-05:00",
    },
    recorded_at: "2026-04-18T09:05:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 92, unit: "%" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badInterval) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-INTERVAL-02/.test(e.message) && /vital_sign/.test(e.message)));
});

test("V-INTERVAL-04 rejects point event superseding an interval to close it", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const openInterval = {
    id: "evt_interval_open",
    type: "action",
    subtype: "administration",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: {
      start: "2026-04-18T09:00:00-05:00",
    },
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "performed",
    status: "active",
    data: { action: "norepinephrine infusion" },
    links: { supports: [] },
  };
  const pointCloser = {
    id: "evt_interval_close_bad",
    type: "action",
    subtype: "administration",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "performed",
    status: "final",
    data: { action: "stop infusion", status_detail: "performed" },
    links: { supports: [], supersedes: ["evt_interval_open"] },
  };
  await fs.appendFile(evPath, JSON.stringify(openInterval) + "\n" + JSON.stringify(pointCloser) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-INTERVAL-04/.test(e.message) && /may not supersede interval/.test(e.message)));
});

test("vitals row missing encounter_id rejected", async () => {
  const scope = await copyFixture();
  const vp = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/vitals.jsonl",
  );
  const lines = (await fs.readFile(vp, "utf8")).trim().split("\n");
  const v = JSON.parse(lines[0]);
  delete v.encounter_id;
  lines[0] = JSON.stringify(v);
  await fs.writeFile(vp, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /encounter_id/.test(e.message)));
});

test("invariant 8: multi-supersessor for one target is rejected", async () => {
  const scope = await copyFixture();
  // Append two events that both claim to supersede the same target.
  const evPath = patientTimelineEvents(scope);
  const existing = JSON.parse((await fs.readFile(evPath, "utf8")).trim().split("\n")[0]);
  const targetId = existing.id;
  const rival1 = {
    ...existing,
    id: "evt_rival_01",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    links: { supports: existing.links?.supports ?? [], supersedes: [targetId] },
  };
  const rival2 = {
    ...existing,
    id: "evt_rival_02",
    effective_at: "2026-04-18T10:01:00-05:00",
    recorded_at: "2026-04-18T10:01:00-05:00",
    links: { supports: existing.links?.supports ?? [], supersedes: [targetId] },
  };
  await fs.appendFile(evPath, JSON.stringify(rival1) + "\n" + JSON.stringify(rival2) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /invariant 8/.test(e.message) && /has 2 supersedes-claims/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("invariant 8: a supersession cycle is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const existing = JSON.parse((await fs.readFile(evPath, "utf8")).trim().split("\n")[0]);
  const aId = existing.id;
  const evB = {
    ...existing,
    id: "evt_cycle_B",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    links: { supports: existing.links?.supports ?? [], supersedes: [aId] },
  };
  // Mutate line 0 to introduce the cycle A→B.
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const mutatedA = { ...existing, links: { ...(existing.links ?? {}), supersedes: ["evt_cycle_B"] } };
  lines[0] = JSON.stringify(mutatedA);
  await fs.writeFile(evPath, lines.join("\n") + "\n" + JSON.stringify(evB) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /cycle detected/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("invariant 10: links.fulfills targeting a non-intent is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // Line 0 is an observation in the seed; make a new action that "fulfills" it.
  const observationId = JSON.parse(lines[0]).id;
  const badAction = {
    id: "evt_action_bad",
    type: "action",
    subtype: "notification",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "agent_action" },
    certainty: "performed",
    status: "final",
    data: { action: "notify_md" },
    links: { supports: [], fulfills: [observationId] },
  };
  await fs.appendFile(evPath, JSON.stringify(badAction) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /invariant 10/.test(e.message) && /must be 'intent'/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-FULFILL-02 rejects acquisition action without fulfills", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badAcquisition = {
    id: "evt_acq_bad",
    type: "action",
    subtype: "specimen_collection",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "performed",
    status: "final",
    data: { specimen_type: "blood" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badAcquisition) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-FULFILL-02/.test(e.message) && /must carry links\.fulfills/.test(e.message)));
});

test("V-FULFILL-03 rejects result observation without acquisition action support", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badResult = {
    id: "evt_result_bad",
    type: "observation",
    subtype: "lab_result",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:10:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { name: "lactate", value: 3.2, unit: "mmol/L", status_detail: "final" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badResult) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-FULFILL-03/.test(e.message) && /must support an acquisition action/.test(e.message)));
});

test("invariant 10: links.addresses targeting an arbitrary observation is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const observationId = JSON.parse(lines[0]).id;
  const badIntent = {
    id: "evt_intent_bad",
    type: "intent",
    subtype: "care_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "planned",
    status: "active",
    data: { goal: "watch" },
    links: { supports: [], addresses: [observationId] },
  };
  await fs.appendFile(evPath, JSON.stringify(badIntent) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /invariant 10/.test(e.message) && /assessment\/problem or an intent/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("links.supports accepts a legacy structured vitals EvidenceRef", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // Line 2 in the seed is the first assessment — mutate its supports to
  // include a structured vitals ref over a known-good window.
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    ...assessment.links.supports.filter((s: unknown) => typeof s === "string"),
    {
      kind: "vitals",
      metric: "spo2",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:45:00-05:00",
      encounterId: "enc_001",
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("legacy structured vitals without encounterId remain valid", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    ...assessment.links.supports.filter((s: unknown) => typeof s === "string"),
    {
      kind: "vitals",
      metric: "spo2",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:45:00-05:00",
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("links.supports accepts a canonical vitals_window EvidenceRef", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    ...assessment.links.supports.filter((s: unknown) => typeof s === "string"),
    {
      kind: "vitals_window",
      ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:45:00-05:00",
      selection: {
        metric: "spo2",
        from: "2026-04-18T08:00:00-05:00",
        to: "2026-04-18T08:45:00-05:00",
        encounterId: "enc_001",
      },
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("external EvidenceRef is structurally accepted but does not satisfy assessment evidence", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    {
      kind: "external",
      ref: "synthea://enc_001?resource=Observation/obs_71",
      role: "context",
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /assessment.*links\.supports/.test(e.message)));
  assert(!r.errors.some((e) => /unknown target id|malformed structured EvidenceRef|unknown kind/.test(e.message)));
});

test("artifact_ref absolute path is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badArtifact = {
    id: "evt_artifact_bad_abs",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "/tmp/outside.pdf", description: "bad" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badArtifact) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /must be patient-root-relative, not absolute/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("artifact_ref traversal path is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badArtifact = {
    id: "evt_artifact_bad_escape",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "artifacts/../../outside.pdf", description: "bad" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badArtifact) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /escapes the patient artifact tree/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});
