import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
  appendRawVital,
} from "../test-helpers/fixture.js";
import { activeProblems, currentState } from "./currentState.js";

function ev(
  id: string,
  type: string,
  subtype: string | undefined,
  status: string,
  at: string,
  extras: Record<string, unknown> = {},
) {
  return {
    id,
    type,
    ...(subtype ? { subtype } : {}),
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status,
    data: { summary: "placeholder" },
    links: { supports: [] },
    ...extras,
  };
}

test("constraints axis: active not superseded are returned; superseded are hidden", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("cs_a", "constraint_set", undefined, "active", "2026-04-18T06:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("cs_b", "constraint_set", undefined, "active", "2026-04-18T07:00:00-05:00", {
    links: { supports: [], supersedes: ["cs_a"] },
  }));
  const s = await currentState({ scope, axis: "constraints" });
  assert.equal(s.axis, "constraints");
  if (s.axis !== "constraints") throw new Error();
  assert.deepEqual(s.items.map((x) => x.id), ["cs_b"]);
});

test("constraints axis prefers canonical assessment/constraint events over constraint_set cache", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_support_01", "observation", "patient_report", "final", "2026-04-18T05:55:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("cs_cache", "constraint_set", undefined, "active", "2026-04-18T06:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_constraint_pcn", "assessment", "constraint", "active", "2026-04-18T06:05:00-05:00", {
    certainty: "reported",
    data: {
      constraint_domain: "allergy_intolerance",
      status_detail: "active",
      target: { kind: "medication_class", display: "penicillins" },
      rule: "avoid",
    },
    links: { supports: ["evt_support_01"] },
  }));
  const s = await currentState({ scope, axis: "constraints" });
  if (s.axis !== "constraints") throw new Error();
  assert.deepEqual(s.items.map((x) => x.id), ["evt_constraint_pcn"]);
});

test("problems axis: only assessment/problem with status active, no superseded", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_obs_01", "observation", "vital_sign", "final", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_p1", "assessment", "problem", "active", "2026-04-18T08:30:00-05:00", {
    data: { summary: "hypoxia" },
    links: { supports: ["evt_obs_01"] },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_p2", "assessment", "problem", "final", "2026-04-18T08:40:00-05:00", {
    data: { summary: "resolved" },
    links: { supports: ["evt_obs_01"] },
  }));
  const s = await currentState({ scope, axis: "problems" });
  if (s.axis !== "problems") throw new Error();
  assert.deepEqual(s.items.map((x) => x.id), ["evt_p1"]);
});

test("activeProblems aliases currentState problems axis", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_obs_01", "observation", "vital_sign", "final", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_p1", "assessment", "problem", "active", "2026-04-18T08:30:00-05:00", {
    data: { summary: "hypoxia" },
    links: { supports: ["evt_obs_01"] },
  }));
  assert.deepEqual((await activeProblems(scope)).map((x) => x.id), ["evt_p1"]);
});

test("vitals axis returns latest per metric regardless of supersession semantics", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 95,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:30:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 88,
  });
  const s = await currentState({ scope, axis: "vitals" });
  if (s.axis !== "vitals") throw new Error();
  assert.equal(s.items.spo2.value, 88);
});

test("constraints axis surfaces the constraint_set from constraints.md", async () => {
  // Regression: active context must load structural markdown, not just
  // NDJSON. The seed chart's constraint_set lives in constraints.md.
  const scope = await makeEmptyPatient();
  const pdir = (await import("../test-helpers/fixture.js")).patientDir(scope);
  const fs = await import("node:fs");
  const path = await import("node:path");
  await fs.promises.writeFile(
    path.join(pdir, "constraints.md"),
    "---\nid: cst_001\ntype: constraint_set\nsubject: patient_001\nstatus: active\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: rn_shane, role: rn}\nsource: {kind: admission_intake}\nconstraints:\n  code_status: full_code\n---\n\n# Constraints\nFull code.\n",
  );
  const s = await currentState({
    scope,
    axis: "constraints",
    asOf: "2026-04-18T09:00:00-05:00",
  });
  if (s.axis !== "constraints") throw new Error();
  assert.equal(s.items.length, 1);
  assert.equal(s.items[0].id, "cst_001");
});

test("all axis composes each panel", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("cs_a", "constraint_set", undefined, "active", "2026-04-18T06:00:00-05:00"));
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 94,
  });
  const s = await currentState({ scope, axis: "all" });
  if (s.axis !== "all") throw new Error();
  assert.equal(s.constraints.length, 1);
  assert.equal(s.vitals.spo2.value, 94);
  assert.deepEqual(s.intents, []);
  assert.deepEqual(s.problems, []);
});

