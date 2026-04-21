import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import { validateChart } from "./validate.js";

const FIXTURE = path.resolve(import.meta.dirname, "..");

async function copyFixture(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-val-"));
  await fs.cp(FIXTURE, dir, {
    recursive: true,
    filter: (src) =>
      !/node_modules|_derived/.test(src),
  });
  return dir;
}

test("baseline fixture validates green", async () => {
  const root = await copyFixture();
  const r = await validateChart(root);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("subject mismatch surfaces error", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.subject = "wrong_patient";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /does not match chart\.yaml subject/.test(e.message)));
});

test("clinical event missing encounter_id rejected", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  delete ev.encounter_id;
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /encounter_id/.test(e.message)));
});

test("vitals URI window with no samples rejected", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = [
    "evt_20260418T0815_01",
    "evt_20260418T0820_01",
    "vitals://enc_001?name=spo2&from=2030-01-01T00:00:00-05:00&to=2030-01-02T00:00:00-05:00",
  ];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /matches no samples/.test(e.message)));
});

test("vitals URI malformed rejected", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = ["evt_20260418T0815_01", "vitals://enc_001?missing=fields"];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /malformed vitals URI/.test(e.message)));
});

test("assessment with no evidence rejected", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = [];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /assessment.*links\.supports/.test(e.message)));
});

test("orphan note without communication event rejected", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // drop the communication event (line 6 — last)
  await fs.writeFile(evPath, lines.slice(0, -1).join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /no matching communication event/.test(e.message)));
});

test("note references[] with unknown id rejected", async () => {
  const root = await copyFixture();
  const np = path.join(root, "timeline/2026-04-18/notes/0845_nursing-note.md");
  let text = await fs.readFile(np, "utf8");
  text = text.replace(
    "  - evt_20260418T0815_01",
    "  - evt_20260418T0815_01\n  - nonexistent_id_xyz",
  );
  await fs.writeFile(np, text);
  const r = await validateChart(root);
  assert(
    r.errors.some(
      (e) =>
        /references: unknown id 'nonexistent_id_xyz'/.test(e.message),
    ),
  );
});

test("day-prefix mismatch produces warning (not error)", async () => {
  const root = await copyFixture();
  const evPath = path.join(root, "timeline/2026-04-18/events.ndjson");
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.effective_at = "2026-04-19T08:15:00-05:00";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.warnings.some((w) => /day directory prefix/.test(w.message)));
});

test("vitals row missing encounter_id rejected", async () => {
  const root = await copyFixture();
  const vp = path.join(root, "timeline/2026-04-18/vitals.jsonl");
  const lines = (await fs.readFile(vp, "utf8")).trim().split("\n");
  const v = JSON.parse(lines[0]);
  delete v.encounter_id;
  lines[0] = JSON.stringify(v);
  await fs.writeFile(vp, lines.join("\n") + "\n");
  const r = await validateChart(root);
  assert(r.errors.some((e) => /encounter_id/.test(e.message)));
});
