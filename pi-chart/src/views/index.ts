// Re-exports for the view primitives (DESIGN §4) and bounded read-side
// compositions. Every UI control, agent context pull, and export composes
// from these.

export { timeline } from "./timeline.js";
export { currentState } from "./currentState.js";
export { activeProblems } from "./currentState.js";
export { trend } from "./trend.js";
export { evidenceChain } from "./evidenceChain.js";
export { openLoops } from "./openLoops.js";
export { narrative } from "./narrative.js";
export { memoryProof } from "./memoryProof.js";
export { contextBundle } from "./bundle.js";
export type {
  ContextBundle,
  ContextBundleParams,
  EvidenceContext,
} from "./bundle.js";

export {
  loadContext,
  loadAllEvents,
  indexSupersession,
  isVisibleAsOf,
  isSuperseded,
  isCorrected,
  effectiveClaim,
  supersededPriors,
} from "./active.js";
