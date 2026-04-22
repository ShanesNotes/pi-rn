import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
} from "../test-helpers/fixture.js";
import { timeline } from "./timeline.js";

function ev(
  id: string,
  type: string,
  subtype: string,
  at: string,
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    type,
    subtype,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 91 },
    links: { supports: [] },
    ...extras,
  };
}

test("timeline filters by type", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_a", "observation", "vital_sign", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_b", "intent", "care_plan", "2026-04-18T08:10:00-05:00", {
    certainty: "planned",
    data: { goal: "escalate" },
    links: { supports: [] },
  }));
  const list = await timeline({ scope, types: ["intent"] });
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "evt_b");
});

test("timeline subtypePrefix picks medication_*", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_a", "intent", "medication_order", "2026-04-18T08:00:00-05:00", {
    data: { goal: "med order" },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_b", "intent", "follow_up", "2026-04-18T08:10:00-05:00", {
    data: { goal: "follow up" },
  }));
  const list = await timeline({ scope, subtypePrefix: "medication_" });
  assert.deepEqual(list.map((e) => e.id), ["evt_a"]);
});

test("timeline hides superseded by default and includes when requested", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_a", "observation", "vital_sign", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_b", "observation", "vital_sign", "2026-04-18T08:10:00-05:00", {
    links: { supports: [], supersedes: ["evt_a"] },
  }));
  const hidden = await timeline({ scope });
  assert.deepEqual(hidden.map((e) => e.id), ["evt_b"]);
  const shown = await timeline({ scope, includeSuperseded: true });
  assert.deepEqual(shown.map((e) => e.id), ["evt_a", "evt_b"]);
});

test("default window is start-of-day → chart-clock now (regression: -∞/+∞ default)", async () => {
  const scope = await makeEmptyPatient();
  // A previous UTC day should be excluded by the start-of-day lower bound.
  await appendRawEvent(scope, "2026-04-16", ev("evt_two_days_prior", "observation", "vital_sign", "2026-04-16T12:00:00+00:00"));
  // Today (UTC), two events — the later one anchors the chart's sim-time
  // "now", the earlier sits inside the default window.
  await appendRawEvent(scope, "2026-04-18", ev("evt_today_early", "observation", "vital_sign", "2026-04-18T02:00:00+00:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_today_anchor", "observation", "vital_sign", "2026-04-18T14:00:00+00:00"));
  const list = await timeline({ scope });
  const ids = list.map((e) => e.id);
  assert(ids.includes("evt_today_early"));
  assert(ids.includes("evt_today_anchor"));
  assert(
    !ids.includes("evt_two_days_prior"),
    `expected prior-day event to be excluded, got ${ids.join(",")}`,
  );
});

test("timeline scopes to encounterId", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_a", "observation", "vital_sign", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_b", "observation", "vital_sign", "2026-04-18T08:10:00-05:00", {
    encounter_id: "enc_002",
  }));
  const list = await timeline({ scope, encounterId: "enc_001" });
  assert.deepEqual(list.map((e) => e.id), ["evt_a"]);
});
