import { resolveAsOfMs } from "../src/views/active.js";
import { currentState, memoryProof, narrative, openLoops, trend } from "../src/views/index.js";
import { chartViews } from "./agent-canvas-view-catalog.js";
import type { PatientScope, TrendPoint } from "../src/types.js";
import type { ChartContextBundle, ChartViewId } from "./agent-canvas-types.js";

export type AgentCanvasContextParams = {
  chartRoot: string;
  patientId: string;
  encounterId?: string;
  asOf?: string;
  trendMetrics?: readonly string[];
  trendFrom?: string;
};

export type AgentCanvasVitalSummary = {
  value?: unknown;
  unit?: string;
  sample_key?: string;
  context?: Record<string, unknown>;
};

export type AgentCanvasClinicalData = {
  latestVitals: Record<string, AgentCanvasVitalSummary>;
  trends: Record<string, { value?: unknown; sample_key?: string }[]>;
  openLoop: {
    title: string;
    detail: string;
    meta: string;
    dueDeltaMinutes?: number;
  };
  handoffExcerpt: string;
  evidenceRefs: string[];
};

export type AgentCanvasContext = {
  generatedAt: string;
  patientId: string;
  encounterId?: string;
  asOf: string;
  sourceViewRefs: string[];
  views: { id: ChartViewId; density: "narrative" | "grid"; bundle: ChartContextBundle }[];
  clinical: AgentCanvasClinicalData;
};

const DEFAULT_TREND_METRICS = ["spo2", "heart_rate", "respiratory_rate"] as const;

export async function buildAgentCanvasContext(
  params: AgentCanvasContextParams,
): Promise<AgentCanvasContext> {
  const scope: PatientScope = { chartRoot: params.chartRoot, patientId: params.patientId };
  const asOfMs = await resolveAsOfMs(scope, params.asOf);
  const asOf = new Date(asOfMs).toISOString();
  const trendFrom = params.trendFrom ?? new Date(startOfUtcDay(asOfMs)).toISOString();
  const trendMetrics = [...(params.trendMetrics ?? DEFAULT_TREND_METRICS)];

  const [state, loops, notes, proof, trendEntries] = await Promise.all([
    currentState({ scope, axis: "vitals", asOf, encounterId: params.encounterId }),
    openLoops({ scope, asOf, encounterId: params.encounterId }),
    narrative({ scope, to: asOf, encounterId: params.encounterId }),
    memoryProof({ scope, asOf, encounterId: params.encounterId }),
    Promise.all(
      trendMetrics.map(async (metric) => [
        metric,
        await trend({
          scope,
          metric,
          from: trendFrom,
          to: asOf,
          encounterId: params.encounterId,
        }),
      ] as const),
    ),
  ]);

  const latestVitals = state.axis === "vitals" ? simplifyVitals(state.items) : {};
  const trends = Object.fromEntries(
    trendEntries.map(([metric, points]) => [metric, simplifyTrend(points)]),
  );
  const firstLoop = loops.find((loop) => !("kind" in loop) || loop.kind !== "contested_claim");

  return {
    generatedAt: asOf,
    patientId: params.patientId,
    ...(params.encounterId ? { encounterId: params.encounterId } : {}),
    asOf,
    sourceViewRefs: [
      "currentState(axis=vitals,asOf)",
      "openLoops(asOf)",
      `trend(metric=${trendMetrics.join("|")})`,
      "narrative(to=asOf)",
      "memoryProof(asOf)",
    ],
    views: chartViews.map((view) => ({
      id: view.id,
      density: view.density,
      bundle: {
        view: view.id,
        recentArtifacts: [],
        requiresReview: [],
      },
    })),
    clinical: {
      latestVitals,
      trends,
      openLoop: summarizeOpenLoop(firstLoop),
      handoffExcerpt: summarizeHandoff(notes),
      evidenceRefs: proof.sections.evidence.map((evidence) => evidence.ref).slice(0, 5),
    },
  };
}

