// evidenceChain(params) — walks links.supports backward from a given
// event id (DESIGN §4.5). Each support entry resolves to one of four
// EvidenceNode kinds: event (recursive), vitals (trend points),
// note (NarrativeEntry), artifact (pointer).
//
// Per §6.3, the evidence chain includes superseded priors under
// `node.supersedes` so the basis of the original reasoning remains
// auditable after a claim is replaced.

import path from "node:path";
import { promises as fs } from "node:fs";
import { parseEvidenceRef, isVitalsUri } from "../evidence.js";
import { loadContext, supersededPriors } from "./active.js";
import { trend } from "./trend.js";
import { narrative } from "./narrative.js";
import { patientRoot } from "../types.js";
import type {
  ActiveContext,
} from "./active.js";
import type {
  ArtifactPointer,
  EventEnvelope,
  EvidenceChainParams,
  EvidenceNode,
  EvidenceRef,
  NarrativeEntry,
} from "../types.js";

export async function evidenceChain(
  params: EvidenceChainParams,
): Promise<EvidenceNode> {
  const ctx = await loadContext(params.scope);
  const root = ctx.byId.get(params.eventId);
  if (!root) {
    throw new Error(
      `evidenceChain: unknown event id '${params.eventId}' in patient '${params.scope.patientId}'`,
    );
  }
  const depth = params.depth ?? 3;
  const notes = await narrative({ scope: params.scope });
  const notesById = new Map<string, NarrativeEntry>(notes.map((n) => [n.id, n]));
  return resolveEvent(root, ctx, params, notesById, depth, new Set());
}

async function resolveEvent(
  ev: EventEnvelope,
  ctx: ActiveContext,
  params: EvidenceChainParams,
  notesById: Map<string, NarrativeEntry>,
  depthRemaining: number,
  seen: Set<string>,
): Promise<EvidenceNode> {
  const supportsNodes: EvidenceNode[] = [];
  if (depthRemaining !== 0 && !seen.has(ev.id)) {
    const next = new Set(seen);
    next.add(ev.id);
    for (const raw of ev.links?.supports ?? []) {
      const ref = parseEvidenceRef(raw as string | EvidenceRef);
      if (!ref) continue;
      const node = await resolveRef(
        ref,
        ctx,
        params,
        notesById,
        depthRemaining < 0 ? depthRemaining : depthRemaining - 1,
        next,
      );
      if (node) supportsNodes.push(node);
    }
  }
  return {
    kind: "event",
    event: ev,
    supports: supportsNodes,
    supersedes: supersededPriors(ev, ctx),
  };
}

async function resolveRef(
  ref: EvidenceRef,
  ctx: ActiveContext,
  params: EvidenceChainParams,
  notesById: Map<string, NarrativeEntry>,
  depthRemaining: number,
  seen: Set<string>,
): Promise<EvidenceNode | null> {
  switch (ref.kind) {
    case "event": {
      const next = ctx.byId.get(ref.id);
      if (!next) return null;
      return resolveEvent(next, ctx, params, notesById, depthRemaining, seen);
    }
    case "note": {
      const note = notesById.get(ref.id);
      if (!note) return null;
      return { kind: "note", note };
    }
    case "vitals": {
      const points = await trend({
        scope: params.scope,
        metric: ref.metric,
        from: ref.from,
        to: ref.to,
      });
      return { kind: "vitals", metric: ref.metric, points };
    }
    case "artifact": {
      const artifact = await resolveArtifact(ref.id, ctx, params);
      if (!artifact) return null;
      return { kind: "artifact", artifact };
    }
  }
}

async function resolveArtifact(
  id: string,
  ctx: ActiveContext,
  params: EvidenceChainParams,
): Promise<ArtifactPointer | null> {
  const ev = ctx.byId.get(id);
  if (!ev || ev.type !== "artifact_ref") return null;
  const relPath = (ev.data as any)?.path;
  if (typeof relPath !== "string") return null;
  const abs = path.join(patientRoot(params.scope), relPath);
  try {
    await fs.access(abs);
    return { id, path: relPath };
  } catch {
    return null;
  }
}

/** Convenience: vitals:// URIs remain a valid shorthand in the schema. */
export function isVitalsShorthand(s: unknown): boolean {
  return isVitalsUri(s);
}
