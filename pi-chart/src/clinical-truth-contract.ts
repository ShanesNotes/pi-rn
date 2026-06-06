import type { EventEnvelope, EvidenceRef, Source, VitalSample } from "./types.js";
import { actorFromChartSource } from "./source-taxonomy.js";
import { vitalQualityState } from "./vitals.js";

export const CLINICAL_TRUTH_CONTRACT_VERSION = "clinical_truth.v1alpha1";
export const CLINICAL_TRUTH_VITAL_SIGN_REGISTRY_VERSION =
  "clinical_truth.v1alpha1.vital_sign_fixture.2026-05-31";
export const CLINICAL_TRUTH_CANONICALIZATION_ID = "jcs-rfc8785-pi-chart-v1";
export const VITAL_SIGN_PREDICATE = "vital.sign";

export interface ClaimActor {
  id: string;
  kind: string;
}

export interface ClinicalTruthClaimCandidate {
  contract_version: typeof CLINICAL_TRUTH_CONTRACT_VERSION;
  expected_registry_version: typeof CLINICAL_TRUTH_VITAL_SIGN_REGISTRY_VERSION;
  patient_ledger_ref: { patient_id: string };
  claim: Record<string, unknown>;
  source_context: {
    produced_from: "pi-chart.vital_sample" | "pi-chart.event_envelope.vital_sign";
    source_event_id?: string;
    evidence: EvidenceRef[];
  };
}

export interface VitalClaimCandidateOptions {
  claimId?: string;
  actor?: ClaimActor;
  evidence?: EvidenceRef[];
  producedFrom?: ClinicalTruthClaimCandidate["source_context"]["produced_from"];
  sourceEventId?: string;
}

export function vitalSampleToClaimCandidate(
  sample: VitalSample,
  opts: VitalClaimCandidateOptions = {},
): ClinicalTruthClaimCandidate {
  if (typeof sample.value !== "number" || !Number.isFinite(sample.value)) {
    throw new Error("clinical truth vital.sign candidate requires a numeric VitalSample.value");
  }
  const claimId = opts.claimId ?? sample.sample_key;
  if (!claimId) {
    throw new Error("clinical truth vital.sign candidate requires claimId or sample_key");
  }
  const actor = opts.actor ?? actorFromChartSource(sample.source);
  const recordedAt = sample.recorded_at ?? sample.sampled_at;
  const claim = {
    actor,
    id: claimId,
    integrity: {
      canonicalization: CLINICAL_TRUTH_CANONICALIZATION_ID,
    },
    object: {
      code: sample.name,
      encounterId: sample.encounter_id,
      quality: vitalQualityState(sample.quality),
      source: sample.source,
      unit: sample.unit ?? "",
      value: sample.value,
    },
    predicate: VITAL_SIGN_PREDICATE,
    shape: "observation",
    subject: {
      patientId: sample.subject,
    },
    time: {
      recorded_at: recordedAt,
      valid: {
        instant: sample.sampled_at,
      },
    },
  };
  return {
    contract_version: CLINICAL_TRUTH_CONTRACT_VERSION,
    expected_registry_version: CLINICAL_TRUTH_VITAL_SIGN_REGISTRY_VERSION,
    patient_ledger_ref: { patient_id: sample.subject },
    claim,
    source_context: {
      produced_from: opts.producedFrom ?? "pi-chart.vital_sample",
      source_event_id: opts.sourceEventId,
      evidence: opts.evidence ?? [],
    },
  };
}

export function vitalEventEnvelopeToClaimCandidate(
  event: EventEnvelope,
  opts: Omit<VitalClaimCandidateOptions, "producedFrom" | "sourceEventId"> = {},
): ClinicalTruthClaimCandidate {
  if (event.type !== "observation" || event.subtype !== "vital_sign") {
    throw new Error("EventEnvelope must be an observation/vital_sign event");
  }
  const data = event.data ?? {};
  const sample: VitalSample = {
    sampled_at: event.effective_at ?? event.effective_period?.start,
    recorded_at: event.recorded_at,
    sample_key: opts.claimId,
    subject: event.subject,
    encounter_id: event.encounter_id ?? "",
    source: event.source,
    name: stringField(data, "name"),
    value: numericField(data, "value"),
    unit: optionalStringField(data, "unit"),
    quality: data.quality as VitalSample["quality"],
  };
  return vitalSampleToClaimCandidate(sample, {
    ...opts,
    producedFrom: "pi-chart.event_envelope.vital_sign",
    sourceEventId: event.id,
    evidence: normalizeEventEvidence(event, opts.evidence),
  });
}

function stringField(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`vital_sign event data.${field} must be a non-empty string`);
  }
  return value;
}

function optionalStringField(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`vital_sign event data.${field} must be a string when present`);
  }
  return value;
}

function numericField(data: Record<string, unknown>, field: string): number {
  const value = data[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`vital_sign event data.${field} must be a finite number`);
  }
  return value;
}

function normalizeEventEvidence(
  event: EventEnvelope,
  extraEvidence: EvidenceRef[] | undefined,
): EvidenceRef[] {
  const evidence: EvidenceRef[] = [
    { kind: "event", ref: event.id, role: "primary", basis: "source EventEnvelope" },
  ];
  for (const support of event.links?.supports ?? []) {
    if (typeof support === "string") {
      evidence.push({ kind: "event", ref: support, role: "context" });
    } else {
      evidence.push(support);
    }
  }
  evidence.push(...(extraEvidence ?? []));
  return evidence;
}
