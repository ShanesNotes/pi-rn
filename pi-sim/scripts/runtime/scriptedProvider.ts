import { assertPositiveFinite } from "./clock.js";
import type { PhysiologyProvider, ProviderAction, ProviderMetadata, ProviderSnapshot, VitalScalars } from "./provider.js";

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