test("intents axis keeps active items and surfaces contested sibling data", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_intent_old", "intent", "care_plan", "active", "2026-04-18T08:00:00-05:00", {
    certainty: "planned",
    data: { goal: "watch lactate" },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_intent_new", "intent", "care_plan", "active", "2026-04-18T08:10:00-05:00", {
    certainty: "planned",
    data: { goal: "repeat lactate" },
    links: {
      supports: [],
      contradicts: [{ ref: "evt_intent_old", basis: "newer reassessment" }],
    },
  }));
  const s = await currentState({
    scope,
    axis: "intents",
    asOf: "2026-04-18T09:30:00-05:00",
  }) as Awaited<ReturnType<typeof currentState>> & {
    contested?: Array<{ events: [string, string]; basis: string; axis: string }>;
  };
  if (s.axis !== "intents") throw new Error();
  assert.deepEqual(s.items.map((loop) => loop.intent.id), ["evt_intent_old", "evt_intent_new"]);
  assert.deepEqual(s.contested, [
    {
      events: ["evt_intent_old", "evt_intent_new"],
      basis: "newer reassessment",
      axis: "intents",
    },
  ]);
});

test("all axis adds observations plus contested observation pairs", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_obs_old", "observation", "vital_sign", "final", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", ev("evt_obs_new", "observation", "vital_sign", "final", "2026-04-18T08:10:00-05:00", {
    links: {
      supports: [],
      contradicts: [{ ref: "evt_obs_old", basis: "repeat sample disagrees" }],
    },
  }));
  const s = await currentState({
    scope,
    axis: "all",
    asOf: "2026-04-18T09:30:00-05:00",
  }) as Awaited<ReturnType<typeof currentState>> & {
    observations?: Array<{ id: string }>;
    contested?: Record<string, Array<{ events: [string, string]; basis: string; axis: string }>>;
  };
  if (s.axis !== "all") throw new Error();
  assert.deepEqual(s.observations?.map((item) => item.id), ["evt_obs_old", "evt_obs_new"]);
  assert.deepEqual(s.contested?.observations, [
    {
      events: ["evt_obs_old", "evt_obs_new"],
      basis: "repeat sample disagrees",
      axis: "observations",
    },
  ]);
});

test("supersession clears contested sibling data", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_intent_old", "intent", "care_plan", "active", "2026-04-18T08:00:00-05:00", {
    certainty: "planned",
    data: { goal: "watch lactate" },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_intent_new", "intent", "care_plan", "active", "2026-04-18T08:10:00-05:00", {
    certainty: "planned",
    data: { goal: "repeat lactate" },
    links: {
      supports: [],
      contradicts: [{ ref: "evt_intent_old", basis: "newer reassessment" }],
    },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_intent_fix", "intent", "care_plan", "active", "2026-04-18T08:20:00-05:00", {
    certainty: "planned",
    data: { goal: "standardize repeat" },
    links: {
      supports: [],
      supersedes: ["evt_intent_old"],
      resolves: ["evt_intent_new"],
    },
  }));
  const s = await currentState({
    scope,
    axis: "intents",
    asOf: "2026-04-18T09:30:00-05:00",
  }) as Awaited<ReturnType<typeof currentState>> & {
    contested?: Array<{ events: [string, string]; basis: string; axis: string }>;
  };
  if (s.axis !== "intents") throw new Error();
  assert.deepEqual(s.contested, []);
});

test("all axis characterizes fulfilled order, specimen collection, and lab result as closed result evidence", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", ev("evt_order_lactate", "intent", "order", "active", "2026-04-18T08:00:00-05:00", {
    certainty: "planned",
    data: { order: "lactate", goal: "check perfusion" },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_collect_lactate", "action", "specimen_collection", "final", "2026-04-18T08:05:00-05:00", {
    certainty: "performed",
    data: { specimen_type: "blood" },
    links: { supports: [], fulfills: ["evt_order_lactate"] },
  }));
  await appendRawEvent(scope, "2026-04-18", ev("evt_lactate_result", "observation", "lab_result", "final", "2026-04-18T08:20:00-05:00", {
    data: { name: "lactate", value: 2.8, unit: "mmol/L", status_detail: "final" },
    links: { supports: ["evt_collect_lactate"] },
  }));

  const s = await currentState({
    scope,
    axis: "all",
    asOf: "2026-04-18T08:30:00-05:00",
  });
  if (s.axis !== "all") throw new Error();
  assert.deepEqual(s.intents.map((loop) => loop.intent.id), []);
  assert.deepEqual(s.observations.map((item) => item.id), ["evt_lactate_result"]);
});