export function vitalSourceRef(
  encounterId: string | undefined,
  metric: string,
  vital: AgentCanvasVitalSummary | undefined,
): string {
  const encounterPart = encounterId ?? "unknown_encounter";
  const key = vital?.sample_key ? `#${vital.sample_key}` : "";
  return `vitals://${encounterPart}/${metric}${key}`;
}

function simplifyVitals(
  vitals: Record<string, TrendPoint>,
): Record<string, AgentCanvasVitalSummary> {
  return Object.fromEntries(
    Object.entries(vitals).map(([metric, point]) => [
      metric,
      {
        value: point.value,
        unit: point.unit,
        sample_key: point.sample_key,
        context: point.context as Record<string, unknown> | undefined,
      },
    ]),
  );
}

function simplifyTrend(points: TrendPoint[]): { value?: unknown; sample_key?: string }[] {
  return points.map((point) => ({ value: point.value, sample_key: point.sample_key }));
}

function summarizeOpenLoop(loop: Awaited<ReturnType<typeof openLoops>>[number] | undefined) {
  if (!loop) {
    return {
      title: "No active open loop",
      detail: "No currently visible open-loop intent for this chart context",
      meta: "none",
    };
  }
  const dueDeltaMinutes = typeof loop.dueDeltaMinutes === "number" ? loop.dueDeltaMinutes : undefined;
  const goal = typeof loop.intent?.data?.goal === "string" ? loop.intent.data.goal : "Active follow-up loop";
  const title = titleFromGoal(goal);
  const detail = detailFromLoop(loop, goal, loop.intent?.data?.contingencies);
  return {
    title,
    detail,
    meta: dueDeltaMinutes === undefined ? loop.state : dueDeltaMinutes > 0 ? `in ${dueDeltaMinutes}m` : "overdue",
    ...(dueDeltaMinutes !== undefined ? { dueDeltaMinutes } : {}),
  };
}

function summarizeHandoff(notes: Awaited<ReturnType<typeof narrative>>): string {
  const handoff = notes.find((note) => note.path.includes("handoff")) ?? notes[notes.length - 1];
  if (!handoff) return "No handoff note available for this chart context.";
  return handoff.body.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2).join(" ");
}

function titleFromGoal(goal: string): string {
  const lower = goal.toLowerCase();
  if (lower.includes("work of breathing") || lower.includes("oxygen")) return "Reassess oxygen response & WoB";
  if (goal.length <= 48) return goal;
  return `${goal.slice(0, 45).trim()}…`;
}

function detailFromLoop(
  loop: Awaited<ReturnType<typeof openLoops>>[number],
  goal: string,
  contingencies: unknown,
): string {
  const trigger = Array.isArray(contingencies)
    ? contingencies
      .map((item) => item && typeof item === "object" ? (item as { trigger?: unknown }).trigger : undefined)
      .find((value): value is string => typeof value === "string")
    : undefined;
  const escalation = trigger ? `Escalate if ${trigger.replaceAll("SpO2", "SpO₂")}` : goal.replaceAll("SpO2", "SpO₂");
  return [dueLabel(loop), loop.state.replaceAll("_", " "), escalation].filter(Boolean).join(" · ");
}

function dueLabel(loop: Awaited<ReturnType<typeof openLoops>>[number]): string | null {
  const dueBy = typeof loop.intent?.data?.due_by === "string" ? loop.intent.data.due_by : undefined;
  const dueTime = dueBy?.match(/T(\d{2}:\d{2})/)?.[1];
  if (dueTime) return `Due ${dueTime}`;
  if (typeof loop.dueDeltaMinutes !== "number") return null;
  return loop.dueDeltaMinutes > 0 ? `Due in ${loop.dueDeltaMinutes}m` : "Overdue";
}

function startOfUtcDay(ms: number): number {
  if (!Number.isFinite(ms)) return Number.NEGATIVE_INFINITY;
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
