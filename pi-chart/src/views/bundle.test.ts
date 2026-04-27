import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEmptyPatient,
  appendRawEvent,
  appendRawVital,
  writeRawNote,
} from "../test-helpers/fixture.js";
import { currentState } from "./currentState.js";
import { openLoops } from "./openLoops.js";
import { narrative } from "./narrative.js";
import { timeline } from "./timeline.js";
import { memoryProof } from "./memoryProof.js";
import { contextBundle } from "./bundle.js";
import { contextBundle as exportedContextBundle } from "./index.js";

const AS_OF = "2026-04-18T13:00:00.000Z";
const FROM = "2026-04-18T00:00:00.000Z";

function event(
  id: string,
  type: string,
  subtype: string | undefined,
  status: string,
  at: string,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    type,
    ...(subtype ? { subtype } : {}),
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "rn_s5", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status,
    data: { summary: "placeholder" },
    links: { supports: [] },
    ...extras,
  };
}

async function seedBundleChart() {
  const scope = await makeEmptyPatient();

  await appendRawEvent(
    scope,
    "2026-04-18",
    event(
      "evt_s5_spo2_low",
      "observation",
      "vital_sign",
      "final",
      "2026-04-18T08:00:00.000Z",
      { data: { name: "spo2", value: 89, unit: "%" } },
    ),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    event(
      "evt_s5_problem_hypoxia",
      "assessment",
      "problem",
      "active",
      "2026-04-18T08:15:00.000Z",
      {
        certainty: "asserted",
        data: { summary: "hypoxia" },
        links: {
          supports: [
            { kind: "event", ref: "evt_s5_spo2_low", role: "primary" },
          ],
        },
      },
    ),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    event(
      "evt_s5_reposition_intent",
      "intent",
      "care_plan",
      "active",
      "2026-04-18T08:30:00.000Z",
      {
        certainty: "planned",
        data: {
          goal: "reposition and reassess oxygenation",
          due_by: "2026-04-18T12:00:00.000Z",
        },
        links: {
          supports: ["evt_s5_problem_hypoxia"],
          addresses: ["evt_s5_problem_hypoxia"],
        },
      },
    ),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    event(
      "evt_s5_handoff_comm",
      "communication",
      "handoff",
      "final",
      "2026-04-18T08:45:00.000Z",
      {
        data: { audience: "next_shift", note_ref: "note_s5_handoff" },
        links: { supports: ["evt_s5_problem_hypoxia"] },
      },
    ),
  );
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00.000Z",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 89,
    unit: "%",
  });
  await writeRawNote(
    scope,
    "2026-04-18",
    "0845_handoff.md",
    {
      id: "note_s5_handoff",
      type: "communication",
      subtype: "handoff",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:45:00.000Z",
      recorded_at: "2026-04-18T08:45:10.000Z",
      author: { id: "rn_s5", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: ["evt_s5_problem_hypoxia"],
      status: "final",
    },
    "Next shift should reassess oxygenation after repositioning.",
  );

  return scope;
}

test("contextBundle composes required sections from existing projections", async () => {
  const scope = await seedBundleChart();

  const bundle = await contextBundle({ scope, asOf: AS_OF });
  const directCurrentState = await currentState({ scope, axis: "all", asOf: AS_OF });
  const directOpenLoops = await openLoops({ scope, asOf: AS_OF });
  const directNarrative = await narrative({ scope, to: AS_OF });
  const directTimeline = await timeline({ scope, from: FROM, to: AS_OF });
  const directProof = await memoryProof({ scope, asOf: AS_OF });

  assert.equal(bundle.patient_id, "patient_001");
  assert.equal(bundle.asOf, AS_OF);
  assert(bundle.source_view_refs.length > 0);
  assert(bundle.open_loops.length > 0, "fixture should exercise open loops");
  assert(
    bundle.narrative_handoff.length > 0,
    "fixture should exercise narrative handoff",
  );
  assert(
    bundle.evidence_context.evidence.length > 0,
    "fixture should exercise evidence context",
  );
  assert(
    bundle.recent_timeline.length > 0,
    "fixture should exercise recent timeline",
  );
  assert.deepEqual(bundle.current_state, directCurrentState);
  assert.deepEqual(bundle.open_loops, directOpenLoops);
  assert.deepEqual(bundle.narrative_handoff, directNarrative);
  assert.deepEqual(bundle.recent_timeline, directTimeline);
  assert.deepEqual(bundle.evidence_context, {
    evidence: directProof.sections.evidence,
    uncertainty: directProof.sections.uncertainty,
    proof_refs: directProof.source_view_refs,
  });
});

test("contextBundle is exported from the views barrel", async () => {
  assert.equal(exportedContextBundle, contextBundle);
});

test("contextBundle wrapper keys and refs do not widen forbidden S5 surfaces", async () => {
  const scope = await seedBundleChart();
  const bundle = await contextBundle({ scope, asOf: AS_OF });
  const forbidden = /fingerprint|hash|identity|profile|pi[-_]?agent|pi[-_]?sim/i;
  const s5OwnedStrings = [
    ...Object.keys(bundle),
    ...bundle.source_view_refs,
    ...Object.keys(bundle.evidence_context),
  ];

  for (const value of s5OwnedStrings) {
    assert(
      !forbidden.test(value),
      `${value} should not be introduced by the S5 bundle wrapper`,
    );
  }
});
