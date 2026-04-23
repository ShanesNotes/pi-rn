import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadValidator } from "./schema.js";

const FIXTURE_ROOT = path.resolve(import.meta.dirname, "..");

const goodEvent = {
  id: "evt_20260418T0815_01",
  type: "observation",
  subject: "patient_001",
  encounter_id: "enc_001",
  effective_at: "2026-04-18T08:15:00-05:00",
  recorded_at: "2026-04-18T08:15:30-05:00",
  author: { id: "x", role: "rn_agent" },
  source: { kind: "patient_statement" },
  certainty: "reported",
  status: "final",
  data: { name: "x", value: "y" },
  links: { supports: [] },
};

test("known-good clinical event validates", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  assert.equal(v(goodEvent), true);
});

test("canonical EvidenceRef plus transform/resolves/contradicts validate", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const ok = {
    ...goodEvent,
    type: "assessment",
    certainty: "inferred",
    data: { summary: "derived assessment" },
    links: {
      supports: [
        {
          kind: "event",
          ref: "evt_20260418T0815_01",
          role: "primary",
          basis: "same-patient source event",
          derived_from: [
            {
              kind: "external",
              ref: "synthea://enc_001?resource=Observation/obs_71",
            },
          ],
        },
      ],
      resolves: ["evt_open_loop_01"],
      contradicts: [{ ref: "evt_prior_claim_01", basis: "conflicting evidence" }],
    },
    transform: {
      activity: "infer",
      tool: "agent-inference-engine",
      input_refs: [
        {
          kind: "external",
          ref: "synthea://enc_001?resource=Observation/obs_71",
        },
      ],
    },
  };
  assert.equal(v(ok), true, JSON.stringify(v.errors, null, 2));
});

test("interval-shaped event validates with effective_period", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const ok = {
    ...goodEvent,
    subtype: "care_plan",
    type: "intent",
    certainty: "planned",
    data: { goal: "monitor closely" },
    links: { supports: [] },
    effective_period: {
      start: "2026-04-18T08:15:00-05:00",
      end: "2026-04-18T10:15:00-05:00",
    },
  } as any;
  delete ok.effective_at;
  assert.equal(v(ok), true);
});

test("event with both effective_at and effective_period fails XOR schema", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const bad = {
    ...goodEvent,
    effective_period: {
      start: "2026-04-18T08:15:00-05:00",
      end: "2026-04-18T10:15:00-05:00",
    },
  } as any;
  assert.equal(v(bad), false);
});

test("event with neither effective_at nor effective_period fails XOR schema", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const bad = { ...goodEvent } as any;
  delete bad.effective_at;
  assert.equal(v(bad), false);
});

test("clinical event missing encounter_id fails conditional schema", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const bad = { ...goodEvent } as any;
  delete bad.encounter_id;
  assert.equal(v(bad), false);
  assert(v.errors!.some((e) => /encounter_id/.test(e.message ?? "")));
});

test("clinical event missing data fails conditional schema", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const bad = { ...goodEvent } as any;
  delete bad.data;
  assert.equal(v(bad), false);
});

test("structural event without data/links/encounter_id is OK", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "event.schema.json");
  const ok = {
    id: "patient_001",
    type: "subject",
    subject: "patient_001",
    effective_at: "2026-04-18T06:00:00-05:00",
    recorded_at: "2026-04-18T06:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "admission_intake" },
    status: "active",
  };
  assert.equal(v(ok), true);
});

test("vitals row schema requires subject + encounter_id + structured source", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "vitals.schema.json");
  const good = {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "spo2",
    value: 94,
    unit: "%",
  };
  assert.equal(v(good), true);
  const noEnc = { ...good } as any;
  delete noEnc.encounter_id;
  assert.equal(v(noEnc), false);
  const flatSource = { ...good, source: "pi-sim-monitor" } as any;
  assert.equal(v(flatSource), false);
});

test("note schema rejects missing references", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "note.schema.json");
  const fm: any = {
    id: "note_20260418T0845_sbar",
    type: "communication",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:45:00-05:00",
    recorded_at: "2026-04-18T08:45:10-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_synthesis" },
    status: "final",
  };
  assert.equal(v(fm), false);
  fm.references = [];
  assert.equal(v(fm), true);
});

test("constraints schema validates known-good block", async () => {
  const v = await loadValidator(FIXTURE_ROOT, "constraints.schema.json");
  const ok = {
    allergies: [
      { substance: "penicillin", severity: "anaphylaxis", status: "active" },
    ],
    code_status: "full_code",
    preferences: ["x"],
  };
  assert.equal(v(ok), true);
});
