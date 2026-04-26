import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
} from "../test-helpers/fixture.js";
import { vitalsTrend } from "./vitalsTrend.js";

const BASE_AUTHOR = { id: "pi-agent", role: "rn_agent" };

test("vitalsTrend reports 'vitals_window' shape when supports cite a vitals_window ref", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_trend_window",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: {
      summary: "SpO2 trending 94 to 89 percent over 40 minutes on stable 2L NC.",
    },
    links: {
      supports: [
        {
          ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00",
          kind: "vitals_window",
          selection: {
            metric: "spo2",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:40:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });

  const entries = await vitalsTrend({ scope });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "evt_trend_window");
  assert.equal(entries[0].shape, "vitals_window");
  assert.deepEqual(entries[0].vital_metrics.sort(), ["spo2"]);
});

test("vitalsTrend reports 'event_ref' shape when supports point to observation.vital_sign events", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_vital_obs_a",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "heart_rate", value: 88, unit: "bpm" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_vital_obs_b",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "heart_rate", value: 108, unit: "bpm" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_trend_event_refs",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: { summary: "HR climbing from 88 to 108 over 20 minutes." },
    links: {
      supports: [
        { ref: "evt_vital_obs_a", kind: "event" },
        { ref: "evt_vital_obs_b", kind: "event" },
      ],
    },
  });

  const entries = await vitalsTrend({ scope });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "evt_trend_event_refs");
  assert.equal(entries[0].shape, "event_ref");
  assert.deepEqual(entries[0].vital_metrics.sort(), ["heart_rate"]);
});

test("vitalsTrend reports 'none' shape for vital-topic trend with no vital evidence link (failing invariant)", async () => {
  // V-VITALS-01 (validate.ts) flags this exact shape per HITL
  // disposition #2 (memos/hitl-decisions-26042026.md): permissive
  // strictness — vitals_window OR event-ref to observation.vital_sign
  // both satisfy; only "no vital evidence at all" is invalid.
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_trend_textonly",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: {
      summary: "Worsening respiratory status: SpO2 trending down on stable NC.",
      differential: [{ condition: "worsening pneumonia", likelihood: "high" }],
    },
    links: { supports: [] },
  });

  const entries = await vitalsTrend({ scope });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "evt_trend_textonly");
  assert.equal(entries[0].shape, "none");
  assert.ok(entries[0].vital_metrics.includes("spo2"));
});

test("vitalsTrend ignores non-vital trend assessments", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_trend_nonvital",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: {
      summary: "Wound bed improving with granulation tissue.",
      differential: [{ condition: "healing wound", likelihood: "high" }],
    },
    links: { supports: [] },
  });

  const entries = await vitalsTrend({ scope });
  assert.equal(entries.length, 0);
});

test("vitalsTrend prefers 'vitals_window' over 'event_ref' when both are present", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_vital_obs_mix",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "respiratory_rate", value: 18, unit: "bpm" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_trend_mixed",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: BASE_AUTHOR,
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: { summary: "RR rising from 18 to 24." },
    links: {
      supports: [
        { ref: "evt_vital_obs_mix", kind: "event" },
        {
          ref: "vitals://enc_001?name=respiratory_rate&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00",
          kind: "vitals_window",
          selection: {
            metric: "respiratory_rate",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:40:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });

  const entries = await vitalsTrend({ scope });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].shape, "vitals_window");
});
