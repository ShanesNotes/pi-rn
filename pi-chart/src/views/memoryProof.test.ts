import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { memoryProof } from "./memoryProof.js";
import { loadAllEvents } from "./active.js";
import { narrative } from "./narrative.js";
import { appendRawEvent, makeEmptyPatient } from "../test-helpers/fixture.js";
import type { EventEnvelope, PatientScope } from "../types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const broadScope: PatientScope = { chartRoot: REPO_ROOT, patientId: "patient_002" };
const WOB = "evt_p002_0905_wob";
const HIDDEN_SIM_KEYS = [
  "hidden_lung_fluid_ml",
  "ground_truth_pneumonia_burden",
  "scheduled_event_queue",
] as const;

function stringifyProof(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function stringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out = (value as Record<string, unknown>)[key];
  return typeof out === "string" ? out : undefined;
}

function isCanonicalWorkOfBreathing(event: EventEnvelope): boolean {
  const name = stringField(event.data, "name");
  const value = stringField(event.data, "value") ?? "";
  return event.type === "observation" &&
    event.subtype === "exam_finding" &&
    (name === "work_of_breathing" || value.toLowerCase().includes("accessory muscle use"));
}

test("memoryProof returns six required sections and is JSON-serializable", async () => {
  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" });
  assert.equal(proof.patient_id, "patient_002");
  assert.deepEqual(Object.keys(proof.sections), [
    "what_happened",
    "why_it_mattered",
    "evidence",
    "uncertainty",
    "open_loops",
    "next_shift_handoff",
  ]);
  const reparsed = JSON.parse(JSON.stringify(proof));
  assert.deepEqual(reparsed, proof);
});

test("patient_002 fixture covers all six broad EHR surfaces", async () => {
  const events = await loadAllEvents(broadScope);
  const notes = await narrative({ scope: broadScope });
  assert(events.some((event) => event.type === "observation" && event.subtype === "exam_finding"), "nursing assessment missing");
  assert(events.some((event) => event.type === "intent" && event.subtype === "order"), "order missing");
  assert(events.some((event) => event.type === "action"), "intervention/action missing");
  assert(events.some((event) => event.type === "observation" && event.subtype === "lab_result"), "lab/diagnostic missing");
  assert(events.some((event) => event.type === "intent" && event.subtype === "care_plan"), "care plan missing");
  assert(events.some((event) => event.type === "communication" && event.subtype === "handoff"), "handoff communication missing");
  assert(notes.some((note) => note.subtype === "nursing_note"), "narrative note missing");
  // Flowsheet/vitals surface is proven through the projection's vitals evidence refs.
  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" });
  assert(proof.sections.evidence.some((item) => item.kind === "vitals_window"), "vitals evidence missing");
});

test("memoryProof preserves asOf replay across evidence, notes, loops, and handoff", async () => {
  const early = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:20:00-05:00" });
  const late = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" });
  const earlyText = stringifyProof(early);
  const lateText = stringifyProof(late);
  assert(!earlyText.includes("evt_p002_0925_abg_result"), earlyText);
  assert(!earlyText.includes("note_20260419T0930_handoff"), earlyText);
  assert(!earlyText.includes("evt_p002_0930_care_plan"), earlyText);
  assert(lateText.includes("evt_p002_0925_abg_result"), lateText);
  assert(lateText.includes("note_20260419T0930_handoff") || lateText.includes("Next-shift handoff"), lateText);
  assert(late.sections.open_loops.some((loop) => loop.intent_id === "evt_p002_0930_care_plan"));
});

test("memoryProof keeps current-state source refs scoped to encounterId", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", observation("evt_enc_001_obs", "enc_001", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", observation("evt_enc_002_obs", "enc_002", "2026-04-18T08:05:00-05:00"));

  const proof = await memoryProof({
    scope,
    asOf: "2026-04-18T08:10:00-05:00",
    encounterId: "enc_001",
  });
  const text = stringifyProof(proof);

  assert(proof.source_view_refs.includes("currentState.observations=1"), text);
  assert(text.includes("evt_enc_001_obs"), text);
  assert(!text.includes("evt_enc_002_obs"), text);
});

