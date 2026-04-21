import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  makeEmptyPatient,
  appendRawEvent,
  appendRawVital,
  writeRawNote,
  patientDir,
} from "../test-helpers/fixture.js";
import { evidenceChain } from "./evidenceChain.js";

function obs(id: string, at: string, extras: Record<string, unknown> = {}) {
  return {
    id,
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 91, unit: "%" },
    links: { supports: [] },
    ...extras,
  };
}

test("event ref: chain recurses to supporting observation", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:15:00-05:00",
    recorded_at: "2026-04-18T08:15:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "inferred",
    status: "active",
    data: { summary: "hypoxia" },
    links: { supports: ["evt_obs_01"] },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  assert.equal(node.kind, "event");
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 1);
  assert.equal(node.supports[0].kind, "event");
});

test("vitals ref: chain resolves to trend points", async () => {
  const scope = await makeEmptyPatient();
  for (let i = 0; i < 3; i++) {
    await appendRawVital(scope, "2026-04-18", {
      sampled_at: `2026-04-18T08:${String(i * 5).padStart(2, "0")}:00-05:00`,
      subject: "patient_001",
      encounter_id: "enc_001",
      source: { kind: "monitor_extension" },
      name: "spo2",
      value: 94 - i,
    });
  }
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "inferred",
    status: "active",
    data: { summary: "drop" },
    links: {
      supports: [
        {
          kind: "vitals",
          metric: "spo2",
          from: "2026-04-18T08:00:00-05:00",
          to: "2026-04-18T08:15:00-05:00",
          encounterId: "enc_001",
        },
      ],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 1);
  const ref = node.supports[0];
  assert.equal(ref.kind, "vitals");
  if (ref.kind !== "vitals") throw new Error();
  assert.equal(ref.metric, "spo2");
  assert(ref.points.length >= 2);
});

test("vitals ref preserves encounter scoping across evidenceChain -> trend", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 94,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_002",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 80,
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "inferred",
    status: "active",
    data: { summary: "drop" },
    links: {
      supports: [
        {
          kind: "vitals",
          metric: "spo2",
          from: "2026-04-18T08:00:00-05:00",
          to: "2026-04-18T08:10:00-05:00",
          encounterId: "enc_001",
        },
      ],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const ref = node.supports[0];
  assert.equal(ref.kind, "vitals");
  if (ref.kind !== "vitals") throw new Error();
  assert.deepEqual(ref.points.map((point) => point.value), [94]);
});

test("artifact ref: chain drops escaped paths even if the file exists outside artifacts", async () => {
  const scope = await makeEmptyPatient();
  const pdir = patientDir(scope);
  await fs.mkdir(path.join(pdir, "artifacts"), { recursive: true });
  await fs.writeFile(path.join(pdir, "outside.pdf"), "pdf-bytes");
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_art_01",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "artifact_ingest" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "artifacts/../outside.pdf", description: "report" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "inferred",
    status: "active",
    data: { summary: "consistent with report" },
    links: { supports: [{ kind: "artifact", id: "evt_art_01" }] },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 0);
});

test("note ref: chain resolves to NarrativeEntry", async () => {
  const scope = await makeEmptyPatient();
  await writeRawNote(
    scope,
    "2026-04-18",
    "0845_sbar.md",
    {
      id: "note_20260418T0845_sbar",
      type: "communication",
      subtype: "sbar",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:45:00-05:00",
      recorded_at: "2026-04-18T08:45:10-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "SBAR body",
  );
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "inferred",
    status: "active",
    data: { summary: "stable per handoff" },
    links: {
      supports: [{ kind: "note", id: "note_20260418T0845_sbar" }],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const ref = node.supports[0];
  assert.equal(ref.kind, "note");
  if (ref.kind !== "note") throw new Error();
  assert.equal(ref.note.id, "note_20260418T0845_sbar");
  assert(ref.note.body.includes("SBAR body"));
});

test("artifact ref: chain resolves to ArtifactPointer when file exists", async () => {
  const scope = await makeEmptyPatient();
  const pdir = patientDir(scope);
  await fs.mkdir(path.join(pdir, "artifacts"), { recursive: true });
  const artifactPath = "artifacts/x.pdf";
  await fs.writeFile(path.join(pdir, artifactPath), "pdf-bytes");
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_art_01",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "artifact_ingest" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: artifactPath, description: "report" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "inferred",
    status: "active",
    data: { summary: "consistent with report" },
    links: { supports: [{ kind: "artifact", id: "evt_art_01" }] },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const ref = node.supports[0];
  assert.equal(ref.kind, "artifact");
  if (ref.kind !== "artifact") throw new Error();
  assert.equal(ref.artifact.path, artifactPath);
});
