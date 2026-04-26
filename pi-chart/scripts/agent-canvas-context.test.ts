import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildAgentCanvasContext, vitalSourceRef } from "./agent-canvas-context.js";

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
});
