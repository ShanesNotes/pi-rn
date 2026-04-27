import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildAgentCanvasContext, vitalSourceRef } from "./agent-canvas-context.js";
import { appendRawEvent, appendRawVital, makeEmptyPatient } from "../src/test-helpers/fixture.js";

const chartRoot = path.resolve(import.meta.dirname, "..");

test("buildAgentCanvasContext is patient-agnostic and works for patient_002", async () => {
  const context = await buildAgentCanvasContext({
    chartRoot,
    patientId: "patient_002",
    encounterId: "enc_p002_001",
    asOf: "2026-04-19T09:36:00-05:00",
    trendFrom: "2026-04-19T09:00:00-05:00",
  });

  assert.equal(context.patientId, "patient_002");
  assert.equal(context.encounterId, "enc_p002_001");
  assert.equal(context.clinical.latestVitals.spo2.value, 89);
  assert.equal(context.clinical.latestVitals.spo2.sample_key, "vital_647c98955de3bdeb");
  assert.ok(context.clinical.openLoop.detail.includes("SpO₂ < 90%"));
});

test("buildAgentCanvasContext also works for another opened patient chart", async () => {
  const context = await buildAgentCanvasContext({
    chartRoot,
    patientId: "patient_001",
    encounterId: "enc_001",
    asOf: "2026-04-18T08:45:00-05:00",
    trendFrom: "2026-04-18T08:00:00-05:00",
  });

  assert.equal(context.patientId, "patient_001");
  assert.equal(context.encounterId, "enc_001");
  assert.equal(context.clinical.latestVitals.spo2.value, 89);
  assert.ok(context.clinical.trends.spo2.length >= 5);
  assert.ok(context.clinical.openLoop.title.length > 0);
  assert.doesNotMatch(context.clinical.openLoop.detail, /09:50/);
});

test("buildAgentCanvasContext scopes latest vitals and loops to the opened encounter", async () => {
  const scope = await makeEmptyPatient({ patientId: "patient_context_scope" });
  await appendRawVital(scope, "2026-04-18", vital("enc_a", "2026-04-18T08:00:00-05:00", 91));
  await appendRawVital(scope, "2026-04-18", vital("enc_b", "2026-04-18T08:10:00-05:00", 70));
  await appendRawEvent(scope, "2026-04-18", intent("wrong_loop", "enc_b", "2026-04-18T08:00:00-05:00", "Wrong encounter loop"));
  await appendRawEvent(scope, "2026-04-18", intent("right_loop", "enc_a", "2026-04-18T08:05:00-05:00", "Maintain opened encounter oxygen watch"));

  const context = await buildAgentCanvasContext({
    chartRoot: scope.chartRoot,
    patientId: scope.patientId,
    encounterId: "enc_a",
    asOf: "2026-04-18T08:15:00-05:00",
    trendFrom: "2026-04-18T08:00:00-05:00",
    trendMetrics: ["spo2"],
  });

  assert.equal(context.clinical.latestVitals.spo2.value, 91);
  assert.equal(context.clinical.trends.spo2.length, 1);
  assert.equal(context.clinical.openLoop.title, "Reassess oxygen response & WoB");
  assert.match(context.clinical.openLoop.detail, /Due 08:45/);
  assert.doesNotMatch(context.clinical.openLoop.detail, /Wrong encounter loop/);
});

test("vitalSourceRef builds encounter-scoped sample-key provenance", () => {
  assert.equal(
    vitalSourceRef("enc_abc", "spo2", { sample_key: "vital_1234567890abcdef" }),
    "vitals://enc_abc/spo2#vital_1234567890abcdef",
  );
});

test("agent canvas context builder does not bake in the demo patient", () => {
  const source = readFileSync(path.resolve(import.meta.dirname, "agent-canvas-context.ts"), "utf8");
  assert.doesNotMatch(source, /patient_002/);
  assert.doesNotMatch(source, /enc_p002_001/);
  assert.doesNotMatch(source, /agent-canvas-fixtures/);
});

function vital(encounterId: string, sampledAt: string, value: number) {
  return {
    sampled_at: sampledAt,
    recorded_at: sampledAt,
    sample_key: `vital_${encounterId}`,
    subject: "patient_context_scope",
    encounter_id: encounterId,
    source: { kind: "monitor_extension", ref: "test-monitor" },
    name: "spo2",
    value,
    unit: "%",
    quality: "valid",
  };
}

function intent(id: string, encounterId: string, at: string, goal: string) {
  return {
    id,
    type: "intent",
    subtype: "care_plan",
    subject: "patient_context_scope",
    encounter_id: encounterId,
    effective_at: at,
    recorded_at: at,
    author: { id: "test_agent", role: "rn_agent" },
    source: { kind: "agent_inference", ref: id },
    certainty: "planned",
    status: "active",
    data: {
      goal,
      due_by: "2026-04-18T08:45:00-05:00",
      contingencies: [{ trigger: "SpO2 < 90%" }],
    },
    links: { supports: [] },
  };
}
