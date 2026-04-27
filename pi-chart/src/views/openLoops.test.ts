import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  makeEmptyPatient,
  appendRawEvent,
  patientDir,
  appendRawVital,
} from "../test-helpers/fixture.js";
import { validateChart } from "../validate.js";
import { currentState } from "./currentState.js";
import { openLoops } from "./openLoops.js";
import type { ContestedClaim, VitalOpenLoop } from "../types.js";

type OpenLoopEntry = Awaited<ReturnType<typeof openLoops>>[number];

function isContestedClaim(loop: OpenLoopEntry): loop is ContestedClaim {
  return "kind" in loop && loop.kind === "contested_claim";
}

function isVitalLoop(loop: OpenLoopEntry | undefined, kind?: VitalOpenLoop["kind"]): loop is VitalOpenLoop {
  return Boolean(loop && (kind ? loop.kind === kind : loop.kind === "vital_cadence" || loop.kind === "vital_alarm"));
}

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
    source: { kind: "agent_inference" },
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

function observation(
  id: string,
  at: string,
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    type: "observation",
    subtype: "exam_finding",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "nurse_charted" },
    certainty: "observed",
    status: "final",
    data: { name: "work_of_breathing", value: "unchanged" },
    links: { supports: [] },
    ...extras,
  };
}

function assessment(
  id: string,
  at: string,
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    type: "assessment",
    subtype: "problem",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "nurse_charted" },
    certainty: "asserted",
    status: "final",
    data: { summary: "respiratory status unchanged" },
    links: { supports: [] },
    ...extras,
  };
}

async function seedStructuralMarkdown(scope: Awaited<ReturnType<typeof makeEmptyPatient>>): Promise<void> {
  const root = patientDir(scope);
  await fs.writeFile(
    path.join(root, "patient.md"),
    "---\n" +
      "id: patient_001\n" +
      "type: subject\n" +
      "subject: patient_001\n" +
      "status: active\n" +
      "effective_at: '2026-04-18T06:00:00-05:00'\n" +
      "recorded_at: '2026-04-18T06:00:00-05:00'\n" +
      "author: {id: x, role: rn}\n" +
      "source: {kind: admission_intake}\n" +
      "---\n",
  );
  await fs.writeFile(
    path.join(root, "constraints.md"),
    "---\n" +
      "id: cst_001\n" +
      "type: constraint_set\n" +
      "subject: patient_001\n" +
      "status: active\n" +
      "effective_at: '2026-04-18T06:00:00-05:00'\n" +
      "recorded_at: '2026-04-18T06:00:00-05:00'\n" +
      "author: {id: x, role: rn}\n" +
      "source: {kind: admission_intake}\n" +
      "---\n",
  );
}

test("pending: intent with no fulfillments and no due_by", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:05:00-05:00" });
  assert.equal(loops.length, 1);
  assert.equal(loops[0].state, "pending");
});

test("encounterId filters ordinary intent loops before Agent Canvas consumes them", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_enc_001", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", intent("evt_enc_002", "2026-04-18T08:05:00-05:00", {
    encounter_id: "enc_002",
    data: { goal: "wrong encounter" },
  }));
  const loops = await openLoops({
    scope,
    asOf: "2026-04-18T08:10:00-05:00",
    encounterId: "enc_001",
  });
  assert.deepEqual(loops.map((loop) => loop.intent.id), ["evt_enc_001"]);
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

test("failed: a final fulfillment carries ADR 002 data.status_detail = failed", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_01", "2026-04-18T08:05:00-05:00", ["evt_intent_01"], {
    subtype: "administration",
    status: "final",
    data: { action: "give med", status_detail: "failed" },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });
  assert.equal(loops.length, 1);
  assert.equal(loops[0].state, "failed");
});

// v0.2 back-compat
test("failed: a fulfillment carries legacy data.outcome = failed", async () => {
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

test("observation.exam_finding is evidence and does not close an intent loop", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", observation("evt_exam_01", "2026-04-18T08:05:00-05:00", {
    links: { supports: ["evt_intent_01"], fulfills: ["evt_intent_01"] },
  }));

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });

  assert.equal(loops.length, 1);
  assert.equal(loops[0].intent.id, "evt_intent_01");
  assert.equal(loops[0].state, "pending");
  assert.deepEqual(loops[0].fulfillments, []);
});

