import { ADVISORY_BANNER_COPY } from "./agent-canvas-constants.js";
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

export function buildContextBundle(
  view: ChartViewId,
  input: Partial<Omit<ChartContextBundle, "view">> = {},
): ChartContextBundle {
  return {
    view,
    ...(input.mar ? { mar: { activeBlocks: input.mar.activeBlocks.map((block) => ({ ...block })) } } : {}),
    recentArtifacts: (input.recentArtifacts ?? [{ kind: "clinical-note", id: "sbar-draft", sourceRefs: [] }]).map((artifact) => ({
      ...artifact,
      sourceRefs: [...artifact.sourceRefs],
    })),
    requiresReview: [...(input.requiresReview ?? [])],
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
    const sourceRefs = sourceRefsFromBundle(request.contextBundle);
    return {
      kind: "draft",
      suggestedDrafts: [
        {
          kind: "clinical-note",
          body: "Draft suggestion: update next-shift handoff with respiratory reassessment status after source-data verification.",
          sourceRefs,
        },
      ],
    };
  }

  return {
    kind: "advisory",
    banner: `${ADVISORY_BANNER_COPY} I can organize source context, propose drafts, or answer clarification questions, but I cannot create chart truth.`,
  };
}

function sourceRefsFromBundle(bundle: ChartContextBundle): string[] {
  return [...new Set(bundle.recentArtifacts.flatMap((artifact) => artifact.sourceRefs))];
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
