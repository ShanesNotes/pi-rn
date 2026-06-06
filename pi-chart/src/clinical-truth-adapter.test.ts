import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import type { EventEnvelope, VitalSample } from "./types.js";
import {
  appendVitalEventToClinicalTruth,
  appendThroughClinicalTruth,
  appendVitalSampleToClinicalTruth,
  createFakeClinicalTruthBackendClient,
  projectAcceptedVitalSign,
  type ClinicalTruthAcceptedEntryView,
} from "./clinical-truth-adapter.js";

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

async function loadVectors(): Promise<any> {
  return JSON.parse(await readFile(vectorPath, "utf8"));
}

function acceptedEntryFromVector(vector: any): ClinicalTruthAcceptedEntryView {
  return {
    claim_id: vector.expected.claim_id,
    record_hash: vector.expected.record_hash,
    entry_hash: vector.expected.entry_hash,
    seq: vector.expected.seq,
    accepted_at: vector.expected.accepted_at,
    batch_id: vector.expected.batch_id,
    previous_entry_hash: vector.expected.previous_entry_hash,
    head_hash: vector.expected.head_hash,
    claim_json: vector.expected.claim_json,
  };
}

function vitalSample(): VitalSample {
  return {
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
}

test("appendVitalSampleToClinicalTruth uses backend seam and projects accepted fields", async () => {
  const vectors = await loadVectors();
  const appendVector = vectors.positive_vectors.find((vector: any) => vector.id === "110-base-vital-sign-append-result");
  const client = createFakeClinicalTruthBackendClient({
    acceptedEntries: [acceptedEntryFromVector(appendVector)],
  });
  const sample = vitalSample();

  const result = await appendVitalSampleToClinicalTruth(client, sample, {
    clientRequestId: "req-vital-append-001",
    actor: { id: "monitor-extension", kind: "device" },
  });

  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0].payload.client_request_id, "req-vital-append-001");
  assert.equal(client.requests[0].patient.patient_id, "patient-vital-001");
  assert.deepEqual(result.response.entry, appendVector.expected);
  assert.deepEqual(result.projection, {
    claimId: "claim-vital-hr-001",
    patientId: "patient-vital-001",
    encounterId: "encounter-vital-001",
    name: "heart_rate",
    value: 88,
    unit: "/min",
    source: { kind: "monitor_extension", ref: "public-vitals-fixture" },
    quality: "valid",
    validAt: "2026-05-03T12:00:00Z",
    recordedAt: "2026-05-03T12:00:05Z",
    acceptedAt: appendVector.expected.accepted_at,
    recordHash: appendVector.expected.record_hash,
    entryHash: appendVector.expected.entry_hash,
    seq: appendVector.expected.seq,
    idempotentReplay: false,
  });
});

test("appendThroughClinicalTruth exposes reusable backend-mediated composition seam", async () => {
  const vectors = await loadVectors();
  const appendVector = vectors.positive_vectors.find((vector: any) => vector.id === "110-base-vital-sign-append-result");
  const client = createFakeClinicalTruthBackendClient({
    acceptedEntries: [acceptedEntryFromVector(appendVector)],
  });

  const result = await appendThroughClinicalTruth(
    client,
    {
      buildCandidate: (sample: VitalSample) => ({
        contract_version: "clinical_truth.v1alpha1",
        expected_registry_version: vectors.registry.version,
        patient_ledger_ref: { patient_id: sample.subject },
        claim: appendVector.expected.claim_json,
        source_context: { produced_from: "pi-chart.vital_sample", evidence: [] },
      }),
      projectAccepted: (response) => response.entry.claim_id,
    },
    vitalSample(),
    "req-generic-pipeline-001",
  );

  assert.equal(result.request.payload.client_request_id, "req-generic-pipeline-001");
  assert.equal(result.projection, "claim-vital-hr-001");
});

test("projection reads accepted backend Claim JSON rather than caller sample view", async () => {
  const vectors = await loadVectors();
  const appendVector = vectors.positive_vectors.find((vector: any) => vector.id === "110-base-vital-sign-append-result");
  const accepted = acceptedEntryFromVector(appendVector);
  accepted.claim_json = structuredClone(accepted.claim_json);
  const acceptedObject = accepted.claim_json.object as Record<string, unknown>;
  acceptedObject.value = 92;
  acceptedObject.quality = "questionable";

  const projection = projectAcceptedVitalSign({
    contract_version: "clinical_truth.v1alpha1",
    service_build: "fake",
    registry_version: vectors.registry.version,
    entry: accepted,
    idempotent_replay: true,
  });

  assert.equal(projection.value, 92);
  assert.equal(projection.quality, "questionable");
  assert.equal(projection.idempotentReplay, true);
});

test("appendVitalEventToClinicalTruth rejects non-final suggestions before backend append", async () => {
  const client = createFakeClinicalTruthBackendClient();
  const event: EventEnvelope = {
    id: "evt-vital-suggested-001",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient-vital-001",
    encounter_id: "encounter-vital-001",
    effective_at: "2026-05-03T12:00:00Z",
    recorded_at: "2026-05-03T12:00:05Z",
    author: { id: "agent", role: "rn_agent" },
    source: { kind: "agent_synthesis", ref: "draft" },
    certainty: "inferred",
    status: "draft",
    data: { name: "heart_rate", value: 88, unit: "/min", quality: "valid" },
    links: {},
  };

  await assert.rejects(
    () => appendVitalEventToClinicalTruth(client, event, { clientRequestId: "req-draft" }),
    /suggestions need review first/,
  );
  assert.equal(client.requests.length, 0);
});

test("clinical truth adapter has no hidden sim, direct service, or hash-computation coupling", async () => {
  const source = await Promise.all([
    readFile(path.join(import.meta.dirname, "clinical-truth-adapter.ts"), "utf8"),
    readFile(path.join(import.meta.dirname, "clinical-truth-backend.ts"), "utf8"),
  ]).then((parts) => parts.join("\n"));
  assert.equal(source.includes("pi-sim"), false);
  assert.equal(source.includes("clinical-truth-service"), false);
  assert.equal(source.includes("createHash"), false);
  assert.equal(source.includes("canonical_json"), false);
  assert.equal(source.includes("sha256:"), false);
});