test("assessment events do not fulfill intent loops", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", assessment("evt_assess_01", "2026-04-18T08:05:00-05:00", {
    links: { supports: ["evt_intent_01"], fulfills: ["evt_intent_01"] },
  }));

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });

  assert.equal(loops.length, 1);
  assert.equal(loops[0].intent.id, "evt_intent_01");
  assert.equal(loops[0].state, "pending");
  assert.deepEqual(loops[0].fulfillments, []);
});

test("superseded fulfillment does not close the loop", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_old", "2026-04-18T08:05:00-05:00", ["evt_intent_01"], {
    status: "final",
  }));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_new", "2026-04-18T08:06:00-05:00", ["evt_intent_01"], {
    status: "active",
    links: { supports: [], fulfills: ["evt_intent_01"], supersedes: ["evt_act_old"] },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });
  assert.equal(loops.length, 1);
  assert.equal(loops[0].state, "in_progress");
  assert.deepEqual(loops[0].fulfillments.map((f) => f.id), ["evt_act_new"]);
});

test("corrected failure fulfillment does not force failed", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_old", "2026-04-18T08:05:00-05:00", ["evt_intent_01"], {
    data: { action: "notify_md", outcome: "failed" },
    status: "final",
  }));
  await appendRawEvent(scope, "2026-04-18", action("evt_act_fix", "2026-04-18T08:06:00-05:00", ["evt_intent_01"], {
    status: "active",
    links: { supports: [], fulfills: ["evt_intent_01"], corrects: ["evt_act_old"] },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T08:10:00-05:00" });
  assert.equal(loops.length, 1);
  assert.equal(loops[0].state, "in_progress");
  assert.deepEqual(loops[0].fulfillments.map((f) => f.id), ["evt_act_fix"]);
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

test("contested_claim emits after the default threshold", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_old", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_new", "2026-04-18T08:10:00-05:00", {
    links: {
      supports: [],
      contradicts: [{ ref: "evt_intent_old", basis: "new evidence" }],
    },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T09:15:00-05:00" });
  const contested = loops.find(isContestedClaim);
  assert(contested, "expected contested_claim entry");
  assert.equal(contested.kind, "contested_claim");
  assert.deepEqual(contested.events, ["evt_intent_old", "evt_intent_new"]);
  assert.equal(contested.basis, "new evidence");
  assert.equal(contested.threshold_seconds, 3600);
  assert.equal(contested.severity, "medium");
  assert.equal(contested.intent.id, "evt_intent_new");
  assert.equal(contested.state, "pending");
  assert.deepEqual(contested.fulfillments, []);
  assert.deepEqual(contested.addressesProblems, []);
  assert((contested.age_seconds ?? 0) >= 3900);
});

test("medium contested_claim entries sort after overdue intents", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_overdue", "2026-04-18T08:00:00-05:00", {
    data: { goal: "check lab", due_by: "2026-04-18T08:30:00-05:00" },
  }));
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_old", "2026-04-18T08:05:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_new", "2026-04-18T08:10:00-05:00", {
    links: {
      supports: [],
      contradicts: [{ ref: "evt_intent_old", basis: "new evidence" }],
    },
  }));
  const loops = await openLoops({ scope, asOf: "2026-04-18T09:15:00-05:00" });
  const order = loops.map((loop) =>
    isContestedClaim(loop)
      ? `contested:${loop.events.join("->")}`
      : `intent:${loop.intent.id}`,
  );
  assert.deepEqual(order.slice(0, 2), [
    "intent:evt_overdue",
    "contested:evt_intent_old->evt_intent_new",
  ]);
});

test("resolver event clears contested_claim and currentState contested data while validator stays green", async () => {
  const scope = await makeEmptyPatient();
  await seedStructuralMarkdown(scope);
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_old", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_new", "2026-04-18T08:10:00-05:00", {
    links: {
      supports: [],
      contradicts: [{ ref: "evt_intent_old", basis: "new evidence" }],
    },
  }));

  const beforeValidation = await validateChart(scope);
  assert.equal(beforeValidation.ok, true, JSON.stringify(beforeValidation, null, 2));

  const beforeState = await currentState({
    scope,
    axis: "intents",
    asOf: "2026-04-18T09:15:00-05:00",
  }) as Awaited<ReturnType<typeof currentState>> & {
    contested?: Array<{ events: [string, string]; basis: string; axis: string }>;
  };
  if (beforeState.axis !== "intents") throw new Error();
  assert.deepEqual(beforeState.contested, [
    {
      events: ["evt_intent_old", "evt_intent_new"],
      basis: "new evidence",
      axis: "intents",
    },
  ]);

  const beforeLoops = await openLoops({ scope, asOf: "2026-04-18T09:15:00-05:00" });
  assert(beforeLoops.some(isContestedClaim));

  await appendRawEvent(scope, "2026-04-18", intent("evt_intent_fix", "2026-04-18T09:20:00-05:00", {
    links: {
      supports: [],
      supersedes: ["evt_intent_old"],
      resolves: ["evt_intent_new"],
    },
  }));

  const afterValidation = await validateChart(scope);
  assert.equal(afterValidation.ok, true, JSON.stringify(afterValidation, null, 2));

  const afterState = await currentState({
    scope,
    axis: "intents",
    asOf: "2026-04-18T09:30:00-05:00",
  }) as Awaited<ReturnType<typeof currentState>> & {
    contested?: Array<{ events: [string, string]; basis: string; axis: string }>;
  };
  if (afterState.axis !== "intents") throw new Error();
  assert.deepEqual(afterState.contested, []);

  const afterLoops = await openLoops({ scope, asOf: "2026-04-18T09:30:00-05:00" });
  assert(!afterLoops.some(isContestedClaim));
});

