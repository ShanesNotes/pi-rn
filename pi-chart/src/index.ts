// Public API surface for pi-chart. The agent goes through this module —
// arbitrary file edits are not part of the contract.

export {
  readPatientContext,
  readActiveConstraints,
  readRecentEvents,
  readRecentNotes,
  readLatestVitals,
  latestEffectiveAt,
} from "./read.js";

export {
  appendEvent,
  writeCommunicationNote,
  writeArtifactRef,
  nextEventId,
  nextNoteId,
} from "./write.js";

export { rebuildDerived } from "./derived.js";
export { validateChart } from "./validate.js";

export { parseEvidenceRef, formatVitalsUri, isVitalsUri } from "./evidence.js";

export {
  timeline,
  activeProblems,
  currentState,
  trend,
  evidenceChain,
  openLoops,
  narrative,
  memoryProof,
} from "./views/index.js";

export {
  WallClock,
  SimClock,
  chartClock,
  loadChartMeta,
  loadSystemRegistry,
} from "./time.js";
export type { Clock } from "./time.js";

export {
  tryLoadSessionAuthor,
  tryLoadSessionState,
  tryLoadSessionPatientId,
  tryLoadSessionChartRoot,
  tryLoadSystemRegistry,
  listPatientIds,
} from "./session.js";

export { patientRoot } from "./types.js";
export type * from "./types.js";

export {
  appendThroughClinicalTruth,
  appendVitalEventToClinicalTruth,
  appendVitalSampleToClinicalTruth,
  buildAppendVitalEventRequest,
  buildAppendVitalSampleRequest,
  projectAcceptedVitalSign,
} from "./clinical-truth-adapter.js";
export type {
  AcceptedVitalProjection,
  AppendVitalOptions,
  ClinicalTruthAppendPipeline,
  AppendVitalResult,
  ClinicalTruthAcceptedEntryView,
  ClinicalTruthAppendRequest,
  ClinicalTruthAppendResponse,
  ClinicalTruthBackendClient,
} from "./clinical-truth-adapter.js";

export {
  CLINICAL_TRUTH_CANONICALIZATION_ID,
  CLINICAL_TRUTH_CONTRACT_VERSION,
  CLINICAL_TRUTH_VITAL_SIGN_REGISTRY_VERSION,
  VITAL_SIGN_PREDICATE,
  vitalEventEnvelopeToClaimCandidate,
  vitalSampleToClaimCandidate,
} from "./clinical-truth-contract.js";
export type {
  ClaimActor,
  ClinicalTruthClaimCandidate,
  VitalClaimCandidateOptions,
} from "./clinical-truth-contract.js";
