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
    source: { kind: "agent_reasoning" },
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

test("links.supports accepts a structured vitals EvidenceRef", async () => {
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