test("monitoring_plan emits vital_cadence loop when ordered cadence is stale", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_monitor_spo2", "2026-04-18T08:00:00-05:00", {
    subtype: "monitoring_plan",
    data: { metrics: ["spo2"], required_cadence: "q15min" },
  }));
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 95,
  });

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:30:00-05:00" });
  const vitalLoop = loops.find((loop) => loop.kind === "vital_cadence");
  assert.ok(isVitalLoop(vitalLoop, "vital_cadence"), JSON.stringify(loops, null, 2));
  assert.equal(vitalLoop.metric, "spo2");
  assert.equal(vitalLoop.state, "overdue");
  assert.equal(vitalLoop.severity, "medium");
});

test("alarm-triggered monitoring_plan emits high-severity vital_alarm loop", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_monitor_alarm", "2026-04-18T08:00:00-05:00", {
    subtype: "monitoring_plan",
    data: { metric: "spo2", required_cadence: "15m", triggered_by_alarm: true },
  }));
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 85,
  });

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:30:00-05:00" });
  const vitalLoop = loops.find((loop) => loop.kind === "vital_alarm");
  assert.ok(isVitalLoop(vitalLoop, "vital_alarm"), JSON.stringify(loops, null, 2));
  assert.equal(vitalLoop.metric, "spo2");
  assert.equal(vitalLoop.severity, "high");
  assert.equal(vitalLoop.basis, "alarm-triggered temporary monitoring obligation is overdue");
});

test("final fulfillment closes vital monitoring loops", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_monitor_closed", "2026-04-18T08:00:00-05:00", {
    subtype: "monitoring_plan",
    data: { metric: "spo2", required_cadence: "15m", triggered_by_alarm: true },
  }));
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 85,
  });
  await appendRawEvent(scope, "2026-04-18", action("evt_monitor_pause", "2026-04-18T08:20:00-05:00", ["evt_monitor_closed"], {
    subtype: "alarm_pause",
    status: "final",
    data: { action: "pause alarm-triggered monitoring", status_detail: "performed" },
  }));

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:45:00-05:00" });
  assert.equal(loops.some((loop) => loop.intent.id === "evt_monitor_closed"), false);
});

test("vital monitoring freshness is scoped to the intent encounter", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_monitor_enc1", "2026-04-18T08:00:00-05:00", {
    subtype: "monitoring_plan",
    data: { metric: "spo2", required_cadence: "15m" },
  }));
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:29:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_002",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 99,
  });

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:30:00-05:00" });
  const vitalLoop = loops.find((loop) => loop.kind === "vital_cadence");
  assert.ok(isVitalLoop(vitalLoop, "vital_cadence"), JSON.stringify(loops, null, 2));
  assert.equal(vitalLoop.intent.id, "evt_monitor_enc1");
  assert.equal(vitalLoop.lastSampledAt, undefined);
});

test("newer wrong-encounter vital does not evict fresh in-encounter monitoring sample", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", intent("evt_monitor_enc1_fresh", "2026-04-18T08:00:00-05:00", {
    subtype: "monitoring_plan",
    data: { metric: "spo2", required_cadence: "15m" },
  }));
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:20:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 95,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:29:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_002",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 99,
  });

  const loops = await openLoops({ scope, asOf: "2026-04-18T08:30:00-05:00" });
  assert.equal(loops.some((loop) => loop.kind === "vital_cadence"), false, JSON.stringify(loops, null, 2));
});
