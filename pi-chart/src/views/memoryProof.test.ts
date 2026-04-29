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
const WOB = "evt-002-0032";
const ICU_ENCOUNTER = "enc-002-001";
const LATE_AS_OF = "2026-04-19T06:45:00-05:00";
const CORPUS_CASES = [
  {
    patientId: "patient_001",
    encounterId: "enc_001",
    asOf: "2026-04-18T08:45:00-05:00",
    proofFactId: "evt_20260418T0842_02",
    proofFactLabel: "focused respiratory reassessment",
  },
  {
    patientId: "patient_002",
    encounterId: ICU_ENCOUNTER,
    asOf: LATE_AS_OF,
    proofFactId: WOB,
    proofFactLabel: "work-of-breathing observation",
  },
  {
    patientId: "patient_003",
    encounterId: "enc-003-001",
    asOf: "2026-04-22T18:55:00-05:00",
    proofFactId: "evt-003-0018",
    proofFactLabel: "hypoperfusion/lactate/MAP observation",
  },
  {
    patientId: "patient_004",
    encounterId: "enc-004-001",
    asOf: "2026-04-23T18:55:00-05:00",
    proofFactId: "evt-004-0017",
    proofFactLabel: "medication-safety renal/K observation",
  },
  {
    patientId: "patient_005",
    encounterId: "enc-005-001",
    asOf: "2026-04-24T18:55:00-05:00",
    proofFactId: "evt-005-0018",
    proofFactLabel: "functional-safety delirium/fall-risk finding",
  },
] as const;
const HIDDEN_SIM_KEYS = [
  "hidden_lung_fluid_ml",
  "ground_truth_pneumonia_burden",
  "scheduled_event_queue",
] as const;
const REQUIRED_MEMORY_PROOF_SECTIONS = [
  "what_happened",
  "why_it_mattered",
  "evidence",
  "uncertainty",
  "open_loops",
  "next_shift_handoff",
] as const;
const ORDER_SUBTYPES = new Set(["order", "medication_order"]);
const CARE_PLAN_SUBTYPES = new Set(["order", "icu_transfer", "care_plan", "monitoring_plan"]);
const HANDOFF_SUBTYPES = new Set(["handoff", "sbar"]);
const REVIEW_NOTE_SUBTYPES = new Set(["ed_triage_note", "sbar", "nursing_note", "handoff"]);

function stringifyProof(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function corpusScope(patientId: string): PatientScope {
  return { chartRoot: REPO_ROOT, patientId };
}

function stringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out = (value as Record<string, unknown>)[key];
  return typeof out === "string" ? out : undefined;
}

function isCanonicalWorkOfBreathing(event: EventEnvelope): boolean {
  const name = stringField(event.data, "name");
  const text = [
    stringField(event.data, "value"),
    stringField(event.data, "finding"),
  ].filter(Boolean).join(" ").toLowerCase();
  return event.type === "observation" &&
    event.subtype === "exam_finding" &&
    (name === "work_of_breathing" ||
      text.includes("accessory muscle use") ||
      text.includes("work of breathing"));
}

test("memoryProof returns six required sections and is JSON-serializable", async () => {
  for (const { patientId, asOf, encounterId } of CORPUS_CASES) {
    const proof = await memoryProof({
      scope: corpusScope(patientId),
      asOf,
      encounterId,
    });
    assert.equal(proof.patient_id, patientId);
    assert.deepEqual(Object.keys(proof.sections), REQUIRED_MEMORY_PROOF_SECTIONS);
    const reparsed = JSON.parse(JSON.stringify(proof));
    assert.deepEqual(reparsed, proof);
  }
});

test("machine-verified/generated corpus fixtures cover all six broad EHR surfaces", async () => {
  for (const { patientId } of CORPUS_CASES) {
    const scope = corpusScope(patientId);
    const events = await loadAllEvents(scope);
    const notes = await narrative({ scope });
    assert(
      events.some((event) => event.type === "observation" && event.subtype === "exam_finding"),
      `${patientId}: nursing assessment missing`,
    );
    assert(
      events.some((event) => event.type === "intent" && ORDER_SUBTYPES.has(event.subtype ?? "")),
      `${patientId}: order missing`,
    );
    assert(events.some((event) => event.type === "action"), `${patientId}: intervention/action missing`);
    assert(
      events.some((event) => event.type === "observation" && event.subtype === "lab_result"),
      `${patientId}: lab/diagnostic missing`,
    );
    assert(
      events.some((event) =>
        event.type === "intent" && CARE_PLAN_SUBTYPES.has(event.subtype ?? "")
      ),
      `${patientId}: care plan/order intent missing`,
    );
    assert(
      events.some((event) => event.type === "communication" && HANDOFF_SUBTYPES.has(event.subtype ?? "")),
      `${patientId}: handoff/SBAR communication missing`,
    );
    assert(
      notes.some((note) => REVIEW_NOTE_SUBTYPES.has(note.subtype)),
      `${patientId}: narrative note missing`,
    );
    assert(
      events.some((event) => event.type === "observation" && event.subtype === "vital_sign"),
      `${patientId}: event vitals surface missing`,
    );
  }
});

