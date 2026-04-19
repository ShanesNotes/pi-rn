import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
} from "../test-helpers/fixture.js";
import { openLoops } from "./openLoops.js";

function intent(
  id: string,
  at: string,
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    type: "intent",
    subtype: "care_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_reasoning" },
    certainty: "planned",
    status: "active",
    data: { goal: "watch" },
    links: { supports: [] },
    ...extras,
  };
}

function action(
  id: string,
  at: string,
  fulfills: string[],
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    type: "action",
    subtype: "notification",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "agent_action" },
    certainty: "performed",
    status: "active",
    data: { action: "notify_md" },
    links: { supports: [], fulfills },
    ...extras,
  };
}

test("pending: intent with no fulfillments and no due_by", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:05:00-05:00" });
  assert.equal(loops.length, 1);
  assert.equal(loops[0].state, "pending");
});

test("in_progress: one active fulfillment, no terminal", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_01", "2026-04-18T08:05:00-05:00", ["evt_intent_01"]));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });
  assert.equal(loops[0].state, "in_progress");
});

test("overdue: no fulfillment, due_by in the past", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00", {
    data: { goal: "watch", due_by: "2026-04-18T08:30:00-05:00" },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T09:00:00-05:00" });
  assert.equal(loops[0].state, "overdue");
  assert(typeof loops[0].dueDeltaMinutes === "number" && loops[0].dueDeltaMinutes! < 0);
});

test("failed: a fulfillment carries data.outcome = failed", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_01", "2026-04-18T08:05:00-05:00", ["evt_intent_01"], {
    data: { action: "notify_md", outcome: "failed" },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });
  assert.equal(loops[0].state, "failed");
});

test("closed intents (status final) are not emitted at all", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00", { status: "final" }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:05:00-05:00" });
  assert.equal(loops.length, 0);
});

test("terminal-final fulfillment closes the loop (skipped from output)", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_01", "2026-04-18T08:05:00-05:00", ["evt_intent_01"], {
    status: "final",
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });
  assert.equal(loops.length, 0);
});

test("an intent authored after asOf is hidden (regression: future intents leaking)", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_future", "2026-04-18T10:00:00-05:00"));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:00:00-05:00" });
  assert.equal(loops.length, 0);
});

test("default asOf uses chart-clock now so past-due intents become overdue without explicit asOf", async () => {
  // Regression: previously the default asOf was +Infinity, which made
  // the overdue check fall through to pending for every past-due loop.
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00", {
    data: { goal: "follow up", due_by: "2026-04-18T08:30:00-05:00" },
  }));
  // Anchor "now" for sim_time — later event at 09:00 sets SimClock.now().
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_anchor",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 95 },
    links: { supports: [] },
  });
  const loops = await openLoops({ scope });
  const entry = loops.find((l) => l.intent.id === "evt_intent_01");
  assert(entry, "expected the intent to appear in openLoops output");
  assert.equal(entry!.state, "overdue");
});
