import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
  writeRawNote,
} from "../test-helpers/fixture.js";
import { narrative } from "./narrative.js";

async function seedTwoNotes(): Promise<ReturnType<typeof makeEmptyPatient>> {
  const scopeP = makeEmptyPatient();
  const scope = await scopeP;
  await writeRawNote(
    scope,
    "2026-04-18",
    "0800_sbar.md",
    {
      id: "note_20260418T0800_sbar",
      type: "communication",
      subtype: "sbar",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      recorded_at: "2026-04-18T08:00:30-05:00",
      author: { id: "rn_shane", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "SBAR body",
  );
  await writeRawNote(
    scope,
    "2026-04-18",
    "0900_handoff.md",
    {
      id: "note_20260418T0900_handoff",
      type: "communication",
      subtype: "handoff",
      subject: "patient_001",
      encounter_id: "enc_002",
      effective_at: "2026-04-18T09:00:00-05:00",
      recorded_at: "2026-04-18T09:01:00-05:00",
      author: { id: "rn_mae", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "Handoff body",
  );
  return Promise.resolve(scope);
}

test("narrative returns both notes in recorded_at order", async () => {
  const scope = await seedTwoNotes();
  const list = await narrative({ scope });
  assert.equal(list.length, 2);
  assert.equal(list[0].id, "note_20260418T0800_sbar");
  assert.equal(list[1].id, "note_20260418T0900_handoff");
});

test("narrative filters by subtype", async () => {
  const scope = await seedTwoNotes();
  const list = await narrative({ scope, subtypes: ["handoff"] });
  assert.deepEqual(list.map((n) => n.id), ["note_20260418T0900_handoff"]);
});

test("narrative filters by authorId", async () => {
  const scope = await seedTwoNotes();
  const list = await narrative({ scope, authorId: "rn_shane" });
  assert.deepEqual(list.map((n) => n.id), ["note_20260418T0800_sbar"]);
});

test("narrative filters by encounter", async () => {
  const scope = await seedTwoNotes();
  const list = await narrative({ scope, encounterId: "enc_002" });
  assert.deepEqual(list.map((n) => n.id), ["note_20260418T0900_handoff"]);
});

test("narrative prefixes joined communication notes with transform and role tags", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_obs_01",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 91 },
    links: { supports: [] },
  });
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
    id: "evt_comm_01",
    type: "communication",
    subtype: "sbar",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:45:00-05:00",
    recorded_at: "2026-04-18T08:45:10-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_synthesis" },
    transform: { activity: "extract", tool: "ocr" },
    certainty: "performed",
    status: "final",
    data: { note_ref: "note_20260418T0845_sbar" },
    links: {
      supports: [{ kind: "event", ref: "evt_obs_01", role: "primary" }],
    },
  });
  const list = await narrative({ scope });
  assert.equal(list[0].body, "[extracted] (primary) SBAR body");
});

test("narrative tags 'infer' activity and counterevidence role on the same event", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_obs_01",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 99 },
    links: { supports: [] },
  });
  await writeRawNote(
    scope,
    "2026-04-18",
    "1000_inference.md",
    {
      id: "note_20260418T1000_inference",
      type: "communication",
      subtype: "sbar",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T10:00:00-05:00",
      recorded_at: "2026-04-18T10:00:10-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "Inference body",
  );
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_comm_infer",
    type: "communication",
    subtype: "sbar",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:10-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_synthesis" },
    transform: { activity: "infer", tool: "llm" },
    certainty: "performed",
    status: "final",
    data: { note_ref: "note_20260418T1000_inference" },
    links: {
      supports: [
        { kind: "event", ref: "evt_obs_01", role: "counterevidence" },
      ],
    },
  });
  const list = await narrative({ scope });
  assert.equal(list[0].body, "[inferred] (counterevidence) Inference body");
});

test("narrative tags 'summarize' activity as [inferred]", async () => {
  const scope = await makeEmptyPatient();
  await writeRawNote(
    scope,
    "2026-04-18",
    "1100_summary.md",
    {
      id: "note_20260418T1100_summary",
      type: "communication",
      subtype: "sbar",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T11:00:00-05:00",
      recorded_at: "2026-04-18T11:00:10-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "Summary body",
  );
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_comm_summary",
    type: "communication",
    subtype: "sbar",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T11:00:00-05:00",
    recorded_at: "2026-04-18T11:00:10-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_synthesis" },
    transform: { activity: "summarize", tool: "llm" },
    certainty: "performed",
    status: "final",
    data: { note_ref: "note_20260418T1100_summary" },
    links: { supports: [] },
  });
  const list = await narrative({ scope });
  assert.equal(list[0].body, "[inferred] Summary body");
});

test("narrative leaves unsupported transform and role combinations untagged", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_obs_01",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 91 },
    links: { supports: [] },
  });
  await writeRawNote(
    scope,
    "2026-04-18",
    "0915_handoff.md",
    {
      id: "note_20260418T0915_handoff",
      type: "communication",
      subtype: "handoff",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T09:15:00-05:00",
      recorded_at: "2026-04-18T09:15:10-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "Import body",
  );
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_comm_02",
    type: "communication",
    subtype: "handoff",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:15:00-05:00",
    recorded_at: "2026-04-18T09:15:10-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_synthesis" },
    transform: { activity: "import", tool: "hl7" },
    certainty: "performed",
    status: "final",
    data: { note_ref: "note_20260418T0915_handoff" },
    links: {
      supports: [{ kind: "event", ref: "evt_obs_01", role: "context" }],
    },
  });
  const list = await narrative({ scope });
  assert.equal(list[0].body, "Import body");
});
