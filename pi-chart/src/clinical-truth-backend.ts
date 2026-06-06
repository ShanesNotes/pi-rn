import {
  type ClinicalTruthClaimCandidate,
  CLINICAL_TRUTH_CONTRACT_VERSION,
} from "./clinical-truth-contract.js";

export interface ClinicalTruthAppendRequest {
  contract_version: typeof CLINICAL_TRUTH_CONTRACT_VERSION;
  patient: { patient_id: string };
  payload: {
    claim_json: Record<string, unknown>;
    client_request_id: string;
    source_context: ClinicalTruthClaimCandidate["source_context"];
  };
  expected_registry_version: string;
}

export interface ClinicalTruthAcceptedEntryView {
  claim_id: string;
  record_hash: string;
  entry_hash: string;
  seq: number;
  accepted_at: string;
  batch_id: string;
  previous_entry_hash?: string | null;
  head_hash: string;
  claim_json: Record<string, unknown>;
}

export interface ClinicalTruthAppendResponse {
  contract_version: typeof CLINICAL_TRUTH_CONTRACT_VERSION;
  service_build: string;
  registry_version: string;
  entry: ClinicalTruthAcceptedEntryView;
  idempotent_replay: boolean;
}

export interface ClinicalTruthBackendClient {
  appendClaim(request: ClinicalTruthAppendRequest): Promise<ClinicalTruthAppendResponse>;
}

export function appendRequestFromCandidate(
  candidate: ClinicalTruthClaimCandidate,
  clientRequestId: string,
): ClinicalTruthAppendRequest {
  return {
    contract_version: candidate.contract_version,
    patient: candidate.patient_ledger_ref,
    payload: {
      claim_json: candidate.claim,
      client_request_id: clientRequestId,
      source_context: candidate.source_context,
    },
    expected_registry_version: candidate.expected_registry_version,
  };
}

export function createFakeClinicalTruthBackendClient(opts: {
  acceptedEntries?: ClinicalTruthAcceptedEntryView[];
  registryVersion?: string;
  serviceBuild?: string;
} = {}): ClinicalTruthBackendClient & { requests: ClinicalTruthAppendRequest[] } {
  const acceptedEntries = [...(opts.acceptedEntries ?? [])];
  const requests: ClinicalTruthAppendRequest[] = [];
  return {
    requests,
    async appendClaim(request: ClinicalTruthAppendRequest): Promise<ClinicalTruthAppendResponse> {
      assertNoCallerHashAuthority(request.payload.claim_json);
      requests.push(structuredClone(request));
      const seq = requests.length;
      const entry = acceptedEntries.shift() ?? {
        claim_id: stringField(request.payload.claim_json, "id"),
        record_hash: `backend-assigned-record-hash-${seq}`,
        entry_hash: `backend-assigned-entry-hash-${seq}`,
        seq,
        accepted_at: "2026-05-03T12:00:10Z",
        batch_id: `batch-${String(seq).padStart(12, "0")}`,
        previous_entry_hash: seq === 1 ? null : `backend-assigned-entry-hash-${seq - 1}`,
        head_hash: `backend-assigned-entry-hash-${seq}`,
        claim_json: request.payload.claim_json,
      };
      return {
        contract_version: request.contract_version,
        service_build: opts.serviceBuild ?? "fake-clinical-truth-backend.contract-test",
        registry_version: opts.registryVersion ?? request.expected_registry_version,
        entry,
        idempotent_replay: false,
      };
    },
  };
}

function assertNoCallerHashAuthority(claim: Record<string, unknown>): void {
  const integrity = claim.integrity;
  if (integrity && typeof integrity === "object" && "hash" in integrity) {
    throw new Error("pi-chart must not send caller-computed Claim hashes");
  }
}

function stringField(value: Record<string, unknown>, field: string): string {
  const child = value[field];
  if (typeof child !== "string" || child.length === 0) {
    throw new Error(`accepted vital claim missing string field ${field}`);
  }
  return child;
}