test("memoryProof clamps vitals evidence windows to the consumer event time", async () => {
  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:10:35-05:00" });
  const text = stringifyProof(proof);
  assert(text.includes("evt_p002_0910_assess_resp"), text);
  assert(!text.includes("to=2026-04-19T09:15:00-05:00"), text);
  assert(text.includes("to=2026-04-19T09%3A10%3A00-05%3A00"), text);
  assert(!text.includes("evt_p002_0912_order_abg"), text);
});

function observation(
  id: string,
  encounterId: string,
  at: string,
): Record<string, unknown> {
  return {
    id,
    type: "observation",
    subtype: "exam_finding",
    subject: "patient_001",
    encounter_id: encounterId,
    effective_at: at,
    recorded_at: at,
    author: { id: "test_rn", role: "rn" },
    source: { kind: "nurse_charted" },
    certainty: "observed",
    status: "final",
    data: { name: "work_of_breathing", value: "unchanged" },
    links: { supports: [] },
  };
}

test("memoryProof reuses one bedside observation across projection contexts", async () => {
  const events = await loadAllEvents(broadScope);
  const wobEvents = events.filter(isCanonicalWorkOfBreathing);
  assert.deepEqual(wobEvents.map((event) => event.id), [WOB]);

  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" });
  assert(proof.sections.why_it_mattered.some((item) => item.event_ids.includes(WOB)), "review/assessment missing WOB support");
  assert(proof.sections.evidence.some((item) => item.ref === WOB && item.event_ids?.includes("evt_p002_0930_care_plan")), "evidence/provenance missing WOB reuse");
  assert(proof.sections.open_loops.some((loop) => loop.evidence_ids.includes(WOB)), "open loop missing WOB support");
  assert(proof.sections.next_shift_handoff.some((item) => item.event_ids.includes(WOB)), "handoff missing WOB support");

  const notes = await narrative({ scope: broadScope, to: "2026-04-19T09:30:35-05:00" });
  assert(notes.some((note) => note.references.includes(WOB)), "narrative note path missing WOB support");
});

test("memoryProof ignores hidden simulator state files", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-hidden-state-"));
  try {
    const tmpPatientRoot = path.join(tmpRoot, "patients", "patient_002");
    await fs.mkdir(path.dirname(tmpPatientRoot), { recursive: true });
    await fs.cp(path.join(REPO_ROOT, "patients", "patient_002"), tmpPatientRoot, {
      recursive: true,
    });

    const scope: PatientScope = { chartRoot: tmpRoot, patientId: "patient_002" };
    const asOf = "2026-04-19T09:30:35-05:00";
    const before = stringifyProof(await memoryProof({ scope, asOf }));

    await fs.writeFile(
      path.join(tmpPatientRoot, "_sim_state.json"),
      `${JSON.stringify({
        hidden_lung_fluid_ml: 875,
        ground_truth_pneumonia_burden: "high",
        scheduled_event_queue: ["future_private_event"],
      }, null, 2)}\n`,
    );

    const after = stringifyProof(await memoryProof({ scope, asOf }));
    assert.equal(after, before);
    for (const key of HIDDEN_SIM_KEYS) {
      assert(!after.includes(key), `${key} leaked into memoryProof output`);
    }
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("memoryProof represents open-loop closure with patient_002", async () => {
  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" });
  const openIntentIds = proof.sections.open_loops.map((loop) => loop.intent_id);
  assert(openIntentIds.includes("evt_p002_0930_care_plan"), "active next-shift care plan should remain open");
  assert(!openIntentIds.includes("evt_p002_0912_order_abg"), "fulfilled ABG order should be closed");
});

test("memoryProof is deterministic", async () => {
  const first = stringifyProof(await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" }));
  const second = stringifyProof(await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" }));
  assert.equal(first, second);
});
