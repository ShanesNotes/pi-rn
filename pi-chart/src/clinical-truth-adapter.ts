import type { EventEnvelope, EvidenceRef, Source, VitalSample } from "./types.js";
import {
  type ClaimActor,
  type ClinicalTruthClaimCandidate,
  vitalEventEnvelopeToClaimCandidate,
  vitalSampleToClaimCandidate,
} from "./clinical-truth-contract.js";
import {
  appendRequestFromCandidate,
  type ClinicalTruthAppendRequest,
  type ClinicalTruthAppendResponse,
  type ClinicalTruthBackendClient,
} from "./clinical-truth-backend.js";

export { createFakeClinicalTruthBackendClient } from "./clinical-truth-backend.js";
export type {
  ClinicalTruthAcceptedEntryView,
  ClinicalTruthAppendRequest,
  ClinicalTruthAppendResponse,
  ClinicalTruthBackendClient,
} from "./clinical-truth-backend.js";

export interface AppendVitalOptions {
  clientRequestId: string;
  claimId?: string;
  actor?: ClaimActor;
  evidence?: EvidenceRef[];
}

export interface AcceptedVitalProjection {
  claimId: string;
  patientId: string;
  encounterId: string;
  name: string;
  value: number;
  unit: string;
  source: Source;
  quality: string;
  validAt: string;
  recordedAt: string;
  acceptedAt: string;
  recordHash: string;
  entryHash: string;
  seq: number;
  idempotentReplay: boolean;
}

export interface AppendVitalResult {
  request: ClinicalTruthAppendRequest;
  response: ClinicalTruthAppendResponse;
  projection: AcceptedVitalProjection;
}

export interface ClinicalTruthAppendPipeline<TInput, TProjection> {
  buildCandidate(input: TInput): ClinicalTruthClaimCandidate;
  projectAccepted(response: ClinicalTruthAppendResponse): TProjection;
}

export async function appendThroughClinicalTruth<TInput, TProjection>(
  client: ClinicalTruthBackendClient,
  pipeline: ClinicalTruthAppendPipeline<TInput, TProjection>,
  input: TInput,
  clientRequestId: string,
): Promise<{
  request: ClinicalTruthAppendRequest;
  response: ClinicalTruthAppendResponse;
  projection: TProjection;
}> {
  const request = appendRequestFromCandidate(pipeline.buildCandidate(input), clientRequestId);
  const response = await client.appendClaim(request);
  return { request, response, projection: pipeline.projectAccepted(response) };
}

export function buildAppendVitalSampleRequest(
  sample: VitalSample,
  opts: AppendVitalOptions,
): ClinicalTruthAppendRequest {
  return appendRequestFromCandidate(
    vitalSampleToClaimCandidate(sample, {
      claimId: opts.claimId,
      actor: opts.actor,
      evidence: opts.evidence,
    }),
    opts.clientRequestId,
  );
}

export function buildAppendVitalEventRequest(
  event: EventEnvelope,
  opts: AppendVitalOptions,
): ClinicalTruthAppendRequest {
  assertAppendableChartEvent(event);
  return appendRequestFromCandidate(vitalEventEnvelopeToClaimCandidate(event, opts), opts.clientRequestId);
}

export async function appendVitalSampleToClinicalTruth(
  client: ClinicalTruthBackendClient,
  sample: VitalSample,
  opts: AppendVitalOptions,
): Promise<AppendVitalResult> {
  return appendThroughClinicalTruth(
    client,
    {
      buildCandidate: (input) =>
        vitalSampleToClaimCandidate(input, {
          claimId: opts.claimId,
          actor: opts.actor,
          evidence: opts.evidence,
        }),
      projectAccepted: projectAcceptedVitalSign,
    },
    sample,
    opts.clientRequestId,
  );
}

export async function appendVitalEventToClinicalTruth(
  client: ClinicalTruthBackendClient,
  event: EventEnvelope,
  opts: AppendVitalOptions,
): Promise<AppendVitalResult> {
  assertAppendableChartEvent(event);
  return appendThroughClinicalTruth(
    client,
    {
      buildCandidate: (input) => vitalEventEnvelopeToClaimCandidate(input, opts),
      projectAccepted: projectAcceptedVitalSign,
    },
    event,
    opts.clientRequestId,
  );
}

export function projectAcceptedVitalSign(response: ClinicalTruthAppendResponse): AcceptedVitalProjection {
  const claim = response.entry.claim_json;
  const object = objectField(claim, "object");
  const subject = objectField(claim, "subject");
  const time = objectField(claim, "time");
  const valid = objectField(time, "valid");
  return {
    claimId: stringField(claim, "id"),
    patientId: stringField(subject, "patientId"),
    encounterId: stringField(object, "encounterId"),
    name: stringField(object, "code"),
    value: numberField(object, "value"),
    unit: stringField(object, "unit"),
    source: sourceField(object, "source"),
    quality: stringField(object, "quality"),
    validAt: stringField(valid, "instant"),
    recordedAt: stringField(time, "recorded_at"),
    acceptedAt: response.entry.accepted_at,
    recordHash: response.entry.record_hash,
    entryHash: response.entry.entry_hash,
    seq: response.entry.seq,
    idempotentReplay: response.idempotent_replay,
  };
}

function assertAppendableChartEvent(event: EventEnvelope): void {
  if (event.status !== "final") {
    throw new Error("clinical truth adapter only appends final chart facts; suggestions need review first");
  }
  if (event.certainty !== "observed" && event.certainty !== "reported") {
    throw new Error("clinical truth adapter only appends observed/reported vital facts");
  }
}

function objectField(value: Record<string, unknown>, field: string): Record<string, unknown> {
  const child = value[field];
  if (!child || typeof child !== "object" || Array.isArray(child)) {
    throw new Error(`accepted vital claim missing object field ${field}`);
  }
  return child as Record<string, unknown>;
}

function stringField(value: Record<string, unknown>, field: string): string {
  const child = value[field];
  if (typeof child !== "string" || child.length === 0) {
    throw new Error(`accepted vital claim missing string field ${field}`);
  }
  return child;
}

function numberField(value: Record<string, unknown>, field: string): number {
  const child = value[field];
  if (typeof child !== "number" || !Number.isFinite(child)) {
    throw new Error(`accepted vital claim missing numeric field ${field}`);
  }
  return child;
}

function sourceField(value: Record<string, unknown>, field: string): Source {
  const child = objectField(value, field);
  if (typeof child.kind !== "string" || child.kind.length === 0) {
    throw new Error(`accepted vital claim missing source.kind in field ${field}`);
  }
  return {
    kind: child.kind,
    ...(typeof child.ref === "string" && child.ref.length > 0 ? { ref: child.ref } : {}),
  };
}