test("memoryProof preserves asOf replay across evidence, notes, loops, and handoff", async () => {
  const early = await memoryProof({ scope: broadScope, asOf: "2026-04-19T06:30:00-05:00", encounterId: ICU_ENCOUNTER });
  const late = await memoryProof({ scope: broadScope, asOf: LATE_AS_OF, encounterId: ICU_ENCOUNTER });
  const earlyText = stringifyProof(early);
  const lateText = stringifyProof(late);
  assert(!earlyText.includes("evt-002-0042"), earlyText);
  assert(!earlyText.includes("note_20260419T0640_0640_ed_to_icu_sbar"), earlyText);
  assert(!earlyText.includes("evt-002-0041"), earlyText);
  assert(lateText.includes("evt-002-0042"), lateText);
  assert(lateText.includes("note_20260419T0640_0640_ed_to_icu_sbar") || lateText.includes("ED → MICU SBAR"), lateText);
  assert(late.sections.open_loops.some((loop) => loop.intent_id === "evt-002-0041"));
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
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_vitals_window_consumer",
    type: "assessment",
    subtype: "problem",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:10:00-05:00",
    recorded_at: "2026-04-18T08:10:00-05:00",
    author: { id: "test_rn", role: "rn" },
    source: { kind: "nurse_charted" },
    certainty: "observed",
    status: "active",
    data: { problem: "hypoxia" },
    links: { supports: ["vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:15:00-05:00"] },
  });

  const proof = await memoryProof({ scope, asOf: "2026-04-18T08:20:00-05:00" });
  const text = stringifyProof(proof);
  assert(text.includes("evt_vitals_window_consumer"), text);
  assert(!text.includes("to=2026-04-18T08:15:00-05:00"), text);
  assert(text.includes("to=2026-04-18T08%3A10%3A00-05%3A00"), text);
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
  for (const { patientId, asOf, encounterId, proofFactId, proofFactLabel } of CORPUS_CASES) {
    const scope = corpusScope(patientId);
    const events = await loadAllEvents(scope);
    if (patientId === "patient_002") {
      const wobEvents = events.filter(isCanonicalWorkOfBreathing);
      assert(wobEvents.some((event) => event.id === proofFactId), "focused work-of-breathing observation missing");
    } else {
      assert(
        events.some((event) => event.id === proofFactId && event.type === "observation"),
        `${patientId}: ${proofFactLabel} missing`,
      );
    }

    const proof = await memoryProof({ scope, asOf, encounterId });
    assert(
      proof.sections.why_it_mattered.some((item) => item.event_ids.includes(proofFactId)),
      `${patientId}: review/assessment missing ${proofFactLabel} support`,
    );
    assert(
      proof.sections.evidence.some((item) => item.ref === proofFactId),
      `${patientId}: evidence/provenance missing ${proofFactLabel} reuse`,
    );
    assert(
      proof.sections.open_loops.some((loop) => loop.evidence_ids.includes(proofFactId)),
      `${patientId}: open loop missing ${proofFactLabel} support`,
    );
    assert(
      proof.sections.next_shift_handoff.some((item) => item.event_ids.includes(proofFactId)),
      `${patientId}: handoff missing ${proofFactLabel} support`,
    );

    const notes = await narrative({ scope, to: asOf, encounterId });
    assert(
      notes.some((note) => note.references.includes(proofFactId)),
      `${patientId}: narrative note path missing ${proofFactLabel} support`,
    );
  }
});

test("memoryProof ignores hidden simulator state files", async () => {
  for (const { patientId, asOf, encounterId } of CORPUS_CASES) {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-hidden-state-"));
    try {
      const tmpPatientRoot = path.join(tmpRoot, "patients", patientId);
      await fs.mkdir(path.dirname(tmpPatientRoot), { recursive: true });
      await fs.cp(path.join(REPO_ROOT, "patients", patientId), tmpPatientRoot, {
        recursive: true,
      });

      const scope: PatientScope = { chartRoot: tmpRoot, patientId };
      const before = stringifyProof(await memoryProof({ scope, asOf, encounterId }));

      await fs.writeFile(
        path.join(tmpPatientRoot, "_sim_state.json"),
        `${JSON.stringify({
          hidden_lung_fluid_ml: 875,
          ground_truth_pneumonia_burden: "high",
          scheduled_event_queue: ["future_private_event"],
        }, null, 2)}\n`,
      );
      await fs.mkdir(path.join(tmpPatientRoot, "simulation", "hidden_truth"), { recursive: true });
      await fs.writeFile(
        path.join(tmpPatientRoot, "simulation", "hidden_truth", "pi_sim_state_plan.yaml"),
        "hidden_lung_fluid_ml: 875\nground_truth_pneumonia_burden: high\nscheduled_event_queue:\n  - future_private_event\n",
      );

      const after = stringifyProof(await memoryProof({ scope, asOf, encounterId }));
      assert.equal(after, before, `${patientId}: hidden state changed memoryProof output`);
      for (const key of HIDDEN_SIM_KEYS) {
        assert(!after.includes(key), `${patientId}: ${key} leaked into memoryProof output`);
      }
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  }
});

test("memoryProof represents open-loop closure with patient_002", async () => {
  const proof = await memoryProof({ scope: broadScope, asOf: LATE_AS_OF, encounterId: ICU_ENCOUNTER });
  const openIntentIds = proof.sections.open_loops.map((loop) => loop.intent_id);
  assert(openIntentIds.includes("evt-002-0041"), "active ICU transfer loop should remain open at demo start");
  assert(!openIntentIds.includes("evt-002-0034"), "fulfilled HFNC/ICU consult order should be closed");
});

test("memoryProof is deterministic", async () => {
  const first = stringifyProof(await memoryProof({ scope: broadScope, asOf: LATE_AS_OF, encounterId: ICU_ENCOUNTER }));
  const second = stringifyProof(await memoryProof({ scope: broadScope, asOf: LATE_AS_OF, encounterId: ICU_ENCOUNTER }));
  assert.equal(first, second);
});
