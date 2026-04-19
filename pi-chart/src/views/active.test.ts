import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
} from "../test-helpers/fixture.js";
import {
  effectiveClaim,
  isSuperseded,
  loadContext,
  supersededPriors,
} from "./active.js";

function obs(id: string, at: string, extras: Record<string, unknown> = {}) {
  return {
    id,
    type: "observation",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "k" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 91 },
    links: { supports: [], supersedes: [] },
    ...extras,
  };
}

test("isSuperseded: latest event hides the prior", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_a", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(
    scope,
    "2026-04-18",
    obs("evt_b", "2026-04-18T08:10:00-05:00", { links: { supports: [], supersedes: ["evt_a"] } }),
  );
  const ctx = await loadContext(scope);
  const a = ctx.byId.get("evt_a")!;
  const b = ctx.byId.get("evt_b")!;
  assert.equal(isSuperseded(a, ctx), true);
  assert.equal(isSuperseded(b, ctx), false);
});

test("effectiveClaim walks the chain to the tail", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_a", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(
    scope,
    "2026-04-18",
    obs("evt_b", "2026-04-18T08:10:00-05:00", { links: { supports: [], supersedes: ["evt_a"] } }),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    obs("evt_c", "2026-04-18T08:20:00-05:00", { links: { supports: [], supersedes: ["evt_b"] } }),
  );
  const ctx = await loadContext(scope);
  const tail = effectiveClaim(ctx.byId.get("evt_a")!, ctx);
  assert.equal(tail.id, "evt_c");
});

test("supersededPriors collects the whole chain back to the root", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_a", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(
    scope,
    "2026-04-18",
    obs("evt_b", "2026-04-18T08:10:00-05:00", { links: { supports: [], supersedes: ["evt_a"] } }),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    obs("evt_c", "2026-04-18T08:20:00-05:00", { links: { supports: [], supersedes: ["evt_b"] } }),
  );
  const ctx = await loadContext(scope);
  const priors = supersededPriors(ctx.byId.get("evt_c")!, ctx);
  assert.deepEqual(
    priors.map((p) => p.id).sort(),
    ["evt_a", "evt_b"],
  );
});

test("isSuperseded respects asOf — a future supersessor doesn't hide the prior", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_a", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(
    scope,
    "2026-04-18",
    obs("evt_b", "2026-04-18T08:10:00-05:00", { links: { supports: [], supersedes: ["evt_a"] } }),
  );
  const ctx = await loadContext(scope, "2026-04-18T08:05:00-05:00");
  assert.equal(isSuperseded(ctx.byId.get("evt_a")!, ctx), false);
});
