import type { AttestationRole, AttestationState } from "../src/views/attestationState.js";
import type { ReviewState } from "../src/views/reviewState.js";

export type { AttestationRole, AttestationState, ReviewState };

export type Intent = "administration" | "documentation" | "clarification" | "question" | "other";
export type BlockState = "blocked" | "unblocked";

export type ArtifactKind =
  | "clinical-note"
  | "vital-trend-evidence"
  | "open-loop-disposition"
  | "other";

export type ChartViewId =
  | "overview"
  | "handoff"
  | "vitals"
  | "flowsheet"
  | "mar"
  | "notes"
  | "labs"
  | "radiology"
  | "agent";

export type ChartViewDensity = "narrative" | "grid";

export type ChartView = {
  id: ChartViewId;
  label: string;
  density: ChartViewDensity;
};

export type SourceRef = string;

export type ArtifactProvenance = {
  sourceRefs: SourceRef[];
  review?: {
    state: ReviewState;
    attestation: AttestationState;
    requiredRole?: AttestationRole;
  };
};

export type ChartArtifactSummary = {
  kind: ArtifactKind;
  id: string;
  sourceRefs: SourceRef[];
  provenance?: ArtifactProvenance;
};

export type ChartContextBundle = {
  view: ChartViewId;
  mar?: { activeBlocks: { kind: ArtifactKind; reason: string }[] };
  recentArtifacts: ChartArtifactSummary[];
  requiresReview: ArtifactKind[];
};

export type AgentDockRequest = {
  view: ChartViewId;
  intent: Intent;
  marState: BlockState;
  prompt: string;
  contextBundle: ChartContextBundle;
};

export type SuggestedDraft = {
  kind: ArtifactKind;
  body: string;
  sourceRefs: SourceRef[];
};

export type AgentDockResponse =
  | { kind: "advisory"; banner: string }
  | { kind: "draft"; suggestedDrafts: SuggestedDraft[] };
