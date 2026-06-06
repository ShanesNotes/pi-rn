import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import type { EventEnvelope, VitalSample } from "./types.js";
import {
  CLINICAL_TRUTH_CANONICALIZATION_ID,
  vitalEventEnvelopeToClaimCandidate,
  vitalSampleToClaimCandidate,
} from "./clinical-truth-contract.js";

const vectorPath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "pi-ledger",
  "conformance",
  "clinical_truth",
  "v1alpha1",
  "vital_sign_vectors.json",
);

async function loadBaseVitalVector(): Promise<any> {
  const suite = JSON.parse(await readFile(vectorPath, "utf8"));
  return suite.positive_vectors.find(
    (vector: any) => vector.id === "100-base-vital-sign-canonical-record-hash",
  );
}

test("VitalSample-to-Claim candidate matches Rust vital.sign vector fields without TS hashes", async () => {
  const vector = await loadBaseVitalVector();
  const sample: VitalSample = {
    sampled_at: "2026-05-03T12:00:00Z",
    recorded_at: "2026-05-03T12:00:05Z",
    sample_key: "claim-vital-hr-001",
    subject: "patient-vital-001",
    encounter_id: "encounter-vital-001",
    source: { kind: "monitor_extension", ref: "public-vitals-fixture" },
    name: "heart_rate",
    value: 88,
    unit: "/min",
    quality: "valid",
  };

  const candidate = vitalSampleToClaimCandidate(sample, {
    actor: { id: "monitor-extension", kind: "device" },
  });

  assert.deepEqual(candidate.patient_ledger_ref, { patient_id: vector.expected.subject_patient_id });
  assert.equal(candidate.claim.integrity?.["canonicalization"], CLINICAL_TRUTH_CANONICALIZATION_ID);
  assert.deepEqual(candidate.claim, vector.claim);
  assert.equal("record_hash" in candidate, false);
  assert.equal("canonical_json" in candidate, false);
  assert.equal("hash" in (candidate.claim.integrity as Record<string, unknown>), false);
});

test("EventEnvelope vital_sign mapping preserves event evidence outside the Claim record", async () => {
  const vector = await loadBaseVitalVector();
  const event: EventEnvelope = {
    id: "evt-vital-hr-monitor-001",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient-vital-001",
    encounter_id: "encounter-vital-001",
    effective_at: "2026-05-03T12:00:00Z",
    recorded_at: "2026-05-03T12:00:05Z",
    author: { id: "monitor-extension", role: "device" },
    source: { kind: "monitor_extension", ref: "public-vitals-fixture" },
    certainty: "observed",
    status: "final",
    data: {
      name: "heart_rate",
      value: 88,
      unit: "/min",
      quality: "valid",
    },
    links: {
      supports: [
        {
          kind: "vitals_window",
          ref: "vitals://encounter-vital-001?name=heart_rate",
          role: "primary",
          basis: "monitor sample window",
        },
      ],
    },
  };

  const candidate = vitalEventEnvelopeToClaimCandidate(event, {
    claimId: "claim-vital-hr-001",
    actor: { id: "monitor-extension", kind: "device" },
  });

  assert.deepEqual(candidate.claim, vector.claim);
  assert.equal(candidate.source_context.produced_from, "pi-chart.event_envelope.vital_sign");
  assert.equal(candidate.source_context.source_event_id, event.id);
  assert.deepEqual(candidate.source_context.evidence.map((ref) => ref.kind), [
    "event",
    "vitals_window",
  ]);
  assert.equal("links" in candidate.claim, false);
});

test("VitalSample default actor preserves chart source taxonomy unless caller overrides it", () => {
  const sample: VitalSample = {
    sampled_at: "2026-05-03T12:00:00Z",
    recorded_at: "2026-05-03T12:00:05Z",
    sample_key: "claim-vital-hr-001",
    subject: "patient-vital-001",
    encounter_id: "encounter-vital-001",
    source: { kind: "monitor_extension", ref: "public-vitals-fixture" },
    name: "heart_rate",
    value: 88,
    unit: "/min",
    quality: "valid",
  };

  const candidate = vitalSampleToClaimCandidate(sample);

  assert.deepEqual(candidate.claim.actor, {
    id: "public-vitals-fixture",
    kind: "monitor_extension",
  });
});

test("clinical truth contract code has no hidden sim, direct service, or hash authority coupling", async () => {
  const sources = await Promise.all([
    readFile(path.join(import.meta.dirname, "clinical-truth-contract.ts"), "utf8"),
    readFile(path.join(import.meta.dirname, "source-taxonomy.ts"), "utf8"),
  ]);
  for (const source of sources) {
    assert.equal(source.includes("pi-sim"), false);
    assert.equal(source.includes("clinical-truth-service"), false);
    assert.equal(source.includes("createHash"), false);
    assert.equal(source.includes("record_hash"), false);
    assert.equal(source.includes("canonical_json"), false);
    assert.equal(source.includes("sha256"), false);
  }
});
