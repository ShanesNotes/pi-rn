import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
  appendRawVital,
} from "../test-helpers/fixture.js";
import { trend } from "./trend.js";

test("trend pulls samples from vitals.jsonl within the window", async () => {
  const scope = await makeEmptyPatient();
  for (let i = 0; i < 3; i++) {
    await appendRawVital(scope, "2026-04-18", {
      sampled_at: `2026-04-18T08:${String(i * 10).padStart(2, "0")}:00-05:00`,
      subject: "patient_001",
      encounter_id: "enc_001",
      source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
      name: "spo2",
      value: 95 - i,
      unit: "%",
    });
  }
  const points = await trend({
    scope,
    metric: "spo2",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:15:00-05:00",
  });
  assert.equal(points.length, 2);
  assert.equal(points[0].value, 95);
  assert.equal(points[0].source, "pi-sim-monitor");
});

test("trend includes event-recorded observations for the same metric", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_lab_01",
    type: "observation",
    subtype: "lab_result",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:30-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "lab_analyzer" },
    certainty: "observed",
    status: "final",
    data: { name: "lactate", value: 3.2, unit: "mmol/L" },
    links: { supports: [] },
  });
  const points = await trend({
    scope,
    metric: "lactate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T09:00:00-05:00",
  });
  assert.equal(points.length, 1);
  assert.equal(points[0].value, 3.2);
  assert.equal(points[0].source, "lab_analyzer");
});

test("trend source filter narrows to one source", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "spo2",
    value: 95,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "patient_statement", ref: "self_report" },
    name: "spo2",
    value: 93,
  });
  const points = await trend({
    scope,
    metric: "spo2",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T09:00:00-05:00",
    source: "self_report",
  });
  assert.deepEqual(
    points.map((p) => p.value),
    [93],
  );
});

test("trend encounterId filter keeps points inside the requested encounter", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "spo2",
    value: 95,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_002",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "spo2",
    value: 81,
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_obs_enc_2",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_002",
    effective_at: "2026-04-18T08:06:00-05:00",
    recorded_at: "2026-04-18T08:06:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 80, unit: "%" },
    links: { supports: [] },
  });
  const points = await trend({
    scope,
    metric: "spo2",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:10:00-05:00",
    encounterId: "enc_001",
  });
  assert.deepEqual(points.map((point) => point.value), [95]);
});

test("trend drops structured invalid vitals and preserves sample metadata", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:02-05:00",
    sample_key: "vital_1111111111111111",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "heart_rate",
    value: 88,
    quality: { state: "valid" },
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    recorded_at: "2026-04-18T08:05:02-05:00",
    sample_key: "vital_2222222222222222",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "heart_rate",
    value: 188,
    quality: { state: "invalid", flags: ["probe_off"] },
  });

  const points = await trend({
    scope,
    metric: "heart_rate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:10:00-05:00",
  });

  assert.deepEqual(points.map((point) => point.value), [88]);
  assert.equal(points[0].sample_key, "vital_1111111111111111");
  assert.deepEqual(points[0].quality, { state: "valid" });
});

test("trend suppresses A1 canonical metrics from A3 vitals unless profile-routed", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "lactate_mmol_l",
    value: 5.1,
    unit: "mmol/L",
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "lactate_mmol_l",
    value: 4.8,
    unit: "mmol/L",
    profile: "simulation_training",
  });

  const points = await trend({
    scope,
    metric: "lactate_mmol_l",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:10:00-05:00",
  });

  assert.deepEqual(points.map((point) => point.value), [4.8]);
});
