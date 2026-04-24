import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { memoryProof } from "./memoryProof.js";
import { loadAllEvents } from "./active.js";
import { narrative } from "./narrative.js";
import type { PatientScope } from "../types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const broadScope: PatientScope = { chartRoot: REPO_ROOT, patientId: "patient_002" };
const WOB = "evt_p002_0905_wob";

function stringifyProof(value: unknown): string {
  return JSON.stringify(value, null, 2);
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

test("memoryProof clamps vitals evidence windows to the consumer event time", async () => {
  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:10:35-05:00" });
  const text = stringifyProof(proof);
  assert(text.includes("evt_p002_0910_assess_resp"), text);
  assert(!text.includes("to=2026-04-19T09:15:00-05:00"), text);
  assert(text.includes("to=2026-04-19T09%3A10%3A00-05%3A00"), text);
  assert(!text.includes("evt_p002_0912_order_abg"), text);
});

test("memoryProof reuses one bedside observation across projection contexts", async () => {
  const proof = await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" });
  assert(proof.sections.why_it_mattered.some((item) => item.event_ids.includes(WOB)), "review/assessment missing WOB support");
  assert(proof.sections.evidence.some((item) => item.ref === WOB && item.event_ids?.includes("evt_p002_0930_care_plan")), "evidence/provenance missing WOB reuse");
  assert(proof.sections.open_loops.some((loop) => loop.evidence_ids.includes(WOB)), "open loop missing WOB support");
  assert(proof.sections.next_shift_handoff.some((item) => item.event_ids.includes(WOB)), "handoff missing WOB support");
});

test("memoryProof is deterministic", async () => {
  const first = stringifyProof(await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" }));
  const second = stringifyProof(await memoryProof({ scope: broadScope, asOf: "2026-04-19T09:30:35-05:00" }));
  assert.equal(first, second);
});
