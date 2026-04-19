import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
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
