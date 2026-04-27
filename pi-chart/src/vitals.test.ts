import test from "node:test";
import assert from "node:assert/strict";
import {
  formatVitalSampleKey,
  isProfileRoutedTrainingMetric,
  normalizeVitalValueForSampleKey,
  vitalQualityState,
} from "./vitals.js";

test("formatVitalSampleKey is stable across value whitespace normalization", () => {
  const base = {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "level_of_consciousness",
    value: "  alert  ",
    unit: "AVPU",
  };

  assert.equal(normalizeVitalValueForSampleKey(base.value), "alert");
  assert.match(formatVitalSampleKey(base) ?? "", /^vital_[0-9a-f]{16}$/);
  assert.equal(formatVitalSampleKey(base), formatVitalSampleKey({ ...base, value: "alert" }));
});

test("vital quality and profile routing helpers accept canonical forms only", () => {
  assert.equal(vitalQualityState({ state: "invalid", flags: ["motion"] }), "invalid");
  assert.equal(vitalQualityState(undefined), "valid");
  assert.equal(isProfileRoutedTrainingMetric({ profile: "simulation_training" }), true);
  assert.equal(isProfileRoutedTrainingMetric({ training_label: "sim-only" }), true);
  assert.equal(isProfileRoutedTrainingMetric({ source: { kind: "manual_scenario" } } as any), false);
});
