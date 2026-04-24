// Re-exports for the six view primitives (DESIGN §4). Every UI control,
// agent context pull, and export composes from these.

export { timeline } from "./timeline.js";
export { currentState } from "./currentState.js";
export { activeProblems } from "./currentState.js";
export { trend } from "./trend.js";
export { evidenceChain } from "./evidenceChain.js";
export { openLoops } from "./openLoops.js";
export { narrative } from "./narrative.js";

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
