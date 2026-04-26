import type { ArtifactKind, BlockState, ChartViewId, Intent } from "./agent-canvas-types.js";

export const INTENTS = [
  "administration",
  "documentation",
  "clarification",
  "question",
  "other",
] as const satisfies readonly Intent[];

export const BLOCK_STATES = ["blocked", "unblocked"] as const satisfies readonly BlockState[];

export const ADVISORY_BANNER_COPY =
  "Advisory co-pilot. Verify with source data. Final clinical write requires clinician action.";

export const REQUIRES_REVIEW: ReadonlySet<ArtifactKind> = new Set([
  "clinical-note",
  "vital-trend-evidence",
  "open-loop-disposition",
]);

export const GRID_DENSE_VIEWS = ["vitals", "flowsheet", "mar", "labs"] as const satisfies readonly ChartViewId[];

export const NARRATIVE_VIEWS = [
  "overview",
  "handoff",
  "notes",
  "radiology",
  "agent",
] as const satisfies readonly ChartViewId[];
