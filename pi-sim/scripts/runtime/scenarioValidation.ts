import type { TimelineEntry, Checkpoint, NumericField } from "../types.js";
import type { ProviderEncounterContext, PublicContextValue, VitalScalars } from "./provider.js";
import type { ScriptedScenario, ScriptedWaypoint } from "./scriptedProvider.js";
import type { PulseScenario } from "./pulseScenario.js";

const VALID_PULSE_PURPOSES = new Set(["stable-observation", "compatibility-reference"]);

export function parseScenarioJson(text: string, path: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`scenario ${path} is not valid JSON: ${message}`);
  }
}

export function validateScriptedScenario(value: unknown, path: string): ScriptedScenario {
  const candidate = expectRecord(value, path, "scenario root");
  if (candidate.provider !== "scripted") throw new Error(`scenario ${path} is not a scripted M1 scenario`);

  const name = expectNonEmptyString(candidate.name, path, "name");
  const duration_s = expectNonNegativeFinite(candidate.duration_s, path, "duration_s");
  const initial = expectVitals(candidate.initial, path, "initial");
  const waypoints = expectArray(candidate.waypoints, path, "waypoints").map((entry, index) =>
    validateScriptedWaypoint(entry, path, `waypoints[${index}]`),
  );
  const scenario: ScriptedScenario = {
    name,
    provider: "scripted",
    duration_s,
    initial,
    waypoints,
  };
  const description = optionalString(candidate.description, path, "description");
  const timeline = candidate.timeline === undefined ? undefined : validateTimeline(candidate.timeline, path, "timeline");
  const encounter = candidate.encounter === undefined ? undefined : validateEncounter(candidate.encounter, path, "encounter");
  return {
    ...scenario,
    ...(description ? { description } : {}),
    ...(timeline ? { timeline } : {}),
    ...(encounter ? { encounter } : {}),
  };
}

export function validatePulseScenario(value: unknown, path: string): PulseScenario {
  const candidate = expectRecord(value, path, "scenario root");
  if (candidate.provider !== undefined && candidate.provider !== "pulse") {
    throw new Error(`scenario ${path} is not a Pulse scenario`);
  }
  const name = expectNonEmptyString(candidate.name, path, "name");
  const state_file = expectNonEmptyString(candidate.state_file, path, "state_file");
  const duration_s = expectNonNegativeFinite(candidate.duration_s, path, "duration_s");
  const description = optionalString(candidate.description, path, "description");
  const purpose = optionalString(candidate.purpose, path, "purpose");
  if (purpose !== undefined && !VALID_PULSE_PURPOSES.has(purpose)) {
    throw new Error(`scenario ${path} has unsupported purpose: ${purpose}`);
  }
  const state_bake = candidate.state_bake === undefined ? undefined : validateStateBake(candidate.state_bake, path);
  const timeline = validateTimeline(candidate.timeline ?? [], path, "timeline");
  const checkpoints = validateCheckpoints(candidate.checkpoints ?? [], path, "checkpoints");
  return {
    name,
    ...(description ? { description } : {}),
    provider: "pulse",
    ...(purpose ? { purpose: purpose as PulseScenario["purpose"] } : {}),
    state_file,
    ...(state_bake ? { state_bake } : {}),
    duration_s,
    timeline,
    checkpoints,
  };
}

export function validateTimeline(value: unknown, path: string, field = "timeline"): TimelineEntry[] {
  return expectArray(value, path, field)
    .map((entry, index) => validateTimelineEntry(entry, path, `${field}[${index}]`))
    .sort((a, b) => a.t - b.t);
}

function validateTimelineEntry(value: unknown, path: string, field: string): TimelineEntry {
  const entry = expectRecord(value, path, field);
  const t = expectNonNegativeFinite(entry.t, path, `${field}.t`);
  const action = expectRecord(entry.action, path, `${field}.action`);
  const type = expectNonEmptyString(action.type, path, `${field}.action.type`);
  const params = action.params === undefined ? {} : expectRecord(action.params, path, `${field}.action.params`);
  return { t, action: { type, params } };
}

