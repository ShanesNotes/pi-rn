import { ADVISORY_BANNER_COPY } from "./agent-canvas-constants.js";
import { patient002ContextFixture } from "./agent-canvas-fixtures.js";
import type {
  AgentDockRequest,
  AgentDockResponse,
  BlockState,
  ChartContextBundle,
  ChartViewId,
} from "./agent-canvas-types.js";

const BANNED_TOOL_SEGMENTS = new Set([
  "set",
  "write",
  "mutate",
  "update",
  "delete",
  "create",
  "patch",
  "post",
]);

const ALLOWED_TOOL_PREFIXES = new Set([
  "get",
  "read",
  "describe",
  "list",
  "render",
  "connect",
]);

export function buildContextBundle(view: ChartViewId): ChartContextBundle {
  return {
    ...patient002ContextFixture,
    view,
    mar: patient002ContextFixture.mar
      ? { activeBlocks: patient002ContextFixture.mar.activeBlocks.map((block) => ({ ...block })) }
      : undefined,
    recentArtifacts: [
      ...patient002ContextFixture.recentArtifacts.map((artifact) => ({
        ...artifact,
        sourceRefs: [...artifact.sourceRefs],
      })),
      {
        kind: "clinical-note",
        id: "sbar-draft",
        sourceRefs: [],
      },
    ],
    requiresReview: [...patient002ContextFixture.requiresReview],
  };
}

export function deriveMarState(bundle: ChartContextBundle): BlockState {
  return (bundle.mar?.activeBlocks?.length ?? 0) > 0 ? "blocked" : "unblocked";
}

export function mockAgentRespond(request: AgentDockRequest): AgentDockResponse {
  if (request.intent === "administration" && request.marState === "blocked") {
    return {
      kind: "advisory",
      banner: `${ADVISORY_BANNER_COPY} Medication administration remains blocked until bedside scan and clinician attestation are complete.`,
    };
  }

  if (request.intent === "documentation") {
    return {
      kind: "draft",
      suggestedDrafts: [
        {
          kind: "clinical-note",
          body: "Draft suggestion: update next-shift handoff with 09:50 respiratory reassessment status after source-data verification.",
          sourceRefs: [
            "patient_002/timeline/2026-04-19/vitals.jsonl#0930",
            "patient_002/timeline/2026-04-19/notes/0930_handoff.md",
          ],
        },
      ],
    };
  }

  return {
    kind: "advisory",
    banner: `${ADVISORY_BANNER_COPY} I can organize source context, propose drafts, or answer clarification questions, but I cannot create chart truth.`,
  };
}

export function isToolAllowed(name: string): boolean {
  const segments = camelSegments(name);
  const first = segments[0];
  if (!first || !ALLOWED_TOOL_PREFIXES.has(first)) return false;
  return !segments.some((segment) => BANNED_TOOL_SEGMENTS.has(segment));
}

function camelSegments(name: string): string[] {
  return name
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/[_\-\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());
}
