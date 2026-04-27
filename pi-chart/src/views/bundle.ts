// contextBundle(params) — S5 read-side composition layer.
//
// This is intentionally a thin, read-only wrapper over existing views. It
// gives downstream serialized readers one bounded package without introducing
// new raw chart loading, schema/profile/hash/fingerprint, or root API scope.

import { resolveAsOfMs } from "./active.js";
import { currentState } from "./currentState.js";
import { memoryProof } from "./memoryProof.js";
import { narrative } from "./narrative.js";
import { openLoops } from "./openLoops.js";
import { timeline } from "./timeline.js";
import type {
  CurrentState,
  MemoryProof,
  NarrativeEntry,
  PatientScope,
  TimelineEntry,
} from "../types.js";

export interface ContextBundleParams {
  scope: PatientScope;
  asOf?: string;
  encounterId?: string;
}

export interface EvidenceContext {
  evidence: MemoryProof["sections"]["evidence"];
  uncertainty: MemoryProof["sections"]["uncertainty"];
  proof_refs: string[];
}

export interface ContextBundle {
  patient_id: string;
  asOf: string;
  source_view_refs: string[];
  current_state: CurrentState;
  open_loops: Awaited<ReturnType<typeof openLoops>>;
  narrative_handoff: NarrativeEntry[];
  evidence_context: EvidenceContext;
  recent_timeline: TimelineEntry[];
}

export async function contextBundle(
  params: ContextBundleParams,
): Promise<ContextBundle> {
  const asOfMs = await resolveAsOfMs(params.scope, params.asOf);
  const asOf = new Date(asOfMs).toISOString();
  const from = new Date(startOfUtcDay(asOfMs)).toISOString();

  const [current_state, open_loops, narrative_handoff, recent_timeline, proof] =
    await Promise.all([
      currentState({ scope: params.scope, axis: "all", asOf, encounterId: params.encounterId }),
      openLoops({ scope: params.scope, asOf, encounterId: params.encounterId }),
      narrative({
        scope: params.scope,
        to: asOf,
        encounterId: params.encounterId,
      }),
      timeline({
        scope: params.scope,
        from,
        to: asOf,
        encounterId: params.encounterId,
      }),
      memoryProof({
        scope: params.scope,
        asOf,
        encounterId: params.encounterId,
      }),
    ]);

  return {
    patient_id: params.scope.patientId,
    asOf,
    source_view_refs: sourceViewRefs(params.encounterId),
    current_state,
    open_loops,
    narrative_handoff,
    evidence_context: {
      evidence: proof.sections.evidence,
      uncertainty: proof.sections.uncertainty,
      proof_refs: proof.source_view_refs,
    },
    recent_timeline,
  };
}

function sourceViewRefs(encounterId: string | undefined): string[] {
  const encounterSuffix = encounterId ? ",encounterId" : "";
  return [
    "currentState(axis=all,asOf)",
    "openLoops(asOf)",
    `narrative(to=asOf${encounterSuffix})`,
    `timeline(from=startOfDay,to=asOf${encounterSuffix})`,
    `memoryProof(asOf${encounterSuffix})`,
  ];
}

function startOfUtcDay(ms: number): number {
  if (!Number.isFinite(ms)) return Number.NEGATIVE_INFINITY;
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
