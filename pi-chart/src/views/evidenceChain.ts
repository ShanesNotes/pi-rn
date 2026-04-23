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
import {
  expandVitalsWindowRef,
  isVitalsUri,
  parseEvidenceRef,
} from "../evidence.js";
import { resolveArtifactPath } from "../artifacts.js";
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
  EvidenceRole,
  NarrativeEntry,
} from "../types.js";
import type { NormalizedEvidenceRef } from "../evidence.js";

type EventEvidenceNode = Extract<EvidenceNode, { kind: "event" }>;

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
): Promise<EventEvidenceNode> {
  const supportsNodes: EvidenceNode[] = [];
  const contradictsNodes: EvidenceNode[] = [];
  if (depthRemaining !== 0 && !seen.has(ev.id)) {
    const next = new Set(seen);
    next.add(ev.id);
    const childDepth = depthRemaining < 0 ? depthRemaining : depthRemaining - 1;
    for (const raw of ev.links?.supports ?? []) {
      const ref = parseEvidenceRef(raw);
      if (!ref) continue;
      const node = await resolveRef(
        ref,
        ctx,
        params,
        notesById,
        childDepth,
        next,
      );
      if (node) supportsNodes.push(node);
    }
    for (const target of ev.links?.contradicts ?? []) {
      const contradicted = ctx.byId.get(target.ref);
      if (!contradicted) continue;
      const node = await resolveEvent(
        contradicted,
        ctx,
        params,
        notesById,
        childDepth,
        next,
      );
      contradictsNodes.push(node);
    }
  }
  return {
    kind: "event",
    event: ev,
    supports: supportsNodes,
    supersedes: supersededPriors(ev, ctx),
    ...(contradictsNodes.length ? { contradicts: contradictsNodes } : {}),
  };
}

async function resolveRef(
  ref: NormalizedEvidenceRef,
  ctx: ActiveContext,
  params: EvidenceChainParams,
  notesById: Map<string, NarrativeEntry>,
  depthRemaining: number,
  seen: Set<string>,
): Promise<EvidenceNode | null> {
  switch (ref.kind) {
    case "event": {
      const next = ctx.byId.get(ref.ref);
      if (!next) return null;
      return withRole(
        await resolveEvent(next, ctx, params, notesById, depthRemaining, seen),
        ref.role,
      );
    }
    case "note": {
      const note = notesById.get(ref.ref);
      if (!note) return null;
      return withRole({ kind: "note", note }, ref.role);
    }
    case "vitals_window": {
      const window = expandVitalsWindowRef(ref);
      if (!window) return null;
      const points = await trend({
        scope: params.scope,
        metric: window.metric,
        from: window.from,
        to: window.to,
        encounterId: window.encounterId,
      });
      // ADR 010 dual vocabulary: input refs normalize to `vitals_window`,
      // emitted view nodes stay `{ kind: "vitals", metric, points }`.
      return withRole(
        { kind: "vitals", metric: window.metric, points },
        ref.role,
      );
    }
    case "artifact": {
      const artifact = await resolveArtifact(ref.ref, ctx, params);
      if (!artifact) return null;
      return withRole({ kind: "artifact", artifact }, ref.role);
    }
    case "external":
      return null;
  }
}

function withRole<T extends EvidenceNode>(node: T, role?: EvidenceRole): T {
  if (!role) return node;
  return { ...node, role };
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
  let resolved: ReturnType<typeof resolveArtifactPath>;
  try {
    resolved = resolveArtifactPath(patientRoot(params.scope), relPath);
  } catch {
    return null;
  }
  try {
    await fs.access(resolved.absolutePath);
    return { id, path: resolved.storedPath };
  } catch {
    return null;
  }
}

/** Convenience: vitals:// URIs remain a valid shorthand in the schema. */
export function isVitalsShorthand(s: unknown): boolean {
  return isVitalsUri(s);
}
