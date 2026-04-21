import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import { appendEvent } from "./write.js";
import {
  latestEffectiveAt,
  readActiveConstraints,
  readLatestVitals,
  readRecentEvents,
} from "./read.js";

const FIXTURE = path.resolve(import.meta.dirname, "..");

async function freshChart(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-read-"));
  await fs.writeFile(
    path.join(dir, "chart.yaml"),
    "subject: patient_001\nclock: sim_time\n",
  );
  return dir;
}

test("readActiveConstraints returns structured + body", async () => {
  const out = await readActiveConstraints(FIXTURE);
  assert(out.structured);
  assert.equal(out.structured!.code_status, "full_code");
  assert.equal(out.structured!.allergies?.[0]?.substance, "penicillin");
  assert(out.body.includes("Penicillin"));
});

test("readActiveConstraints returns null structured when block absent", async () => {
  const root = await freshChart();
  await fs.writeFile(
    path.join(root, "constraints.md"),
    "---\nid: x\ntype: constraint_set\nsubject: patient_001\nstatus: active\nauthor: {id: x, role: rn}\nsource: {kind: x}\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\n---\n\n# narrative only\n",
  );
  const out = await readActiveConstraints(root);
  assert.equal(out.structured, null);
  assert(out.body.includes("narrative only"));
});

test("readRecentEvents defaults asOf to latest chart event, not wall clock", async () => {
  const events = await readRecentEvents({ chartRoot: FIXTURE, withinMinutes: 60 });
  // Sample chart's latest event is 2026-04-18T08:45 — wall-clock now would
  // exclude all of them. Sim-time default keeps them in.
  assert(events.length > 0);
  assert(events.some((e) => e.id.startsWith("evt_20260418T08")));
});

test("readRecentEvents respects explicit asOf", async () => {
  const events = await readRecentEvents({
    chartRoot: FIXTURE,
    withinMinutes: 5,
    asOf: new Date("2026-04-18T08:20:00-05:00"),
  });
  for (const e of events) {
    const t = new Date(e.effective_at);
    assert(t >= new Date("2026-04-18T08:15:00-05:00"));
  }
});

test("readLatestVitals picks newest by parsed timestamp", async () => {
  const latest = await readLatestVitals(FIXTURE);
  assert.equal(latest.spo2.value, 89);
  assert.equal(latest.heart_rate.value, 108);
});

test("latestEffectiveAt walks events + vitals", async () => {
  const t = await latestEffectiveAt(FIXTURE);
  assert(t);
  assert.equal(t!.toISOString(), new Date("2026-04-18T08:45:00-05:00").toISOString());
});

test("readRecentEvents sim-time default uses appended event time", async () => {
  const root = await freshChart();
  await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "k" },
      certainty: "observed",
      status: "final",
      data: { name: "n", value: 1 },
      links: { supports: [] },
    } as any,
    { chartRoot: root },
  );
  const events = await readRecentEvents({ chartRoot: root, withinMinutes: 60 });
  assert.equal(events.length, 1);
});
