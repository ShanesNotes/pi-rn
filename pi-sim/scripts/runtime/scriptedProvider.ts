import { assertPositiveFinite } from "./clock.js";
import type {
  AssessmentRequest,
  PhysiologyProvider,
  ProviderAction,
  ProviderAssessmentResult,
  ProviderEncounterContext,
  ProviderMetadata,
  ProviderSnapshot,
  VitalScalars,
} from "./provider.js";
import type { TimelineEntry } from "../types.js";

export interface ScriptedWaypoint {
  readonly t: number;
  readonly phase?: string;
  readonly vitals: VitalScalars;
  readonly events?: string[];
}

export interface ScriptedScenario {
  readonly name: string;
  readonly description?: string;
  readonly duration_s: number;
  readonly provider: "scripted";
  readonly initial: VitalScalars;
  readonly waypoints: ScriptedWaypoint[];
  readonly timeline?: readonly TimelineEntry[];
  readonly encounter?: ProviderEncounterContext;
}

export class ScriptedProvider implements PhysiologyProvider {
  readonly metadata: ProviderMetadata = {
    name: "deterministic scripted scalar provider",
    source: "pi-sim-scripted",
    fidelity: "scripted-demo",
  };

  private readonly scenario: ScriptedScenario;
  private t = 0;
  private actionEvents: string[] = [];

  constructor(scenario: ScriptedScenario) {
    if (!Number.isFinite(scenario.duration_s) || scenario.duration_s < 0) {
      throw new Error(`invalid scripted scenario duration: ${scenario.duration_s}`);
    }
    this.scenario = normalizeScenario(scenario);
  }

  init(): ProviderSnapshot {
    this.t = 0;
    this.actionEvents = [];
    return this.snapshot();
  }

  advance(dtSeconds: number): ProviderSnapshot {
    assertPositiveFinite(dtSeconds, "dtSeconds");
    this.t = Math.min(this.scenario.duration_s, this.t + dtSeconds);
    return this.snapshot();
  }

  applyAction(action: ProviderAction): ProviderSnapshot {
    this.actionEvents = [...this.actionEvents, `ACTION_${action.type.toUpperCase()}`];
    return this.snapshot();
  }

  snapshot(): ProviderSnapshot {
    const { before, after } = surroundingWaypoints(this.scenario, this.t);
    const ratio = after.t === before.t ? 0 : (this.t - before.t) / (after.t - before.t);
    const vitals = interpolateVitals(before.vitals, after.vitals, ratio);
    return {
      t: this.t,
      phase: after.phase ?? before.phase,
      vitals,
      events: [...(before.events ?? []), ...this.actionEvents],
    };
  }

  encounterContext(): ProviderEncounterContext | undefined {
    if (!this.scenario.encounter) return undefined;
    const snapshot = this.snapshot();
    return {
      patientId: this.scenario.encounter.patientId,
      encounterId: this.scenario.encounter.encounterId,
      visibleChartAsOf: this.scenario.encounter.visibleChartAsOf,
      phase: snapshot.phase ?? this.scenario.encounter.phase,
      display: this.scenario.encounter.display,
    };
  }

  assess(request: AssessmentRequest): ProviderAssessmentResult | undefined {
    const assessment = hiddenScriptedAssessmentFor(this.scenario.name, request);
    if (!assessment) return undefined;

    return {
      requestId: request.requestId,
      assessmentType: assessment.assessmentType,
      bodySystem: assessment.bodySystem ?? request.bodySystem,
      findings: assessment.findings.map((finding) => ({
        id: finding.id,
        label: finding.label,
        value: finding.value,
        severity: finding.severity,
        evidence: [
          { kind: "event", ref: `events.jsonl#requestId=${request.requestId}`, role: "primary" },
          { kind: "vitals_window", ref: `vitals://current?simTime_s=${this.t}`, role: "context" },
        ],
      })),
      summary: assessment.summary,
      evidence: [{ kind: "encounter", ref: this.scenario.encounter?.encounterId ?? "encounter/current.json", role: "context" }],
    };
  }
}

export function normalizeScenario(scenario: ScriptedScenario): ScriptedScenario {
  const start: ScriptedWaypoint = { t: 0, phase: "baseline", vitals: scenario.initial, events: [] };
  const byTime = [start, ...scenario.waypoints]
    .filter((point) => Number.isFinite(point.t) && point.t >= 0)
    .sort((a, b) => a.t - b.t);
  const deduped: ScriptedWaypoint[] = [];
  for (const point of byTime) {
    if (deduped.length > 0 && deduped[deduped.length - 1].t === point.t) deduped.pop();
    deduped.push(point);
  }
  if (deduped.length === 0) deduped.push(start);
  return { ...scenario, waypoints: deduped };
}

function surroundingWaypoints(scenario: ScriptedScenario, t: number): { before: ScriptedWaypoint; after: ScriptedWaypoint } {
  const points = scenario.waypoints;
  let before = points[0];
  let after = points[points.length - 1];
  for (const point of points) {
    if (point.t <= t) before = point;
    if (point.t >= t) {
      after = point;
      break;
    }
  }
  return { before, after };
}

function interpolateVitals(a: VitalScalars, b: VitalScalars, ratio: number): VitalScalars {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as (keyof VitalScalars)[]);
  const out: VitalScalars = {};
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (av === undefined && bv === undefined) continue;
    if (av === undefined) out[key] = bv;
    else if (bv === undefined) out[key] = av;
    else out[key] = round(av + (bv - av) * ratio);
  }
  return out;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

interface HiddenScriptedAssessment {
  readonly requestId?: string;
  readonly assessmentType: string;
  readonly bodySystem?: string;
  readonly findings: readonly HiddenScriptedFinding[];
  readonly summary?: string;
}

interface HiddenScriptedFinding {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly severity?: string;
}

const BUILTIN_SCRIPTED_ASSESSMENTS: Record<string, readonly HiddenScriptedAssessment[]> = {
  scripted_m1_demo: [
    {
      assessmentType: "focused_respiratory",
      bodySystem: "respiratory",
      findings: [
        {
          id: "finding_demo_work_of_breathing",
          label: "work of breathing",
          value: "mildly increased",
          severity: "mild",
        },
      ],
      summary: "Mildly increased work of breathing with stable oxygenation.",
    },
  ],
};

function hiddenScriptedAssessmentFor(scenarioName: string, request: AssessmentRequest): HiddenScriptedAssessment | undefined {
  return BUILTIN_SCRIPTED_ASSESSMENTS[scenarioName]?.find((candidate) => {
    const requestMatches = candidate.requestId === undefined || candidate.requestId === request.requestId;
    const typeMatches = candidate.assessmentType === request.assessmentType;
    const bodyMatches = candidate.bodySystem === undefined || candidate.bodySystem === request.bodySystem;
    return requestMatches && typeMatches && bodyMatches;
  });
}
