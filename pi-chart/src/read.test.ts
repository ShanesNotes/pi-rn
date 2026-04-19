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
import { patientRoot } from "./types.js";
import type { PatientScope } from "./types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const FIXTURE_SCOPE: PatientScope = {
  chartRoot: REPO_ROOT,
  patientId: "patient_001",
};

async function freshChart(): Promise<PatientScope> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-read-"));
  const patientId = "patient_001";
  await fs.writeFile(
    path.join(dir, "pi-chart.yaml"),
    `system_version: 0.2.0\nschema_version: 0.2.0\npatients:\n  - id: ${patientId}\n    directory: patients/${patientId}\n`,
  );
  const patientDir = path.join(dir, "patients", patientId);
  await fs.mkdir(patientDir, { recursive: true });
  await fs.writeFile(
    path.join(patientDir, "chart.yaml"),
    "subject: patient_001\nclock: sim_time\n",
  );
  await fs.cp(path.join(REPO_ROOT, "schemas"), path.join(dir, "schemas"), {
    recursive: true,
  });
  return { chartRoot: dir, patientId };
}

test("readActiveConstraints returns structured + body", async () => {
  const out = await readActiveConstraints(FIXTURE_SCOPE);
  assert(out.structured);
  assert.equal(out.structured!.code_status, "full_code");
  assert.equal(out.structured!.allergies?.[0]?.substance, "penicillin");
  assert(out.body.includes("Penicillin"));
});

test("readActiveConstraints returns null structured when block absent", async () => {
  const scope = await freshChart();
  await fs.writeFile(
    path.join(patientRoot(scope), "constraints.md"),
    "---\nid: x\ntype: constraint_set\nsubject: patient_001\nstatus: active\nauthor: {id: x, role: rn}\nsource: {kind: x}\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\n---\n\n# narrative only\n",
  );
  const out = await readActiveConstraints(scope);
  assert.equal(out.structured, null);
  assert(out.body.includes("narrative only"));
});

test("readRecentEvents defaults asOf to latest chart event, not wall clock", async () => {
  const events = await readRecentEvents({ scope: FIXTURE_SCOPE, withinMinutes: 60 });
  assert(events.length > 0);
  assert(events.some((e) => e.id.startsWith("evt_20260418T08")));
});

test("readRecentEvents respects explicit asOf", async () => {
  const events = await readRecentEvents({
    scope: FIXTURE_SCOPE,
    withinMinutes: 5,
    asOf: new Date("2026-04-18T08:20:00-05:00"),
  });
  for (const e of events) {
    const t = new Date(e.effective_at);
    assert(t >= new Date("2026-04-18T08:15:00-05:00"));
  }
});

test("readRecentEvents enforces inclusive bounds and excludes future/invalid timestamps", async () => {
  const scope = await freshChart();
  const base = {
    type: "observation" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    author: { id: "x", role: "rn" },
    source: { kind: "k" },
    certainty: "observed" as const,
    status: "final" as const,
    data: { name: "n", value: 1 },
    links: { supports: [] },
  };
  await appendEvent(
    { ...base, effective_at: "2026-04-18T08:14:59-05:00" } as any,
    scope,
  );
  await appendEvent(
    { ...base, effective_at: "2026-04-18T08:15:00-05:00" } as any,
    scope,
  );
  await appendEvent(
    { ...base, effective_at: "2026-04-18T08:20:00-05:00" } as any,
    scope,
  );
  await appendEvent(
    { ...base, effective_at: "2026-04-18T08:21:00-05:00" } as any,
    scope,
  );

  const eventsPath = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/events.ndjson",
  );
  await fs.appendFile(
    eventsPath,
    `${JSON.stringify({
      ...base,
      id: "evt_invalid",
      effective_at: "not-a-date",
      recorded_at: "2026-04-18T08:20:30-05:00",
    })}\n`,
  );

  const events = await readRecentEvents({
    scope,
    withinMinutes: 5,
    asOf: new Date("2026-04-18T08:20:00-05:00"),
  });
  assert.deepEqual(
    events.map((event) => event.effective_at),
    ["2026-04-18T08:15:00-05:00", "2026-04-18T08:20:00-05:00"],
  );
});

test("readLatestVitals picks newest by parsed timestamp", async () => {
  const latest = await readLatestVitals(FIXTURE_SCOPE);
  assert.equal(latest.spo2.value, 89);
  assert.equal(latest.heart_rate.value, 108);
});

test("latestEffectiveAt walks events + vitals", async () => {
  const t = await latestEffectiveAt(FIXTURE_SCOPE);
  assert(t);
  assert.equal(t!.toISOString(), new Date("2026-04-18T08:45:00-05:00").toISOString());
});

test("readRecentEvents sim-time default uses appended event time", async () => {
  const scope = await freshChart();
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
    scope,
  );
  const events = await readRecentEvents({ scope, withinMinutes: 60 });
  assert.equal(events.length, 1);
});
