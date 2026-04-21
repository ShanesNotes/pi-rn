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
  writeNote,
  writeCommunicationNote,
  writeArtifactRef,
  nextEventId,
  nextNoteId,
} from "./write.js";

export { rebuildDerived } from "./derived.js";
export { validateChart } from "./validate.js";

export { parseEvidenceRef, formatVitalsUri, isVitalsUri } from "./evidence.js";
export type { EvidenceRef } from "./evidence.js";

export { WallClock, SimClock, chartClock, loadChartMeta } from "./time.js";
export type { Clock } from "./time.js";

export type * from "./types.js";