function validateCheckpoints(value: unknown, path: string, field: string): Checkpoint[] {
  return expectArray(value, path, field).map((entry, index) => {
    const checkpoint = expectRecord(entry, path, `${field}[${index}]`);
    const t = expectNonNegativeFinite(checkpoint.t, path, `${field}[${index}].t`);
    const phase = optionalString(checkpoint.phase, path, `${field}[${index}].phase`);
    const expect = expectRecord(checkpoint.expect, path, `${field}[${index}].expect`);
    const normalizedExpect: Checkpoint["expect"] = {};
    for (const [vital, range] of Object.entries(expect)) {
      const bounds = expectArray(range, path, `${field}[${index}].expect.${vital}`);
      if (bounds.length !== 2) throw new Error(`scenario ${path} ${field}[${index}].expect.${vital} must be [low, high]`);
      const low = expectFinite(bounds[0], path, `${field}[${index}].expect.${vital}[0]`);
      const high = expectFinite(bounds[1], path, `${field}[${index}].expect.${vital}[1]`);
      if (low > high) throw new Error(`scenario ${path} ${field}[${index}].expect.${vital} low exceeds high`);
      normalizedExpect[vital as NumericField] = [low, high];
    }
    return { t, ...(phase ? { phase } : {}), expect: normalizedExpect };
  });
}

function validateScriptedWaypoint(value: unknown, path: string, field: string): ScriptedWaypoint {
  const waypoint = expectRecord(value, path, field);
  const t = expectNonNegativeFinite(waypoint.t, path, `${field}.t`);
  const phase = optionalString(waypoint.phase, path, `${field}.phase`);
  const vitals = expectVitals(waypoint.vitals, path, `${field}.vitals`);
  const events = waypoint.events === undefined ? undefined : expectStringArray(waypoint.events, path, `${field}.events`);
  return { t, ...(phase ? { phase } : {}), vitals, ...(events ? { events } : {}) };
}

function expectVitals(value: unknown, path: string, field: string): VitalScalars {
  const record = expectRecord(value, path, field);
  const vitals: VitalScalars = {};
  for (const [key, entry] of Object.entries(record)) {
    vitals[key as keyof VitalScalars] = expectFinite(entry, path, `${field}.${key}`);
  }
  return vitals;
}

function validateEncounter(value: unknown, path: string, field: string): ProviderEncounterContext {
  const encounter = expectRecord(value, path, field);
  const patientId = expectNonEmptyString(encounter.patientId, path, `${field}.patientId`);
  const encounterId = expectNonEmptyString(encounter.encounterId, path, `${field}.encounterId`);
  const visibleChartAsOf = expectNonEmptyString(encounter.visibleChartAsOf, path, `${field}.visibleChartAsOf`);
  const phase = optionalString(encounter.phase, path, `${field}.phase`);
  const display = encounter.display === undefined ? undefined : validateDisplay(encounter.display, path, `${field}.display`);
  return { patientId, encounterId, visibleChartAsOf, ...(phase ? { phase } : {}), ...(display ? { display } : {}) };
}

function validateDisplay(value: unknown, path: string, field: string): Record<string, PublicContextValue> {
  const record = expectRecord(value, path, field);
  const display: Record<string, PublicContextValue> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (["string", "number", "boolean"].includes(typeof entry) || entry === null) {
      display[key] = entry as PublicContextValue;
    } else {
      throw new Error(`scenario ${path} ${field}.${key} must be a public scalar context value`);
    }
  }
  return display;
}

function validateStateBake(value: unknown, path: string): { command: string } {
  const stateBake = expectRecord(value, path, "state_bake");
  return { command: expectNonEmptyString(stateBake.command, path, "state_bake.command") };
}

function expectRecord(value: unknown, path: string, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`scenario ${path} ${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectArray(value: unknown, path: string, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`scenario ${path} ${field} must be an array`);
  return value;
}

function expectStringArray(value: unknown, path: string, field: string): string[] {
  return expectArray(value, path, field).map((entry, index) => expectNonEmptyString(entry, path, `${field}[${index}]`));
}

function expectNonEmptyString(value: unknown, path: string, field: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`scenario ${path} ${field} must be a non-empty string`);
  return value;
}

function optionalString(value: unknown, path: string, field: string): string | undefined {
  if (value === undefined) return undefined;
  return expectNonEmptyString(value, path, field);
}

function expectNonNegativeFinite(value: unknown, path: string, field: string): number {
  const number = expectFinite(value, path, field);
  if (number < 0) throw new Error(`scenario ${path} ${field} must be non-negative`);
  return number;
}

function expectFinite(value: unknown, path: string, field: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`scenario ${path} ${field} must be a finite number`);
  return number;
}
